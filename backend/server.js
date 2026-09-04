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

// ------------------------------------------------------------------ AI Assistant Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userPrompt, lat, lng, targetLanguage, farmerContext } = req.body;

    const systemInstruction = `
    You are an AI Agricultural & Procurement Advisor for the Krishak Unnayan Portal.
    Provide precise, actionable farming advice, market insights, and weather recommendations.

    Location Context: Lat ${lat || 29.6857}, Lng ${lng || 76.9905}
    Farmer Profile:
    - Name: ${farmerContext?.name || 'Ramesh Kumar'}
    - Location: ${farmerContext?.location || 'Karnal, Haryana'}
    - Active Token: ${farmerContext?.token || 'T-104'}
    - Primary Crops: ${farmerContext?.primaryCrops || 'Wheat, Paddy'}

    CRITICAL INSTRUCTION: Respond entirely in the target language code: "${targetLanguage || 'en'}".
    If targetLanguage is 'hi', respond in Hindi. If 'pa', respond in Punjabi. If 'en', respond in English.
    Always mirror the language used by the user if they speak directly in a specific native dialect.
    Answer concisely in simple terms.
    `;

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

// ------------------------------------------------------------------ Payment Endpoint
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

// ------------------------------------------------------------------ Mandi Data Endpoint
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
