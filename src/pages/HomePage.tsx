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
const SUBJECT_TABS = [
  '심리학', '교육학', '유아교육학', '사회복지학', '사회과학', '의약학', '인문학',
];

const POPULAR_KEYWORDS = [
  '인공지능', '키워드', '키워드', '키워드', '키워드',
  '키워드', '키워드', '키워드', '키워드', '키워드',
  '키워드', '키워드', '키워드', '키워드',
];

type Paper = {
  title: string;
  abstract: string;
  author: string;
  journal: string;
  volume: string;
  badge: 'KCI등재' | '등재정보' | '등재후보';
  badgeColor: string;
  badgeBg: string;
};

const makePapers = (badge1: Paper['badge'] = 'KCI등재'): Paper[] => [
  {
    title: '논문 타이틀 영역 / 최대 2줄까지 보여집니다',
    abstract: '논문 초록이 보여지는 영역으로 최대 2줄까지 보여지며 집니다. 논문 초록이 보여지…',
    author: '저자 외 1명',
    journal: '저널명',
    volume: '권(호)',
    badge: badge1,
    badgeColor: '#2563EB',
    badgeBg: '#EFF4FF',
  },
  {
    title: '논문 타이틀 영역 / 최대 2줄까지 보여집니다',
    abstract: '논문 초록이 보여지는 영역으로 최대 2줄까지 보여지며 집니다. 논문 초록이 보여지…',
    author: '저자 외 1명',
    journal: '저널명',
    volume: '권(호)',
    badge: '등재정보',
    badgeColor: '#16A34A',
    badgeBg: '#EEFBF3',
  },
  {
    title: '논문 타이틀 영역 / 최대 2줄까지 보여집니다',
    abstract: '논문 초록이 보여지는 영역으로 최대 2줄까지 보여지며 집니다. 논문 초록이 보여지…',
    author: '저자 외 1명',
    journal: '저널명',
    volume: '권(호)',
    badge: '등재정보',
    badgeColor: '#DC2626',
    badgeBg: '#FEF2F2',
  },
  {
    title: '논문 타이틀 영역 / 최대 2줄까지 보여집니다',
    abstract: '논문 초록이 보여지는 영역으로 최대 2줄까지 보여지며 집니다. 논문 초록이 보여지…',
    author: '저자 외 1명',
    journal: '저널명',
    volume: '권(호)',
    badge: '등재정보',
    badgeColor: '#16A34A',
    badgeBg: '#EEFBF3',
  },
];

const PAPERS_BY_SUBJECT: Record<string, Paper[]> = {
  '심리학': makePapers('KCI등재'),
  '교육학': makePapers('KCI등재'),
  '유아교육학': makePapers('KCI등재'),
  '사회복지학': makePapers('KCI등재'),
  '사회과학': makePapers('KCI등재'),
  '의약학': makePapers('KCI등재'),
  '인문학': makePapers('KCI등재'),
};

const JOURNAL_ITEMS = [
  { title: '한국노년학연구', publisher: '한국노년학연구회', hasCover: true },
  { title: '저널 타이틀', publisher: '발행기관', hasCover: false },
  { title: '저널 타이틀', publisher: '발행기관', hasCover: false },
  { title: '저널 타이틀', publisher: '발행기관', hasCover: false },
  { title: '저널 타이틀', publisher: '발행기관', hasCover: false },
  { title: '저널 타이틀', publisher: '발행기관', hasCover: false },
];

const ff = 'Pretendard GOV, Pretendard, sans-serif';

