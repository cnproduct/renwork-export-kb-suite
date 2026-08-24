import test from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityRegistry, CustomerAssetEngine, KnowledgeBaseEngine, SalesExecutionEngine, type CustomerAccount } from './index.js';

test('knowledge cards are isolated by tenant and unapproved by default', () => {
  const engine = new KnowledgeBaseEngine();
  engine.coldStart('tenant-a', 'A Corp', 'https://a.example', 'Profile A');
  engine.coldStart('tenant-b', 'B Corp', 'https://b.example', 'Profile B');
  const a = engine.searchCards('tenant-a');
  const b = engine.searchCards('tenant-b');
  assert.equal(a.length, 20);
  assert.equal(b.length, 20);
  assert.notEqual(a[0]?.kb_id, b[0]?.kb_id);
  assert.ok(a.every((card) => card.tenant_id === 'tenant-a' && !card.public_claim_approved));
  assert.equal(engine.getCard('tenant-b', a[0]!.kb_id), undefined);
});

test('consent hard stop overrides score', () => {
  const account: CustomerAccount = {
    account_id: 'A1', tenant_id: 't1', standard_name: 'Buyer', domain: 'buyer.example', country: 'DE', buyer_type: 'importer',
    icp_fit_level: 'A+', total_revenue_usd: 1_000_000, historical_orders_count: 10, consent_status: 'unsubscribed', risk_flags: []
  };
  const score = new CustomerAssetEngine().scoreAccount(account);
  assert.equal(score.priority_score, 0);
  assert.equal(score.tier, 'D');
  assert.ok(score.hard_stops.length > 0);
});

test('quote rejects impossible values and remains a draft', () => {
  const engine = new SalesExecutionEngine();
  assert.throws(() => engine.generateConditionalQuote('Widget', -1, 'USD', 100));
  assert.equal(engine.generateConditionalQuote('Widget', 10, 'USD', 100).status, 'draft_requires_human_approval');
});

test('email check never claims MX or SMTP verification', () => {
  const result = new CapabilityRegistry().checkEmailSyntax('buyer@example.com');
  assert.equal(result.mode, 'local_heuristic');
  assert.equal(result.is_verified, false);
  assert.equal(result.data?.has_mx_records, null);
  assert.equal(result.data?.smtp_status, 'unknown');
});
