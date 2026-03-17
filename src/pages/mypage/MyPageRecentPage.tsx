import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';

type RecentItem = {
  id: string | number;
  title: string;
  authors?: string[];
  venue?: string;
  published_at?: string;
  viewedAt: string;
};

export default function MyPageRecentPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    // localStorage에서 최근 본 논문 로드
    try {
      const stored = localStorage.getItem('recent_papers');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, [navigate]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleClearAll = () => {
    localStorage.removeItem('recent_papers');
    setItems([]);
  };

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="bg-white rounded-xl border border-[#D6E0EB] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] font-bold text-[#1E2124]">최근 본 논문</h2>
          {items.length > 0 && (
            <button onClick={handleClearAll} className="text-[13px] text-[#9CA3AF] hover:text-red-500 transition underline">
              전체 삭제
            </button>
          )}
        </div>

        {items.length === 0 && (
          <p className="text-center py-16 text-[#9CA3AF]">최근 본 논문이 없습니다.</p>
        )}
        {items.length > 0 && (
          <ul className="divide-y divide-[#F3F4F6]">
            {items.map(item => (
              <li key={item.id}
                className="py-4 cursor-pointer hover:bg-[#F8FAFC] rounded-lg px-3 transition"
                onClick={() => navigate(`/papers?id=${item.id}`)}>
                <div className="text-[16px] font-semibold text-[#1E2124] mb-1">{item.title}</div>
                <div className="flex items-center gap-3 text-[13px] text-[#9CA3AF]">
                  {item.authors && <span>{item.authors.slice(0, 2).join(', ')}</span>}
                  {item.venue && <span>{item.venue}</span>}
                  {item.viewedAt && <span>조회 {new Date(item.viewedAt).toLocaleDateString('ko-KR')}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MypageLayout>
  );
}
