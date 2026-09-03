import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Razorpay from 'razorpay';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables before initializing SDKs
dotenv.config({ path: path.join(__dirname, '.env') });

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SDKs
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Helper functions
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8') || '[]');
}
function writeUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readBookings() {
  if (!fs.existsSync(BOOKINGS_FILE)) return [];
  return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8') || '[]');
}
function writeBookings(bookings) {
  fs.mkdirSync(path.dirname(BOOKINGS_FILE), { recursive: true });
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    location: u.location,
    primaryCrops: u.primaryCrops,
    isSubscribed: !!u.isSubscribed,
  };
}

// Auth middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readUsers();
    const user = users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ error: 'Session expired. Sign in again.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Sign in again.' });
  }
}

function requireSubscription(req, res, next) {
  if (!req.user.isSubscribed) {
    return res.status(402).json({ error: 'This feature needs the ₹30 Krishak Plus plan.', code: 'SUBSCRIPTION_REQUIRED' });
  }
  next();
}

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, location, primaryCrops } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: `u_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      name,
      email,
      passwordHash,
      location: location || 'Karnal, Haryana',
      primaryCrops: primaryCrops || 'Wheat, Paddy',
      isSubscribed: false,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeUsers(users);
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Could not sign in. Please try again.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Mandi Data & Schedules
const MANDIS = [
  { id: 1, name: 'Mandi Sector 4, Karnal', lat: 29.6857, lng: 76.9905, pricePerQuintal: 2275, capacityPerSlot: 15, currentServingToken: 12 },
  { id: 2, name: 'Gharaunda Grain Market', lat: 29.5393, lng: 76.9733, pricePerQuintal: 2310, capacityPerSlot: 20, currentServingToken: 8 },
  { id: 3, name: 'Taraori Mandi', lat: 29.8051, lng: 76.9317, pricePerQuintal: 2340, capacityPerSlot: 10, currentServingToken: 15 },
  { id: 4, name: 'Panipat Anaj Mandi', lat: 29.3909, lng: 76.9635, pricePerQuintal: 2260, capacityPerSlot: 25, currentServingToken: 5 },
  { id: 5, name: 'Kaithal Grain Market', lat: 29.8021, lng: 76.3998, pricePerQuintal: 2390, capacityPerSlot: 12, currentServingToken: 18 },
  { id: 6, name: 'Assandh Mandi', lat: 29.5350, lng: 76.8330, pricePerQuintal: 2298, capacityPerSlot: 18, currentServingToken: 3 },
];

const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM'
];

const TRANSPORT_COST_PER_KM_PER_QUINTAL = 2;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function rankMandis(lat, lng) {
  return MANDIS.map((m) => {
    const distanceKm = haversineKm(lat, lng, m.lat, m.lng);
    const transportCost = distanceKm * TRANSPORT_COST_PER_KM_PER_QUINTAL;
    const netPerQuintal = m.pricePerQuintal - transportCost;
    return {
      ...m,
      distanceKm: Math.round(distanceKm * 10) / 10,
      transportCostPerQuintal: Math.round(transportCost),
      netPerQuintal: Math.round(netPerQuintal),
    };
  }).sort((a, b) => b.netPerQuintal - a.netPerQuintal);
}

app.get('/api/mandis', (req, res) => {
  res.json(MANDIS.map((m) => ({ ...m, availableSlots: TIME_SLOTS })));
});

app.get('/api/mandis/best', requireAuth, requireSubscription, (req, res) => {
  const lat = parseFloat(req.query.lat) || 29.6857;
  const lng = parseFloat(req.query.lng) || 76.9905;
  const ranked = rankMandis(lat, lng);
  res.json({ origin: { lat, lng }, results: ranked.slice(0, 3), costAssumption: TRANSPORT_COST_PER_KM_PER_QUINTAL });
});

// Procurement Slot Booking
app.post('/api/bookings/book', requireAuth, (req, res) => {
  try {
    const { mandiId, date, timeSlot, crop, quantityQuintals } = req.body;
    if (!mandiId || !date || !timeSlot || !crop || !quantityQuintals) {
      return res.status(400).json({ error: 'All fields (mandi, date, slot, crop, quantity) are required.' });
    }

    const mandi = MANDIS.find((m) => m.id === parseInt(mandiId));
    if (!mandi) return res.status(404).json({ error: 'Selected Mandi not found.' });

    const bookings = readBookings();
    
    const slotBookings = bookings.filter((b) => b.mandiId === mandi.id && b.date === date && b.timeSlot === timeSlot);
    const tokenNum = slotBookings.length + 101;
    const token = `TOK-${mandi.name.split(' ')[0].toUpperCase()}-${tokenNum}`;

    const newBooking = {
      id: `bk_${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      mandiId: mandi.id,
      mandiName: mandi.name,
      date,
      timeSlot,
      crop,
      quantityQuintals: parseFloat(quantityQuintals),
      token,
      tokenNumber: tokenNum,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    writeBookings(bookings);

    res.status(201).json({
      message: 'Procurement slot successfully booked!',
      booking: newBooking
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Could not complete slot booking.' });
  }
});

