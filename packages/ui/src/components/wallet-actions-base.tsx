"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import * as React from "react";
import { useState } from "react";

export interface ActionButton {
  text: string;
  component: React.ReactNode;
  params?: string;
}

interface WalletActionsBaseProps {
  buttons: ActionButton[];
  onTabChange?: (value: string) => void;
  defaultTab?: string;
  currentTab?: string;
  className?: string;
}

export function WalletActionsBase({
  buttons,
  onTabChange,
  defaultTab,
  currentTab,
  className = "animate-fade flex w-full flex-col gap-4",
}: WalletActionsBaseProps) {
  const [internalTab, setInternalTab] = useState(
    defaultTab ?? buttons[0]?.text ?? "",
  );

  const handleTabChange = (value: string) => {
    setInternalTab(value);
    onTabChange?.(value);
  };

  const activeTab = currentTab ?? internalTab;

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={className}
    >
      <TabsList
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${buttons.length}, 1fr)` }}
      >
        {buttons.map((button) => (
          <TabsTrigger key={button.text} value={button.params ?? button.text}>
            {button.text}
          </TabsTrigger>
        ))}
      </TabsList>
      {buttons.map((button) => (
        <TabsContent key={button.text} value={button.params ?? button.text}>
          {button.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
