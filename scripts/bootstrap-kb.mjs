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
await fs.writeFile(path.join(out, 'README.md'), `# ${company} Export Knowledge Base\n\n- Tenant: \`${tenant}\`\n- Generated: ${now}\n- State: 21 module skeletons; no public claims approved\n- Warning: This directory may contain enterprise/customer data. Do not commit it.\n`, 'utf8');
console.log(JSON.stringify({ tenant, company, output: path.relative(root, out), modules: catalog.modules.length }, null, 2));
