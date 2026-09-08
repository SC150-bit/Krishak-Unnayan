import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { langCode, setLanguage, languages } = useLanguage();

  return (
    <select
      value={langCode}
      onChange={(e) => setLanguage(e.target.value)}
      className="text-sm border border-brand-200 rounded-full px-3 py-1.5 bg-white text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
      aria-label="Choose language"
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
