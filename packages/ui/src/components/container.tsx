export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <main
      className={`mx-auto flex w-full max-w-screen-2xl animate-fade-in-down flex-col items-center justify-center px-4 text-white ${className ? className : ""}`}
    >
      {children}
    </main>
  );
}
