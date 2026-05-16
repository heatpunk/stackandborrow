// ============================================================
// I18N — language detection, provider, and t() lookup.
//
// Privacy-preserving: all translations are static, pre-generated
// and bundled. No runtime calls to translation services.
// Active language is dynamically imported so Vite code-splits
// each locale into its own chunk — visitors only download one.
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import en from './en.js';
import { detectLanguageFromLocale } from '../lib/hooks.js';

export const SUPPORTED_LANGUAGES = ['en', 'sv', 'de', 'es', 'fr', 'pt'];

// Native names for the switcher, used both as the link label and
// the page-language indicator. Keep in the language's own script.
export const LANGUAGE_NAMES = {
  en: 'English',
  sv: 'svenska',
  de: 'Deutsch',
  es: 'español',
  fr: 'français',
  pt: 'português',
};

// Full "switch to <lang>" labels in the destination language's own
// idiom. Used by the FineFooter switcher to let visitors flip
// between their auto-detected language and English.
export const LANGUAGE_SWITCH_LABELS = {
  en: 'View in English',
  sv: 'Visa på svenska',
  de: 'Auf Deutsch ansehen',
  es: 'Ver en español',
  fr: 'Voir en français',
  pt: 'Ver em português',
};

// Resolves the initial language synchronously so first paint is
// in the right language whenever the chunk is already cached.
// Order: localStorage > navigator.language > 'en'.
function resolveInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem('stackandborrow:language');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (SUPPORTED_LANGUAGES.includes(parsed)) return parsed;
    }
  } catch { /* fall through */ }
  return detectLanguageFromLocale();
}

const LanguageContext = createContext({
  lang: 'en',
  detectedLang: 'en',
  strings: en,
  setLanguage: () => {},
});

// Simple {name}-style placeholder formatter. No nested objects,
// no plural forms, no ICU — keep it minimal.
function format(str, vars) {
  if (!vars || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : m
  );
}

export function LanguageProvider({ children }) {
  const detectedLang = useMemo(
    () => (typeof window === 'undefined' ? 'en' : detectLanguageFromLocale()),
    []
  );

  const [lang, setLangState] = useState(resolveInitialLanguage);
  const [strings, setStrings] = useState(en);

  // Load the active language's strings. English is already imported
  // statically so 'en' resolves synchronously; other locales lazy-load.
  useEffect(() => {
    let cancelled = false;
    if (lang === 'en') {
      setStrings(en);
      return () => { cancelled = true; };
    }
    import(`./${lang}.js`)
      .then((mod) => {
        if (cancelled) return;
        // Fall through to English for any missing keys.
        setStrings({ ...en, ...mod.default });
      })
      .catch(() => {
        if (cancelled) return;
        setStrings(en);
      });
    return () => { cancelled = true; };
  }, [lang]);

  // SEO + accessibility: keep <html lang> in sync.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLanguage = useCallback((next) => {
    if (!SUPPORTED_LANGUAGES.includes(next)) return;
    setLangState(next);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'stackandborrow:language',
          JSON.stringify(next)
        );
      }
    } catch { /* storage full or disabled */ }
  }, []);

  const value = useMemo(
    () => ({ lang, detectedLang, strings, setLanguage }),
    [lang, detectedLang, strings, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Returns t(key, vars?) — the translation function.
// Falls back to the key itself if both active and English miss
// (which means a refactor bug: surface it loudly in dev).
export function useT() {
  const { strings } = useContext(LanguageContext);
  return useCallback(
    (key, vars) => {
      const raw = strings[key] ?? en[key] ?? key;
      return format(raw, vars);
    },
    [strings]
  );
}

// Exposes the active language + setter for the switcher.
export function useLanguage() {
  const { lang, detectedLang, setLanguage } = useContext(LanguageContext);
  return { lang, detectedLang, setLanguage };
}
