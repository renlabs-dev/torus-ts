/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { CustomButton } from "../custom-button";
import { ANIMATIONS, CONTENT } from "../data";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { cn } from "@torus-ts/ui/lib/utils";
import { motion } from "framer-motion";
import { ArrowBigDown } from "lucide-react";
import { useEffect, useState } from "react";

interface ButtonsSectionProps {
  isExpanded: boolean;
  showStarter: boolean;
  showNetwork: boolean;
  onStarterClick: () => void;
  onNetworkClick: () => void;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ButtonsSection({
  showStarter,
  showNetwork,
  onStarterClick,
  onNetworkClick,
  isExpanded,
  setIsExpanded,
}: Readonly<ButtonsSectionProps>) {
  const [cardPosition, setCardPosition] = useState(40);
  const { desktopButtons, description } = CONTENT;

  useEffect(() => {
    if (showStarter || showNetwork) {
      setCardPosition(150);
    } else {
      setCardPosition(20);
    }
  }, [showStarter, showNetwork]);

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
        className="flex w-full max-w-3xl justify-around gap-[4.6em]"
        style={{ zIndex: isExpanded ? 1 : "auto" }}
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
        className="absolute mt-20 flex w-full max-w-[43rem] justify-around gap-36"
        style={{ zIndex: isExpanded ? 1 : "auto" }}
      >
        <CustomButton
          href={desktopButtons.starter[2]!.href}
          isHidden={!showStarter}
        >
          {desktopButtons.starter[2]!.text}
        </CustomButton>
        <CustomButton
          href={desktopButtons.network[2]!.href}
          isHidden={!showNetwork}
        >
          {desktopButtons.network[2]!.text}
        </CustomButton>
      </motion.div>

      {/* Fourth Row with Card */}
      <motion.div
        variants={ANIMATIONS.BUTTON}
        custom={11}
        className="absolute w-full max-w-[46.5rem]"
        style={{ zIndex: isExpanded ? 1 : "auto" }}
        animate={{ top: cardPosition }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.div
          layout
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          variants={ANIMATIONS.CARD}
          transition={{ duration: 0.5 }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Card className="mx-5 cursor-pointer overflow-hidden pb-4 pl-6 pr-4 pt-6 md:mx-0">
            <ScrollArea
              className={cn(isExpanded ? "h-[calc(40vh)]" : "h-fit", "pr-2")}
            >
              <motion.div layout>{description[0]}</motion.div>
              {!isExpanded && (
                <motion.div layout className="mt-2 flex justify-center">
                  <ArrowBigDown className="h-6 w-6 animate-pulse text-zinc-500" />
                </motion.div>
              )}
              <motion.div
                variants={ANIMATIONS.TEXT}
                initial="collapsed"
                animate={isExpanded ? "expanded" : "collapsed"}
                transition={{ duration: 0.5 }}
              >
                {isExpanded && (
                  <>
                    {description.slice(1).map((paragraph, index) => (
                      <p key={index} className="mt-3">
                        {paragraph}
                      </p>
                    ))}
                  </>
                )}
              </motion.div>
            </ScrollArea>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
