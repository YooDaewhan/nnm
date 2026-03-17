import {
  getApiAuthMe,
  postApiAuthLogout,
  postApiAuthLogoutAll,
  postApiAuthRefresh,
  getApiAuthSocialAccounts,
  deleteApiAuthSocialProvider,
} from './generated';
import { getToken, removeToken, saveToken } from '@/lib/auth';
import { API_BASE_URL } from './client';

/**
 * 현재 인증된 사용자 정보를 가져옵니다.
 */
export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await getApiAuthMe({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 200) {
    const data = response.data as any;
    // 백엔드가 { user: { id, name, ... } } 형태로 감싸서 줄 경우 unwrap
    if (data?.user && data.user.id) {
      return data.user;
    }
    return data;
  }

  throw new Error('사용자 정보를 가져올 수 없습니다.');
};

/**
 * 현재 디바이스에서 로그아웃합니다.
 */
export const logout = async () => {
  const token = getToken();
  if (!token) {
    return;
  }

  try {
    await postApiAuthLogout({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } finally {
    // 에러가 발생해도 로컬 토큰은 삭제
    removeToken();
  }
};

/**
 * 모든 디바이스에서 로그아웃합니다.
 */
export const logoutAll = async () => {
  const token = getToken();
  if (!token) {
    return;
  }

  try {
    await postApiAuthLogoutAll({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } finally {
    // 에러가 발생해도 로컬 토큰은 삭제
    removeToken();
  }
};

/**
 * 토큰을 갱신합니다.
 */
export const refreshToken = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await postApiAuthRefresh(
    { refresh_token: token },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (response.status === 200 && 'access_token' in response.data) {
    const newToken = response.data.access_token;
    if (newToken) {
      saveToken(newToken);
      return newToken;
    }
  }

  throw new Error('토큰 갱신에 실패했습니다.');
};

/**
 * 연동된 소셜 계정 목록을 가져옵니다.
 */
export const getSocialAccounts = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await getApiAuthSocialAccounts({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 200) {
    return response.data;
  }

  throw new Error('소셜 계정 목록을 가져올 수 없습니다.');
};

/**
 * 회원탈퇴를 처리합니다.
 */
export const withdraw = async (password?: string, reason?: string) => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const body: Record<string, string> = {};
  if (password) body.password = password;
  if (reason) body.reason = reason;

  const response = await fetch(`${API_BASE_URL}/api/auth/withdraw`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (response.status === 400) {
    throw new Error(data.message || '비밀번호가 일치하지 않습니다.');
  }

  if (!response.ok) {
    throw new Error(data.message || '회원탈퇴에 실패했습니다.');
  }

  removeToken();
  return data;
};

/**
 * 비밀번호를 변경합니다.
 */
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    }),
  });

  const data = await response.json();

  if (response.status === 422) {
    const msg = data.errors?.current_password?.[0] || data.message || '현재 비밀번호가 일치하지 않습니다.';
    throw new Error(msg);
  }

  if (!response.ok) {
    throw new Error(data.message || '비밀번호 변경에 실패했습니다.');
  }

  return data;
};

/**
 * 소셜 계정 연동을 해제합니다.
 */
export const disconnectSocialAccount = async (provider: 'google' | 'naver' | 'kakao') => {
  const token = getToken();
  if (!token) {
    throw new Error('인증되지 않았습니다.');
  }

  const response = await deleteApiAuthSocialProvider(provider, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const status = response.status as number;

  if (status === 200) {
    return response.data;
  }

  if (status === 400) {
    throw new Error('최소 하나의 로그인 수단이 필요합니다.');
  }

  if (status === 404) {
    throw new Error('연동된 계정을 찾을 수 없습니다.');
  }

  throw new Error('소셜 계정 연동 해제에 실패했습니다.');
};
