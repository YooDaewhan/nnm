/**
 * OpenSearch 직접 호출 (백엔드 미경유)
 * AWS OpenSearch 도메인으로 fetch
 */
import type { OpenSearchTextSearchResponse, OpenSearchTextFilters, PaperDetail, PaperAuthor } from './search';

const OPENSEARCH_BASE =
  'https://search-hakjisa-opensearch-p2ch2pnf7rwwgxpeba4wgxmpfu.ap-northeast-2.es.amazonaws.com';
const OPENSEARCH_INDEX = 'nnm-papers-test';

export type OsSearchTextParams = {
  query: string;
  limit?: number;
  offset?: number;
  filters?: OpenSearchTextFilters;
  min_score?: number;
  within_ids?: string[];
  within_query?: string;
  provider_id?: number;
  provider_name?: string;
  venue_name?: string;
  sort?: 'relevance' | 'popularity' | 'latest';
};

type OSHit = {
  _id: string;
  _score: number;
  _source: {
    publication_uuid?: string;
    title?: string;
    abstract?: string;
    authors?: string | string[];
    year?: number;
    doi?: string;
    journal?: string | null;
    citation_count?: number;
    view_count?: number;
    download_count?: number;
    h_index?: number | null;
    impact_factor?: number | null;
    publisher?: string;
    publisher_name?: string;
    volume?: number | string;
    issue_no?: number | string;
    issue_number?: string;
    fpage?: number | string;
    lpage?: number | string;
    page_start?: number | string;
    page_end?: number | string;
  };
};

