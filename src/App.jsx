import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { CurrencyProvider } from './context/CurrencyContext';
import MainLayout from './components/layout/MainLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ChangePassword from './pages/auth/ChangePassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';
import InventoryHealthDashboard from './pages/dashboard/InventoryHealthDashboard';

// Medicines
import Medicines from './pages/medicines/Medicines';
import AddMedicine from './pages/medicines/AddMedicine';
import EditMedicine from './pages/medicines/EditMedicine';
import MedicineDetails from './pages/medicines/MedicineDetails';

// Inventory
import Inventory from './pages/inventory/Inventory';
import LowStock from './pages/inventory/LowStock';
import NearExpiry from './pages/inventory/NearExpiry';
import Expired from './pages/inventory/Expired';
import StockHistory from './pages/inventory/StockHistory';

// Forecast & AI
import ForecastDashboard from './pages/forecast/ForecastDashboard';
import PredictionHistory from './pages/forecast/PredictionHistory';
import ForecastDetails from './pages/forecast/ForecastDetails';
import AIAssistant from './pages/ai/AIAssistant';

// Suppliers
import SupplierList from './pages/suppliers/SupplierList';
import AddSupplier from './pages/suppliers/AddSupplier';
import EditSupplier from './pages/suppliers/EditSupplier';
import SupplierDetails from './pages/suppliers/SupplierDetails';

// Purchase Orders
import PurchaseOrders from './pages/purchase/PurchaseOrders';
import CreatePurchaseOrder from './pages/purchase/CreatePurchaseOrder';
import PurchaseHistory from './pages/purchase/PurchaseHistory';

// Reports
import Reports from './pages/reports/Reports';

// Profile & Settings
import Profile from './pages/profile/Profile';
import Settings from './pages/profile/Settings';
import UserManagement from './pages/users/UserManagement';

// Prediction & Reorder
import DemandPrediction from './pages/prediction/DemandPrediction';
import MedicineDemandPrediction from './pages/prediction/MedicineDemandPrediction';
import StockoutPrediction from './pages/stockout/StockoutPrediction';
import ReorderOptimization from './pages/reorder/ReorderOptimization';
import ExpiryAlerts from './pages/expiry/ExpiryAlerts';

// Sales & POS
import SalesAnalytics from './pages/sales/SalesAnalytics';
import SalesBillingPOS from './pages/sales/SalesBillingPOS';
import SalesHistory from './pages/sales/SalesHistory';

// Support
import SupportCenter from './pages/support/SupportCenter';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('stockup_user') !== null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('stockup_user') !== null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/change-password" element={<PublicRoute><ChangePassword /></PublicRoute>} />
            <Route path="/support" element={<PublicRoute><SupportCenter /></PublicRoute>} />

            {/* Protected Routes inside MainLayout */}
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              {/* Dashboard Default */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<InventoryHealthDashboard />} />
              <Route path="dashboard-old" element={<Dashboard />} />

              {/* Medicines */}
              <Route path="medicines" element={<Medicines />} />
              <Route path="medicines/add" element={<AddMedicine />} />
              <Route path="medicines/:id/edit" element={<EditMedicine />} />
              <Route path="medicines/:id" element={<MedicineDetails />} />

              {/* Inventory */}
              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory/low-stock" element={<LowStock />} />
              <Route path="inventory/near-expiry" element={<NearExpiry />} />
              <Route path="inventory/expired" element={<Expired />} />
              <Route path="inventory/history" element={<StockHistory />} />

              {/* AI Assistant */}
              <Route path="ai" element={<AIAssistant />} />
              <Route path="ai-assistant" element={<AIAssistant />} />

              {/* Demand & Stockout Prediction */}
              <Route path="forecast" element={<ForecastDashboard />} />
              <Route path="forecast/history" element={<PredictionHistory />} />
              <Route path="forecast/:id" element={<ForecastDetails />} />
              <Route path="prediction" element={<DemandPrediction />} />
              <Route path="prediction/demand" element={<DemandPrediction />} />
              <Route path="prediction/medicine" element={<MedicineDemandPrediction />} />
              <Route path="prediction/medicine-demand" element={<MedicineDemandPrediction />} />
              <Route path="prediction/stockout" element={<StockoutPrediction />} />
              <Route path="prediction/reorder" element={<ReorderOptimization />} />
              <Route path="prediction/expiry" element={<ExpiryAlerts />} />
              <Route path="prediction/history" element={<PredictionHistory />} />
              <Route path="stockout" element={<StockoutPrediction />} />
              <Route path="reorder" element={<ReorderOptimization />} />
              <Route path="expiry" element={<ExpiryAlerts />} />

              {/* Sales & POS */}
              <Route path="billing" element={<SalesBillingPOS />} />
              <Route path="sales/pos" element={<SalesBillingPOS />} />
              <Route path="sales/history" element={<SalesHistory />} />
              <Route path="sales/analytics" element={<SalesAnalytics />} />
              <Route path="sales-analytics" element={<SalesAnalytics />} />

              {/* Suppliers */}
              <Route path="suppliers" element={<SupplierList />} />
              <Route path="suppliers/add" element={<AddSupplier />} />
              <Route path="suppliers/:id/edit" element={<EditSupplier />} />
              <Route path="suppliers/:id" element={<SupplierDetails />} />

              {/* Purchase Orders */}
              <Route path="purchase" element={<PurchaseOrders />} />
              <Route path="purchase/create" element={<CreatePurchaseOrder />} />
              <Route path="purchase/history" element={<PurchaseHistory />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="purchase-orders/create" element={<CreatePurchaseOrder />} />
              <Route path="purchase-orders/history" element={<PurchaseHistory />} />

              {/* Reports */}
              <Route path="reports" element={<Reports />} />

              {/* Profile & Settings & Users */}
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="user-management" element={<UserManagement />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
