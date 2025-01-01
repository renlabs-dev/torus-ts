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
  appName?: string;
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
          `overscroll-none bg-background text-white`,
          className,
        )}
      >
        <div className={cn("mx-auto max-w-screen-xl px-4")}>{children}</div>
      </body>
    </html>
  );
}
