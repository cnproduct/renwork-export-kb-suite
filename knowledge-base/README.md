# 企业知识库模板

这里保存的是**可复用结构、Schema 与生成器**，不是任何真实企业的数据。真实企业资料、客户、报价、订单、凭据和日志禁止提交到 Git。

## 生成隔离的企业知识库

```bash
npm run bootstrap:kb -- --tenant acme-export --company "Acme Export Ltd" --out ./data/acme-export
```

生成器会创建 00–20 模块、导航、确认队列与 21 张默认 `pending_supplement` 知识卡。生成结果默认位于 `data/`（已被 `.gitignore` 排除），所有内容均未通过公开发布闸门。

## 数据原则

- 企业事实、客户资产和附件属于租户数据，不硬编码进 Skill。
- 数据库/事件是客户关系事实的权威源；Markdown 是便于人和 RAG 使用的投影。
- 对外主张必须有来源、有效期、状态及 `public_claim_approved=true`。
- 退订、黑名单、营销许可、欠款和严重纠纷是硬停止条件。
- 未配置实时连接器时返回 `unavailable`，不使用演示数据冒充实时结果。

## 包含内容

- `module-catalog.json`：21 个标准模块的机器可读目录。
- `schemas/knowledge-card.schema.json`：知识卡 V4 Schema。
- `schemas/customer-graph.schema.json`：八类客户实体 V4 Schema。
- `scripts/bootstrap-kb.mjs`：可重复执行的企业知识库生成器。
