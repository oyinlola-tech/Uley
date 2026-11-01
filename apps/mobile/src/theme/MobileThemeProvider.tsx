import { MOBILE_THEME_PREFERENCE_STORAGE_KEY, ULEY_COLORS, ULEY_DARK_COLORS } from '../constants';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import type { UleyPalette } from '../constants/brand';
import { ThemePreference } from '../enums';

type ThemeContextValue = { colors: UleyPalette; isDark: boolean; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readThemePreference(): Promise<ThemePreference | null> {
  try {
    const storedTheme = await PlatformThemeStorage.read();
    return Object.values(ThemePreference).includes(storedTheme as ThemePreference) ? storedTheme as ThemePreference : null;
  } catch { return null; }
}

async function saveThemePreference(theme: ThemePreference) {
  try { await PlatformThemeStorage.write(theme); } catch { /* Theme can still change for this session. */ }
}

const PlatformThemeStorage = {
  read: () => typeof window !== 'undefined' ? window.localStorage.getItem(MOBILE_THEME_PREFERENCE_STORAGE_KEY) : SecureStore.getItemAsync(MOBILE_THEME_PREFERENCE_STORAGE_KEY),
  write: (theme: ThemePreference) => typeof window !== 'undefined' ? Promise.resolve(window.localStorage.setItem(MOBILE_THEME_PREFERENCE_STORAGE_KEY, theme)) : SecureStore.setItemAsync(MOBILE_THEME_PREFERENCE_STORAGE_KEY, theme),
};

export function MobileThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [savedTheme, setSavedTheme] = useState<ThemePreference | null>(null);
  const isDark = savedTheme ? savedTheme === ThemePreference.DARK : systemColorScheme === ThemePreference.DARK;
  const colors = isDark ? ULEY_DARK_COLORS : ULEY_COLORS;

  useEffect(() => { void readThemePreference().then(setSavedTheme); }, []);

  function toggleTheme() {
    const nextTheme = isDark ? ThemePreference.LIGHT : ThemePreference.DARK;
    setSavedTheme(nextTheme);
    void saveThemePreference(nextTheme);
  }

  const theme = useMemo(() => ({ colors, isDark, toggleTheme }), [colors, isDark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useMobileTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useMobileTheme must be used inside MobileThemeProvider.');
  return theme;
}
