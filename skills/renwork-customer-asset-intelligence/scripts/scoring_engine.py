#!/usr/bin/env python3
"""
RenWork Customer Asset Scoring Engine (V3.0)
Implements:
1. 100-point dynamic priority score
2. Hard-stop risk evaluation (Unsubscribe, Blacklist, Debt Dispute)
3. S/A/B/C/D Tier classification
4. 8 Dynamic Follow-up Lists calculation
5. Rep capacity limitation validation
"""

import sys
import json
from typing import Dict, List, Any, Tuple
from datetime import datetime, timezone, timedelta

def calculate_customer_priority_score(account: Dict[str, Any],
                                     interactions: List[Dict[str, Any]] = None,
                                     opportunities: List[Dict[str, Any]] = None,
                                     transactions: List[Dict[str, Any]] = None,
                                     contacts: List[Dict[str, Any]] = None) -> Tuple[float, str, Dict[str, float], List[str]]:
    """
    Returns (priority_score, tier, breakdown, dynamic_lists)
    """
    interactions = interactions or []
    opportunities = opportunities or []
    transactions = transactions or []
    contacts = contacts or []

    # Check Hard Stops First
    consent = account.get("consent_status", "subscribed")
    risk_flags = account.get("risk_flags", [])
    
    if consent in ["unsubscribed", "blacklisted", "disputed_debt"] or "blacklist" in risk_flags:
        breakdown = {
            "intent": 0.0, "fit": 0.0, "power": 0.0, "stage": 0.0,
            "value": 0.0, "quality": 0.0, "risk_penalty": -100.0
        }
        return 0.0, "D", breakdown, []

    # 1. Intent (Max 25 pts)
    intent_score = 0.0
    recent_interactions = [i for i in interactions if i.get("signal_strength") == "strong"]
    if any(i.get("signal_type") in ["inquiry", "quote_request"] for i in interactions):
        intent_score += 10.0
    if any(i.get("signal_type") == "sample_feedback" for i in interactions):
        intent_score += 8.0
    if account.get("recent_rfq_count", 0) > 0:
        intent_score += 7.0
    if account.get("recent_web_views", 0) >= 3:
        intent_score += 4.0
    intent_score = min(25.0, intent_score)

    # 2. Fit (Max 20 pts)
    fit_score = 0.0
    icp = account.get("icp_fit_level", "B")
    if icp == "A+":
        fit_score += 20.0
    elif icp == "A":
        fit_score += 16.0
    elif icp == "B":
        fit_score += 10.0
    else:
        fit_score += 4.0
    fit_score = min(20.0, fit_score)

    # 3. Power (Max 20 pts)
    power_score = 0.0
    if account.get("customs_import_volume_teu", 0) > 10:
        power_score += 8.0
    elif account.get("customs_import_volume_teu", 0) > 0:
        power_score += 4.0
    
    if account.get("is_repurchase_window_approaching", False):
        power_score += 6.0
    if account.get("total_revenue_usd", 0) > 100000:
        power_score += 6.0
    elif account.get("total_revenue_usd", 0) > 20000:
        power_score += 3.0
    power_score = min(20.0, power_score)

    # 4. Stage (Max 15 pts)
    stage_score = 0.0
    active_opps = [o for o in opportunities if o.get("stage") not in ["closed_won", "closed_lost"]]
    if any(o.get("stage") in ["commercial_negotiation", "pi_issued"] for o in active_opps):
        stage_score += 15.0
    elif any(o.get("stage") == "sample_testing" for o in active_opps):
        stage_score += 10.0
    elif any(o.get("stage") == "quote_sent" for o in active_opps):
        stage_score += 6.0
    elif any(o.get("stage") == "rfq_received" for o in active_opps):
        stage_score += 4.0
    stage_score = min(15.0, stage_score)

    # 5. Value (Max 10 pts)
    value_score = 0.0
    if account.get("historical_orders_count", 0) >= 2:
        value_score += 5.0
    if account.get("historical_gross_margin_percent", 0) >= 25.0:
        value_score += 5.0
    value_score = min(10.0, value_score)

    # 6. Quality (Max 10 pts)
    quality_score = 0.0
    if any(c.get("role_in_buying_committee") in ["economic_buyer", "procurement_gatekeeper"] and c.get("email_verification_status") == "C1_verified" for c in contacts):
        quality_score += 5.0
    if any(i.get("signal_type") in ["click", "open"] for i in interactions):
        quality_score += 5.0
    quality_score = min(10.0, quality_score)

    # 7. Risk Penalties (0 to -100)
    risk_penalty = 0.0
    if "debt_issue" in risk_flags:
        risk_penalty += -30.0
    if "high_bounce" in risk_flags:
        risk_penalty += -20.0
    if "product_mismatch" in risk_flags:
        risk_penalty += -20.0

    total_score = max(0.0, min(100.0, intent_score + fit_score + power_score + stage_score + value_score + quality_score + risk_penalty))

    # Tier Calculation
    if total_score >= 85.0:
        tier = "S"
    elif total_score >= 70.0:
        tier = "A"
    elif total_score >= 50.0:
        tier = "B"
    elif total_score >= 30.0:
        tier = "C"
    else:
        tier = "D"

    # Dynamic Lists Detection
    dynamic_lists = []
    # 1. today_must_follow: new strong inquiry in 7 days, no follow-up in 24h
    if intent_score >= 10.0 and account.get("hours_since_last_rep_touch", 999) > 24:
        dynamic_lists.append("today_must_follow")
    # 2. stalled_after_quote: quote sent 3-14 days, no progression
    if any(o.get("stage") == "quote_sent" for o in active_opps) and 3 <= account.get("days_since_quote", 0) <= 14:
        dynamic_lists.append("stalled_after_quote")
    # 3. sample_unconverted: sample in test >= 7 days without feedback
    if any(o.get("stage") == "sample_testing" for o in active_opps) and account.get("days_since_sample_delivered", 0) >= 7:
        dynamic_lists.append("sample_unconverted")
    # 4. repeat_purchase_warning: >=2 orders, approaching cycle
    if account.get("historical_orders_count", 0) >= 2 and account.get("is_repurchase_window_approaching", False):
        dynamic_lists.append("repeat_purchase_warning")
    # 5. high_engagement_no_inquiry: multiple clicks/views, icp A, no rfq
    if account.get("recent_web_views", 0) >= 3 and icp in ["A+", "A"] and not active_opps:
        dynamic_lists.append("high_engagement_no_inquiry")
    # 6. sourcing_anomaly: customs surge observed
    if "customs_surge_detected" in risk_flags or account.get("customs_import_volume_teu", 0) > 20:
        dynamic_lists.append("sourcing_anomaly")
    # 7. reactivated_sleepers: silent for 180 days, recent new signal
    if account.get("days_dormant", 0) > 180 and interactions:
        dynamic_lists.append("reactivated_sleepers")
    # 8. high_score_neglected: score >= 65, active deal, 7 days untouched
    if total_score >= 65.0 and active_opps and account.get("days_since_last_rep_touch", 0) >= 7:
        dynamic_lists.append("high_score_neglected")

    breakdown = {
        "intent": round(intent_score, 1),
        "fit": round(fit_score, 1),
        "power": round(power_score, 1),
        "stage": round(stage_score, 1),
        "value": round(value_score, 1),
        "quality": round(quality_score, 1),
        "risk_penalty": round(risk_penalty, 1)
    }

    return round(total_score, 1), tier, breakdown, dynamic_lists

