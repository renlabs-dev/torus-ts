// import type { ForwardRefExoticComponent, SVGProps } from "react";

interface Feature {
  description: string;
  // icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref">>;
}

interface GenericSectionProps {
  title: string;
  subtitle: string;
  sectionName: string;
  features: Feature[];
  index: number;
  iconSrc: string;
}

export function GenericSection({
  title,
  subtitle,
  sectionName,
  features,
}: GenericSectionProps): JSX.Element {
  return (
    <section
      className="mx-auto my-6 flex h-full w-full max-w-screen-2xl flex-col items-start justify-center gap-6 divide-gray-500 border border-white/20 bg-[#898989]/5 p-8 backdrop-blur-md"
      id={sectionName}
    >
      <div>
        <p className="text-left text-3xl font-semibold tracking-tight text-white">
          {title}
        </p>
        <h2 className="text-left text-base font-medium text-gray-400">
          {subtitle}
        </h2>
      </div>

      <div className="flex flex-col gap-4 text-white">
        {features.map((feature) => (
          <div
            className="relative flex items-center justify-start gap-4 px-3"
            key={feature.description}
          >
            <div className="inline font-semibold text-white">
              {/* <feature.icon
                aria-hidden="true"
                className="absolute left-0 top-1 h-5 w-5 fill-green-500"
              /> */}
            </div>
            <p className="inline">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
