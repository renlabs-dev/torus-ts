import { ProfileCard } from "~/app/_components/ProfileCard";
import type { Prophet } from "~/types/prophet";

interface Props {
  prophets: Prophet[];
}

export default function CardsGrid({ prophets }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 md:gap-8 lg:grid-cols-3">
      {prophets.map((p) => (
        <ProfileCard key={p.handle} {...p} />
      ))}
    </div>
  );
}
