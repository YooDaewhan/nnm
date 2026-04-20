import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/auth';
import { OpenSearchTextResultItem, searchOpensearchDetailed, DetailedSearchCondition } from '@/api/search';
import { addToCart, addToCartBatch } from '@/api/cart';
import { addScrap, addScrapBatch, checkScrap, checkScrapBatch, deleteScrap } from '@/api/scraps';
import SearchFilterSidebar, { Filters } from '@/components/SearchFilterSidebar';

const IconSearch = () => (
  <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14.67" cy="14.67" r="8" stroke="#1E2124" strokeWidth="2"/>
    <path d="M21.33 21.33L26.67 26.67" stroke="#1E2124" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function highlightText(text: string, terms: string[]): React.ReactNode {
  const words = terms.flatMap(t => t.trim().split(/\s+/)).filter(Boolean);
  if (words.length === 0) return text;
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="text-[#E32929] font-bold">{part}</span>
      : part
  );
}


function OpenSearchTextContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const isLoggedIn = isAuthenticated();

  const [appliedFilters, setAppliedFilters] = useState<Partial<Filters>>({});
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [conditions, setConditions] = useState<DetailedSearchCondition[]>(() => {
    try {
      const saved = sessionStorage.getItem('search_conditions');
      return saved ? JSON.parse(saved) : [{ field: 'title', keyword: '', operator: 'AND' }];
    } catch { return [{ field: 'title', keyword: '', operator: 'AND' }]; }
  });
  const [submittedState, setSubmittedState] = useState<{
    conditions: DetailedSearchCondition[];
    sort: 'relevance' | 'latest';
    filters: { year_from?: number; year_to?: number };
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem('search_submitted');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [detailedSort, setDetailedSort] = useState<'relevance' | 'latest'>(() => {
    try {
      const saved = sessionStorage.getItem('search_submitted');
      if (saved) return JSON.parse(saved).sort ?? 'relevance';
    } catch {}
    return 'relevance';
  });

  // 홈 검색창에서 넘어올 때 URL의 q 파라미터로 자동 검색
  const qParam = searchParams.get('q');
  useEffect(() => {
    if (!qParam) return;
    const newConditions: DetailedSearchCondition[] = [{ field: 'title', keyword: qParam, operator: 'AND' }];
    setConditions(newConditions);
    setSubmittedState({
      conditions: newConditions,
      sort: 'relevance',
      filters: {},
    });
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.set('page', '1');
      return next;
    }, { replace: true });
  }, [qParam]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    sessionStorage.setItem('search_conditions', JSON.stringify(conditions));
  }, [conditions]);

  useEffect(() => {
    if (submittedState) sessionStorage.setItem('search_submitted', JSON.stringify(submittedState));
    else sessionStorage.removeItem('search_submitted');
  }, [submittedState]);

  // 상세검색 쿼리
  const { data, isLoading, error } = useQuery({
    queryKey: ['detailed-search', submittedState, currentPage, itemsPerPage],
    queryFn: () => searchOpensearchDetailed({
      conditions: submittedState!.conditions,
      page: currentPage,
      size: itemsPerPage,
      sort: submittedState!.sort,
      filters: (submittedState!.filters.year_from || submittedState!.filters.year_to)
        ? submittedState!.filters
        : undefined,
    }),
    enabled: submittedState !== null,
  });

  const handleDetailedSearch = () => {
    const valid = conditions.filter(c => c.keyword.trim());
    if (valid.length === 0) return;
    const yearFrom = appliedFilters.yearFrom ? parseInt(appliedFilters.yearFrom) : undefined;
    const yearTo = appliedFilters.yearTo ? parseInt(appliedFilters.yearTo) : undefined;
    setSubmittedState({
      conditions: valid,
      sort: detailedSort,
      filters: { ...(yearFrom && { year_from: yearFrom }), ...(yearTo && { year_to: yearTo }) },
    });
    setSearchParams({ page: '1' });
  };

  const addCondition = () => {
    if (conditions.length >= 10) return;
    setConditions(prev => [...prev, { field: 'title', keyword: '', operator: 'AND' }]);
  };

  const removeCondition = (idx: number) => {
    setConditions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, patch: Partial<DetailedSearchCondition>) => {
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  const searchResults = data?.results ?? [];
  const totalResults = data?.total ?? data?.count ?? 0;
  const searchError = error instanceof Error ? error.message : error ? '검색 중 오류가 발생했습니다.' : null;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setSearchParams(prev => { prev.set('page', '1'); return prev; });
  };

  // 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCartLoading, setBulkCartLoading] = useState(false);
  const [bulkScrapLoading, setBulkScrapLoading] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  // 검색 결과 로드 시 스크랩 상태 일괄 확인 → 개별 카드의 checkScrap 쿼리가 캐시를 즉시 사용
  useEffect(() => {
    if (!isLoggedIn || !data?.results?.length) return;
    const ids = data.results.map(r => r.id);
    checkScrapBatch(ids).then(scrappedSet => {
      ids.forEach(id => {
        queryClient.setQueryData(['scrap-check', id], scrappedSet.has(id));
      });
    });
  }, [data, isLoggedIn, queryClient]);

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === searchResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(searchResults.map(r => r.id)));
    }
  };

  const handleBulkCart = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setBulkCartLoading(true);
    const ids = [...selectedIds];
    try {
      await addToCartBatch(ids);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert(`${ids.length}개를 장바구니에 추가했습니다.`);
    } catch {
      const results = await Promise.allSettled(ids.map(id => addToCart({ publication_id: id })));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = ids.length - failed;
      alert(failed === 0 ? `${succeeded}개를 장바구니에 추가했습니다.` : `${succeeded}개 추가, ${failed}개 실패했습니다.`);
    } finally {
      setBulkCartLoading(false);
    }
  };

  const handleBulkShare = async () => {
    const urls = searchResults
      .filter(r => selectedIds.has(r.id))
      .map(r => {
        const provider = (r.metadata.provider_name as string | null)?.trim();
        const venue = (r.metadata.venue_name as string | null)?.trim();
        const journal = (r.metadata.journal as string | null)?.trim();
        const path = provider && venue && journal
          ? `/papers/${encodeURIComponent(provider)}/${encodeURIComponent(venue)}/${encodeURIComponent(journal)}/${r.id}`
          : `/papers/${r.id}`;
        return window.location.origin + path;
      })
      .join('\n');
    try {
      await navigator.clipboard.writeText(urls);
    } catch (e) {
      console.error('복사 실패', e);
    }
  };

  const handleBulkScrap = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setBulkScrapLoading(true);
    const ids = [...selectedIds];
    try {
      await addScrapBatch(ids);
      ids.forEach(id => queryClient.setQueryData(['scrap-check', id], true));
      alert(`${ids.length}개를 스크랩에 추가했습니다.`);
    } catch {
      // batch 실패(일부 ID 유효성 오류 등) → 개별 요청으로 폴백
      const results = await Promise.allSettled(ids.map(id => addScrap({ publication_id: id })));
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') queryClient.setQueryData(['scrap-check', ids[i]], true);
      });
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = ids.length - succeeded;
      alert(failed === 0
        ? `${succeeded}개를 스크랩에 추가했습니다.`
        : `${succeeded}개 추가, ${failed}개는 추가할 수 없습니다.`);
    } finally {
      setBulkScrapLoading(false);
    }
  };

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
    if (!isLoggedIn) { navigate('/login'); return; }
    cartMutation.mutate(resultId);
  };

  const handleBuyNow = (e: React.MouseEvent, resultId: string) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login'); return; }
    buyNowMutation.mutate(resultId);
  };

  const goToPage = (page: number) => {
    setSearchParams({ page: String(page) });
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

  const highlightTerms = submittedState?.conditions.map(c => c.keyword).filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <main className="max-w-[1280px] mx-auto px-4 py-10">
        {/* 상세검색 조건 빌더 */}
        <div className="mb-6 space-y-2">
          {conditions.map((cond, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              {idx === 0 ? (
                <div className="w-[72px] shrink-0" />
              ) : (
                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(idx, { operator: e.target.value as DetailedSearchCondition['operator'] })}
                  className="w-[72px] h-10 px-2 border border-[#58616A] rounded-md text-[14px] text-[#1E2124] bg-white focus:outline-none focus:border-[#256EF4] shrink-0"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                  <option value="NOT">NOT</option>
                </select>
              )}
              <select
                value={cond.field}
                onChange={(e) => updateCondition(idx, { field: e.target.value as DetailedSearchCondition['field'] })}
                className="w-24 h-10 px-2 border border-[#58616A] rounded-md text-[14px] text-[#1E2124] bg-white focus:outline-none focus:border-[#256EF4] shrink-0"
              >
                <option value="title">제목</option>
                <option value="author">저자</option>
                <option value="abstract">초록</option>
                <option value="keyword">키워드</option>
                <option value="doi">DOI</option>
                <option value="full_text">전문</option>
              </select>
              <input
                type="text"
                value={cond.keyword}
                onChange={(e) => updateCondition(idx, { keyword: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleDetailedSearch(); }}
                placeholder="검색어를 입력하세요"
                className="flex-1 h-10 px-4 border border-[#58616A] rounded-md text-[15px] text-[#1E2124] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
              />
              {idx > 0 ? (
                <button
                  onClick={() => removeCondition(idx)}
                  className="w-10 h-10 flex items-center justify-center text-[#8A949E] hover:text-[#E32929] transition-colors shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              ) : (
                <div className="w-10 shrink-0" />
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            {conditions.length < 10 && (
              <button
                onClick={addCondition}
                className="h-9 px-4 text-[14px] text-[#256EF4] border border-[#256EF4] rounded-md hover:bg-[#ECF2FE] transition-colors"
              >
                + 조건 추가
              </button>
            )}
            <button
              onClick={handleDetailedSearch}
              className="h-9 px-5 bg-[#063A74] text-white text-[14px] font-medium rounded-md hover:bg-[#052d5c] transition-colors flex items-center gap-2"
            >
              <IconSearch />
              검색
            </button>
          </div>
        </div>

        {/* 검색 결과 요약 */}
        {submittedState !== null && (
          <div className="flex items-center mb-4">
            <span className="text-[15px] md:text-[19px] font-bold text-[#1E2124]">
              검색 결과 {totalResults.toLocaleString()}개
            </span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-auto md:sticky top-24 md:self-start">
            <SearchFilterSidebar
              onApply={(filters) => {
                setAppliedFilters(filters);
                const newSort = filters.sort === 'popularity' ? 'relevance' : filters.sort as 'relevance' | 'latest';
                setDetailedSort(newSort);
                if (submittedState) {
                  const yearFrom = filters.yearFrom ? parseInt(filters.yearFrom) : undefined;
                  const yearTo = filters.yearTo ? parseInt(filters.yearTo) : undefined;
                  setSubmittedState(prev => prev ? {
                    ...prev,
                    sort: newSort,
                    filters: { ...(yearFrom && { year_from: yearFrom }), ...(yearTo && { year_to: yearTo }) },
                  } : prev);
                  setSearchParams({ page: '1' });
                }
              }}
              onReset={() => {
                setAppliedFilters({});
                setDetailedSort('relevance');
              }}
              onWithinSearch={() => {}}
            />
          </div>

          {/* 결과 목록 */}
          <div className="flex-1 min-w-0 w-full overflow-hidden">
            {/* 정렬 + 개수 컨트롤 */}
            {submittedState !== null && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {(['relevance', 'latest'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setDetailedSort(s);
                        if (submittedState) {
                          setSubmittedState(prev => prev ? { ...prev, sort: s } : prev);
                          setSearchParams(prev => { prev.set('page', '1'); return prev; });
                        }
                      }}
                      className={`h-8 px-4 rounded-md text-[14px] font-medium transition-colors border ${
                        detailedSort === s
                          ? 'bg-[#063A74] text-white border-[#063A74]'
                          : 'bg-white text-[#464C53] border-[#CDD1D5] hover:bg-gray-50'
                      }`}
                    >
                      {s === 'relevance' ? '관련성순' : '최신순'}
                    </button>
                  ))}
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="h-8 px-2 pr-6 rounded-md text-[14px] text-[#464C53] border border-[#CDD1D5] bg-white appearance-none cursor-pointer hover:bg-gray-50 focus:outline-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23464C53' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}개씩</option>
                  ))}
                </select>
              </div>
            )}

            {submittedState === null && (
              <p className="text-gray-500 text-center py-8">조건을 입력하고 검색을 실행하세요.</p>
            )}

            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {searchError}
              </div>
            )}

            {!isLoading && !searchError && submittedState !== null && searchResults.length === 0 && (
              <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
            )}

            {!isLoading && !searchError && searchResults.length > 0 && (
              <div className="space-y-4">
                {/* 전체선택 헤더 */}
                <div className="flex items-center gap-3 px-1">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-[15px] text-[#464C53] hover:text-[#1E2124] transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                      ${selectedIds.size === searchResults.length && searchResults.length > 0
                        ? 'bg-[#256EF4] border-[#256EF4]'
                        : selectedIds.size > 0
                          ? 'bg-[#256EF4]/20 border-[#256EF4]'
                          : 'border-[#CDD1D5] bg-white'}`}
                    >
                      {selectedIds.size === searchResults.length && searchResults.length > 0 && (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {selectedIds.size > 0 && selectedIds.size < searchResults.length && (
                        <div className="w-2.5 h-0.5 bg-[#256EF4] rounded" />
                      )}
                    </div>
                    전체선택
                  </button>
                  {selectedIds.size > 0 && (
                    <span className="text-[14px] text-[#8A949E]">{selectedIds.size}개 선택됨</span>
                  )}
                </div>

                {searchResults.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    isLoggedIn={isLoggedIn}
                    isSelected={selectedIds.has(result.id)}
                    onToggleSelect={(e) => handleToggleSelect(e, result.id)}
                    cartLoading={cartMutation.isPending && cartMutation.variables === result.id}
                    buyLoading={buyNowMutation.isPending && buyNowMutation.variables === result.id}
                    highlightTerms={highlightTerms}
                  />
                ))}
              </div>
            )}

            {/* 일괄 액션 바 */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1E2124] text-white rounded-2xl px-5 py-3 shadow-2xl">
                <span className="text-[15px] font-medium whitespace-nowrap">{selectedIds.size}개 선택</span>
                <div className="w-px h-5 bg-white/20 mx-1" />
                <button
                  onClick={handleBulkScrap}
                  disabled={bulkScrapLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#256EF4] rounded-xl text-[14px] font-medium hover:bg-[#1a5cd4] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M5 3H15C15.5523 3 16 3.44772 16 4V18L10 14.5L4 18V4C4 3.44772 4.44772 3 5 3Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                  {bulkScrapLoading ? '추가 중...' : '스크랩 추가'}
                </button>
                <button
                  onClick={handleBulkCart}
                  disabled={bulkCartLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 rounded-xl text-[14px] font-medium hover:bg-white/20 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M3.5 6.5H16.5L15 15H5L3.5 6.5Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                    <path d="M7.5 6.5C7.5 4.6 8.7 3 10 3C11.3 3 12.5 4.6 12.5 6.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {bulkCartLoading ? '추가 중...' : '장바구니 담기'}
                </button>
                <button
                  onClick={handleBulkShare}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 rounded-xl text-[14px] font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <circle cx="15" cy="4" r="2" stroke="white" strokeWidth="1.4"/>
                    <circle cx="15" cy="16" r="2" stroke="white" strokeWidth="1.4"/>
                    <circle cx="5" cy="10" r="2" stroke="white" strokeWidth="1.4"/>
                    <path d="M7 9L13 5M7 11L13 15" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  공유
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-1 p-1 text-white/50 hover:text-white transition-colors"
                  title="선택 해제"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* 페이지네이션 */}
            {!isLoading && !searchError && totalResults > 0 && totalPages > 1 && (
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
  isLoggedIn,
  isSelected,
  onToggleSelect,
  cartLoading,
  buyLoading,
  highlightTerms = [],
}: {
  result: OpenSearchTextResultItem;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onBuyNow: (e: React.MouseEvent, id: string) => void;
  isLoggedIn: boolean;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  cartLoading: boolean;
  buyLoading: boolean;
  highlightTerms?: string[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: isScraped = false } = useQuery({
    queryKey: ['scrap-check', result.id],
    queryFn: () => checkScrap(result.id),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const scrapMutation = useMutation({
    mutationFn: () =>
      isScraped
        ? deleteScrap(result.id)
        : addScrap({ publication_id: result.id }),
    onSuccess: () => {
      queryClient.setQueryData(['scrap-check', result.id], !isScraped);
    },
    onError: (err) =>
      alert(err instanceof Error ? err.message : '스크랩 처리에 실패했습니다.'),
  });

  const handleScrap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login'); return; }
    scrapMutation.mutate();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = window.location.origin + paperUrl;
    const doCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(doCopy).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        doCopy();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      doCopy();
    }
  };

  const paperUrl = (() => {
    const provider = (result.metadata.provider_name as string | null)?.trim();
    const venue = (result.metadata.venue_name as string | null)?.trim();
    const journal = (result.metadata.journal as string | null)?.trim();
    if (provider && venue && journal) {
      return `/papers/${encodeURIComponent(provider)}/${encodeURIComponent(venue)}/${encodeURIComponent(journal)}/${result.id}`;
    }
    return `/papers/${result.id}`;
  })();

  return (
    <div className={`bg-white border rounded-xl hover:shadow-md transition-shadow flex items-stretch
      ${isSelected ? 'border-[#256EF4]' : 'border-[#CDD1D5]'}`}
    >
      {/* 체크박스 영역 */}
      <div
        onClick={onToggleSelect}
        className="flex items-start justify-center pt-5 px-3 md:px-4 shrink-0 cursor-pointer"
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
          ${isSelected ? 'bg-[#256EF4] border-[#256EF4]' : 'border-[#CDD1D5] bg-white hover:border-[#256EF4]'}`}
        >
          {isSelected && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div
        onClick={() => navigate(paperUrl)}
        className="flex-1 min-w-0 p-4 md:p-8 pl-0 cursor-pointer"
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleScrap}
            disabled={scrapMutation.isPending}
            className="transition-colors disabled:opacity-50"
            title={isScraped ? '스크랩 해제' : '스크랩'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 3H15C15.5523 3 16 3.44772 16 4V18L10 14.5L4 18V4C4 3.44772 4.44772 3 5 3Z"
                stroke={isScraped ? '#256EF4' : '#33363D'}
                fill={isScraped ? '#256EF4' : 'none'}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
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
          <div className="relative">
            <button
              type="button"
              onClick={handleShare}
              className="p-1 text-[#33363D] hover:text-[#1E2124] transition-colors"
              title="링크 복사"
            >
              {copied ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10L8.5 14.5L16 6" stroke="#256EF4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="15" cy="4" r="2" stroke="#33363D" strokeWidth="1.4"/>
                  <circle cx="15" cy="16" r="2" stroke="#33363D" strokeWidth="1.4"/>
                  <circle cx="5" cy="10" r="2" stroke="#33363D" strokeWidth="1.4"/>
                  <path d="M7 9L13 5M7 11L13 15" stroke="#33363D" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] text-white bg-[#1E2124] rounded px-2 py-0.5 whitespace-nowrap pointer-events-none">
                복사됨
              </span>
            )}
          </div>
        </div>
      </div>

      {/* row-2: 본문 + 버튼 */}
      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <h4 className="text-[19px] font-bold text-[#1E2124] leading-[1.5em]">
            {result.title ? highlightText(result.title, highlightTerms) : '제목 없음'}
          </h4>
          {result.abstract && (
            <>
              {expanded && (
                <p className="text-[15px] text-[#464C53] leading-[1.5em]">{highlightText(result.abstract, highlightTerms)}</p>
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
        <div className="flex flex-row md:flex-col items-stretch gap-2 w-full md:w-[120px] md:self-start">
          <button
            onClick={(e) => onBuyNow(e, result.id)}
            disabled={buyLoading}
            className="flex-1 md:flex-none md:w-full h-10 md:h-14 flex items-center justify-center bg-white text-[#AB2B36] text-[15px] md:text-[16px] font-bold rounded-md border border-[#CDD1D5] hover:bg-gray-50 transition-colors disabled:opacity-50 px-3"
          >
            ￦ 5,000
          </button>
          <button
            onClick={(e) => onBuyNow(e, result.id)}
            disabled={buyLoading}
            className="flex-1 md:flex-none md:w-full h-10 md:h-14 flex items-center justify-center bg-[#ECF2FE] text-[#0B50D0] text-[15px] md:text-[16px] font-normal rounded-md border border-[#256EF4] hover:bg-[#dce7fd] transition-colors disabled:opacity-50 px-3"
          >
            {buyLoading ? '처리 중...' : '구매하기'}
          </button>
        </div>
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
