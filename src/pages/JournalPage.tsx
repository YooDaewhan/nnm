import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

/* ───────────────────────────────────────────
   Types
   ─────────────────────────────────────────── */
interface ArticleItem {
  id: number;
  title: string;
  authors: string[];
  publishDate: string;
  views: number;
  doi: string;
}

interface JournalInfo {
  titleKo: string;
  titleEn: string;
  coverImage?: string;
  publisher: string;
  issn: string;
  eIssn: string;
  frequency: string;
  language: string;
  startYear: string;
  country: string;
  subjectArea: string;
}

/* ───────────────────────────────────────────
   Static Data (placeholder)
   ─────────────────────────────────────────── */
const JOURNAL: JournalInfo = {
  titleKo: '한국노년학연구',
  titleEn: 'Korean Journal of Research in Gerontology',
  publisher: '한국노년학연구회',
  issn: '1225-1305',
  eIssn: '2713-7635',
  frequency: '연 3회',
  language: '한국어',
  startYear: '1992',
  country: '대한민국',
  subjectArea: '노년학',
};

const SAMPLE_ARTICLES: ArticleItem[] = [
  {
    id: 1,
    title: '고령자의 디지털 리터러시가 삶의 질에 미치는 영향: 사회적 참여의 매개효과를 중심으로',
    authors: ['김영희', '이철수', '박지연'],
    publishDate: '2025-04-15',
    views: 234,
    doi: '10.25280/kjrg.2025.34.1.001',
  },
  {
    id: 2,
    title: '치매 환자 가족 돌봄자의 부양 부담 경감을 위한 지역사회 기반 프로그램 효과성 분석',
    authors: ['정수민', '한상우'],
    publishDate: '2025-04-15',
    views: 187,
    doi: '10.25280/kjrg.2025.34.1.002',
  },
  {
    id: 3,
    title: '노인 1인 가구의 사회적 고립감과 우울 간의 관계에서 여가활동의 조절효과',
    authors: ['오세진', '류현정', '강민수'],
    publishDate: '2025-04-15',
    views: 156,
    doi: '10.25280/kjrg.2025.34.1.003',
  },
];

const MENU_ITEMS = [
  { label: '홈', hasDropdown: false },
  { label: '논문 검색', hasDropdown: true },
  { label: '투고 안내', hasDropdown: true },
  { label: '편집위원회 소개', hasDropdown: true },
  { label: '이용안내', hasDropdown: false },
];

const TABS = ['최신 논문', '인용 많은 논문', '조회 많은 논문'] as const;
type TabType = (typeof TABS)[number];

const METRICS = [
  { label: '총 논문 수', value: '337' },
  { label: '총 인용 수', value: '1,204' },
  { label: '발행 권수', value: '49' },
  { label: '발행 연수', value: '34' },
];

/* ───────────────────────────────────────────
   Component
   ─────────────────────────────────────────── */
