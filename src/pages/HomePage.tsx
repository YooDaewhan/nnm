import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DetailedSearchCondition } from '@/api/search';
import { customFetch, API_BASE_URL } from '@/api/client';

/* ───────────────────────────────────────────
   반응형 훅
   ─────────────────────────────────────────── */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

/* ───────────────────────────────────────────
   API 타입
   ─────────────────────────────────────────── */
type ApiAuthor = { name?: string; author_name?: string } | string;

type ApiJournal = {
  title?: string;
  name?: string;
  journal_name?: string;
  accreditation?: string;
  kci_status?: string;
} | string;

type ApiPaper = {
  id: number | string;
  title: string;
  abstract?: string;
  authors?: ApiAuthor[] | string;
  author?: string;
  authors_raw?: string;
  journal?: ApiJournal;
  journal_title?: string;
  venue_name?: string;
  venue_abbr?: string;
  venue_type?: string;
  volume?: string | number;
  issue?: string | number;
  year?: number;
  view_count?: number;
  download_count?: number;
  published_at?: string;
  accreditation?: string;
  kci_status?: string;
};

type ApiCategoryData = Record<string, ApiPaper[]>;

/* 응답이 어떤 형태여도 papers 배열만 추출 */
function extractPapersArray(v: unknown): ApiPaper[] {
  if (Array.isArray(v)) return v as ApiPaper[];
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (Array.isArray(obj.papers)) return obj.papers as ApiPaper[];
    if (Array.isArray(obj.data)) return obj.data as ApiPaper[];
    if (Array.isArray(obj.items)) return obj.items as ApiPaper[];
    if (Array.isArray(obj.results)) return obj.results as ApiPaper[];
  }
  return [];
}

const PAPER_ARRAY_KEYS = new Set(['papers', 'data', 'items', 'results']);

/* API 응답 형태 무관하게 있는 데이터 전부 추출 */
function normalizeCategoryData(raw: unknown): ApiCategoryData {
  if (!raw) return {};

  // 배열 스타일: [{ name_ko: '심리학', papers: [...] }, ...]
  if (Array.isArray(raw)) {
    const out: ApiCategoryData = {};
    raw.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const obj = item as Record<string, unknown>;
      const papers = extractPapersArray(obj);

      // 알려진 이름 키를 우선 시도, 그 다음 어떤 문자열 값이든 사용
      const knownName =
        (obj.name_ko as string | undefined) ??
        (obj.category as string | undefined) ??
        (obj.name as string | undefined) ??
        (obj.title as string | undefined) ??
        (obj.category_name as string | undefined) ??
        (obj.type as string | undefined);

      const fallbackName =
        knownName ??
        (Object.entries(obj).find(([k, v]) => !PAPER_ARRAY_KEYS.has(k) && typeof v === 'string')?.[1] as string | undefined) ??
        `카테고리 ${idx + 1}`;

      out[fallbackName] = papers;
    });
    return out;
  }

  // 객체 스타일: { 심리학: [...] 또는 { papers: [...] } }
  if (typeof raw === 'object') {
    const out: ApiCategoryData = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      out[key] = extractPapersArray(value);
    }
    return out;
  }

  return {};
}

const POPULAR_KEYWORDS = [
  '인공지능', '기후변화', '우울증', '메타버스', '빅데이터',
  '자기효능감', '사회적 자본', '치매', '코로나19', '학업성취도',
  '인지행동치료', '장기요양', '다문화교육', '플립드러닝',
];

/* ───────────────────────────────────────────
   API Paper → UI Paper 어댑터
   ─────────────────────────────────────────── */
type Paper = {
  id: number | string;
  title: string;
  abstract: string;
  author: string;
  journal: string;
  volume: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
};

