import {
  KNOWLEDGE_MODULES,
  type KnowledgeCard,
  type KnowledgeModule,
  type KnowledgeStatus,
  type RoleView,
  type SensitivityLevel
} from './contracts.js';

const ALL_ROLES: RoleView[] = ['management', 'sales_director', 'junior_sales', 'senior_sales', 'marketing', 'operations_quality'];

const MODULE_TITLES: Record<KnowledgeModule, string> = {
  '00_kb_governance': '知识库总索引与治理',
  '01_sources_permissions': '来源、证据、权限与口径',
  '02_company_identity': '企业身份与可信实力',
  '03_brand_messaging': '品牌与对外信息口径',
  '04_product_catalog': '产品知识与产品图谱',
  '05_manufacturing_quality': '制造、研发、质量与供应能力',
  '06_certification_compliance': '认证、法规与市场准入',
  '07_commercial_delivery': '商务政策、报价与交付规则',
  '08_market_intelligence': '目标市场与行业情报',
  '09_icp_buyer_personas': 'ICP 与买家决策委员会',
  '10_buyer_intent_signals': '买家意图信号与机会评分',
  '11_competitors_differentiation': '竞争对手与差异化',
  '12_product_market_fit': '产品—市场—买家匹配',
  '13_lead_discovery': '线索发现与客户背调',
  '14_customer_asset_lifecycle': '客户资产、老客户与关系生命周期',
  '15_inquiry_qualification': '询盘识别、资格判断与推进',
  '16_solution_quotation': '方案、选型、报价与样品',
  '17_objection_negotiation': '异议、谈判、风险与审批',
  '18_sales_content_templates': '销售内容与多触点话术',
  '19_order_delivery_aftersales': '订单、交付与售后',
  '20_learning_metrics': '复盘、指标与持续学习'
};

