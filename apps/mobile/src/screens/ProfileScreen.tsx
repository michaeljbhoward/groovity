import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { FeedCard } from '../components/FeedCard';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [acts, s] = await Promise.all([api.getActivities(), api.getStatsSummary()]);
      setActivities(acts);
      setStats(s);
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

  const allTime = (stats as Record<string, Record<string, number>> | null)?.all_time;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id as string}
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#FFF" />
              </View>
              <Text style={styles.name}>{user?.display_name}</Text>
              <Text style={styles.email}>{user?.email}</Text>

              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{allTime?.activity_count ?? 0}</Text>
                  <Text style={styles.quickStatLabel}>Activities</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>
                    {allTime ? ((allTime.total_distance || 0) / 1000).toFixed(1) : '0'}
                  </Text>
                  <Text style={styles.quickStatLabel}>km Total</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>My Activities</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FeedCard
            activity={item}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id as string })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No activities yet. Start recording!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  profileHeader: { alignItems: 'center', padding: 24, backgroundColor: '#FFF', marginBottom: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 12 },
  email: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  quickStats: { flexDirection: 'row', marginTop: 16, gap: 32 },
  quickStat: { alignItems: 'center' },
  quickStatValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  quickStatLabel: { fontSize: 12, color: '#6B7280' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 4 },
  logoutText: { color: '#EF4444', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', padding: 16, paddingBottom: 8 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
});
