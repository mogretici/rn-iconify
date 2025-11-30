/**
 * React Navigation Integration
 * Helpers for using rn-iconify with React Navigation
 *
 * @example Tab Navigator
 * ```tsx
 * import { createTabBarIcon } from 'rn-iconify/navigation';
 *
 * <Tab.Navigator>
 *   <Tab.Screen
 *     name="Home"
 *     options={{
 *       tabBarIcon: createTabBarIcon(['mdi:home', 'mdi:home-outline']),
 *     }}
 *   />
 * </Tab.Navigator>
 * ```
 *
 * @example Drawer Navigator
 * ```tsx
 * import { createDrawerIcon } from 'rn-iconify/navigation';
 *
 * <Drawer.Screen
 *   options={{
 *     drawerIcon: createDrawerIcon('mdi:home'),
 *   }}
 * />
 * ```
 *
 * @example Header Icons
 * ```tsx
 * import { createHeaderIcon, createBackIcon } from 'rn-iconify/navigation';
 *
 * <Stack.Screen
 *   options={({ navigation }) => ({
 *     headerLeft: createBackIcon({ onPress: () => navigation.goBack() }),
 *     headerRight: createHeaderIcon({ icon: 'mdi:dots-vertical' }),
 *   })}
 * />
 * ```
 */

// Types
export type {
  TabBarIconProps,
  DrawerIconProps,
  HeaderIconProps,
  TabBarIconConfig,
  SimpleTabBarIconConfig,
  DrawerIconConfig,
  TabBarIconFunction,
  DrawerIconFunction,
  HeaderIconFunction,
  NavigationIconPreset,
  IconSpec,
} from './types';

export { DEFAULT_NAVIGATION_PRESETS } from './types';

// Tab Bar Icons
export { createTabBarIcon, createTabBarIcons, tabIcon } from './createTabBarIcon';

// Drawer Icons
export { createDrawerIcon, createDrawerIcons } from './createDrawerIcon';

// Header Icons
export {
  createHeaderIcon,
  createBackIcon,
  createCloseIcon,
  createMenuIcon,
} from './createHeaderIcon';
export type { HeaderIconConfig } from './createHeaderIcon';

// Hook
export { useNavigationIcon } from './useNavigationIcon';
export type { UseNavigationIconOptions, UseNavigationIconReturn } from './useNavigationIcon';

// Default export
export { createTabBarIcon as default } from './createTabBarIcon';
