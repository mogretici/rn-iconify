import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Mdi } from 'rn-iconify';

import TabNavigator from './TabNavigator';
import NavigationDemoScreen from '../screens/navigation-demo/NavigationDemoScreen';
import ThemeScreen from '../screens/theme/ThemeScreen';
import PerformanceScreen from '../screens/performance/PerformanceScreen';
import CacheScreen from '../screens/cache/CacheScreen';
import ConfigScreen from '../screens/config/ConfigScreen';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: any) {
  const isDark = useColorScheme() === 'dark';

  return (
    <DrawerContentScrollView {...props} style={isDark ? styles.drawerDark : styles.drawer}>
      <View style={styles.header}>
        <Mdi name="package-variant" size={48} color="#2196F3" />
        <Text style={[styles.title, isDark && styles.titleDark]}>rn-iconify</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Demo App</Text>
      </View>
      <View style={styles.divider} />
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
        },
        headerTintColor: isDark ? '#FFF' : '#000',
        drawerStyle: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFF',
        },
        drawerActiveTintColor: '#2196F3',
        drawerInactiveTintColor: isDark ? '#AAA' : '#666',
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          title: 'rn-iconify Demo',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Mdi name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="NavigationDemo"
        component={NavigationDemoScreen}
        options={{
          title: 'Navigation Integration',
          drawerLabel: 'Navigation',
          drawerIcon: ({ color, size }) => (
            <Mdi name="navigation" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Theme"
        component={ThemeScreen}
        options={{
          title: 'Theme Provider',
          drawerIcon: ({ color, size }) => (
            <Mdi name="palette" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Performance"
        component={PerformanceScreen}
        options={{
          title: 'Performance Monitoring',
          drawerIcon: ({ color, size }) => (
            <Mdi name="speedometer" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Cache"
        component={CacheScreen}
        options={{
          title: 'Cache Management',
          drawerIcon: ({ color, size }) => (
            <Mdi name="database" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          title: 'Configuration',
          drawerIcon: ({ color, size }) => (
            <Mdi name="cog" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: '#FFF',
  },
  drawerDark: {
    backgroundColor: '#1E1E1E',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  titleDark: {
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  subtitleDark: {
    color: '#AAA',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
});
