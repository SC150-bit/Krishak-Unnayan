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

function BookSlotPanel({ user, booking, onBook }) {
  const [form, setForm] = useState({
    mandi: "Mandi Sector 4, Karnal (₹2275/qtl)",
    date: new Date().toISOString().slice(0, 10),
    timeSlot: "08:00 AM - 10:00 AM",
    crop: user?.primaryCrop || "Wheat",
    quantity: "",
  });
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    // Simulated gate-token allocation — wire this to a real queue-management backend in production.
    const tokenNumber = 90 + Math.floor(Math.random() * 60);
    onBook({
      tokenId: `TOK-MANDI-${tokenNumber}`,
      tokenNumber,
      mandi: form.mandi.replace(/\s*\(₹[\d,]+\/qtl\)\s*$/, ""),
      date: form.date,
      timeSlot: form.timeSlot,
      crop: form.crop,
      quantity: form.quantity || "—",
      bookedOn: new Date().toLocaleDateString("en-IN"),
    });
    setConfirmed(true);
  }

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
            <option>Burdwan APMC, Purba Bardhaman (₹3300/qtl)</option>
            <option>Bankura Sadar APMC, Bankura (₹3200/qtl)</option>
            <option>Rampurhat APMC, Birbhum (₹2190/qtl)</option>
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

      <button onClick={handleConfirm} className="btn-primary w-full">
        Confirm Slot Booking
      </button>

      {confirmed && booking && (
        <p className="mt-4 text-sm text-brand-700 bg-brand-50 rounded-xl px-4 py-3">
          ✅ Slot confirmed at <b>{booking.mandi}</b> on {booking.date}, {booking.timeSlot}. Your gate token is{" "}
          <b>{booking.tokenId}</b> — track it live under "Live Queue Status".
        </p>
      )}
    </div>
  );
}

function LiveQueuePanel({ booking, onGoToBook }) {
  // Simulated gate queue movement — wire this up to a real queue-management backend in production.
  const [servingNumber, setServingNumber] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (!booking) return;
    // Start the "currently serving" token comfortably behind the user's own token.
    const vehiclesAheadStart = Math.min(booking.tokenNumber - 1, 60 + Math.floor(Math.random() * 40));
    setServingNumber(Math.max(1, booking.tokenNumber - vehiclesAheadStart - 1));
  }, [booking?.tokenId]);

  useEffect(() => {
    if (!booking) return;
    const id = setInterval(() => {
      setServingNumber((n) => {
        if (n === null) return n;
        if (n >= booking.tokenNumber) return n;
        return n + (Math.random() > 0.55 ? 1 : 0);
      });
    }, 4000);
    return () => clearInterval(id);
  }, [booking?.tokenId]);

  if (!booking) {
    return (
      <div className="card max-w-xl text-center">
        <h2 className="font-display text-xl font-bold text-brand-800 mb-2">Live Mandi Queue &amp; Token Tracking</h2>
        <p className="text-sm text-brand-500 mb-6">You don't have an active gate token yet.</p>
        <button onClick={onGoToBook} className="btn-primary">
          Book a Procurement Slot
        </button>
      </div>
    );
  }

  const vehiclesAhead = Math.max(0, booking.tokenNumber - servingNumber - 1);
  const estWaitMins = vehiclesAhead * 12;
  const status = servingNumber >= booking.tokenNumber ? "READY TO ENTER" : vehiclesAhead <= 3 ? "CALLED SOON" : "WAITING";
  const statusClasses =
    status === "READY TO ENTER"
      ? "bg-amber-100 text-amber-700"
      : status === "CALLED SOON"
      ? "bg-brand-100 text-brand-700"
      : "bg-brand-50 text-brand-600";

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setServingNumber((n) => Math.min(booking.tokenNumber, (n ?? 0) + Math.floor(Math.random() * 3)));
      setRefreshing(false);
    }, 500);
  }

  function handleSimulateSms() {
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 5000);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="font-display text-xl font-bold text-brand-800">Live Mandi Queue &amp; Token Tracking</h2>
        <button onClick={handleRefresh} className="btn-secondary text-sm shrink-0" disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh Live Queue"}
        </button>
      </div>
      <p className="text-sm text-brand-500 mb-6">Track live procurement gate status and estimated entry time.</p>

      <div className="card !p-0 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-brand-800 text-white font-display font-bold text-sm px-4 py-2 rounded-xl">
                {booking.tokenId}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusClasses}`}>{status}</span>
            </div>
            <span className="text-xs text-brand-400">Booked on {booking.bookedOn}</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-sm mb-6">
            <div>
              <span className="font-semibold text-brand-800">Mandi: </span>
              <span className="text-brand-600">{booking.mandi}</span>
            </div>
            <div>
              <span className="font-semibold text-brand-800">Scheduled Slot: </span>
              <span className="text-brand-600">
                {booking.date} ({booking.timeSlot})
              </span>
            </div>
            <div>
              <span className="font-semibold text-brand-800">Crop Details: </span>
              <span className="text-brand-600">
                {booking.quantity} Quintals of {booking.crop}
              </span>
            </div>
          </div>

          <div className="border border-brand-100 rounded-xl p-4 grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-1">
                Currently Serving Gate Token
              </p>
              <p className="font-display font-bold text-brand-800">TOK-MANDI-{servingNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-1">Vehicles Ahead</p>
              <p className="font-display font-bold text-brand-800">{vehiclesAhead}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-1">Est. Wait Time</p>
              <p className="font-display font-bold text-brand-800">
                {vehiclesAhead === 0 ? "Ready now" : `~${estWaitMins} mins`}
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={handleSimulateSms} className="btn-secondary text-sm">
              Simulate SMS Notification
            </button>
          </div>

          {smsSent && (
            <p className="mt-4 text-sm text-brand-700 bg-brand-50 rounded-xl px-4 py-3">
              📩 SMS sent: "Your token {booking.tokenId} is {vehiclesAhead === 0 ? "ready to enter now" : `~${vehiclesAhead} vehicles away, est. ${estWaitMins} mins`}."
            </p>
          )}
        </div>
      </div>
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
  const [booking, setBooking] = useState(null);

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
        {active === "book" && <BookSlotPanel user={user} booking={booking} onBook={setBooking} />}
        {active === "queue" && <LiveQueuePanel booking={booking} onGoToBook={() => setActive("book")} />}
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
