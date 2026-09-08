import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { api } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

// Fix default marker icons (Vite + Leaflet asset path quirk)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#307322;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #307322;"></div>`,
  iconSize: [16, 16],
});

const mandiIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#e18e2c;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 10);
  }, [lat, lng, map]);
  return null;
}

export default function MapDashboard({ cropName = "Wheat" }) {
  const { t } = useLanguage();
  const [position, setPosition] = useState(null); // { lat, lng }
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPosition({ lat: 29.6857, lng: 76.9905 }) // fallback: Karnal, Haryana
    );
  }, []);

  useEffect(() => {
    if (!position) return;
    setLoading(true);
    api
      .getNearestBest(position.lat, position.lng, cropName)
      .then((data) => setMarkets(data.markets))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [position, cropName]);

  if (!position) return <div className="card">Locating you…</div>;

  return (
    <div className="card overflow-hidden !p-0">
      <div className="p-5 border-b border-brand-100 flex items-center justify-between">
        <h3 className="font-display font-bold text-brand-800">{t.nearestMarkets}</h3>
        {loading && <span className="text-xs text-brand-400">Refreshing…</span>}
      </div>

      {error && <p className="p-5 text-sm text-red-600">{error}</p>}

      <div className="h-80 w-full">
        <MapContainer center={[position.lat, position.lng]} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={position.lat} lng={position.lng} />
          <Marker position={[position.lat, position.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
          {markets.map((m) => (
            <Marker key={m.mandiName} position={[m.lat, m.lng]} icon={mandiIcon}>
              <Popup>
                <b>{m.mandiName}</b>
                <br />
                ₹{m.pricePerQuintal}/quintal
                <br />
                {t.netProfit}: ₹{m.netProfitPerQuintal}/quintal
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="divide-y divide-brand-50">
        {markets.map((m, i) => (
          <div key={m.mandiName} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-brand-800">
                {i === 0 && "🏆 "}
                {m.mandiName}
              </p>
              <p className="text-xs text-brand-500">
                {m.district}, {m.state} · {t.distance}: {m.distanceKm ?? "—"} km
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-700">₹{m.pricePerQuintal}/qtl</p>
              <p className="text-xs text-brand-500">
                {t.netProfit}: ₹{m.netProfitPerQuintal}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
