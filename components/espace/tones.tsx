// A few colours, always with the same meaning: each place of the artisan space has its own
// colour and icon, found on its tab, its row in Réglages and its page title. Text always
// says the same thing as the colour, so nothing relies on colour alone.
export type Tone = "orange" | "sky" | "emerald" | "violet" | "amber" | "stone";

// Literal class names, so Tailwind finds them.
export const TONE_TILE: Record<Tone, string> = {
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-800",
  stone: "bg-stone-100 text-stone-600",
};

export const TONE_PILL: Record<Tone, string> = {
  orange: "bg-orange-50 text-orange-800 ring-orange-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  stone: "bg-stone-100 text-stone-700 ring-stone-200",
};

export const TONE_TEXT: Record<Tone, string> = {
  orange: "text-orange-700",
  sky: "text-sky-700",
  emerald: "text-emerald-700",
  violet: "text-violet-700",
  amber: "text-amber-800",
  stone: "text-stone-700",
};

export const TONE_SOLID: Record<Tone, string> = {
  orange: "bg-orange-600 text-white",
  sky: "bg-sky-600 text-white",
  emerald: "bg-emerald-600 text-white",
  violet: "bg-violet-600 text-white",
  amber: "bg-amber-500 text-white",
  stone: "bg-stone-600 text-white",
};

const TILE_SIZES = { sm: "size-9 rounded-xl [&>svg]:size-5", md: "size-12 rounded-2xl [&>svg]:size-6" } as const;

export function IconTile({ tone, size = "md", children }: { tone: Tone; size?: keyof typeof TILE_SIZES; children: React.ReactNode }) {
  return <span className={`grid shrink-0 place-items-center ${TILE_SIZES[size]} ${TONE_TILE[tone]}`}>{children}</span>;
}

export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_PILL[tone]}`}>
      {children}
    </span>
  );
}
