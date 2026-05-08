import { useState, Suspense, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaperDetail, PaperDetail } from '../api/search';
import { PdfPreviewModal } from '../components/PdfPreviewModal';
import { PdfFullViewerModal } from '../components/PdfFullViewerModal';

type OSPaperDetail = PaperDetail & {
  keywords_en?: string[];
  publisher_name?: string;
  pissn?: string;
  eissn?: string;
  total_pages?: number;
  issue_number?: string;
  source?: string;
  indexing?: { kci?: string; kci_status?: number; index_info?: string };
};
import { getPayments } from '../api/payment';
import { isAuthenticated } from '../lib/auth';
import { addRecentPaper } from './mypage/MyPageRecentPage';


function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-6 items-start gap-1">
      <div className="flex-shrink-0 flex items-center sm:w-[100px] sm:min-h-[32px]">
        <span className="text-[15px] sm:text-[15px] font-bold leading-[1.5em] text-[#131416]">{label}</span>
      </div>
      <div className="flex items-center flex-wrap gap-0.5">{children}</div>
    </div>
  );
}

/* 브레드크럼 아이템 */
function BreadcrumbItem({ label, to, isLast }: { label: string; to?: string; isLast?: boolean }) {
  return (
    <>
      {to && !isLast ? (
        <Link to={to} className="text-[13px] text-[#8A949E] hover:text-[#464C53] transition-colors">{label}</Link>
      ) : (
        <span className={`text-[13px] ${isLast ? 'text-[#464C53] font-medium' : 'text-[#8A949E]'}`}>{label}</span>
      )}
      {!isLast && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <path d="M5 3.5l3.5 3.5-3.5 3.5" stroke="#C5CAD0" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </>
  );
}

function PaperDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const abstractRef = useRef<HTMLDivElement>(null);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [citeOpen, setCiteOpen] = useState(false);
  const [citeTexts, setCiteTexts] = useState<Record<string, string>>({});
  const [citeLoadings, setCiteLoadings] = useState<Record<string, boolean>>({});
  const [citeCopied, setCiteCopied] = useState<string | null>(null);

  const loggedIn = isAuthenticated();

  const { data: paper, isLoading, error: fetchError } = useQuery<OSPaperDetail>({
    queryKey: ['paper', id],
    queryFn: () => getPaperDetail(id!) as Promise<OSPaperDetail>,
    enabled: !!id,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders-paid'],
    queryFn: () => getPayments({ status: 'paid', per_page: 100 }),
    enabled: loggedIn,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (paper) {
      console.log('[PaperDetail]', paper);
      addRecentPaper({
        id: paper.id,
        title: paper.title,
        authors: Array.isArray(paper.authors) ? paper.authors.map((a) => (typeof a === 'string' ? a : a.name)) : [],
        published_at: paper.published_at ?? undefined,
        venue: typeof paper.venue === 'string' ? paper.venue : paper.venue?.name,
      });
    }
    if (fetchError) console.error('[PapersPage] error:', fetchError);
  }, [paper, fetchError]);

  const paidOrders = ordersData?.success ? ordersData.orders.data : [];

  const isPurchased = loggedIn && paidOrders.some(
    (order) => ((order as any).metadata?.items as { publication_id?: string }[] ?? []).some(
      (item) => item.publication_id === paper?.id
    )
  );

  const handlePurchase = () => {
    if (!loggedIn) {
      navigate('/login');
      return;
    }
    sessionStorage.setItem('directBuyItem', JSON.stringify({
      publication_id: paper!.id,
      title: paper!.title,
      unit_price: 7000,
      quantity: 1,
      authors: paper!.authors.map(a => a.name),
      publisher: paper!.publisher_name ?? paper!.provider?.name ?? null,
      journal: paper!.venue?.name ?? null,
    }));
    navigate('/pay?direct=true');
  };

  const error = !id
    ? '논문 ID가 필요합니다.'
    : fetchError instanceof Error
      ? fetchError.message
      : fetchError
        ? '논문 정보를 불러오는데 실패했습니다.'
        : null;

  const handleViewFull = useCallback(() => {
    setPreviewOpen(false);
    setPdfOpen(true);
  }, []);


  const handleScrollToAbstract = () => {
    abstractRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const CITE_FORMATS = [
    { key: 'apa', label: 'APA(7th ed.)' },
    { key: 'mla', label: 'MLA' },
    { key: 'chicago', label: 'Chicago(17th ed.)' },
  ] as const;

  const fetchCitation = useCallback(async (fmt: string) => {
    if (!paper) return;
    setCiteLoadings(prev => ({ ...prev, [fmt]: true }));
    try {
      const { API_BASE_URL } = await import('../api/client');
      const res = await fetch(`${API_BASE_URL}/api/citations/${paper.id}?format=${fmt}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      const text: string = json.citation ?? json.data?.citation ?? JSON.stringify(json);
      setCiteTexts(prev => ({ ...prev, [fmt]: text }));
    } catch {
      const authors = paper.authors?.map((a) => (typeof a === 'string' ? a : a.name)).join(', ') ?? '';
      const year = paper.published_at ? new Date(paper.published_at).getFullYear() : '';
      const venue = paper.venue?.name ?? '';
      setCiteTexts(prev => ({ ...prev, [fmt]: `${authors} (${year}). ${paper.title}. ${venue}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}` }));
    } finally {
      setCiteLoadings(prev => ({ ...prev, [fmt]: false }));
    }
  }, [paper]);

  const handleOpenCite = useCallback(() => {
    setCiteOpen(true);
    setCiteTexts({});
    CITE_FORMATS.forEach(({ key }) => fetchCitation(key));
  }, [fetchCitation]);

  const handleCiteCopy = useCallback((fmt: string) => {
    const text = citeTexts[fmt];
    if (!text) return;
    const tryClipboard = () => {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(tryClipboard);
    } else {
      tryClipboard();
    }
    setCiteCopied(fmt);
    setTimeout(() => setCiteCopied(null), 2000);
  }, [citeTexts]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* 브레드크럼 항목 빌드 */
  const buildBreadcrumbs = (p: OSPaperDetail) => {
    const items: { label: string; to?: string }[] = [{ label: '홈', to: '/' }];
    if (p.provider?.name) items.push({ label: p.provider.name });
    if (p.venue?.name) items.push({ label: p.venue.name });
    if (p.issue?.label) items.push({ label: p.issue.label });
    return items;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <main className="flex justify-center px-0 py-4 sm:py-8">
        <div className="w-full max-w-[1000px] px-4 sm:px-6">

          {/* 브레드크럼 */}
          {paper && (
            <nav className="flex items-center gap-1 mb-4 flex-wrap">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <path d="M2 8L8 2l6 6v6H10v-4H6v4H2V8z" stroke="#8A949E" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
              </svg>
              {buildBreadcrumbs(paper).map((item, idx, arr) => (
                <BreadcrumbItem
                  key={idx}
                  label={item.label}
                  to={item.to}
                  isLast={idx === arr.length - 1}
                />
              ))}
            </nav>
          )}

          {/* 콘텐츠 */}
          {isLoading ? (
            <div className="bg-white rounded-xl p-10 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Link to="/search" className="text-blue-600 hover:text-blue-800">검색 페이지로 이동</Link>
            </div>
          ) : paper ? (
            <div className="bg-white rounded-xl flex flex-col">

              {/* ── 제목 영역 ── */}
              <div className="flex flex-col gap-1 px-6 sm:px-10 pt-8 sm:pt-10 pb-6">
                <h1 className="text-xl sm:text-[28px] font-bold leading-[1.5em] text-[#131416]">
                  {paper.title}
                </h1>
                {paper.title_en && (
                  <p className="text-sm sm:text-[16px] leading-[1.5em] text-[#464C53] mt-1">
                    {paper.title_en}
                  </p>
                )}
              </div>

              {/* ── 메타데이터 블록 ── */}
              <div
                className="flex flex-col gap-3 sm:gap-4 py-4 sm:py-5 px-6 sm:px-10"
                style={{ borderTop: '1px solid #CDD1D5', borderBottom: '1px solid #CDD1D5' }}
              >
                {/* 자료유형 */}
                {paper.type && (
                  <MetaRow label="자료유형">
                    <span className="inline-flex items-center px-2 h-6 bg-[#ECF2FE] text-[#0B50D0] text-[13px] leading-[1.5em] rounded mr-1">학술저널</span>
                    <span className="inline-flex items-center px-2 h-6 bg-[#EAF6EC] text-[#267337] text-[13px] leading-[1.5em] rounded">KCI등재</span>
                  </MetaRow>
                )}

                {/* 저자정보 */}
                {paper.authors && paper.authors.length > 0 && (
                  <MetaRow label="저자정보">
                    <span className="text-[15px] leading-[1.5em] text-[#464C53]">
                      {paper.authors.slice(0, 3).map((a) => (typeof a === 'string' ? a : a.name)).join(' ')}
                      {paper.authors.length > 3 ? ` 외 ${paper.authors.length - 3}명` : ''}
                    </span>
                  </MetaRow>
                )}

                {/* 발행정보 */}
                {(paper.venue || paper.published_at || (paper as any).year) && (
                  <div className="flex flex-col sm:flex-row sm:gap-6 items-start gap-1">
                    <div className="flex-shrink-0 flex items-center sm:w-[100px] sm:min-h-[32px]">
                      <span className="text-[15px] font-bold leading-[1.5em] text-[#131416]">발행정보</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {/* 발행기관 > 저널 > 권호 > 페이지 */}
                      {paper.venue && (
                        <div className="flex items-center flex-wrap gap-0.5">
                          {paper.provider && (
                            <>
                              {paper.provider.website_url ? (
                                <a href={paper.provider.website_url} target="_blank" rel="noopener noreferrer"
                                  className="text-[15px] leading-[1.5em] text-[#464C53] hover:underline">
                                  {paper.provider.name}
                                </a>
                              ) : (
                                <span className="text-[15px] leading-[1.5em] text-[#464C53]">{paper.provider.name}</span>
                              )}
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mx-0.5">
                                <path d="M5 3l4 4-4 4" stroke="#8A949E" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                            </>
                          )}
                          <Link
                            to={`/journal/${paper.venue.id}`}
                            className="text-[15px] leading-[1.5em] text-[#464C53] hover:underline"
                          >
                            {paper.venue.name}
                          </Link>
                          {paper.issue?.label && (
                            <>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mx-0.5">
                                <path d="M5 3l4 4-4 4" stroke="#8A949E" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              <span className="text-[15px] leading-[1.5em] text-[#464C53]">{paper.issue.label}</span>
                            </>
                          )}
                          {(paper.page_start || paper.page_end) && (
                            <>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mx-0.5">
                                <path d="M5 3l4 4-4 4" stroke="#8A949E" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              <span className="text-[15px] leading-[1.5em] text-[#464C53]">
                                {paper.page_start && paper.page_end
                                  ? `pp.${paper.page_start}-${paper.page_end}`
                                  : paper.page_start ? `p.${paper.page_start}` : ''}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {/* 발행년월 | KCI등재 | 이용수 | 인용수 */}
                      <div className="flex items-center flex-wrap gap-0.5 text-[15px] leading-[1.5em] text-[#464C53]">
                        <span>
                          {paper.published_at
                            ? new Date(paper.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' }).replace(/\s/g, '')
                            : (paper as any).year ? `${(paper as any).year}년` : ''}
                        </span>
                        <span className="mx-2 text-[#C5CAD0]">|</span>
                        <span>KCI등재</span>
                        <span className="mx-2 text-[#C5CAD0]">|</span>
                        <span>이용수 {paper.view_count ?? 0}</span>
                        <span className="mx-2 text-[#C5CAD0]">|</span>
                        <span>인용수 {paper.citation_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* DOI */}
                {paper.doi && (
                  <MetaRow label="DOI">
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] leading-[1.5em] text-[#464C53] hover:underline break-all"
                    >
                      {paper.doi}
                    </a>
                  </MetaRow>
                )}
              </div>

              {/* ── 액션 바 ── */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 sm:px-10 py-3 gap-2 sm:gap-0">
                {/* 기능 버튼들 */}
                <div className="flex items-center flex-wrap">
                  {/* 미리보기 */}
                  <button
                    onClick={() => { console.log('[미리보기] 클릭 paper:', paper?.id, 'previewOpen:', previewOpen); setPreviewOpen(true); }}
                    className="flex items-center gap-1.5 px-2 sm:px-3 h-9 text-[13px] sm:text-[14px] text-[#464C53] hover:text-[#131416] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="1.5" width="10" height="13" rx="1.2" stroke="#464C53" strokeWidth="1.2" />
                      <line x1="5.5" y1="5" x2="10.5" y2="5" stroke="#464C53" strokeWidth="1.1" strokeLinecap="round" />
                      <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" stroke="#464C53" strokeWidth="1.1" strokeLinecap="round" />
                      <line x1="5.5" y1="10" x2="8.5" y2="10" stroke="#464C53" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                    미리보기
                  </button>
                  <span className="w-px h-4 bg-[#CDD1D5] mx-1" />
                  {/* 초록보기 */}
                  <button
                    onClick={handleScrollToAbstract}
                    className="flex items-center gap-1.5 px-2 sm:px-3 h-9 text-[13px] sm:text-[14px] text-[#464C53] hover:text-[#131416] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="3" width="12" height="2" rx="1" fill="#464C53" />
                      <rect x="2" y="7" width="12" height="1.3" rx="0.65" fill="#464C53" opacity="0.6" />
                      <rect x="2" y="10.5" width="8" height="1.3" rx="0.65" fill="#464C53" opacity="0.4" />
                    </svg>
                    초록보기
                  </button>
                  <span className="w-px h-4 bg-[#CDD1D5] mx-1" />
                  {/* AI 요약 */}
                  <button className="flex items-center gap-1.5 px-2 sm:px-3 h-9 text-[13px] sm:text-[14px] text-[#464C53] hover:text-[#131416] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2l1.2 3.2L12.5 6.5l-3.3 1.2L8 11l-1.2-3.3L3.5 6.5l3.3-1.3L8 2z" stroke="#464C53" strokeWidth="1.1" strokeLinejoin="round" />
                      <path d="M12.5 11l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" fill="#464C53" />
                    </svg>
                    AI 요약
                  </button>
                  <span className="w-px h-4 bg-[#CDD1D5] mx-1" />
                  {/* 인용하기 */}
                  <button
                    onClick={handleOpenCite}
                    className="flex items-ce nter gap-1.5 px-2 sm:px-3 h-9 text-[13px] sm:text-[14px] text-[#464C53] hover:text-[#131416] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6.5C4 5 5 4 6.5 4H7v2H6.5C6.2 6 6 6.2 6 6.5V7h1v3H4V6.5zM9.5 6.5C9.5 5 10.5 4 12 4h.5v2H12c-.3 0-.5.2-.5.5V7h1v3H9.5V6.5z" fill="#464C53" opacity="0.8" />
                    </svg>
                    인용하기
                  </button>
                </div>

                {/* 가격 + 구매/원문보기 버튼 */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!isPurchased && (
                    <span className="text-[15px] font-bold text-[#AB2B36]">￦ 7,000</span>
                  )}
                  <button
                    onClick={isPurchased ? handleViewFull : handlePurchase}
                    className="inline-flex items-center justify-center px-4 h-9 bg-[#256EF4] text-white text-[14px] rounded-md hover:bg-[#1E5ADB] transition-colors"
                  >
                    {isPurchased ? '원문보기' : '구매하기'}
                  </button>
                </div>
              </div>

              {/* ── 본문 섹션 ── */}
              <div className="flex flex-col gap-8 sm:gap-12 px-6 sm:px-10 py-8 sm:py-10">

                {/* 초록 */}
                {paper.abstract && (
                  <div ref={abstractRef} className="flex flex-col gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-[22px] font-bold leading-[1.5em] text-[#131416]">초록</h2>
                    <p className="text-[15px] sm:text-[16px] leading-[1.8em] text-[#131416] whitespace-pre-line">{paper.abstract}</p>
                  </div>
                )}

                {/* 영문초록 */}
                {paper.abstract_en && (
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-[22px] font-bold leading-[1.5em] text-[#131416]">영문초록</h2>
                    <p className="text-[15px] sm:text-[16px] leading-[1.8em] text-[#131416] whitespace-pre-line">{paper.abstract_en}</p>
                  </div>
                )}

                {/* 키워드 */}
                {paper.keywords && paper.keywords.length > 0 && (
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-[22px] font-bold leading-[1.5em] text-[#131416]">키워드</h2>
                    <div className="flex flex-wrap gap-2">
                      {paper.keywords.map((kw, idx) => (
                        <button
                          key={idx}
                          className="inline-flex items-center justify-center px-3 sm:px-4 h-[34px] bg-[#EEF2F7] text-[#1E2124] text-[13px] sm:text-[14px] leading-[1.5em] rounded-full hover:bg-[#D6E0EB] transition-colors"
                        >
                          #{kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 영문 키워드 */}
                {paper.keywords_en && paper.keywords_en.length > 0 && (
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-[22px] font-bold leading-[1.5em] text-[#131416]">영문 키워드</h2>
                    <div className="flex flex-wrap gap-2">
                      {paper.keywords_en.map((kw, idx) => (
                        <button
                          key={idx}
                          className="inline-flex items-center justify-center px-3 sm:px-4 h-[34px] bg-[#EEF2F7] text-[#1E2124] text-[13px] sm:text-[14px] leading-[1.5em] rounded-full hover:bg-[#D6E0EB] transition-colors"
                        >
                          #{kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 목차 */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-[22px] font-bold leading-[1.5em] text-[#131416]">목차</h2>
                  <div className="text-[15px] sm:text-[16px] leading-[1.8em] text-[#131416] whitespace-pre-line">
                    {paper.table_of_contents || '등록된 목차 정보가 없습니다.'}
                  </div>
                </div>

                {/* 참고문헌 */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-[22px] font-bold leading-[1.5em] text-[#131416]">참고문헌</h2>
                  {paper.references && paper.references.length > 0 ? (
                    <div className="text-[15px] sm:text-[16px] leading-[1.8em] text-[#131416]">
                      {paper.references.map((ref, idx) => (
                        <p key={idx}>{String(ref)}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[15px] sm:text-[16px] leading-[1.8em] text-[#464C53]">등록된 참고문헌 정보가 없습니다.</p>
                  )}
                </div>

                <div className="h-px bg-[#CDD1D5]" />

                {/* 해당 권호 수록 논문 */}
                <div className="flex flex-col gap-3 sm:gap-4 pb-4">
                  <h2 className="text-lg sm:text-[22px] font-bold leading-[1.5em] text-[#131416]">해당 권호 수록 논문</h2>
                  {paper.related_papers && paper.related_papers.length > 0 ? (
                    <ol className="flex flex-col gap-2">
                      {paper.related_papers.map((title, idx) => (
                        <li key={idx} className="flex gap-2 text-[15px] sm:text-[16px] leading-[1.6em] text-[#131416]">
                          <span className="flex-shrink-0 text-[#8A949E]">{idx + 1}.</span>
                          <span>{title}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-[15px] sm:text-[16px] leading-[1.8em] text-[#464C53]">등록된 정보가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-10 text-center">
              <p className="text-gray-500">논문 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </main>

      {/* 미리보기 모달 */}
      {previewOpen && paper && (
        <PdfPreviewModal
          paperId={paper.id}
          isPurchased={isPurchased}
          onClose={() => setPreviewOpen(false)}
          onPurchase={() => { setPreviewOpen(false); handlePurchase(); }}
          onViewFull={() => { setPreviewOpen(false); handleViewFull(); }}
        />
      )}

      {pdfOpen && paper && (
        <PdfFullViewerModal paperId={paper.id} onClose={() => setPdfOpen(false)} />
      )}

      {/* 인용하기 모달 */}
      {citeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setCiteOpen(false); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#CDD1D5]">
              <span className="text-[17px] font-bold text-[#131416]">인용하기</span>
              <button
                onClick={() => setCiteOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="#1E2124" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-0 pb-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-y border-[#CDD1D5]">
                    <th className="py-2.5 px-4 w-[140px] text-[13px] font-medium text-[#8A949E] text-left">양식이름</th>
                    <th className="py-2.5 px-3 text-[13px] font-medium text-[#8A949E] text-left">인용양식</th>
                    <th className="py-2.5 px-4 w-[72px] text-[13px] font-medium text-[#8A949E] text-center">복사</th>
                  </tr>
                </thead>
                <tbody>
                  {CITE_FORMATS.map(({ key, label }) => (
                    <tr key={key} className="border-b border-[#CDD1D5] last:border-b-0">
                      <td className="py-4 px-4 w-[140px] align-top">
                        <span className="text-[13px] font-medium text-[#131416]">{label}</span>
                      </td>
                      <td className="py-4 px-3 align-top">
                        {citeLoadings[key] ? (
                          <span className="text-[13px] text-[#8A949E]">불러오는 중...</span>
                        ) : citeTexts[key] ? (
                          <span className="text-[13px] leading-[1.7em] text-[#131416] select-all">{citeTexts[key]}</span>
                        ) : (
                          <span className="text-[13px] text-[#8A949E]">인용 정보를 불러오지 못했습니다.</span>
                        )}
                      </td>
                      <td className="py-4 px-4 w-[72px] align-middle text-center">
                        <button
                          onClick={() => handleCiteCopy(key)}
                          disabled={!citeTexts[key] || citeLoadings[key]}
                          className="w-8 h-8 inline-flex items-center justify-center rounded hover:bg-[#F0F2F5] transition-colors disabled:opacity-40"
                          title="복사"
                        >
                          {citeCopied === key ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8l4 4 6-7" stroke="#256EF4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="5.5" y="1.5" width="9" height="11" rx="1.2" stroke="#8A949E" strokeWidth="1.2" />
                              <rect x="1.5" y="4.5" width="9" height="11" rx="1.2" stroke="#8A949E" strokeWidth="1.2" fill="white" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 맨 위로 */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-11 h-11 sm:w-[52px] sm:h-[52px] bg-white border border-[#CDD1D5] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08),0px_0px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-lg flex items-center justify-center transition-shadow"
        aria-label="맨 위로"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 19V5M5 12l7-7 7 7" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default function PaperDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      }
    >
      <PaperDetailContent />
    </Suspense>
  );
}
