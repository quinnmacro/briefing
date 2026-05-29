"""
Search and extract content via Tavily AI Search API.
Outputs structured JSON for the briefing manifest.

Usage:
    python scripts/tavily_search.py --query "Iran war oil price impact May 2026"
    python scripts/tavily_search.py --query "长鑫科技科创板IPO" --search-depth advanced
    python scripts/tavily_search.py --queries-file assets/gaofang-queries.txt
    python scripts/tavily_search.py --gaofang
    python scripts/tavily_search.py --extract https://www.reuters.com/article/...

Requires: TAVILY_API_KEY set in .env or environment.
"""

from __future__ import annotations
import argparse
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
except ImportError:
    pass

TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")

try:
    from tavily import TavilyClient
except ImportError:
    print("Error: tavily-python not installed. Run: pip install tavily-python python-dotenv")
    sys.exit(1)

GAOFANG_QUERIES: List[str] = [
    "Hong Kong GDP Q1 2026 economic data growth",
    "Hong Kong CPI unemployment rate 2026",
    "Hong Kong IPO market 2026 listing statistics fundraising",
    "China GDP CPI PMI trade balance April 2026 latest data",
    "China industrial production retail sales April 2026",
    "US GDP inflation Fed rate decision May 2026",
    "Eurozone GDP HICP ECB rate 2026",
    "Japan BOJ rate hike USDJPY 2026",
    "Iran war oil price Strait of Hormuz May 2026",
    "AI semiconductor industry news 2026",
    "长鑫科技科创板IPO 2026年5月",
    "Hong Kong virtual asset regulation family office 2026",
]


def search(query: str, search_depth: str = "basic", max_results: int = 5, include_raw_content: bool = False) -> Dict[str, Any]:
    """Perform a Tavily search and return structured results."""
    if not TAVILY_API_KEY:
        print("Error: TAVILY_API_KEY not set. Add it to .env or environment.")
        sys.exit(1)

    client = TavilyClient(api_key=TAVILY_API_KEY)
    response = client.search(
        query=query,
        search_depth=search_depth,
        max_results=max_results,
        include_raw_content=include_raw_content,
    )

    results: List[Dict[str, Any]] = []
    for r in response.get("results", []):
        entry = {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", ""),
            "score": r.get("score", 0),
            "published_date": r.get("published_date", ""),
        }
        if include_raw_content and r.get("raw_content"):
            entry["raw_content"] = r["raw_content"]
        results.append(entry)

    return {
        "query": query,
        "search_depth": search_depth,
        "results": results,
        "response_time": response.get("response_time", 0),
    }


def extract(urls: List[str]) -> Dict[str, Any]:
    """Extract raw content from URLs via Tavily extract API."""
    if not TAVILY_API_KEY:
        print("Error: TAVILY_API_KEY not set.")
        sys.exit(1)

    client = TavilyClient(api_key=TAVILY_API_KEY)
    response = client.extract(urls=urls)

    extracted: List[Dict[str, str]] = []
    for r in response.get("results", []):
        entry = {"url": r.get("url", ""), "content": r.get("content", "")}
        extracted.append(entry)

    return {
        "urls": urls,
        "extracted": extracted,
        "failed_urls": response.get("failed_results", []),
    }


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Search via Tavily AI Search API")
    parser.add_argument("--query", help="Single search query")
    parser.add_argument("--queries-file", help="File with queries (one per line)")
    parser.add_argument("--gaofang", action="store_true", help="Run all gaofang briefing queries")
    parser.add_argument("--extract", help="URLs to extract (comma-separated)")
    parser.add_argument("--search-depth", default="basic", choices=["basic", "advanced"])
    parser.add_argument("--max-results", type=int, default=5)
    parser.add_argument("--include-raw", action="store_true")
    parser.add_argument("--output", default="output/tavily_results.json")
    args = parser.parse_args()

    # Path traversal protection
    output_dir = os.path.dirname(os.path.abspath(args.output))
    if not os.path.commonpath([os.path.abspath("."), output_dir]) == os.path.abspath("."):
        print(f"Error: Output path outside workspace: {args.output}")
        sys.exit(1)

    queries: List[str] = []
    if args.gaofang:
        queries = GAOFANG_QUERIES
        args.search_depth = "advanced"
    elif args.query:
        queries = [args.query]
    elif args.queries_file:
        with open(args.queries_file, encoding="utf-8") as f:
            queries = [line.strip() for line in f if line.strip() and not line.startswith("#")]
    else:
        print("Specify --query, --queries-file, or --gaofang")
        sys.exit(1)

    if args.extract:
        urls = [u.strip() for u in args.extract.split(",")]
        print(f"Extracting content from {len(urls)} URLs...")
        result = extract(urls)
        result["fetch_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"OK: {args.output}")
        return

    all_results: List[Dict[str, Any]] = []
    for i, q in enumerate(queries):
        print(f"[{i+1}/{len(queries)}] Searching: {q}")
        r = search(query=q, search_depth=args.search_depth, max_results=args.max_results, include_raw_content=args.include_raw)
        all_results.append(r)

    output = {
        "fetch_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "search_depth": args.search_depth,
        "total_queries": len(queries),
        "results": all_results,
    }

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"OK: {args.output}")
    print(f"Queries: {len(queries)}, Total results: {sum(len(r['results']) for r in all_results)}")


if __name__ == "__main__":
    main()
