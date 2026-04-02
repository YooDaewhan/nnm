import { useState } from 'react';

export interface Filters {
  sort: 'relevance' | 'popularity' | 'latest';
  providerName: string;
  venueName: string;
  yearFrom: string;
  yearTo: string;
}

export interface ProviderOption {
  id: number;
  name: string;
  abbr?: string;
}

const DEFAULT_FILTERS: Filters = {
  sort: 'relevance',
  providerName: '',
  venueName: '',
  yearFrom: '',
  yearTo: '',
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
    sort: true,
    year: false,
    venue: false,
  });

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [withinQuery, setWithinQuery] = useState('');

  const toggle = (key: keyof typeof accordionOpen) =>
    setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const currentYear = new Date().getFullYear();

  const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={`transition-transform ${open ? '' : 'rotate-180'}`}>
      <path d="M5 12.5L10 7.5L15 12.5" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <aside className="w-[340px] flex-shrink-0">
      <div className="bg-white rounded-xl border border-[#D6E0EB]">
        <div className="px-8 pt-8 pb-8 space-y-0">

          {/* 결과 내 검색 → within_ids */}
          <div className="border-b border-[#CDD1D5]">
            <button onClick={() => toggle('search')} className="flex items-center justify-between w-full py-3">
              <span className="text-[17px] font-bold text-[#1E2124]">결과 내 검색</span>
              <ChevronIcon open={accordionOpen.search} />
            </button>
            {accordionOpen.search && (
              <div className="pb-6 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={withinQuery}
                    onChange={(e) => setWithinQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && withinQuery.trim()) onWithinSearch(withinQuery.trim()); }}
                    placeholder="검색어를 입력해주세요."
                    className="w-full h-10 px-4 pr-12 border border-[#58616A] rounded-md text-[15px] text-[#1E2124] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
                  />
                  <button
                    onClick={() => { if (withinQuery.trim()) onWithinSearch(withinQuery.trim()); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#33363D" strokeWidth="2"/>
                      <path d="M19 19L14.65 14.65" stroke="#33363D" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 정렬 → sort */}
          <div className="border-t border-[#CDD1D5]">
            <button onClick={() => toggle('sort')} className="flex items-center justify-between w-full py-3">
              <span className="text-[17px] font-bold text-[#1E2124]">정렬</span>
              <ChevronIcon open={accordionOpen.sort} />
            </button>
            {accordionOpen.sort && (
              <div className="pb-6 pt-2 flex gap-2">
                {([
                  { value: 'relevance', label: '관련도순' },
                  { value: 'popularity', label: '인기순' },
                  { value: 'latest', label: '최신순' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilters(prev => ({ ...prev, sort: value }))}
                    className={`h-9 px-3 rounded-md text-[15px] font-normal transition-colors border ${
                      filters.sort === value
                        ? 'bg-[#ECF2FE] text-[#0B50D0] border-[#256EF4]'
                        : 'bg-white text-[#1E2124] border-[#B1B8BE] hover:border-[#256EF4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 출판연도 → filters.year */}
          <div className="border-t border-[#CDD1D5]">
            <button onClick={() => toggle('year')} className="flex items-center justify-between w-full py-3">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#1E2124]">출판연도</span>
                {(filters.yearFrom || filters.yearTo) && (
                  <div className="w-[26px] h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                    <span className="text-[15px] font-normal text-white leading-none">1</span>
                  </div>
                )}
              </div>
              <ChevronIcon open={accordionOpen.year} />
            </button>
            {accordionOpen.year && (
              <div className="pb-6 pt-2 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: '1년', years: 1 },
                    { label: '3년', years: 3 },
                    { label: '5년', years: 5 },
                    { label: '10년', years: 10 },
                  ]).map(({ label, years }) => (
                    <button
                      key={label}
                      onClick={() => setFilters(prev => ({ ...prev, yearFrom: String(currentYear - years + 1), yearTo: String(currentYear) }))}
                      className="h-9 px-3 rounded-md text-[15px] font-normal transition-colors bg-white text-[#1E2124] border border-[#B1B8BE] hover:border-[#256EF4]"
                    >
                      최근 {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                    placeholder="시작연도"
                    min="1900"
                    max={currentYear}
                    className="flex-1 h-10 px-3 border border-[#58616A] rounded-md text-[15px] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
                  />
                  <span className="text-[15px] text-[#1E2124]">~</span>
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                    placeholder="종료연도"
                    min="1900"
                    max={currentYear}
                    className="flex-1 h-10 px-3 border border-[#58616A] rounded-md text-[15px] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 학회 / 학술지 → provider_name, venue_name */}
          <div className="border-t border-[#CDD1D5]">
            <button onClick={() => toggle('venue')} className="flex items-center justify-between w-full py-3">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#1E2124]">학회 / 학술지</span>
                {(filters.providerName || filters.venueName) && (
                  <div className="w-[26px] h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                    <span className="text-[15px] font-normal text-white leading-none">1</span>
                  </div>
                )}
              </div>
              <ChevronIcon open={accordionOpen.venue} />
            </button>
            {accordionOpen.venue && (
              <div className="pb-6 pt-2 space-y-3">
                {providers && providers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {providers.map((p) => {
                      const isSelected = filters.providerName === p.name;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setFilters(prev => ({ ...prev, providerName: isSelected ? '' : p.name }))}
                          className={`h-8 px-3 rounded-full text-[14px] font-normal transition-colors border ${
                            isSelected
                              ? 'bg-[#ECF2FE] text-[#0B50D0] border-[#256EF4]'
                              : 'bg-white text-[#464C53] border-[#B1B8BE] hover:border-[#256EF4]'
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 초기화 / 적용하기 */}
        <div className="flex gap-4 px-8 pb-8">
          <button
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setWithinQuery('');
              onReset();
            }}
            className="flex-1 h-12 rounded-md border border-[#58616A] text-[17px] font-normal text-[#1E2124] hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
          <button
            onClick={() => onApply(filters, withinQuery)}
            className="flex-1 h-12 rounded-md bg-[#256EF4] text-[17px] font-normal text-white hover:bg-[#1e4ec9] transition-colors"
          >
            적용하기
          </button>
        </div>
      </div>
    </aside>
  );
}
