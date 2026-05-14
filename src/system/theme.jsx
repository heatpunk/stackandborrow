// ============================================================
// THEME — provider + hook.
//
// Sources, in order of precedence:
//   1. localStorage('sb.theme')   — explicit user choice
//   2. `prefers-color-scheme`     — when stored value is 'auto'
//   3. fallback                   — 'light'
//
// On mobile (< 1024px) the dark side is `carbon`; on desktop it's
// `midnight`. The user can still override either independently.
//
// The `data-theme` attribute on <html> is the single source of
// truth for CSS. ThemeProvider writes it; an inline no-FOUC script
// in index.html writes it first so there's no light/dark flash.
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ensureThemeCss, THEME_NAMES } from './tokens.js';

const STORAGE_KEY = 'sb.theme';
const DESKTOP_MIN = 1024;

const ThemeCtx = createContext({
  preference: 'auto',     // what the user picked ('auto' | 'light' | 'carbon' | 'midnight')
  theme: 'light',         // resolved theme actually applied to data-theme
  isDark: false,
  isDesktop: false,
  setPreference: () => {},
  toggle: () => {},
});

function readStored() {
  if (typeof window === 'undefined') return 'auto';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'carbon' || v === 'midnight' || v === 'auto') return v;
  } catch { /* storage disabled */ }
  return 'auto';
}

function readDesktop() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches;
}

function readSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Pick the concrete theme name to apply, given preference + viewport + system pref.
function resolveTheme(preference, isDesktop, systemDark) {
  if (preference === 'light' || preference === 'carbon' || preference === 'midnight') {
    return preference;
  }
  // 'auto'
  if (!systemDark) return 'light';
  return isDesktop ? 'midnight' : 'carbon';
}

export function ThemeProvider({ children }) {
  // Init from storage / media query — same result the no-FOUC script computed
  // server-side. We compute lazily so SSR doesn't crash.
  const [preference, setPreferenceState] = useState(readStored);
  const [isDesktop, setIsDesktop] = useState(readDesktop);
  const [systemDark, setSystemDark] = useState(readSystemDark);

  const theme = useMemo(
    () => resolveTheme(preference, isDesktop, systemDark),
    [preference, isDesktop, systemDark]
  );

  // Inject the variable stylesheet once, and keep <html data-theme> in sync.
  useEffect(() => {
    ensureThemeCss();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Subscribe to media queries — viewport + system preference.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desktopMq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    const onDesktop = (e) => setIsDesktop(e.matches);
    const onDark = (e) => setSystemDark(e.matches);
    desktopMq.addEventListener('change', onDesktop);
    darkMq.addEventListener('change', onDark);
    return () => {
      desktopMq.removeEventListener('change', onDesktop);
      darkMq.removeEventListener('change', onDark);
    };
  }, []);

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch { /* ignore */ }
  }, []);

  // Click cycles light <-> dark for the current viewport.
  // Long-press / cmd-click resets to 'auto' (handled by SunMoonStamp).
  const toggle = useCallback(() => {
    const dark = isDesktop ? 'midnight' : 'carbon';
    if (theme === 'light') {
      setPreference(dark);
    } else {
      setPreference('light');
    }
  }, [theme, isDesktop, setPreference]);

  const value = useMemo(() => ({
    preference,
    theme,
    isDark: theme !== 'light',
    isDesktop,
    setPreference,
    toggle,
  }), [preference, theme, isDesktop, setPreference, toggle]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

// Convenience hook for layout decisions (keeps the API explicit at call sites).
export function useIsDesktop() {
  return useContext(ThemeCtx).isDesktop;
}

export const VALID_THEMES = THEME_NAMES;
