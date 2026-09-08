import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES, STATE_LANGUAGE_MAP, getStrings } from "../data/languages";
import { useAuth } from "./AuthContext";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [langCode, setLangCode] = useState(localStorage.getItem("ku_lang") || "en");

  // Auto-detect language from the user's selected state, unless they've
  // explicitly chosen one before (stored in localStorage).
  useEffect(() => {
    const manuallySet = localStorage.getItem("ku_lang_manual") === "true";
    if (!manuallySet && user?.state && STATE_LANGUAGE_MAP[user.state]) {
      setLangCode(STATE_LANGUAGE_MAP[user.state]);
    }
  }, [user?.state]);

  function setLanguage(code) {
    setLangCode(code);
    localStorage.setItem("ku_lang", code);
    localStorage.setItem("ku_lang_manual", "true");
  }

  const currentLanguage = LANGUAGES.find((l) => l.code === langCode) || LANGUAGES[0];
  const t = getStrings(langCode);

  return (
    <LanguageContext.Provider value={{ langCode, setLanguage, currentLanguage, languages: LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
