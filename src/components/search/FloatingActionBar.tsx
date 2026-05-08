interface FloatingActionBarProps {
  selectedCount: number;
  bulkScrapLoading: boolean;
  bulkCartLoading: boolean;
  onScrap: () => void;
  onCite: () => void;
  onBuy: () => void;
  onClear: () => void;
}

export function FloatingActionBar({ selectedCount, bulkScrapLoading, bulkCartLoading, onScrap, onCite, onBuy, onClear }: FloatingActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0 bg-[#1E2124] text-white rounded-2xl px-5 py-3 shadow-2xl">
      <span className="text-[14px] font-medium whitespace-nowrap mr-4">{selectedCount}개 선택</span>
      <div className="w-px h-4 bg-white/20" />
      <button onClick={onScrap} disabled={bulkScrapLoading} className="px-4 text-[14px] text-white/80 hover:text-white disabled:text-white/30 transition-colors whitespace-nowrap">
        {bulkScrapLoading ? '추가 중...' : '스크랩'}
      </button>
      <div className="w-px h-4 bg-white/20" />
      <button onClick={onCite} disabled={selectedCount === 0} className="px-4 text-[14px] text-white/80 hover:text-white transition-colors whitespace-nowrap">
        인용하기
      </button>
      <div className="w-px h-4 bg-white/20" />
      <button onClick={onBuy} disabled={bulkCartLoading} className="px-4 text-[14px] text-white/80 hover:text-white disabled:text-white/30 transition-colors whitespace-nowrap">
        {bulkCartLoading ? '추가 중...' : '장바구니 담기'}
      </button>
      <div className="w-px h-4 bg-white/20 ml-1" />
      <button onClick={onClear} className="ml-3 text-white/40 hover:text-white transition-colors">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
