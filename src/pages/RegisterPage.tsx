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
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setTimeout(() => setOtpTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [otpTimer]);

  useEffect(() => {
    if (isAuthenticated()) navigate('/');
  }, [navigate]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setVerificationToken('');
    setOtpError(null);
  };

  const handleSendOtp = async () => {
    if (!email) { setOtpError('이메일을 입력해주세요.'); return; }
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
        setOtpTimer(180);
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
    if (!otp) { setOtpError('인증 코드를 입력해주세요.'); return; }
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
    if (!agreeAll) { setError('약관에 동의해주세요.'); return; }
    if (!otpVerified || !verificationToken) { setError('이메일 인증을 완료해주세요.'); return; }
setLoading(true);
    setError(null);
    try {
      const registerData: PostApiAuthRegisterBody = {
        name, email, password,
        password_confirmation: passwordConfirmation,
        verification_token: verificationToken,
        agreement: 1,
      };

      const response = await postApiAuthRegister(registerData, { credentials: 'include' });

      if (response.status === 201 && 'access_token' in response.data) {
        if (response.data.access_token) {
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

  const inputCls = "flex-1 min-w-0 bg-transparent border-none outline-none text-base sm:text-[17px] text-[#1E2124]";
  const fontStyle = { fontFamily: 'Pretendard GOV, sans-serif' };

  return (
    <div className="bg-[#FAFAFC] min-h-screen flex justify-center items-start">

      {/* 약관 모달 */}
      {showTermsModal && (
        <div onClick={() => setShowTermsModal(false)} className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] px-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-8 w-full max-w-md flex flex-col gap-6">
            <span className="font-bold text-xl text-[#1E2124]" style={fontStyle}>약관 및 정책</span>
            <span className="text-base text-[#464C53] text-center py-10" style={fontStyle}>준비중입니다.</span>
            <button type="button" onClick={() => setShowTermsModal(false)} className="h-12 bg-[#039BE5] rounded-lg border-none cursor-pointer text-white text-lg" style={fontStyle}>닫기</button>
          </div>
        </div>
      )}

      <div className="w-full sm:w-[600px] flex flex-col gap-8 px-5 py-8 sm:px-10 sm:py-10 bg-white min-h-screen sm:min-h-0">

        {/* 로고 */}
        <div className="flex justify-center items-center">
          <img src="/icons/logo__pc.svg" alt="logo" className="w-36 sm:w-[165px] h-8 cursor-pointer object-contain" onClick={() => navigate('/')} />
        </div>

        <div className="flex flex-col gap-8 pb-10">

          {/* 타이틀 */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-2xl sm:text-[32px] leading-snug tracking-wide text-[#1E2124]" style={fontStyle}>회원가입</span>
            <span className="text-sm sm:text-[17px] leading-relaxed text-[#464C53]" style={fontStyle}>본인 확인을 위해 필요한 정보입니다. 정확하게 입력해주세요.</span>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">

              {/* 이름 */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-md">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" disabled={loading} className={inputCls} style={fontStyle} />
              </div>

              {/* 이메일 + 인증요청 */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-row gap-2 items-stretch">
                  <div className="flex-1 min-w-0 flex items-center gap-2 px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-md overflow-hidden">
                    <input
                      type="email" value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="이메일" disabled={loading || otpVerified}
                      className={inputCls} style={fontStyle}
                    />
                  </div>
                  <button
                    type="button" onClick={handleSendOtp}
                    disabled={otpLoading || otpVerified || !email}
                    className={`h-12 px-3 sm:px-4 rounded-md border-none text-white text-sm sm:text-[17px] whitespace-nowrap flex-shrink-0 ${otpVerified ? 'bg-[#8E90A6]' : 'bg-[#039BE5]'} disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer`}
                    style={fontStyle}
                  >
                    {otpVerified ? '인증완료' : otpLoading ? '발송중...' : otpSent ? '재발송' : '인증요청'}
                  </button>
                </div>
                <span className="text-xs sm:text-[13px] text-[#464C53]" style={fontStyle}>비밀번호 분실 시 확인 가능한 이메일을 입력해 주세요.</span>
              </div>

              {/* OTP 입력 */}
              {otpSent && !otpVerified && (
                <div className="flex flex-col gap-1">
                  <div className="flex flex-row gap-2 items-stretch">
                    <div className="flex-1 min-w-0 flex items-center gap-2 px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-md overflow-hidden">
                      <input
                        type="text" value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="인증 코드 6자리" maxLength={6} disabled={otpLoading}
                        className={`${inputCls} tracking-[0.2em]`} style={fontStyle}
                      />
                    </div>
                    <button
                      type="button" onClick={handleVerifyOtp}
                      disabled={otpLoading || otp.length !== 6}
                      className="h-12 px-3 sm:px-4 bg-[#039BE5] rounded-md border-none text-white text-sm sm:text-[17px] whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      style={fontStyle}
                    >
                      {otpLoading ? '확인중...' : '인증확인'}
                    </button>
                  </div>
                  <span className={`text-xs sm:text-[13px] ${otpTimer > 0 ? 'text-[#464C53]' : 'text-red-500'}`} style={fontStyle}>
                    {otpTimer > 0
                      ? `이메일로 발송된 6자리 코드를 입력해주세요. (${String(Math.floor(otpTimer / 60)).padStart(2, '0')}:${String(otpTimer % 60).padStart(2, '0')})`
                      : '인증 코드가 만료되었습니다. 재발송해 주세요.'}
                  </span>
                </div>
              )}

              {/* OTP 에러 */}
              {otpError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {otpError}
                </div>
              )}

              {/* 인증 성공 */}
              {otpVerified && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  이메일 인증이 완료되었습니다.
                </div>
              )}

              {/* 비밀번호 */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F4F5F6] border border-[#CDD1D5] rounded-md overflow-hidden">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (8자 이상)" disabled={loading} minLength={8}
                  className={inputCls} style={fontStyle}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="bg-transparent border-none cursor-pointer p-0 flex items-center flex-shrink-0">
                  {eyeIcon(showPassword)}
                </button>
              </div>

              {/* 비밀번호 확인 */}
              <div className="flex flex-col gap-1">
                <div className={`flex items-center gap-2 px-4 py-3 bg-[#F4F5F6] border rounded-md overflow-hidden ${passwordConfirmation && password !== passwordConfirmation ? 'border-red-400' : 'border-[#CDD1D5]'}`}>
                  <input
                    type={showPassword ? 'text' : 'password'} value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="비밀번호 확인" disabled={loading}
                    className={inputCls} style={fontStyle}
                  />
                </div>
                {passwordConfirmation && password !== passwordConfirmation && (
                  <span className="text-xs sm:text-[13px] text-red-500" style={fontStyle}>비밀번호가 일치하지 않습니다.</span>
                )}
                {passwordConfirmation && password === passwordConfirmation && (
                  <span className="text-xs sm:text-[13px] text-green-600" style={fontStyle}>비밀번호가 일치합니다.</span>
                )}
                {!passwordConfirmation && (
                  <span className="text-xs sm:text-[13px] text-[#464C53]" style={fontStyle}>8~16자리의 영문 대소문자, 숫자, 특수문자를 조합하여 설정해 주세요.</span>
                )}
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            {/* 약관 동의 */}
            <div className="flex flex-row items-center gap-1">
              <div className="flex flex-row items-center gap-1 flex-1">
                <input type="checkbox" id="agreeAll" checked={agreeAll} onChange={(e) => setAgreeAll(e.target.checked)} className="w-4 h-4 accent-[#256EF4] cursor-pointer flex-shrink-0" />
                <label htmlFor="agreeAll" className="text-sm sm:text-[15px] leading-relaxed text-[#464C53] cursor-pointer" style={fontStyle}>모든 약관에 동의합니다.</label>
              </div>
              <button type="button" onClick={() => setShowTermsModal(true)} className="bg-transparent border-none cursor-pointer px-0.5 text-sm sm:text-[15px] leading-relaxed text-[#BD2C0F]" style={fontStyle}>약관 및 정책</button>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-row gap-4">
            <button type="button" onClick={() => navigate('/login')} disabled={loading}
              className="flex-1 h-14 bg-[#555770] rounded-lg border-none text-white text-lg sm:text-[19px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={fontStyle}>
              취소
            </button>
            <button type="button" onClick={handleRegister as any} disabled={loading || !otpVerified || !agreeAll || password !== passwordConfirmation || !password}
              className="flex-1 h-14 bg-[#039BE5] rounded-lg border-none text-white text-lg sm:text-[19px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={fontStyle}>
              {loading ? '처리 중...' : '가입'}
            </button>
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="flex flex-col gap-4 mt-auto">
          <hr className="w-full border-none border-t border-[#CDD1D5]" />
          <div className="flex flex-row justify-between items-center flex-wrap gap-2">
            <div className="flex flex-row gap-2 items-center">
              <span className="text-sm sm:text-[15px] leading-relaxed text-[#464C53]" style={fontStyle}>이미 계정이 있습니까?</span>
              <button type="button" onClick={() => navigate('/login')} className="bg-transparent border-none cursor-pointer px-0.5 text-sm sm:text-[15px] leading-relaxed text-[#BD2C0F]" style={fontStyle}>로그인</button>
            </div>
            <div className="flex flex-row items-center gap-4">
              <button type="button" onClick={() => setShowTermsModal(true)} className="bg-transparent border-none cursor-pointer px-0.5 text-sm sm:text-[15px] leading-relaxed text-[#464C53]" style={fontStyle}>약관 및 정책</button>
              <button type="button" className="bg-transparent border-none cursor-pointer px-0.5 text-sm sm:text-[15px] leading-relaxed text-[#464C53]" style={fontStyle}>고객센터</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
