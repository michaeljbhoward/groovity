import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/search', requireAuth, (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (q.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  const db = getDb();
  const users = db.prepare(`
    SELECT id, display_name, avatar_url, bio
    FROM users WHERE display_name LIKE ? AND id != ?
    LIMIT 20
  `).all(`%${q}%`, req.user!.userId);

  res.json(users);
});

router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, display_name, avatar_url, bio, created_at FROM users WHERE id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const stats = db.prepare(`
    SELECT COUNT(*) as activity_count,
      COALESCE(SUM(distance_m), 0) as total_distance,
      COALESCE(SUM(duration_s), 0) as total_duration
    FROM activities WHERE user_id = ?
  `).get(req.params.id) as { activity_count: number; total_distance: number; total_duration: number };

  const followerCount = (db.prepare(
    'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
  ).get(req.params.id) as { count: number }).count;

  const followingCount = (db.prepare(
    'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?'
  ).get(req.params.id) as { count: number }).count;

  const isFollowing = db.prepare(
    'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
  ).get(req.user!.userId, req.params.id);

  res.json({
    ...user,
    ...stats,
    follower_count: followerCount,
    following_count: followingCount,
    is_following: !!isFollowing,
  });
});

export default router;
