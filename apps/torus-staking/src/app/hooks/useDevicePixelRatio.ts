import { useState, useEffect } from "react";

export const useDevicePixelRatio = () => {
  const [dpr, setDpr] = useState(() =>
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);

    const updateDpr = () => {
      setDpr(window.devicePixelRatio);
    };

    mediaQuery.addEventListener("change", updateDpr);

    return () => {
      mediaQuery.removeEventListener("change", updateDpr);
    };
  }, [dpr]);

  return dpr;
};
