import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── 학문 분야 아이콘 ── */
const SUBJECTS = [
  { id: '1-1', label: '인문학',      icon: '/icons/1-1 인문학 1.png' },
  { id: '1-2', label: '사회과학',    icon: '/icons/1-2 사회과학 1.png' },
  { id: '1-3', label: '자연과학',    icon: '/icons/1-3 자연과학 1.png' },
  { id: '1-4', label: '공학',        icon: '/icons/1-4 공학 1.png' },
  { id: '1-5', label: '의약학',      icon: '/icons/1-5 의약학 1.png' },
  { id: '1-6', label: '농수해양학',  icon: '/icons/1-6 농수해양학 1.png' },
  { id: '1-7', label: '예술체육학',  icon: '/icons/1-7 예술체육학 1.png' },
  { id: '1-8', label: '교육학',      icon: '/icons/1-8 교육학 1.png' },
  { id: '1-9', label: '복합학',      icon: '/icons/1-9 복합학 1.png' },
];

/* ── 트렌드 태그 ── */
const TREND_TAGS = [
  '#AI Agent', '#추론형 LLM', '#RAG',
  '#Hallucination', '#sLLM', '#생성형 인공지능',
  '#딥러닝', '#윤리적 AI',
];

/* ── 추천 논문 더미 데이터 ── */
const RECOMMENDED_PAPERS = [
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', org: '한국언어학회', year: '2018' },
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', org: '한국언어학회', year: '2018' },
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', org: '한국언어학회', year: '2018' },
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', org: '한국언어학회', year: '2018' },
];

/* ── 인기 검색 키워드 ── */
const POPULAR_KEYWORDS = [
  '인공지능', '머신러닝', '딥러닝', '생성형 AI', 'LLM',
  '학술 데이터', '딥페이크', '반도체', '에너지 전환', '개인정보',
  '소형모듈원전', '거스타인', 'AI 데이터센터', 'HBMA', 'AMD',
];

/* ── 신규 업데이트 저널 더미 데이터 ── */
const JOURNAL_CARDS = [
  {
    badges: ['벤처', '벤처'],
    title: '한국노년학연구',
    issn: '1226-2641',
    publisher: '한국노년학연구회',
    cover: '/images/journal-cover-1.png',
    desc: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kci: '1.33',
    cited: '36',
  },
  {
    badges: ['벤처', '벤처'],
    title: '저널 타이틀',
    issn: '0000-2222',
    publisher: '발행기관',
    cover: '',
    desc: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kci: '0.00',
    cited: '00',
  },
  {
    badges: ['벤처', '벤처'],
    title: '저널 타이틀',
    issn: '0000-2222',
    publisher: '발행기관',
    cover: '',
    desc: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kci: '0.00',
    cited: '00',
  },
];

