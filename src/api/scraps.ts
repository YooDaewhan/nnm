import { API_BASE_URL } from './client';
import { getToken, handleAuthExpired } from '@/lib/auth';

export interface ScrapItem {
  id: number;
  publication_id: string;
  title?: string;
  created_at?: string;
}

export interface GetScrapsResponse {
  data: ScrapItem[];
  current_page: number;
  last_page: number;
  total: number;
}

/**
 * 내 스크랩 목록을 조회합니다.
 */
export const getScraps = async (page = 1, perPage = 10): Promise<GetScrapsResponse> => {
  const token = getToken();
  if (!token) throw new Error('인증되지 않았습니다.');

  const response = await fetch(`${API_BASE_URL}/api/scraps?page=${page}&per_page=${perPage}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) { handleAuthExpired(); throw new Error('인증이 필요합니다.'); }
    throw new Error('스크랩 목록 조회에 실패했습니다.');
  }

  const json = await response.json();

  const rawItems: any[] = Array.isArray(json.data) ? json.data : [];
  const items: ScrapItem[] = rawItems.map((item) => ({
    id: item.id,
    publication_id: item.publication_id,
    title: item.publication?.title ?? item.title,
    created_at: item.created_at,
  }));
  const current_page: number = json.meta?.current_page ?? 1;
  const last_page: number = json.meta?.last_page ?? 1;
  const total: number = json.meta?.total ?? items.length;

  return { data: items, current_page, last_page, total };
};

/**
 * 여러 논문의 스크랩 여부를 한 번에 확인합니다.
 * 응답: 스크랩된 publication_id 배열
 */
export const checkScrapBatch = async (publicationIds: string[]): Promise<string[]> => {
  const token = getToken();
  if (!token || publicationIds.length === 0) return [];

  const params = new URLSearchParams();
  publicationIds.forEach(id => params.append('publication_ids[]', id));

  const response = await fetch(`${API_BASE_URL}/api/scraps/batch?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) { handleAuthExpired(); return []; }
  if (!response.ok) return [];

  try {
    const json = await response.json();
    // { scrapped: { "uuid": true, "uuid2": false } } 형태
    const scrapped: Record<string, boolean> = json.scrapped ?? {};
    return Object.entries(scrapped)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  } catch {
    return [];
  }
};

/**
 * 특정 논문의 스크랩 여부를 확인합니다.
 * 200 → true, 404 → false
 */
export const checkScrap = async (publicationId: string): Promise<boolean> => {
  const token = getToken();
  if (!token) return false;

  const response = await fetch(
    `${API_BASE_URL}/api/scraps/check/${encodeURIComponent(publicationId)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    },
  );

  if (response.status === 404) return false;
  if (response.status === 401) { handleAuthExpired(); return false; }
  if (!response.ok) return false;

  // 백엔드가 { is_scrapped: bool } 또는 { scrapped: bool } 형태로 응답하는 경우 처리
  try {
    const json = await response.json();
    if (typeof json.is_scrapped === 'boolean') return json.is_scrapped;
    if (typeof json.scrapped === 'boolean') return json.scrapped;
  } catch {
    // 응답 바디가 없으면 200 자체를 true로 간주
  }
  return true;
};

export interface AddScrapRequest {
  publication_id: string;
}

/**
 * 논문을 스크랩합니다.
 */
export const addScrap = async (data: AddScrapRequest): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('인증되지 않았습니다.');

  const response = await fetch(`${API_BASE_URL}/api/scraps`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (response.status === 200 || response.status === 201) return;
  if (response.status === 401) { handleAuthExpired(); throw new Error('인증이 필요합니다.'); }
  if (response.status === 422) {
    const errorData = await response.json();
    throw new Error(errorData.message || '유효성 검사에 실패했습니다.');
  }
  throw new Error('스크랩 추가에 실패했습니다.');
};

/**
 * 여러 논문을 일괄 스크랩합니다. (최대 50건)
 */
export const addScrapBatch = async (publicationIds: string[]): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('인증되지 않았습니다.');

  const response = await fetch(`${API_BASE_URL}/api/scraps/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ publication_ids: publicationIds }),
  });

  if (response.status === 200 || response.status === 201) return;
  if (response.status === 401) { handleAuthExpired(); throw new Error('인증이 필요합니다.'); }
  if (response.status === 422) {
    const errorData = await response.json();
    throw new Error(errorData.message || '유효성 검사에 실패했습니다.');
  }
  throw new Error('일괄 스크랩에 실패했습니다.');
};

/**
 * 스크랩을 일괄 제거합니다.
 */
export const deleteScrapBatch = async (publicationIds: string[]): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('인증되지 않았습니다.');

  const response = await fetch(`${API_BASE_URL}/api/scraps/batch`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ publication_ids: publicationIds }),
  });

  if (response.status === 401) { handleAuthExpired(); throw new Error('인증이 필요합니다.'); }
  if (!response.ok) throw new Error('스크랩 삭제에 실패했습니다.');
};

/**
 * 단일 스크랩 제거
 */
export const deleteScrap = async (publicationId: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('인증되지 않았습니다.');

  const response = await fetch(
    `${API_BASE_URL}/api/scraps/${encodeURIComponent(publicationId)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    },
  );

  if (response.status === 401) { handleAuthExpired(); throw new Error('인증이 필요합니다.'); }
  if (!response.ok) throw new Error('스크랩 삭제에 실패했습니다.');
};
