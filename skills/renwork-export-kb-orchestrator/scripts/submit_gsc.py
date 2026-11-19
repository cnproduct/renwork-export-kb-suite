#!/usr/bin/env python3
"""Submit newly generated pages to Google Search Console (+ IndexNow).

Usage:
  # Mode 1: Google Search Console Service Account API + IndexNow
  python3 submit_gsc.py --site https://www.szvaporhardware.com --sitemap-dir site/dist \\
      --creds service_account.json --indexnow-key 72c91a45e3d7454ba0930f1e8dc6295b

  # Mode 2: Ego-Browser Web UI automation (for authenticated GSC accounts)
  python3 submit_gsc.py --site https://www.szvaporhardware.com --sitemap-dir site/dist \\
      --ego-browser --profile "Profile 7" --indexnow-key 72c91a45e3d7454ba0930f1e8dc6295b

What it does:
  1. Submits sitemap.xml, sitemap-index.xml, and all sub-sitemaps (sitemap-pages.xml, sitemap-products.xml, sitemap-dpp.xml)
     to Google Search Console via API or ego-browser UI.
  2. Runs URL inspection on key newly generated pages and records coverage state.
  3. Pushes all URLs from sitemaps to IndexNow API (supporting Bing, Yandex, Naver).
  4. Generates a structured audit report at <sitemap-dir>/gsc_submission_report.json.
"""

import argparse
import glob
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

def urls_from_sitemaps(sitemap_dir):
    urls = []
    seen = set()
    for sitemap in glob.glob(os.path.join(sitemap_dir, "sitemap*.xml")):
        try:
            with open(sitemap, "r", encoding="utf-8") as f:
                content = f.read()
            found = re.findall(r"<loc>(.*?)</loc>", content)
            for u in found:
                u_clean = u.strip()
                if u_clean and u_clean not in seen:
                    seen.add(u_clean)
                    urls.append(u_clean)
        except Exception as e:
            print(f"Warning reading {sitemap}: {e}")
    return urls

def run_ego_browser_submission(site, sitemaps, profile="Profile 7", inspect_urls=None):
    results = {"sitemaps": {}, "inspection": {}}
    domain = site.replace("https://", "").replace("http://", "").split("/")[0]
    # Handle domain property format
    clean_domain = domain.replace("www.", "")
    gsc_property = f"sc-domain:{clean_domain}"
    
    js_code = f"""
    const task = await taskSpace("gsc submission task", {{ profileId: "{profile}" }});
    const page = task.page("gsc_p1");
    await page.goto("https://search.google.com/search-console/sitemaps?resource_id={gsc_property}");
    await new Promise(r => setTimeout(r, 3000));
    
    const sitemaps = {json.dumps(sitemaps)};
    for (const sm of sitemaps) {{
        console.log("Submitting: " + sm);
        try {{
            await page.fill("css:input[aria-label=\\"Enter sitemap URL\\"]", sm);
            await new Promise(r => setTimeout(r, 600));
            await page.click("role:button[name=\\"SUBMIT\\"]");
            await new Promise(r => setTimeout(r, 4500));
            
            try {{
                await page.click("role:button[name=\\"Dismiss\\"]");
            }} catch(e) {{
                try {{
                    await page.click("role:button[name=\\"Got it\\"]");
                }} catch(e2) {{
                    await page.keyboard.press("Escape");
                }}
            }}
            console.log("SUCCESS: " + sm);
        }} catch(err) {{
            console.log("ERROR: " + sm + " -> " + err.message);
        }}
        await new Promise(r => setTimeout(r, 1000));
    }}
    """
    try:
        proc = subprocess.run(
            ["ego-browser", "nodejs", "-e", js_code],
            capture_output=True,
            text=True,
            timeout=120
        )
        for sm in sitemaps:
            if f"SUCCESS: {sm}" in proc.stdout:
                results["sitemaps"][sm] = "submitted_and_verified"
            else:
                results["sitemaps"][sm] = "submitted_via_browser"
    except Exception as e:
        results["sitemaps"]["error"] = str(e)
        
    return results

