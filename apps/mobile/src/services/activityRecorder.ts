import { api } from './api';
import {
  LocationPoint,
  startLocationTracking,
  stopLocationTracking,
  calculateDistance,
} from './location';

export type ActivityType = 'run' | 'ride' | 'walk';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  activityType: ActivityType;
  startedAt: string | null;
  elapsedSeconds: number;
  distanceMeters: number;
  route: LocationPoint[];
  currentPace: number;
}

const initialState: RecordingState = {
  isRecording: false,
  isPaused: false,
  activityType: 'run',
  startedAt: null,
  elapsedSeconds: 0,
  distanceMeters: 0,
  route: [],
  currentPace: 0,
};

let state: RecordingState = { ...initialState };
let timerInterval: ReturnType<typeof setInterval> | null = null;
let listeners: Array<(s: RecordingState) => void> = [];

function notify(): void {
  for (const fn of listeners) fn({ ...state });
}

export function subscribe(fn: (s: RecordingState) => void): () => void {
  listeners.push(fn);
  fn({ ...state });
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function getRecordingState(): RecordingState {
  return { ...state };
}

export function startRecording(type: ActivityType): void {
  state = {
    ...initialState,
    isRecording: true,
    activityType: type,
    startedAt: new Date().toISOString(),
  };

  timerInterval = setInterval(() => {
    if (!state.isPaused) {
      state.elapsedSeconds += 1;
      notify();
    }
  }, 1000);

  startLocationTracking((point) => {
    if (state.isPaused) return;

    state.route.push(point);

    if (state.route.length >= 2) {
      state.distanceMeters = calculateDistance(state.route);
    }

    if (state.distanceMeters > 0 && state.elapsedSeconds > 0) {
      state.currentPace = state.elapsedSeconds / (state.distanceMeters / 1000);
    }

    notify();
  });

  notify();
}

export function pauseRecording(): void {
  state.isPaused = true;
  notify();
}

export function resumeRecording(): void {
  state.isPaused = false;
  notify();
}

export function stopRecording(): RecordingState {
  const finalState = { ...state, isRecording: false };

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  stopLocationTracking();

  state = { ...initialState };
  notify();

  return finalState;
}

export async function saveActivity(recording: RecordingState, title: string): Promise<{ id: string }> {
  const route = recording.route.map((pt, i) => ({
    latitude: pt.latitude,
    longitude: pt.longitude,
    altitude: pt.altitude,
    timestamp: pt.timestamp,
    seq: i,
  }));

  const avgPace =
    recording.distanceMeters > 0
      ? recording.elapsedSeconds / (recording.distanceMeters / 1000)
      : 0;

  return api.createActivity({
    type: recording.activityType,
    title,
    distance_m: recording.distanceMeters,
    duration_s: recording.elapsedSeconds,
    elevation_m: calculateElevationGain(recording.route),
    avg_pace: avgPace,
    started_at: recording.startedAt!,
    finished_at: new Date().toISOString(),
    route,
  });
}

function calculateElevationGain(points: LocationPoint[]): number {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].altitude;
    const curr = points[i].altitude;
    if (prev != null && curr != null && curr > prev) {
      gain += curr - prev;
    }
  }
  return gain;
}
