'use client';
import { THEME_PREFERENCE_STORAGE_KEY } from '../constants';

import { MoonIcon, SunIcon } from '@phosphor-icons/react/ssr';
import { useEffect, useState } from 'react';

import { ThemePreference } from '../enums';

function applyTheme(theme: ThemePreference) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
    const activeTheme = Object.values(ThemePreference).includes(savedTheme as ThemePreference)
      ? savedTheme as ThemePreference
      : mediaQuery.matches ? ThemePreference.DARK : ThemePreference.LIGHT;
    applyTheme(activeTheme);
    setIsDark(activeTheme === ThemePreference.DARK);

    function followSystemTheme(event: MediaQueryListEvent) {
      if (window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)) return;
      applyTheme(event.matches ? ThemePreference.DARK : ThemePreference.LIGHT);
      setIsDark(event.matches);
    }
    mediaQuery.addEventListener('change', followSystemTheme);
    return () => mediaQuery.removeEventListener('change', followSystemTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = isDark ? ThemePreference.LIGHT : ThemePreference.DARK;
    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setIsDark(nextTheme === ThemePreference.DARK);
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} aria-pressed={isDark} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      {isDark ? <SunIcon size={18} weight="regular" aria-hidden="true" /> : <MoonIcon size={18} weight="regular" aria-hidden="true" />}
    </button>
  );
}
