import CardsSection from "~/app/_components/cards/cards-section.view";
import StormHero from "~/app/_components/hero/storm-hero.view";

export default function Page() {
  return (
    <div className="relative min-h-screen w-full bg-[#050816] font-sans text-[#e6eaf0]">
      <StormHero />
      <CardsSection />
    </div>
  );
}