/* Figma badge: KCI등재 → bg #ECF2FE, text #0B50D0 */
function getBadgeInfo(paper: ApiPaper): { badge: string; badgeColor: string; badgeBg: string } {
  if (paper.venue_type) {
    return { badge: paper.venue_type, badgeColor: '#0B50D0', badgeBg: '#ECF2FE' };
  }

  const raw = (
    paper.accreditation ??
    paper.kci_status ??
    (typeof paper.journal === 'object' ? (paper.journal?.accreditation ?? paper.journal?.kci_status) : undefined) ??
    ''
  ).toLowerCase();

  if (raw.includes('후보')) return { badge: '등재후보', badgeColor: '#DC2626', badgeBg: '#FEF2F2' };
  if (raw.includes('등재') || raw.includes('kci')) return { badge: 'KCI등재', badgeColor: '#0B50D0', badgeBg: '#ECF2FE' };
  if (raw.includes('정보')) return { badge: '등재정보', badgeColor: '#16A34A', badgeBg: '#EEFBF3' };
  return { badge: 'KCI등재', badgeColor: '#0B50D0', badgeBg: '#ECF2FE' };
}

function resolveAuthor(paper: ApiPaper): string {
  if (paper.author) return paper.author;

  // authors_raw: "이봉희" 또는 "박선영,김선희"
  if (paper.authors_raw) {
    const names = paper.authors_raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return paper.authors_raw;
    if (names.length === 1) return names[0];
    return `${names[0]} 외 ${names.length - 1}명`;
  }

  if (!paper.authors) return '';
  if (typeof paper.authors === 'string') return paper.authors;
  const names = paper.authors.map((a) =>
    typeof a === 'string' ? a : (a.name ?? a.author_name ?? '')
  ).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names[0]} 외 ${names.length - 1}명`;
}

function resolveJournal(paper: ApiPaper): string {
  if (paper.journal_title) return paper.journal_title;
  if (paper.venue_name) return paper.venue_name;
  if (!paper.journal) return '';
  if (typeof paper.journal === 'string') return paper.journal;
  return paper.journal.title ?? paper.journal.name ?? paper.journal.journal_name ?? '';
}

function resolveVolume(paper: ApiPaper): string {
  const v = paper.volume ? String(paper.volume) : '';
  const i = paper.issue ? String(paper.issue) : '';
  if (v && i) return `${v}(${i})`;
  if (v || i) return v || i;
  if (paper.year) return String(paper.year);
  return '';
}

function adaptPaper(p: ApiPaper): Paper {
  return {
    id: p.id,
    title: p.title ?? '',
    abstract: p.abstract ?? '',
    author: resolveAuthor(p),
    journal: resolveJournal(p),
    volume: resolveVolume(p),
    ...getBadgeInfo(p),
  };
}

type FeaturedVenue = {
  id?: number | string;
  name?: string;
  title?: string;
  publisher?: string;
  publisher_name?: string;
  cover_url?: string | null;
  total_views?: number;
};

function extractFeaturedVenues(raw: unknown): FeaturedVenue[] {
  if (Array.isArray(raw)) return raw as FeaturedVenue[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as FeaturedVenue[];
    if (Array.isArray(obj.venues)) return obj.venues as FeaturedVenue[];
    if (Array.isArray(obj.items)) return obj.items as FeaturedVenue[];
  }
  return [];
}

const ff = 'Pretendard GOV, Pretendard, sans-serif';

/* ───────────────────────────────────────────
   섹션 타이틀 (Figma: section_title)
   타이틀 32px Bold #1E2124 / 보조문 17px #464C53, gap 4px
   ─────────────────────────────────────────── */
function SectionTitle({ title, sub, isMobile }: { title: string; sub: string; isMobile: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h2
        style={{
          fontSize: isMobile ? 24 : 32,
          fontWeight: 700,
          color: '#1E2124',
          lineHeight: 1.5,
          letterSpacing: '0.03em',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: isMobile ? 15 : 17,
          color: '#464C53',
          fontWeight: 400,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

/* ───────────────────────────────────────────
   논문 카드 컴포넌트 (Figma: article_card)
   padding 24 / border 1px #CDD1D5 / radius 0 / gap 8
   ─────────────────────────────────────────── */
function PaperCard({ paper, isMobile }: { paper: Paper; isMobile: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/papers/${paper.id}`)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #CDD1D5',
        borderRadius: 0,
        padding: 24,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        minHeight: isMobile ? 'auto' : 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#9DA3AB';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#CDD1D5';
      }}
    >
      {/* row-1 : 뱃지 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 20,
            fontSize: 13,
            fontWeight: 400,
            color: paper.badgeColor,
            background: paper.badgeBg,
            borderRadius: 4,
            padding: '0 8px',
            lineHeight: 1.5,
          }}
        >
          {paper.badge}
        </span>
      </div>

      {/* row-2 : 제목 + 초록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p
          style={{
            fontSize: isMobile ? 15 : 17,
            fontWeight: 600,
            color: '#1E2124',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'keep-all',
          }}
        >
          {paper.title}
        </p>
        <p
          style={{
            fontSize: isMobile ? 13 : 15,
            color: '#464C53',
            fontWeight: 400,
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {paper.abstract}
        </p>
      </div>

      {/* row-3 : 저자 + 저널/권호 — 하단 고정 */}
      <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 15, color: '#464C53', fontWeight: 400, lineHeight: 1.5 }}>{paper.author}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 15, color: '#464C53', lineHeight: 1.5 }}>
          <span>{paper.journal}</span>
          {paper.journal && paper.volume && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M6 4L10 8L6 12" stroke="#8A949E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span>{paper.volume}</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   메인 컴포넌트
   ─────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const [selectedTab, setSelectedTab] = useState('');
  const [showDetailedSearch, setShowDetailedSearch] = useState(false);

  const { data: categoryData = {}, isLoading: papersLoading, isError: papersError } = useQuery<ApiCategoryData>({
    queryKey: ['home', 'popular-papers-by-category'],
    queryFn: async () => {
      const res = await customFetch<{ data: unknown; status: number }>(
        '/api/home/popular-papers-by-category?per_category=4'
      );
      const body = res.data as Record<string, unknown>;
      const rawCategories: unknown =
        (body && typeof body === 'object' && 'data' in body ? body.data : undefined) ??
        (body && typeof body === 'object' && 'categories' in body ? body.categories : undefined) ??
        body;
      return normalizeCategoryData(rawCategories);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedTab && Object.keys(categoryData).length > 0) {
      setSelectedTab(Object.keys(categoryData)[0]);
    }
  }, [categoryData, selectedTab]);

  const { data: featuredVenues = [], isLoading: venuesLoading } = useQuery<FeaturedVenue[]>({
    queryKey: ['home', 'featured-venues'],
    queryFn: async () => {
      const res = await customFetch<{ data: unknown }>('/api/home/featured-venues?limit=12');
      return extractFeaturedVenues((res.data as Record<string, unknown>)?.data ?? res.data);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [conditions, setConditions] = useState<DetailedSearchCondition[]>([
    { field: 'title', keyword: '', operator: 'AND' },
  ]);

  const [venueSlideIndex, setVenueSlideIndex] = useState(0);
  const [venueNoTransition, setVenueNoTransition] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
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

  const handleDetailedSearch = () => {
    const valid = conditions.filter(c => c.keyword.trim());
    if (valid.length === 0) return;
    const submittedState = { conditions: valid, sort: 'relevance' as const, filters: {} };
    sessionStorage.setItem('search_conditions', JSON.stringify(valid));
    sessionStorage.setItem('search_submitted', JSON.stringify(submittedState));
    navigate('/search');
  };

  const categoryTabs = Object.keys(categoryData);
  const rawPapers = categoryData[selectedTab];
  const displayedPapers = Array.isArray(rawPapers) ? rawPapers.map(adaptPaper) : [];

  return (
    <div style={{ fontFamily: ff, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', flex: 1, width: '100%', margin: 0, padding: 0 }}>

      {/* ════════════════════════════════════════
          1. HERO — 배경 이미지 + 타이틀 + 검색바
      ════════════════════════════════════════ */}
      <section
        style={{
          backgroundImage: 'url(/images/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: isMobile ? '0% 80%' : 'center center',
          position: 'relative',
          zIndex: 10,
          height: 400,
          display: 'flex',
          width: '100%',
        }}
      >
        <div
          style={{
            width: '100%',
            padding: '0 16px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* ── 타이틀 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
            <h1
              style={{
                fontSize: isMobile ? 28 : 48,
                fontWeight: 700,
                color: '#E6E8EA',
                margin: 0,
                lineHeight: 1.5,
                letterSpacing: '-0.0208em',
                whiteSpace: isMobile ? 'normal' : 'nowrap',
                wordBreak: 'keep-all',
              }}
            >
              빠르고 정확한 학술 문헌 검색 서비스
            </h1>
            <p
              style={{
                fontSize: isMobile ? 17 : 32,
                color: '#E6E8EA',
                margin: 0,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              신뢰할 수 있는 지식, 국내 연구의 기준
            </p>
          </div>

          {/* ── 검색 바 (Figma: search-box) ── */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 720, zIndex: 100 }}>
            <form onSubmit={handleSearch}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#FFFFFF',
                  border: '2px solid #1E2124',
                  borderRadius: 8,
                  width: '100%',
                  padding: isMobile ? '12px 16px' : '16px 24px',
                  boxSizing: 'border-box',
                }}
              >
                {/* search 영역 (scope + divider + 입력) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                  {/* scopefilter : 전체 ▾ */}
                  <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <select
                      value={searchScope}
                      onChange={(e) => setSearchScope(e.target.value)}
                      style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: isMobile ? 15 : 19,
                        color: '#1E2124',
                        fontFamily: ff,
                        cursor: 'pointer',
                        padding: '0 22px 0 4px',
                        lineHeight: 1.5,
                      }}
                    >
                      <option value="all">전체</option>
                      <option value="title">제목</option>
                      <option value="author">저자</option>
                      <option value="abstract">초록</option>
                      <option value="keyword">키워드</option>
                    </select>
                    <svg
                      width="20" height="20" viewBox="0 0 20 20" fill="none"
                      style={{ position: 'absolute', right: 0, pointerEvents: 'none' }}
                    >
                      <path d="M5 8L10 13L15 8" stroke="#1E2124" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* divider */}
                  <div style={{ width: 1, alignSelf: 'stretch', background: '#8A949E', flexShrink: 0 }} />

                  {/* keyword 입력 */}
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="검색어를 입력하세요"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: isMobile ? 15 : 19,
                      color: '#1E2124',
                      fontFamily: ff,
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* button 영역 (3-dots + 검색) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  {/* 상세검색 토글 (three-dots) */}
                  <button
                    type="button"
                    onClick={() => setShowDetailedSearch(v => !v)}
                    title="상세 검색"
                    style={{
                      width: 32,
                      height: 32,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      color: showDetailedSearch ? '#256EF4' : '#1E2124',
                      transition: 'color 0.15s',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="8" cy="16" r="2" fill="currentColor" />
                      <circle cx="16" cy="16" r="2" fill="currentColor" />
                      <circle cx="24" cy="16" r="2" fill="currentColor" />
                    </svg>
                  </button>
                  {/* 검색 버튼 */}
                  <button
                    type="submit"
                    title="검색"
                    style={{
                      width: 32,
                      height: 32,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      color: '#1E2124',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="14.5" cy="14.5" r="8.5" stroke="currentColor" strokeWidth="2.2" />
                      <line x1="20.8" y1="20.8" x2="27" y2="27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>

            {/* ── 상세 검색 팝업 ── */}
            {showDetailedSearch && (
              <>
                <div onClick={() => setShowDetailedSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                    background: '#FFFFFF', borderRadius: 12,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
                    padding: isMobile ? '16px 12px 12px' : '20px 20px 16px', zIndex: 9999,
                    minWidth: isMobile ? 'auto' : 480,
                    maxWidth: '100%',
                    boxSizing: 'border-box' as const,
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E2124', marginBottom: 12, fontFamily: ff }}>상세 검색 조건</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {conditions.map((cond, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: isMobile ? 4 : 6, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        {idx === 0 ? (
                          !isMobile && <div style={{ width: 68, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: isMobile ? 40 : 68, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#8A949E', letterSpacing: '0.08em' }}>AND</div>
                        )}
                        <select
                          value={cond.field}
                          onChange={(e) => updateCondition(idx, { field: e.target.value as DetailedSearchCondition['field'] })}
                          style={{ width: isMobile ? 64 : 80, height: 36, padding: '0 4px', border: '1px solid #CDD1D5', borderRadius: 6, fontSize: isMobile ? 12 : 13, color: '#1E2124', background: '#FFFFFF', flexShrink: 0, cursor: 'pointer', outline: 'none', fontFamily: ff }}
                        >
                          <option value="title">제목</option>
                          <option value="author">저자</option>
                          <option value="abstract">초록</option>
                          <option value="keyword">키워드</option>
                          <option value="full_text">전문</option>
                        </select>
                        <input
                          type="text" value={cond.keyword}
                          onChange={(e) => updateCondition(idx, { keyword: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleDetailedSearch(); }}
                          placeholder="검색어 입력"
                          style={{ flex: 1, minWidth: 0, height: 36, padding: '0 10px', border: '1px solid #CDD1D5', borderRadius: 6, fontSize: isMobile ? 12 : 13, color: '#1E2124', outline: 'none', fontFamily: ff }}
                        />
                        {idx > 0 ? (
                          <button onClick={() => removeCondition(idx)} style={{ width: 28, height: 36, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A949E', padding: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                          </button>
                        ) : <div style={{ width: isMobile ? 0 : 32, flexShrink: 0 }} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
                    {conditions.length < 10 && (
                      <button onClick={addCondition} style={{ height: 34, padding: '0 14px', fontSize: 13, fontWeight: 500, color: '#256EF4', background: '#EEF4FF', border: '1px solid #256EF4', borderRadius: 6, cursor: 'pointer', fontFamily: ff }}>+ 조건 추가</button>
                    )}
                    <button onClick={handleDetailedSearch} style={{ height: 34, padding: '0 18px', fontSize: 13, fontWeight: 600, color: '#FFFFFF', background: '#063A74', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: ff }}>
                      <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><circle cx="14.67" cy="14.67" r="8" stroke="white" strokeWidth="2.5" /><path d="M21.33 21.33L26.67 26.67" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
                      검색
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. 주제별 인기논문 — bg #F8FAFF
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F8FAFF', padding: '64px 0', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SectionTitle title="주제별 인기논문" sub="최근 7일, 분야별 핫한 논문들을 모았습니다." isMobile={isMobile} />

          {/* article : 탭 + 카드, gap 16 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 탭 (Shortcut__nnm) — gap 10 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {papersLoading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: isMobile ? 64 : 80,
                        height: 40,
                        borderRadius: 0,
                        background: '#F3F4F6',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  ))
                : categoryTabs.map((tab) => {
                    const isActive = selectedTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        style={{
                          height: 40,
                          padding: '0 16px',
                          borderRadius: 0,
                          border: isActive ? 'none' : '1px solid #CDD1D5',
                          background: isActive ? '#083891' : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : '#464C53',
                          fontSize: 17,
                          fontWeight: 400,
                          cursor: 'pointer',
                          fontFamily: ff,
                          transition: 'all 0.15s',
                          lineHeight: 1.5,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab}
                      </button>
                    );
                  })}
            </div>

            {/* 논문 카드 — 4열 (모바일 1열), gap 16 */}
            {papersError ? (
              <p style={{ color: '#8A949E', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
                데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
            ) : papersLoading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: 16,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 200,
                      background: '#F3F4F6',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: 16,
                }}
              >
                {displayedPapers.map((p) => (
                  <PaperCard key={p.id} paper={p} isMobile={isMobile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. 인기 검색 키워드 — bg 흰색
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '64px 0', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SectionTitle title="인기 검색 키워드" sub="다른 연구자들은 어떤 키워드에 주목하고 있을까요?" isMobile={isMobile} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {POPULAR_KEYWORDS.map((kw, i) => (
              <button
                key={i}
                onClick={() => { setQuery(kw); navigate(`/search?q=${encodeURIComponent(kw)}`); }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 1000,
                  border: 'none',
                  background: '#EFF2F5',
                  fontSize: 17,
                  fontWeight: 400,
                  color: '#052B57',
                  cursor: 'pointer',
                  fontFamily: ff,
                  transition: 'all 0.15s',
                  lineHeight: 1.5,
                }}
                onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = '#052B57'; b.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = '#EFF2F5'; b.style.color = '#052B57'; }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. 추천 저널 — bg #F8FAFF, 커버 180x250
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F8FAFF', padding: '64px 0', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <SectionTitle title="추천 저널" sub="가장 많이 읽힌 저널을 만나보세요." isMobile={isMobile} />

          {/* 저널 슬라이더 */}
          {venuesLoading ? (
            <div style={{ display: 'flex', gap: isMobile ? 12 : 24, overflow: 'hidden' }}>
              {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => {
                const itemsPerPage = isMobile ? 3 : 6;
                const gap = isMobile ? 12 : 24;
                return (
                  <div
                    key={i}
                    style={{
                      flexShrink: 0,
                      width: `calc((100% - ${(itemsPerPage - 1) * gap}px) / ${itemsPerPage})`,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '180 / 250',
                        background: '#F3F4F6',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.1}s`,
                        marginBottom: 16,
                      }}
                    />
                    <div style={{ height: 20, background: '#F3F4F6', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                    <div style={{ height: 16, background: '#F3F4F6', borderRadius: 4, width: '60%', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                  </div>
                );
              })}
            </div>
          ) : (() => {
            const gap = isMobile ? 12 : 24;
            const itemsPerPage = isMobile ? 3 : 6;
            const n = featuredVenues.length;
            const canScroll = n > itemsPerPage;
            const arrowSize = 40;
            const arrowOffset = isMobile ? -14 : -20;

            // 무한 순환을 위해 앞뒤에 itemsPerPage만큼 복제
            const clonedItems = canScroll
              ? [...featuredVenues.slice(-itemsPerPage), ...featuredVenues, ...featuredVenues.slice(0, itemsPerPage)]
              : featuredVenues;

            const displayIndex = canScroll ? venueSlideIndex + itemsPerPage : 0;

            const goLeft = () => {
              if (venueNoTransition) return;
              const next = venueSlideIndex - 1;
              setVenueSlideIndex(next);
              if (next < 0) {
                setTimeout(() => {
                  setVenueNoTransition(true);
                  setVenueSlideIndex(n - 1);
                  requestAnimationFrame(() => requestAnimationFrame(() => setVenueNoTransition(false)));
                }, 360);
              }
            };

            const goRight = () => {
              if (venueNoTransition) return;
              const next = venueSlideIndex + 1;
              setVenueSlideIndex(next);
              if (next >= n) {
                setTimeout(() => {
                  setVenueNoTransition(true);
                  setVenueSlideIndex(0);
                  requestAnimationFrame(() => requestAnimationFrame(() => setVenueNoTransition(false)));
                }, 360);
              }
            };

            const ArrowBtn = ({ dir }: { dir: 'left' | 'right' }) => (
              <button
                onClick={dir === 'left' ? goLeft : goRight}
                style={{
                  position: 'absolute',
                  [dir]: arrowOffset,
                  top: '40%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  width: arrowSize,
                  height: arrowSize,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid #CDD1D5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  {dir === 'left'
                    ? <path d="M15 5L8 12L15 19" stroke="#1E2124" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    : <path d="M9 5L16 12L9 19" stroke="#1E2124" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
              </button>
            );

            return (
              <div style={{ position: 'relative' }}>
                {canScroll && <ArrowBtn dir="left" />}
                {canScroll && <ArrowBtn dir="right" />}

                <div style={{ overflow: 'hidden' }}>
                  <div
                    className="predictive-smooth"
                    style={{
                      display: 'flex',
                      gap,
                      transform: `translateX(calc(-${displayIndex} * (100% + ${gap}px) / ${itemsPerPage}))`,
                      transition: venueNoTransition ? 'none' : 'transform 0.35s ease',
                      width: '100%',
                    }}
                  >
                    {clonedItems.map((venue, i) => {
                      const title = venue.name ?? venue.title ?? '';
                      const publisher = venue.publisher ?? venue.publisher_name ?? '';
                      const rawCoverUrl = venue.cover_url;
                      const coverUrl = rawCoverUrl
                        ? (rawCoverUrl.startsWith('http') ? rawCoverUrl : `${API_BASE_URL}${rawCoverUrl}`)
                        : null;
                      return (
                        <div
                          key={`${venue.id ?? i}-${i}`}
                          style={{
                            flexShrink: 0,
                            flexGrow: 0,
                            width: `calc((100% - ${(itemsPerPage - 1) * gap}px) / ${itemsPerPage})`,
                            minWidth: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                          onClick={() => venue.id && navigate(`/journal/${venue.id}`)}
                        >
                          {/* image 180x250 비율, border 1px #CDD1D5, radius 0 */}
                          <div
                            style={{
                              width: '100%',
                              aspectRatio: '180 / 250',
                              background: coverUrl ? 'transparent' : '#F3F4F5',
                              border: '1px solid #CDD1D5',
                              overflow: 'hidden',
                              marginBottom: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  (e.currentTarget.parentElement as HTMLElement).style.background = '#F3F4F5';
                                }}
                              />
                            ) : (
                              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <rect x="4" y="4" width="32" height="32" rx="2" stroke="#D1D5DB" strokeWidth="1" fill="none" />
                                <line x1="12" y1="12" x2="28" y2="28" stroke="#D1D5DB" strokeWidth="1" />
                                <line x1="28" y1="12" x2="12" y2="28" stroke="#D1D5DB" strokeWidth="1" />
                              </svg>
                            )}
                          </div>
                          {/* meta : title 17 SemiBold #1E2124 / publisher 15 #464C53 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600, color: '#1E2124', lineHeight: 1.5, margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {title}
                            </p>
                            <p style={{ fontSize: isMobile ? 13 : 15, color: '#464C53', fontWeight: 400, lineHeight: 1.5, margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {publisher}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. 학회통합관리시스템 SIMS — bg 흰색
      ════════════════════════════════════════ */}
      <SimsSection isMobile={isMobile} navigate={navigate} />

    </div>
  );
}

/* ───────────────────────────────────────────
   SIMS 서비스 카드 섹션 (Figma: 테두리 없는 카드)
   이미지 276x160 비율 / 하단 텍스트 padding 24px 0 / gap 48
   ─────────────────────────────────────────── */
const SIMS_SERVICES = [
  {
    id: 1,
    title: '학회/협회 웹사이트',
    description: '회원관리, 회비납부, 증명서 발급 등 효율적인 행정업무를 위한 관리 기능 지원',
    href: 'https://sims.newnonmun.com/',
    image: '/images/sims-01.png' as string | null,
  },
  {
    id: 2,
    title: '논문투고 시스템',
    description: '논문투고 접수부터 심사까지 학회 환경에 맞춘 투고/심사규정 설정 가능',
    href: 'https://sims.newnonmun.com/',
    image: '/images/sims-02.png' as string | null,
  },
  {
    id: 3,
    title: '사전등록 시스템',
    description: '학술대회 안내 및 사전등록, 초록접수 등 학술대회 전용 사이트 구현',
    href: 'https://sims.newnonmun.com/',
    image: '/images/sims-03.png' as string | null,
  },
  {
    id: 4,
    title: '학술지 편집/제작',
    description: '회원관리, 회비납부, 증명서 발급 등 효율적인 행정업무를 위한 관리 기능 지원',
    href: 'https://sims.newnonmun.com/',
    image: '/images/sims-04.png' as string | null,
  },
  {
    id: 5,
    title: '뉴스레터/저널레터',
    description: '학회 소식과 발간된 저널에 대한 이메일 발송',
    href: 'https://sims.newnonmun.com/',
    image: '/images/sims-05.png' as string | null,
  },
  {
    id: 6,
    title: '저널 웹사이트 / XML',
    description: 'Archive 검색 등 국내·외 학술지 평가를 위한 사이트 구현',
    href: 'https://sims.newnonmun.com/',
    image: '/images/sims-06.png' as string | null,
  },
  {
    id: 7,
    title: '학술지 등재 컨설팅',
    description: '국내외 학술지 등재 평가 신청자격 및 평가항목 컨설팅',
    href: 'https://sims.newnonmun.com/',
    image: '/images/sims-07.png' as string | null,
  },
  {
    id: 8,
    title: '학술대회 관리',
    description: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다.',
    href: 'https://sims.newnonmun.com/',
    image: null as string | null,
  },
];

function SimsSection({ isMobile, navigate: _navigate }: { isMobile: boolean; navigate: ReturnType<typeof useNavigate> }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);

  const gap = isMobile ? 24 : 48;
  const itemsPerPage = isMobile ? 1 : 4;
  const n = SIMS_SERVICES.length;
  const canScroll = n > itemsPerPage;
  const arrowSize = 40;
  const arrowOffset = isMobile ? -14 : -20;

  const clonedItems = canScroll
    ? [...SIMS_SERVICES.slice(-itemsPerPage), ...SIMS_SERVICES, ...SIMS_SERVICES.slice(0, itemsPerPage)]
    : SIMS_SERVICES;

  const displayIndex = canScroll ? slideIndex + itemsPerPage : 0;

  const goLeft = () => {
    if (noTransition) return;
    const next = slideIndex - 1;
    setSlideIndex(next);
    if (next < 0) {
      setTimeout(() => {
        setNoTransition(true);
        setSlideIndex(n - 1);
        requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
      }, 360);
    }
  };

  const goRight = () => {
    if (noTransition) return;
    const next = slideIndex + 1;
    setSlideIndex(next);
    if (next >= n) {
      setTimeout(() => {
        setNoTransition(true);
        setSlideIndex(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
      }, 360);
    }
  };

  const ArrowBtn = ({ dir }: { dir: 'left' | 'right' }) => (
    <button
      onClick={dir === 'left' ? goLeft : goRight}
      style={{
        position: 'absolute',
        [dir]: arrowOffset,
        top: '30%',
        transform: 'translateY(-50%)',
        zIndex: 2,
        width: arrowSize,
        height: arrowSize,
        borderRadius: '50%',
        background: '#FFFFFF',
        border: '1px solid #CDD1D5',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {dir === 'left'
          ? <path d="M15 5L8 12L15 19" stroke="#1E2124" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M9 5L16 12L9 19" stroke="#1E2124" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </button>
  );

  return (
    <section style={{ backgroundColor: '#FFFFFF', padding: '64px 0', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <SectionTitle title="학회통합관리시스템 SIMS" sub="학회 운영에 필요한 시스템을 제공합니다." isMobile={isMobile} />

        <div style={{ position: 'relative' }}>
          {canScroll && <ArrowBtn dir="left" />}
          {canScroll && <ArrowBtn dir="right" />}

          <div style={{ overflow: 'hidden' }}>
            <div
              className="predictive-smooth"
              style={{
                display: 'flex',
                gap,
                transform: `translateX(calc(-${displayIndex} * (100% + ${gap}px) / ${itemsPerPage}))`,
                transition: noTransition ? 'none' : 'transform 0.35s ease',
                width: '100%',
              }}
            >
              {clonedItems.map((service, i) => (
                <a
                  key={`${service.id}-${i}`}
                  href={service.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flexShrink: 0,
                    flexGrow: 0,
                    width: `calc((100% - ${(itemsPerPage - 1) * gap}px) / ${itemsPerPage})`,
                    minWidth: 0,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* 이미지 영역 (276x160 비율) */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '276 / 160',
                      background: '#DFE8F4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="4" y="4" width="40" height="40" rx="4" stroke="#B7C6DD" strokeWidth="1.5" fill="none" />
                        <line x1="12" y1="12" x2="36" y2="36" stroke="#B7C6DD" strokeWidth="1.5" />
                        <line x1="36" y1="12" x2="12" y2="36" stroke="#B7C6DD" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>

                  {/* 텍스트 영역 : padding 24px 0, gap 16 */}
                  <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16, background: '#FFFFFF' }}>
                    <p
                      style={{
                        fontSize: isMobile ? 17 : 19,
                        fontWeight: 700,
                        color: '#1E2124',
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {service.title}
                    </p>
                    <p
                      style={{
                        fontSize: isMobile ? 15 : 17,
                        color: '#464C53',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {service.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
