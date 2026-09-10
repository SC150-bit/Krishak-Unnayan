import React, { useEffect, useState, Component } from "react";
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

class MapErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Map Error Boundary caught an issue:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
          Unable to render interactive map. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], 10);
    }
  }, [lat, lng, map]);
  return null;
}

function MapDashboardContent({ cropName = "Rice", position: propPosition }) {
  const { t } = useLanguage();
  const [position, setPosition] = useState(propPosition || null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Determine initial coordinates from props or Geolocation API
  useEffect(() => {
    if (propPosition?.lat && propPosition?.lng) {
      setPosition(propPosition);
      return;
    }

    let isMounted = true;
    const defaultCoords = { lat: 22.5726, lng: 88.3639 }; // Kolkata coordinates

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isMounted) setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          if (isMounted) setPosition(defaultCoords);
        },
        { timeout: 5000 }
      );
    } else {
      setPosition(defaultCoords);
    }

    return () => {
      isMounted = false;
    };
  }, [propPosition]);

  // Fetch market data with automatic regional fallback
  useEffect(() => {
    if (!position?.lat || !position?.lng) return;
    setLoading(true);
    setError("");

    const fetchMarketsWithFallback = async (lat, lng, isRetry = false) => {
      try {
        const data = await api.getNearestBest(lat, lng, cropName);
        const marketList = Array.isArray(data?.markets)
          ? data.markets
          : Array.isArray(data)
          ? data
          : [];

        if (marketList.length > 0) {
          setMarkets(marketList);
        } else if (!isRetry) {
          // Fallback to central West Bengal procurement hub (Purba Bardhaman) if user location has 0 data
          fetchMarketsWithFallback(23.2324, 87.8615, true);
        } else {
          setMarkets([]);
        }
      } catch (err) {
        if (!isRetry) {
          fetchMarketsWithFallback(23.2324, 87.8615, true);
        } else {
          setError(err.message || "Failed to fetch nearby markets.");
          setMarkets([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMarketsWithFallback(position.lat, position.lng);
  }, [position, cropName]);

  if (!position) {
    return <div className="card p-6 text-brand-700">Locating you…</div>;
  }

  const validMarkets = Array.isArray(markets)
    ? markets.filter((m) => m && typeof m.lat === "number" && typeof m.lng === "number")
    : [];

  return (
    <div className="card overflow-hidden !p-0 border border-brand-100 rounded-2xl bg-white">
      <div className="p-5 border-b border-brand-100 flex items-center justify-between">
        <h3 className="font-display font-bold text-brand-800">
          {t.nearestMarkets || "Nearest Best-Price Markets"} ({cropName})
        </h3>
        {loading && <span className="text-xs text-brand-400 animate-pulse">Refreshing…</span>}
      </div>

      {error && <p className="p-4 text-sm text-red-600 bg-red-50">{error}</p>}

      <div className="h-80 w-full relative z-0">
        <MapContainer center={[position.lat, position.lng]} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={position.lat} lng={position.lng} />

          <Marker position={[position.lat, position.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>

          {validMarkets.map((m, idx) => (
            <Marker key={m.mandiName ? `${m.mandiName}-${idx}` : idx} position={[m.lat, m.lng]} icon={mandiIcon}>
              <Popup>
                <b>{m.mandiName || "Mandi"}</b>
                <br />
                ₹{m.pricePerQuintal ?? "N/A"}/quintal
                <br />
                {t.netProfit || "Net Profit"}: ₹{m.netProfitPerQuintal ?? "N/A"}/quintal
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="divide-y divide-brand-50">
        {validMarkets.map((m, i) => (
          <div key={m.mandiName ? `${m.mandiName}-${i}` : i} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-brand-800">
                {i === 0 && "🏆 "}
                {m.mandiName || "Unknown Mandi"}
              </p>
              <p className="text-xs text-brand-500">
                {m.district || ""}{m.district && m.state ? ", " : ""}{m.state || ""} · {t.distance || "Distance"}: {m.distanceKm ?? "—"} km
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-700">₹{m.pricePerQuintal ?? "—"}/qtl</p>
              <p className="text-xs text-brand-500">
                {t.netProfit || "Net Profit"}: ₹{m.netProfitPerQuintal ?? "—"}
              </p>
            </div>
          </div>
        ))}
        {!loading && validMarkets.length === 0 && !error && (
          <div className="p-4 text-xs text-brand-500 text-center">
            No market data available for {cropName} near this location.
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapDashboard(props) {
  return (
    <MapErrorBoundary>
      <MapDashboardContent {...props} />
    </MapErrorBoundary>
  );
}
