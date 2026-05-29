"""
Fetch Bloomberg data from local Terminal via xbbg.
Outputs JSON for the briefing manifest.

Usage:
    python scripts/fetch_bbg.py --gaofang
    python scripts/fetch_bbg.py --tickers DGS10,BRENT,GOLD --fields px_last,chg_pct_1m
    python scripts/fetch_bbg.py --tickers DGS10 --fields px_last --history 30

Requires: Bloomberg Terminal running locally, xbbg installed.
"""

from __future__ import annotations
import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

try:
    from xbbg import blp
except ImportError:
    print("Error: xbbg not installed. Run: pip install xbbg")
    sys.exit(1)

# Constants
CURRENT_FIELDS = ["px_last", "chg_pct_1m", "crncy", "chg_pct_1d"]
HISTORY_FIELDS = ["px_last"]
YIELD_FIELD = "YAS_BOND_YLD"
YIELD_CRNCY = {"DE10Y": "EUR", "GB10Y": "GBP", "JP10Y": "JPY"}
EM_SPREAD_TICKER = "BSSUTRUU Index"
EM_SPREAD_FIELD = "INDEX_OAS_TSY_BP"

GAOFANG_TICKERS: Dict[str, Optional[str]] = {
    "DGS10": "USGG10YR Index", "DGS2": "USGG2YR Index", "DGS30": "USGG30YR Index",
    "T10Y2Y": None, "EFFR": "FEDL01 Index", "SOFR": "SOFRRATE Index",
    "VIX": "VIX Index", "MOVE": "MOVE Index",
    "DE10Y": "GTDEM10Y Govt", "GB10Y": "GTGBP10Y Govt", "JP10Y": "GTJPY10Y Govt",
    "IG_OAS": "LUACOAS Index", "HY_OAS": "LF98OAS Index", "EM_SPREAD": None,
    "SPX": "SPX Index", "DXY": "DXY Curncy", "BRENT": "COA Comdty",
    "GOLD": "GOLDS Comdty", "SILVER": "SILV Comdty",
    "HSI": "HSI Index", "HSCEI": "HSCEI Index", "HSTECH": "HSTECH Index",
    "SHCOMP": "SHCOMP Index", "SZCOMP": "SZCOMP Index",
    "CNH": "USDCNH Curncy", "CNY": "USDCNY Curncy", "USDJPY": "USDJPY Curncy",
}

YIELD_TICKERS: Dict[str, str] = {
    "DE10Y": "GTDEM10Y Govt", "GB10Y": "GTGBP10Y Govt", "JP10Y": "GTJPY10Y Govt",
}


def fetch_current(tickers: List[str], fields: List[str]) -> Dict[str, Dict[str, str]]:
    """Fetch current/reference data (bdp) for multiple tickers."""
    results: Dict[str, Dict[str, str]] = {}
    try:
        df = blp.bdp(tickers=tickers, flds=fields)
        if df is not None and df.shape[0] > 0:
            pdf = df.to_pandas() if hasattr(df, 'to_pandas') else df
            for ticker in tickers:
                ticker_data: Dict[str, str] = {}
                subset = pdf[pdf['ticker'] == ticker]
                for _, row in subset.iterrows():
                    field_name = row['field']
                    val = row['value']
                    ticker_data[field_name] = "N/A" if val is None or (isinstance(val, float) and str(val) == 'nan') else str(val)
                for f in fields:
                    if f not in ticker_data:
                        ticker_data[f] = "N/A"
                results[ticker] = ticker_data
        else:
            for ticker in tickers:
                results[ticker] = {f: "N/A" for f in fields}
    except Exception as e:
        for ticker in tickers:
            results[ticker] = {"error": str(e)}
    return results


