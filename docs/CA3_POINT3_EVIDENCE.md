# CA-3 Point 3 — Gantt Chart & Project Tracking Evidence (Redesigned Model)

## Executive Summary

This document provides verifiable evidence that StockUp AI's project timeline and Gantt chart are based entirely on actual Git commit history and filesystem evidence. 

The visual Gantt chart has been redesigned specifically for **B.Tech CA-3 presentation standards**, presenting a widescreen 16:9 layout organized into **12 major development phases** with **39 visible subtasks**, month/week headers, rounded timeline bars, and clean gridlines.

---

## Deliverable Artifacts

| File | Format | Description | Presentation Status |
|------|--------|-------------|---------------------|
| [`docs/CA3_GANTT_CHART.png`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/docs/CA3_GANTT_CHART.png) | PNG (250 DPI) | Primary presentation visual artifact (16:9 Widescreen, Dark Navy) | ✅ Ready |
| [`docs/CA3_GANTT_CHART.pdf`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/docs/CA3_GANTT_CHART.pdf) | PDF (Vector) | Submission & high-resolution print version | ✅ Ready |
| [`docs/CA3_GANTT_DATA.md`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/docs/CA3_GANTT_DATA.md) | Markdown | Raw 12-phase & 39-subtask data table with Git commit links | ✅ Updated |
| [`docs/CA3_PROJECT_TIMELINE.md`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/docs/CA3_PROJECT_TIMELINE.md) | Markdown | Phase-by-phase project timeline narrative | ✅ Updated |
| [`docs/generate_gantt.py`](file:///Users/anishkumarsah/Desktop/STOCKUP-AI/docs/generate_gantt.py) | Python | Fully automated, reproducible chart generation script | ✅ Updated |

---

## 12 Major Development Phases

1. **PLANNING & SETUP** (Jul 24 – Jul 27) — Project scaffolding, architecture design, build setup.
2. **UI/UX & FRONTEND** (Jul 24 – Sep 20) — React 19, Vite, component library, 12 CSS design modules.
3. **BACKEND & DATABASE** (Aug 08 – Aug 23) — Spring Boot 3, PostgreSQL, JPA entities, REST Controllers.
4. **AUTHENTICATION & SECURITY** (Aug 08 – Sep 19) — JWT, BCrypt, OTP reset, Google OAuth, Multi-Tenant isolation.
5. **MEDICINE & INVENTORY** (Aug 08 – Sep 20) — Medicine CRUD, inventory health, EOQ reorder, automated expiry scheduler.
6. **PROCUREMENT** (Aug 08 – Sep 11) — Supplier catalog, purchase order lifecycle, automatic inventory updates.
7. **SALES & BILLING** (Sep 11 – Sep 20) — POS billing UI, invoice generator, transaction management.
8. **ANALYTICS** (Sep 10 – Sep 20) — Forecast dashboard, sales analytics, multi-currency conversion.
9. **AI FEATURES** (Aug 08 – Sep 20) — Intent-based AI assistant, document parser, support bot widget.
10. **DEMAND FORECASTING** (Aug 19 – Sep 10) — ML dataset ETL, FastAPI microservice, model inference & evaluation.
11. **TESTING & VALIDATION** (Sep 11 – Sep 21) — 87 JUnit tests, E2E python scripts, concurrent load tests.
12. **DEPLOYMENT PREPARATION** (Sep 11 – Sep 20) — Docker multi-stage containers, Docker Compose, Nginx.

---

## Timeline Statistics

- **Total Development Span**: July 24, 2026 – September 21, 2026 (60 Days)
- **Header Structure**: Months (July, August, September) → Weeks (W1–W4)
- **Major Phases**: 12
- **Subtasks**: 39
- **Git Commit Anchors**: 12 commits (`d67a7e2` through `3b70d06`)
- **Verification Guarantee**: 100% derived from Git commit history. Zero fabricated dates.
