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
  className?: string
}

export function Layout({ children, font, className }: LayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body
        className={cn(
          font.className,
          `overscroll-none bg-[#04061C] bg-cover text-white relative`,
          className
        )}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
