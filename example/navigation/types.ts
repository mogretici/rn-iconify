import type { NavigatorScreenParams } from '@react-navigation/native';

// Tab Navigator params
export type TabParamList = {
  Home: undefined;
  Explorer: undefined;
  Animations: undefined;
  Accessibility: undefined;
  More: undefined;
};

// Drawer Navigator params
export type DrawerParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  NavigationDemo: undefined;
  Theme: undefined;
  Performance: undefined;
  Cache: undefined;
  Config: undefined;
};

// Root Navigator params (for type safety in screens)
export type RootParamList = DrawerParamList;
