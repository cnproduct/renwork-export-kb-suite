"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseEngine = void 0;
class KnowledgeBaseEngine {
    cards = new Map();
    constructor() {
        this.seedDefaultCards();
    }
    coldStart(tenantId, companyName, websiteUrl, profileSummary, industry = 'general') {
        const modules = [
            '00_kb_governance', '01_sources_permissions', '02_company_identity', '03_brand_messaging',
            '04_product_catalog', '05_manufacturing_quality', '06_certification_compliance', '07_commercial_delivery',
            '08_market_intelligence', '09_icp_buyer_personas', '10_buyer_intent_signals', '11_competitors_differentiation',
            '12_product_market_fit', '13_lead_discovery', '14_customer_asset_lifecycle', '15_inquiry_qualification',
            '16_solution_quotation', '17_objection_negotiation', '18_sales_content_templates', '19_order_delivery_aftersales',
            '20_learning_metrics'
        ];
        let cardIdx = 1;
        for (const mod of modules) {
            const cardId = `NK-${mod.substring(3, 7).toUpperCase()}-${String(cardIdx).padStart(4, '0')}`;
            const newCard = {
                kb_id: cardId,
                tenant_id: tenantId,
                module: mod,
                knowledge_kind: mod.includes('governance') || mod.includes('sources') ? 'rule' : 'fact',
                entity_type: mod.includes('company') ? 'company' : mod.includes('product') ? 'product' : 'policy',
                entity_id: `${tenantId}_${mod}_001`,
                title: `${companyName} - ${mod.replace(/^[0-9]+_/, '')} 基础知识卡`,
                language: 'zh-CN',
                status: mod === '02_company_identity' || mod === '04_product_catalog' ? 'public_fact' : 'strategy_recommendation',
                confidence: 0.85,
                sensitivity: mod === '07_commercial_delivery' ? 'internal' : 'public',
                public_claim_approved: mod !== '07_commercial_delivery',
                role_views: ['management', 'sales_director', 'junior_sales', 'senior_sales', 'marketing', 'operations_quality'],
                conclusion: `基于 ${companyName} 官网及资料生成的 ${mod} 标准事实与规则基线。`,
                conditions: `适用企业所有外贸出口业务，数据来源 ${websiteUrl}`,
                evidence: `采集自企业官网 ${websiteUrl} 及提交的企业简介`,
                recommended_actions: `销售与运营团队按照本模块 SOP 推进日常业务，并定期复核。`,
                red_lines: `未经审批不得随意承诺超出公开范围的价格与认证。`,
                pending_confirmations: `待核实最新 MOQ、交期与工厂真实产能。`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.cards.set(cardId, newCard);
            cardIdx++;
        }
        const cheatSheet = {
            company_name: companyName,
            website: websiteUrl,
            one_sentence_positioning: `${companyName} 是专业的高品质出口制造与跨境 B2B 解决方案供应商。`,
            key_strengths: ["源头工厂制造与全套质检", "支持定制 OEM/ODM 研发", "符合主要出口国质量安全标准"],
            must_ask_5_questions: [
                "1. 您的目标销售国家与渠道是什么？",
                "2. 本次预计采购量与首单试单需求是多少？",
                "3. 是否有特定的包装、Logo 或认证定制要求？",
                "4. 期望的交期与目标到港时间？",
                "5. 期望的贸易条款与目标价格区间？"
            ],
            red_line_boundaries: [
                "严禁未经授权承诺低于授权底价",
                "严禁未经书面审批提供 OA 赊销",
                "严禁未经签样直接大货投产",
                "严禁凭邮件变更收款银行账号"
            ]
        };
        const gapQueue = [
            { batch: 1, topic: "主推产品与核心市场优先级", urgency: "High", impact: "获客转化" },
            { batch: 2, topic: "标准 MOQ 与阶梯报价底线", urgency: "High", impact: "报价推进" },
            { batch: 3, topic: "付款方式红线与真实产能上限", urgency: "Medium", impact: "交付合规" }
        ];
        return {
            tenantId,
            modulesCreated: modules.length,
            cardsCount: cardIdx - 1,
            cheatSheet,
            gapConfirmationQueue: gapQueue
        };
    }
    searchCards(query, options = {}) {
        let results = Array.from(this.cards.values());
        if (options.tenantId) {
            results = results.filter(c => c.tenant_id === options.tenantId);
        }
        if (options.module) {
            results = results.filter(c => c.module === options.module);
        }
        if (options.roleView) {
            results = results.filter(c => c.role_views.includes(options.roleView));
        }
        if (options.sensitivity) {
            results = results.filter(c => c.sensitivity === options.sensitivity);
        }
        if (options.status) {
            results = results.filter(c => c.status === options.status);
        }
        if (query && query.trim() !== '') {
            const q = query.toLowerCase();
            results = results.filter(c => c.title.toLowerCase().includes(q) ||
                c.conclusion.toLowerCase().includes(q) ||
                c.evidence.toLowerCase().includes(q) ||
                c.recommended_actions.toLowerCase().includes(q));
        }
        return results.slice(0, options.limit || 20);
    }
    getCard(kbId) {
        return this.cards.get(kbId);
    }
    saveCard(card) {
        card.updated_at = new Date().toISOString();
        this.cards.set(card.kb_id, card);
    }
    auditGovernance(tenantId) {
        const tenantCards = Array.from(this.cards.values()).filter(c => c.tenant_id === tenantId);
        const statusDist = {};
        const sensDist = {};
        let approvedCount = 0;
        let gapCount = 0;
        for (const c of tenantCards) {
            statusDist[c.status] = (statusDist[c.status] || 0) + 1;
            sensDist[c.sensitivity] = (sensDist[c.sensitivity] || 0) + 1;
            if (c.public_claim_approved)
                approvedCount++;
            if (c.status === 'pending_supplement' || c.confidence < 0.7)
                gapCount++;
        }
        return {
            totalCards: tenantCards.length,
            statusDistribution: statusDist,
            sensitivityDistribution: sensDist,
            publicClaimApprovedRate: tenantCards.length > 0 ? `${Math.round((approvedCount / tenantCards.length) * 100)}%` : '0%',
            unverifiedPendingGaps: gapCount
        };
    }
    seedDefaultCards() {
        // Seed initial default cards
        this.coldStart('demo_export_corp', '人人易智造 (Renrenyi Manufacturing)', 'https://rrenn.com', '中国领先的外贸AI解决方案与出海制造服务商', 'general');
    }
}
exports.KnowledgeBaseEngine = KnowledgeBaseEngine;
