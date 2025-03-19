import { Icons } from "@torus-ts/ui/components/icons";
import { Globe } from "lucide-react";
import React from "react";

type SocialKind = "website" | "discord" | "twitter" | "github" | "telegram";

const SOCIALS_CONFIG: Record<
  SocialKind,
  { name: string; icon: React.ReactNode }
> = {
  website: { name: "Website", icon: <Globe /> },
  discord: { name: "Discord", icon: <Icons.Discord /> },
  twitter: { name: "X", icon: <Icons.X /> },
  github: { name: "GitHub", icon: <Icons.Github /> },
  telegram: { name: "Telegram", icon: <Icons.Telegram /> },
};

const SOCIALS_ORDER: SocialKind[] = [
  "website",
  "discord",
  "twitter",
  "github",
  "telegram",
];

export function buildSocials(
  socials: Partial<Record<SocialKind, string>>,
  website?: string,
): { name: string; href: string; icon: React.ReactNode }[] {
  return SOCIALS_ORDER.reduce(
    (acc, kind) => {
      const href = kind === "website" ? website : socials[kind];
      return href ? [...acc, { ...SOCIALS_CONFIG[kind], href }] : acc;
    },
    [] as { name: string; href: string; icon: React.ReactNode }[],
  );
}

export function SocialsInfo({
  socials,
}: {
  socials: { name: string; href: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="flex w-full gap-2">
      {socials.map(({ name, href, icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: "h-5 w-5 md:h-4 md:w-4",
            color: "gray",
          })}
        </a>
      ))}
    </div>
  );
}
