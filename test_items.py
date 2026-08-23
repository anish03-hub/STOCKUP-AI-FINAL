import requests

try:
    print("Logging in...")
    r = requests.post("http://localhost:8080/api/auth/login", json={"email": "admin@example.com", "password": "password"})
    token = r.json().get("token")
    if token:
        print("Logged in successfully. Fetching items...")
        r = requests.get("http://localhost:8080/api/items", headers={"Authorization": f"Bearer {token}"})
        print(f"Status: {r.status_code}")
        print(r.text[:500])
    else:
        print("Login failed:", r.status_code, r.text)
except Exception as e:
    print("Error:", e)
