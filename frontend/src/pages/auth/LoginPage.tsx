import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { preloadGoogleIdentity, requestGoogleIdToken } from "../../lib/googleIdentity";
import { getApiErrorMessage } from "../../api/errors";
import { Waves } from "../../components/ui/wave-background";

// ── Design tokens (same as rest of app) ──────────────────────────────────────
const T = {
  card:    "#161616",
  border:  "rgba(255,255,255,0.07)",
  text:    "#e8e8e8",
  muted:   "#8a8a8a",
  accent:  "#22c55e",
  accent2: "#16a34a",
  input:   "#111",
  error:   "#ef4444",
};

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [remember,   setRemember]   = useState(false);
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    preloadGoogleIdentity(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  }, []);

  async function handleGoogleLogin() {
    setError("");
    setSubmitting(true);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const idToken = await requestGoogleIdToken(clientId);
      await loginWithGoogle(idToken);
      triggerSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Google sign-in failed. Please try again."));
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      triggerSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password."));
      setSubmitting(false);
    }
  }

  function triggerSuccess() {
    setTimeout(() => setSuccess(true), 400);
  }

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(t);
    }
  }, [success, navigate]);

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden flex items-center justify-center"
      style={{ fontFamily: "'Outfit', Arial, sans-serif", background: "#0a0a0a" }}
    >
      {/* ── Wave background ── */}
      <div className="absolute inset-0 z-0">
        <Waves
          backgroundColor="#0a0a0a"
          strokeColor="rgba(34,197,94,0.18)"
          pointerSize={0.5}
        />
        {/* vignette so the card stays readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_65%_at_50%_50%,rgba(0,0,0,0.82)_0%,transparent_100%)]" />
      </div>

      {/* ── Top bar ── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
        <a href="/" className="no-underline">
          <img
            src="/logo.png" alt="TradeForge"
            style={{ height: "clamp(56px, 18vw, 88px)", filter: "invert(1) hue-rotate(180deg)", opacity: 0.9 }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/vite.svg";
            }}
          />
        </a>
        <Link
          to="/register"
          className="text-sm no-underline"
          style={{ color: T.muted }}
        >
          No account?{" "}
          <span style={{ color: T.accent, fontWeight: 700 }}>Sign up</span>
        </Link>
      </header>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-[400px] px-3 pt-16 sm:px-4 sm:pt-10">
        <AnimatePresence mode="wait">

          {/* ── Login form ── */}
          {!success && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Heading — above the card, like the homepage title feel */}
              <div className="mb-6 text-center">
                <h1 style={{
                  fontSize: "2rem", fontWeight: 900, color: T.text,
                  letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0,
                }}>
                  Welcome back
                </h1>
                <p style={{ color: T.muted, fontSize: "0.95rem", marginTop: 6 }}>
                  Log in to your TradeForge account.
                </p>
              </div>

              {/* Card — matches rest of app */}
              <div style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 18,
                padding: "clamp(16px, 4vw, 28px) clamp(16px, 4vw, 24px)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset",
              }}>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      marginBottom: 16,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1px solid rgba(239,68,68,0.3)`,
                      background: "rgba(239,68,68,0.1)",
                      color: T.error,
                      fontSize: "0.813rem",
                      fontWeight: 700,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div style={{ marginBottom: 14 }}>
                    <label htmlFor="email" style={{
                      display: "block", fontSize: "0.813rem", fontWeight: 700,
                      color: T.text, marginBottom: 6,
                    }}>
                      Email
                    </label>
                    <input
                      id="email" type="email" required
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        background: T.input, color: T.text,
                        border: `1px solid ${T.border}`, borderRadius: 10,
                        padding: "11px 14px", fontSize: "0.875rem", outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: 10 }}>
                    <label htmlFor="password" style={{
                      display: "block", fontSize: "0.813rem", fontWeight: 700,
                      color: T.text, marginBottom: 6,
                    }}>
                      Password
                    </label>
                    <input
                      id="password" type="password" required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        background: T.input, color: T.text,
                        border: `1px solid ${T.border}`, borderRadius: 10,
                        padding: "11px 14px", fontSize: "0.875rem", outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Remember / Forgot */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20, fontSize: "0.813rem",
                  }}>
                    <label style={{
                      display: "flex", alignItems: "center",
                      gap: 7, color: T.muted, cursor: "pointer", fontWeight: 600,
                    }}>
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                        style={{ accentColor: T.accent }}
                      />
                      Remember me
                    </label>
                    <Link
                      to="/forgot-password"
                      style={{ color: T.accent, fontWeight: 700, textDecoration: "none", fontSize: "0.813rem" }}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: "100%", padding: "12px 0",
                      background: T.accent, color: "#fff",
                      border: "none", borderRadius: 10,
                      fontSize: "0.938rem", fontWeight: 800,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.6 : 1,
                      fontFamily: "inherit",
                      transition: "background 0.15s",
                      marginBottom: 16,
                    }}
                  >
                    {submitting ? "Logging in…" : "Log In"}
                  </motion.button>

                  {/* Divider */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 16, color: T.muted, fontSize: "0.813rem",
                  }}>
                    <span style={{ flex: 1, height: 1, background: T.border }} />
                    or
                    <span style={{ flex: 1, height: 1, background: T.border }} />
                  </div>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={submitting}
                    style={{
                      width: "100%", padding: "11px 0",
                      background: T.input, color: T.text,
                      border: `1px solid ${T.border}`, borderRadius: 10,
                      fontSize: "0.875rem", fontWeight: 700,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.6 : 1,
                      fontFamily: "inherit",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 10,
                      transition: "background 0.15s",
                      marginBottom: 18,
                    }}
                    onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = "#1a1a1a"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.input; }}
                  >
                    <svg width="17" height="17" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31.9 34c-2.1 1.4-4.8 2-7.9 2-5.2 0-9.6-2.9-11.4-7.2l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 5.9l5.6 4.9C40.5 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <p style={{ textAlign: "center", fontSize: "0.813rem", color: T.muted, margin: 0 }}>
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      style={{ color: T.accent, fontWeight: 800, textDecoration: "none" }}
                    >
                      Create one
                    </Link>
                  </p>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Success state ── */}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
                className="flex justify-center mb-5"
              >
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: T.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 48px rgba(34,197,94,0.45)",
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 20 20" fill="white">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </motion.div>
              <h2 style={{ color: T.text, fontSize: "1.9rem", fontWeight: 900, margin: "0 0 8px" }}>
                You're in
              </h2>
              <p style={{ color: T.muted, fontSize: "0.95rem" }}>
                Taking you to the marketplace…
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
