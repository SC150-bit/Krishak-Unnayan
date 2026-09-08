import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { user, logout, isPremium } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="border-b border-brand-100 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-display font-bold text-xl text-brand-800">{t.appName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-brand-700">
          <a href="/#how-it-works">How it works</a>
          <a href="/#features">Features</a>
          <a href="/#pricing">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <span
                className={`hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                  isPremium ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-brand-600"
                }`}
              >
                {isPremium ? "Krishak Plus" : "Free plan"}
              </span>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 font-semibold flex items-center justify-center"
                title={user.name}
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </button>
              <button onClick={logout} className="btn-secondary !px-4 !py-2 text-sm">
                {t.signOut}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")} className="btn-secondary !px-4 !py-2 text-sm">
                {t.signIn}
              </button>
              <button onClick={() => navigate("/signup")} className="btn-primary !px-4 !py-2 text-sm">
                {t.getStarted}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
