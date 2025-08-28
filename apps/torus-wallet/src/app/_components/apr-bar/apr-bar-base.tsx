"use client";

interface APRBarBaseProps {
  children: React.ReactNode;
}

export function APRBarBase({ children }: APRBarBaseProps) {
  return (
    <div className="animate-fade-up absolute top-[3.3em] w-full">
      <div className="relative z-40 h-8 w-full overflow-hidden border-b bg-[#080808] shadow-2xl">
        <div className="absolute inset-0 flex justify-center">
          <div className="animate-slide h-full w-[200px] rotate-45 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent" />
        </div>
        <div className="animate-marquee absolute flex h-full w-full items-center gap-32 whitespace-nowrap">
          {children}
        </div>
      </div>
    </div>
  );
}
