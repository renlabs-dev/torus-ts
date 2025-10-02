export default function TextureFilters() {
  return (
    <svg
      aria-hidden
      focusable="false"
      width={0}
      height={0}
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Animated, visible displacement for mythic/accelerational texture */}
        <filter id="accel-warp">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.011"
            numOctaves="2"
            seed="2"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="5s"
              values="0.006 0.008; 0.012 0.016; 0.006 0.008"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              values="6; 14; 6"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>

        {/* Static variant for reduced motion preference */}
        <filter id="accel-warp-static">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.011"
            numOctaves="2"
            seed="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Boosted variant for hover showcase */}
        <filter id="accel-warp-boost">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.018"
            numOctaves="2"
            seed="5"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="3.6s"
              values="0.01 0.014; 0.02 0.028; 0.01 0.014"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              values="12; 24; 12"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>
      </defs>
    </svg>
  );
}
