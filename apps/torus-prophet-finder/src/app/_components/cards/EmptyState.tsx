export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-center h-full py-16">
      <div className="text-center max-w-md">
        <p className="font-cinzel text-white/90 text-lg tracking-wide">{title}</p>
        {hint ? (
          <p className="mt-2 text-sm text-white/60">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
