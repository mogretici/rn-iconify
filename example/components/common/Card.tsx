import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Icon } from 'rn-iconify';

interface CardProps {
  title: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export default function Card({
  title,
  description,
  icon,
  iconColor = '#2196F3',
  onPress,
  children,
}: CardProps) {
  const isDark = useColorScheme() === 'dark';

  const content = (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Icon name={`mdi:${icon}`} size={28} color={iconColor} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
        {description && (
          <Text style={[styles.description, isDark && styles.descriptionDark]}>
            {description}
          </Text>
        )}
      </View>
      {onPress && (
        <Icon name="mdi:chevron-right" size={24} color={isDark ? '#666' : '#CCC'} />
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  titleDark: {
    color: '#FFF',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  descriptionDark: {
    color: '#AAA',
  },
});
