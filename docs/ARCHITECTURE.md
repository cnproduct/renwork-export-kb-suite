# RenWork 外贸出口企业 AI 知识库标准框架 V3.0 系统架构设计

## 1. 架构总览

RenWork Export KB Suite V3.0 是面向中国出口制造与外贸企业的全链路知识资产与客户中台系统。系统采用 **“双核心、五层知识体系、二十一个标准模块、六大岗位专属视图”** 的分层设计。

```mermaid
graph TD
    User([出口企业用户 / 业务员 / 运营]) <--> Portal[Web Portal 交互门户]
    
    subgraph "应用与分发层"
        Portal
        IDEAgent[IDE Agent / Antigravity / Claude]
        CloudClient[第三方 CRM / 外部 ERP / OKKI]
    end

    subgraph "服务与协议层"
        MCP[Model Context Protocol (export-kb-mcp)]
        REST[Cloud RESTful API (Port 8080)]
    end

    IDEAgent <--> MCP
    CloudClient <--> REST
    Portal <--> REST

    subgraph "5大核心 Skills 引擎"
        S1[renwork-export-kb-orchestrator<br/>00-20模块冷启动与总控]
        S2[renwork-customer-asset-intelligence<br/>8类实体/100分动态评分/8类名单]
        S3[renwork-export-sales-execution<br/>询盘10步速检/阶梯报价/10类异议]
        S4[renwork-industry-kb-adapter<br/>7大出口垂直行业自适应增强]
        S5[renwork-kb-governance-auditor<br/>六态置信度审计/防幻觉拦截/30+5测试]
    end

    MCP <--> S1 & S2 & S3 & S4 & S5
    REST <--> S1 & S2 & S3 & S4 & S5

    subgraph "数据存储与知识资产层"
        DualCore1[(企业事实与销售知识核心<br/>00-12, 15-20模块)]
        DualCore2[(客户资产与关系图谱核心<br/>13-14模块 8类实体)]
    end

    S1 & S3 & S4 & S5 <--> DualCore1
    S2 <--> DualCore2
```

## 2. 双核心系统 (Dual Core)

1. **企业事实与销售知识核心**：回答“我们是谁、卖什么、怎样卖”，包含企业背书、产品图谱、制造质检、准入合规、商务政策、异议谈判与 SOP。
2. **客户资产与关系生命周期核心**：回答“客户是谁、买过什么、现在是否有机会、下一步做什么”，由 `Account`, `Contact`, `Opportunity`, `Interaction`, `Transaction`, `ProductInterest`, `Task`, `RiskConsent` 8 类核心实体构建。

## 3. 五层知识架构 (L0 - L4)
- **L0 治理层**：00 总索引与治理、01 来源与权限
- **L1 企业真相层**：02 公司身份、03 品牌口径、04 产品图谱、05 制造质量、06 认证合规、07 商务交付
- **L2 市场决策层**：08 市场情报、09 ICP 画像、10 意图信号、11 竞对差异化、12 产品市场匹配
- **L3 客户与销售执行层**：13 线索背调、14 客户资产生命周期、15 询盘识别、16 方案报价、17 异议谈判、18 销售话术、19 订单售后
- **L4 学习优化层**：20 复盘、指标与持续学习

## 4. 100 分动态客户优先级加权评分
$$\text{Priority Score} = \text{Intent}(25) + \text{Fit}(20) + \text{Power}(20) + \text{Stage}(15) + \text{Value}(10) + \text{Quality}(10) - \text{Risk Penalty}(0 \sim -100)$$

- **S 级黄金商机 (85+)**：24小时内人工 1v1 跟进
- **A 级重点客户 (70-84)**：48小时内个性化推进
- **B 级培育客户 (50-69)**：自动化内容营销
- **C 级沉睡客户 (30-49)**：按旺季节奏批量激活
- **D 级无效排除 (<30)**：停止主动营销
