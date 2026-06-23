import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export function StatsScreen() {
  const [stats, setStats] = useState<Record<string, Record<string, number>> | null>(null);
  const [goals, setGoals] = useState<Array<Record<string, unknown>>>([]);
  const [achievements, setAchievements] = useState<Array<Record<string, unknown>>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, g, a] = await Promise.all([
        api.getStatsSummary() as Promise<Record<string, Record<string, number>>>,
        api.getGoals(),
        api.getAchievements(),
      ]);
      setStats(s);
      setGoals(g);
      setAchievements(a);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function addSampleGoal() {
    try {
      await api.createGoal({ type: 'distance', target: 50000, period: 'weekly' });
      load();
    } catch (err) {
      Alert.alert('Error', 'Could not create goal');
    }
  }

  const week = stats?.this_week;
  const month = stats?.this_month;
  const allTime = stats?.all_time;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}>
        <Text style={styles.heading}>Stats</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statRow}>
            <StatCard label="Activities" value={String(week?.activity_count ?? 0)} icon="fitness-outline" />
            <StatCard label="Distance" value={`${((week?.total_distance ?? 0) / 1000).toFixed(1)} km`} icon="speedometer-outline" />
            <StatCard label="Time" value={formatHours(week?.total_duration ?? 0)} icon="time-outline" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statRow}>
            <StatCard label="Activities" value={String(month?.activity_count ?? 0)} icon="fitness-outline" />
            <StatCard label="Distance" value={`${((month?.total_distance ?? 0) / 1000).toFixed(1)} km`} icon="speedometer-outline" />
            <StatCard label="Time" value={formatHours(month?.total_duration ?? 0)} icon="time-outline" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Time</Text>
          <View style={styles.statRow}>
            <StatCard label="Activities" value={String(allTime?.activity_count ?? 0)} icon="fitness-outline" />
            <StatCard label="Distance" value={`${((allTime?.total_distance ?? 0) / 1000).toFixed(1)} km`} icon="speedometer-outline" />
            <StatCard label="Calories" value={String(allTime?.total_calories ?? 0)} icon="flame-outline" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity onPress={addSampleGoal}>
              <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>
          {goals.length === 0 ? (
            <Text style={styles.emptyText}>No goals set. Tap + to add one!</Text>
          ) : (
            goals.map((g) => (
              <View key={g.id as string} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalType}>{(g.type as string).toUpperCase()} ({g.period as string})</Text>
                  <Text style={styles.goalProgress}>{Math.round((g.progress as number) * 100)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min((g.progress as number) * 100, 100)}%` }]} />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.length === 0 ? (
            <Text style={styles.emptyText}>Complete activities to earn badges!</Text>
          ) : (
            achievements.map((a) => (
              <View key={a.id as string} style={styles.achievementCard}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <View style={styles.achievementText}>
                  <Text style={styles.achievementBadge}>{(a.badge as string).replace(/_/g, ' ').toUpperCase()}</Text>
                  <Text style={styles.achievementDesc}>{a.description as string}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color="#2563EB" />
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  );
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  heading: { fontSize: 28, fontWeight: '700', color: '#111827', padding: 16, paddingBottom: 0 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  statCardValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  statCardLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  goalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  goalType: { fontSize: 14, fontWeight: '600', color: '#111827' },
  goalProgress: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 8 },
  progressFill: { height: 6, backgroundColor: '#2563EB', borderRadius: 3 },
  achievementCard: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'center', gap: 12,
  },
  achievementText: { flex: 1 },
  achievementBadge: { fontSize: 14, fontWeight: '600', color: '#111827' },
  achievementDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
});
