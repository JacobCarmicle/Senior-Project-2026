import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#2d2d2d] text-[#e5e5e5]">
      <header className="sticky top-0 z-10 flex items-center border-b border-[#404040] bg-[#1a1a1a] px-5 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-[#22c55e] no-underline"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          TradeForge
        </Link>
      </header>

      <main className="mx-auto mt-6 mb-10 grid max-w-[980px] items-start gap-5 px-4 md:grid-cols-[1.1fr_0.9fr]">
        {children}
      </main>
    </div>
  );
}
