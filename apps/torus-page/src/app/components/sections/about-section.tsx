interface Feature {
  description: string;
}

interface AboutSectionProps {
  title: string;
  subtitle: string;
  sectionName: string;
  features: Feature[];
  index: number;
  iconSrc: string;
}

export function AboutSection({
  title,
  subtitle,
  sectionName,
  features,
}: AboutSectionProps): JSX.Element {
  return (
    <section
      className="mb-12 flex max-w-2xl flex-col items-center justify-center gap-4 text-center"
      id={sectionName}
    >
      <div>
        <p className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </p>
        <h2 className="text-base font-medium text-gray-400">{subtitle}</h2>
      </div>
      {features.map((feature) => (
        <div
          key={feature.description}
          className="flex items-center justify-start gap-4 px-3"
        >
          <p className="inline">{feature.description}</p>
        </div>
      ))}
    </section>
  );
}
