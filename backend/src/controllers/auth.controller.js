import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { requestAadhaarOtp, verifyAadhaarOtp } from "../services/aadhaar.service.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    state: user.state,
    city: user.city,
    preferredLanguage: user.preferredLanguage,
    primaryCrop: user.primaryCrop,
    aadhaarVerified: user.aadhaarVerified,
    aadhaarNumberMasked: user.aadhaarNumberMasked,
    subscriptionTier: user.subscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(req, res) {
  try {
    const { name, email, password, state, city, primaryCrop } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, state, city, primaryCrop });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user._id);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

export async function googleAuth(req, res) {
  try {
    const { credential } = req.body; // Google Identity Services ID token
    if (!credential) return res.status(400).json({ message: "Missing Google credential" });
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured on the server" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed", error: err.message });
  }
}

export async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}

export async function requestAadhaarOtpHandler(req, res) {
  try {
    const { aadhaarNumber } = req.body;
    const result = await requestAadhaarOtp(aadhaarNumber);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function verifyAadhaarOtpHandler(req, res) {
  try {
    const { aadhaarNumber, otp } = req.body;
    const result = await verifyAadhaarOtp(aadhaarNumber, otp);

    req.user.aadhaarVerified = true;
    req.user.aadhaarNumberMasked = result.maskedAadhaar;
    req.user.aadhaarVerifiedAt = result.verifiedAt;
    await req.user.save();

    res.json({ message: "Aadhaar verified successfully", user: toPublicUser(req.user) });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}
