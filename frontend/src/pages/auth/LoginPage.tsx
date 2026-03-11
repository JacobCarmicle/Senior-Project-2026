import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { requestGoogleIdToken } from "../../lib/googleIdentity";
import { getApiErrorMessage } from "../../api/errors";
import AuthLayout from "../../components/AuthLayout";
import HeroPanel from "../../components/HeroPanel";

const HERO_FEATURES = [
  {
    title: "Message sellers securely",
    description: "Keep everything in-app and tied to each listing.",
  },
  {
    title: "Save listings for later",
    description: "Bookmark items and come back anytime.",
  },
  {
    title: "Schedule meetups",
    description: "Propose a time slot and confirm in one place.",
  },
];

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleLogin() {
    setError("");
    setSubmitting(true);

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const idToken = await requestGoogleIdToken(clientId);
      await loginWithGoogle(idToken);
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <HeroPanel
        heading="Welcome back 👋"
        subtext="Log in to message sellers, save listings, schedule meetups, and receive alerts."
        features={HERO_FEATURES}
        tip="Tip: Use Google sign-in for faster access."
      />

      <section className="overflow-hidden rounded-2xl border border-[#404040] bg-[#1a1a1a] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <h2 className="mb-1.5 text-xl font-bold">Login</h2>
        <p className="mb-4 text-sm leading-snug text-[#9ca3af]">
          Enter your email and password to continue.
        </p>

        {error && (
          <div className="mb-3 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] px-3 py-2.5 text-sm font-bold text-[#ef4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 text-[#e5e5e5] outline-none placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
            />
          </div>

          <div className="my-2 mb-3.5 flex items-center justify-between gap-2.5 text-sm text-[#9ca3af]">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-[#22c55e]"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="font-bold text-[#22c55e] no-underline hover:text-[#16a34a]"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mb-2.5 w-full rounded-xl border border-[#22c55e] bg-[#22c55e] p-3 font-extrabold text-white transition-colors hover:bg-[#16a34a] disabled:opacity-60"
          >
            {submitting ? "Logging in…" : "Log In"}
          </button>

          <div className="my-3 flex items-center gap-2.5 text-sm text-[#9ca3af]">
            <span className="h-px flex-1 bg-[#404040]" />
            or
            <span className="h-px flex-1 bg-[#404040]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 font-extrabold text-[#e5e5e5] transition-colors hover:bg-[#3d3d3d] disabled:opacity-60"
          >
            Continue with Google
          </button>

          <p className="mt-3.5 text-center text-sm text-[#9ca3af]">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-extrabold text-[#22c55e] no-underline hover:text-[#16a34a]"
            >
              Create one
            </Link>
          </p>
        </form>
      </section>
    </AuthLayout>
  );
}
