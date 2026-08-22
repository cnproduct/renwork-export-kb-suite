import { Router, Request, Response } from 'express';
import { SalesExecutionEngine } from '../engines/salesEngine.js';

export const salesRouter: Router = Router();
const salesEngine = new SalesExecutionEngine();

// POST /api/v1/sales/qualify
salesRouter.post('/qualify', (req: Request, res: Response): any => {
  try {
    const { raw_inquiry, sender_email, sender_country } = req.body;
    if (!raw_inquiry) {
      return res.status(400).json({ error: 'Missing required parameter: raw_inquiry' });
    }
    const result = salesEngine.qualifyInquiry(raw_inquiry, sender_email, sender_country);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/sales/quote
salesRouter.post('/quote', (req: Request, res: Response): any => {
  try {
    const { product_name, base_price_usd, moq } = req.body;
    if (!product_name || base_price_usd === undefined || moq === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: product_name, base_price_usd, moq' });
    }
    const result = salesEngine.generateTieredQuote(product_name, Number(base_price_usd), Number(moq));
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/sales/objection
salesRouter.post('/objection', (req: Request, res: Response): any => {
  try {
    const { objection_category, customer_statement } = req.body;
    if (!objection_category || !customer_statement) {
      return res.status(400).json({ error: 'Missing required parameters: objection_category, customer_statement' });
    }
    const result = salesEngine.handleObjection(objection_category, customer_statement);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/sales/aftersales-triage
salesRouter.post('/aftersales-triage', (req: Request, res: Response): any => {
  try {
    const { issue_description } = req.body;
    if (!issue_description) {
      return res.status(400).json({ error: 'Missing required parameter: issue_description' });
    }
    const result = salesEngine.triageAftersales(issue_description);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
