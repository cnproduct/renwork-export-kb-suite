# RenWork 外贸出口企业 AI 知识库标准框架套件 (V3.0)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![RenWork Version](https://img.shields.io/badge/RenWork-v3.0.0-green.svg)](https://rrenn.com)
[![MCP Ready](https://img.shields.io/badge/MCP-1.6.0-orange.svg)](https://modelcontextprotocol.io)
[![Docker Support](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](Dockerfile)

> 本套件基于 [外贸出口企业 AI 知识库标准框架 V3.0](docs/外贸出口企业AI知识库标准框架_V3.0.md)，为中国外贸出口制造企业提供从**公司简介 + 官网冷启动**、**00–20 模块知识中台构建**、**8 类客户资产与 360 图谱**、**100 分动态客户优先级评分**、**8 类动态跟进名单**、**六大岗位专属视图**、**询盘 10 步速检**、**阶梯报价**、**6 大云聚合工具 (海关/CRM/邮箱验真/运费/汇率)** 到 **防幻觉置信度审计** 的全栈生产级工具集。

---

## 🌟 核心体系与特性

1. **双核心 (Dual Core)**：企业事实与销售知识核心 + 客户资产与关系全生命周期核心。
2. **五层知识架构 (L0–L4)**：治理层、企业真相层、市场决策层、销售执行层与持续学习层。
3. **5 大生产级 Skills**：
   - `renwork-export-kb-orchestrator`: 00–20 模块冷启动总控技能
   - `renwork-customer-asset-intelligence`: 8 类实体模型、100分动态评分、S/A/B/C/D 分层与 8 类动态名单
   - `renwork-export-sales-execution`: 询盘 10 步速检、Good/Better/Best 报价、10 类异议应对与 8 大升级红线
   - `renwork-industry-kb-adapter`: 7 大出口垂直行业自适应增强配置
   - `renwork-kb-governance-auditor`: 知识卡六态置信度审计与 30+5 问答基准测试
4. **6 大云端 API 聚合工具 (Cloud Aggregators)**：
   - `Customs Aggregator`: 海关提单与真实买家穿透，自动过滤 NVOCC 货代，提取 180 天进口柜量与供应链异动。
   - `CRM Aggregator`: OKKI CRM / 小满 / Salesforce 双向实体映射与黄金主记录去重。
   - `Web Fact Scraper`: 企业官网结构化事实、产品规格、资质认证与条款自动解析。
   - `Email Verifier`: 决策人邮箱 MX 解析与 C1/C2/C0 置信度分级。
   - `Trade & Freight Estimator`: 全球关税税率预估、20GP/40HQ 海运费估算与 Incoterms 风险责任划分。
   - `FX Converter`: 实时多币种汇率换算与 2% 汇率对冲毛利保本测算。
5. **标准 MCP 服务器 (`export-kb-mcp`)**：提供 18+ 原生 MCP 工具，无缝集成 Antigravity、Claude Desktop、Cursor 等。
6. **生产级 Cloud API 服务**：基于 Express + TypeScript + Docker，提供完整的 RESTful 接口与 OpenAPI 3.0 规范。
7. **响应式 Web 知识门户 (Portal)**：内置 6 岗位视图、业务速查卡、新人 7 天学习路径、8 类动态名单看板、100 分评分沙盒与云聚合工具实战面板。

---

## 📁 目录结构

```text
renwork-export-kb-suite/
├── .ci/                       # CI/CD 自动化工作流
├── docs/                      # 架构文档与接口规范
│   ├── 外贸出口企业AI知识库标准框架_V3.0.md
│   ├── ARCHITECTURE.md
│   └── API_SPEC.md
├── skills/                    # 5 大标准化 Agent Skills
│   ├── renwork-export-kb-orchestrator/
│   ├── renwork-customer-asset-intelligence/
│   ├── renwork-export-sales-execution/
│   ├── renwork-industry-kb-adapter/
│   └── renwork-kb-governance-auditor/
├── mcp/                       # Model Context Protocol (MCP) 服务器
│   └── export-kb-mcp/
├── cloud-api/                 # RESTful Cloud API 生产服务
│   ├── src/
│   │   ├── aggregators/       # 6 大云聚合工具实现
│   │   ├── engines/           # 核心知识与客户评分引擎
│   │   ├── routes/            # RESTful 路由
│   │   └── server.ts
├── portal/                    # 响应式 Web 知识门户
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── Dockerfile                 # 生产级多阶段容器构建
├── docker-compose.yml
├── install.sh                 # 一键安装脚本
├── plugin.json                # Plugin 插件清单
└── package.json
```

---

## 🚀 快速开始

### 1. 一键安装并构建
```bash
git clone https://github.com/cnproduct/renwork-export-kb-suite.git
cd renwork-export-kb-suite
chmod +x install.sh
./install.sh
```

### 2. 启动 Cloud API 服务
```bash
npm run start:api
# API 运行在 http://localhost:8080
# 健康检查: http://localhost:8080/healthz
# OpenAPI 规范: http://localhost:8080/openapi.json
# 聚合工具: http://localhost:8080/api/v1/cloud-aggregators/*
```

### 3. 使用 Docker 运行
```bash
docker-compose up --build -d
```

### 4. 打开 Web 知识门户
双击打开 `portal/index.html`，或在浏览器中访问。

---

## 🔧 MCP 服务器配置

在 Antigravity / Claude Desktop 配置文件 `mcp_servers` 中添加：

```json
{
  "mcpServers": {
    "renwork-export-kb": {
      "command": "node",
      "args": ["/path/to/renwork-export-kb-suite/mcp/export-kb-mcp/dist/index.js"]
    }
  }
}
```

---

## 📄 开源许可
[MIT License](LICENSE) © 2026 人人易 AI (Renrenyi AI)
