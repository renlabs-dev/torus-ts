import type { FC } from "react";
import { cn } from "../lib/utils";

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
  headScripts?: FC[];
}

export function Layout({
  children,
  font,
  className,
  headScripts,
}: Readonly<LayoutProps>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{headScripts?.map((Script) => <Script key={Script.name} />)}</head>
      <body
        className={cn(
          font.className,
          `min-h-screen overflow-auto bg-[#080808] text-white antialiased`,
          className,
        )}
      >
        <div className={cn("mx-auto")}>{children}</div>
      </body>
    </html>
  );
}
