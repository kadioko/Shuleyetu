export type InventoryMatch = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_tzs: number;
  stock_quantity: number;
  vendor_id: string;
  vendor_name: string;
  score: number;
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'of', 'in', 'with', 'to', 'from', 'by',
  'sets', 'set', 'pairs', 'pair', 'pack', 'packs', 'pcs', 'pc', 'x', 'large', 'small',
  'black', 'white', 'blue', 'red', 'green', 'yellow', 'recommended', 'advanced', 'assorted',
  '2', '3', '4', '6', '10', '12', '15', '20', '30', 'dozen', 'cm',
]);

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

function scoreTokens(target: string[], source: string[]): number {
  let score = 0;
  for (const token of source) {
    if (token.length <= 2) continue;
    for (const t of target) {
      if (t === token) {
        score += 3;
      } else if (t.includes(token) || token.includes(t)) {
        score += 1;
      }
    }
  }
  return score;
}

export function matchChecklistItemToInventory(
  checklistLabel: string,
  checklistCategory: string,
  inventory: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    price_tzs: number;
    stock_quantity: number;
    vendor_id: string;
    vendor_name: string;
  }[],
  topN = 3,
): InventoryMatch[] {
  const labelTokens = normalize(checklistLabel);
  if (labelTokens.length === 0) return [];

  const scored = inventory
    .filter((item) => item.stock_quantity > 0)
    .map((item) => {
      const nameTokens = normalize(item.name);
      const descTokens = normalize(item.description ?? '');
      let score = scoreTokens(nameTokens, labelTokens) * 3;
      score += scoreTokens(descTokens, labelTokens);
      if (score > 0 && item.category === checklistCategory) score += 4;
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}
