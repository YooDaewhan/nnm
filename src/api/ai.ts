export interface AiChunk {
  chunk_id: number;
  publication_id: string | null;
  section: string | null;
  seq: number;
  score: number;
  text: string;
}

export interface AiReference {
  publication_id: string;
  title: string;
  doi: string | null;
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
  if (!res.ok) throw new Error(`AI 분석 요청 실패 (${res.status})`);
  return res.json();
}
