import type { CustomerAccount, CustomerContact, Interaction, Opportunity, ScoreBreakdown, ScoreResult } from './contracts.js';

export const SCORE_MODEL_VERSION = '4.0.0';
export const DYNAMIC_LISTS = [
  'today_must_follow', 'stalled_after_quote', 'sample_unconverted', 'repeat_purchase_warning',
  'high_engagement_no_inquiry', 'sourcing_anomaly', 'reactivated_sleepers', 'high_score_neglected'
] as const;

const daysBetween = (earlier: string | undefined, later: Date) => earlier ? Math.floor((later.getTime() - Date.parse(earlier)) / 86_400_000) : Number.POSITIVE_INFINITY;
const isWithinDays = (timestamp: string, now: Date, days: number) => daysBetween(timestamp, now) >= 0 && daysBetween(timestamp, now) <= days;

export class CustomerAssetEngine {
  scoreAccount(account: CustomerAccount, interactions: Interaction[] = [], opportunities: Opportunity[] = [], contacts: CustomerContact[] = [], now = new Date()): ScoreResult {
    const hardStops: string[] = [];
    if (['opt_out', 'unsubscribed', 'blacklisted', 'disputed_debt'].includes(account.consent_status)) hardStops.push(`consent:${account.consent_status}`);
    for (const flag of ['blacklist', 'severe_dispute', 'prohibited_marketing']) {
      if (account.risk_flags.includes(flag)) hardStops.push(`risk:${flag}`);
    }
    if (hardStops.length) {
      return {
        model_version: SCORE_MODEL_VERSION,
        calculated_at: now.toISOString(),
        priority_score: 0,
        tier: 'D',
        score_breakdown: { intent: 0, fit: 0, power: 0, stage: 0, value: 0, quality: 0, risk_penalty: -100 },
        hard_stops: hardStops,
        reasons: ['硬停止条件优先于任何客户高分，禁止进入自动营销队列。'],
        missing_data: [],
        dynamic_lists: []
      };
    }

    const recent = interactions.filter((item) => isWithinDays(item.timestamp, now, 30));
    const strong = recent.filter((item) => item.signal_strength === 'strong');
    const medium = recent.filter((item) => item.signal_strength === 'medium');
    const weak = recent.filter((item) => item.signal_strength === 'weak');
    const active = opportunities.filter((item) => !['closed_won', 'closed_lost'].includes(item.stage));

    const intent = Math.min(25,
      (strong.some((i) => ['inquiry', 'quote_request', 'sample_feedback'].includes(i.signal_type)) ? 15 : 0) +
      (medium.some((i) => i.signal_type === 'purchase_evidence') ? 7 : 0) +
      Math.min(3, weak.length));
    const fit = ({ 'A+': 20, A: 16, B: 10, C: 4 } as const)[account.icp_fit_level];
    const power = Math.min(20,
      account.total_revenue_usd >= 100_000 ? 10 : account.total_revenue_usd >= 20_000 ? 6 : 2,
    ) + (account.average_repurchase_cycle_days && account.average_repurchase_cycle_days <= 180 ? 10 : 4);
    const maxStage = active.reduce((max, item) => Math.max(max, ({ discovery: 2, rfq_received: 5, quote_sent: 8, sample_testing: 11, commercial_negotiation: 13, pi_issued: 15 } as Record<string, number>)[item.stage] ?? 0), 0);
    const stage = Math.min(15, maxStage);
    const value = Math.min(10, (account.historical_orders_count >= 2 ? 5 : 0) + (account.total_revenue_usd >= 50_000 ? 5 : 0));
    const quality = Math.min(10,
      (contacts.some((c) => ['economic_buyer', 'procurement_gatekeeper'].includes(c.role_in_buying_committee)) ? 5 : 0) +
      (recent.some((i) => i.signal_strength === 'strong') ? 5 : recent.length ? 2 : 0));
    let riskPenalty = 0;
    if (account.risk_flags.includes('debt_issue')) riskPenalty -= 30;
    if (account.risk_flags.includes('high_bounce')) riskPenalty -= 20;
    if (account.risk_flags.includes('product_mismatch')) riskPenalty -= 20;
    if (recent.some((i) => i.signal_type === 'complaint')) riskPenalty -= 15;

    const breakdown: ScoreBreakdown = { intent, fit, power: Math.min(20, power), stage, value, quality, risk_penalty: riskPenalty };
    const total = Math.max(0, Math.min(100, Object.values(breakdown).reduce((sum, valuePart) => sum + valuePart, 0)));
    const tier = total >= 85 ? 'S' : total >= 70 ? 'A' : total >= 50 ? 'B' : total >= 30 ? 'C' : 'D';
    const dynamicLists: string[] = [];
    const lastInteractionDays = daysBetween(account.last_interaction_at, now);
    if (strong.some((i) => isWithinDays(i.timestamp, now, 7)) && lastInteractionDays >= 1) dynamicLists.push('today_must_follow');
    if (active.some((o) => o.stage === 'quote_sent' && daysBetween(o.stage_entered_at, now) >= 3 && daysBetween(o.stage_entered_at, now) <= 14)) dynamicLists.push('stalled_after_quote');
    if (active.some((o) => o.stage === 'sample_testing' && daysBetween(o.stage_entered_at, now) >= 7)) dynamicLists.push('sample_unconverted');
    if (account.historical_orders_count >= 2 && account.next_predicted_order_window && Math.abs(daysBetween(account.next_predicted_order_window, now)) <= 30 && lastInteractionDays >= 30) dynamicLists.push('repeat_purchase_warning');
    if (fit >= 16 && weak.length + medium.length >= 3 && !active.length) dynamicLists.push('high_engagement_no_inquiry');
    if (account.risk_flags.includes('customs_surge') || recent.some((i) => i.signal_type === 'purchase_evidence')) dynamicLists.push('sourcing_anomaly');
    if (recent.some((i) => i.signal_type === 'reactivated') && lastInteractionDays >= 180) dynamicLists.push('reactivated_sleepers');
    if (total >= 65 && active.length && lastInteractionDays >= 7 && !active.some((o) => o.next_action_due_at)) dynamicLists.push('high_score_neglected');

    const missingData = [
      !account.domain && 'company_domain',
      !contacts.length && 'buying_committee',
      !account.average_repurchase_cycle_days && 'repurchase_cycle',
      !active.length && 'active_opportunity'
    ].filter(Boolean) as string[];

    return {
      model_version: SCORE_MODEL_VERSION,
      calculated_at: now.toISOString(),
      priority_score: total,
      tier,
      score_breakdown: breakdown,
      hard_stops: [],
      reasons: [`ICP匹配贡献 ${fit}/20`, `近期意向贡献 ${intent}/25`, `商机阶段贡献 ${stage}/15`, `风险扣分 ${riskPenalty}`],
      missing_data: missingData,
      dynamic_lists: dynamicLists
    };
  }
}
