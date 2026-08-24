# RenWork AI 外贸增长系统 V4

[![CI](https://github.com/cnproduct/renwork-export-kb-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/cnproduct/renwork-export-kb-suite/actions/workflows/ci.yml)
[![Container](https://img.shields.io/badge/GHCR-container-2496ED)](https://github.com/cnproduct/renwork-export-kb-suite/pkgs/container/renwork-export-kb-suite)
[![License](https://img.shields.io/badge/license-MIT-0C7C59)](LICENSE)

基于《[外贸出口企业 AI 知识库标准框架 V3.0](docs/外贸出口企业AI知识库标准框架_V3.0.md)》实现的**证据优先、租户隔离、可审计**外贸增长系统。连接 RenWork/OpenCode 的知识库、Skills、MCP、Plugin、Cloud API 与 Web Portal，覆盖企业知识冷启动、客户资产、询盘、报价、跟进、复购、售后和持续学习。

> V4 的首要升级不是增加“神奇功能”，而是删除虚假能力：没有实时提供商就返回 `unavailable`；没有来源就不当企业事实；没有审批就不对外承诺。

## 系统组成

| 层 | 交付 |
|---|---|
| Knowledge Base | 00–20 模块目录、知识卡 Schema、八类客户实体 Schema、可重复生成器 |
| Skills | 5 个专项 Skill + 1 个 V4 总控 Skill，企业事实不硬编码进 Skill |
| MCP | 16 个 stdio 工具，`RENWORK_TENANT_ID` 启动时固定，模型不能切换租户 |
| RenWork/OpenCode Plugin | 4 个 Cloud API 工具，API Key 只从环境变量读取 |
| Cloud API | Bearer 鉴权、租户从身份派生、严格输入校验、限流、安全头、请求 ID |
| Customer Intelligence | 八类实体、V4 可解释评分、许可硬停止、S/A/B/C/D、八类动态名单 |
| Sales Execution | 10 维询盘速检、条件报价草稿、P1/P2/P3 售后分级 |
| Portal | 可连接真实 API 的战术工作台；不再展示虚构在线状态或固定演示结果 |
| Delivery | Docker Compose、GHCR、GitHub Pages、CI、35 例治理基准 |

## 安全边界

- 租户 ID 来自 API Key 或 MCP 进程环境，不接受模型在请求中指定。
- 所有冷启动卡默认 `public_claim_approved=false`。
- 退订、黑名单、营销许可、欠款和严重纠纷优先于评分。
- 海关、CRM、官网采集、运费关税与汇率未配置真实提供商时返回 HTTP 501。
- 邮箱工具只做语法检查，明确不代表 MX、SMTP、邮箱所有权或决策人身份已验证。
- 真实企业资料、客户、订单、报价、凭据和日志放在 `data/` 或外部数据库，禁止提交 Git。
- 当前开源版持久层是 `ephemeral_memory`，用于安全验证和二次开发；生产多实例部署需接 PostgreSQL/RLS、对象存储、OIDC 与密钥管理。

## 5 分钟启动

需要 Node.js 20–24 或 Docker。

```bash
git clone https://github.com/cnproduct/renwork-export-kb-suite.git
cd renwork-export-kb-suite
npm ci
npm run verify
cp .env.example .env
# 修改 .env 中的演示密钥
docker compose up --build
```

打开 <http://localhost:8080>，输入 `.env` 中 API Key。健康检查：

```bash
curl http://localhost:8080/health/ready
```

## 生成企业知识库骨架

```bash
npm run bootstrap:kb -- \
  --tenant acme-export \
  --company "Acme Export Ltd" \
  --out data/acme-export
```

结果包含 21 个模块，全部处于待补充/待核验状态，不会把模板冒充企业事实。

## Cloud API

API 使用 Bearer Key。格式：

```text
RENWORK_API_KEYS=long-secret-key:tenant-id:admin|sales,another-key:tenant-b:admin
```

示例：

```bash
curl -X POST http://localhost:8080/api/v1/kb/cold-start \
  -H "Authorization: Bearer $RENWORK_EXPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme Export","website_url":"https://example.com","profile_summary":"User supplied profile"}'
```

详见 `docs/API_SPEC.md` 与运行时 `/openapi.json`。

## MCP 配置

先构建，再把租户固定在进程环境：

```bash
npm run build:mcp
RENWORK_TENANT_ID=acme-export npm run start:mcp
```

仓库自带 `opencode.json`。在 RenWork 中，也可以按官方路径打开 `Settings > Extensions > Add Custom App` 添加自定义 MCP；本地 stdio MCP 不暴露租户切换参数。

## Plugin 与 Skills

- OpenCode Plugin：`.opencode/plugins/renwork-export-growth.ts`
- V4 总控 Skill：`.opencode/skills/renwork-ai-export-growth-system/SKILL.md`
- 专项 Skills：`skills/*/SKILL.md`

Plugin 需要：

```bash
export RENWORK_EXPORT_API_URL=http://localhost:8080
export RENWORK_EXPORT_API_KEY='your-private-key'
```

不要把 Key 写入 `opencode.json`、Skill 或任何 Git 文件。

## GitHub 交付

- `main` 推送自动执行 build、测试、元数据校验、知识库生成烟测与 Docker build。
- 镜像自动发布到 `ghcr.io/cnproduct/renwork-export-kb-suite:latest`。
- Portal 通过 GitHub Pages 工作流发布；Pages 只承载静态界面，不承载 API、数据库或秘密。

## 验证

```bash
npm run verify
node --check portal/app.js
docker build -t renwork-export-growth:local .
```

测试重点覆盖：租户隔离、默认公开闸门关闭、营销许可硬停止、负数报价拒绝、未配置连接器诚实失败、邮箱不伪验真、35 例基准不伪造通过率。

## 路线图

1. PostgreSQL + RLS + pgvector + 对象存储持久层。
2. OIDC/OAuth 2.1 与远程 Streamable HTTP MCP。
3. 按企业授权接入 OKKI/CRM、邮箱、订单和持牌海关/贸易数据。
4. 审批流、事件队列、审计日志、备份恢复与 9 万客户压力测试。
5. 按实际赢单、复购、回款和投诉校准评分，不允许模型自动改规则。

## 文档

- `docs/ARCHITECTURE.md`：架构、安全和生产化边界
- `docs/API_SPEC.md`：API 与错误合同
- `knowledge-base/README.md`：知识库生成与数据规范
- `DESIGN.md`：Portal 设计系统与无障碍标准
- OpenWork 概念参考：`start-here/do-work-with-it/skills-plugins-and-mcp.mdx`、`start-here/connect-your-stack/add-an-mcp-server.mdx`

MIT License © 2026 人人易 AI
