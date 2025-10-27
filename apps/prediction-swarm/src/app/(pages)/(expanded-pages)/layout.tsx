export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <span>
      {children} <div className="fixed inset-0 -z-10"></div>
    </span>
  );
}
