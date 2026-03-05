import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { googleOAuth } from "../../api/auth";
import AuthLayout from "../../components/AuthLayout";
import HeroPanel from "../../components/HeroPanel";

const HERO_FEATURES = [
  {
    title: "List items in seconds",
    description: "Add photos, a description, and set your price.",
  },
  {
    title: "Connect with local buyers",
    description: "All transactions happen face-to-face — no shipping hassle.",
  },
  {
    title: "Build your reputation",
    description: "Earn reviews and let your track record speak for itself.",
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSignup() {
    // TODO: integrate Google Identity Services to get the credential token,
    // then POST it to /auth/oauth/google via googleOAuth(token)
    void googleOAuth;
    setError("Google sign-in is not yet configured.");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, fullName);
      navigate("/");
    } catch {
      setError("Registration failed. That email may already be in use.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <HeroPanel
        heading="Join TradeForge 🚀"
        subtext="Create a free account to start buying and selling with people in your area."
        features={HERO_FEATURES}
        tip="Already have an account? Sign in from the login page."
      />

      <section className="overflow-hidden rounded-2xl border border-[#404040] bg-[#1a1a1a] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <h2 className="mb-1.5 text-xl font-bold">Create Account</h2>
        <p className="mb-4 text-sm leading-snug text-[#9ca3af]">
          Fill in your details to get started.
        </p>

        {error && (
          <div className="mb-3 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] px-3 py-2.5 text-sm font-bold text-[#ef4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-bold">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 text-[#e5e5e5] outline-none placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 text-[#e5e5e5] outline-none placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="mb-1.5 block text-sm font-bold">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 text-[#e5e5e5] outline-none placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-bold">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 text-[#e5e5e5] outline-none placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mb-2.5 w-full rounded-xl border border-[#22c55e] bg-[#22c55e] p-3 font-extrabold text-white transition-colors hover:bg-[#16a34a] disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>

          <div className="my-3 flex items-center gap-2.5 text-sm text-[#9ca3af]">
            <span className="h-px flex-1 bg-[#404040]" />
            or
            <span className="h-px flex-1 bg-[#404040]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 font-extrabold text-[#e5e5e5] transition-colors hover:bg-[#3d3d3d]"
          >
            Continue with Google
          </button>

          <p className="mt-3.5 text-center text-sm text-[#9ca3af]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-extrabold text-[#22c55e] no-underline hover:text-[#16a34a]"
            >
              Log in
            </Link>
          </p>
        </form>
      </section>
    </AuthLayout>
  );
}
