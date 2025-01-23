"use client";

import Link from "next/link";
import { buildSocials } from "./agent-item";

// (property) socials?: {
//     discord?: string | undefined;
//     github?: string | undefined;
//     telegram?: string | undefined;
//     twitter?: string | undefined;
// } | undefined

//  website?: string | undefined

interface ExpandedViewSocialsProps {
  socials?: {
    discord?: string;
    github?: string;
    telegram?: string;
    twitter?: string;
  };
  website?: string;
}

export function ExpandedViewSocials({
  socials,
  website,
}: ExpandedViewSocialsProps) {
  const socialsList = buildSocials(socials ?? {}, website);
  return (
    <div className="flex gap-2">
      {socialsList.map((social) => {
        return (
          <Link
            key={social.name}
            href={social.href}
            className="flex flex-row items-center gap-1 text-gray-200"
          >
            {social.icon}
          </Link>
        );
      })}
    </div>
  );
}
