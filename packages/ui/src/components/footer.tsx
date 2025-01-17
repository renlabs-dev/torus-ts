import {
  ArrowLeftRight,
  BookMarked,
  Globe,
  Scale,
  Telescope,
  WalletCards,
} from "lucide-react";
import { links } from "../data";
import { Clock } from "./clock";

import { Icons } from "./icons";

export function Footer() {
  return (
    <div
      className={`fixed bottom-0 right-0 z-50 hidden w-full border-t border-border bg-accent p-2 pb-2.5 animate-delay-700 md:block`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {_appList.map((app) => {
            return (
              <FooterItem key={app.name}>
                <a
                  href={app.href}
                  target="_blank"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  {app.icon}
                  <span>{app.name}</span>
                </a>
              </FooterItem>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FooterItem>
            <span className="hidden xl:inline">
              Protocol core development by{" "}
            </span>
            <a href={links.ren_labs} className="underline" target="_blank">
              @renlabs
            </a>
          </FooterItem>
          <FooterItem>
            <div className="flex gap-2.5 py-1">
              {_socialList.map((social) => {
                return (
                  <a key={social.name} href={social.href} target="_blank">
                    {social.icon}
                  </a>
                );
              })}
            </div>
          </FooterItem>
          <FooterItem>
            <Clock />
          </FooterItem>
        </div>
      </div>
    </div>
  );
}

function FooterItem({ children }: { children: React.ReactNode }) {
  return <div className="bg-background px-2 py-0.5">{children}</div>;
}

const _socialList = [
  {
    name: "Discord",
    href: links.discord,
    icon: <Icons.discord className="h-6 w-6 md:h-3 md:w-3" />,
  },
  {
    name: "X",
    href: links.x,
    icon: <Icons.x className="h-6 w-6 md:h-3 md:w-3" />,
  },
  {
    name: "GitHub",
    href: links.github,
    icon: <Icons.github className="h-6 w-6 md:h-3 md:w-3" />,
  },
  {
    name: "Telegram",
    href: links.telegram,
    icon: <Icons.telegram className="h-6 w-6 md:h-3 md:w-3" />,
  },
];

const _appList = [
  {
    icon: <Globe className="h-3 w-3" />,
    name: "LP",
    href: links.landing_page,
  },
  {
    icon: <Scale className="h-3 w-3" />,
    name: "DAO",
    href: links.governance,
  },
  {
    icon: <ArrowLeftRight className="h-3 w-3" />,
    name: "Bridge",
    href: links.bridge,
  },
  {
    icon: <WalletCards className="h-3 w-3" />,
    name: "Wallet",
    href: links.wallet,
  },
  {
    icon: <BookMarked className="h-3 w-3" />,
    name: "Docs",
    href: links.docs,
  },
  {
    icon: <Telescope className="h-3 w-3" />,
    name: "Explorer",
    href: links.torex_explorer,
  },
];
