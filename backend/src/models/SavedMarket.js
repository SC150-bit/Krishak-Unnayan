import mongoose from "mongoose";

const savedMarketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mandiName: { type: String, required: true },
    state: { type: String },
    district: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    lastKnownPricePerQuintal: { type: Number },
    cropName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("SavedMarket", savedMarketSchema);
