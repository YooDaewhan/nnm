import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DetailedSearchCondition } from '@/api/search';
import { postAnalyze, AnalyzeResponse, AiApiError } from '@/api/ai';

const FIELD_LABELS: Record<string, string> = {
  title: '제목', author: '저자', abstract: '초록',
  keyword: '키워드', doi: 'DOI', full_text: '전문',
};

interface SubmittedState {
  conditions: DetailedSearchCondition[];
  sort: 'relevance' | 'latest';
  filters: { year_from?: number; year_to?: number; year_label?: string; journal?: string };
}

interface SearchResultHeaderProps {
  submittedState: SubmittedState | null;
  yearLabel: string;
  onReset: () => void;
  onRemoveCondition: (idx: number) => void;
  onRemoveYearFilter: () => void;
  onRemoveJournalFilter: (remaining?: string) => void;
}

const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M2 8a6 6 0 1 1 1.22 3.68M2 8V4.5m0 3.5H5.5" stroke="#464C53" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="20" height="20" viewBox="0 0 20 20" fill="none"
    className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
  >
    <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function buildChunkMap(data: AnalyzeResponse) {
  const chunkToPub = new Map(
    (data.chunks ?? []).filter(c => c.publication_id).map(c => [c.chunk_id, c.publication_id!])
  );
  const pubToIdx = new Map(data.references.map((ref, i) => [ref.publication_id, i + 1]));
  return { chunkToPub, pubToIdx };
}

function AnalysisAnswer({ data }: { data: AnalyzeResponse }) {
  const { chunkToPub, pubToIdx } = buildChunkMap(data);
  const formattedAnswer = data.answer.replace(/\[#(\d+)\]/g, (_, id) => {
    const pubId = chunkToPub.get(Number(id));
    const idx = pubId ? pubToIdx.get(pubId) : undefined;
    return idx != null ? `[${idx}]` : '';
  });

  return (
    <div className="mt-5 pt-5 border-t border-[#C4D8FF]">
      <p className="text-[14px] text-[#1E2124] leading-relaxed whitespace-pre-wrap">{formattedAnswer}</p>
    </div>
  );
}

