import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function PaywallModal({ onClose, featureName }) {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      // 1. Create a Razorpay order on the backend
      const order = await api.createOrder(); // { success, orderId, amount, currency, keyId }

      if (!window.Razorpay) {
        throw new Error("Payment SDK failed to load. Check your internet connection and try again.");
      }

      // 2. Open the real Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Krishak Unnayan",
        description: "Krishak Plus Subscription (30 Days)",
        order_id: order.orderId,
        handler: async function (response) {
          try {
            // 3. Verify the payment signature on the backend
            await api.confirmPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshUser();
            onClose();
          } catch (err) {
            setError(err.message || "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#16a34a" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", (resp) => {
        setError(resp.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });
      paymentObject.open();
    } catch (err) {
      setError(err.message || "Could not initiate payment. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          ✕
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock Krishak Plus 🌾</h2>
        <p className="text-gray-600 mb-4">
          {featureName ? `"${featureName}" is a Krishak Plus feature. ` : ""}
          Get real-time AI advisory, voice support, and the nearest top 3 highest-paying mandi locations.
        </p>
        <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-center border border-emerald-200">
          <span className="text-3xl font-extrabold text-emerald-700">₹30</span>
          <span className="text-gray-600 font-medium"> / month</span>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold shadow-lg shadow-emerald-600/30 disabled:opacity-60"
          >
            {loading ? "Processing…" : "Pay ₹30 Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
