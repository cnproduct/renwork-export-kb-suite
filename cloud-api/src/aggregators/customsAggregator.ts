import { CustomsBuyerRecord } from './types.js';

// Common NVOCC and freight forwarder keywords to filter out
const LOGISTICS_KEYWORDS = [
  'logistics', 'freight', 'forwarding', 'shipping', 'express', 'transport',
  'lines', 'courier', 'cargo', 'dhl', 'fedex', 'kuehne', 'nagel', 'expeditors',
  'schenker', 'panalpina', 'sinotrans', 'cosco', 'maersk', 'cma cgm', 'msc'
];

export class CustomsAggregator {
  /**
   * Search Customs Bill of Lading (B/L) database with automatic NVOCC filtering
   */
  public searchCustomsBuyers(query: {
    keyword?: string;
    hs_code?: string;
    destination_country?: string;
    min_teu?: number;
  }): {
    total_found: number;
    filtered_forwarders_count: number;
    results: CustomsBuyerRecord[];
  } {
    const mockDatabase: CustomsBuyerRecord[] = [
      {
        buyer_name: 'Pacific Home & Kitchen Goods LLC',
        country: 'US',
        us_tax_id: 'US-948210492',
        total_teu_180d: 48.5,
        shipment_count_180d: 14,
        top_hs_codes: ['6911.10', '6912.00', '7323.93'],
        product_descriptions: ['Ceramic tableware dinnerware set', 'Porcelain bowls', 'Kitchen accessories'],
        observed_suppliers: [
          { supplier_name: 'Fujian Tianya Stone & Ceramics Co.', country: 'CN', share_percentage: 62 },
          { supplier_name: 'Vietnam Ceramic Craft Corp', country: 'VN', share_percentage: 28 },
          { supplier_name: 'Others', country: 'IN', share_percentage: 10 }
        ],
        is_freight_forwarder_filtered: false,
        why_now_signal: '近60天从中国进口柜量增长35%，且更换了第二供货商',
        latest_shipment_date: '2026-08-15'
      },
      {
        buyer_name: 'Nordic Living Retail Group AB',
        country: 'SE',
        total_teu_180d: 32.0,
        shipment_count_180d: 8,
        top_hs_codes: ['9403.60', '9403.20'],
        product_descriptions: ['Wooden home furniture', 'Metal dining table frames'],
        observed_suppliers: [
          { supplier_name: 'Zhejiang Modern Home Craft Ltd', country: 'CN', share_percentage: 80 },
          { supplier_name: 'Polish Woodworks Sp. z o.o.', country: 'PL', share_percentage: 20 }
        ],
        is_freight_forwarder_filtered: false,
        why_now_signal: '核心供货商交期延长，正在寻找具备 FSC 认证的替代供应商',
        latest_shipment_date: '2026-08-10'
      },
      {
        buyer_name: 'Apex Global Logistics & Shipping Inc',
        country: 'US',
        total_teu_180d: 210.0,
        shipment_count_180d: 58,
        top_hs_codes: ['6911.10', '9403.60'],
        product_descriptions: ['Consolidated general cargo'],
        observed_suppliers: [{ supplier_name: 'Various forwarders', country: 'CN', share_percentage: 100 }],
        is_freight_forwarder_filtered: true,
        latest_shipment_date: '2026-08-18'
      },
      {
        buyer_name: 'Al-Futtaim Home Living W.L.L.',
        country: 'AE',
        total_teu_180d: 65.0,
        shipment_count_180d: 19,
        top_hs_codes: ['6911.10', '7323.93', '3924.10'],
        product_descriptions: ['Luxury ceramic kitchenware', 'Stainless steel cookware', 'Plastic storage containers'],
        observed_suppliers: [
          { supplier_name: 'Guangdong Winner Tableware Co.', country: 'CN', share_percentage: 70 },
          { supplier_name: 'Turkish Ceramic Export AS', country: 'TR', share_percentage: 30 }
        ],
        is_freight_forwarder_filtered: false,
        why_now_signal: '海湾地区新开3家门店，正在扩充中高档餐具SKU',
        latest_shipment_date: '2026-08-12'
      }
    ];

    let filtered = mockDatabase;

    // Filter forwarders
    const rawCount = filtered.length;
    filtered = filtered.filter(item => {
      const lowerName = item.buyer_name.toLowerCase();
      const isForwarder = LOGISTICS_KEYWORDS.some(kw => lowerName.includes(kw));
      return !isForwarder && !item.is_freight_forwarder_filtered;
    });
    const filteredForwardersCount = rawCount - filtered.length;

    // Keyword / country filter
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      filtered = filtered.filter(item =>
        item.buyer_name.toLowerCase().includes(kw) ||
        item.product_descriptions.some(p => p.toLowerCase().includes(kw)) ||
        item.top_hs_codes.some(hs => hs.includes(kw))
      );
    }

    if (query.destination_country) {
      filtered = filtered.filter(item => item.country.toUpperCase() === query.destination_country?.toUpperCase());
    }

    if (query.min_teu) {
      filtered = filtered.filter(item => item.total_teu_180d >= (query.min_teu || 0));
    }

    return {
      total_found: filtered.length,
      filtered_forwarders_count: filteredForwardersCount,
      results: filtered
    };
  }
}
