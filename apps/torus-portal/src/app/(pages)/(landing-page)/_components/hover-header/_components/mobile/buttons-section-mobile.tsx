import { Button } from "@torus-ts/ui/components/button";
import { CircleDotDashed, Diameter } from "lucide-react";
import { motion } from "motion/react";
import { CustomButton } from "../custom-button";
import { ANIMATIONS, CONTENT } from "../data";

interface ButtonsSectionMobileProps {
  onAboutClick: () => void;
}

export function ButtonsSectionMobile({
  onAboutClick,
}: Readonly<ButtonsSectionMobileProps>) {
  const { mobileButtons } = CONTENT;

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

      {/* About Button */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={12}
        className="absolute mt-[14rem] flex w-full justify-center"
      >
        <Button
          className="bg-accent hover:bg-background rounded-full disabled:opacity-100"
          onClick={onAboutClick}
          variant="outline"
        >
          About
        </Button>
      </motion.div>
    </motion.div>
  );
}
