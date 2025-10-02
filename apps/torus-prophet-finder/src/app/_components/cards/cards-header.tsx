import type { EntityMode } from "~/app/_components/cards/entity-mode-toggle";

interface Props {
  mode: EntityMode;
}

export default function CardsHeader({ mode }: Props) {
  const title = mode === "tickers" ? "See the tickers" : "Meet the prophets";
  return (
    <div className="relative mb-8 text-center sm:mb-10 md:mb-12">
      <div className="relative z-20">
        <div className="relative inline-block">
          {/* halo behind the heading for harmony with card glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 z-0 opacity-80"
          >
            <div className="aura-breathe absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_50%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.12)_45%,transparent_78%)] mix-blend-screen blur-xl" />
          </div>
          <h2 className="font-cinzel text-holy-glow relative z-10 text-[clamp(1.75rem,6vw,3rem)] font-black capitalize leading-tight tracking-[0.06em] text-white">
            {title}
          </h2>
        </div>
        <p className="font-cinzel mt-1 text-[10px] italic leading-relaxed tracking-[0.14em] text-white/55">
          in honor of the thermodynamic god
        </p>
        <div className="font-cinzel mx-auto mt-4 max-w-2xl text-center text-sm font-semibold italic leading-relaxed tracking-[0.08em] text-white/70">
          <p>
            ADD TWITTER PROFILES OR TICKERS FOR THE SWARM TO LEARN.
            <br />
            LATER, YOU CAN ASK TORUS ABOUT THEM.
          </p>
          <p className="mt-2 text-white/30">
            NOTE: YOU NEED TORUS STAKED (Mainnet) IN YOUR WALLET TO INTERACT
          </p>
        </div>
      </div>
    </div>
  );
}
