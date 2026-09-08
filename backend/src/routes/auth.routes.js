import { Router } from "express";
import {
  signup,
  login,
  googleAuth,
  me,
  requestAadhaarOtpHandler,
  verifyAadhaarOtpHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", requireAuth, me);

router.post("/aadhaar/request-otp", requireAuth, requestAadhaarOtpHandler);
router.post("/aadhaar/verify-otp", requireAuth, verifyAadhaarOtpHandler);

export default router;
