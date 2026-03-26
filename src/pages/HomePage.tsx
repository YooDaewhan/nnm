import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ───────────────────────────────────────────
   Static data
   ─────────────────────────────────────────── */

const SUBJECTS = [
  { id: '1-1', label: '인문학', icon: '/icons/1-1 인문학 1.png' },
  { id: '1-2', label: '사회과학', icon: '/icons/1-2 사회과학 1.png' },
  { id: '1-3', label: '자연과학', icon: '/icons/1-3 자연과학 1.png' },
  { id: '1-4', label: '공학', icon: '/icons/1-4 공학 1.png' },
  { id: '1-5', label: '의약학', icon: '/icons/1-5 의약학 1.png' },
  { id: '1-6', label: '농수해양학', icon: '/icons/1-6 농수해양학 1.png' },
  { id: '1-7', label: '예술체육학', icon: '/icons/1-7 예술체육학 1.png' },
  { id: '1-8', label: '교육학', icon: '/icons/1-8 교육학 1.png' },
  { id: '1-9', label: '복합학', icon: '/icons/1-9 복합학 1.png' },
];

const POPULAR_KEYWORDS = [
  '인공지능', '머신러닝', '딥러닝', '생성형 AI', 'LLM',
  '학술 데이터', '딥페이크', '반도체', '에너지 전환', '개인정보',
  '소형모듈원전', '가스터빈', 'AI 데이터센터', 'HBMA', 'AMD',
];

const TREND_TAGS = [
  '#AI Agent', '#추론형 LLM', '#RAG',
  '#Hallucination', '#sLLM', '#생성형 인공지능',
  '#딥러닝', '#윤리적 AI',
];

const RECENT_PAPERS = [
  {
    title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰',
    author: '김아림(Kim, Ahrim)',
    publisher: '한국언어학회',
    year: '2018',
  },
  {
    title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰',
    author: '김아림(Kim, Ahrim)',
    publisher: '한국언어학회',
    year: '2018',
  },
  {
    title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰',
    author: '김아림(Kim, Ahrim)',
    publisher: '한국언어학회',
    year: '2018',
  },
  {
    title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰',
    author: '김아림(Kim, Ahrim)',
    publisher: '한국언어학회',
    year: '2018',
  },
];

type Paper = { title: string; author: string; publisher: string; year: string };

