#!/usr/bin/env python3
"""
StockUp AI — Automated Performance & Concurrent Load Tester
Executes multi-stage concurrent read-only load testing against local Spring Boot services.
Calculates exact empirical response time statistics: Avg, Median, Min, Max, P95, P99, RPS, Failure %.
"""

import time
import json
import statistics
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8080"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

ENDPOINTS = [
    {"name": "1. Dashboard Summary", "path": "/api/dashboard/summary", "method": "GET"},
    {"name": "2. Medicine Inventory", "path": "/api/items?page=0&size=20", "method": "GET"},
    {"name": "3. Sales Summary", "path": "/api/sales/summary", "method": "GET"},
    {"name": "4. Sales Filters", "path": "/api/sales/filters", "method": "GET"},
    {"name": "5. Forecast Metadata", "path": "/api/forecast/daily/metadata", "method": "GET"},
]

def authenticate():
    print("🔐 Authenticating test client...")
    res = requests.post(LOGIN_URL, json={"email": "perftest@stockupai.in", "password": "PerfPassword123!"}, timeout=5)
    if res.status_code == 200:
        token = res.json().get("token")
        print("✅ Authentication successful. JWT token acquired.")
        return token
    else:
        raise RuntimeError(f"Failed to authenticate: {res.status_code} - {res.text}")

def send_request(token, endpoint):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}{endpoint['path']}"
    start_time = time.perf_counter()
    try:
        res = requests.get(url, headers=headers, timeout=10)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        success = (res.status_code == 200)
        return {
            "endpoint": endpoint["name"],
            "path": endpoint["path"],
            "status_code": res.status_code,
            "elapsed_ms": elapsed_ms,
            "success": success
        }
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "endpoint": endpoint["name"],
            "path": endpoint["path"],
            "status_code": 0,
            "elapsed_ms": elapsed_ms,
            "success": False,
            "error": str(e)
        }

def run_scenario(token, concurrency, requests_per_worker=20):
    total_requests = concurrency * requests_per_worker * len(ENDPOINTS)
    print(f"\n🚀 Running Scenario: Concurrency={concurrency} Users (Total Requests planned ~ {total_requests})...")

    results = []
    start_scenario_time = time.perf_counter()

    def worker_loop(worker_id):
        worker_results = []
        for _ in range(requests_per_worker):
            for ep in ENDPOINTS:
                res = send_request(token, ep)
                worker_results.append(res)
                time.sleep(0.01) # Small delay simulating real user think-time
        return worker_results

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker_loop, i) for i in range(concurrency)]
        for future in as_completed(futures):
            results.extend(future.result())

    scenario_duration = time.perf_counter() - start_scenario_time

    # Calculate statistics
    latencies = [r["elapsed_ms"] for r in results]
    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]

    latencies_sorted = sorted(latencies)
    n = len(latencies_sorted)

    avg_latency = statistics.mean(latencies) if latencies else 0.0
    median_latency = statistics.median(latencies) if latencies else 0.0
    min_latency = min(latencies) if latencies else 0.0
    max_latency = max(latencies) if latencies else 0.0
    p95_latency = latencies_sorted[int(n * 0.95)] if n > 0 else 0.0
    p99_latency = latencies_sorted[int(n * 0.99)] if n > 0 else 0.0
    rps = len(results) / scenario_duration if scenario_duration > 0 else 0.0
    failure_pct = (len(failures) / n * 100.0) if n > 0 else 0.0

    metrics = {
        "concurrency": concurrency,
        "total_requests": len(results),
        "success_count": len(successes),
        "failure_count": len(failures),
        "failure_pct": round(failure_pct, 2),
        "duration_sec": round(scenario_duration, 2),
        "rps": round(rps, 2),
        "avg_ms": round(avg_latency, 2),
        "median_ms": round(median_latency, 2),
        "min_ms": round(min_latency, 2),
        "max_ms": round(max_latency, 2),
        "p95_ms": round(p95_latency, 2),
        "p99_ms": round(p99_latency, 2)
    }

    # Per-endpoint stats
    endpoint_stats = {}
    for ep in ENDPOINTS:
        name = ep["name"]
        ep_res = [r for r in results if r["endpoint"] == name]
        ep_lats = sorted([r["elapsed_ms"] for r in ep_res])
        ep_n = len(ep_lats)
        ep_succ = len([r for r in ep_res if r["success"]])
        if ep_n > 0:
            endpoint_stats[name] = {
                "requests": ep_n,
                "failures": ep_n - ep_succ,
                "avg_ms": round(statistics.mean(ep_lats), 2),
                "median_ms": round(statistics.median(ep_lats), 2),
                "p95_ms": round(ep_lats[int(ep_n * 0.95)], 2),
                "p99_ms": round(ep_lats[int(ep_n * 0.99)], 2),
                "min_ms": round(min(ep_lats), 2),
                "max_ms": round(max(ep_lats), 2)
            }

    metrics["endpoint_stats"] = endpoint_stats

    print(f"📊 Results for Concurrency={concurrency}:")
    print(f"   Requests: {metrics['total_requests']} | Failures: {metrics['failure_count']} ({metrics['failure_pct']}%)")
    print(f"   RPS: {metrics['rps']} req/sec | Duration: {metrics['duration_sec']}s")
    print(f"   Avg: {metrics['avg_ms']}ms | Median: {metrics['median_ms']}ms | P95: {metrics['p95_ms']}ms | P99: {metrics['p99_ms']}ms | Max: {metrics['max_ms']}ms")

    return metrics

def main():
    print("=" * 80)
    print("STOCKUP AI — REAL PERFORMANCE & CONCURRENT LOAD BENCHMARK")
    print("=" * 80)

    token = authenticate()

    all_scenarios = []

    # Safe multi-stage benchmarks
    for c in [1, 5, 10]:
        scenario_data = run_scenario(token, concurrency=c, requests_per_worker=10)
        all_scenarios.append(scenario_data)
        time.sleep(1.0)

    summary_file = os.path.join(RESULTS_DIR, "load_test_results.json")
    with open(summary_file, "w") as f:
        json.dump(all_scenarios, f, indent=2)

    print("\n" + "=" * 80)
    print("SUMMARY TABLE OF MEASURED PERFORMANCE METRICS")
    print("=" * 80)
    print(f"{'Concurrency':<12} | {'Requests':<10} | {'Failures':<10} | {'Avg (ms)':<10} | {'Median (ms)':<12} | {'P95 (ms)':<10} | {'P99 (ms)':<10} | {'RPS':<10}")
    print("-" * 90)
    for s in all_scenarios:
        print(f"{s['concurrency']:<12} | {s['total_requests']:<10} | {s['failure_count']:<10} | {s['avg_ms']:<10} | {s['median_ms']:<12} | {s['p95_ms']:<10} | {s['p99_ms']:<10} | {s['rps']:<10}")

    print("\n✅ Load test completed successfully! Results written to performance-tests/results/load_test_results.json")

if __name__ == "__main__":
    main()
