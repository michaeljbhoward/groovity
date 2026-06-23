import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitTrack</Text>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  title: { fontSize: 32, fontWeight: '700', color: '#2563EB', marginBottom: 24 },
});
