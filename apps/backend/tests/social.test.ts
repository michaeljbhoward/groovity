import request from 'supertest';
import app from '../src/app';
import { closeDb } from '../src/db';

afterAll(() => closeDb());

describe('Social API', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let activityId: string;

  beforeAll(async () => {
    const a = await request(app).post('/api/auth/register').send({
      email: 'social-a@example.com',
      password: 'password123',
      display_name: 'Social A',
    });
    userAToken = a.body.token;
    userAId = a.body.user.id;

    const b = await request(app).post('/api/auth/register').send({
      email: 'social-b@example.com',
      password: 'password123',
      display_name: 'Social B',
    });
    userBToken = b.body.token;
    userBId = b.body.user.id;

    const act = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        type: 'run',
        title: 'Test Run',
        distance_m: 3000,
        duration_s: 900,
        started_at: '2024-01-01T07:00:00Z',
      });
    activityId = act.body.id;
  });

  describe('Follow', () => {
    it('follows a user', async () => {
      const res = await request(app)
        .post(`/api/social/follow/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(201);
    });

    it('rejects self-follow', async () => {
      const res = await request(app)
        .post(`/api/social/follow/${userAId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(400);
    });

    it('rejects duplicate follow', async () => {
      const res = await request(app)
        .post(`/api/social/follow/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(409);
    });

    it('lists followers', async () => {
      const res = await request(app)
        .get(`/api/social/followers/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].display_name).toBe('Social A');
    });

    it('unfollows a user', async () => {
      const res = await request(app)
        .delete(`/api/social/follow/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Like', () => {
    it('likes an activity', async () => {
      const res = await request(app)
        .post(`/api/social/like/${activityId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(201);
    });

    it('rejects duplicate like', async () => {
      const res = await request(app)
        .post(`/api/social/like/${activityId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(409);
    });

    it('unlikes an activity', async () => {
      const res = await request(app)
        .delete(`/api/social/like/${activityId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Comment', () => {
    it('adds a comment', async () => {
      const res = await request(app)
        .post(`/api/social/comment/${activityId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ body: 'Great run!' });
      expect(res.status).toBe(201);
      expect(res.body.body).toBe('Great run!');
    });

    it('validates comment body', async () => {
      const res = await request(app)
        .post(`/api/social/comment/${activityId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ body: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('Notifications', () => {
    it('returns notifications for social interactions', async () => {
      // Re-follow to generate notification
      await request(app)
        .post(`/api/social/follow/${userBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      const res = await request(app)
        .get('/api/stats/notifications')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('marks notifications as read', async () => {
      const res = await request(app)
        .put('/api/stats/notifications/read')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(200);
    });
  });
});
