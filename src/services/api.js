/**
 * StockUp AI — Centralized API Service Layer
 * 
 * Manages connections to:
 *  - Spring Boot backend (port 8080) — Auth, Items, Business, Predictions, Dashboard, Assistant
 */

// ─── Base URLs ───────────────────────────────────────────────────────────────
const SPRING_API = '/api';


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

  const res = await fetch(url, { ...options, headers });

  // Auto-logout on 401 Unauthorized or 403 Forbidden (e.g. invalid mock token)
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error('Session expired or invalid token. Please login again.');
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
};

// ─── Items API (Spring Boot) ────────────────────────────────────────────────
export const itemsApi = {
  getAll: async () => {
    const res = await request(`${SPRING_API}/items`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  getById: async (id) => {
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
    const res = await fetch(`${SPRING_API}/predictions/demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        if (actionItems.length > 0) {
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
      }
    } catch {
      // Handled by fallback below
    }
    return {
      insights: [
        { id: 1, icon: 'alert', text: 'Reorder Paracetamol - Stock critically low (23 units left against 100 min requirement).', action: 'Optimize PO', route: '/reorder' },
        { id: 2, icon: 'trending', text: 'Amoxicillin demand is predicted to spike based on historical trends.', action: 'Review Forecast', route: '/forecast' },
        { id: 3, icon: 'clock', text: 'Critical medicines approaching expiry date within 30 days.', action: 'View Expiry', route: '/expiry' },
        { id: 4, icon: 'check', text: 'All other inventory items are within healthy operating buffers.', action: 'View Inventory', route: '/medicines' }
      ]
    };
  },


  /**
   * Check if the backend is healthy.
   */
  health: async () => {
    try {
      const res = await fetch(`/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
