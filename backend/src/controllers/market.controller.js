import { findNearestBestPriceMandis, getLiveMandiPrices } from "../services/mandiPrice.service.js";
import SavedMarket from "../models/SavedMarket.js";

// Adapts the mandi-price service's record shape ({ market, modalPrice, ... })
// to the field names the frontend map/dashboard expects ({ mandiName, pricePerQuintal, ... }).
function toFrontendShape(record) {
  return {
    ...record,
    mandiName: record.mandiName || record.market,
    pricePerQuintal: record.pricePerQuintal ?? record.modalPrice,
  };
}

export async function getNearestBestMarkets(req, res) {
  try {
    const { lat, lng, cropName } = req.query;
    if (!cropName) return res.status(400).json({ message: "cropName is required" });

    const results = await findNearestBestPriceMandis({
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      commodity: cropName,
      limit: 3,
    });
    res.json({ markets: results.map(toFrontendShape) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch markets", error: err.message });
  }
}

export async function getAllPrices(req, res) {
  try {
    const { cropName } = req.query;
    if (!cropName) return res.status(400).json({ message: "cropName is required" });
    const results = await getLiveMandiPrices({ commodity: cropName });
    res.json({ prices: results.map(toFrontendShape) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch prices", error: err.message });
  }
}

export async function saveMarket(req, res) {
  try {
    const saved = await SavedMarket.create({ ...req.body, user: req.user._id });
    res.status(201).json({ savedMarket: saved });
  } catch (err) {
    res.status(500).json({ message: "Failed to save market", error: err.message });
  }
}

export async function listSavedMarkets(req, res) {
  try {
    const markets = await SavedMarket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ markets });
  } catch (err) {
    res.status(500).json({ message: "Failed to list saved markets", error: err.message });
  }
}
