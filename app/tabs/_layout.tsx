import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useThemeStore } from '../../src/store/themeStore';

// 5 tabs limpias: Home, Rutinas, BigThree, Stats (incluye mapa), Peso
export default function TabLayout() {
  const theme = useThemeStore(s => s.theme);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: theme.tabBg, borderTopColor: theme.tabBorder, borderTopWidth: 1, height: 62 },
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen name="index"    options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.35 }}>🏠</Text> }} />
      <Tabs.Screen name="routines" options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.35 }}>📋</Text> }} />
      <Tabs.Screen name="bigthree" options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.35 }}>🏋️</Text> }} />
      <Tabs.Screen name="history"  options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.35 }}>📊</Text> }} />
      <Tabs.Screen name="body"     options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.35 }}>⚖️</Text> }} />
      <Tabs.Screen name="goals"    options={{ href: null }} />
      <Tabs.Screen name="stats"    options={{ href: null }} />
    </Tabs>
  );
}
