import type { AuthenticatedPrincipal } from '@renwork/export-growth-core';

export interface ApiConfig {
  port: number;
  apiKeys: Map<string, AuthenticatedPrincipal>;
  corsOrigins: string[];
}

export function parseApiKeys(raw = process.env.RENWORK_API_KEYS ?? ''): Map<string, AuthenticatedPrincipal> {
  const keys = new Map<string, AuthenticatedPrincipal>();
  for (const entry of raw.split(',').map((part) => part.trim()).filter(Boolean)) {
    const [key, tenant, roles = 'admin'] = entry.split(':');
    if (!key || key.length < 12 || !tenant) throw new Error('RENWORK_API_KEYS entries must use key:tenant:role1|role2 and keys must contain at least 12 characters');
    keys.set(key, { subject: `api-key:${key.slice(0, 4)}`, tenant_id: tenant, roles: roles.split('|').filter(Boolean) });
  }
  return keys;
}

export function loadConfig(): ApiConfig {
  return {
    port: Number(process.env.PORT ?? 8080),
    apiKeys: parseApiKeys(),
    corsOrigins: (process.env.RENWORK_CORS_ORIGINS ?? 'http://localhost:8080,http://localhost:4173').split(',').map((origin) => origin.trim()).filter(Boolean)
  };
}
