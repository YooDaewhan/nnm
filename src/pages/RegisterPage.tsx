import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { postApiAuthRegister, type PostApiAuthRegisterBody } from '../api/generated';
import { API_BASE_URL } from '../api/client';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // 이메일 OTP 관련
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) navigate('/');
  }, [navigate]);

  // 이메일 변경 시 인증 초기화
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setVerificationToken('');
    setOtpError(null);
  };

  const handleSendOtp = async () => {
    if (!email) {
      setOtpError('이메일을 입력해주세요.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/email/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.status === 200) {
        setOtpSent(true);
      } else if (res.status === 422) {
        const msgs = data.errors ? Object.values(data.errors as Record<string, string[]>).flat().join('\n') : data.message;
        setOtpError(msgs || '이메일 발송에 실패했습니다.');
      } else if (res.status === 429) {
        setOtpError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setOtpError('이메일 발송에 실패했습니다.');
      }
    } catch {
      setOtpError('서버 연결에 실패했습니다.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError('인증 코드를 입력해주세요.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/email/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.status === 200 && data.verified && data.verification_token) {
        setOtpVerified(true);
        setVerificationToken(data.verification_token);
      } else if (res.status === 422) {
        const msgs = data.errors ? Object.values(data.errors as Record<string, string[]>).flat().join('\n') : data.message;
        setOtpError(msgs || '인증 코드가 올바르지 않습니다.');
      } else {
        setOtpError('인증에 실패했습니다.');
      }
    } catch {
      setOtpError('서버 연결에 실패했습니다.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified || !verificationToken) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const registerData = {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        verification_token: verificationToken,
      } as PostApiAuthRegisterBody;

      const response = await postApiAuthRegister(registerData, { credentials: 'include' });

      if (response.status === 201 && 'access_token' in response.data) {
        const data = response.data;
        if (data.access_token) {
          navigate('/register/complete');
        } else {
          throw new Error('토큰을 받지 못했습니다.');
        }
      } else if (response.status === 422) {
        const data = response.data as Record<string, unknown>;
        const errors = data.errors as Record<string, string[]> | undefined;
        if (errors) throw new Error(Object.values(errors).flat().join('\n'));
        throw new Error((data.message as string) || '입력 정보가 올바르지 않습니다.');
      } else {
        const data = response.data as Record<string, unknown>;
        throw new Error((data.message as string) || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  /* ── 공통 스타일 ── */
  const inputBox: React.CSSProperties = {
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px',
    padding: '8px 16px', backgroundColor: '#F4F5F6',
    border: '1px solid #CDD1D5', borderRadius: '6px',
    width: '100%', boxSizing: 'border-box',
  };
  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px',
    lineHeight: '1.5', color: '#1E2124',
  };
  const hintStyle: React.CSSProperties = {
    fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '13px',
    lineHeight: '1.5', color: '#464C53', marginTop: '4px',
  };
  const actionBtnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    height: '48px', padding: '0 16px',
    backgroundColor: active ? '#039BE5' : '#8E90A6',
    borderRadius: '6px', border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px',
    lineHeight: '1.5', color: '#FFFFFF', whiteSpace: 'nowrap',
    alignSelf: 'flex-start', flexShrink: 0,
  });

  const eyeIcon = (visible: boolean) =>
    visible ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#8A949E"/>
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#8A949E"/>
      </svg>
    );

  return (
    <div style={{ backgroundColor: '#FAFAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 0' }}>

      {/* 약관 및 정책 모달 */}
      {showTermsModal && (
        <div onClick={() => setShowTermsModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '40px', width: '480px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '20px', color: '#1E2124' }}>약관 및 정책</span>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '16px', color: '#464C53', textAlign: 'center', padding: '40px 0' }}>준비중입니다.</span>
            <button type="button" onClick={() => setShowTermsModal(false)} style={{ height: '48px', backgroundColor: '#039BE5', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', color: '#FFFFFF' }}>닫기</button>
          </div>
        </div>
      )}

      {/* wrap-600 */}
      <div style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '32px', padding: '40px', backgroundColor: '#FFFFFF' }}>

        {/* 로고 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '520px' }}>
          <img src="/icons/logo__pc.svg" alt="logo" style={{ width: '165px', height: '32px', cursor: 'pointer', objectFit: 'contain' }} onClick={() => navigate('/')} />
        </div>

        {/* top */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 0 40px 0' }}>

          {/* title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: '1.5', letterSpacing: '0.03125em', color: '#1E2124' }}>회원가입</span>
            <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', lineHeight: '1.5', color: '#464C53' }}>본인 확인을 위해 필요한 정보입니다. 정확하게 입력해주세요.</span>
          </div>

          {/* contents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* 이름 */}
              <div style={inputBox}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" disabled={loading} style={inputStyle} />
              </div>

              {/* 이메일 + 인증요청 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'stretch' }}>
                  <div style={{ flex: 1 }}>
                    <div style={inputBox}>
                      <input
                        type="email" value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="이메일" disabled={loading || otpVerified} style={inputStyle}
                      />
                    </div>
                  </div>
                  <button
                    type="button" onClick={handleSendOtp}
                    disabled={otpLoading || otpVerified || !email}
                    style={actionBtnStyle(otpVerified, (otpLoading || !email) && !otpVerified)}
                  >
                    {otpVerified ? '인증완료' : otpLoading ? '발송중...' : otpSent ? '재발송' : '인증요청'}
                  </button>
                </div>
                <span style={hintStyle}>비밀번호 분실 시 확인 가능한 이메일을 입력해 주세요.</span>
              </div>

              {/* OTP 입력 */}
              {otpSent && !otpVerified && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'stretch' }}>
                    <div style={inputBox}>
                      <input
                        type="text" value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="인증 코드 6자리" maxLength={6} disabled={otpLoading}
                        style={{ ...inputStyle, letterSpacing: '0.2em' }}
                      />
                    </div>
                    <button
                      type="button" onClick={handleVerifyOtp}
                      disabled={otpLoading || otp.length !== 6}
                      style={{
                        height: '48px', padding: '0 16px', backgroundColor: '#039BE5',
                        borderRadius: '6px', border: 'none',
                        cursor: (otpLoading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                        opacity: (otpLoading || otp.length !== 6) ? 0.5 : 1,
                        fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px',
                        lineHeight: '1.5', color: '#FFFFFF', whiteSpace: 'nowrap',
                        alignSelf: 'flex-start', flexShrink: 0,
                      }}
                    >
                      {otpLoading ? '확인중...' : '인증확인'}
                    </button>
                  </div>
                  <span style={hintStyle}>이메일로 발송된 6자리 코드를 입력해주세요. (유효시간 10분)</span>
                </div>
              )}

              {/* OTP 에러 */}
              {otpError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
                  {otpError}
                </div>
              )}

              {/* 인증 성공 */}
              {otpVerified && (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
                  이메일 인증이 완료되었습니다.
                </div>
              )}

              {/* 비밀번호 */}
              <div style={inputBox}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (8자 이상)" disabled={loading} minLength={8} style={inputStyle}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {eyeIcon(showPassword)}
                </button>
              </div>

              {/* 비밀번호 확인 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={inputBox}>
                  <input
                    type={showPassword ? 'text' : 'password'} value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="비밀번호 확인" disabled={loading} style={inputStyle}
                  />
                </div>
                <span style={hintStyle}>8~16자리의 영문 대소문자, 숫자, 특수문자를 조합하여 설정해 주세요.</span>
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-line' }}>
                {error}
              </div>
            )}

            {/* 약관 동의 */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', flex: 1 }}>
                <input type="checkbox" id="agreeAll" checked={agreeAll} onChange={(e) => setAgreeAll(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#256EF4', cursor: 'pointer', flexShrink: 0 }} />
                <label htmlFor="agreeAll" style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53', cursor: 'pointer' }}>모든 약관에 동의합니다.</label>
              </div>
              <button type="button" onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#BD2C0F' }}>약관 및 정책</button>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
            <button type="button" onClick={() => navigate('/login')} disabled={loading}
              style={{ flex: 1, height: '56px', backgroundColor: '#555770', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', lineHeight: '1.5', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              취소
            </button>
            <button type="button" onClick={handleRegister as any} disabled={loading || !otpVerified}
              style={{ flex: 1, height: '56px', backgroundColor: '#039BE5', borderRadius: '8px', border: 'none', cursor: (loading || !otpVerified) ? 'not-allowed' : 'pointer', opacity: (loading || !otpVerified) ? 0.5 : 1, fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', lineHeight: '1.5', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? '처리 중...' : '가입'}
            </button>
          </div>
        </div>

        {/* bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #CDD1D5', margin: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53' }}>이미 계정이 있습니까?</span>
              <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#BD2C0F' }}>로그인</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
              <button type="button" onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53' }}>약관 및 정책</button>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '15px', lineHeight: '1.5', color: '#464C53' }}>고객센터</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
