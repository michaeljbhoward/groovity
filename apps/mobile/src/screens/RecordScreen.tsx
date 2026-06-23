import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  startRecording, stopRecording, pauseRecording, resumeRecording,
  saveActivity, subscribe, ActivityType, RecordingState,
} from '../services/activityRecorder';
import { requestLocationPermission } from '../services/location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'run', label: 'Run', icon: 'walk' },
  { type: 'ride', label: 'Ride', icon: 'bicycle' },
  { type: 'walk', label: 'Walk', icon: 'footsteps' },
];

export function RecordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [recording, setRecording] = useState<RecordingState | null>(null);
  const [selectedType, setSelectedType] = useState<ActivityType>('run');

  useEffect(() => {
    return subscribe(setRecording);
  }, []);

  async function handleStart() {
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert('Permission Required', 'Location permission is needed to track activities.');
      return;
    }
    startRecording(selectedType);
  }

  async function handleStop() {
    const result = stopRecording();
    if (result.elapsedSeconds < 5) {
      Alert.alert('Too Short', 'Activity was too short to save.');
      return;
    }

    const title = `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} - ${formatDuration(result.elapsedSeconds)}`;

    try {
      const saved = await saveActivity(result, title);
      navigation.navigate('ActivitySummary', { activityId: saved.id });
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Could not save activity');
    }
  }

  const isActive = recording?.isRecording;

  return (
    <SafeAreaView style={styles.container}>
      {!isActive ? (
        <View style={styles.startView}>
          <Text style={styles.heading}>Start Activity</Text>

          <View style={styles.typeSelector}>
            {ACTIVITY_TYPES.map(({ type, label, icon }) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, selectedType === type && styles.typeButtonActive]}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons name={icon} size={28} color={selectedType === type ? '#FFF' : '#6B7280'} />
                <Text style={[styles.typeLabel, selectedType === type && styles.typeLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Ionicons name="play" size={32} color="#FFF" />
            <Text style={styles.startButtonText}>START</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.recordingView}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color="#9CA3AF" />
            <Text style={styles.mapText}>GPS Route Recording</Text>
            <Text style={styles.mapPoints}>{recording?.route.length || 0} points captured</Text>
          </View>

          <View style={styles.statsRow}>
            <StatBox label="Duration" value={formatDuration(recording?.elapsedSeconds || 0)} />
            <StatBox label="Distance" value={formatDistance(recording?.distanceMeters || 0)} />
            <StatBox label="Pace" value={formatPace(recording?.currentPace || 0)} />
          </View>

          <View style={styles.controls}>
            {recording?.isPaused ? (
              <TouchableOpacity style={styles.controlBtn} onPress={resumeRecording}>
                <Ionicons name="play" size={28} color="#2563EB" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.controlBtn} onPress={pauseRecording}>
                <Ionicons name="pause" size={28} color="#F59E0B" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={handleStop}>
              <Ionicons name="stop" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
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

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatPace(secPerKm: number): string {
  if (secPerKm === 0) return '--:--';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  startView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 32 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 48 },
  typeButton: {
    alignItems: 'center', padding: 16, borderRadius: 16,
    backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E5E7EB', width: 90,
  },
  typeButtonActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  typeLabel: { fontSize: 14, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  typeLabelActive: { color: '#FFF' },
  startButton: {
    backgroundColor: '#10B981', width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center',
  },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginTop: 4 },
  recordingView: { flex: 1 },
  mapPlaceholder: {
    flex: 1, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', margin: 16, borderRadius: 16,
  },
  mapText: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  mapPoints: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#FFF' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 24 },
  controlBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF',
    borderWidth: 2, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
  },
  stopBtn: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
});
