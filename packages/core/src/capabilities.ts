import type { CapabilityResult } from './contracts.js';

const unavailable = (capability: string, warning: string): CapabilityResult => ({
  capability,
  mode: 'unavailable',
  provider: null,
  observed_at: new Date().toISOString(),
  is_verified: false,
  source_refs: [],
  warnings: [warning]
});

export class CapabilityRegistry {
  list() {
    return {
      website_extraction: 'unavailable',
      crm_sync: 'unavailable',
      customs_search: 'unavailable',
      freight_tariff: 'unavailable',
      fx_rates: 'unavailable',
      email_syntax: 'local_heuristic'
    } as const;
  }

  unavailable(name: 'website_extraction' | 'crm_sync' | 'customs_search' | 'freight_tariff' | 'fx_rates'): CapabilityResult {
    return unavailable(name, '尚未配置持牌实时数据提供商；系统拒绝返回模拟数据或伪装成实时结果。');
  }

  checkEmailSyntax(email: string): CapabilityResult<{ email: string; syntax_valid: boolean; domain: string | null; has_mx_records: null; smtp_status: 'unknown'; verification_level: 'syntax_only' }> {
    const syntaxValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
    return {
      capability: 'email_syntax',
      mode: 'local_heuristic',
      provider: 'renwork-local',
      observed_at: new Date().toISOString(),
      is_verified: false,
      source_refs: [],
      warnings: ['仅做格式检查；未执行 MX、SMTP、邮箱所有权或采购决策人身份验证。'],
      data: {
        email,
        syntax_valid: syntaxValid,
        domain: syntaxValid ? email.split('@')[1]!.toLowerCase() : null,
        has_mx_records: null,
        smtp_status: 'unknown',
        verification_level: 'syntax_only'
      }
    };
  }
}
