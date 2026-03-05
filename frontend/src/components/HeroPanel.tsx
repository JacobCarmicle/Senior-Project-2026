interface Feature {
  title: string;
  description: string;
}

interface Props {
  heading: string;
  subtext: string;
  features: Feature[];
  tip?: string;
}

export default function HeroPanel({ heading, subtext, features, tip }: Props) {
  return (
    <section className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-[#404040] bg-[#1a1a1a] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)] md:min-h-[420px]">
      <div>
        <h1 className="mb-2 text-2xl font-extrabold leading-tight">{heading}</h1>
        <p className="mb-4 leading-relaxed text-[#9ca3af]">{subtext}</p>

        <div className="mt-2 grid gap-2.5">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-2.5 rounded-xl border border-[#404040] bg-[#2d2d2d] px-3 py-2.5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.15)] font-black text-[#22c55e]">
                ✓
              </div>
              <div>
                <b className="block">{f.title}</b>
                <span className="text-sm leading-snug text-[#9ca3af]">
                  {f.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tip && (
        <p className="mt-4 text-sm text-[#9ca3af]">{tip}</p>
      )}
    </section>
  );
}
