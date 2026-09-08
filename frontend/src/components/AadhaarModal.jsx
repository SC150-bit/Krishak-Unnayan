import { useState } from "react";
import { api } from "../services/api";

function formatAadhaarInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export default function AadhaarModal({ onClose, onVerified }) {
  const [step, setStep] = useState("enter"); // enter -> otp -> done
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);

  const digitsOnly = aadhaar.replace(/\s/g, "");
  const isValidFormat = /^\d{12}$/.test(digitsOnly);

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    if (!isValidFormat) {
      setError("Enter a valid 12-digit Aadhaar number.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.requestAadhaarOtp(digitsOnly);
      setInfo(result);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.verifyAadhaarOtp(digitsOnly, otp);
      setStep("done");
      onVerified?.(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-400 hover:text-brand-700">
          ✕
        </button>
        <h2 className="font-display text-xl font-bold text-brand-800 mb-1">Aadhaar KYC Verification</h2>
        <p className="text-sm text-brand-600 mb-5">
          Verifying your Aadhaar unlocks government procurement slot booking under your real identity.
        </p>

        {step === "enter" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-700 block mb-1">Aadhaar Number</label>
              <input
                className="input-field tracking-widest"
                placeholder="XXXX XXXX XXXX"
                value={aadhaar}
                onChange={(e) => setAadhaar(formatAadhaarInput(e.target.value))}
                inputMode="numeric"
                maxLength={14}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending OTP…" : "Send OTP"}
            </button>
            <p className="text-xs text-brand-400">
              This is a demo flow. In production, Aadhaar verification is performed through a licensed
              UIDAI-authorised KYC provider — never handled directly by the app.
            </p>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-brand-600">{info?.message}</p>
            <div>
              <label className="text-sm font-medium text-brand-700 block mb-1">Enter OTP</label>
              <input
                className="input-field tracking-[0.5em] text-center"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold text-brand-800">Aadhaar verified successfully!</p>
            <button onClick={onClose} className="btn-primary mt-5">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
