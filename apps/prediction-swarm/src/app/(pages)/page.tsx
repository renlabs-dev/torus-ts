// import PrismaticBurst from "@torus-ts/ui/components/PrismaticBurst";
import FAQ from "../_components/main-page/faq";
import ListItem from "../_components/main-page/list-item";
import { SearchProphet } from "../_components/main-page/search-prophet";

const faqItems = [
  {
    id: "trial",
    question: "Is there a 14-days trial?",
    answer:
      "Yes, we offer a 14-day free trial for all new users. You can access all premium features during this period without any limitations. No credit card required to start your trial.",
  },
  {
    id: "premium",
    question: "What's the benefits of the Premium Membership?",
    answer:
      "Premium members get access to advanced features, priority support, unlimited usage, exclusive content, and early access to new features. You also get dedicated account management and custom integrations.",
  },
  {
    id: "billing",
    question: "How does billing work?",
    answer:
      "We offer flexible billing options including monthly and annual plans. Annual subscribers get a 20% discount. All plans include a 30-day money-back guarantee.",
  },
  {
    id: "support",
    question: "What kind of support do you offer?",
    answer:
      "We provide 24/7 email support for all users, live chat for premium members, and dedicated phone support for enterprise customers. Our average response time is under 2 hours.",
  },
];

export default function Page() {
  return (
    <div>
      <div className="bg-accent/6£0 relative pt-[35rem]">
        {/* <div className="absolute inset-0 -z-10">
          <PrismaticBurst
            distort={6}
            speed={0.2}
            colors={["#696969", "#383838", "#383838"]}
          />
        </div> */}
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="mb-20">
            <SearchProphet />
          </div>

          <div className="mx-auto -mb-36 grid max-w-6xl gap-6 md:grid-cols-3">
            <ListItem
              title="Predictor Profiles"
              description="View detailed profiles of any predictor on the swarm."
              linkText="View profiles"
              href="#faqs"
            />
            <ListItem
              title="Tickers"
              description="View real-time predictions for all tickers on the swarm."
              linkText="View tickers"
              href="#tickers"
            />
            <ListItem
              title="Predictor Feed"
              description="View the latest predictions from all predictors on the swarm."
              linkText="View feed"
              href="#feed"
            />
          </div>
        </div>
      </div>

      <div id="faqs" className="bg-background/80 py-16 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-foreground mb-2 text-2xl font-bold">
              The fractal nature of foresight
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              From cells to societies, intelligence emerges through nested
              agency. The swarm applies this principle to predictions, mapping
              who to trust and when, turning uncertainty into clarity.
            </p>
          </div>

          <FAQ items={faqItems} />
        </div>
      </div>
    </div>
  );
}
