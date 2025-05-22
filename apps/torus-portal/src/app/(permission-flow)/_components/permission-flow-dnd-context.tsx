import type { ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

type DnDType = string | null;
type DnDContextType = [DnDType, Dispatch<SetStateAction<DnDType>>];

// eslint-disable-next-line @typescript-eslint/no-empty-function
const DnDContext = createContext<DnDContextType>([null, (_) => {}]);

export function DnDProvider({ children }: { children: ReactNode }) {
  const [type, setType] = useState<DnDType>(null);

  return (
    <DnDContext.Provider value={[type, setType]}>
      {children}
    </DnDContext.Provider>
  );
}

export default DnDContext;

export function useDnD() {
  return useContext(DnDContext);
}
