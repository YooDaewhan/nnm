// JWT 디코딩 함수
export const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      // JWT 형식
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    }
    return null;
  } catch (e) {
    console.error('JWT 디코딩 실패:', e);
    return null;
  }
};

// 토큰에서 사용자 정보 추출
export const getUserFromToken = (token: string) => {
  const payload = decodeJWT(token);
  if (!payload) return null;

  // JWT에서 사용자 정보 추출 (백엔드 JWT 구조에 따라 다를 수 있음)
  return {
    id: payload.sub || payload.user_id || payload.id,
    name: payload.name,
    email: payload.email,
  };
};

// 토큰 저장
export const saveToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);

    // JWT인 경우에만 사용자 정보 추출 (Sanctum 토큰 "1|xxx"은 건너뜀)
    if (token.includes('.')) {
      const user = getUserFromToken(token);
      if (user) {
        localStorage.setItem('user_data', JSON.stringify(user));
      }
    }
  }
};

// 토큰 가져오기
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// refresh token 저장
export const saveRefreshToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', token);
  }
};

// refresh token 가져오기
export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
};

// 토큰 삭제
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }
};

// 로그인 여부 확인 (JWT 만료 체크 포함)
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  const payload = decodeJWT(token);
  if (payload?.exp) {
    // exp는 초 단위 Unix timestamp
    if (Date.now() / 1000 > payload.exp) {
      removeToken();
      return false;
    }
  }

  return true;
};

// 토큰 만료/인증 실패 시 처리 (토큰 삭제 + 이벤트 발송)
export const handleAuthExpired = () => {
  removeToken();
  window.dispatchEvent(new Event('auth:logout'));
};