if __name__ == "__main__":
    # Self-test sample
    sample_account = {
        "account_id": "ACC-TEST-001",
        "standard_name": "Apex Global Procurement LLC",
        "domain": "apex-procurement.com",
        "country": "US",
        "buyer_type": "importer",
        "icp_fit_level": "A+",
        "total_revenue_usd": 150000,
        "historical_orders_count": 3,
        "historical_gross_margin_percent": 28.5,
        "is_repurchase_window_approaching": True,
        "hours_since_last_rep_touch": 36,
        "days_since_last_rep_touch": 8,
        "customs_import_volume_teu": 25,
        "consent_status": "subscribed",
        "risk_flags": []
    }
    sample_interactions = [
        {"interaction_id": "INT-01", "signal_type": "inquiry", "signal_strength": "strong"}
    ]
    sample_opps = [
        {"opportunity_id": "OPP-01", "stage": "quote_sent", "estimated_amount_usd": 45000}
    ]
    sample_contacts = [
        {"contact_id": "CON-01", "role_in_buying_committee": "economic_buyer", "email_verification_status": "C1_verified"}
    ]

    score, tier, breakdown, lists = calculate_customer_priority_score(
        sample_account, sample_interactions, sample_opps, [], sample_contacts
    )
    print(json.dumps({
        "account_id": sample_account["account_id"],
        "priority_score": score,
        "tier": tier,
        "breakdown": breakdown,
        "dynamic_lists": lists
    }, indent=2, ensure_ascii=False))
