import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, removeToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { searchAutocomplete, AutocompleteResultItem } from '@/api/search';

interface HeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

/* ─── Utility 상단바 아이콘 ─── */
const IconArrowDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6l4 4 4-4" stroke="#33363D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.47 2.67L12 8l-6.53 5.33" stroke="#1E2124" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSearch = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14.67" cy="14.67" r="8" stroke="#1E2124" strokeWidth="2"/>
    <path d="M21.33 21.33L26.67 26.67" stroke="#1E2124" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconLogOut = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 17 5-5-5-5"/>
    <path d="M21 12H9"/>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  </svg>
);

/* ─── 유틸리티 select 아이템 ─── */
const UtilSelect = ({ label }: { label: string }) => (
  <button className="flex items-center gap-0.5 h-6 px-0.5 rounded hover:bg-gray-50 transition-colors">
    <span className="text-[15px] font-normal text-[#1E2124] leading-[1.5] whitespace-nowrap">{label}</span>
    <IconArrowDown />
  </button>
);

/* ─── 유틸리티 link 아이템 ─── */
const UtilLink = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-0.5 h-6 px-0.5 rounded hover:bg-gray-50 transition-colors"
  >
    <span className="text-[15px] font-normal text-[#1E2124] leading-[1.5] whitespace-nowrap">{label}</span>
    <IconArrowRight />
  </button>
);

/* ─── 유틸리티 구분선 ─── */
const UtilDivider = () => (
  <div className="w-px h-4 bg-[#CDD1D5] shrink-0" />
);

export default function Header({ isLoggedIn: propIsLoggedIn, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResultItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoggedIn(propIsLoggedIn ?? isAuthenticated());
  }, [propIsLoggedIn, location.pathname]);

  useEffect(() => {
    const handleAuthLogout = () => {
      setIsLoggedIn(false);
      navigate('/login');
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [navigate]);

  const handleLogout = async () => {
    try { await apiClient.logout(); } catch (err) { console.error(err); }
    finally {
      removeToken();
      localStorage.removeItem('user_data');
      setIsLoggedIn(false);
      if (onLogout) onLogout();
      navigate('/');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) { setAutocompleteResults([]); setShowAutocomplete(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchAutocomplete({ query: value.trim(), limit: 8 });
        setAutocompleteResults(results);
        setShowAutocomplete(results.length > 0);
      } catch {
        setAutocompleteResults([]);
        setShowAutocomplete(false);
      }
    }, 250);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowAutocomplete(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAutocompleteSelect = (text: string) => {
    setSearchQuery(text);
    setShowAutocomplete(false);
    navigate(`/search?q=${encodeURIComponent(text)}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <header className="w-full bg-white">

      {/* ── 메인 헤더 (로고 + 검색바 + 우측 버튼) ── */}
      <div className="w-full bg-white">
        <div
          className="max-w-[1248px] mx-auto flex items-center"
          style={{ padding: '15px 0', gap: '40px' }}
        >
          {/* CI-slogan: 로고 200×39 */}
          <button
            onClick={() => navigate('/')}
            className="shrink-0 hover:opacity-80 transition-opacity"
            aria-label="홈으로 이동"
          >
            <img src="/icons/logo__pc.svg" alt="뉴논문" style={{ width: 200, height: 39 }} />
          </button>

          {/* 검색바 550×56, border #58616A, radius 10px — 홈에서는 숨김 */}
          <div
            ref={autocompleteRef}
            className={`relative shrink-0 ${location.pathname === '/' ? 'invisible pointer-events-none' : ''}`}
            style={{ width: '550px' }}
          >
            <div
              className="flex items-center gap-4"
              style={{
                height: '56px',
                border: '1px solid #58616A',
                borderRadius: '10px',
                padding: '0 24px',
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="검색어를 입력해주세요."
                className="flex-1 bg-transparent outline-none border-none text-[#1E2124] placeholder-[#8A949E]"
                style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  lineHeight: '1.5',
                  fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                }}
              />
              <button
                onClick={handleSearch}
                className="flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
                aria-label="검색"
              >
                <IconSearch />
              </button>
            </div>
            {/* 자동완성 드롭다운 */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#CDD1D5] rounded-xl shadow-lg mt-1 overflow-hidden">
                {autocompleteResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAutocompleteSelect(item.text)}
                    className="w-full text-left px-6 py-3 text-[15px] text-[#1E2124] hover:bg-[#F4F5F6] transition-colors border-b border-[#F4F5F6] last:border-0"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 로그인 상태에 따라 분기 */}
          <div className="flex-1 flex justify-end">
            {isLoggedIn === null ? null : isLoggedIn ? (
              /* status=login: bag → user, 48×48, gap 32px */
              <div className="flex items-center" style={{ gap: '16px', height: '56px' }}>
                <div className="relative group">
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ width: '48px', height: '48px' }}
                    aria-label="장바구니"
                  >
                    <img src="/icons/bag-B.svg" alt="장바구니" style={{ width: 40, height: 40 }} />
                  </button>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    장바구니
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => navigate('/mypage')}
                    className="flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ width: '48px', height: '48px' }}
                    aria-label="마이페이지"
                  >
                    <img src="/icons/user-A.svg" alt="마이페이지" style={{ width: 40, height: 40 }} />
                  </button>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    마이페이지
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ width: '48px', height: '48px' }}
                    aria-label="로그아웃"
                  >
                    <IconLogOut />
                  </button>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    로그아웃
                  </span>
                </div>
              </div>
            ) : (
              /* status=logout: 회원가입(outline) + 로그인(solid), h56, r1000px */
              <div className="flex items-center gap-2" style={{ height: '56px' }}>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center text-[19px] font-bold text-[#1E2124] bg-transparent border border-[#1E2124] hover:bg-gray-50 transition-colors"
                  style={{ padding: '0 24px', height: '56px', borderRadius: '1000px' }}
                >
                  회원가입
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center text-[19px] font-bold text-white bg-[#1E2124] hover:bg-[#33363D] transition-colors"
                  style={{ padding: '0 24px', height: '56px', borderRadius: '1000px' }}
                >
                  로그인
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 하단 구분선 ── */}
      <div className="w-full h-px bg-[#CDD1D5]" />

    </header>
  );
}
