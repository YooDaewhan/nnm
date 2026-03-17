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

// 토큰 삭제
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  }
};

// 로그인 여부 확인
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// 토큰 만료/인증 실패 시 처리 (토큰 삭제 + 이벤트 발송)
export const handleAuthExpired = () => {
  removeToken();
  window.dispatchEvent(new Event('auth:logout'));
};
