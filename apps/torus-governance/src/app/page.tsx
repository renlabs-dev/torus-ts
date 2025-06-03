import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { StatueAnimation } from "./_components/statue-animation";

export const metadata = () =>
  createSeoMetadata({
    title: "Torus DAO - Decentralized Governance Platform",
    description: "Participate in the governance of Torus Network through the official DAO platform. Vote on proposals and shape the future of the network.",
    keywords: ["torus dao", "dao homepage", "torus governance", "blockchain dao", "decentralized governance"],
    baseUrl: env("BASE_URL"),
    canonical: "/",
  });

export default function HomePage() {
  return (
    <div className="animate-fade -z-10 h-screen w-full overflow-hidden">
      <StatueAnimation />
    </div>
  );
}
