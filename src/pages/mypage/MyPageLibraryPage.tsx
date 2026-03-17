import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';
import { getPurchaseLibrary } from '../../api/purchase';

type LibraryItem = {
  id: number;
  publication_id: string;
  title: string;
  purchased_at: string;
  [key: string]: unknown;
};

export default function MyPageLibraryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
  }, [navigate]);

  useEffect(() => {
    fetchLibrary();
  }, [currentPage]);

  const fetchLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPurchaseLibrary({ page: currentPage, per_page: 20 });
      const json = res as unknown as { library: LibraryItem[]; pagination: { current_page: number; last_page: number } };
      setItems(json.library ?? []);
      setLastPage(json.pagination?.last_page ?? 1);
    } catch {
      setError('보관함을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="bg-white rounded-xl border border-[#D6E0EB] p-8">
        <h2 className="text-[22px] font-bold text-[#1E2124] mb-6">보관함</h2>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
        {error && <p className="text-center py-16 text-red-500">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-center py-16 text-[#9CA3AF]">보관함이 비어 있습니다.</p>
        )}
        {!loading && items.length > 0 && (
          <>
            <ul className="divide-y divide-[#F3F4F6]">
              {items.map(item => (
                <li
                  key={item.id}
                  className="py-4 cursor-pointer hover:bg-[#F8FAFC] rounded-lg px-3 transition"
                  onClick={() => navigate(`/papers?id=${item.publication_id}`)}
                >
                  <div className="text-[16px] font-semibold text-[#1E2124] mb-1">{item.title}</div>
                  <div className="text-[13px] text-[#9CA3AF]">
                    구매일 {new Date(item.purchased_at).toLocaleDateString('ko-KR')}
                  </div>
                </li>
              ))}
            </ul>

            {lastPage > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-[14px] border border-[#CDD1D5] rounded disabled:opacity-40 hover:bg-[#F4F5F6]"
                >
                  이전
                </button>
                {Array.from({ length: lastPage }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-[14px] rounded border transition
                      ${page === currentPage
                        ? 'bg-[#256EF4] text-white border-[#256EF4]'
                        : 'border-[#CDD1D5] hover:bg-[#F4F5F6]'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                  className="px-3 py-1 text-[14px] border border-[#CDD1D5] rounded disabled:opacity-40 hover:bg-[#F4F5F6]"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MypageLayout>
  );
}
