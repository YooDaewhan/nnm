import { API_BASE_URL } from './client';

export interface AnalyzeSection {
  title: string;
  kind: string;
  points: Array<{ label: string; description: string }>;
}

export interface AnalyzeSource {
  marker: number;
  external_id: string;
  similarity: number;
  title: string;
  authors: string[];
  year: number;
}

export interface AnalyzeResponse {
  topic: string;
  briefing: string;
  sections: AnalyzeSection[];
  sources: AnalyzeSource[];
  no_relevant_papers: boolean;
  parse_error: string | null;
  raw_output: string | null;
  analyze_prompt_version: string;
  summary_model: string;
  elapsed_ms: number;
}

export async function postAnalyze(params: {
  topic: string;
  top_k?: number;
  min_similarity?: number;
}): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`AI 분석 요청 실패 (${res.status})`);
  return res.json();
}
