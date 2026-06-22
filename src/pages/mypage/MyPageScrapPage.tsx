import { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';
import { getScraps, deleteScrapBatch } from '../../api/scraps';

const PER_PAGE = 10;

export default function MyPageScrapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const handleLogout = async () => { await logout(); navigate('/login'); };

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login', { state: { from: location.pathname } }); }
  }, [navigate, location.pathname]);

  const { data, isLoading, isFetching, error: fetchError } = useQuery({
    queryKey: ['scraps', currentPage],
    queryFn: () => getScraps(currentPage, PER_PAGE),
    enabled: isAuthenticated(),
    placeholderData: keepPreviousData,
  });

  const scraps = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const error = fetchError instanceof Error ? fetchError.message : fetchError ? '보관함 목록을 불러오지 못했습니다.' : null;

  const deleteMutation = useMutation({
    mutationFn: (publicationId: string) => deleteScrapBatch([publicationId]),
    onSuccess: (_, publicationId) => {
      queryClient.setQueryData(['scraps', currentPage], (old: typeof data) =>
        old ? { ...old, data: old.data.filter((s) => s.publication_id !== publicationId) } : old
      );
    },
    onError: () => {
      alert('보관함 삭제에 실패했습니다.');
    },
  });

  const goToPage = (page: number) => {
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="flex flex-col gap-4">
        {/* 헤더 카드 */}
        <div className="bg-white rounded-xl p-4 sm:p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-[32px] font-bold leading-[1.5em] tracking-[0.03em] text-[#1E2124]">
              보관함
            </h1>
          </div>
          <div className="border-t-2 border-[#1E2124]" />
        </div>

        {/* 로딩 (최초 로드만 전체 스피너, 페이지 전환은 상단 바로 표시) */}
        {isFetching && !isLoading && (
          <div className="h-0.5 bg-[#256EF4] rounded-full animate-pulse" />
        )}
        {isLoading && (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-[17px] text-[#464C53]">불러오는 중...</p>
          </div>
        )}

        {/* 에러 */}
        {!isLoading && error && (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-[17px] text-[#D32F2F]">{error}</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && !error && scraps.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-[17px] text-[#464C53]">보관함한 논문이 없습니다.</p>
          </div>
        )}

        {/* 목록 */}
        {!isLoading && !error && scraps.length > 0 && (
          <div className="bg-white rounded-xl divide-y divide-[#F0F2F5]">
            {scraps.map((scrap) => (
              <div
                key={scrap.id}
                onClick={() => navigate(`/papers/${scrap.publication_id}`)}
                className="flex items-center gap-20 px-4 sm:px-8 py-4 sm:py-5 hover:bg-[#FAFAFC] transition-colors cursor-pointer"
              >
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <p className="text-[17px] font-semibold line-clamp-2">
                    {scrap.title ?? scrap.publication_id}
                  </p>
                  {scrap.created_at && (
                    <span className="text-[13px] text-[#8A949E]">
                      {new Date(scrap.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(scrap.publication_id); }}
                  disabled={deleteMutation.isPending && deleteMutation.variables === scrap.publication_id}
                  className="shrink-0 text-[#8A949E] hover:text-[#131416] transition-colors disabled:opacity-50"
                  title="삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>

                </button>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {!isLoading && !error && lastPage > 1 && (
          <div className="flex items-center justify-center gap-1">
            {/* 이전 */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors
                ${currentPage === 1 ? 'text-[#8A949E] cursor-not-allowed' : 'text-[#464C53] hover:bg-gray-100'}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* 첫 페이지 + ... */}
            {currentPage > 4 && (
              <>
                <button onClick={() => goToPage(1)} className="w-10 h-10 rounded-md text-[15px] text-[#464C53] hover:bg-gray-100 transition-colors">1</button>
                {currentPage > 5 && <span className="w-10 h-10 flex items-center justify-center text-[#8A949E] text-[15px]">…</span>}
              </>
            )}

            {/* 윈도우 페이지 버튼 (현재 ±2) */}
            {Array.from({ length: lastPage }, (_, i) => i + 1)
              .filter(p => p >= currentPage - 2 && p <= currentPage + 2)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-md text-[15px] font-medium transition-colors
                    ${page === currentPage
                      ? 'bg-[#063A74] text-white font-bold'
                      : 'text-[#464C53] hover:bg-gray-100'}`}
                >
                  {page}
                </button>
              ))}

            {/* ... + 마지막 페이지 */}
            {currentPage < lastPage - 3 && (
              <>
                {currentPage < lastPage - 4 && <span className="w-10 h-10 flex items-center justify-center text-[#8A949E] text-[15px]">…</span>}
                <button onClick={() => goToPage(lastPage)} className="w-10 h-10 rounded-md text-[15px] text-[#464C53] hover:bg-gray-100 transition-colors">{lastPage}</button>
              </>
            )}

            {/* 다음 */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === lastPage}
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors
                ${currentPage === lastPage ? 'text-[#8A949E] cursor-not-allowed' : 'text-[#464C53] hover:bg-gray-100'}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </MypageLayout>
  );
}
