import { getAssistantReply } from "../services/llm.service.js";
import { findNearestBestPriceMandis } from "../services/mandiPrice.service.js";

export async function chat(req, res) {
  try {
    const { messages, cropName, commodity, lat, lng, language, state } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "messages array is required" });
    }

    const crop = cropName || commodity;
    let context = `User's preferred language: ${language || "en"}. Location State: ${state || "India"}.`;

    if (crop) {
      const markets = await findNearestBestPriceMandis({ lat, lng, commodity: crop, limit: 3 });
      
      if (markets.length > 0) {
        const marketDetails = markets
          .map((m) => `${m.market || m.mandiName} (Modal Price: ₹${m.modalPrice || m.pricePerQuintal}/q, Net Profit: ₹${m.netProfitPerQuintal}/q)`)
          .join("; ");
        context += ` Target Crop: ${crop}. Top nearby mandis by net profit: ${marketDetails}.`;
      }
    }

    const reply = await getAssistantReply({ messages, context });
    
    return res.json({ success: true, reply });
  } catch (err) {
    console.error("[chat.controller] Error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Assistant failed to respond", 
      error: process.env.NODE_ENV === "development" ? err.message : undefined 
    });
  }
}