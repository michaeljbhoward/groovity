import { calculateDistance } from '../services/location';

// Only test the pure utility function — location APIs require the native runtime
jest.mock('expo-location', () => ({}));

describe('Location utilities', () => {
  describe('calculateDistance (haversine)', () => {
    it('returns 0 for empty array', () => {
      expect(calculateDistance([])).toBe(0);
    });

    it('returns 0 for single point', () => {
      expect(calculateDistance([{ latitude: 40.7128, longitude: -74.006 }])).toBe(0);
    });

    it('calculates distance between two known points', () => {
      // NYC to Newark ~15 km
      const nyc = { latitude: 40.7128, longitude: -74.006 };
      const newark = { latitude: 40.7357, longitude: -74.1724 };
      const dist = calculateDistance([nyc, newark]);
      expect(dist).toBeGreaterThan(14000);
      expect(dist).toBeLessThan(16000);
    });

    it('accumulates distance across multiple points', () => {
      const points = [
        { latitude: 40.7128, longitude: -74.006 },
        { latitude: 40.7138, longitude: -74.005 },
        { latitude: 40.7148, longitude: -74.004 },
      ];
      const totalDist = calculateDistance(points);
      const segA = calculateDistance([points[0], points[1]]);
      const segB = calculateDistance([points[1], points[2]]);
      expect(Math.abs(totalDist - (segA + segB))).toBeLessThan(1);
    });

    it('returns same distance regardless of direction', () => {
      const a = { latitude: 40.7128, longitude: -74.006 };
      const b = { latitude: 40.7357, longitude: -74.1724 };
      const distAB = calculateDistance([a, b]);
      const distBA = calculateDistance([b, a]);
      expect(Math.abs(distAB - distBA)).toBeLessThan(1);
    });
  });
});
