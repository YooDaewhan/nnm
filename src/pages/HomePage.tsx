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
  '인공지능', '기후변화', '우울증', '메타버스', '빅데이터',
  '자기효능감', '사회적 자본', '치매', '코로나19', '학업성취도',
  '인지행동치료', '장기요양', '다문화교육', '플립드러닝',
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

const PAPERS_BY_SUBJECT: Record<string, Paper[]> = {
  '심리학': [
    {
      title: '인지행동치료가 우울증 환자의 심리적 안녕감에 미치는 영향',
      abstract: '본 연구는 인지행동치료(CBT) 프로그램이 주요 우울장애 진단을 받은 성인 환자의 심리적 안녕감 및 삶의 질에 미치는 효과를 검증하였다.',
      author: '김민준 외 2명',
      journal: '한국심리학회지: 임상',
      volume: '43(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '성인 애착 유형과 대인관계 만족도의 관계에 관한 연구',
      abstract: '이 연구는 성인기 애착 유형(안정, 불안, 회피)이 친밀한 대인관계 만족도에 미치는 영향을 살펴보고 자기존중감의 매개 효과를 분석하였다.',
      author: '이수연',
      journal: '상담학연구',
      volume: '25(1)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '스마트폰 과의존이 청소년 정신건강에 미치는 영향: 수면의 질의 매개 효과',
      abstract: '청소년의 스마트폰 과의존 수준이 우울, 불안 등 정신건강 지표에 미치는 영향을 검토하고, 수면의 질이 이 관계를 매개하는지 구조방정식 모형으로 분석하였다.',
      author: '박지훈 외 1명',
      journal: '청소년학연구',
      volume: '31(4)',
      badge: '등재후보',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
    },
    {
      title: '아동의 자기효능감 발달에 영향을 미치는 가정환경 요인 분석',
      abstract: '초등학교 3~6학년 아동을 대상으로 부모의 양육 태도, 가정 내 학습 환경, 형제 관계가 아동의 자기효능감 발달에 미치는 영향을 다변량 분석으로 검토하였다.',
      author: '최은혜 외 3명',
      journal: '아동학회지',
      volume: '45(3)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
  ],
  '교육학': [
    {
      title: '플립드 러닝이 대학생의 학업성취도 및 자기주도 학습에 미치는 효과',
      abstract: '본 연구는 국내 4년제 대학교 교양 강좌에 플립드 러닝(Flipped Learning)을 적용하여 전통적 강의 방식 대비 학업성취도와 자기주도 학습 능력의 차이를 분석하였다.',
      author: '정다은 외 1명',
      journal: '교육학연구',
      volume: '62(1)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '교사의 감성지능이 학급 분위기 및 학생 학업 동기에 미치는 영향',
      abstract: '초·중등 교사의 감성지능 수준이 담당 학급의 긍정적 분위기 형성 및 학생들의 내재적 학업 동기에 미치는 경로를 구조방정식 모형으로 검증하였다.',
      author: '한승우',
      journal: '한국교원교육연구',
      volume: '41(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '메타버스 기반 교육 플랫폼 활용이 학습 참여도와 몰입감에 미치는 영향',
      abstract: '중학교 역사 수업에 메타버스 플랫폼을 도입하여 전통 수업과의 학습 참여도, 몰입감, 학습 효과를 비교하고 활용 시 고려해야 할 교육적 시사점을 제안하였다.',
      author: '오윤서 외 2명',
      journal: '교육공학연구',
      volume: '40(1)',
      badge: '등재후보',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
    },
    {
      title: '협동학습 전략이 초등학생의 사회적 기술 발달과 학업 성취에 미치는 효과',
      abstract: '초등학교 4학년 학생을 대상으로 협동학습 전략(STAD, 직소 모형)을 적용한 후 사회적 기술 척도와 학업성취도 검사를 통해 개인학습 집단과의 차이를 비교하였다.',
      author: '송미래 외 1명',
      journal: '초등교육연구',
      volume: '37(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
  ],
  '유아교육학': [
    {
      title: '독서교육 프로그램이 유아의 언어 발달 및 어휘력에 미치는 효과',
      abstract: '만 4~5세 유아를 대상으로 12주간의 독서교육 프로그램을 실시하여 수용 어휘, 표현 어휘, 이야기 이해력 등 언어 발달 지표에 미치는 효과를 검증하였다.',
      author: '윤지아 외 1명',
      journal: '유아교육연구',
      volume: '44(3)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '부모-자녀 상호작용 놀이가 유아의 사회·정서 발달에 미치는 영향',
      abstract: '주 2회 부모-자녀 놀이 상호작용 프로그램에 참여한 만 3~4세 유아의 공감 능력, 정서 조절, 또래 관계 등 사회·정서 발달 변화를 사전·사후 비교로 분석하였다.',
      author: '강예진',
      journal: '한국유아교육학회지',
      volume: '28(1)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '유치원 교사의 직무 스트레스와 소진의 관계: 회복탄력성의 조절 효과',
      abstract: '국공립 및 사립 유치원 교사를 대상으로 직무 스트레스와 정서적 소진의 관계를 검토하고, 회복탄력성이 이 관계를 조절하는 효과가 있는지를 위계적 회귀분석으로 검증하였다.',
      author: '임소연 외 2명',
      journal: '유아교육보육복지연구',
      volume: '28(2)',
      badge: '등재후보',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
    },
    {
      title: 'STEAM 기반 유아 과학교육 프로그램 개발 및 교육적 효과 검증',
      abstract: '만 5세 유아를 위한 STEAM 통합 과학교육 프로그램을 개발하고 창의성, 과학적 탐구 능력, 수학적 사고력에 미치는 효과를 통제집단 비교설계로 검증하였다.',
      author: '노하은 외 1명',
      journal: '유아교육연구',
      volume: '44(1)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
  ],
  '사회복지학': [
    {
      title: '노인 장기요양보험 서비스 이용자의 삶의 질에 영향을 미치는 요인',
      abstract: '장기요양보험 재가 서비스 수급 노인을 대상으로 서비스 만족도, 사회적 지지, 건강 상태, 경제적 수준이 삶의 질에 미치는 영향력을 다중회귀분석으로 검토하였다.',
      author: '류명훈 외 2명',
      journal: '한국노년학',
      volume: '44(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '청소년 사이버 폭력 피해 경험이 학교 적응에 미치는 영향',
      abstract: '중·고등학생의 사이버 폭력 피해 경험이 학교생활 적응(학업, 교우, 교사 관계)에 미치는 부정적 영향을 탐색하고, 가족 지지의 보호 요인으로서의 역할을 분석하였다.',
      author: '서보람',
      journal: '사회복지연구',
      volume: '55(1)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '장애인 직업재활서비스 이용 만족도와 고용 유지 간의 관계',
      abstract: '직업재활 서비스를 이용한 장애인을 대상으로 서비스 만족도(접근성, 전문성, 지속성)와 취업 후 고용 유지 기간 및 적응 수준의 관계를 생존분석으로 분석하였다.',
      author: '안태민 외 1명',
      journal: '장애와 고용',
      volume: '34(1)',
      badge: '등재정보',
      badgeColor: '#16A34A',
      badgeBg: '#EEFBF3',
    },
    {
      title: '지역사회 통합돌봄 정책이 독거노인의 사회적 고립감에 미치는 영향',
      abstract: '커뮤니티케어 시범사업 지역의 독거노인을 대상으로 통합돌봄 서비스 이용 여부에 따른 사회적 고립감 변화를 추적 조사하고 정책 효과성을 평가하였다.',
      author: '황인실 외 3명',
      journal: '보건사회연구',
      volume: '44(3)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
  ],
  '사회과학': [
    {
      title: '디지털 전환 시대의 미디어 리터러시 교육 방향에 관한 연구',
      abstract: '소셜미디어와 AI 생성 콘텐츠의 확산에 따른 허위정보 문제를 분석하고, 비판적 미디어 리터러시 교육의 현황 및 정책적 개선 방향을 전문가 심층 인터뷰와 문헌 분석으로 제시하였다.',
      author: '문지수 외 1명',
      journal: '한국언론학보',
      volume: '68(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '코로나19 이후 재택근무 확산이 조직 몰입도와 직무 만족에 미치는 영향',
      abstract: '팬데믹을 계기로 재택근무를 도입한 기업 종사자를 대상으로 원격근무 환경 특성, 자율성, 소통 방식이 조직 몰입도 및 직무 만족에 미치는 영향 경로를 분석하였다.',
      author: '조현수',
      journal: '경영학연구',
      volume: '53(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '기후변화 인식 수준이 친환경 소비 행동 의도에 미치는 영향',
      abstract: '한국 성인 소비자의 기후변화 위험 인식, 환경 효능감, 사회 규범 인식이 친환경 제품 구매 의도 및 탄소 저감 행동에 미치는 영향을 계획행동이론을 기반으로 검증하였다.',
      author: '이경호 외 2명',
      journal: '소비자학연구',
      volume: '35(1)',
      badge: '등재후보',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
    },
    {
      title: '사회적 자본이 지역 주민의 공동체 참여 행동에 미치는 영향',
      abstract: '도시 및 농촌 지역 주민을 대상으로 신뢰, 네트워크, 호혜성으로 구성된 사회적 자본이 자원봉사·협동조합 등 공동체 참여 행동에 미치는 영향력을 비교 분석하였다.',
      author: '배수정 외 1명',
      journal: '한국사회학',
      volume: '58(1)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
  ],
  '의약학': [
    {
      title: '비만 환자 대상 생활습관 개선 중재가 대사증후군 지표에 미치는 효과',
      abstract: '체질량지수 25 이상인 성인 비만 환자를 대상으로 12주간의 식이·운동·행동수정 통합 중재를 시행하여 허리둘레, 혈압, 공복혈당, 지질 지표 등의 변화를 평가하였다.',
      author: '김태현 외 3명',
      journal: '대한내과학회지',
      volume: '108(3)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '인공지능 기반 흉부 X선 판독 시스템의 임상적 정확도 평가',
      abstract: '딥러닝 기반 흉부 X선 이상 소견 자동 판독 시스템의 민감도·특이도를 방사선과 전문의 판독 결과와 비교하여 임상 현장 적용 가능성과 보조 진단 도구로서의 효용성을 분석하였다.',
      author: '박선영 외 2명',
      journal: '대한영상의학회지',
      volume: '85(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '한국 노인에서 수면의 질과 인지기능 저하의 관계: 종단 코호트 연구',
      abstract: '65세 이상 지역사회 거주 노인 코호트를 3년간 추적하여 수면의 질(PSQI 점수)과 경도 인지장애 및 치매 발생 위험 간의 관계를 Cox 비례위험 회귀분석으로 분석하였다.',
      author: '최재원 외 1명',
      journal: '노인정신의학',
      volume: '28(1)',
      badge: '등재정보',
      badgeColor: '#16A34A',
      badgeBg: '#EEFBF3',
    },
    {
      title: '만성 통증 환자에서 마음챙김 기반 스트레스 감소 프로그램의 효과',
      abstract: '만성 근골격계 통증 환자를 대상으로 8주 MBSR 프로그램을 적용하여 통증 강도, 통증 파국화, 우울·불안 수준, 삶의 질에 미치는 효과를 무작위 대조 연구로 검증하였다.',
      author: '이미영 외 2명',
      journal: '한국통증학회지',
      volume: '37(2)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
  ],
  '인문학': [
    {
      title: '디지털 인문학 방법론을 활용한 조선시대 문집 텍스트 분석',
      abstract: '토픽 모델링(LDA)과 네트워크 분석 기법을 적용하여 조선 중기 문집 텍스트의 주제적 구조와 지식인 담론 네트워크를 시각화하고 전통 문헌학적 해석과 비교하였다.',
      author: '권나영 외 1명',
      journal: '한국고전연구',
      volume: '64(0)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '현대 한국 소설에 나타난 도시 공간과 소외의 서사 연구',
      abstract: '2010년대 이후 한국 도시소설을 분석 대상으로 삼아 젠트리피케이션, 비정규직, 1인 가구 등 도시화의 부작용이 소외와 단절의 서사로 형상화되는 방식을 탐구하였다.',
      author: '신유진',
      journal: '현대문학이론연구',
      volume: '97(0)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
    {
      title: '동아시아 철학에서 공(公) 개념의 계보와 현대적 재해석',
      abstract: "유가·도가·불교 전통에서 '공(公)' 개념이 형성·변용된 역사적 계보를 추적하고, 현대 공공성 담론과의 접점을 탐색하여 동아시아적 공공 철학의 가능성을 논의하였다.",
      author: '함동균 외 1명',
      journal: '동양철학연구',
      volume: '117(0)',
      badge: '등재정보',
      badgeColor: '#16A34A',
      badgeBg: '#EEFBF3',
    },
    {
      title: '1960년대 한국 영화의 젠더 표상과 사회적 맥락',
      abstract: '한국 영화 산업의 황금기인 1960년대 상업 영화를 분석하여 산업화·근대화 과정에서 여성 표상이 어떻게 구성되고 젠더 이데올로기를 재생산하는지를 페미니스트 영화 비평으로 고찰하였다.',
      author: '박혜원 외 2명',
      journal: '한국영화학',
      volume: '98(0)',
      badge: 'KCI등재',
      badgeColor: '#2563EB',
      badgeBg: '#EFF4FF',
    },
  ],
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
