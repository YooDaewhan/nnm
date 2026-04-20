import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';
import { getScraps, deleteScrap, ScrapItem } from '../../api/scraps';
import { getPaperDetail } from '../../api/search';

const PER_PAGE = 10;

async function fetchScrapsWithTitles(page: number) {
  const res = await getScraps(page, PER_PAGE);
  const scrapsWithTitles = await Promise.all(
    res.data.map(async (scrap: ScrapItem) => {
      if (scrap.title) return scrap;
      try {
        const detail = await getPaperDetail(scrap.publication_id);
        return { ...scrap, title: detail.title };
      } catch {
        return scrap;
      }
    })
  );
  return { ...res, data: scrapsWithTitles };
}

export default function MyPageScrapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const handleLogout = async () => { await logout(); navigate('/login'); };

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); }
  }, [navigate]);

  const { data, isLoading, isFetching, error: fetchError } = useQuery({
    queryKey: ['scraps', currentPage],
    queryFn: () => fetchScrapsWithTitles(currentPage),
    enabled: isAuthenticated(),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const scraps = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const error = fetchError instanceof Error ? fetchError.message : fetchError ? '스크랩 목록을 불러오지 못했습니다.' : null;

  const deleteMutation = useMutation({
    mutationFn: (publicationId: string) => deleteScrap(publicationId),
    onSuccess: (_, publicationId) => {
      queryClient.setQueryData(['scraps', currentPage], (old: typeof data) =>
        old ? { ...old, data: old.data.filter((s) => s.publication_id !== publicationId) } : old
      );
    },
    onError: () => {
      alert('스크랩 삭제에 실패했습니다.');
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
              스크랩
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
            <p className="text-[17px] text-[#464C53]">스크랩한 논문이 없습니다.</p>
          </div>
        )}

        {/* 목록 */}
        {!isLoading && !error && scraps.length > 0 && (
          <div className="bg-white rounded-xl divide-y divide-[#F0F2F5]">
            {scraps.map((scrap) => (
              <div
                key={scrap.id}
                onClick={() => navigate(`/papers/${scrap.publication_id}`)}
                className="flex items-center gap-4 px-4 sm:px-8 py-4 sm:py-5 hover:bg-[#FAFAFC] transition-colors cursor-pointer"
              >
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <p className="text-[17px] font-bold leading-[1.5em] text-[#1E2124] line-clamp-2">
                    {scrap.title || scrap.publication_id}
                  </p>
                  {scrap.created_at && (
                    <span className="text-[15px] text-[#8A949E]">
                      {new Date(scrap.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(scrap.publication_id); }}
                  disabled={deleteMutation.isPending && deleteMutation.variables === scrap.publication_id}
                  className="shrink-0 text-[#8A949E] hover:text-[#D32F2F] transition-colors disabled:opacity-40"
                  title="스크랩 삭제"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 4.5H15M7.5 4.5V3H10.5V4.5M6 4.5V14.25C6 14.664 6.336 15 6.75 15H11.25C11.664 15 12 14.664 12 14.25V4.5H6Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {!isLoading && !error && lastPage > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-10 h-10 rounded-md text-[17px] font-medium transition-colors flex items-center justify-center
                ${currentPage === 1
                  ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                  : 'bg-transparent text-[#464C53] hover:bg-gray-100'}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-10 h-10 rounded-md text-[17px] font-medium transition-colors
                  ${page === currentPage
                    ? 'bg-[#063A74] text-white font-bold'
                    : 'bg-transparent text-[#464C53] hover:bg-gray-100'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === lastPage}
              className={`w-10 h-10 rounded-md text-[17px] font-medium transition-colors flex items-center justify-center
                ${currentPage === lastPage
                  ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                  : 'bg-transparent text-[#464C53] hover:bg-gray-100'}`}
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
