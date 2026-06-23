import request from 'supertest';
import app from '../src/app';
import { closeDb } from '../src/db';

afterAll(() => closeDb());

describe('Activities API', () => {
  let token: string;
  let activityId: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'activity-test@example.com',
      password: 'password123',
      display_name: 'Activity Tester',
    });
    token = res.body.token;
  });

  it('POST /api/activities - creates an activity with route', async () => {
    const route = [
      { latitude: 40.7128, longitude: -74.006, altitude: 10, timestamp: '2024-01-01T10:00:00Z', seq: 0 },
      { latitude: 40.7130, longitude: -74.005, altitude: 11, timestamp: '2024-01-01T10:01:00Z', seq: 1 },
      { latitude: 40.7135, longitude: -74.004, altitude: 12, timestamp: '2024-01-01T10:02:00Z', seq: 2 },
    ];

    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'run',
        title: 'Morning Run',
        description: 'A nice morning run',
        distance_m: 5000,
        duration_s: 1800,
        elevation_m: 50,
        calories: 350,
        avg_pace: 360,
        started_at: '2024-01-01T10:00:00Z',
        finished_at: '2024-01-01T10:30:00Z',
        route,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.type).toBe('run');
    expect(res.body.distance_m).toBe(5000);
    activityId = res.body.id;
  });

  it('POST /api/activities - validates required fields', async () => {
    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('GET /api/activities/:id - returns activity with route and social data', async () => {
    const res = await request(app)
      .get(`/api/activities/${activityId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(activityId);
    expect(res.body.route).toHaveLength(3);
    expect(res.body.route[0].latitude).toBe(40.7128);
    expect(res.body.like_count).toBe(0);
    expect(res.body.comments).toEqual([]);
  });

  it('GET /api/activities - lists user activities', async () => {
    const res = await request(app)
      .get('/api/activities')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('DELETE /api/activities/:id - deletes own activity', async () => {
    // Create a second activity to delete
    const create = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'walk',
        title: 'Short Walk',
        distance_m: 1000,
        duration_s: 600,
        started_at: '2024-01-02T08:00:00Z',
      });
    const deleteId = create.body.id;

    const res = await request(app)
      .delete(`/api/activities/${deleteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);

    const check = await request(app)
      .get(`/api/activities/${deleteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.status).toBe(404);
  });
});
