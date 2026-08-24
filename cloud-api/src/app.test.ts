import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from './app.js';
import type { ApiConfig } from './config.js';

const key = 'test-secret-key-12345';
const config: ApiConfig = {
  port: 0,
  apiKeys: new Map([[key, { subject: 'test', tenant_id: 'tenant-a', roles: ['admin'] }]]),
  corsOrigins: ['http://localhost']
};

async function withServer(run: (base: string) => Promise<void>) {
  const server = createApp(config).listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try { await run(base); } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

test('API rejects missing credentials', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/capabilities`);
  assert.equal(response.status, 401);
}));

test('cold start is honest and tenant-scoped', () => withServer(async (base) => {
  const headers = { authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  const response = await fetch(`${base}/api/v1/kb/cold-start`, { method: 'POST', headers, body: JSON.stringify({ company_name: 'Test Export Co', website_url: 'https://example.com', profile_summary: 'User supplied profile' }) });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.data.collection_performed, false);
  assert.equal(body.data.public_claims_approved, 0);
  const search = await fetch(`${base}/api/v1/kb/search`, { method: 'POST', headers, body: JSON.stringify({ query: '', limit: 100 }) });
  const searchBody = await search.json() as any;
  assert.equal(searchBody.data.length, 21);
  assert.ok(searchBody.data.every((card: any) => card.tenant_id === 'tenant-a' && card.public_claim_approved === false));
}));

test('unconfigured live providers fail honestly', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/providers/customs_search`, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 501);
  const body = await response.json() as any;
  assert.equal(body.capability.mode, 'unavailable');
}));

test('benchmark is not fabricated', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/audit/benchmark`, { headers: { authorization: `Bearer ${key}` } });
  const body = await response.json() as any;
  assert.equal(body.data.status, 'NOT_RUN');
  assert.equal(body.data.total_cases, 35);
  assert.equal(body.data.passed, 0);
}));

test('negative quote input is rejected', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/sales/quote`, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ product_name: 'Widget', base_price: -1, currency: 'USD', moq: 100 }) });
  assert.equal(response.status, 400);
}));
