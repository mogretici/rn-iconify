import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Icon } from 'rn-iconify';

interface IconButtonProps {
  icon: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function IconButton({
  icon,
  size = 24,
  color = '#333',
  backgroundColor = '#F0F0F0',
  onPress,
  style,
  disabled = false,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      activeOpacity={0.7}
    >
      <Icon name={`mdi:${icon}`} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
