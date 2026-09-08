import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.warn("[db] DATABASE_URL not set — running without a database connection.");
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected");
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    console.warn("[db] Continuing without DB — auth/persistence routes will fail until DATABASE_URL is fixed.");
  }
}
