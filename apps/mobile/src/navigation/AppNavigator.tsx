import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FeedScreen } from '../screens/FeedScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { ActivitySummaryScreen } from '../screens/ActivitySummaryScreen';

export type RootTabParamList = {
  FeedTab: undefined;
  RecordTab: undefined;
  StatsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  ActivityDetail: { activityId: string };
  ActivitySummary: { activityId: string };
  Notifications: undefined;
  UserProfile: { userId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'FeedTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'RecordTab') iconName = focused ? 'play-circle' : 'play-circle-outline';
          else if (route.name === 'StatsTab') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      })}
    >
      <Tab.Screen name="FeedTab" component={FeedScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="RecordTab" component={RecordScreen} options={{ title: 'Record' }} />
      <Tab.Screen name="StatsTab" component={StatsScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: 'Activity' }} />
      <Stack.Screen name="ActivitySummary" component={ActivitySummaryScreen} options={{ title: 'Summary' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
