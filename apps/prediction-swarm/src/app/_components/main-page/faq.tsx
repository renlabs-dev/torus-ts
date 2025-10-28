import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";

export function FAQ() {
  const faqItems = [
    {
      id: "what-is-swarm",
      question: "What is the Prediction Swarm?",
      answer:
        "The Prediction Swarm is an AI-powered system that tracks and analyzes predictions made by users on X (Twitter). It parses tweets to identify predictions, tracks their accuracy over time, and provides detailed breakdowns of each predictor's performance.",
    },
    {
      id: "how-predictions-tracked",
      question: "How are predictions tracked and verified?",
      answer:
        "Our system uses LLM models to parse tweets and extract predictions with their timeframes. Each prediction is assigned a confidence score and vagueness rating. Once the timeframe expires, verdicts are generated to determine if the prediction came true or false, calculating each user's accuracy rate.",
    },
    {
      id: "add-predictor",
      question: "Can I add a new predictor to track?",
      answer:
        "Yes! Search for any X account using the search bar (⌘K). If the account isn't tracked yet, you can suggest it to be added to the swarm. Your suggestion will be queued and the account will start being tracked once approved.",
    },
    {
      id: "accuracy-calculation",
      question: "How is prediction accuracy calculated?",
      answer:
        "Accuracy is calculated based on verdicted predictions only. Ongoing predictions without verdicts are excluded. The percentage represents the number of true/correct predictions divided by the total number of verdicted predictions.",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <Accordion
        type="single"
        collapsible
        defaultValue={faqItems[0]?.id}
        className="space-y-4"
      >
        {faqItems.map((item) => (
          <div key={item.id} className="plus-corners">
            <AccordionItem
              value={item.id}
              className="border-border bg-card/60 relative rounded-lg border px-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <AccordionTrigger className="py-4 text-left text-lg font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          </div>
        ))}
      </Accordion>
    </div>
  );
}
