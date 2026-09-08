import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

const CROPS = ["Wheat", "Rice", "Paddy", "Maize", "Potato", "Mustard", "Sugarcane", "Cotton"];
const STATES = ["Haryana", "West Bengal", "Punjab", "Uttar Pradesh", "Maharashtra", "Bihar", "Delhi"];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    state: "Haryana",
    city: "",
    primaryCrop: "Wheat",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-brand-800 mb-1">Create your account</h1>
        <p className="text-sm text-brand-500 mb-6">Join Krishak Unnayan — it's free to start.</p>

        <div className="mb-5">
          <GoogleSignInButton />
        </div>
        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-brand-100 flex-1" />
          <span className="text-xs text-brand-400">OR</span>
          <div className="h-px bg-brand-100 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Full name"
            className="input-field"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <input
            type="email"
            required
            placeholder="Email"
            className="input-field"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            className="input-field"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field" value={form.state} onChange={(e) => update("state", e.target.value)}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              placeholder="City / District"
              className="input-field"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <select className="input-field" value={form.primaryCrop} onChange={(e) => update("primaryCrop", e.target.value)}>
            {CROPS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-brand-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
