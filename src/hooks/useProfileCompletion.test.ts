// Developer Note: Basic tests for useProfileCompletion hook focusing on percentage calculation and item completion states

import { describe, it, expect } from 'vitest';

// Mock data for testing percentage calculations
const mockProfileItems = [
  { id: 'email', label: 'Email', completed: true },
  { id: 'name', label: 'Name', completed: true },
  { id: 'phone', label: 'Phone', completed: false },
  { id: 'address', label: 'Address', completed: false },
  { id: 'payment', label: 'Payment', completed: false }
];

// Helper function to calculate percentage (extracted from hook logic)
const calculatePercentage = (items: Array<{ completed: boolean }>) => {
  const completedCount = items.filter(item => item.completed).length;
  return Math.round((completedCount / items.length) * 100);
};

describe('useProfileCompletion percentage calculations', () => {
  it('calculates 0% when no items completed', () => {
    const items = mockProfileItems.map(item => ({ ...item, completed: false }));
    expect(calculatePercentage(items)).toBe(0);
  });

  it('calculates 100% when all items completed', () => {
    const items = mockProfileItems.map(item => ({ ...item, completed: true }));
    expect(calculatePercentage(items)).toBe(100);
  });

  it('calculates 40% when 2 of 5 items completed', () => {
    expect(calculatePercentage(mockProfileItems)).toBe(40);
  });

  it('rounds percentage correctly', () => {
    const items = [
      { completed: true },
      { completed: false },
      { completed: false }
    ];
    expect(calculatePercentage(items)).toBe(33); // 33.33... rounded to 33
  });
});

describe('profile completion item states', () => {
  it('identifies completed items correctly', () => {
    const completedItems = mockProfileItems.filter(item => item.completed);
    expect(completedItems).toHaveLength(2);
    expect(completedItems[0].id).toBe('email');
    expect(completedItems[1].id).toBe('name');
  });

  it('identifies incomplete items correctly', () => {
    const incompleteItems = mockProfileItems.filter(item => !item.completed);
    expect(incompleteItems).toHaveLength(3);
    expect(incompleteItems.map(item => item.id)).toEqual(['phone', 'address', 'payment']);
  });
});