import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/auth';
import { OpenSearchTextResultItem, searchOpensearchDetailed, DetailedSearchCondition } from '@/api/search';
import { addToCart, addToCartBatch } from '@/api/cart';
import { addScrapBatch, checkScrapBatch, deleteScrapBatch } from '@/api/scraps';
import SearchFilterSidebar, { Filters } from '@/components/SearchFilterSidebar';

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

  const qParam = searchParams.get('q');
  useEffect(() => {
    if (!qParam) return;
    setSubmittedState({
      conditions: [{ field: 'title', keyword: qParam, operator: 'AND' }],
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
    if (submittedState) sessionStorage.setItem('search_submitted', JSON.stringify(submittedState));
    else sessionStorage.removeItem('search_submitted');
  }, [submittedState]);

  const FIELD_LABELS: Record<string, string> = {
    title: '제목', author: '저자', abstract: '초록',
    keyword: '키워드', doi: 'DOI', full_text: '전문',
  };

  const handleReset = () => {
    setSubmittedState(null);
    setAppliedFilters({});
    setDetailedSort('relevance');
    sessionStorage.removeItem('search_submitted');
    setSearchParams({});
  };

  const removeConditionBadge = (idx: number) => {
    if (!submittedState) return;
    const next = submittedState.conditions.filter((_, i) => i !== idx);
    if (next.length === 0) { handleReset(); return; }
    setSubmittedState(prev => prev ? { ...prev, conditions: next } : prev);
    setSearchParams({ page: '1' });
  };

  const removeYearFilter = () => {
    setSubmittedState(prev => prev ? { ...prev, filters: {} } : prev);
    setAppliedFilters(prev => ({ ...prev, yearFrom: '', yearTo: '' }));
    setSearchParams({ page: '1' });
  };

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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  const scrapIds = searchResults.map(r => r.id);
  const { data: scrappedIds = new Set<string>() } = useQuery({
    queryKey: ['scrap-batch', scrapIds],
    queryFn: () => checkScrapBatch(scrapIds),
    enabled: isLoggedIn && scrapIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const handleScrapToggle = (id: string, isScrapped: boolean) => {
    queryClient.setQueryData<Set<string>>(['scrap-batch', scrapIds], (old = new Set()) => {
      const next = new Set(old);
      if (isScrapped) next.add(id);
      else next.delete(id);
      return next;
    });
  };

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

  const handleBulkCite = async () => {
    const citations = searchResults
      .filter(r => selectedIds.has(r.id))
      .map(r => {
        const authors = r.authors?.slice(0, 3).join(', ') ?? '';
        const year = r.year ?? '';
        const journal = (r.metadata.journal as string | null)?.trim() ?? '';
        return `${authors}${authors ? ' ' : ''}(${year}). ${r.title}. ${journal}`.trim();
      })
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(citations);
      alert('인용 정보가 복사되었습니다.');
    } catch (e) {
      console.error('복사 실패', e);
    }
  };

  const handleBulkBuy = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setBulkCartLoading(true);
    const ids = [...selectedIds];
    try {
      await addToCartBatch(ids);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/cart');
    } catch {
      await Promise.allSettled(ids.map(id => addToCart({ publication_id: id })));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/cart');
    } finally {
      setBulkCartLoading(false);
    }
  };

  const handleBulkScrap = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setBulkScrapLoading(true);
    const ids = [...selectedIds];
    try {
      await addScrapBatch(ids);
      queryClient.setQueryData<Set<string>>(['scrap-batch', scrapIds], (old = new Set()) => {
        const next = new Set(old);
        ids.forEach(id => next.add(id));
        return next;
      });
      alert(`${ids.length}개를 스크랩에 추가했습니다.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '스크랩 추가에 실패했습니다.');
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
        {/* 검색 결과 헤더 — 제목 + 배지 */}
        <div className="mb-6 bg-white rounded-xl border border-[#E4E7EA] px-6 py-5">
          {submittedState ? (
            <>
              <h2 className="text-[22px] md:text-[26px] font-bold text-[#1E2124] mb-3">
                <span className="text-[#256EF4]">{submittedState.conditions[0]?.keyword}</span>
                {submittedState.conditions.length > 1 && ' 외'}
                {' '}에 대한 검색결과
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={handleReset}
                  className="h-8 px-3 flex items-center gap-1 text-[13px] text-[#464C53] border border-[#CDD1D5] rounded-full hover:bg-gray-50 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8a6 6 0 1 1 1.22 3.68M2 8V4.5m0 3.5H5.5" stroke="#464C53" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  초기화
                </button>
                {submittedState.conditions.map((cond, idx) => (
                  <span key={idx} className="h-8 px-3 flex items-center gap-1.5 bg-[#F4F5F6] border border-[#CDD1D5] rounded-full text-[13px] text-[#464C53]">
                    <span className="text-[#8A949E]">{FIELD_LABELS[cond.field]}:</span>
                    {cond.keyword}
                    <button onClick={() => removeConditionBadge(idx)} className="text-[#8A949E] hover:text-[#E32929] transition-colors flex items-center">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </span>
                ))}
                {(submittedState.filters.year_from || submittedState.filters.year_to) && (
                  <span className="h-8 px-3 flex items-center gap-1.5 bg-[#F4F5F6] border border-[#CDD1D5] rounded-full text-[13px] text-[#464C53]">
                    {submittedState.filters.year_from ?? ''}~{submittedState.filters.year_to ?? ''}
                    <button onClick={removeYearFilter} className="text-[#8A949E] hover:text-[#E32929] transition-colors flex items-center">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-[15px] text-gray-500">검색어를 입력하고 검색을 실행하세요.</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* 모바일 필터 토글 바 */}
          <div className="md:hidden w-full bg-white rounded-xl border border-[#E4E7EA] px-4 py-3 flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#1E2124]">결과 내 검색</span>
            <button
              onClick={() => setMobileFilterOpen(v => !v)}
              className="flex items-center gap-1.5 text-[14px] text-[#464C53] border border-[#CDD1D5] rounded-md px-3 py-1.5"
            >
              필터{mobileFilterOpen ? '닫기' : '열기'}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${mobileFilterOpen ? '' : 'rotate-180'}`}>
                <path d="M4 6l4 4 4-4" stroke="#464C53" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className={`w-full md:w-auto md:sticky top-24 md:self-start ${mobileFilterOpen ? '' : 'hidden md:block'}`}>
            <SearchFilterSidebar
              onApply={(filters) => {
                const yearFrom = filters.yearFrom ? parseInt(filters.yearFrom) : undefined;
                const yearTo = filters.yearTo ? parseInt(filters.yearTo) : undefined;
                setSubmittedState(prev => prev ? {
                  ...prev,
                  filters: { ...(yearFrom && { year_from: yearFrom }), ...(yearTo && { year_to: yearTo }) },
                } : prev);
                setSearchParams({ page: '1' });
              }}
              onReset={handleReset}
              onWithinSearch={(keyword) => {
                if (!keyword.trim()) return;
                const newCond: DetailedSearchCondition = { field: 'title', keyword: keyword.trim(), operator: 'AND' };
                setSubmittedState(prev => {
                  if (!prev) return { conditions: [newCond], sort: 'relevance', filters: {} };
                  return { ...prev, conditions: [...prev.conditions, newCond] };
                });
                setSearchParams({ page: '1' });
              }}
            />
          </div>

          {/* 결과 목록 */}
          <div className="w-full md:flex-1 md:min-w-0 md:overflow-hidden md:bg-white md:rounded-xl md:border md:border-[#E4E7EA] md:px-6 md:py-5">
            {/* 정렬 + 개수 컨트롤 */}
            {/* 검색 결과 수 */}
            {submittedState !== null && !isLoading && !searchError && totalResults > 0 && (
              <p className="text-[15px] font-bold text-[#1E2124] mb-3">
                검색 결과 <span className="text-[#256EF4]">{totalResults.toLocaleString()}</span>건
              </p>
            )}

            {/* 통합 컨트롤 바 */}
            {submittedState !== null && (
              <div className="hidden md:flex items-center justify-between mb-4 pb-3 border-b border-[#E4E7EA]">
                {/* 좌측: 전체선택 + 액션 버튼 */}
                <div className="flex items-center">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 pr-4 text-[14px] text-[#464C53] hover:text-[#1E2124] transition-colors"
                  >
                    <div className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                      ${selectedIds.size === searchResults.length && searchResults.length > 0
                        ? 'bg-[#256EF4] border-[#256EF4]'
                        : selectedIds.size > 0
                          ? 'bg-[#256EF4]/20 border-[#256EF4]'
                          : 'border-[#CDD1D5] bg-white'}`}
                    >
                      {selectedIds.size === searchResults.length && searchResults.length > 0 && (
                        <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {selectedIds.size > 0 && selectedIds.size < searchResults.length && (
                        <div className="w-2 h-0.5 bg-[#256EF4] rounded" />
                      )}
                    </div>
                    전체선택
                  </button>
                  <div className="w-px h-4 bg-[#CDD1D5]" />
                  <button
                    onClick={handleBulkScrap}
                    disabled={selectedIds.size === 0 || bulkScrapLoading}
                    className="px-4 text-[14px] text-[#464C53] hover:text-[#1E2124] disabled:text-[#CDD1D5] transition-colors flex items-center gap-1.5"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M4 2H12C12.55 2 13 2.45 13 3V14.5L8 11.5L3 14.5V3C3 2.45 3.45 2 4 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    </svg>
                    보관함 담기
                  </button>
                  <div className="w-px h-4 bg-[#CDD1D5]" />
                  <button
                    onClick={handleBulkCite}
                    disabled={selectedIds.size === 0}
                    className="px-4 text-[14px] text-[#464C53] hover:text-[#1E2124] disabled:text-[#CDD1D5] transition-colors flex items-center gap-1.5"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M2.5 5.5C2.5 4.67 3.17 4 4 4H5.5V7.5H2.5V5.5ZM8.5 5.5C8.5 4.67 9.17 4 10 4H11.5V7.5H8.5V5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                      <path d="M2.5 7.5V12H5.5V7.5M8.5 7.5V12H11.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                    </svg>
                    인용하기
                  </button>
                  <div className="w-px h-4 bg-[#CDD1D5]" />
                  <button
                    onClick={handleBulkBuy}
                    disabled={selectedIds.size === 0 || bulkCartLoading}
                    className="px-4 text-[14px] text-[#464C53] hover:text-[#1E2124] disabled:text-[#CDD1D5] transition-colors flex items-center gap-1.5"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M2.5 5.5H13.5L12 13H4L2.5 5.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                      <path d="M6 5.5C6 3.8 7 2.5 8 2.5C9 2.5 10 3.8 10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    구매하기
                  </button>
                </div>

                {/* 우측: 정렬 + 개수 */}
                <div className="flex items-center gap-2">
                  <select
                    value={detailedSort}
                    onChange={(e) => {
                      const s = e.target.value as 'relevance' | 'latest';
                      setDetailedSort(s);
                      setSubmittedState(prev => prev ? { ...prev, sort: s } : prev);
                      setSearchParams(prev => { prev.set('page', '1'); return prev; });
                    }}
                    className="h-9 px-3 pr-8 rounded-lg text-[14px] text-[#464C53] border border-[#CDD1D5] bg-white appearance-none cursor-pointer hover:border-[#8A949E] focus:outline-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23464C53' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  >
                    <option value="relevance">정확도순</option>
                    <option value="latest">최신순</option>
                  </select>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="h-9 px-3 pr-8 rounded-lg text-[14px] text-[#464C53] border border-[#CDD1D5] bg-white appearance-none cursor-pointer hover:border-[#8A949E] focus:outline-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23464C53' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  >
                    {PAGE_SIZE_OPTIONS.map(size => (
                      <option key={size} value={size}>{size}개씩</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {submittedState === null && (
              <p className="text-gray-500 text-center py-8">검색어를 입력하고 검색을 실행하세요.</p>
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
                    isScraped={scrappedIds.has(result.id)}
                    onScrapToggle={handleScrapToggle}
                  />
                ))}
              </div>
            )}

            {/* 플로팅 액션 바 (스크롤 시 편의용) */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0 bg-[#1E2124] text-white rounded-2xl px-5 py-3 shadow-2xl">
                <span className="text-[14px] font-medium whitespace-nowrap mr-4">{selectedIds.size}개 선택</span>
                <div className="w-px h-4 bg-white/20" />
                <button onClick={handleBulkScrap} disabled={bulkScrapLoading} className="px-4 text-[14px] text-white/80 hover:text-white disabled:text-white/30 transition-colors whitespace-nowrap">
                  {bulkScrapLoading ? '추가 중...' : '보관함 담기'}
                </button>
                <div className="w-px h-4 bg-white/20" />
                <button onClick={handleBulkCite} disabled={selectedIds.size === 0} className="px-4 text-[14px] text-white/80 hover:text-white transition-colors whitespace-nowrap">
                  인용하기
                </button>
                <div className="w-px h-4 bg-white/20" />
                <button onClick={handleBulkBuy} disabled={bulkCartLoading} className="px-4 text-[14px] text-white/80 hover:text-white disabled:text-white/30 transition-colors whitespace-nowrap">
                  구매하기
                </button>
                <div className="w-px h-4 bg-white/20 ml-1" />
                <button onClick={() => setSelectedIds(new Set())} className="ml-3 text-white/40 hover:text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* 더보기 (모바일) */}
            {!isLoading && !searchError && totalResults > 0 && currentPage < totalPages && (
              <div className="md:hidden mt-6">
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  className="w-full h-12 rounded-xl border border-[#CDD1D5] text-[16px] font-medium text-[#464C53] bg-white hover:bg-gray-50 transition-colors"
                >
                  더보기
                </button>
              </div>
            )}

            {/* 페이지네이션 (데스크탑) */}
            {!isLoading && !searchError && totalResults > 0 && totalPages > 1 && (
              <div className="hidden md:flex items-center justify-center gap-2 mt-8 pt-4">
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
  isScraped,
  onScrapToggle,
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
  isScraped: boolean;
  onScrapToggle: (id: string, isScrapped: boolean) => void;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrapMutation = useMutation({
    mutationFn: () =>
      isScraped
        ? deleteScrapBatch([result.id])
        : addScrapBatch([result.id]),
    onSuccess: () => {
      onScrapToggle(result.id, !isScraped);
    },
    onError: (err) =>
      alert(err instanceof Error ? err.message : '스크랩 처리에 실패했습니다.'),
  });

  const handleScrap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login'); return; }
    scrapMutation.mutate();
  };

  const handleCite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const authors = result.authors?.slice(0, 3).join(', ') ?? '';
    const year = result.year ?? '';
    const journal = (result.metadata.journal as string | null)?.trim() ?? '';
    const citation = `${authors}${authors ? ' ' : ''}(${year}). ${result.title}. ${journal}`.trim();
    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
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
      ${isSelected ? 'border-[#256EF4]' : 'border-[#E4E7EA]'}`}
    >
      {/* 체크박스 */}
      <div onClick={onToggleSelect} className="flex items-start justify-center pt-5 px-3 md:px-4 shrink-0 cursor-pointer">
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

      {/* 콘텐츠 */}
      <div onClick={() => navigate(paperUrl)} className="flex-1 min-w-0 py-4 pr-5 pl-0 cursor-pointer">

        {/* row-1: 배지 + 아이콘 */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center h-[22px] px-2.5 bg-[#ECF2FE] text-[#0B50D0] text-[12px] font-medium rounded-full">학술저널</span>
            <span className="inline-flex items-center h-[22px] px-2.5 bg-[#EAF6EC] text-[#267337] text-[12px] font-medium rounded-full">KCI등재</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* 공유 */}
            <div className="relative">
              <button type="button" onClick={handleShare} className="text-[#8A949E] hover:text-[#1E2124] transition-colors" title="링크 복사">
                {copied ? (
                  <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10L8.5 14.5L16 6" stroke="#256EF4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                    <circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.4"/>
                    <circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.4"/>
                    <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M7 9L13 5M7 11L13 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] text-white bg-[#1E2124] rounded px-2 py-0.5 whitespace-nowrap pointer-events-none">복사됨</span>
              )}
            </div>
            {/* 스크랩 */}
            <button onClick={handleScrap} disabled={scrapMutation.isPending} className="text-[#8A949E] hover:text-[#1E2124] transition-colors disabled:opacity-50" title={isScraped ? '스크랩 해제' : '스크랩'}>
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <path d="M5 3H15C15.55 3 16 3.45 16 4V18L10 14.5L4 18V4C4 3.45 4.45 3 5 3Z"
                  stroke={isScraped ? '#256EF4' : 'currentColor'}
                  fill={isScraped ? '#256EF4' : 'none'}
                  strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* 장바구니 */}
            <button onClick={(e) => onAddToCart(e, result.id)} disabled={cartLoading} className="text-[#8A949E] hover:text-[#1E2124] transition-colors disabled:opacity-50" title="장바구니 담기">
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <path d="M3.5 6.5H16.5L15 15H5L3.5 6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M7.5 6.5C7.5 4.6 8.7 3 10 3C11.3 3 12.5 4.6 12.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* row-2: 제목 */}
        <h4 className="text-[16px] font-bold text-[#1E2124] leading-[1.5em] mb-2">
          {result.title ? highlightText(result.title, highlightTerms) : '제목 없음'}
        </h4>

        {/* row-3: 메타 + PC 가격/구매 */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap text-[13px] text-[#464C53] mb-1">
              {result.authors && result.authors.length > 0 && (
                <>
                  {result.authors.slice(0, 3).map((a: string, i: number) => (
                    <span key={i}>{a}</span>
                  ))}
                  {result.authors.length > 3 && <span>외 {result.authors.length - 3}명</span>}
                  <span className="text-[#CDD1D5] mx-0.5">|</span>
                </>
              )}
              {result.year != null && (
                <><span>{result.year}</span><span className="text-[#CDD1D5] mx-0.5">|</span></>
              )}
              <span>KCI등재</span>
            </div>
            <PublicationMeta metadata={result.metadata} />
          </div>
          {/* PC: 가격(위) + 구매하기(아래) 우측 정렬 */}
          <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[14px] font-bold text-[#AB2B36] border border-[#AB2B36] rounded-md px-3 py-1">￦ 7,000</span>
            <button
              onClick={(e) => onBuyNow(e, result.id)}
              disabled={buyLoading}
              className="h-8 px-4 bg-[#256EF4] text-white text-[13px] font-medium rounded-md hover:bg-[#1e4ec9] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {buyLoading ? '처리 중...' : '구매하기'}
            </button>
          </div>
        </div>

        {/* 모바일: 가격 + 구매하기 */}
        <div className="flex md:hidden items-center justify-end gap-3 mt-2 mb-1">
          <span className="text-[14px] font-bold text-[#AB2B36] border border-[#AB2B36] rounded-md px-3 py-1">￦ 7,000</span>
          <button
            onClick={(e) => onBuyNow(e, result.id)}
            disabled={buyLoading}
            className="h-8 px-4 bg-[#256EF4] text-white text-[13px] font-medium rounded-md hover:bg-[#1e4ec9] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {buyLoading ? '처리 중...' : '구매하기'}
          </button>
        </div>

        {/* row-4: 하단 액션 버튼 */}
        <div className="hidden md:flex items-center border-t border-[#F4F5F6] pt-2.5 mt-1" onClick={(e) => e.stopPropagation()}>
          <button className="flex items-center gap-1 pr-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            미리보기
          </button>
          <div className="w-px h-3 bg-[#CDD1D5]"/>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            className="flex items-center gap-1 px-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4.5 6H11.5M4.5 9.5H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {expanded ? '접기' : '초록보기'}
          </button>
          <div className="w-px h-3 bg-[#CDD1D5]"/>
          <button className="flex items-center gap-1 px-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L9.8 5.5L14 6.1L11 9L11.8 13.2L8 11.1L4.2 13.2L5 9L2 6.1L6.2 5.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            AI 요약
          </button>
          <div className="w-px h-3 bg-[#CDD1D5]"/>
          <button onClick={handleCite} className="flex items-center gap-1 px-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 5.5C2.5 4.67 3.17 4 4 4H5.5V7.5H2.5V5.5ZM8.5 5.5C8.5 4.67 9.17 4 10 4H11.5V7.5H8.5V5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M2.5 7.5V12H5.5V7.5M8.5 7.5V12H11.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            인용하기
          </button>
        </div>

        {/* 초록 펼침 */}
        {expanded && result.abstract && (
          <div className="mt-3 p-3 bg-[#F8F9FA] rounded-lg border border-[#E4E7EA]">
            <p className="text-[13px] text-[#464C53] leading-[1.6em]">
              {highlightText(result.abstract, highlightTerms)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PublicationMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const providerName = (metadata.provider_name || metadata.publisher_name) as string | null;
  const venueName = metadata.venue_name as string | null;
  const journal = metadata.journal as string | null;
  const volume = metadata.volume as string | null | number;
  const issue = (metadata.issue_number || metadata.number) as string | null;
  const volumeIssue = volume || issue
    ? [volume ? `${volume}권` : '', issue ? `(${issue}호)` : ''].filter(Boolean).join(' ')
    : null;
  const pageStart = metadata.page_start as string | null;
  const pageEnd = metadata.page_end as string | null;
  const pageRange = (metadata.page_range as string | null)
    || (pageStart || pageEnd
      ? [pageStart, pageEnd].filter(Boolean).join('-') + 'p'
      : null);
  const segments = [providerName, venueName, journal, volumeIssue, pageRange].filter(Boolean) as string[];
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
