import Dither from "~/app/_components/dither";
import { PageNavigation } from "~/app/_components/page-navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <span className="animate-fade">
      <PageNavigation />
      {children}{" "}
      <div className="fixed inset-0 -z-10 opacity-30">
        <Dither
          pixelSize={1}
          waveSpeed={0.01}
          waveFrequency={4}
          waveAmplitude={0.3}
        />
      </div>
    </span>
  );
}
