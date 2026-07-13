import { API_BASE_URL } from './client';
import { getToken, removeToken } from '@/lib/auth';

const handleUnauthorized = () => {
  removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// 주문 생성 요청 타입
export interface CreateOrderRequest {
  order_name: string;
  amount: number;
  metadata?: {
    product_id?: number;
    [key: string]: unknown;
  };
}

// 주문 응답 타입
export interface Order {
  id: number;
  user_id: number;
  order_id: string;
  order_name: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  items?: { title: string; authors?: string; publisher?: string; journal?: string; journalName?: string; publishDate?: string; grade?: string; price?: number; publication_id?: string }[];
}

export interface CreateOrderResponse {
  success: boolean;
  order: Order;
}

// 결제 확인 요청 타입
export interface ConfirmPaymentRequest {
  payment_key: string;
  order_id: string;
  amount: number;
}

// 결제 정보 타입
export interface Payment {
  id: number;
  payment_key: string;
  method: string;
  total_amount: number;
  balance_amount: number;
  status: 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED';
  virtual_account?: {
    account_number: string;
    bank: string;
    customer_name: string;
    due_date: string;
  };
}

// 결제 확인 응답 타입
export interface ConfirmPaymentResponse {
  success: boolean;
  order: Pick<Order, 'id' | 'order_id' | 'order_name' | 'amount' | 'status' | 'items' | 'metadata'>;
  payment: Payment;
}

// 결제 에러 타입
export interface PaymentError {
  error_code: string;
  message: string;
}

// 결제 취소 요청 타입
export interface CancelPaymentRequest {
  cancel_reason: string;
}

// 부분 취소 요청 타입
export interface PartialCancelPaymentRequest {
  cancel_reason: string;
  cancel_amount: number;
}

// 환불 정보 타입
export interface Refund {
  id: number;
  cancel_reason: string;
  cancel_amount: number;
  refund_status: 'DONE' | 'PENDING';
}

// 취소 응답 타입
export interface CancelPaymentResponse {
  success: boolean;
  refund: Refund;
  payment: {
    payment_key: string;
    status: 'CANCELED' | 'PARTIAL_CANCELED';
    balance_amount: number;
  };
}

/**
 * 결제 주문을 생성합니다.
 */
export const createOrder = async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.status === 201) {
    return response.json();
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('인증이 필요합니다.');
  }

  if (response.status === 422) {
    const errorData = await response.json();
    throw new Error(errorData.message || '유효성 검사에 실패했습니다.');
  }

  let errorBody = '';
  try { errorBody = await response.text(); } catch { /* ignore */ }
  throw new Error(`주문 생성에 실패했습니다. (${response.status})${errorBody ? ': ' + errorBody : ''}`);
};

/**
 * 결제를 확인(승인)합니다.
 * 토스 결제 완료 후 콜백에서 호출합니다.
 */
export const confirmPayment = async (data: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> => {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    return response.json();
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('인증이 필요합니다.');
  }

  if (response.status === 400) {
    const errorData: PaymentError = await response.json();
    throw new Error(errorData.message);
  }

  throw new Error(`결제 확인에 실패했습니다. (${response.status})`);
};

/**
 * 결제를 전액 취소합니다.
 */
export const cancelPayment = async (
  paymentKey: string,
  data: CancelPaymentRequest
): Promise<CancelPaymentResponse> => {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    return response.json();
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('인증이 필요합니다.');
  }

  if (response.status === 400) {
    const errorData: PaymentError = await response.json();
    throw new Error(errorData.message);
  }

  throw new Error('결제 취소에 실패했습니다.');
};

/**
 * 결제를 부분 취소합니다.
 */
export const partialCancelPayment = async (
  paymentKey: string,
  data: PartialCancelPaymentRequest
): Promise<CancelPaymentResponse> => {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/${paymentKey}/partial-cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.status === 200) {
    return response.json();
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('인증이 필요합니다.');
  }

  if (response.status === 400) {
    const errorData: PaymentError = await response.json();
    throw new Error(errorData.message);
  }

  throw new Error('부분 취소에 실패했습니다.');
};

// 결제 내역 조회 파라미터 타입
export interface GetPaymentsParams {
  status?: 'pending' | 'paid' | 'failed' | 'cancelled';
  per_page?: number;
  page?: number;
}

// 결제 내역 조회용 주문 타입 (latest_payment 포함)
export interface OrderWithPayment extends Order {
  latest_payment?: {
    payment_key: string;
    status: string;
  };
}

// 페이지네이션 응답 타입
export interface PaginatedOrdersResponse {
  success: boolean;
  orders: {
    current_page: number;
    data: OrderWithPayment[];
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
  };
}

/**
 * 결제 내역을 조회합니다.
 */
export const getPayments = async (params?: GetPaymentsParams): Promise<PaginatedOrdersResponse> => {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    throw new Error('인증되지 않았습니다.');
  }

  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params?.page) queryParams.append('page', params.page.toString());

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/payments${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (response.status === 200) {
    return response.json();
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('인증이 필요합니다.');
  }

  throw new Error('결제 내역 조회에 실패했습니다.');
};

// 결제 상세 조회 응답 타입
export interface PaymentDetailResponse {
  success: boolean;
  payment: {
    id: number;
    payment_key: string;
    method: string;
    total_amount: number;
    balance_amount: number;
    status: string;
    order: {
      id: number;
      order_id: string;
      order_name: string;
    };
  };
}

/**
 * 결제 상세 정보를 조회합니다.
 */
export const getPaymentDetail = async (paymentKey: string): Promise<PaymentDetailResponse> => {
  const token = getToken();
  if (!token) {
    handleUnauthorized();
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (response.status === 200) {
    return response.json();
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('인증이 필요합니다.');
  }

  if (response.status === 404) {
    const errorData: PaymentError = await response.json();
    throw new Error(errorData.message || '결제를 찾을 수 없습니다.');
  }

  throw new Error('결제 상세 조회에 실패했습니다.');
};
