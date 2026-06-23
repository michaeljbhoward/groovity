import * as Location from 'expo-location';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: string;
  speed: number | null;
}

let watchSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;

  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

export async function getCurrentLocation(): Promise<LocationPoint | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude,
      timestamp: new Date(loc.timestamp).toISOString(),
      speed: loc.coords.speed,
    };
  } catch {
    return null;
  }
}

export function startLocationTracking(
  onLocation: (point: LocationPoint) => void,
  intervalMs = 3000,
): void {
  stopLocationTracking();

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalMs,
      distanceInterval: 5,
    },
    (loc) => {
      onLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        timestamp: new Date(loc.timestamp).toISOString(),
        speed: loc.coords.speed,
      });
    },
  ).then((sub) => {
    watchSubscription = sub;
  });
}

export function stopLocationTracking(): void {
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
}

export function calculateDistance(
  points: Array<{ latitude: number; longitude: number }>,
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1], points[i]);
  }
  return total;
}

function haversine(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
