import { API_BASE_URL } from './client';
import { getToken } from '@/lib/auth';

// 구매 라이브러리 아이템 타입
export interface PurchaseLibraryItem {
  id: number;
  publication_id: string;
  title: string;
  purchased_at: string;
  [key: string]: unknown;
}

// 구매 라이브러리 조회 파라미터
export interface GetPurchaseLibraryParams {
  page?: number;
  per_page?: number;
}

// 구매 라이브러리 페이지네이션 응답
export interface PaginatedPurchaseLibraryResponse {
  current_page: number;
  data: PurchaseLibraryItem[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

/**
 * 구매 라이브러리를 조회합니다.
 */
export const getPurchaseLibrary = async (params?: GetPurchaseLibraryParams): Promise<PaginatedPurchaseLibraryResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/purchase/library${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (response.status === 401) {
    throw new Error('인증이 필요합니다.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('구매 목록 API 오류:', response.status, errorText);
    throw new Error(`구매 목록 조회에 실패했습니다. (${response.status})`);
  }

  const json = await response.json();
  console.log('📦 purchase/library 원본 응답:', JSON.stringify(json, null, 2));
  return json;
};
