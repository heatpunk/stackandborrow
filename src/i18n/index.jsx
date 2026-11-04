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
import { detectLanguageFromLocale } from '../lib/hooks.js';

// Static map of locale loaders — Vite needs to see each candidate
// import target at build time to emit them as separate chunks.
// `import(\`./${lang}.js\`)` works in dev but Rollup can't analyze
// the template literal and silently ships *no* locale chunks in
// production. import.meta.glob fixes that.
const LOCALE_LOADERS = import.meta.glob('./*.js', { eager: false, import: 'default' });
const loadEnglish = LOCALE_LOADERS['./en.js'];

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
  strings: {},
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
  const [strings, setStrings] = useState({})
  const [loadedLang, setLoadedLang] = useState(null)

  // Load only the active language strings.
  useEffect(() => {
    let cancelled = false;
    const loader = LOCALE_LOADERS[`./${lang}.js`] || loadEnglish;
    loader()
      .then((strings) => {
        if (!cancelled) {
          setStrings(strings)
          setLoadedLang(lang)
        }
      })
      .catch(() => {
        if (!cancelled) setStrings({});
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
      {loadedLang === lang ? children : null}
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
      const raw = strings[key] ?? key;
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
