interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  isLoading: boolean;
  hasError: boolean;
  onGoToPage: (page: number) => void;
}

/**
 * Figma 12505:21204 — pagination__pc 내부 콘텐츠
 * - 컨테이너: column, alignItems: center, gap 24px (외부 카드는 부모에서 처리)
 * - number_button row: gap 8px
 * - 숫자 버튼: 40x40, border-radius 6px
 *   - 활성: #063A74 배경, 흰 텍스트 SemiBold 17px
 *   - 비활성: 투명 배경, #464C53 텍스트 Regular 17px
 * - 이전/다음 버튼: height 40px, #8A949E 텍스트
 */
export function SearchPagination({
  currentPage,
  totalPages,
  totalResults,
  isLoading,
  hasError,
  onGoToPage,
}: SearchPaginationProps) {
  if (isLoading || hasError || totalResults === 0) return null;

  const fontFamily = "'Pretendard GOV', sans-serif";

  // 숫자 버튼 — Figma layout_0AC8VX (40x40)
  const numberBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? '#063A74' : 'transparent',
    color: active ? '#FFFFFF' : '#464C53',
    fontFamily,
    fontWeight: active ? 600 : 400,
    fontSize: 17,
    lineHeight: '150%',
    transition: 'background-color 0.15s',
    padding: 0,
  });

  // 이전/다음 — Figma layout_PZ04OI / layout_0GV7PT
  const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
    height: 40,
    padding: '0 8px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontFamily,
    fontWeight: 400,
    fontSize: 17,
    lineHeight: '150%',
    color: disabled ? '#CDD1D5' : '#8A949E',
  });

  const renderPageButtons = () => {
    const maxButtons = typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : 8;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
      <button
        key={page}
        type="button"
        onClick={() => onGoToPage(page)}
        style={numberBtnStyle(page === currentPage)}
      >
        {page}
      </button>
    ));
  };

  return (
    <>
      {/* 모바일 — 더보기 */}
      {currentPage < totalPages && (
        <div className="md:hidden" style={{ width: '100%' }}>
          <button
            type="button"
            onClick={() => onGoToPage(currentPage + 1)}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              border: '1px solid #CDD1D5',
              background: '#FFFFFF',
              fontFamily,
              fontWeight: 500,
              fontSize: 16,
              color: '#464C53',
              cursor: 'pointer',
            }}
          >
            더보기
          </button>
        </div>
      )}

      {/* 데스크탑 — 페이지네이션 (Figma layout_TE1JTR: row, gap 8px) */}
      {totalPages > 1 && (
        <div
          className="hidden md:flex"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {/* 이전 */}
          <button
            type="button"
            onClick={() => onGoToPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={navBtnStyle(currentPage === 1)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>이전</span>
          </button>

          {renderPageButtons()}

          {/* 말줄임표 + 마지막 페이지 */}
          {totalPages > 8 && currentPage < totalPages - 4 && (
            <>
              <div
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#33363D',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="6" cy="12" r="1.4" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.4" fill="currentColor" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => onGoToPage(totalPages)}
                style={numberBtnStyle(false)}
              >
                {totalPages}
              </button>
            </>
          )}

          {/* 다음 */}
          <button
            type="button"
            onClick={() => onGoToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={navBtnStyle(currentPage === totalPages)}
          >
            <span>다음</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
