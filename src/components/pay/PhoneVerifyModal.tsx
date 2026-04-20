import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/client';
import { getToken } from '../../lib/auth';

interface PhoneVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export default function PhoneVerifyModal({ isOpen, onClose, onVerified }: PhoneVerifyModalProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setCode('');
      setOtpSent(false);
      setVerified(false);
      setSending(false);
      setVerifying(false);
      setError(null);
      setSuccessMsg(null);
      setTimer(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    setError(null);
    setSuccessMsg(null);

    const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;
    if (!phoneRegex.test(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)');
      return;
    }

    setSending(true);
    try {
      const token = getToken();
      const normalizedPhone = phone.replace(/-/g, '');
      const response = await fetch(`${API_BASE_URL}/api/auth/phone/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      let data: Record<string, unknown> = {};
      const text = await response.text();
      try { data = JSON.parse(text); } catch { /* non-JSON body */ }

      if (!response.ok) {
        const errMsg =
          (data.errors ? Object.values(data.errors as Record<string, string[]>).flat().join(' ') : null)
          || (data.message as string | undefined)
          || (response.status >= 500 ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' : '인증번호 발송에 실패했습니다.');
        throw new Error(errMsg);
      }

      setOtpSent(true);
      setTimer(180);
      setCode('');
      setSuccessMsg('인증번호가 발송되었습니다. 3분 내에 입력해주세요.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError(null);

    if (code.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }

    if (timer <= 0) {
      setError('인증번호가 만료되었습니다. 다시 발송해주세요.');
      return;
    }

    setVerifying(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: phone.replace(/-/g, ''), code }),
      });

      let data: Record<string, unknown> = {};
      const text = await response.text();
      try { data = JSON.parse(text); } catch { /* non-JSON body */ }

      if (!response.ok) {
        const errMsg =
          (data.errors ? Object.values(data.errors as Record<string, string[]>).flat().join(' ') : null)
          || (data.message as string | undefined)
          || (response.status >= 500 ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' : '인증번호가 올바르지 않습니다.');
        throw new Error(errMsg);
      }

      setVerified(true);
      setError(null);
      setSuccessMsg('휴대폰 인증이 완료되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          background: '#EEF2F7',
          borderRadius: 12,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 22, color: '#1E2124' }}>
            휴대폰 인증
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#1E2124" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontSize: 15, color: '#464C53', margin: 0, lineHeight: '1.5em' }}>
          결제 전 휴대폰 인증이 필요합니다.
        </p>

        {/* 전화번호 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 600, fontSize: 15, color: '#1E2124' }}>
            휴대폰 번호
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9-]/g, ''))}
              placeholder="01012345678"
              disabled={verified}
              style={{
                flex: 1,
                height: 48,
                padding: '0 14px',
                border: '1px solid #CDD1D5',
                borderRadius: 8,
                fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                fontSize: 15,
                color: '#1E2124',
                background: verified ? '#F4F5F6' : '#FFFFFF',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSendOTP}
              disabled={sending || verified}
              style={{
                height: 48,
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: sending || verified ? '#CDD1D5' : '#256EF4',
                color: '#FFFFFF',
                fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                cursor: sending || verified ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {sending ? '발송 중...' : otpSent ? '재발송' : '인증번호 발송'}
            </button>
          </div>
        </div>

        {/* OTP 입력 (발송 후 표시) */}
        {otpSent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 600, fontSize: 15, color: '#1E2124', display: 'flex', alignItems: 'center', gap: 8 }}>
              인증번호
              {timer > 0 && (
                <span style={{ color: timer <= 30 ? '#E53E3E' : '#256EF4', fontSize: 14, fontWeight: 400 }}>
                  {formatTimer(timer)}
                </span>
              )}
              {timer <= 0 && (
                <span style={{ color: '#E53E3E', fontSize: 14, fontWeight: 400 }}>만료됨</span>
              )}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
                placeholder="인증번호 6자리 입력"
                disabled={verified}
                style={{
                  flex: 1,
                  height: 48,
                  padding: '0 14px',
                  border: '1px solid #CDD1D5',
                  borderRadius: 8,
                  fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                  fontSize: 15,
                  color: '#1E2124',
                  background: verified ? '#F4F5F6' : '#FFFFFF',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleVerifyOTP}
                disabled={verifying || verified || timer <= 0}
                style={{
                  height: 48,
                  padding: '0 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: verifying || verified || timer <= 0 ? '#CDD1D5' : '#256EF4',
                  color: '#FFFFFF',
                  fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: verifying || verified || timer <= 0 ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {verifying ? '확인 중...' : '인증 확인'}
              </button>
            </div>
          </div>
        )}

        {/* 에러 / 성공 메시지 */}
        {error && (
          <p style={{ margin: 0, color: '#E53E3E', fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontSize: 14 }}>
            {error}
          </p>
        )}
        {!error && successMsg && (
          <p style={{ margin: 0, color: '#256EF4', fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontSize: 14 }}>
            {successMsg}
          </p>
        )}

        {/* 완료 버튼 */}
        <button
          onClick={() => { if (verified) onVerified(); }}
          disabled={!verified}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 8,
            background: verified ? '#256EF4' : '#CDD1D5',
            border: 'none',
            cursor: verified ? 'pointer' : 'not-allowed',
            fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 17,
            color: '#FFFFFF',
          }}
        >
          완료
        </button>
      </div>
    </div>
  );
}
