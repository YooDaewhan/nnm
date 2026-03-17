import { API_BASE_URL } from './client';
import { getToken, handleAuthExpired } from '@/lib/auth';

// 장바구니 아이템 타입
export interface CartItem {
  id: number;
  publication_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
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
  return json.cart?.items ?? [];
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

  if (response.status === 200 || response.status === 201) {
    return;
  }

  if (response.status === 401) {
    handleAuthExpired();
    throw new Error('인증이 필요합니다.');
  }

  if (response.status === 422) {
    const errorData = await response.json();
    throw new Error(errorData.message || '유효성 검사에 실패했습니다.');
  }

  throw new Error('장바구니 추가에 실패했습니다.');
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
