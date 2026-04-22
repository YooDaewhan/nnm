import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DetailedSearchCondition } from '@/api/search';

/* ───────────────────────────────────────────
   반응형 훅
   ─────────────────────────────────────────── */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

/* ───────────────────────────────────────────
   Static data
   ─────────────────────────────────────────── */
const SUBJECTS = [
  { id: '1-1', label: '인문학',     icon: '/icons/1-1 인문학 1.png' },
  { id: '1-2', label: '사회과학',   icon: '/icons/1-2 사회과학 1.png' },
  { id: '1-3', label: '자연과학',   icon: '/icons/1-3 자연과학 1.png' },
  { id: '1-4', label: '공학',       icon: '/icons/1-4 공학 1.png' },
  { id: '1-5', label: '의약학',     icon: '/icons/1-5 의약학 1.png' },
  { id: '1-6', label: '농수해양학', icon: '/icons/1-6 농수해양학 1.png' },
  { id: '1-7', label: '예술체육학', icon: '/icons/1-7 예술체육학 1.png' },
  { id: '1-8', label: '교육학',     icon: '/icons/1-8 교육학 1.png' },
  { id: '1-9', label: '복합학',     icon: '/icons/1-9 복합학 1.png' },
];

const POPULAR_KEYWORDS = [
  '인공지능', '머신러닝', '딥러닝', '생성형 AI', 'LLM',
  '학술 데이터', '딥페이크', '반도체', '에너지 전환', '개인정보',
  '소형모듈원전', '가스터빈', 'AI 데이터센터', 'HBM4', 'AMD',
];

const RECENT_PAPERS = [
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', publisher: '한국언어학회', year: '2018' },
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', publisher: '한국언어학회', year: '2018' },
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', publisher: '한국언어학회', year: '2018' },
  { title: '부끄러움/창피함/쑥스러움/수치스러움/수줍음간의 관계 고찰', author: '김아림(Kim, Ahrim)', publisher: '한국언어학회', year: '2018' },
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
    badges: ['뱃지', '뱃지'],
  },
  {
    title: '저널 타이틀',
    issn: '0000-2222',
    publisher: '발행기관',
    cover: '',
    description: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kciIf: '0.00',
    citations: '00',
    badges: ['뱃지', '뱃지'],
  },
  {
    title: '저널 타이틀',
    issn: '0000-2222',
    publisher: '발행기관',
    cover: '',
    description: '간단한 설명이 들어가는 영역입니다. 최대 3줄까지 작성합니다. 간단한 설명이 들어가는 영역입니다. 간단한 설명이 들어가는 영역입니다.',
    kciIf: '0.00',
    citations: '00',
    badges: ['뱃지', '뱃지'],
  },
];

const ff = 'Pretendard GOV, Pretendard, sans-serif';

const COVER_GRADIENTS = [
  'linear-gradient(145deg,#C8D6E5,#8FAFC8)',
  'linear-gradient(145deg,#E5E8EB,#C8CDD2)',
  'linear-gradient(145deg,#E5E8EB,#C8CDD2)',
];

/* ───────────────────────────────────────────
   저널 카드 컴포넌트
   ─────────────────────────────────────────── */
