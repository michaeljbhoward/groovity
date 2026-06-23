import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import { signToken, requireAuth } from '../middleware/auth';
import type { User } from '../../db/schema';

const router = Router();

router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('display_name').trim().isLength({ min: 1, max: 50 }),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, display_name } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const id = uuid();
    const password_hash = bcrypt.hashSync(password, 10);

    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)`
    ).run(id, email, password_hash, display_name);

    const token = signToken({ userId: id, email });
    res.status(201).json({ token, user: { id, email, display_name } });
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, display_name: user.display_name },
    });
  }
);

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, email, display_name, avatar_url, bio, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId) as Omit<User, 'password_hash' | 'updated_at'> | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

router.put(
  '/me',
  requireAuth,
  body('display_name').optional().trim().isLength({ min: 1, max: 50 }),
  body('bio').optional().isLength({ max: 500 }),
  body('avatar_url').optional().isURL(),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const db = getDb();
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const key of ['display_name', 'bio', 'avatar_url'] as const) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(req.user!.userId);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare(
      'SELECT id, email, display_name, avatar_url, bio, created_at FROM users WHERE id = ?'
    ).get(req.user!.userId);
    res.json(user);
  }
);

export default router;
