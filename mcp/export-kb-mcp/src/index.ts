#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
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
  type CustomerAccount,
  type CustomerContact,
  type Interaction,
  type Opportunity
} from '@renwork/export-growth-core';

const tenantId = process.env.RENWORK_TENANT_ID;
if (!tenantId) {
  console.error('RENWORK_TENANT_ID is required. Tenant switching is intentionally not exposed to model-controlled arguments.');
  process.exit(1);
}

const kb = new KnowledgeBaseEngine();
const customers = new CustomerAssetEngine();
const sales = new SalesExecutionEngine();
const capabilities = new CapabilityRegistry();
const server = new Server({ name: 'renwork-ai-export-growth-mcp', version: '4.0.0' }, { capabilities: { tools: {} } });

const strictObject = (properties: Record<string, object>, required: string[] = []) => ({ type: 'object' as const, properties, required, additionalProperties: false });
const TOOLS: Tool[] = [
  { name: 'kb_cold_start', description: '建立 00–20 模块证据框架；不会伪称已抓取官网，默认禁止公开发布。', inputSchema: strictObject({ company_name: { type: 'string', minLength: 2, maxLength: 200 }, website_url: { type: 'string', format: 'uri' }, profile_summary: { type: 'string', minLength: 1, maxLength: 20000 }, industry: { type: 'string', maxLength: 100 } }, ['company_name', 'website_url', 'profile_summary']) },
  { name: 'kb_search_cards', description: '在当前固定租户中检索知识卡。', inputSchema: strictObject({ query: { type: 'string', maxLength: 500 }, module: { type: 'string' }, role_view: { type: 'string' }, sensitivity: { type: 'string' }, status: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 100 } }) },
  { name: 'kb_get_card', description: '在当前固定租户中读取一张知识卡。', inputSchema: strictObject({ kb_id: { type: 'string', minLength: 2, maxLength: 80 } }, ['kb_id']) },
  { name: 'kb_audit_governance', description: '审计事实状态、公开闸门、敏感级别、缺口和过期风险。', inputSchema: strictObject({}) },
  { name: 'customer_score_and_segment', description: '运行可解释的 V4 评分、硬停止规则和八类动态名单。', inputSchema: strictObject({ account: { type: 'object' }, interactions: { type: 'array', items: { type: 'object' }, maxItems: 10000 }, opportunities: { type: 'array', items: { type: 'object' }, maxItems: 10000 }, contacts: { type: 'array', items: { type: 'object' }, maxItems: 10000 } }, ['account']) },
  { name: 'sales_qualify_inquiry', description: '执行 10 维询盘速检，只提出下一批最关键问题。', inputSchema: strictObject({ raw_inquiry: { type: 'string', minLength: 1, maxLength: 20000 }, sender_email: { type: 'string', format: 'email' }, sender_country: { type: 'string', maxLength: 80 } }, ['raw_inquiry']) },
  { name: 'sales_generate_conditional_quote', description: '基于用户提供的基准价生成待人工审批的三档条件报价草稿。', inputSchema: strictObject({ product_name: { type: 'string', minLength: 1 }, base_price: { type: 'number', exclusiveMinimum: 0 }, currency: { type: 'string', pattern: '^[A-Z]{3}$' }, moq: { type: 'integer', minimum: 1 }, assumptions: { type: 'array', items: { type: 'string' }, maxItems: 20 } }, ['product_name', 'base_price', 'moq']) },
  { name: 'sales_triage_aftersales', description: '执行 P1/P2/P3 售后分级、证据清单和升级边界。', inputSchema: strictObject({ issue_description: { type: 'string', minLength: 1, maxLength: 20000 } }, ['issue_description']) },
  { name: 'capabilities_list', description: '列出当前真实可用的数据能力；未配置连接器会明确显示 unavailable。', inputSchema: strictObject({}) },
  { name: 'email_syntax_check', description: '仅做邮箱语法检查；不会伪称 MX、SMTP 或决策人身份已验证。', inputSchema: strictObject({ email: { type: 'string', maxLength: 320 } }, ['email']) },
  { name: 'provider_customs_search_status', description: '查看海关数据连接器状态；未配置时拒绝生成模拟买家数据。', inputSchema: strictObject({}) },
  { name: 'provider_crm_sync_status', description: '查看 CRM 连接器状态；未配置时不伪称同步成功。', inputSchema: strictObject({}) },
  { name: 'provider_website_extraction_status', description: '查看官网采集连接器状态；未配置时不虚构企业事实。', inputSchema: strictObject({}) },
  { name: 'provider_freight_tariff_status', description: '查看运费关税连接器状态；未配置时不生成固定伪报价。', inputSchema: strictObject({}) },
  { name: 'provider_fx_rates_status', description: '查看汇率连接器状态；未配置时不返回伪实时汇率。', inputSchema: strictObject({}) },
  { name: 'kb_benchmark_status', description: '返回真实基准数据集状态；没有执行评估时明确为 NOT_RUN。', inputSchema: strictObject({}) }
];

