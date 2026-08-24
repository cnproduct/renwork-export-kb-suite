# V4 架构与生产化边界

## 架构原则

```text
RenWork / OpenCode / Portal
           │
   Plugin / stdio MCP / REST
           │
  @renwork/export-growth-core
  ├─ Knowledge Engine
  ├─ Customer Decision Engine
  ├─ Sales Execution Engine
  └─ Capability Registry
           │
  开源版：租户隔离内存存储
  生产版：PostgreSQL RLS + Object Storage + Durable Jobs
```

1. Connector 负责到达系统，Skill 负责方法，Plugin 负责可安装分发；数据事实不写入 Skill。
2. REST 与 MCP 复用一个 Core，避免评分、红线和能力状态漂移。
3. LLM 负责提取、草拟和建议；许可、评分、硬停止、租户、审批由确定性代码执行。
4. 未配置实时数据提供商时失败关闭（fail closed），不返回固定汇率、虚构买家或伪认证。

## 租户与权限

- REST：`RENWORK_API_KEYS` 将 Key 映射到固定 `tenant_id` 和 roles，请求体不接受 tenant。
- MCP：`RENWORK_TENANT_ID` 在进程启动时固定，Tool 参数不含 tenant。
- Plugin：调用 Cloud API；API Key 只读环境变量。
- 当前 roles 已进入身份上下文，但细粒度 RBAC/ABAC 仍属生产部署任务。

## 知识事实状态

`verified_fact`、`public_fact`、`ai_inference`、`strategy_recommendation`、`pending_supplement`、`deprecated`、`conflicted`。

只有 `verified_fact/public_fact` 才可能通过公开闸门；通过还需要独立的 `public_claim_approved=true`、适用范围和有效期检查。

## 客户关系图谱

八类实体：Account、Contact、Opportunity、Interaction、Transaction、ProductInterest、Task、RiskConsent。Account 与 Contact 不混合；一个 Account 可有多个联系人、产品和并行商机。

V4 评分是版本化的确定性 100 分模型：意向 25、匹配 20、采购实力与周期 20、商机 15、历史价值 10、联系质量 10、风险扣分。退订/黑名单/争议等硬停止优先。

## 已实现与未实现

### 已实现

- 21 模块冷启动骨架和企业隔离知识检索。
- 六态扩展事实治理、来源、公开闸门、过期审计字段。
- 八类客户实体 TypeScript/JSON Schema。
- V4 评分、时间窗口、八类名单、许可硬停止。
- 询盘 10 维速检、条件报价、售后分级。
- API 鉴权、限流、安全头、CORS allowlist、请求 ID、统一错误。
- stdio MCP、OpenCode Plugin、Portal、CI、GHCR、Pages。

### 生产部署前必须补齐

- PostgreSQL + `FORCE ROW LEVEL SECURITY`、运行时非 `BYPASSRLS` 角色。
- 对象存储、病毒扫描、文档解析/OCR、混合检索与引用定位。
- OIDC、成员/团队权限、Restricted 字段加密、KMS/Vault。
- 审批、审计事件、幂等、队列、Webhook 签名、备份恢复。
- 获得授权和许可的 CRM、邮箱、海关、运费、关税、汇率提供商。
- 远程 MCP 的 OAuth 2.1、PKCE S256、受众绑定令牌和组织级授权。

GitHub 负责源码、CI、Pages 和镜像，不等于生产 API/数据库运行环境。
