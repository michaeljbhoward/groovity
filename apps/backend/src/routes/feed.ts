import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  const activities = db.prepare(`
    SELECT a.*, u.display_name, u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE activity_id = a.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE activity_id = a.id) as comment_count,
      EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND activity_id = a.id) as liked
    FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE a.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
    ) OR a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user!.userId, req.user!.userId, req.user!.userId, limit, offset);

  res.json(activities);
});

export default router;
