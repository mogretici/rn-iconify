import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import {
  Mdi,
  createTabBarIcon,
  createDrawerIcon,
  createHeaderIcon,
  createBackIcon,
  createCloseIcon,
  createMenuIcon,
  useNavigationIcon,
} from 'rn-iconify';
import { Section } from '../../components/common';

export default function NavigationDemoScreen() {
  const isDark = useColorScheme() === 'dark';
  const [focused, setFocused] = useState(true);
  const { tabBarIcon, drawerIcon } = useNavigationIcon();

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Tab Bar Icons */}
      <Section
        title="Tab Bar Icons"
        description="createTabBarIcon(focused, unfocused)"
      >
        <View style={styles.focusToggle}>
          <Text style={[styles.toggleLabel, isDark && styles.toggleLabelDark]}>
            Focused: {focused ? 'Yes' : 'No'}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setFocused(!focused)}
          >
            <Text style={styles.toggleButtonText}>Toggle</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
          <View style={styles.tabItem}>
            {createTabBarIcon(['mdi:home', 'mdi:home-outline'])({
              focused,
              color: focused ? '#2196F3' : '#666',
              size: 24,
            })}
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              Home
            </Text>
          </View>
          <View style={styles.tabItem}>
            {createTabBarIcon('mdi:magnify')({
              focused: !focused,
              color: !focused ? '#2196F3' : '#666',
              size: 24,
            })}
            <Text style={[styles.tabLabel, !focused && styles.tabLabelActive]}>
              Search
            </Text>
          </View>
          <View style={styles.tabItem}>
            {createTabBarIcon(['mdi:heart', 'mdi:heart-outline'])({
              focused: false,
              color: '#666',
              size: 24,
            })}
            <Text style={styles.tabLabel}>Favorites</Text>
          </View>
          <View style={styles.tabItem}>
            {createTabBarIcon(['mdi:account', 'mdi:account-outline'])({
              focused: false,
              color: '#666',
              size: 24,
            })}
            <Text style={styles.tabLabel}>Profile</Text>
          </View>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import { createTabBarIcon } from 'rn-iconify';

<Tab.Screen
  name="Home"
  options={{
    tabBarIcon: createTabBarIcon(
      'mdi:home',        // focused
      'mdi:home-outline' // unfocused
    ),
  }}
/>`}
          </Text>
        </View>
      </Section>

      {/* Drawer Icons */}
      <Section
        title="Drawer Icons"
        description="createDrawerIcon(icon, focusedIcon)"
      >
        <View style={[styles.drawerDemo, isDark && styles.drawerDemoDark]}>
          <View style={styles.drawerItem}>
            {createDrawerIcon('mdi:home')({
              focused: true,
              color: '#2196F3',
              size: 24,
            })}
            <Text style={[styles.drawerLabel, styles.drawerLabelActive]}>
              Home
            </Text>
          </View>
          <View style={styles.drawerItem}>
            {createDrawerIcon('mdi:cog')({
              focused: false,
              color: '#666',
              size: 24,
            })}
            <Text style={styles.drawerLabel}>Settings</Text>
          </View>
          <View style={styles.drawerItem}>
            {createDrawerIcon('mdi:information')({
              focused: false,
              color: '#666',
              size: 24,
            })}
            <Text style={styles.drawerLabel}>About</Text>
          </View>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`<Drawer.Screen
  name="Settings"
  options={{
    drawerIcon: createDrawerIcon('mdi:cog'),
  }}
