import test from 'node:test';
import assert from 'node:assert';
import { KnowledgeBaseEngine } from './engines/kbEngine.js';
import { CustomerAssetEngine } from './engines/customerEngine.js';
import { SalesExecutionEngine } from './engines/salesEngine.js';
import { CustomsAggregator } from './aggregators/customsAggregator.js';
import { EmailVerifyAggregator } from './aggregators/emailVerifyAggregator.js';
import { TradeAggregator } from './aggregators/tradeAggregator.js';
import { FxAggregator } from './aggregators/fxAggregator.js';

test('1. Knowledge Base Cold Start should generate standard cards', () => {
  const kbEngine = new KnowledgeBaseEngine();
  const res = kbEngine.coldStart('tenant_test', 'Test Ceramic Corp', 'https://testceramic.com', 'Leading ceramic manufacturer');
  assert.strictEqual(res.tenantId, 'tenant_test');
  assert.ok(res.cardsCount > 0);
  assert.ok(res.cheatSheet.key_strengths.length >= 3);
});

test('2. Customer Dynamic Scoring & 8 Lists', () => {
  const custEngine = new CustomerAssetEngine();
  const scoreRes = custEngine.scoreAccount({
    account_id: 'ACC-001',
    standard_name: 'Apex Global Sourcing LLC',
    domain: 'apexglobal.com',
    country: 'US',
    icp_fit_level: 'A+',
    total_revenue_usd: 150000,
    historical_orders_count: 4,
    average_repurchase_cycle_days: 60
  }, [
    { interaction_id: 'INT-01', account_id: 'ACC-001', contact_id: 'C-01', channel: 'email', signal_type: 'inquiry', signal_strength: 'strong', summary: 'Inquiry', timestamp: new Date().toISOString() },
    { interaction_id: 'INT-02', account_id: 'ACC-001', contact_id: 'C-01', channel: 'email', signal_type: 'click', signal_strength: 'medium', summary: 'Catalog Click', timestamp: new Date().toISOString() }
  ], [
    { opportunity_id: 'OPP-01', account_id: 'ACC-001', title: 'Big Order', stage: 'commercial_negotiation', estimated_amount_usd: 50000, probability_percent: 80, stage_entered_at: new Date().toISOString() }
  ], [
    { contact_id: 'C-01', account_id: 'ACC-001', full_name: 'David Chen', title: 'VP Sourcing', role_in_buying_committee: 'economic_buyer', email: 'david@apexglobal.com', email_verification_status: 'C1_verified', is_primary: true }
  ]);
  assert.ok(scoreRes.priority_score >= 80);
  assert.ok(['S', 'A'].includes(scoreRes.tier));
});

test('3. Sales 10-Step Inquiry Qualification', () => {
  const salesEngine = new SalesExecutionEngine();
  const res = salesEngine.qualifyInquiry('Need 5000 pcs custom stainless steel mug FOB Ningbo by Oct with FDA', 'buyer@usaretail.com', 'US');
  assert.strictEqual(res.qualification_status, 'Go');
  assert.ok(res.score >= 80);
});

test('4. Customs Aggregator should filter freight forwarders', () => {
  const customs = new CustomsAggregator();
  const res = customs.searchCustomsBuyers({ keyword: 'ceramic' });
  assert.ok(res.results.length > 0);
  assert.ok(res.filtered_forwarders_count >= 0);
  assert.strictEqual(res.results.some(r => r.buyer_name.includes('Logistics')), false);
});

test('5. Email Verifier should classify C1/C2/C0 correctly', () => {
  const emailVerifier = new EmailVerifyAggregator();
  const c1 = emailVerifier.verifyEmail('john.smith@homedepot.com');
  assert.strictEqual(c1.credibility_grade, 'C1');
  const c2 = emailVerifier.verifyEmail('info@homedepot.com');
  assert.strictEqual(c2.credibility_grade, 'C2');
  const c0 = emailVerifier.verifyEmail('fake@mailinator.com');
  assert.strictEqual(c0.credibility_grade, 'C0');
});

test('6. Trade & Freight Aggregator should calculate tariffs and shipping', () => {
  const trade = new TradeAggregator();
  const res = trade.estimateTradeAndFreight({ origin_port: 'Shenzhen', destination_port: 'Los Angeles', hs_code: '6911.10', incoterm: 'FOB' });
  assert.ok(res.estimated_duty_rate_percentage > 0);
  assert.ok(res.ocean_freight_40hq_usd > 0);
});

test('7. FX Aggregator should compute converted amount and margin floor', () => {
  const fx = new FxAggregator();
  const res = fx.convertCurrency({ amount: 100000, base_currency: 'CNY', target_currency: 'USD' });
  assert.ok(res.converted_amount > 0);
  assert.ok(res.margin_floor_price > res.converted_amount);
});
