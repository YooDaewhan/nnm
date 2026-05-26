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
   Static data
   ─────────────────────────────────────────── */
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

function getBadgeInfo(paper: ApiPaper): { badge: string; badgeColor: string; badgeBg: string } {
  if (paper.venue_type) {
    return { badge: paper.venue_type, badgeColor: '#2563EB', badgeBg: '#EFF4FF' };
  }

  const raw = (
    paper.accreditation ??
    paper.kci_status ??
    (typeof paper.journal === 'object' ? (paper.journal?.accreditation ?? paper.journal?.kci_status) : undefined) ??
    ''
  ).toLowerCase();

  if (raw.includes('후보')) return { badge: '등재후보', badgeColor: '#DC2626', badgeBg: '#FEF2F2' };
  if (raw.includes('등재') || raw.includes('kci')) return { badge: 'KCI등재', badgeColor: '#2563EB', badgeBg: '#EFF4FF' };
  if (raw.includes('정보')) return { badge: '등재정보', badgeColor: '#16A34A', badgeBg: '#EEFBF3' };
  return { badge: 'KCI등재', badgeColor: '#2563EB', badgeBg: '#EFF4FF' };
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
   히어로 일러스트 SVG (PNG 디자인 참고)
   - 2명의 캐릭터가 논문/문서를 검색하는 모습
   - 떠다니는 문서, 구름, 돋보기 아이콘
   ─────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── 떠다니는 구름 ── */}
      <g opacity="0.6">
        <rect x="30" y="28" width="70" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
        <rect x="20" y="38" width="90" height="6" rx="3" fill="rgba(255,255,255,0.18)" />
        <rect x="110" y="18" width="55" height="5" rx="2.5" fill="rgba(255,255,255,0.2)" />
        <rect x="340" y="10" width="65" height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
        <rect x="350" y="20" width="85" height="5" rx="2.5" fill="rgba(255,255,255,0.15)" />
        <rect x="200" y="5" width="50" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
        <rect x="80" y="270" width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" />
        <rect x="300" y="280" width="70" height="5" rx="2.5" fill="rgba(255,255,255,0.1)" />
      </g>

      {/* ── 문서 카드 1 (뒤쪽, 왼쪽) ── */}
      <g transform="translate(55, 55) rotate(-4)">
        <rect width="110" height="148" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <rect x="12" y="16" width="60" height="7" rx="3.5" fill="rgba(255,255,255,0.35)" />
        <rect x="12" y="30" width="86" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="12" y="40" width="78" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="12" y="50" width="82" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="12" y="66" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <rect x="12" y="76" width="62" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <rect x="12" y="86" width="54" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <rect x="12" y="104" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.07)" />
        <rect x="12" y="114" width="48" height="3" rx="1.5" fill="rgba(255,255,255,0.07)" />
      </g>

      {/* ── 문서 카드 2 (앞쪽, 가운데) ── */}
      <g transform="translate(185, 40) rotate(2)">
        <rect width="120" height="160" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
        {/* 상단 하이라이트 바 */}
        <rect x="0" y="0" width="120" height="28" rx="8" fill="rgba(79,140,255,0.15)" />
        <rect x="12" y="10" width="50" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
        <rect x="12" y="38" width="96" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
        <rect x="12" y="50" width="84" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
        <rect x="12" y="60" width="90" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
        <rect x="12" y="70" width="76" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
        <rect x="12" y="88" width="56" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
        <rect x="12" y="98" width="68" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
        <rect x="12" y="108" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
        <rect x="12" y="126" width="44" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
        <rect x="12" y="136" width="52" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
      </g>

      {/* ── 돋보기 아이콘 (우상단) ── */}
      <g transform="translate(330, 50)">
        <circle cx="40" cy="40" r="38" fill="rgba(99,130,255,0.08)" stroke="rgba(99,130,255,0.5)" strokeWidth="4" />
        <circle cx="40" cy="40" r="26" fill="none" stroke="rgba(99,130,255,0.2)" strokeWidth="1" />
        {/* 돋보기 안 텍스트 라인 */}
        <rect x="24" y="32" width="32" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
        <rect x="24" y="42" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
        <rect x="24" y="50" width="28" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
        {/* 돋보기 손잡이 */}
        <line x1="70" y1="70" x2="96" y2="96" stroke="rgba(99,130,255,0.5)" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* ── 캐릭터 1 (왼쪽, 파란 옷) ── */}
      <g transform="translate(120, 160)">
        {/* 몸통 */}
        <rect x="-16" y="30" width="32" height="42" rx="10" fill="#4A5FBF" />
        {/* 왼팔 (노트북 들고있는) */}
        <rect x="-30" y="34" width="16" height="8" rx="4" fill="#4A5FBF" />
        {/* 오른팔 */}
        <rect x="14" y="34" width="16" height="8" rx="4" fill="#4A5FBF" />
        {/* 머리 */}
        <circle cx="0" cy="14" r="18" fill="#FFD8A8" />
        {/* 머리카락 */}
        <path d="M-18 8 Q-18 -8, 0 -10 Q18 -8, 18 8 Q16 0, 0 -2 Q-16 0, -18 8Z" fill="#3D3D5C" />
        {/* 눈 */}
        <circle cx="-6" cy="14" r="2" fill="#2D2D4C" />
        <circle cx="6" cy="14" r="2" fill="#2D2D4C" />
        {/* 입 */}
        <path d="M-4 20 Q0 24, 4 20" stroke="#E8A070" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* 다리 */}
        <rect x="-10" y="70" width="10" height="22" rx="5" fill="#3D4A99" />
        <rect x="0" y="70" width="10" height="22" rx="5" fill="#3D4A99" />
        {/* 신발 */}
        <ellipse cx="-5" cy="94" rx="7" ry="4" fill="#2D2D4C" />
        <ellipse cx="5" cy="94" rx="7" ry="4" fill="#2D2D4C" />
      </g>

      {/* ── 캐릭터 2 (오른쪽, 주황 옷) ── */}
      <g transform="translate(330, 170)">
        {/* 몸통 */}
        <rect x="-14" y="28" width="28" height="38" rx="9" fill="#E8711A" />
        {/* 왼팔 */}
        <rect x="-26" y="32" width="14" height="7" rx="3.5" fill="#E8711A" />
        {/* 오른팔 (위로 들기) */}
        <rect x="12" y="18" width="14" height="7" rx="3.5" fill="#E8711A" transform="rotate(-30, 19, 21.5)" />
        {/* 머리 */}
        <circle cx="0" cy="12" r="16" fill="#FFD8A8" />
        {/* 머리카락 */}
        <path d="M-16 6 Q-16 -8, 0 -10 Q16 -8, 16 6 Q14 -2, 0 -4 Q-14 -2, -16 6Z" fill="#5C3D1E" />
        {/* 안경 */}
        <circle cx="-6" cy="12" r="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
        <circle cx="6" cy="12" r="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
        <line x1="-1" y1="12" x2="1" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
        {/* 눈 */}
        <circle cx="-6" cy="12" r="1.5" fill="#2D2D4C" />
        <circle cx="6" cy="12" r="1.5" fill="#2D2D4C" />
        {/* 입 */}
        <path d="M-3 18 Q0 21, 3 18" stroke="#E8A070" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* 다리 */}
        <rect x="-8" y="64" width="8" height="20" rx="4" fill="#C45A10" />
        <rect x="0" y="64" width="8" height="20" rx="4" fill="#C45A10" />
        {/* 신발 */}
        <ellipse cx="-4" cy="86" rx="6" ry="3.5" fill="#2D2D4C" />
        <ellipse cx="4" cy="86" rx="6" ry="3.5" fill="#2D2D4C" />
      </g>

      {/* ── 떠다니는 아이콘/도형들 ── */}
      {/* 작은 문서 아이콘 */}
      <g transform="translate(260, 120)" opacity="0.7">
        <rect width="28" height="36" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        <rect x="5" y="6" width="18" height="2.5" rx="1.25" fill="rgba(255,255,255,0.3)" />
        <rect x="5" y="12" width="14" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
        <rect x="5" y="17" width="16" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
      </g>

      {/* 작은 체크마크 원 */}
      <circle cx="440" cy="140" r="10" fill="rgba(74,222,128,0.25)" stroke="rgba(74,222,128,0.6)" strokeWidth="1.5" />
      <path d="M435 140 L438 143 L445 136" stroke="rgba(74,222,128,0.8)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* 장식 원들 */}
      <circle cx="55" cy="260" r="7" fill="#4ADE80" opacity="0.6" />
      <circle cx="450" cy="30" r="9" fill="#60A5FA" opacity="0.6" />
      <circle cx="165" cy="18" r="5" fill="#F472B6" opacity="0.5" />
      <circle cx="420" cy="250" r="6" fill="#FBBF24" opacity="0.5" />
      <circle cx="240" cy="275" r="4" fill="#A78BFA" opacity="0.4" />
      <circle cx="10" cy="140" r="4" fill="#38BDF8" opacity="0.4" />

      {/* 작은 별/반짝이 */}
      <g transform="translate(380, 180)" opacity="0.5">
        <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5Z" fill="white" />
      </g>
      <g transform="translate(100, 80)" opacity="0.4">
        <path d="M0 -4 L1.2 -1.2 L4 0 L1.2 1.2 L0 4 L-1.2 1.2 L-4 0 L-1.2 -1.2Z" fill="white" />
      </g>
      <g transform="translate(460, 100)" opacity="0.35">
        <path d="M0 -3 L1 -1 L3 0 L1 1 L0 3 L-1 1 L-3 0 L-1 -1Z" fill="white" />
      </g>
    </svg>
  );
}

