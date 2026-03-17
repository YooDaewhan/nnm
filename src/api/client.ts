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
  import.meta.env.VITE_API_URL || 'http://192.168.20.231:8000';

// Orval이 생성한 API 함수에서 사용할 커스텀 fetch 인스턴스
export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    },
  };

  const response = await fetch(fullUrl, mergedOptions);

  const body = [204, 205, 304].includes(response.status)
    ? null
    : await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    if (response.status >= 500) {
      throw new Error(
        `백엔드 서버 오류 (${response.status})\n` +
        `엔드포인트: ${url}\n` +
        `백엔드에서 ${url} 엔드포인트 구현이 필요합니다.`
      );
    }
    throw new Error(
      `API 엔드포인트를 찾을 수 없습니다 (${response.status})\n` +
      `엔드포인트: ${url}\n` +
      `백엔드에서 해당 엔드포인트를 구현해주세요.`
    );
  }

  const data = body ? JSON.parse(body) : {};

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};
