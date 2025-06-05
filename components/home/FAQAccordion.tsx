"use client";

import { Accordion, AccordionItem } from "@heroui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
}

export const FAQAccordion = ({ faqs }: FAQAccordionProps) => {
  return (
    <Accordion variant="bordered">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={index}
          aria-label={faq.question}
          className="text-base"
          title={faq.question}
        >
          <p className="text-default-600 pb-4">{faq.answer}</p>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
