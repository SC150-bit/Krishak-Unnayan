import { Router } from "express";
import { requireAuth, requirePremium } from "../middleware/auth.js";
import {
  getNearestBestMarkets,
  getAllPrices,
  saveMarket,
  listSavedMarkets,
} from "../controllers/market.controller.js";

const router = Router();

// Free: general/all mandi price board
router.get("/prices", getAllPrices);

// Premium: nearest-best-price market finder
router.get("/nearest-best", requireAuth, requirePremium, getNearestBestMarkets);

router.post("/saved", requireAuth, saveMarket);
router.get("/saved", requireAuth, listSavedMarkets);

export default router;
