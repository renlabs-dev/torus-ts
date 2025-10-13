"use client";

interface APRBarBaseProps {
  children: React.ReactNode;
}

/**
 * Renders a fixed-position top bar with an animated diagonal overlay and a horizontal marquee for its content.
 *
 * @param children - Elements to display inside the marquee area (rendered inline and animated across the bar)
 * @returns A JSX element representing the positioned, animated top bar
 */
export function APRBarBase({ children }: APRBarBaseProps) {
  return (
    <div className="absolute top-[3.3em] w-full animate-fade-up">
      <div className="relative z-40 h-8 w-full overflow-hidden border-b bg-[#080808] shadow-2xl">
        <div className="absolute inset-0 flex justify-center">
          <div className="h-full w-[200px] rotate-45 animate-slide bg-gradient-to-r from-transparent via-gray-800/10 to-transparent" />
        </div>
        <div className="absolute flex h-full w-full animate-marquee items-center gap-32 whitespace-nowrap">
          {children}
        </div>
      </div>
    </div>
  );
}