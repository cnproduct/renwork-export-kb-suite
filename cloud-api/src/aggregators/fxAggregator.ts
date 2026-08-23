import { FxConversionResult } from './types.js';

const BASE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  CNY: 0.1385,  // 1 USD = ~7.22 CNY
  EUR: 1.0850,  // 1 EUR = 1.085 USD
  GBP: 1.2850,  // 1 GBP = 1.285 USD
  JPY: 0.0068,  // 1 USD = ~147 JPY
  AED: 0.2723,  // 1 USD = 3.6725 AED (Pegged)
  VND: 0.000039, // 1 USD = ~25,600 VND
  THB: 0.0292   // 1 USD = ~34.2 THB
};

export class FxAggregator {
  /**
   * Convert currency and compute margin protection price
   */
  public convertCurrency(params: {
    amount: number;
    base_currency: string;
    target_currency: string;
    hedge_buffer_percentage?: number;
    min_profit_margin_percentage?: number;
  }): FxConversionResult {
    const base = params.base_currency.toUpperCase();
    const target = params.target_currency.toUpperCase();
    const amount = params.amount || 0;
    const bufferPct = params.hedge_buffer_percentage ?? 2.0; // default 2% hedge buffer against FX fluctuation
    const minMarginPct = params.min_profit_margin_percentage ?? 15.0;

    const baseToUsd = BASE_RATES_TO_USD[base] || 1.0;
    const targetToUsd = BASE_RATES_TO_USD[target] || 1.0;

    // Exchange rate: 1 Base = X Target
    const rate = baseToUsd / targetToUsd;
    const convertedRaw = amount * rate;

    // Apply hedge buffer
    const hedgedConversion = convertedRaw * (1 + bufferPct / 100);

    // Margin Floor Price
    const marginFloor = hedgedConversion * (1 / (1 - minMarginPct / 100));

    return {
      base_currency: base,
      target_currency: target,
      exchange_rate: parseFloat(rate.toFixed(4)),
      converted_amount: parseFloat(hedgedConversion.toFixed(2)),
      margin_floor_price: parseFloat(marginFloor.toFixed(2)),
      hedged_buffer_percentage: bufferPct,
      timestamp: new Date().toISOString()
    };
  }
}
