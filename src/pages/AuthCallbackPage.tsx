import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleSocialCallback } from '../api/social-auth';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('소셜 로그인이 취소되었거나 오류가 발생했습니다.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code) {
      setError('인증 코드를 받지 못했습니다.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    handleSocialCallback(code, state).then((result) => {
      if (result.success && result.access_token) {
        localStorage.setItem('access_token', result.access_token);
        if (result.user) localStorage.setItem('user_data', JSON.stringify(result.user));
        navigate('/');
      } else {
        setError(result.error || '로그인에 실패했습니다.');
        setTimeout(() => navigate('/login'), 3000);
      }
    });
  }, []);

  return (
    <div style={{ backgroundColor: '#FAFAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        {error ? (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#DC2626"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '20px', color: '#1E2124' }}>로그인 실패</span>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', color: '#464C53', textAlign: 'center' }}>
              {error}<br />잠시 후 로그인 페이지로 이동합니다.
            </span>
          </>
        ) : (
          <>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #E5E7EB', borderTopColor: '#039BE5', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', color: '#464C53' }}>
              로그인 처리 중...
            </span>
          </>
        )}
      </div>
    </div>
  );
}
