import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const btnStyle = variant === 'secondary' ? styles.secondary
    : variant === 'danger' ? styles.danger
    : styles.primary;

  const textStyle = variant === 'secondary' ? styles.secondaryText
    : styles.primaryText;

  return (
    <TouchableOpacity
      style={[styles.base, btnStyle, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#2563EB' : '#FFF'} />
      ) : (
        <Text style={[styles.baseText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  danger: { backgroundColor: '#EF4444' },
  disabled: { opacity: 0.5 },
  baseText: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#FFF' },
  secondaryText: { color: '#2563EB' },
});
