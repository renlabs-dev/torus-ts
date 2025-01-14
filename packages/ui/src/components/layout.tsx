import { cn } from ".";

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
}

export function Layout({
  children,
  font,
  className,
  torusPage,
}: LayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body
        className={cn(
          font.className,
          `overflow-auto bg-[#020202] text-white`,
          className,
        )}
      >
        <div className={cn("mx-auto", !torusPage && "max-w-screen-xl px-4")}>
          {children}
        </div>
      </body>
    </html>
  );
}
