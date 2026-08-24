import { z } from 'zod';
import { KNOWLEDGE_MODULES } from './contracts.js';

const safeId = z.string().min(2).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
const safeText = z.string().trim().min(1).max(20_000);

export const coldStartSchema = z.object({
  company_name: z.string().trim().min(2).max(200),
  website_url: z.string().url().refine((v) => new URL(v).protocol === 'https:', 'website_url must use HTTPS'),
  profile_summary: safeText,
  industry: z.string().trim().min(2).max(100).optional().default('general')
}).strict();

export const knowledgeSearchSchema = z.object({
  query: z.string().trim().max(500).default(''),
  module: z.enum(KNOWLEDGE_MODULES).optional(),
  role_view: z.enum(['management', 'sales_director', 'junior_sales', 'senior_sales', 'marketing', 'operations_quality']).optional(),
  sensitivity: z.enum(['public', 'internal', 'restricted']).optional(),
  status: z.enum(['verified_fact', 'public_fact', 'ai_inference', 'strategy_recommendation', 'pending_supplement', 'deprecated', 'conflicted']).optional(),
  limit: z.number().int().min(1).max(100).default(20)
}).strict();

export const quoteSchema = z.object({
  product_name: z.string().trim().min(1).max(200),
  base_price: z.number().finite().positive().max(100_000_000),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default('USD'),
  moq: z.number().int().positive().max(100_000_000),
  assumptions: z.array(z.string().trim().min(1).max(500)).max(20).default([])
}).strict();

export const inquirySchema = z.object({
  raw_inquiry: safeText,
  sender_email: z.string().email().max(320).optional(),
  sender_country: z.string().trim().min(2).max(80).optional()
}).strict();

export const scoreSchema = z.object({
  account: z.object({
    account_id: safeId,
    standard_name: z.string().trim().min(1).max(300),
    domain: z.string().trim().max(300).default(''),
    country: z.string().trim().min(2).max(80),
    buyer_type: z.string().trim().min(1).max(100),
    icp_fit_level: z.enum(['A+', 'A', 'B', 'C']),
    total_revenue_usd: z.number().finite().nonnegative().default(0),
    historical_orders_count: z.number().int().nonnegative().default(0),
    average_repurchase_cycle_days: z.number().int().positive().optional(),
    last_order_date: z.string().datetime().or(z.string().date()).optional(),
    next_predicted_order_window: z.string().datetime().or(z.string().date()).optional(),
    last_interaction_at: z.string().datetime().or(z.string().date()).optional(),
    consent_status: z.enum(['subscribed', 'opt_out', 'unsubscribed', 'blacklisted', 'disputed_debt']),
    risk_flags: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
    brand_name: z.string().max(300).optional(),
    assigned_rep: z.string().max(200).optional()
  }).strict(),
  interactions: z.array(z.record(z.unknown())).max(10_000).default([]),
  opportunities: z.array(z.record(z.unknown())).max(10_000).default([]),
  contacts: z.array(z.record(z.unknown())).max(10_000).default([])
}).strict();

export const emailSyntaxSchema = z.object({ email: z.string().trim().max(320) }).strict();

export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; '));
    error.name = 'ValidationError';
    throw error;
  }
  return parsed.data;
}
