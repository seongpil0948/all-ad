"use client";

import { Accordion, AccordionItem } from "@heroui/accordion";
import { motion, useReducedMotion } from "framer-motion";

import { staggerContainer } from "@/utils/animations";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
}

export const FAQAccordion = ({ faqs }: FAQAccordionProps) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      animate={prefersReducedMotion ? undefined : "animate"}
      initial={prefersReducedMotion ? undefined : "initial"}
      variants={prefersReducedMotion ? undefined : staggerContainer}
      data-testid="faq-section"
    >
      <Accordion
        variant="bordered"
        selectionMode={"multiple"}
        data-testid="faq-accordion"
      >
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            aria-label={faq.question}
            className="text-base"
            title={faq.question}
            data-testid={`faq-item-${index}`}
          >
            <motion.div
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              className="text-default-600 pb-4"
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={prefersReducedMotion ? undefined : { delay: 0.1 }}
              data-testid={`faq-answer-${index}`}
            >
              {faq.answer}
            </motion.div>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
};
