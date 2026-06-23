const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    if (res.status === 204) return undefined as unknown as T;
    return res.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ token: string; user: { id: string; email: string; display_name: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    );
  }

  register(email: string, password: string, display_name: string) {
    return this.request<{ token: string; user: { id: string; email: string; display_name: string } }>(
      '/auth/register', { method: 'POST', body: JSON.stringify({ email, password, display_name }) }
    );
  }

  getMe() {
    return this.request<{ id: string; email: string; display_name: string; avatar_url?: string; bio?: string }>(
      '/auth/me'
    );
  }

  updateProfile(data: { display_name?: string; bio?: string; avatar_url?: string }) {
    return this.request('/auth/me', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Activities
  createActivity(data: {
    type: string;
    title: string;
    description?: string;
    distance_m: number;
    duration_s: number;
    elevation_m?: number;
    calories?: number;
    avg_pace?: number;
    started_at: string;
    finished_at?: string;
    route?: Array<{ latitude: number; longitude: number; altitude?: number; timestamp: string; seq: number }>;
  }) {
    return this.request<{ id: string }>('/activities', { method: 'POST', body: JSON.stringify(data) });
  }

  getActivity(id: string) {
    return this.request<{
      id: string; type: string; title: string; description: string;
      distance_m: number; duration_s: number; route: Array<{ latitude: number; longitude: number }>;
      like_count: number; liked: boolean; comments: Array<{ id: string; body: string; user_id: string; display_name: string }>;
    }>(`/activities/${id}`);
  }

  getActivities(userId?: string, limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (userId) params.set('user_id', userId);
    return this.request<Array<Record<string, unknown>>>(`/activities?${params}`);
  }

  deleteActivity(id: string) {
    return this.request(`/activities/${id}`, { method: 'DELETE' });
  }

  // Feed
  getFeed(limit = 20, offset = 0) {
    return this.request<Array<Record<string, unknown>>>(`/feed?limit=${limit}&offset=${offset}`);
  }

  // Social
  followUser(userId: string) {
    return this.request(`/social/follow/${userId}`, { method: 'POST' });
  }

  unfollowUser(userId: string) {
    return this.request(`/social/follow/${userId}`, { method: 'DELETE' });
  }

  likeActivity(activityId: string) {
    return this.request(`/social/like/${activityId}`, { method: 'POST' });
  }

  unlikeActivity(activityId: string) {
    return this.request(`/social/like/${activityId}`, { method: 'DELETE' });
  }

  commentOnActivity(activityId: string, body: string) {
    return this.request(`/social/comment/${activityId}`, { method: 'POST', body: JSON.stringify({ body }) });
  }

  getFollowers(userId: string) {
    return this.request<Array<{ id: string; display_name: string }>>(`/social/followers/${userId}`);
  }

  getFollowing(userId: string) {
    return this.request<Array<{ id: string; display_name: string }>>(`/social/following/${userId}`);
  }

  // Users
  searchUsers(query: string) {
    return this.request<Array<{ id: string; display_name: string }>>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  getUser(id: string) {
    return this.request<Record<string, unknown>>(`/users/${id}`);
  }

  // Stats
  getStatsSummary() {
    return this.request<Record<string, unknown>>('/stats/summary');
  }

  getGoals() {
    return this.request<Array<Record<string, unknown>>>('/stats/goals');
  }

  createGoal(data: { type: string; target: number; period: string }) {
    return this.request('/stats/goals', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteGoal(id: string) {
    return this.request(`/stats/goals/${id}`, { method: 'DELETE' });
  }

  getAchievements() {
    return this.request<Array<Record<string, unknown>>>('/stats/achievements');
  }

  getNotifications() {
    return this.request<Array<Record<string, unknown>>>('/stats/notifications');
  }

  markNotificationsRead() {
    return this.request('/stats/notifications/read', { method: 'PUT' });
  }
}

export const api = new ApiClient();
