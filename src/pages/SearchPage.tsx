import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/auth';
import { searchOpensearchDetailed, DetailedSearchCondition } from '@/api/search';
import { addToCart } from '@/api/cart';
import { checkScrapBatch } from '@/api/scraps';
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
    handleReset,
    removeConditionBadge,
    removeYearFilter,
  } = useSearchSubmit();

  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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

  useEffect(() => { setSelectedIds(new Set()); }, [data]);

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
    if (selectedIds.size === searchResults.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(searchResults.map(r => r.id)));
  };

  const { bulkCartLoading, bulkScrapLoading, handleBulkCite, handleBulkBuy, handleBulkScrap } =
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
        unit_price: 5000,
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

  const highlightTerms = submittedState?.conditions.map(c => c.keyword).filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <main className="max-w-[1280px] mx-auto px-4 py-10">
        <SearchResultHeader
          submittedState={submittedState}
          onReset={handleReset}
          onRemoveCondition={removeConditionBadge}
          onRemoveYearFilter={() => {
            removeYearFilter();
            setAppliedFilters(prev => ({ ...prev, yearFrom: '', yearTo: '' }));
          }}
        />

        <div className="flex flex-col md:flex-row gap-6 items-start">
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

          <div className="w-full md:flex-1 md:min-w-0 md:overflow-hidden md:bg-white md:rounded-xl md:border md:border-[#E4E7EA] md:px-6 md:py-5">
            {submittedState !== null && !isLoading && !searchError && (
              <SearchControlBar
                searchResults={searchResults}
                totalResults={totalResults}
                selectedIds={selectedIds}
                detailedSort={detailedSort}
                itemsPerPage={itemsPerPage}
                bulkScrapLoading={bulkScrapLoading}
                bulkCartLoading={bulkCartLoading}
                onSelectAll={handleSelectAll}
                onBulkScrap={handleBulkScrap}
                onBulkCite={handleBulkCite}
                onBulkBuy={handleBulkBuy}
                onSortChange={handleSortChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
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

            <FloatingActionBar
              selectedCount={selectedIds.size}
              bulkScrapLoading={bulkScrapLoading}
              bulkCartLoading={bulkCartLoading}
              onScrap={handleBulkScrap}
              onCite={handleBulkCite}
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
