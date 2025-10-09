export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full items-center gap-3">
      <div className="mx-auto flex w-full max-w-screen-xl">{children}</div>
    </div>
  );
}
