import { tool, type Plugin } from '@opencode-ai/plugin';

const apiBase = () => (process.env.RENWORK_EXPORT_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const apiKey = () => process.env.RENWORK_EXPORT_API_KEY ?? '';

async function callApi(path: string, method: 'GET' | 'POST', body?: unknown) {
  if (!apiKey()) throw new Error('RENWORK_EXPORT_API_KEY is required; secrets must stay in environment variables.');
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers: { authorization: `Bearer ${apiKey()}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`RenWork Export API ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

export const RenWorkExportGrowthPlugin: Plugin = async () => ({
  tool: {
    export_growth_kb_search: tool({
      description: '检索当前 API Key 所属企业的外贸知识卡；租户不可由模型切换。',
      args: { query: tool.schema.string(), limit: tool.schema.number().min(1).max(100).optional() },
      async execute(args) { return JSON.stringify(await callApi('/api/v1/kb/search', 'POST', { query: args.query, limit: args.limit ?? 20 }), null, 2); }
    }),
    export_growth_qualify_inquiry: tool({
      description: '执行证据优先的询盘 10 维速检并输出下一步。',
      args: { raw_inquiry: tool.schema.string().min(1), sender_email: tool.schema.string().optional(), sender_country: tool.schema.string().optional() },
      async execute(args) { return JSON.stringify(await callApi('/api/v1/sales/qualify', 'POST', args), null, 2); }
    }),
    export_growth_score_customer: tool({
      description: '运行 V4 客户评分、硬停止条件与八类动态名单。',
      args: { account: tool.schema.record(tool.schema.string(), tool.schema.any()), interactions: tool.schema.array(tool.schema.any()).optional(), opportunities: tool.schema.array(tool.schema.any()).optional(), contacts: tool.schema.array(tool.schema.any()).optional() },
      async execute(args) { return JSON.stringify(await callApi('/api/v1/customers/score', 'POST', { ...args, interactions: args.interactions ?? [], opportunities: args.opportunities ?? [], contacts: args.contacts ?? [] }), null, 2); }
    }),
    export_growth_capabilities: tool({
      description: '查看哪些实时连接器已经配置；不允许用模拟数据冒充实时数据。',
      args: {},
      async execute() { return JSON.stringify(await callApi('/api/v1/capabilities', 'GET'), null, 2); }
    })
  }
});
