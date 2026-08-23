import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { kbRouter } from './routes/kbRoutes.js';
import { customerRouter } from './routes/customerRoutes.js';
import { salesRouter } from './routes/salesRoutes.js';
import { auditRouter } from './routes/auditRoutes.js';
import { aggregatorRouter } from './routes/aggregatorRoutes.js';

const app: Express = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Healthcheck
app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'renwork-export-kb-cloud-api', version: '3.0.0', timestamp: new Date().toISOString() });
});

// API Info / Swagger JSON spec
app.get('/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'RenWork Export Enterprise AI Knowledge Base & Cloud Aggregators API',
      version: '3.0.0',
      description: 'Production Cloud API supporting 00–20 Knowledge Base, Customer 360, 100-pt Dynamic Scoring, 8 Dynamic Lists, Sales Execution, and 6 Cloud Aggregators based on V3.0 Framework.'
    },
    paths: {
      '/api/v1/kb/cold-start': { post: { summary: 'Cold start 00-20 modules knowledge base' } },
      '/api/v1/kb/query': { post: { summary: 'Search and query knowledge cards' } },
      '/api/v1/customers/score': { post: { summary: 'Calculate 100-point dynamic customer score' } },
      '/api/v1/customers/360/{accountId}': { get: { summary: 'Get Customer 360 view' } },
      '/api/v1/customers/dynamic-lists/{tenant_id}': { get: { summary: 'Get 8 Dynamic Follow-up lists' } },
      '/api/v1/sales/qualify': { post: { summary: 'Qualify raw B2B inquiry with 10-step checklist' } },
      '/api/v1/sales/quote': { post: { summary: 'Generate Good/Better/Best tiered quote' } },
      '/api/v1/sales/objection': { post: { summary: 'Handle customer objections & check escalation triggers' } },
      '/api/v1/audit/benchmark': { post: { summary: 'Run 30 QA + 5 negative test benchmark' } },
      '/api/v1/cloud-aggregators/customs/search': { post: { summary: 'Query real customs buyers & filter forwarders' } },
      '/api/v1/cloud-aggregators/crm/sync': { post: { summary: 'Bi-directional sync OKKI / B2B CRM data' } },
      '/api/v1/cloud-aggregators/web-scraper/extract': { post: { summary: 'Extract structured facts from enterprise website' } },
      '/api/v1/cloud-aggregators/email/verify': { post: { summary: 'Verify overseas B2B decision maker email (C1/C2/C0)' } },
      '/api/v1/cloud-aggregators/trade/estimate': { post: { summary: 'Estimate duty rates, ocean freight & Incoterms' } },
      '/api/v1/cloud-aggregators/fx/convert': { post: { summary: 'Real-time multi-currency conversion with margin floor' } }
    }
  });
});

// Mount Routes
app.use('/api/v1/kb', kbRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/sales', salesRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/cloud-aggregators', aggregatorRouter);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` RenWork Export KB Cloud API V3.0 running on port ${PORT}`);
    console.log(` Healthcheck: http://localhost:${PORT}/healthz`);
    console.log(` OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
    console.log(` Cloud Aggregators: http://localhost:${PORT}/api/v1/cloud-aggregators/*`);
    console.log(`=======================================================`);
  });
}

export default app;
