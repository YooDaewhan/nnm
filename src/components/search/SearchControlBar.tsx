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
  onBulkBuy,
  onSortChange,
  onItemsPerPageChange,
}: SearchControlBarProps) {
  const selectStyle: React.CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23464C53' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    height: 36,
    padding: '0 32px 0 12px',
    borderRadius: 6,
    fontSize: 15,
    fontFamily: "'Pretendard GOV', sans-serif",
    fontWeight: 400,
    color: '#464C53',
    border: '1px solid #CDD1D5',
    background: '#FFFFFF',
    appearance: 'none' as const,
    cursor: 'pointer',
    outline: 'none',
  };

  const allSelected = selectedIds.size === searchResults.length && searchResults.length > 0;
  const partialSelected = selectedIds.size > 0 && !allSelected;

  const dividerStyle: React.CSSProperties = {
    width: 1,
    height: 14,
    background: '#CDD1D5',
    flexShrink: 0,
  };

  const actionBtnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 16px',
    background: 'none',
    border: 'none',
    fontFamily: "'Pretendard GOV', sans-serif",
    fontWeight: 400,
    fontSize: 15,
    lineHeight: '150%',
    color: disabled ? '#CDD1D5' : '#464C53',
    cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <>
      {totalResults > 0 && (
        <p
          style={{
            fontFamily: "'Pretendard GOV', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            lineHeight: '150%',
            color: '#1E2124',
            margin: '0 0 12px',
          }}
        >
          검색 결과{' '}
          <span style={{ color: '#256EF4' }}>{totalResults.toLocaleString()}</span>건
        </p>
      )}

      {/* 컨트롤 바 — md 이상에서만 */}
      <div
        className="hidden md:flex"
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        {/* 좌측: 전체선택 + 액션 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* 전체선택 */}
          <button
            type="button"
            onClick={onSelectAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              paddingRight: 16,
              background: 'none',
              border: 'none',
              fontFamily: "'Pretendard GOV', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              lineHeight: '150%',
              color: '#464C53',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: allSelected || partialSelected ? '2px solid #256EF4' : '2px solid #CDD1D5',
                background: allSelected ? '#256EF4' : partialSelected ? 'rgba(37,110,244,0.15)' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {allSelected && (
                <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {partialSelected && <div style={{ width: 8, height: 2, background: '#256EF4', borderRadius: 1 }} />}
            </div>
            전체선택
          </button>

          <div style={dividerStyle} />

          {/* 보관함 담기 */}
          <button
            type="button"
            onClick={onBulkScrap}
            disabled={selectedIds.size === 0 || bulkScrapLoading}
            style={actionBtnStyle(selectedIds.size === 0 || bulkScrapLoading)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 12.5L4.5 10 2 11V4C2 3.45 2.45 3 3 3H13C13.55 3 14 3.45 14 4V11L11.5 10 8 12.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            보관함 담기
          </button>

          <div style={dividerStyle} />

          {/* 구매하기 */}
          <button
            type="button"
            onClick={onBulkBuy}
            disabled={selectedIds.size === 0 || bulkCartLoading}
            style={actionBtnStyle(selectedIds.size === 0 || bulkCartLoading)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 5.5H13.5L12 13H4L2.5 5.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M6 5.5C6 3.8 7 2.5 8 2.5C9 2.5 10 3.8 10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            구매하기
          </button>
        </div>

        {/* 우측: 정렬 + 개수 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={detailedSort}
            onChange={(e) => onSortChange(e.target.value as 'relevance' | 'latest')}
            style={selectStyle}
          >
            <option value="relevance">정확도순</option>
            <option value="latest">최신순</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
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
