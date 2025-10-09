export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-3 w-full">
      <div className="flex w-full max-w-screen-xl mx-auto">{children}</div>
    </div>
  );
}
