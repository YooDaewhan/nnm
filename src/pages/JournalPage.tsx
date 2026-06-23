import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, fixImageUrl } from '../api/client';
import JournalFilterSidebar from '@/components/JournalFilterSidebar';
import { OpenSearchTextResultItem, searchOpensearchText } from '@/api/search';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SearchControlBar } from '@/components/search/SearchControlBar';
import { FloatingActionBar } from '@/components/search/FloatingActionBar';
import { SearchPagination } from '@/components/search/SearchPagination';
import { JournalTabs } from '@/components/JournalTabs';
import { isAuthenticated } from '@/lib/auth';
import { getPublicationsStatus } from '@/api/scraps';
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const nameParam = useMemo(() => new URLSearchParams(location.search).get('name'), [location.search]);
  const validId = id && id !== '0' && id !== 'undefined' && id !== 'null' ? id : undefined;
  const isLoggedIn = isAuthenticated();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [detailedSort, setDetailedSort] = useState<'relevance' | 'latest'>('latest');
  const [activeTab, setActiveTab] = useState<'recent' | 'top10'>('recent');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState<{ keyword: string; yearFrom: string; yearTo: string } | null>(null);
  const [rawSearchResults, setRawSearchResults] = useState<OpenSearchTextResultItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mobileWithin, setMobileWithin] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const scrapIds = rawSearchResults?.map(r => r.id) ?? [];
  const { data: publicationsStatus = {} } = useQuery({
    queryKey: ['publications-status', scrapIds],
    queryFn: () => getPublicationsStatus(scrapIds),
    enabled: isLoggedIn && scrapIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const scrappedIds = useMemo(() => new Set(Object.entries(publicationsStatus).filter(([, s]) => s.scrapped).map(([id]) => id)), [publicationsStatus]);
  const cartIds = useMemo(() => new Set(Object.entries(publicationsStatus).filter(([, s]) => s.in_cart).map(([id]) => id)), [publicationsStatus]);
  const purchasedIds = useMemo(() => new Set(Object.entries(publicationsStatus).filter(([, s]) => s.purchased).map(([id]) => id)), [publicationsStatus]);

  const { bulkCartLoading, bulkScrapLoading, handleBulkBuy, handleBulkScrap } =
    useBulkActions(selectedIds, rawSearchResults ?? [], scrapIds, isLoggedIn);

  const handleCartToggle = () => {
    queryClient.invalidateQueries({ queryKey: ['publications-status', scrapIds] });
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  };

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

  const handleBuyNow = (e: React.MouseEvent, resultId: string) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    buyNowMutation.mutate(resultId);
  };

  const handleScrapToggle = () => {
    queryClient.invalidateQueries({ queryKey: ['publications-status', scrapIds] });
    queryClient.invalidateQueries({ queryKey: ['scraps'] });
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
      const res = await searchOpensearchText({
        query: keyword.trim() || venue.name,
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

  const handleSearch = async (keyword: string, yearFrom: string, yearTo: string, _yearLabel?: string) => {
    setSearchKeyword(keyword);
    setLastSearchParams({ keyword, yearFrom, yearTo });
    await executeSearch(keyword, yearFrom, yearTo, 1);
  };

  const goToSearchPage = (page: number) => {
    if (!lastSearchParams) return;
    executeSearch(lastSearchParams.keyword, lastSearchParams.yearFrom, lastSearchParams.yearTo, page);
  };

  const handleSearchReset = () => {
    setSearchKeyword('');
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
    if (!validId && !nameParam) {
      setLoading(false);
      setError('404');
      return;
    }
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const fetchByName = (name: string) => {
      fetch(`${API_BASE_URL}/api/venues?name=${encodeURIComponent(name)}&per_page=100`, { headers })
        .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
        .then((data) => {
          const list: VenueDetail[] = Array.isArray(data) ? data : (data.data ?? []);
          const match = list.find((v: VenueDetail) => v.name?.toLowerCase() === name.toLowerCase());
          if (match) setVenue(match); else setError('404');
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    };
    if (validId) {
      fetch(`${API_BASE_URL}/api/venues/${validId}`, { headers })
        .then(async (res) => {
          if (res.status === 404 && nameParam) { fetchByName(nameParam); return; }
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json();
          setVenue(data);
          setLoading(false);
        })
        .catch((e) => { setError(e.message); setLoading(false); });
    } else if (nameParam) {
      fetchByName(nameParam);
    }
  }, [validId, nameParam]);

  useEffect(() => {
    if (!venue) return;
    setLastSearchParams({ keyword: '', yearFrom: '', yearTo: '' });
    executeSearch('', '', '', 1);
  }, [venue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full" style={{ minHeight: 400 }}>
        <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontSize: 17, color: '#464C53' }}>불러오는 중...</span>
      </div>
    );
  }

  if (error || !venue) {
    const is404 = error === '404';
    return (
      <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: 500, padding: '80px 16px' }}>
        <div className="flex flex-col items-center text-center" style={{ maxWidth: 480 }}>
          <div className="flex items-center justify-center rounded-full mb-6" style={{ width: 80, height: 80, background: '#F4F5F6' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16 16-7.163 16-16S28.837 4 20 4zm0 24a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm1-8a1 1 0 01-2 0v-8a1 1 0 012 0v8z" fill="#8A949E" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 24, lineHeight: '150%', color: '#1A1E27', margin: '0 0 12px' }}>
            {is404 ? '저널을 찾을 수 없습니다' : '데이터를 불러올 수 없습니다'}
          </p>
          <p style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 15, lineHeight: '150%', color: '#8A949E', margin: '0 0 32px' }}>
            {is404 ? '요청하신 저널 정보가 존재하지 않거나 삭제되었습니다.' : '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} style={{ height: 44, padding: '0 24px', background: '#F4F5F6', border: 'none', borderRadius: 6, fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 15, color: '#464C53', cursor: 'pointer' }}>이전 페이지</button>
            <button onClick={() => navigate('/')} style={{ height: 44, padding: '0 24px', background: '#256EF4', border: 'none', borderRadius: 6, fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 15, color: '#FFFFFF', cursor: 'pointer' }}>홈으로 이동</button>
          </div>
        </div>
      </div>
    );
  }

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

  const mobileInfoRows: [string, string | undefined][] = [
    ['자료유형', venue.type],
    ['발행기간', venue.settings?.published_since_year ? `${venue.settings.published_since_year} ~ ${new Date().getFullYear()}` : undefined],
    ['발행기관명', venue.provider?.name],
    ['발행주기', venue.frequency_label],
    ['등재정보', venue.settings?.kci ? 'KCI등재' : undefined],
    ['ISSN', pissn],
  ];

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

  const CoverImg = ({ width, height }: { width: number; height: number }) => (
    <div style={{ flexShrink: 0, width, height, borderRadius: 6, overflow: 'hidden', background: '#F4F5F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {venue?.cover_url ? (
        <img
          src={venue.cover_url?.startsWith('http') ? fixImageUrl(venue.cover_url)! : `${API_BASE_URL}${venue.cover_url ?? ''}`}
          alt="저널 커버"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
          <svg width={Math.min(48, width - 16)} height={Math.min(48, height - 16)} viewBox="0 0 48 48" fill="none">
            <rect x="8" y="4" width="32" height="40" rx="3" stroke="#B1B8BE" strokeWidth="2" />
            <line x1="14" y1="14" x2="34" y2="14" stroke="#B1B8BE" strokeWidth="2" />
            <line x1="14" y1="20" x2="30" y2="20" stroke="#B1B8BE" strokeWidth="2" />
            <line x1="14" y1="26" x2="26" y2="26" stroke="#B1B8BE" strokeWidth="2" />
          </svg>
        </div>
      )}
    </div>
  );

  const ResultList = () => (
    <>
      {searchLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : rawSearchResults === null ? null : rawSearchResults.length === 0 ? (
        <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4 md:gap-0">
          {rawSearchResults.map((result) => (
            <SearchResultCard
              key={result.id}
              result={result}
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
              buyLoading={buyNowMutation.isPending && buyNowMutation.variables === result.id}
              highlightTerms={searchKeyword ? [searchKeyword] : []}
              isScraped={scrappedIds.has(result.id)}
              onScrapToggle={handleScrapToggle}
              isPurchased={purchasedIds.has(result.id)}
              isInCart={cartIds.has(result.id)}
              onCartToggle={handleCartToggle}
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
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFC]">

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section style={{ background: '#323856', padding: '32px 0', width: '100%' }}>

        {/* ── 데스크탑 Hero ── */}
        <div className="hidden md:block" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <nav className="flex items-center gap-1 mb-4">
            <span className="flex items-center gap-1 px-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.6L2 6.4V14h4.5v-4h3v4H14V6.4L8 1.6z" fill="#F4F5F6" /></svg>
              <span style={{ textDecoration: 'underline', fontFamily: "'Pretendard GOV', sans-serif", fontSize: 15, color: '#F4F5F6' }}>홈</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#F4F5F6" strokeWidth="1.5" /></svg>
            <span style={{ textDecoration: 'underline', padding: '0 4px', fontFamily: "'Pretendard GOV', sans-serif", fontSize: 15, color: '#F4F5F6' }}>저널 메인</span>
          </nav>
          <div className="flex items-start" style={{ gap: 60 }}>
            <CoverImg width={160} height={221} />
            <div className="flex flex-col flex-1" style={{ gap: 32 }}>
              <h1 style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 32, lineHeight: '150%', letterSpacing: '1px', color: '#E6E8EA', margin: 0 }}>{venue.name}</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '334px 334px', rowGap: 2, fontFamily: "'Pretendard GOV', sans-serif", fontSize: 15, lineHeight: '150%' }}>
                {infoRows.map(([label, value], i) => (
                  <div key={i} className="flex items-start">
                    <span style={{ minWidth: 140, color: '#F4F5F6', fontWeight: 400 }}>{label}</span>
                    <span style={{ color: '#F4F5F6', fontWeight: 600 }}>{value ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col flex-shrink-0" style={{ width: 300, alignSelf: 'stretch', justifyContent: 'flex-end', gap: 10 }}>
              <a href={venue.submission_url ? (/^https?:\/\//i.test(venue.submission_url) ? venue.submission_url : `https://${venue.submission_url}`) : '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!venue.submission_url) e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 48, background: '#256EF4', borderRadius: 6, fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 17, color: '#FFFFFF', textDecoration: 'none', opacity: venue.submission_url ? 1 : 0.4, pointerEvents: venue.submission_url ? 'auto' : 'none', boxSizing: 'border-box' }}>논문 투고하기</a>
              <a href={venue.provider?.website_url ? (/^https?:\/\//i.test(venue.provider.website_url) ? venue.provider.website_url : `https://${venue.provider.website_url}`) : '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!venue.provider?.website_url) e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 48, background: '#ECF2FE', border: '1px solid #256EF4', borderRadius: 6, fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 17, color: '#0B50D0', textDecoration: 'none', boxSizing: 'border-box', opacity: venue.provider?.website_url ? 1 : 0.4, pointerEvents: venue.provider?.website_url ? 'auto' : 'none' }}>저널 홈페이지 방문</a>
            </div>
          </div>
        </div>

        {/* ── 모바일 Hero ── */}
        <div className="flex md:hidden flex-col" style={{ gap: 16, padding: '0 16px' }}>
          {/* 커버 + 정보 */}
          <div className="flex items-start" style={{ gap: 24 }}>
            <CoverImg width={100} height={138} />
            <div className="flex flex-col flex-1" style={{ gap: 16, minWidth: 0 }}>
              <div>
                <h1 style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 24, lineHeight: '150%', color: '#E6E8EA', margin: 0, wordBreak: 'keep-all' }}>{venue.name}</h1>
                {venue.abbr && <p style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 15, lineHeight: '150%', color: '#E6E8EA', margin: 0, wordBreak: 'break-all' }}>{venue.abbr}</p>}
              </div>
              <div className="flex flex-col">
                {mobileInfoRows.map(([label, value], i) =>
                  value ? (
                    <div key={i} className="flex" style={{ alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 15, lineHeight: '150%', color: '#F4F5F6', minWidth: 90, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 600, fontSize: 15, lineHeight: '150%', color: '#F4F5F6' }}>{value}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>
          {/* CTA 버튼 */}
          <div className="flex" style={{ gap: 10 }}>
            <a href={venue.submission_url ? (/^https?:\/\//i.test(venue.submission_url) ? venue.submission_url : `https://${venue.submission_url}`) : '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!venue.submission_url) e.preventDefault(); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, background: '#256EF4', borderRadius: 6, fontFamily: "'Pretendard GOV', sans-serif", fontSize: 17, color: '#FFFFFF', textDecoration: 'none', opacity: venue.submission_url ? 1 : 0.4, pointerEvents: venue.submission_url ? 'auto' : 'none', boxSizing: 'border-box', textAlign: 'center' }}>e-Submission</a>
            <a href={venue.provider?.website_url ? (/^https?:\/\//i.test(venue.provider.website_url) ? venue.provider.website_url : `https://${venue.provider.website_url}`) : '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!venue.provider?.website_url) e.preventDefault(); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, background: '#ECF2FE', border: '1px solid #256EF4', borderRadius: 6, fontFamily: "'Pretendard GOV', sans-serif", fontSize: 17, color: '#0B50D0', textDecoration: 'none', boxSizing: 'border-box', opacity: venue.provider?.website_url ? 1 : 0.4, pointerEvents: venue.provider?.website_url ? 'auto' : 'none', textAlign: 'center' }}>Guideline</a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════ */}
      <main className="max-w-[1280px] mx-auto px-4 pt-6 pb-14 md:py-10">

        {/* ── 모바일 전용: main_menu 바 ── */}
        <div className="flex md:hidden items-center" style={{ gap: 16, marginBottom: 16, padding: '0 0 16px', borderBottom: '1px solid #CDD1D5' }}>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} aria-label="메뉴">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <line x1="3" y1="6" x2="23" y2="6" stroke="#1E2124" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="13" x2="23" y2="13" stroke="#1E2124" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="20" x2="23" y2="20" stroke="#1E2124" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 600, fontSize: 19, lineHeight: '150%', color: '#1E2124' }}>저널 홈</span>
        </div>

        {/* ── 모바일 전용: 결과 내 검색 아코디언 (SearchPage 패턴 동일) ── */}
        <div className="md:hidden w-full" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
            <span style={{ flex: 1, fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#1E2124' }}>결과 내 검색</span>
            <button
              onClick={() => setMobileFilterOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 2px', height: 20, background: 'none', border: 'none', fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 400, fontSize: 15, color: '#1E2124', cursor: 'pointer' }}
            >
              {mobileFilterOpen ? '필터닫기' : '필터열기'}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3.5h12M4.5 8h7M6.5 12.5h3" stroke="#464C53" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {mobileFilterOpen && (
            <div style={{ padding: '4px 0 24px' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const kw = mobileWithin.trim();
                  if (!kw) return;
                  handleSearch(kw, lastSearchParams?.yearFrom ?? '', lastSearchParams?.yearTo ?? '');
                  setMobileWithin('');
                  setMobileFilterOpen(false);
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
          <div style={{ borderTop: '1px solid #CDD1D5' }} />
        </div>

        <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start">

          {/* ── 데스크탑 전용: 사이드바 ── */}
          <div className="hidden md:block md:sticky top-24 md:self-start">
            <JournalFilterSidebar
              venueName={venue.name}
              submissionUrl={venue.submission_url}
              onSearch={(keyword, yearFrom, yearTo, yearLabel) => handleSearch(keyword, yearFrom, yearTo, yearLabel)}
              onReset={handleSearchReset}
            />
          </div>

          {/* ── 검색 결과 영역 ── */}
          <div className="w-full md:flex-1 md:min-w-0 flex flex-col md:gap-4">

            {/* 탭 — 데스크탑에서는 카드 바깥 위쪽에 위치 */}
            <JournalTabs
              activeTab={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                handleSortChange(tab === 'recent' ? 'latest' : 'relevance');
              }}
            />

            {/* 결과 카드 */}
            <div className="md:overflow-hidden md:bg-white md:rounded-xl md:border md:border-[#E4E7EA] md:px-6 md:py-5">

              {/* 데스크탑: SearchControlBar */}
              <div className="hidden md:block">
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
              </div>

              {/* 모바일: list-head (SearchPage 패턴 동일) */}
              <div className="flex md:hidden items-center justify-between" style={{ margin: '16px 0' }}>
                <div className="flex items-center" style={{ gap: 4 }}>
                  <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#464C53' }}>검색 결과</span>
                  <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#0B50D0' }}>{searchTotal.toLocaleString()}</span>
                  <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontWeight: 700, fontSize: 17, lineHeight: '150%', color: '#464C53' }}>건</span>
                </div>
                <div className="flex items-center" style={{ gap: 8 }}>
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

              <ResultList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
