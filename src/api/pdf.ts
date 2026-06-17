import { API_BASE_URL } from './client';

export class PdfApiError extends Error {
  constructor(public readonly status: number, public readonly reason?: string) {
    super(`PDF API error: ${status}${reason ? ` (${reason})` : ''}`);
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new PdfApiError(0, 'timeout');
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/** 공통: 토큰이 있으면 Authorization 헤더 포함 */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = localStorage.getItem('access_token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export type PdfInfo = {
  exists: boolean;
  is_public: boolean;
  is_purchased?: boolean;
  page_count?: number;
  has_preview?: boolean;
};

export async function getPdfInfo(paperId: string): Promise<PdfInfo> {
  const url = `${API_BASE_URL}/api/papers/${paperId}/pdf/info`;
  const res = await fetchWithTimeout(url, { headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PdfApiError(res.status, json.reason ?? json.message);
  return json as PdfInfo;
}

export async function getPdfPreview(paperId: string): Promise<string> {
  const url = `${API_BASE_URL}/api/papers/${paperId}/pdf/preview`;
  const res = await fetchWithTimeout(url, { headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PdfApiError(res.status, json.reason ?? json.message);
  const previewUrl: string | undefined =
    json.url ?? json.preview_url ?? json.signed_url ?? json.presigned_url ?? json.data?.url;
  if (!previewUrl) throw new PdfApiError(0, 'no_url');
  return previewUrl;
}

export async function getPdfFull(paperId: string): Promise<{ url: string; filename: string }> {
  const url = `${API_BASE_URL}/api/papers/${paperId}/pdf`;
  const res = await fetchWithTimeout(url, { headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PdfApiError(res.status, json.reason ?? json.message);
  const pdfUrl: string | undefined =
    json.url ?? json.pdf_url ?? json.signed_url ?? json.presigned_url ?? json.data?.url;
  if (!pdfUrl) throw new PdfApiError(0, 'no_url');
  const filename: string = json.filename ?? `${paperId}.pdf`;
  return { url: pdfUrl, filename };
}
