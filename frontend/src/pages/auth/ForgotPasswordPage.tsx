import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";
import { getApiErrorMessage } from "../../api/errors";
import AuthLayout from "../../components/AuthLayout";
import HeroPanel from "../../components/HeroPanel";

const HERO_FEATURES = [
  {
    title: "Secure reset link",
    description: "We'll send a one-time link to your registered email.",
  },
  {
    title: "Fast turnaround",
    description: "Most emails arrive within a minute.",
  },
  {
    title: "Need more help?",
    description: "Contact support if you can't access your email.",
  },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <HeroPanel
        heading="Reset your password 🔑"
        subtext="Enter the email address associated with your account and we'll send you a link to reset your password."
        features={HERO_FEATURES}
      />

      <section className="overflow-hidden rounded-2xl border border-[#404040] bg-[#1a1a1a] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        {submitted ? (
          <div>
            <h2 className="mb-2 text-xl font-bold">Check your email</h2>
            <p className="mb-4 leading-relaxed text-[#9ca3af]">
              If an account exists for <strong className="text-[#e5e5e5]">{email}</strong>, we've
              sent a password reset link. Check your inbox and spam folder.
            </p>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mb-2.5 w-full rounded-xl border border-[#404040] bg-[#2d2d2d] p-3 font-extrabold text-[#e5e5e5] transition-colors hover:bg-[#3d3d3d]"
            >
              Send again
            </button>

            <p className="mt-3.5 text-center text-sm text-[#9ca3af]">
              <Link
                to="/login"
                className="font-extrabold text-[#22c55e] no-underline hover:text-[#16a34a]"
              >
                Back to login
              </Link>
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-1.5 text-xl font-bold">Forgot Password</h2>
            <p className="mb-4 text-sm leading-snug text-[#9ca3af]">
              Enter your email and we'll send a reset link.
            </p>

            {error && (
              <div className="mb-3 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] px-3 py-2.5 text-sm font-bold text-[#ef4444]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
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

              <button
                type="submit"
                disabled={submitting}
                className="mb-2.5 w-full rounded-xl border border-[#22c55e] bg-[#22c55e] p-3 font-extrabold text-white transition-colors hover:bg-[#16a34a] disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send Reset Link"}
              </button>

              <p className="mt-3.5 text-center text-sm text-[#9ca3af]">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-extrabold text-[#22c55e] no-underline hover:text-[#16a34a]"
                >
                  Log in
                </Link>
              </p>
            </form>
          </>
        )}
      </section>
    </AuthLayout>
  );
}
