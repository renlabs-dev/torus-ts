export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className={`mx-auto w-full max-w-screen-xl ${className ?? ""}`}>
        {children}
      </div>
    </main>
  );
}
