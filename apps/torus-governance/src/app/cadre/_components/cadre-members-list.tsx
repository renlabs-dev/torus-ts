import { Card } from "@torus-ts/ui";

const people = [
  {
    name: "timo33",
    role: "12/08/2024",
  },
  {
    name: "__honza__",
    role: "12/08/2024",
  },
  {
    name: "steinerkelvin",
    role: "12/08/2024",
  },
  {
    name: "jairo.mp4",
    role: "12/08/2024",
  },
  {
    name: "  fam7925",
    role: "12/08/2024",
  },
];

export const CadreMembersList = () => {
  return (
    <div
      id="teste"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4"
    >
      {people.map((person) => (
        <Card
          key={person.name}
          className="relative flex w-auto items-center space-x-3 p-6"
        >
          <div className="w-auto">
            <p className="text-sm font-medium">{person.name}</p>
            <p className="truncate text-sm">{person.role}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
