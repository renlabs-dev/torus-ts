import { cn } from ".";
import type { FC } from "react";

interface NextFont {
  className: string;
  style: {
    fontFamily: string;
    fontStyle?: string;
    fontWeight?: number;
  };
}

interface LayoutProps {
  children: React.ReactNode;
  font: NextFont;
  className?: string;
  torusPage?: boolean;
  headScripts?: FC[];
}

export function Layout({
  children,
  font,
  className,
  headScripts,
}: LayoutProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        {headScripts?.map((Script, index) => (
          <Script key={`head-script-${index}}`} />
        ))}
      </head>
      <body
        className={cn(
          font.className,
          `min-h-screen overflow-auto bg-[#080808] text-white`,
          className,
        )}
      >
        <div className={cn("mx-auto")}>{children}</div>
      </body>
    </html>
  );
}
