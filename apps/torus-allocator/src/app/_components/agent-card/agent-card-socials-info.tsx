import { Icons } from "@torus-ts/ui/components/icons";
import { Globe } from "lucide-react";
import React from "react";

type SocialKind = "website" | "discord" | "twitter" | "github" | "telegram";

// TODO: Remove code repetition
const SOCIALS_CONFIG: Record<
  SocialKind,
  { name: string; icon: React.ReactNode }
> = {
  website: {
    name: "Website",
    icon: <Globe className="h-5 w-5 md:h-4 md:w-4" color="#6b7280" />,
  },
  discord: {
    name: "Discord",
    icon: <Icons.Discord className="h-5 w-5 md:h-4 md:w-4" color="#6b7280" />,
  },
  twitter: {
    name: "X",
    icon: <Icons.X className="h-5 w-5 md:h-4 md:w-4" color="#6b7280" />,
  },
  github: {
    name: "GitHub",
    icon: <Icons.Github className="h-5 w-5 md:h-4 md:w-4" color="#6b7280" />,
  },
  telegram: {
    name: "Telegram",
    icon: <Icons.Telegram className="h-5 w-5 md:h-4 md:w-4" color="#6b7280" />,
  },
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

export function AgentCardSocialsInfo({
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
          <span className="h-5 w-5 text-gray-500 md:h-4 md:w-4">{icon}</span>
        </a>
      ))}
    </div>
  );
}
