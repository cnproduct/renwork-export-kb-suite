export type KnowledgeModule =
  | '00_kb_governance'
  | '01_sources_permissions'
  | '02_company_identity'
  | '03_brand_messaging'
  | '04_product_catalog'
  | '05_manufacturing_quality'
  | '06_certification_compliance'
  | '07_commercial_delivery'
  | '08_market_intelligence'
  | '09_icp_buyer_personas'
  | '10_buyer_intent_signals'
  | '11_competitors_differentiation'
  | '12_product_market_fit'
  | '13_lead_discovery'
  | '14_customer_asset_lifecycle'
  | '15_inquiry_qualification'
  | '16_solution_quotation'
  | '17_objection_negotiation'
  | '18_sales_content_templates'
  | '19_order_delivery_aftersales'
  | '20_learning_metrics';

export type KnowledgeStatus =
  | 'verified_fact'
  | 'public_fact'
  | 'ai_inference'
  | 'strategy_recommendation'
  | 'pending_supplement'
  | 'deprecated';

export type SensitivityLevel = 'public' | 'internal' | 'restricted';

export type RoleView =
  | 'management'
  | 'sales_director'
  | 'junior_sales'
  | 'senior_sales'
  | 'marketing'
  | 'operations_quality';

export interface KnowledgeCard {
  kb_id: string;
  tenant_id: string;
  module: KnowledgeModule;
  knowledge_kind: 'fact' | 'rule' | 'workflow' | 'template' | 'case_study' | 'training_material';
  entity_type: string;
  entity_id: string;
  title: string;
  language: string;
  status: KnowledgeStatus;
  confidence: number;
  sensitivity: SensitivityLevel;
  public_claim_approved: boolean;
  role_views: RoleView[];
  applicable_markets?: string[];
  applicable_buyer_types?: string[];
  workflow_stages?: string[];
  conclusion: string;
  conditions: string;
  evidence: string;
  recommended_actions: string;
  red_lines: string;
  pending_confirmations: string;
  created_at?: string;
  updated_at?: string;
}

export type CustomerTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface CustomerAccount {
  account_id: string;
  tenant_id: string;
  standard_name: string;
  brand_name?: string;
  domain: string;
  country: string;
  buyer_type: string;
  icp_fit_level: 'A+' | 'A' | 'B' | 'C';
  tier: CustomerTier;
  priority_score: number;
  score_breakdown: {
    intent: number;
    fit: number;
    power: number;
    stage: number;
    value: number;
    quality: number;
    risk_penalty: number;
  };
  assigned_rep?: string;
  total_revenue_usd: number;
  historical_orders_count: number;
  average_repurchase_cycle_days?: number;
  last_order_date?: string;
  next_predicted_order_window?: string;
  last_interaction_at?: string;
  consent_status: 'subscribed' | 'opt_out' | 'unsubscribed' | 'blacklisted' | 'disputed_debt';
  risk_flags: string[];
  dynamic_lists: string[];
}

export interface CustomerContact {
  contact_id: string;
  account_id: string;
  full_name: string;
  title: string;
  role_in_buying_committee: 'economic_buyer' | 'technical_evaluator' | 'user_influencer' | 'procurement_gatekeeper' | 'champion' | 'blocker';
  email: string;
  email_verification_status: 'C1_verified' | 'C2_pattern_matched' | 'C0_risky' | 'bounced';
  phone?: string;
  whatsapp?: string;
  linkedin_url?: string;
  is_primary: boolean;
}

export interface Opportunity {
  opportunity_id: string;
  account_id: string;
  title: string;
  stage: 'discovery' | 'rfq_received' | 'quote_sent' | 'sample_testing' | 'commercial_negotiation' | 'pi_issued' | 'closed_won' | 'closed_lost';
  estimated_amount_usd: number;
  probability_percent: number;
  stage_entered_at: string;
  next_action_due_at?: string;
  loss_reason?: string;
}

export interface Interaction {
  interaction_id: string;
  account_id: string;
  contact_id?: string;
  channel: 'email' | 'whatsapp' | 'linkedin' | 'phone' | 'video_call' | 'rfq' | 'website' | 'exhibition';
  signal_type: 'inquiry' | 'quote_request' | 'sample_feedback' | 'complaint' | 'click' | 'open' | 'unsubscribe';
  signal_strength: 'strong' | 'medium' | 'weak' | 'negative';
  summary: string;
  timestamp: string;
}
