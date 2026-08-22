import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import { KnowledgeBaseEngine } from './kbEngine.js';
import { CustomerAssetEngine } from './customerEngine.js';
import { SalesExecutionEngine } from './salesEngine.js';

const kbEngine = new KnowledgeBaseEngine();
const customerEngine = new CustomerAssetEngine();
const salesEngine = new SalesExecutionEngine();

const server = new Server(
  {
    name: 'renwork-export-kb-mcp',
    version: '3.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

const TOOLS: Tool[] = [
  {
    name: 'kb_cold_start',
    description: '冷启动构建 00–20 模块外贸知识库，输出知识地图、业务速查卡与分批确认队列',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', description: '企业租户ID' },
        company_name: { type: 'string', description: '公司名称' },
        website_url: { type: 'string', description: '公司官网URL' },
        profile_summary: { type: 'string', description: '企业中文或英文简介' },
        industry: { type: 'string', description: '主营行业（可选）' }
      },
      required: ['tenant_id', 'company_name', 'website_url', 'profile_summary']
    }
  },
  {
    name: 'kb_search_cards',
    description: '按模块、岗位视图、权限与关键词检索企业知识卡',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
        tenant_id: { type: 'string', description: '租户ID' },
        module: { type: 'string', description: '指定模块 (00-20)' },
        role_view: { type: 'string', description: '岗位视图 (management, junior_sales, senior_sales, marketing, operations_quality)' },
        sensitivity: { type: 'string', description: '敏感级别 (public, internal, restricted)' }
      }
    }
  },
  {
    name: 'kb_get_card',
    description: '通过 kb_id 获取单张知识卡的完整详情与证据',
    inputSchema: {
      type: 'object',
      properties: {
        kb_id: { type: 'string', description: '知识卡ID (如 NK-PROD-0001)' }
      },
      required: ['kb_id']
    }
  },
  {
    name: 'customer_score_and_segment',
    description: '运行 100 分动态客户优先级评分模型，计算 S/A/B/C/D 分层与 8 类名单归属',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'object', description: '客户账户数据对象' },
        interactions: { type: 'array', items: { type: 'object' }, description: '互动记录列表' },
        opportunities: { type: 'array', items: { type: 'object' }, description: '商机列表' },
        contacts: { type: 'array', items: { type: 'object' }, description: '联系人列表' }
      },
      required: ['account']
    }
  },
  {
    name: 'customer_get_360',
    description: '查询客户 360 度全景档案（主记录、决策人、商机、历史订单与下一步动作）',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: '客户公司ID (如 ACC-001)' }
      },
      required: ['account_id']
    }
  },
  {
    name: 'customer_get_dynamic_lists',
    description: '实时获取企业当前的 8 类动态跟进名单（今日必跟、复购预警、异动等）',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', description: '企业租户ID' }
      },
      required: ['tenant_id']
    }
  },
  {
    name: 'customer_batch_clean',
    description: '批量清洗与去重客户原始数据，构建黄金主记录',
    inputSchema: {
      type: 'object',
      properties: {
        raw_records: { type: 'array', items: { type: 'object' }, description: '原始客户数据列表' }
      },
      required: ['raw_records']
    }
  },
  {
    name: 'sales_qualify_inquiry',
    description: '执行询盘 10 步速检与 L1/L2/L3 提问下钻，给出 Go/Hold/Nurture/No-go 判断',
    inputSchema: {
      type: 'object',
      properties: {
        raw_inquiry: { type: 'string', description: '询盘原始内容' },
        sender_email: { type: 'string', description: '发件人邮箱' },
        sender_country: { type: 'string', description: '发件人国家' }
      },
      required: ['raw_inquiry']
    }
  },
  {
    name: 'sales_generate_quote_matrix',
    description: '生成 Good / Better / Best 三档阶梯报价单与样品管理档案',
    inputSchema: {
      type: 'object',
      properties: {
        product_name: { type: 'string', description: '产品名称' },
        base_price_usd: { type: 'number', description: '基准单价(USD)' },
        moq: { type: 'number', description: '起订量' }
      },
      required: ['product_name', 'base_price_usd', 'moq']
    }
  },
  {
    name: 'sales_handle_objection',
    description: '匹配 10 类高频异议应对方案与 8 大强制升级红线判断',
    inputSchema: {
      type: 'object',
      properties: {
        objection_category: { type: 'string', description: '异议分类 (如 price_high, moq_high, credit_payment_oa)' },
        customer_statement: { type: 'string', description: '客户原话' }
      },
      required: ['objection_category', 'customer_statement']
    }
  },
  {
    name: 'sales_triage_aftersales',
    description: 'P1/P2/P3 售后质量事故分级与证据清单核对',
    inputSchema: {
      type: 'object',
      properties: {
        issue_description: { type: 'string', description: '售后异常描述' }
      },
      required: ['issue_description']
    }
  },
  {
    name: 'kb_audit_governance',
    description: '审计企业知识库六态置信度、公开发布闸门合规率与待补充缺口',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', description: '企业租户ID' }
      },
      required: ['tenant_id']
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = args as any;

  try {
    switch (name) {
      case 'kb_cold_start': {
        const res = kbEngine.coldStart(a.tenant_id, a.company_name, a.website_url, a.profile_summary, a.industry);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'kb_search_cards': {
        const res = kbEngine.searchCards(a.query || '', {
          tenantId: a.tenant_id,
          module: a.module,
          roleView: a.role_view,
          sensitivity: a.sensitivity
        });
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'kb_get_card': {
        const res = kbEngine.getCard(a.kb_id);
        return { content: [{ type: 'text', text: JSON.stringify(res || { error: 'Card not found' }, null, 2) }] };
      }
      case 'customer_score_and_segment': {
        const res = customerEngine.scoreAccount(a.account, a.interactions, a.opportunities, a.contacts);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'customer_get_360': {
        const res = customerEngine.getCustomer360(a.account_id);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'customer_get_dynamic_lists': {
        const res = customerEngine.getDynamicLists(a.tenant_id);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'customer_batch_clean': {
        const res = customerEngine.batchCleanAndDeduplicate(a.raw_records || []);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'sales_qualify_inquiry': {
        const res = salesEngine.qualifyInquiry(a.raw_inquiry, a.sender_email, a.sender_country);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'sales_generate_quote_matrix': {
        const res = salesEngine.generateTieredQuote(a.product_name, a.base_price_usd, a.moq);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'sales_handle_objection': {
        const res = salesEngine.handleObjection(a.objection_category, a.customer_statement);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'sales_triage_aftersales': {
        const res = salesEngine.triageAftersales(a.issue_description);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      case 'kb_audit_governance': {
        const res = kbEngine.auditGovernance(a.tenant_id);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Error executing tool ${name}: ${err.message}` }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RenWork Export KB MCP Server v3.0 running on stdio');
}

main().catch((err) => {
  console.error('Fatal MCP Server Error:', err);
  process.exit(1);
});
