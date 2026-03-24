import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, saveToken } from '../lib/auth';
import { postApiAuthLogin, type PostApiAuthLoginBody } from '../api/generated';
import { startSocialLogin, type SocialProvider } from '../api/social-auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

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
          saveToken(data.access_token);
          navigate('/');
        } else {
          throw new Error('토큰을 받지 못했습니다.');
        }
      } else if ((response.status as number) === 401 || response.status === 422) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        throw new Error('로그인에 실패했습니다.');
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('백엔드 서버 연결 실패\n\n가능한 원인:\n1. 백엔드 서버가 실행되지 않음\n');
      } else {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      }
      setLoading(null);
    }
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    setLoading(provider);
    setError(null);
    startSocialLogin(provider);
  };

  return (
    <div style={{ backgroundColor: '#FAFAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 0' }}>
      {showTermsModal && (
        <div onClick={() => setShowTermsModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '40px', width: '480px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '20px', color: '#1E2124' }}>약관 및 정책</span>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '16px', color: '#464C53', textAlign: 'center', padding: '40px 0' }}>준비중입니다.</span>
            <button type="button" onClick={() => setShowTermsModal(false)} style={{ height: '48px', backgroundColor: '#039BE5', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', color: '#FFFFFF' }}>닫기</button>
          </div>
        </div>
      )}
      {showSupportModal && (
        <div onClick={() => setShowSupportModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '40px', width: '480px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '20px', color: '#1E2124' }}>고객센터</span>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '16px', color: '#464C53', textAlign: 'center', padding: '40px 0' }}>준비중입니다.</span>
            <button type="button" onClick={() => setShowSupportModal(false)} style={{ height: '48px', backgroundColor: '#039BE5', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', color: '#FFFFFF' }}>닫기</button>
          </div>
        </div>
      )}

      <div style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '32px', padding: '40px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '520px' }}>
          <img src="/icons/logo__pc.svg" alt="logo" style={{ width: '165px', height: '32px', cursor: 'pointer', objectFit: 'contain' }} onClick={() => navigate('/')} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'stretch', padding: '0 0 40px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: '1.5', letterSpacing: '0.03125em', color: '#1E2124' }}>로그인</span>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', lineHeight: '1.5', color: '#464C53' }}>서비스 이용이 처음이라면 회원가입이 필요할 수 있습니다.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F4F5F6', border: '1px solid #CDD1D5', borderRadius: '6px' }}>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" disabled={loading !== null}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', lineHeight: '1.5', color: '#1E2124' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F4F5F6', border: '1px solid #CDD1D5', borderRadius: '6px' }}>
                  <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" disabled={loading !== null}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', lineHeight: '1.5', color: '#1E2124' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {showPassword
                      ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#8A949E"/></svg>
                      : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#8A949E"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" id="remember" checked={rememberEmail} onChange={(e) => setRememberEmail(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#256EF4', cursor: 'pointer' }} />
                  <label htmlFor="remember" style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53', cursor: 'pointer' }}>자동 로그인</label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53' }}>이메일 찾기</button>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53' }}>비밀번호 찾기</button>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-line' }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button type="button" onClick={handleEmailLogin as any} disabled={loading !== null}
              style={{ width: '100%', height: '57px', backgroundColor: '#039BE5', borderRadius: '8px', border: 'none', cursor: loading !== null ? 'not-allowed' : 'pointer', opacity: loading !== null ? 0.5 : 1, fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', lineHeight: '1.5', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0 20px' }}>
              {loading === 'email' ? '로그인 중...' : '로그인'}
            </button>
            <button type="button" onClick={() => navigate('/register')} disabled={loading !== null}
              style={{ width: '100%', height: '57px', backgroundColor: '#555770', borderRadius: '8px', border: 'none', cursor: loading !== null ? 'not-allowed' : 'pointer', opacity: loading !== null ? 0.5 : 1, fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', lineHeight: '1.5', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0 20px' }}>
              회원가입
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px 0', borderRadius: '8px' }}>
            <span style={{ fontFamily: 'NanumSquare, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '1.5', color: '#464C53', textAlign: 'center' }}>소셜 계정으로 로그인</span>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
              <button type="button" onClick={() => handleSocialLogin('naver')} disabled={loading !== null}
                style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#03A94D', border: 'none', cursor: loading !== null ? 'not-allowed' : 'pointer', opacity: loading !== null ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="네이버 로그인">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill="#FFFFFF" d="M13.125 0h6.875v20h-6.875l-6.25-9.375V20H0V0h6.875l6.25 9.375z"/></svg>
              </button>
              <button type="button" onClick={() => handleSocialLogin('kakao')} disabled={loading !== null}
                style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#FEE500', border: 'none', cursor: loading !== null ? 'not-allowed' : 'pointer', opacity: loading !== null ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="카카오 로그인">
                <svg width="24" height="22.4" viewBox="0 0 24 22.4" fill="none"><path fill="#000000" d="M12 0.75c-5.436 0-9.844 3.435-9.844 7.674 0 2.839 1.785 5.334 4.481 6.824l-.836 3.446c-.192.609.029.645.443.388l4.133-2.703c.514.055 1.04.103 1.624.103 5.436 0 9.844-3.435 9.844-7.674S17.436 0.75 12 0.75z"/></svg>
              </button>
              <button type="button" onClick={() => handleSocialLogin('google')} disabled={loading !== null}
                style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#E9F1FF', border: 'none', cursor: loading !== null ? 'not-allowed' : 'pointer', opacity: loading !== null ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="구글 로그인">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill="#4285F4" d="M18.8 10.21c0-.65-.06-1.28-.17-1.88H10v3.55h4.93c-.22 1.14-.87 2.11-1.84 2.76v2.31h2.97c1.74-1.6 2.74-3.95 2.74-6.74z"/><path fill="#34A853" d="M10 19.17c2.48 0 4.55-.82 6.07-2.22l-2.97-2.31c-.82.55-1.86.88-3.1.88-2.38 0-4.4-1.61-5.13-3.77H1.81v2.37C3.33 17.1 6.42 19.17 10 19.17z"/><path fill="#FBBC05" d="M4.87 11.75c-.18-.55-.29-1.13-.29-1.75s.11-1.2.29-1.75V5.88H1.81A9.17 9.17 0 0 0 .83 10c0 1.48.36 2.88.98 4.12l3.06-2.37z"/><path fill="#EB4335" d="M10 4.48c1.35 0 2.56.46 3.51 1.37l2.63-2.63C14.55 1.74 12.47.83 10 .83 6.42.83 3.33 2.9 1.81 5.88l3.06 2.37C5.6 6.09 7.62 4.48 10 4.48z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #CDD1D5', margin: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#1E2124' }}>비회원 주문조회</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              <button type="button" onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53' }}>약관 및 정책</button>
              <button type="button" onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53' }}>고객센터</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
