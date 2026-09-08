import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../services/api";
import MapDashboard from "../components/MapDashboard";
import ChatAssistant from "../components/ChatAssistant";
import AadhaarModal from "../components/AadhaarModal";
import PaywallModal from "../components/PaywallModal";

const NAV_ITEMS = [
  { key: "book", label: "bookSlot", icon: "🗓️" },
  { key: "queue", label: "liveQueue", icon: "⏱️" },
  { key: "markets", label: "bestMarkets", icon: "📍" },
  { key: "ai", label: "aiAssistant", icon: "🤖" },
];

function BookSlotPanel({ user }) {
  const [form, setForm] = useState({
    mandi: "Mandi Sector 4, Karnal (₹2275/qtl)",
    date: new Date().toISOString().slice(0, 10),
    timeSlot: "08:00 AM - 10:00 AM",
    crop: user?.primaryCrop || "Wheat",
    quantity: "",
  });
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="card max-w-2xl">
      <h2 className="font-display text-xl font-bold text-brand-800 mb-1">Procurement Slot Booking</h2>
      <p className="text-sm text-brand-500 mb-6">Schedule your crop delivery in advance to avoid long gate queues.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-brand-700 block mb-1">Select Mandi Center</label>
          <select
            className="input-field"
            value={form.mandi}
            onChange={(e) => setForm({ ...form, mandi: e.target.value })}
          >
            <option>Mandi Sector 4, Karnal (₹2275/qtl)</option>
            <option>Taraori Mandi (₹2311/qtl)</option>
            <option>Gharaunda Mandi (₹2190/qtl)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-brand-700 block mb-1">Delivery Date</label>
          <input
            type="date"
            className="input-field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-700 block mb-1">Time Slot</label>
          <select
            className="input-field"
            value={form.timeSlot}
            onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
          >
            <option>08:00 AM - 10:00 AM</option>
            <option>10:00 AM - 12:00 PM</option>
            <option>02:00 PM - 04:00 PM</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-brand-700 block mb-1">Crop Type</label>
          <input className="input-field" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} />
        </div>
      </div>

      <label className="text-sm font-medium text-brand-700 block mb-1">Estimated Quantity (Quintals)</label>
      <input
        className="input-field mb-6"
        placeholder="e.g. 50"
        value={form.quantity}
        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
      />

      <button onClick={() => setConfirmed(true)} className="btn-primary w-full">
        Confirm Slot Booking
      </button>

      {confirmed && (
        <p className="mt-4 text-sm text-brand-700 bg-brand-50 rounded-xl px-4 py-3">
          ✅ Slot confirmed at <b>{form.mandi}</b> on {form.date}, {form.timeSlot}. You'll get an SMS token 15
          minutes before your turn.
        </p>
      )}
    </div>
  );
}

function LiveQueuePanel() {
  // Simulated live token — wire this to a real queue-management backend in production.
  const [token, setToken] = useState(42);
  useEffect(() => {
    const id = setInterval(() => setToken((t) => t + (Math.random() > 0.6 ? 1 : 0)), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card max-w-md text-center">
      <h2 className="font-display text-xl font-bold text-brand-800 mb-4">Live Queue Status</h2>
      <p className="text-sm text-brand-500 mb-2">Now serving token</p>
      <p className="text-6xl font-bold text-brand-700 font-display">{token}</p>
      <p className="text-sm text-brand-500 mt-4">Your token: <b>#57</b> · Estimated wait: ~12 min</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, isPremium, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [active, setActive] = useState("book");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState("");

  function goPremium(featureLabel, key) {
    if (isPremium) {
      setActive(key);
    } else {
      setPremiumFeature(featureLabel);
      setShowPaywall(true);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-[260px_1fr] gap-8">
      <aside className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-display font-bold text-brand-800">{user?.name}</p>
              <p className="text-xs text-brand-500">
                {user?.city ? `${user.city}, ` : ""}
                {user?.state} · {user?.primaryCrop}
              </p>
            </div>
          </div>
          <span
            className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
              isPremium ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-brand-600"
            }`}
          >
            {isPremium ? "Krishak Plus" : "Free plan"}
          </span>

          {!user?.aadhaarVerified && (
            <button onClick={() => setShowAadhaar(true)} className="btn-secondary w-full mt-4 text-sm">
              Verify Aadhaar (KYC)
            </button>
          )}
          {user?.aadhaarVerified && (
            <p className="text-xs text-brand-500 mt-3">✅ Aadhaar verified · {user.aadhaarNumberMasked}</p>
          )}
        </div>

        {!isPremium && (
          <div className="bg-brand-800 text-white rounded-2xl p-5">
            <p className="font-display font-bold mb-1">{t.unlockPlus}</p>
            <p className="text-sm text-brand-100 mb-4">{t.unlockPlusDesc}</p>
            <button
              onClick={() => {
                setPremiumFeature("");
                setShowPaywall(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full px-5 py-2.5 text-sm w-full"
            >
              {t.upgrade}
            </button>
          </div>
        )}

        <nav className="card !p-2">
          {NAV_ITEMS.map((item) => {
            const isPremiumOnly = item.key === "markets" || item.key === "ai";
            return (
              <button
                key={item.key}
                onClick={() => (isPremiumOnly ? goPremium(t[item.label], item.key) : setActive(item.key))}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  active === item.key ? "bg-brand-50 text-brand-800" : "text-brand-600 hover:bg-brand-50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{t[item.label]}</span>
                {isPremiumOnly && !isPremium && <span className="ml-auto text-xs">🔒</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main>
        {active === "book" && <BookSlotPanel user={user} />}
        {active === "queue" && <LiveQueuePanel />}
        {active === "markets" && isPremium && <MapDashboard cropName={user?.primaryCrop || "Wheat"} />}
        {active === "ai" && isPremium && (
          <ChatAssistant cropName={user?.primaryCrop || "Wheat"} position={user?.location} />
        )}
      </main>

      {showAadhaar && (
        <AadhaarModal
          onClose={() => setShowAadhaar(false)}
          onVerified={() => {
            setShowAadhaar(false);
            refreshUser();
          }}
        />
      )}
      {showPaywall && <PaywallModal featureName={premiumFeature} onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
