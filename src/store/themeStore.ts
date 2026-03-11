import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, ThemeMode, DarkTheme, LightTheme } from '../constants/theme';

interface ThemeStore {
  mode: ThemeMode;
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'dark',
      theme: DarkTheme,
      toggleTheme: () => set(s => {
        const next = s.mode === 'dark' ? 'light' : 'dark';
        return { mode: next, theme: next === 'dark' ? DarkTheme : LightTheme };
      }),
      setTheme: (mode) => set({ mode, theme: mode === 'dark' ? DarkTheme : LightTheme }),
    }),
    { name: 'gymbeast-theme', storage: createJSONStorage(() => AsyncStorage) }
  )
);
