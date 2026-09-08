import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const STEPS = [
  {
    n: 1,
    title: "Select Mandi & Book Slot",
    desc: "Choose your nearest procurement center, preferred date, time slot, and estimated crop volume.",
  },
  {
    n: 2,
    title: "Get Digital Token",
    desc: "Receive a digital queue token with estimated time to arrive at the procurement gate.",
  },
  {
    n: 3,
    title: "Live Queue Updates & SMS",
    desc: "Track current serving tokens in real-time and receive SMS notifications before your turn.",
  },
];

const FEATURES = [
  { title: "Slot Booking System", desc: "Eliminate random queueing by pre-booking scheduled procurement dates and times." },
  { title: "Real-Time Queue Tracking", desc: "Check live serving tokens and estimated remaining waiting times from your phone." },
  { title: "SMS & App Alerts", desc: "Get automated notification triggers when your token number is 15 minutes away." },
  { title: "AI Assistant & Price Board", desc: "Inquire about crop schedules and find net returns across neighboring markets." },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div>
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-brand-900 leading-tight">
            {t.tagline}
          </h1>
          <p className="mt-5 text-brand-600 text-lg">{t.heroSub}</p>
          <div className="mt-8 flex items-center gap-4">
            <Link to="/signup" className="btn-primary">
              {t.bookSlotFree}
            </Link>
            <a href="#how-it-works" className="text-brand-700 font-semibold underline underline-offset-4">
              {t.seeHowItWorks} ↓
            </a>
          </div>
          <div className="mt-10 flex gap-10">
            <div>
              <p className="font-display text-3xl font-bold text-brand-800">6</p>
              <p className="text-sm text-brand-500">mandis tracked</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-brand-800">0 Min</p>
              <p className="text-sm text-brand-500">queue waiting with token</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-brand-800">2 min</p>
              <p className="text-sm text-brand-500">to book a slot</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex justify-center">
          <div className="w-80 h-80 rounded-full bg-brand-100 flex items-center justify-center text-8xl">🌾</div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16 border-y border-brand-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold text-brand-800 mb-8">Three steps to fast procurement</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="card">
                <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-display font-bold text-brand-800 mb-2">{s.title}</h3>
                <p className="text-sm text-brand-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold text-brand-800 mb-8">Smart Procurement Solution</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <h3 className="font-display font-bold text-brand-800 mb-2">{f.title}</h3>
                <p className="text-sm text-brand-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-16 border-t border-brand-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl font-bold text-brand-800 mb-3">Simple, farmer-friendly pricing</h2>
          <p className="text-brand-600 mb-8">Slot booking and the price board are always free.</p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            <div className="card">
              <p className="font-display font-bold text-brand-800 mb-1">Free</p>
              <p className="text-3xl font-bold text-brand-900 mb-4">₹0</p>
              <ul className="text-sm text-brand-600 space-y-1.5">
                <li>✓ Slot booking</li>
                <li>✓ Live queue status</li>
                <li>✓ Mandi price board</li>
              </ul>
            </div>
            <div className="card border-brand-300 ring-1 ring-brand-200">
              <p className="font-display font-bold text-brand-800 mb-1">Krishak Plus</p>
              <p className="text-3xl font-bold text-brand-900 mb-4">₹30<span className="text-base font-medium">/mo</span></p>
              <ul className="text-sm text-brand-600 space-y-1.5">
                <li>✓ Everything in Free</li>
                <li>✓ AI voice assistant</li>
                <li>✓ Nearest best-price market finder</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-brand-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-brand-500">
          <span>{t.appName}</span>
          <span>Department of Consumer Affairs (DoCA) Procurement Automation Portal.</span>
        </div>
      </footer>
    </div>
  );
}
