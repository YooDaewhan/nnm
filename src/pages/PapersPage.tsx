import { useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaperDetail } from '../api/search';

const PDF_VIEWER_BASE = import.meta.env.VITE_PDF_SERVER_URL || 'http://localhost:3000';

function PdfViewerModal({ paperId, onClose }: { paperId: string; onClose: () => void }) {
  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] max-w-[1100px] h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CDD1D5]">
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

function PaperDetailContent() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [pdfOpen, setPdfOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: paper, isLoading, error: fetchError } = useQuery({
    queryKey: ['paper', id],
    queryFn: () => getPaperDetail(id!),
    enabled: !!id,
  });

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
      <main className="flex justify-center px-0 py-10">
        <div className="w-full max-w-[1280px] px-4">
          {/* Breadcrumb */}
          <nav className="mb-8 pb-0 flex items-center gap-1 text-[15px]">
            <Link
              to="/"
              className="text-[#1E2124] hover:underline px-1 py-0.5 rounded text-[15px] leading-[1.5em]"
            >
              홈
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M6 4l4 4-4 4" stroke="#1E2124" strokeWidth="1.2" />
            </svg>
            <Link
              to="/journals"
              className="text-[#1E2124] hover:underline px-1 py-0.5 rounded text-[15px] leading-[1.5em]"
            >
              한국노년학연구
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M6 4l4 4-4 4" stroke="#1E2124" strokeWidth="1.2" />
            </svg>
            <Link
              to="/issues"
              className="text-[#1E2124] hover:underline px-1 py-0.5 rounded text-[15px] leading-[1.5em]"
            >
              권/호
            </Link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M6 4l4 4-4 4" stroke="#1E2124" strokeWidth="1.2" />
            </svg>
            <span className="text-[#1E2124] px-1 py-0.5 text-[15px] leading-[1.5em]">
              논문상세
            </span>
          </nav>

          {/* Content Area */}
          <div className="flex gap-12">
            <div className="flex-1">
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
                <div className="bg-white rounded-xl py-10 space-y-12">
                  {/* ── SUMMARY ── */}
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1 px-10">
                      <h1
                        className="text-[32px] font-bold leading-[1.5em] text-[#131416]"
                        style={{ letterSpacing: '0.03125em' }}
                      >
                        {paper.title}
                      </h1>
                      {paper.title_en && (
                        <p className="text-[19px] leading-[1.5em] text-[#464C53]">
                          {paper.title_en}
                        </p>
                      )}
                    </div>

                    <div
                      className="flex flex-col gap-4 py-6 px-10"
                      style={{ borderTop: '1px solid #CDD1D5', borderBottom: '1px solid #CDD1D5' }}
                    >
                      {paper.type && (
                        <div className="flex gap-6 items-start">
                          <div className="flex-shrink-0 flex items-center" style={{ width: 180, minHeight: 32 }}>
                            <span className="text-[17px] font-bold leading-[1.5em] text-[#131416]">자료유형</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className="inline-flex items-center px-2 h-6 bg-[#ECF2FE] text-[#0B50D0] text-[15px] leading-[1.5em] rounded">학술저널</span>
                            <span className="inline-flex items-center px-2 h-6 bg-[#EAF6EC] text-[#267337] text-[15px] leading-[1.5em] rounded">KCI등재</span>
                          </div>
                        </div>
                      )}

                      {paper.authors && paper.authors.length > 0 && (
                        <div className="flex gap-6 items-start">
                          <div className="flex-shrink-0 flex items-center" style={{ width: 180, minHeight: 32 }}>
                            <span className="text-[17px] font-bold leading-[1.5em] text-[#131416]">저자정보</span>
                          </div>
                          <div className="flex items-center flex-wrap gap-0.5">
                            {paper.authors.map((author) => (
                              <button
                                key={author.id}
                                className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline"
                              >
                                {author.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {paper.venue && (
                        <div className="flex gap-6 items-start">
                          <div className="flex-shrink-0 flex items-center" style={{ width: 180, minHeight: 32 }}>
                            <span className="text-[17px] font-bold leading-[1.5em] text-[#131416]">발행정보</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center flex-wrap gap-0.5">
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline">한국노년학연구회</button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <path d="M6 4l4 4-4 4" stroke="#464C53" strokeWidth="1.2" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline">{paper.venue.name}</button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <path d="M6 4l4 4-4 4" stroke="#464C53" strokeWidth="1.2" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline">{paper.issue?.label || '34(2)'}</button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <path d="M6 4l4 4-4 4" stroke="#464C53" strokeWidth="1.2" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline">
                                {paper.page_start && paper.page_end
                                  ? `pp.${paper.page_start}-${paper.page_end} (${Number(paper.page_end) - Number(paper.page_start) + 1}pages)`
                                  : '페이지 수록 정보'}
                              </button>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline">
                                {paper.published_at
                                  ? new Date(paper.published_at).toLocaleDateString('ko-KR').replace(/\s/g, '')
                                  : '발행년월'}
                              </button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <line x1="8" y1="3" x2="8" y2="13" stroke="#8A949E" strokeWidth="1" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline">이용수 {paper.view_count ?? '000'}</button>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <line x1="8" y1="3" x2="8" y2="13" stroke="#8A949E" strokeWidth="1" />
                              </svg>
                              <button className="inline-flex items-center justify-center h-8 px-0.5 text-[17px] leading-[1.5em] text-[#464C53] hover:underline">인용수 {paper.citation_count ?? '000'}</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {paper.doi && (
                        <div className="flex gap-6 items-start">
                          <div className="flex-shrink-0 flex items-center" style={{ width: 180, minHeight: 32 }}>
                            <span className="text-[17px] font-bold leading-[1.5em] text-[#131416]">DOI</span>
                          </div>
                          <div className="flex items-center h-8">
                            <a
                              href={`https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[17px] leading-[1.5em] text-[#464C53] hover:underline break-all"
                            >
                              {paper.doi}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between px-10">
                      <div className="flex items-center gap-4">
                        <button className="inline-flex items-center gap-1 h-8 px-0.5 text-[17px] leading-[1.5em] text-[#1E2124] hover:underline">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="3" y="2" width="11" height="14" rx="1" stroke="#1E2124" strokeWidth="1.3" />
                            <circle cx="14" cy="14" r="3.5" stroke="#1E2124" strokeWidth="1.3" />
                            <path d="M16.5 16.5l2 2" stroke="#1E2124" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                          미리보기
                        </button>
                        <button className="inline-flex items-center gap-1 h-8 px-0.5 text-[17px] leading-[1.5em] text-[#1E2124] hover:underline">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="3" y="2" width="14" height="16" rx="1" stroke="#1E2124" strokeWidth="1.3" />
                            <line x1="6" y1="7" x2="14" y2="7" stroke="#1E2124" strokeWidth="1.2" />
                            <line x1="6" y1="10" x2="14" y2="10" stroke="#1E2124" strokeWidth="1.2" />
                            <line x1="6" y1="13" x2="11" y2="13" stroke="#1E2124" strokeWidth="1.2" />
                          </svg>
                          초록보기
                        </button>
                        <button className="inline-flex items-center gap-1 h-8 px-0.5 text-[17px] leading-[1.5em] text-[#1E2124] hover:underline">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 3l1.5 4.5H16l-3.7 2.7 1.4 4.3L10 12l-3.7 2.5 1.4-4.3L4 7.5h4.5L10 3z" stroke="#1E2124" strokeWidth="1.2" fill="none" />
                          </svg>
                          AI 요약
                        </button>
                        <button className="inline-flex items-center gap-1 h-8 px-0.5 text-[17px] leading-[1.5em] text-[#1E2124] hover:underline">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M4 8.5c0-1.1.9-2 2-2h1v3H5.5A1.5 1.5 0 014 8.5zM10 8.5c0-1.1.9-2 2-2h1v3h-1.5A1.5 1.5 0 0110 8.5z" stroke="#1E2124" strokeWidth="1.1" fill="none" />
                            <path d="M7 9.5v4M13 9.5v4" stroke="#1E2124" strokeWidth="1.1" />
                          </svg>
                          인용하기
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPdfOpen(true)}
                          className="inline-flex items-center justify-center px-5 h-14 bg-white border border-[#256EF4] text-[#0B50D0] text-[19px] leading-[1.5em] font-normal rounded-lg hover:bg-[#ECF2FE] transition-colors"
                        >
                          원문보기
                        </button>
                        {pdfOpen && paper && (
                          <PdfViewerModal paperId={paper.id} onClose={() => setPdfOpen(false)} />
                        )}
                        <button
                          onClick={handleDownload}
                          disabled={downloading}
                          className="inline-flex items-center justify-center px-5 h-14 bg-[#256EF4] text-white text-[19px] leading-[1.5em] font-normal rounded-lg hover:bg-[#1E5ADB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {downloading ? '다운로드 중...' : '다운로드'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── DETAILS ── */}
                  <div className="flex flex-col gap-16 px-10">
                    {paper.abstract && (
                      <div className="flex flex-col gap-5">
                        <h2 className="text-[24px] font-bold leading-[1.5em] text-[#131416]">초록</h2>
                        <p className="text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">{paper.abstract}</p>
                      </div>
                    )}

                    {paper.abstract_en && (
                      <div className="flex flex-col gap-5">
                        <h2 className="text-[24px] font-bold leading-[1.5em] text-[#131416]">영문초록</h2>
                        <p className="text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">{paper.abstract_en}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-5">
                      <h2 className="text-[24px] font-bold leading-[1.5em] text-[#131416]">키워드</h2>
                      <div className="flex flex-wrap gap-2">
                        {(paper.keywords && paper.keywords.length > 0
                          ? paper.keywords
                          : ['기후변화', '기후 적응', '노인', '건강', '삶의 질']
                        ).map((kw, idx) => (
                          <button
                            key={idx}
                            className="inline-flex items-center justify-center px-4 h-[34px] bg-[#EEF2F7] text-[#1E2124] text-[15px] leading-[1.5em] rounded-full hover:bg-[#D6E0EB] transition-colors"
                          >
                            #{kw}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      <h2 className="text-[24px] font-bold leading-[1.5em] text-[#131416]">목차</h2>
                      <div className="text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">
                        {paper.table_of_contents ||
                          `Ⅰ. 서론\nⅡ. 기후변화와 노년기 건강 및 삶의 질\nⅢ. 기후변화와 대응\nⅣ. 맺음말\nReferences`}
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      <h2 className="text-[24px] font-bold leading-[1.5em] text-[#131416]">참고문헌</h2>
                      {paper.references && paper.references.length > 0 ? (
                        <div className="text-[17px] leading-[1.5em] text-[#131416]">
                          {paper.references.map((ref, idx) => (
                            <p key={idx}>{String(ref)}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[17px] leading-[1.5em] text-[#131416]">등록된 참고문헌 정보가 없습니다.</p>
                      )}
                    </div>

                    <div className="h-px bg-[#CDD1D5]" />

                    <div className="flex flex-col gap-5">
                      <h2 className="text-[24px] font-bold leading-[1.5em] text-[#131416]">해당 권호 수록 논문</h2>
                      <div className="text-[17px] leading-[1.5em] text-[#131416] whitespace-pre-line">
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
        className="fixed bottom-8 right-8 w-[52px] h-[52px] bg-white border border-[#CDD1D5] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08),0px_0px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-lg flex items-center justify-center transition-shadow"
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
