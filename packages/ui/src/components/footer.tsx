import { HoverCard, HoverCardContent, HoverCardTrigger, links } from "..";
import { Icons } from "./icons";

function FooterContent() {
  return (
    <div className="flex justify-between space-x-4">
      <div className="h-fit w-fit rounded-full bg-accent p-1.5">
        <Icons.logo className="h-10 w-10" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Torus</h4>
        <p className="text-sm">
          Made by the community, powered by{" "}
          <a href={links.x} className="text-cyan-200 hover:underline">
            Ren Labs
          </a>
          .
        </p>
        <div className="flex space-x-6 pt-3 md:space-x-3">
          {socialList.map((social) => {
            return (
              <a key={social.name} href={social.href}>
                {social.icon}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <div className="fixed bottom-0 right-0 z-50 hidden px-4 py-2 animate-delay-700 md:block">
      <HoverCard>
        <HoverCardTrigger className="text-sm hover:cursor-pointer hover:underline">
          @torus
        </HoverCardTrigger>
        <HoverCardContent className="w-72">
          <FooterContent />
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

const socialList = [
  {
    name: "Discord",
    href: links.discord,
    icon: <Icons.discord className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
  {
    name: "X",
    href: links.x,
    icon: <Icons.x className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
  {
    name: "GitHub",
    href: links.github,
    icon: <Icons.github className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
  {
    name: "Telegram",
    href: links.telegram,
    icon: <Icons.telegram className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
];
