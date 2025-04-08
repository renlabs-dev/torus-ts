import { Card } from "@torus-ts/ui/components/card";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { cn } from "@torus-ts/ui/lib/utils";
import { motion } from "framer-motion";
import { CircleDotDashed, Diameter } from "lucide-react";
import { CustomButton } from "../custom-button";
import { ANIMATIONS, CONTENT } from "../data";

export function ButtonsSectionMobile() {
  const { mobileButtons, description } = CONTENT;

  const buttonRows = [
    {
      delay: 11,
      className: "flex flex-col gap-6",
      buttons: mobileButtons[0] ?? [],
    },
    {
      delay: 11,
      className: "flex flex-col gap-6",
      buttons: mobileButtons[1] ?? [],
    },
  ];

  const joinButton = mobileButtons[2]?.[0] ?? { text: "Join", href: "#" };

  return (
    <motion.div
      className="absolute top-44 flex w-full justify-center"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* First Button */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={5}
        className="absolute bottom-[3.8em] flex w-full max-w-[42rem] items-center justify-around gap-[12.5em]"
      >
        <div className="full bg-border flex h-12 w-12 items-center justify-center rounded-full">
          <CircleDotDashed className="h-6 w-6" />
        </div>
        <div className="absolute top-8">
          <CustomButton href={joinButton.href}>{joinButton.text}</CustomButton>
        </div>
        <div className="full bg-border flex h-12 w-12 items-center justify-center rounded-full">
          <Diameter className="h-6 w-6" />
        </div>
      </motion.div>

      {/* First Row of Buttons */}
      <div className="absolute flex w-full justify-around px-8">
        {buttonRows.map((row, index) => (
          <motion.div
            key={index}
            variants={ANIMATIONS.BUTTON}
            custom={row.delay}
            className={row.className}
          >
            {row.buttons.map((button, buttonIndex) => (
              <CustomButton key={buttonIndex} href={button.href}>
                {button.text}
              </CustomButton>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Second Row With Card */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={10}
        className="absolute mt-52 w-full max-w-[46.5rem]"
      >
        <Card className="mx-5 cursor-pointer overflow-hidden pb-4 pl-6 pr-4 pt-2 md:mx-0">
          <ScrollArea className={cn("h-[calc(33vh)]")}>
            <motion.div layout>
              {description.map((paragraph, index) => (
                <p key={index} className={index > 0 ? "mt-3" : ""}>
                  {paragraph}
                </p>
              ))}
            </motion.div>
          </ScrollArea>
        </Card>
      </motion.div>
    </motion.div>
  );
}
