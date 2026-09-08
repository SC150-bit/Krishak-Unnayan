import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["premium"], default: "premium" },
    amountInr: { type: Number, default: 30 },
    status: { type: String, enum: ["created", "paid", "failed", "cancelled"], default: "created" },
    paymentGatewayOrderId: { type: String },
    paymentGatewayPaymentId: { type: String },
    startedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
