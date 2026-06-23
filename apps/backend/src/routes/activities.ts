import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';
import type { Activity, RoutePoint } from '../../db/schema';

const router = Router();

router.post(
  '/',
  requireAuth,
  body('type').isIn(['run', 'ride', 'walk']),
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('distance_m').isFloat({ min: 0 }),
  body('duration_s').isInt({ min: 0 }),
  body('started_at').isISO8601(),
  body('route').optional().isArray(),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const db = getDb();
    const id = uuid();
    const {
      type, title, description, distance_m, duration_s,
      elevation_m, calories, avg_pace, started_at, finished_at, route,
    } = req.body;

    db.prepare(`
      INSERT INTO activities (id, user_id, type, title, description, distance_m, duration_s,
        elevation_m, calories, avg_pace, started_at, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.userId, type, title, description || '',
      distance_m, duration_s, elevation_m || 0, calories || 0,
      avg_pace || 0, started_at, finished_at || null,
    );

    if (Array.isArray(route) && route.length > 0) {
      const insert = db.prepare(`
        INSERT INTO route_points (activity_id, latitude, longitude, altitude, timestamp, seq)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertMany = db.transaction((points: RoutePoint[]) => {
        for (const pt of points) {
          insert.run(id, pt.latitude, pt.longitude, pt.altitude || null, pt.timestamp, pt.seq);
        }
      });
      insertMany(route);
    }

    checkAchievements(req.user!.userId);

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
    res.status(201).json(activity);
  }
);

router.get('/:id', requireAuth, param('id').isUUID(), (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const db = getDb();
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as Activity | undefined;

  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  const route = db.prepare(
    'SELECT latitude, longitude, altitude, timestamp, seq FROM route_points WHERE activity_id = ? ORDER BY seq'
  ).all(req.params.id);

  const likeCount = (db.prepare(
    'SELECT COUNT(*) as count FROM likes WHERE activity_id = ?'
  ).get(req.params.id) as { count: number }).count;

  const comments = db.prepare(`
    SELECT c.id, c.body, c.created_at, u.id as user_id, u.display_name, u.avatar_url
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.activity_id = ? ORDER BY c.created_at
  `).all(req.params.id);

  const liked = db.prepare(
    'SELECT 1 FROM likes WHERE user_id = ? AND activity_id = ?'
  ).get(req.user!.userId, req.params.id);

  res.json({ ...activity, route, like_count: likeCount, liked: !!liked, comments });
});

router.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const userId = (req.query.user_id as string) || req.user!.userId;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  const activities = db.prepare(`
    SELECT a.*, u.display_name, u.avatar_url
    FROM activities a JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(userId, limit, offset);

  res.json(activities);
});

router.delete('/:id', requireAuth, param('id').isUUID(), (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const db = getDb();
  const activity = db.prepare('SELECT user_id FROM activities WHERE id = ?').get(req.params.id) as { user_id: string } | undefined;

  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }
  if (activity.user_id !== req.user!.userId) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

function checkAchievements(userId: string): void {
  const db = getDb();
  const count = (db.prepare(
    'SELECT COUNT(*) as count FROM activities WHERE user_id = ?'
  ).get(userId) as { count: number }).count;

  const milestones: Record<number, { badge: string; description: string }> = {
    1: { badge: 'first_activity', description: 'Completed your first activity!' },
    10: { badge: 'ten_activities', description: 'Completed 10 activities!' },
    50: { badge: 'fifty_activities', description: 'Completed 50 activities!' },
    100: { badge: 'century', description: 'Completed 100 activities!' },
  };

  const milestone = milestones[count];
  if (milestone) {
    const existing = db.prepare(
      'SELECT 1 FROM achievements WHERE user_id = ? AND badge = ?'
    ).get(userId, milestone.badge);

    if (!existing) {
      const id = uuid();
      db.prepare(
        'INSERT INTO achievements (id, user_id, badge, description) VALUES (?, ?, ?, ?)'
      ).run(id, userId, milestone.badge, milestone.description);

      const notifId = uuid();
      db.prepare(
        `INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, 'achievement', ?)`
      ).run(notifId, userId, milestone.description);
    }
  }
}

export default router;
