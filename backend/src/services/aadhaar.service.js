/**
 * MOCK Aadhaar verification service.
 *
 * In production, replace this with a call to a licensed KYC provider
 * (e.g. a UIDAI-authorised AUA/KUA, DigiLocker "Pull Aadhaar" API, or a
 * vendor like Karza / Signzy / Cashfree Verification). Never handle raw
 * Aadhaar numbers or OTP flows without going through an authorised
 * intermediary — direct UIDAI integration requires special licensing.
 *
 * This mock:
 *  - Validates the 12-digit format (Verhoeff checksum optional).
 *  - "Sends" a mock OTP (always 123456 in dev).
 *  - Confirms verification and returns only a masked number to store.
 */

const OTP_STORE = new Map(); // demo only — use Redis / DB with TTL in production

function isValidAadhaarFormat(aadhaarNumber) {
  return /^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ""));
}

function maskAadhaar(aadhaarNumber) {
  const digits = aadhaarNumber.replace(/\s/g, "");
  return `XXXX XXXX ${digits.slice(-4)}`;
}

export async function requestAadhaarOtp(aadhaarNumber) {
  const clean = aadhaarNumber.replace(/\s/g, "");
  if (!isValidAadhaarFormat(clean)) {
    const err = new Error("Aadhaar number must be exactly 12 digits.");
    err.status = 400;
    throw err;
  }

  // In production: call the KYC provider's OTP endpoint using
  // process.env.AADHAAR_VERIFICATION_API_KEY / AADHAAR_VERIFICATION_BASE_URL.
  const mockOtp = "123456";
  OTP_STORE.set(clean, { otp: mockOtp, expiresAt: Date.now() + 5 * 60 * 1000 });

  return {
    referenceId: `MOCKREF-${clean.slice(-4)}-${Date.now()}`,
    maskedAadhaar: maskAadhaar(clean),
    message: "OTP sent to the mobile number linked with this Aadhaar (mock: use 123456).",
  };
}

export async function verifyAadhaarOtp(aadhaarNumber, otp) {
  const clean = aadhaarNumber.replace(/\s/g, "");
  const record = OTP_STORE.get(clean);

  if (!record || record.expiresAt < Date.now()) {
    const err = new Error("OTP expired or not requested. Please request a new OTP.");
    err.status = 400;
    throw err;
  }

  if (otp !== record.otp) {
    const err = new Error("Incorrect OTP.");
    err.status = 400;
    throw err;
  }

  OTP_STORE.delete(clean);

  return {
    verified: true,
    maskedAadhaar: maskAadhaar(clean),
    verifiedAt: new Date(),
  };
}
