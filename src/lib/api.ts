const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // 세션 쿠키 포함
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
          window.dispatchEvent(new Event('auth:logout'));
        }
      }

      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || `HTTP ${response.status}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
    }

    return response.json();
  }

  // 사용자 정보 조회
  async getUser() {
    return this.request('/auth/user', {
      method: 'GET',
    });
  }

  // 로그아웃
  async logout() {
    try {
      // 백엔드에 로그아웃 요청 (실패해도 계속 진행)
      await this.request('/api/logout', {
        method: 'POST',
      });
    } catch (error) {
      // 백엔드 오류는 무시 (프론트엔드에서 토큰만 삭제하면 됨)
    } finally {
      // 항상 로컬 토큰 삭제
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }

    return { message: '로그아웃 완료' };
  }

  // OAuth 콜백 처리
  async oauthCallback(params: {
    provider: 'google' | 'naver' | 'kakao';
    code: string;
    state?: string;
  }) {
    return this.request<LoginResponse>(`/auth/${params.provider}/callback`, {
      method: 'POST',
      body: JSON.stringify({
        code: params.code,
        state: params.state,
      }),
    });
  }

  // 결제 준비
  async preparePayment(productIds: string[]) {
    return this.request<{
      orderId: string;
      orderName: string;
      amount: number;
      customerName: string;
    }>('/api/payments/prepare', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  }
}

export const apiClient = new ApiClient();
