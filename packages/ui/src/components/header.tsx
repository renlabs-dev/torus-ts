import type { ReactElement } from "react";

import { cn, MobileNavigation } from "..";

export interface NextFont {
  className: string;
  style: {
    fontFamily: string;
    fontWeight?: number;
    fontStyle?: string;
  };
}

interface HeaderProps {
  logoSrc: string;
  title: string;
  navigationLinks?: { name: string; href: string; external: boolean }[];
  wallet?: JSX.Element;
  mobileContent?: ReactElement;
  font: NextFont["className"];
}

export function Header(props: HeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "fixed left-3 right-3 top-3 mx-auto flex max-w-screen-2xl animate-fade-down rounded-md border border-white/20 bg-[#898989]/5 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between px-3 py-3",
        )}
      >
        <a className={cn("flex items-center gap-3")} href="/">
          <img
            alt="Logo"
            className={cn("h-10 w-10")}
            height={100}
            src={props.logoSrc}
            width={100}
          />
          <h3
            className={cn(
              props.font,
              "mt-0.5 hidden text-2xl font-light text-white md:flex",
            )}
          >
            {props.title}
          </h3>
        </a>
        <nav className={cn("flex-grow")}>
          <div className={cn("hidden justify-end lg:flex")}>
            {props.navigationLinks?.map(({ name, href, external }) => (
              <a
                className={cn(
                  "mx-3 flex flex-col items-center text-lg font-normal leading-6 text-white transition duration-500 hover:text-green-500",
                )}
                href={href}
                key={name}
                target={external ? "_blank" : "_self"}
              >
                {name}
              </a>
            ))}
          </div>
        </nav>

        <div className={cn("flex items-center")}>
          {props.wallet}
          <MobileNavigation
            navigationLinks={props.navigationLinks}
            genericContent={props.mobileContent}
          />
        </div>
      </div>
    </header>
  );
}
