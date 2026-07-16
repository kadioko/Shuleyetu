'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { supabaseClient } from '@/lib/supabaseClient';
import { useCart } from '@/lib/cartContext';
import { matchChecklistItemToInventory, InventoryMatch } from '@/lib/checklistMatching';

type Level = 'primary' | 'secondary' | 'highschool';

interface ChecklistItem {
  id: string;
  label: string;
  labelSw: string;
  category: 'uniform' | 'stationery' | 'textbook' | 'other';
  quantity: number;
}

const CHECKLISTS: Record<Level, ChecklistItem[]> = {
  primary: [
    { id: 'p1', label: 'School uniform (2 sets)', labelSw: 'Sare ya shule (seti 2)', category: 'uniform', quantity: 2 },
    { id: 'p2', label: 'School shoes (black)', labelSw: 'Viatu vya shule (nyeusi)', category: 'uniform', quantity: 1 },
    { id: 'p3', label: 'Socks (white, 3 pairs)', labelSw: 'Soksi (nyeupe, jozi 3)', category: 'uniform', quantity: 3 },
    { id: 'p4', label: 'Exercise books (A4, 10)', labelSw: 'Daftari za mazoezi (A4, 10)', category: 'stationery', quantity: 10 },
    { id: 'p5', label: 'Pencils (HB, dozen)', labelSw: 'Penseli (HB, dazeni)', category: 'stationery', quantity: 12 },
    { id: 'p6', label: 'Erasers (2)', labelSw: 'Raba (2)', category: 'stationery', quantity: 2 },
    { id: 'p7', label: 'Ruler (30cm)', labelSw: 'Rula (30cm)', category: 'stationery', quantity: 1 },
    { id: 'p8', label: 'Mathematics textbook', labelSw: 'Kitabu cha Hisabati', category: 'textbook', quantity: 1 },
    { id: 'p9', label: 'English textbook', labelSw: 'Kitabu cha Kiingereza', category: 'textbook', quantity: 1 },
    { id: 'p10', label: 'Kiswahili textbook', labelSw: 'Kitabu cha Kiswahili', category: 'textbook', quantity: 1 },
    { id: 'p11', label: 'School bag / backpack', labelSw: 'Mfuko wa shule / begi la mgongoni', category: 'other', quantity: 1 },
    { id: 'p12', label: 'Water bottle', labelSw: 'Chupa ya maji', category: 'other', quantity: 1 },
  ],
  secondary: [
    { id: 's1', label: 'School uniform (2 sets)', labelSw: 'Sare ya shule (seti 2)', category: 'uniform', quantity: 2 },
    { id: 's2', label: 'School shoes (black)', labelSw: 'Viatu vya shule (nyeusi)', category: 'uniform', quantity: 1 },
    { id: 's3', label: 'Sports uniform', labelSw: 'Sare ya michezo', category: 'uniform', quantity: 1 },
    { id: 's4', label: 'Exercise books (A4, ruled, 15)', labelSw: 'Daftari za mazoezi (A4, mistari, 15)', category: 'stationery', quantity: 15 },
    { id: 's5', label: 'Scientific calculator', labelSw: 'Kalkuleta ya kisayansi', category: 'stationery', quantity: 1 },
    { id: 's6', label: 'Geometry set', labelSw: 'Seti ya jiometri', category: 'stationery', quantity: 1 },
    { id: 's7', label: 'Ballpoint pens (blue/black, 6)', labelSw: 'Kalamu za wino (bluu/nyeusi, 6)', category: 'stationery', quantity: 6 },
    { id: 's8', label: 'Highlighters (4 colours)', labelSw: 'Kalamu za kuangazia (rangi 4)', category: 'stationery', quantity: 4 },
    { id: 's9', label: 'Mathematics textbook', labelSw: 'Kitabu cha Hisabati', category: 'textbook', quantity: 1 },
    { id: 's10', label: 'Physics textbook', labelSw: 'Kitabu cha Fizikia', category: 'textbook', quantity: 1 },
    { id: 's11', label: 'Chemistry textbook', labelSw: 'Kitabu cha Kemia', category: 'textbook', quantity: 1 },
    { id: 's12', label: 'Biology textbook', labelSw: 'Kitabu cha Baiolojia', category: 'textbook', quantity: 1 },
    { id: 's13', label: 'English textbook', labelSw: 'Kitabu cha Kiingereza', category: 'textbook', quantity: 1 },
    { id: 's14', label: 'School bag / backpack', labelSw: 'Mfuko wa shule / begi la mgongoni', category: 'other', quantity: 1 },
    { id: 's15', label: 'Water bottle', labelSw: 'Chupa ya maji', category: 'other', quantity: 1 },
  ],
  highschool: [
    { id: 'h1', label: 'School uniform (2 sets)', labelSw: 'Sare ya shule (seti 2)', category: 'uniform', quantity: 2 },
    { id: 'h2', label: 'School shoes (black)', labelSw: 'Viatu vya shule (nyeusi)', category: 'uniform', quantity: 1 },
    { id: 'h3', label: 'Sports uniform + boots', labelSw: 'Sare ya michezo + buti', category: 'uniform', quantity: 1 },
    { id: 'h4', label: 'Exercise books (A4, 20)', labelSw: 'Daftari za mazoezi (A4, 20)', category: 'stationery', quantity: 20 },
    { id: 'h5', label: 'Graph paper (A4, 2 packs)', labelSw: 'Karatasi za grafu (A4, pakiti 2)', category: 'stationery', quantity: 2 },
    { id: 'h6', label: 'Scientific calculator (advanced)', labelSw: 'Kalkuleta ya kisayansi (ya juu)', category: 'stationery', quantity: 1 },
    { id: 'h7', label: 'Geometry set + protractor', labelSw: 'Seti ya jiometri + protrakta', category: 'stationery', quantity: 1 },
    { id: 'h8', label: 'Ballpoint pens (assorted, 10)', labelSw: 'Kalamu za wino (mchanganyiko, 10)', category: 'stationery', quantity: 10 },
    { id: 'h9', label: 'Advanced Mathematics textbook', labelSw: 'Kitabu cha Hisabati ya Juu', category: 'textbook', quantity: 1 },
    { id: 'h10', label: 'Physics textbook', labelSw: 'Kitabu cha Fizikia', category: 'textbook', quantity: 1 },
    { id: 'h11', label: 'Chemistry textbook', labelSw: 'Kitabu cha Kemia', category: 'textbook', quantity: 1 },
    { id: 'h12', label: 'Biology textbook', labelSw: 'Kitabu cha Baiolojia', category: 'textbook', quantity: 1 },
    { id: 'h13', label: 'General Studies textbook', labelSw: 'Kitabu cha Maarifa ya Jumla', category: 'textbook', quantity: 1 },
    { id: 'h14', label: 'Laptop / tablet (recommended)', labelSw: 'Kompyuta ndogo / kompyuta kibao (inapendekezwa)', category: 'other', quantity: 1 },
    { id: 'h15', label: 'School bag / backpack (large)', labelSw: 'Mfuko wa shule / begi la mgongoni (kubwa)', category: 'other', quantity: 1 },
  ],
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
  const { locale, setLocale, t } = useLanguage();
  const [level, setLevel] = useState<Level | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [inventory, setInventory] = useState<InventoryMatch[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const { addItem, vendorName, items: cartItems } = useCart();

  const isSw = locale === 'sw';

  const LEVEL_LABELS: Record<Level, string> = {
    primary: t('checklistPrimary'),
    secondary: t('checklistSecondary'),
    highschool: t('checklistHighschool'),
  };

  const items = level ? CHECKLISTS[level] : [];
  const checkedCount = checked.size;
  const totalCount = items.length + customItems.length;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (!level || inventory.length > 0) return;

    let cancelled = false;
    const load = async () => {
      setInventoryLoading(true);
      const { data, error } = await supabaseClient
        .from('inventory')
        .select('id, name, description, category, price_tzs, stock_quantity, vendor_id, vendors(name)')
        .eq('is_active', true)
        .gt('stock_quantity', 0);

      if (!cancelled) {
        if (error) {
          console.error('Error loading inventory for checklist', error);
        } else {
          const rows = (data ?? []) as unknown as {
            id: string;
            name: string;
            description: string | null;
            category: string;
            price_tzs: number;
            stock_quantity: number;
            vendor_id: string;
            vendors: { name: string } | { name: string }[] | null;
          }[];
          setInventory(
            rows.map((row) => ({
              id: row.id,
              name: row.name,
              description: row.description ?? null,
              category: row.category,
              price_tzs: row.price_tzs,
              stock_quantity: row.stock_quantity,
              vendor_id: row.vendor_id,
              vendor_name: Array.isArray(row.vendors)
                ? row.vendors[0]?.name ?? ''
                : row.vendors?.name ?? '',
              score: 0,
            })),
          );
        }
        setInventoryLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [inventory.length, level]);

  const matchesByItem = useMemo(() => {
    const map = new Map<string, InventoryMatch[]>();
    if (!level) return map;
    for (const item of CHECKLISTS[level]) {
      map.set(item.id, matchChecklistItemToInventory(item.label, item.category, inventory));
    }
    return map;
  }, [inventory, level]);

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

  const handleExport = () => {
    const lines: string[] = [
      `Shuleyetu Back-to-School Checklist — ${level ? LEVEL_LABELS[level] : ''}`,
      `Generated: ${new Date().toLocaleDateString('en-TZ')}`,
      '',
    ];
    Object.entries(grouped).forEach(([cat, catItems]) => {
      lines.push(`--- ${cat.toUpperCase()} ---`);
      catItems.forEach((item) => {
        const tick = checked.has(item.id) ? '[x]' : '[ ]';
        const itemLabel = isSw ? item.labelSw : item.label;
        lines.push(`${tick} ${itemLabel} (qty: ${item.quantity})`);
      });
      lines.push('');
    });
    if (customItems.length > 0) {
      lines.push('--- CUSTOM ITEMS ---');
      customItems.forEach((item) => lines.push(`[ ] ${item}`));
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shuleyetu-checklist-${level ?? 'school'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeCustomItem = (index: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMatch = (match: InventoryMatch, checklistQuantity: number) => {
    const quantity = Math.min(checklistQuantity, match.stock_quantity);
    addItem({
      itemId: match.id,
      vendorId: match.vendor_id,
      vendorName: match.vendor_name,
      name: match.name,
      price_tzs: match.price_tzs,
      image_url: null,
      quantity,
    });
    setCartMessage(
      t('checklistVendorSwitched').replace('{vendor}', match.vendor_name),
    );
    setTimeout(() => setCartMessage(null), 4000);
  };

  const handleAutoFill = () => {
    if (!level) return;
    // Pick the vendor with the most matched items among checked items
    const vendorMatches = new Map<string, { vendorName: string; matches: { match: InventoryMatch; quantity: number }[] }>();

    for (const item of CHECKLISTS[level]) {
      if (!checked.has(item.id)) continue;
      const matches = matchesByItem.get(item.id) ?? [];
      if (matches.length === 0) continue;
      const best = matches[0];
      const entry = vendorMatches.get(best.vendor_id) ?? { vendorName: best.vendor_name, matches: [] };
      entry.matches.push({ match: best, quantity: item.quantity });
      vendorMatches.set(best.vendor_id, entry);
    }

    if (vendorMatches.size === 0) {
      setCartMessage(t('checklistNoMatches'));
      return;
    }

    // Choose vendor with most matched items, then lowest total price as tie-breaker
    const sortedVendors = Array.from(vendorMatches.entries()).sort((a, b) => {
      const countDiff = b[1].matches.length - a[1].matches.length;
      if (countDiff !== 0) return countDiff;
      const totalA = a[1].matches.reduce((sum, m) => sum + m.match.price_tzs * m.quantity, 0);
      const totalB = b[1].matches.reduce((sum, m) => sum + m.match.price_tzs * m.quantity, 0);
      return totalA - totalB;
    });

    const [vendorId, { vendorName, matches }] = sortedVendors[0];
    let switched = false;
    for (const { match, quantity } of matches) {
      if (cartItems.length > 0 && cartItems[0].vendorId !== vendorId) {
        switched = true;
      }
      addItem({
        itemId: match.id,
        vendorId: match.vendor_id,
        vendorName: match.vendor_name,
        name: match.name,
        price_tzs: match.price_tzs,
        image_url: null,
        quantity: Math.min(quantity, match.stock_quantity),
      });
    }
    setCartMessage(
      switched ? t('checklistVendorSwitched').replace('{vendor}', vendorName) : t('checklistAutoFillDesc'),
    );
    setTimeout(() => setCartMessage(null), 4000);
  };

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      {/* Language Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setLocale(locale === 'en' ? 'sw' : 'en')}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:text-sky-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {locale === 'en' ? t('switchToSwahili') : t('switchToEnglish')}
        </button>
      </div>

      {/* Hero */}
      <section className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">
          {t('checklistTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-slate-400">
          {t('checklistDesc')}
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
            <p className="mt-1 text-xs text-slate-400">{CHECKLISTS[l].length} {t('checklistItems')}</p>
          </button>
        ))}
      </section>

      {level && (
        <>
          {/* Progress */}
          <section className="surface-panel rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-200">
                {checkedCount} {t('checklistOf')} {totalCount} {t('checklistItemsChecked')}
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
                    {t('checklistFindVendors')} →
                  </Link>
                </div>
                <div className="space-y-3">
                  {catItems.map((item) => {
                    const itemMatches = matchesByItem.get(item.id) ?? [];
                    const label = isSw ? item.labelSw : item.label;
                    return (
                      <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <label
                          className={`flex cursor-pointer items-center gap-3 transition-all ${
                            checked.has(item.id) ? 'text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked.has(item.id)}
                            onChange={() => toggle(item.id)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-sky-500/20"
                          />
                          <span className={`flex-1 text-sm ${checked.has(item.id) ? 'line-through' : ''}`}>
                            {label}
                          </span>
                          <span className="text-xs text-slate-500">×{item.quantity}</span>
                        </label>

                        {itemMatches.length > 0 && (
                          <div className="mt-3 space-y-2 pl-7">
                            <p className="text-xs font-medium text-slate-400">{t('checklistMatches')}</p>
                            {itemMatches.map((match) => (
                              <div
                                key={match.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-slate-200">{match.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {t('checklistFromVendor').replace('{vendor}', match.vendor_name)} · {t('checklistPrice').replace('{price}', match.price_tzs.toLocaleString('en-TZ'))}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAddMatch(match, item.quantity)}
                                  className="flex-shrink-0 rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
                                >
                                  {t('checklistAddToCart')}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {itemMatches.length === 0 && !inventoryLoading && (
                          <p className="mt-2 pl-7 text-xs text-slate-500">
                            {t('checklistNoMatches')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom items */}
            <div className="surface-panel rounded-3xl p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                {t('checklistCustomItems')}
              </h2>
              <div className="space-y-2">
                {customItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <span className="flex-1 text-sm text-slate-200">{item}</span>
                    <button
                      onClick={() => removeCustomItem(index)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      {t('checklistRemove')}
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                    placeholder={t('checklistCustomPlaceholder')}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-sky-500"
                  />
                  <button
                    onClick={addCustomItem}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                  >
                    {t('checklistAdd')}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Auto-fill cart */}
          {checkedCount > 0 && (
            <section className="surface-panel rounded-3xl p-5 print:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{t('checklistAutoFill')}</h3>
                  <p className="text-xs text-slate-400">{t('checklistAutoFillDesc')}</p>
                </div>
                <button
                  onClick={handleAutoFill}
                  disabled={inventoryLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {inventoryLoading ? t('loading') : t('checklistAutoFill')}
                </button>
              </div>
              {cartMessage && (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {cartMessage}
                </div>
              )}
              {vendorName && cartItems.length > 0 && (
                <p className="mt-2 text-xs text-slate-400">
                  Current cart: <span className="font-semibold text-slate-200">{cartItems.length} items</span> from <span className="font-semibold text-slate-200">{vendorName}</span>
                </p>
              )}
            </section>
          )}

          {/* Actions */}
          <section className="flex flex-wrap gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              {t('checklistPrint')}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-500/40 bg-sky-500/10 px-6 py-3 text-sm font-bold text-sky-300 transition-all hover:border-sky-500/60 hover:bg-sky-500/15 hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('checklistExport')}
            </button>
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:border-slate-600 hover:text-white"
            >
              {t('checklistBrowseVendors')}
            </Link>
            <button
              onClick={() => {
                setChecked(new Set());
                setCustomItems([]);
              }}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:border-red-500/50 hover:text-red-400"
            >
              {t('checklistReset')}
            </button>
          </section>
        </>
      )}
      
    </main>
  );
}