app.get('/api/bookings/my-queue', requireAuth, (req, res) => {
  try {
    const bookings = readBookings();
    const userBookings = bookings.filter((b) => b.userId === req.user.id);

    const enrichedBookings = userBookings.map((b) => {
      const mandi = MANDIS.find((m) => m.id === b.mandiId) || {};
      const currentServing = mandi.currentServingToken || 100;
      const tokensAhead = Math.max(0, b.tokenNumber - currentServing);
      const estimatedWaitMins = tokensAhead * 12;

      return {
        ...b,
        liveQueue: {
          currentServingToken: `TOK-${mandi.name ? mandi.name.split(' ')[0].toUpperCase() : 'MND'}-${currentServing}`,
          tokensAhead,
          estimatedWaitMins,
          queueStatus: tokensAhead === 0 ? 'NOW SERVING' : tokensAhead <= 2 ? 'READY IN QUEUE' : 'WAITING'
        }
      };
    });

    res.json({ bookings: enrichedBookings });
  } catch (err) {
    console.error('Queue fetch error:', err);
    res.status(500).json({ error: 'Could not fetch live queue details.' });
  }
});

app.post('/api/bookings/send-sms', requireAuth, (req, res) => {
  const { bookingId } = req.body;
  const bookings = readBookings();
  const booking = bookings.find((b) => b.id === bookingId && b.userId === req.user.id);

  if (!booking) return res.status(404).json({ error: 'Booking record not found.' });

  res.json({
    success: true,
    smsText: `[SMS SENT to ${req.user.name}] Alert: Your procurement slot at ${booking.mandiName} for Token ${booking.token} is approaching. Estimated arrival in 15 minutes.`
  });
});

// AI Assistant
app.post('/api/chat', requireAuth, requireSubscription, async (req, res) => {
  try {
    if (!genAI) return res.status(503).json({ error: 'AI assistant is not configured on this server yet.' });
    
    const userPrompt = req.body.userPrompt || req.body.message;
    if (!userPrompt) return res.status(400).json({ error: 'Message cannot be empty.' });

    const lat = parseFloat(req.body.lat) || 29.6857;
    const lng = parseFloat(req.body.lng) || 76.9905;
    const bestMandis = rankMandis(lat, lng).slice(0, 3);
    const mandiSummary = bestMandis
      .map((m) => `${m.name}: ₹${m.pricePerQuintal}/quintal, ${m.distanceKm} km away, ~₹${m.netPerQuintal}/quintal after transport`)
      .join('\n');

    const systemInstruction = `
You are the AI Agricultural Advisor inside the Krishak Unnayan portal.
Give precise, actionable advice on farming practices, market timing, procurement slot schedules, and where to sell.
Current Farmer Profile:
- Name: ${req.user.name}
- Location: ${req.user.location}
- Primary Crops: ${req.user.primaryCrops}

Nearby mandi options ranked by net return:
${mandiSummary}

Answer concisely, in simple language a farmer can act on immediately.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash', systemInstruction });
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'AI processing failed. Please try again.' });
  }
});

// Razorpay Integration
app.post('/api/payments/create-order', requireAuth, async (req, res) => {
  try {
    const amount = 30;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${req.user.id}_${Date.now()}`,
    });
    res.json({ order, keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy' });
  } catch (err) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ error: 'Could not start the payment. Please try again.' });
  }
});

app.post('/api/payments/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details.' });
    }
    const crypto = await import('crypto');
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment could not be verified.' });
    }

    const users = readUsers();
    const idx = users.findIndex((u) => u.id === req.user.id);
    users[idx].isSubscribed = true;
    users[idx].subscribedAt = new Date().toISOString();
    writeUsers(users);

    res.json({ user: publicUser(users[idx]) });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Could not verify payment.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Krishak Unnayan backend running on port ${PORT}`));