import { Loading } from "@commune-ts/ui"
import Image from "next/image";

type Status = "UNVOTED" | "FOR" | "AGAINST" | null

const people = [
  {
    id: 123,
    discordId: "ed.sdr",
    requestDate: '12/09/2024',
    reason: "Your opinion is fine, it's okay to be wrong! We call it skill issue!",
    votesFor: 80,
    status: "UNVOTED",
    loading: false,

  },
  {
    id: 123,
    discordId: "vinicius.sacramento",
    requestDate: '12/09/2024',
    reason: "What if?",
    votesFor: 80,
    status: "UNVOTED",
    loading: true,
  },
  {
    id: 123,
    discordId: "Jack.and.the.huge.beanstalk",
    requestDate: '12/09/2024',
    reason: "I have some crazy beans on my pocket, would you like to smoke some?",
    votesFor: 25,
    status: "AGAINST",
    loading: false,
  },
  {
    id: 123,
    discordId: "lord.pureza",
    requestDate: '12/09/2024',
    reason: "I'm Pureza. If you keep doing this, I will show you the Squidward Tentacles' nose!",
    votesFor: 99,
    status: "FOR",
    loading: false,
  },
]

const handleStatusColors = (status: "FOR" | "AGAINST" | "UNVOTED" | null) => {
  const statusColors = {
    FOR: "text-green-400 ring-green-400/20",
    AGAINST: "text-red-400 ring-red-400/20",
    UNVOTED: "text-gray-400 ring-gray-400/20"
  }

  return statusColors[status ?? "UNVOTED"]
}

function handlePercentages(
  favorablePercent: number | null,
): JSX.Element | null {
  if (favorablePercent === null) return null;

  const againstPercent = 100 - favorablePercent;
  if (Number.isNaN(favorablePercent)) {
    return (
      <div className="w-auto flex pt-2 mt-8 text-center text-sm text-yellow-500 lg:w-auto">
        <p>
          – %
        </p>
      </div>
    );
  }
  return (
    <div className="flex w-full items-center justify-start space-x-0 divide-x mt-8 divide-white/10 pt-2 text-center text-sm lg:w-auto">
      <div className="flex gap-1 pr-2">
        <span className="text-green-500">{favorablePercent.toFixed(0)}%</span>
        <Image
          alt="favorable arrow up icon"
          height={14}
          src="/favorable-up.svg"
          width={10}
        />
      </div>
      <div className="flex gap-1 pl-2">
        <span className="text-red-500"> {againstPercent.toFixed(0)}% </span>
        <Image
          alt="against arrow down icon"
          height={14}
          src="/against-down.svg"
          width={10}
        />
      </div>
    </div>
  );
}

export const CadreRequestsList = () => {
  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
      {people.map((person) => (
        <div className="relative" key={person.id}>
          {
            person.loading && (
              <div className="bg-white/2 absolute z-50 w-full h-full flex justify-center items-center">
                <Loading className="h-6 w-6 mr-1" />
                <p className="text-gray-300">Approving</p>
              </div>
            )
          }

          <li className={`${person.loading ? 'blur-[2px]' : ''} relative col-span-1 divide-y divide-white/20 border border-white/20 bg-[#898989]/5`}>
            <div className="flex w-full items-center justify-between space-x-6 p-6">
              <div className="flex-1 truncate">
                <div className="flex items-center space-x-3">
                  <h3 className="truncate text-lg font-medium text-gray-100">{person.discordId}</h3>

                  <span className={`inline-flex flex-shrink-0 items-center rounded-full bg-[#898989]/5 px-1.5 py-0.5 text-xs font-medium ${handleStatusColors(person.status as Status)} ring-1 ring-inset`}>
                    {person.status}
                  </span>

                </div>
                <p className="mt-1 truncate text-sm text-gray-500">{person.requestDate}</p>
                <p className='mt-3 text-pretty text-gray-400'>{person.reason}</p>

                {handlePercentages(person.votesFor)}

              </div>
            </div>

            <div>
              <div className="flex divide-x divide-white/20">
                <div className="flex w-0 flex-1">
                  <a
                    href={`#`}
                    className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                  >
                    <p className='text-red-500'>Refuse</p>

                  </a>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <a
                    href={`#`}
                    className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                  >
                    <p className='text-green-500'>Approve</p>
                  </a>
                </div>
              </div>
            </div>
          </li>
        </div>
      ))}
    </ul>
  )
}
