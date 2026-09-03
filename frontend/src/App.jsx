import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TokenCard from './components/TokenCard';
import MapFinder from './components/MapFinder';
import PaymentButton from './components/PaymentButton';
import AiAssistantModal from './components/AiAssistantModal';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from './firebase';

export default function App() {
  // Current logged in farmer state
  const [user, setUser] = useState({
    name: "Ramesh Kumar",
    id: "KAP-884920",
    email: "ramesh.kumar@example.com",
    isLoggedIn: true
  });

  // UI state management
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  // Authentication Handlers
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser({
        name: result.user.displayName || "Farmer User",
        id: `KAP-${Math.floor(100000 + Math.random() * 900000)}`,
        email: result.user.email,
        isLoggedIn: true
      });
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error("Google Sign-in Error:", error);
      alert("Failed to sign in with Google: " + error.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (authMode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      setUser({
        name: result.user.displayName || email.split('@')[0],
        id: `KAP-${Math.floor(100000 + Math.random() * 900000)}`,
        email: result.user.email,
        isLoggedIn: true
      });
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error("Authentication Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* 1. Header with Language Switcher & Profile/Login */}
      <Header 
        user={user} 
        onOpenAuth={() => setIsAuthModalOpen(true)} 
      />

      {/* 2. Main Full-Screen Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left & Middle Column (2 Cols wide on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Token & Queue Tracker */}
          <TokenCard user={user} />

          {/* Google Maps Best Selling Mandi Finder */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Best Nearby Selling Mandis
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                Live Prices
              </span>
            </div>
            <MapFinder />
          </div>

        </div>

        {/* Right Column (1 Col wide on Desktop) */}
        <div className="space-y-6">
          
          {/* ₹30 Monthly Subscription Card */}
          <PaymentButton 
            user={user} 
            onPaymentSuccess={(data) => {
              setSubscriptionActive(true);
              alert('Monthly subscription verified successfully!');
            }} 
          />

          {/* Key Services Navigation Grid */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Key Services</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-emerald-50 transition border-emerald-100 group">
                <span className="text-3xl group-hover:scale-110 transition-transform">📅</span>
                <span className="text-sm font-semibold text-slate-700">Book Slot</span>
              </button>

              <button className="p-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-emerald-50 transition border-emerald-100 group">
                <span className="text-3xl group-hover:scale-110 transition-transform">📈</span>
                <span className="text-sm font-semibold text-slate-700">
                  {subscriptionActive ? 'Active Plan' : 'Payment Status'}
                </span>
              </button>
            </div>
          </div>

          {/* AI Helper Banner Card */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">AI Krishi Sahayak</h3>
              <p className="text-emerald-100 text-sm mb-5 leading-relaxed">
                Ask about recommended crop selling windows, pest controls, or weather predictions based on your current location.
              </p>
              <button 
                onClick={() => setIsAiOpen(true)}
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
                Launch AI Assistant Chat
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Floating Action AI Button */}
      <button 
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 transition border-2 border-emerald-500 z-40"
      >
        <span className="w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
        <span>AI Helper</span>
      </button>

      {/* 3. AI Assistant Chat Modal */}
      {isAiOpen && (
        <AiAssistantModal 
          onClose={() => setIsAiOpen(false)} 
          user={user} 
        />
      )}

      {/* 4. Firebase Sign-In / Sign-Up Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {authMode === 'signin' ? 'Sign In to Portal' : 'Create Farmer Account'}
              </h3>
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Google Social Authentication */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full mb-4 py-2.5 px-4 border border-slate-300 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition text-sm font-semibold text-slate-700 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">OR</span>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                  placeholder="farmer@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-sm transition shadow"
              >
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <p className="text-xs text-center text-slate-500 mt-4">
              {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-emerald-700 font-bold hover:underline"
              >
                {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}