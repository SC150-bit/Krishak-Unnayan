import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Razorpay from 'razorpay';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// AI Assistant Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userPrompt, farmerContext } = req.body;

    const systemInstruction = `
    You are an AI Agricultural Advisor for the Krishak Unnayan Portal.
    Provide precise, actionable farming advice, market insights, and weather recommendations.
    Current Farmer Profile:
    - Name: ${farmerContext?.name || 'Ramesh Kumar'}
    - Location: ${farmerContext?.location || 'Karnal, Haryana'}
    - Active Token: ${farmerContext?.token || 'T-104'}
    - Primary Crops: Wheat, Paddy
    Answer concisely in simple terms.
    `;

    // Access Gemini Model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(userPrompt);
    const response = await result.response;

    res.json({ reply: response.text() });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'AI processing failed. Please try again.' });
  }
});

// Create Payment Order Endpoint (₹30 Subscription / Payments)
app.post('/api/create-payment-order', async (req, res) => {
  try {
    const { amount = 30, currency = 'INR' } = req.body;
    
    const options = {
      amount: amount * 100, // Amount in paise (₹30 = 3000 paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Simulated Nearby Mandi Live Price API
app.get('/api/mandis', (req, res) => {
  res.json([
    { id: 1, name: "Mandi Sector 4, Karnal", distance: "2.4 km", pricePerQuintal: 2275, lat: 29.6857, lng: 76.9905 },
    { id: 2, name: "Gharaunda Grain Market", distance: "14.1 km", pricePerQuintal: 2310, lat: 29.5393, lng: 76.9733 },
    { id: 3, name: "Taraori Mandi", distance: "16.8 km", pricePerQuintal: 2340, lat: 29.8051, lng: 76.9317 }
  ]);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
