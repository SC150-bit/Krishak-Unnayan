import React, { useEffect, useState } from 'react';

export default function MapFinder() {
  const [mandis, setMandis] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/mandis')
      .then(res => res.json())
      .then(data => setMandis(data));
  }, []);

  return (
    <div className="space-y-4">
      {/* Map Embed Container */}
      <div className="w-full h-64 bg-slate-200 rounded-xl overflow-hidden border border-slate-300 relative">
        <iframe
          title="Google Maps Mandi Finder"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_KEY&q=Karnal+Grain+Market`}
          allowFullScreen
        ></iframe>
      </div>

      {/* Recommended Mandis List with Best Real-Time Pricing */}
      <div className="space-y-2">
        {mandis.map((mandi) => (
          <div key={mandi.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-emerald-500 transition">
            <div>
              <p className="font-bold text-slate-800">{mandi.name}</p>
              <p className="text-xs text-slate-500">{mandi.distance} away</p>
            </div>
            <div className="text-right">
              <p className="font-black text-emerald-700">₹{mandi.pricePerQuintal} / quintal</p>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Best Price</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}