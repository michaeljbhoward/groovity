import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivitySummary'>;

export function ActivitySummaryScreen({ route, navigation }: Props) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.getActivity(activityId).then(setActivity as (data: unknown) => void).catch(() => {
      Alert.alert('Error', 'Could not load summary');
    });
  }, [activityId]);

  if (!activity) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.card}>
        <Ionicons name="checkmark-circle" size={64} color="#10B981" />
        <Text style={styles.heading}>Activity Saved!</Text>
        <Text style={styles.title}>{activity.title as string}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{((activity.distance_m as number) / 1000).toFixed(2)}</Text>
            <Text style={styles.statUnit}>km</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(activity.duration_s as number)}</Text>
            <Text style={styles.statUnit}>time</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPace(activity.avg_pace as number)}</Text>
            <Text style={styles.statUnit}>pace</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailButton}
        onPress={() => navigation.replace('ActivityDetail', { activityId })}
      >
        <Text style={styles.detailButtonText}>View Details</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.navigate('Tabs')}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', padding: 24 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: '700', color: '#10B981', marginTop: 12 },
  title: { fontSize: 18, color: '#374151', marginTop: 8, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 24, alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#111827' },
  statUnit: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  detailButton: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  detailButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  doneButton: {
    borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  doneButtonText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
});
