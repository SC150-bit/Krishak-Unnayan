import React from 'react';

export default function TokenCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-slate-600 font-medium">Active Token & Live Queue</h2>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">In Queue</span>
      </div>

      <div className="my-6">
        <span className="text-slate-400 text-sm">Token Number</span>
        <h1 className="text-5xl font-extrabold text-emerald-700 tracking-tight mt-1">T-104</h1>
      </div>

      <div className="space-y-1 text-slate-500 text-sm mb-6">
        <div className="flex items-center gap-2">
          <span>📍</span> Mandi Sector 4, Karnal
        </div>
        <div className="flex items-center gap-2">
          <span>🕒</span> Today, 2:30 PM
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl text-center border border-emerald-100">
        <div>
          <div className="text-2xl font-bold text-emerald-800">3</div>
          <div className="text-xs text-slate-500 font-medium">Ahead in Line</div>
        </div>
        <div className="border-l border-emerald-200">
          <div className="text-2xl font-bold text-emerald-800">18 mins</div>
          <div className="text-xs text-slate-500 font-medium">Est. Wait Time</div>
        </div>
      </div>
    </div>
  );
}