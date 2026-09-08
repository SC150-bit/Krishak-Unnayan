import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-brand-800 mb-1">Welcome back</h1>
        <p className="text-sm text-brand-500 mb-6">Sign in to manage your procurement slots.</p>

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
            type="email"
            required
            placeholder="Email"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-brand-500 mt-6 text-center">
          New here?{" "}
          <Link to="/signup" className="text-brand-700 font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
