import Image from "next/image";

import { links } from "@torus-ts/ui/data";

export const applicationsList = [
  {
    title: "Governance",
    description: "Community Proposals",
    href: links.governance,
    icon: (
      <Image
        alt="Governance icon"
        className="mb-5 w-12"
        height={45}
        src="/governance-icon.svg"
        width={45}
      />
    ),
  },
  {
    title: "Docs",
    description: "Dev Documentation",
    href: links.docs,
    icon: (
      <Image
        alt="Docs icon"
        className="mb-5 w-12"
        height={45}
        src="/docs-icon.svg"
        width={45}
      />
    ),
  },
  {
    title: "Blog",
    target: "_blank",
    description: "View recent updates",
    href: links.blog,
    icon: (
      <Image
        alt="Updates icon"
        className="mb-5 w-12"
        height={45}
        src="/updates-icon.svg"
        width={45}
      />
    ),
  },
  {
    title: "Join Community",
    description: null,
    href: links.discord,
    icon: (
      <Image
        alt="Community icon"
        className="mb-5 w-12"
        height={45}
        src="/community-icon.svg"
        width={45}
      />
    ),
  },
];
