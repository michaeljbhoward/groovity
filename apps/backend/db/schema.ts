// TypeScript type definitions mirroring the SQLite schema

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: 'run' | 'ride' | 'walk';
  title: string;
  description: string;
  distance_m: number;
  duration_s: number;
  elevation_m: number;
  calories: number;
  avg_pace: number;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}

export interface RoutePoint {
  id: number;
  activity_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: string;
  seq: number;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Like {
  user_id: string;
  activity_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  activity_id: string;
  body: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'distance' | 'duration' | 'activities';
  target: number;
  period: 'weekly' | 'monthly';
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge: string;
  description: string;
  earned_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'achievement';
  from_user_id: string | null;
  activity_id: string | null;
  message: string;
  read: number;
  created_at: string;
}
