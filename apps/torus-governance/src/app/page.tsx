import { StatueAnimation } from "./_components/statue-animation";

export default function HomePage() {
  return (
    <div className="animate-fade -z-10 h-screen w-full overflow-hidden">
      <StatueAnimation />
    </div>
  );
}
