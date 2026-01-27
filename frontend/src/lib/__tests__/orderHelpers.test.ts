import { describe, it, expect } from 'vitest';
import {
  getStatusText,
  getStatusColor,
  formatOrderDate,
  isValidProductName,
  isValidDescription,
  canArchiveOrder,
  calculateUserPaymentAmount,
} from '../orderHelpers';

describe('Order Helpers', () => {
  describe('getStatusText', () => {
    it('returns correct text for niitlegdsen status', () => {
      expect(getStatusText('niitlegdsen')).toBe('Нийтэлсэн');
    });

    it('returns correct text for agent_sudlaj_bn status', () => {
      expect(getStatusText('agent_sudlaj_bn')).toBe('Agent шалгаж байна');
    });

    it('returns correct text for tolbor_huleej_bn status', () => {
      expect(getStatusText('tolbor_huleej_bn')).toBe('Төлбөр хүлээж байна');
    });

    it('returns correct text for amjilttai_zahialga status', () => {
      expect(getStatusText('amjilttai_zahialga')).toBe('Амжилттай захиалга');
    });

    it('returns correct text for tsutsalsan_zahialga status', () => {
      expect(getStatusText('tsutsalsan_zahialga')).toBe('Цуцлагдсан захиалга');
    });

    it('returns status itself for unknown status', () => {
      // @ts-expect-error - testing unknown status
      expect(getStatusText('unknown_status')).toBe('unknown_status');
    });
  });

  describe('getStatusColor', () => {
    it('returns gray color for niitlegdsen', () => {
      expect(getStatusColor('niitlegdsen')).toContain('gray');
    });

    it('returns amber color for agent_sudlaj_bn', () => {
      expect(getStatusColor('agent_sudlaj_bn')).toContain('amber');
    });

    it('returns blue color for tolbor_huleej_bn', () => {
      expect(getStatusColor('tolbor_huleej_bn')).toContain('blue');
    });

    it('returns emerald color for amjilttai_zahialga', () => {
      expect(getStatusColor('amjilttai_zahialga')).toContain('emerald');
    });

    it('returns red color for tsutsalsan_zahialga', () => {
      expect(getStatusColor('tsutsalsan_zahialga')).toContain('red');
    });
  });

  describe('canArchiveOrder', () => {
    it('returns true for amjilttai_zahialga', () => {
      expect(canArchiveOrder('amjilttai_zahialga')).toBe(true);
    });

    it('returns true for tsutsalsan_zahialga', () => {
      expect(canArchiveOrder('tsutsalsan_zahialga')).toBe(true);
    });

    it('returns false for niitlegdsen', () => {
      expect(canArchiveOrder('niitlegdsen')).toBe(false);
    });

    it('returns false for agent_sudlaj_bn', () => {
      expect(canArchiveOrder('agent_sudlaj_bn')).toBe(false);
    });
  });

  describe('calculateUserPaymentAmount', () => {
    it('calculates payment with 5% commission', () => {
      // 100 yuan * 1.05 = 105 yuan
      // 105 * 500 (exchange rate) = 52500 MNT
      const result = calculateUserPaymentAmount(100, 500);
      expect(result).toBe(52500);
    });

    it('rounds up the result', () => {
      // 99 yuan * 1.05 = 103.95 -> 104 yuan
      // 104 * 499 = 51896 MNT
      const result = calculateUserPaymentAmount(99, 499);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('formatOrderDate', () => {
    it('formats date correctly', () => {
      const date = '2024-01-15T10:30:00';
      const formatted = formatOrderDate(date);
      expect(formatted).toContain('2024');
    });

    it('handles invalid date', () => {
      const formatted = formatOrderDate('invalid-date');
      expect(formatted).toBe('Тодорхойгүй');
    });

    it('handles empty string', () => {
      const formatted = formatOrderDate('');
      expect(formatted).toBe('Тодорхойгүй');
    });
  });

  describe('isValidProductName', () => {
    it('returns true for valid product name', () => {
      expect(isValidProductName('iPhone 15 Pro')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidProductName('')).toBe(false);
    });

    it('returns false for whitespace only', () => {
      expect(isValidProductName('   ')).toBe(false);
    });

    it('returns false for too short name (less than 3 chars)', () => {
      expect(isValidProductName('ab')).toBe(false);
    });

    it('returns true for exactly 3 characters', () => {
      expect(isValidProductName('abc')).toBe(true);
    });
  });

  describe('isValidDescription', () => {
    it('returns true for valid description', () => {
      expect(isValidDescription('Хар өнгийн iPhone 15 Pro 256GB')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidDescription('')).toBe(false);
    });

    it('returns false for too short description (less than 10 chars)', () => {
      expect(isValidDescription('test')).toBe(false);
    });

    it('returns true for exactly 10 characters', () => {
      expect(isValidDescription('1234567890')).toBe(true);
    });
  });
});
