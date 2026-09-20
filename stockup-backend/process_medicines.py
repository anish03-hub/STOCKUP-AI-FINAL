import os
import sys
import uuid
import random
from datetime import date, timedelta
import pandas as pd
import numpy as np
import requests
import psycopg2

def process_and_generate_csv():
    # Set seed for reproducible generation
    np.random.seed(42)
    random.seed(42)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, "ndctext", "product.txt")
    output_csv = os.path.join(script_dir, "medicines_2020_2025.csv")

    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file not found: {input_file}")

    print(f"Reading {input_file}...")
    df = pd.read_csv(input_file, sep='\t', encoding='latin1', dtype=str)
    print(f"Total raw records: {len(df)}")

    # 1. Convert STARTMARKETINGDATE and ENDMARKETINGDATE (YYYYMMDD) to datetime objects
    start_dt = pd.to_datetime(df['STARTMARKETINGDATE'], format='%Y%m%d', errors='coerce')
    end_dt = pd.to_datetime(df['ENDMARKETINGDATE'], format='%Y%m%d', errors='coerce')

    # 2. Filter rows where the active date window overlaps 2020-01-01 to 2025-12-31
    # Active overlap condition: start_date <= 2025-12-31 AND (end_date is null OR end_date >= 2020-01-01)
    filter_mask = (start_dt <= pd.Timestamp('2025-12-31')) & (end_dt.isna() | (end_dt >= pd.Timestamp('2020-01-01')))
    filtered_df = df[filter_mask].copy()
    print(f"Records active between 2020 and 2025: {len(filtered_df)}")

    # 3. Deduplicate by PRODUCTNDC
    dedup_df = filtered_df.drop_duplicates(subset=['PRODUCTNDC']).copy()
    print(f"Unique medicines by PRODUCTNDC: {len(dedup_df)}")

    # 4. Sample top 2,500 records
    sample_df = dedup_df.head(2500).copy()
    print(f"Sampled records for ingestion: {len(sample_df)}")

    # Date range for expiryDate: 2026-10-01 to 2028-12-31
    start_expiry = date(2026, 10, 1)
    end_expiry = date(2028, 12, 31)
    delta_days = (end_expiry - start_expiry).days

    records = []
    for _, row in sample_df.iterrows():
        code = str(row['PRODUCTNDC']).strip() if pd.notna(row['PRODUCTNDC']) else ''
        
        # Name: PROPRIETARYNAME + DOSAGEFORMNAME (title-cased)
        prop = str(row['PROPRIETARYNAME']).strip() if pd.notna(row['PROPRIETARYNAME']) and str(row['PROPRIETARYNAME']).strip() != 'nan' else ''
        dosage = str(row['DOSAGEFORMNAME']).strip() if pd.notna(row['DOSAGEFORMNAME']) and str(row['DOSAGEFORMNAME']).strip() != 'nan' else ''
        nonprop = str(row['NONPROPRIETARYNAME']).strip() if pd.notna(row['NONPROPRIETARYNAME']) and str(row['NONPROPRIETARYNAME']).strip() != 'nan' else ''
        
        if prop and dosage:
            full_name = f"{prop} {dosage}"
        elif prop:
            full_name = prop
        elif nonprop and dosage:
            full_name = f"{nonprop} {dosage}"
        elif nonprop:
            full_name = nonprop
        else:
            full_name = "Medicine"
        name = full_name.title()

        # Category: Primary therapeutic category from PHARM_CLASSES (max 50 chars)
        pharm = str(row['PHARM_CLASSES']).strip() if pd.notna(row['PHARM_CLASSES']) and str(row['PHARM_CLASSES']).strip() != 'nan' else ''
        if pharm:
            category = pharm.split(',')[0].strip()[:50]
        else:
            category = "General Medicine"

        # Manufacturer: LABELERNAME (title-cased)
        labeler = str(row['LABELERNAME']).strip() if pd.notna(row['LABELERNAME']) and str(row['LABELERNAME']).strip() != 'nan' else ''
        manufacturer = labeler.title() if labeler else "Generic Manufacturer"

        # Description: NONPROPRIETARYNAME
        description = nonprop if nonprop else name

        # Price: Generated baseline price (uniform float between 5.00 and 150.00)
        price = round(random.uniform(5.00, 150.00), 2)

        # Selling price: price * 1.30
        selling_price = round(price * 1.30, 2)

        # Quantity: Initial stock level (integer between 25 and 400)
        quantity = random.randint(25, 400)

        # Expiry date: formatted YYYY-MM-DD, between 2026-10-01 and 2028-12-31
        random_days = random.randint(0, delta_days)
        expiry_date = (start_expiry + timedelta(days=random_days)).isoformat()

        # Status: Constant string 'IN_STOCK'
        status = 'IN_STOCK'

        records.append({
            'code': code,
            'name': name,
            'category': category,
            'manufacturer': manufacturer,
            'description': description,
            'price': price,
            'sellingPrice': selling_price,
            'quantity': quantity,
            'expiryDate': expiry_date,
            'status': status
        })

    out_df = pd.DataFrame(records)
    out_df.to_csv(output_csv, index=False)
    print(f"Exported {len(out_df)} records to {output_csv}")
    return output_csv, out_df

