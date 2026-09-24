import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
const tenant = args.get('--tenant');
const company = args.get('--company');
const output = args.get('--out');
if (!tenant || !company || !output || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$/.test(tenant)) {
  console.error('Usage: npm run bootstrap:kb -- --tenant <safe-id> --company <name> --out <directory>');
  process.exit(1);
}
const out = path.resolve(root, output);
if (!out.startsWith(root + path.sep)) throw new Error('Output must remain inside the repository workspace');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'knowledge-base/module-catalog.json'), 'utf8'));
await fs.mkdir(out, { recursive: true });
const now = new Date().toISOString();
for (const [index, module] of catalog.modules.entries()) {
  const directory = path.join(out, module.id);
  await fs.mkdir(directory, { recursive: true });
  const frontmatter = `---\nkb_id: PENDING-${String(index + 1).padStart(4, '0')}\ntenant_id: ${tenant}\nmodule: ${module.id}\nstatus: pending_supplement\nconfidence: 0\nsensitivity: ${['07_commercial_delivery','14_customer_asset_lifecycle'].includes(module.id) ? 'internal' : 'public'}\npublic_claim_approved: false\ncreated_at: ${now}\nupdated_at: ${now}\n---`;
  const content = `${frontmatter}\n\n# ${module.title}\n\n## 结论\n暂无已核验企业事实。\n\n## 必备输出\n${module.outputs.map((item) => `- [ ] ${item}`).join('\n')}\n\n## 证据\n待登记来源、抓取/签发日期和具体定位。\n\n## 推荐动作\n补充资料并提交对应负责人审核。\n\n## 红线\n未经核验与审批，不得对外承诺价格、MOQ、产能、交期、认证、案例、独家、账期或赔付。\n\n## 待确认\n来源、负责人、审批人、适用市场、有效期与公开范围。\n`;
  await fs.writeFile(path.join(directory, 'README.md'), content, 'utf8');
}
const governance = path.join(out, '00_kb_governance');
await fs.writeFile(path.join(governance, 'AI岗位分工与审批矩阵.md'), `# AI 岗位分工与审批矩阵

> 默认规则：不能证明任务可逆、可审计且已获授权时，至少采用人机协同；涉及资金、合同、法律、隐私、用工、重大质量或客户关系时由人主导。

## 执行模式

| 模式 | AI 做什么 | 人做什么 |
|---|---|---|
| ai_draft | 检索、归纳和生成草稿 | 核验来源、事实与适用范围 |
| automated | 在已批准的确定性规则内归集、去重、提醒和同步 | 配置规则、监控异常、处理失败 |
| human_in_loop | 生成报价、发品、评分、质检或单证差异建议 | 审批、修改并确认对外或落库结果 |
| human_led | 整理证据和备选方案 | 判断、授权、执行并承担责任 |

## 工作流登记表

| workflow_id | 部门/场景 | 执行模式 | 输入与来源 | AI 输出物 | 人工检查点 | 审批角色 | 外部写入 | 失败动作 | 验收指标 | 反馈模块 |
|---|---|---|---|---|---|---|---|---|---|---|
| 待填写 | 待填写 | human_in_loop | 待填写 | 待填写 | 待填写 | 待填写 | 否 | stop | 先测基线后确认 | 20_learning_metrics |

## 不可删除的硬门槛

- 未通过公开声明闸门的事实不得自动发布。
- 报价、账期、底价、独家、赔付、付款、收款账号变更和合同承诺必须按企业权限审批。
- 退订、黑名单、欠款和严重争议优先于评分及自动营销。
- 外部写入必须记录对象、版本、操作者、时间、结果和回滚/人工接管方式。
`, 'utf8');
await fs.writeFile(path.join(governance, '分阶段上线验收.md'), `# 分阶段上线验收

> 顺序固定，周期不固定。除安全硬门槛外，所有目标值必须先测企业基线，再由负责人确认。

| 阶段 | 必备交付 | 基线 | 目标 | 数据来源 | 观察窗口 | 负责人 | 验收状态 |
|---|---|---|---|---|---|---|---|
| 1. 知识库底座 | 来源、产品、话术、报价、售后、权限与红线 | 待测 | 未审批公开数 = 0；其余待确认 | 知识卡与审计结果 | 待确认 | 待确认 | NOT_RUN |
| 2. 业务工作流 | 至少一个高频场景及人机分工矩阵 | 待测 | 周期、准确率或漏跟进相对基线改善 | 工作流记录与完成证据 | 待确认 | 待确认 | NOT_RUN |
| 3. 运营数据 | 多渠道归集、去重、状态和异常提醒 | 待测 | 数据可复算、异常可发现、失败可接管 | 渠道、CRM 与事件日志 | 待确认 | 待确认 | NOT_RUN |
| 4. 管理决策 | 可追溯看板、复盘和资源动作 | 待测 | 指标可追溯；完成至少一个复盘周期 | 业务事实与管理动作记录 | 待确认 | 待确认 | NOT_RUN |

## 阶段结论

- 当前可进入阶段：待负责人确认
- 未通过项：待填写
- 下一步动作、负责人、截止时间：待填写
- 验收证据位置：待填写
`, 'utf8');
await fs.writeFile(path.join(out, 'README.md'), `# ${company} Export Knowledge Base\n\n- Tenant: \`${tenant}\`\n- Generated: ${now}\n- State: 21 module skeletons plus AI delegation and rollout-gate templates; no public claims approved\n- Warning: This directory may contain enterprise/customer data. Do not commit it.\n`, 'utf8');
console.log(JSON.stringify({ tenant, company, output: path.relative(root, out), modules: catalog.modules.length }, null, 2));
