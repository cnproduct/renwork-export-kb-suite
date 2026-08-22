import { Router, Request, Response } from 'express';
import { CustomerAssetEngine } from '../engines/customerEngine.js';

export const customerRouter: Router = Router();
const customerEngine = new CustomerAssetEngine();

// POST /api/v1/customers/score
customerRouter.post('/score', (req: Request, res: Response): any => {
  try {
    const { account, interactions, opportunities, contacts } = req.body;
    if (!account) {
      return res.status(400).json({ error: 'Missing required parameter: account' });
    }
    const scoreResult = customerEngine.scoreAccount(account, interactions || [], opportunities || [], contacts || []);
    return res.json({ success: true, data: scoreResult });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/customers/360/:accountId
customerRouter.get('/360/:accountId', (req: Request, res: Response): any => {
  try {
    const data = customerEngine.getCustomer360(req.params.accountId);
    if (!data.account) {
      return res.status(404).json({ success: false, error: 'Customer account not found' });
    }
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/customers/dynamic-lists/:tenant_id
customerRouter.get('/dynamic-lists/:tenant_id', (req: Request, res: Response): any => {
  try {
    const lists = customerEngine.getDynamicLists(req.params.tenant_id);
    return res.json({ success: true, data: lists });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/customers/batch-clean
customerRouter.post('/batch-clean', (req: Request, res: Response): any => {
  try {
    const { raw_records } = req.body;
    if (!Array.isArray(raw_records)) {
      return res.status(400).json({ error: 'raw_records must be an array' });
    }
    const result = customerEngine.batchCleanAndDeduplicate(raw_records);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