def check_and_import(csv_path, df_records):
    # Check if Spring Boot is accessible on port 8080
    api_url = "http://localhost:8080/api/items/import"
    spring_boot_running = False
    
    try:
        ping = requests.get("http://localhost:8080/api/items", timeout=2)
        if ping.status_code in [200, 401, 403]:
            spring_boot_running = True
            print("Spring Boot service detected on port 8080.")
    except Exception:
        spring_boot_running = False

    if spring_boot_running:
        print(f"Attempting multipart POST to {api_url}...")
        try:
            with open(csv_path, 'rb') as f:
                files = {'file': ('medicines_2020_2025.csv', f, 'text/csv')}
                res = requests.post(api_url, files=files, timeout=30)
                if res.status_code == 200:
                    print("Successfully imported via Spring Boot API:", res.json())
                    return
                else:
                    print(f"Spring Boot API returned status {res.status_code}: {res.text}. Falling back to direct PostgreSQL import...")
        except Exception as e:
            print(f"API upload failed: {e}. Falling back to direct PostgreSQL import...")

    # Direct PostgreSQL import
    print("Performing direct PostgreSQL ingestion on port 5432...")
    db_name = os.getenv("DATABASE_NAME", "stockup_ai")
    db_user = os.getenv("DATABASE_USERNAME", "postgres")
    db_pass = os.getenv("DATABASE_PASSWORD", "postgres")
    db_host = os.getenv("DATABASE_HOST", "localhost")
    db_port = os.getenv("DATABASE_PORT", "5432")

    conn = psycopg2.connect(
        dbname=db_name,
        user=db_user,
        password=db_pass,
        host=db_host,
        port=db_port
    )
    cursor = conn.cursor()

    # Load existing codes to avoid duplicate primary key / duplicate code if applicable
    cursor.execute("SELECT code, id FROM items WHERE code IS NOT NULL")
    existing_items = {row[0]: row[1] for row in cursor.fetchall()}

    inserted_count = 0
    updated_count = 0

    for _, row in df_records.iterrows():
        code = row['code']
        name = row['name']
        category = row['category']
        manufacturer = row['manufacturer']
        description = row['description']
        price = float(row['price'])
        selling_price = float(row['sellingPrice'])
        quantity = int(row['quantity'])
        expiry_date = str(row['expiryDate'])
        status = str(row['status'])

        if code in existing_items:
            # Update existing record
            item_id = existing_items[code]
            cursor.execute("""
                UPDATE items
                SET name = %s, category = %s, manufacturer = %s, description = %s,
                    price = %s, selling_price = %s, quantity = %s, expiry_date = %s, status = %s
                WHERE id = %s
            """, (name, category, manufacturer, description, price, selling_price, quantity, expiry_date, status, item_id))
            updated_count += 1
        else:
            # Insert new record
            item_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO items (id, code, name, category, manufacturer, description, price, selling_price, quantity, expiry_date, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (item_id, code, name, category, manufacturer, description, price, selling_price, quantity, expiry_date, status))
            existing_items[code] = item_id
            inserted_count += 1

    conn.commit()
    print(f"Direct PostgreSQL Ingestion complete: {inserted_count} inserted, {updated_count} updated.")

    cursor.execute("SELECT count(*) FROM items")
    final_count = cursor.fetchone()[0]
    print(f"Final record count in 'items' table: {final_count}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    csv_path, df_records = process_and_generate_csv()
    check_and_import(csv_path, df_records)
