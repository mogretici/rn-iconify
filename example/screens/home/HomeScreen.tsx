import React from 'react';
import { ScrollView, View, Text, StyleSheet, useColorScheme, Animated } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Mdi, AnimatedIcon, getCacheStats } from 'rn-iconify';
import { Card } from '../../components/common';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const isDark = useColorScheme() === 'dark';
  const stats = getCacheStats();

  const navigateToTab = (tab: string) => {
    navigation.navigate(tab);
  };

  const navigateToDrawer = (screen: string) => {
    navigation.dispatch(DrawerActions.jumpTo(screen));
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <AnimatedIcon animate="pulse">
          <Mdi name="package-variant" size={80} color="#2196F3" />
        </AnimatedIcon>
        <Text style={[styles.title, isDark && styles.titleDark]}>rn-iconify</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          268,000+ icons for React Native
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsContainer, isDark && styles.statsContainerDark]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, isDark && styles.statValueDark]}>200+</Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Icon Sets</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, isDark && styles.statValueDark]}>268K+</Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Icons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, isDark && styles.statValueDark]}>{stats.memoryCount}</Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Cached</Text>
        </View>
      </View>

      {/* Feature Cards */}
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Explore Features
      </Text>

      <Card
        title="Icon Explorer"
        description="Search and preview 268,000+ icons"
        icon="magnify"
        iconColor="#2196F3"
        onPress={() => navigateToTab('Explorer')}
      />

      <Card
        title="Animations"
        description="Spin, pulse, bounce, shake & more"
        icon="animation-play"
        iconColor="#9C27B0"
        onPress={() => navigateToTab('Animations')}
      />

      <Card
        title="Navigation Integration"
        description="Tab bar, drawer & header icons"
        icon="navigation"
        iconColor="#4CAF50"
        onPress={() => navigateToDrawer('NavigationDemo')}
      />

      <Card
        title="Accessibility"
        description="High contrast, screen reader support"
        icon="human"
        iconColor="#FF9800"
        onPress={() => navigateToTab('Accessibility')}
      />

      <Card
        title="Theme Provider"
        description="Global defaults for all icons"
        icon="palette"
        iconColor="#E91E63"
        onPress={() => navigateToDrawer('Theme')}
      />

      <Card
        title="Performance Monitoring"
        description="Cache hit rates & load times"
        icon="speedometer"
        iconColor="#00BCD4"
        onPress={() => navigateToDrawer('Performance')}
      />

      <Card
        title="Cache Management"
        description="Prefetch, clear & offline bundles"
        icon="database"
        iconColor="#795548"
        onPress={() => navigateToDrawer('Cache')}
      />

      <Card
        title="Configuration"
        description="API, cache & performance settings"
        icon="cog"
        iconColor="#607D8B"
        onPress={() => navigateToDrawer('Config')}
      />

      {/* Quick Demo */}
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Popular Icon Sets
      </Text>

      <View style={[styles.iconShowcase, isDark && styles.iconShowcaseDark]}>
        <View style={styles.iconSetRow}>
          <Text style={[styles.iconSetLabel, isDark && styles.iconSetLabelDark]}>MDI</Text>
          <View style={styles.icons}>
            <Mdi name="home" size={28} color={isDark ? '#FFF' : '#333'} />
            <Mdi name="account" size={28} color={isDark ? '#FFF' : '#333'} />
            <Mdi name="cog" size={28} color={isDark ? '#FFF' : '#333'} />
            <Mdi name="bell" size={28} color={isDark ? '#FFF' : '#333'} />
            <Mdi name="heart" size={28} color="#E91E63" />
          </View>
        </View>
      </View>

      {/* Code Example */}
      <View style={styles.codeBlock}>
        <Text style={styles.code}>
{`import { Mdi } from 'rn-iconify';

<Mdi name="home" size={24} color="blue" />`}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
  },
  titleDark: {
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  subtitleDark: {
    color: '#AAA',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statValueDark: {
    color: '#64B5F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#AAA',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#FFF',
  },
  iconShowcase: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  iconShowcaseDark: {
    backgroundColor: '#1E1E1E',
  },
  iconSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSetLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  iconSetLabelDark: {
    color: '#AAA',
  },
  icons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#D4D4D4',
  },
});
