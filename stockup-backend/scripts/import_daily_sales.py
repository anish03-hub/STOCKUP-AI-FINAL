#!/usr/bin/env python3
"""
High-Speed Batch Importer & Data Quality Validator for StockUp AI Daily Sales Dataset.
Imports 177,990 records into PostgreSQL 'daily_sales' table mapped to the default/demo business.
"""

import csv
import sys
import uuid
import datetime
import os
import psycopg2
from psycopg2.extras import execute_values

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/stockup_ai")
CSV_PATH = "/Users/anishkumarsah/Downloads/global_pharmacy_sales_2020_2025_daily_dataset (1).csv"

def get_default_business_id(conn):
    with conn.cursor() as cur:
        # Dynamically find the businessId of fda_tester@stockup.com
        cur.execute("SELECT business_id FROM users WHERE email = 'fda_tester@stockup.com' LIMIT 1;")
        row = cur.fetchone()
        if row and row[0]:
            print(f"✅ Found default business_id from fda_tester@stockup.com: {row[0]}")
            return row[0]
        
        # Fallback to first business in businesses table
        cur.execute("SELECT id FROM businesses ORDER BY created_at ASC LIMIT 1;")
        row = cur.fetchone()
        if row and row[0]:
            print(f"✅ Found first business_id from businesses table: {row[0]}")
            return row[0]
            
        raise RuntimeError("No existing business found in PostgreSQL! Cannot determine target company.")

def parse_row(row, business_id):
    """
    Validates and transforms a single CSV row into a database tuple.
    Expected CSV header:
    date,year,month,day,region,country,category,medicine,age_group,units_sold,unit_price,stock_level,expiry_days_remaining,covid_flag
    """
    try:
        raw_date = row["date"].strip()
        date_val = datetime.date.fromisoformat(raw_date)
        
        year_val = int(row.get("year", date_val.year))
        month_val = int(row.get("month", date_val.month))
        day_val = int(row.get("day", date_val.day))
        
        region = row.get("region", "").strip()
        country = row.get("country", "").strip()
        category = row.get("category", "").strip()
        medicine = row.get("medicine", "").strip()
        age_group = row.get("age_group", "").strip()
        
        if not medicine or not country or not region:
            return None, "Missing required text fields"
            
        units_sold = int(row["units_sold"])
        if units_sold < 0:
            return None, "Negative units_sold"
            
        unit_price = float(row["unit_price"])
        if unit_price <= 0:
            return None, "Non-positive unit_price"
            
        total_revenue = round(units_sold * unit_price, 2)
        stock_level = int(row.get("stock_level", 0))
        expiry_days = int(row.get("expiry_days_remaining", 0))
        
        raw_covid = str(row.get("covid_flag", "0")).strip().lower()
        covid_flag = raw_covid in ("1", "true", "yes")
        
        record_id = str(uuid.uuid4())
        created_at = datetime.datetime.now()
        
        return (
            record_id,
            age_group,
            business_id,
            category,
            country,
            covid_flag,
            created_at,
            date_val,
            day_val,
            expiry_days,
            medicine,
            month_val,
            region,
            stock_level,
            total_revenue,
            unit_price,
            units_sold,
            year_val
        ), None
    except Exception as e:
        return None, str(e)

def main():
    print("==================================================")
    print("  STOCKUP AI DAILY SALES BATCH IMPORT & AUDIT     ")
    print("==================================================")

    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: CSV not found at {CSV_PATH}")
        sys.exit(1)

    print(f"Connecting to database: {DB_URL} ...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False

    try:
        business_id = get_default_business_id(conn)
        
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM daily_sales WHERE business_id = %s;", (business_id,))
            existing_count = cur.fetchone()[0]
            if existing_count > 0:
                print(f"ℹ️ daily_sales already has {existing_count} records for business_id {business_id}.")
                print("Clearing existing sales for this company before clean re-import...")
                cur.execute("DELETE FROM daily_sales WHERE business_id = %s;", (business_id,))
                conn.commit()

        print(f"Reading & parsing {CSV_PATH} ...")
        valid_records = []
        rejected_rows = []
        total_read = 0

        with open(CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=1):
                total_read += 1
                record, err = parse_row(row, business_id)
                if record:
                    valid_records.append(record)
                else:
                    rejected_rows.append((idx, err, row))

        print(f"\n📊 Data Quality Check Summary:")
        print(f"   - Total rows in CSV:    {total_read:,}")
        print(f"   - Validated rows:       {len(valid_records):,}")
        print(f"   - Rejected rows:        {len(rejected_rows):,}")

        if rejected_rows:
            print("   - Sample rejected reasons:")
            for r in rejected_rows[:5]:
                print(f"     Line {r[0]}: {r[1]}")

        print(f"\n🚀 Inserting {len(valid_records):,} records into PostgreSQL in batches of 5,000...")
        insert_query = """
            INSERT INTO daily_sales (
                id, age_group, business_id, category, country,
                covid_flag, created_at, date, day, expiry_days_remaining,
                medicine, month, region, stock_level, total_revenue,
                unit_price, units_sold, year
            ) VALUES %s
        """

        with conn.cursor() as cur:
            batch_size = 5000
            for i in range(0, len(valid_records), batch_size):
                batch = valid_records[i : i + batch_size]
                execute_values(cur, insert_query, batch, page_size=batch_size)
                print(f"   -> Inserted {min(i + batch_size, len(valid_records)):,} / {len(valid_records):,} rows...")
            
            conn.commit()

        print("✅ Batch insertion committed successfully!")

        # Verification Queries
        print("\n🔍 Running Verification Queries on PostgreSQL...")
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM daily_sales WHERE business_id = %s;", (business_id,))
            db_count = cur.fetchone()[0]

            cur.execute("SELECT MIN(date), MAX(date) FROM daily_sales WHERE business_id = %s;", (business_id,))
            min_date, max_date = cur.fetchone()

            cur.execute("SELECT COUNT(DISTINCT medicine) FROM daily_sales WHERE business_id = %s;", (business_id,))
            med_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(DISTINCT country) FROM daily_sales WHERE business_id = %s;", (business_id,))
            country_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(DISTINCT region) FROM daily_sales WHERE business_id = %s;", (business_id,))
            region_count = cur.fetchone()[0]

            cur.execute("SELECT SUM(units_sold), SUM(total_revenue) FROM daily_sales WHERE business_id = %s;", (business_id,))
            total_units, total_rev = cur.fetchone()

            print(f"   -> PostgreSQL daily_sales count: {db_count:,}")
            print(f"   -> Date range:                   {min_date} to {max_date}")
            print(f"   -> Distinct medicines:           {med_count}")
            print(f"   -> Distinct countries:           {country_count}")
            print(f"   -> Distinct regions:             {region_count}")
            print(f"   -> Total units sold:             {total_units:,}")
            print(f"   -> Total gross revenue:          ${total_rev:,.2f}")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error during import: {e}")
        sys.exit(1)
    finally:
        conn.close()

    print("\n==================================================")
    print("  DAILY SALES IMPORT COMPLETED SUCCESSFULLY!      ")
    print("==================================================")

if __name__ == "__main__":
    main()
