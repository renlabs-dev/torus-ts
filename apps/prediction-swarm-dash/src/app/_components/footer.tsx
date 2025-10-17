import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-border bg-background w-full border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-muted-foreground text-sm">Prediction Swarm.</div>
          <div className="flex items-center gap-6">
            <Link
              href="https://docs.sension.torus.directory/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://portal.torus.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Portal
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
