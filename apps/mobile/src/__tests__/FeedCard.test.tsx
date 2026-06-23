import React from 'react';
import { render } from '@testing-library/react-native';
import { FeedCard } from '../components/FeedCard';

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const { View, Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => <View {...props}><Text>{name}</Text></View>,
  };
});

describe('FeedCard', () => {
  const mockActivity = {
    id: 'abc-123',
    type: 'run',
    title: 'Morning Run',
    display_name: 'John Doe',
    distance_m: 5000,
    duration_s: 1800,
    avg_pace: 360,
    like_count: 5,
    comment_count: 2,
    liked: false,
    created_at: new Date().toISOString(),
  };

  it('renders activity title', () => {
    const { getByText } = render(<FeedCard activity={mockActivity} />);
    expect(getByText('Morning Run')).toBeTruthy();
  });

  it('renders user display name', () => {
    const { getByText } = render(<FeedCard activity={mockActivity} />);
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('renders formatted distance', () => {
    const { getByText } = render(<FeedCard activity={mockActivity} />);
    expect(getByText('5.00')).toBeTruthy();
    expect(getByText('km')).toBeTruthy();
  });

  it('renders social counts', () => {
    const { getByText } = render(<FeedCard activity={mockActivity} />);
    expect(getByText('5')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('renders activity type badge', () => {
    const { getByText } = render(<FeedCard activity={mockActivity} />);
    expect(getByText('run')).toBeTruthy();
  });

  it('handles missing display name', () => {
    const activity = { ...mockActivity, display_name: undefined };
    const { getByText } = render(<FeedCard activity={activity} />);
    expect(getByText('You')).toBeTruthy();
  });
});
