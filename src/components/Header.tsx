import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, removeToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';

const SEARCH_CATEGORIES = [
  { value: 'all',       label: '전체' },
  { value: 'title',     label: '제목' },
  { value: 'author',    label: '저자' },
  { value: 'keyword',   label: '키워드' },
  { value: 'full_text', label: '전문' },
];

interface HeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}


export default function Header({ isLoggedIn: propIsLoggedIn, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (searchCategory !== 'all') params.set('field', searchCategory);
    navigate(`/search?${params.toString()}`);
  };

  const selectedLabel = SEARCH_CATEGORIES.find(c => c.value === searchCategory)?.label ?? '전체';

  return (
    <header className="w-full bg-white sticky top-0 z-50">

      {/* ── 메인 헤더 (로고 + 검색바 + 우측 버튼) ── */}
      <div className="w-full bg-white">
        <div className="max-w-[1248px] mx-auto relative flex items-center py-[10px] md:py-[15px] px-5 md:px-0" style={{ minHeight: 70 }}>

          {/* 로고 */}
          <a
            onClick={() => { setSearchQuery(''); navigate('/'); }}
            className="shrink-0"
            aria-label="홈으로 이동"
          >
            <img src="/icons/logo__pc.svg" alt="뉴논문" className="w-[135px] md:w-[165px] h-auto" />
          </a>

          {/* 검색바 (PC만, 홈 제외) */}
          {location.pathname !== '/' && (
          <div className="hidden md:flex flex-1 justify-center min-w-0 px-4">
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-[700px]"
          >
            <div className="flex items-center w-full max-h-[62px] border border-[#1E2124] rounded-xl overflow-visible bg-white relative">

              {/* 카테고리 드롭다운 */}
              <div ref={categoryRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(v => !v)}
                  className="flex items-center gap-1 px-4 h-[50px] text-[15px] text-[#1E2124] font-medium whitespace-nowrap rounded-l-xl"
                >
                  {selectedLabel}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="#33363D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showCategoryDropdown && (
                  <ul className="absolute top-[calc(100%+4px)] left-0 bg-white border border-[#CDD1D5] rounded-lg shadow-md py-1 z-10 min-w-[100px]">
                    {SEARCH_CATEGORIES.map(cat => (
                      <li key={cat.value}>
                        <button
                          type="button"
                          onClick={() => { setSearchCategory(cat.value); setShowCategoryDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-[14px] transition-colors ${searchCategory === cat.value ? 'font-semibold text-[#1E2124]' : 'text-[#33363D]'}`}
                        >
                          {cat.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 구분선 */}
              <div className="w-px h-6 bg-[#CDD1D5] shrink-0" />

              {/* 텍스트 입력 */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요"
                className="flex-1 px-4 text-[15px] text-[#1E2124] placeholder:text-[#8A949E] bg-transparent border-none outline-none"
              />

              {/* ··· 버튼 */}
              <button
                type="button"
                className="shrink-0 px-3 text-[#8A949E] hover:text-[#1E2124] transition-colors text-lg leading-none tracking-widest"
                aria-label="더보기"
              >
                ···
              </button>

              {/* 검색 아이콘 */}
              <button
                type="submit"
                className="shrink-0 w-12 h-[50px] flex items-center justify-center text-[#1E2124] hover:opacity-70 transition-opacity"
                aria-label="검색"
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

            </div>
          </form>
          </div>
          )}

          {/* 우측: 로그인 상태에 따라 분기 */}
          <div className="ml-auto flex shrink-0 items-center">
            {isLoggedIn === null ? null : isLoggedIn ? (
              /* status=login */
              <div className="flex items-center gap-2 md:gap-4 h-10 md:h-14">
                <div className="relative group hidden md:block">
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="장바구니"
                  >
                    <img src="/svg/bag-B.svg" alt="장바구니" className="w-7 h-7 md:w-10 md:h-10" />
                  </button>
                  <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    장바구니
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => navigate('/mypage')}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="마이페이지"
                  >
                    <img src="/svg/user-circle-fill.svg" alt="마이페이지" className="w-9 h-9 md:w-10 md:h-10" />
                  </button>
                  <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    마이페이지
                  </span>
                </div>
                <div className="relative group hidden md:block">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="로그아웃"
                  >
                    <img src="/svg/logout.svg" alt="로그아웃" className="w-7 h-7 md:w-10 md:h-10" />
                  </button>
                  <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    로그아웃
                  </span>
                </div>
              </div>
            ) : (
              /* status=logout */
              <div className="flex items-center gap-2 md:gap-4 h-10 md:h-14">
                <div className="relative group hidden md:block">
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="장바구니"
                  >
                    <img src="/svg/bag-B.svg" alt="장바구니" className="w-7 h-7 md:w-10 md:h-10" />
                  </button>
                  <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    장바구니
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 hover:opacity-70 transition-opacity"
                    aria-label="로그인"
                  >
                    <img src="/svg/user-circle-fill.svg" alt="로그인" className="w-9 h-9 md:w-10 md:h-10" />
                  </button>
                  <span className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[12px] text-[#1E2124] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    로그인
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── 모바일 검색바 (md 미만에서만 표시, 피그마 header__mo 디자인) ── */}
      <div className="md:hidden w-full bg-white px-4 pb-6">
        <form onSubmit={handleSearch}>
          <div
            className="flex items-center w-full bg-white rounded-[8px]"
            style={{ border: '2px solid #1E2124' }}
          >
            {/* 검색 입력 */}
            <div className="flex items-center flex-1 h-[64px] px-6 gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요"
                className="flex-1 text-[19px] leading-[150%] font-normal text-[#1E2124] placeholder:text-[#8A949E] bg-transparent border-none outline-none"
                style={{ fontFamily: "'Pretendard GOV', 'Pretendard', sans-serif" }}
              />
            </div>

            {/* 검색 버튼 */}
            <button
              type="submit"
              className="shrink-0 flex items-center justify-center w-[64px] h-[64px] text-[#33363D] hover:opacity-70 transition-opacity"
              aria-label="검색"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="8.5" stroke="#33363D" strokeWidth="2"/>
                <line x1="20.6" y1="20.6" x2="27" y2="27" stroke="#33363D" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* ── 하단 구분선 ── */}
      <div className="w-full h-px bg-[#CDD1D5]" />

    </header>
  );
}