/* ───────────────────────────────────────────
   논문 카드 컴포넌트
   ─────────────────────────────────────────── */
function PaperCard({ paper, isMobile }: { paper: Paper; isMobile: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/papers/${paper.id}`)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #CDD1D5',
        borderRadius: '0',
        padding: '1.5rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        minHeight: isMobile ? 'auto' : 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#C5CAD0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#E4E7EA';
      }}
    >
      {/* 뱃지 */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 500,
          color: paper.badgeColor,
          background: paper.badgeBg,
          borderRadius: 2,
          padding: '2px 8px',
          lineHeight: '16px ',
          alignSelf: 'flex-start',
          // letterSpacing: '-0.01em',
        }}
      >
        {paper.badge}
      </span>

      {/* 제목 — 2줄 */}
      <p
        style={{
          fontSize: isMobile ? 15 : 17,
          fontWeight: 700,
          color: '#1E2124',
          lineHeight: 1.35,
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

      {/* 초록 — 2줄, 작은 회색 */}
      <p
        style={{
          fontSize: isMobile ? 13 : 15,
          color: '#464C53',
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

      {/* 저자 + 저널/권호 — 하단 고정 */}
      <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, color: '#464C53', fontWeight: 400 }}>{paper.author}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, color: '#464C53' }}>
          <span>{paper.journal}</span>
          <span style={{ color: '#8A949E', fontSize: 10 }}>&gt;</span>
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

  const { data: featuredVenues = [] } = useQuery<FeaturedVenue[]>({
    queryKey: ['home', 'featured-venues'],
    queryFn: async () => {
      const res = await customFetch<{ data: unknown }>('/api/home/featured-venues?limit=12');
      return extractFeaturedVenues((res.data as Record<string, unknown>)?.data ?? res.data);
    },
    staleTime: 5 * 60 * 1000,
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
  const px = isMobile ? '16px' : '40px';

  return (
    <div style={{ fontFamily: ff, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ════════════════════════════════════════
          1. HERO — 진한 네이비 그라데이션 + 일러스트
      ════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1B1F3B 0%, #2B3260 35%, #3D4F8A 100%)',
          position: 'relative',
          zIndex: 10,
          height: '400px',
          display: 'flex',

        }}
      >
        {/* 배경 */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: 50, right: -100, width: 900, height: 320, }}>
            <img src="https://hakjisa-assets.s3.ap-northeast-2.amazonaws.com/assets/images/nnm/tid024t009346%402x.png" style={{ transform: 'scaleX(-1)' }} />
          </div>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 32,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* ── 좌측: 타이틀 + 검색바 ── */}
          <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 640 }}>
            <h1
              style={{
                fontSize: isMobile ? 32 : 48,
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: isMobile ? 8 : 14,
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
              }}
            >
              생각은 깊게, 검색은 빠르게
            </h1>
            <p
              style={{
                fontSize: isMobile ? 17 : 28,
                color: '#FFFFFF',
                marginBottom: isMobile ? 28 : 40,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              복잡한 절차 없이 핵심 논문을 빠르게 찾아보세요.
            </p>

            {/* 검색 바 */}
            <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 640, zIndex: 100 }}>
              <form onSubmit={handleSearch}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #D8E5FD',
                    borderRadius: 1000,
                    overflow: 'hidden',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    padding: '8px 8px 8px 32px',
                  }}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isMobile ? '키워드를 입력하세요' : '찾고 싶은 논문, 저자, 키워드를 입력하세요'}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '8px 28px',
                      border: 'none',
                      outline: 'none',
                      fontSize: isMobile ? 17 : 19,
                      color: '#464C53',
                      background: 'transparent',
                      fontFamily: ff,
                    }}
                  />
                  {/* 상세검색 토글 */}
                  <button
                    type="button"
                    onClick={() => setShowDetailedSearch(v => !v)}
                    title="상세 검색"
                    style={{
                      width: 44,
                      height: isMobile ? 50 : 58,
                      background: showDetailedSearch ? '#F0F4FF' : 'transparent',
                      border: 'none',
                      // borderLeft: '1px solid #E4E7EA',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: showDetailedSearch ? '#256EF4' : '#33363D',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
                      <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                      <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                    </svg>
                  </button>
                  {/* 검색 버튼 (파란색 동그란 아이콘, PNG 참고) */}
                  <button
                    type="submit"
                    style={{
                      width: isMobile ? 42 : 50,
                      height: isMobile ? 42 : 50,
                      background: '#3B5BDB',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      borderRadius: '1000px',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="2.2" />
                      <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
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
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
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
                        <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><circle cx="14.67" cy="14.67" r="8" stroke="white" strokeWidth="2.5"/><path d="M21.33 21.33L26.67 26.67" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        검색
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── 우측: 일러스트 (PC only) ──
          {!isMobile && (
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <HeroIllustration />
            </div>
          )} */}
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. 주제별 인기논문 — 흰 배경, 탭 + 4열 카드
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F8FAFF', padding: '64px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          {/* 섹션 타이틀 */}
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1E2124', marginBottom: 6, letterSpacing: '0px' }}>
            주제별 인기논문
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: '#464C53', marginBottom: isMobile ? 20 : 28, fontWeight: 400 }}>
            최근 7일, 분야별 핫한 논문들을 모았습니다.
          </p>

          {/* 탭 — 동적 (API 분야 목록) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8, marginBottom: isMobile ? 20 : 28 }}>
            {papersLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: isMobile ? 64 : 80,
                      height: isMobile ? 36 : 38,
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
                        padding: '8px 16px',
                        borderRadius: 0,
                        border: isActive ? 'none' : '1px solid #D1D5DB',
                        background: isActive ? '#083891' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#6B7280',
                        fontSize: 17,
                        fontWeight: isActive ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: ff,
                        transition: 'all 0.15s',
                        lineHeight: '1.5rem',
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
          </div>

          {/* 논문 카드 — 4열 (모바일 1열) */}
          {papersError ? (
            <p style={{ color: '#8A949E', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
              데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
          ) : papersLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? 12 : 16,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 200,
                    borderRadius: 10,
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
                gap: isMobile ? 12 : 16,
              }}
            >
              {displayedPapers.map((p) => (
                <PaperCard key={p.id} paper={p} isMobile={isMobile} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. 인기 검색 키워드 — 연회색 배경
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '64px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1E2124', marginBottom: 6, letterSpacing: '0px' }}>
            인기 검색 키워드
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: '#464C53', marginBottom: isMobile ? 20 : 28, fontWeight: 400 }}>
            다른 연구자들은 어떤 키워드에 주목하고 있을까요?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 10 }}>
            {POPULAR_KEYWORDS.map((kw, i) => (
              <button
                key={i}
                onClick={() => { setQuery(kw); navigate(`/search?q=${encodeURIComponent(kw)}`); }}
                style={{
                  padding: isMobile ? '8px 20px' : '10px 24px',
                  borderRadius: 100,
                  // border: '1px solid #D1D5DB',
                  background: '#EFF2F5',
                  fontSize: isMobile ? 15 : 17,
                  fontWeight: 500,
                  color: '#052B57',
                  cursor: 'pointer',
                  fontFamily: ff,
                  transition: 'all 0.15s',
                  lineHeight: '1.5rem',
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
          4. 추천 저널 — 커버 + 타이틀 + 발행기관
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '64px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1E2124', marginBottom: 6, letterSpacing: '0px' }}>
            추천 저널
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: '#464C53', marginBottom: isMobile ? 20 : 28, fontWeight: 400 }}>
            가장 많이 읽힌 저널을 만나보세요.
          </p>

          {/* 저널 슬라이더 */}
          {(() => {
            const gap = isMobile ? 12 : 24;
            const itemsPerPage = isMobile ? 3 : 6;
            const n = featuredVenues.length;
            const canScroll = n > itemsPerPage;
            const arrowSize = isMobile ? 32 : 40;
            const arrowOffset = isMobile ? -14 : -20;

            // 무한 순환을 위해 앞뒤에 itemsPerPage만큼 복제
            const clonedItems = canScroll
              ? [...featuredVenues.slice(-itemsPerPage), ...featuredVenues, ...featuredVenues.slice(0, itemsPerPage)]
              : featuredVenues;

            // 실제 화면에 표시되는 위치 (복제 아이템 offset 포함)
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
                  top: '38%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  width: arrowSize,
                  height: arrowSize,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {dir === 'left'
                    ? <path d="M10 3L5 8L10 13" stroke="#1E2124" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    : <path d="M6 3L11 8L6 13" stroke="#1E2124" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
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
                      // 아이템 하나의 폭 + gap = (100% + gap) / itemsPerPage
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
                          }}
                          onClick={() => venue.id && navigate(`/journal/${venue.id}`)}
                        >
                          <div
                            style={{
                              width: '100%',
                              aspectRatio: '3 / 4',
                              borderRadius: 8,
                              background: coverUrl ? 'transparent' : '#F3F4F5',
                              border: '1px solid #E5E7EB',
                              overflow: 'hidden',
                              marginBottom: 16,
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
                          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 500, color: '#1E2124', lineHeight: 1.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {title}
                          </p>
                          <p style={{ fontSize: isMobile ? 13 : 15, color: '#464C53', fontWeight: 400, margin: 0 }}>
                            {publisher}
                          </p>
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
          5. 학회통합관리시스템 SIMS — 카드 슬라이더
      ════════════════════════════════════════ */}
      <SimsSection isMobile={isMobile} navigate={navigate} />

    </div>
  );
}

/* ───────────────────────────────────────────
   SIMS 서비스 카드 섹션
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

  const gap = isMobile ? 12 : 24;
  const itemsPerPage = isMobile ? 1 : 4;
  const n = SIMS_SERVICES.length;
  const canScroll = n > itemsPerPage;
  const arrowSize = isMobile ? 32 : 40;
  const arrowOffset = isMobile ? -14 : -20;

  // 저널 슬라이더와 동일한 방식: 앞뒤에 itemsPerPage만큼 복제 후 1개씩 이동
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
        top: '38%',
        transform: 'translateY(-50%)',
        zIndex: 2,
        width: arrowSize,
        height: arrowSize,
        borderRadius: '50%',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        {dir === 'left'
          ? <path d="M10 3L5 8L10 13" stroke="#1E2124" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M6 3L11 8L6 13" stroke="#1E2124" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </button>
  );

  return (
    <section style={{ backgroundColor: '#F8FAFF', padding: '64px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
        <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1E2124', marginBottom: 6, letterSpacing: '0px' }}>
          학회통합관리시스템 SIMS
        </h2>
        <p style={{ fontSize: isMobile ? 15 : 17, color: '#464C53', marginBottom: isMobile ? 20 : 28, fontWeight: 400 }}>
          학회 운영에 필요한 시스템을 제공합니다.
        </p>

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
                    display: 'block',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = '#C5CAD0';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* 이미지 영역 (플레이스홀더) */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      background: '#F3F4F5',
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
                        <rect x="4" y="4" width="40" height="40" rx="4" stroke="#D1D5DB" strokeWidth="1.5" fill="none" />
                        <line x1="12" y1="12" x2="36" y2="36" stroke="#D1D5DB" strokeWidth="1.5" />
                        <line x1="36" y1="12" x2="12" y2="36" stroke="#D1D5DB" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>

                  {/* 텍스트 영역 */}
                  <div style={{ padding: isMobile ? '14px 16px 16px' : '18px 20px 20px' }}>
                    <p
                      style={{
                        fontSize: isMobile ? 15 : 17,
                        fontWeight: 700,
                        color: '#1E2124',
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {service.title}
                    </p>
                    <p
                      style={{
                        fontSize: isMobile ? 13 : 15,
                        color: '#464C53',
                        fontWeight: 400,
                        lineHeight: 1.6,
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
