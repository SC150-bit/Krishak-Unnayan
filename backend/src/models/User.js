import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // absent for Google-only accounts
    googleId: { type: String },
    phone: { type: String },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    preferredLanguage: { type: String, default: "en" },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    primaryCrop: { type: String, default: "" },

    // Aadhaar KYC
    aadhaarNumberMasked: { type: String, default: "" }, // only last 4 digits stored, e.g. "XXXX XXXX 1234"
    aadhaarVerified: { type: Boolean, default: false },
    aadhaarVerifiedAt: { type: Date },

    // Subscription
    subscriptionTier: { type: String, enum: ["free", "premium"], default: "free" },
    subscriptionExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
