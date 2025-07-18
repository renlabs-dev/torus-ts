export function PortalFormSeparator({ title }: { title: string }) {
  return (
    <div
      className="after:border-border relative text-center text-sm after:absolute after:inset-0
        after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
    >
      <span className="bg-[#131315] text-muted-foreground relative z-10 px-2">
        {title}
      </span>
    </div>
  );
}