/* ───────────────────────────────────────────
   히어로 일러스트 SVG (PNG 디자인 참고)
   - 2명의 캐릭터가 논문/문서를 검색하는 모습
   - 떠다니는 문서, 구름, 돋보기 아이콘
   ─────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── 떠다니는 구름 ── */}
      <g opacity="0.6">
        <rect x="30" y="28" width="70" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
        <rect x="20" y="38" width="90" height="6" rx="3" fill="rgba(255,255,255,0.18)" />
        <rect x="110" y="18" width="55" height="5" rx="2.5" fill="rgba(255,255,255,0.2)" />
        <rect x="340" y="10" width="65" height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
        <rect x="350" y="20" width="85" height="5" rx="2.5" fill="rgba(255,255,255,0.15)" />
        <rect x="200" y="5" width="50" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
        <rect x="80" y="270" width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" />
        <rect x="300" y="280" width="70" height="5" rx="2.5" fill="rgba(255,255,255,0.1)" />
      </g>

      {/* ── 문서 카드 1 (뒤쪽, 왼쪽) ── */}
      <g transform="translate(55, 55) rotate(-4)">
        <rect width="110" height="148" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <rect x="12" y="16" width="60" height="7" rx="3.5" fill="rgba(255,255,255,0.35)" />
        <rect x="12" y="30" width="86" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="12" y="40" width="78" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="12" y="50" width="82" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="12" y="66" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <rect x="12" y="76" width="62" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <rect x="12" y="86" width="54" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <rect x="12" y="104" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.07)" />
        <rect x="12" y="114" width="48" height="3" rx="1.5" fill="rgba(255,255,255,0.07)" />
      </g>

      {/* ── 문서 카드 2 (앞쪽, 가운데) ── */}
      <g transform="translate(185, 40) rotate(2)">
        <rect width="120" height="160" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
        {/* 상단 하이라이트 바 */}
        <rect x="0" y="0" width="120" height="28" rx="8" fill="rgba(79,140,255,0.15)" />
        <rect x="12" y="10" width="50" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
        <rect x="12" y="38" width="96" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
        <rect x="12" y="50" width="84" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
        <rect x="12" y="60" width="90" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
        <rect x="12" y="70" width="76" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
        <rect x="12" y="88" width="56" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
        <rect x="12" y="98" width="68" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
        <rect x="12" y="108" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
        <rect x="12" y="126" width="44" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
        <rect x="12" y="136" width="52" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
      </g>

      {/* ── 돋보기 아이콘 (우상단) ── */}
      <g transform="translate(330, 50)">
        <circle cx="40" cy="40" r="38" fill="rgba(99,130,255,0.08)" stroke="rgba(99,130,255,0.5)" strokeWidth="4" />
        <circle cx="40" cy="40" r="26" fill="none" stroke="rgba(99,130,255,0.2)" strokeWidth="1" />
        {/* 돋보기 안 텍스트 라인 */}
        <rect x="24" y="32" width="32" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
        <rect x="24" y="42" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
        <rect x="24" y="50" width="28" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
        {/* 돋보기 손잡이 */}
        <line x1="70" y1="70" x2="96" y2="96" stroke="rgba(99,130,255,0.5)" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* ── 캐릭터 1 (왼쪽, 파란 옷) ── */}
      <g transform="translate(120, 160)">
        {/* 몸통 */}
        <rect x="-16" y="30" width="32" height="42" rx="10" fill="#4A5FBF" />
        {/* 왼팔 (노트북 들고있는) */}
        <rect x="-30" y="34" width="16" height="8" rx="4" fill="#4A5FBF" />
        {/* 오른팔 */}
        <rect x="14" y="34" width="16" height="8" rx="4" fill="#4A5FBF" />
        {/* 머리 */}
        <circle cx="0" cy="14" r="18" fill="#FFD8A8" />
        {/* 머리카락 */}
        <path d="M-18 8 Q-18 -8, 0 -10 Q18 -8, 18 8 Q16 0, 0 -2 Q-16 0, -18 8Z" fill="#3D3D5C" />
        {/* 눈 */}
        <circle cx="-6" cy="14" r="2" fill="#2D2D4C" />
        <circle cx="6" cy="14" r="2" fill="#2D2D4C" />
        {/* 입 */}
        <path d="M-4 20 Q0 24, 4 20" stroke="#E8A070" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* 다리 */}
        <rect x="-10" y="70" width="10" height="22" rx="5" fill="#3D4A99" />
        <rect x="0" y="70" width="10" height="22" rx="5" fill="#3D4A99" />
        {/* 신발 */}
        <ellipse cx="-5" cy="94" rx="7" ry="4" fill="#2D2D4C" />
        <ellipse cx="5" cy="94" rx="7" ry="4" fill="#2D2D4C" />
      </g>

      {/* ── 캐릭터 2 (오른쪽, 주황 옷) ── */}
      <g transform="translate(330, 170)">
        {/* 몸통 */}
        <rect x="-14" y="28" width="28" height="38" rx="9" fill="#E8711A" />
        {/* 왼팔 */}
        <rect x="-26" y="32" width="14" height="7" rx="3.5" fill="#E8711A" />
        {/* 오른팔 (위로 들기) */}
        <rect x="12" y="18" width="14" height="7" rx="3.5" fill="#E8711A" transform="rotate(-30, 19, 21.5)" />
        {/* 머리 */}
        <circle cx="0" cy="12" r="16" fill="#FFD8A8" />
        {/* 머리카락 */}
        <path d="M-16 6 Q-16 -8, 0 -10 Q16 -8, 16 6 Q14 -2, 0 -4 Q-14 -2, -16 6Z" fill="#5C3D1E" />
        {/* 안경 */}
        <circle cx="-6" cy="12" r="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
        <circle cx="6" cy="12" r="5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
        <line x1="-1" y1="12" x2="1" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
        {/* 눈 */}
        <circle cx="-6" cy="12" r="1.5" fill="#2D2D4C" />
        <circle cx="6" cy="12" r="1.5" fill="#2D2D4C" />
        {/* 입 */}
        <path d="M-3 18 Q0 21, 3 18" stroke="#E8A070" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* 다리 */}
        <rect x="-8" y="64" width="8" height="20" rx="4" fill="#C45A10" />
        <rect x="0" y="64" width="8" height="20" rx="4" fill="#C45A10" />
        {/* 신발 */}
        <ellipse cx="-4" cy="86" rx="6" ry="3.5" fill="#2D2D4C" />
        <ellipse cx="4" cy="86" rx="6" ry="3.5" fill="#2D2D4C" />
      </g>

      {/* ── 떠다니는 아이콘/도형들 ── */}
      {/* 작은 문서 아이콘 */}
      <g transform="translate(260, 120)" opacity="0.7">
        <rect width="28" height="36" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        <rect x="5" y="6" width="18" height="2.5" rx="1.25" fill="rgba(255,255,255,0.3)" />
        <rect x="5" y="12" width="14" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
        <rect x="5" y="17" width="16" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
      </g>

      {/* 작은 체크마크 원 */}
      <circle cx="440" cy="140" r="10" fill="rgba(74,222,128,0.25)" stroke="rgba(74,222,128,0.6)" strokeWidth="1.5" />
      <path d="M435 140 L438 143 L445 136" stroke="rgba(74,222,128,0.8)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* 장식 원들 */}
      <circle cx="55" cy="260" r="7" fill="#4ADE80" opacity="0.6" />
      <circle cx="450" cy="30" r="9" fill="#60A5FA" opacity="0.6" />
      <circle cx="165" cy="18" r="5" fill="#F472B6" opacity="0.5" />
      <circle cx="420" cy="250" r="6" fill="#FBBF24" opacity="0.5" />
      <circle cx="240" cy="275" r="4" fill="#A78BFA" opacity="0.4" />
      <circle cx="10" cy="140" r="4" fill="#38BDF8" opacity="0.4" />

      {/* 작은 별/반짝이 */}
      <g transform="translate(380, 180)" opacity="0.5">
        <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5Z" fill="white" />
      </g>
      <g transform="translate(100, 80)" opacity="0.4">
        <path d="M0 -4 L1.2 -1.2 L4 0 L1.2 1.2 L0 4 L-1.2 1.2 L-4 0 L-1.2 -1.2Z" fill="white" />
      </g>
      <g transform="translate(460, 100)" opacity="0.35">
        <path d="M0 -3 L1 -1 L3 0 L1 1 L0 3 L-1 1 L-3 0 L-1 -1Z" fill="white" />
      </g>
    </svg>
  );
}

