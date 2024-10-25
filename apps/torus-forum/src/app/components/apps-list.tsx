import { links } from "@torus-ts/ui";
import Link from "next/link";

const appsList = [
  {
    title: "Landing page",
    url: links.landing_page
  },
  {
    title: "Wallet",
    url: links.wallet
  },
  {
    title: "Validator",
    url: "#"
  },
  {
    title: "Governance",
    url: links.governance
  },
]

export default function AppsList() {
  return (
    <div className="flex flex-col items-start justify-between w-full pt-10 pb-12 mt-auto transition border-t lg:flex-row lg:items-end border-white/10 animate-fade-down animate-delay-1000">
      <div className="flex flex-col items-center w-full pb-4 lg:pb-0 md:w-fit md:block ">
        <h3 className="mb-3 text-base text-gray-500 max-w-fit">Want to engage in the community?</h3>
        <h2 className="text-4xl font-medium">Try our <span className="text-green-500">apps</span></h2>
      </div>
      <div className="flex items-center w-full gap-4 md:w-auto">
        <div className="flex flex-col items-center w-full gap-4 md:flex-row">
          {appsList.map((app) => (
            <Link key={app.url} className="items-center w-full md:w-fit text-center md:text-left justify-center px-5 py-2.5 border h-fit bg-white/5 border-white/20 hover:border-green-500 hover:cursor-pointer hover:text-green-500" href={app.url} >{app.title}</Link>
          ))
          }
        </div >
      </div >
    </div >
  );
}
