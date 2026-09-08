const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("ku_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  googleAuth: (credential) => request("/auth/google", { method: "POST", body: { credential }, auth: false }),
  me: () => request("/auth/me"),
  requestAadhaarOtp: (aadhaarNumber) => request("/auth/aadhaar/request-otp", { method: "POST", body: { aadhaarNumber } }),
  verifyAadhaarOtp: (aadhaarNumber, otp) => request("/auth/aadhaar/verify-otp", { method: "POST", body: { aadhaarNumber, otp } }),

  // Profile
  updateProfile: (payload) => request("/users/me", { method: "PATCH", body: payload }),

  // Markets
  getAllPrices: (cropName) => request(`/markets/prices?cropName=${encodeURIComponent(cropName)}`, { auth: false }),
  getNearestBest: (lat, lng, cropName) =>
    request(`/markets/nearest-best?lat=${lat}&lng=${lng}&cropName=${encodeURIComponent(cropName)}`),
  saveMarket: (payload) => request("/markets/saved", { method: "POST", body: payload }),
  listSavedMarkets: () => request("/markets/saved"),

  // AI
  chat: (payload) => request("/ai/chat", { method: "POST", body: payload }),

  // Subscription
  subscriptionStatus: () => request("/subscription/status"),
  createOrder: () => request("/subscription/order", { method: "POST" }),
  confirmPayment: (payload) => request("/subscription/confirm", { method: "POST", body: payload }),
};

export function saveToken(token) {
  localStorage.setItem("ku_token", token);
}
export function clearToken() {
  localStorage.removeItem("ku_token");
}
