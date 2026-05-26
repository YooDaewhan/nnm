import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticated } from '../lib/auth';
import { getPurchaseLibrary, type PurchaseLibraryItem } from '../api/purchase';

export default function LibraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login', { state: { from: location.pathname } });
  }, [navigate, location.pathname]);

  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ['library', currentPage],
    queryFn: async () => {
      const res = await getPurchaseLibrary({ page: currentPage, per_page: 20 });
      return res as unknown as {
        library: PurchaseLibraryItem[];
        pagination: { current_page: number; last_page: number };
      };
    },
    enabled: isAuthenticated(),
  });

  const items = data?.library ?? [];
  const totalPages = data?.pagination?.last_page ?? 1;
  const error = fetchError instanceof Error ? fetchError.message : fetchError ? '구매 목록을 불러오는데 실패했습니다.' : null;

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">구매목록</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">구매한 논문이 없습니다.</p>
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                논문 검색하기
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/papers?id=${item.publication_id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.title}</p>
                      {item.purchased_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          구매일: {new Date(item.purchased_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <span className="ml-4 px-2 py-1 text-xs font-medium rounded text-green-600 bg-green-50">
                      구매완료
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  currentPage === page
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
