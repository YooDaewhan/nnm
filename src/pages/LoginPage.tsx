import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, saveToken, saveRefreshToken } from '../lib/auth';
import { postApiAuthLogin, type PostApiAuthLoginBody } from '../api/generated';
import { startSocialLogin, type SocialProvider } from '../api/social-auth';
import { forgotPassword } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 로그인 후 돌아갈 URL: state.from > ?redirect= 쿼리 > 기본 '/'
  const from =
    (location.state as { from?: string } | null)?.from ||
    new URLSearchParams(location.search).get('redirect') ||
    '/';
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) navigate('/');
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError(null);
    try {
      const loginData: PostApiAuthLoginBody = { email, password };
      const response = await postApiAuthLogin(loginData, { credentials: 'include' });
      if (response.status === 200 && 'access_token' in response.data) {
        const data = response.data;
        if (data.access_token) {
          saveToken(data.access_token, rememberEmail);
          const refresh = (data as any).refresh_token;
          if (refresh) saveRefreshToken(refresh);
          navigate(from, { replace: true });
        } else {
          throw new Error('토큰을 받지 못했습니다.');
        }
      } else if ((response.status as number) === 401 || response.status === 422) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        throw new Error('로그인에 실패했습니다.');
      }
    } catch (err) {
      if (err instanceof  TypeError && err.message.includes('fetch')) {
        setError('백엔드 서버 연결 실패\n\n가능한 원인:\n1. 백엔드 서버가 실행되지 않음\n');
      } else {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      }
      setLoading(null);
    }
  };

  const openForgotPasswordModal = () => {
    setForgotEmail('');
    setForgotError(null);
    setForgotMessage(null);
    setShowForgotPasswordModal(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    try {
      const data = await forgotPassword(forgotEmail);
      setForgotMessage(data.message || '입력하신 이메일로 임시 비밀번호를 발송했습니다. 이메일을 확인해주세요.');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    setLoading(provider);
    setError(null);
    // 소셜 로그인은 외부 OAuth 리다이렉트이므로 sessionStorage에 복귀 URL 저장
    if (from !== '/') sessionStorage.setItem('loginRedirect', from);
    startSocialLogin(provider);
  };

  const modalContent = (title: string, onClose: () => void) => (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] px-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-8 w-full max-w-md flex flex-col gap-6">
        <span className="font-bold text-xl text-[#1E2124]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>{title}</span>
        <span className="text-base text-[#464C53] text-center py-10" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>준비중입니다.</span>
        <button type="button" onClick={onClose} className="h-12 bg-[#039BE5] rounded-lg border-none cursor-pointer text-white text-lg" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>닫기</button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAFAFC] min-h-screen flex justify-center items-start py-0 sm:py-10">
      {showTermsModal && modalContent('약관 및 정책', () => setShowTermsModal(false))}
      {showSupportModal && modalContent('고객센터', () => setShowSupportModal(false))}
      {showForgotPasswordModal && (
        <div onClick={closeForgotPasswordModal} className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] px-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-8 w-full max-w-md flex flex-col gap-6">
            <span className="font-bold text-xl text-[#1E2124]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>비밀번호 찾기</span>
            {forgotMessage ? (
              <>
                <span className="text-base text-[#464C53] text-center py-10 whitespace-pre-line" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>{forgotMessage}</span>
                <button type="button" onClick={closeForgotPasswordModal} className="h-12 bg-[#039BE5] rounded-lg border-none cursor-pointer text-white text-lg" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>닫기</button>
              </>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
                <span className="text-sm text-[#464C53]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>
                  가입하신 이메일로 임시 비밀번호를 발송합니다. 임시 비밀번호로 로그인한 뒤 반드시 비밀번호를 변경해주세요.
                </span>
                <div className="flex flex-row items-center gap-2 px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-md">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="이메일"
                    disabled={forgotLoading}
                    className="flex-1 bg-transparent border-none outline-none text-base text-[#1E2124]"
                    style={{ fontFamily: 'Pretendard GOV, sans-serif' }}
                  />
                </div>
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                    {forgotError}
                  </div>
                )}
                <div className="flex flex-row gap-3">
                  <button type="button" onClick={closeForgotPasswordModal} disabled={forgotLoading} className="flex-1 h-12 bg-[#F4F5F6] rounded-lg border-none cursor-pointer text-[#464C53] text-lg disabled:opacity-50" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>취소</button>
                  <button type="submit" disabled={forgotLoading} className="flex-1 h-12 bg-[#039BE5] rounded-lg border-none cursor-pointer text-white text-lg disabled:opacity-50" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>
                    {forgotLoading ? '전송 중...' : '임시 비밀번호 발급'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="w-full sm:w-[600px] flex flex-col gap-8 px-5 py-8 sm:px-10 sm:py-10 bg-white sm:rounded-none min-h-screen sm:min-h-0">
        {/* 로고 */}
        <div className="flex justify-center items-center">
          <img
            src="/icons/logo__pc.svg"
            alt="logo"
            className="w-36 sm:w-[165px] h-8 cursor-pointer object-contain"
            onClick={() => navigate('/')}
          />
        </div>

        <div className="flex flex-col gap-8 pb-10">
          {/* 타이틀 */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-2xl sm:text-[32px] leading-snug tracking-wide text-[#1E2124]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>로그인</span>
            <span className="text-sm sm:text-[17px] leading-relaxed text-[#464C53]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>서비스 이용이 처음이라면 회원가입이 필요할 수 있습니다.</span>
          </div>

          {/* 입력 폼 */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              {/* 이메일 */}
              <div className="flex flex-row items-center gap-2 px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-md">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일"
                  disabled={loading !== null}
                  className="flex-1 bg-transparent border-none outline-none text-base sm:text-[17px] text-[#1E2124]"
                  style={{ fontFamily: 'Pretendard GOV, sans-serif' }}
                />
              </div>

              {/* 비밀번호 */}
              <div className="flex flex-row items-center gap-2 px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-md overflow-hidden">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  disabled={loading !== null}
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-base sm:text-[17px] text-[#1E2124]"
                  style={{ fontFamily: 'Pretendard GOV, sans-serif' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="bg-transparent border-none cursor-pointer p-0 flex items-center flex-shrink-0">
                  {showPassword
                    ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#8A949E"/></svg>
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#8A949E"/></svg>
                  }
                </button>
              </div>

              {/* 자동로그인 / 비밀번호 찾기 */}
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row items-center gap-1">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[#256EF4]"
                  />
                  <label htmlFor="remember" className="text-sm sm:text-[15px] leading-relaxed text-[#464C53] cursor-pointer" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>자동 로그인</label>
                </div>
                <div className="flex flex-row items-center gap-3 sm:gap-4">
                  <button type="button" onClick={openForgotPasswordModal} className="bg-transparent border-none cursor-pointer px-0.5 text-sm sm:text-[15px] leading-relaxed text-[#464C53]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>비밀번호 찾기</button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                {error}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={handleEmailLogin as any}
              disabled={loading !== null}
              className="w-full h-14 bg-[#039BE5] rounded-lg border-none text-white text-lg sm:text-[19px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: 'Pretendard GOV, sans-serif' }}
            >
              {loading === 'email' ? '로그인 중...' : '로그인'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              disabled={loading !== null}
              className="w-full h-14 bg-[#555770] rounded-lg border-none text-white text-lg sm:text-[19px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: 'Pretendard GOV, sans-serif' }}
            >
              회원가입
            </button>
          </div>

          {/* 소셜 로그인 */}
          <div className="flex flex-col justify-center items-center gap-4 py-4 rounded-lg">
            <span className="font-bold text-sm leading-relaxed text-[#464C53] text-center" style={{ fontFamily: 'NanumSquare, sans-serif' }}>소셜 계정으로 로그인</span>
            <div className="flex flex-row gap-4">
              <button
                type="button"
                onClick={() => handleSocialLogin('naver')}
                disabled={loading !== null}
                className="w-14 h-14 rounded-full bg-[#03A94D] border-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="네이버 로그인"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill="#FFFFFF" d="M13.125 0h6.875v20h-6.875l-6.25-9.375V20H0V0h6.875l6.25 9.375z"/></svg>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('kakao')}
                disabled={loading !== null}
                className="w-14 h-14 rounded-full bg-[#FEE500] border-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="카카오 로그인"
              >
                <svg width="24" height="22.4" viewBox="0 0 24 22.4" fill="none"><path fill="#000000" d="M12 0.75c-5.436 0-9.844 3.435-9.844 7.674 0 2.839 1.785 5.334 4.481 6.824l-.836 3.446c-.192.609.029.645.443.388l4.133-2.703c.514.055 1.04.103 1.624.103 5.436 0 9.844-3.435 9.844-7.674S17.436 0.75 12 0.75z"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="flex flex-col gap-4 mt-auto">
          <hr className="w-full border-none border-t border-[#CDD1D5]" />
          <div className="flex flex-row justify-end items-center gap-4">
            <button type="button" onClick={() => setShowTermsModal(true)} className="bg-transparent border-none cursor-pointer px-0.5 text-sm sm:text-[15px] leading-relaxed text-[#464C53]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>약관 및 정책</button>
            <button type="button" onClick={() => setShowSupportModal(true)} className="bg-transparent border-none cursor-pointer px-0.5 text-sm sm:text-[15px] leading-relaxed text-[#464C53]" style={{ fontFamily: 'Pretendard GOV, sans-serif' }}>고객센터</button>
          </div>
        </div>
      </div>
    </div>
  );
}
