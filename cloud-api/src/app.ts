import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  CapabilityRegistry,
  CustomerAssetEngine,
  KnowledgeBaseEngine,
  SalesExecutionEngine,
  coldStartSchema,
  emailSyntaxSchema,
  inquirySchema,
  knowledgeSearchSchema,
  parseOrThrow,
  quoteSchema,
  scoreSchema,
  type AuthenticatedPrincipal,
  type CustomerAccount,
  type CustomerContact,
  type Interaction,
  type Opportunity
} from '@renwork/export-growth-core';
import type { ApiConfig } from './config.js';

declare global {
  namespace Express {
    interface Request { principal?: AuthenticatedPrincipal; requestId?: string; }
  }
}

const benchmarkSummary = {
  suite: 'starter-governance-benchmark',
  status: 'NOT_RUN',
  total_cases: 35,
  ordinary_cases: 30,
  refusal_cases: 5,
  passed: 0,
  failed: 0,
  note: '仓库中的 starter 数据集尚未由真实回答评估器执行；系统不会伪造 100% 通过率。'
};

export function createApp(config: ApiConfig) {
  const app = express();
  const kb = new KnowledgeBaseEngine();
  const customers = new CustomerAssetEngine();
  const sales = new SalesExecutionEngine();
  const capabilities = new CapabilityRegistry();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Origin is not allowed'));
    }
  }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use((req, res, next) => {
    req.requestId = req.header('x-request-id')?.slice(0, 128) || crypto.randomUUID();
    res.setHeader('x-request-id', req.requestId);
    next();
  });

  app.get('/health/live', (_req, res) => res.json({ status: 'ok', service: 'renwork-export-growth-api', version: '4.0.0' }));
  app.get('/health/ready', (_req, res) => {
    const ready = config.apiKeys.size > 0;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      version: '4.0.0',
      storage_mode: 'ephemeral_memory',
      authentication: ready ? 'configured' : 'missing_RENWORK_API_KEYS',
      capabilities: capabilities.list()
    });
  });
  app.get('/healthz', (_req, res) => res.redirect(308, '/health/ready'));

  app.get('/openapi.json', (_req, res) => res.json({
    openapi: '3.1.0',
    info: { title: 'RenWork AI Export Growth API', version: '4.0.0', description: 'Evidence-first, tenant-scoped API. Unconfigured live providers return 501 instead of fabricated data.' },
    security: [{ bearerAuth: [] }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
    paths: {
      '/api/v1/kb/cold-start': { post: { summary: 'Create 00–20 evidence-ready module skeletons' } },
      '/api/v1/kb/search': { post: { summary: 'Tenant-scoped card search' } },
      '/api/v1/kb/cards/{cardId}': { get: { summary: 'Read one tenant-scoped card' } },
      '/api/v1/kb/audit': { get: { summary: 'Knowledge governance audit' } },
      '/api/v1/customers/score': { post: { summary: 'Explainable V4 customer scoring and hard stops' } },
      '/api/v1/sales/qualify': { post: { summary: '10-dimension inquiry qualification' } },
      '/api/v1/sales/quote': { post: { summary: 'Conditional Good/Better/Best quote draft' } },
      '/api/v1/sales/aftersales-triage': { post: { summary: 'P1/P2/P3 aftersales triage' } },
      '/api/v1/capabilities': { get: { summary: 'Live capability inventory' } },
      '/api/v1/providers/{provider}': { post: { summary: 'Provider call; unavailable providers return 501' } },
      '/api/v1/providers/email-syntax': { post: { summary: 'Local syntax-only email check' } },
      '/api/v1/audit/benchmark': { get: { summary: 'Honest benchmark execution status' } }
    }
  }));

  const apiAuth = (req: Request, res: Response, next: NextFunction) => {
    const header = req.header('authorization');
    const key = header?.startsWith('Bearer ') ? header.slice(7) : '';
    const principal = config.apiKeys.get(key);
    if (!principal) return res.status(401).json({ error: { code: 'unauthorized', message: 'Valid bearer API key required' }, request_id: req.requestId });
    req.principal = principal;
    next();
  };
  app.use('/api/v1', apiAuth);

  const tenant = (req: Request) => req.principal!.tenant_id;
  const ok = (res: Response, data: unknown) => res.json({ data, meta: { request_id: res.getHeader('x-request-id'), version: '4.0.0' } });

  app.post('/api/v1/kb/cold-start', (req, res, next) => {
    try {
      const input = parseOrThrow(coldStartSchema, req.body);
      ok(res, kb.coldStart(tenant(req), input.company_name, input.website_url, input.profile_summary, input.industry));
    } catch (error) { next(error); }
  });
  app.post('/api/v1/kb/search', (req, res, next) => {
    try {
      const input = parseOrThrow(knowledgeSearchSchema, req.body);
      ok(res, kb.searchCards(tenant(req), input.query, { module: input.module, roleView: input.role_view, sensitivity: input.sensitivity, status: input.status, limit: input.limit }));
    } catch (error) { next(error); }
  });
  app.post('/api/v1/kb/query', (req, res, next) => {
    try {
      const input = parseOrThrow(knowledgeSearchSchema, req.body);
      ok(res, kb.searchCards(tenant(req), input.query, { module: input.module, roleView: input.role_view, sensitivity: input.sensitivity, status: input.status, limit: input.limit }));
    } catch (error) { next(error); }
  });
  app.get('/api/v1/kb/cards/:cardId', (req, res) => {
    const card = kb.getCard(tenant(req), req.params.cardId);
    if (!card) return res.status(404).json({ error: { code: 'not_found', message: 'Knowledge card not found' }, request_id: req.requestId });
    ok(res, card);
  });
  app.get('/api/v1/kb/audit', (req, res) => ok(res, kb.auditGovernance(tenant(req))));

  app.post('/api/v1/customers/score', (req, res, next) => {
    try {
      const input = parseOrThrow(scoreSchema, req.body);
      const account = { ...input.account, tenant_id: tenant(req) } as CustomerAccount;
      const scoped = <T extends Record<string, unknown>>(items: T[]) => items.map((item) => ({ ...item, tenant_id: tenant(req) }));
      ok(res, customers.scoreAccount(account, scoped(input.interactions ?? []) as unknown as Interaction[], scoped(input.opportunities ?? []) as unknown as Opportunity[], scoped(input.contacts ?? []) as unknown as CustomerContact[]));
    } catch (error) { next(error); }
  });
  app.post('/api/v1/sales/qualify', (req, res, next) => {
    try {
      const input = parseOrThrow(inquirySchema, req.body);
      ok(res, sales.qualifyInquiry(input.raw_inquiry, input.sender_email, input.sender_country));
    } catch (error) { next(error); }
  });
  app.post('/api/v1/sales/quote', (req, res, next) => {
    try {
      const input = parseOrThrow(quoteSchema, req.body);
      ok(res, sales.generateConditionalQuote(input.product_name, input.base_price, input.currency ?? 'USD', input.moq, input.assumptions ?? []));
    } catch (error) { next(error); }
  });
  app.post('/api/v1/sales/aftersales-triage', (req, res) => ok(res, sales.triageAftersales(String(req.body?.issue_description ?? ''))));
  app.get('/api/v1/capabilities', (_req, res) => ok(res, capabilities.list()));
  app.post('/api/v1/providers/email-syntax', (req, res, next) => {
    try { ok(res, capabilities.checkEmailSyntax(parseOrThrow(emailSyntaxSchema, req.body).email)); } catch (error) { next(error); }
  });
  app.post('/api/v1/providers/:provider', (req, res) => {
    const supported = ['website_extraction', 'crm_sync', 'customs_search', 'freight_tariff', 'fx_rates'] as const;
    if (!supported.includes(req.params.provider as typeof supported[number])) return res.status(404).json({ error: { code: 'unknown_capability', message: 'Unknown provider capability' }, request_id: req.requestId });
    const result = capabilities.unavailable(req.params.provider as typeof supported[number]);
    res.status(501).json({ error: { code: 'capability_unavailable', message: result.warnings[0] }, capability: result, request_id: req.requestId });
  });
  app.get('/api/v1/audit/benchmark', (_req, res) => ok(res, benchmarkSummary));
  app.post('/api/v1/audit/benchmark', (_req, res) => ok(res, benchmarkSummary));

  const here = path.dirname(fileURLToPath(import.meta.url));
  const portalPath = path.resolve(here, '../../portal');
  app.use(express.static(portalPath, { extensions: ['html'], maxAge: '1h' }));

  app.use((_req, res) => res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } }));
  app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
    const validation = error.name === 'ValidationError';
    res.status(validation ? 400 : 500).json({
      error: { code: validation ? 'invalid_request' : 'internal_error', message: validation ? error.message : 'Unexpected server error' },
      request_id: req.requestId
    });
  });
  return app;
}
