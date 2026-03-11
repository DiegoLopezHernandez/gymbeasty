import { Stack } from 'expo-router';
import { useThemeStore } from '../src/store/themeStore';

export default function RootLayout() {
  const theme = useThemeStore(s => s.theme);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tabs" />
      <Stack.Screen name="workout/start" />
      <Stack.Screen name="workout/active" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="workout/manual" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="workout/[id]" />
    </Stack>
  );
}
