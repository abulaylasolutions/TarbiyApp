import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = '@tarbiyapp_dark_mode';

export const LightColors = {
  background: '#F8FEFA',
  backgroundSecondary: '#F0FAF4',
  cardBackground: '#FFFFFF',
  textPrimary: '#333333',
  textSecondary: '#636E72',
  textMuted: '#B2BEC3',
  white: '#FFFFFF',
  border: '#E0F2E9',
  modalOverlay: 'rgba(0,0,0,0.4)',
  modalBackground: '#FFFFFF',
  inputBackground: '#F5F5F5',
  inputBorder: '#E0E0E0',
  settingsCardBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E0F2E9',
  blurTint: 'light' as 'light' | 'dark',
  statusBar: 'dark' as 'dark' | 'light',
  shadowOpacity: 0.05,
  mintGreen: '#A8E6CF',
  mintGreenDark: '#6BBF9A',
  mintGreenLight: '#C8F0E3',
  headerGradient1: '#A8E6CF',
  headerGradient2: '#C7CEEA',
  premiumGradient1: '#6BBF9A',
  premiumGradient2: '#A8E6CF',
  cogGradient1: '#C7CEEA',
  cogGradient2: '#E3E7F5',
  creamBeige: '#E0F2E9',
  danger: '#FF6B6B',
  dangerLight: '#FFE0E0',
};

export const DarkColors = {
  background: '#121212',
  backgroundSecondary: '#1A1A2E',
  cardBackground: '#1E1E2E',
  textPrimary: '#E0E0E0',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  white: '#FFFFFF',
  border: '#2A2A3A',
  modalOverlay: 'rgba(0,0,0,0.7)',
  modalBackground: '#1E1E2E',
  inputBackground: '#2A2A3A',
  inputBorder: '#3A3A4A',
  settingsCardBg: '#1E1E2E',
  tabBarBg: '#1A1A2E',
  tabBarBorder: '#2A2A3A',
  blurTint: 'dark' as 'light' | 'dark',
  statusBar: 'light' as 'dark' | 'light',
  shadowOpacity: 0.2,
  mintGreen: '#2E7D32',
  mintGreenDark: '#388E3C',
  mintGreenLight: '#1B3A1E',
  headerGradient1: '#2E7D32',
  headerGradient2: '#1A3A5C',
  premiumGradient1: '#2E7D32',
  premiumGradient2: '#1B5E20',
  cogGradient1: '#1A3A5C',
  cogGradient2: '#2A2A3A',
  creamBeige: '#2A2A3A',
  danger: '#EF5350',
  dangerLight: '#3A1A1A',
};

export type ThemeColors = typeof LightColors;

interface ThemeContextValue {
  isDark: boolean;
  toggleDark: () => void;
  setDark: (v: boolean) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleDark: () => {},
  setDark: () => {},
  colors: LightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const val = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (val === 'true') setIsDark(true);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(DARK_MODE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const setDark = useCallback((v: boolean) => {
    setIsDark(v);
    AsyncStorage.setItem(DARK_MODE_KEY, String(v)).catch(() => {});
  }, []);

  const colors = useMemo(() => isDark ? DarkColors : LightColors, [isDark]);

  const value = useMemo(() => ({ isDark, toggleDark, setDark, colors }), [isDark, toggleDark, setDark, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
