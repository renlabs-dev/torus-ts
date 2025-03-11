import {
  Anvil,
  ArrowLeftRight,
  BookMarked,
  Globe,
  Scale,
  Telescope,
  WalletCards,
} from "lucide-react";
import dynamic from "next/dynamic";
import { links } from "../lib/data";
import { Icons } from "./icons";

const Clock = dynamic(() => import("./clock"), {
  loading: () => <p>Loading...</p>,
});

function FooterItem({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="bg-background px-2 py-0.5">{children}</div>;
}

interface FooterProps {
  torusChainEnv: string;
}

export function Footer({ torusChainEnv }: FooterProps) {
  const apiLinks = links(torusChainEnv);

  const _socialList = [
    {
      name: "Discord",
      href: apiLinks.discord,
      icon: <Icons.Discord className="h-6 w-6 md:h-3 md:w-3" />,
    },
    {
      name: "X",
      href: apiLinks.x,
      icon: <Icons.X className="h-6 w-6 md:h-3 md:w-3" />,
    },
    {
      name: "GitHub",
      href: apiLinks.github,
      icon: <Icons.Github className="h-6 w-6 md:h-3 md:w-3" />,
    },
    {
      name: "Telegram",
      href: apiLinks.telegram,
      icon: <Icons.Telegram className="h-6 w-6 md:h-3 md:w-3" />,
    },
  ];

  const _appList = [
    {
      icon: <Globe className="h-3 w-3" />,
      name: "Home",
      href: apiLinks.landing_page,
    },
    {
      icon: <Scale className="h-3 w-3" />,
      name: "DAO",
      href: apiLinks.governance,
    },
    {
      icon: <ArrowLeftRight className="h-3 w-3" />,
      name: "Bridge",
      href: apiLinks.bridge,
    },
    {
      icon: <WalletCards className="h-3 w-3" />,
      name: "Wallet",
      href: apiLinks.wallet,
    },
    {
      icon: <BookMarked className="h-3 w-3" />,
      name: "Docs",
      href: apiLinks.docs,
    },
    {
      icon: <Anvil className="h-3 w-3" />,
      name: "Allocator",
      href: apiLinks.allocator,
    },
    {
      icon: <Telescope className="h-3 w-3" />,
      name: "Explorer",
      href: apiLinks.torex_explorer,
    },
  ];

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
            <a href={apiLinks.ren_labs} className="underline" target="_blank">
              @renlabs
            </a>
          </FooterItem>
          <FooterItem>
            <div className="flex gap-2.5 py-1">
              {_socialList.map((social) => {
                return (
                  <a key={social.name} href={social.href}>
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
