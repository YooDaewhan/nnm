import { useState, Suspense, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaperDetail, PaperDetail } from '../api/search';

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

const PDF_VIEWER_BASE = import.meta.env.VITE_PDF_SERVER_URL || 'http://localhost:3000';

function PdfViewerModal({ paperId, onClose }: { paperId: string; onClose: () => void }) {
  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 sm:px-0"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-full sm:w-[90vw] max-w-[1100px] h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#CDD1D5]">
          <span className="text-[17px] font-bold text-[#131416]">원문보기</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="#1E2124" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <iframe
            src={`${PDF_VIEWER_BASE}/api/viewer/${paperId}`}
            className="w-full h-full border-0"
            title="원문 PDF"
          />
        </div>
      </div>
    </div>
  );
}

/* 메타데이터 행 컴포넌트 — 모바일: 세로, sm 이상: 가로 */
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-6 items-start gap-1">
      <div className="flex-shrink-0 flex items-center sm:w-[180px] sm:min-h-[32px]">
        <span className="text-[15px] sm:text-[17px] font-bold leading-[1.5em] text-[#131416]">{label}</span>
      </div>
      <div className="flex items-center flex-wrap gap-0.5">{children}</div>
    </div>
  );
}

function PaperDetailContent() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();

  const [pdfOpen, setPdfOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
      console.log('[PapersPage] paper:', paper);
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
      unit_price: 5000,
      quantity: 1,
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

  const handleDownload = useCallback(async () => {
    if (!paper) return;
    setDownloading(true);
    try {
      const res = await fetch(`${PDF_VIEWER_BASE}/api/documents/${paper.id}/file`);
      if (!res.ok) throw new Error('다운로드 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paper.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('PDF 다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [paper]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <main className="flex justify-center px-0 py-4 sm:py-10">
        <div className="w-full max-w-[1280px] px-2 sm:px-4">

          {/* Content Area */}
          <div className="flex gap-12 w-full">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="bg-white rounded-xl p-10 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : error ? (
                <div className="bg-white rounded-xl p-10 text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Link to="/search" className="text-blue-600 hover:text-blue-800">
                    검색 페이지로 이동
                  </Link>
                </div>
              ) : paper ? (
                <div className="bg-white rounded-xl py-6 sm:py-10 flex flex-col gap-8 sm:gap-12">

                  {/* ── SUMMARY ── */}
                  <div className="flex flex-col gap-4 sm:gap-6">

                    {/* 제목 */}
                    <div className="flex flex-col gap-1 px-4 sm:px-10">
                      <h1 className="text-xl sm:text-[32px] font-bold leading-[1.5em] text-[#131416]" style={{ letterSpacing: '0.03125em' }}>
                        {paper.title}
                      </h1>
                      {paper.title_en && (
                        <p className="text-sm sm:text-[19px] leading-[1.5em] text-[#464C53]">
                          {paper.title_en}
                        </p>
                      )}
                    </div>

                    {/* 메타데이터 블록 */}
                    <div
                      className="flex flex-col gap-3 sm:gap-4 py-4 sm:py-6 px-4 sm:px-10"
                      style={{ borderTop: '1px solid #CDD1D5', borderBottom: '1px solid #CDD1D5' }}
                    >
                      {/* 자료유형 */}
                      {paper.type && (
                        <MetaRow label="자료유형">
                          <span className="inline-flex items-center px-2 h-6 bg-[#ECF2FE] text-[#0B50D0] text-[13px] sm:text-[15px] leading-[1.5em] rounded">학술저널</span>
                          <span className="inline-flex items-center px-2 h-6 bg-[#EAF6EC] text-[#267337] text-[13px] sm:text-[15px] leading-[1.5em] rounded">KCI등재</span>
                        </MetaRow>
                      )}

                      {/* 저자정보 */}
                      {paper.authors && paper.authors.length > 0 && (
                        <MetaRow label="저자정보">
                          {paper.authors.map((author) => (
                            <button
                              key={author.id}
                              className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline"
                            >
                              {author.name}
                            </button>
                          ))}
                        </MetaRow>
                      )}

                      {/* 발행정보 */}
                      {(paper.venue || paper.published_at || (paper as any).year) && (
                        <div className="flex flex-col sm:flex-row sm:gap-6 items-start gap-1">
                          <div className="flex-shrink-0 flex items-center sm:w-[180px] sm:min-h-[32px]">
                            <span className="text-[15px] sm:text-[17px] font-bold leading-[1.5em] text-[#131416]">발행정보</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {paper.venue && (
                              <div className="flex items-center flex-wrap gap-0.5">
                                {paper.provider && (
                                  <>
                                    {paper.provider.website_url ? (
                                      <a
                                        href={paper.provider.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline"
                                      >
                                        {paper.provider.name}
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53]">{paper.provider.name}</span>
                                    )}
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                      <path d="M6 4l4 4-4 4" stroke="#464C53" strokeWidth="1.2" />
                                    </svg>
                                  </>
                                )}
                                <button className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline">{paper.venue.name}</button>
                                {paper.issue?.label && (
                                  <>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                      <path d="M6 4l4 4-4 4" stroke="#464C53" strokeWidth="1.2" />
                                    </svg>
                                    <button className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline">{paper.issue.label}</button>
                                  </>
                                )}
                                {(paper.page_start || paper.page_end) && (
                                  <>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                      <path d="M6 4l4 4-4 4" stroke="#464C53" strokeWidth="1.2" />
                                    </svg>
                                    <button className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline">
                                      {paper.page_start && paper.page_end
                                        ? `pp.${paper.page_start}-${paper.page_end} (${Number(paper.page_end) - Number(paper.page_start) + 1}pages)`
                                        : paper.page_start
                                          ? `p.${paper.page_start}`
                                          : ''}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            <div className="flex items-center flex-wrap gap-0.5">
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline">
                                {paper.published_at
                                  ? new Date(paper.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' }).replace(/\s/g, '')
                                  : (paper as any).year
                                    ? `${(paper as any).year}년`
                                    : '발행년월'}
                              </button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <line x1="8" y1="3" x2="8" y2="13" stroke="#8A949E" strokeWidth="1" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline">이용수 {paper.view_count ?? 0}</button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <line x1="8" y1="3" x2="8" y2="13" stroke="#8A949E" strokeWidth="1" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline">인용수 {paper.citation_count ?? 0}</button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <line x1="8" y1="3" x2="8" y2="13" stroke="#8A949E" strokeWidth="1" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline">다운로드 {paper.download_count ?? 0}</button>
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
                            className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline break-all"
                          >
                            {paper.doi}
                          </a>
                        </MetaRow>
                      )}

                      {/* ISSN */}
                      {(paper.pissn || paper.eissn) && (
                        <MetaRow label="ISSN">
                          {paper.pissn && <span className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] mr-4">Print {paper.pissn}</span>}
                          {paper.eissn && <span className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53]">Online {paper.eissn}</span>}
                        </MetaRow>
                      )}

                      {/* 발행기관 */}
                      {paper.provider && !paper.venue && (
                        <MetaRow label="발행기관">
                          {paper.provider.website_url ? (
                            <a
                              href={paper.provider.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53] hover:underline"
                            >
                              {paper.provider.name}
                            </a>
                          ) : (
                            <span className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53]">{paper.provider.name}</span>
                          )}
                        </MetaRow>
                      )}

                      {/* 페이지 수 */}
                      {paper.total_pages != null && (
                        <MetaRow label="페이지 수">
                          <span className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#464C53]">{paper.total_pages}p</span>
                        </MetaRow>
                      )}
                    </div>

                    {/* 구매 버튼 */}
                    <div className="flex items-center justify-end px-4 sm:px-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPurchased ? (
                          <>
                            <button
                              onClick={() => setPdfOpen(true)}
                              className="inline-flex items-center justify-center px-4 sm:px-6 h-11 sm:h-12 bg-white border border-[#256EF4] text-[#0B50D0] text-[15px] sm:text-[17px] leading-[1.5em] font-normal rounded-md hover:bg-[#ECF2FE] transition-colors"
                            >
                              원문보기
                            </button>
                            {pdfOpen && paper && (
                              <PdfViewerModal paperId={paper.id} onClose={() => setPdfOpen(false)} />
                            )}
                            <button
                              onClick={handleDownload}
                              disabled={downloading}
                              className="inline-flex items-center justify-center px-4 sm:px-6 h-11 sm:h-12 bg-[#256EF4] text-white text-[15px] sm:text-[17px] leading-[1.5em] font-normal rounded-md hover:bg-[#1E5ADB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {downloading ? '다운로드 중...' : '다운로드'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="inline-flex items-center justify-center px-4 sm:px-6 h-11 sm:h-12 bg-white border border-transparent text-[#AB2B36] text-[15px] sm:text-[17px] leading-[1.5em] font-normal rounded-md hover:bg-[#FFF0F0] transition-colors">
                              ￦ 5,000
                            </button>
                            <button
                              onClick={handlePurchase}
                              className="inline-flex items-center justify-center px-4 sm:px-6 h-11 sm:h-12 bg-white border border-[#256EF4] text-[#0B50D0] text-[15px] sm:text-[17px] leading-[1.5em] font-normal rounded-md hover:bg-[#ECF2FE] transition-colors"
                            >
                              구매하기
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {pdfOpen && paper && (
                      <PdfViewerModal paperId={paper.id} onClose={() => setPdfOpen(false)} />
                    )}
                  </div>

                  {/* ── DETAILS ── */}
                  <div className="flex flex-col gap-8 sm:gap-16 px-4 sm:px-10">
                    {paper.abstract && (
                      <div className="flex flex-col gap-3 sm:gap-5">
                        <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416]">초록</h2>
                        <p className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">{paper.abstract}</p>
                      </div>
                    )}

                    {paper.abstract_en && (
                      <div className="flex flex-col gap-3 sm:gap-5">
                        <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416]">영문초록</h2>
                        <p className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">{paper.abstract_en}</p>
                      </div>
                    )}

                    {paper.keywords && paper.keywords.length > 0 && (
                      <div className="flex flex-col gap-3 sm:gap-5">
                        <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416]">키워드</h2>
                        <div className="flex flex-wrap gap-2">
                          {paper.keywords.map((kw, idx) => (
                            <button
                              key={idx}
                              className="inline-flex items-center justify-center px-3 sm:px-4 h-[34px] bg-[#EEF2F7] text-[#1E2124] text-[13px] sm:text-[15px] leading-[1.5em] rounded-full hover:bg-[#D6E0EB] transition-colors"
                            >
                              #{kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {paper.keywords_en && paper.keywords_en.length > 0 && (
                      <div className="flex flex-col gap-3 sm:gap-5">
                        <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416]">영문 키워드</h2>
                        <div className="flex flex-wrap gap-2">
                          {paper.keywords_en.map((kw, idx) => (
                            <button
                              key={idx}
                              className="inline-flex items-center justify-center px-3 sm:px-4 h-[34px] bg-[#EEF2F7] text-[#1E2124] text-[13px] sm:text-[15px] leading-[1.5em] rounded-full hover:bg-[#D6E0EB] transition-colors"
                            >
                              #{kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:gap-5">
                      <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416]">목차</h2>
                      <div className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">
                        {paper.table_of_contents || '등록된 목차 정보가 없습니다.'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:gap-5">
                      <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416]">참고문헌</h2>
                      {paper.references && paper.references.length > 0 ? (
                        <div className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#131416]">
                          {paper.references.map((ref, idx) => (
                            <p key={idx}>{String(ref)}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#131416]">등록된 참고문헌 정보가 없습니다.</p>
                      )}
                    </div>

                    <div className="h-px bg-[#CDD1D5]" />

                    <div className="flex flex-col gap-3 sm:gap-5">
                      <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416]">해당 권호 수록 논문</h2>
                      <div className="text-[15px] sm:text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">
                        {paper.related_papers?.join('\n') ||
                          `중장년 여성 발레 프로그램 중재 효과 연구: 신체 및 심리 변인 중심으로\n기후변화가 노년기 건강과 삶의 질에 미치는 영향: 기회와 도전\n한국 노인 자기자비 척도 개발 및 타당화\n한국 지역사회 거주 기능 제한 노인의 절대적 및 상대적 돌봄빈곤율 분석 연구\n한국노인이 인식하는 성공적 노화에 대한 개념도 연구`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-10 text-center">
                  <p className="text-gray-500">논문 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
