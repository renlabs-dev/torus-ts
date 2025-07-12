export default function PortalFormContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 animate-fade-down">
      <div className="bg-muted/50 mx-auto w-full max-w-3xl rounded-md z-50 p-6 sm:p-8">
        {children}
        <div className="text-center text-muted-foreground text-xs pt-6">
          Feeling Lost?{" "}
          <a
            target="_blank"
            href="https://discord.com/channels/1306654856286699590/1306654857046003716"
            className="underline underline-offset-4"
          >
            Get help in our Discord
          </a>
        </div>
      </div>
    </main>
  );
}