/>`}
          </Text>
        </View>
      </Section>

      {/* Header Icons */}
      <Section
        title="Header Icons"
        description="createHeaderIcon, createBackIcon, createCloseIcon, createMenuIcon"
      >
        <View style={[styles.headerDemo, isDark && styles.headerDemoDark]}>
          <View style={styles.headerLeft}>
            {createBackIcon({
              onPress: () => console.log('Back pressed'),
            })({ tintColor: isDark ? '#FFF' : '#000' })}
          </View>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Screen Title
          </Text>
          <View style={styles.headerRight}>
            {createHeaderIcon({
              icon: 'mdi:magnify',
              onPress: () => console.log('Search'),
            })({ tintColor: isDark ? '#FFF' : '#000' })}
            {createHeaderIcon({
              icon: 'mdi:dots-vertical',
              onPress: () => console.log('Menu'),
            })({ tintColor: isDark ? '#FFF' : '#000' })}
          </View>
        </View>

        <Text style={[styles.subTitle, isDark && styles.subTitleDark]}>
          Built-in header icons:
        </Text>
        <View style={styles.headerIconsRow}>
          <View style={styles.headerIconItem}>
            {createBackIcon({ onPress: () => {} })({ tintColor: isDark ? '#FFF' : '#333' })}
            <Text style={[styles.iconLabel, isDark && styles.iconLabelDark]}>Back</Text>
          </View>
          <View style={styles.headerIconItem}>
            {createCloseIcon({ onPress: () => {} })({ tintColor: isDark ? '#FFF' : '#333' })}
            <Text style={[styles.iconLabel, isDark && styles.iconLabelDark]}>Close</Text>
          </View>
          <View style={styles.headerIconItem}>
            {createMenuIcon({ onPress: () => {} })({ tintColor: isDark ? '#FFF' : '#333' })}
            <Text style={[styles.iconLabel, isDark && styles.iconLabelDark]}>Menu</Text>
          </View>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import { createHeaderIcon, createBackIcon } from 'rn-iconify';

<Stack.Screen
  options={{
    headerLeft: createBackIcon({
      onPress: () => navigation.goBack(),
    }),
    headerRight: createHeaderIcon({
      icon: 'mdi:dots-vertical',
      onPress: () => openMenu(),
    }),
  }}
/>`}
          </Text>
        </View>
      </Section>

      {/* useNavigationIcon Hook */}
      <Section
        title="useNavigationIcon Hook"
        description="Alternative hook-based approach"
      >
        <View style={[styles.hookDemo, isDark && styles.hookDemoDark]}>
          <View style={styles.hookDemoRow}>
            <Text style={[styles.hookLabel, isDark && styles.hookLabelDark]}>
              tabBarIcon():
            </Text>
            {tabBarIcon('mdi:home', 'mdi:home-outline')({
              focused: true,
              color: '#2196F3',
              size: 28,
            })}
          </View>
          <View style={styles.hookDemoRow}>
            <Text style={[styles.hookLabel, isDark && styles.hookLabelDark]}>
              drawerIcon():
            </Text>
            {drawerIcon('mdi:cog')({
              focused: false,
              color: '#666',
              size: 28,
            })}
          </View>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import { useNavigationIcon } from 'rn-iconify';

function MyTabs() {
  const { tabBarIcon, drawerIcon } = useNavigationIcon();

  return (
    <Tab.Screen
      options={{
        tabBarIcon: tabBarIcon('mdi:home', 'mdi:home-outline'),
      }}
    />
  );
}`}
          </Text>
        </View>
      </Section>

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
  focusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
  },
  toggleLabelDark: {
    color: '#FFF',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBarDark: {
    backgroundColor: '#2A2A2A',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabLabelActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  drawerDemo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  drawerDemoDark: {
    backgroundColor: '#2A2A2A',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  drawerLabel: {
    fontSize: 16,
    color: '#666',
  },
  drawerLabelActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  headerDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerDemoDark: {
    backgroundColor: '#2A2A2A',
  },
  headerLeft: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
  },
  headerTitleDark: {
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  subTitleDark: {
    color: '#FFF',
  },
  headerIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  headerIconItem: {
    alignItems: 'center',
    gap: 8,
  },
  iconLabel: {
    fontSize: 12,
    color: '#666',
  },
  iconLabelDark: {
    color: '#AAA',
  },
  hookDemo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hookDemoDark: {
    backgroundColor: '#2A2A2A',
  },
  hookDemoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  hookLabel: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  hookLabelDark: {
    color: '#FFF',
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#D4D4D4',
  },
});
