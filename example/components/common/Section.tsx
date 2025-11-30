import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  description?: string;
}

export default function Section({ title, children, description }: SectionProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      {description && (
        <Text style={[styles.description, isDark && styles.descriptionDark]}>
          {description}
        </Text>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  titleDark: {
    color: '#FFF',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  descriptionDark: {
    color: '#AAA',
  },
  content: {},
});
