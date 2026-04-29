import { useState, useEffect, useCallback } from 'react';
import { getPdfPreview, PdfApiError } from '../api/pdf';

type PreviewState =
  | { type: 'loading' }
  | { type: 'ok'; url: string }
  | { type: 'too_short' }
  | { type: 'unavailable'; message?: string };

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
  const [state, setState] = useState<PreviewState>({ type: 'loading' });

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    getPdfPreview(paperId)
      .then((url) => setState({ type: 'ok', url }))
      .catch((err) => {
        if (err instanceof PdfApiError && err.reason === 'too_short') {
          setState({ type: 'too_short' });
        } else {
          console.error('[PdfPreview] error:', err);
          setState({ type: 'unavailable', message: err?.message ?? String(err) });
        }
      });
  }, [paperId]);

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
        <div className="flex-1 overflow-hidden relative">
          {state.type === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="text-[13px] text-[#8A949E]">미리보기를 불러오는 중...</p>
            </div>
          )}
          {state.type === 'ok' && (
            <iframe src={state.url} className="w-full h-full border-0" title="논문 미리보기" />
          )}
          {(state.type === 'too_short' || state.type === 'unavailable') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="10" y="6" width="28" height="36" rx="3" stroke="#CDD1D5" strokeWidth="2" />
                <line x1="16" y1="16" x2="32" y2="16" stroke="#CDD1D5" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="16" y1="22" x2="32" y2="22" stroke="#CDD1D5" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="16" y1="28" x2="24" y2="28" stroke="#CDD1D5" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-[15px] text-[#464C53]">
                {state.type === 'too_short'
                  ? '이 논문은 미리보기가 준비되지 않았습니다.'
                  : '미리보기를 불러올 수 없습니다.'}
              </p>
              {state.type === 'too_short' && (
                <p className="text-[13px] text-[#8A949E]">미리보기 파일이 아직 생성되지 않았거나, 분량이 짧은 논문입니다.</p>
              )}
              {state.type === 'unavailable' && state.message && (
                <p className="text-[12px] text-[#AB2B36] font-mono bg-[#FFF0F0] px-3 py-1.5 rounded max-w-md break-all">
                  {state.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        {(state.type === 'ok' || state.type === 'too_short') && (
          <div className="flex-shrink-0 border-t border-[#CDD1D5] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 bg-[#FAFAFC]">
            <p className="text-[13px] text-[#8A949E] hidden sm:block">
              {state.type === 'ok'
                ? '앞 2페이지 미리보기입니다. 전체 논문을 보시려면 구매해 주세요.'
                : '전체 논문을 구매하고 보실 수 있습니다.'}
            </p>
            <div className="flex items-center gap-2 ml-auto">
              {state.type === 'ok' && (
                <a
                  href={state.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 h-9 bg-white border border-[#CDD1D5] text-[#464C53] text-[14px] rounded-md hover:bg-[#F0F2F5] transition-colors"
                >
                  새 탭으로 열기
                </a>
              )}
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
        )}
      </div>
    </div>
  );
}
