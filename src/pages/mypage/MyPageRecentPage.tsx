import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';

const STORAGE_KEY = 'recent_papers';

export type RecentPaper = {
  id: string;
  title: string;
  authors: string[];
  published_at?: string;
  venue?: string;
  viewedAt: number;
};

function getRecentPapers(): RecentPaper[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function clearRecentPapers(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function addRecentPaper(paper: Omit<RecentPaper, 'viewedAt'>): void {
  try {
    const existing = getRecentPapers().filter((p) => p.id !== paper.id);
    const updated = [{ ...paper, viewedAt: Date.now() }, ...existing].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export default function MyPageRecentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [papers, setPapers] = useState<RecentPaper[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login', { state: { from: location.pathname } }); return; }
    setPapers(getRecentPapers());
  }, [navigate, location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleClear = () => {
    clearRecentPapers();
    setPapers([]);
  };

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="flex flex-col gap-4">
        {/* 헤더 카드 */}
        <div className="bg-white rounded-xl p-4 sm:p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-[32px] font-bold leading-[1.5em] tracking-[0.03em] text-[#1E2124]">
              최근 본 논문
            </h1>
            {papers.length > 0 && (
              <button
                onClick={handleClear}
                className="text-[15px] text-[#8A949E] hover:text-[#464C53] transition-colors"
              >
                전체 삭제
              </button>
            )}
          </div>
          <div className="border-t-2 border-[#1E2124]" />
        </div>

        {/* 빈 상태 */}
        {papers.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-[17px] text-[#464C53]">최근 본 논문이 없습니다.</p>
          </div>
        )}

        {/* 목록 */}
        {papers.length > 0 && (
          <div className="bg-white rounded-xl divide-y divide-[#F0F2F5]">
            {papers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => navigate(`/papers/${paper.id}`)}
                className="flex flex-col gap-1 px-4 sm:px-8 py-4 sm:py-5 hover:bg-[#FAFAFC] transition-colors cursor-pointer"
              >
                <p className="text-[17px] font-semibold line-clamp-2">
                  {paper.title}
                </p>
                <div className="flex items-center flex-wrap gap-0 text-[15px] text-[#464C53] meta-breadcrumb">
                  {paper.authors.length > 0 && (
                    <span>
                      {paper.authors.slice(0, 3).join(', ')}
                      {paper.authors.length > 3 ? ' 외' : ''}
                    </span>
                  )}
                  {paper.venue && (
                    <>
                      {/* <span className="w-[1px] h-3 bg-[#B1B8BE]">
                      </span> */}
                      <span className='meta-value author-divider'>{paper.venue}</span>
                    </>
                  )}
                  {paper.published_at && (
                    <>
                      <span className='meta-value author-divider'>{new Date(paper.published_at).getFullYear()}</span>
                    </>
                  )}
                  <span className='meta-value author-divider'>{new Date(paper.viewedAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MypageLayout>
  );
}
