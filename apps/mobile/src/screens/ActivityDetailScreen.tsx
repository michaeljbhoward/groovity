import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>;

interface ActivityDetail {
  id: string;
  type: string;
  title: string;
  description: string;
  distance_m: number;
  duration_s: number;
  elevation_m: number;
  calories: number;
  avg_pace: number;
  started_at: string;
  display_name?: string;
  route: Array<{ latitude: number; longitude: number }>;
  like_count: number;
  liked: boolean;
  comments: Array<{ id: string; body: string; display_name: string; created_at: string }>;
}

export function ActivityDetailScreen({ route }: Props) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  async function loadActivity() {
    try {
      const data = await api.getActivity(activityId) as unknown as ActivityDetail;
      setActivity(data);
    } catch {
      Alert.alert('Error', 'Could not load activity');
    }
  }

  async function handleLike() {
    if (!activity) return;
    try {
      if (activity.liked) {
        await api.unlikeActivity(activity.id);
        setActivity({ ...activity, liked: false, like_count: activity.like_count - 1 });
      } else {
        await api.likeActivity(activity.id);
        setActivity({ ...activity, liked: true, like_count: activity.like_count + 1 });
      }
    } catch {
      Alert.alert('Error', 'Could not update like');
    }
  }

  async function handleComment() {
    if (!comment.trim() || !activity) return;
    try {
      await api.commentOnActivity(activity.id, comment.trim());
      setComment('');
      loadActivity();
    } catch {
      Alert.alert('Error', 'Could not add comment');
    }
  }

  if (!activity) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.meta}>
            {new Date(activity.started_at).toLocaleDateString()} {activity.display_name ? `by ${activity.display_name}` : ''}
          </Text>
        </View>

        {activity.route.length > 0 && (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={40} color="#9CA3AF" />
            <Text style={styles.mapText}>{activity.route.length} GPS points</Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatTile label="Distance" value={`${(activity.distance_m / 1000).toFixed(2)} km`} icon="speedometer-outline" />
          <StatTile label="Duration" value={formatDuration(activity.duration_s)} icon="time-outline" />
          <StatTile label="Pace" value={formatPace(activity.avg_pace)} icon="trending-up-outline" />
          <StatTile label="Elevation" value={`${Math.round(activity.elevation_m)} m`} icon="arrow-up-outline" />
          <StatTile label="Calories" value={`${activity.calories}`} icon="flame-outline" />
          <StatTile label="Type" value={activity.type} icon="fitness-outline" />
        </View>

        {activity.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>{activity.description}</Text>
          </View>
        ) : null}

        <View style={styles.socialBar}>
          <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
            <Ionicons name={activity.liked ? 'heart' : 'heart-outline'} size={24} color={activity.liked ? '#EF4444' : '#6B7280'} />
            <Text style={styles.likeCount}>{activity.like_count}</Text>
          </TouchableOpacity>
          <View style={styles.commentCount}>
            <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
            <Text style={styles.likeCount}>{activity.comments.length}</Text>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments</Text>
          {activity.comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{c.display_name}</Text>
              <Text style={styles.commentBody}>{c.body}</Text>
              <Text style={styles.commentTime}>{new Date(c.created_at).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.commentInput}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={comment}
          onChangeText={setComment}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity onPress={handleComment}>
          <Ionicons name="send" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={20} color="#2563EB" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPace(secPerKm: number): string {
  if (secPerKm === 0) return '--:--';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  mapPlaceholder: {
    height: 180, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  mapText: { color: '#6B7280', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8,
  },
  statTile: {
    width: '31%', backgroundColor: '#FFF', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  descriptionBox: { paddingHorizontal: 16, paddingBottom: 8 },
  description: { fontSize: 14, color: '#374151', lineHeight: 20 },
  socialBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 14, color: '#6B7280' },
  commentsSection: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  commentCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 8 },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: '#111827' },
  commentBody: { fontSize: 14, color: '#374151', marginTop: 2 },
  commentTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  commentInput: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, color: '#111827' },
});
