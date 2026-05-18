import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../api/client';
import JournalFilterSidebar from '@/components/JournalFilterSidebar';
import { OpenSearchTextResultItem } from '@/api/search';
import { osSearchText } from '@/api/opensearch-direct';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SearchControlBar } from '@/components/search/SearchControlBar';
import { FloatingActionBar } from '@/components/search/FloatingActionBar';
import { SearchPagination } from '@/components/search/SearchPagination';
import { isAuthenticated } from '@/lib/auth';
import { addToCart } from '@/api/cart';
import { checkScrapBatch } from '@/api/scraps';
import { getPayments } from '@/api/payment';
import { useBulkActions } from '@/hooks/useBulkActions';

interface VenueSettings {
  pissn?: string;
  eissn?: string;
  kci?: boolean;
  lang?: string;
  award?: string[];
  status?: string;
  frequency?: number;
  published_since_year?: number;
  [key: string]: unknown;
}

interface VenueDetail {
  id: string;
  name: string;
  abbr?: string;
  type: string;
  description?: string;
  submission_url?: string;
  frequency_label?: string;
  pissn?: string;
  eissn?: string;
  cover_url?: string | null;
  settings?: VenueSettings;
  provider_id?: number;
  provider?: {
    id?: number;
    name?: string;
    website_url?: string;
  };
  metrics?: {
    papers_count?: number;
    volumes_count?: number;
    active_years?: number;
  };
  kci?: {
    impact_factor?: number;
    paper_count?: number;
    citation_count?: number;
    synced_at?: string;
  };
}

