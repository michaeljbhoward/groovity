import request from 'supertest';
import app from '../src/app';
import { closeDb } from '../src/db';

afterAll(() => closeDb());

describe('Auth API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    display_name: 'Test User',
  };

  let token: string;

  it('POST /api/auth/register - creates a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.display_name).toBe(testUser.display_name);
    token = res.body.token;
  });

  it('POST /api/auth/register - rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/register - validates input', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/auth/login - authenticates valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('POST /api/auth/login - rejects invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrong',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me - returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });

  it('GET /api/auth/me - rejects unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('PUT /api/auth/me - updates profile', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ display_name: 'Updated Name', bio: 'Hello world' });
    expect(res.status).toBe(200);
    expect(res.body.display_name).toBe('Updated Name');
    expect(res.body.bio).toBe('Hello world');
  });
});
