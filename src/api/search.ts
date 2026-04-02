/**
 * 검색 API (Orval 패턴)
 * 벡터 검색 + 하이브리드 검색
 */
import { customFetch } from './client';

// ===== 벡터 검색 API =====

export type PostApiSearchVectorBody = {
  /** 검색할 텍스트 쿼리 */
  query: string;
  /** 반환할 결과 수 (기본 10, 최대 100) */
  limit?: number;
  /** 페이지네이션을 위한 오프셋 (기본 0) */
  offset?: number;
  /** 필터 목록 */
  filters?: string[];
};

export type PostApiSearchVector200ResultsItemMetadata = {
  title?: string;
  year?: number;
  authors?: string[];
};

export type PostApiSearchVector200ResultsItem = {
  id?: number;
  abstract?: string;
  similarity?: number;
  metadata?: PostApiSearchVector200ResultsItemMetadata;
};

export type PostApiSearchVector200 = {
  success?: boolean;
  results?: PostApiSearchVector200ResultsItem[];
  count?: number;
  total?: number;
  query?: string;
  limit?: number;
  offset?: number;
};

export type PostApiSearchVector400 = {
  error_code?: string;
  message?: string;
};

export type PostApiSearchVector503 = {
  error_code?: string;
  message?: string;
};

export type postApiSearchVectorResponse200 = {
  data: PostApiSearchVector200;
  status: 200;
};

export type postApiSearchVectorResponse400 = {
  data: PostApiSearchVector400;
  status: 400;
};

export type postApiSearchVectorResponse503 = {
  data: PostApiSearchVector503;
  status: 503;
};

export type postApiSearchVectorResponseSuccess = postApiSearchVectorResponse200 & {
  headers: Headers;
};

export type postApiSearchVectorResponseError = (postApiSearchVectorResponse400 | postApiSearchVectorResponse503) & {
  headers: Headers;
};

export type postApiSearchVectorResponse = postApiSearchVectorResponseSuccess | postApiSearchVectorResponseError;

export const getPostApiSearchVectorUrl = () => {
  return `/api/search/vector`;
};

/**
 * 벡터 검색 API
 * @summary 논문 벡터 검색
 */
export const postApiSearchVector = async (
  postApiSearchVectorBody: PostApiSearchVectorBody,
  options?: RequestInit
): Promise<postApiSearchVectorResponse> => {
  return customFetch<postApiSearchVectorResponse>(getPostApiSearchVectorUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    body: JSON.stringify(postApiSearchVectorBody),
  });
};

// 벡터 검색 결과 타입
export type VectorSearchResult = {
  id: number;
  abstract: string;
  similarity: number;
  metadata: {
    title: string;
    year: number;
    authors: string[];
  };
};

export type VectorSearchResponse = {
  success: boolean;
  results: VectorSearchResult[];
  count: number;
  total: number;
  query: string;
  limit: number;
  offset: number;
};

// 벡터 검색 래퍼 함수
export async function searchVector(params: { query: string; limit?: number; offset?: number; filters?: string[] }): Promise<VectorSearchResponse> {
  const response = await postApiSearchVector({
    query: params.query,
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
    filters: params.filters,
  });

  if (response.status !== 200) {
    const errorData = response.data as PostApiSearchVector400 | PostApiSearchVector503;
    throw new Error(errorData.message || '검색에 실패했습니다.');
  }

  const data = response.data as PostApiSearchVector200;
  return {
    success: data.success ?? false,
    results: (data.results ?? []) as VectorSearchResult[],
    count: data.count ?? 0,
    total: data.total ?? 0,
    query: data.query ?? '',
    limit: data.limit ?? 10,
    offset: data.offset ?? 0,
  };
}

// ===== 자동완성 API =====

export type AutocompleteField = 'title' | 'authors';

export type AutocompleteParams = {
  /** 자동완성 검색어 */
  query: string;
  /** 검색 필드 (title, authors). 기본값: title */
  field?: AutocompleteField;
  /** 결과 수 (기본 10, 최대 50) */
  limit?: number;
  /** 최소 유사도 (0.0~1.0, 기본 0.1) */
  min_similarity?: number;
};

export type AutocompleteResultItem = {
  text: string;
  score: number;
  field: string;
};

