import { Router } from "express";
import { requireAuth, requirePremium } from "../middleware/auth.js";
import { chat } from "../controllers/ai.controller.js";

const router = Router();

// Premium: AI assistant
router.post("/chat", requireAuth, requirePremium, chat);

export default router;
