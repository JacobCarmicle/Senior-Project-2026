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
