# RenWork Export Enterprise AI Knowledge Base Cloud API 接口规范 (V3.0)

## 1. 基础配置
- **协议**: HTTP / JSON
- **默认端口**: `8080`
- **基础路径**: `/api/v1`
- **健康检查**: `GET /healthz`
- **OpenAPI 规范**: `GET /openapi.json`

---

## 2. 核心端点

### 2.1 知识库管理 (Knowledge Base)

#### `POST /api/v1/kb/cold-start`
冷启动初始化 00–20 模块知识库。
- **Request Body**:
```json
{
  "tenant_id": "company_001",
  "company_name": "厦门圣元环保",
  "website_url": "https://example.com",
  "profile_summary": "专业出口牛磺酸与保健品源头企业",
  "industry": "food_pharma_chemical"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "tenantId": "company_001",
    "modulesCreated": 21,
    "cardsCount": 21,
    "cheatSheet": { ... },
    "gapConfirmationQueue": [ ... ]
  }
}
```

#### `POST /api/v1/kb/query`
结构化与语义知识检索。
- **Request Body**:
```json
{
  "query": "MOQ",
  "tenant_id": "company_001",
  "module": "07_commercial_delivery",
  "role_view": "junior_sales",
  "sensitivity": "public"
}
```

---

### 2.2 客户资产与评分 (Customer Asset Intelligence)

#### `POST /api/v1/customers/score`
计算 100 分动态客户优先级与 S/A/B/C/D 分层。
- **Request Body**:
```json
{
  "account": {
    "account_id": "ACC-001",
    "standard_name": "Apex Global Sourcing",
    "domain": "apex.com",
    "icp_fit_level": "A+",
    "total_revenue_usd": 150000,
    "historical_orders_count": 3
  },
  "interactions": [
    { "signal_type": "inquiry", "signal_strength": "strong" }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "priority_score": 92.5,
    "tier": "S",
    "score_breakdown": {
      "intent": 25,
      "fit": 20,
      "power": 18,
      "stage": 15,
      "value": 10,
      "quality": 5,
      "risk_penalty": 0
    },
    "dynamic_lists": ["today_must_follow", "repeat_purchase_warning"]
  }
}
```

#### `GET /api/v1/customers/dynamic-lists/:tenant_id`
获取 8 类动态跟进名单。

---

### 2.3 销售实战推进 (Sales Execution)

#### `POST /api/v1/sales/qualify`
询盘 10 步速检与 L1/L2/L3 提问下钻。

#### `POST /api/v1/sales/quote`
生成 Good / Better / Best 三档阶梯报价与样品政策。

#### `POST /api/v1/sales/objection`
匹配 10 类异议应答策略与 8 大升级红线。

---

### 2.4 治理与基准测试 (Governance & Benchmark)

#### `POST /api/v1/audit/benchmark`
执行 30 个典型外贸业务问答 + 5 个防幻觉反例基准测试。
