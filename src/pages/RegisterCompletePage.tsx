import { useNavigate } from 'react-router-dom';

export default function RegisterCompletePage() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#FAFAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 0' }}>
      <div style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '32px', padding: '40px', backgroundColor: '#FFFFFF', alignItems: 'center' }}>
        <img src="/icons/logo__pc.svg" alt="logo" style={{ width: '165px', height: '32px', cursor: 'pointer', objectFit: 'contain' }} onClick={() => navigate('/')} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#039BE5"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '28px', color: '#1E2124' }}>
            회원가입 완료
          </span>
          <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', color: '#464C53', textAlign: 'center', lineHeight: '1.6' }}>
            회원가입이 완료되었습니다.<br />로그인하여 서비스를 이용해주세요.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <button type="button" onClick={() => navigate('/login')}
            style={{ width: '100%', height: '57px', backgroundColor: '#039BE5', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', color: '#FFFFFF' }}>
            로그인하기
          </button>
          <button type="button" onClick={() => navigate('/')}
            style={{ width: '100%', height: '57px', backgroundColor: '#555770', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', color: '#FFFFFF' }}>
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
