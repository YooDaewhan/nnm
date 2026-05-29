// PDF 서버 클라이언트
export const PDF_SERVER_BASE_URL =
  import.meta.env.VITE_PDF_SERVER_URL || 'http://192.168.20.231:4000';

export const pdfServerFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const fullUrl = url.startsWith('/') ? `${PDF_SERVER_BASE_URL}/api${url}` : url;
  const response = await fetch(fullUrl, {
    ...options,
    headers: { 'Accept': 'application/json', ...options?.headers },
  });
  const body = [204, 205, 304].includes(response.status) ? null : await response.text();
  const data = body ? JSON.parse(body) : {};
  return { data, status: response.status, headers: response.headers } as T;
};

// API 클라이언트 설정
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '';

// Orval이 생성한 API 함수에서 사용할 커스텀 fetch 인스턴스
export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;

  const buildHeaders = (token?: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options?.headers as Record<string, string>),
    };
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const doFetch = (token?: string | null) =>
    fetch(fullUrl, { ...options, headers: buildHeaders(token) });

  const parseResponse = async (res: Response): Promise<T> => {
    const body = [204, 205, 304].includes(res.status) ? null : await res.text();
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      if (res.status >= 500) {
        throw new Error(
          `백엔드 서버 오류 (${res.status})\n` +
          `엔드포인트: ${url}\n` +
          `백엔드에서 ${url} 엔드포인트 구현이 필요합니다.`
        );
      }
      throw new Error(
        `API 엔드포인트를 찾을 수 없습니다 (${res.status})\n` +
        `엔드포인트: ${url}\n` +
        `백엔드에서 해당 엔드포인트를 구현해주세요.`
      );
    }
    const data = body ? JSON.parse(body) : {};
    return { data, status: res.status, headers: res.headers } as T;
  };

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  let response = await doFetch(accessToken);

  // 401 → refresh token으로 갱신 후 재시도 (refresh 엔드포인트 자체는 제외)
  if (response.status === 401 && !url.includes('/api/auth/refresh')) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.access_token;
        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
          if (refreshData.refresh_token) {
            localStorage.setItem('refresh_token', refreshData.refresh_token);
          }
          response = await doFetch(newAccessToken);
        }
      } else {
        // refresh 실패 → 로그아웃
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
  }

  return parseResponse(response);
};
