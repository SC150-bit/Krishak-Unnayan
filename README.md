# Krishak Unnayan (कृषक उन्नयन) — Zero-Wait Mandi Procurement & AI Advisor

A full-stack web app that helps farmers book procurement slots, track live
mandi queues, find the highest-paying nearby market for their crop, and get
multilingual, voice-enabled AI advisory — built for the SIH-style "Farmers
often face long waiting times, lack of information regarding procurement
schedules, and uncertainty about procurement status" problem statement
(Ministry of Consumer Affairs, Food & Public Distribution / DoCA).

## Structure

```
KU/
├── backend/     Node.js + Express API (MongoDB via Mongoose)
└── frontend/    React (Vite) + Tailwind CSS + Leaflet
```

## Features implemented

- Email/password auth (JWT) + Google Sign-In (Google Identity Services)
- Aadhaar KYC mock flow: 12-digit format validation → mock OTP → verified
  badge (masked number only is stored — see `backend/src/services/aadhaar.service.js`
  for notes on swapping in a licensed UIDAI/DigiLocker provider)
- ₹30/month "Krishak Plus" subscription paywall gating the AI Assistant and
  the Nearest Best-Price Market Finder (mock payment flow — swap in Razorpay/
  Cashfree in `backend/src/services/payment.service.js`)
- Interactive Leaflet + OpenStreetMap dashboard showing the user's location
  and the 3 closest mandis ranked by **net profit** (price minus estimated
  transport cost)
- AI chat assistant (Anthropic Claude or OpenAI, pluggable) with:
  - Live/mocked mandi price context injected into the system prompt
  - Voice input (Web Speech API `SpeechRecognition`)
  - Voice output (Web Speech API `speechSynthesis`) in the user's spoken language
- Auto language detection from the farmer's state (English/Hindi/Bengali
  shipped fully; add more languages by extending
  `frontend/src/data/languages.js`)
- Procurement slot booking UI + simulated live queue token screen

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in the values you have; app runs with sensible fallbacks
npm install
npm run dev                # http://localhost:5000
```

Notes on `.env`:
- `DATABASE_URL` — a MongoDB connection string (local `mongodb://localhost:27017/krishak_unnayan`
  or an Atlas URI). Without it the server still boots but persistence (signup/login) won't work.
- `JWT_SECRET` — any long random string, required for auth to work.
- `LLM_API_KEY` — an Anthropic or OpenAI key. Without it, the AI Assistant
  replies with a friendly demo message instead of calling out to a real LLM.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
  (OAuth consent screen + Web application credentials) to enable Google Sign-In.
- `AADHAAR_VERIFICATION_API_KEY` / `PAYMENT_GATEWAY_KEY` — left blank on
  purpose; both flows run in mock mode until you wire in a real vendor.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` (same client ID as the
backend) to activate the real Google Sign-In button; otherwise it renders
disabled with a note.

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so the two
apps talk to each other with zero extra config in development.

### 3. Try it

1. Sign up (or use "Sign in with Google" once configured) — pick your state
   and primary crop.
2. From the Dashboard, book a procurement slot and check the live queue tab
   — both are free.
3. Click "Best Markets" or "AI Assistant" to hit the paywall, then upgrade
   (mock payment, instantly activates Krishak Plus for 30 days).
4. On the map, see your 3 nearest mandis ranked by net profit after
   transport cost. On the AI tab, tap the mic and ask a question out loud —
   Krishak Sahayak replies in text and speaks the answer back in your
   selected language.

## Production hardening checklist

- ~~Basic rate limiting and security headers~~ — done: `helmet` is applied
  globally, a generous rate limit covers all of `/api`, and tighter limits
  sit on `/api/auth` (20 req/15min, guards against credential stuffing and
  OTP spam) and `/api/ai` (15 req/min, guards LLM cost). Tune the numbers
  in `backend/src/server.js` for your real traffic.
- Replace the mock Aadhaar service with a licensed KYC/DigiLocker integration.
- Replace the mock payment service with Razorpay/Cashfree and verify webhook
  signatures server-side.
- Move the Web Speech API STT/TTS to a server-side provider (Whisper API /
  Google Speech-to-Text / ElevenLabs) if you need consistent quality across
  browsers — Web Speech API support varies (best in Chrome/Edge).
- Wire `mandiPrice.service.js` to the live data.gov.in Agmarknet API using
  `MANDI_DATA_API_KEY`.
- Add rate limiting, input sanitization, and HTTPS/HSTS before going live.
- Add a real SMS provider (e.g. MSG91/Twilio) for the "15 minutes away" queue alert.
