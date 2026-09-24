import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const packageJson = readJson('package.json');
const plugin = readJson('plugin.json');
const manifest = readJson('manifest.json');
const benchmark = readJson('skills/renwork-kb-governance-auditor/tests/benchmark_30_cases.json');
const catalog = readJson('knowledge-base/module-catalog.json');
const workflowControl = readJson('knowledge-base/schemas/workflow-control.schema.json');
for (const value of [plugin.version, manifest.version]) {
  if (value !== packageJson.version) throw new Error(`Version drift: expected ${packageJson.version}, found ${value}`);
}
if (catalog.modules.length !== 21) throw new Error(`Expected 21 modules, found ${catalog.modules.length}`);
const governanceOutputs = catalog.modules.find((item) => item.id === '00_kb_governance')?.outputs ?? [];
for (const output of ['AI岗位分工与审批矩阵', '分阶段上线验收']) {
  if (!governanceOutputs.includes(output)) throw new Error(`Missing governance output: ${output}`);
}
const executionModes = workflowControl.properties?.execution_mode?.enum ?? [];
for (const mode of ['ai_draft', 'automated', 'human_in_loop', 'human_led']) {
  if (!executionModes.includes(mode)) throw new Error(`Missing workflow execution mode: ${mode}`);
}
if (benchmark.cases.length !== 35 || benchmark.cases.filter((item) => item.is_negative_test).length !== 5) throw new Error('Benchmark must contain exactly 30 business + 5 refusal cases');
for (const skillPath of plugin.skills) {
  const file = path.join(root, skillPath, 'SKILL.md');
  if (!fs.existsSync(file)) throw new Error(`Missing skill: ${file}`);
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---\n') || !/\nname:\s*\S+/.test(text) || !/\ndescription:\s*.+/.test(text)) throw new Error(`Invalid SKILL.md frontmatter: ${file}`);
}
for (const file of [plugin.opencode_plugin, plugin.mcp_servers['export-kb-mcp'].args[0], manifest.cloud_api.entry, manifest.portal.entry]) {
  const full = path.join(root, file);
  const buildArtifact = file.includes('/dist/');
  if (!fs.existsSync(full) && !buildArtifact) throw new Error(`Missing referenced file: ${file}`);
}
console.log(JSON.stringify({ status: 'ok', version: packageJson.version, modules: 21, benchmark_cases: 35, skills: plugin.skills.length }));
