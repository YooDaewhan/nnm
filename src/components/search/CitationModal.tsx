const CITE_FORMATS = [
  { key: 'apa', label: 'APA(7th ed.)' },
  { key: 'mla', label: 'MLA' },
  { key: 'chicago', label: 'Chicago(17th ed.)' },
] as const;

export type CiteFormatKey = typeof CITE_FORMATS[number]['key'];

interface CitationModalProps {
  open: boolean;
  onClose: () => void;
  citeTexts: Record<string, string>;
  citeLoadings: Record<string, boolean>;
  citeCopied: string | null;
  onCopy: (fmt: string) => void;
}

export function CitationModal({ open, onClose, citeTexts, citeLoadings, citeCopied, onCopy }: CitationModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CDD1D5]">
          <span className="text-[17px] font-bold text-[#131416]">인용하기</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="#1E2124" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-0 pb-2">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-y border-[#CDD1D5]">
                <th className="py-2.5 px-4 w-[140px] text-[13px] font-medium text-[#8A949E] text-left">양식이름</th>
                <th className="py-2.5 px-3 text-[13px] font-medium text-[#8A949E] text-left">인용양식</th>
                <th className="py-2.5 px-4 w-[72px] text-[13px] font-medium text-[#8A949E] text-center">복사</th>
              </tr>
            </thead>
            <tbody>
              {CITE_FORMATS.map(({ key, label }) => (
                <tr key={key} className="border-b border-[#CDD1D5] last:border-b-0">
                  <td className="py-4 px-4 w-[140px] align-top">
                    <span className="text-[13px] font-medium text-[#131416]">{label}</span>
                  </td>
                  <td className="py-4 px-3 align-top">
                    {citeLoadings[key] ? (
                      <span className="text-[13px] text-[#8A949E]">불러오는 중...</span>
                    ) : citeTexts[key] ? (
                      <span className="text-[13px] leading-[1.7em] text-[#131416] select-all">{citeTexts[key]}</span>
                    ) : (
                      <span className="text-[13px] text-[#8A949E]">인용 정보를 불러오지 못했습니다.</span>
                    )}
                  </td>
                  <td className="py-4 px-4 w-[72px] align-middle text-center">
                    <button
                      onClick={() => onCopy(key)}
                      disabled={!citeTexts[key] || citeLoadings[key]}
                      className="w-8 h-8 inline-flex items-center justify-center rounded hover:bg-[#F0F2F5] transition-colors disabled:opacity-40"
                      title="복사"
                    >
                      {citeCopied === key ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l4 4 6-7" stroke="#256EF4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="5.5" y="1.5" width="9" height="11" rx="1.2" stroke="#8A949E" strokeWidth="1.2" />
                          <rect x="1.5" y="4.5" width="9" height="11" rx="1.2" stroke="#8A949E" strokeWidth="1.2" fill="white" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export { CITE_FORMATS };
