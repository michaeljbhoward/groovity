import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/summary', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const userId = req.user!.userId;

  const allTime = db.prepare(`
    SELECT COUNT(*) as activity_count,
      COALESCE(SUM(distance_m), 0) as total_distance,
      COALESCE(SUM(duration_s), 0) as total_duration,
      COALESCE(SUM(calories), 0) as total_calories,
      COALESCE(SUM(elevation_m), 0) as total_elevation
    FROM activities WHERE user_id = ?
  `).get(userId);

  const thisWeek = db.prepare(`
    SELECT COUNT(*) as activity_count,
      COALESCE(SUM(distance_m), 0) as total_distance,
      COALESCE(SUM(duration_s), 0) as total_duration
    FROM activities
    WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
  `).get(userId);

  const thisMonth = db.prepare(`
    SELECT COUNT(*) as activity_count,
      COALESCE(SUM(distance_m), 0) as total_distance,
      COALESCE(SUM(duration_s), 0) as total_duration
    FROM activities
    WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
  `).get(userId);

  res.json({ all_time: allTime, this_week: thisWeek, this_month: thisMonth });
});

// Goals
router.get('/goals', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user!.userId) as Array<Record<string, unknown>>;

  const goalsWithProgress = goals.map((goal) => {
    const dateFilter = goal.period === 'weekly' ? '-7 days' : '-30 days';
    let current = 0;

    if (goal.type === 'distance') {
      const row = db.prepare(`
        SELECT COALESCE(SUM(distance_m), 0) as val FROM activities
        WHERE user_id = ? AND created_at >= datetime('now', ?)
      `).get(req.user!.userId, dateFilter) as { val: number };
      current = row.val;
    } else if (goal.type === 'duration') {
      const row = db.prepare(`
        SELECT COALESCE(SUM(duration_s), 0) as val FROM activities
        WHERE user_id = ? AND created_at >= datetime('now', ?)
      `).get(req.user!.userId, dateFilter) as { val: number };
      current = row.val;
    } else {
      const row = db.prepare(`
        SELECT COUNT(*) as val FROM activities
        WHERE user_id = ? AND created_at >= datetime('now', ?)
      `).get(req.user!.userId, dateFilter) as { val: number };
      current = row.val;
    }

    return { ...goal, current, progress: Math.min(current / (goal.target as number), 1) };
  });

  res.json(goalsWithProgress);
});

router.post(
  '/goals',
  requireAuth,
  body('type').isIn(['distance', 'duration', 'activities']),
  body('target').isFloat({ min: 1 }),
  body('period').isIn(['weekly', 'monthly']),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const db = getDb();
    const id = uuid();
    db.prepare('INSERT INTO goals (id, user_id, type, target, period) VALUES (?, ?, ?, ?, ?)').run(
      id, req.user!.userId, req.body.type, req.body.target, req.body.period
    );

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.status(201).json(goal);
  }
);

router.delete('/goals/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(
    req.params.id, req.user!.userId
  );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }
  res.status(204).send();
});

// Achievements
router.get('/achievements', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const achievements = db.prepare(
    'SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC'
  ).all(req.user!.userId);
  res.json(achievements);
});

// Notifications
router.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT n.*, u.display_name as from_display_name, u.avatar_url as from_avatar_url
    FROM notifications n LEFT JOIN users u ON n.from_user_id = u.id
    WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50
  `).all(req.user!.userId);
  res.json(notifications);
});

router.put('/notifications/read', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user!.userId);
  res.json({ message: 'All notifications marked as read' });
});

export default router;
