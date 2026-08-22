import { CustomerAccount, CustomerContact, Opportunity, Interaction, CustomerTier } from './types.js';
export declare class CustomerAssetEngine {
    private accounts;
    private contacts;
    private opportunities;
    private interactions;
    constructor();
    scoreAccount(account: Partial<CustomerAccount>, interactions?: Interaction[], opps?: Opportunity[], contacts?: CustomerContact[]): {
        priority_score: number;
        tier: CustomerTier;
        score_breakdown: CustomerAccount['score_breakdown'];
        dynamic_lists: string[];
    };
    getCustomer360(accountId: string): {
        account?: CustomerAccount;
        contacts: CustomerContact[];
        opportunities: Opportunity[];
        interactions: Interaction[];
    };
    getDynamicLists(tenantId: string): Record<string, CustomerAccount[]>;
    batchCleanAndDeduplicate(rawRecords: any[]): {
        cleanedCount: number;
        duplicatesMerged: number;
        accountsCreated: CustomerAccount[];
    };
    private seedDemoCustomers;
}
