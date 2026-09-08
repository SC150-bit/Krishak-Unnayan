import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Renders Google's official "Sign in with Google" button using
// Google Identity Services (loaded via <script> in index.html).
export default function GoogleSignInButton() {
  const buttonRef = useRef(null);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await loginWithGoogle(response.credential);
          navigate("/dashboard");
        } catch (err) {
          console.error("Google sign-in failed:", err.message);
        }
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 320,
    });
  }, [clientId]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="btn-secondary w-full opacity-60 cursor-not-allowed"
        title="Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable"
      >
        Sign in with Google (needs VITE_GOOGLE_CLIENT_ID)
      </button>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}
