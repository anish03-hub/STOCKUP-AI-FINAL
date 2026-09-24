/**
 * StockUp AI — Centralized API Service Layer
 * 
 * Manages connections to:
 *  - Spring Boot backend (port 8080) — Auth, Items, Business, Predictions, Dashboard, Assistant
 */

// ─── Base URLs ───────────────────────────────────────────────────────────────
const SPRING_API = import.meta.env.VITE_API_BASE_URL || '/api';
const HEALTH_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')
  : '';


// ─── Token Helpers ───────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('stockup_token');
export const setToken = (token) => localStorage.setItem('stockup_token', token);
export const removeToken = () => localStorage.removeItem('stockup_token');

export const getUser = () => {
  const raw = localStorage.getItem('stockup_user');
  return raw ? JSON.parse(raw) : null;
};

export const setUser = (user) =>
  localStorage.setItem('stockup_user', JSON.stringify(user));

export const removeUser = () => localStorage.removeItem('stockup_user');

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};

// ─── Generic Fetch Wrapper ──────────────────────────────────────────────────
/**
 * Authenticated fetch wrapper.
 * Automatically attaches JWT Authorization header for Spring Boot calls.
 * Handles 401 by logging out.
 */
async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    if (err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'))) {
      throw new Error('Unable to connect to StockUp AI backend.');
    }
    throw err;
  }

  if (res.status === 401) {
    logout();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (res.status === 403) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'You do not have permission to view this inventory.');
  }

  if (res.status === 404) {
    throw new Error('Medicine inventory endpoint was not found.');
  }

  if (res.status >= 500) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'StockUp AI backend encountered an error.');
  }

  if (!res.ok) {
    let errorMsg = `HTTP error ${res.status}: ${res.statusText}`;
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await res.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } else {
        const text = await res.text();
        if (text && text.length < 200) errorMsg = text;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  return res;
}

// ─── Auth API (Spring Boot) ─────────────────────────────────────────────────
export const authApi = {
  /**
   * Login with email + password.
   * Returns { token, user: { id, fullName, email, phone, role, businessId, createdAt } }
   */
  login: async (email, password) => {
    const res = await fetch(`${SPRING_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed (${res.status})`);
    }

    const data = await res.json();
    // Store token and user
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  /**
   * Google OAuth authentication.
   * Sends Google ID Token credential and optional businessName/password.
   */
  googleAuth: async (payload) => {
    const res = await fetch(`${SPRING_API}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Google authentication failed (${res.status})`);
    }

    const data = await res.json();
    if (data.status === 'SUCCESS' && data.token) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  },

  /**
   * Register a new user and business.
   * Returns { token, user }. Registration deliberately does not create a
   * browser session; users must sign in after creating their account.
   */
  register: async (registrationData) => {
    const res = await fetch(`${SPRING_API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message = errorData.message || errorData.error || Object.values(errorData)[0];
      throw new Error(message || `Registration failed (${res.status})`);
    }

    return res.json();
  },

  /**
   * Get current user profile (requires JWT).
   */
  profile: async () => {
    const res = await request(`${SPRING_API}/auth/profile`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  /**
   * Password Reset Flow Endpoints
   */
  requestPasswordReset: async (identifier) => {
    const res = await fetch(`${SPRING_API}/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to request password reset.');
    }
    return res.json();
  },

  resendPasswordResetOtp: async (resetRequestId) => {
    const res = await fetch(`${SPRING_API}/auth/password-reset/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetRequestId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to resend verification code.');
    }
    return res.json();
  },

  verifyPasswordResetOtp: async (resetRequestId, otp) => {
    const res = await fetch(`${SPRING_API}/auth/password-reset/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetRequestId, otp }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Invalid verification code.');
    }
    return res.json();
  },

  completePasswordReset: async (resetToken, newPassword) => {
    const res = await fetch(`${SPRING_API}/auth/password-reset/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to complete password reset.');
    }
    return res.json();
  },

  cancelPasswordReset: async (resetRequestId, resetToken) => {
    try {
      await fetch(`${SPRING_API}/auth/password-reset/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetRequestId, resetToken }),
      });
    } catch (_err) {
      // Safe fire-and-forget cancellation
    }
  },
};

