# Krishak Unnayan

A green-and-white web app that helps farmers find the mandi (market) that
actually pays the most after transport, and gives them an AI advisor that
knows their crop and location. Email sign-up/sign-in, gated behind a ₹30/month
"Krishak Plus" subscription for the AI assistant and the best-market finder.

## What's inside

- `server.js` — Express API: auth (JWT + hashed passwords), mandi ranking,
  Gemini-powered chat, Razorpay subscription checkout + verification.
- `public/` — the front end (plain HTML/CSS/JS, no build step). Map is
  rendered with **Leaflet + OpenStreetMap tiles**, which are free and need no
  API key.
- `data/users.json` — a flat-file "database" created automatically on first
  signup.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your environment variables.** Copy `.env.example` to `.env` and fill
   in the values from your own Gemini and Razorpay accounts (the keys you
   already had in your old `_env` file — copy them across, this project
   doesn't read that file):
   ```bash
   cp .env.example .env
   ```
   ```
   PORT=5000
   GEMINI_API_KEY=...
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   JWT_SECRET=some-long-random-string
   ```
   `.env` and `data/users.json` are already in `.gitignore` — never commit
   real keys.

3. **Run it**
   ```bash
   npm start
   ```
   Then open `http://localhost:5000` — the Express server serves both the API
   and the front end, so there's nothing else to start.

## How the "best market" ranking works

Each mandi has a fixed lat/lng and a listed price per quintal (mock data in
`server.js`, in the `MANDIS` array — replace with a real mandi price feed
when you have one). For a given farmer location, the server:

1. Computes distance to each mandi (Haversine formula).
2. Estimates transport cost as `distanceKm × ₹2/km/quintal` (a placeholder —
   tune `TRANSPORT_COST_PER_KM_PER_QUINTAL` in `server.js`).
3. Ranks mandis by **listed price − estimated transport cost**, and returns
   the top 3.

This is what `GET /api/mandis/best?lat=..&lng=..` returns, and what the map
and list on the dashboard show.

## Subscription flow

1. Front end calls `POST /api/payments/create-order` → server creates a ₹30
   Razorpay order.
2. Razorpay Checkout opens client-side.
3. On success, the front end calls `POST /api/payments/verify` with the
   returned order/payment/signature; the server checks the HMAC signature
   against `RAZORPAY_KEY_SECRET` before marking the account subscribed.

`/api/chat` and `/api/mandis/best` are protected by `requireAuth` +
`requireSubscription` middleware; `/api/mandis` (the plain price board) stays
free once signed in.

## Notes / next steps

- Mandi data and prices are mocked — connect a real mandi/eNAM price feed to
  make this live.
- The JSON-file user store is single-process only; move to a real database
  before deploying with more than one server instance.
- Razorpay is in test mode until you swap in live keys — test with Razorpay's
  [test card numbers](https://razorpay.com/docs/payments/payments/test-card-details/).
