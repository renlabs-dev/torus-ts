import Dither from "~/app/_components/dither";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <span>
      {children}{" "}
      <div className="fixed inset-0 -z-10 opacity-40">
        <Dither
          pixelSize={1}
          waveSpeed={0.02}
          waveFrequency={4}
          waveAmplitude={0.3}
        />
      </div>
    </span>
  );
}
