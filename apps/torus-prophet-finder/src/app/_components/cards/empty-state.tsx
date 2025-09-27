export default function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex h-full items-center justify-center py-16">
      <div className="max-w-md text-center">
        <p className="font-cinzel text-lg tracking-wide text-white/90">
          {title}
        </p>
        {hint ? <p className="mt-2 text-sm text-white/60">{hint}</p> : null}
      </div>
    </div>
  );
}
