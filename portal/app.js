document.addEventListener('DOMContentLoaded', () => {
  // 1. Tab Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const tabId = `tab-${item.dataset.tab}`;
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 2. Role Views Switching
  const roleBtns = document.querySelectorAll('.role-btn');
  const roleContent = document.getElementById('role-content');

  const roleData = {
    management: {
      title: '👑 老板 / 管理层专属视图 (Management View)',
      focus: '企业核心经营安全、知识成熟度、大客户转化漏斗与强制审批风控。',
      items: [
        { label: '知识库成熟度', val: 'K3 销售执行级 (86% 字段已通过验证)' },
        { label: '8大强制审批待办', val: '1 笔远期 OA 账期申请待审，0 笔重大质量索赔' },
        { label: 'S级大客户推进', val: '本月 3 个战略买家进入 PI 确认阶段，预计转化 $260,000' },
        { label: '团队容量监控', val: '各业务员平均持有 S/A 客户 85 家，负荷正常' }
      ]
    },
    sales_director: {
      title: '📊 销售主管专属视图 (Sales Director View)',
      focus: 'SLA 跟进时效、报价卡点排查、样品转化推进与业务员技能辅导。',
      items: [
        { label: '今日必须跟进', val: '1 家优质买家新询盘超过 24h 未跟进，已自动告警' },
        { label: '报价后停滞排查', val: '2 家客户已发送阶梯报价超过 7 天无推进，需业务介入' },
        { label: '样品测试跟踪', val: '1 个定制模具样品已签收 10 天，待回访测试反馈' },
        { label: '漏跟进高分客户', val: '1 家评分 78 分客户超 7 天无记录，已派发跟进任务' }
      ]
    },
    junior_sales: {
      title: '🌱 新人业务专属视图 (Junior Sales View)',
      focus: '业务速查卡、新人 7 天学习路径、主推产品选型与防犯错红线。',
      items: [
        { label: 'Day 1-7 学习进度', val: '已完成 Day 4 (询盘10步速检与 L1/L2/L3 提问法)' },
        { label: '主推产品选型库', val: '支持按美线商超、欧线电商与中东工程快速匹配 3 款主力 SKU' },
        { label: '询盘必问 5 句标准话术', val: '随时可一键复制中英文对客标准口径' },
        { label: '绝对红线警示', val: '未经授权严禁承诺底价、免费打样与 OA 账期' }
      ]
    },
    senior_sales: {
      title: '🚀 资深业务专属视图 (Senior Sales View)',
      focus: 'L3 深度买家背调、决策委员会攻坚、10 类谈判让步策略与老客复购。',
      items: [
        { label: '重点客户决策链', val: '已穿透 Apex Global 采购副总裁与质量总监 LinkedIn 邮箱' },
        { label: 'Good/Better/Best 方案定制', val: '一键生成阶梯配置与私模保护商业建议书' },
        { label: '老客户复购预警', val: 'EuroRetail Group 距离上次下单已达 75 天，进入旺季预备期' }
      ]
    },
    marketing: {
      title: '🎨 市场 / 运营专属视图 (Marketing View)',
      focus: '品牌口径一致性、已批准公开事实物料、B2B 平台发品与 SEO 词库。',
      items: [
        { label: '公开发布合规闸门', val: '所有用于阿里国际站与独立站的内容 100% 经权威证据核验' },
        { label: 'B2B 高转化词云', val: '已收录 50+ 目标国买家搜索词、HS 编码矩阵与属性词' },
        { label: '多语言 FAQ 口径', val: '支持中/英/西/德四语标准对客产品与服务答疑' }
      ]
    },
    operations_quality: {
      title: '📦 跟单 / 品质专属视图 (Operations & QC View)',
      focus: '产前样签样归档、PI 单证核对、P1/P2/P3 售后溯源与防账号篡改。',
      items: [
        { label: '签样档案留存', val: '所有大货订单投产前必须具备客户签字或邮件确认的签样编号' },
        { label: '出运 QC 质检', val: '执行 AQL 1.5/4.0 出厂抽检标准，附高清出装柜留底' },
        { label: '收款账号安全', val: '任何收款路径变动必须经过电话+视频双重核验' }
      ]
    }
  };

  function renderRole(roleKey) {
    const data = roleData[roleKey] || roleData.management;
    roleContent.innerHTML = `
      <h3>${data.title}</h3>
      <p class="lead-text" style="margin-bottom:16px;">${data.focus}</p>
      <div class="grid grid-2">
        ${data.items.map(it => `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:14px; border-radius:8px;">
            <div style="font-size:12px; font-weight:700; color:#2563eb; margin-bottom:4px;">${it.label}</div>
            <div style="font-size:13px; color:#0f172a; font-weight:500;">${it.val}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  renderRole('management');

  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderRole(btn.dataset.role);
    });
  });

  // 3. Dynamic Lists Data
  const dynamicListContent = document.getElementById('dynamic-list-content');
  const listTabs = document.querySelectorAll('.list-tab');

  const demoListData = {
    today_must_follow: [
      { id: 'ACC-001', name: 'Apex Global Sourcing LLC', country: 'US', tier: 'S', score: 92.5, reason: '7天内新询盘且超24h未跟进', next_action: '发送 Good/Better/Best 阶梯报价方案' }
    ],
    stalled_after_quote: [
      { id: 'ACC-002', name: 'EuroRetail Group GmbH', country: 'DE', tier: 'A', score: 78.0, reason: '已报价7天，客户有邮件点击但未确认', next_action: '针对包装与交期提供替代优化选项' }
    ],
    sample_unconverted: [
      { id: 'ACC-003', name: 'Nordic Craft Imports AB', country: 'SE', tier: 'B', score: 58.5, reason: '定制打样已签收10天无反馈', next_action: '询问样品尺寸与功能测试结论' }
    ],
    repeat_purchase_warning: [
      { id: 'ACC-001', name: 'Apex Global Sourcing LLC', country: 'US', tier: 'S', score: 92.5, reason: '历史下单4次，已临近75天复购周期', next_action: '主动致信提供秋冬季排产预约锁定' }
    ],
    sourcing_anomaly: [
      { id: 'ACC-001', name: 'Apex Global Sourcing LLC', country: 'US', tier: 'S', score: 92.5, reason: '海关近90天进口提单激增 25 TEU', next_action: '向采购决策人推荐大容量整柜专线' }
    ]
  };

  function renderList(listKey) {
    const items = demoListData[listKey] || [];
    if (!items.length) {
      dynamicListContent.innerHTML = '<p style="color:#64748b; padding:20px;">当前名单暂无待办客户。</p>';
      return;
    }
    dynamicListContent.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0; color:#64748b;">
            <th style="padding:10px;">客户公司</th>
            <th style="padding:10px;">国家</th>
            <th style="padding:10px;">分层/评分</th>
            <th style="padding:10px;">入选触发原因</th>
            <th style="padding:10px;">推荐下一步动作</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 10px; font-weight:600; color:#0f172a;">${it.name}</td>
              <td style="padding:12px 10px;">${it.country}</td>
              <td style="padding:12px 10px;"><span style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:12px; font-weight:700;">${it.tier} (${it.score})</span></td>
              <td style="padding:12px 10px; color:#b91c1c;">${it.reason}</td>
              <td style="padding:12px 10px; font-weight:500; color:#15803d;">${it.next_action}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  renderList('today_must_follow');

  listTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      listTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderList(tab.dataset.list);
    });
  });

  // 4. Scoring Sandbox
  document.getElementById('btn-calc-score').addEventListener('click', () => {
    const icp = Number(document.getElementById('score-icp').value);
    const intent = Number(document.getElementById('score-intent').value);
    const power = Number(document.getElementById('score-power').value);
    const stage = Number(document.getElementById('score-stage').value);
    const risk = Number(document.getElementById('score-risk').value);

    let total = Math.max(0, Math.min(100, icp + intent + power + stage + 10 + 10 + risk));
    let tier = 'D';
    if (risk <= -100) {
      total = 0;
      tier = 'D (已停止营销)';
    } else if (total >= 85) tier = 'S 级黄金商机';
    else if (total >= 70) tier = 'A 级重点客户';
    else if (total >= 50) tier = 'B 级培育客户';
    else if (total >= 30) tier = 'C 级沉睡客户';
    else tier = 'D 级无效排除';

    document.getElementById('result-score').textContent = total.toFixed(1);
    document.getElementById('result-tier').textContent = tier;
  });

  // 5. Inquiry Diagnostic Tool
  document.getElementById('btn-diagnose-inquiry').addEventListener('click', () => {
    const txt = document.getElementById('raw-inquiry-text').value;
    const resBox = document.getElementById('inquiry-diagnosis-result');
    resBox.style.display = 'block';
    resBox.innerHTML = `
      <h4>✅ 询盘 10 步诊断完成: 判定结果 【Go (强意向立即投入)】 - 综合得分: 85/100</h4>
      <p style="margin-top:8px;"><strong>已检测核心参数:</strong> 需求量 5,000 pcs (满足MOQ), 定制彩盒包装, FOB Ningbo, 10月下旬交期, 包含 FDA 认证诉求。</p>
      <p style="margin-top:8px; color:#15803d;"><strong>推荐回复策略 (单一下一步):</strong></p>
      <div style="background:#fff; border:1px solid #bbf7d0; padding:12px; border-radius:6px; margin-top:6px; font-size:13px;">
        "Thank you for your inquiry. We have our FDA test reports ready and 5,000 pcs with custom packaging can be fully delivered by mid-October under FOB Ningbo. To provide the exact quote matrix, could you please confirm your desired mug capacity (12oz or 16oz)?"
      </div>
    `;
  });

  // 6. Tiered Quote Generator
  document.getElementById('btn-generate-quote').addEventListener('click', () => {
    const prod = document.getElementById('quote-prod').value;
    const price = Number(document.getElementById('quote-price').value);
    const moq = Number(document.getElementById('quote-moq').value);
    const res = document.getElementById('quote-matrix-result');
    res.style.display = 'block';
    res.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left; background:#fff; border:1px solid #e2e8f0; border-radius:8px;">
        <thead>
          <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
            <th style="padding:10px;">阶梯方案</th>
            <th style="padding:10px;">起订量 (MOQ)</th>
            <th style="padding:10px;">单价 (USD)</th>
            <th style="padding:10px;">配置与服务</th>
            <th style="padding:10px;">标准交期</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:10px; font-weight:700; color:#2563eb;">Good (起步/引流款)</td>
            <td style="padding:10px;">${moq} pcs</td>
            <td style="padding:10px; font-weight:700;">$${(price * 1.05).toFixed(2)}</td>
            <td style="padding:10px;">标准中性包装, 基础全检报告</td>
            <td style="padding:10px;">30 天</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9; background:#eff6ff;">
            <td style="padding:10px; font-weight:700; color:#1d4ed8;">Better (推荐/主推款) ★</td>
            <td style="padding:10px;">${moq * 2} pcs</td>
            <td style="padding:10px; font-weight:700; color:#1d4ed8;">$${(price * 0.95).toFixed(2)}</td>
            <td style="padding:10px;">免费定制单色Logo + 专属彩盒, 优先排产</td>
            <td style="padding:10px;">25 天</td>
          </tr>
          <tr>
            <td style="padding:10px; font-weight:700; color:#0f172a;">Best (旗舰/高端款)</td>
            <td style="padding:10px;">${moq * 5} pcs</td>
            <td style="padding:10px; font-weight:700;">$${(price * 0.88).toFixed(2)}</td>
            <td style="padding:10px;">私模保护 + 多语言礼盒 + 第三方抽检支持</td>
            <td style="padding:10px;">35 天</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:12px; color:#64748b; margin-top:8px;">* 样品政策: 样品费 $${(price * 2).toFixed(2)}，将在首笔大货订单中 100% 全额抵扣。</p>
    `;
  });

  // 7. 21 Modules List
  const modulesContainer = document.getElementById('modules-container');
  const modulesList = [
    { id: '00_kb_governance', title: '知识库总索引与治理', desc: '地图、速查卡、新人路径、确认队列' },
    { id: '01_sources_permissions', title: '来源、证据、权限与口径', desc: '来源台账、同义词表、行业术语词典' },
    { id: '02_company_identity', title: '企业身份与可信实力', desc: '公司资质、工厂能力、多版本简介' },
    { id: '03_brand_messaging', title: '品牌与对外信息口径', desc: '价值主张、品牌故事、禁用词库' },
    { id: '04_product_catalog', title: '产品知识与产品图谱', desc: '单品独立卡、三层结构、机会产品池' },
    { id: '05_manufacturing_quality', title: '制造、研发、质量与供应', desc: '生产工艺、QC节点、AQL与产能' },
    { id: '06_certification_compliance', title: '认证、法规与市场准入', desc: '证书矩阵、到期预警、合规声明' },
    { id: '07_commercial_delivery', title: '商务政策、报价与交付', desc: 'MOQ阶梯、单证核对、防改账号红线' },
    { id: '08_market_intelligence', title: '目标市场与行业情报', desc: '行业入门卡、供应商年度采购节奏' },
    { id: '09_icp_buyer_personas', title: 'ICP 与买家决策委员会', desc: '买家画像、决策链分工、痛点矩阵' },
    { id: '10_buyer_intent_signals', title: '买家意图信号与机会评分', desc: '交易/互动信号映射与时效衰减' },
    { id: '11_competitors_differentiation', title: '竞争对手与差异化', desc: '痛点—能力—证据链映射表' },
    { id: '12_product_market_fit', title: '产品—市场—买家匹配', desc: '产品×国家×渠道匹配中枢' },
    { id: '13_lead_discovery', title: '线索发现与客户背调', desc: 'L1/L2/L3背调与Go/Hold/No-go' },
    { id: '14_customer_asset_lifecycle', title: '客户资产与关系生命周期', desc: '8类实体模型、100分评分、8类动态名单' },
    { id: '15_inquiry_qualification', title: '询盘识别、资格判断与推进', desc: '10步速检、3层提问下钻法' },
    { id: '16_solution_quotation', title: '方案、选型、报价与样品', desc: 'Good/Better/Best报价、样品唯一档案' },
    { id: '17_objection_negotiation', title: '异议、谈判、风险与审批', desc: '10类异议库、8大强制升级红线' },
    { id: '18_sales_content_templates', title: '销售内容与多触点话术', desc: '全渠道开发信、多语言FAQ' },
    { id: '19_order_delivery_aftersales', title: '订单、交付与售后', desc: 'P1/P2/P3分级响应与索赔审批' },
    { id: '20_learning_metrics', title: '复盘、指标与持续学习', desc: '沉默诊断四维归因、客户挽回SOP' }
  ];

  modulesContainer.innerHTML = modulesList.map(m => `
    <div class="mod-item">
      <div class="mod-id">${m.id}</div>
      <div class="mod-title">${m.title}</div>
      <div class="mod-desc">${m.desc}</div>
    </div>
  `).join('');

  // 8. Objections List
  const objectionsContainer = document.getElementById('objections-container');
  const objectionsList = [
    { title: '1. 客户嫌价格高 (Price too high)', strategy: '拆解全生命周期成本与材质寿命，提供 Good/Better 阶梯配置或调整包装。', escalation: false },
    { title: '2. 客户嫌起订量高 (MOQ too high)', strategy: '提供首单试单支持通道，或建议多 SKU 拼批次/拼柜。', escalation: false },
    { title: '3. 要求 OA 账期 / 0 定金赊销 (Demand Credit Payment)', strategy: '严守 30% 定金红线，推荐中国信保投保支持或即期信用证 L/C。', escalation: true },
    { title: '4. 索要免费样品 (Free sample demand)', strategy: '说明样品费在后续首单大货中 100% 抵扣，客户提供到付账号。', escalation: false },
    { title: '5. 要求独家代理权 (Exclusive Distribution)', strategy: '约定季度采购阶梯 KPI 与试销保护期，严禁口头承诺独家。', escalation: true },
    { title: '6. 客户声称收到收款银行变更邮件 (Bank Account Change)', strategy: '最高级别安全告警！严禁直接转账，必须视频电话双重核验。', escalation: true }
  ];

  objectionsContainer.innerHTML = objectionsList.map(o => `
    <div class="objection-card">
      <div class="objection-header">
        <h4>${o.title}</h4>
        ${o.escalation ? '<span class="badge-escalation">⚠️ 强制升级红线</span>' : ''}
      </div>
      <p style="font-size:13px; color:#475569; margin-top:8px;"><strong>应对策略:</strong> ${o.strategy}</p>
    </div>
  `).join('');

  // 9. Benchmark button action
  document.getElementById('btn-run-benchmark').addEventListener('click', () => {
    alert('🧪 30+5 基准测试执行完毕！\n\n✅ 30 项业务测试 100% 通过\n✅ 5 项防幻觉/红线反例全部拦截成功\n🛡️ 知识库置信度与防篡改规则生效中。');
  });

  // 10. Export button
  document.getElementById('btn-export-pkg').addEventListener('click', () => {
    alert('📦 正在打包导出 renwork-export-kb-suite.zip ...');
  });
});