export type AutocompleteResponse200 = {
  success: boolean;
  results: AutocompleteResultItem[];
  count: number;
  query: string;
};

export type AutocompleteResponse400 = {
  error_code: string;
  message: string;
};

export type getApiSearchAutocompleteResponse =
  | { data: AutocompleteResponse200; status: 200; headers: Headers }
  | { data: AutocompleteResponse400; status: 400; headers: Headers };

export const getGetApiSearchAutocompleteUrl = (params: AutocompleteParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set('query', params.query);
  if (params.field) searchParams.set('field', params.field);
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.min_similarity !== undefined) searchParams.set('min_similarity', String(params.min_similarity));
  return `/api/search/autocomplete?${searchParams.toString()}`;
};

/**
 * 자동완성 API
 * @summary 검색어 자동완성
 */
export const getApiSearchAutocomplete = async (
  params: AutocompleteParams,
  options?: RequestInit
): Promise<getApiSearchAutocompleteResponse> => {
  return customFetch<getApiSearchAutocompleteResponse>(getGetApiSearchAutocompleteUrl(params), {
    ...options,
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
  });
};

/**
 * 자동완성 래퍼 함수
 */
export async function searchAutocomplete(params: AutocompleteParams): Promise<AutocompleteResultItem[]> {
  const response = await getApiSearchAutocomplete({
    query: params.query,
    field: params.field ?? 'title',
    limit: params.limit ?? 10,
    min_similarity: params.min_similarity ?? 0.1,
  });

  if (response.status !== 200) {
    const errorData = response.data as AutocompleteResponse400;
    throw new Error(errorData.message || '자동완성 검색에 실패했습니다.');
  }

  const data = response.data as AutocompleteResponse200;
  return data.results ?? [];
}

// ===== 하이브리드 검색 API =====

export type TextConfigType = 'korean' | 'simple' | 'english';

export type PostApiSearchHybridBody = {
  /** 검색할 텍스트 쿼리 */
  query: string;
  /** 반환할 결과 수 (기본 10, 최대 100) */
  limit?: number;
  /** 페이지네이션을 위한 오프셋 (기본 0) */
  offset?: number;
  /** 벡터 검색 가중치 (0.0~1.0, 기본 0.7). 높을수록 의미 기반 검색 */
  vector_weight?: number;
  /** 텍스트 검색 설정 */
  text_config?: TextConfigType;
  /** 필터 목록 */
  filters?: string[];
};

export type PostApiSearchHybrid200ResultsItemMetadata = {
  title?: string;
  year?: number;
};

export type PostApiSearchHybrid200ResultsItem = {
  id?: number;
  abstract?: string;
  vector_score?: number;
  text_score?: number;
  hybrid_score?: number;
  metadata?: PostApiSearchHybrid200ResultsItemMetadata;
};

export type PostApiSearchHybrid200 = {
  success?: boolean;
  results?: PostApiSearchHybrid200ResultsItem[];
  count?: number;
  total?: number;
  query?: string;
  limit?: number;
  offset?: number;
};

export type PostApiSearchHybrid400 = {
  error_code?: string;
  message?: string;
};

export type PostApiSearchHybrid422 = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type postApiSearchHybridResponse200 = {
  data: PostApiSearchHybrid200;
  status: 200;
};

export type postApiSearchHybridResponse400 = {
  data: PostApiSearchHybrid400;
  status: 400;
};

export type postApiSearchHybridResponse422 = {
  data: PostApiSearchHybrid422;
  status: 422;
};

export type postApiSearchHybridResponseSuccess = postApiSearchHybridResponse200 & {
  headers: Headers;
};

export type postApiSearchHybridResponseError = (postApiSearchHybridResponse400 | postApiSearchHybridResponse422) & {
  headers: Headers;
};

export type postApiSearchHybridResponse = postApiSearchHybridResponseSuccess | postApiSearchHybridResponseError;

export const getPostApiSearchHybridUrl = () => {
  return `/api/search/hybrid`;
};

/**
 * 하이브리드 검색 API
 * @summary 논문 하이브리드 검색 (벡터 + 텍스트)
 */
