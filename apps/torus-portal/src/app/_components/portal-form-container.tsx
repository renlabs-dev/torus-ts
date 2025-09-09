export default function PortalFormContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="animate-fade-down flex flex-1 flex-col gap-4 p-4">
      <div className="bg-muted/50 z-50 mx-auto w-full max-w-3xl rounded-md p-6 sm:p-8">
        {children}
        <div className="text-muted-foreground pt-6 text-center text-xs">
          Feeling Lost?{" "}
          <a
            target="_blank"
            href="https://discord.com/channels/1306654856286699590/1306654857046003716"
            className="hover:text-primary underline underline-offset-4 transition duration-200"
          >
            Get help in our Discord
          </a>
        </div>
      </div>
    </main>
  );
}
