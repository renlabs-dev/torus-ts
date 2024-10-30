import { sections } from "~/utils/mocks/sections-mock";
import { AboutSection } from "../components/sections/about-section";

export default function Page(): JSX.Element {
  return (
    <main className="flex w-full max-w-screen-2xl animate-fade-up flex-col justify-center">
      <div className="mx-auto mt-24 flex-grow">
        {sections.map((section, index) => {
          return (
            <AboutSection
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
      </div>
    </main>
  );
}
