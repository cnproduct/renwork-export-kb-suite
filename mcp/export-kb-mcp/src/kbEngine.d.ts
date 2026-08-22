import { KnowledgeCard, KnowledgeModule, RoleView, SensitivityLevel, KnowledgeStatus } from './types.js';
export declare class KnowledgeBaseEngine {
    private cards;
    constructor();
    coldStart(tenantId: string, companyName: string, websiteUrl: string, profileSummary: string, industry?: string): {
        tenantId: string;
        modulesCreated: number;
        cardsCount: number;
        cheatSheet: any;
        gapConfirmationQueue: any[];
    };
    searchCards(query: string, options?: {
        tenantId?: string;
        module?: KnowledgeModule;
        roleView?: RoleView;
        sensitivity?: SensitivityLevel;
        status?: KnowledgeStatus;
        limit?: number;
    }): KnowledgeCard[];
    getCard(kbId: string): KnowledgeCard | undefined;
    saveCard(card: KnowledgeCard): void;
    auditGovernance(tenantId: string): {
        totalCards: number;
        statusDistribution: Record<string, number>;
        sensitivityDistribution: Record<string, number>;
        publicClaimApprovedRate: string;
        unverifiedPendingGaps: number;
    };
    private seedDefaultCards;
}
