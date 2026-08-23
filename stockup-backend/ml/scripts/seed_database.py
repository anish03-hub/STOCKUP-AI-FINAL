import csv
import sys
import datetime
from pymongo import MongoClient

def determine_status(quantity, expiry_date_str):
    if int(quantity) <= 0:
        return "Out of Stock"
    if int(quantity) < 20:
        return "Low Stock"
    
    try:
        exp_date = datetime.datetime.strptime(expiry_date_str.strip(), "%Y-%m-%d")
        # Just assume current date is Aug 2026 based on prompt
        current_date = datetime.datetime(2026, 8, 13)
        if exp_date < current_date:
            return "Expired"
    except:
        pass
        
    return "In Stock"

def main():
    print("Connecting to MongoDB...")
    client = MongoClient("mongodb://localhost:27017/")
    db = client.stockup_ai
    collection = db.items
    
    print("Clearing existing items...")
    collection.delete_many({})
    
    csv_file = "/Users/anishkumarsah/Desktop/STOCKUP-AI/stockup-backend/ml/medicine/data/pharmacy_inventory.csv"
    print(f"Reading data from {csv_file}...")
    
    items_to_insert = []
    
    try:
        with open(csv_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 1
            for row in reader:
                code = f"MED-{count:03d}"
                
                description = f"High quality {row.get('Category', '')} medicine by {row.get('Manufacturer', '')}"
                
                try:
                    price = float(row.get('Medicine_Price', 0.0))
                except:
                    price = 0.0
                    
                selling_price = price * 1.25
                
                status = determine_status(row.get('Quantity', 0), row.get('Expiry_Date', ''))
                
                item = {
                    "name": row.get('Medicine_Name', '').strip(),
                    "code": code,
                    "category": row.get('Category', '').strip(),
                    "manufacturer": row.get('Manufacturer', '').strip(),
                    "description": description,
                    "price": price,
                    "sellingPrice": round(selling_price, 2),
                    "quantity": int(row.get('Quantity', 0)),
                    "expiryDate": row.get('Expiry_Date', '').strip(),
                    "status": status,
                    "_class": "com.stockup.backend.model.Item"
                }
                
                items_to_insert.append(item)
                count += 1
                
        if items_to_insert:
            print(f"Inserting {len(items_to_insert)} items into MongoDB...")
            collection.insert_many(items_to_insert)
            print("Successfully seeded database!")
        else:
            print("No items found in CSV.")
            
    except Exception as e:
        print(f"Error seeding database: {e}")

if __name__ == "__main__":
    main()
