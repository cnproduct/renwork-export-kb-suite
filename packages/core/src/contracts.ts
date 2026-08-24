export const KNOWLEDGE_MODULES = [
  '00_kb_governance', '01_sources_permissions', '02_company_identity', '03_brand_messaging',
  '04_product_catalog', '05_manufacturing_quality', '06_certification_compliance', '07_commercial_delivery',
  '08_market_intelligence', '09_icp_buyer_personas', '10_buyer_intent_signals', '11_competitors_differentiation',
  '12_product_market_fit', '13_lead_discovery', '14_customer_asset_lifecycle', '15_inquiry_qualification',
  '16_solution_quotation', '17_objection_negotiation', '18_sales_content_templates',
  '19_order_delivery_aftersales', '20_learning_metrics'
] as const;

export type KnowledgeModule = typeof KNOWLEDGE_MODULES[number];
export type KnowledgeStatus = 'verified_fact' | 'public_fact' | 'ai_inference' | 'strategy_recommendation' | 'pending_supplement' | 'deprecated' | 'conflicted';
export type KnowledgeKind = 'fact' | 'rule' | 'workflow' | 'template' | 'case_study' | 'training_material';
export type SensitivityLevel = 'public' | 'internal' | 'restricted';
export type RoleView = 'management' | 'sales_director' | 'junior_sales' | 'senior_sales' | 'marketing' | 'operations_quality';
export type CustomerTier = 'S' | 'A' | 'B' | 'C' | 'D';
export type ConsentStatus = 'subscribed' | 'opt_out' | 'unsubscribed' | 'blacklisted' | 'disputed_debt';

export interface SourceRef {
  type: 'user_supplied' | 'official_website' | 'official_document' | 'crm' | 'public_registry' | 'third_party' | 'ai_inference';
  uri?: string;
  captured_at: string;
  locator?: string;
  excerpt?: string;
  authority: 'S' | 'A' | 'B' | 'C' | 'D' | 'I';
}

export interface KnowledgeCard {
  kb_id: string;
  tenant_id: string;
  revision: number;
  module: KnowledgeModule;
  knowledge_kind: KnowledgeKind;
  entity_type: string;
  entity_id: string;
  title: string;
  language: string;
  status: KnowledgeStatus;
  confidence: number;
  confidence_basis: string;
  sensitivity: SensitivityLevel;
  public_claim_approved: boolean;
  role_views: RoleView[];
  applicable_markets: string[];
  applicable_buyer_types: string[];
  workflow_stages: string[];
  conclusion: string;
  conditions: string;
  source_refs: SourceRef[];
  recommended_actions: string;
  red_lines: string;
  pending_confirmations: string;
  verified_by: string | null;
  verified_at: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAccount {
  account_id: string;
  tenant_id: string;
  standard_name: string;
  brand_name?: string;
  domain: string;
  country: string;
  buyer_type: string;
  icp_fit_level: 'A+' | 'A' | 'B' | 'C';
  assigned_rep?: string;
  total_revenue_usd: number;
  historical_orders_count: number;
  average_repurchase_cycle_days?: number;
  last_order_date?: string;
  next_predicted_order_window?: string;
  last_interaction_at?: string;
  consent_status: ConsentStatus;
  risk_flags: string[];
}

export interface CustomerContact {
  contact_id: string;
  tenant_id: string;
  account_id: string;
  full_name: string;
  title: string;
  role_in_buying_committee: 'economic_buyer' | 'technical_evaluator' | 'user_influencer' | 'procurement_gatekeeper' | 'champion' | 'blocker';
  email?: string;
  email_verification_status: 'syntax_valid' | 'pattern_matched' | 'risky' | 'bounced' | 'unknown';
  is_primary: boolean;
}

export interface Opportunity {
  opportunity_id: string;
  tenant_id: string;
  account_id: string;
  title: string;
  stage: 'discovery' | 'rfq_received' | 'quote_sent' | 'sample_testing' | 'commercial_negotiation' | 'pi_issued' | 'closed_won' | 'closed_lost';
  estimated_amount_usd: number;
  probability_percent: number;
  stage_entered_at: string;
  next_action_due_at?: string;
}

export interface Interaction {
  interaction_id: string;
  tenant_id: string;
  account_id: string;
  contact_id?: string;
  channel: 'email' | 'whatsapp' | 'linkedin' | 'phone' | 'video_call' | 'rfq' | 'website' | 'exhibition';
  signal_type: 'inquiry' | 'quote_request' | 'sample_feedback' | 'complaint' | 'click' | 'open' | 'unsubscribe' | 'purchase_evidence' | 'reactivated';
  signal_strength: 'strong' | 'medium' | 'weak' | 'negative';
  summary: string;
  timestamp: string;
}

export interface Transaction {
  transaction_id: string;
  tenant_id: string;
  account_id: string;
  opportunity_id?: string;
  product_ids: string[];
  type: 'quote' | 'sample' | 'order' | 'payment' | 'refund' | 'claim';
  amount: number;
  currency: string;
  status: string;
  occurred_at: string;
}

export interface ProductInterest {
  interest_id: string;
  tenant_id: string;
  account_id: string;
  product_id: string;
  evidence: string;
  match_score: number;
  observed_at: string;
}

export interface NextActionTask {
  task_id: string;
  tenant_id: string;
  account_id: string;
  opportunity_id?: string;
  action: string;
  owner: string;
  due_at: string;
  status: 'open' | 'completed' | 'cancelled';
  completion_evidence?: string;
}

export interface RiskConsent {
  record_id: string;
  tenant_id: string;
  account_id: string;
  contact_id?: string;
  channel?: string;
  purpose?: string;
  jurisdiction?: string;
  status: ConsentStatus;
  risk_flags: string[];
  source: string;
  effective_at: string;
}

export interface ScoreBreakdown {
  intent: number;
  fit: number;
  power: number;
  stage: number;
  value: number;
  quality: number;
  risk_penalty: number;
}

export interface ScoreResult {
  model_version: string;
  calculated_at: string;
  priority_score: number;
  tier: CustomerTier;
  score_breakdown: ScoreBreakdown;
  hard_stops: string[];
  reasons: string[];
  missing_data: string[];
  dynamic_lists: string[];
}

export interface AuthenticatedPrincipal {
  subject: string;
  tenant_id: string;
  roles: string[];
}

export interface CapabilityResult<T = never> {
  capability: string;
  mode: 'live' | 'fixture' | 'local_heuristic' | 'unavailable';
  provider: string | null;
  observed_at: string;
  is_verified: boolean;
  source_refs: SourceRef[];
  warnings: string[];
  data?: T;
}
