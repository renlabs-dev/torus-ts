import * as React from "react";

// Extremely subtle vertical edge glow along the page borders (below hero).
// No diagonals, no rays — just a faint, straight edge softening.
export default function CardsBorderGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      <EdgeGlow side="left" />
      <EdgeGlow side="right" />
    </div>
  );
}

function EdgeGlow({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  // Very low alpha, straight inward gradient. Keep it subtle.
  // DEBUG: white hue for inspection, opacity reduced further.
  const grad = `linear-gradient(to ${isLeft ? "right" : "left"},
    rgba(255, 255, 255, 0.081),
    rgba(255, 255, 255, 0.041),
    transparent)`;
  return (
    <div
      className={[
        "absolute inset-y-0",
        isLeft ? "left-0" : "right-0",
        // DEBUG: slightly wider for easier visibility
        "w-10 sm:w-12 md:w-14 lg:w-16",
      ].join(" ")}
      style={{ background: grad }}
    />
  );
}
