export class SalesExecutionEngine {
  qualifyInquiry(rawInquiry: string, senderEmail = '', senderCountry = '') {
    const text = rawInquiry.toLocaleLowerCase();
    const checks = [
      ['company_identity', Boolean(senderEmail || /company|website|brand|factory|distributor|importer|retailer/i.test(text))],
      ['country_channel', Boolean(senderCountry || /market|country|amazon|retail|wholesale|distributor/i.test(text))],
      ['product', /product|item|model|sku|产品|型号/i.test(text)],
      ['customization', /custom|logo|package|color|material|定制|包装|颜色|材质/i.test(text)],
      ['specification', /size|capacity|grade|spec|dimension|尺寸|规格|容量/i.test(text)],
      ['quantity_moq', /\b\d+\s*(pcs|sets|units|ctns|containers|kg|tons)?\b|moq|quantity|数量|起订/i.test(text)],
      ['compliance', /cert|fda|ce|rohs|reach|test report|认证|检测/i.test(text)],
      ['timeline', /delivery|lead time|eta|shipment|交期|出货/i.test(text)],
      ['destination_incoterm', /port|fob|cif|ddp|exw|目的港|贸易条款/i.test(text)],
      ['next_step', /quote|sample|meeting|call|catalog|报价|样品|会议/i.test(text)]
    ] as const;
    const matched = checks.filter(([, ok]) => ok).map(([name]) => name);
    const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);
    const score = matched.length * 10;
    const hardRisk = /free mold|no deposit|oa\s*(60|90|120)|exclusive|sole agent|免费开模|零定金|独家/i.test(text);
    return {
      qualification_status: score >= 70 ? 'Go' : score >= 40 ? 'Nurture' : score >= 20 ? 'Hold' : 'No-go',
      score,
      matched_dimensions: matched,
      missing_key_parameters: missing,
      recommended_questions: missing.slice(0, 3).map((field) => `请补充 ${field} 相关信息，以便给出准确方案。`),
      immediate_actions: ['完成 L1 企业验真并记录来源', '匹配已核验产品卡，不使用未批准公开主张', '约定一个明确的下一步与完成时间'],
      escalation_warning: hardRisk ? '检测到付款、独家或免费资源等强制升级信号；只能回复“需内部审批”，不得自动承诺。' : undefined
    };
  }

  generateConditionalQuote(productName: string, basePrice: number, currency: string, moq: number, assumptions: string[] = []) {
    if (!Number.isFinite(basePrice) || basePrice <= 0 || !Number.isInteger(moq) || moq <= 0) throw new Error('Price and MOQ must be positive');
    return {
      status: 'draft_requires_human_approval',
      product_name: productName,
      currency,
      source: 'user_supplied_base_price',
      tiers: [
        { name: 'Good', quantity: moq, unit_price: Number((basePrice * 1.05).toFixed(4)), configuration: '待产品负责人填写已核验标准配置' },
        { name: 'Better', quantity: moq * 2, unit_price: Number((basePrice * 0.97).toFixed(4)), configuration: '待确认可实现的升级配置与包装' },
        { name: 'Best', quantity: moq * 5, unit_price: Number((basePrice * 0.92).toFixed(4)), configuration: '待确认定制范围、模具、签样和合规成本' }
      ],
      assumptions,
      required_confirmations: ['基准价来源与有效期', 'MOQ及阶梯折扣授权', '配置、包装与定制可行性', '样品费、模具费与交期', '付款方式、贸易条款与目的港费用', '适用市场认证覆盖'],
      red_lines: ['不得把草稿视为正式报价', '不得承诺未核验认证、免费项目或交期', '任何低于授权底价、账期、独家、赔付或免费开模必须审批']
    };
  }

  triageAftersales(issueDescription: string) {
    const text = issueDescription.toLocaleLowerCase();
    const p1 = /safety|recall|lawsuit|all broken|large batch|安全|召回|诉讼|大批量|停售/i.test(text);
    const p2 = /logo|package|color|damage|scratch|defect|数量争议|包装|色差|破损|瑕疵/i.test(text);
    const level = p1 ? 'P1' : p2 ? 'P2' : 'P3';
    return {
      severity_level: level,
      sla_response_hours: level === 'P1' ? 24 : level === 'P2' ? 48 : 72,
      required_evidence: ['订单号与批次', '样品/签样编号', '问题照片或视频及数量', 'QC与出货记录', '客户明确诉求'],
      protocol: level === 'P1' ? '立即登记并由管理层、品质、业务及必要的法务/保险联合处理；禁止私自赔付。' : level === 'P2' ? '对照签样、PI、QC和装箱证据，形成书面判断后提交权限审批。' : '提供标准说明并记录；若形成高频问题，创建知识更新候选。'
    };
  }
}