function tenantCode(tenantId: string): string {
  let hash = 2166136261;
  for (const char of tenantId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

export class KnowledgeBaseEngine {
  private readonly cards = new Map<string, KnowledgeCard>();

  private key(tenantId: string, cardId: string): string {
    return `${tenantId}:${cardId}`;
  }

  coldStart(tenantId: string, companyName: string, websiteUrl: string, profileSummary: string, industry = 'general') {
    const now = new Date().toISOString();
    const code = tenantCode(tenantId);

    for (const [index, module] of KNOWLEDGE_MODULES.entries()) {
      const cardId = `RW-${code}-${String(index + 1).padStart(4, '0')}`;
      const containsUserFact = module === '02_company_identity';
      const card: KnowledgeCard = {
        kb_id: cardId,
        tenant_id: tenantId,
        revision: 1,
        module,
        knowledge_kind: module === '00_kb_governance' || module === '01_sources_permissions' ? 'rule' : containsUserFact ? 'fact' : 'template',
        entity_type: containsUserFact ? 'company' : 'module',
        entity_id: `${tenantId}:${module}`,
        title: `${companyName}｜${MODULE_TITLES[module]}`,
        language: 'zh-CN',
        status: containsUserFact ? 'public_fact' : 'pending_supplement',
        confidence: containsUserFact ? 0.55 : 0,
        confidence_basis: containsUserFact ? '仅来自用户提交的企业简介，尚未核对官网或正式文件' : '模块已建立，但没有足够证据形成企业事实',
        sensitivity: module === '07_commercial_delivery' || module === '14_customer_asset_lifecycle' ? 'internal' : 'public',
        public_claim_approved: false,
        role_views: ALL_ROLES,
        applicable_markets: [],
        applicable_buyer_types: [],
        workflow_stages: [],
        conclusion: containsUserFact
          ? `待核验企业简介：${profileSummary}`
          : `${MODULE_TITLES[module]}结构已建立；当前没有已核验的企业专属内容。`,
        conditions: `适用于 ${companyName}（行业暂记为 ${industry}）；正式使用前需完成来源核验与企业审批。`,
        source_refs: [{
          type: 'user_supplied',
          uri: websiteUrl,
          captured_at: now,
          excerpt: containsUserFact ? profileSummary.slice(0, 500) : undefined,
          authority: 'D'
        }],
        recommended_actions: containsUserFact
          ? '核对官网 About、Products、Certificates 与 Contact 页面，并提交企业负责人确认。'
          : '补充模块所需资料，登记来源，完成事实/推断分离和审批。',
        red_lines: '不得将未核验内容作为价格、产能、交期、认证、客户案例或法律合规承诺对外发布。',
        pending_confirmations: '来源、有效期、负责人、审批人及可公开范围均待确认。',
        verified_by: null,
        verified_at: null,
        valid_until: null,
        created_at: now,
        updated_at: now
      };
      this.cards.set(this.key(tenantId, cardId), card);
    }

    return {
      tenant_id: tenantId,
      storage_mode: 'ephemeral_memory',
      modules_created: KNOWLEDGE_MODULES.length,
      cards_count: KNOWLEDGE_MODULES.length,
      public_claims_approved: 0,
      collection_performed: false,
      warnings: [
        '本次冷启动只使用了用户提交内容；系统没有声称已经抓取官网。',
        '内存存储适合本地验证，不适合生产持久化；生产部署应接入 PostgreSQL/对象存储。'
      ],
      confirmation_queue: [
        { batch: 1, topic: '主推产品、目标市场、ICP 与可证明差异', impact: '获客' },
        { batch: 2, topic: 'MOQ、报价变量、样品、交期、定制与认证覆盖', impact: '报价' },
        { batch: 3, topic: '付款、产能、售后、赔付与案例公开权限', impact: '风险与规模化' }
      ]
    };
  }

  searchCards(tenantId: string, query = '', options: {
    module?: KnowledgeModule;
    roleView?: RoleView;
    sensitivity?: SensitivityLevel;
    status?: KnowledgeStatus;
    limit?: number;
  } = {}): KnowledgeCard[] {
    let results = [...this.cards.values()].filter((card) => card.tenant_id === tenantId);
    if (options.module) results = results.filter((card) => card.module === options.module);
    if (options.roleView) results = results.filter((card) => card.role_views.includes(options.roleView!));
    if (options.sensitivity) results = results.filter((card) => card.sensitivity === options.sensitivity);
    if (options.status) results = results.filter((card) => card.status === options.status);
    const normalized = query.trim().toLocaleLowerCase();
    if (normalized) {
      results = results.filter((card) => [card.title, card.conclusion, card.recommended_actions, card.pending_confirmations]
        .some((value) => value.toLocaleLowerCase().includes(normalized)));
    }
    return results.slice(0, options.limit ?? 20);
  }

  getCard(tenantId: string, cardId: string): KnowledgeCard | undefined {
    return this.cards.get(this.key(tenantId, cardId));
  }

  saveCard(tenantId: string, card: KnowledgeCard): KnowledgeCard {
    if (card.tenant_id !== tenantId) throw new Error('Tenant boundary violation');
    if (card.public_claim_approved && !['verified_fact', 'public_fact'].includes(card.status)) {
      throw new Error('Only verified/public facts may pass the public claim gate');
    }
    const existing = this.getCard(tenantId, card.kb_id);
    const next = { ...card, revision: (existing?.revision ?? 0) + 1, updated_at: new Date().toISOString() };
    this.cards.set(this.key(tenantId, card.kb_id), next);
    return next;
  }

  auditGovernance(tenantId: string) {
    const cards = [...this.cards.values()].filter((card) => card.tenant_id === tenantId);
    const byStatus: Record<string, number> = {};
    const bySensitivity: Record<string, number> = {};
    for (const card of cards) {
      byStatus[card.status] = (byStatus[card.status] ?? 0) + 1;
      bySensitivity[card.sensitivity] = (bySensitivity[card.sensitivity] ?? 0) + 1;
    }
    const approved = cards.filter((card) => card.public_claim_approved).length;
    return {
      tenant_id: tenantId,
      total_cards: cards.length,
      status_distribution: byStatus,
      sensitivity_distribution: bySensitivity,
      public_claim_approved_rate: cards.length ? approved / cards.length : 0,
      unresolved_gaps: cards.filter((card) => ['pending_supplement', 'conflicted'].includes(card.status)).length,
      expired_cards: cards.filter((card) => card.valid_until && Date.parse(card.valid_until) < Date.now()).length
    };
  }
}
