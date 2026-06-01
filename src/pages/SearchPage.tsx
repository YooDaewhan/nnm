import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/auth';
import { searchOpensearchDetailed, DetailedSearchCondition } from '@/api/search';
import { addToCart } from '@/api/cart';
import { checkScrapBatch } from '@/api/scraps';
import { getPayments } from '@/api/payment';
import SearchFilterSidebar from '@/components/SearchFilterSidebar';
import { SearchResultHeader } from '@/components/search/SearchResultHeader';
import { SearchControlBar } from '@/components/search/SearchControlBar';
import { FloatingActionBar } from '@/components/search/FloatingActionBar';
import { SearchPagination } from '@/components/search/SearchPagination';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { useSearchSubmit } from '@/hooks/useSearchSubmit';
import { useBulkActions } from '@/hooks/useBulkActions';

function OpenSearchTextContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLoggedIn = isAuthenticated();

  const {
    submittedState,
    setSubmittedState,
    detailedSort,
    setDetailedSort,
    searchParams,
    setSearchParams,
    removeConditionBadge,
    removeYearFilter,
  } = useSearchSubmit();

  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mobileWithin, setMobileWithin] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['detailed-search', submittedState, currentPage, itemsPerPage],
    queryFn: () => searchOpensearchDetailed({
      conditions: submittedState!.conditions,
      page: currentPage,
      size: itemsPerPage,
      sort: submittedState!.sort,
      filters: (submittedState!.filters.year_from || submittedState!.filters.year_to || submittedState!.filters.journal)
        ? submittedState!.filters
        : undefined,
    }),
    enabled: submittedState !== null,
  });

  const searchResults = useMemo(() => {
    const venues = data?.venues ?? [];
    const providers = data?.providers ?? [];
    const providerIdToType: Record<number, string> = {};
    venues.forEach(v => { providerIdToType[v.provider_id] = v.type; });
    const providerNameToType: Record<string, string> = {};
    providers.forEach(p => { if (providerIdToType[p.id]) providerNameToType[p.name] = providerIdToType[p.id]; });
    return (data?.results ?? []).map(r => ({
      ...r,
      type: r.type ?? providerNameToType[r.metadata?.provider_name ?? ''] ?? null,
    }));
  }, [data]);
  const totalResults = data?.total ?? data?.count ?? 0;

  const providers = useMemo(() => {
    const seen = new Set<string>();
    return searchResults
      .map(r => r.metadata?.journal)
      .filter((j): j is string => !!j && !seen.has(j) && !!seen.add(j))
      .map((name, idx) => ({ id: idx, name }));
  }, [searchResults]);

  const searchError = error instanceof Error ? error.message : error ? '검색 중 오류가 발생했습니다.' : null;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  useEffect(() => { setSelectedIds(new Set()); }, [data]);

  useEffect(() => {
    if (data) console.log(data);
  }, [data]);

  const { data: ordersData } = useQuery({
    queryKey: ['orders-paid'],
    queryFn: () => getPayments({ status: 'paid', per_page: 100 }),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const paidOrders = ordersData?.success ? ordersData.orders.data : [];

  const purchasedIds = useMemo(() => {
    const ids = new Set<string>();
    paidOrders.forEach((order) => {
      const items = (order as any).metadata?.items as { publication_id?: string }[] ?? [];
      items.forEach((item) => {
        if (item.publication_id) ids.add(item.publication_id);
      });
    });
    return ids;
  }, [paidOrders]);

  const scrapIds = searchResults.map(r => r.id);
  const { data: scrappedIds = new Set<string>() } = useQuery({
    queryKey: ['scrap-batch', scrapIds],
    queryFn: () => checkScrapBatch(scrapIds),
    select: (data) => new Set(data),
    enabled: isLoggedIn && scrapIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const handleScrapToggle = () => {
    queryClient.invalidateQueries({ queryKey: ['scrap-batch', scrapIds] });
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
    if (selectedIds.size === searchResults.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(searchResults.map(r => r.id)));
  };

  const { bulkCartLoading, bulkScrapLoading, handleBulkBuy, handleBulkScrap } =
    useBulkActions(selectedIds, searchResults, scrapIds, isLoggedIn);

  const cartMutation = useMutation({
    mutationFn: async (resultId: string) => { await addToCart({ publication_id: resultId }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cart'] }); alert('장바구니에 추가되었습니다.'); },
    onError: (err) => alert(err instanceof Error ? err.message : '장바구니 추가에 실패했습니다.'),
  });

  const buyNowMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const result = searchResults.find((r) => r.id === resultId);
      sessionStorage.setItem('directBuyItem', JSON.stringify({
        publication_id: resultId,
        title: result?.title ?? '',
        unit_price: result?.price ?? result?.metadata?.price ?? 0,
        quantity: 1,
        authors: result?.authors ?? [],
        publisher: result?.metadata?.publisher_name ?? null,
        journal: result?.metadata?.journal ?? null,
      }));
    },
    onSuccess: () => navigate('/pay?direct=true'),
    onError: (err) => alert(err instanceof Error ? err.message : '구매하기에 실패했습니다.'),
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

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setSearchParams(prev => { prev.set('page', '1'); return prev; });
  };

  const handleSortChange = (s: 'relevance' | 'latest') => {
    setDetailedSort(s);
    setSubmittedState(prev => prev ? { ...prev, sort: s } : prev);
    setSearchParams(prev => { prev.set('page', '1'); return prev; });
  };

  const goToPage = (page: number) => setSearchParams({ page: String(page) });

  const handleResetFilters = () => {
    setSubmittedState(prev => prev ? { ...prev, conditions: prev.conditions.slice(0, 1), filters: {} } : prev);
    setSearchParams({ page: '1' });
  };

  const handleRemoveJournalFilter = (remaining?: string) => {
    setSubmittedState(prev => prev ? { ...prev, filters: { ...prev.filters, journal: remaining } } : prev);
    setSearchParams({ page: '1' });
  };

  const highlightTerms = submittedState?.conditions.map(c => c.keyword).filter(Boolean) ?? [];

  const mobileTopic = submittedState?.conditions[0]?.keyword ?? '';
  const mobileAndConds = submittedState?.conditions.slice(1) ?? [];
  const mobileHasYear = !!(submittedState?.filters.year_from || submittedState?.filters.year_to);
  const mobileJournalStr = Array.isArray(submittedState?.filters.journal)
    ? (submittedState!.filters.journal as unknown as string[]).join(',')
    : (submittedState?.filters.journal ?? '');
  const mobileHasJournal = !!mobileJournalStr;
  const mobileHasAnyFilter = mobileAndConds.length > 0 || mobileHasYear || mobileHasJournal;

  const closeIcon = (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  const mobileSortStyle: React.CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: 100,
    height: 32,
    padding: '0 28px 0 12px',
    borderRadius: 4,
    border: '1px solid #58616A',
    background: `#FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23464C53' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 8px center`,
    fontFamily: "'Pretendard GOV', sans-serif",
    fontSize: 15,
    color: '#464C53',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <main className="max-w-[1280px] mx-auto px-4 pt-6 pb-14 md:py-10">

        {/* ─── 데스크탑 전용: AI 검색결과 헤더 ─── */}
        <div className="hidden md:block">
          <SearchResultHeader
            submittedState={submittedState}
            yearLabel={submittedState?.filters?.year_label ?? ''}
            onReset={handleResetFilters}
            onRemoveCondition={removeConditionBadge}
            onRemoveYearFilter={removeYearFilter}
            onRemoveJournalFilter={handleRemoveJournalFilter}
          />
        </div>

        {/* ─── 모바일 전용: filter-result__mo ─── */}
        {submittedState && (
          <div
            className="flex md:hidden flex-col mb-5"
            style={{
              background: '#EEF2F7',
              border: '1px solid #D6E0EB',
              borderRadius: 12,
              padding: 16,
              gap: 16,
            }}
          >
            {/* 키워드 줄 */}
            <p style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
              <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#0B50D0' }}>
                {mobileTopic}
              </span>
              {mobileAndConds.length > 0 && (
                <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#0B50D0' }}>
                  {' 외'}
                </span>
              )}
              <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 17, lineHeight: '150%', color: '#1E2124' }}>
                {' 에 대한 검색결과'}
              </span>
            </p>

            {/* 필터 뱃지 줄 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={handleResetFilters}
                title="초기화"
                style={{
                  flexShrink: 0, width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', border: '1px solid #CDD1D5', background: '#FFFFFF',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 1 1 1.22 3.68M2 8V4.5m0 3.5H5.5" stroke="#464C53" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {mobileHasAnyFilter ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {mobileAndConds.map((cond, idx) => (
                    <span key={idx} style={{ height: 28, padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F4F5F6', borderRadius: 100, fontFamily: "'Pretendard GOV', sans-serif", fontSize: 14, color: '#464C53' }}>
                      {cond.keyword}
                      <button onClick={() => removeConditionBadge(idx + 1)} style={{ color: '#8A949E', display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>{closeIcon}</button>
                    </span>
                  ))}
                  {mobileHasYear && (
                    <span style={{ height: 28, padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F4F5F6', borderRadius: 100, fontFamily: "'Pretendard GOV', sans-serif", fontSize: 14, color: '#464C53' }}>
                      {submittedState.filters.year_label || `${submittedState.filters.year_from ?? ''}~${submittedState.filters.year_to ?? ''}`}
                      <button onClick={removeYearFilter} style={{ color: '#8A949E', display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>{closeIcon}</button>
                    </span>
                  )}
                  {mobileHasJournal && mobileJournalStr.split(',').map((j, i, arr) => (
                    <span key={j} style={{ height: 28, padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F4F5F6', borderRadius: 100, fontFamily: "'Pretendard GOV', sans-serif", fontSize: 14, color: '#464C53' }}>
                      {j}
                      <button onClick={() => { const rem = arr.filter((_, ix) => ix !== i); rem.length === 0 ? handleRemoveJournalFilter() : handleRemoveJournalFilter(rem.join(',')); }} style={{ color: '#8A949E', display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>{closeIcon}</button>
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 17, lineHeight: '150%', color: '#464C53' }}>
                  적용된 필터가 없습니다.
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start">

          {/* ─── 모바일 전용: 결과 내 검색 아코디언 (사이드바 없음) ─── */}
          <div className="md:hidden w-full">
            {/* 헤더 row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ flex: 1, fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#1E2124' }}>
                결과 내 검색
              </span>
              <button
                onClick={() => setMobileFilterOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  padding: '0 2px', height: 20,
                  background: 'none', border: 'none',
                  fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 15, lineHeight: '150%', color: '#1E2124',
                  cursor: 'pointer',
                }}
              >
                {mobileFilterOpen ? '필터닫기' : '필터열기'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 3.5h12M4.5 8h7M6.5 12.5h3" stroke="#464C53" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 검색 input (열렸을 때만) */}
            {mobileFilterOpen && (
              <div style={{ padding: '4px 0 24px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const kw = mobileWithin.trim();
                    if (!kw) return;
                    const newCond: DetailedSearchCondition = { field: 'title', keyword: kw, operator: 'AND' };
                    setSubmittedState(prev => prev
                      ? { ...prev, conditions: [...prev.conditions, newCond] }
                      : { conditions: [newCond], sort: 'relevance', filters: {} });
                    setSearchParams({ page: '1' });
                    setMobileWithin('');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 48, background: '#F4F5F6', borderRadius: 8 }}
                >
                  <input
                    value={mobileWithin}
                    onChange={(e) => setMobileWithin(e.target.value)}
                    placeholder="검색어를 입력해주세요."
                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 17, lineHeight: '150%', color: '#1E2124' }}
                  />
                  <button type="submit" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#8A949E' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* 구분선 */}
            <div style={{ borderTop: '1px solid #CDD1D5' }} />
          </div>

          {/* ─── 데스크탑 전용: 사이드바 ─── */}
          <div className="hidden md:block md:sticky top-24 md:self-start">
            <SearchFilterSidebar
              providers={providers}
              onApply={(filters) => {
                const yearFrom = filters.yearFrom ? parseInt(filters.yearFrom) : undefined;
                const yearTo = filters.yearTo ? parseInt(filters.yearTo) : undefined;
                setSubmittedState(prev => prev ? {
                  ...prev,
                  filters: {
                    ...(yearFrom && { year_from: yearFrom }),
                    ...(yearTo && { year_to: yearTo }),
                    ...(filters.yearLabel && { year_label: filters.yearLabel }),
                    ...(filters.providerName.length > 0 && { journal: filters.providerName.join(',') }),
                  },
                } : prev);
                setSearchParams({ page: '1' });
              }}
              onReset={handleResetFilters}
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

          {/* ─── 검색 결과 영역 ─── */}
          <div className="w-full md:flex-1 md:min-w-0 md:overflow-hidden md:bg-white md:rounded-xl md:border md:border-[#E4E7EA] md:px-6 md:py-5">
            {submittedState !== null && !isLoading && !searchError && (
              <>
                {/* 데스크탑 컨트롤 바 */}
                <div className="hidden md:block">
                  <SearchControlBar
                    searchResults={searchResults}
                    totalResults={totalResults}
                    selectedIds={selectedIds}
                    bulkScrapLoading={bulkScrapLoading}
                    bulkCartLoading={bulkCartLoading}
                    onSelectAll={handleSelectAll}
                    onBulkScrap={handleBulkScrap}
                    onBulkBuy={handleBulkBuy}
                  />
                </div>

                {/* 모바일: list-head */}
                <div className="flex md:hidden items-center justify-between" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#464C53' }}>검색 결과</span>
                    <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#0B50D0' }}>{totalResults.toLocaleString()}</span>
                    <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#464C53' }}>건</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={detailedSort} onChange={(e) => handleSortChange(e.target.value as 'relevance' | 'latest')} style={mobileSortStyle}>
                      <option value="relevance">정확도순</option>
                      <option value="latest">최신순</option>
                    </select>
                    <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))} style={mobileSortStyle}>
                      <option value={10}>10개씩</option>
                      <option value={20}>20개씩</option>
                      <option value={50}>50개씩</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {submittedState === null && (
              <p className="text-gray-500 text-center py-8">검색어를 입력하고 검색을 실행하세요.</p>
            )}

            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}

            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{searchError}</div>
            )}

            {!isLoading && !searchError && submittedState !== null && searchResults.length === 0 && (
              <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
            )}

            {!isLoading && !searchError && searchResults.length > 0 && (
              <div className="flex flex-col gap-4 md:gap-0">
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
                    isPurchased={purchasedIds.has(result.id)}
                  />
                ))}
              </div>
            )}

            <FloatingActionBar
              selectedCount={selectedIds.size}
              bulkScrapLoading={bulkScrapLoading}
              bulkCartLoading={bulkCartLoading}
              onScrap={handleBulkScrap}
              onBuy={handleBulkBuy}
              onClear={() => setSelectedIds(new Set())}
            />

            <SearchPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              isLoading={isLoading}
              hasError={!!searchError}
              onGoToPage={goToPage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OpenSearchTextPage() {
  return <OpenSearchTextContent />;
}
