import { Router, Request, Response } from 'express';
import { CustomsAggregator } from '../aggregators/customsAggregator.js';
import { CrmAggregator } from '../aggregators/crmAggregator.js';
import { WebScraperAggregator } from '../aggregators/webScraperAggregator.js';
import { EmailVerifyAggregator } from '../aggregators/emailVerifyAggregator.js';
import { TradeAggregator } from '../aggregators/tradeAggregator.js';
import { FxAggregator } from '../aggregators/fxAggregator.js';

export const aggregatorRouter: Router = Router();

const customsAggregator = new CustomsAggregator();
const crmAggregator = new CrmAggregator();
const webScraperAggregator = new WebScraperAggregator();
const emailVerifyAggregator = new EmailVerifyAggregator();
const tradeAggregator = new TradeAggregator();
const fxAggregator = new FxAggregator();

/**
 * POST /api/v1/cloud-aggregators/customs/search
 */
aggregatorRouter.post('/customs/search', (req: Request, res: Response) => {
  try {
    const { keyword, hs_code, destination_country, min_teu } = req.body;
    const data = customsAggregator.searchCustomsBuyers({ keyword, hs_code, destination_country, min_teu });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/cloud-aggregators/crm/sync
 */
aggregatorRouter.post('/crm/sync', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.tenant_id || !payload.accounts) {
      return res.status(400).json({ success: false, error: 'tenant_id and accounts are required' });
    }
    const data = crmAggregator.syncCrmData(payload);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/cloud-aggregators/web-scraper/extract
 */
aggregatorRouter.post('/web-scraper/extract', (req: Request, res: Response) => {
  try {
    const { url, html_snippet } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'url is required' });
    }
    const data = webScraperAggregator.extractWebsiteFacts(url, html_snippet);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/cloud-aggregators/email/verify
 */
aggregatorRouter.post('/email/verify', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }
    const data = emailVerifyAggregator.verifyEmail(email);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/cloud-aggregators/trade/estimate
 */
aggregatorRouter.post('/trade/estimate', (req: Request, res: Response) => {
  try {
    const { origin_port, destination_port, hs_code, incoterm } = req.body;
    const data = tradeAggregator.estimateTradeAndFreight({
      origin_port: origin_port || 'Shenzhen, China',
      destination_port: destination_port || 'Los Angeles, USA',
      hs_code: hs_code || '6911.10',
      incoterm: incoterm || 'FOB'
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/cloud-aggregators/fx/convert
 */
aggregatorRouter.post('/fx/convert', (req: Request, res: Response) => {
  try {
    const { amount, base_currency, target_currency, hedge_buffer_percentage, min_profit_margin_percentage } = req.body;
    if (amount === undefined || !base_currency || !target_currency) {
      return res.status(400).json({ success: false, error: 'amount, base_currency and target_currency are required' });
    }
    const data = fxAggregator.convertCurrency({
      amount: Number(amount),
      base_currency,
      target_currency,
      hedge_buffer_percentage: hedge_buffer_percentage !== undefined ? Number(hedge_buffer_percentage) : undefined,
      min_profit_margin_percentage: min_profit_margin_percentage !== undefined ? Number(min_profit_margin_percentage) : undefined
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
