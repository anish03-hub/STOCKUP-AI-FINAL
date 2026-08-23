import requests

r = requests.post("http://localhost:8080/api/auth/login", json={"email": "admin@example.com", "password": "password"})
token = r.json().get("token")
print("Logged in. Fetching items...")
r2 = requests.get("http://localhost:8080/api/items", headers={"Authorization": f"Bearer {token}"})
print(f"Status: {r2.status_code}")
if r2.status_code == 200:
    items = r2.json()
    print(f"Fetched {len(items)} items")
    if len(items) > 0:
        print(items[0])
else:
    print(r2.text)
