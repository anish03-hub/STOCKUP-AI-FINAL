import requests
import json

BASE = "http://localhost:5173"

def test_pos_flow():
    print("=" * 80)
    print("PHARMACY POS BILLING & SALES HISTORY COMPLETE E2E TEST")
    print("=" * 80)

    # 1. Login as MediCare
    login_res = requests.post(f"{BASE}/api/auth/login", json={"email": "medicare@stockupai.in", "password": "Anish@123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print("1. ✅ Logged in as MediCare (Anish sah, ADMIN)")

    # 2. Find Paracetamol
    item_res = requests.get(f"{BASE}/api/items?page=0&size=5&search=Paracetamol", headers=headers).json()
    paracetamol = item_res.get("content", [])[0]
    para_id = paracetamol["id"]
    initial_qty = paracetamol["quantity"]
    print(f"2. ✅ Found Medicine in Catalog: '{paracetamol['name']}' (Code: {paracetamol['code']}) | Current Stock: {initial_qty} boxes | Unit Price: ${paracetamol.get('price')}")

    # 3. Oversale Rejection Test
    oversale_payload = {
        "itemId": para_id,
        "itemName": paracetamol["name"],
        "quantitySold": initial_qty + 500,
        "paymentMethod": "CASH",
        "customerName": "Oversell Tester"
    }
    over_res = requests.post(f"{BASE}/api/sales/billing/create", headers=headers, json=oversale_payload)
    print(f"3. ✅ Oversale Rejection Test: Status = {over_res.status_code} | Error = '{over_res.json().get('error', over_res.text)}'")
    assert over_res.status_code == 400, "Oversale was not blocked!"

    # 4. Valid Sale Test (Sell 2 boxes)
    sale_payload = {
        "itemId": para_id,
        "itemName": paracetamol["name"],
        "quantitySold": 2,
        "paymentMethod": "UPI",
        "customerName": "Sarah Jenkins",
        "customerPhone": "9876543210",
        "notes": "Doctor prescription verified"
    }
    sale_res = requests.post(f"{BASE}/api/sales/billing/create", headers=headers, json=sale_payload)
    assert sale_res.status_code == 201, f"Sale failed: {sale_res.text}"
    sale_data = sale_res.json()
    inv_num = sale_data["invoiceNumber"]
    print(f"4. ✅ Valid Sale Processed: Invoice = {inv_num} | Sold = {sale_data['quantitySold']} boxes | Stock Before = {sale_data['stockBefore']} -> Stock After = {sale_data['stockAfter']} | Status = '{sale_data['itemStatus']}'")
    assert sale_data["stockAfter"] == initial_qty - 2

    # 5. Fetch Invoice Details
    inv_res = requests.get(f"{BASE}/api/sales/billing/invoice/{inv_num}", headers=headers)
    assert inv_res.status_code == 200, f"Invoice fetch failed: {inv_res.text}"
    inv_data = inv_res.json()
    print(f"5. ✅ Invoice Retrieval Verified: Invoice #{inv_data['invoiceNumber']} | Customer: {inv_data['customerName']} | Paid: ${inv_data['totalAmount']} via {inv_data['paymentMethod']}")

    # 6. Sales History Verification
    hist_res = requests.get(f"{BASE}/api/sales/billing/history?limit=10", headers=headers)
    assert hist_res.status_code == 200, f"History fetch failed: {hist_res.text}"
    history = hist_res.json()
    print(f"6. ✅ Sales History Ledger: Found {len(history)} recent transactions")
    assert any(h["invoiceNumber"] == inv_num for h in history), "New invoice not in history!"

    # 7. Dashboard Summary Verification
    dash_res = requests.get(f"{BASE}/api/dashboard/summary", headers=headers).json()
    print(f"7. ✅ Live Dashboard KPIs: Total Items = {dash_res['totalItems']} | Low Stock Count = {dash_res['lowStockItemsCount']} | Valuation = ${dash_res['totalInventoryValue']:,.2f}")

    # 8. Cross-Tenant Invoice Security
    apollo_login = requests.post(f"{BASE}/api/auth/login", json={"email": "apolloapex@stockupai.in", "password": "ApolloSecure2026!"}).json()
    apollo_token = apollo_login.get("token")
    apollo_headers = {"Authorization": f"Bearer {apollo_token}"}
    cross_inv = requests.get(f"{BASE}/api/sales/billing/invoice/{inv_num}", headers=apollo_headers)
    print(f"8. ✅ Cross-Tenant Invoice Isolation: Apollo trying to read MediCare's invoice {inv_num} -> Status: {cross_inv.status_code}")
    assert cross_inv.status_code in [403, 404], "Tenant invoice leak!"

    print("\n" + "=" * 80)
    print("🎉 ALL 8 POS & SALES HISTORY PHASES VERIFIED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    test_pos_flow()
