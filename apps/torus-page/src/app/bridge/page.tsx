import { bridge } from "~/utils/sections-mock";

export default function Page(): JSX.Element {
  return (
    <main className="flex w-full animate-fade-up flex-col pt-24 md:pt-40">
      {bridge.map((section) => (
        <section
          id={section.sectionName}
          key={section.sectionName}
          className="mx-auto mb-12 flex max-w-2xl flex-col gap-4 px-4 text-center"
        >
          <span>
            <p className="text-3xl font-semibold tracking-tight text-white">
              {section.title}
            </p>
            <h2 className="text-base font-medium text-gray-400">
              {section.subtitle}
            </h2>
          </span>
          {section.features.map((feature) => (
            <div
              key={feature.description}
              className="flex items-center justify-start gap-4 px-3"
            >
              <p className="inline">{feature.description}</p>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