def fetch_history(tickers: List[str], fields: List[str], days: int = 30) -> Dict[str, Dict[str, Any]]:
    """Fetch historical data (bdh) for multiple tickers."""
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    results: Dict[str, Dict[str, Any]] = {}
    for ticker in tickers:
        try:
            df = blp.bdh(ticker=ticker, flds=fields, start_date=start_date, end_date=end_date)
            if df is not None and df.shape[0] > 0:
                pdf = df.to_pandas() if hasattr(df, 'to_pandas') else df
                records = []
                for idx, row in pdf.tail(35).iterrows():
                    date_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)
                    record = {"date": date_str}
                    for f in fields:
                        val = row.get(f, "N/A")
                        record[f] = "N/A" if val is None or (isinstance(val, float) and str(val) == 'nan') else str(val)
                    records.append(record)
                results[ticker] = {"ticker": ticker, "observations": records}
            else:
                results[ticker] = {"ticker": ticker, "observations": []}
        except Exception as e:
            results[ticker] = {"ticker": ticker, "error": str(e)}
    return results


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Fetch Bloomberg data via xbbg")
    parser.add_argument("--tickers", help="Comma-separated tickers")
    parser.add_argument("--fields", default=",".join(CURRENT_FIELDS), help="Comma-separated fields")
    parser.add_argument("--history", type=int, default=0, help="Days of history to fetch")
    parser.add_argument("--gaofang", action="store_true", help="Fetch all gaofang briefing tickers")
    parser.add_argument("--output", default="output/bbg_data.json", help="Output JSON path")
    args = parser.parse_args()

    # Path traversal protection
    output_dir = os.path.dirname(os.path.abspath(args.output))
    if not os.path.commonpath([os.path.abspath("."), output_dir]) == os.path.abspath("."):
        print(f"Error: Output path outside workspace: {args.output}")
        sys.exit(1)

    if args.gaofang:
        tickers_map = GAOFANG_TICKERS
        skip_tickers = set(YIELD_TICKERS.values())
        bbg_tickers = [v for v in tickers_map.values() if v is not None and v not in skip_tickers]
        fields = CURRENT_FIELDS
    elif args.tickers:
        tickers = [t.strip() for t in args.tickers.split(",")]
        tickers_map: Dict[str, Optional[str]] = {}
        bbg_tickers = []
        for t in tickers:
            if t in GAOFANG_TICKERS:
                mapped = GAOFANG_TICKERS[t]
                if mapped is not None:
                    tickers_map[t] = mapped
                    bbg_tickers.append(mapped)
            else:
                tickers_map[t] = t
                bbg_tickers.append(t)
        fields = [f.strip() for f in args.fields.split(",")]
    else:
        print("Specify --tickers or --gaofang")
        sys.exit(1)

    print(f"Fetching current data for {len(bbg_tickers)} tickers...")
    current_data = fetch_current(bbg_tickers, fields)

    mapped_current: Dict[str, Dict[str, str]] = {}
    for series_id, bbg_ticker in tickers_map.items():
        if bbg_ticker is None:
            continue
        if bbg_ticker in current_data:
            mapped_current[series_id] = current_data[bbg_ticker]
        else:
            mapped_current[series_id] = {"error": "no data"}

    if args.gaofang and YIELD_TICKERS:
        yield_tickers = list(YIELD_TICKERS.values())
        print(f"Fetching yield data for {len(yield_tickers)} bond tickers...")
        yield_raw = fetch_current(yield_tickers, [YIELD_FIELD])
        for series_id, bbg_ticker in YIELD_TICKERS.items():
            if bbg_ticker in yield_raw and YIELD_FIELD in yield_raw[bbg_ticker]:
                yld = yield_raw[bbg_ticker][YIELD_FIELD]
                if yld != "N/A":
                    mapped_current[series_id] = {"px_last": yld, "chg_pct_1m": "N/A", "crncy": YIELD_CRNCY.get(series_id, "N/A"), "chg_pct_1d": "N/A"}

    if args.gaofang:
        print(f"Fetching EM spread from {EM_SPREAD_TICKER}...")
        em_raw = fetch_current([EM_SPREAD_TICKER], [EM_SPREAD_FIELD])
        if EM_SPREAD_TICKER in em_raw and EM_SPREAD_FIELD in em_raw[EM_SPREAD_TICKER]:
            spread_val = em_raw[EM_SPREAD_TICKER][EM_SPREAD_FIELD]
            mapped_current["EM_SPREAD"] = {"px_last": spread_val, "chg_pct_1m": "N/A", "crncy": "USD", "chg_pct_1d": "N/A"}

    if args.gaofang and GAOFANG_TICKERS.get("T10Y2Y") is None:
        dgs10_val = mapped_current.get("DGS10", {}).get("px_last", "N/A")
        dgs2_val = mapped_current.get("DGS2", {}).get("px_last", "N/A")
        if dgs10_val != "N/A" and dgs2_val != "N/A":
            try:
                spread = float(dgs10_val) - float(dgs2_val)
                mapped_current["T10Y2Y"] = {"px_last": str(round(spread, 4)), "chg_pct_1m": "N/A", "crncy": "USD", "chg_pct_1d": "N/A"}
            except (ValueError, TypeError):
                mapped_current["T10Y2Y"] = {"px_last": "N/A", "chg_pct_1m": "N/A", "crncy": "N/A", "chg_pct_1d": "N/A"}
        else:
            mapped_current["T10Y2Y"] = {"px_last": "N/A", "chg_pct_1m": "N/A", "crncy": "N/A", "chg_pct_1d": "N/A"}

    result: Dict[str, Any] = {"fetch_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "current": mapped_current}

    if args.history > 0:
        print(f"Fetching {args.history}d history...")
        history_data = fetch_history(bbg_tickers, HISTORY_FIELDS, args.history)
        mapped_history = {}
        for series_id, bbg_ticker in tickers_map.items():
            if bbg_ticker and bbg_ticker in history_data:
                mapped_history[series_id] = history_data[bbg_ticker]
        result["history"] = mapped_history

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"OK: {args.output}")
    print(f"Tickers fetched: {len(mapped_current)}")


if __name__ == "__main__":
    main()
