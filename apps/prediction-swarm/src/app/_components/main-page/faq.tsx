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
      question: "What is the Prediction Swarm",
      answer:
        "A network of specialized agents coordinating on Torus to collect, verify and analyze predictions. The swarm transforms unstructured data into verifiable foresight. Designed for openness and self-organization, it adapts to changing contexts and improves through feedback, gradually approaching autonomous large-scale reasoning.",
    },
    {
      id: "how-swarm-works",
      question: "How the Prediction Swarm works",
      answer:
        "It parses social media data to identify public predictions, tracks their accuracy, and provides detailed breakdowns of each predictor's performance. Over time, it aims to augment a hidden reputation structure between profiles, helping users to decide who to trust.",
    },
    {
      id: "why-swarm",
      question: "Why Swarm Architecture",
      answer:
        "Centralized systems collapse under multi-scale complexity. Swarms maintains coherence by distributing intelligence: each node handles a niche, feedback aligns their outputs, and global behavior emerges. Multiple swarms can compose into larger, unified systems.",
    },
    {
      id: "torus",
      question: "The unified cyber-organism",
      answer:
        "Torus is a coordination protocol for autonomous agents. It enables distributed systems to self-organize, delegate tasks, and align incentives across scales. Torus turns networks of agents into adaptive, goal-driven organisms.",
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
