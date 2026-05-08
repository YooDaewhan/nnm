import { OpenSearchTextResultItem } from '@/api/search';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface SearchControlBarProps {
  searchResults: OpenSearchTextResultItem[];
  totalResults: number;
  selectedIds: Set<string>;
  detailedSort: 'relevance' | 'latest';
  itemsPerPage: number;
  bulkScrapLoading: boolean;
  bulkCartLoading: boolean;
  onSelectAll: () => void;
  onBulkScrap: () => void;
  onBulkCite: () => void;
  onBulkBuy: () => void;
  onSortChange: (sort: 'relevance' | 'latest') => void;
  onItemsPerPageChange: (size: number) => void;
}

export function SearchControlBar({
  searchResults,
  totalResults,
  selectedIds,
  detailedSort,
  itemsPerPage,
  bulkScrapLoading,
  bulkCartLoading,
  onSelectAll,
  onBulkScrap,
  onBulkCite,
  onBulkBuy,
  onSortChange,
  onItemsPerPageChange,
}: SearchControlBarProps) {
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23464C53' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 10px center',
  };

  return (
    <>
      {totalResults > 0 && (
        <p className="text-[15px] font-bold text-[#1E2124] mb-3">
          검색 결과 <span className="text-[#256EF4]">{totalResults.toLocaleString()}</span>건
        </p>
      )}
      <div className="hidden md:flex items-center justify-between mb-4 pb-3 border-b border-[#E4E7EA]">
        <div className="flex items-center">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 pr-4 text-[14px] text-[#464C53] hover:text-[#1E2124] transition-colors"
          >
            <div className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
              ${selectedIds.size === searchResults.length && searchResults.length > 0
                ? 'bg-[#256EF4] border-[#256EF4]'
                : selectedIds.size > 0
                  ? 'bg-[#256EF4]/20 border-[#256EF4]'
                  : 'border-[#CDD1D5] bg-white'}`}
            >
              {selectedIds.size === searchResults.length && searchResults.length > 0 && (
                <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {selectedIds.size > 0 && selectedIds.size < searchResults.length && (
                <div className="w-2 h-0.5 bg-[#256EF4] rounded" />
              )}
            </div>
            전체선택
          </button>
          <div className="w-px h-4 bg-[#CDD1D5]" />
          <button
            onClick={onBulkScrap}
            disabled={selectedIds.size === 0 || bulkScrapLoading}
            className="px-4 text-[14px] text-[#464C53] hover:text-[#1E2124] disabled:text-[#CDD1D5] transition-colors flex items-center gap-1.5"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M4 2H12C12.55 2 13 2.45 13 3V14.5L8 11.5L3 14.5V3C3 2.45 3.45 2 4 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            스크랩
          </button>
          <div className="w-px h-4 bg-[#CDD1D5]" />
          <button
            onClick={onBulkCite}
            disabled={selectedIds.size === 0}
            className="px-4 text-[14px] text-[#464C53] hover:text-[#1E2124] disabled:text-[#CDD1D5] transition-colors flex items-center gap-1.5"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 5.5C2.5 4.67 3.17 4 4 4H5.5V7.5H2.5V5.5ZM8.5 5.5C8.5 4.67 9.17 4 10 4H11.5V7.5H8.5V5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M2.5 7.5V12H5.5V7.5M8.5 7.5V12H11.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            인용하기
          </button>
          <div className="w-px h-4 bg-[#CDD1D5]" />
          <button
            onClick={onBulkBuy}
            disabled={selectedIds.size === 0 || bulkCartLoading}
            className="px-4 text-[14px] text-[#464C53] hover:text-[#1E2124] disabled:text-[#CDD1D5] transition-colors flex items-center gap-1.5"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 5.5H13.5L12 13H4L2.5 5.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M6 5.5C6 3.8 7 2.5 8 2.5C9 2.5 10 3.8 10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            장바구니 담기
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={detailedSort}
            onChange={(e) => onSortChange(e.target.value as 'relevance' | 'latest')}
            className="h-9 px-3 pr-8 rounded-lg text-[14px] text-[#464C53] border border-[#CDD1D5] bg-white appearance-none cursor-pointer hover:border-[#8A949E] focus:outline-none"
            style={selectStyle}
          >
            <option value="relevance">정확도순</option>
            <option value="latest">최신순</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="h-9 px-3 pr-8 rounded-lg text-[14px] text-[#464C53] border border-[#CDD1D5] bg-white appearance-none cursor-pointer hover:border-[#8A949E] focus:outline-none"
            style={selectStyle}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}개씩</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
