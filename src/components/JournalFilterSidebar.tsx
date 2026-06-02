import { useState } from 'react';

interface Props {
  venueName?: string;
  submissionUrl?: string;
  onSearch: (keyword: string, yearFrom: string, yearTo: string, yearLabel: string) => void;
  onReset: () => void;
}

interface JournalFilters {
  yearFrom: string;
  yearTo: string;
  yearLabel: string;
}

const DEFAULT_FILTERS: JournalFilters = {
  yearFrom: '',
  yearTo: '',
  yearLabel: '',
};

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transition: 'transform 0.2s',
      transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
      flexShrink: 0,
    }}
  >
    <path
      d="M6 15L12 9L18 15"
      stroke="#33363D"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function JournalFilterSidebar({ onSearch, onReset }: Props) {
  const [accordionOpen, setAccordionOpen] = useState({
    search: true,
    year: false,
  });

  const [filters, setFilters] = useState<JournalFilters>(DEFAULT_FILTERS);
  const [withinQuery, setWithinQuery] = useState('');
  const [activeYearBtn, setActiveYearBtn] = useState<string | null>(null);

  const toggle = (key: keyof typeof accordionOpen) =>
    setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const currentYear = new Date().getFullYear();

  const yearButtons = [
    { label: '6개월', years: 0.5 },
    { label: '1년', years: 1 },
    { label: '3년', years: 3 },
    { label: '5년', years: 5 },
  ];

  const handleWithinSearch = () => {
    if (withinQuery.trim()) {
      onSearch(withinQuery.trim(), filters.yearFrom, filters.yearTo, filters.yearLabel);
    }
  };

  const handleApply = () => {
    onSearch(withinQuery, filters.yearFrom, filters.yearTo, filters.yearLabel);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setWithinQuery('');
    setActiveYearBtn(null);
    onReset();
  };

  return (
    <aside style={{ width: 300, flexShrink: 0 }}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #CDD1D5',
          padding: '16px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* ── 결과 내 검색 ── */}
        <section style={{ width: '100%', padding: '4px 0' }}>
          <button
            type="button"
            onClick={() => toggle('search')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'Pretendard GOV', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                lineHeight: '150%',
                color: '#1E2124',
              }}
            >
              결과 내 검색
            </span>
            <ChevronIcon open={accordionOpen.search} />
          </button>

          {accordionOpen.search && (
            <div style={{ paddingBottom: 24, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  height: 48,
                  padding: '0 16px',
                  background: '#F4F5F6',
                  gap: 8,
                }}
              >
                <input
                  type="text"
                  value={withinQuery}
                  onChange={(e) => setWithinQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWithinSearch();
                  }}
                  placeholder="검색어를 입력해주세요."
                  style={{
                    flex: 1,
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 17,
                    lineHeight: '150%',
                    color: '#1E2124',
                    minWidth: 0,
                  }}
                />
                <button
                  type="button"
                  onClick={handleWithinSearch}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-label="검색"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="6.5" stroke="#33363D" strokeWidth="1.5" />
                    <path d="M14 14L18 18" stroke="#33363D" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── 발행일 ── */}
        <section style={{ width: '100%', padding: '4px 0', borderTop: '1px solid #CDD1D5' }}>
          <button
            type="button"
            onClick={() => toggle('year')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  lineHeight: '150%',
                  color: '#1E2124',
                }}
              >
                발행일
              </span>
              {(filters.yearFrom || filters.yearTo) && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 26,
                    height: 20,
                    padding: '0 8px',
                    background: '#256EF4',
                    borderRadius: 1000,
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 15,
                    lineHeight: 1,
                    color: '#FFFFFF',
                  }}
                >
                  1
                </span>
              )}
            </div>
            <ChevronIcon open={accordionOpen.year} />
          </button>

          {accordionOpen.year && (
            <div style={{ paddingBottom: 24, paddingTop: 4 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {yearButtons.map(({ label, years }) => {
                  const isActive = activeYearBtn === label;
                  const fromYear = years < 1
                    ? String(currentYear)
                    : String(currentYear - Math.round(years) + 1);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setActiveYearBtn(isActive ? null : label);
                        setFilters(prev => ({
                          ...prev,
                          yearFrom: isActive ? '' : fromYear,
                          yearTo: isActive ? '' : String(currentYear),
                          yearLabel: isActive ? '' : label,
                        }));
                      }}
                      style={{
                        height: 32,
                        padding: '0 12px',
                        borderRadius: 6,
                        fontFamily: "'Pretendard GOV', sans-serif",
                        fontWeight: 400,
                        fontSize: 15,
                        lineHeight: '150%',
                        cursor: 'pointer',
                        border: isActive ? '1px solid #256EF4' : '1px solid #CDD1D5',
                        background: isActive ? '#ECF2FE' : '#FFFFFF',
                        color: isActive ? '#256EF4' : '#464C53',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── 버튼 영역 ── */}
        <div style={{ display: 'flex', gap: 8, width: '100%', paddingTop: 24 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 6,
              border: '1px solid #CDD1D5',
              background: '#FFFFFF',
              fontFamily: "'Pretendard GOV', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              lineHeight: '150%',
              color: '#464C53',
              cursor: 'pointer',
            }}
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 6,
              border: 'none',
              background: '#256EF4',
              fontFamily: "'Pretendard GOV', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              lineHeight: '150%',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            적용하기
          </button>
        </div>
      </div>
    </aside>
  );
}
