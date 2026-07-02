import { getLinks } from "@torus-ts/ui/lib/data";
import { env } from "~/env";

/** Event the About entry dispatches; ViewMore listens and scrolls to the summary. */
export const TRIGGER_ABOUT_EVENT = "trigger-about-section";

/** What activating a nav entry does. */
export type NavTarget = { kind: "link"; href: string } | { kind: "about" };

/** One landing navigation entry. */
export interface NavEntry {
  id: string;
  label: string;
  target: NavTarget;
}

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

/**
 * Canonical landing navigation, in display order. Single source of truth for
 * the logo nav tree and the landing sidebar - both render exactly this list,
 * which keeps the two surfaces symmetric by construction.
 */
export const NAV_ENTRIES = [
  {
    id: "wallet",
    label: "Wallet",
    target: { kind: "link", href: links.wallet },
  },
  {
    id: "bridge",
    label: "Bridge",
    target: { kind: "link", href: links.bridge },
  },
  { id: "blog", label: "Blog", target: { kind: "link", href: links.blog } },
  { id: "join", label: "Join", target: { kind: "link", href: links.discord } },
  { id: "about", label: "About", target: { kind: "about" } },
] as const satisfies readonly NavEntry[];

/** Union of nav entry ids - lets per-surface lookups (e.g. icons) be total. */
export type NavEntryId = (typeof NAV_ENTRIES)[number]["id"];
