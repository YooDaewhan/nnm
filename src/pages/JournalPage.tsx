import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';

/* ───────────────────────────────────────────
   Types
   ─────────────────────────────────────────── */
interface Author {
  id: string | number;
  name: string;
}

interface FeaturedPaper {
  id: string | number;
  title: string;
  authors: (string | Author)[];
  published_at?: string;
  view_count?: number;
  citation_count?: number;
  doi?: string;
}

interface VenueSettings {
  pissn?: string;
  eissn?: string;
  kci?: boolean;
  lang?: string;
  award?: string[];
  status?: string;
  frequency?: number;
  published_since_year?: number;
  [key: string]: unknown;
}

interface VenueDetail {
  id: string;
  name: string;
  abbr?: string;
  type: string;
  description?: string;
  submission_url?: string;
  frequency_label?: string;
  pissn?: string;
  eissn?: string;
  cover_url?: string | null;
  settings?: VenueSettings;
  provider?: {
    name?: string;
    website_url?: string;
  };
  metrics?: {
    papers_count?: number;
    volumes_count?: number;
    active_years?: number;
  };
  kci?: {
    impact_factor?: number;
    paper_count?: number;
    citation_count?: number;
    synced_at?: string;
  };
  featured_papers?: {
    recent?: FeaturedPaper[];
    most_cited?: FeaturedPaper[];
    most_viewed?: FeaturedPaper[];
  };
}

const MENU_ITEMS = [
  { label: '홈', hasDropdown: false },
  { label: '논문 검색', hasDropdown: true },
  { label: '투고 안내', hasDropdown: true },
  { label: '편집위원회 소개', hasDropdown: true },
  { label: '이용안내', hasDropdown: false },
];

const TABS = ['최신 논문', '인용 많은 논문', '조회 많은 논문'] as const;
type TabType = (typeof TABS)[number];

/* ───────────────────────────────────────────
   Component
   ─────────────────────────────────────────── */
