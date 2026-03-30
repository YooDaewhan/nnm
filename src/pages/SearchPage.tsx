import { Suspense, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/auth';
import { osSearchText, osGetPaperById } from '@/api/opensearch-direct';
import {
  OpenSearchTextResultItem,
} from '@/api/search';
import { addToCart } from '@/api/cart';
import SearchFilterSidebar, { Filters } from '@/components/SearchFilterSidebar';

const ITEMS_PER_PAGE = 10;
const MAX_QUERY_DISPLAY = 25;

function truncateQuery(query: string) {
  return query.length > MAX_QUERY_DISPLAY ? query.slice(0, MAX_QUERY_DISPLAY) + '...' : query;
}


function OpenSearchTextContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const isLoggedIn = isAuthenticated();

  const [appliedFilters, setAppliedFilters] = useState<Partial<Filters>>({});
  const [withinQuery, setWithinQuery] = useState<string>('');

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 검색 쿼리 (TanStack Query)
  const { data, isLoading: searchLoading, error: searchErr } = useQuery({
    queryKey: ['search', query, currentPage, appliedFilters, withinQuery],
    queryFn: () => {
      const yearGte = appliedFilters.yearFrom ? parseInt(appliedFilters.yearFrom) : undefined;
      const yearLte = appliedFilters.yearTo ? parseInt(appliedFilters.yearTo) : undefined;
      return osSearchText({
        query: query.trim(),
        within_query: withinQuery.trim() || undefined,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        sort: appliedFilters.sort,
        provider_name: appliedFilters.providerName || undefined,
        venue_name: appliedFilters.venueName || undefined,
        filters: yearGte || yearLte ? { year: { gte: yearGte, lte: yearLte } } : undefined,
      });
    },
    enabled: !!query.trim(),
  });

  const searchResults = (data?.results as unknown as OpenSearchTextResultItem[]) ?? [];
  const totalResults = data?.total ?? data?.count ?? 0;
  const searchError =
    searchErr instanceof Error
      ? searchErr.message
      : searchErr
        ? '검색 중 오류가 발생했습니다.'
        : null;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  useEffect(() => {
    if (data) console.log('[SearchPage] results:', { total: totalResults, count: searchResults.length, first: searchResults[0] });
    if (searchErr) console.error('[SearchPage] error:', searchErr);
  }, [data, searchErr]);


  // 장바구니 뮤테이션
  const cartMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const paper = await osGetPaperById(resultId);
      await addToCart({ publication_id: paper.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('장바구니에 추가되었습니다.');
    },
    onError: (err) =>
      alert(err instanceof Error ? err.message : '장바구니 추가에 실패했습니다.'),
  });

  // 바로구매 뮤테이션
  const buyNowMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const paper = await osGetPaperById(resultId);
      sessionStorage.setItem(
        'directBuyItem',
        JSON.stringify({
          publication_id: paper.id,
          title: paper.title,
          unit_price: 5000,
          quantity: 1,
        }),
      );
    },
    onSuccess: () => navigate('/pay?direct=true'),
    onError: (err) =>
      alert(err instanceof Error ? err.message : '구매하기에 실패했습니다.'),
  });

  const handleAddToCart = (e: React.MouseEvent, resultId: string) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    cartMutation.mutate(resultId);
  };

  const handleBuyNow = (e: React.MouseEvent, resultId: string) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    buyNowMutation.mutate(resultId);
  };

  const goToPage = (page: number) => {
    setSearchParams({ q: query, page: String(page) });
  };

  const handleWithinSearch = (wq: string) => {
    setWithinQuery(wq);
    setSearchParams({ q: query, page: '1' });
  };

  const renderPageButtons = () => {
    const maxButtons = 8;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(
      (page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`w-10 h-10 rounded-md text-[17px] font-medium transition-colors ${
            page === currentPage
              ? 'bg-[#063A74] text-white font-bold'
              : 'bg-transparent text-[#464C53] hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <main className="max-w-[1280px] mx-auto px-4 py-10">
        {/* 검색 결과 요약 */}
        {query && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-[19px] font-bold text-[#1E2124]">
                적용된 검색어{' '}
                <span className="text-[#256EF4]">
                  &apos;{truncateQuery(query)}&apos;
                </span>
              </span>
              {withinQuery && (
                <>
                  <div className="w-px h-5 bg-[#CDD1D5]"></div>
                  <span className="text-[19px] font-bold text-[#1E2124]">
                    결과 내 검색{' '}
                    <span className="text-[#256EF4]">
                      &apos;{truncateQuery(withinQuery)}&apos;
                    </span>
                  </span>
                </>
              )}
              <div className="w-px h-5 bg-[#CDD1D5]"></div>
              <span className="text-[19px] font-bold text-[#1E2124]">
                검색 결과 {totalResults.toLocaleString()}개
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start">
          <div className="sticky top-24 self-start">
          <SearchFilterSidebar
            onApply={(filters, wq) => {
              setAppliedFilters(filters);
              setWithinQuery(wq.trim());
              setSearchParams({ q: query, page: '1' });
            }}
            onReset={() => {
              setAppliedFilters({});
              setWithinQuery('');
              setSearchParams({ q: query, page: '1' });
            }}
            onWithinSearch={(wq) => handleWithinSearch(wq)}
          />
          </div>

          {/* 결과 목록 */}
          <div className="flex-1">
            {!query && (
              <p className="text-gray-500 text-center py-8">검색어를 입력해주세요.</p>
            )}

            {searchLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {searchError}
              </div>
            )}

            {!searchLoading && !searchError && query && searchResults.length === 0 && (
              <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
            )}

            {!searchLoading && !searchError && searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => navigate(`/papers?id=${result.id}`)}
                    className="bg-white border border-[#CDD1D5] rounded-xl p-8 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {/* row-1: 배지 + 아이콘 버튼 */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center justify-center h-6 px-2 bg-[#ECF2FE] text-[#0B50D0] text-[15px] font-normal rounded leading-none">
                          학술저널
                        </span>
                        <span className="inline-flex items-center justify-center h-6 px-2 bg-[#EAF6EC] text-[#267337] text-[15px] font-normal rounded leading-none">
                          KCI등재
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <button
                          onClick={(e) => handleAddToCart(e, result.id)}
                          disabled={cartMutation.isPending && cartMutation.variables === result.id}
                          className="text-[#33363D] hover:text-[#1E2124] transition-colors disabled:opacity-50"
                          title="장바구니 담기"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3.5 6.5H16.5L15 15H5L3.5 6.5Z" stroke="#33363D" strokeWidth="1.4" strokeLinejoin="round" />
                            <path d="M7.5 6.5C7.5 4.6 8.7 3 10 3C11.3 3 12.5 4.6 12.5 6.5" stroke="#33363D" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* row-2: 본문 + 버튼 */}
                    <div className="flex items-start gap-6">
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <h4 className="text-[19px] font-bold text-[#1E2124] leading-[1.5em]">
                          {result.title || '제목 없음'}
                        </h4>
                        {result.abstract && (
                          <>
                            {expandedIds.has(result.id) && (
                              <p className="text-[15px] text-[#464C53] leading-[1.5em]">
                                {result.abstract}
                              </p>
                            )}
                            <button
                              onClick={(e) => toggleExpand(e, result.id)}
                              className="text-[14px] text-[#256EF4] hover:underline self-start"
                            >
                              {expandedIds.has(result.id) ? '접기' : '초록보기'}
                            </button>
                          </>
                        )}
                        {/* 발행기관 > 저널명 > 권(호) > 페이지 */}
                        {(() => {
                          const publisher = result.metadata.publisher as string | null;
                          const journal = result.metadata.journal as string | null;
                          const volume = result.metadata.volume as string | null;
                          const issue = result.metadata.issue as string | null;
                          const pageStart = result.metadata.page_start as string | null;
                          const pageEnd = result.metadata.page_end as string | null;
                          const volumeIssue = volume || issue
                            ? [volume ? `${volume}권` : '', issue ? `(${issue}호)` : ''].filter(Boolean).join('')
                            : null;
                          const pages = pageStart ? `pp.${pageStart}${pageEnd ? `-${pageEnd}` : ''}` : null;
                          const segments = [publisher, journal, volumeIssue, pages].filter(Boolean) as string[];
                          if (segments.length === 0) return null;
                          return (
                            <div className="flex items-center gap-1 flex-wrap text-[14px] text-[#6B7280]">
                              {segments.map((seg, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  {seg}
                                  {i < segments.length - 1 && <span className="text-[#CDD1D5]">›</span>}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                        <div className="flex items-center gap-0.5 flex-wrap">
                          {result.authors && result.authors.length > 0 && (
                            <div className="flex items-center gap-0.5">
                              {result.authors.slice(0, 3).map((author: string, idx: number) => (
                                <span
                                  key={idx}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none"
                                >
                                  {author}
                                </span>
                              ))}
                              {result.authors.length > 3 && (
                                <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                                  외 {result.authors.length - 3}명
                                </span>
                              )}
                            </div>
                          )}
                          {result.year != null && (
                            <>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <line x1="8" y1="3" x2="8" y2="13" stroke="#CDD1D5" strokeWidth="1.07" strokeLinecap="round" />
                              </svg>
                              <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                                {result.year}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 우측 버튼 */}
                      <div className="flex flex-col items-stretch justify-end gap-2 flex-shrink-0 w-[100px] self-stretch">
                        <button
                          onClick={(e) => handleBuyNow(e, result.id)}
                          disabled={buyNowMutation.isPending && buyNowMutation.variables === result.id}
                          className="h-10 flex items-center justify-center bg-white text-[#AB2B36] text-[15px] font-bold rounded-md border border-[#CDD1D5] hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          ￦ 5,000
                        </button>
                        <button
                          onClick={(e) => handleBuyNow(e, result.id)}
                          disabled={buyNowMutation.isPending && buyNowMutation.variables === result.id}
                          className="h-10 flex items-center justify-center bg-[#ECF2FE] text-[#0B50D0] text-[15px] font-normal rounded-md border border-[#256EF4] hover:bg-[#dce7fd] transition-colors disabled:opacity-50"
                        >
                          {buyNowMutation.isPending && buyNowMutation.variables === result.id
                            ? '처리 중...'
                            : '구매하기'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {!searchLoading && !searchError && totalResults > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pt-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`h-10 px-3 flex items-center gap-1 rounded-md text-[17px] font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                      : 'bg-transparent text-[#464C53] hover:bg-gray-100'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  이전
                </button>

                {renderPageButtons()}

                {totalPages > 8 && currentPage < totalPages - 4 && (
                  <>
                    <div className="w-10 h-10 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="6" cy="12" r="1.4" fill="#33363D" />
                        <circle cx="12" cy="12" r="1.4" fill="#33363D" />
                        <circle cx="18" cy="12" r="1.4" fill="#33363D" />
                      </svg>
                    </div>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="w-10 h-10 rounded-md text-[17px] font-medium text-[#464C53] hover:bg-gray-100"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`h-10 px-3 flex items-center gap-1 rounded-md text-[17px] font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                      : 'bg-transparent text-[#464C53] hover:bg-gray-100'
                  }`}
                >
                  다음
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OpenSearchTextPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <OpenSearchTextContent />
    </Suspense>
  );
}
