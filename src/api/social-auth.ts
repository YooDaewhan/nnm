import { API_BASE_URL } from './client';

/**
 * 소셜 로그인 제공자 타입
 */
export type SocialProvider = 'google' | 'naver' | 'kakao';

/**
 * 소셜 로그인을 시작합니다.
 * 백엔드 소셜 로그인 엔드포인트로 직접 리다이렉트합니다.
 *
 * 플로우:
 * 1. 백엔드 /api/auth/{provider}/redirect로 리다이렉트
 * 2. 백엔드가 OAuth 제공자로 리다이렉트
 * 3. OAuth 로그인 후 백엔드 callback으로 리다이렉트
 * 4. 백엔드가 프론트 /auth/callback?code=xxx로 리다이렉트
 * 5. 프론트에서 handleSocialCallback으로 code를 백엔드에 전송하여 토큰 받음
 *
 * @param provider 소셜 로그인 제공자 (google, naver, kakao)
 */
export const startSocialLogin = (provider: SocialProvider): void => {
  console.log('=== 소셜 로그인 시작 ===');
  console.log('Provider:', provider);

  // provider를 localStorage에 저장 (콜백에서 사용)
  localStorage.setItem('oauth_provider', provider);

  // 백엔드 소셜 로그인 엔드포인트로 직접 리다이렉트
  window.location.href = `${API_BASE_URL}/api/auth/${provider}/redirect`;
};

/**
 * 소셜 로그인 콜백을 처리합니다.
 * OAuth 제공자로부터 받은 code를 백엔드에 전송하여 토큰을 받습니다.
 *
 * @param code OAuth 인증 코드
 * @param state OAuth state (옵션)
 */
export const handleSocialCallback = async (code: string, state?: string | null): Promise<{
  success: boolean;
  access_token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  error?: string;
}> => {
  // localStorage에서 provider 가져오기
  const provider = localStorage.getItem('oauth_provider');

  if (!provider) {
    return { success: false, error: 'Provider 정보를 찾을 수 없습니다.' };
  }

  try {
    console.log('=== 소셜 로그인 콜백 처리 ===');
    console.log('Provider:', provider);
    console.log('Code:', code);

    // 백엔드에 code 전송하여 토큰 받기
    const response = await fetch(`${API_BASE_URL}/api/auth/${provider}/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`);
    const data = await response.json();

    console.log('백엔드 응답 status:', response.status);
    console.log('백엔드 응답 data:', data);

    // localStorage에서 provider 정보 삭제
    localStorage.removeItem('oauth_provider');

    // HTTP 200이고 access_token이 있으면 성공
    if (response.status === 200 && data.access_token) {
      return {
        success: true,
        access_token: data.access_token,
        user: data.user,
      };
    }

    return {
      success: false,
      error: data.message || '로그인에 실패했습니다.',
    };
  } catch (error) {
    console.error('소셜 로그인 콜백 처리 실패:', error);
    localStorage.removeItem('oauth_provider');
    return {
      success: false,
      error: '서버 오류가 발생했습니다.',
    };
  }
};