export default function JournalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('최신 논문');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE_URL}/api/venues/${id}`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('[JournalPage] full response:', JSON.stringify(data, null, 2));
        setVenue(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full" style={{ minHeight: 400 }}>
        <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontSize: 17, color: '#464C53' }}>
          불러오는 중...
        </span>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="flex items-center justify-center w-full" style={{ minHeight: 400 }}>
        <span style={{ fontFamily: "'Pretendard GOV', sans-serif", fontSize: 17, color: '#E02020' }}>
          {error ? `데이터를 불러올 수 없습니다. (${error})` : '저널 정보를 찾을 수 없습니다.'}
        </span>
      </div>
    );
  }

  const metrics = [
    { label: '총 논문 수', value: venue.metrics?.papers_count?.toLocaleString() ?? '-' },
    { label: '발행 권수', value: venue.metrics?.volumes_count?.toLocaleString() ?? '-' },
    { label: '발행 연수', value: venue.metrics?.active_years?.toLocaleString() ?? '-' },
  ];

  const fp = venue.featured_papers ?? {};
  const tabMap: Record<TabType, FeaturedPaper[]> = {
    '최신 논문': (fp as any).recent ?? [],
    '인용 많은 논문': (fp as any).most_cited ?? [],
    '조회 많은 논문': (fp as any).most_viewed ?? [],
  };
  const tabPapers = tabMap[activeTab];

  const pissn = venue.pissn ?? venue.settings?.pissn;
  const eissn = venue.eissn ?? venue.settings?.eissn;

  const infoRows: [string, string | undefined][] = [
    ['발행기관', venue.provider?.name],
    ['ISSN', pissn],
    ['발행주기', venue.frequency_label],
    ['eISSN', eissn],
    ['KCI 영향력지수', venue.kci?.impact_factor?.toLocaleString()],
    ['KCI 논문수', venue.kci?.paper_count?.toLocaleString()],
    ['KCI 피인용횟수', venue.kci?.citation_count?.toLocaleString()],
  ];

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
                <path d="M8 1.6L2 6.4V14h4.5v-4h3v4H14V6.4L8 1.6z" fill="#F4F5F6" />
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
            {/* Cover placeholder */}
            <div
              className="flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center"
              style={{ width: 160, height: 221, background: '#F4F5F6', borderRadius: 6 }}
            >
              {venue?.cover_url ? (
                <img
                  src={venue.cover_url}
                  alt="저널 커버"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-3">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-2">
                    <rect x="8" y="4" width="32" height="40" rx="3" stroke="#B1B8BE" strokeWidth="2" />
                    <line x1="14" y1="14" x2="34" y2="14" stroke="#B1B8BE" strokeWidth="2" />
                    <line x1="14" y1="20" x2="30" y2="20" stroke="#B1B8BE" strokeWidth="2" />
                    <line x1="14" y1="26" x2="26" y2="26" stroke="#B1B8BE" strokeWidth="2" />
                  </svg>
                  <span style={{ fontSize: 12, color: '#8A949E' }}>Journal Cover</span>
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
                  {venue.name}
                </h1>
                {venue.abbr && (
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
                    {venue.abbr}
                  </p>
                )}
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
                {infoRows.map(([label, value], i) => (
                  <div key={i} className="flex items-start">
                    <span style={{ minWidth: 140, color: '#F4F5F6', fontWeight: 400 }}>{label}</span>
                    <span style={{ color: '#F4F5F6', fontWeight: 600 }}>{value ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col justify-end gap-[10px] flex-shrink-0"
              style={{ width: 300, alignSelf: 'stretch' }}
            >
              {venue.submission_url && (
                <a
                  href={/^https?:\/\//i.test(venue.submission_url) ? venue.submission_url : `https://${venue.submission_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: 48,
                    background: '#256EF4',
                    borderRadius: 6,
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 17,
                    lineHeight: '150%',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  논문 투고하기
                </a>
              )}
              {venue.provider?.website_url && (
                <a
                  href={/^https?:\/\//i.test(venue.provider.website_url) ? venue.provider.website_url : `https://${venue.provider.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    textDecoration: 'none',
                  }}
                >
                  저널 홈페이지 방문
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Menu Bar ── */}
      <nav
        className="w-full flex justify-center"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #CDD1D5', height: 72 }}
      >
        <div
          className="flex items-center gap-4"
          style={{ maxWidth: 1280, width: '100%', padding: '8px 16px' }}
        >
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
                  <path d="M4 6l4 4 4-4" stroke="#33363D" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Overview + Metrics Section ── */}
      <section
        className="w-full flex justify-center"
        style={{ background: '#ECF2FE', borderTop: '1px solid #D8E5FD', padding: '64px 0' }}
      >
        <div
          className="flex gap-20"
          style={{ maxWidth: 1280, width: '100%', padding: '0 16px' }}
        >
          {/* Col 1: Overview */}
          <div className="flex flex-col gap-5 flex-1">
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
                color: venue.description ? '#1E2124' : '#8A949E',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {venue.description || '준비중입니다.'}
            </p>
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

            {metrics.map((m, i) => (
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
                    <rect x="3" y="2" width="14" height="16" rx="2" stroke="#33363D" strokeWidth="1.4" />
                    <line x1="7" y1="7" x2="13" y2="7" stroke="#33363D" strokeWidth="1.2" />
                    <line x1="7" y1="11" x2="11" y2="11" stroke="#33363D" strokeWidth="1.2" />
                  </svg>
                  <div className="flex items-center gap-4">
                    <span style={{ color: '#1E2124', fontWeight: 400 }}>{m.label}</span>
                    <span style={{ color: '#1E2124', fontWeight: 600 }}>{m.value}</span>
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
        style={{ borderTop: '1px solid #D8E5FD', padding: '64px 0' }}
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
              style={{ border: '1px solid #B1B8BE', borderRadius: 8, background: '#FFFFFF' }}
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
                      borderRight: i < TABS.length - 1 ? '1px solid #B1B8BE' : 'none',
                      background: isActive ? '#063A74' : 'transparent',
                      fontFamily: "'Pretendard GOV', sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      lineHeight: '150%',
                      color: isActive ? '#FFFFFF' : '#464C53',
                      cursor: 'pointer',
                      borderRadius:
                        i === 0 ? '8px 0 0 8px' : i === TABS.length - 1 ? '0 8px 8px 0' : '0',
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Article List */}
            <div key={activeTab} className="flex flex-col">
              {tabPapers.length === 0 ? (
                <div
                  style={{
                    padding: '40px 0',
                    textAlign: 'center',
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontSize: 15,
                    color: '#8A949E',
                  }}
                >
                  논문이 없습니다.
                </div>
              ) : (
                tabPapers.map((paper, i) => (
                  <div
                    key={paper.id}
                    className="flex items-start gap-4"
                    style={{
                      padding: '24px 0',
                      borderTop: i > 0 ? '1px solid #CDD1D5' : 'none',
                      background: '#FFFFFF',
                    }}
                  >
                    <div className="flex flex-col gap-2 flex-1">
                      <h4
                        onClick={() => navigate(`/papers/${paper.id}`)}
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
                        {paper.title}
                      </h4>

                      {paper.authors && paper.authors.length > 0 && (
                        <div className="flex items-center gap-[2px]">
                          {paper.authors.map((author, ai) => (
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
                              {typeof author === 'string' ? author : author.name}
                              {ai < paper.authors.length - 1 && ','}
                            </span>
                          ))}
                        </div>
                      )}

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
                        {paper.published_at && (
                          <span style={{ padding: '0 2px' }}>{paper.published_at}</span>
                        )}
                        {paper.view_count != null && (
                          <>
                            <span style={{ color: '#8A949E', padding: '0 2px' }}>|</span>
                            <span style={{ padding: '0 2px' }}>조회 {paper.view_count}</span>
                          </>
                        )}
                        {paper.citation_count != null && (
                          <>
                            <span style={{ color: '#8A949E', padding: '0 2px' }}>|</span>
                            <span style={{ padding: '0 2px' }}>인용 {paper.citation_count}</span>
                          </>
                        )}
                        {paper.doi && (
                          <>
                            <span style={{ color: '#8A949E', padding: '0 2px' }}>|</span>
                            <span style={{ padding: '0 2px' }}>{paper.doi}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-end flex-shrink-0"
                      style={{ width: 96, alignSelf: 'stretch' }}
                    >
                      <button
                        onClick={() => navigate(`/papers/${paper.id}`)}
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
                ))
              )}
            </div>
          </div>

          {/* Col 2: Sidebar */}
          <div className="flex flex-col gap-12 flex-shrink-0" style={{ width: 300 }}>
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
                    {venue.name} 논문 모집 안내
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

                {venue.submission_url && (
                  <>
                    <div style={{ height: 1, background: '#D8E5FD' }} />
                    <a
                      href={/^https?:\/\//i.test(venue.submission_url!) ? venue.submission_url! : `https://${venue.submission_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'Pretendard GOV', sans-serif",
                        fontWeight: 600,
                        fontSize: 15,
                        lineHeight: '150%',
                        color: '#256EF4',
                        textDecoration: 'none',
                      }}
                    >
                      투고 바로가기 →
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
