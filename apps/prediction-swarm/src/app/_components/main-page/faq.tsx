import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

const FAQ = ({ items }: FAQAccordionProps) => {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Accordion type="single" collapsible className="space-y-4">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border-border bg-card rounded-lg border px-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <AccordionTrigger className="py-4 text-left text-lg font-medium hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;
