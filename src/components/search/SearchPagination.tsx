interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  isLoading: boolean;
  hasError: boolean;
  onGoToPage: (page: number) => void;
}

export function SearchPagination({ currentPage, totalPages, totalResults, isLoading, hasError, onGoToPage }: SearchPaginationProps) {
  if (isLoading || hasError || totalResults === 0) return null;

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
        onClick={() => onGoToPage(page)}
        className={`w-10 h-10 rounded-md text-[17px] font-medium transition-colors ${
          page === currentPage
            ? 'bg-[#063A74] text-white font-bold'
            : 'bg-transparent text-[#464C53] hover:bg-gray-100'
        }`}
      >
        {page}
      </button>
    ));
  };

  return (
    <>
      {currentPage < totalPages && (
        <div className="md:hidden mt-6">
          <button
            onClick={() => onGoToPage(currentPage + 1)}
            className="w-full h-12 rounded-xl border border-[#CDD1D5] text-[16px] font-medium text-[#464C53] bg-white hover:bg-gray-50 transition-colors"
          >
            더보기
          </button>
        </div>
      )}
      {totalPages > 1 && (
        <div className="hidden md:flex items-center justify-center gap-2 mt-8 pt-4">
          <button
            onClick={() => onGoToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`h-10 px-3 flex items-center gap-1 rounded-md text-[17px] font-medium transition-colors ${
              currentPage === 1
                ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                : 'bg-transparent text-[#464C53] hover:bg-gray-100'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden md:inline">이전</span>
          </button>

          {renderPageButtons()}

          {totalPages > 8 && currentPage < totalPages - 4 && (
            <>
              <div className="w-10 h-10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="6" cy="12" r="1.4" fill="#33363D" />
                  <circle cx="12" cy="12" r="1.4" fill="#33363D" />
                  <circle cx="18" cy="12" r="1.4" fill="#33363D" />
                </svg>
              </div>
              <button
                onClick={() => onGoToPage(totalPages)}
                className="w-10 h-10 rounded-md text-[17px] font-medium text-[#464C53] hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onGoToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`h-10 px-3 flex items-center gap-1 rounded-md text-[17px] font-medium transition-colors ${
              currentPage === totalPages
                ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                : 'bg-transparent text-[#464C53] hover:bg-gray-100'
            }`}
          >
            <span className="hidden md:inline">다음</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
