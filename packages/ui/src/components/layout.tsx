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
}

export function Layout({ children, font }: LayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body
        className={cn(
          font.className,
          `overscroll-none bg-[#04061C] bg-[url('/bg-pattern.svg')] bg-cover text-white`,
        )}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
