import { sections } from "~/utils/mocks/sections-mock";
import { FrequentQuestions } from "../components/sections/frequent-questions";
import { GenericSection } from "../components/sections/generic-section";

export default function Page(): JSX.Element {
  return (
    <main className="mx-auto max-w-screen-2xl animate-fade-up px-4 py-16">
      <div className="flex w-full flex-col space-y-4">
        <h2 className="w-[80%] text-3xl font-medium text-white lg:text-5xl">
          About
          <span className="font-thin text-green-500"> us</span>
        </h2>
      </div>
      {sections.map((section, index) => {
        return (
          <GenericSection
            features={section.features}
            iconSrc={section.iconSrc}
            index={index}
            key={section.title}
            sectionName={section.sectionName}
            subtitle={section.subtitle}
            title={section.title}
          />
        );
      })}
      <div className="flex w-full flex-col space-y-4 pb-8 pt-16">
        <h2 className="w-[80%] text-3xl font-medium text-white lg:text-5xl">
          FAQ
        </h2>
      </div>
      <FrequentQuestions />
    </main>
  );
}