const text = (value: unknown, isError = false) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }], isError });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments ?? {};
  try {
    switch (request.params.name) {
      case 'kb_cold_start': {
        const input = parseOrThrow(coldStartSchema, args);
        return text(kb.coldStart(tenantId, input.company_name, input.website_url, input.profile_summary, input.industry));
      }
      case 'kb_search_cards': {
        const input = parseOrThrow(knowledgeSearchSchema, args);
        return text(kb.searchCards(tenantId, input.query, { module: input.module, roleView: input.role_view, sensitivity: input.sensitivity, status: input.status, limit: input.limit }));
      }
      case 'kb_get_card': return text(kb.getCard(tenantId, String(args.kb_id)) ?? { error: 'not_found' });
      case 'kb_audit_governance': return text(kb.auditGovernance(tenantId));
      case 'customer_score_and_segment': {
        const input = parseOrThrow(scoreSchema, args);
        const scoped = <T extends Record<string, unknown>>(items: T[]) => items.map((item) => ({ ...item, tenant_id: tenantId }));
        return text(customers.scoreAccount({ ...input.account, tenant_id: tenantId } as CustomerAccount, scoped(input.interactions ?? []) as unknown as Interaction[], scoped(input.opportunities ?? []) as unknown as Opportunity[], scoped(input.contacts ?? []) as unknown as CustomerContact[]));
      }
      case 'sales_qualify_inquiry': {
        const input = parseOrThrow(inquirySchema, args);
        return text(sales.qualifyInquiry(input.raw_inquiry, input.sender_email, input.sender_country));
      }
      case 'sales_generate_conditional_quote': {
        const input = parseOrThrow(quoteSchema, args);
        return text(sales.generateConditionalQuote(input.product_name, input.base_price, input.currency ?? 'USD', input.moq, input.assumptions ?? []));
      }
      case 'sales_triage_aftersales': return text(sales.triageAftersales(String(args.issue_description ?? '')));
      case 'capabilities_list': return text(capabilities.list());
      case 'email_syntax_check': return text(capabilities.checkEmailSyntax(parseOrThrow(emailSyntaxSchema, args).email));
      case 'provider_customs_search_status': return text(capabilities.unavailable('customs_search'));
      case 'provider_crm_sync_status': return text(capabilities.unavailable('crm_sync'));
      case 'provider_website_extraction_status': return text(capabilities.unavailable('website_extraction'));
      case 'provider_freight_tariff_status': return text(capabilities.unavailable('freight_tariff'));
      case 'provider_fx_rates_status': return text(capabilities.unavailable('fx_rates'));
      case 'kb_benchmark_status': return text({ status: 'NOT_RUN', total_cases: 35, ordinary_cases: 30, refusal_cases: 5, passed: 0, note: 'No evaluator has run this benchmark suite.' });
      default: return text({ error: 'unknown_tool' }, true);
    }
  } catch (error) {
    return text({ error: error instanceof Error ? error.message : 'Tool execution failed' }, true);
  }
});

await server.connect(new StdioServerTransport());
console.error(`RenWork AI Export Growth MCP v4.0.0 running for tenant ${tenantId}`);
