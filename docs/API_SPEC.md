# Cloud API V4

Base URL：`http://localhost:8080`。除健康检查和 OpenAPI 外，所有 `/api/v1/*` 请求需要：

```http
Authorization: Bearer <tenant-bound-key>
```

## 端点

| Method | Path | 作用 |
|---|---|---|
| GET | `/health/live` | 进程存活 |
| GET | `/health/ready` | 鉴权、存储模式与能力状态 |
| GET | `/openapi.json` | OpenAPI 3.1 |
| POST | `/api/v1/kb/cold-start` | 生成 00–20 模块未批准骨架 |
| POST | `/api/v1/kb/search` | 当前租户知识检索 |
| GET | `/api/v1/kb/cards/:cardId` | 当前租户单卡读取 |
| GET | `/api/v1/kb/audit` | 状态、敏感级、公开闸门、缺口和过期审计 |
| POST | `/api/v1/customers/score` | 可解释评分、硬停止和动态名单 |
| POST | `/api/v1/sales/qualify` | 询盘 10 维速检 |
| POST | `/api/v1/sales/quote` | 条件报价草稿 |
| POST | `/api/v1/sales/aftersales-triage` | P1/P2/P3 分级 |
| GET | `/api/v1/capabilities` | 连接器能力清单 |
| POST | `/api/v1/providers/email-syntax` | 仅语法邮箱检查 |
| POST | `/api/v1/providers/:provider` | 未配置实时能力返回 501 |
| GET/POST | `/api/v1/audit/benchmark` | 35 例基准真实执行状态 |

## 错误合同

```json
{
  "error": { "code": "invalid_request", "message": "field: reason" },
  "request_id": "uuid"
}
```

- `400 invalid_request`：Schema 校验失败。
- `401 unauthorized`：Key 缺失或无效。
- `404 not_found/unknown_capability`：资源或能力不存在。
- `501 capability_unavailable`：能力存在但未配置真实提供商。
- `500 internal_error`：不泄露内部堆栈；使用 `request_id` 排查。

## 冷启动边界

`cold-start` 只基于用户提交内容建立模块骨架。响应中的 `collection_performed=false` 明确表示没有自动抓取官网；任何官网采集必须由独立、可审计、遵守 robots 与 SSRF 防护的连接器完成。
