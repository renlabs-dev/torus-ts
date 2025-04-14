"use client";

import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

interface UsdPriceContextType {
  usdPrice: number;
}

const UsdPriceContext = createContext<UsdPriceContextType>({
  usdPrice: 0,
});

interface UsdPriceProviderProps {
  children: ReactNode;
}

export function UsdPriceProvider({ children }: UsdPriceProviderProps) {
  const { data: usdPrice = 0 } = useGetTorusPrice({
    refetchInterval: 60 * 1000,
    gcTime: 60 * 1000,
  });

  return (
    <UsdPriceContext.Provider value={{ usdPrice }}>
      {children}
    </UsdPriceContext.Provider>
  );
}

export function useUsdPrice(): UsdPriceContextType {
  return useContext(UsdPriceContext);
}
