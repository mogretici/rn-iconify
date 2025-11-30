/**
 * rn-iconify Comprehensive Demo App
 * Demonstrates ALL package features with React Navigation
 */

import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { IconThemeProvider, enablePerformanceMonitoring } from 'rn-iconify';

import DrawerNavigator from './navigation/DrawerNavigator';

// Enable performance monitoring in development
if (__DEV__) {
  enablePerformanceMonitoring();
}

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E0E0E0',
    primary: '#2196F3',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    primary: '#64B5F6',
  },
};

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <IconThemeProvider
        theme={{
          size: 24,
          color: isDark ? '#FFFFFF' : '#000000',
          placeholder: 'shimmer',
          placeholderColor: isDark ? '#333333' : '#E0E0E0',
        }}
      >
        <NavigationContainer theme={isDark ? CustomDarkTheme : LightTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <DrawerNavigator />
        </NavigationContainer>
      </IconThemeProvider>
    </GestureHandlerRootView>
  );
}
