import { Prophet } from "~/types/prophet";
import { ProfileCard } from "~/app/_components/ProfileCard";

type Props = {
  prophets: Prophet[];
};

export default function CardsGrid({ prophets }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 md:gap-8">
      {prophets.map((p) => (
        <ProfileCard key={p.handle} {...p} />
      ))}
    </div>
  );
}
