export declare class SalesExecutionEngine {
    qualifyInquiry(rawInquiry: string, senderEmail?: string, senderCountry?: string): {
        qualification_status: 'Go' | 'Nurture' | 'Hold' | 'No-go';
        score: number;
        detected_intent: string;
        missing_key_parameters: string[];
        recommended_questions: string[];
        immediate_actions: string[];
        escalation_warning?: string;
    };
    generateTieredQuote(productName: string, basePriceUsd: number, moq: number): {
        product_name: string;
        currency: string;
        tiers: {
            tier_name: string;
            moq: number;
            unit_price_usd: number;
            features: string[];
            lead_time_days: number;
        }[];
        sample_policy: {
            sample_cost_usd: number;
            refund_terms: string;
            lead_time_days: number;
        };
        validity_days: number;
        red_lines: string[];
    };
    handleObjection(objectionCategory: string, customerStatement: string): {
        category: string;
        root_cause_hypothesis: string;
        recommended_strategy: string;
        scripts: {
            zh: string;
            en: string;
        };
        trade_off_options: string[];
        is_escalation_required: boolean;
        escalation_reason?: string;
    };
    triageAftersales(issueDescription: string): {
        severity_level: 'P1' | 'P2' | 'P3';
        sla_response_hours: number;
        lead_team: string;
        evidence_checklist: string[];
        action_protocol: string;
    };
}
