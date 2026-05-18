import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { getPdfPreview, PdfApiError } from '../api/pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const S3_HOST = 'https://newnonmun-archive.s3.ap-northeast-2.amazonaws.com';

interface PdfPreviewModalProps {
  paperId: string;
  isPurchased?: boolean;
  onClose: () => void;
  onPurchase?: () => void;
  onViewFull?: () => void;
}

export function PdfPreviewModal({
  paperId,
  isPurchased = false,
  onClose,
  onPurchase,
  onViewFull,
}: PdfPreviewModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    getPdfPreview(paperId)
      .then((url) => {
        const h = window.location.hostname;
        const useProxy = h === 'localhost' || h === '127.0.0.1'
          || /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
        setFileUrl(useProxy ? url.replace(S3_HOST, '/s3-proxy') : url);
      })
      .catch((err: unknown) => {
        if (err instanceof PdfApiError) {
          if (err.status === 403 && err.reason === 'too_short') {
            setError('논문이 너무 짧아 미리보기를 제공하지 않습니다.');
          } else if (err.status === 404) {
            setError('미리보기 파일을 찾을 수 없습니다.');
          } else {
            setError('미리보기를 불러오는데 실패했습니다.');
          }
        } else {
          setError('미리보기를 불러오는데 실패했습니다.');
        }
      });
  }, [paperId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(entry.contentRect.width - 32);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const previewPages = Math.min(numPages, 2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 sm:px-0"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-full sm:w-[90vw] max-w-[900px] h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#CDD1D5] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[#131416]">미리보기</span>
            <span className="text-[12px] text-[#8A949E] bg-[#F0F2F5] px-2 py-0.5 rounded">앞 2페이지</span>
          </div>
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

        {/* 본문 */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-[#F0F2F5] px-4 py-4"
          style={{ userSelect: 'none' }}
        >
          {!fileUrl && !error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="text-[13px] text-[#8A949E]">미리보기를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full px-6 text-center">
              <p className="text-[14px] text-[#AB2B36]">{error}</p>
            </div>
          )}

          {fileUrl && (
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={() => setError('PDF를 불러오는데 실패했습니다.')}
              loading={
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <p className="text-[13px] text-[#8A949E]">PDF 렌더링 중...</p>
                </div>
              }
              className="flex flex-col items-center gap-3"
            >
              {Array.from({ length: previewPages }, (_, i) => (
                <Page
                  key={i + 1}
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-md"
                />
              ))}
            </Document>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex-shrink-0 border-t border-[#CDD1D5] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 bg-[#FAFAFC]">
          <p className="text-[13px] text-[#8A949E] hidden sm:block">
            전체 논문을 구매하고 보실 수 있습니다.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            {isPurchased && onViewFull ? (
              <button
                onClick={onViewFull}
                className="inline-flex items-center justify-center px-4 h-9 bg-[#256EF4] text-white text-[14px] rounded-md hover:bg-[#1E5ADB] transition-colors"
              >
                원문보기
              </button>
            ) : !isPurchased && onPurchase ? (
              <>
                <span className="text-[15px] font-bold text-[#AB2B36]">￦ 7,000</span>
                <button
                  onClick={onPurchase}
                  className="inline-flex items-center justify-center px-4 h-9 bg-[#256EF4] text-white text-[14px] rounded-md hover:bg-[#1E5ADB] transition-colors"
                >
                  구매하기
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
