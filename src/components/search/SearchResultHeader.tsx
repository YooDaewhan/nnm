import { DetailedSearchCondition } from '@/api/search';

const FIELD_LABELS: Record<string, string> = {
  title: '제목', author: '저자', abstract: '초록',
  keyword: '키워드', doi: 'DOI', full_text: '전문',
};

interface SubmittedState {
  conditions: DetailedSearchCondition[];
  sort: 'relevance' | 'latest';
  filters: { year_from?: number; year_to?: number };
}

interface SearchResultHeaderProps {
  submittedState: SubmittedState | null;
  onReset: () => void;
  onRemoveCondition: (idx: number) => void;
  onRemoveYearFilter: () => void;
}

export function SearchResultHeader({ submittedState, onReset, onRemoveCondition, onRemoveYearFilter }: SearchResultHeaderProps) {
  return (
    <div className="mb-6 bg-white rounded-xl border border-[#E4E7EA] px-6 py-5">
      {submittedState ? (
        <>
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1E2124] mb-3">
            <span className="text-[#256EF4]">{submittedState.conditions[0]?.keyword}</span>
            {submittedState.conditions.length > 1 && ' 외'}
            {' '}에 대한 검색결과
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={onReset}
              className="h-8 px-3 flex items-center gap-1 text-[13px] text-[#464C53] border border-[#CDD1D5] rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 1 1 1.22 3.68M2 8V4.5m0 3.5H5.5" stroke="#464C53" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              초기화
            </button>
            {submittedState.conditions.map((cond, idx) => (
              <span key={idx} className="h-8 px-3 flex items-center gap-1.5 bg-[#F4F5F6] border border-[#CDD1D5] rounded-full text-[13px] text-[#464C53]">
                <span className="text-[#8A949E]">{FIELD_LABELS[cond.field]}:</span>
                {cond.keyword}
                <button onClick={() => onRemoveCondition(idx)} className="text-[#8A949E] hover:text-[#E32929] transition-colors flex items-center">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            ))}
            {(submittedState.filters.year_from || submittedState.filters.year_to) && (
              <span className="h-8 px-3 flex items-center gap-1.5 bg-[#F4F5F6] border border-[#CDD1D5] rounded-full text-[13px] text-[#464C53]">
                {submittedState.filters.year_from ?? ''}~{submittedState.filters.year_to ?? ''}
                <button onClick={onRemoveYearFilter} className="text-[#8A949E] hover:text-[#E32929] transition-colors flex items-center">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-[15px] text-gray-500">검색어를 입력하고 검색을 실행하세요.</p>
      )}
    </div>
  );
}
