"use client";

import Image from "next/image";
import Link from "next/link";

import { landingPageButtons } from "@torus-ts/ui";

interface TViewMoreModalProps {
  viewMoreIsVisible: boolean;
  handleModalVisibility: (visibility?: boolean) => void;
}

export const ViewMoreModal = (props: TViewMoreModalProps) => {
  const { handleModalVisibility, viewMoreIsVisible } = props;
  return (
    <div
      className={`${viewMoreIsVisible ? "block" : "hidden"} absolute left-0 z-[49] h-[calc(100svh-68px)] w-full overflow-clip`}
    >
      <div className="flex w-full p-4">
        <button
          onClick={() => handleModalVisibility(false)}
          className="relative ml-auto inline-flex w-fit animate-fade-up gap-2 border border-white/20 bg-[#898989]/5 px-4 py-2 text-gray-400 backdrop-blur-md transition duration-200 animate-delay-100 hover:border-green-500 hover:bg-green-500/10"
        >
          <Image
            src="arrow-down-icon.svg"
            alt="link icon"
            width={20}
            height={20}
            className="rotate-90"
          />
          <span className="text-nowrap">Go back</span>
        </button>
      </div>

      <div className="fixed bottom-0 z-[50] mb-9 flex w-full flex-col gap-2 p-3">
        {landingPageButtons.map((pageButton) => {
          return (
            <Link href={pageButton.href}>
              <button className="relative inline-flex w-full animate-fade-up items-center justify-center gap-2 border border-white/20 bg-[#898989]/5 px-4 py-2 text-gray-400 backdrop-blur-md transition duration-300 animate-delay-500 hover:border-green-500 hover:bg-green-500/10">
                <Image
                  src={pageButton.icon}
                  alt="link icon"
                  width={20}
                  height={20}
                />
                <span className="text-nowrap">{pageButton.name}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
