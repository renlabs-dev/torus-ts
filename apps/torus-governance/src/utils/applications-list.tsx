import Image from "next/image";

import { links } from "@torus-ts/ui/data";

export const applicationsList = [
  {
    title: "Home",
    description: "Community Home Page",
    href: links.governance,
    icon: (
      <Image
        alt="Governance icon"
        className="mb-5 w-10"
        height={75}
        src="/governance-icon.svg"
        width={75}
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
        className="mb-5 w-10"
        height={75}
        src="/docs-icon.svg"
        width={75}
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
        className="mb-5 w-10"
        height={75}
        src="/updates-icon.svg"
        width={75}
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
        className="mb-5 w-10"
        height={75}
        src="/community-icon.svg"
        width={75}
      />
    ),
  },
];
