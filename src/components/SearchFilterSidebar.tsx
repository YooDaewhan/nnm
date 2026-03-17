import { useState } from 'react';

interface Filters {
  documentTypes: string[];
  languages: string[];
  registrations: string[];
  subjects: string[];
  dateRange: { start: string; end: string };
}

interface Props {
  onApply: (filters: Filters) => void;
  onReset: () => void;
}

export default function SearchFilterSidebar({ onApply, onReset }: Props) {
  const [accordionOpen, setAccordionOpen] = useState({
    search: true,
    documentType: true,
    date: false,
    language: false,
    registration: false,
    subject: false,
  });

  const [filters, setFilters] = useState<Filters>({
    documentTypes: [],
    languages: [],
    registrations: [],
    subjects: [],
    dateRange: { start: '', end: '' },
  });

  const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={`transition-transform ${open ? '' : 'rotate-180'}`}>
      <path d="M5 12.5L10 7.5L15 12.5" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <aside className="w-[340px] flex-shrink-0">
      <div className="bg-white rounded-xl border border-[#D6E0EB]">
        <div className="px-8 pt-8 pb-8 space-y-0">

          {/* 결과 내 검색 */}
          <div className="border-b border-[#CDD1D5]">
            <button
              onClick={() => setAccordionOpen(prev => ({ ...prev, search: !prev.search }))}
              className="flex items-center justify-between w-full py-3"
            >
              <span className="text-[17px] font-bold text-[#1E2124]">결과 내 검색</span>
              <ChevronIcon open={accordionOpen.search} />
            </button>
            {accordionOpen.search && (
              <div className="pb-8 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="검색어를 입력해주세요."
                    className="w-full h-10 px-4 pr-12 border border-[#58616A] rounded-md text-[15px] text-[#1E2124] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
                  />
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#33363D" strokeWidth="2"/>
                    <path d="M19 19L14.65 14.65" stroke="#33363D" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* 자료유형 */}
          <div className="border-t border-[#CDD1D5]">
            <button
              onClick={() => setAccordionOpen(prev => ({ ...prev, documentType: !prev.documentType }))}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#1E2124]">자료유형</span>
                <div className="w-[26px] h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                  <span className="text-[15px] font-normal text-white leading-none">1</span>
                </div>
              </div>
              <ChevronIcon open={accordionOpen.documentType} />
            </button>
            {accordionOpen.documentType && (
              <div className="pb-8 pt-2">
                <div className="flex flex-col">
                  <div className="max-h-[200px] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      {[
                        { label: '학술저널 (18,201)', checked: true },
                        { label: '학술연구보고서 (2,301)', checked: false },
                        { label: '학술대회자료 (39)', checked: false },
                        { label: '전문잡지 (32)', checked: false },
                        { label: '국가지식-학술정보 (392)', checked: false },
                      ].map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.checked
                              ? 'bg-[#256EF4] border-[#256EF4]'
                              : 'bg-white border-[#58616A] group-hover:border-[#256EF4]'
                          }`}>
                            {item.checked && <CheckIcon />}
                          </div>
                          <span className="text-[15px] text-[#131416] leading-[1.5em]">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 날짜 선택 */}
          <div className="border-t border-[#CDD1D5]">
            <button
              onClick={() => setAccordionOpen(prev => ({ ...prev, date: !prev.date }))}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#1E2124]">날짜 선택</span>
                <div className="w-[26px] h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                  <span className="text-[15px] font-normal text-white leading-none">1</span>
                </div>
              </div>
              <ChevronIcon open={accordionOpen.date} />
            </button>
            {accordionOpen.date && (
              <div className="pb-8 pt-2 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {['6개월', '1년', '3년', '5년'].map((period, idx) => (
                    <button
                      key={period}
                      className={`h-10 px-2.5 rounded-md text-[15px] font-normal transition-colors ${
                        idx === 1
                          ? 'bg-[#ECF2FE] text-[#0B50D0] border border-[#256EF4]'
                          : 'bg-white text-[#1E2124] border border-[#B1B8BE] hover:border-[#256EF4]'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <label className="block text-[15px] font-normal text-[#464C53] mb-1">시작날짜</label>
                    <input
                      type="text"
                      placeholder="YYYY.MM.DD"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                      className="w-full h-10 px-4 border border-[#58616A] rounded-md text-[15px] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
                    />
                  </div>
                  <div className="w-2 h-10 flex items-center justify-center text-[15px] text-[#1E2124]">-</div>
                  <div className="flex-1">
                    <label className="block text-[15px] font-normal text-[#464C53] mb-1">종료날짜</label>
                    <input
                      type="text"
                      placeholder="YYYY.MM.DD"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                      className="w-full h-10 px-4 border border-[#58616A] rounded-md text-[15px] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 언어 */}
          <div className="border-t border-[#CDD1D5]">
            <button
              onClick={() => setAccordionOpen(prev => ({ ...prev, language: !prev.language }))}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#1E2124]">언어</span>
                <div className="w-[26px] h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                  <span className="text-[15px] font-normal text-white leading-none">2</span>
                </div>
              </div>
              <ChevronIcon open={accordionOpen.language} />
            </button>
            {accordionOpen.language && (
              <div className="pb-8 pt-2">
                <div className="space-y-2">
                  {[
                    { label: '한국어 (234)', checked: true },
                    { label: '영어 (220)', checked: true },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        item.checked
                          ? 'bg-[#256EF4] border-[#256EF4]'
                          : 'bg-white border-[#58616A] group-hover:border-[#256EF4]'
                      }`}>
                        {item.checked && <CheckIcon />}
                      </div>
                      <span className="text-[15px] text-[#131416] leading-[1.5em]">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 등재정보 */}
          <div className="border-t border-[#CDD1D5]">
            <button
              onClick={() => setAccordionOpen(prev => ({ ...prev, registration: !prev.registration }))}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#1E2124]">등재정보</span>
                <div className="w-[26px] h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                  <span className="text-[15px] font-normal text-white leading-none">2</span>
                </div>
              </div>
              <ChevronIcon open={accordionOpen.registration} />
            </button>
            {accordionOpen.registration && (
              <div className="pb-8 pt-2">
                <div className="space-y-2">
                  {[
                    { label: 'KCI등재 (234)', checked: true },
                    { label: 'KCI우수등재 (220)', checked: true },
                    { label: 'KCI등재후보 (39)', checked: false },
                    { label: 'SCOPUS (1)', checked: false },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        item.checked
                          ? 'bg-[#256EF4] border-[#256EF4]'
                          : 'bg-white border-[#58616A] group-hover:border-[#256EF4]'
                      }`}>
                        {item.checked && <CheckIcon />}
                      </div>
                      <span className="text-[15px] text-[#131416] leading-[1.5em]">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 주제분류 */}
          <div className="border-t border-[#CDD1D5]">
            <button
              onClick={() => setAccordionOpen(prev => ({ ...prev, subject: !prev.subject }))}
              className="flex items-center justify-between w-full py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-[#1E2124]">주제분류</span>
                <div className="w-[26px] h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                  <span className="text-[15px] font-normal text-white leading-none">1</span>
                </div>
              </div>
              <ChevronIcon open={accordionOpen.subject} />
            </button>
            {accordionOpen.subject && (
              <div className="pb-8 pt-2">
                <div className="space-y-2">
                  {[
                    { label: '인문학 (14,215)', checked: false },
                    { label: '사회과학 (8,908)', checked: true },
                    { label: '의약학 (5,725)', checked: false },
                    { label: '교육 (3,378)', checked: false },
                    { label: '복합학 (2,871)', checked: false },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        item.checked
                          ? 'bg-[#256EF4] border-[#256EF4]'
                          : 'bg-white border-[#58616A] group-hover:border-[#256EF4]'
                      }`}>
                        {item.checked && <CheckIcon />}
                      </div>
                      <span className="text-[15px] text-[#131416] leading-[1.5em]">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 초기화 및 적용하기 버튼 */}
        <div className="flex gap-4 px-8 pb-8">
          <button
            onClick={onReset}
            className="flex-1 h-12 rounded-md border border-[#58616A] text-[17px] font-normal text-[#1E2124] hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
          <button
            onClick={() => onApply(filters)}
            className="flex-1 h-12 rounded-md bg-[#256EF4] text-[17px] font-normal text-white hover:bg-[#1e4ec9] transition-colors"
          >
            적용하기
          </button>
        </div>
      </div>
    </aside>
  );
}
