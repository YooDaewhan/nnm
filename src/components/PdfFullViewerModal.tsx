import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { getPdfFull, PdfApiError } from '../api/pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const S3_HOST = 'https://newnonmun-archive.s3.ap-northeast-2.amazonaws.com';

interface Props {
  paperId: string;
  onClose: () => void;
}

export function PdfFullViewerModal({ paperId, onClose }: Props) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    getPdfFull(paperId)
      .then(({ url: pdfUrl }) => setFileUrl(pdfUrl.replace(S3_HOST, '/s3-proxy')))
      .catch((err) => {
        if (err instanceof PdfApiError && err.status === 403) {
          setError('열람 권한이 없습니다. 논문을 구매해 주세요.');
        } else {
          setError('원문을 불러오는데 실패했습니다.');
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 sm:px-0"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-full sm:w-[90vw] max-w-[900px] h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#CDD1D5] flex-shrink-0">
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

        {/* 본문 */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-[#F0F2F5] px-4 py-4"
          style={{ userSelect: 'none' }}
        >
          {!fileUrl && !error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="text-[13px] text-[#8A949E]">원문을 불러오는 중...</p>
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
              {Array.from({ length: numPages }, (_, i) => (
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
      </div>
    </div>
  );
}
