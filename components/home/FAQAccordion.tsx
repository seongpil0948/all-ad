"use client";

import { Accordion, AccordionItem } from "@heroui/accordion";
import { motion } from "framer-motion";

import { staggerContainer } from "@/utils/animations";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
}

export const FAQAccordion = ({ faqs }: FAQAccordionProps) => {
  return (
    <motion.div animate="animate" initial="initial" variants={staggerContainer}>
      <Accordion variant="bordered">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            aria-label={faq.question}
            className="text-base"
            title={faq.question}
          >
            <motion.p
              animate={{ opacity: 1 }}
              className="text-default-600 pb-4"
              initial={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              {faq.answer}
            </motion.p>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
};
