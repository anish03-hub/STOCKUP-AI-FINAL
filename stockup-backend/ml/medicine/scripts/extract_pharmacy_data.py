#!/usr/bin/env python3
"""
Extract pharmacy inventory data from data.js and save as CSV.
"""

import re
import pandas as pd
import os

def extract_data_from_js(file_path):
    """Extract the medicine data from data.js file."""
    with open(file_path, 'r') as f:
        content = f.read()

    # Extract the array content between the brackets after "const sampleMedicins = "
    # and before the closing ";"
    # Pattern: const sampleMedicins = [ ... ];
    match = re.search(r'const sampleMedicins\s*=\s*(\[[\s\S]*?\])\s*;', content)

    if not match:
        print("Could not find medicine data array in the file")
        return None

    array_content = match.group(1)
    print(f"Extracted array content, length: {len(array_content)} characters")

    # Now we need to convert this JavaScript array to Python objects
    # Since it's mostly valid JSON except for unquoted property names and some other issues,
    # let's try to fix it step by step

    try:
        # Step 1: Add quotes around property names (words followed by colon)
        # But be careful not to mess with values that contain colons (like URLs)
        # We'll use a more targeted approach

        # Replace property names: change word: to "word":
        # This regex looks for word boundaries, word characters, optional whitespace, colon
        # but avoids matching inside strings by being careful about what we replace

        # Let's try a simpler approach: since we know the structure is consistent,
        # let's manually parse each object

        # Split the array content by medicine objects
        # Each object starts with { and ends with },
        # but we need to handle nested braces (there aren't any in our data)

        # Find all medicine objects
        # Pattern: { followed by content that doesn't contain } at the top level
        # Since there are no nested objects in our medicine data, we can use:
        object_pattern = r'\{[^}]+\}'
        objects = re.findall(object_pattern, array_content)

        if not objects:
            # Try a more flexible pattern that handles possible newlines
            object_pattern = r'\{(?:[^{}]|\{[^}]*\})*\}'
            objects = re.findall(object_pattern, array_content, re.DOTALL)

        print(f"Found {len(objects)} medicine objects using regex")

        medicines = []
        for obj_str in objects:
            medicine = {}

            # Extract fields from this object
            # Look for patterns like: property: value,
            # or property: value (at the end before })

            # Split by lines to make it easier to handle
            lines = obj_str.split('\n')

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Remove trailing comma if present
                if line.endswith(','):
                    line = line[:-1]

                # Check if this line contains a colon (property: value)
                if ':' in line:
                    # Split on the first colon only
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        field_name = parts[0].strip()
                        field_value = parts[1].strip()

                        # Clean up the value
                        # Remove quotes if present
                        if field_value.startswith('"') and field_value.endswith('"') and len(field_value) > 1:
                            field_value = field_value[1:-1]
                        elif field_value.startswith("'") and field_value.endswith("'") and len(field_value) > 1:
                            field_value = field_value[1:-1]

                        # Handle numeric fields
                        if field_name in ['price', 'countInStock']:
                            try:
                                if '.' in field_value:
                                    field_value = float(field_value)
                                else:
                                    field_value = int(field_value)
                            except ValueError:
                                pass  # Keep as string if conversion fails

                        medicine[field_name] = field_value

            if medicine:  # Only add if we got some data
                medicines.append(medicine)

        if medicines:
            print(f"Successfully extracted {len(medicines)} medicine records")
            return medicines
        else:
            print("No medicine records extracted")
            return None

    except Exception as e:
        print(f"Error during extraction: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main extraction function."""
    js_file = "/Users/anishkumarsah/Desktop/stockup-backend/ml/medicine/raw_data/data.js"
    csv_file = "/Users/anishkumarsah/Desktop/stockup-backend/ml/medicine/data/pharmacy_inventory.csv"

    print("Extracting medicine data from data.js...")
    data = extract_data_from_js(js_file)

    if data is None:
        print("Failed to extract data")
        return False

    print(f"Found {len(data)} medicine records")

    # Convert to DataFrame
    df = pd.DataFrame(data)

    # Select and rename columns to match our desired format
    column_mapping = {
        'drugName': 'Medicine_Name',
        'category': 'Category',
        'manufacturer': 'Manufacturer',
        'price': 'Medicine_Price',
        'expirydate': 'Expiry_Date',
        'countInStock': 'Quantity'
    }

    # Check if all required columns exist
    missing_cols = [col for col in column_mapping.keys() if col not in df.columns]
    if missing_cols:
        print(f"Warning: Missing columns in source data: {missing_cols}")
        # Only keep columns that exist
        available_mapping = {k: v for k, v in column_mapping.items() if k in df.columns}
        df = df[list(available_mapping.keys())].rename(columns=available_mapping)
    else:
        df = df[list(column_mapping.keys())].rename(columns=column_mapping)

    # Ensure data directory exists
    os.makedirs(os.path.dirname(csv_file), exist_ok=True)

    # Save to CSV
    df.to_csv(csv_file, index=False)
    print(f"Saved pharmacy inventory data to: {csv_file}")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")

    # Show first few records
    print("\nFirst 3 records:")
    print(df.head(3).to_string())

    return True

if __name__ == "__main__":
    main()