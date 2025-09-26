import StormHero from "~/app/_components/hero/StormHero.view";
import CardsSection from "~/app/_components/cards/CardsSection.view";

export default function Page() {
  return (
    <div className="relative min-h-screen w-full font-sans bg-[#050816] text-[#e6eaf0]">
      <StormHero />
      <CardsSection />
    </div>
  );
}
