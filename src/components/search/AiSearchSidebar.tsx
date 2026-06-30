import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postAnalyze, AnalyzeResponse, AiApiError } from '@/api/ai';

function buildChunkMap(data: AnalyzeResponse) {
  const chunkToPub = new Map(
    (data.chunks ?? []).filter(c => c.publication_id).map(c => [c.chunk_id, c.publication_id!])
  );
  const pubToIdx = new Map(data.references.map((ref, i) => [ref.publication_id, i + 1]));
  return { chunkToPub, pubToIdx };
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18" height="18" viewBox="0 0 20 20" fill="none"
    className={`transition-transform ${open ? '' : 'rotate-180'}`}
  >
    <path d="M5 12.5L10 7.5L15 12.5" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function AnalysisAnswer({ data }: { data: AnalyzeResponse }) {
  const { chunkToPub, pubToIdx } = buildChunkMap(data);
  const formattedAnswer = data.answer.replace(/\[#(\d+)\]/g, (_, id) => {
    const pubId = chunkToPub.get(Number(id));
    const idx = pubId ? pubToIdx.get(pubId) : undefined;
    return idx != null ? `[${idx}]` : '';
  });

  return (
    <p className="text-[13px] text-[#1E2124] leading-relaxed whitespace-pre-wrap">{formattedAnswer}</p>
  );
}

function RefsPanel({ data }: { data: AnalyzeResponse }) {
  return (
    <div className="mt-3">
      <h4 className="text-[12px] font-semibold text-[#8A949E] mb-2">추천 논문</h4>
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

export function AiSearchSidebar() {
  const [open, setOpen] = useState(true);
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [refsExpanded, setRefsExpanded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-sidebar-analyze', submittedQuestion],
    queryFn: () => postAnalyze({ question: submittedQuestion, top_k: 12, min_similarity: 0.3 }),
    enabled: !!submittedQuestion,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || isLoading) return;
    setSubmittedQuestion(q);
    setRefsExpanded(false);
  };

  return (
    <div className="bg-white rounded-xl border border-[#D6E0EB]">
      <div className="px-6 pt-6 pb-4 space-y-0">

        {/* 아코디언 헤더 */}
        <div className="border-b border-[#E4E7EA]">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center justify-between w-full py-3.5"
          >
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8.5" stroke="#256EF4" strokeWidth="1.5"/>
                <path d="M7.5 8C7.5 6.61929 8.61929 5.5 10 5.5C11.3807 5.5 12.5 6.61929 12.5 8C12.5 9.38071 11.3807 10.5 10 10.5V12" stroke="#256EF4" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="14" r="0.75" fill="#256EF4"/>
              </svg>
              <span className="text-[16px] font-bold text-[#1E2124]">AI 검색</span>
            </div>
            <ChevronIcon open={open} />
          </button>

          {open && (
            <div className="pb-5 pt-1">
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="AI에게 질문을 입력하세요."
                className="w-full h-[80px] px-4 py-3 border border-[#CDD1D5] rounded-md text-[14px] text-[#1E2124] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4] resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

      </div>

      {open && (
        <>
          {/* 질문 보내기 버튼 */}
          <div className="px-6 pb-4 pt-0">
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || isLoading}
              className="w-full h-11 rounded-md bg-[#256EF4] text-[15px] font-normal text-white hover:bg-[#1e4ec9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              질문 보내기
            </button>
          </div>

          {/* AI 응답 영역 */}
          {(isLoading || error || data) && (
            <div className="border-t border-[#E4E7EA] px-6 py-5">
              {isLoading && (
                <div className="flex items-center gap-2 text-[13px] text-[#8A949E]">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#256EF4]" />
                  AI 분석 중...
                </div>
              )}

              {error && !isLoading && (
                <p className="text-[13px] text-[#8A949E]">
                  {error instanceof AiApiError && error.isRetryable
                    ? '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
                    : '분석 요청 중 오류가 발생했습니다.'}
                </p>
              )}

              {data && !isLoading && (
                <>
                  <AnalysisAnswer data={data} />
                  {data.references.length > 0 && (
                    <>
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => setRefsExpanded(v => !v)}
                          className="flex items-center gap-1 text-[12px] text-[#256EF4] hover:text-[#1a4fc0] transition-colors"
                        >
                          <span>{refsExpanded ? '접기' : '추천논문 보기'}</span>
                          <svg
                            width="14" height="14" viewBox="0 0 20 20" fill="none"
                            className={`transition-transform duration-300 ${refsExpanded ? 'rotate-180' : ''}`}
                          >
                            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      {refsExpanded && <RefsPanel data={data} />}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
