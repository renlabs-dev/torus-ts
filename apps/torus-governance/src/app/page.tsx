import { StatueAnimation } from "./_components/statue-animation";

export function generateMetadata() {
  return import("./layout").then((module) => module.generateMetadata());
}

export default function HomePage() {
  return (
    <div className="animate-fade -z-10 h-screen w-full overflow-hidden">
      <StatueAnimation />
    </div>
  );
}
