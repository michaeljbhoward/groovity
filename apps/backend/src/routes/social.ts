import { Router, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Follow a user
router.post('/follow/:userId', requireAuth, param('userId').isUUID(), (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (req.params.userId === req.user!.userId) {
    res.status(400).json({ error: 'Cannot follow yourself' });
    return;
  }

  const db = getDb();
  const target = db.prepare('SELECT id, display_name FROM users WHERE id = ?').get(req.params.userId) as { id: string; display_name: string } | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const existing = db.prepare(
    'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
  ).get(req.user!.userId, req.params.userId);

  if (existing) {
    res.status(409).json({ error: 'Already following' });
    return;
  }

  db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(
    req.user!.userId, req.params.userId
  );

  const me = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user!.userId) as { display_name: string };
  const notifId = uuid();
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, from_user_id, message) VALUES (?, ?, 'follow', ?, ?)`
  ).run(notifId, req.params.userId, req.user!.userId, `${me.display_name} started following you`);

  res.status(201).json({ message: 'Followed' });
});

// Unfollow a user
router.delete('/follow/:userId', requireAuth, param('userId').isUUID(), (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
  ).run(req.user!.userId, req.params.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Not following this user' });
    return;
  }
  res.json({ message: 'Unfollowed' });
});

// Like an activity
router.post('/like/:activityId', requireAuth, param('activityId').isUUID(), (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const db = getDb();
  const activity = db.prepare('SELECT id, user_id FROM activities WHERE id = ?').get(req.params.activityId) as { id: string; user_id: string } | undefined;
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  const existing = db.prepare(
    'SELECT 1 FROM likes WHERE user_id = ? AND activity_id = ?'
  ).get(req.user!.userId, req.params.activityId);

  if (existing) {
    res.status(409).json({ error: 'Already liked' });
    return;
  }

  db.prepare('INSERT INTO likes (user_id, activity_id) VALUES (?, ?)').run(
    req.user!.userId, req.params.activityId
  );

  if (activity.user_id !== req.user!.userId) {
    const me = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user!.userId) as { display_name: string };
    const notifId = uuid();
    db.prepare(
      `INSERT INTO notifications (id, user_id, type, from_user_id, activity_id, message)
       VALUES (?, ?, 'like', ?, ?, ?)`
    ).run(notifId, activity.user_id, req.user!.userId, req.params.activityId,
      `${me.display_name} liked your activity`);
  }

  res.status(201).json({ message: 'Liked' });
});

// Unlike
router.delete('/like/:activityId', requireAuth, param('activityId').isUUID(), (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM likes WHERE user_id = ? AND activity_id = ?'
  ).run(req.user!.userId, req.params.activityId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Like not found' });
    return;
  }
  res.json({ message: 'Unliked' });
});

// Comment on an activity
router.post(
  '/comment/:activityId',
  requireAuth,
  param('activityId').isUUID(),
  body('body').trim().isLength({ min: 1, max: 1000 }),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const db = getDb();
    const activity = db.prepare('SELECT id, user_id FROM activities WHERE id = ?').get(req.params.activityId) as { id: string; user_id: string } | undefined;
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    const id = uuid();
    db.prepare(
      'INSERT INTO comments (id, user_id, activity_id, body) VALUES (?, ?, ?, ?)'
    ).run(id, req.user!.userId, req.params.activityId, req.body.body);

    if (activity.user_id !== req.user!.userId) {
      const me = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user!.userId) as { display_name: string };
      const notifId = uuid();
      db.prepare(
        `INSERT INTO notifications (id, user_id, type, from_user_id, activity_id, message)
         VALUES (?, ?, 'comment', ?, ?, ?)`
      ).run(notifId, activity.user_id, req.user!.userId, req.params.activityId,
        `${me.display_name} commented on your activity`);
    }

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.status(201).json(comment);
  }
);

// Get followers / following
router.get('/followers/:userId', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const followers = db.prepare(`
    SELECT u.id, u.display_name, u.avatar_url
    FROM follows f JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ?
  `).all(req.params.userId);
  res.json(followers);
});

router.get('/following/:userId', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const following = db.prepare(`
    SELECT u.id, u.display_name, u.avatar_url
    FROM follows f JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
  `).all(req.params.userId);
  res.json(following);
});

export default router;
