import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { FeedCard } from '../components/FeedCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  activity_count: number;
  total_distance: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

export function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      const [u, acts] = await Promise.all([
        api.getUser(userId) as Promise<UserProfile>,
        api.getActivities(userId),
      ]);
      setProfile(u);
      setActivities(acts);
    } catch {
      Alert.alert('Error', 'Could not load profile');
    }
  }

  async function toggleFollow() {
    if (!profile) return;
    try {
      if (profile.is_following) {
        await api.unfollowUser(profile.id);
        setProfile({ ...profile, is_following: false, follower_count: profile.follower_count - 1 });
      } else {
        await api.followUser(profile.id);
        setProfile({ ...profile, is_following: true, follower_count: profile.follower_count + 1 });
      }
    } catch {
      Alert.alert('Error', 'Could not update follow status');
    }
  }

  if (!profile) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id as string}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#FFF" />
            </View>
            <Text style={styles.name}>{profile.display_name}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile.activity_count}</Text>
                <Text style={styles.statLabel}>Activities</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile.follower_count}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile.following_count}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.followBtn, profile.is_following && styles.followingBtn]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followText, profile.is_following && styles.followingText]}>
                {profile.is_following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Activities</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FeedCard
            activity={item}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id as string })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>No activities yet</Text></View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#FFF', marginBottom: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 12 },
  bio: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 32 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  followBtn: {
    marginTop: 16, paddingHorizontal: 32, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#2563EB',
  },
  followingBtn: { backgroundColor: '#E5E7EB' },
  followText: { color: '#FFF', fontWeight: '600' },
  followingText: { color: '#6B7280' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 24, alignSelf: 'flex-start' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
});
