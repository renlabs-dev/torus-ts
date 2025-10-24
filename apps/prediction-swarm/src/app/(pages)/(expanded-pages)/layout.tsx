import Silk from "@torus-ts/ui/components/Silk";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <span>
      {children}{" "}
      <div className="fixed inset-0 -z-10">
        <Silk scale={0.9} speed={3.5} color="#1c1c1" />
      </div>
    </span>
  );
}