function JournalCard({ card, idx, isMobile }: { card: typeof JOURNAL_CARDS[0]; idx: number; isMobile: boolean }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E4E7EA',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* 뱃지 + 액션 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '16px 16px 0' : '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {card.badges.map((b, bi) => (
            <span key={bi} style={{ fontSize: 11, fontWeight: 600, color: '#58616A', background: '#F4F5F6', borderRadius: 4, padding: '2px 8px', lineHeight: '20px' }}>
              {b}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 7a2 2 0 100-4 2 2 0 000 4zM5 12a2 2 0 100-4 2 2 0 000 4zM15 17a2 2 0 100-4 2 2 0 000 4zM7 11l6 3M13 6l-6 3" stroke="#8A949E" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 17s-7-4.35-7-8.5A3.5 3.5 0 0110 5.96 3.5 3.5 0 0117 8.5C17 12.65 10 17 10 17z" stroke="#8A949E" strokeWidth="1.5" /></svg>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M6 6h12l-1.5 7H7.5L6 6zM8 17a1 1 0 100-2 1 1 0 000 2zM15 17a1 1 0 100-2 1 1 0 000 2z" stroke="#8A949E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* 커버 + 메타 */}
      <div style={{ display: 'flex', gap: 14, padding: isMobile ? '12px 16px 0' : '14px 20px 0' }}>
        <div style={{ width: isMobile ? 60 : 72, height: isMobile ? 80 : 96, borderRadius: 4, flexShrink: 0, overflow: 'hidden', background: COVER_GRADIENTS[idx % 3] }}>
          {card.cover && <img src={card.cover} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <p style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: '#1E2124', marginBottom: 8, lineHeight: 1.4 }}>{card.title}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#8A949E', flexShrink: 0 }}>ISSN</span>
              <span style={{ fontSize: 12, color: '#58616A' }}>{card.issn}</span>
            </div>
            <span style={{ fontSize: 12, color: '#58616A' }}>{card.publisher}</span>
          </div>
        </div>
      </div>

      {/* 설명 + 통계 */}
      <div style={{ padding: isMobile ? '12px 16px 16px' : '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <p style={{ fontSize: 13, color: '#8A949E', lineHeight: '1.65em', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
          {card.description}
        </p>
        <div style={{ borderTop: '1px solid #F0F1F2', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8A949E' }}>KCI IF (2년)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#5B5FC7' }}>{card.kciIf}</span>
          </div>
          <div style={{ borderTop: '1px solid #F0F1F2' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8A949E' }}>피인용 횟수</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#5B5FC7' }}>{card.citations}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   메인 컴포넌트
   ─────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showDetailedSearch, setShowDetailedSearch] = useState(false);
  const [conditions, setConditions] = useState<DetailedSearchCondition[]>([
    { field: 'title', keyword: '', operator: 'AND' },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const addCondition = () => {
    if (conditions.length >= 10) return;
    setConditions(prev => [...prev, { field: 'title', keyword: '', operator: 'AND' }]);
  };

  const removeCondition = (idx: number) => {
    setConditions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, patch: Partial<DetailedSearchCondition>) => {
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  const handleDetailedSearch = () => {
    const valid = conditions.filter(c => c.keyword.trim());
    if (valid.length === 0) return;
    const submittedState = { conditions: valid, sort: 'relevance' as const, filters: {} };
    sessionStorage.setItem('search_conditions', JSON.stringify(valid));
    sessionStorage.setItem('search_submitted', JSON.stringify(submittedState));
    navigate('/search');
  };

  const handleSubjectClick = (label: string) => {
    setSelectedSubject(prev => prev === label ? null : label);
  };

  const displayedPapers = selectedSubject
    ? (PAPERS_BY_SUBJECT[selectedSubject] ?? RECENT_PAPERS)
    : RECENT_PAPERS;

  /* ─ 패딩 헬퍼 ─ */
  const px = isMobile ? '16px' : '40px';
  const sectionPy = isMobile ? '32px 0' : '64px 0';

  return (
    <div style={{ fontFamily: ff, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(135deg, #2D3560 0%, #3A4A80 55%, #4A5AA0 100%)',
          position: 'relative',
        }}
      >
        {/* 배경 장식 — overflow:hidden을 이 wrapper에만 적용 */}
        {!isMobile && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -60, right: '22%', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', bottom: -40, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          </div>
        )}

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: isMobile ? '40px 16px 36px' : '64px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 40,
          }}
        >
          {/* 좌측: 텍스트 + 검색 */}
          <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 560 }}>
            <h1
              style={{
                fontSize: isMobile ? 28 : 40,
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: isMobile ? 8 : 12,
                lineHeight: 1.25,
                letterSpacing: '-0.5px',
              }}
            >
              생각은 깊게, 검색은 빠르게
            </h1>
            <p
              style={{
                fontSize: isMobile ? 14 : 16,
                color: 'rgba(255,255,255,0.72)',
                marginBottom: isMobile ? 24 : 36,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              복잡한 절차 없이 핵심 논문을 빠르게 찾아보세요.
            </p>

            {/* 검색 바 + 상세검색 팝업 */}
            <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 500 }}>
              <form onSubmit={handleSearch}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    borderRadius: 10,
                    overflow: 'hidden',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isMobile ? '키워드를 입력하세요' : '찾고 싶은 논문, 저자, 키워드를 입력하세요'}
                    style={{
                      flex: 1,
                      padding: isMobile ? '14px 16px' : '16px 20px',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      color: '#1E2124',
                      background: 'transparent',
                      fontFamily: ff,
                    }}
                  />
                  {/* ... 상세검색 토글 버튼 */}
                  <button
                    type="button"
                    onClick={() => setShowDetailedSearch(v => !v)}
                    title="상세 검색"
                    style={{
                      width: 40,
                      height: isMobile ? 48 : 56,
                      background: showDetailedSearch ? '#F0F4FF' : 'transparent',
                      border: 'none',
                      borderLeft: '1px solid #E4E7EA',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: showDetailedSearch ? '#256EF4' : '#8A949E',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                      <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                    </svg>
                  </button>
                  <button
                    type="submit"
                    style={{
                      width: isMobile ? 48 : 56,
                      height: isMobile ? 48 : 56,
                      background: '#2D3560',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="2" />
                      <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* 상세 검색 팝업 */}
              {showDetailedSearch && (
                <>
                  {/* 외부 클릭 닫기 오버레이 */}
                  <div
                    onClick={() => setShowDetailedSearch(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      background: '#FFFFFF',
                      borderRadius: 12,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
                      padding: '20px 20px 16px',
                      zIndex: 50,
                      minWidth: isMobile ? 'auto' : 480,
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E2124', marginBottom: 12, fontFamily: ff }}>
                      상세 검색 조건
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {conditions.map((cond, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {idx === 0 ? (
                            <div style={{ width: 68, flexShrink: 0 }} />
                          ) : (
                            /* AND/OR/NOT 연산자 선택 — 추후 활성화 가능
                            <select
                              value={cond.operator}
                              onChange={(e) => updateCondition(idx, { operator: e.target.value as DetailedSearchCondition['operator'] })}
                              style={{
                                width: 68, height: 36, padding: '0 6px',
                                border: '1px solid #CDD1D5', borderRadius: 6,
                                fontSize: 13, color: '#1E2124', background: '#FFFFFF',
                                flexShrink: 0, cursor: 'pointer', outline: 'none', fontFamily: ff,
                              }}
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                              <option value="NOT">NOT</option>
                            </select>
                            */
                            <div style={{
                              width: 68, height: 36, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: '#8A949E',
                              letterSpacing: '0.08em',
                            }}>
                              AND
                            </div>
                          )}
                          <select
                            value={cond.field}
                            onChange={(e) => updateCondition(idx, { field: e.target.value as DetailedSearchCondition['field'] })}
                            style={{
                              width: 80, height: 36, padding: '0 6px',
                              border: '1px solid #CDD1D5', borderRadius: 6,
                              fontSize: 13, color: '#1E2124', background: '#FFFFFF',
                              flexShrink: 0, cursor: 'pointer', outline: 'none', fontFamily: ff,
                            }}
                          >
                            <option value="title">제목</option>
                            <option value="author">저자</option>
                            <option value="abstract">초록</option>
                            <option value="keyword">키워드</option>
                            <option value="doi">DOI</option>
                            <option value="full_text">전문</option>
                          </select>
                          <input
                            type="text"
                            value={cond.keyword}
                            onChange={(e) => updateCondition(idx, { keyword: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleDetailedSearch(); }}
                            placeholder="검색어를 입력하세요"
                            style={{
                              flex: 1, height: 36, padding: '0 12px',
                              border: '1px solid #CDD1D5', borderRadius: 6,
                              fontSize: 13, color: '#1E2124', outline: 'none', fontFamily: ff,
                            }}
                          />
                          {idx > 0 ? (
                            <button
                              onClick={() => removeCondition(idx)}
                              style={{
                                width: 32, height: 36, flexShrink: 0,
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#8A949E', padding: 0,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                              </svg>
                            </button>
                          ) : (
                            <div style={{ width: 32, flexShrink: 0 }} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
                      {conditions.length < 10 && (
                        <button
                          onClick={addCondition}
                          style={{
                            height: 34, padding: '0 14px', fontSize: 13, fontWeight: 500,
                            color: '#256EF4', background: '#EEF4FF',
                            border: '1px solid #256EF4', borderRadius: 6,
                            cursor: 'pointer', fontFamily: ff,
                          }}
                        >
                          + 조건 추가
                        </button>
                      )}
                      <button
                        onClick={handleDetailedSearch}
                        style={{
                          height: 34, padding: '0 18px', fontSize: 13, fontWeight: 600,
                          color: '#FFFFFF', background: '#063A74',
                          border: 'none', borderRadius: 6, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6, fontFamily: ff,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                          <circle cx="14.67" cy="14.67" r="8" stroke="white" strokeWidth="2.5"/>
                          <path d="M21.33 21.33L26.67 26.67" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        검색
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 우측: 일러스트 (PC only) */}
          {!isMobile && (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', maxWidth: 520 }}>
              <svg width="460" height="300" viewBox="0 0 460 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="290" cy="150" rx="160" ry="130" fill="rgba(255,255,255,0.04)" />
                <rect x="50" y="70" width="130" height="170" rx="8" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <rect x="62" y="88" width="76" height="8" rx="4" fill="rgba(255,255,255,0.35)" />
                <rect x="62" y="104" width="96" height="5" rx="2.5" fill="rgba(255,255,255,0.15)" />
                <rect x="62" y="116" width="86" height="5" rx="2.5" fill="rgba(255,255,255,0.15)" />
                <rect x="62" y="128" width="92" height="5" rx="2.5" fill="rgba(255,255,255,0.15)" />
                <rect x="62" y="148" width="64" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
                <rect x="62" y="160" width="78" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
                <rect x="200" y="44" width="140" height="180" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                <rect x="214" y="64" width="84" height="8" rx="4" fill="rgba(255,255,255,0.45)" />
                <rect x="214" y="82" width="108" height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
                <rect x="214" y="94" width="98" height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
                <rect x="214" y="106" width="102" height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
                <rect x="214" y="126" width="68" height="4" rx="2" fill="rgba(255,255,255,0.13)" />
                <rect x="214" y="138" width="84" height="4" rx="2" fill="rgba(255,255,255,0.13)" />
                <circle cx="370" cy="100" r="46" stroke="#A78BFA" strokeWidth="5" fill="rgba(167,139,250,0.1)" />
                <circle cx="370" cy="100" r="32" stroke="rgba(167,139,250,0.25)" strokeWidth="1" fill="none" />
                <line x1="404" y1="134" x2="430" y2="160" stroke="#A78BFA" strokeWidth="7" strokeLinecap="round" />
                <rect x="354" y="91" width="32" height="5" rx="2.5" fill="rgba(255,255,255,0.65)" />
                <rect x="354" y="102" width="24" height="5" rx="2.5" fill="rgba(255,255,255,0.4)" />
                <rect x="354" y="113" width="28" height="5" rx="2.5" fill="rgba(255,255,255,0.4)" />
                <rect x="158" y="108" width="52" height="76" rx="10" fill="#FF6B6B" opacity="0.9" />
                <circle cx="184" cy="97" r="24" fill="#FFD93D" opacity="0.95" />
                <path d="M210 132 L338 112" stroke="#FF6B6B" strokeWidth="11" strokeLinecap="round" opacity="0.65" />
                <rect x="24" y="24" width="96" height="38" rx="8" fill="rgba(255,255,255,0.1)" />
                <text x="72" y="48" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="12" fontWeight="600" fontFamily="sans-serif">논문 검색</text>
                <rect x="310" y="200" width="110" height="38" rx="8" fill="rgba(255,255,255,0.1)" />
                <text x="365" y="224" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="12" fontWeight="600" fontFamily="sans-serif">빠른 찾기</text>
                <circle cx="38" cy="210" r="8" fill="#4ADE80" opacity="0.7" />
                <circle cx="420" cy="38" r="10" fill="#60A5FA" opacity="0.7" />
                <circle cx="110" cy="268" r="6" fill="#F472B6" opacity="0.7" />
                <circle cx="390" cy="258" r="5" fill="#FBBF24" opacity="0.6" />
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. 카테고리 + 논문 목록
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F4F5F6', padding: isMobile ? '24px 0' : '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px}` }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: isMobile ? 12 : 16,
              padding: isMobile ? '24px 16px' : '40px 48px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            {/* 카테고리 아이콘 그리드 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(9, 1fr)',
                gap: isMobile ? 12 : 8,
                marginBottom: isMobile ? 24 : 32,
              }}
            >
              {SUBJECTS.map((s) => {
                const isSelected = selectedSubject === s.label;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSubjectClick(s.label)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: isMobile ? 6 : 8,
                      background: isSelected ? '#EEF2FF' : 'none',
                      border: isSelected ? '2px solid #5B5FC7' : '2px solid transparent',
                      borderRadius: 12,
                      cursor: 'pointer',
                      padding: isMobile ? '10px 4px' : '12px 4px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? 52 : 60,
                        height: isMobile ? 52 : 60,
                        borderRadius: 12,
                        background: '#F4F5F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img src={s.icon} alt={s.label} style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, objectFit: 'contain' }} />
                    </div>
                    <span
                      style={{
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#5B5FC7' : '#1E2124',
                        textAlign: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 구분선 */}
            <div style={{ borderTop: '1px solid #F0F1F2', marginBottom: isMobile ? 16 : 24 }} />

            {/* 논문 목록 — 모바일 1열 / PC 2열 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? 0 : '0 32px',
              }}
            >
              {displayedPapers.map((p, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(p.title)}`)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: isMobile ? '12px 0' : '14px 0',
                    borderBottom: '1px solid #F0F1F2',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                    borderBottomColor: '#F0F1F2',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 600,
                      color: '#1E2124',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      display: 'block',
                    }}
                  >
                    {p.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: isMobile ? 11 : 12, color: '#8A949E' }}>{p.author}</span>
                    <span style={{ width: 1, height: 10, background: '#CDD1D5', margin: '0 6px', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: isMobile ? 11 : 12, color: '#8A949E' }}>{p.publisher}</span>
                    <span style={{ width: 1, height: 10, background: '#CDD1D5', margin: '0 6px', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: isMobile ? 11 : 12, color: '#8A949E' }}>{p.year}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. 인기 검색 키워드
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: sectionPy }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px}` }}>
          <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#1E2124', marginBottom: isMobile ? 16 : 24 }}>
            인기 검색 키워드
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8 }}>
            {POPULAR_KEYWORDS.map((kw, i) => (
              <button
                key={i}
                onClick={() => { setQuery(kw); navigate(`/search?q=${encodeURIComponent(kw)}`); }}
                style={{
                  padding: isMobile ? '6px 14px' : '9px 20px',
                  borderRadius: 100,
                  border: '1px solid #CDD1D5',
                  background: '#FFFFFF',
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 500,
                  color: '#464C53',
                  cursor: 'pointer',
                  fontFamily: ff,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = '#2D3560'; b.style.color = '#FFFFFF'; b.style.borderColor = '#2D3560'; }}
                onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = '#FFFFFF'; b.style.color = '#464C53'; b.style.borderColor = '#CDD1D5'; }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. SIMS 배너
      ════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(135deg, #2a1a4e 0%, #4a3a8e 40%, #6b5ce7 100%)',
          padding: isMobile ? '48px 16px' : '64px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!isMobile && (
          <>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 360, background: 'linear-gradient(135deg, transparent 30%, rgba(91,111,191,0.35) 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)', width: 220, height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }} />
          </>
        )}
        <a
          href="https://sims.newnonmun.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'inline-block', position: 'relative', zIndex: 1 }}
        >
          <p style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: '#F5C842', marginBottom: isMobile ? 8 : 12, letterSpacing: '0.02em' }}>
            효율적인 학회 운영 관리
          </p>
          <h2 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1.35 }}>
            학회통합관리시스템 SIMS로 해결하세요!
          </h2>
        </a>
      </section>

      {/* ════════════════════════════════════════
          5. 신규 업데이트 저널
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '40px 0 48px' : '64px 0 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px}` }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 16 : 28 }}>
            <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#1E2124' }}>신규 업데이트 저널</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, color: '#8A949E', fontWeight: 600 }}>1 / 8</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['‹', '›'].map((arrow, idx) => (
                  <button
                    key={idx}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: '1px solid #E4E7EA',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: 18,
                      color: '#8A949E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {arrow}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 카드 — 모바일 1열 / PC 3열 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? 16 : 24,
            }}
          >
            {JOURNAL_CARDS.map((card, i) => (
              <JournalCard key={i} card={card} idx={i} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
