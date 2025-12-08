import { DitherBackgroundAnimation } from "~/app/_components/dither-background-animation";
import { PageNavigation } from "~/app/_components/page-navigation/page-navigation";

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
        <DitherBackgroundAnimation
          pixelSize={1}
          waveSpeed={0.01}
          waveFrequency={4}
          waveAmplitude={0.3}
        />
      </div>
    </span>
  );
}
