import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/auth';
import { searchOpensearchText, OpenSearchTextResultItem, searchAutocomplete, AutocompleteResultItem } from '@/api/search';
import { addToCart } from '@/api/cart';
import SearchFilterSidebar, { Filters } from '@/components/SearchFilterSidebar';

const IconSearch = () => (
  <svg className="w-5 h-5 md:w-8 md:h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14.67" cy="14.67" r="8" stroke="#1E2124" strokeWidth="2"/>
    <path d="M21.33 21.33L26.67 26.67" stroke="#1E2124" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

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
  const withinQuery = searchParams.get('within') || '';

  const [localSearchQuery, setLocalSearchQuery] = useState(query);
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResultItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalSearchQuery(query); }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) { setAutocompleteResults([]); setShowAutocomplete(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchAutocomplete({ query: value.trim(), limit: 8 });
        setAutocompleteResults(results);
        setShowAutocomplete(results.length > 0);
      } catch {
        setAutocompleteResults([]);
        setShowAutocomplete(false);
      }
    }, 250);
  };

  const handleSearch = () => {
    if (localSearchQuery.trim()) {
      setShowAutocomplete(false);
      setSearchParams({ q: localSearchQuery.trim(), page: '1' });
    }
  };

  const handleAutocompleteSelect = (text: string) => {
    setShowAutocomplete(false);
    setLocalSearchQuery(text);
    setSearchParams({ q: text, page: '1' });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  // 검색 쿼리 (TanStack Query)
  const { data, isLoading: searchLoading, error: searchErr } = useQuery({
    queryKey: ['search', query, currentPage, appliedFilters, withinQuery],
    queryFn: () => {
      const yearGte = appliedFilters.yearFrom ? parseInt(appliedFilters.yearFrom) : undefined;
      const yearLte = appliedFilters.yearTo ? parseInt(appliedFilters.yearTo) : undefined;
      return searchOpensearchText({
        query: query.trim(),
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

  const searchResults = data?.results ?? [];
  const totalResults = data?.total ?? 0;
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
    console.log('[SearchPage] params:', { query, currentPage, appliedFilters, withinQuery });
  }, [query, currentPage, appliedFilters, withinQuery]);

  useEffect(() => {
    console.log('[SearchPage] loading:', searchLoading);
  }, [searchLoading]);

  useEffect(() => {
    if (data) {
      console.log('[SearchPage] raw data:', JSON.parse(JSON.stringify(data)));
      console.log('[SearchPage] results:', data.results);
      console.log('[SearchPage] total:', data.total);
      console.log('[SearchPage] providers:', data.providers);
    }
    if (searchErr) console.error('[SearchPage] error:', searchErr);
  }, [data, searchErr]);


  // 장바구니 뮤테이션
  const cartMutation = useMutation({
    mutationFn: async (resultId: string) => {
      await addToCart({ publication_id: resultId });
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
      const result = searchResults.find((r) => r.id === resultId);
      sessionStorage.setItem(
        'directBuyItem',
        JSON.stringify({
          publication_id: resultId,
          title: result?.title ?? '',
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
    setSearchParams({ q: query, page: '1', ...(wq ? { within: wq } : {}) });
  };

  const renderPageButtons = () => {
    const maxButtons = typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : 8;
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
        {/* 검색바 */}
        <div ref={autocompleteRef} className="relative w-full mb-6">
          <div className="flex items-center gap-2 md:gap-4 h-10 md:h-14 border border-[#58616A] rounded-[10px] px-3 md:px-6 w-full overflow-hidden">
            <input
              type="text"
              value={localSearchQuery}
              onChange={handleInputChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="검색어를 입력하세요"
              className="flex-1 bg-transparent outline-none border-none text-[19px] font-bold leading-[1.5] text-[#1E2124] placeholder-[#8A949E]"
            />
            <button
              onClick={handleSearch}
              className="flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
              aria-label="검색"
            >
              <IconSearch />
            </button>
          </div>
          {showAutocomplete && autocompleteResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#CDD1D5] rounded-xl shadow-lg mt-1 overflow-hidden">
              {autocompleteResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAutocompleteSelect(item.text)}
                  className="w-full text-left px-6 py-3 text-[15px] text-[#1E2124] hover:bg-[#F4F5F6] transition-colors border-b border-[#F4F5F6] last:border-0"
                >
                  {item.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 검색 결과 요약 */}
        {query && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-wrap gap-y-1">
              <span className="text-[15px] md:text-[19px] font-bold text-[#1E2124]">
                적용된 검색어{' '}
                <span className="text-[#256EF4]">
                  &apos;{truncateQuery(query)}&apos;
                </span>
              </span>
              {withinQuery && (
                <>
                  <div className="w-px h-5 bg-[#CDD1D5]"></div>
                  <span className="text-[15px] md:text-[19px] font-bold text-[#1E2124]">
                    결과 내 검색{' '}
                    <span className="text-[#256EF4]">
                      &apos;{truncateQuery(withinQuery)}&apos;
                    </span>
                  </span>
                </>
              )}
              <div className="w-px h-5 bg-[#CDD1D5]"></div>
              <span className="text-[15px] md:text-[19px] font-bold text-[#1E2124]">
                검색 결과 {totalResults.toLocaleString()}개
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start">
          <div className="hidden md:block md:sticky top-24 md:self-start">
          <SearchFilterSidebar
            onApply={(filters, wq) => {
              setAppliedFilters(filters);
              setSearchParams({ q: query, page: '1', ...(wq.trim() ? { within: wq.trim() } : {}) });
            }}
            onReset={() => {
              setAppliedFilters({});
              setSearchParams({ q: query, page: '1' });
            }}
            onWithinSearch={(wq) => handleWithinSearch(wq)}
            providers={data?.providers}
          />
          </div>

          {/* 결과 목록 */}
          <div className="flex-1 min-w-0 w-full overflow-hidden">
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
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    cartLoading={cartMutation.isPending && cartMutation.variables === result.id}
                    buyLoading={buyNowMutation.isPending && buyNowMutation.variables === result.id}
                  />
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
                  <span className="hidden md:inline">이전</span>
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
                  <span className="hidden md:inline">다음</span>
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

function SearchResultCard({
  result,
  onAddToCart,
  onBuyNow,
  cartLoading,
  buyLoading,
}: {
  result: OpenSearchTextResultItem;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onBuyNow: (e: React.MouseEvent, id: string) => void;
  cartLoading: boolean;
  buyLoading: boolean;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const paperUrl = (() => {
    const provider = (result.metadata.provider_name as string | null)?.trim();
    const venue = (result.metadata.venue_name as string | null)?.trim();
    const journal = (result.metadata.journal as string | null)?.trim();
    if (provider && venue && journal) {
      return `/papers/${encodeURIComponent(provider)}/${encodeURIComponent(venue)}/${encodeURIComponent(journal)}?id=${result.id}`;
    }
    return `/papers?id=${result.id}`;
  })();

  return (
    <div
      onClick={() => navigate(paperUrl)}
      className="bg-white border border-[#CDD1D5] rounded-xl p-4 md:p-8 cursor-pointer hover:shadow-md transition-shadow"
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
        <button
          onClick={(e) => onAddToCart(e, result.id)}
          disabled={cartLoading}
          className="text-[#33363D] hover:text-[#1E2124] transition-colors disabled:opacity-50"
          title="장바구니 담기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3.5 6.5H16.5L15 15H5L3.5 6.5Z" stroke="#33363D" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M7.5 6.5C7.5 4.6 8.7 3 10 3C11.3 3 12.5 4.6 12.5 6.5" stroke="#33363D" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* row-2: 본문 + 버튼 */}
      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <h4 className="text-[19px] font-bold text-[#1E2124] leading-[1.5em]">
            {result.title || '제목 없음'}
          </h4>
          {result.abstract && (
            <>
              {expanded && (
                <p className="text-[15px] text-[#464C53] leading-[1.5em]">{result.abstract}</p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                className="text-[14px] text-[#256EF4] hover:underline self-start"
              >
                {expanded ? '접기' : '초록보기'}
              </button>
            </>
          )}
          <PublicationMeta metadata={result.metadata} />
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
        <div className="flex flex-row md:flex-col items-stretch gap-2 w-full md:w-[100px] md:self-stretch">
          <button
            onClick={(e) => onBuyNow(e, result.id)}
            disabled={buyLoading}
            className="flex-1 h-10 flex items-center justify-center bg-white text-[#AB2B36] text-[15px] font-bold rounded-md border border-[#CDD1D5] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ￦ 5,000
          </button>
          <button
            onClick={(e) => onBuyNow(e, result.id)}
            disabled={buyLoading}
            className="flex-1 h-10 flex items-center justify-center bg-[#ECF2FE] text-[#0B50D0] text-[15px] font-normal rounded-md border border-[#256EF4] hover:bg-[#dce7fd] transition-colors disabled:opacity-50"
          >
            {buyLoading ? '처리 중...' : '구매하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicationMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const providerName = metadata.provider_name as string | null;
  const venueName = metadata.venue_name as string | null;
  const journal = metadata.journal as string | null;
  const volume = metadata.volume as string | null | number;
  const issue = metadata.issue_number as string | null;
  const volumeIssue = volume || issue
    ? [volume ? `${volume}권` : '', issue ? `(${issue}호)` : ''].filter(Boolean).join(' ')
    : null;
  const segments = [providerName, venueName, journal, volumeIssue].filter(Boolean) as string[];
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
}

export default function OpenSearchTextPage() {
  return <OpenSearchTextContent />;
}
