import { CustomerAccount, CustomerContact, Opportunity, Interaction, CustomerTier } from './types.js';

export class CustomerAssetEngine {
  private accounts: Map<string, CustomerAccount> = new Map();
  private contacts: Map<string, CustomerContact[]> = new Map();
  private opportunities: Map<string, Opportunity[]> = new Map();
  private interactions: Map<string, Interaction[]> = new Map();

  constructor() {
    this.seedDemoCustomers();
  }

  public scoreAccount(account: Partial<CustomerAccount>, interactions: Interaction[] = [], opps: Opportunity[] = [], contacts: CustomerContact[] = []): {
    priority_score: number;
    tier: CustomerTier;
    score_breakdown: CustomerAccount['score_breakdown'];
    dynamic_lists: string[];
  } {
    const consent = account.consent_status || 'subscribed';
    const riskFlags = account.risk_flags || [];

    // Hard stops
    if (['unsubscribed', 'blacklisted', 'disputed_debt'].includes(consent) || riskFlags.includes('blacklist')) {
      return {
        priority_score: 0,
        tier: 'D',
        score_breakdown: { intent: 0, fit: 0, power: 0, stage: 0, value: 0, quality: 0, risk_penalty: -100 },
        dynamic_lists: []
      };
    }

    // 1. Intent (25 max)
    let intent = 0;
    if (interactions.some(i => ['inquiry', 'quote_request'].includes(i.signal_type))) intent += 10;
    if (interactions.some(i => i.signal_type === 'sample_feedback')) intent += 8;
    if (interactions.some(i => i.signal_strength === 'strong')) intent += 7;
    intent = Math.min(25, intent);

    // 2. Fit (20 max)
    let fit = 10;
    if (account.icp_fit_level === 'A+') fit = 20;
    else if (account.icp_fit_level === 'A') fit = 16;
    else if (account.icp_fit_level === 'B') fit = 10;
    else fit = 4;

    // 3. Power (20 max)
    let power = 0;
    if ((account.total_revenue_usd || 0) > 100000) power += 10;
    else if ((account.total_revenue_usd || 0) > 20000) power += 6;
    if (account.average_repurchase_cycle_days && account.average_repurchase_cycle_days <= 90) power += 10;
    else power += 5;
    power = Math.min(20, power);

    // 4. Stage (15 max)
    let stage = 0;
    const activeOpps = opps.filter(o => !['closed_won', 'closed_lost'].includes(o.stage));
    if (activeOpps.some(o => ['commercial_negotiation', 'pi_issued'].includes(o.stage))) stage += 15;
    else if (activeOpps.some(o => o.stage === 'sample_testing')) stage += 10;
    else if (activeOpps.some(o => o.stage === 'quote_sent')) stage += 6;
    else if (activeOpps.some(o => o.stage === 'rfq_received')) stage += 4;

    // 5. Value (10 max)
    let value = 0;
    if ((account.historical_orders_count || 0) >= 2) value += 5;
    if ((account.total_revenue_usd || 0) >= 50000) value += 5;

    // 6. Quality (10 max)
    let quality = 0;
    if (contacts.some(c => ['economic_buyer', 'procurement_gatekeeper'].includes(c.role_in_buying_committee) && c.email_verification_status === 'C1_verified')) {
      quality += 5;
    }
    if (interactions.some(i => ['click', 'open'].includes(i.signal_type))) {
      quality += 5;
    }

    // 7. Risk penalties
    let risk_penalty = 0;
    if (riskFlags.includes('debt_issue')) risk_penalty -= 30;
    if (riskFlags.includes('high_bounce')) risk_penalty -= 20;
    if (riskFlags.includes('product_mismatch')) risk_penalty -= 20;

    const totalScore = Math.max(0, Math.min(100, intent + fit + power + stage + value + quality + risk_penalty));

    let tier: CustomerTier = 'D';
    if (totalScore >= 85) tier = 'S';
    else if (totalScore >= 70) tier = 'A';
    else if (totalScore >= 50) tier = 'B';
    else if (totalScore >= 30) tier = 'C';

    const dynamic_lists: string[] = [];
    if (intent >= 10) dynamic_lists.push('today_must_follow');
    if (activeOpps.some(o => o.stage === 'quote_sent')) dynamic_lists.push('stalled_after_quote');
    if (activeOpps.some(o => o.stage === 'sample_testing')) dynamic_lists.push('sample_unconverted');
    if ((account.historical_orders_count || 0) >= 2) dynamic_lists.push('repeat_purchase_warning');
    if (fit >= 16 && !activeOpps.length) dynamic_lists.push('high_engagement_no_inquiry');
    if (riskFlags.includes('customs_surge')) dynamic_lists.push('sourcing_anomaly');
    if (totalScore >= 65 && activeOpps.length > 0) dynamic_lists.push('high_score_neglected');

    return {
      priority_score: Math.round(totalScore * 10) / 10,
      tier,
      score_breakdown: {
        intent: Math.round(intent * 10) / 10,
        fit: Math.round(fit * 10) / 10,
        power: Math.round(power * 10) / 10,
        stage: Math.round(stage * 10) / 10,
        value: Math.round(value * 10) / 10,
        quality: Math.round(quality * 10) / 10,
        risk_penalty: Math.round(risk_penalty * 10) / 10
      },
      dynamic_lists
    };
  }

