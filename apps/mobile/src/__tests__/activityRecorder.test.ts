import {
  getRecordingState,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  subscribe,
} from '../services/activityRecorder';

// Mock location services
jest.mock('../services/location', () => ({
  startLocationTracking: jest.fn(),
  stopLocationTracking: jest.fn(),
  calculateDistance: jest.fn().mockReturnValue(1000),
}));

// Mock API
jest.mock('../services/api', () => ({
  api: {
    createActivity: jest.fn().mockResolvedValue({ id: 'test-id' }),
  },
}));

describe('ActivityRecorder', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset state by stopping any active recording
    const state = getRecordingState();
    if (state.isRecording) stopRecording();
  });

  afterEach(() => {
    const state = getRecordingState();
    if (state.isRecording) stopRecording();
    jest.useRealTimers();
  });

  it('starts in idle state', () => {
    const state = getRecordingState();
    expect(state.isRecording).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.elapsedSeconds).toBe(0);
    expect(state.route).toEqual([]);
  });

  it('transitions to recording state on start', () => {
    startRecording('run');
    const state = getRecordingState();
    expect(state.isRecording).toBe(true);
    expect(state.activityType).toBe('run');
    expect(state.startedAt).toBeTruthy();
  });

  it('increments elapsed time while recording', () => {
    startRecording('walk');
    jest.advanceTimersByTime(5000);
    const state = getRecordingState();
    expect(state.elapsedSeconds).toBe(5);
  });

  it('pauses and resumes recording', () => {
    startRecording('ride');
    jest.advanceTimersByTime(3000);
    pauseRecording();
    expect(getRecordingState().isPaused).toBe(true);

    jest.advanceTimersByTime(5000);
    expect(getRecordingState().elapsedSeconds).toBe(3);

    resumeRecording();
    expect(getRecordingState().isPaused).toBe(false);

    jest.advanceTimersByTime(2000);
    expect(getRecordingState().elapsedSeconds).toBe(5);
  });

  it('stops recording and returns final state', () => {
    startRecording('run');
    jest.advanceTimersByTime(10000);
    const result = stopRecording();

    expect(result.isRecording).toBe(false);
    expect(result.elapsedSeconds).toBe(10);
    expect(result.activityType).toBe('run');

    const current = getRecordingState();
    expect(current.isRecording).toBe(false);
    expect(current.elapsedSeconds).toBe(0);
  });

  it('notifies subscribers on state changes', () => {
    const callback = jest.fn();
    const unsubscribe = subscribe(callback);

    expect(callback).toHaveBeenCalledTimes(1);

    startRecording('walk');
    expect(callback).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3);

    unsubscribe();
  });

  it('supports different activity types', () => {
    for (const type of ['run', 'ride', 'walk'] as const) {
      startRecording(type);
      expect(getRecordingState().activityType).toBe(type);
      stopRecording();
    }
  });
});
