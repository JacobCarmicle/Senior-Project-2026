import { createContext, useContext, useEffect, useState } from "react";

type FontScaleContextType = {
  fontScale: number;
  setFontScale: (scale: number) => void;
};

const FontScaleContext = createContext<FontScaleContextType | null>(null);

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem("fontScale");
    return saved ? Number(saved) : 1;
  });

  // Apply to root <html>
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    localStorage.setItem("fontScale", String(fontScale));
  }, [fontScale]);

  return (
    <FontScaleContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale() {
  const ctx = useContext(FontScaleContext);
  if (!ctx) throw new Error("useFontScale must be used within FontScaleProvider");
  return ctx;
}

/** Admin / settings: adjust root font scale (must be under FontScaleProvider). */
export function FontSizeControl() {
  const { fontScale, setFontScale } = useFontScale();
  return (
    <div style={{ padding: "12px 14px", minWidth: 200 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#e5e5e5" }}>Text size</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setFontScale(Math.max(0.8, fontScale - 0.05))}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #404040",
            background: "#2a2a2a",
            color: "#e5e5e5",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          A−
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 48, textAlign: "center" }}>
          {Math.round(fontScale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setFontScale(Math.min(1.4, fontScale + 0.05))}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #404040",
            background: "#2a2a2a",
            color: "#e5e5e5",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          A+
        </button>
        <button
          type="button"
          onClick={() => setFontScale(1)}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #404040",
            background: "#1a1a1a",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