const PAPERS_BY_SUBJECT: Record<string, Paper[]> = {
  '인문학': [
    { title: '한국 근대 문학에서의 자아 정체성 탐구', author: '이수현(Lee, Soohyun)', publisher: '한국문학연구학회', year: '2021' },
    { title: '동서양 철학의 비교 연구: 존재론적 관점에서', author: '박철호(Park, Cheolho)', publisher: '철학연구회', year: '2020' },
    { title: '조선시대 한문학의 미적 특성 고찰', author: '정미란(Jung, Miran)', publisher: '한국한문학회', year: '2019' },
    { title: '현대 언어학적 관점에서 본 한국어 경어법', author: '최지영(Choi, Jiyoung)', publisher: '한국언어학회', year: '2022' },
  ],
  '사회과학': [
    { title: '디지털 전환 시대의 사회적 불평등 구조 분석', author: '김민준(Kim, Minjun)', publisher: '한국사회학회', year: '2023' },
    { title: '포스트 코로나 시대의 복지국가 재편 방향', author: '이정훈(Lee, Junghoon)', publisher: '사회복지연구', year: '2022' },
    { title: '청년 세대의 정치 참여와 민주주의 변화', author: '박서연(Park, Seoyeon)', publisher: '한국정치학회보', year: '2021' },
    { title: '미디어 소비 패턴 변화와 여론 형성 메커니즘', author: '윤재호(Yoon, Jaeho)', publisher: '언론학연구', year: '2023' },
  ],
  '자연과학': [
    { title: '기후변화가 한반도 생태계에 미치는 영향 분석', author: '장수빈(Jang, Subin)', publisher: '한국생태학회지', year: '2023' },
    { title: '양자 얽힘 현상의 새로운 실험적 검증 방법', author: '오동현(Oh, Donghyun)', publisher: '물리학회지', year: '2022' },
    { title: '나노 소재를 활용한 수질 정화 기술 연구', author: '한소희(Han, Sohee)', publisher: '환경과학회지', year: '2021' },
    { title: '뇌신경 가소성 기제의 분자생물학적 규명', author: '임태양(Im, Taeyang)', publisher: '한국생명과학회지', year: '2020' },
  ],
  '공학': [
    { title: '대규모 언어 모델 경량화를 위한 양자화 기법', author: '서준혁(Seo, Junhyuk)', publisher: '한국정보과학회', year: '2024' },
    { title: '스마트 그리드 환경에서의 에너지 최적화 알고리즘', author: '강민서(Kang, Minseo)', publisher: '전기학회논문지', year: '2023' },
    { title: '자율주행 차량의 실시간 객체 탐지 시스템 설계', author: '조현우(Jo, Hyeonwoo)', publisher: '제어로봇시스템학회', year: '2022' },
    { title: '5G 기반 초저지연 통신 프로토콜 최적화 연구', author: '신예진(Shin, Yejin)', publisher: '한국통신학회논문지', year: '2023' },
  ],
  '의약학': [
    { title: 'mRNA 백신 플랫폼의 면역 반응 기전 분석', author: '류지현(Ryu, Jihyun)', publisher: '대한의학회지', year: '2023' },
    { title: '알츠하이머 조기 진단을 위한 바이오마커 연구', author: '문성호(Moon, Seongho)', publisher: '신경과학회지', year: '2022' },
    { title: '항암 면역치료제의 부작용 최소화 전략', author: '배나연(Bae, Nayeon)', publisher: '종양학연구', year: '2021' },
    { title: '마이크로바이옴과 정신건강의 상관관계 연구', author: '홍승현(Hong, Seunghyun)', publisher: '정신의학연구', year: '2023' },
  ],
  '농수해양학': [
    { title: '스마트팜 기술 적용을 통한 작물 생산성 향상', author: '전민경(Jeon, Minkyung)', publisher: '한국농업과학지', year: '2023' },
    { title: '해양 미세플라스틱이 수산물에 미치는 영향', author: '노준호(No, Junho)', publisher: '수산해양교육연구', year: '2022' },
    { title: '연근해 어류 자원 회복을 위한 관리 방안 연구', author: '엄지수(Um, Jisu)', publisher: '한국수산과학회지', year: '2021' },
    { title: '기후변화 대응 내건성 작물 품종 개발 현황', author: '방정희(Bang, Junghee)', publisher: '한국육종학회지', year: '2020' },
  ],
  '예술체육학': [
    { title: 'K-팝 글로벌 확산에 따른 한국 대중음악 변화', author: '송다은(Song, Daeun)', publisher: '한국음악학회', year: '2023' },
    { title: '스포츠 심리학적 관점에서 본 엘리트 선수 번아웃', author: '권세진(Kwon, Sejin)', publisher: '한국스포츠심리학회지', year: '2022' },
    { title: '현대 미술에서 디지털 미디어의 예술적 가능성', author: '성혜원(Seong, Hyewon)', publisher: '미술이론과현장', year: '2021' },
    { title: '전통 무용의 현대적 재해석과 융합 공연 연구', author: '탁승훈(Tak, Seunghun)', publisher: '무용예술학연구', year: '2020' },
  ],
  '교육학': [
    { title: 'AI 튜터링 시스템이 학습 성취도에 미치는 영향', author: '구나래(Koo, Narae)', publisher: '교육공학연구', year: '2024' },
    { title: '플립드 러닝 환경에서 학습자 자기조절 전략', author: '도현석(Do, Hyunseok)', publisher: '교육심리연구', year: '2023' },
    { title: '다문화 가정 학생 학교 적응 지원 방안 연구', author: '변소영(Byeon, Soyoung)', publisher: '다문화교육연구', year: '2022' },
    { title: '메타버스 기반 원격 교육의 교육적 효과성 분석', author: '여준혁(Yeo, Junhyuk)', publisher: '교육정보미디어연구', year: '2023' },
  ],
  '복합학': [
    { title: '빅데이터와 인문학의 융합: 디지털 인문학 연구 동향', author: '석민지(Seok, Minji)', publisher: '인문콘텐츠학회', year: '2023' },
    { title: '사회-기술 시스템 전환과 복잡계 이론의 적용', author: '안형준(An, Hyungjun)', publisher: '복잡계학회지', year: '2022' },
    { title: '젠더와 과학기술의 교차점: 페미니스트 기술과학 연구', author: '남다희(Nam, Dahee)', publisher: '과학기술학연구', year: '2021' },
    { title: '도시 재생 사업의 다학제적 평가 프레임워크 개발', author: '유성민(Yu, Seongmin)', publisher: '도시설계학회지', year: '2020' },
  ],
};