export const postApiSearchHybrid = async (
  postApiSearchHybridBody: PostApiSearchHybridBody,
  options?: RequestInit
): Promise<postApiSearchHybridResponse> => {
  return customFetch<postApiSearchHybridResponse>(getPostApiSearchHybridUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    body: JSON.stringify(postApiSearchHybridBody),
  });
};

// 하이브리드 검색 결과 타입
export type HybridSearchResult = {
  id: number;
  abstract: string;
  vector_score: number;
  text_score: number;
  hybrid_score: number;
  metadata: {
    title: string;
    year: number;
  };
};

export type HybridSearchResponse = {
  success: boolean;
  results: HybridSearchResult[];
  count: number;
  total: number;
  query: string;
  limit: number;
  offset: number;
};

// ===== 논문 상세 조회 API =====

export type PaperAuthor = {
  id: string;
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
  sort_order: number;
  is_corresponding: boolean;
};

export type PaperIssue = {
  id: string;
  label: string;
  year: number;
};

export type PaperVenue = {
  id: string;
  name: string;
  type: string;
};

export type PaperProvider = {
  id: number;
  name: string;
};

export type PaperDetail = {
  id: string;
  title: string;
  title_en?: string;
  doi?: string;
  page_start?: string;
  page_end?: string;
  published_at?: string;
  type?: string;
  abstract?: string;
  abstract_en?: string;
  body_content?: string | null;
  keywords?: string[];
  table_of_contents?: string;
  related_papers?: string[];
  authors: PaperAuthor[];
  issue?: PaperIssue;
  venue?: PaperVenue;
  provider?: PaperProvider;
  references: unknown[];
  citation_count?: number | null;
  view_count?: number | null;
  download_count?: number | null;
  h_index?: number | null;
  impact_factor?: number | null;
};

export type GetApiPapersId404 = {
  message?: string;
};

export type getApiPapersIdResponse200 = {
  data: PaperDetail;
  status: 200;
};

export type getApiPapersIdResponse404 = {
  data: GetApiPapersId404;
  status: 404;
};

export type getApiPapersIdResponseSuccess = getApiPapersIdResponse200 & {
  headers: Headers;
};

export type getApiPapersIdResponseError = getApiPapersIdResponse404 & {
  headers: Headers;
};

export type getApiPapersIdResponse = getApiPapersIdResponseSuccess | getApiPapersIdResponseError;

export const getGetApiPapersIdUrl = (id: string) => {
  return `/api/papers/${id}`;
};

/**
 * 논문 상세 조회 API
 * @summary 논문 상세 정보 조회
 */
export const getApiPapersId = async (
  id: string,
  options?: RequestInit
): Promise<getApiPapersIdResponse> => {
  return customFetch<getApiPapersIdResponse>(getGetApiPapersIdUrl(id), {
    ...options,
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
  });
};

// 논문 상세 조회 래퍼 함수
export async function getPaperDetail(id: string): Promise<PaperDetail> {
  const response = await getApiPapersId(id);

  if (response.status !== 200) {
    const errorData = response.data as GetApiPapersId404;
    throw new Error(errorData.message || '논문 정보를 불러오는데 실패했습니다.');
  }

  return response.data as PaperDetail;
}

// ===== 멀티벡터 검색 API =====

export type PostApiSearchMultiVectorBody = {
  /** 검색어 */
  query: string;
  /** 반환할 결과 수 (기본 10, 최대 100) */
  limit?: number;
  /** 페이지네이션 오프셋 (기본 0) */
  offset?: number;
  /** 제목 벡터 가중치 (0.0~1.0, 기본 0.4) */
  title_weight?: number;
  /** 본문 벡터 가중치 (0.0~1.0, 기본 0.6) */
  abstract_weight?: number;
  /** 메타데이터 필터 */
  filters?: Record<string, unknown>;
};

export type PostApiSearchMultiVector200ResultsItemMetadata = {
  title?: string;
  year?: number;
  authors?: string[];
};

export type PostApiSearchMultiVector200ResultsItem = {
  id?: number;
  abstract?: string;
  title_score?: number;
  abstract_score?: number;
  combined_score?: number;
  metadata?: PostApiSearchMultiVector200ResultsItemMetadata;
};

