import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { Mdi } from 'rn-iconify';

import HomeScreen from '../screens/home/HomeScreen';
import ExplorerScreen from '../screens/explorer/ExplorerScreen';
import AnimationsScreen from '../screens/animations/AnimationsScreen';
import AccessibilityScreen from '../screens/accessibility/AccessibilityScreen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

function MoreButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Mdi name="menu" size={24} color="#666" />
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Mdi name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Explorer"
        component={ExplorerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Mdi name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Animations"
        component={AnimationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Mdi name="animation-play" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Accessibility"
        component={AccessibilityScreen}
        options={{
          tabBarLabel: 'A11y',
          tabBarIcon: ({ color, size }) => (
            <Mdi name="human" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MorePlaceholder}
        options={{
          tabBarButton: () => <MoreButton />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(DrawerActions.openDrawer());
          },
        })}
      />
    </Tab.Navigator>
  );
}

// Placeholder component (never rendered)
function MorePlaceholder() {
  return null;
}