const font = 'Pretendard GOV, Pretendard, sans-serif';

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSubjectClick = (label: string) => {
    navigate(`/papers?subject=${encodeURIComponent(label)}`);
  };

  return (
    <div className="bg-white flex flex-col flex-1">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HERO + SEARCH + TREND CARD
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white">
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            className="flex flex-row items-center"
            style={{ paddingTop: 80, paddingBottom: 0, gap: 64 }}
          >
            {/* Left: Title + Search */}
            <div className="flex flex-col justify-center" style={{ width: 600, paddingLeft: 16 }}>
              <div className="flex flex-col" style={{ gap: 16, marginBottom: 48 }}>
                <h1 style={{ fontFamily: font, fontWeight: 800, fontSize: 56, lineHeight: '1.25', color: '#1E2124', whiteSpace: 'pre-line', margin: 0 }}>
                  {`논문 검색\n더 쉬워졌습니다`}
                </h1>
                <p style={{ fontFamily: font, fontWeight: 500, fontSize: 20, lineHeight: '1.6', color: '#464C53', margin: 0 }}>
                  복잡한 절차 없이 핵심 논문을 빠르게 찾아보세요
                </p>
              </div>

              {/* 검색바 */}
              <form onSubmit={handleSearch}>
                <div
                  className="flex flex-row items-center"
                  style={{
                    width: 560, height: 80,
                    background: '#1E2124', borderRadius: 14,
                    paddingLeft: 40, paddingRight: 20,
                  }}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="검색어를 입력해주세요"
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: font, fontWeight: 500, fontSize: 20, color: '#FFFFFF',
                    }}
                    className="placeholder-white/40"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center shrink-0 rounded-full transition-opacity hover:opacity-70"
                    style={{ width: 40, height: 40, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="17" cy="17" r="9" stroke="#FFFFFF" strokeWidth="2.2"/>
                      <path d="M24 24L32 32" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Trend Card */}
            <div
              className="shrink-0 relative overflow-hidden"
              style={{
                width: 600, height: 400, borderRadius: 20,
                background: 'linear-gradient(135deg, #1a1a3e 0%, #2d2d6e 40%, #4a4aaf 100%)',
              }}
            >
              {/* 배경 이미지 */}
              <img
                src="/images/hero-main.png"
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
              />
              {/* 텍스트 오버레이 */}
              <div className="relative flex flex-col" style={{ padding: 60, gap: 8, zIndex: 1 }}>
                <span
                  style={{
                    display: 'inline-block', width: 'fit-content',
                    padding: '0 8px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                    fontFamily: font, fontWeight: 700, fontSize: 13, color: '#FFFFFF', lineHeight: '20px',
                  }}
                >
                  TREND
                </span>
                <h2 style={{ fontFamily: font, fontWeight: 800, fontSize: 40, color: '#FFFFFF', lineHeight: '1.5', margin: '4px 0 12px' }}>
                  AI 에이전트
                </h2>
                <div className="flex flex-wrap" style={{ gap: '8px 16px' }}>
                  {TREND_TAGS.map((tag) => (
                    <span
                      key={tag}
                      style={{ fontFamily: font, fontWeight: 400, fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: '26px' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. 학문 분야 SHORTCUT + 추천 논문
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white">
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              marginLeft: 16, marginRight: 16,
              background: '#FFFFFF', border: '1px solid #E4E7EA', borderRadius: 20,
              padding: '48px',
            }}
          >
            {/* 학문 분야 아이콘 그리드 */}
            <div className="flex flex-row items-start justify-between" style={{ marginBottom: 40 }}>
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSubjectClick(s.label)}
                  className="flex flex-col items-center transition-all hover:opacity-70"
                  style={{ gap: 10, background: 'none', border: 'none', cursor: 'pointer', flex: '1 1 0', minWidth: 0 }}
                >
                  <div className="flex items-center justify-center" style={{ width: 80, height: 80 }}>
                    <img src={s.icon} alt={s.label} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontFamily: font, fontWeight: 700, fontSize: 14, color: '#1E2124', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            {/* 디바이더 */}
            <div style={{ height: 1, background: '#E4E7EA', marginBottom: 40 }} />

            {/* 추천 논문 리스트 (2열 x 2행) */}
            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px 32px' }}
            >
              {RECOMMENDED_PAPERS.map((paper, idx) => (
                <div
                  key={idx}
                  className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ gap: 4 }}
                >
                  <p style={{ fontFamily: font, fontWeight: 500, fontSize: 17, color: '#1E2124', lineHeight: '29px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {paper.title}
                  </p>
                  <div className="flex flex-row items-center" style={{ gap: 0 }}>
                    <span style={{ fontFamily: font, fontWeight: 400, fontSize: 14, color: '#8A949E' }}>{paper.author}</span>
                    <span style={{ width: 1, height: 14, background: '#CDD1D5', margin: '0 8px' }} />
                    <span style={{ fontFamily: font, fontWeight: 400, fontSize: 14, color: '#8A949E' }}>{paper.org}</span>
                    <span style={{ width: 1, height: 14, background: '#CDD1D5', margin: '0 8px' }} />
                    <span style={{ fontFamily: font, fontWeight: 400, fontSize: 14, color: '#8A949E' }}>{paper.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. 인기 검색 키워드
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingLeft: 16, paddingRight: 16 }}>
          <h2 style={{ fontFamily: font, fontWeight: 800, fontSize: 32, color: '#1E2124', lineHeight: '48px', margin: '0 0 32px' }}>
            인기 검색 키워드
          </h2>
          <div className="flex flex-wrap" style={{ gap: 16 }}>
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => {
                  setQuery(kw);
                  navigate(`/search?q=${encodeURIComponent(kw)}`);
                }}
                className="flex items-center justify-center transition-colors hover:bg-[#E8EAEC]"
                style={{
                  height: 46, padding: '0 20px',
                  background: '#F4F5F6', border: '1px solid #E4E7EA', borderRadius: 999, cursor: 'pointer',
                  fontFamily: font, fontSize: 16, fontWeight: 500, color: '#464C53',
                }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. SIMS 배너
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full" style={{ background: 'linear-gradient(135deg, #2d1b69 0%, #4a2d9e 50%, #7b5ec7 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingLeft: 16, paddingRight: 16 }}>
          <div
            className="flex flex-col items-center justify-center"
            style={{ height: 240, textAlign: 'center' }}
          >
            <p style={{ fontFamily: font, fontWeight: 500, fontSize: 18, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>
              효율적인 학회 운영 관리
            </p>
            <h2 style={{ fontFamily: font, fontWeight: 800, fontSize: 32, color: '#FFFFFF', lineHeight: '48px', margin: 0 }}>
              학회통합관리시스템 SIMS로 해결하세요!
            </h2>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. 신규 업데이트 저널
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingLeft: 16, paddingRight: 16 }}>

          {/* 타이틀 + 페이징 */}
          <div className="flex flex-row items-center justify-between" style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: font, fontWeight: 800, fontSize: 32, color: '#1E2124', lineHeight: '48px', margin: 0 }}>
              신규 업데이트 저널
            </h2>
            <span style={{ fontFamily: font, fontWeight: 500, fontSize: 16, color: '#8A949E' }}>
              1 / 8
            </span>
          </div>

          {/* 저널 카드 리스트 */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {JOURNAL_CARDS.map((card, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-2xl transition-shadow hover:shadow-md"
                style={{ background: '#FFFFFF', border: '1px solid #E4E7EA', overflow: 'hidden' }}
              >
                {/* row-1: 뱃지 + 아이콘 버튼 */}
                <div className="flex flex-row items-center justify-between" style={{ padding: '24px 24px 0' }}>
                  <div className="flex flex-row" style={{ gap: 4 }}>
                    {card.badges.map((b, bi) => (
                      <span
                        key={bi}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 8px', height: 24, borderRadius: 4,
                          background: '#F4F5F6', fontFamily: font, fontSize: 12, fontWeight: 600, color: '#58616A',
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-row items-center" style={{ gap: 4 }}>
                    {/* 공유, 좋아요, 북마크 아이콘 */}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8A949E' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 7L12 4M12 4L9 7M12 4V13M5 9V15C5 15.5523 5.44772 16 6 16H18C18.5523 16 19 15.5523 19 15V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8A949E' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 16.25S2.5 11.25 2.5 6.875C2.5 4.56 4.31 2.75 6.625 2.75C8.125 2.75 9.45 3.6 10 4.85C10.55 3.6 11.875 2.75 13.375 2.75C15.69 2.75 17.5 4.56 17.5 6.875C17.5 11.25 10 16.25 10 16.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8A949E' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2.5V17.5L10 14.5L15 17.5V2.5H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>

                {/* contents: 이미지 + 메타 */}
                <div className="flex flex-row" style={{ padding: '16px 24px', gap: 24 }}>
                  <div
                    className="shrink-0 rounded overflow-hidden"
                    style={{ width: 90, height: 125, background: '#F4F5F6' }}
                  >
                    {card.cover ? (
                      <img src={card.cover} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="6" y="4" width="20" height="24" rx="2" stroke="#CDD1D5" strokeWidth="1.5"/><path d="M11 10H21M11 14H21M11 18H17" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col" style={{ gap: 16 }}>
                    <h3 style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: '#1E2124', lineHeight: '29px', margin: '8px 0 0' }}>
                      {card.title}
                    </h3>
                    <div className="flex flex-col" style={{ gap: 8 }}>
                      <div className="flex flex-row items-center" style={{ gap: 16 }}>
                        <span style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: '#8A949E' }}>ISSN</span>
                        <span style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: '#58616A' }}>{card.issn}</span>
                      </div>
                      <span style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: '#58616A' }}>{card.publisher}</span>
                    </div>
                  </div>
                </div>

                {/* description + stats */}
                <div className="flex flex-col" style={{ padding: '0 24px 24px' }}>
                  <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: '#58616A', lineHeight: '23px', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {card.desc}
                  </p>
                  <div style={{ height: 1, background: '#E4E7EA', margin: '10px 0' }} />
                  <div className="flex flex-row items-center justify-between">
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: '#8A949E' }}>KCI IF (2년)</span>
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: '#1E2124' }}>{card.kci}</span>
                  </div>
                  <div style={{ height: 1, background: '#E4E7EA', margin: '10px 0' }} />
                  <div className="flex flex-row items-center justify-between">
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: '#8A949E' }}>피인용 횟수</span>
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: '#1E2124' }}>{card.cited}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
