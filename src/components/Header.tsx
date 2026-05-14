import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, removeToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';

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

  return (
    <header className="w-full bg-white sticky top-0 z-50">

      {/* ── 메인 헤더 (로고 + 검색바 + 우측 버튼) ── */}
      <div className="w-full bg-white">
        <div className="max-w-[1248px] mx-auto flex items-center py-[10px] md:py-[15px] gap-3 md:gap-6 px-4 md:px-0">
          {/* 로고 */}
          <button
            onClick={() => { setSearchQuery(''); navigate('/'); }}
            className="shrink-0 hover:opacity-80 transition-opacity"
            aria-label="홈으로 이동"
          >
            <img src="/icons/logo__pc.svg" alt="뉴논문" className="w-[140px] md:w-[200px] h-auto" />
          </button>

          {/* 검색바 (PC만) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!searchQuery.trim()) return;
              navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }}
            className="hidden md:flex flex-1 max-w-[480px]"
          >
            <div className="flex items-center w-full h-10 border border-[#CDD1D5] rounded-lg overflow-hidden bg-white hover:border-[#8A949E] transition-colors">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="논문, 저자, 키워드 검색"
                className="flex-1 px-4 text-[14px] text-[#1E2124] placeholder:text-[#8A949E] bg-transparent border-none outline-none"
              />
              <button
                type="submit"
                className="w-10 h-10 flex items-center justify-center text-[#8A949E] hover:text-[#1E2124] transition-colors shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </form>

          {/* 우측: 로그인 상태에 따라 분기 */}
          <div className="flex flex-1 justify-end">
            {isLoggedIn === null ? null : isLoggedIn ? (
              /* status=login */
              <div className="flex items-center gap-2 md:gap-4 h-10 md:h-14">
                <div className="relative group">
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="장바구니"
                  >
                    <img src="/icons/bag-B.svg" alt="장바구니" className="w-7 h-7 md:w-10 md:h-10" />
                  </button>
                  <span className="absolute top-full mt-0.1 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    장바구니
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => navigate('/mypage')}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="마이페이지"
                  >
                    <img src="/icons/user-A.svg" alt="마이페이지" className="w-7 h-7 md:w-10 md:h-10" />
                  </button>
                  <span className="absolute top-full mt-0.1 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    마이페이지
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="로그아웃"
                  >
                    <IconLogOut />
                  </button>
                  <span className="absolute top-full mt-0.1 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    로그아웃
                  </span>
                </div>
              </div>
            ) : (
              /* status=logout */
              <div className="flex items-center gap-2 h-10 md:h-14">
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center text-[15px] md:text-[19px] font-bold text-[#1E2124] bg-transparent border border-[#1E2124] hover:bg-gray-50 transition-colors px-3 md:px-6 h-10 md:h-14 rounded-full"
                >
                  회원가입
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center text-[15px] md:text-[19px] font-bold text-white bg-[#1E2124] hover:bg-[#33363D] transition-colors px-3 md:px-6 h-10 md:h-14 rounded-full"
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
