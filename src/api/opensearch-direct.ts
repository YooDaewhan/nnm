import { customFetch } from './client';

const OPENSEARCH_BASE = 'https://search-hakjisa-opensearch-p2ch2pnf7rwwgxpeba4wgxmpfu.ap-northeast-2.es.amazonaws.com';
const OPENSEARCH_INDEX = 'nnm-papers-test';
const EMBED_URL = 'http://192.168.20.231:8000/embed/single';

export type OSDirectResult = {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  score: number;
  metadata: {
    journal: string | null;
    doi: string | null;
    citation_count: number;
    view_count: number;
    download_count: number;
    h_index: number | null;
    impact_factor: number | null;
  };
};

export type OSDirectResponse = {
  results: OSDirectResult[];
  total: number;
  count: number;
};

// OpenSearch에 직접 요청
async function osSearch(body: object): Promise<OSDirectResponse> {
  const url = `${OPENSEARCH_BASE}/${OPENSEARCH_INDEX}/_search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { reason?: string } }).error?.reason || `OpenSearch 오류 (${res.status})`);
  }

  const json = await res.json() as {
    hits: {
      total: { value: number };
      hits: Array<{
        _id: string;
        _score: number;
        _source: {
          title?: string;
          abstract?: string;
          authors?: string;
          year?: number;
          doi?: string;
          journal?: string | null;
          citation_count?: number;
          view_count?: number;
          download_count?: number;
          h_index?: number | null;
          impact_factor?: number | null;
        };
      }>;
    };
  };

  const results: OSDirectResult[] = json.hits.hits.map((hit) => ({
    id: hit._id,
    title: hit._source.title ?? '',
    abstract: hit._source.abstract ?? '',
    authors: hit._source.authors ? [hit._source.authors] : [],
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
    },
  }));

  return {
    results,
    total: json.hits.total.value,
    count: results.length,
  };
}

// 임베딩 서버에서 벡터 추출
async function getEmbedding(text: string): Promise<number[]> {
  const res = await customFetch<{ data: { embedding: number[] }; status: number }>(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (res.status !== 200) throw new Error('임베딩 서버 연결 실패');
  return res.data.embedding;
}

// 텍스트 검색
export async function osSearchText(params: {
  query: string;
  limit?: number;
  offset?: number;
}): Promise<OSDirectResponse> {
  const { query, limit = 10, offset = 0 } = params;
  return osSearch({
    query: {
      multi_match: {
        query,
        fields: ['title^2', 'abstract', 'authors'],
      },
    },
    size: limit,
    from: offset,
  });
}

// 벡터(의미) 검색
export async function osSearchVector(params: {
  query: string;
  limit?: number;
  offset?: number;
}): Promise<OSDirectResponse> {
  const { query, limit = 10, offset = 0 } = params;
  const vector = await getEmbedding(query);
  return osSearch({
    query: {
      knn: {
        embedding: {
          vector,
          k: limit + offset,
        },
      },
    },
    size: limit,
    from: offset,
  });
}

// 하이브리드 검색
export async function osSearchHybrid(params: {
  query: string;
  limit?: number;
  offset?: number;
  vectorWeight?: number;
  textWeight?: number;
}): Promise<OSDirectResponse> {
  const { query, limit = 10, offset = 0, vectorWeight = 0.7, textWeight = 0.3 } = params;
  const vector = await getEmbedding(query);
  return osSearch({
    query: {
      bool: {
        should: [
          {
            script_score: {
              query: { match_all: {} },
              script: {
                source: `cosineSimilarity(params.vector, 'embedding') * ${vectorWeight} + 1.0`,
                params: { vector },
              },
            },
          },
          {
            multi_match: {
              query,
              fields: ['title^2', 'abstract', 'authors'],
              boost: textWeight,
            },
          },
        ],
      },
    },
    size: limit,
    from: offset,
  });
}
