import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { API_BASE_URL } from '../api/client';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate('/');
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirm }),
      });
      const data = await response.json();

      if (response.status === 201 || response.status === 200) {
        navigate('/register/complete');
      } else if (response.status === 422) {
        const msgs = Object.values(data.errors ?? {}).flat().join(' ');
        setError(msgs || data.message || '입력 정보를 확인해주세요.');
      } else {
        setError(data.message || '회원가입에 실패했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px',
    lineHeight: '1.5', color: '#1E2124',
  };
  const wrapStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px',
    padding: '8px 16px', backgroundColor: '#F4F5F6',
    border: '1px solid #CDD1D5', borderRadius: '6px',
  };

  return (
    <div style={{ backgroundColor: '#FAFAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 0' }}>
      <div style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '32px', padding: '40px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="/icons/logo__pc.svg" alt="logo" style={{ width: '165px', height: '32px', cursor: 'pointer', objectFit: 'contain' }} onClick={() => navigate('/')} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 700, fontSize: '32px', color: '#1E2124' }}>회원가입</span>
          <span style={{ fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '17px', color: '#464C53' }}>계정 정보를 입력해주세요.</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={wrapStyle}>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름" disabled={loading} style={inputStyle} />
          </div>
          <div style={wrapStyle}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일" disabled={loading} style={inputStyle} />
          </div>
          <div style={wrapStyle}>
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 (8자 이상)" disabled={loading} style={inputStyle} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#8A949E"/></svg>
            </button>
          </div>
          <div style={wrapStyle}>
            <input type={showPasswordConfirm ? 'text' : 'password'} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="비밀번호 확인" disabled={loading} style={inputStyle} />
            <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#8A949E"/></svg>
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button type="button" onClick={handleRegister as any} disabled={loading}
            style={{ width: '100%', height: '57px', backgroundColor: '#039BE5', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', color: '#FFFFFF' }}>
            {loading ? '처리 중...' : '회원가입'}
          </button>
          <button type="button" onClick={() => navigate('/login')} disabled={loading}
            style={{ width: '100%', height: '57px', backgroundColor: '#555770', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontFamily: 'Pretendard GOV, sans-serif', fontWeight: 400, fontSize: '19px', color: '#FFFFFF' }}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
