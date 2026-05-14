import { API_BASE_URL } from './client';
import { getToken, handleAuthExpired } from '@/lib/auth';

const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '');

// 장바구니 아이템 타입
export interface CartItem {
  id: number;
  publication_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  authors?: string[];
  publisher?: string | null;
  journal?: string | null;
}

/**
 * 장바구니를 조회합니다.
 */
export const getCart = async (): Promise<CartItem[]> => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('인증이 필요합니다.');
    }
    throw new Error('장바구니 조회에 실패했습니다.');
  }

  const json = await response.json();
  console.log('[cart] raw API response:', json);
  const items: Array<Record<string, unknown>> = json.cart?.items ?? [];
  return items.map(item => ({
    id: item.id as number,
    publication_id: item.publication_id as string,
    title: item.title as string,
    quantity: (item.quantity as number) ?? 1,
    unit_price: (item.unit_price ?? item.price ?? 0) as number,
    subtotal: (item.subtotal ?? ((item.unit_price ?? item.price ?? 0) as number) * ((item.quantity as number) ?? 1)) as number,
    authors: Array.isArray(item.authors) ? item.authors as string[] : undefined,
    publisher: (item.publisher_name ?? item.publisher) as string | null | undefined,
    journal: item.journal as string | null | undefined,
  }));
};

// 장바구니 추가 요청 타입
export interface AddToCartRequest {
  publication_id: string;
  quantity?: number;
}

/**
 * 장바구니에 논문을 추가합니다.
 */
export const addToCart = async (data: AddToCartRequest): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (response.ok) return;

  if (response.status === 401) {
    handleAuthExpired();
    throw new Error('인증이 필요합니다.');
  }

  const errorBody = await response.text().catch(() => '');
  let parsed: { message?: string; error_code?: string } = {};
  try { parsed = JSON.parse(errorBody); } catch {}

  if (parsed.message) throw new Error(stripHtml(parsed.message));

  throw new Error('장바구니 추가에 실패했습니다.');
};

/**
 * 여러 논문을 장바구니에 일괄 추가합니다. (최대 50건)
 */
export const addToCartBatch = async (publicationIds: string[]): Promise<Record<string, unknown>> => {
  const token = getToken();
  if (!token) throw new Error('인증되지 않았습니다.');

  const response = await fetch(`${API_BASE_URL}/api/cart/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ publication_ids: publicationIds }),
  });

  if (response.ok) {
    return await response.json().catch(() => ({}));
  }
  if (response.status === 401) { handleAuthExpired(); throw new Error('인증이 필요합니다.'); }

  const errorBody = await response.text().catch(() => '');
  let parsed: { message?: string } = {};
  try { parsed = JSON.parse(errorBody); } catch {}
  if (parsed.message) throw new Error(stripHtml(parsed.message));
  throw new Error('장바구니 일괄 추가에 실패했습니다.');
};

/**
 * 장바구니 항목을 삭제합니다.
 */
export const removeFromCart = async (id: number): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/cart/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    handleAuthExpired();
    throw new Error('인증이 필요합니다.');
  }

  if (!response.ok) {
    throw new Error('장바구니 삭제에 실패했습니다.');
  }
};
