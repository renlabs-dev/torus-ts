"use client";

interface APRBarBaseProps {
  children: React.ReactNode;
}

export function APRBarBase({ children }: APRBarBaseProps) {
  return (
    <div className="absolute top-[3.3em] w-full animate-fade-up">
      <div className="relative z-40 h-8 w-full overflow-hidden border-b bg-[#080808] shadow-2xl">
        <div className="absolute inset-0 flex justify-center">
          <div
            className="h-full w-[200px] rotate-45 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent animate-slide"
          />
        </div>
        <div className="absolute flex h-full w-full items-center gap-32 whitespace-nowrap animate-marquee">
          {children}
        </div>
      </div>
    </div>
  );
}