export async function osSearchText(params: OsSearchTextParams): Promise<OpenSearchTextSearchResponse> {
  const { query, limit = 10, offset = 0, filters, min_score, within_ids, within_query, provider_name, venue_name, sort } = params;

  const filterClauses: object[] = [];

  if (within_ids && within_ids.length > 0) {
    filterClauses.push({ ids: { values: within_ids } });
  }

  if (filters?.year?.gte !== undefined || filters?.year?.lte !== undefined) {
    const rangeFilter: { gte?: number; lte?: number } = {};
    if (filters.year.gte !== undefined) rangeFilter.gte = filters.year.gte;
    if (filters.year.lte !== undefined) rangeFilter.lte = filters.year.lte;
    filterClauses.push({ range: { year: rangeFilter } });
  }

  if (provider_name) {
    filterClauses.push({ term: { provider_name } });
  }

  if (venue_name) {
    filterClauses.push({ term: { venue_name } });
  }

  const textQuery = {
    multi_match: {
      query,
      fields: ['title^2', 'abstract', 'authors'],
    },
  };

  const mustClauses: object[] = [textQuery];
  if (within_query?.trim()) {
    mustClauses.push({ multi_match: { query: within_query.trim(), fields: ['title^2', 'abstract', 'authors'] } });
  }

  const queryBody =
    filterClauses.length > 0 || mustClauses.length > 1
      ? { bool: { must: mustClauses, ...(filterClauses.length > 0 && { filter: filterClauses }) } }
      : textQuery;

  const requestBody: Record<string, unknown> = {
    query: queryBody,
    size: limit,
    from: offset,
  };

  if (min_score !== undefined) {
    requestBody.min_score = min_score;
  }

  if (sort === 'latest') {
    requestBody.sort = [{ year: { order: 'desc' } }];
  } else if (sort === 'popularity') {
    requestBody.sort = [{ citation_count: { order: 'desc' } }];
  }

  const url = `${OPENSEARCH_BASE}/${OPENSEARCH_INDEX}/_search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { reason?: string } }).error?.reason || `OpenSearch 오류 (${res.status})`,
    );
  }

  const json = await res.json() as {
    hits: {
      total: { value: number };
      hits: OSHit[];
    };
  };

  const results = json.hits.hits.map((hit) => ({
    id: hit._id,
    title: hit._source.title ?? '',
    abstract: hit._source.abstract ?? '',
    authors: Array.isArray(hit._source.authors)
      ? hit._source.authors
      : hit._source.authors
        ? [hit._source.authors]
        : [],
    year: hit._source.year ?? 0,
    score: hit._score,
    metadata: {
      journal: hit._source.journal ?? null,
      doi: hit._source.doi ?? null,
      citation_count: hit._source.citation_count ?? 0,
      view_count: hit._source.view_count ?? 0,
      download_count: hit._source.download_count ?? 0,
      h_index: hit._source.h_index ?? null,
      impact_factor: hit._source.impact_factor ?? null,
      publisher: hit._source.publisher ?? hit._source.publisher_name ?? null,
      volume: hit._source.volume != null ? String(hit._source.volume) : null,
      issue: hit._source.issue_no != null ? String(hit._source.issue_no) : (hit._source.issue_number ?? null),
      page_start: hit._source.fpage ?? hit._source.page_start ?? null,
      page_end: hit._source.lpage ?? hit._source.page_end ?? null,
    },
  }));

  const total = json.hits.total.value;
  return {
    success: true,
    results,
    count: results.length,
    total,
    has_more: offset + results.length < total,
    limit,
    offset,
  };
}

type OSDocSource = {
  publication_uuid?: string;
  title?: string;
  title_en?: string;
  title_tran?: string;
  abstract?: string;
  abstract_en?: string;
  authors?: string | string[];
  year?: number;
  pub_month?: number;
  created_at?: string;
  doi?: string;
  journal?: string | null;
  citation_count?: number;
  view_count?: number;
  download_count?: number;
  h_index?: number | null;
  impact_factor?: number | null;
  keywords?: string | string[];
  keywords_en?: string | string[];
  keywords_ko?: string | string[];
  // 페이지: fpage/lpage/tpage 또는 page_start/page_end/total_pages
  fpage?: number | string;
  lpage?: number | string;
  tpage?: number;
  page_start?: number | string;
  page_end?: number | string;
  total_pages?: number;
  type?: string;
  published_at?: string;
  table_of_contents?: string;
  // 권호: issue_no 또는 issue_number, volume
  issue_no?: number | string;
  issue_number?: string;
  volume?: number | string;
  pissn?: string;
  eissn?: string;
  // 발행기관: publisher 또는 publisher_name
  publisher?: string;
  publisher_name?: string;
  source?: string;
  kci_status?: number;
  indexing?: { kci?: string; kci_status?: number; index_info?: string } | string;
};

export type OSPaperDetail = PaperDetail & {
  keywords_en?: string[];
  issue_number?: string;
  total_pages?: number;
  pissn?: string;
  eissn?: string;
  publisher_name?: string;
  source?: string;
  indexing?: { kci?: string; kci_status?: number; index_info?: string };
};

function parseStringOrArray(val?: string | string[]): string[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val;
  return String(val).split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export async function osGetPaperById(id: string): Promise<OSPaperDetail> {
  const url = `${OPENSEARCH_BASE}/${OPENSEARCH_INDEX}/_doc/${id}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 404) throw new Error('논문을 찾을 수 없습니다.');
  if (!res.ok) throw new Error(`논문 정보를 불러오는데 실패했습니다. (${res.status})`);

  const json = await res.json() as { _id: string; found: boolean; _source: OSDocSource };
  if (!json.found) throw new Error('논문을 찾을 수 없습니다.');

  const src = json._source;
  console.log('[osGetPaperById] _source:', src);

  const rawAuthors: string[] = Array.isArray(src.authors)
    ? src.authors
    : typeof src.authors === 'string' && src.authors
      ? src.authors.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
      : [];

  const authors: PaperAuthor[] = rawAuthors.map((name, idx) => ({
    id: String(idx),
    name,
    sort_order: idx,
    is_corresponding: idx === 0,
  }));

  const pageStart = src.fpage ?? src.page_start;
  const pageEnd = src.lpage ?? src.page_end;
  const totalPages = src.tpage ?? src.total_pages;
  const issueLabel = src.issue_no != null ? String(src.issue_no) : src.issue_number;
  const publisherName = src.publisher ?? src.publisher_name;

  const publishedAt = src.published_at ?? src.created_at
    ?? (src.year && src.pub_month
      ? `${src.year}-${String(src.pub_month).padStart(2, '0')}-01`
      : src.year
        ? `${src.year}-01-01`
        : undefined);

  const indexing = typeof src.indexing === 'string'
    ? JSON.parse(src.indexing) as OSPaperDetail['indexing']
    : src.kci_status != null
      ? { kci_status: src.kci_status }
      : src.indexing;

  const korKeywords = parseStringOrArray(src.keywords_ko);
  const engKeywords = parseStringOrArray(src.keywords_en);
  // keywords 필드가 영문이면 keywords_en으로, 한글이면 keywords로 분류
  const rawKeywords = parseStringOrArray(src.keywords);
  const isEnglishKeywords = rawKeywords && rawKeywords.every((k) => /^[A-Za-z\s.,'-]+$/.test(k));
  const koKeywordsFinal = korKeywords ?? (isEnglishKeywords ? undefined : rawKeywords);
  const enKeywordsFinal = engKeywords ?? (isEnglishKeywords ? rawKeywords : undefined);

  return {
    id: json._id,
    title: src.title ?? '',
    title_en: src.title_en ?? src.title_tran,
    doi: src.doi,
    page_start: pageStart != null ? String(pageStart) : undefined,
    page_end: pageEnd != null ? String(pageEnd) : undefined,
    published_at: publishedAt,
    type: src.type,
    abstract: src.abstract || undefined,
    abstract_en: src.abstract_en,
    body_content: null,
    keywords: koKeywordsFinal,
    table_of_contents: src.table_of_contents,
    related_papers: [],
    authors,
    issue: issueLabel ? { id: '0', label: issueLabel, year: src.year ?? 0 } : undefined,
    venue: src.journal ? { id: '0', name: src.journal, type: 'journal' } : undefined,
    provider: undefined,
    references: [],
    citation_count: src.citation_count ?? null,
    view_count: src.view_count ?? null,
    download_count: src.download_count ?? null,
    h_index: src.h_index ?? null,
    impact_factor: src.impact_factor ?? null,
    keywords_en: enKeywordsFinal,
    issue_number: issueLabel,
    total_pages: totalPages,
    pissn: src.pissn,
    eissn: src.eissn,
    publisher_name: publisherName,
    source: src.source,
    indexing,
  };
}
