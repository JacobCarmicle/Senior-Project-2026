import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { requestGoogleIdToken } from "../../lib/googleIdentity";
import { getApiErrorMessage } from "../../api/errors";
import { Waves } from "../../components/ui/wave-background";

// ── Register Page ─────────────────────────────────────────────────────────────

type Step = "identity" | "password" | "done";

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // form fields
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<Step>("identity");

  // step 1 → 2
  function handleIdentityNext(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!email.trim())    { setError("Email is required."); return; }
    setStep("password");
  }

  // step 2 → submit
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    try {
      await register(email, password, fullName);
      setTimeout(() => { setStep("done"); }, 600);
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed. That email may already be in use."));
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setSubmitting(true);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const idToken = await requestGoogleIdToken(clientId);
      await loginWithGoogle(idToken);
      navigate("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // redirect after success animation
  useEffect(() => {
    if (step === "done") {
      const t = setTimeout(() => navigate("/"), 2200);
      return () => clearTimeout(t);
    }
  }, [step, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center"
         style={{ fontFamily: "'Outfit', Arial, sans-serif" }}>

      {/* ── Wave background ── */}
      <div className="absolute inset-0 z-0">
        <Waves
          backgroundColor="#0a0a0a"
          strokeColor="rgba(34,197,94,0.18)"
          pointerSize={0.5}
        />
        {/* vignette keeps form readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_65%_at_50%_50%,rgba(0,0,0,0.82)_0%,transparent_100%)]" />
      </div>

      {/* ── Top bar ── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 text-[#22c55e] font-black text-lg no-underline">
          <img src="/logo.png" alt="TradeForge"
               style={{ height: 96, filter: "invert(1) hue-rotate(180deg)" }} />
        </a>
        <Link to="/login"
              className="text-sm text-[#8a8a8a] hover:text-[#e8e8e8] transition-colors no-underline">
          Already have an account? <span className="text-[#22c55e] font-bold">Log in</span>
        </Link>
      </header>

      {/* ── Form card ── */}
      <div className="relative z-10 w-full max-w-sm px-4">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Identity ── */}
          {step === "identity" && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              className="space-y-6 text-center"
            >
              <div className="space-y-1">
                <h1 className="text-[2.2rem] font-black leading-tight tracking-tight text-white">
                  Create an account
                </h1>
                <p className="text-base text-white/50 font-light">
                  Buy and sell locally with TradeForge.
                </p>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 rounded-full py-3 px-4 border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm transition-colors disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31.9 34c-2.1 1.4-4.8 2-7.9 2-5.2 0-9.6-2.9-11.4-7.2l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 5.9l5.6 4.9C40.5 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 text-left">
                  {error}
                </div>
              )}

              <form onSubmit={handleIdentityNext} className="space-y-3">
                <div className="relative">
                  <input
                    type="text" required
                    placeholder="Full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-full py-3 px-5 bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#22c55e]/60 focus:bg-white/8 transition-colors"
                  />
                </div>
                <div className="relative">
                  <input
                    type="email" required
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-full py-3 px-5 bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#22c55e]/60 focus:bg-white/8 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 w-9 h-9 rounded-full bg-[#22c55e] hover:bg-[#16a34a] flex items-center justify-center transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </form>

              <p className="text-xs text-white/25">
                By creating an account you agree to our{" "}
                <a href="#" className="underline text-white/35 hover:text-white/55 transition-colors">Terms</a>{" "}
                and{" "}
                <a href="#" className="underline text-white/35 hover:text-white/55 transition-colors">Privacy Policy</a>.
              </p>
            </motion.div>
          )}

          {/* ── Step 2: Password ── */}
          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              className="space-y-6 text-center"
            >
              <div className="space-y-1">
                <h1 className="text-[2.2rem] font-black leading-tight tracking-tight text-white">
                  Set your password
                </h1>
                <p className="text-base text-white/50 font-light">
                  Welcome, <span className="text-[#22c55e] font-semibold">{fullName.split(" ")[0]}</span>. Almost there.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 text-left">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="password" required
                  placeholder="Password (min. 8 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-full py-3 px-5 bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#22c55e]/60 transition-colors"
                />
                <input
                  type="password" required
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full rounded-full py-3 px-5 bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#22c55e]/60 transition-colors"
                />

                <div className="flex gap-3 pt-1">
                  <motion.button
                    type="button"
                    onClick={() => { setStep("identity"); setError(""); }}
                    className="w-[38%] rounded-full py-3 border border-white/10 bg-white/5 text-white/60 text-sm font-semibold hover:bg-white/10 hover:text-white transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={submitting || !password || !confirm}
                    className="flex-1 rounded-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {submitting ? "Creating account…" : "Create Account"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-1">
                <h1 className="text-[2.5rem] font-black leading-tight tracking-tight text-white">
                  You're in!
                </h1>
                <p className="text-base text-white/50 font-light">
                  Welcome to TradeForge, {fullName.split(" ")[0]}.
                </p>
              </div>

              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
                className="flex justify-center py-6"
              >
                <div className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-sm text-white/30"
              >
                Redirecting to marketplace…
              </motion.p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
