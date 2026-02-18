'use client';

import { useState } from 'react';

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden transition-all duration-300 hover:border-sky-500/50"
        >
          <button
            onClick={() => toggleItem(item.id)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-900/60 transition-colors duration-300"
          >
            <h3 className="font-semibold text-slate-50 text-lg">{item.question}</h3>
            <svg
              className={`h-5 w-5 text-sky-400 transition-transform duration-300 flex-shrink-0 ${
                openId === item.id ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          {openId === item.id && (
            <div className="border-t border-slate-800 bg-slate-950/50 px-6 py-4 animate-slide-down">
              <p className="text-slate-300 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
