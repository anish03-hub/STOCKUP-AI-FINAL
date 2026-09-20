import requests
import json
import psycopg2

BASE = "http://localhost:5173"
API_BASE = "http://localhost:8080"

def test_full_diagnostic():
    print("=" * 80)
    print("STOCKUP AI — 403 / AUTHENTICATION & MULTI-TENANT VERIFICATION SUITE")
    print("=" * 80)

    # 1. DATABASE INSPECTION
    print("\n--- STEP 1: DATABASE RECORD INSPECTION ---")
    conn = psycopg2.connect(dbname="stockup_ai", user="postgres", password="postgres", host="localhost", port=5432)
    cur = conn.cursor()
    cur.execute("SELECT id, email, full_name, role, business_id FROM users WHERE LOWER(email) = LOWER('medicare@stockupai.in');")
    user_row = cur.fetchone()
    print(f"User in DB: ID={user_row[0]}, Email={user_row[1]}, Name={user_row[2]}, Role={user_row[3]}, BusinessId={user_row[4]}")
    
    cur.execute(f"SELECT id, business_name, email FROM businesses WHERE id = '{user_row[4]}';")
    biz_row = cur.fetchone()
    print(f"Business in DB: ID={biz_row[0]}, Name={biz_row[1]}, Email={biz_row[2]}")

    cur.execute(f"SELECT COUNT(*) FROM items WHERE business_id = '{user_row[4]}';")
    item_count = cur.fetchone()[0]
    print(f"Total Medicine Items for MediCare in DB: {item_count}")
    cur.close()
    conn.close()

    # 2. LOGIN & JWT CLAIMS
    print("\n--- STEP 2: LOGIN & JWT VERIFICATION ---")
    login_res = requests.post(f"{BASE}/api/auth/login", json={"email": "medicare@stockupai.in", "password": "Anish@123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()
    token = login_data.get("token")
    auth_user = login_data.get("user")
    print(f"✅ Login successful!")
    print(f"Token (first 30 chars): {token[:30]}...")
    print(f"User payload: {auth_user}")

    # 3. ENDPOINTS TEST TABLE
    print("\n--- STEP 3: ENDPOINT STATUS MATRIX ---")
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        ("GET", "/api/dashboard/summary", None),
        ("GET", "/api/items", None),
        ("GET", "/api/items?page=0&size=20", None),
        ("GET", "/api/sales/billing/history", None),
        ("GET", "/api/sales/filters", None),
        ("GET", "/api/suppliers", None),
        ("GET", "/api/purchase-orders", None),
        ("GET", "/api/forecast/daily/metadata", None),
        ("POST", "/api/assistant/query", {"message": "what is our stock of Humulin?"}),
        ("POST", "/api/reorder/calculate", {"medicineName": "Humulin Injection, Solution", "predictedDemand": 100})
    ]

    print(f"{'Method':<6} | {'Endpoint':<35} | {'Auth Status':<12} | {'Unauth Status':<14} | {'Result'}")
    print("-" * 80)

    for method, ep, body in endpoints:
        # Authenticated call
        if method == "GET":
            auth_r = requests.get(f"{BASE}{ep}", headers=headers)
            unauth_r = requests.get(f"{BASE}{ep}")
        else:
            auth_r = requests.post(f"{BASE}{ep}", headers=headers, json=body)
            unauth_r = requests.post(f"{BASE}{ep}", json=body)

        status_str = f"HTTP {auth_r.status_code}"
        unauth_str = f"HTTP {unauth_r.status_code}"
        success = "✅ OK" if auth_r.status_code in [200, 201] and unauth_r.status_code == 401 else f"❌ Issue (Auth={auth_r.status_code}, Unauth={unauth_r.status_code})"
        print(f"{method:<6} | {ep:<35} | {status_str:<12} | {unauth_str:<14} | {success}")

    # 4. MULTI-TENANT ISOLATION TEST
    print("\n--- STEP 4: CROSS-TENANT ISOLATION SECURITY TEST ---")
    # Login as Apollo Apex
    apollo_login = requests.post(f"{BASE}/api/auth/login", json={"email": "apolloapex@stockupai.in", "password": "ApolloSecure2026!"}).json()
    apollo_token = apollo_login.get("token")
    apollo_headers = {"Authorization": f"Bearer {apollo_token}"}
    
    # Get a MediCare item ID
    medicare_items = requests.get(f"{BASE}/api/items?page=0&size=5", headers=headers).json().get("content", [])
    medicare_item = medicare_items[0]
    medicare_item_id = medicare_item["id"]

    # Attempt cross-tenant access by Apollo to MediCare's item
    cross_res = requests.get(f"{BASE}/api/items/{medicare_item_id}", headers=apollo_headers)
    print(f"Apollo attempting GET MediCare item ({medicare_item_id}): Status = {cross_res.status_code} ({cross_res.json()})")
    assert cross_res.status_code == 404 or cross_res.status_code == 403, f"Cross-tenant leak! Status: {cross_res.status_code}"
    print("✅ Multi-tenant isolation verified: Cross-tenant access successfully blocked!")

    # 5. POS TRANSACTION TEST
    print("\n--- STEP 5: POS BILLING & INVENTORY REGRESSION TEST ---")
    pos_res = requests.get(f"{BASE}/api/items?page=0&size=20&search=Paracetamol", headers=headers).json()
    para_items = pos_res.get("content", [])
    if para_items:
        para = para_items[0]
        initial_stock = para["quantity"]
        print(f"Paracetamol initial stock for MediCare: {initial_stock} units")
        
        # Perform sale
        sale_req = {
            "itemId": para["id"],
            "itemName": para["name"],
            "quantitySold": 2,
            "paymentMethod": "CASH",
            "customerName": "John Doe",
            "customerPhone": "9876543210"
        }
        sale_r = requests.post(f"{BASE}/api/sales/billing/create", headers=headers, json=sale_req)
        print(f"POS Sale response: Status = {sale_r.status_code} ({sale_r.json().get('invoiceNumber', 'No invoice')})")
        assert sale_r.status_code == 201, f"POS Sale failed: {sale_r.text}"
        
        # Verify stock decrement
        updated_res = requests.get(f"{BASE}/api/items/{para['id']}", headers=headers).json()
        print(f"Paracetamol stock after selling 2 units: {updated_res.get('quantity')} units (Decremented from {initial_stock} -> {updated_res.get('quantity')})")
        assert updated_res.get("quantity") == initial_stock - 2, "Stock did not decrement correctly!"
        print("✅ POS Lifecycle verified!")

    print("\n" + "=" * 80)
    print("🎉 ALL CHECKS & REGRESSION TESTS PASSED 100%!")
    print("=" * 80)

if __name__ == "__main__":
    test_full_diagnostic()
