import { customFetch } from './client';

/* ───────────────────────────────────────────
   홈 화면 데이터 계층
   main.tsx의 prefetch와 HomePage의 useQuery가 동일한 key/queryFn을 공유한다.
   key가 같아야 prefetch로 채운 캐시를 useQuery가 그대로 꺼내 쓴다.
   ─────────────────────────────────────────── */

export const POPULAR_PAPERS_KEY = ['home', 'popular-papers-by-category'] as const;
export const FEATURED_VENUES_KEY = ['home', 'featured-venues'] as const;

/* ── 인기논문 타입 ── */
type ApiAuthor = { name?: string; author_name?: string } | string;

type ApiJournal = {
  title?: string;
  name?: string;
  journal_name?: string;
  accreditation?: string;
  kci_status?: string;
} | string;

export type ApiPaper = {
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

export type ApiCategoryData = Record<string, ApiPaper[]>;

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

export async function fetchPopularPapers(): Promise<ApiCategoryData> {
  const res = await customFetch<{ data: unknown; status: number }>(
    '/api/home/popular-papers-by-category?per_category=4'
  );
  const body = res.data as Record<string, unknown>;
  const rawCategories: unknown =
    (body && typeof body === 'object' && 'data' in body ? body.data : undefined) ??
    (body && typeof body === 'object' && 'categories' in body ? body.categories : undefined) ??
    body;
  return normalizeCategoryData(rawCategories);
}

/* ── 추천 저널 타입 ── */
export type FeaturedVenue = {
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

export async function fetchFeaturedVenues(): Promise<FeaturedVenue[]> {
  const res = await customFetch<{ data: unknown }>('/api/home/featured-venues?limit=12');
  return extractFeaturedVenues((res.data as Record<string, unknown>)?.data ?? res.data);
}
