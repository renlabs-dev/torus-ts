export default function StatsRow() {
  return (
    <div className="pb-16 md:pb-20 text-center text-sm sm:text-base md:text-lg font-mono text-white/75">
      <div>
        <span>
          <span className="font-bold">247,268</span> TWEETS COLLECTED
        </span>
        <span className="mx-2 text-white/40">•</span>
        <span>
          <span className="font-bold">116</span> ACTIVE PROFILES
        </span>
        <span className="mx-2 text-white/40">•</span>
        <span>
          <span className="font-bold">2,132</span> AVG PER USER
        </span>
        <span className="mx-2 text-white/40">•</span>
        <span>
          <span className="font-bold">36</span> COMPLETE PROFILES
        </span>
      </div>
      <div className="mt-2">
        <span className="text-white/40">•</span>
        <span className="ml-2">
          Powered by <span className="font-bold">Torus</span>
        </span>
      </div>
    </div>
  );
}
