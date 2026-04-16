import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/auth";
import { getApiErrorMessage } from "../../api/errors";
import AuthLayout from "../../components/AuthLayout";
import HeroPanel from "../../components/HeroPanel";

const HERO_FEATURES = [
  {
    title: "Choose a strong password",
    description: "Use at least 8 characters with a mix of letters and numbers.",
  },
  {
    title: "Keep it unique",
    description: "Don't reuse passwords from other sites.",
  },
  {
    title: "You're almost there",
    description: "Set your new password and you'll be back in action.",
  },
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (!token) {
      setError("Invalid or expired reset link.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Reset failed. The link may have expired."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <HeroPanel
        heading="Set a new password 🔒"
        subtext="Choose a new password for your TradeForge account."
        features={HERO_FEATURES}
      />

      <section className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161616] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        {success ? (
          <div>
            <h2 className="mb-2 text-xl font-bold">Password updated!</h2>
            <p className="mb-4 leading-relaxed text-[#8a8a8a]">
              Your password has been reset successfully. You can now log in with your new
              credentials.
            </p>

            <Link
              to="/login"
              className="mb-2.5 block w-full rounded-xl border border-[#22c55e] bg-[#22c55e] p-3 text-center font-extrabold text-white no-underline transition-colors hover:bg-[#16a34a]"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mb-1.5 text-xl font-bold">Reset Password</h2>
            <p className="mb-4 text-sm leading-snug text-[#8a8a8a]">
              Enter your new password below.
            </p>

            {error && (
              <div className="mb-3 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] px-3 py-2.5 text-sm font-bold text-[#ef4444]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="password" className="mb-1.5 block text-sm font-bold">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#111] p-3 text-[#e5e5e5] outline-none placeholder:text-[#8a8a8a] focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-bold">
                  Confirm New Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#111] p-3 text-[#e5e5e5] outline-none placeholder:text-[#8a8a8a] focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mb-2.5 w-full rounded-xl border border-[#22c55e] bg-[#22c55e] p-3 font-extrabold text-white transition-colors hover:bg-[#16a34a] disabled:opacity-60"
              >
                {submitting ? "Resetting…" : "Reset Password"}
              </button>

              <p className="mt-3.5 text-center text-sm text-[#8a8a8a]">
                <Link
                  to="/login"
                  className="font-extrabold text-[#22c55e] no-underline hover:text-[#16a34a]"
                >
                  Back to login
                </Link>
              </p>
            </form>
          </>
        )}
      </section>
    </AuthLayout>
  );
}
