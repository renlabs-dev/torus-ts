"use client";

import React from "react";

// import { BalanceSection } from "./balance-section";
import { CreateModal } from "./modal";

export const MobileHeaderContent = () => {
  return (
    <>
      {/* <div className="flex w-full flex-col text-green-500">
        <BalanceSection />
      </div> */}

      <div className="flex w-full flex-col gap-4 border-b border-white/20 p-4 text-green-500">
        <CreateModal />
      </div>
    </>
  );
};
