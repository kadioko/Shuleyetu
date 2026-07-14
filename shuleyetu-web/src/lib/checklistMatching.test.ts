import { describe, it, expect } from 'vitest';
import { matchChecklistItemToInventory } from './checklistMatching';

const baseInventory = [
  {
    id: '1',
    name: 'Primary Mathematics Book 1',
    description: 'Math textbook for standard 1',
    category: 'textbook',
    price_tzs: 15000,
    stock_quantity: 10,
    vendor_id: 'v1',
    vendor_name: 'Mwanza Book Center',
  },
  {
    id: '2',
    name: 'English Language Reader Grade 4',
    description: 'Reader',
    category: 'textbook',
    price_tzs: 18500,
    stock_quantity: 5,
    vendor_id: 'v1',
    vendor_name: 'Mwanza Book Center',
  },
  {
    id: '3',
    name: 'School Backpack',
    description: 'Durable bag',
    category: 'other',
    price_tzs: 55000,
    stock_quantity: 8,
    vendor_id: 'v2',
    vendor_name: 'Dar School Supplies',
  },
  {
    id: '4',
    name: 'Out of stock item',
    description: 'Nothing',
    category: 'stationery',
    price_tzs: 1000,
    stock_quantity: 0,
    vendor_id: 'v2',
    vendor_name: 'Dar School Supplies',
  },
];

describe('matchChecklistItemToInventory', () => {
  it('returns top matches sorted by relevance', () => {
    const matches = matchChecklistItemToInventory('Mathematics textbook', 'textbook', baseInventory, 10);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].name).toBe('Primary Mathematics Book 1');
  });

  it('matches partial terms in item names', () => {
    const matches = matchChecklistItemToInventory('book', 'textbook', baseInventory, 10);
    expect(matches.some((m) => m.name.includes('Book'))).toBe(true);
  });

  it('excludes out-of-stock items', () => {
    const matches = matchChecklistItemToInventory('item', 'stationery', baseInventory, 10);
    expect(matches.some((m) => m.name === 'Out of stock item')).toBe(false);
  });

  it('returns empty array when no matches', () => {
    const matches = matchChecklistItemToInventory('unicorn', 'other', baseInventory);
    expect(matches).toHaveLength(0);
  });

  it('boosts category matches', () => {
    const matches = matchChecklistItemToInventory('book', 'textbook', baseInventory, 10);
    expect(matches[0].category).toBe('textbook');
  });
});
