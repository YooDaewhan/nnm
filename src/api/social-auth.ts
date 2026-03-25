import { API_BASE_URL } from './client';

/**
 * 소셜 로그인 제공자 타입
 */
export type SocialProvider = 'google' | 'naver' | 'kakao';

/**
 * 소셜 로그인을 시작합니다.
 *
 * 플로우:
 * 1. 백엔드 /api/auth/{provider}/redirect로 리다이렉트
 * 2. 백엔드가 OAuth 제공자로 리다이렉트
 * 3. OAuth 로그인 후 백엔드 callback에서 토큰 처리
 * 4. 백엔드가 프론트 /auth/callback?access_token=xxx 로 리다이렉트
 * 5. AuthCallbackPage에서 URL 파라미터 읽어 저장
 */
export const startSocialLogin = (provider: SocialProvider): void => {
  localStorage.setItem('oauth_provider', provider);
  window.location.href = `${API_BASE_URL}/api/auth/${provider}/redirect`;
};
