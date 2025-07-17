/**
 * API Client
 * 백엔드 API와 통신하는 클라이언트
 */

// 동적으로 API URL 결정
const getApiUrl = () => {
  // API와 웹이 통합되어 있으므로 같은 호스트의 /api 경로 사용
  if (typeof window !== 'undefined') {
    // 클라이언트: 현재 호스트의 /api 경로 사용
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  // 서버: Next.js 내부 API 라우트 사용
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') + '/api' || 'http://localhost:3000/api';
};

const API_BASE_URL = getApiUrl();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
      localStorage.setItem('accessToken', token); // 관리자 페이지 호환성
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    
    if (typeof window !== 'undefined') {
      // 우선순위: accessToken -> auth-token -> auth_token (기존 호환성)
      this.token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('auth-token') || 
                  localStorage.getItem('auth_token');
    }
    
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('auth_token'); // 기존 호환성
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
          details: data.details,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    type: string;
  }) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    this.clearToken();
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Campaign endpoints
  async createCampaign(data: any) {
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCampaigns(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/campaigns?${queryString}` : '/campaigns';

    return this.request(endpoint);
  }

  async getMyCampaigns(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/campaigns/my?${queryString}` : '/campaigns/my';

    return this.request(endpoint);
  }

  async getAppliedCampaigns(status?: string) {
    const endpoint = status ? `/campaigns/applied?status=${status}` : '/campaigns/applied';
    return this.request(endpoint);
  }

  async getCampaignDetail(id: string) {
    return this.request(`/campaigns/${id}`);
  }

  async updateCampaign(id: string, data: any) {
    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async applyCampaign(id: string, message?: string) {
    return this.request(`/campaigns/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updateApplicationStatus(
    applicationId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) {
    return this.request(`/campaigns/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async getCampaignStats(id: string) {
    return this.request(`/campaigns/${id}/stats`);
  }

  async submitContent(campaignId: string, data: {
    platform: string;
    url: string;
    type: string;
    caption?: string;
  }) {
    return this.request(`/campaigns/${campaignId}/content`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reviewContent(
    contentId: string,
    status: 'APPROVED' | 'REJECTED',
    feedback?: string
  ) {
    return this.request(`/campaigns/content/${contentId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, feedback }),
    });
  }

  // User endpoints
  async getUsers(params?: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';

    return this.request(endpoint);
  }

  async getUserDetail(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Payment endpoints
  async getPayments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/payments?${queryString}` : '/payments';

    return this.request(endpoint);
  }

  async createPayment(data: {
    amount: number;
    method: string;
    campaignId?: string;
  }) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
  }

  // Notification endpoints
  async getNotifications(params?: {
    read?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';

    return this.request(endpoint);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Module status
  async getModuleStatus() {
    return this.request('/api/modules/status');
  }
}

export const api = new ApiClient();
export default api;