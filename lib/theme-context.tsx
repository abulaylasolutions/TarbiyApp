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
  background: '#0F1115',
  backgroundSecondary: '#1A1D23',
  cardBackground: '#1F2937',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  border: '#374151',
  modalOverlay: 'rgba(0,0,0,0.7)',
  modalBackground: '#1F2937',
  inputBackground: '#1A1D23',
  inputBorder: '#374151',
  settingsCardBg: '#1F2937',
  tabBarBg: '#0F1115',
  tabBarBorder: '#374151',
  blurTint: 'dark' as 'light' | 'dark',
  statusBar: 'light' as 'dark' | 'light',
  shadowOpacity: 0.2,
  mintGreen: '#9CA3AF',
  mintGreenDark: '#6B7280',
  mintGreenLight: '#4B5563',
  headerGradient1: '#4B5563',
  headerGradient2: '#374151',
  premiumGradient1: '#4B5563',
  premiumGradient2: '#374151',
  cogGradient1: '#4B5563',
  cogGradient2: '#1F2937',
  creamBeige: '#1A1D23',
  danger: '#EF5350',
  dangerLight: '#3A1A1A',
};

export type ThemeColors = typeof LightColors;

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const GENDER_COLORS = {
  female: { light: '#FFC1CC', dark: '#FFC1CC' },
  male: { light: '#A3D8F4', dark: '#A3D8F4' },
};

export function getGenderColor(gender: string | undefined | null): string {
  const isFemale = gender === 'femmina' || gender === 'female';
  return isFemale ? GENDER_COLORS.female.light : GENDER_COLORS.male.light;
}

export function getDarkVariant(lightHex: string): string {
  const { h, s, l } = hexToHsl(lightHex);
  const newS = Math.min(1, s * 1.3);
  const newL = l * 0.55;
  return hslToHex(h, newS, newL);
}

export function getTextOnColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? '#FFFFFF' : '#000000';
}

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