export default function JournalPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('최신 논문');
  const [selectedVolume, setSelectedVolume] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  return (
    <div className="flex flex-col items-center w-full bg-white">
      {/* ── Hero Section ── */}
      <section
        className="w-full flex flex-col items-center"
        style={{ background: '#323856', padding: '32px 0' }}
      >
        <div className="w-full" style={{ maxWidth: 1280, padding: '0 16px' }}>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 mb-4">
            <span className="flex items-center gap-1 px-1 rounded">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.6L2 6.4V14h4.5v-4h3v4H14V6.4L8 1.6z"
                  fill="#F4F5F6"
                />
              </svg>
              <span
                className="underline"
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontSize: 15,
                  lineHeight: '150%',
                  color: '#F4F5F6',
                }}
              >
                홈
              </span>
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#F4F5F6" strokeWidth="1.5" />
            </svg>
            <span
              className="underline px-1"
              style={{
                fontFamily: "'Pretendard GOV', sans-serif",
                fontSize: 15,
                lineHeight: '150%',
                color: '#F4F5F6',
              }}
            >
              저널 메인
            </span>
          </nav>

          {/* Journal Info Row */}
          <div className="flex items-start gap-[60px]">
            {/* Cover */}
            <div
              className="flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center"
              style={{
                width: 160,
                height: 221,
                background: '#F4F5F6',
                borderRadius: 6,
              }}
            >
              {JOURNAL.coverImage ? (
                <img
                  src={JOURNAL.coverImage}
                  alt="Journal Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-3">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    className="mb-2"
                  >
                    <rect
                      x="8"
                      y="4"
                      width="32"
                      height="40"
                      rx="3"
                      stroke="#B1B8BE"
                      strokeWidth="2"
                    />
                    <line
                      x1="14"
                      y1="14"
                      x2="34"
                      y2="14"
                      stroke="#B1B8BE"
                      strokeWidth="2"
                    />
                    <line
                      x1="14"
                      y1="20"
                      x2="30"
                      y2="20"
                      stroke="#B1B8BE"
                      strokeWidth="2"
                    />
                    <line
                      x1="14"
                      y1="26"
                      x2="26"
                      y2="26"
                      stroke="#B1B8BE"
                      strokeWidth="2"
                    />
                  </svg>
                  <span style={{ fontSize: 12, color: '#8A949E' }}>
                    Journal Cover
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-8 flex-1">
              <div>
                <h1
                  style={{
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 700,
                    fontSize: 32,
                    lineHeight: '150%',
                    letterSpacing: '1px',
                    color: '#E6E8EA',
                    margin: 0,
                  }}
                >
                  {JOURNAL.titleKo}
                </h1>
                <p
                  style={{
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 19,
                    lineHeight: '150%',
                    color: '#CDD1D5',
                    margin: 0,
                  }}
                >
                  {JOURNAL.titleEn}
                </p>
              </div>

              {/* Detail Grid */}
              <div
                className="grid gap-y-[2px]"
                style={{
                  gridTemplateColumns: '334px 334px',
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontSize: 15,
                  lineHeight: '150%',
                }}
              >
                {[
                  ['발행기관', JOURNAL.publisher],
                  ['ISSN', JOURNAL.issn],
                  ['발행주기', JOURNAL.frequency],
                  ['eISSN', JOURNAL.eIssn],
                  ['발행시작', JOURNAL.startYear],
                  ['국가/지역', JOURNAL.country],
                  ['주제분야', JOURNAL.subjectArea],
                ].map(([label, value], i) => (
                  <div key={i} className="flex items-start">
                    <span
                      style={{ width: 100, color: '#F4F5F6', fontWeight: 400 }}
                    >
                      {label}
                    </span>
                    <span style={{ color: '#F4F5F6', fontWeight: 600 }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col justify-end gap-[10px] flex-shrink-0"
              style={{ width: 300, alignSelf: 'stretch' }}
            >
              <button
                style={{
                  width: '100%',
                  height: 48,
                  background: '#256EF4',
                  borderRadius: 6,
                  border: 'none',
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: '150%',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                논문 투고하기
              </button>
              <button
                style={{
                  width: '100%',
                  height: 48,
                  background: '#ECF2FE',
                  border: '1px solid #256EF4',
                  borderRadius: 6,
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: '150%',
                  color: '#0B50D0',
                  cursor: 'pointer',
                }}
              >
                저널 홈페이지 방문
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Menu Bar ── */}
      <nav
        className="w-full flex justify-center"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #CDD1D5',
          height: 72,
        }}
      >
        <div
          className="flex items-center gap-4"
          style={{ maxWidth: 1280, width: '100%', padding: '8px 16px' }}
        >
          <div className="flex items-center gap-4">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={i}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
                style={{
                  padding: '0 16px',
                  height: 56,
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 600,
                  fontSize: 19,
                  lineHeight: '150%',
                  color: '#1E2124',
                }}
              >
                {item.label}
                {item.hasDropdown && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="#33363D"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Overview + Metrics Section ── */}
      <section
        className="w-full flex justify-center"
        style={{
          background: '#ECF2FE',
          borderTop: '1px solid #D8E5FD',
          padding: '64px 0',
        }}
      >
        <div
          className="flex gap-20"
          style={{ maxWidth: 1280, width: '100%', padding: '0 16px' }}
        >
          {/* Col 1: Overview + Metrics */}
          <div className="flex flex-col gap-12 flex-1">
            {/* Overview */}
            <div className="flex flex-col gap-5">
              <h2
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 700,
                  fontSize: 19,
                  lineHeight: '150%',
                  color: '#131416',
                  margin: 0,
                }}
              >
                Overview
              </h2>
              <p
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: '150%',
                  color: '#1E2124',
                  margin: 0,
                }}
              >
                한국노년학연구(Kor J Res Geront)는 노화의 다각적 측면(사회,
                문화, 심리, 생물, 의학 등)을 아우르는 오픈 액세스 학술지입니다.
                특히 인류의 웰빙을 위한 노년 공학 관련 이슈도 비중 있게
                다룹니다.
              </p>
              <p
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: '150%',
                  color: '#1E2124',
                  margin: 0,
                }}
              >
                본지는 연 3회 발행되며 노화 관련 주제에 대하여 원저(Original
                research), 리뷰(Review), 논평(Commentary), 단신(Short
                communication), 독자 투고(Letter to editor), 증례 보고(Case
                report), 편집자 주(Editorial) 등 다양한 형식의 원고를 게재하고
                있습니다.
              </p>
              <div
                className="flex items-start"
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontSize: 17,
                  lineHeight: '150%',
                  color: '#1E2124',
                }}
              >
                <span style={{ width: 100, fontWeight: 400 }}>
                  등재정보
                </span>
                <span style={{ fontWeight: 600 }}>
                  KCI등재후보 (2022년 ~ 현재)
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Journal Metrics */}
          <div className="flex flex-col gap-4 flex-shrink-0" style={{ width: 300 }}>
            <h3
              style={{
                fontFamily: "'Pretendard GOV', sans-serif",
                fontWeight: 700,
                fontSize: 19,
                lineHeight: '150%',
                color: '#131416',
                margin: 0,
              }}
            >
              Journal Metrics
            </h3>

            {METRICS.map((m, i) => (
              <div key={i}>
                <div
                  className="flex items-center gap-4 py-1"
                  style={{
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontSize: 15,
                    lineHeight: '150%',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="3"
                      y="2"
                      width="14"
                      height="16"
                      rx="2"
                      stroke="#33363D"
                      strokeWidth="1.4"
                    />
                    <line
                      x1="7"
                      y1="7"
                      x2="13"
                      y2="7"
                      stroke="#33363D"
                      strokeWidth="1.2"
                    />
                    <line
                      x1="7"
                      y1="11"
                      x2="11"
                      y2="11"
                      stroke="#33363D"
                      strokeWidth="1.2"
                    />
                  </svg>
                  <div className="flex items-center gap-4">
                    <span style={{ color: '#1E2124', fontWeight: 400 }}>
                      {m.label}
                    </span>
                    <span style={{ color: '#1E2124', fontWeight: 600 }}>
                      {m.value}
                    </span>
                  </div>
                </div>
                <div style={{ height: 1, background: '#D8E5FD' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Articles + Sidebar Section ── */}
      <section
        className="w-full flex justify-center"
        style={{
          borderTop: '1px solid #D8E5FD',
          padding: '64px 0',
        }}
      >
        <div
          className="flex gap-20"
          style={{ maxWidth: 1280, width: '100%', padding: '0 16px' }}
        >
          {/* Col 1: Articles */}
          <div className="flex flex-col gap-4 flex-1">
            {/* Tab Bar */}
            <div
              className="flex overflow-hidden"
              style={{
                border: '1px solid #B1B8BE',
                borderRadius: 8,
                background: '#FFFFFF',
              }}
            >
              {TABS.map((tab, i) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      minWidth: 80,
                      height: 56,
                      border: 'none',
                      borderRight:
                        i < TABS.length - 1
                          ? '1px solid #B1B8BE'
                          : 'none',
                      background: isActive ? '#063A74' : 'transparent',
                      fontFamily: "'Pretendard GOV', sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      lineHeight: '150%',
                      color: isActive ? '#FFFFFF' : '#464C53',
                      cursor: 'pointer',
                      borderRadius:
                        i === 0
                          ? '8px 0 0 8px'
                          : i === TABS.length - 1
                          ? '0 8px 8px 0'
                          : '0',
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Article List */}
            <div className="flex flex-col">
              {SAMPLE_ARTICLES.map((article, i) => (
                <div
                  key={article.id}
                  className="flex items-start gap-4"
                  style={{
                    padding: '24px 0',
                    borderTop: i > 0 ? '1px solid #CDD1D5' : 'none',
                    background: '#FFFFFF',
                  }}
                >
                  {/* Meta */}
                  <div className="flex flex-col gap-2 flex-1">
                    <h4
                      style={{
                        fontFamily: "'Pretendard GOV', sans-serif",
                        fontWeight: 700,
                        fontSize: 19,
                        lineHeight: '150%',
                        color: '#1E2124',
                        margin: 0,
                        cursor: 'pointer',
                      }}
                    >
                      {article.title}
                    </h4>

                    {/* Authors */}
                    <div className="flex items-center gap-[2px]">
                      {article.authors.map((author, ai) => (
                        <span
                          key={ai}
                          style={{
                            fontFamily: "'Pretendard GOV', sans-serif",
                            fontWeight: 400,
                            fontSize: 15,
                            lineHeight: '150%',
                            color: '#464C53',
                            padding: '0 2px',
                          }}
                        >
                          {author}
                          {ai < article.authors.length - 1 && ','}
                        </span>
                      ))}
                    </div>

                    {/* Publish Info */}
                    <div
                      className="flex items-center gap-[2px]"
                      style={{
                        fontFamily: "'Pretendard GOV', sans-serif",
                        fontWeight: 400,
                        fontSize: 15,
                        lineHeight: '150%',
                        color: '#464C53',
                      }}
                    >
                      <span style={{ padding: '0 2px' }}>
                        {article.publishDate}
                      </span>
                      <span style={{ color: '#8A949E', padding: '0 2px' }}>
                        |
                      </span>
                      <span style={{ padding: '0 2px' }}>
                        조회 {article.views}
                      </span>
                      <span style={{ color: '#8A949E', padding: '0 2px' }}>
                        |
                      </span>
                      <span style={{ padding: '0 2px' }}>{article.doi}</span>
                    </div>
                  </div>

                  {/* Button */}
                  <div
                    className="flex items-center justify-end flex-shrink-0"
                    style={{ width: 96, alignSelf: 'stretch' }}
                  >
                    <button
                      style={{
                        width: 96,
                        height: 40,
                        background: '#256EF4',
                        borderRadius: 6,
                        border: 'none',
                        fontFamily: "'Pretendard GOV', sans-serif",
                        fontWeight: 400,
                        fontSize: 15,
                        lineHeight: '150%',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      원문보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Sidebar */}
          <div
            className="flex flex-col gap-12 flex-shrink-0"
            style={{ width: 300 }}
          >
            {/* Calls for Papers */}
            <div className="flex flex-col" style={{ borderRadius: 8, overflow: 'hidden' }}>
              <div
                className="flex items-center"
                style={{
                  padding: 24,
                  height: 56,
                  background: 'rgba(8, 56, 145, 0.8)',
                  borderRadius: '8px 8px 0 0',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 700,
                    fontSize: 19,
                    lineHeight: '150%',
                    color: '#FFFFFF',
                  }}
                >
                  Calls for Papers
                </span>
              </div>

              <div
                className="flex flex-col gap-4"
                style={{
                  padding: 24,
                  background: '#FFFFFF',
                  border: '1px solid #D8E5FD',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                }}
              >
                <div className="flex flex-col gap-[6px]">
                  <p
                    style={{
                      fontFamily: "'Pretendard GOV', sans-serif",
                      fontWeight: 600,
                      fontSize: 17,
                      lineHeight: '150%',
                      color: '#131416',
                      margin: 0,
                    }}
                  >
                    한국노년학연구 논문 모집 안내
                  </p>
                  <p
                    style={{
                      fontFamily: "'Pretendard GOV', sans-serif",
                      fontWeight: 400,
                      fontSize: 17,
                      lineHeight: '150%',
                      color: '#131416',
                      margin: 0,
                    }}
                  >
                    노화와 노년학, 그리고 생의 후반기를 탐구하는 창의적이고
                    심도 있는 연구 논문을 모집합니다.
                  </p>
                </div>

                <div style={{ height: 1, background: '#D8E5FD' }} />

                <p
                  style={{
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 15,
                    lineHeight: '150%',
                    color: '#131416',
                    margin: 0,
                  }}
                >
                  Open for submissions
                </p>

                <div style={{ height: 1, background: '#D8E5FD' }} />

                <div className="flex flex-col gap-[6px]">
                  <span
                    style={{
                      fontFamily: "'Pretendard GOV', sans-serif",
                      fontWeight: 400,
                      fontSize: 15,
                      lineHeight: '150%',
                      color: '#131416',
                    }}
                  >
                    Submission deadline
                  </span>
                  <span
                    style={{
                      fontFamily: "'Pretendard GOV', sans-serif",
                      fontWeight: 600,
                      fontSize: 17,
                      lineHeight: '150%',
                      color: '#131416',
                    }}
                  >
                    30 June 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
