export interface AiChunk {
  chunk_id: number;
  publication_id: string | null;
  section: string | null;
  seq: number;
  score: number;
  text: string;
}

export interface AiReference {
  ref: number;
  publication_id: string;
  title: string;
  doi: string | null;
  url: string | null;
  source: string | null;
  excerpt: string | null;
  score: number;
}

export interface AiUsage {
  input_tokens: number;
  output_tokens: number;
  model: string;
  estimated_cost_usd: number;
}

export interface AnalyzeResponse {
  question?: string;
  answer: string;
  model?: string;
  chunks?: AiChunk[];
  references: AiReference[];
  usage?: AiUsage;
}

const RETRYABLE_CODES = new Set(['empty_response', 'server_error', 'connection_failed', 'timeout', 'search_failed']);

export class AiApiError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string | null,
    public readonly status: number,
  ) {
    super(message);
  }

  get isRetryable() {
    if (this.status === 429 || (this.status >= 502 && this.status <= 504)) return true;
    return this.errorCode != null && RETRYABLE_CODES.has(this.errorCode);
  }
}

export async function postAnalyze(params: {
  question: string;
  top_k?: number;
  min_similarity?: number;
}): Promise<AnalyzeResponse> {
  const res = await fetch('/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body: { error_code?: string; message?: string } | null = await res.json().catch(() => null);
    throw new AiApiError(
      body?.message ?? `AI 분석 요청 실패 (${res.status})`,
      body?.error_code ?? null,
      res.status,
    );
  }
  return res.json();
}
