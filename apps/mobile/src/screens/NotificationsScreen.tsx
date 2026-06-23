import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  like: 'heart',
  comment: 'chatbubble',
  follow: 'person-add',
  achievement: 'trophy',
};

const TYPE_COLORS: Record<string, string> = {
  like: '#EF4444',
  comment: '#2563EB',
  follow: '#10B981',
  achievement: '#F59E0B',
};

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    loadNotifications();
    api.markNotificationsRead();
  }, []);

  async function loadNotifications() {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // silently fail
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id as string}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.unread]}
            onPress={() => {
              if (item.activity_id) navigation.navigate('ActivityDetail', { activityId: item.activity_id as string });
              else if (item.from_user_id) navigation.navigate('UserProfile', { userId: item.from_user_id as string });
            }}
          >
            <Ionicons
              name={TYPE_ICONS[item.type as string] || 'notifications'}
              size={24}
              color={TYPE_COLORS[item.type as string] || '#6B7280'}
            />
            <View style={styles.content}>
              <Text style={styles.message}>{item.message as string}</Text>
              <Text style={styles.time}>{new Date(item.created_at as string).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: {
    flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', alignItems: 'center', gap: 12,
  },
  unread: { backgroundColor: '#EFF6FF' },
  content: { flex: 1 },
  message: { fontSize: 14, color: '#111827' },
  time: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 8 },
});
