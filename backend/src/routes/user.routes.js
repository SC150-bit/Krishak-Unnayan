import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const allowed = ["name", "phone", "state", "city", "preferredLanguage", "primaryCrop", "location"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-passwordHash");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

export default router;