// ─── Items API (Spring Boot) ────────────────────────────────────────────────
export const itemsApi = {
  getAll: async () => {
    const res = await request(`${SPRING_API}/items`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  getItems: async (page = 0, size = 20, search = '') => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    const res = await request(`${SPRING_API}/items?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  getById: async (id) => {
    const res = await request(`${SPRING_API}/items/${id}`);
    if (!res.ok) throw new Error('Failed to fetch item');
    return res.json();
  },

  getItemById: async (id) => {
    const res = await request(`${SPRING_API}/items/${id}`);
    if (!res.ok) throw new Error('Failed to fetch item');
    return res.json();
  },

  create: async (itemData) => {
    const res = await request(`${SPRING_API}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    if (!res.ok) throw new Error('Failed to create item');
    return res.json();
  },

  update: async (id, itemData) => {
    const res = await request(`${SPRING_API}/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
    if (!res.ok) throw new Error('Failed to update item');
    return res.json();
  },

  delete: async (id) => {
    const res = await request(`${SPRING_API}/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete item');
    return true;
  },

  importCsv: async (file) => {
    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${SPRING_API}/items/import`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to import items');
    return res.json();
  },
};

export const itemApi = itemsApi;

// ─── Notification API (Spring Boot) ──────────────────────────────────────────
export const notificationApi = {
  sendTestExpiryEmail: async (payload = {}) => {
    const res = await request(`${SPRING_API}/notifications/test-expiry-email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to send test expiry email.');
    }
    return res.json();
  },

  getExpiryHistory: async () => {
    const res = await request(`${SPRING_API}/notifications/expiry-history`);
    if (!res.ok) throw new Error('Failed to fetch expiry notification history.');
    return res.json();
  },
};


// ─── Business API (Spring Boot) ─────────────────────────────────────────────
export const businessApi = {
  register: async (data) => {
    const res = await request(`${SPRING_API}/business/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to register business');
    return res.json();
  },

  getAll: async () => {
    const res = await request(`${SPRING_API}/business`);
    if (!res.ok) throw new Error('Failed to fetch businesses');
    return res.json();
  },

  getById: async (id) => {
    const res = await request(`${SPRING_API}/business/${id}`);
    if (!res.ok) throw new Error('Failed to fetch business');
    return res.json();
  },

  update: async (id, data) => {
    const res = await request(`${SPRING_API}/business/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update business');
    return res.json();
  },

  delete: async (id) => {
    const res = await request(`${SPRING_API}/business/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete business');
    return true;
  },
};

// ─── Prediction API (Spring Boot → Python ML) ──────────────────────────────
export const predictionApi = {
  /**
   * Predict demand. Goes through Spring Boot which calls the Python ML API.
   */
  demand: async (data) => {
    const res = await request(`${SPRING_API}/predictions/demand`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Prediction failed (${res.status})`);
    }
    return res.json();
  },

  medicineDemand: async (productCode) => {
    const res = await request(`${SPRING_API}/predictions/medicine-demand`, {
      method: 'POST',
      body: JSON.stringify({ productCode }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const backendMessage = errorData.error || errorData.message || Object.values(errorData)[0];

      if (res.status === 400) {
        throw new Error(backendMessage || 'Select a supported medicine/product code.');
      }

      if (res.status === 502 || res.status === 503) {
        throw new Error('Medicine demand prediction service is temporarily unavailable.');
      }

      throw new Error(backendMessage || `Medicine demand prediction failed (${res.status})`);
    }

    return res.json();
  },

  health: async () => {
    const res = await fetch(`${SPRING_API}/predictions/health`);
    return res.ok;
  },
};

export const predictStockout = async (data) => {
  const res = await request(`${SPRING_API}/stockout/predict`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Stock-out prediction failed (${res.status})`);
  }
  return res.json();
};

export const optimizeReorder = async (data) => {
  const res = await request(`${SPRING_API}/reorder/calculate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Reorder calculation failed (${res.status})`);
  }
  return res.json();
};

export const getExpiryAlerts = async () => {
  const res = await request(`${SPRING_API}/inventory/expiry-alerts`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch expiry alerts (${res.status})`);
  }
  return res.json();
};

export const getDashboardSummary = async () => {
  const res = await request(`${SPRING_API}/dashboard/summary`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch dashboard summary (${res.status})`);
  }
  return res.json();
};

// ─── Supplier API (Spring Boot) ─────────────────────────────────────────────
export const supplierApi = {
  getAll: async () => {
    const res = await request(`${SPRING_API}/suppliers`);
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
  },

  getById: async (id) => {
    const res = await request(`${SPRING_API}/suppliers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch supplier');
    return res.json();
  },

  create: async (data) => {
    const res = await request(`${SPRING_API}/suppliers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create supplier');
    return res.json();
  },

  update: async (id, data) => {
    const res = await request(`${SPRING_API}/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update supplier');
    return res.json();
  },

  delete: async (id) => {
    const res = await request(`${SPRING_API}/suppliers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete supplier');
    return true;
  },

  /**
   * Data-driven supplier recommendation ranking.
   * @param {string} [category] optional category/medicine filter
   * @param {number} [limit] max recommendations
   */
  recommend: async (category, limit = 10) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (limit) params.set('limit', String(limit));
    const res = await request(`${SPRING_API}/suppliers/recommend?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch supplier recommendations');
    return res.json();
  },
};

// ─── Purchase Order API (Spring Boot) ───────────────────────────────────────
export const purchaseOrderApi = {
  getAll: async (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await request(`${SPRING_API}/purchase-orders${qs}`);
    if (!res.ok) throw new Error('Failed to fetch purchase orders');
    return res.json();
  },

  getById: async (id) => {
    const res = await request(`${SPRING_API}/purchase-orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch purchase order');
    return res.json();
  },

  getSummary: async () => {
    const res = await request(`${SPRING_API}/purchase-orders/summary`);
    if (!res.ok) throw new Error('Failed to fetch purchase order summary');
    return res.json();
  },

  create: async (data) => {
    const res = await request(`${SPRING_API}/purchase-orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create purchase order (${res.status})`);
    }
    return res.json();
  },

  updateStatus: async (id, status) => {
    const res = await request(`${SPRING_API}/purchase-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update purchase order status');
    return res.json();
  },

  receive: async (id) => {
    const res = await request(`${SPRING_API}/purchase-orders/${id}/receive`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to receive purchase order (${res.status})`);
    }
    return res.json();
  },

  delete: async (id) => {
    const res = await request(`${SPRING_API}/purchase-orders/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete purchase order');
    return true;
  },
};

// ─── Lead Time Prediction API (Spring Boot) ─────────────────────────────────
export const leadTimeApi = {
  predict: async ({ supplierId, supplierName, serviceLevel = 0.95 }) => {
    const res = await request(`${SPRING_API}/leadtime/predict`, {
      method: 'POST',
      body: JSON.stringify({ supplierId, supplierName, serviceLevel }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Lead-time prediction failed (${res.status})`);
    }
    return res.json();
  },
};

// ─── Forecast history & Evaluation API (Spring Boot) ────────────────────────
export const forecastApi = {
  history: async (productCode) => {
    const qs = productCode ? `?productCode=${encodeURIComponent(productCode)}` : '';
    const res = await request(`${SPRING_API}/forecast/history${qs}`);
    if (!res.ok) throw new Error('Failed to fetch forecast history');
    return res.json();
  },

  evaluation: async (productCode) => {
    const qs = productCode ? `?productCode=${encodeURIComponent(productCode)}` : '';
    const res = await request(`${SPRING_API}/forecast/evaluation${qs}`);
    if (!res.ok) throw new Error('Failed to fetch forecast evaluation metrics');
    return res.json();
  },

  save: async (data) => {
    const res = await request(`${SPRING_API}/forecast/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save forecast');
    return res.json();
  },
};

// ─── Daily Multi-Day Demand Forecasting API (177.9K Daily Sales Dataset) ────
export const dailyForecastApi = {
  predict: async (medicine, forecastDays = 7, country = null) => {
    const res = await request(`${SPRING_API}/forecast/daily/predict`, {
      method: 'POST',
      body: JSON.stringify({ medicine, forecastDays, country }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Daily demand forecast failed (${res.status})`);
    }
    return res.json();
  },

  metadata: async () => {
    const res = await request(`${SPRING_API}/forecast/daily/metadata`);
    if (!res.ok) throw new Error('Failed to fetch daily demand model metadata');
    return res.json();
  },
};

// ─── Explainable AI API (Spring Boot → Python ML) ───────────────────────────
export const explainApi = {
  /** Global feature importance for the demand model. */
  global: async () => {
    const res = await request(`${SPRING_API}/predictions/explain`);
    if (!res.ok) throw new Error('Failed to fetch model explanation');
    return res.json();
  },

  /** Explain a single prediction given a feature dict. */
  prediction: async (features) => {
    const res = await request(`${SPRING_API}/predictions/explain`, {
      method: 'POST',
      body: JSON.stringify(features),
    });
    if (!res.ok) throw new Error('Failed to explain prediction');
    return res.json();
  },
};

export const aiApi = {
  /**
   * Send a chat message to the AI assistant.
   */
  chat: async (message) => {
    const res = await request(`${SPRING_API}/assistant/query`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Chat failed (${res.status})`);
    }
    return res.json();
  },

  /**
   * Get AI-generated inventory insights from Spring Boot dashboard summary.
   */
  insights: async () => {
    try {
      const res = await request(`${SPRING_API}/dashboard/summary`);
      if (res.ok) {
        const data = await res.json();
        const actionItems = data.actionItems || [];
        const insights = actionItems.map((item, idx) => {
          let icon = 'check';
          let actionText = 'View Inventory';
          if (item.priority === 'URGENT') {
            icon = 'clock';
            actionText = 'View Expiry';
          } else if (item.priority === 'WARNING') {
            icon = 'alert';
            actionText = 'Optimize PO';
          }
          return {
            id: idx + 1,
            icon,
            text: item.message,
            action: actionText,
            route: item.suggestedActionRoute || '/dashboard',
          };
        });
        return { insights };
      }
    } catch {
      // Return empty array on error
    }
    return { insights: [] };
  },


  /**
   * Check if the backend is healthy.
   */
  health: async () => {
    try {
      const res = await fetch(`${SPRING_API}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return true;
    } catch {
      // Fallback check
    }
    try {
      const res = await fetch(`${HEALTH_BASE}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

// ─── Historical Daily Sales & Analytics API (Spring Boot) ───────────────────
export const salesApi = {
  getSummary: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/summary${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch sales summary');
    return res.json();
  },

  getTrends: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/trends${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch sales trends');
    return res.json();
  },

  getTopMedicines: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/top-medicines${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch top medicines');
    return res.json();
  },

  getCountries: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/countries${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch country sales');
    return res.json();
  },

  getRegions: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/regions${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch regional sales');
    return res.json();
  },

  getCategories: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/categories${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch category sales');
    return res.json();
  },

  getAgeGroups: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/age-groups${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch age group sales');
    return res.json();
  },

  getCovidAnalysis: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/covid-analysis${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch COVID analysis');
    return res.json();
  },

  getStockTrends: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const res = await request(`${SPRING_API}/sales/stock-trends${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch stock trends');
    return res.json();
  },

  getFilters: async () => {
    const res = await request(`${SPRING_API}/sales/filters`);
    if (!res.ok) throw new Error('Failed to fetch sales filters');
    return res.json();
  },
};

// ─── Point of Sale (POS) Billing & Inventory Deduction API ──────────────────
export const billingApi = {
  createSale: async (data) => {
    const res = await request(`${SPRING_API}/sales/billing/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Sale creation failed (${res.status})`);
    }
    return res.json();
  },

  getHistory: async (limit = 20) => {
    const res = await request(`${SPRING_API}/sales/billing/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch billing history');
    return res.json();
  },

  getInvoice: async (invoiceNumber) => {
    const res = await request(`${SPRING_API}/sales/billing/invoice/${encodeURIComponent(invoiceNumber)}`);
    if (!res.ok) throw new Error('Failed to fetch invoice details');
    return res.json();
  },
};

// ─── Real-Time Currency Conversion & Rates API ──────────────────────────────
export const currencyApi = {
  getRates: async (base = 'USD') => {
    const res = await fetch(`${SPRING_API}/currency/rates?base=${encodeURIComponent(base)}`);
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    return res.json();
  },

  getRate: async (base = 'USD', target = 'INR') => {
    const res = await fetch(`${SPRING_API}/currency/rate?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`);
    if (!res.ok) throw new Error('Failed to fetch exchange rate');
    return res.json();
  },

  getSettings: async () => {
    const res = await request(`${SPRING_API}/currency/settings`);
    if (!res.ok) throw new Error('Failed to fetch currency settings');
    return res.json();
  },

  saveSettings: async (currency) => {
    const res = await request(`${SPRING_API}/currency/settings`, {
      method: 'POST',
      body: JSON.stringify({ currency }),
    });
    if (!res.ok) throw new Error('Failed to save currency settings');
    return res.json();
  },
};

// ─── AI Document Upload & Processing API (Spring Boot) ──────────────────────
export const aiDocumentApi = {
  upload: async (file) => {
    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${SPRING_API}/ai/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload document');
    }
    return res.json();
  },

  analyze: async (id, forceReparse = false) => {
    const res = await request(`${SPRING_API}/ai/documents/${id}/analyze?forceReparse=${forceReparse}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to analyze document');
    }
    return res.json();
  },

  apply: async (id, payload = {}) => {
    const res = await request(`${SPRING_API}/ai/documents/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to apply document changes');
    }
    return res.json();
  },

  getAll: async (limit = 20) => {
    const res = await request(`${SPRING_API}/ai/documents?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch processed documents');
    return res.json();
  },

  getById: async (id) => {
    const res = await request(`${SPRING_API}/ai/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  delete: async (id) => {
    const res = await request(`${SPRING_API}/ai/documents/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },
};

export const userApi = {
  getSummary: async () => {
    const res = await request(`${SPRING_API}/users/summary`);
    if (!res.ok) throw new Error('Failed to fetch user summary');
    return res.json();
  },

  getUsers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.authProvider && params.authProvider !== 'ALL') query.append('authProvider', params.authProvider);
    const queryString = query.toString();
    const res = await request(`${SPRING_API}/users${queryString ? `?${queryString}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await request(`${SPRING_API}/users/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.json();
  },
};






