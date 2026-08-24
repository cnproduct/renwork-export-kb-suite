const modules = [
  ['00','治理与导航','可信、权限、更新'],['01','来源与权限','证据、口径、冲突'],['02','企业身份','公司与可信实力'],
  ['03','品牌口径','定位、语气、禁用词'],['04','产品图谱','产品事实与边界'],['05','制造质量','工艺、QC、供应'],
  ['06','认证合规','市场准入与到期'],['07','商务交付','MOQ、付款、单证'],['08','市场情报','国家、渠道、节奏'],
  ['09','ICP 买家','公司与决策角色'],['10','意图信号','强弱、衰减、动作'],['11','竞争差异','痛点—证据链'],
  ['12','市场匹配','产品×市场×买家'],['13','线索背调','L1 / L2 / L3'],['14','客户资产','八实体与生命周期'],
  ['15','询盘判断','10维速检'],['16','方案报价','条件报价与样品'],['17','异议审批','让步与强制升级'],
  ['18','销售内容','多触点与公开闸门'],['19','订单售后','SOP 与 P1/P2/P3'],['20','学习复盘','赢输单与更新候选']
];
const moduleList = document.querySelector('#module-list');
for (const [id, title, desc] of modules) {
  const li = document.createElement('li'); const number = document.createElement('b'); const strong = document.createElement('strong'); const small = document.createElement('small');
  number.textContent = id; strong.textContent = title; small.textContent = desc; li.append(number, strong, small); moduleList.append(li);
}

const state = { api: sessionStorage.getItem('renwork_api_url') || 'http://localhost:8080', key: sessionStorage.getItem('renwork_api_key') || '', connected: false };
const apiUrl = document.querySelector('#api-url'); const apiKey = document.querySelector('#api-key'); const output = document.querySelector('#output');
apiUrl.value = state.api; apiKey.value = state.key;

function setOutput(value) { output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
function setConnected(connected, ready) {
  state.connected = connected;
  document.querySelectorAll('[data-needs-api]').forEach((button) => { button.disabled = !connected; });
  const badge = document.querySelector('#connect-state'); badge.textContent = connected ? '已连接' : '未连接'; badge.className = `status-tag ${connected ? 'ready' : ready === false ? 'error' : 'neutral'}`;
  document.querySelector('#rail-api').textContent = connected ? '就绪' : ready === false ? '不可用' : '未连接';
  document.querySelector('#rail-auth').textContent = connected ? '已验证' : '待验证';
}
async function request(path, options = {}) {
  const response = await fetch(`${state.api.replace(/\/$/, '')}${path}`, { ...options, headers: { authorization: `Bearer ${state.key}`, ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({ error: { message: '响应不是有效 JSON' } }));
  if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `HTTP ${response.status}`), { payload });
  return payload;
}

document.querySelector('#connect-form').addEventListener('submit', async (event) => {
  event.preventDefault(); state.api = apiUrl.value.trim().replace(/\/$/, ''); state.key = apiKey.value;
  sessionStorage.setItem('renwork_api_url', state.api); sessionStorage.setItem('renwork_api_key', state.key);
  const button = document.querySelector('#connect-button'); button.disabled = true; button.textContent = '正在验证…';
  try {
    const ready = await fetch(`${state.api}/health/ready`).then((response) => response.json());
    const capabilityPayload = await request('/api/v1/capabilities');
    setConnected(true); document.querySelector('#rail-storage').textContent = ready.storage_mode || '未知';
    const values = Object.values(capabilityPayload.data); document.querySelector('#rail-live').textContent = values.includes('live') ? '已配置' : '未配置';
    const list = document.querySelector('#capability-list'); list.replaceChildren();
    for (const [name, mode] of Object.entries(capabilityPayload.data)) { const li = document.createElement('li'); const label = document.createElement('span'); const status = document.createElement('em'); label.textContent = name; status.textContent = mode; li.append(label, status); list.append(li); }
    setOutput({ ready, capabilities: capabilityPayload.data });
  } catch (error) { setConnected(false, false); setOutput(error.payload || { error: error.message }); }
  finally { button.disabled = false; button.textContent = '验证并读取能力'; }
});

document.querySelector('#cold-start-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { setOutput(await request('/api/v1/kb/cold-start', { method: 'POST', body: JSON.stringify({ company_name: document.querySelector('#company-name').value, website_url: document.querySelector('#website-url').value, profile_summary: document.querySelector('#profile-summary').value }) })); }
  catch (error) { setOutput(error.payload || { error: error.message }); }
});

document.querySelector('#search-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const results = document.querySelector('#search-results'); results.textContent = '搜索中…';
  try {
    const payload = await request('/api/v1/kb/search', { method: 'POST', body: JSON.stringify({ query: document.querySelector('#search-query').value, limit: 20 }) });
    results.replaceChildren(); results.classList.remove('empty');
    if (!payload.data.length) { results.textContent = '没有匹配知识卡。'; results.classList.add('empty'); }
    for (const card of payload.data) { const div = document.createElement('div'); const title = document.createElement('strong'); const meta = document.createElement('small'); title.textContent = card.title; meta.textContent = `${card.status} · ${card.sensitivity} · ${card.public_claim_approved ? '可公开' : '未通过公开闸门'}`; div.className = 'result-item'; div.append(title, meta); results.append(div); }
    setOutput(payload);
  } catch (error) { results.textContent = '搜索失败，请查看执行回执。'; results.classList.add('empty'); setOutput(error.payload || { error: error.message }); }
});
document.querySelector('#clear-output').addEventListener('click', () => setOutput('执行回执已清空。'));