  public getCustomer360(accountId: string): {
    account?: CustomerAccount;
    contacts: CustomerContact[];
    opportunities: Opportunity[];
    interactions: Interaction[];
  } {
    return {
      account: this.accounts.get(accountId),
      contacts: this.contacts.get(accountId) || [],
      opportunities: this.opportunities.get(accountId) || [],
      interactions: this.interactions.get(accountId) || []
    };
  }

  public getDynamicLists(tenantId: string): Record<string, CustomerAccount[]> {
    const listMap: Record<string, CustomerAccount[]> = {
      today_must_follow: [],
      stalled_after_quote: [],
      sample_unconverted: [],
      repeat_purchase_warning: [],
      high_engagement_no_inquiry: [],
      sourcing_anomaly: [],
      reactivated_sleepers: [],
      high_score_neglected: []
    };

    for (const acc of this.accounts.values()) {
      if (acc.tenant_id === tenantId) {
        for (const listName of acc.dynamic_lists) {
          if (listMap[listName]) {
            listMap[listName].push(acc);
          }
        }
      }
    }
    return listMap;
  }

  public batchCleanAndDeduplicate(rawRecords: any[]): {
    cleanedCount: number;
    duplicatesMerged: number;
    accountsCreated: CustomerAccount[];
  } {
    const domainMap = new Map<string, any>();
    let duplicatesMerged = 0;

    for (const raw of rawRecords) {
      const domain = (raw.domain || raw.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      if (!domain) continue;

      if (domainMap.has(domain)) {
        duplicatesMerged++;
        const existing = domainMap.get(domain);
        existing.total_revenue_usd = (existing.total_revenue_usd || 0) + (raw.revenue || 0);
        existing.historical_orders_count = (existing.historical_orders_count || 0) + (raw.orders || 0);
      } else {
        domainMap.set(domain, { ...raw, domain });
      }
    }

    const accountsCreated: CustomerAccount[] = [];
    let idx = 1;
    for (const [domain, rec] of domainMap.entries()) {
      const accId = `ACC-CLEAN-${String(idx).padStart(4, '0')}`;
      const baseAcc: Partial<CustomerAccount> = {
        account_id: accId,
        tenant_id: rec.tenant_id || 'demo_export_corp',
        standard_name: rec.company_name || rec.name || domain,
        domain,
        country: rec.country || 'US',
        buyer_type: rec.buyer_type || 'importer',
        icp_fit_level: rec.icp || 'A',
        total_revenue_usd: rec.total_revenue_usd || 0,
        historical_orders_count: rec.historical_orders_count || 0,
        consent_status: 'subscribed',
        risk_flags: []
      };
      const scoreRes = this.scoreAccount(baseAcc);
      const fullAcc: CustomerAccount = {
        ...baseAcc as any,
        tier: scoreRes.tier,
        priority_score: scoreRes.priority_score,
        score_breakdown: scoreRes.score_breakdown,
        dynamic_lists: scoreRes.dynamic_lists
      };
      this.accounts.set(accId, fullAcc);
      accountsCreated.push(fullAcc);
      idx++;
    }

    return {
      cleanedCount: accountsCreated.length,
      duplicatesMerged,
      accountsCreated
    };
  }

  private seedDemoCustomers(): void {
    const demoAccounts: CustomerAccount[] = [
      {
        account_id: 'ACC-001',
        tenant_id: 'demo_export_corp',
        standard_name: 'Apex Global Sourcing LLC',
        brand_name: 'Apex Home',
        domain: 'apex-sourcing.com',
        country: 'US',
        buyer_type: 'importer',
        icp_fit_level: 'A+',
        tier: 'S',
        priority_score: 92.5,
        score_breakdown: { intent: 25, fit: 20, power: 18, stage: 15, value: 10, quality: 10, risk_penalty: 0 },
        assigned_rep: 'Jason Zhang',
        total_revenue_usd: 280000,
        historical_orders_count: 4,
        average_repurchase_cycle_days: 75,
        last_order_date: '2026-06-10',
        next_predicted_order_window: '2026-08-25',
        last_interaction_at: '2026-08-20',
        consent_status: 'subscribed',
        risk_flags: ['customs_surge'],
        dynamic_lists: ['today_must_follow', 'repeat_purchase_warning', 'sourcing_anomaly']
      },
      {
        account_id: 'ACC-002',
        tenant_id: 'demo_export_corp',
        standard_name: 'EuroRetail Group GmbH',
        brand_name: 'EuroLiving',
        domain: 'euro-living.de',
        country: 'DE',
        buyer_type: 'retailer',
        icp_fit_level: 'A',
        tier: 'A',
        priority_score: 78.0,
        score_breakdown: { intent: 18, fit: 16, power: 16, stage: 10, value: 8, quality: 10, risk_penalty: 0 },
        assigned_rep: 'Sarah Liu',
        total_revenue_usd: 120000,
        historical_orders_count: 2,
        average_repurchase_cycle_days: 90,
        last_order_date: '2026-05-15',
        last_interaction_at: '2026-08-18',
        consent_status: 'subscribed',
        risk_flags: [],
        dynamic_lists: ['stalled_after_quote', 'high_score_neglected']
      },
      {
        account_id: 'ACC-003',
        tenant_id: 'demo_export_corp',
        standard_name: 'Nordic Craft Imports AB',
        domain: 'nordiccraft.se',
        country: 'SE',
        buyer_type: 'distributor',
        icp_fit_level: 'B',
        tier: 'B',
        priority_score: 58.5,
        score_breakdown: { intent: 10, fit: 10, power: 12, stage: 10, value: 5, quality: 11.5, risk_penalty: 0 },
        assigned_rep: 'Jason Zhang',
        total_revenue_usd: 45000,
        historical_orders_count: 1,
        consent_status: 'subscribed',
        risk_flags: [],
        dynamic_lists: ['sample_unconverted']
      }
    ];

    for (const acc of demoAccounts) {
      this.accounts.set(acc.account_id, acc);
    }

    this.contacts.set('ACC-001', [
      {
        contact_id: 'CON-001-A',
        account_id: 'ACC-001',
        full_name: 'Michael Vance',
        title: 'VP of Global Procurement',
        role_in_buying_committee: 'economic_buyer',
        email: 'm.vance@apex-sourcing.com',
        email_verification_status: 'C1_verified',
        is_primary: true
      }
    ]);

    this.opportunities.set('ACC-001', [
      {
        opportunity_id: 'OPP-001-1',
        account_id: 'ACC-001',
        title: '2026 Fall Season Tableware & Kitchenware Restock',
        stage: 'commercial_negotiation',
        estimated_amount_usd: 85000,
        probability_percent: 80,
        stage_entered_at: '2026-08-15'
      }
    ]);

    this.interactions.set('ACC-001', [
      {
        interaction_id: 'INT-001-1',
        account_id: 'ACC-001',
        contact_id: 'CON-001-A',
        channel: 'email',
        signal_type: 'quote_request',
        signal_strength: 'strong',
        summary: 'Requested formal quotation for 5 HQ containers with custom packaging.',
        timestamp: '2026-08-20T10:30:00Z'
      }
    ]);
  }
}
