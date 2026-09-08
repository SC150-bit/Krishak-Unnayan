import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getSubscriptionStatus,
  createOrder,
  verifyPayment,
  confirmSubscriptionPayment,
} from "../controllers/subscription.controller.js";

const router = Router();

router.get("/status", requireAuth, getSubscriptionStatus);

// Razorpay Order routes
router.post("/order", requireAuth, createOrder);
router.post("/create-order", requireAuth, createOrder);

// Payment Verification routes
router.post("/confirm", requireAuth, confirmSubscriptionPayment);
router.post("/verify-payment", requireAuth, verifyPayment);

export default router;