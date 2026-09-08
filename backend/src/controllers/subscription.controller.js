import { createSubscriptionOrder, verifyPaymentSignature } from "../services/payment.service.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

const PLAN_PRICE_INR = 30;

// Get active subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = req.user;
    const active =
      user.subscriptionTier === "premium" &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) > new Date();

    res.json({
      success: true,
      tier: active ? "premium" : "free",
      expiresAt: user.subscriptionExpiresAt || null,
      priceInr: PLAN_PRICE_INR,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch subscription status." });
  }
};

// Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const order = await createSubscriptionOrder(req.user._id);

    await Subscription.create({
      user: req.user._id,
      amountInr: PLAN_PRICE_INR,
      status: "created",
      paymentGatewayOrderId: order.id,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[subscription.controller] createOrder failed:", err.message);
    res.status(500).json({ success: false, message: "Failed to create payment order." });
  }
};

// Verify Razorpay payment signature and activate the subscription
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields." });
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const sub = await Subscription.findOneAndUpdate(
      { paymentGatewayOrderId: razorpay_order_id, user: req.user._id },
      {
        status: "paid",
        paymentGatewayPaymentId: razorpay_payment_id,
        startedAt: new Date(),
        expiresAt,
      },
      { new: true }
    );
    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription order not found." });
    }

    await User.findByIdAndUpdate(req.user._id, {
      subscriptionTier: "premium",
      subscriptionExpiresAt: expiresAt,
    });

    res.json({ success: true, message: "Krishak Plus subscription activated!" });
  } catch (err) {
    console.error("[subscription.controller] verifyPayment failed:", err.message);
    res.status(500).json({ success: false, message: "Payment verification failed." });
  }
};

// Aliases so both route naming styles work
export const createSubscriptionOrderController = createOrder;
export const confirmSubscriptionPayment = verifyPayment;
