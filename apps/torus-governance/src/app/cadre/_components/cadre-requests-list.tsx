import { Button, Card, CardFooter, Loading } from "@torus-ts/ui";
import Image from "next/image";

type Status = "UNVOTED" | "FOR" | "AGAINST" | null;

const people = [
  {
    id: 1,
    discordId: "ed.sdr",
    requestDate: "12/09/2024",
    reason:
      "Your opinion is fine, it's okay to be wrong! We call it skill issue!",
    votesFor: 80,
    status: "UNVOTED",
    loading: false,
  },
  {
    id: 2,
    discordId: "vinicius.sacramento",
    requestDate: "12/09/2024",
    reason: "What if?",
    votesFor: 80,
    status: "UNVOTED",
    loading: true,
  },
  {
    id: 3,
    discordId: "Jack.and.the.huge.beanstalk",
    requestDate: "12/09/2024",
    reason:
      "I have some crazy beans on my pocket, would you like to smoke some?",
    votesFor: 25,
    status: "AGAINST",
    loading: false,
  },
  {
    id: 4,
    discordId: "lord.pureza",
    requestDate: "12/09/2024",
    reason:
      "I'm Pureza. If you keep doing this, I will show you the Squidward Tentacles' nose!",
    votesFor: 99,
    status: "FOR",
    loading: false,
  },
];

const handleStatusColors = (status: "FOR" | "AGAINST" | "UNVOTED" | null) => {
  const statusColors = {
    FOR: "text-green-400 ring-green-400/20",
    AGAINST: "text-red-400 ring-red-400/20",
    UNVOTED: "text-gray-400 ring-gray-400/20",
  };

  return statusColors[status ?? "UNVOTED"];
};

function handlePercentages(
  favorablePercent: number | null,
): JSX.Element | null {
  if (favorablePercent === null) return null;

  const againstPercent = 100 - favorablePercent;
  if (Number.isNaN(favorablePercent)) {
    return (
      <div className="flex w-auto pt-4 text-center text-sm text-yellow-500 lg:w-auto">
        <p>– %</p>
      </div>
    );
  }
  return (
    <div className="flex w-full items-center justify-start space-x-0 divide-x divide-white/10 pt-4 text-center text-sm lg:w-auto">
      <div className="flex gap-2 pr-2">
        <span className="text-green-500">
          Favorable {favorablePercent.toFixed(0)}%
        </span>
      </div>
      <div className="flex gap-2 pl-2">
        <span className="text-red-500">
          {againstPercent.toFixed(0)}% Against
        </span>
      </div>
    </div>
  );
}

export const CadreRequestsList = () => {
  return (
    <ul
      role="list"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2"
    >
      {people.map((person) => (
        <Card className="relative" key={person.id}>
          {person.loading && (
            <div className="bg-white/2 absolute z-50 flex h-full w-full items-center justify-center">
              <Loading className="mr-1 h-6 w-6" />
              <p className="text-gray-300">Approving</p>
            </div>
          )}

          <li
            className={`${person.loading ? "blur-sm" : ""} relative flex h-full flex-col`}
          >
            <div className="flex w-full items-center justify-between space-x-4 p-6">
              <div className="flex-1 truncate">
                <div className="flex items-center space-x-3">
                  <h3 className="truncate text-lg font-medium text-gray-100">
                    {person.discordId}
                  </h3>

                  <span
                    className={`inline-flex flex-shrink-0 items-center rounded-full bg-[#898989]/5 px-1.5 py-0.5 text-xs font-medium ${handleStatusColors(person.status as Status)} ring-1 ring-inset`}
                  >
                    {person.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {person.requestDate}
                </p>
                <p className="mt-3 text-pretty text-gray-400">
                  {person.reason}
                </p>
              </div>
            </div>

            <CardFooter className="mt-auto flex flex-col gap-4">
              {handlePercentages(person.votesFor)}

              <div className="flex w-full gap-4">
                <Button className="relative w-full py-4 text-sm font-semibold">
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  className="relative w-full py-4 text-sm font-semibold"
                >
                  Refuse
                </Button>
              </div>
            </CardFooter>
          </li>
        </Card>
      ))}
    </ul>
  );
};
