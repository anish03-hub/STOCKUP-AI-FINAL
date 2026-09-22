import time
from locust import HttpUser, task, between

class StockUpUser(HttpUser):
    wait_time = between(0.1, 0.5)
    token = None

    def on_start(self):
        """Authenticate and store JWT token before executing tasks."""
        response = self.client.post("/api/auth/login", json={
            "email": "perftest@stockupai.in",
            "password": "PerfPassword123!"
        })
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            print(f"Authentication failed: {response.status_code} - {response.text}")

    @task(3)
    def view_dashboard_summary(self):
        """Read-only: Inventory Health & Dashboard summary."""
        self.client.get("/api/dashboard/summary", name="1. Dashboard Summary")

    @task(3)
    def search_inventory(self):
        """Read-only: Medicine inventory list."""
        self.client.get("/api/items?page=0&size=20", name="2. Medicine Inventory")

    @task(2)
    def view_sales_summary(self):
        """Read-only: Sales analytics summary."""
        self.client.get("/api/sales/summary", name="3. Sales Analytics Summary")

    @task(2)
    def view_sales_filters(self):
        """Read-only: Sales analytics filter options."""
        self.client.get("/api/sales/filters", name="4. Sales Filter Options")

    @task(1)
    def view_forecast_metadata(self):
        """Read-only: Daily demand forecasting model metadata."""
        self.client.get("/api/forecast/daily/metadata", name="5. Forecast Metadata")
