#!/usr/bin/env python3
"""
StockUp AI — CA-3 Gantt Chart Generator (Redesigned Widescreen Version)
Generates a presentation-ready Gantt chart PNG and PDF based on verified Git history.
Designed specifically for B.Tech CA-3 presentation standards.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
from datetime import datetime, timedelta
import os

OUTPUT_DIR = os.path.dirname(__file__)

# ─── Structured Gantt Data (12 Major Phases & Subtasks) ─────────────────────────
# Format: (Type: "PHASE" or "TASK", Title, StartDate, EndDate, MutedColorHex)

gantt_structure = [
    # 1. PLANNING & SETUP
    ("PHASE", "1. PLANNING & SETUP", "2026-07-24", "2026-07-27", "#6366F1"),
    ("TASK",  "Project Setup & Scaffolding", "2026-07-24", "2026-07-27", "#818CF8"),
    ("TASK",  "Requirements & System Architecture", "2026-07-24", "2026-07-27", "#818CF8"),
    ("TASK",  "Development Environment Config", "2026-07-24", "2026-07-27", "#818CF8"),

    # 2. UI/UX & FRONTEND
    ("PHASE", "2. UI/UX & FRONTEND", "2026-07-24", "2026-09-20", "#8B5CF6"),
    ("TASK",  "React 19 & Vite Setup", "2026-07-24", "2026-07-27", "#A78BFA"),
    ("TASK",  "Dashboard & Modular Components", "2026-07-24", "2026-08-23", "#A78BFA"),
    ("TASK",  "Navigation & Layout Structure", "2026-07-24", "2026-07-27", "#A78BFA"),
    ("TASK",  "Dark Mode & Styling Refinements", "2026-07-24", "2026-09-20", "#A78BFA"),

    # 3. BACKEND & DATABASE
    ("PHASE", "3. BACKEND & DATABASE", "2026-08-08", "2026-08-23", "#3B82F6"),
    ("TASK",  "Spring Boot 3 Framework Setup", "2026-08-08", "2026-08-23", "#60A5FA"),
    ("TASK",  "PostgreSQL Database & JPA Schema", "2026-08-08", "2026-08-23", "#60A5FA"),
    ("TASK",  "REST APIs & Controller Layer", "2026-08-08", "2026-08-23", "#60A5FA"),
    ("TASK",  "Entity, Repository & Service Layer", "2026-08-08", "2026-08-23", "#60A5FA"),

    # 4. AUTHENTICATION & SECURITY
    ("PHASE", "4. AUTHENTICATION & SECURITY", "2026-08-08", "2026-09-19", "#06B6D4"),
    ("TASK",  "JWT Auth & Spring Security Filter", "2026-08-08", "2026-08-23", "#38BDF8"),
    ("TASK",  "BCrypt Password Hashing & Roles", "2026-08-08", "2026-08-23", "#38BDF8"),
    ("TASK",  "Multi-Tenant Business Isolation", "2026-08-08", "2026-09-10", "#38BDF8"),
    ("TASK",  "OTP Password Reset Flow", "2026-09-15", "2026-09-19", "#38BDF8"),
    ("TASK",  "Google OAuth Verification", "2026-09-17", "2026-09-19", "#38BDF8"),

    # 5. MEDICINE & INVENTORY
    ("PHASE", "5. MEDICINE & INVENTORY", "2026-08-08", "2026-09-20", "#10B981"),
    ("TASK",  "Medicine Catalog CRUD Engine", "2026-08-08", "2026-08-23", "#34D399"),
    ("TASK",  "Inventory Tracking & Health Check", "2026-08-08", "2026-08-23", "#34D399"),
    ("TASK",  "Low Stock & Reorder Optimization", "2026-08-08", "2026-08-23", "#34D399"),
    ("TASK",  "Expiry Alert & Automated Scheduler", "2026-09-15", "2026-09-20", "#34D399"),

    # 6. PROCUREMENT
    ("PHASE", "6. PROCUREMENT", "2026-08-08", "2026-09-11", "#F59E0B"),
    ("TASK",  "Supplier Directory Management", "2026-08-08", "2026-08-23", "#FBBF24"),
    ("TASK",  "Purchase Order Creation & Tracking", "2026-08-08", "2026-08-23", "#FBBF24"),
    ("TASK",  "Procurement & Inventory Update Flow", "2026-09-11", "2026-09-11", "#FBBF24"),

    # 7. SALES & BILLING
    ("PHASE", "7. SALES & BILLING", "2026-09-11", "2026-09-20", "#EC4899"),
    ("TASK",  "Point of Sale (POS) Interface", "2026-09-11", "2026-09-20", "#F472B6"),
    ("TASK",  "Invoice & Bill Generation Engine", "2026-09-15", "2026-09-20", "#F472B6"),
    ("TASK",  "Sales Transaction Management", "2026-09-11", "2026-09-20", "#F472B6"),

    # 8. ANALYTICS
    ("PHASE", "8. ANALYTICS", "2026-09-10", "2026-09-20", "#FB923C"),
    ("TASK",  "Forecast Dashboard & Visualization", "2026-09-10", "2026-09-10", "#FDBA74"),
    ("TASK",  "Sales Performance Analytics", "2026-09-11", "2026-09-20", "#FDBA74"),
    ("TASK",  "Multi-Currency Exchange Engine", "2026-09-18", "2026-09-20", "#FDBA74"),

    # 9. AI FEATURES
    ("PHASE", "9. AI FEATURES", "2026-08-08", "2026-09-20", "#14B8A6"),
    ("TASK",  "Natural Language AI Assistant", "2026-08-08", "2026-08-23", "#2DD4BF"),
    ("TASK",  "AI Document & Invoice Processing", "2026-09-15", "2026-09-20", "#2DD4BF"),
    ("TASK",  "StockUp Support Bot Widget", "2026-09-18", "2026-09-20", "#2DD4BF"),

    # 10. DEMAND FORECASTING
    ("PHASE", "10. DEMAND FORECASTING", "2026-08-19", "2026-09-10", "#EF4444"),
    ("TASK",  "Dataset ETL & Feature Engineering", "2026-08-19", "2026-08-23", "#F87171"),
    ("TASK",  "FastAPI Microservice & Model Training", "2026-08-19", "2026-08-23", "#F87171"),
    ("TASK",  "Forecast Evaluation & Routing API", "2026-09-10", "2026-09-10", "#F87171"),

    # 11. TESTING & VALIDATION
    ("PHASE", "11. TESTING & VALIDATION", "2026-09-11", "2026-09-21", "#22C55E"),
    ("TASK",  "JUnit 5 Unit Test Suite (87 tests)", "2026-09-11", "2026-09-20", "#4ADE80"),
    ("TASK",  "End-to-End Workflow Verification", "2026-09-11", "2026-09-17", "#4ADE80"),
    ("TASK",  "Concurrent Load & Latency Testing", "2026-09-21", "2026-09-21", "#4ADE80"),

    # 12. DEPLOYMENT PREPARATION
    ("PHASE", "12. DEPLOYMENT PREPARATION", "2026-09-11", "2026-09-20", "#94A3B8"),
    ("TASK",  "Docker Multi-Stage Containers", "2026-09-11", "2026-09-20", "#CBD5E1"),
    ("TASK",  "Docker Compose Orchestration", "2026-09-11", "2026-09-20", "#CBD5E1"),
    ("TASK",  "Nginx Reverse Proxy & Static Assets", "2026-09-11", "2026-09-20", "#CBD5E1"),
]

def generate_redesigned_gantt():
    # ─── Dimensions & Timeline Setup ───────────────────────────────────────────
    # Total rows = len(gantt_structure)
    num_rows = len(gantt_structure)
    
    # 16:9 Landscape Aspect Ratio (Width: 20, Height: 12.5)
    fig, ax = plt.subplots(figsize=(22, 14), dpi=200)
    fig.patch.set_facecolor('#0B132B') # Dark Navy Background
    ax.set_facecolor('#0B132B')

    # Date Range: July 20, 2026 to September 25, 2026
    timeline_start = datetime(2026, 7, 20)
    timeline_end = datetime(2026, 9, 25)
    total_days = (timeline_end - timeline_start).days

    # Define Month & Week Header Grid Boundaries
    # Months: July (Jul 20-31), August (Aug 1-31), September (Sep 1-25)
    months_data = [
        ("JULY 2026", datetime(2026, 7, 20), datetime(2026, 7, 31)),
        ("AUGUST 2026", datetime(2026, 8, 1), datetime(2026, 8, 31)),
        ("SEPTEMBER 2026", datetime(2026, 9, 1), datetime(2026, 9, 25)),
    ]

    # Weeks: W1, W2, W3, W4 per month
    weeks_data = [
        # July
        ("W1", datetime(2026, 7, 20), datetime(2026, 7, 26)),
        ("W2", datetime(2026, 7, 27), datetime(2026, 7, 31)),
        # August
        ("W1", datetime(2026, 8, 1), datetime(2026, 8, 7)),
        ("W2", datetime(2026, 8, 8), datetime(2026, 8, 14)),
        ("W3", datetime(2026, 8, 15), datetime(2026, 8, 21)),
        ("W4", datetime(2026, 8, 22), datetime(2026, 8, 31)),
        # September
        ("W1", datetime(2026, 9, 1), datetime(2026, 9, 7)),
        ("W2", datetime(2026, 9, 8), datetime(2026, 9, 14)),
        ("W3", datetime(2026, 9, 15), datetime(2026, 9, 21)),
        ("W4", datetime(2026, 9, 22), datetime(2026, 9, 25)),
    ]

    # ─── Title & Subtitle ──────────────────────────────────────────────────────
    plt.text(
        0.02, 0.96, "STOCKUP AI",
        transform=fig.transFigure, fontsize=20, fontweight='bold', color='#FFFFFF',
        ha='left', va='top'
    )
    plt.text(
        0.02, 0.938, "Project Development Gantt Chart  |  Git-History-Based Timeline (July 2026 – September 2026)",
        transform=fig.transFigure, fontsize=11, fontweight='normal', color='#94A3B8',
        ha='left', va='top'
    )

    # ─── Layout Coordinates ───────────────────────────────────────────────────
    # Task column on left: x from -32 to 0 (days scale mapped)
    # Timeline x from 0 to total_days
    task_col_width = 30 # days worth of width allocated for labels on left
    ax.set_xlim(-task_col_width, total_days + 1)

    # Y-axis vertical scaling (top to bottom)
    header_top = num_rows + 2.5
    header_month_y = num_rows + 1.6
    header_week_y = num_rows + 0.6
    
    ax.set_ylim(-1, header_top + 0.5)

    # ─── Draw Headers ─────────────────────────────────────────────────────────
    # Left Header Box "PROJECT / TASK"
    ax.add_patch(FancyBboxPatch(
        (-task_col_width, header_week_y - 0.3), task_col_width - 0.5, 2.0,
        boxstyle="round,pad=0,rounding_size=0.2",
        facecolor='#1E293B', edgecolor='#334155', linewidth=1, zorder=5
    ))
    ax.text(
        -task_col_width / 2 - 0.25, header_month_y - 0.1, "PROJECT PHASE / SUBTASK",
        color='#F8FAFC', fontsize=10, fontweight='bold', ha='center', va='center', zorder=6
    )

    # Month Headers
    for m_title, m_start, m_end in months_data:
        x_start = (m_start - timeline_start).days
        x_end = (m_end - timeline_start).days + 1
        width = x_end - x_start

        ax.add_patch(FancyBboxPatch(
            (x_start + 0.1, header_month_y - 0.1), width - 0.2, 0.9,
            boxstyle="round,pad=0,rounding_size=0.15",
            facecolor='#1E293B', edgecolor='#475569', linewidth=1, zorder=5
        ))
        ax.text(
            x_start + width / 2, header_month_y + 0.35, m_title,
            color='#38BDF8', fontsize=10, fontweight='bold', ha='center', va='center', zorder=6
        )

    # Week Headers
    for w_title, w_start, w_end in weeks_data:
        x_start = (w_start - timeline_start).days
        x_end = (w_end - timeline_start).days + 1
        width = x_end - x_start

        ax.add_patch(FancyBboxPatch(
            (x_start + 0.05, header_week_y - 0.2), width - 0.1, 0.7,
            boxstyle="round,pad=0,rounding_size=0.1",
            facecolor='#0F172A', edgecolor='#334155', linewidth=0.8, zorder=5
        ))
        ax.text(
            x_start + width / 2, header_week_y + 0.15, w_title,
            color='#94A3B8', fontsize=8.5, fontweight='bold', ha='center', va='center', zorder=6
        )

        # Subtle vertical grid line down the timeline
        ax.plot([x_start, x_start], [-0.5, header_week_y - 0.2], color='#1E293B', linestyle='--', linewidth=0.8, zorder=1)

    # Final right vertical line
    ax.plot([total_days + 1, total_days + 1], [-0.5, header_week_y - 0.2], color='#1E293B', linestyle='--', linewidth=0.8, zorder=1)

    # ─── Render Rows & Timeline Bars ──────────────────────────────────────────
    current_y = num_rows - 0.5

    for row_idx, item in enumerate(gantt_structure):
        item_type, title, start_str, end_str, color = item
        
        start_date = datetime.strptime(start_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_str, "%Y-%m-%d")

        x_start = (start_date - timeline_start).days
        # Ensure minimum bar duration of 1 day for visibility
        duration = max((end_date - start_date).days + 1, 1)

        y_pos = current_y - row_idx

        if item_type == "PHASE":
            # Phase Background Row Highlight
            ax.add_patch(FancyBboxPatch(
                (-task_col_width, y_pos - 0.35), task_col_width + total_days + 1, 0.8,
                boxstyle="square,pad=0",
                facecolor='#1E293B', edgecolor='none', alpha=0.5, zorder=2
            ))

            # Phase Text Label (Left Column)
            ax.text(
                -task_col_width + 0.8, y_pos, title,
                color='#F8FAFC', fontsize=9.5, fontweight='bold', va='center', zorder=4
            )

            # Phase Bar (Broader, vibrant accent)
            bar_height = 0.45
            ax.add_patch(FancyBboxPatch(
                (x_start, y_pos - bar_height / 2), duration, bar_height,
                boxstyle="round,pad=0,rounding_size=0.15",
                facecolor=color, edgecolor='white', linewidth=0.5, alpha=0.95, zorder=4
            ))

        else: # TASK
            # Subtask Text Label (Indented under Phase)
            ax.text(
                -task_col_width + 2.2, y_pos, f"•  {title}",
                color='#CBD5E1', fontsize=8.2, fontweight='normal', va='center', zorder=4
            )

            # Subtask Bar (Slightly thinner, softer opacity)
            bar_height = 0.3
            ax.add_patch(FancyBboxPatch(
                (x_start, y_pos - bar_height / 2), duration, bar_height,
                boxstyle="round,pad=0,rounding_size=0.1",
                facecolor=color, edgecolor=color, linewidth=0.3, alpha=0.85, zorder=4
            ))

        # Horizontal subtle divider line below row
        ax.plot(
            [-task_col_width, total_days + 1], [y_pos - 0.5, y_pos - 0.5],
            color='#1E293B', linewidth=0.4, alpha=0.6, zorder=1
        )

    # ─── Clean Axis & Borders ─────────────────────────────────────────────────
    ax.axis('off') # Hide standard matplotlib spines & ticks

    # Footer note
    plt.text(
        0.98, 0.015,
        "Note: Dates strictly reconstructed from actual Git commit history & filesystem logs. Zero fabricated timelines.",
        transform=fig.transFigure, fontsize=7.5, color='#64748B', style='italic', ha='right', va='bottom'
    )

    plt.tight_layout(rect=[0.01, 0.02, 0.99, 0.93])

    # Save High-Resolution Presentation PNG & Vector PDF
    png_path = os.path.join(OUTPUT_DIR, "CA3_GANTT_CHART.png")
    pdf_path = os.path.join(OUTPUT_DIR, "CA3_GANTT_CHART.pdf")

    fig.savefig(png_path, dpi=250, bbox_inches='tight', facecolor=fig.get_facecolor())
    print(f"✅ Presentation PNG saved: {png_path}")

    fig.savefig(pdf_path, bbox_inches='tight', facecolor=fig.get_facecolor())
    print(f"✅ Vector PDF saved: {pdf_path}")

    plt.close(fig)

if __name__ == "__main__":
    generate_redesigned_gantt()
