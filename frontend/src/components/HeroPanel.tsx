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
    <section className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161616] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)] md:min-h-[420px]">
      <div>
        <h1 className="mb-2 text-2xl font-extrabold leading-tight">{heading}</h1>
        <p className="mb-4 leading-relaxed text-[#8a8a8a]">{subtext}</p>

        <div className="mt-2 grid gap-2.5">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#111] px-3 py-2.5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.15)] font-black text-[#22c55e]">
                ✓
              </div>
              <div>
                <b className="block">{f.title}</b>
                <span className="text-sm leading-snug text-[#8a8a8a]">
                  {f.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tip && (
        <p className="mt-4 text-sm text-[#8a8a8a]">{tip}</p>
      )}
    </section>
  );
}