export type PostApiSearchMultiVector200 = {
  success?: boolean;
  results?: PostApiSearchMultiVector200ResultsItem[];
  count?: number;
  has_more?: boolean;
  query?: string;
  limit?: number;
  offset?: number;
};

export type PostApiSearchMultiVector400 = {
  error_code?: string;
  message?: string;
};

export type postApiSearchMultiVectorResponse200 = {
  data: PostApiSearchMultiVector200;
  status: 200;
};

export type postApiSearchMultiVectorResponse400 = {
  data: PostApiSearchMultiVector400;
  status: 400;
};

export type postApiSearchMultiVectorResponseSuccess = postApiSearchMultiVectorResponse200 & {
  headers: Headers;
};

export type postApiSearchMultiVectorResponseError = postApiSearchMultiVectorResponse400 & {
  headers: Headers;
};

export type postApiSearchMultiVectorResponse = postApiSearchMultiVectorResponseSuccess | postApiSearchMultiVectorResponseError;

export const getPostApiSearchMultiVectorUrl = () => {
  return `/api/search/multi-vector`;
};

/**
 * 멀티벡터 검색 API
 * @summary 논문 멀티벡터 검색 (제목 + 본문 벡터)
 */
export const postApiSearchMultiVector = async (
  postApiSearchMultiVectorBody: PostApiSearchMultiVectorBody,
  options?: RequestInit
): Promise<postApiSearchMultiVectorResponse> => {
  return customFetch<postApiSearchMultiVectorResponse>(getPostApiSearchMultiVectorUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    body: JSON.stringify(postApiSearchMultiVectorBody),
  });
};

// 멀티벡터 검색 결과 타입
export type MultiVectorSearchResult = {
  id: number;
  abstract: string;
  title_score: number;
  abstract_score: number;
  combined_score: number;
  metadata: {
    title: string;
    year: number;
    authors: string[];
  };
};

export type MultiVectorSearchResponse = {
  success: boolean;
  results: MultiVectorSearchResult[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
};

// 멀티벡터 검색 래퍼 함수
export async function searchMultiVector(params: {
  query: string;
  limit?: number;
  offset?: number;
  title_weight?: number;
  abstract_weight?: number;
  filters?: Record<string, unknown>;
}): Promise<MultiVectorSearchResponse> {
  const response = await postApiSearchMultiVector({
    query: params.query,
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
    title_weight: params.title_weight ?? 0.4,
    abstract_weight: params.abstract_weight ?? 0.6,
    filters: params.filters,
  });

  if (response.status !== 200) {
    const errorData = response.data as PostApiSearchMultiVector400;
    throw new Error(errorData.message || '검색에 실패했습니다.');
  }

  const data = response.data as PostApiSearchMultiVector200;
  return {
    success: data.success ?? false,
    results: (data.results ?? []) as MultiVectorSearchResult[],
    count: data.count ?? 0,
    has_more: data.has_more ?? false,
    query: data.query ?? '',
    limit: data.limit ?? 10,
    offset: data.offset ?? 0,
  };
}

// ===== 고급 검색 API =====

export type PostApiSearchAdvancedBody = {
  /** 검색할 텍스트 쿼리 */
  query: string;
  /** 반환할 결과 수 (기본 10, 최대 100) */
  limit?: number;
  /** 페이지네이션을 위한 오프셋 (기본 0) */
  offset?: number;
  /** 벡터 검색 가중치 (0.0~1.0, 기본 0.9) */
  vector_weight?: number;
  /** 인기도 가중치 (0.0~1.0, 기본 0.3) */
  popularity_weight?: number;
  /** 텍스트 검색 설정 */
  text_config?: TextConfigType;
  /** 필터 목록 */
  filters?: string[];
};

export type PostApiSearchAdvanced200ResultsItemMetadata = {
  title?: string;
  year?: number;
  citation_count?: number;
  view_count?: number;
};

export type PostApiSearchAdvanced200ResultsItem = {
  id?: number;
  abstract?: string;
  relevance_score?: number;
  popularity_score?: number;
  final_score?: number;
  metadata?: PostApiSearchAdvanced200ResultsItemMetadata;
};

export type PostApiSearchAdvanced200 = {
  success?: boolean;
  results?: PostApiSearchAdvanced200ResultsItem[];
  count?: number;
  has_more?: boolean;
  query?: string;
  limit?: number;
  offset?: number;
  popularity_weight?: number;
};

export type PostApiSearchAdvanced400 = {
  error_code?: string;
  message?: string;
};

export type postApiSearchAdvancedResponse200 = {
  data: PostApiSearchAdvanced200;
  status: 200;
};

export type postApiSearchAdvancedResponse400 = {
  data: PostApiSearchAdvanced400;
  status: 400;
};

export type postApiSearchAdvancedResponseSuccess = postApiSearchAdvancedResponse200 & {
  headers: Headers;
};

export type postApiSearchAdvancedResponseError = postApiSearchAdvancedResponse400 & {
  headers: Headers;
};

export type postApiSearchAdvancedResponse = postApiSearchAdvancedResponseSuccess | postApiSearchAdvancedResponseError;

export const getPostApiSearchAdvancedUrl = () => {
  return `/api/search/advanced`;
};

/**
 * 고급 검색 API
 * @summary 논문 고급 검색 (벡터 + 인기도)
 */
export const postApiSearchAdvanced = async (
  postApiSearchAdvancedBody: PostApiSearchAdvancedBody,
  options?: RequestInit
): Promise<postApiSearchAdvancedResponse> => {
  return customFetch<postApiSearchAdvancedResponse>(getPostApiSearchAdvancedUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    body: JSON.stringify(postApiSearchAdvancedBody),
  });
};

