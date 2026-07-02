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
 * Canonical landing navigation, in display order; the logo nav tree derives
 * both of its layouts from this list. About sits in the middle so it lands
 * directly under the logo on the trunk line.
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
  { id: "about", label: "About", target: { kind: "about" } },
  { id: "join", label: "Join", target: { kind: "link", href: links.discord } },
  { id: "blog", label: "Blog", target: { kind: "link", href: links.blog } },
] as const satisfies readonly NavEntry[];

/** Social links rendered under the About summary, in display order. */
export const SOCIAL_LINKS = [
  { id: "discord", label: "Discord", href: links.discord },
  { id: "renlabs", label: "Renlabs", href: links.ren_labs },
  { id: "x", label: "X", href: links.x },
] as const;

/** Union of social link ids - lets the icon lookup be total. */
export type SocialLinkId = (typeof SOCIAL_LINKS)[number]["id"];