const JOURNAL_CARDS = [
  {
    title: '한국노년학연구',
    issn: '1226-2641',
    publisher: '한국노년학연구회',
    cover: '',
    description: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kciIf: '1.33',
    citations: '36',
    badges: ['벤저', '벤저'],
  },
  {
    title: '저널 타이틀',
    issn: '0000-2222',
    publisher: '발행기관',
    cover: '',
    description: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kciIf: '0.00',
    citations: '00',
    badges: ['벤저', '벤저'],
  },
  {
    title: '저널 타이틀',
    issn: '0000-2222',
    publisher: '발행기관',
    cover: '',
    description: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kciIf: '0.00',
    citations: '00',
    badges: ['벤저', '벤저'],
  },
];

/* ───────────────────────────────────────────
   Shared font helper
   ─────────────────────────────────────────── */
const ff = 'Pretendard GOV, Pretendard, sans-serif';

/* ───────────────────────────────────────────
   Component
   ─────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSubjectClick = (label: string) => {
    setSelectedSubject(prev => prev === label ? null : label);
  };

  const displayedPapers = selectedSubject
    ? (PAPERS_BY_SUBJECT[selectedSubject] ?? RECENT_PAPERS)
    : RECENT_PAPERS;

  return (
    <div className="bg-white flex flex-col flex-1">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HERO + SHORTCUT + PAPER LIST
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white">

        {/* Hero row */}
        <div className="max-w-[1280px] mx-auto px-4">
          <div
            className="flex flex-row items-start gap-16"
            style={{ paddingTop: 80, paddingBottom: 0 }}
          >
            {/* Left: title + search */}
            <div className="flex flex-col justify-center gap-12 flex-shrink-0" style={{ width: 600 }}>
              <div className="flex flex-col gap-4" style={{ paddingLeft: 8 }}>
                <h1 style={{ fontFamily: ff, fontWeight: 800, fontSize: 56, lineHeight: '1.25em', color: '#1E2124', whiteSpace: 'pre-line' }}>
                  {`논문 검색\n더 쉬워졌습니다`}
                </h1>
                <p style={{ fontFamily: ff, fontWeight: 500, fontSize: 20, lineHeight: '1.6em', color: '#464C53' }}>
                  복잡한 절차 없이 핵심 논문을 빠르게 찾아보세요
                </p>
              </div>

              {/* Search bar */}
              <form onSubmit={handleSearch}>
                <div
                  className="flex flex-row items-center"
                  style={{ width: 560, height: 80, background: '#1E2124', borderRadius: 14, paddingLeft: 40, paddingRight: 20 }}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="검색어를 입력해주세요"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: ff, fontWeight: 700, fontSize: 20, color: '#FFFFFF' }}
                    className="placeholder-white/40"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center shrink-0 rounded-full transition-opacity hover:opacity-70"
                    style={{ width: 40, height: 40, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="17" cy="17" r="9" stroke="#FFFFFF" strokeWidth="2.2" />
                      <path d="M24 24L32 32" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: trend card */}
            <div
              className="flex-1 rounded-2xl overflow-hidden relative"
              style={{ width: 600, height: 400, minHeight: 400, background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 40%, #3b82f6 100%)' }}
            >
              <img
                src="/images/hero-main.png"
                alt=""
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
              />
              <div className="relative z-10 flex flex-col gap-2" style={{ padding: '60px' }}>
                <span
                  style={{
                    display: 'inline-block', width: 'fit-content',
                    padding: '0 8px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.15)',
                    fontFamily: ff, fontWeight: 700, fontSize: 13, color: '#FFFFFF', lineHeight: '20px',
                  }}
                >
                  TREND
                </span>
                <h2 style={{ fontFamily: ff, fontWeight: 800, fontSize: 36, color: '#FFFFFF', lineHeight: '1.4em', marginTop: 2 }}>
                  AI 에이전트
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ marginTop: 8 }}>
                  {TREND_TAGS.map((tag) => (
                    <span key={tag} style={{ fontFamily: ff, fontWeight: 400, fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: '26px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcut + divider + paper list */}
        <div className="max-w-[1280px] mx-auto px-4" style={{ paddingBottom: 0 }}>
          <div
            className="rounded-2xl"
            style={{ background: '#FFFFFF', border: '1px solid #E4E7EA', marginTop: 0, padding: '48px' }}
          >
            {/* Subject shortcut grid */}
            <div className="flex flex-row items-center justify-between" style={{ gap: 12 }}>
              {SUBJECTS.map((s) => {
                const isSelected = selectedSubject === s.label;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSubjectClick(s.label)}
                    className="flex flex-col items-center gap-3 transition-all hover:opacity-70"
                    style={{
                      background: isSelected ? '#F0F4FF' : 'transparent',
                      border: isSelected ? '2px solid #4C6EF5' : '2px solid transparent',
                      borderRadius: 12,
                      cursor: 'pointer',
                      flex: 1,
                      padding: '8px 4px',
                    }}
                  >
                    <div className="flex items-center justify-center" style={{ width: 80, height: 80 }}>
                      <img src={s.icon} alt={s.label} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: isSelected ? '#4C6EF5' : '#1E2124', lineHeight: '1.5em', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#E4E7EA', margin: '40px 0' }} />

            {/* Recent paper list (2×2) */}
            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', columnGap: '32px', rowGap: '16px' }}
            >
              {displayedPapers.map((p, i) => (
                <button
                  key={i}
                  className="flex flex-col gap-1 text-left transition-colors hover:bg-gray-50 rounded-lg"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 0' }}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(p.title)}`)}
                >
                  <span
                    style={{ fontFamily: ff, fontWeight: 600, fontSize: 16, color: '#1E2124', lineHeight: '29px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 560 }}
                  >
                    {p.title}
                  </span>
                  <div className="flex items-center gap-0" style={{ lineHeight: '26px' }}>
                    <span style={{ fontFamily: ff, fontWeight: 400, fontSize: 14, color: '#8A949E' }}>{p.author}</span>
                    <span style={{ margin: '0 8px', width: 1, height: 14, background: '#CDD1D5', display: 'inline-block' }} />
                    <span style={{ fontFamily: ff, fontWeight: 400, fontSize: 14, color: '#8A949E' }}>{p.publisher}</span>
                    <span style={{ margin: '0 8px', width: 1, height: 14, background: '#CDD1D5', display: 'inline-block' }} />
                    <span style={{ fontFamily: ff, fontWeight: 400, fontSize: 14, color: '#8A949E' }}>{p.year}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. 인기 검색 키워드
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 style={{ fontFamily: ff, fontWeight: 800, fontSize: 32, color: '#1E2124', lineHeight: '48px', marginBottom: 32, paddingLeft: 16 }}>
            인기 검색 키워드
          </h2>
          <div className="flex flex-wrap gap-3" style={{ paddingLeft: 16 }}>
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => {
                  setQuery(kw);
                  navigate(`/search?q=${encodeURIComponent(kw)}`);
                }}
                className="flex items-center justify-center transition-colors hover:bg-[#E8EAEC]"
                style={{
                  height: 46, padding: '0 24px', borderRadius: 1000,
                  background: '#F4F5F6', border: '1px solid #E4E7EA',
                  cursor: 'pointer', fontFamily: ff, fontSize: 15, fontWeight: 500, color: '#1E2124',
                }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. SIMS 배너
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full" style={{ background: 'linear-gradient(135deg, #2a1a4e 0%, #4a3a8e 40%, #6b5ce7 100%)', overflow: 'hidden' }}>
        <div className="max-w-[1280px] mx-auto px-4">
          <a
            href="https://sims.newnonmun.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: '40px 0', minHeight: 200, cursor: 'pointer', textDecoration: 'none' }}
          >
            <p style={{ fontFamily: ff, fontWeight: 500, fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: '36px' }}>
              효율적인 학회 운영 관리
            </p>
            <h2 style={{ fontFamily: ff, fontWeight: 800, fontSize: 32, color: '#FFFFFF', lineHeight: '48px' }}>
              학회통합관리시스템 SIMS로 해결하세요!
            </h2>
          </a>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. 신규 업데이트 저널
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-[1280px] mx-auto px-4">
          {/* Section header */}
          <div className="flex items-center justify-between" style={{ marginBottom: 32, paddingLeft: 16, paddingRight: 16 }}>
            <h2 style={{ fontFamily: ff, fontWeight: 800, fontSize: 32, color: '#1E2124', lineHeight: '48px' }}>
              신규 업데이트 저널
            </h2>
            <span style={{ fontFamily: ff, fontWeight: 500, fontSize: 15, color: '#8A949E' }}>
              1 / 8
            </span>
          </div>

          {/* Journal cards grid */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, paddingLeft: 16, paddingRight: 16 }}>
            {JOURNAL_CARDS.map((card, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl overflow-hidden transition-shadow hover:shadow-lg"
                style={{ background: '#FFFFFF', border: '1px solid #E4E7EA' }}
              >
                {/* Row 1: badges + action buttons */}
                <div className="flex items-center justify-between" style={{ padding: '24px 24px 0' }}>
                  <div className="flex gap-1">
                    {card.badges.map((b, bi) => (
                      <span
                        key={bi}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          height: 24, padding: '0 8px', borderRadius: 4,
                          background: '#F4F5F6', fontFamily: ff, fontSize: 12, fontWeight: 600, color: '#58616A',
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Share */}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 7a2 2 0 100-4 2 2 0 000 4zM5 12a2 2 0 100-4 2 2 0 000 4zM15 17a2 2 0 100-4 2 2 0 000 4zM7 11l6 3M13 6l-6 3" stroke="#8A949E" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                    {/* Heart */}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17s-7-4.35-7-8.5A3.5 3.5 0 0110 5.96 3.5 3.5 0 0117 8.5C17 12.65 10 17 10 17z" stroke="#8A949E" strokeWidth="1.5" /></svg>
                    </button>
                    {/* Cart */}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6h12l-1.5 7H7.5L6 6zM8 17a1 1 0 100-2 1 1 0 000 2zM15 17a1 1 0 100-2 1 1 0 000 2z" stroke="#8A949E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>

                {/* Contents: image + meta */}
                <div className="flex gap-4" style={{ padding: '16px 24px 0' }}>
                  {/* Cover image */}
                  <div
                    className="shrink-0 rounded overflow-hidden"
                    style={{ width: 90, height: 125, background: '#F4F5F6' }}
                  >
                    {card.cover ? (
                      <img src={card.cover} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center w-full h-full gap-2"
                        style={{
                          background: [
                            'linear-gradient(145deg, #E8F0FE 0%, #C2D4F8 100%)',
                            'linear-gradient(145deg, #E6F4EA 0%, #B7DFC0 100%)',
                            'linear-gradient(145deg, #FEF3E2 0%, #F7D59C 100%)',
                          ][i % 3],
                        }}
                      >
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                          <rect x="7" y="3" width="16" height="22" rx="2" fill="white" fillOpacity="0.7" />
                          <rect x="11" y="7" width="16" height="22" rx="2" fill="white" fillOpacity="0.5" stroke={['#6B9BF4','#4CAF72','#E6A020'][i % 3]} strokeWidth="1.2" />
                          <path d="M15 13h8M15 17h8M15 21h5" stroke={['#6B9BF4','#4CAF72','#E6A020'][i % 3]} strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: 9, fontWeight: 600, color: ['#4A7CF0','#2E8B4A','#C07800'][i % 3], letterSpacing: '0.03em' }}>JOURNAL</span>
                      </div>
                    )}
                  </div>
                  {/* Meta */}
                  <div className="flex flex-col justify-start" style={{ paddingTop: 8 }}>
                    <h3 style={{ fontFamily: ff, fontWeight: 700, fontSize: 18, color: '#1E2124', lineHeight: '29px', marginBottom: 16 }}>
                      {card.title}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: ff, fontWeight: 500, fontSize: 13, color: '#8A949E' }}>ISSN</span>
                        <span style={{ fontFamily: ff, fontWeight: 400, fontSize: 13, color: '#58616A' }}>{card.issn}</span>
                      </div>
                      <span style={{ fontFamily: ff, fontWeight: 400, fontSize: 13, color: '#58616A' }}>{card.publisher}</span>
                    </div>
                  </div>
                </div>

                {/* Description + stats */}
                <div className="flex flex-col" style={{ padding: '16px 24px 24px' }}>
                  <p style={{ fontFamily: ff, fontWeight: 400, fontSize: 14, color: '#58616A', lineHeight: '23px', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {card.description}
                  </p>
                  <div style={{ height: 1, background: '#E4E7EA', marginBottom: 10 }} />
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontFamily: ff, fontWeight: 400, fontSize: 13, color: '#8A949E' }}>KCI IF (2년)</span>
                    <span style={{ fontFamily: ff, fontWeight: 600, fontSize: 13, color: '#1E2124' }}>{card.kciIf}</span>
                  </div>
                  <div style={{ height: 1, background: '#E4E7EA', marginBottom: 10 }} />
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: ff, fontWeight: 400, fontSize: 13, color: '#8A949E' }}>피인용 횟수</span>
                    <span style={{ fontFamily: ff, fontWeight: 600, fontSize: 13, color: '#1E2124' }}>{card.citations}</span>
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