// 고급 검색 결과 타입
export type AdvancedSearchResult = {
  id: number;
  abstract: string;
  relevance_score: number;
  popularity_score: number;
  final_score: number;
  metadata: {
    title: string;
    year: number;
    citation_count: number;
    view_count: number;
  };
};

export type AdvancedSearchResponse = {
  success: boolean;
  results: AdvancedSearchResult[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
  popularity_weight: number;
};

// 고급 검색 래퍼 함수
export async function searchAdvanced(params: {
  query: string;
  limit?: number;
  offset?: number;
  vector_weight?: number;
  popularity_weight?: number;
  text_config?: TextConfigType;
  filters?: string[];
}): Promise<AdvancedSearchResponse> {
  const response = await postApiSearchAdvanced({
    query: params.query,
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
    vector_weight: params.vector_weight ?? 0.9,
    popularity_weight: params.popularity_weight ?? 0.3,
    text_config: params.text_config ?? 'korean',
    filters: params.filters,
  });

  if (response.status !== 200) {
    const errorData = response.data as PostApiSearchAdvanced400;
    throw new Error(errorData.message || '검색에 실패했습니다.');
  }

  const data = response.data as PostApiSearchAdvanced200;
  return {
    success: data.success ?? false,
    results: (data.results ?? []) as AdvancedSearchResult[],
    count: data.count ?? 0,
    has_more: data.has_more ?? false,
    query: data.query ?? '',
    limit: data.limit ?? 10,
    offset: data.offset ?? 0,
    popularity_weight: data.popularity_weight ?? 0.3,
  };
}

// ===== OpenSearch 텍스트 검색 API =====

export type OpenSearchTextFilters = {
  year?: { gte?: number; lte?: number };
  journal?: string;
  doi?: string;
};

export type OpenSearchResultMetadata = {
  journal?: string | null;
  doi?: string | null;
  citation_count?: number;
  view_count?: number;
  download_count?: number;
  h_index?: number | null;
  impact_factor?: number | null;
  keywords?: string | null;
  keywords_en?: string | null;
  pub_month?: number | null;
  issue_number?: string | null;
  page_start?: string | null;
  page_end?: string | null;
  total_pages?: number | null;
  pissn?: string | null;
  eissn?: string | null;
  title_tran?: string | null;
  publisher_name?: string | null;
  source?: string | null;
  indexing?: { kci?: string; kci_status?: number; index_info?: string; scopus?: string } | null;
  authors_display?: string | null;
  venue_name?: string | null;
  volume?: number | string | null;
  number?: number | string | null;
  published_at?: string | null;
  page_range?: string | null;
  provider_name?: string | null;
  subject_area?: string | null;
};

export type PostApiSearchOpensearchTextBody = {
  query: string;
  limit?: number;
  offset?: number;
  filters?: OpenSearchTextFilters;
  min_score?: number;
  vector_weight?: number;
  text_weight?: number;
  /** 결과 내 재검색용 publication UUID 목록 (최대 1000개) */
  within_ids?: string[];
  provider_id?: number;
  provider_name?: string;
  venue_name?: string;
  sort?: 'relevance' | 'popularity' | 'latest';
};

export type OpenSearchTextResultItem = {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  score: number;
  metadata: OpenSearchResultMetadata;
};

export type OpenSearchProvider = {
  id: number;
  name: string;
  abbr?: string;
};

export type PostApiSearchOpensearchText200 = {
  success: boolean;
  results: OpenSearchTextResultItem[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
  sort?: string;
  providers?: OpenSearchProvider[];
  filter_context?: {
    provider?: { id: number; name: string };
    matched_publication_count?: number;
  };
};

export type PostApiSearchOpensearchText400 = {
  error_code?: string;
  message?: string;
};

export type postApiSearchOpensearchTextResponse =
  | { data: PostApiSearchOpensearchText200; status: 200; headers: Headers }
  | { data: PostApiSearchOpensearchText400; status: number; headers: Headers };

export const getPostApiSearchOpensearchTextUrl = () => `/api/search/opensearch/text`;

export const postApiSearchOpensearchText = async (
  body: PostApiSearchOpensearchTextBody,
  options?: RequestInit
): Promise<postApiSearchOpensearchTextResponse> => {
  return customFetch<postApiSearchOpensearchTextResponse>(getPostApiSearchOpensearchTextUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
  });
};

export type OpenSearchTextSearchResponse = {
  success: boolean;
  results: OpenSearchTextResultItem[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
  sort?: string;
  providers?: OpenSearchProvider[];
  filter_context?: PostApiSearchOpensearchText200['filter_context'];
};

export async function searchOpensearchText(params: {
  query: string;
  limit?: number;
  offset?: number;
  filters?: OpenSearchTextFilters;
  min_score?: number;
  vector_weight?: number;
  text_weight?: number;
  within_ids?: string[];
  provider_id?: number;
  provider_name?: string;
  venue_name?: string;
  sort?: 'relevance' | 'popularity' | 'latest';
}): Promise<OpenSearchTextSearchResponse> {
  const response = await postApiSearchOpensearchText(params);

  if (response.status !== 200) {
    const errorData = response.data as PostApiSearchOpensearchText400;
    throw new Error(errorData.message || '검색에 실패했습니다.');
  }

  const data = response.data as PostApiSearchOpensearchText200;
  return {
    success: data.success ?? false,
    results: data.results ?? [],
    count: data.count ?? 0,
    has_more: data.has_more ?? false,
    query: data.query ?? '',
    limit: data.limit ?? 10,
    offset: data.offset ?? 0,
    sort: data.sort,
    providers: data.providers,
    filter_context: data.filter_context,
  };
}

// ===== OpenSearch 벡터 검색 API =====

export type PostApiSearchOpensearchVectorBody = {
  query: string;
  limit?: number;
  offset?: number;
  filters?: OpenSearchTextFilters;
  min_score?: number;
  vector_weight?: number;
  text_weight?: number;
};

export type PostApiSearchOpensearchVector200 = {
  success: boolean;
  results: OpenSearchTextResultItem[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
};

export type PostApiSearchOpensearchVector400 = {
  error_code?: string;
  message?: string;
};

export type postApiSearchOpensearchVectorResponse =
  | { data: PostApiSearchOpensearchVector200; status: 200; headers: Headers }
  | { data: PostApiSearchOpensearchVector400; status: number; headers: Headers };

export const getPostApiSearchOpensearchVectorUrl = () => `/api/search/opensearch/vector`;

export const postApiSearchOpensearchVector = async (
  body: PostApiSearchOpensearchVectorBody,
  options?: RequestInit
): Promise<postApiSearchOpensearchVectorResponse> => {
  return customFetch<postApiSearchOpensearchVectorResponse>(getPostApiSearchOpensearchVectorUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
  });
};

export type OpenSearchVectorSearchResponse = {
  success: boolean;
  results: OpenSearchTextResultItem[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
};

export async function searchOpensearchVector(params: {
  query: string;
  limit?: number;
  offset?: number;
  filters?: OpenSearchTextFilters;
  min_score?: number;
  vector_weight?: number;
  text_weight?: number;
}): Promise<OpenSearchVectorSearchResponse> {
  const response = await postApiSearchOpensearchVector(params);

  if (response.status !== 200) {
    const errorData = response.data as PostApiSearchOpensearchVector400;
    throw new Error(errorData.message || '검색에 실패했습니다.');
  }

  const data = response.data as PostApiSearchOpensearchVector200;
  return {
    success: data.success ?? false,
    results: data.results ?? [],
    count: data.count ?? 0,
    has_more: data.has_more ?? false,
    query: data.query ?? '',
    limit: data.limit ?? 10,
    offset: data.offset ?? 0,
  };
}

// ===== OpenSearch 하이브리드 검색 API =====

export type PostApiSearchOpensearchHybridBody = {
  query: string;
  limit?: number;
  offset?: number;
  filters?: OpenSearchTextFilters;
  min_score?: number;
  vector_weight?: number;
  text_weight?: number;
};

export type PostApiSearchOpensearchHybrid200 = {
  success: boolean;
  results: OpenSearchTextResultItem[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
};

export type PostApiSearchOpensearchHybrid400 = {
  error_code?: string;
  message?: string;
};

export type postApiSearchOpensearchHybridResponse =
  | { data: PostApiSearchOpensearchHybrid200; status: 200; headers: Headers }
  | { data: PostApiSearchOpensearchHybrid400; status: number; headers: Headers };

export const getPostApiSearchOpensearchHybridUrl = () => `/api/search/opensearch/hybrid`;

export const postApiSearchOpensearchHybrid = async (
  body: PostApiSearchOpensearchHybridBody,
  options?: RequestInit
): Promise<postApiSearchOpensearchHybridResponse> => {
  return customFetch<postApiSearchOpensearchHybridResponse>(getPostApiSearchOpensearchHybridUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
  });
};

export type OpenSearchHybridSearchResponse = {
  success: boolean;
  results: OpenSearchTextResultItem[];
  count: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
};

export async function searchOpensearchHybrid(params: {
  query: string;
  limit?: number;
  offset?: number;
  filters?: OpenSearchTextFilters;
  min_score?: number;
  vector_weight?: number;
  text_weight?: number;
}): Promise<OpenSearchHybridSearchResponse> {
  const response = await postApiSearchOpensearchHybrid(params);

  if (response.status !== 200) {
    const errorData = response.data as PostApiSearchOpensearchHybrid400;
    throw new Error(errorData.message || '검색에 실패했습니다.');
  }

  const data = response.data as PostApiSearchOpensearchHybrid200;
  return {
    success: data.success ?? false,
    results: data.results ?? [],
    count: data.count ?? 0,
    has_more: data.has_more ?? false,
    query: data.query ?? '',
    limit: data.limit ?? 10,
    offset: data.offset ?? 0,
  };
}

// 하이브리드 검색 래퍼 함수
export async function searchHybrid(params: {
  query: string;
  limit?: number;
  offset?: number;
  vector_weight?: number;
  text_config?: TextConfigType;
  filters?: string[];
}): Promise<HybridSearchResponse> {
  const response = await postApiSearchHybrid({
    query: params.query,
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
    vector_weight: params.vector_weight ?? 0.7,
    text_config: params.text_config ?? 'korean',
    filters: params.filters,
  });

  if (response.status !== 200) {
    const errorData = response.data as PostApiSearchHybrid400 | PostApiSearchHybrid422;
    if ('errors' in errorData && errorData.errors) {
      const errorMessages = Object.values(errorData.errors).flat().join(', ');
      throw new Error(errorMessages || '유효성 검사 실패');
    }
    throw new Error((errorData as PostApiSearchHybrid400).message || '검색에 실패했습니다.');
  }

  const data = response.data as PostApiSearchHybrid200;
  return {
    success: data.success ?? false,
    results: (data.results ?? []) as HybridSearchResult[],
    count: data.count ?? 0,
    total: data.total ?? data.count ?? 0,
    query: data.query ?? '',
    limit: data.limit ?? 10,
    offset: data.offset ?? 0,
  };
}
