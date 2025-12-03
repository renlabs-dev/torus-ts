import { Button } from "@torus-ts/ui/components/button";
import { motion } from "motion/react";
import { CustomButton } from "../custom-button";
import { ANIMATIONS, CONTENT } from "../data";

interface ButtonsSectionProps {
  showStarter: boolean;
  showNetwork: boolean;
  onStarterClick: () => void;
  onNetworkClick: () => void;
  onAboutClick: () => void;
}

export function ButtonsSection({
  showStarter,
  showNetwork,
  onStarterClick,
  onNetworkClick,
  onAboutClick,
}: Readonly<ButtonsSectionProps>) {
  const { desktopButtons } = CONTENT;

  return (
    <motion.div
      className="absolute top-44 flex w-full justify-center gap-[7em]"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* First Button Row */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={5}
        className="absolute bottom-[5.2em] flex w-full max-w-[38.5rem] items-center justify-around"
      >
        <Button
          className="bg-accent hover:bg-background rounded-full disabled:opacity-100"
          onClick={onStarterClick}
          variant="outline"
        >
          Starter
        </Button>
        {desktopButtons.common.map((button, index) => (
          <CustomButton key={index} href={button.href}>
            {button.text}
          </CustomButton>
        ))}
        <Button
          className="bg-accent hover:bg-background rounded-full disabled:opacity-100"
          onClick={onNetworkClick}
          variant="outline"
        >
          Network
        </Button>
      </motion.div>

      {/* Second Button Row */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={0}
        className="z-50 flex w-full max-w-3xl justify-around gap-[4.6em]"
      >
        {desktopButtons.starter.slice(0, 2).map((button, index) => (
          <CustomButton key={index} href={button.href} isHidden={!showStarter}>
            {button.text}
          </CustomButton>
        ))}
        {desktopButtons.network.slice(0, 2).map((button, index) => (
          <CustomButton key={index} href={button.href} isHidden={!showNetwork}>
            {button.text}
          </CustomButton>
        ))}
      </motion.div>

      {/* Third Button Row */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={2}
        className="absolute z-50 mt-20 flex w-full max-w-[43rem] justify-around gap-36"
      >
        {desktopButtons.starter[2] && (
          <CustomButton
            href={desktopButtons.starter[2].href}
            isHidden={!showStarter}
          >
            {desktopButtons.starter[2].text}
          </CustomButton>
        )}
        {desktopButtons.network[2] && (
          <CustomButton
            href={desktopButtons.network[2].href}
            isHidden={!showNetwork}
          >
            {desktopButtons.network[2].text}
          </CustomButton>
        )}
      </motion.div>

      {/* About Button */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={12}
        className="absolute mt-[0.18rem] flex w-full justify-center"
      >
        <Button
          className="bg-accent hover:bg-background z-50 rounded-full disabled:opacity-100"
          onClick={onAboutClick}
          variant="outline"
        >
          About
        </Button>
      </motion.div>
    </motion.div>
  );
}
