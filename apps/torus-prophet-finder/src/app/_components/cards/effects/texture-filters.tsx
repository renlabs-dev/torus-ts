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
            baseFrequency="0.006 0.008"
            numOctaves="2"
            seed="2"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="5s"
              values="0.005 0.007; 0.010 0.013; 0.005 0.007"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              values="4; 10; 4"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>

        {/* Static variant for reduced motion preference */}
        <filter id="accel-warp-static">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.008"
            numOctaves="2"
            seed="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Boosted variant for hover showcase */}
        <filter id="accel-warp-boost">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.010 0.015"
            numOctaves="2"
            seed="5"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="3.6s"
              values="0.009 0.013; 0.017 0.023; 0.009 0.013"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              values="8; 18; 8"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>
      </defs>
    </svg>
  );
}
