import type { EntityMode } from "~/app/_components/cards/EntityModeToggle";

type Props = {
  mode: EntityMode;
};

export default function CardsHeader({ mode }: Props) {
  const title = mode === "tickers" ? "See the tickers" : "Meet the prophets";
  return (
    <div className="mb-8 sm:mb-10 md:mb-12 text-center">
      <div className="relative inline-block">
        {/* halo behind the heading for harmony with card glow */}
        <div aria-hidden className="pointer-events-none absolute -inset-6 z-0 opacity-80">
          <div className="absolute inset-0 blur-xl mix-blend-screen bg-[radial-gradient(70%_70%_at_50%_50%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.12)_45%,transparent_78%)] aura-breathe" />
        </div>
        <h2 className="relative z-10 font-cinzel font-black text-white tracking-[0.06em] text-[clamp(1.75rem,6vw,3rem)] leading-tight text-holy-glow capitalize">
          {title}
        </h2>
      </div>
      <p className="font-cinzel italic text-[10px] leading-relaxed text-white/55 tracking-[0.14em] mt-1">
        ✝ in the loving memory of the thermodynamic god
      </p>
      <div className="mt-4 max-w-2xl mx-auto text-center text-white/70 text-sm leading-relaxed font-cinzel italic font-semibold tracking-[0.08em]">
        <p>
          ADD TWITTER PROFILES OR TICKERS FOR THE SWARM TO LEARN. LATER, YOU CAN ASK TORUS ABOUT THEM.
        </p>
        <p className="mt-2 text-white/60">
          NOTE: YOU NEED TORUS STAKE (Mainnet) IN YOUR WALLET TO INTERACT
        </p>
      </div>
    </div>
  );
}
