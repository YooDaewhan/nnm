import { Link, useLocation } from 'react-router-dom';

interface MypageLayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

const menuItems = [
  { label: '구매내역', href: '/mypage/orders' },
  { label: '보관함', href: '/mypage/library' },
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
      <main className="flex justify-center py-10">
        <div className="w-[1280px] px-4">
          {/* Breadcrumb */}
          <div className="pb-8">
            <div className="flex items-center gap-1 text-[15px] text-[#1E2124]">
              <span>홈</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="#1E2124" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>1Depth</span>
            </div>
          </div>

          {/* contents-area: 왼쪽 세로 네비 + 오른쪽 콘텐츠 */}
          <div className="flex flex-row gap-8 items-start">

            {/* 왼쪽 세로 탭 메뉴 (width: 300px) */}
            <div className="bg-white rounded-xl flex flex-col gap-[2px] p-4 w-[300px] shrink-0">
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
            <div className="flex flex-col gap-8 pb-16 flex-1 min-w-0">
              {children}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
