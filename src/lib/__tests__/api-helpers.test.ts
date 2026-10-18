import { describe, it, expect } from 'vitest';
import {
  apiSuccess,
  apiError,
  paginationArgs,
  paginationMeta,
  parseBody,
  parseQuery,
  withErrorHandling,
} from '../api-helpers';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

describe('apiSuccess', () => {
  it('returns JSON with success: true', async () => {
    const res = apiSuccess({ id: 1, name: 'test' });
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ id: 1, name: 'test' });
  });

  it('includes meta when provided', async () => {
    const meta = { page: 1, perPage: 10, total: 100, totalPages: 10 };
    const res = apiSuccess([], meta);
    const json = await res.json();
    expect(json.meta).toEqual(meta);
  });

  it('returns 200 status', () => {
    const res = apiSuccess('ok');
    expect(res.status).toBe(200);
  });
});

describe('apiError', () => {
  it('returns JSON with success: false', async () => {
    const res = apiError('Not found', 404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Not found');
  });

  it('uses correct status code', () => {
    expect(apiError('Bad request', 400).status).toBe(400);
    expect(apiError('Internal error', 500).status).toBe(500);
    expect(apiError('Not found', 404).status).toBe(404);
  });

  it('defaults to 400 status', () => {
    const res = apiError('Bad request');
    expect(res.status).toBe(400);
  });

  it('includes field errors when provided', async () => {
    const errors = [{ field: 'email', message: 'Invalid email' }];
    const res = apiError('Validation failed', 400, errors);
    const json = await res.json();
    expect(json.errors).toEqual(errors);
  });
});

describe('paginationArgs', () => {
  it('computes skip and take for page 1', () => {
    expect(paginationArgs(1, 20)).toEqual({ skip: 0, take: 20 });
  });

  it('computes skip and take for page 3', () => {
    expect(paginationArgs(3, 10)).toEqual({ skip: 20, take: 10 });
  });

  it('handles page 1 with perPage 1', () => {
    expect(paginationArgs(1, 1)).toEqual({ skip: 0, take: 1 });
  });
});

describe('paginationMeta', () => {
  it('calculates totalPages correctly', () => {
    const meta = paginationMeta(100, 1, 20);
    expect(meta).toEqual({ page: 1, perPage: 20, total: 100, totalPages: 5 });
  });

  it('rounds up totalPages', () => {
    const meta = paginationMeta(21, 1, 10);
    expect(meta).toEqual({ page: 1, perPage: 10, total: 21, totalPages: 3 });
  });

  it('returns 1 page for 0 total', () => {
    const meta = paginationMeta(0, 1, 10);
    expect(meta?.totalPages).toBe(0);
  });
});

describe('parseQuery', () => {
  it('parses page and perPage from URL', () => {
    const req = new NextRequest('http://localhost/api?page=2&per_page=50');
    const q = parseQuery(req);
    expect(q.page).toBe(2);
    expect(q.perPage).toBe(50);
    expect(q.order).toBe('desc');
  });

  it('uses defaults for missing params', () => {
    const req = new NextRequest('http://localhost/api');
    const q = parseQuery(req);
    expect(q.page).toBe(1);
    expect(q.perPage).toBe(20);
  });

  it('clamps perPage to 100 max', () => {
    const req = new NextRequest('http://localhost/api?per_page=999');
    const q = parseQuery(req);
    expect(q.perPage).toBe(100);
  });

  it('clamps page to minimum 1', () => {
    const req = new NextRequest('http://localhost/api?page=-5');
    const q = parseQuery(req);
    expect(q.page).toBe(1);
  });
});

describe('parseBody', () => {
  it('returns data for valid body', async () => {
    const schema = z.object({ name: z.string() });
    const req = new NextRequest('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseBody(req, schema);
    expect(result.data).toEqual({ name: 'test' });
    expect(result.error).toBeNull();
  });

  it('returns error for invalid body', async () => {
    const schema = z.object({ name: z.string() });
    const req = new NextRequest('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ name: 123 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseBody(req, schema);
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(NextResponse);
  });

  it('returns error for invalid JSON', async () => {
    const schema = z.object({ name: z.string() });
    const req = new NextRequest('http://localhost/api', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseBody(req, schema);
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(NextResponse);
  });
});

describe('withErrorHandling', () => {
  it('returns handler result on success', async () => {
    const handler = async () => apiSuccess({ ok: true });
    const wrapped = withErrorHandling(handler);
    const req = new NextRequest('http://localhost/api');
    const res = await wrapped(req);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('catches errors and returns 500', async () => {
    const handler = async () => {
      throw new Error('boom');
    };
    const wrapped = withErrorHandling(handler);
    const req = new NextRequest('http://localhost/api');
    const res = await wrapped(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('boom');
  });
});
