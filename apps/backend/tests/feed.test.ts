import request from 'supertest';
import app from '../src/app';
import { closeDb } from '../src/db';

afterAll(() => closeDb());

describe('Feed API', () => {
  let userAToken: string;
  let userBToken: string;
  let userBId: string;

  beforeAll(async () => {
    const a = await request(app).post('/api/auth/register').send({
      email: 'feed-a@example.com',
      password: 'password123',
      display_name: 'User A',
    });
    userAToken = a.body.token;

    const b = await request(app).post('/api/auth/register').send({
      email: 'feed-b@example.com',
      password: 'password123',
      display_name: 'User B',
    });
    userBToken = b.body.token;
    userBId = b.body.user.id;

    // User B creates an activity
    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        type: 'ride',
        title: 'Evening Ride',
        distance_m: 15000,
        duration_s: 3600,
        started_at: '2024-01-01T18:00:00Z',
      });
  });

  it('GET /api/feed - empty before following', async () => {
    const res = await request(app)
      .get('/api/feed')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/feed - shows followed user activities', async () => {
    // Follow user B
    await request(app)
      .post(`/api/social/follow/${userBId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    const res = await request(app)
      .get('/api/feed')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].display_name).toBe('User B');
    expect(res.body[0].like_count).toBeDefined();
  });
});
