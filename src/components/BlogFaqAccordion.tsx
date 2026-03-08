"use client";

import { useState } from "react";
import type { BlogFAQ } from "@/data/blog-types";
import { ChevronDown } from "lucide-react";

type Props = {
  items: BlogFAQ[];
};

export default function BlogFaqAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <dl className="mt-6 space-y-0 border border-noir-900/10">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border-b border-noir-900/10 last:border-b-0"
          >
            <dt>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                id={`faq-question-${i}`}
                className="flex w-full items-center justify-between gap-4 py-4 px-4 text-left font-display text-lg font-medium text-noir-900 hover:bg-noir-900/[0.02] transition"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-noir-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
            </dt>
            <dd
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              hidden={!isOpen}
              className="overflow-hidden border-t border-noir-900/5 bg-noir-900/[0.02]"
            >
              <p className="py-4 px-4 text-base leading-relaxed text-noir-700">
                {item.answer}
              </p>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
