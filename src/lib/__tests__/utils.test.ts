import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatNumber, timeAgo, truncate, sleep, idempotencyKey } from '../utils';

describe('formatNumber', () => {
  it('returns plain number for values under 1000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M');
    expect(formatNumber(2500000)).toBe('2.5M');
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for < 60 seconds', () => {
    const date = new Date('2026-01-01T11:59:30Z');
    expect(timeAgo(date)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const date = new Date('2026-01-01T11:55:00Z');
    expect(timeAgo(date)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const date = new Date('2026-01-01T09:00:00Z');
    expect(timeAgo(date)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const date = new Date('2025-12-30T12:00:00Z');
    expect(timeAgo(date)).toBe('2d ago');
  });

  it('returns months ago', () => {
    const date = new Date('2025-09-01T12:00:00Z');
    expect(timeAgo(date)).toBe('4mo ago');
  });

  it('accepts string dates', () => {
    expect(timeAgo('2026-01-01T11:59:30Z')).toBe('just now');
  });
});

describe('truncate', () => {
  it('returns short string unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long string with ellipsis', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello w...');
  });

  it('handles exact length', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });
});

describe('sleep', () => {
  it('resolves after the given ms', async () => {
    vi.useFakeTimers();
    const p = sleep(100);
    vi.advanceTimersByTime(100);
    await p;
    vi.useRealTimers();
  });
});

describe('idempotencyKey', () => {
  it('joins parts with "::"', () => {
    expect(idempotencyKey('a', 'b', 'c')).toBe('a::b::c');
  });

  it('returns empty string with no parts', () => {
    expect(idempotencyKey()).toBe('');
  });

  it('returns single part unchanged', () => {
    expect(idempotencyKey('only')).toBe('only');
  });
});
