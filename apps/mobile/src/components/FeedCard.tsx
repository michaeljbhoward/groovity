import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  activity: Record<string, unknown>;
  onPress?: () => void;
  onUserPress?: () => void;
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  run: 'walk',
  ride: 'bicycle',
  walk: 'footsteps',
};

export function FeedCard({ activity, onPress, onUserPress }: Props) {
  const distance = ((activity.distance_m as number) / 1000).toFixed(2);
  const duration = formatDuration(activity.duration_s as number);
  const type = activity.type as string;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userRow} onPress={onUserPress} disabled={!onUserPress}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color="#FFF" />
          </View>
          <View>
            <Text style={styles.userName}>{activity.display_name as string || 'You'}</Text>
            <Text style={styles.time}>{formatDate(activity.created_at as string)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.typeBadge}>
          <Ionicons name={TYPE_ICONS[type] || 'fitness'} size={16} color="#2563EB" />
          <Text style={styles.typeText}>{type}</Text>
        </View>
      </View>

      <Text style={styles.title}>{activity.title as string}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{distance}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{duration}</Text>
          <Text style={styles.statLabel}>time</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatPace(activity.avg_pace as number)}</Text>
          <Text style={styles.statLabel}>pace</Text>
        </View>
      </View>

      {(activity.like_count !== undefined || activity.comment_count !== undefined) && (
        <View style={styles.socialRow}>
          <View style={styles.socialItem}>
            <Ionicons
              name={activity.liked ? 'heart' : 'heart-outline'}
              size={16}
              color={activity.liked ? '#EF4444' : '#9CA3AF'}
            />
            <Text style={styles.socialCount}>{activity.like_count as number ?? 0}</Text>
          </View>
          <View style={styles.socialItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" />
            <Text style={styles.socialCount}>{activity.comment_count as number ?? 0}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
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
  if (!secPerKm || secPerKm === 0) return '--:--';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF', marginHorizontal: 12, marginVertical: 6,
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F3F4F6',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center',
  },
  userName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  time: { fontSize: 12, color: '#9CA3AF' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  typeText: { fontSize: 12, color: '#2563EB', fontWeight: '600', textTransform: 'capitalize' },
  title: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 12 },
  statsRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  divider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  socialRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 16 },
  socialItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  socialCount: { fontSize: 12, color: '#9CA3AF' },
});
