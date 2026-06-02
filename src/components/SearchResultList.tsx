import { useNavigate } from 'react-router-dom';
import { OpenSearchTextResultItem } from '@/api/search';

interface Props {
  query: string;
  searchLoading: boolean;
  searchError: string | null;
  searchResults: OpenSearchTextResultItem[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  cartLoadingId: string | null;
  buyNowLoadingId?: string | null;
  purchasedIds?: Set<string>;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onBuyNow?: (e: React.MouseEvent, id: string) => void;
  onPageChange: (page: number) => void;
}

const Divider = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
    <line x1="8" y1="3" x2="8" y2="13" stroke="#CDD1D5" strokeWidth="1.07" strokeLinecap="round"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
    <path d="M5.5 3.5L10.5 8L5.5 12.5" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShareIcon = () => (
  <img src="/svg/share-android.svg" width={20} height={20} style={{ display: 'block' }} alt="공유하기" />
);

const HeartIcon = () => (
  <img src="/svg/heart.svg" width={20} height={20} style={{ display: 'block' }} alt="보관함 담기" />
);

const BagIcon = () => (
  <img src="/svg/bag-B.svg" width={20} height={20} style={{ display: 'block' }} alt="장바구니 담기" />
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2.5V10.5M8 10.5L5 7.5M8 10.5L11 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 13H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function SearchResultList({
  query,
  searchLoading,
  searchError,
  searchResults,
  totalResults,
  currentPage,
  totalPages,
  cartLoadingId,
  buyNowLoadingId = null,
  purchasedIds = new Set(),
  onAddToCart,
  onBuyNow,
  onPageChange,
}: Props) {
  const navigate = useNavigate();

  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 8;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-10 h-10 rounded-md text-[17px] font-medium transition-colors ${
            i === currentPage
              ? 'bg-[#063A74] text-white font-bold'
              : 'bg-transparent text-[#464C53] hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="flex-1">
      {!query && (
        <div className="mb-4">
          <h3 className="text-[19px] font-bold text-[#1E2124]">검색 결과</h3>
        </div>
      )}

      {searchLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {searchError}
        </div>
      )}

      {!searchLoading && !searchError && !query && (
        <p className="text-gray-500 text-center py-8">검색어를 입력해주세요.</p>
      )}

      {!searchLoading && !searchError && query && searchResults.length === 0 && totalResults === 0 && (
        <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
      )}

      {!searchLoading && !searchError && searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((result) => {
            const isPurchased = purchasedIds.has(result.id);
            const meta = result.metadata as Record<string, unknown> | undefined;

            return (
              <div
                key={result.id}
                onClick={() => navigate(`/papers?id=${result.id}`)}
                className="bg-white border border-[#CDD1D5] rounded-xl p-8 cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* row-1: 배지(좌) + 아이콘버튼(우) */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  {/* 배지 그룹 */}
                  <div className="flex items-center gap-2 flex-wrap" />
                  {/* 아이콘 버튼 그룹 */}
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#33363D] hover:text-[#1E2124] transition-colors"
                      title="공유"
                    >
                      <ShareIcon />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#33363D] hover:text-[#1E2124] transition-colors"
                      title="보관함 담기"
                    >
                      <HeartIcon />
                    </button>
                    <button
                      onClick={(e) => onAddToCart(e, result.id)}
                      disabled={cartLoadingId === result.id}
                      className="text-[#33363D] hover:text-[#1E2124] transition-colors disabled:opacity-50"
                      title="장바구니 담기"
                    >
                      <BagIcon />
                    </button>
                  </div>
                </div>

                {/* row-2: 본문(좌) + 버튼(우) */}
                <div className="flex items-start gap-6">
                  {/* 본문 */}
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    {/* 제목 */}
                    <h4 className="text-[19px] font-bold text-[#1E2124] leading-[1.5em]">
                      {result.title || '제목 없음'}
                    </h4>

                    {/* 초록 (최대 2줄) */}
                    {result.abstract && (
                      <p className="text-[15px] text-[#464C53] leading-[1.5em] line-clamp-2">
                        {result.abstract}
                      </p>
                    )}

                    {/* info 행: 저자 | 발행년월 | KCI등재 | 이용수 | 인용수 */}
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {result.authors.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          {result.authors.slice(0, 3).map((author, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] hover:underline leading-none"
                            >
                              {author}
                            </button>
                          ))}
                          {result.authors.length > 3 && (
                            <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                              외 {result.authors.length - 3}명
                            </span>
                          )}
                        </div>
                      )}
                      {result.year != null && (
                        <>
                          <Divider />
                          <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                            {result.year}
                          </span>
                        </>
                      )}
                      {meta?.view_count != null && (
                        <>
                          <Divider />
                          <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                            이용수 {meta.view_count as number}
                          </span>
                        </>
                      )}
                      {meta?.citation_count != null && (
                        <>
                          <Divider />
                          <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                            인용수 {meta.citation_count as number}
                          </span>
                        </>
                      )}
                    </div>

                    {/* publish 행: 발행기관 › 저널명 › 권(호) › 페이지 */}
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {meta?.publisher != null && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] hover:underline leading-none"
                        >
                          {meta.publisher as string}
                        </button>
                      )}
                      {meta?.journal_name != null && (
                        <>
                          <ArrowRight />
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] hover:underline leading-none"
                          >
                            {meta.journal_name as string}
                          </button>
                        </>
                      )}
                      {(meta?.volume != null || meta?.issue != null) && (
                        <>
                          <ArrowRight />
                          <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                            {meta.volume ? `${meta.volume}권` : ''}
                            {meta.volume && meta.issue ? ' ' : ''}
                            {meta.issue ? `${meta.issue}호` : ''}
                          </span>
                        </>
                      )}
                      {meta?.pages != null && (
                        <>
                          <ArrowRight />
                          <span className="inline-flex items-center h-6 px-0.5 text-[15px] text-[#464C53] leading-none">
                            {meta.pages as string}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 우측 버튼 영역 */}
                  <div className="flex flex-col items-stretch justify-end gap-2 flex-shrink-0 w-[100px] self-stretch">
                    {isPurchased ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/papers?id=${result.id}`);
                          }}
                          className="h-10 flex items-center justify-center gap-1 bg-white text-[#256EF4] text-[15px] font-normal rounded-md border border-[#256EF4] hover:bg-[#ECF2FE] transition-colors"
                        >
                          원문보기
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('다운로드 기능은 준비 중입니다.');
                          }}
                          className="h-10 flex items-center justify-center gap-1 bg-[#256EF4] text-white text-[15px] font-normal rounded-md hover:bg-[#1a5dd4] transition-colors"
                        >
                          <DownloadIcon />
                          다운로드
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => onBuyNow?.(e, result.id)}
                          disabled={buyNowLoadingId === result.id}
                          className="h-10 flex items-center justify-center bg-white text-[#AB2B36] text-[15px] font-bold rounded-md border border-[#CDD1D5] hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          ￦ 5,000
                        </button>
                        <button
                          onClick={(e) => onBuyNow?.(e, result.id)}
                          disabled={buyNowLoadingId === result.id}
                          className="h-10 flex items-center justify-center bg-[#ECF2FE] text-[#0B50D0] text-[15px] font-normal rounded-md border border-[#256EF4] hover:bg-[#dce7fd] transition-colors disabled:opacity-50"
                        >
                          {buyNowLoadingId === result.id ? '처리 중...' : '구매하기'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {!searchLoading && !searchError && totalResults > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`h-10 px-3 flex items-center gap-1 rounded-md text-[17px] font-medium transition-colors ${
              currentPage === 1
                ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                : 'bg-transparent text-[#464C53] hover:bg-gray-100'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            이전
          </button>

          {renderPageButtons()}

          {totalPages > 8 && currentPage < totalPages - 4 && (
            <>
              <div className="w-10 h-10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="6" cy="12" r="1.4" fill="#33363D"/>
                  <circle cx="12" cy="12" r="1.4" fill="#33363D"/>
                  <circle cx="18" cy="12" r="1.4" fill="#33363D"/>
                </svg>
              </div>
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-10 h-10 rounded-md text-[17px] font-medium text-[#464C53] hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`h-10 px-3 flex items-center gap-1 rounded-md text-[17px] font-medium transition-colors ${
              currentPage === totalPages
                ? 'bg-transparent text-[#8A949E] cursor-not-allowed'
                : 'bg-transparent text-[#464C53] hover:bg-gray-100'
            }`}
          >
            다음
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
