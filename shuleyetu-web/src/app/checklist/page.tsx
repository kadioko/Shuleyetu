'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';

type Level = 'primary' | 'secondary' | 'highschool';

interface ChecklistItem {
  id: string;
  label: string;
  category: 'uniform' | 'stationery' | 'textbook' | 'other';
  quantity: number;
}

const CHECKLISTS: Record<Level, ChecklistItem[]> = {
  primary: [
    { id: 'p1', label: 'School uniform (2 sets)', category: 'uniform', quantity: 2 },
    { id: 'p2', label: 'School shoes (black)', category: 'uniform', quantity: 1 },
    { id: 'p3', label: 'Socks (white, 3 pairs)', category: 'uniform', quantity: 3 },
    { id: 'p4', label: 'Exercise books (A4, 10)', category: 'stationery', quantity: 10 },
    { id: 'p5', label: 'Pencils (HB, dozen)', category: 'stationery', quantity: 12 },
    { id: 'p6', label: 'Erasers (2)', category: 'stationery', quantity: 2 },
    { id: 'p7', label: 'Ruler (30cm)', category: 'stationery', quantity: 1 },
    { id: 'p8', label: 'Mathematics textbook', category: 'textbook', quantity: 1 },
    { id: 'p9', label: 'English textbook', category: 'textbook', quantity: 1 },
    { id: 'p10', label: 'Kiswahili textbook', category: 'textbook', quantity: 1 },
    { id: 'p11', label: 'School bag / backpack', category: 'other', quantity: 1 },
    { id: 'p12', label: 'Water bottle', category: 'other', quantity: 1 },
  ],
  secondary: [
    { id: 's1', label: 'School uniform (2 sets)', category: 'uniform', quantity: 2 },
    { id: 's2', label: 'School shoes (black)', category: 'uniform', quantity: 1 },
    { id: 's3', label: 'Sports uniform', category: 'uniform', quantity: 1 },
    { id: 's4', label: 'Exercise books (A4, ruled, 15)', category: 'stationery', quantity: 15 },
    { id: 's5', label: 'Scientific calculator', category: 'stationery', quantity: 1 },
    { id: 's6', label: 'Geometry set', category: 'stationery', quantity: 1 },
    { id: 's7', label: 'Ballpoint pens (blue/black, 6)', category: 'stationery', quantity: 6 },
    { id: 's8', label: 'Highlighters (4 colours)', category: 'stationery', quantity: 4 },
    { id: 's9', label: 'Mathematics textbook', category: 'textbook', quantity: 1 },
    { id: 's10', label: 'Physics textbook', category: 'textbook', quantity: 1 },
    { id: 's11', label: 'Chemistry textbook', category: 'textbook', quantity: 1 },
    { id: 's12', label: 'Biology textbook', category: 'textbook', quantity: 1 },
    { id: 's13', label: 'English textbook', category: 'textbook', quantity: 1 },
    { id: 's14', label: 'School bag / backpack', category: 'other', quantity: 1 },
    { id: 's15', label: 'Water bottle', category: 'other', quantity: 1 },
  ],
  highschool: [
    { id: 'h1', label: 'School uniform (2 sets)', category: 'uniform', quantity: 2 },
    { id: 'h2', label: 'School shoes (black)', category: 'uniform', quantity: 1 },
    { id: 'h3', label: 'Sports uniform + boots', category: 'uniform', quantity: 1 },
    { id: 'h4', label: 'Exercise books (A4, 20)', category: 'stationery', quantity: 20 },
    { id: 'h5', label: 'Graph paper (A4, 2 packs)', category: 'stationery', quantity: 2 },
    { id: 'h6', label: 'Scientific calculator (advanced)', category: 'stationery', quantity: 1 },
    { id: 'h7', label: 'Geometry set + protractor', category: 'stationery', quantity: 1 },
    { id: 'h8', label: 'Ballpoint pens (assorted, 10)', category: 'stationery', quantity: 10 },
    { id: 'h9', label: 'Advanced Mathematics textbook', category: 'textbook', quantity: 1 },
    { id: 'h10', label: 'Physics textbook', category: 'textbook', quantity: 1 },
    { id: 'h11', label: 'Chemistry textbook', category: 'textbook', quantity: 1 },
    { id: 'h12', label: 'Biology textbook', category: 'textbook', quantity: 1 },
    { id: 'h13', label: 'General Studies textbook', category: 'textbook', quantity: 1 },
    { id: 'h14', label: 'Laptop / tablet (recommended)', category: 'other', quantity: 1 },
    { id: 'h15', label: 'School bag / backpack (large)', category: 'other', quantity: 1 },
  ],
};

