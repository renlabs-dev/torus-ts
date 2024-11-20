import { cn, Footer, Header } from ".";

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
  shouldDisplayHeader?: boolean;
}

export function Layout({
  children,
  font,
  className,
  shouldDisplayHeader = true,
}: LayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body
        className={cn(
          font.className,
          `relative overscroll-none bg-[#04061C] bg-cover text-white`,
          className,
        )}
      >
        {shouldDisplayHeader && <Header />}
        {children}
        <Footer />
      </body>
    </html>
  );
}
