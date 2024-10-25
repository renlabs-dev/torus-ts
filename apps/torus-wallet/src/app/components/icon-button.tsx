"use client";

import type { ColorType, MenuType } from "~/utils/types";
import { ImageIcon } from "./image-icon";

interface IconButtonProps {
  src: string;
  text: string;
  color: ColorType;
  activeMenu: MenuType;
  setActiveMenu: (menu: MenuType) => void;
}

export function IconButton(props: IconButtonProps) {
  const colorVariants = {
    red: `text-red-500 hover:bg-red-500/15 active:bg-red-500/40 border border-red-500/50 hover:border-red-500/70 ${props.activeMenu === props.text ? "bg-red-500/20" : "bg-red-500/5"}`,
    amber: `text-amber-500 hover:bg-amber-500/15 active:bg-amber-500/40 border border-amber-500/50 hover:border-amber-500/70 ${props.activeMenu === props.text ? "bg-amber-500/20" : "bg-amber-500/5"}`,
    purple: `text-purple-500 hover:bg-purple-500/15 active:bg-purple-500/40 border border-purple-500/50 hover:border-purple-500/70 ${props.activeMenu === props.text ? "bg-purple-500/20" : "bg-purple-500/5"}`,
    green: `text-green-500 hover:bg-green-500/15 active:bg-green-500/40 border border-green-500/50 hover:border-green-500/70 ${props.activeMenu === props.text ? "bg-green-500/20" : "bg-green-500/5"}`,
  };

  return (
    <button
      onClick={() => props.setActiveMenu(props.text as MenuType)}
      className={`flex w-full items-center justify-center gap-3 text-nowrap px-6 py-2.5 font-semibold transition duration-200 hover:bg-[#898989]/10 ${colorVariants[props.color]}`}
    >
      <ImageIcon src={props.src} className="h-5 w-5 md:h-6 md:w-6" />
      <p className="text-lg">{props.text}</p>
    </button>
  );
}
