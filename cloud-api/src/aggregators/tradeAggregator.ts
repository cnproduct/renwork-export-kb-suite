import { TradeFreightEstimate } from './types.js';

export class TradeAggregator {
  /**
   * Estimate duty rates, ocean freight and Incoterms responsibilities
   */
  public estimateTradeAndFreight(params: {
    origin_port: string;
    destination_port: string;
    hs_code: string;
    incoterm: 'EXW' | 'FOB' | 'CIF' | 'DDP';
  }): TradeFreightEstimate {
    const hs = params.hs_code || '6911.10';
    let dutyRate = 5.5; // default MFN

    if (params.destination_port.toLowerCase().includes('los angeles') || params.destination_port.toLowerCase().includes('new york')) {
      dutyRate = 6.0 + 25.0; // Section 301 tariff
    } else if (params.destination_port.toLowerCase().includes('rotterdam') || params.destination_port.toLowerCase().includes('hamburg')) {
      dutyRate = 4.2;
    } else if (params.destination_port.toLowerCase().includes('jebel ali') || params.destination_port.toLowerCase().includes('dubai')) {
      dutyRate = 5.0;
    }

    const term = params.incoterm || 'FOB';
    let responsibilities = {
      term,
      seller_covers: ['工厂生产与包装', '出口商检报关', '国内内陆拖车至起运港码头', '起运港港杂费(THC/ORC)'],
      buyer_covers: ['国际海运费', '海运货物运输保险', '目的港清关与关税', '目的港内陆配送至仓库'],
      risk_transfer_point: '货物在装运港装上船越过船舷时（装运港船上）'
    };

    if (term === 'EXW') {
      responsibilities = {
        term: 'EXW',
        seller_covers: ['在工厂/仓库准备好货物供提货'],
        buyer_covers: ['工厂装车', '出口报关', '起运港港杂', '海运费', '保险', '目的港清关与关税', '末端送货'],
        risk_transfer_point: '在卖方工厂或指定地点将货物移交买方处置时'
      };
    } else if (term === 'CIF') {
      responsibilities = {
        term: 'CIF',
        seller_covers: ['工厂生产与包装', '出口报关', '国内拖车与港杂', '国际海运干线运费', '海运货运险(最低险险别)'],
        buyer_covers: ['目的港码头操作费(DTHC)', '目的港进口清关与关税', '目的港内陆运输'],
        risk_transfer_point: '货物在起运港装上船时（注意：风险在装船时已转移给买方，卖方仅承担至目的港运费和保险）'
      };
    } else if (term === 'DDP') {
      responsibilities = {
        term: 'DDP',
        seller_covers: ['全链路门到门所有费用（出口报关、海运、保险、目的港清关、代缴进口关税/增值税、末端派送入库）'],
        buyer_covers: ['在目的港最终仓库卸货'],
        risk_transfer_point: '货物在目的港指定目的地备妥供买方卸货时（卖方承担最大责任与全部风险）'
      };
    }

    return {
      origin_port: params.origin_port || 'Shenzhen, China',
      destination_port: params.destination_port || 'Los Angeles, USA',
      hs_code: hs,
      estimated_duty_rate_percentage: dutyRate,
      ocean_freight_20gp_usd: 2450,
      ocean_freight_40hq_usd: 3850,
      estimated_transit_days: 18,
      incoterm_responsibilities: responsibilities
    };
  }
}
