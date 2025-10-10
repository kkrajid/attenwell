// API Service for AttenWell Backend
const API_BASE_URL = 'https://attenwell-bk.onrender.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('access_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('access_token');
  }

  // Clear authentication
  clearAuth() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('attenwell_user');
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.getToken()) {
      headers.Authorization = `Bearer ${this.getToken()}`;
    }

    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle token refresh if 401
      if (response.status === 401 && this.getToken()) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry request with new token
          config.headers.Authorization = `Bearer ${this.getToken()}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        } else {
          this.clearAuth();
          window.location.href = '/login';
          return null;
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Handle API response
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response;
  }

  // Refresh JWT token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.access);
        localStorage.setItem('refresh_token', data.refresh);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Authentication endpoints
  async register(userData) {
    const response = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.access) {
      this.setToken(response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('attenwell_user', JSON.stringify(response.user));
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.access) {
      this.setToken(response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('attenwell_user', JSON.stringify(response.user));
    }

    return response;
  }

  // User endpoints
  async getUserProfile() {
    return await this.request('/user/profile/');
  }

  async updateUserProfile(userData) {
    return await this.request('/user/profile/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Parent settings endpoints
  async getParentSettings() {
    return await this.request('/parent/settings/');
  }

  async updateParentSettings(settings) {
    return await this.request('/parent/settings/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Session planning
  async createSessionPlan(planData) {
    return await this.request('/session/plan/', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  // Focus session endpoints
  async createFocusSession(sessionData) {
    return await this.request('/focus/sessions/', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getFocusSessions() {
    return await this.request('/focus/sessions/');
  }

  async updateFocusSession(sessionId, sessionData) {
    return await this.request(`/focus/sessions/${sessionId}/`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  // Meditation session endpoints
  async createMeditationSession(sessionData) {
    return await this.request('/meditation/sessions/', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getMeditationSessions() {
    return await this.request('/meditation/sessions/');
  }

  // Game session endpoints
  async createGameSession(sessionData) {
    return await this.request('/game/sessions/', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getGameSessions() {
    return await this.request('/game/sessions/');
  }

  // Break time endpoints
  async getAvailableBreakTime() {
    return await this.request('/break-time/');
  }

  async updateBreakTime(minutes) {
    return await this.request('/break-time/update/', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  }

  // Sudden closure endpoints
  async createSuddenClosure(closureData) {
    return await this.request('/sudden-closures/create/', {
      method: 'POST',
      body: JSON.stringify(closureData),
    });
  }

  async getSuddenClosures() {
    return await this.request('/sudden-closures/');
  }

  // Parent dashboard
  async getParentDashboard() {
    return await this.request('/parent/dashboard/');
  }

  // Statistics
  async getDailyStats() {
    return await this.request('/stats/daily/');
  }

  async getUserStats() {
    return await this.request('/stats/user/');
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