function RefsPanel({ data }: { data: AnalyzeResponse }) {
  return (
    <div className="mt-3">
      <h4 className="text-[13px] font-semibold text-[#8A949E] mb-2">추천 논문</h4>
      <ol className="space-y-1">
        {data.references.map((ref, i) => (
          <li key={ref.publication_id} className="flex gap-2 text-[12px] text-[#464C53]">
            <span className="shrink-0 font-medium text-[#256EF4]">[{i + 1}]</span>
            <span>{ref.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SearchResultHeader({ submittedState, yearLabel, onReset, onRemoveCondition, onRemoveYearFilter, onRemoveJournalFilter }: SearchResultHeaderProps) {
  const andConditions = submittedState?.conditions.slice(1) ?? [];
  const hasYearFilter = !!(submittedState?.filters.year_from || submittedState?.filters.year_to);
  const journalString = Array.isArray(submittedState?.filters.journal)
    ? (submittedState!.filters.journal as unknown as string[]).join(',')
    : (submittedState?.filters.journal ?? '');
  const hasJournalFilter = !!journalString;
  const hasAnyFilter = andConditions.length > 0 || hasYearFilter || hasJournalFilter;

  const [refsExpanded, setRefsExpanded] = useState(false);
  const topic = submittedState?.conditions[0]?.keyword ?? '';

  const { data: analyzeData, isLoading: analyzeLoading, error: analyzeError } = useQuery({
    queryKey: ['ai-analyze', topic],
    queryFn: () => postAnalyze({ question: topic, top_k: 12, min_similarity: 0.3 }),
    enabled: !!topic,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  return (
    <div className="mb-6 bg-[#EEF3FF] rounded-xl border border-[#D4E2FF] px-6 py-5">
      {submittedState ? (
        <>
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1E2124] mb-4">
            <span className="text-[#256EF4]">{submittedState.conditions[0]?.keyword}</span>
            {andConditions.length > 0 && ' 외'}
            {' '}에 대한 검색결과
          </h2>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[13px] font-medium text-[#8A949E] whitespace-nowrap shrink-0">적용된 검색 조건</span>
            <button
              onClick={onReset}
              className="h-7 w-7 flex items-center justify-center text-[#464C53] border border-[#C4CDD6] rounded-full hover:bg-white/60 transition-colors shrink-0"
              title="초기화"
            >
              <ResetIcon />
            </button>
            {andConditions.map((cond, idx) => (
              <span key={idx} className="h-7 px-3 flex items-center gap-1.5 bg-white/70 border border-[#C4D8FF] rounded-full text-[13px] text-[#464C53]">
                <span className="text-[#8A949E]">{FIELD_LABELS[cond.field]}:</span>
                {cond.keyword}
                <button onClick={() => onRemoveCondition(idx + 1)} className="text-[#8A949E] hover:text-[#E32929] transition-colors flex items-center">
                  <CloseIcon />
                </button>
              </span>
            ))}
            {hasYearFilter && (
              <span className="h-7 px-3 flex items-center gap-1.5 bg-white/70 border border-[#C4D8FF] rounded-full text-[13px] text-[#464C53]">
                {yearLabel || `${submittedState.filters.year_from ?? ''}~${submittedState.filters.year_to ?? ''}`}
                <button onClick={onRemoveYearFilter} className="text-[#8A949E] hover:text-[#E32929] transition-colors flex items-center">
                  <CloseIcon />
                </button>
              </span>
            )}
            {hasJournalFilter && journalString.split(',').map((j: string, i: number, arr: string[]) => (
              <span key={j} className="h-7 px-3 flex items-center gap-1.5 bg-white/70 border border-[#C4D8FF] rounded-full text-[13px] text-[#464C53]">
                <span className="text-[#8A949E]">학술지:</span>
                {j}
                <button
                  onClick={() => {
                    const remaining = arr.filter((_: string, idx: number) => idx !== i);
                    remaining.length === 0 ? onRemoveJournalFilter() : onRemoveJournalFilter(remaining.join(','));
                  }}
                  className="text-[#8A949E] hover:text-[#E32929] transition-colors flex items-center"
                >
                  <CloseIcon />
                </button>
              </span>
            ))}
            {!hasAnyFilter && (
              <span className="text-[13px] text-[#8A949E]">적용된 조건이 없습니다.</span>
            )}
          </div>

          {/* AI 분석 결과 (검색 시 자동 표시) */}
          {analyzeLoading && (
            <div className="mt-5 pt-5 border-t border-[#C4D8FF] flex items-center gap-2 text-[13px] text-[#8A949E]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#256EF4]" />
              AI 분석 중...
            </div>
          )}
          {analyzeError && (
            <div className="mt-5 pt-5 border-t border-[#C4D8FF] text-[13px] text-[#8A949E]">
              {analyzeError instanceof AiApiError && analyzeError.isRetryable
                ? '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
                : '분석 요청 중 오류가 발생했습니다.'}
            </div>
          )}
          {analyzeData && <AnalysisAnswer data={analyzeData} />}

          {/* 추천논문 보기/접기 버튼 */}
          {analyzeData && analyzeData.references.length > 0 && (
            <>
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setRefsExpanded(v => !v)}
                  className="flex items-center gap-1 text-[13px] text-[#256EF4] hover:text-[#1a4fc0] transition-colors"
                >
                  <span>{refsExpanded ? '접기' : '추천논문 보기'}</span>
                  <ChevronIcon open={refsExpanded} />
                </button>
              </div>
              {refsExpanded && <RefsPanel data={analyzeData} />}
            </>
          )}
        </>
      ) : (
        <p className="text-[15px] text-gray-500">검색어를 입력하고 검색을 실행하세요.</p>
      )}
    </div>
  );
}
