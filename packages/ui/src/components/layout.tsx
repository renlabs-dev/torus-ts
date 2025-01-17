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
}

export function Layout({
  children,
  font,
  className,
}: LayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body
        className={cn(
          font.className,
          `min-h-screen overflow-auto bg-[#020202] text-white`,
          className,
        )}
      >
        <div className={cn("mx-auto")}>{children}</div>
      </body>
    </html>
  );
}
