import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Blocks access unless the user has an active premium subscription.
// Used for the AI Assistant and Nearest-Best-Price Market Finder.
export function requirePremium(req, res, next) {
  const user = req.user;
  const active =
    user.subscriptionTier === "premium" &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date();

  if (!active) {
    return res.status(402).json({
      message: "This feature requires a Krishak Plus subscription (₹30/month).",
      code: "PREMIUM_REQUIRED",
    });
  }
  next();
}
