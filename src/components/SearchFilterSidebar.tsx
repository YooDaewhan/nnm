import { useState } from 'react';

export interface Filters {
  providerName: string[];
  venueName: string;
  yearFrom: string;
  yearTo: string;
  yearLabel: string;
}

export interface ProviderOption {
  id: number;
  name: string;
  abbr?: string;
}

const DEFAULT_FILTERS: Filters = {
  providerName: [],
  venueName: '',
  yearFrom: '',
  yearTo: '',
  yearLabel: '',
};

interface Props {
  onApply: (filters: Filters, withinQuery: string) => void;
  onReset: () => void;
  onWithinSearch: (withinQuery: string) => void;
  providers?: ProviderOption[];
}

export default function SearchFilterSidebar({ onApply, onReset, onWithinSearch, providers }: Props) {
  const [accordionOpen, setAccordionOpen] = useState({
    search: true,
    year: false,
    venue: false,
  });

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [withinQuery, setWithinQuery] = useState('');
  const [activeYearBtn, setActiveYearBtn] = useState<string | null>(null);

  const toggle = (key: keyof typeof accordionOpen) =>
    setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const currentYear = new Date().getFullYear();

  const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className={`transition-transform ${open ? '' : 'rotate-180'}`}>
      <path d="M5 12.5L10 7.5L15 12.5" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const yearButtons = [
    { label: '6개월', years: 0.5 },
    { label: '1년', years: 1 },
    { label: '3년', years: 3 },
    { label: '5년', years: 5 },
  ];

  return (
    <aside className="w-full md:w-[300px] flex-shrink-0">
      <div className="bg-white rounded-xl border border-[#D6E0EB]">
        <div className="px-6 pt-6 pb-4 space-y-0">

          {/* 결과 내 검색 */}
          <div className="border-b border-[#E4E7EA]">
            <button onClick={() => toggle('search')} className="flex items-center justify-between w-full py-3.5">
              <span className="text-[16px] font-bold text-[#1E2124]">결과 내 검색</span>
              <ChevronIcon open={accordionOpen.search} />
            </button>
            {accordionOpen.search && (
              <div className="pb-5 pt-1">
                <div  className="relative">
                  <input
                    type="text"
                    value={withinQuery}
                    onChange={(e) => setWithinQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && withinQuery.trim()) {
                        onWithinSearch(withinQuery.trim());
                        setWithinQuery('');
                      }
                    }}
                    placeholder="검색어 또는 질문을 입력하세요."
                    className="w-full h-10 px-4 pr-12 border border-[#CDD1D5] rounded-md text-[14px] text-[#1E2124] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
                  />
                  <button
                    onClick={() => {
                      if (withinQuery.trim()) {
                        onWithinSearch(withinQuery.trim());
                        setWithinQuery('');
                      }
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#8A949E" strokeWidth="2"/>
                      <path d="M19 19L14.65 14.65" stroke="#8A949E" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 발행일 */}
          <div className="border-b border-[#E4E7EA]">
            <button onClick={() => toggle('year')} className="flex items-center justify-between w-full py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-[#1E2124]">발행일</span>
                {(filters.yearFrom || filters.yearTo) && (
                  <div className="w-5 h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                    <span className="text-[11px] font-medium text-white leading-none">1</span>
                  </div>
                )}
              </div>
              <ChevronIcon open={accordionOpen.year} />
            </button>
            {accordionOpen.year && (
              <div className="pb-5 pt-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {yearButtons.map(({ label, years }) => {
                    const isActive = activeYearBtn === label;
                    const fromYear = years < 1
                      ? String(currentYear)
                      : String(currentYear - Math.round(years) + 1);
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          setActiveYearBtn(isActive ? null : label);
                          setFilters(prev => ({
                            ...prev,
                            yearFrom: isActive ? '' : fromYear,
                            yearTo: isActive ? '' : String(currentYear),
                            yearLabel: isActive ? '' : label,
                          }));
                        }}
                        className={`h-8 px-3 rounded-md text-[13px] font-normal transition-colors border ${
                          isActive
                            ? 'bg-[#ECF2FE] text-[#256EF4] border-[#256EF4]'
                            : 'bg-white text-[#464C53] border-[#CDD1D5] hover:border-[#256EF4]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 학회 / 학술지 */}
          {providers && providers.length > 0 && (
            <div className="border-b border-[#E4E7EA]">
              <button onClick={() => toggle('venue')} className="flex items-center justify-between w-full py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold text-[#1E2124]">학회 / 학술지</span>
                  {(filters.providerName.length > 0 || filters.venueName) && (
                    <div className="w-5 h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                      <span className="text-[11px] font-medium text-white leading-none">
                        {filters.providerName.length || 1}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronIcon open={accordionOpen.venue} />
              </button>
              {accordionOpen.venue && (
                <div className="pb-5 pt-1">
                  <div className="flex flex-wrap gap-2">
                    {providers.map((p) => {
                      const isSelected = filters.providerName.includes(p.name);
                      return (
                        <button
                          key={p.id}
                          title={p.name}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            providerName: isSelected
                              ? prev.providerName.filter(n => n !== p.name)
                              : [...prev.providerName, p.name],
                          }))}
                          className={`h-8 px-3 rounded-full text-[13px] font-normal transition-colors border whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis ${
                            isSelected
                              ? 'bg-[#ECF2FE] text-[#0B50D0] border-[#256EF4]'
                              : 'bg-white text-[#464C53] border-[#CDD1D5] hover:border-[#256EF4]'
                          }`}
                        >
                          {p.abbr || p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 초기화 / 적용하기 */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setWithinQuery('');
              setActiveYearBtn(null);
              onReset();
            }}
            className="flex-1 h-11 rounded-md border border-[#CDD1D5] text-[15px] font-normal text-[#464C53] hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
          <button
            onClick={() => onApply(filters, withinQuery)}
            className="flex-1 h-11 rounded-md bg-[#256EF4] text-[15px] font-normal text-white hover:bg-[#1e4ec9] transition-colors"
          >
            적용하기
          </button>
        </div>
      </div>
    </aside>
  );
}
