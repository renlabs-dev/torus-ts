import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AnimationConfig } from "../types/animation";

export const useAnimationConfig = () => {
  const params = useRef<AnimationConfig>({
    time: 0,
    frequency: 0,
    amplitude: 0,
    density: 0,
    strength: 0,
    deepPurple: 0,
  });

  useFrame((_, delta) => {
    params.current.time += delta;

    // Enhanced organic movement
    const t = params.current.time;
    params.current.frequency =
      Math.sin(t * 0.5) * 2 + Math.cos(t * 0.3) * 1.5 + Math.sin(t * 0.7) * 0.5;

    params.current.amplitude =
      Math.cos(t * 0.3) * 2 + Math.sin(t * 0.2) * 1.5 + Math.cos(t * 0.5) * 0.3;

    params.current.density =
      Math.sin(t * 0.2) * 0.5 + Math.cos(t * 0.4) * 0.3 + 1.2;

    params.current.strength =
      Math.abs(Math.sin(t * 0.2)) * 0.5 +
      Math.abs(Math.cos(t * 0.3)) * 0.3 +
      0.2;

    params.current.deepPurple =
      (Math.sin(t * 0.1) * 0.5 + 0.5) * (Math.cos(t * 0.2) * 0.5 + 0.5);
  });

  return params.current;
};
