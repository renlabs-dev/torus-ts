import { buildSocials } from "~/app/_components/agent-item-card/components/socials-info";
import Link from "next/link";

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
}: Readonly<ExpandedViewSocialsProps>) {
  const socialsList = buildSocials(socials ?? {}, website);
  return (
    <div className="flex gap-2">
      {socialsList.map((social) => {
        return (
          <Link
            key={social.name}
            href={social.href}
            className="flex h-5 w-5 flex-row items-center gap-1 text-gray-200"
          >
            {social.icon}
          </Link>
        );
      })}
    </div>
  );
}
