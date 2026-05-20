import { useState } from 'react';

interface Props {
  venueName: string;
  submissionUrl?: string;
  onSearch: (keyword: string, yearFrom: string, yearTo: string, yearLabel: string) => void;
  onReset: () => void;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className={`transition-transform ${open ? '' : 'rotate-180'}`}>
    <path d="M5 12.5L10 7.5L15 12.5" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// TODO: Replace with API data
const DUMMY_AUTHORS = ['저자명 (00)', '저자명 (00)', '저자명 (00)', '저자명 (00)', '저자명 (00)'];

const DUMMY_YEARS: { year: string; volumes: string[] }[] = [
  { year: '2025년', volumes: ['35권 3호', '35권 2호', '35권 1호'] },
  { year: '2024년', volumes: [] },
  { year: '2023년', volumes: [] },
];

export default function JournalFilterSidebar({ venueName }: Props) {
  const [keyword, setKeyword] = useState('');
  const [authorOpen, setAuthorOpen] = useState(true);
  const [selectedAuthors, setSelectedAuthors] = useState<number[]>([0]);
  const [yearOpen, setYearOpen] = useState<Record<string, boolean>>({ '2025년': true });
  const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);

  const toggleAuthor = (idx: number) =>
    setSelectedAuthors(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );

  const toggleVolume = (vol: string) =>
    setSelectedVolumes(prev =>
      prev.includes(vol) ? prev.filter(v => v !== vol) : [...prev, vol]
    );

  const toggleYear = (year: string) =>
    setYearOpen(prev => ({ ...prev, [year]: !prev[year] }));

  return (
    <aside className="w-full md:w-[300px] flex-shrink-0">
      <div className="bg-white rounded-xl border border-[#D6E0EB] overflow-hidden">

        {/* 이 저널의 논문 검색 */}
        <div className="px-6 pt-6 pb-5">
          <h3 className="text-[16px] font-bold text-[#1E2124] mb-3">이 저널의 논문 검색</h3>
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="검색어를 입력해주세요."
              className="w-full h-11 px-4 pr-12 border border-[#CDD1D5] rounded-md text-[14px] text-[#1E2124] placeholder:text-[#8A949E] focus:outline-none focus:border-[#256EF4]"
            />
            <button className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#8A949E" strokeWidth="2" />
                <path d="M19 19L14.65 14.65" stroke="#8A949E" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* 동일 발행기관의 다른 저널 */}
        <div className="px-6 pb-6">
          <h3 className="text-[16px] font-bold text-[#1E2124] mb-3">동일 발행기관의 다른 저널</h3>
          <div className="relative">
            <select
              defaultValue={venueName}
              className="w-full h-11 px-4 border border-[#CDD1D5] rounded-md text-[14px] text-[#1E2124] bg-white appearance-none focus:outline-none focus:border-[#256EF4] cursor-pointer"
            >
              {/* TODO: Replace with API data */}
              <option value={venueName}>{venueName}</option>
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E4E7EA]" />

        {/* 저자명 */}
        <div className="px-6">
          <button
            onClick={() => setAuthorOpen(prev => !prev)}
            className="flex items-center justify-between w-full py-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-[#1E2124]">저자명</span>
              {selectedAuthors.length > 0 && (
                <div className="w-5 h-5 flex items-center justify-center bg-[#256EF4] rounded-full">
                  <span className="text-[11px] font-medium text-white leading-none">{selectedAuthors.length}</span>
                </div>
              )}
            </div>
            <ChevronIcon open={authorOpen} />
          </button>
          {authorOpen && (
            <div className="pb-4 max-h-[180px] overflow-y-auto">
              {DUMMY_AUTHORS.map((author, idx) => (
                <label key={idx} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAuthors.includes(idx)}
                    onChange={() => toggleAuthor(idx)}
                    className="w-5 h-5 rounded border-[#CDD1D5] accent-[#256EF4] cursor-pointer"
                  />
                  <span className="text-[14px] text-[#1E2124]">{author}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#E4E7EA]" />

        {/* 년도/권호 */}
        {DUMMY_YEARS.map(({ year, volumes }, i) => (
          <div key={year}>
            <div className="px-6">
              <button
                onClick={() => toggleYear(year)}
                className="flex items-center justify-between w-full py-4"
              >
                <span className={`text-[16px] ${yearOpen[year] ? 'font-bold text-[#1E2124]' : 'font-normal text-[#464C53]'}`}>
                  {year}
                </span>
                <ChevronIcon open={!!yearOpen[year]} />
              </button>
              {yearOpen[year] && volumes.length > 0 && (
                <div className="pb-4 max-h-[180px] overflow-y-auto">
                  {volumes.map(vol => (
                    <label key={vol} className="flex items-center gap-3 py-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVolumes.includes(vol)}
                        onChange={() => toggleVolume(vol)}
                        className="w-5 h-5 rounded border-[#CDD1D5] accent-[#256EF4] cursor-pointer"
                      />
                      <span className="text-[14px] text-[#1E2124]">{vol}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {i < DUMMY_YEARS.length - 1 && <div className="border-t border-[#E4E7EA]" />}
          </div>
        ))}

      </div>
    </aside>
  );
}
