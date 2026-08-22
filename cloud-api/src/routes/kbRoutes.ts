import { Router, Request, Response } from 'express';
import { KnowledgeBaseEngine } from '../engines/kbEngine.js';

export const kbRouter: Router = Router();
const kbEngine = new KnowledgeBaseEngine();

// POST /api/v1/kb/cold-start
kbRouter.post('/cold-start', (req: Request, res: Response): any => {
  try {
    const { tenant_id, company_name, website_url, profile_summary, industry } = req.body;
    if (!tenant_id || !company_name || !website_url || !profile_summary) {
      return res.status(400).json({ error: 'Missing required parameters: tenant_id, company_name, website_url, profile_summary' });
    }
    const result = kbEngine.coldStart(tenant_id, company_name, website_url, profile_summary, industry);
    return res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/kb/query
kbRouter.post('/query', (req: Request, res: Response): any => {
  try {
    const { query, tenant_id, module, role_view, sensitivity, status, limit } = req.body;
    const cards = kbEngine.searchCards(query || '', {
      tenantId: tenant_id,
      module,
      roleView: role_view,
      sensitivity,
      status,
      limit: limit ? Number(limit) : 20
    });
    return res.json({ success: true, total: cards.length, data: cards });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/kb/cards/:id
kbRouter.get('/cards/:id', (req: Request, res: Response): any => {
  try {
    const card = kbEngine.getCard(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, error: 'Knowledge card not found' });
    }
    return res.json({ success: true, data: card });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/kb/audit/:tenant_id
kbRouter.get('/audit/:tenant_id', (req: Request, res: Response): any => {
  try {
    const audit = kbEngine.auditGovernance(req.params.tenant_id);
    return res.json({ success: true, data: audit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
