import { HoverCard, HoverCardContent, HoverCardTrigger } from ".";
import { links } from "../data";
import { Icons } from "./icons";

function FooterContent() {
  return (
    <div className="flex justify-between space-x-4">
      <div className="h-fit w-fit rounded-full bg-accent p-1.5">
        <Icons.logo className="m-1 h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Torus Network</h4>
        <p className="text-sm">
          Self assembled, powered by{" "}
          <a href={links.x} className="underline">
            Ren Labs
          </a>
          .
        </p>
        <div className="flex space-x-6 pt-3 md:space-x-3">
          {_socialList.map((social) => {
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
        <HoverCardContent className="mr-2 w-72">
          <FooterContent />
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

const _socialList = [
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
