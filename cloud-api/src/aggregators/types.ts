export interface CustomsBuyerRecord {
  buyer_name: string;
  country: string;
  us_tax_id?: string;
  total_teu_180d: number;
  shipment_count_180d: number;
  top_hs_codes: string[];
  product_descriptions: string[];
  observed_suppliers: Array<{ supplier_name: string; country: string; share_percentage: number }>;
  is_freight_forwarder_filtered: boolean;
  why_now_signal?: string;
  latest_shipment_date: string;
}

export interface CrmSyncPayload {
  tenant_id: string;
  source_system: 'okki' | 'xiaoman' | 'salesforce' | 'hubspot' | 'custom_csv';
  accounts: Array<{
    external_id: string;
    company_name: string;
    domain?: string;
    country?: string;
    owner_name?: string;
    lead_source?: string;
    created_at?: string;
  }>;
  contacts?: Array<{
    external_id: string;
    account_external_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    title?: string;
    is_decision_maker?: boolean;
  }>;
  opportunities?: Array<{
    external_id: string;
    account_external_id: string;
    title: string;
    stage: string;
    amount_usd?: number;
    close_date?: string;
  }>;
}

export interface WebScrapeFactResult {
  url: string;
  title: string;
  company_identity: {
    name?: string;
    established_year?: string;
    factory_location?: string;
    business_type?: 'factory' | 'trading' | 'integrated';
    factory_area_sqm?: number;
  };
  extracted_products: Array<{
    name: string;
    category: string;
    specs: Record<string, string>;
    certifications: string[];
  }>;
  certifications_found: string[];
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
  };
  captured_at: string;
  confidence_score: number;
}

export interface EmailVerificationResult {
  email: string;
  is_valid_format: boolean;
  is_disposable: boolean;
  has_mx_records: boolean;
  domain: string;
  smtp_status: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  credibility_grade: 'C1' | 'C2' | 'C0'; // C1: Verified Decision Maker, C2: Generic Company Mail, C0: High Risk / Fake
  reason: string;
}

export interface TradeFreightEstimate {
  origin_port: string;
  destination_port: string;
  hs_code: string;
  estimated_duty_rate_percentage: number;
  ocean_freight_20gp_usd: number;
  ocean_freight_40hq_usd: number;
  estimated_transit_days: number;
  incoterm_responsibilities: {
    term: 'EXW' | 'FOB' | 'CIF' | 'DDP';
    seller_covers: string[];
    buyer_covers: string[];
    risk_transfer_point: string;
  };
}

export interface FxConversionResult {
  base_currency: string;
  target_currency: string;
  exchange_rate: number;
  converted_amount: number;
  margin_floor_price: number;
  hedged_buffer_percentage: number;
  timestamp: string;
}