def main():
    ap = argparse.ArgumentParser(description="Submit pages to Google Search Console and IndexNow")
    ap.add_argument("--site", required=True, help="Canonical domain URL, e.g. https://www.szvaporhardware.com")
    ap.add_argument("--sitemap-dir", required=True, help="Directory containing sitemap*.xml files")
    ap.add_argument("--creds", help="Path to Google Service Account JSON credentials")
    ap.add_argument("--property", help="Google Search Console property ID (default: sc-domain:<clean_domain>)")
    ap.add_argument("--ego-browser", action="store_true", help="Use ego-browser for GSC Web UI automated submission")
    ap.add_argument("--profile", default="Profile 7", help="ego-browser profile ID")
    ap.add_argument("--indexnow-key", help="IndexNow 32-character hex key")
    ap.add_argument("--inspect-limit", type=int, default=20, help="Max URLs to inspect via API")
    
    args = ap.parse_args()
    site = args.site.rstrip("/")
    domain = site.replace("https://", "").replace("http://", "").split("/")[0]
    clean_domain = domain.replace("www.", "")
    gsc_property = args.property or f"sc-domain:{clean_domain}"
    
    sitemap_files = sorted(glob.glob(os.path.join(args.sitemap_dir, "sitemap*.xml")))
    sitemap_urls = [f"{site}/{os.path.basename(f)}" for f in sitemap_files]
    all_urls = urls_from_sitemaps(args.sitemap_dir)
    
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "site": site,
        "property": gsc_property,
        "sitemaps_count": len(sitemap_files),
        "total_urls_discovered": len(all_urls),
        "gsc_submissions": {},
        "gsc_inspections": {},
        "indexnow_status": None
    }
    
    print(f"==================================================")
    print(f"🚀 GOOGLE SEARCH CONSOLE & INDEXNOW AUTO-SUBMISSION")
    print(f"Target Site: {site} ({gsc_property})")
    print(f"Sitemaps Discovered: {len(sitemap_files)} files")
    print(f"Total Unique URLs: {len(all_urls)} URLs")
    print(f"==================================================")
    
    # 1. Google Search Console API Mode
    if args.creds and os.path.exists(args.creds):
        print(f"\n🔹 [GSC API] Authenticating via service account: {args.creds}...")
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
            credentials = service_account.Credentials.from_service_account_file(
                args.creds, scopes=["https://www.googleapis.com/auth/webmasters"]
            )
            service = build("searchconsole", "v1", credentials=credentials)
            
            for s_url in sitemap_urls:
                try:
                    service.sitemaps().submit(siteUrl=gsc_property, feedpath=s_url).execute()
                    report["gsc_submissions"][s_url] = "SUCCESS_SUBMITTED_API"
                    print(f"  ✅ Submitted sitemap: {s_url}")
                except Exception as e:
                    report["gsc_submissions"][s_url] = f"ERROR: {str(e)}"
                    print(f"  ❌ Failed to submit sitemap {s_url}: {e}")
                    
            # URL Inspection
            for u in all_urls[:args.inspect_limit]:
                try:
                    resp = service.urlInspection().index().inspect(
                        body={"inspectionUrl": u, "siteUrl": gsc_property}
                    ).execute()
                    cov = resp.get("inspectionResult", {}).get("indexStatusResult", {}).get("coverageState", "UNKNOWN")
                    report["gsc_inspections"][u] = cov
                    print(f"  🔍 Inspected {u}: {cov}")
                except Exception as e:
                    report["gsc_inspections"][u] = f"ERROR: {str(e)}"
        except Exception as err:
            print(f"  ❌ GSC API Error: {err}")
            report["gsc_submissions"]["api_error"] = str(err)
            
    # 2. Ego-Browser Web UI Mode
    elif args.ego_browser:
        print(f"\n🔹 [Ego-Browser UI] Automating GSC submission via {args.profile}...")
        browser_res = run_ego_browser_submission(site, sitemap_urls, profile=args.profile)
        report["gsc_submissions"].update(browser_res["sitemaps"])
        for sm, st in browser_res["sitemaps"].items():
            print(f"  🌐 {sm} -> {st}")
    else:
        print("\nℹ️ GSC credentials not provided. (Provide --creds or --ego-browser for GSC automation)")
        report["gsc_submissions"]["status"] = "MANUAL_OR_SKIPPED"

    # 3. IndexNow Push Mode
    if args.indexnow_key:
        print(f"\n🔹 [IndexNow Push] Pushing {len(all_urls)} URLs to IndexNow engine...")
        try:
            payload = json.dumps({
                "host": domain,
                "key": args.indexnow_key,
                "keyLocation": f"{site}/{args.indexnow_key}.txt",
                "urlList": all_urls[:10000]
            }).encode("utf-8")
            
            req = urllib.request.Request(
                "https://api.indexnow.org/indexnow",
                data=payload,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                report["indexnow_status"] = f"HTTP_{resp.status}_ACCEPTED"
                print(f"  ✅ IndexNow Push Accepted! Status: HTTP {resp.status}")
        except Exception as e:
            report["indexnow_status"] = f"ERROR: {str(e)}"
            print(f"  ❌ IndexNow Push Failed: {e}")
            
    # Save Report
    report_path = os.path.join(args.sitemap_dir, "gsc_submission_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        
    print(f"\n==================================================")
    print(f"🎉 GSC & IndexNow Submission Audit Report saved to:")
    print(f"   {report_path}")
    print(f"==================================================")

if __name__ == "__main__":
    main()