/* ───────────────────────────────────────────
   논문 카드 컴포넌트
   ─────────────────────────────────────────── */
function PaperCard({ paper, isMobile }: { paper: Paper; isMobile: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/search?q=${encodeURIComponent(paper.title)}`)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E4E7EA',
        borderRadius: 10,
        padding: isMobile ? '16px 14px' : '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        minHeight: isMobile ? 'auto' : 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#C5CAD0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#E4E7EA';
      }}
    >
      {/* 뱃지 */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: paper.badgeColor,
          background: paper.badgeBg,
          borderRadius: 4,
          padding: '3px 8px',
          lineHeight: '16px',
          alignSelf: 'flex-start',
          letterSpacing: '-0.01em',
        }}
      >
        {paper.badge}
      </span>

      {/* 제목 — 2줄 */}
      <p
        style={{
          fontSize: isMobile ? 14 : 15,
          fontWeight: 700,
          color: '#1E2124',
          lineHeight: 1.55,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'keep-all',
        }}
      >
        {paper.title}
      </p>

      {/* 초록 — 2줄, 작은 회색 */}
      <p
        style={{
          fontSize: isMobile ? 12 : 13,
          color: '#8A949E',
          lineHeight: 1.65,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {paper.abstract}
      </p>

      {/* 저자 + 저널/권호 — 하단 고정 */}
      <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, color: '#8A949E', fontWeight: 400 }}>{paper.author}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8A949E' }}>
          <span>{paper.journal}</span>
          <span style={{ color: '#CDD1D5', fontSize: 10 }}>&gt;</span>
          <span>{paper.volume}</span>
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
  const [selectedTab, setSelectedTab] = useState('심리학');
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

  const displayedPapers = PAPERS_BY_SUBJECT[selectedTab] ?? [];
  const px = isMobile ? '16px' : '40px';

  return (
    <div style={{ fontFamily: ff, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ════════════════════════════════════════
          1. HERO — 진한 네이비 그라데이션 + 일러스트
      ════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1B1F3B 0%, #2B3260 35%, #3D4F8A 100%)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* 배경 반원 장식 (PNG 참고) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -80, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: '35%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: isMobile ? '44px 16px 40px' : '72px 40px 80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 32,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* ── 좌측: 타이틀 + 검색바 ── */}
          <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 520 }}>
            <h1
              style={{
                fontSize: isMobile ? 28 : 38,
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: isMobile ? 8 : 14,
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
              }}
            >
              생각은 깊게, 검색은 빠르게
            </h1>
            <p
              style={{
                fontSize: isMobile ? 14 : 16,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: isMobile ? 28 : 40,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              복잡한 절차 없이 핵심 논문을 빠르게 찾아보세요.
            </p>

            {/* 검색 바 */}
            <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 480, zIndex: 100 }}>
              <form onSubmit={handleSearch}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    borderRadius: 12,
                    overflow: 'hidden',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  }}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isMobile ? '키워드를 입력하세요' : '찾고 싶은 논문, 저자, 키워드를 입력하세요'}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: isMobile ? '14px 12px' : '18px 20px',
                      border: 'none',
                      outline: 'none',
                      fontSize: isMobile ? 13 : 14,
                      color: '#1E2124',
                      background: 'transparent',
                      fontFamily: ff,
                    }}
                  />
                  {/* 상세검색 토글 */}
                  <button
                    type="button"
                    onClick={() => setShowDetailedSearch(v => !v)}
                    title="상세 검색"
                    style={{
                      width: 44,
                      height: isMobile ? 50 : 58,
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
                  {/* 검색 버튼 (파란색 동그란 아이콘, PNG 참고) */}
                  <button
                    type="submit"
                    style={{
                      width: isMobile ? 50 : 58,
                      height: isMobile ? 50 : 58,
                      background: '#3B5BDB',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      borderRadius: '0 12px 12px 0',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="2.2" />
                      <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* ── 상세 검색 팝업 ── */}
              {showDetailedSearch && (
                <>
                  <div onClick={() => setShowDetailedSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                  <div
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                      background: '#FFFFFF', borderRadius: 12,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
                      padding: isMobile ? '16px 12px 12px' : '20px 20px 16px', zIndex: 9999,
                      minWidth: isMobile ? 'auto' : 480,
                      maxWidth: '100%',
                      boxSizing: 'border-box' as const,
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E2124', marginBottom: 12, fontFamily: ff }}>상세 검색 조건</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {conditions.map((cond, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: isMobile ? 4 : 6, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                          {idx === 0 ? (
                            !isMobile && <div style={{ width: 68, flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: isMobile ? 40 : 68, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#8A949E', letterSpacing: '0.08em' }}>AND</div>
                          )}
                          <select
                            value={cond.field}
                            onChange={(e) => updateCondition(idx, { field: e.target.value as DetailedSearchCondition['field'] })}
                            style={{ width: isMobile ? 64 : 80, height: 36, padding: '0 4px', border: '1px solid #CDD1D5', borderRadius: 6, fontSize: isMobile ? 12 : 13, color: '#1E2124', background: '#FFFFFF', flexShrink: 0, cursor: 'pointer', outline: 'none', fontFamily: ff }}
                          >
                            <option value="title">제목</option>
                            <option value="author">저자</option>
                            <option value="abstract">초록</option>
                            <option value="keyword">키워드</option>
                            <option value="doi">DOI</option>
                            <option value="full_text">전문</option>
                          </select>
                          <input
                            type="text" value={cond.keyword}
                            onChange={(e) => updateCondition(idx, { keyword: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleDetailedSearch(); }}
                            placeholder="검색어 입력"
                            style={{ flex: 1, minWidth: 0, height: 36, padding: '0 10px', border: '1px solid #CDD1D5', borderRadius: 6, fontSize: isMobile ? 12 : 13, color: '#1E2124', outline: 'none', fontFamily: ff }}
                          />
                          {idx > 0 ? (
                            <button onClick={() => removeCondition(idx)} style={{ width: 28, height: 36, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A949E', padding: 0 }}>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                            </button>
                          ) : <div style={{ width: isMobile ? 0 : 32, flexShrink: 0 }} />}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
                      {conditions.length < 10 && (
                        <button onClick={addCondition} style={{ height: 34, padding: '0 14px', fontSize: 13, fontWeight: 500, color: '#256EF4', background: '#EEF4FF', border: '1px solid #256EF4', borderRadius: 6, cursor: 'pointer', fontFamily: ff }}>+ 조건 추가</button>
                      )}
                      <button onClick={handleDetailedSearch} style={{ height: 34, padding: '0 18px', fontSize: 13, fontWeight: 600, color: '#FFFFFF', background: '#063A74', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: ff }}>
                        <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><circle cx="14.67" cy="14.67" r="8" stroke="white" strokeWidth="2.5"/><path d="M21.33 21.33L26.67 26.67" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        검색
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── 우측: 일러스트 (PC only) ── */}
          {!isMobile && (
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <HeroIllustration />
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. 주제별 인기논문 — 흰 배경, 탭 + 4열 카드
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '36px 0 40px' : '60px 0 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px}` }}>
          {/* 섹션 타이틀 */}
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#1E2124', marginBottom: 6, letterSpacing: '-0.3px' }}>
            주제별 인기논문
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#8A949E', marginBottom: isMobile ? 20 : 28, fontWeight: 400 }}>
            최근 7일, 분야별 핫한 논문들을 모았습니다.
          </p>

          {/* 탭 — PNG: 직사각형 버튼, 선택=네이비 배경/흰텍스트, 비선택=흰배경/회border */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8, marginBottom: isMobile ? 20 : 28 }}>
            {SUBJECT_TABS.map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  style={{
                    padding: isMobile ? '8px 16px' : '9px 20px',
                    borderRadius: 6,
                    border: isActive ? 'none' : '1px solid #D1D5DB',
                    background: isActive ? '#2D3560' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#6B7280',
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: ff,
                    transition: 'all 0.15s',
                    lineHeight: '20px',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* 논문 카드 — 4열 (모바일 1열) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? 12 : 16,
            }}
          >
            {displayedPapers.map((p, i) => (
              <PaperCard key={`${selectedTab}-${i}`} paper={p} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. 인기 검색 키워드 — 연회색 배경
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#F5F6F7', padding: isMobile ? '36px 0' : '56px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px}` }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#1E2124', marginBottom: 6, letterSpacing: '-0.3px' }}>
            인기 검색 키워드
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#8A949E', marginBottom: isMobile ? 20 : 28, fontWeight: 400 }}>
            다른 연구자들은 어떤 키워드에 주목하고 있을까요?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 10 }}>
            {POPULAR_KEYWORDS.map((kw, i) => (
              <button
                key={i}
                onClick={() => { setQuery(kw); navigate(`/search?q=${encodeURIComponent(kw)}`); }}
                style={{
                  padding: isMobile ? '9px 18px' : '10px 24px',
                  borderRadius: 100,
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 500,
                  color: '#4B5563',
                  cursor: 'pointer',
                  fontFamily: ff,
                  transition: 'all 0.15s',
                  lineHeight: '20px',
                }}
                onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = '#2D3560'; b.style.color = '#FFFFFF'; b.style.borderColor = '#2D3560'; }}
                onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = '#FFFFFF'; b.style.color = '#4B5563'; b.style.borderColor = '#D1D5DB'; }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. SIMS 배너 — 검정 배경
      ════════════════════════════════════════ */}
      <section
        style={{
          background: '#111111',
          padding: isMobile ? '52px 16px' : '72px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <a
          href="https://sims.newnonmun.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'inline-block', position: 'relative', zIndex: 1 }}
        >
          <p style={{ fontSize: isMobile ? 13 : 16, fontWeight: 600, color: '#EAB308', marginBottom: isMobile ? 10 : 16, letterSpacing: '0.02em' }}>
            효율적인 학회 운영 관리
          </p>
          <h2 style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1.35 }}>
            학회통합관리시스템 SIMS로 해결하세요!
          </h2>
        </a>
      </section>

      {/* ════════════════════════════════════════
          5. 업데이트 저널 — 커버 + 타이틀 + 발행기관
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: isMobile ? '40px 0 52px' : '60px 0 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px}` }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#1E2124', marginBottom: 6, letterSpacing: '-0.3px' }}>
            업데이트 저널
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#8A949E', marginBottom: isMobile ? 20 : 32, fontWeight: 400 }}>
            따끈따끈한 최신 저널을 가장 먼저 만나보세요.
          </p>

          {/* 6열 그리드 (모바일 3열) — PNG 참고 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
              gap: isMobile ? 12 : 24,
            }}
          >
            {JOURNAL_ITEMS.map((journal, i) => (
              <div key={i} style={{ cursor: 'pointer' }}>
                {/* 커버 이미지 */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    borderRadius: 4,
                    background: journal.hasCover ? '#EDE9DC' : '#F3F4F5',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {journal.hasCover ? (
                    /* 첫 번째 저널: 실제 표지 모사 */
                    <div style={{ textAlign: 'center', padding: 12 }}>
                      <div style={{ fontSize: 9, color: '#8A949E', marginBottom: 6, letterSpacing: '0.05em' }}>KCI</div>
                      <p style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, color: '#3D3D5C', lineHeight: 1.3, marginBottom: 4 }}>한국노년학연구</p>
                      <div style={{ width: 20, height: 2, background: '#BEB9A8', margin: '6px auto', borderRadius: 1 }} />
                    </div>
                  ) : (
                    /* 나머지: 빈 이미지 (X 자 표시) */
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="4" y="4" width="32" height="32" rx="2" stroke="#D1D5DB" strokeWidth="1" fill="none" />
                      <line x1="12" y1="12" x2="28" y2="28" stroke="#D1D5DB" strokeWidth="1" />
                      <line x1="28" y1="12" x2="12" y2="28" stroke="#D1D5DB" strokeWidth="1" />
                    </svg>
                  )}
                </div>
                {/* 저널 타이틀 */}
                <p style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600, color: '#1E2124', marginBottom: 3, lineHeight: 1.35, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {journal.title}
                </p>
                {/* 발행기관 */}
                <p style={{ fontSize: isMobile ? 11 : 12, color: '#8A949E', fontWeight: 400, margin: 0 }}>
                  {journal.publisher}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
