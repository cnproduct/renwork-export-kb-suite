"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesExecutionEngine = void 0;
class SalesExecutionEngine {
    qualifyInquiry(rawInquiry, senderEmail = '', senderCountry = '') {
        const text = rawInquiry.toLowerCase();
        const missing = [];
        let score = 50;
        const hasQty = /\b\d{2,7}\s*(pcs|pieces|sets|units|containers|ctns|kg|tons)?\b/.test(text) || /\b(moq|quantity|qty)\b/.test(text);
        const hasSpec = /(custom|logo|package|box|size|color|specification|spec|material|grade)/.test(text);
        const hasDelivery = /(delivery|lead time|shipping|shipment|eta|port|fob|cif|ddp)/.test(text);
        const hasCert = /(cert|certificate|fda|ce|rohs|reach|iso|test report)/.test(text);
        if (hasQty)
            score += 15;
        else
            missing.push('采购数量 / 试单计划');
        if (hasSpec)
            score += 15;
        else
            missing.push('规格 / 材质 / 定制要求');
        if (hasDelivery)
            score += 10;
        else
            missing.push('目标交期 / 目的港口');
        if (hasCert)
            score += 10;
        let status = 'Hold';
        if (score >= 75)
            status = 'Go';
        else if (score >= 50)
            status = 'Nurture';
        else
            status = 'Hold';
        let escalation_warning;
        if (text.includes('oa 90') || text.includes('oa 60') || text.includes('no deposit') || text.includes('0% deposit')) {
            escalation_warning = '【8大升级信号】客户提出远期赊销 / 0定金要求，必须提交财务与销售总监审批！';
        }
        else if (text.includes('exclusive') || text.includes('sole agent')) {
            escalation_warning = '【8大升级信号】客户要求独家代理权，需由管理层根据年度提货量评估！';
        }
        const recommendedQuestions = [
            '1. 请问贵司期望的目标交期与交付目的港口是哪里？',
            '2. 本次预计的首单试销数量以及后续的年采购计划大概是多少？',
            '3. 是否有特定的包装、定制印标或目标市场的强制认证要求？'
        ];
        const immediateActions = [
            '24小时内发送专业致谢与澄清问题邮件',
            '在知识库中匹配 2-3 款针对该目标市场的畅销款图册',
            '核验客户官网与 LinkedIn 采购人真实身份 (L1 快速验真)'
        ];
        return {
            qualification_status: status,
            score,
            detected_intent: '潜在买家询盘采购意向',
            missing_key_parameters: missing,
            recommended_questions: recommendedQuestions.slice(0, 2),
            immediate_actions: immediateActions,
            escalation_warning
        };
    }
    generateTieredQuote(productName, basePriceUsd, moq) {
        return {
            product_name: productName,
            currency: 'USD',
            tiers: [
                {
                    tier_name: 'Good (经济实用/引流款)',
                    moq: moq,
                    unit_price_usd: Math.round(basePriceUsd * 1.05 * 100) / 100,
                    features: ['标准材质与工艺配置', '中性工业出口包装', '标准质检与出厂报告'],
                    lead_time_days: 30
                },
                {
                    tier_name: 'Better (高转化推荐/主推款)',
                    moq: moq * 2,
                    unit_price_usd: Math.round(basePriceUsd * 0.95 * 100) / 100,
                    features: ['升级耐用材质与精工表面', '免费定制单色单位置 Logo', '精美零售彩盒包装', '优先排产通道'],
                    lead_time_days: 25
                },
                {
                    tier_name: 'Best (旗舰全定制/高端款)',
                    moq: moq * 5,
                    unit_price_usd: Math.round(basePriceUsd * 0.88 * 100) / 100,
                    features: ['全套私模结构与专属配色', '定制多语言零售高档礼盒', '专属出运抽检与第三方报告支持', 'VIP 售后延保政策'],
                    lead_time_days: 35
                }
            ],
            sample_policy: {
                sample_cost_usd: Math.round(basePriceUsd * 2),
                refund_terms: '样品费将在首笔正式大货订单中 100% 全额抵扣',
                lead_time_days: 5
            },
            validity_days: 30,
            red_lines: [
                '严禁低于底线毛利报价',
                '严禁未经书面签样直接安排大货生产',
                '任何账期或付款方式例外必须向管理层发起报批'
            ]
        };
    }
    handleObjection(objectionCategory, customerStatement) {
        const playbooks = {
            price_high: {
                root_cause: '客户拿低端竞品或裸机配置比价，尚未感知核心价值与寿命差异',
                strategy: '拆解全生命周期成本与不良率损失，提供 Good/Better 阶梯或配置优化选项',
                scripts: {
                    zh: '完全理解您对成本的关注。我们的价格包含了优质原材料、严格的全检工艺及针对目标市场的合规认证支持。为了更好地配合您的预算，我们可以为您提供阶梯配置方案，或在包装和首单批量上做相应优化。',
                    en: 'We completely understand your budget priority. Our pricing includes premium certified raw materials, strict full-batch QC, and full compliance documentation. To best match your target margin, we can offer our tiered configuration or optimize packaging to lower the landed cost.'
                },
                trade_offs: ['调整包装规格', '增加订单批量以享受阶梯折扣', '安排适度交期以合并生产批次'],
                escalation: false
            },
            moq_high: {
                root_cause: '首单试销测试市场，客户担心库存积压与资金占用',
                strategy: '提供试单支持通道、共享原材料拼批次，或建议按多SKU拼柜',
                scripts: {
                    zh: '我们非常理解您首单测试市场的谨慎考量。为了支持双方首次合作，我们可以为您申请首单特殊试产批量，或将多个热销 SKU 合并在同一个批次中安排生产。',
                    en: 'We fully appreciate your strategy for initial market testing. To support our new partnership, we can apply for a special trial batch for your first order, or combine multiple best-selling SKUs into one consolidated shipment.'
                },
                trade_offs: ['分批出货', '试单适度支付小额批次调整费并在翻单抵扣', '多SKU拼柜'],
                escalation: false
            },
            credit_payment_oa: {
                root_cause: '客户希望转移资金与回款风险',
                strategy: '严守 30% 定金红线，推荐中国信保投保支持或即期信用证 L/C',
                scripts: {
                    zh: '我司标准合作条款为 30% 定金 + 70% 见提单副本。针对大批量长期合作客户，我们支持通过中国信保 (Sinosure) 信用额度或即期不可撤销信用证 (L/C at sight) 推进。',
                    en: 'Our standard export term is 30% T/T deposit and 70% against B/L copy. For strategic high-volume partners, we can work under Sinosure credit financing or Irrevocable L/C at sight.'
                },
                trade_offs: ['即期信用证 L/C', '中国信保投保审批'],
                escalation: true,
                escalation_reason: '【8大升级信号】任何赊销或 OA 账期要求必须由财务总监与管理层特批。'
            }
        };
        const matched = playbooks[objectionCategory] || playbooks['price_high'];
        return {
            category: objectionCategory,
            root_cause_hypothesis: matched.root_cause,
            recommended_strategy: matched.strategy,
            scripts: matched.scripts,
            trade_off_options: matched.trade_offs,
            is_escalation_required: matched.escalation,
            escalation_reason: matched.escalation_reason
        };
    }
    triageAftersales(issueDescription) {
        const text = issueDescription.toLowerCase();
        if (text.includes('safety') || text.includes('recall') || text.includes('lawsuit') || text.includes('huge batch') || text.includes('50%') || text.includes('all broken')) {
            return {
                severity_level: 'P1',
                sla_response_hours: 24,
                lead_team: '管理层 + 品质总监 + 销售总监 + 法务',
                evidence_checklist: ['订单号与批次留样', '大货出厂质检报告', '第三方检验机构公证报告', '客户现场受损完整视频与开箱记录'],
                action_protocol: '立即冻结相关批次，24小时内召开紧急联合会议，严禁业务员私自做出任何赔偿承诺。'
            };
        }
        else if (text.includes('color') || text.includes('logo') || text.includes('package') || text.includes('damage') || text.includes('scratch') || text.includes('defect')) {
            return {
                severity_level: 'P2',
                sla_response_hours: 48,
                lead_team: '跟单主管 + 品质工程师 + 资深业务员',
                evidence_checklist: ['签样封样照片对比', '受损产品清晰近照与不良品统计比例', '外箱破损与装柜照片'],
                action_protocol: '核对公差范围与签样档案，48小时内出具工艺复核结论，并在下批翻单中补发或协商适度折让。'
            };
        }
        else {
            return {
                severity_level: 'P3',
                sla_response_hours: 72,
                lead_team: '销售业务员 + 技术客服',
                evidence_checklist: ['客户反馈描述', '产品使用场景说明'],
                action_protocol: '提供标准使用与保养指导说明，记录入 FAQ 与持续优化改进清单。'
            };
        }
    }
}
exports.SalesExecutionEngine = SalesExecutionEngine;
