import React, { useState } from 'react';

export default function Header({ user, onOpenAuth }) {
  const [language, setLanguage] = useState('EN');

  return (
    <header className="bg-emerald-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Portal Title & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 border border-emerald-500 flex items-center justify-center font-bold text-xl">
            🌾
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">
              {language === 'EN' ? 'कृषक उन्नयन' : 'Krishak Unnayan'}
            </h1>
            <p className="text-xs text-emerald-200">Krishak Unnayan Portal</p>
          </div>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-4">
          
          {/* Language Switcher */}
          <button 
            onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
            className="bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-600 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition"
          >
            {language === 'EN' ? 'EN | हिंदी' : 'हिंदी | EN'}
          </button>

          {/* Account Profile / Authentication Action */}
          {user?.isLoggedIn ? (
            <div className="flex items-center gap-3 bg-emerald-700/60 border border-emerald-600 px-3 py-1.5 rounded-full">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="text-left pr-2">
                <p className="text-xs font-bold leading-tight flex items-center gap-1">
                  {user.name}
                  <svg className="w-3.5 h-3.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </p>
                <p className="text-[10px] text-emerald-200">ID: {user.id} • Aadhaar Linked</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow"
            >
              Sign In / Register
            </button>
          )}

        </div>

      </div>
    </header>
  );
}