const LEVEL_LABELS: Record<Level, string> = {
  primary: 'Primary School',
  secondary: 'Secondary School (O-Level)',
  highschool: 'High School (A-Level)',
};

const CATEGORY_ICONS: Record<string, string> = {
  uniform: '👕',
  stationery: '✏️',
  textbook: '📚',
  other: '🎒',
};

const CATEGORY_LINKS: Record<string, string> = {
  uniform: '/vendors?category=uniform',
  stationery: '/vendors?category=stationery',
  textbook: '/vendors?category=textbook',
  other: '/vendors',
};

export default function ChecklistPage() {
  const [level, setLevel] = useState<Level | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  const items = level ? CHECKLISTS[level] : [];
  const checkedCount = checked.size;
  const totalCount = items.length + customItems.length;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addCustomItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setCustomItems((prev) => [...prev, trimmed]);
    setNewItem('');
  };

  const removeCustomItem = (index: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      {/* Hero */}
      <section className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">
          Back-to-School Checklist
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-slate-400">
          Generate a printable checklist of everything your child needs for the new school year. Tick items off as you shop.
        </p>
      </section>

      {/* Level Selector */}
      <section className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(CHECKLISTS) as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => {
              setLevel(l);
              setChecked(new Set());
            }}
            className={`rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 ${
              level === l
                ? 'border-sky-500/40 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <p className="text-sm font-semibold text-slate-100">{LEVEL_LABELS[l]}</p>
            <p className="mt-1 text-xs text-slate-400">{CHECKLISTS[l].length} items</p>
          </button>
        ))}
      </section>

      {level && (
        <>
          {/* Progress */}
          <section className="surface-panel rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-200">
                {checkedCount} of {totalCount} items checked
              </p>
              <p className="text-sm font-bold text-sky-400">{progress}%</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {/* Checklist */}
          <section className="space-y-6">
            {Object.entries(grouped).map(([category, catItems]) => (
              <div key={category} className="surface-panel rounded-3xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                      {category}
                    </h2>
                  </div>
                  <Link
                    href={CATEGORY_LINKS[category]}
                    className="text-xs font-medium text-sky-400 hover:text-sky-300"
                  >
                    Find vendors →
                  </Link>
                </div>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                        checked.has(item.id)
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(item.id)}
                        onChange={() => toggle(item.id)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-sky-500/20"
                      />
                      <span className={`flex-1 text-sm ${checked.has(item.id) ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-500">×{item.quantity}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom items */}
            <div className="surface-panel rounded-3xl p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                Custom Items
              </h2>
              <div className="space-y-2">
                {customItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <span className="flex-1 text-sm text-slate-200">{item}</span>
                    <button
                      onClick={() => removeCustomItem(index)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                    placeholder="Add a custom item..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-sky-500"
                  />
                  <button
                    onClick={addCustomItem}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="flex flex-wrap gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Checklist
            </button>
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:border-slate-600 hover:text-white"
            >
              Browse Vendors
            </Link>
            <button
              onClick={() => {
                setChecked(new Set());
                setCustomItems([]);
              }}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:border-red-500/50 hover:text-red-400"
            >
              Reset
            </button>
          </section>
        </>
      )}
    </main>
  );
}