export default function JournalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLoggedIn = isAuthenticated();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [detailedSort, setDetailedSort] = useState<'relevance' | 'latest'>('latest');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchYearFrom, setSearchYearFrom] = useState('');
  const [searchYearTo, setSearchYearTo] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState<{ keyword: string; yearFrom: string; yearTo: string } | null>(null);
  const [rawSearchResults, setRawSearchResults] = useState<OpenSearchTextResultItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const scrapIds = rawSearchResults?.map(r => r.id) ?? [];
  const { data: scrappedIds = new Set<string>() } = useQuery({
    queryKey: ['scrap-batch', scrapIds],
    queryFn: () => checkScrapBatch(scrapIds),
    select: (data) => new Set(data),
    enabled: isLoggedIn && scrapIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders-paid'],
    queryFn: () => getPayments({ status: 'paid', per_page: 100 }),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const purchasedIds = useMemo(() => {
    const ids = new Set<string>();
    const paidOrders = ordersData?.success ? ordersData.orders.data : [];
    paidOrders.forEach((order) => {
      const items = (order as any).metadata?.items as { publication_id?: string }[] ?? [];
      items.forEach((item) => { if (item.publication_id) ids.add(item.publication_id); });
    });
    return ids;
  }, [ordersData]);

  const { bulkCartLoading, bulkScrapLoading, handleBulkBuy, handleBulkScrap } =
    useBulkActions(selectedIds, rawSearchResults ?? [], scrapIds, isLoggedIn);

  const cartMutation = useMutation({
    mutationFn: async (resultId: string) => { await addToCart({ publication_id: resultId }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cart'] }); alert('장바구니에 추가되었습니다.'); },
    onError: (err) => alert(err instanceof Error ? err.message : '장바구니 추가에 실패했습니다.'),
  });

  const buyNowMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const result = rawSearchResults?.find(r => r.id === resultId);
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

  const handleScrapToggle = () => {
    queryClient.invalidateQueries({ queryKey: ['scrap-batch', scrapIds] });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === (rawSearchResults?.length ?? 0)) setSelectedIds(new Set());
    else setSelectedIds(new Set(rawSearchResults?.map(r => r.id) ?? []));
  };

  const executeSearch = async (keyword: string, yearFrom: string, yearTo: string, page: number, sort?: 'relevance' | 'latest', size?: number) => {
    if (!venue) return;
    setSearchLoading(true);
    setSelectedIds(new Set());
    const perPage = size ?? itemsPerPage;
    try {
      const res = await osSearchText({
        query: keyword,
        filters: {
          journal: venue.name,
          ...(yearFrom || yearTo ? {
            year: {
              ...(yearFrom ? { gte: parseInt(yearFrom) } : {}),
              ...(yearTo ? { lte: parseInt(yearTo) } : {}),
            },
          } : {}),
        },
        limit: perPage,
        offset: (page - 1) * perPage,
        sort: sort ?? detailedSort,
      });
      setRawSearchResults(res.results ?? []);
      setSearchTotal(res.total ?? res.count ?? 0);
      setSearchPage(page);
    } catch {
      setRawSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (keyword: string, yearFrom: string, yearTo: string) => {
    setSearchKeyword(keyword);
    setSearchYearFrom(yearFrom);
    setSearchYearTo(yearTo);
    setLastSearchParams({ keyword, yearFrom, yearTo });
    await executeSearch(keyword, yearFrom, yearTo, 1);
  };

  const goToSearchPage = (page: number) => {
    if (!lastSearchParams) return;
    executeSearch(lastSearchParams.keyword, lastSearchParams.yearFrom, lastSearchParams.yearTo, page);
  };

  const handleSearchReset = () => {
    setSearchKeyword('');
    setSearchYearFrom('');
    setSearchYearTo('');
    setSearchPage(1);
    setLastSearchParams({ keyword: '', yearFrom: '', yearTo: '' });
    executeSearch('', '', '', 1);
  };

  const handleSortChange = (sort: 'relevance' | 'latest') => {
    setDetailedSort(sort);
    if (!lastSearchParams) return;
    executeSearch(lastSearchParams.keyword, lastSearchParams.yearFrom, lastSearchParams.yearTo, 1, sort);
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    if (!lastSearchParams) return;
    executeSearch(lastSearchParams.keyword, lastSearchParams.yearFrom, lastSearchParams.yearTo, 1, undefined, size);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE_URL}/api/venues/${id}`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        setVenue(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!venue) return;
    const params = { keyword: '', yearFrom: '', yearTo: '' };
    setLastSearchParams(params);
    executeSearch('', '', '', 1);
  }, [venue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full" style={{ minHeight: 400 }}>
        <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontSize: 17, color: '#464C53' }}>
          불러오는 중...
        </span>
      </div>
    );
  }

  if (error || !venue) {
    const is404 = error === '404';
    return (
      <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: 500, padding: '80px 16px' }}>
        <div
          className="flex flex-col items-center text-center"
          style={{ maxWidth: 480 }}
        >
          <div
            className="flex items-center justify-center rounded-full mb-6"
            style={{ width: 80, height: 80, background: '#F4F5F6' }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16 16-7.163 16-16S28.837 4 20 4zm0 24a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm1-8a1 1 0 01-2 0v-8a1 1 0 012 0v8z" fill="#8A949E" />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "'Pretendard GOV', sans-serif",
              fontWeight: 700,
              fontSize: 24,
              lineHeight: '150%',
              color: '#1A1E27',
              margin: '0 0 12px',
            }}
          >
            {is404 ? '저널을 찾을 수 없습니다' : '데이터를 불러올 수 없습니다'}
          </p>
          <p
            style={{
              fontFamily: "'Pretendard GOV', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              lineHeight: '150%',
              color: '#8A949E',
              margin: '0 0 32px',
            }}
          >
            {is404
              ? '요청하신 저널 정보가 존재하지 않거나 삭제되었습니다.'
              : '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              style={{
                height: 44,
                padding: '0 24px',
                background: '#F4F5F6',
                border: 'none',
                borderRadius: 6,
                fontFamily: "'Pretendard GOV', sans-serif",
                fontWeight: 400,
                fontSize: 15,
                color: '#464C53',
                cursor: 'pointer',
              }}
            >
              이전 페이지
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                height: 44,
                padding: '0 24px',
                background: '#256EF4',
                border: 'none',
                borderRadius: 6,
                fontFamily: "'Pretendard GOV', sans-serif",
                fontWeight: 400,
                fontSize: 15,
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: '총 논문 수', value: venue.metrics?.papers_count?.toLocaleString() ?? '-' },
    { label: '발행 권수', value: venue.metrics?.volumes_count?.toLocaleString() ?? '-' },
    { label: '발행 연수', value: venue.metrics?.active_years?.toLocaleString() ?? '-' },
  ];

  const pissn = venue.pissn ?? venue.settings?.pissn;
  const eissn = venue.eissn ?? venue.settings?.eissn;

  const infoRows: [string, string | undefined][] = [
    ['발행기관', venue.provider?.name],
    ['ISSN', pissn],
    ['발행주기', venue.frequency_label],
    ['eISSN', eissn],
    ['KCI 영향력지수', venue.kci?.impact_factor?.toLocaleString()],
    ['KCI 논문수', venue.kci?.paper_count?.toLocaleString()],
    ['KCI 피인용횟수', venue.kci?.citation_count?.toLocaleString()],
  ];

  return (
    <div className="flex flex-col items-center w-full bg-white">
      {/* ── Hero Section ── */}
      <section
        className="w-full flex flex-col items-center"
        style={{ background: '#323856', padding: '32px 0' }}
      >
        <div className="w-full" style={{ maxWidth: 1280, padding: '0 16px' }}>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 mb-4">
            <span className="flex items-center gap-1 px-1 rounded">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.6L2 6.4V14h4.5v-4h3v4H14V6.4L8 1.6z" fill="#F4F5F6" />
              </svg>
              <span
                className="underline"
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontSize: 15,
                  lineHeight: '150%',
                  color: '#F4F5F6',
                }}
              >
                홈
              </span>
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#F4F5F6" strokeWidth="1.5" />
            </svg>
            <span
              className="underline px-1"
              style={{
                fontFamily: "'Pretendard GOV', sans-serif",
                fontSize: 15,
                lineHeight: '150%',
                color: '#F4F5F6',
              }}
            >
              저널 메인
            </span>
          </nav>

          {/* Journal Info Row */}
          <div className="flex items-start gap-[60px]">
            {/* Cover placeholder */}
            <div
              className="flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center"
              style={{ width: 160, height: 221, background: '#F4F5F6', borderRadius: 6 }}
            >
              {venue?.cover_url ? (
                <img
                  src={venue.cover_url?.startsWith('http') ? venue.cover_url : `${API_BASE_URL}${venue.cover_url ?? ''}`}
                  alt="저널 커버"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-3">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-2">
                    <rect x="8" y="4" width="32" height="40" rx="3" stroke="#B1B8BE" strokeWidth="2" />
                    <line x1="14" y1="14" x2="34" y2="14" stroke="#B1B8BE" strokeWidth="2" />
                    <line x1="14" y1="20" x2="30" y2="20" stroke="#B1B8BE" strokeWidth="2" />
                    <line x1="14" y1="26" x2="26" y2="26" stroke="#B1B8BE" strokeWidth="2" />
                  </svg>
                  <span style={{ fontSize: 12, color: '#8A949E' }}>Journal Cover</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-8 flex-1">
              <div>
                <h1
                  style={{
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 700,
                    fontSize: 32,
                    lineHeight: '150%',
                    letterSpacing: '1px',
                    color: '#E6E8EA',
                    margin: 0,
                  }}
                >
                  {venue.name}
                </h1>
              </div>

              {/* Detail Grid */}
              <div
                className="grid gap-y-[2px]"
                style={{
                  gridTemplateColumns: '334px 334px',
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontSize: 15,
                  lineHeight: '150%',
                }}
              >
                {infoRows.map(([label, value], i) => (
                  <div key={i} className="flex items-start">
                    <span style={{ minWidth: 140, color: '#F4F5F6', fontWeight: 400 }}>{label}</span>
                    <span style={{ color: '#F4F5F6', fontWeight: 600 }}>{value ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col justify-end gap-[10px] flex-shrink-0"
              style={{ width: 300, alignSelf: 'stretch' }}
            >
              {venue.submission_url && (
                <a
                  href={/^https?:\/\//i.test(venue.submission_url) ? venue.submission_url : `https://${venue.submission_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: 48,
                    background: '#256EF4',
                    borderRadius: 6,
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 17,
                    lineHeight: '150%',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  논문 투고하기
                </a>
              )}
              {venue.provider?.website_url && (
                <a
                  href={/^https?:\/\//i.test(venue.provider.website_url) ? venue.provider.website_url : `https://${venue.provider.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: 48,
                    background: '#ECF2FE',
                    border: '1px solid #256EF4',
                    borderRadius: 6,
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 17,
                    lineHeight: '150%',
                    color: '#0B50D0',
                    textDecoration: 'none',
                  }}
                >
                  저널 홈페이지 방문
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Articles + Sidebar Section ── */}
      <section
        className="w-full flex justify-center"
        style={{ borderTop: '1px solid #D8E5FD', padding: '64px 0' }}
      >
        <div
          className="flex gap-20"
          style={{ maxWidth: 1280, width: '100%', padding: '0 16px' }}
        >
          {/* Sidebar */}
          <JournalFilterSidebar
            venueName={venue.name}
            submissionUrl={venue.submission_url}
            onSearch={(keyword, yearFrom, yearTo) => handleSearch(keyword, yearFrom, yearTo)}
            onReset={handleSearchReset}
          />

          {/* Articles */}
          <div
            className="flex flex-col flex-1"
            style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4E7EA', padding: '20px 24px' }}
          >
            <SearchControlBar
              searchResults={rawSearchResults ?? []}
              totalResults={searchTotal}
              selectedIds={selectedIds}
              detailedSort={detailedSort}
              itemsPerPage={itemsPerPage}
              bulkScrapLoading={bulkScrapLoading}
              bulkCartLoading={bulkCartLoading}
              onSelectAll={handleSelectAll}
              onBulkScrap={handleBulkScrap}
              onBulkBuy={handleBulkBuy}
              onSortChange={handleSortChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />

            {searchLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: "'Pretendard GOV', sans-serif", fontSize: 15, color: '#8A949E' }}>
                검색 중...
              </div>
            ) : rawSearchResults === null ? null : rawSearchResults.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: "'Pretendard GOV', sans-serif", fontSize: 15, color: '#8A949E' }}>
                검색 결과가 없습니다.
              </div>
            ) : (
              <div>
                {rawSearchResults.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    isLoggedIn={isLoggedIn}
                    isSelected={selectedIds.has(result.id)}
                    onToggleSelect={(e) => {
                      e.stopPropagation();
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.has(result.id) ? next.delete(result.id) : next.add(result.id);
                        return next;
                      });
                    }}
                    cartLoading={cartMutation.isPending && cartMutation.variables === result.id}
                    buyLoading={buyNowMutation.isPending && buyNowMutation.variables === result.id}
                    highlightTerms={searchKeyword ? [searchKeyword] : []}
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
              currentPage={searchPage}
              totalPages={Math.ceil(searchTotal / itemsPerPage)}
              totalResults={searchTotal}
              isLoading={searchLoading}
              hasError={false}
              onGoToPage={goToSearchPage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
