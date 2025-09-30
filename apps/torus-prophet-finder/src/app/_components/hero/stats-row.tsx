export default function StatsRow() {
  return (
    <div className="pb-16 text-center font-mono text-sm text-white/75 sm:text-base md:pb-20 md:text-lg">
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
          <span className="font-bold">36</span> COMPLETE PROFILES
        </span>
      </div>
      <div className="mt-2">
        <span className="ml-2">
          Powered by <span className="font-bold">Torus</span>
        </span>
      </div>
    </div>
  );
}
