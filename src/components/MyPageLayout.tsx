import { Link, useLocation } from 'react-router-dom';

interface MypageLayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

const menuItems = [
  { label: '구매내역', href: '/mypage/orders' },
  { label: '보관함', href: '/mypage/scraps' },
  { label: '최근 본 논문', href: '/mypage/recent' },
  { label: 'Q&A', href: '/mypage/qna' },
  { label: '회원정보', href: '/mypage' },
];

export default function MypageLayout({ children, onLogout }: MypageLayoutProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/mypage') {
      return location.pathname === '/mypage' || location.pathname === '/mypage/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <main className="flex justify-center py-4 sm:py-10">
        <div className="w-full max-w-[1280px] px-2 sm:px-4">

          {/* 모바일: 가로 스크롤 탭 / 데스크톱: 숨김 */}
          <div className="flex sm:hidden overflow-x-auto gap-2 pb-3 mb-3 scrollbar-hide">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors
                    ${active ? 'bg-[#256EF4] text-white' : 'bg-white text-[#1E2124] border border-[#CDD1D5]'}`}
                >
                  {item.label}
                </Link>
              );
            })}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium whitespace-nowrap bg-white text-[#D32F2F] border border-[#CDD1D5]"
              >
                로그아웃
              </button>
            )}
          </div>

          {/* 데스크톱: 사이드바 + 콘텐츠 / 모바일: 콘텐츠만 */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">

            {/* 왼쪽 세로 탭 메뉴 - 데스크톱만 표시 */}
            <div className="hidden sm:flex bg-white rounded-xl flex-col gap-[2px] p-4 w-[300px] shrink-0 sm:sticky sm:top-24 sm:self-start">
              {menuItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`w-full flex items-center justify-center rounded-lg px-6 py-4 text-[19px] leading-[1.5em] transition-colors
                      ${active
                        ? 'bg-[#256EF4] text-white font-medium'
                        : 'bg-transparent text-[#1E2124] hover:bg-[#F4F5F6]'
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center rounded-lg px-6 py-4 text-[19px] leading-[1.5em] text-[#D32F2F] hover:bg-[#F4F5F6] transition-colors"
                >
                  로그아웃
                </button>
              )}
            </div>

            {/* 오른쪽 콘텐츠 영역 */}
            <div className="flex flex-col gap-4 sm:gap-8 pb-8 sm:pb-16 flex-1 min-w-0 w-full">
              {children}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
