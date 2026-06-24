import { useState, Suspense, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaperDetail, PaperDetail } from '../api/search';
import { API_BASE_URL, fixImageUrl } from '../api/client';
import { PdfPreviewModal } from '../components/PdfPreviewModal';
import { PdfFullViewerModal } from '../components/PdfFullViewerModal';
import { addToCart, removeFromCartByPublicationId } from '../api/cart';
import { addScrapBatch, deleteScrapBatch, getPublicationsStatus } from '../api/scraps';

type OSPaperDetail = PaperDetail & {
  keywords_en?: string[];
  publisher_name?: string;
  pissn?: string;
  eissn?: string;
  total_pages?: number;
  issue_number?: string;
  source?: string;
  indexing?: { kci?: string; kci_status?: number; index_info?: string };
  venue?: PaperDetail['venue'] & { settings?: { award?: string[]; kci?: boolean } };
  price?: number | null;
  is_free?: boolean;
  is_purchasable?: boolean;
};

const AWARD_BADGE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  thesis: { label: '개인논문', bg: '#F5F3FF', color: '#6D28D9' },
  journal: { label: '정기간행물', bg: '#EFF6FF', color: '#1D4ED8' },
  report: { label: '연구보고서', bg: '#FFF7ED', color: '#C2410C' },
  conference: { label: '학술대회지', bg: '#ECFDF5', color: '#065F46' },
  book: { label: '도서', bg: '#FEF9C3', color: '#92400E' },
  other: { label: '기타', bg: '#F3F4F6', color: '#6B7280' },
};

import { isAuthenticated } from '../lib/auth';
import { addRecentPaper } from './mypage/MyPageRecentPage';


/* 메타 행 컴포넌트 — CSS: info-1 row, label 100px w-[100px], f ont-weight:600, 17px, #1E2124 */
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-start">
      <div className="flex-shrink-0 w-[100px]">
        <span className="papers-meta-label text-[17px] font-semibold leading-[150%] text-[#1E2124]">{label}</span>
      </div>
      <div className="flex items-center flex-wrap">{children}</div>
    </div>
  );
}

/* 브레드크럼 아이템 */
function BreadcrumbItem({ label, to, isLast }: { label: string; to?: string; isLast?: boolean }) {
  return (
    <>
      {to && !isLast ? (
        <Link to={to} className="text-[13px] text-[#8A949E] hover:text-[#464C53] transition-colors">{label}</Link>
      ) : (
        <span className={`text-[13px] ${isLast ? 'text-[#464C53] font-medium' : 'text-[#8A949E]'}`}>{label}</span>
      )}
      {!isLast && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <path d="M5 3.5l3.5 3.5-3.5 3.5" stroke="#C5CAD0" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </>
  );
}

function renderTextWithLinks(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s,，。\]）)]+)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a key={match.index} href={match[1]} target="_blank" rel="noopener noreferrer"
        className="text-[#256EF4] underline break-all hover:opacity-80">
        {match[1]}
      </a>
    );
    last = match.index + match[1].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function PaperDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const abstractRef = useRef<HTMLDivElement>(null);
  const loggedPaperIdRef = useRef<string | null>(null);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showAllRefs, setShowAllRefs] = useState(false);

  const [citeOpen, setCiteOpen] = useState(false);
  const [citeTexts, setCiteTexts] = useState<Record<string, string>>({});
  const [citeLoadings, setCiteLoadings] = useState<Record<string, boolean>>({});
  const [citeCopied, setCiteCopied] = useState<string | null>(null);

  const loggedIn = isAuthenticated();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const { data: paper, isLoading, error: fetchError } = useQuery<OSPaperDetail>({
    queryKey: ['paper', id],
    queryFn: () => getPaperDetail(id!) as Promise<OSPaperDetail>,
    enabled: !!id,
    throwOnError: false,
  });

  const { data: publicationStatus } = useQuery({
    queryKey: ['publications-status', id ? [id] : []],
    queryFn: () => getPublicationsStatus([id!]),
    enabled: loggedIn && !!id,
    staleTime: 1000 * 60 * 5,
  });

  const isScraped = id ? (publicationStatus?.[id]?.scrapped ?? false) : false;
  const isInCart = id ? (publicationStatus?.[id]?.in_cart ?? false) : false;

  const scrapMutation = useMutation({
    mutationFn: () => isScraped ? deleteScrapBatch([id!]) : addScrapBatch([id!]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications-status', id ? [id] : []] });
      queryClient.invalidateQueries({ queryKey: ['scraps'] });
    },
    onError: (err) => alert(err instanceof Error ? err.message : '보관함 처리에 실패했습니다.'),
  });

  const cartMutation = useMutation({
    mutationFn: () =>
      isInCart
        ? removeFromCartByPublicationId(id!)
        : addToCart({ publication_id: id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications-status', id ? [id] : []] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err) => alert(err instanceof Error ? err.message : '장바구니 처리에 실패했습니다.'),
  });

  // 로그인 후 복귀 시 pendingAction 자동 실행
  useEffect(() => {
    if (!loggedIn || !paper) return;
    const raw = sessionStorage.getItem('pendingAction');
    if (!raw) return;
    try {
      const action = JSON.parse(raw) as { type: string; publicationId: string };
      if (action.publicationId !== paper.id) return;
      sessionStorage.removeItem('pendingAction');
      if (action.type === 'addToCart') cartMutation.mutate();
    } catch {
      sessionStorage.removeItem('pendingAction');
    }
    // cartMutation.mutate는 안정적이므로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, paper]);

  const handleShareToggle = () => setShareMenuOpen(prev => !prev);

  const handleShareLink = () => {
    const url = window.location.href;
    const doCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(doCopy).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
        ta.focus(); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); doCopy();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
      ta.focus(); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); doCopy();
    }
    setShareMenuOpen(false);
  };

  const handleShareNotion = () => {
    const url = window.location.href;
    if (navigator.clipboard) { navigator.clipboard.writeText(url).catch(() => { }); }
    window.open('https://www.notion.so', '_blank', 'noopener,noreferrer');
    setShareMenuOpen(false);
  };

  const handleShareEvernote = () => {
    const url = window.location.href;
    const evernoteUrl = `https://www.evernote.com/clip.action?url=${encodeURIComponent(url)}&title=${encodeURIComponent(paper?.title ?? '')}`;
    window.open(evernoteUrl, '_blank', 'noopener,noreferrer');
    setShareMenuOpen(false);
  };

  const handleShareKakao = () => {
    const url = window.location.href;
    const text = `${paper?.title ?? ''}\n${url}`;
    window.location.href = `kakaotalk://send?text=${encodeURIComponent(text)}`;
    if (navigator.clipboard) { navigator.clipboard.writeText(url).catch(() => { }); }
    setShareMenuOpen(false);
  };

  const shareMenuItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '9px 16px', background: 'transparent', border: 'none',
    cursor: 'pointer', fontFamily: "'Pretendard GOV', sans-serif",
    fontSize: 14, color: '#1E2124', textAlign: 'left', whiteSpace: 'nowrap',
  };

  const renderShareMenu = () => (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        onClick={() => setShareMenuOpen(false)}
      />
      <div
        style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 999,
          background: '#FFFFFF', border: '1px solid #CDD1D5', borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '4px 0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleShareLink} style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.5 9.5a3.18 3.18 0 0 0 4.5 0l1.5-1.5a3.18 3.18 0 0 0-4.5-4.5L7 5" stroke="#464C53" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M9.5 6.5a3.18 3.18 0 0 0-4.5 0L3.5 8a3.18 3.18 0 0 0 4.5 4.5L9 11" stroke="#464C53" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          링크 복사
        </button>
        <button onClick={handleShareNotion} style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, background: '#1E2124', borderRadius: 3,
            fontWeight: 700, fontSize: 11, color: '#FFFFFF', fontFamily: 'serif', flexShrink: 0,
          }}>N</span>
          노션
        </button>
        <button onClick={handleShareEvernote} style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#00A82D" />
            <path d="M5.5 11.5V7c0-.83.67-1.5 1.5-1.5h2.5c.55 0 1 .45 1 1V8c0 .55-.45 1-1 1H7v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 9h2" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          에버노트
        </button>
        <button onClick={handleShareKakao} style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <ellipse cx="8" cy="7.2" rx="6.3" ry="5.2" fill="#FEE500" />
            <path d="M5.2 9.6 4.3 12l3-2.1M8 5.4v2.4M6.1 6.3l1.9 1.5 1.9-1.5" stroke="#3A1D1D" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          카카오톡
        </button>
      </div>
    </>
  );

  const handleScrap = () => {
    if (!loggedIn) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    scrapMutation.mutate();
  };

  const handleAddToCart = () => {
    if (!loggedIn) {
      sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'addToCart', publicationId: id }));
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    cartMutation.mutate();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (paper && loggedPaperIdRef.current !== paper.id) {
      loggedPaperIdRef.current = paper.id;
      addRecentPaper({
        id: paper.id,
        title: paper.title,
        authors: Array.isArray(paper.authors) ? paper.authors.map((a) => (typeof a === 'string' ? a : a.name)) : [],
        published_at: paper.published_at ?? undefined,
        venue: typeof paper.venue === 'string' ? paper.venue : paper.venue?.name,
      });
    }
  }, [paper, fetchError]);

  const isPurchased = paper?.price === 0 || (loggedIn && (id ? (publicationStatus?.[id]?.purchased ?? false) : false));

  const handlePurchase = () => {
    if (!loggedIn) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    sessionStorage.setItem('directBuyItem', JSON.stringify({
      publication_id: paper!.id,
      title: paper!.title,
      unit_price: paper?.price ?? 0,
      quantity: 1,
      authors: paper!.authors.map(a => a.name),
      publisher: paper!.publisher_name ?? paper!.provider?.name ?? null,
      journal: paper!.venue?.name ?? null,
    }));
    navigate('/pay?direct=true');
  };

  const error = !id
    ? '논문 ID가 필요합니다.'
    : fetchError instanceof Error
      ? fetchError.message
      : fetchError
        ? '논문 정보를 불러오는데 실패했습니다.'
        : null;

  const handleViewFull = useCallback(() => {
    setPreviewOpen(false);
    setPdfOpen(true);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!paper) return;
    setDownloading(true);
    try {
      const { getPdfFull } = await import('../api/pdf');
      const { url } = await getPdfFull(paper.id);
      const S3_HOST = 'https://newnonmun-archive.s3.ap-northeast-2.amazonaws.com';
      const h = window.location.hostname;
      const useProxy = h === 'localhost' || h === '127.0.0.1'
        || /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
      const fetchUrl = useProxy ? url.replace(S3_HOST, '/s3-proxy') : url;
      const pdfRes = await fetch(fetchUrl);
      if (!pdfRes.ok) throw new Error('PDF 다운로드에 실패했습니다.');
      const blob = await pdfRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${paper.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : '다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [paper]);


  const handleScrollToAbstract = () => {
    abstractRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const CITE_FORMATS = [
    { key: 'apa', label: 'APA(7th ed.)' },
    { key: 'mla', label: 'MLA' },
    { key: 'chicago', label: 'Chicago(17th ed.)' },
  ] as const;

  const fetchCitation = useCallback(async (fmt: string) => {
    if (!paper) return;
    setCiteLoadings(prev => ({ ...prev, [fmt]: true }));
    try {
      const { API_BASE_URL } = await import('../api/client');
      const res = await fetch(`${API_BASE_URL}/api/citations/${paper.id}?format=${fmt}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      const text: string = json.citation ?? json.data?.citation ?? JSON.stringify(json);
      setCiteTexts(prev => ({ ...prev, [fmt]: text }));
    } catch {
      const authors = paper.authors?.map((a) => (typeof a === 'string' ? a : a.name)).join(', ') ?? '';
      const year = paper.published_at ? new Date(paper.published_at).getFullYear() : '';
      const venue = paper.venue?.name ?? '';
      setCiteTexts(prev => ({ ...prev, [fmt]: `${authors} (${year}). ${paper.title}. ${venue}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}` }));
    } finally {
      setCiteLoadings(prev => ({ ...prev, [fmt]: false }));
    }
  }, [paper]);

  const handleOpenCite = useCallback(() => {
    setCiteOpen(true);
    setCiteTexts({});
    CITE_FORMATS.forEach(({ key }) => fetchCitation(key));
  }, [fetchCitation]);

  const handleCiteCopy = useCallback((fmt: string) => {
    const text = citeTexts[fmt];
    if (!text) return;
    const tryClipboard = () => {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(tryClipboard);
    } else {
      tryClipboard();
    }
    setCiteCopied(fmt);
    setTimeout(() => setCiteCopied(null), 2000);
  }, [citeTexts]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* 브레드크럼 항목 빌드 */
  const buildBreadcrumbs = (p: OSPaperDetail) => {
    const items: { label: string; to?: string }[] = [{ label: '홈', to: '/' }];
    if (p.provider?.name) items.push({ label: p.provider.name });
    if (p.venue?.name) items.push({ label: p.venue.name });
    if (p.issue?.label) items.push({ label: p.issue.label });
    return items;
  };

  return (
    /* 논문상세_-pc : bg #FFFFFF */
    <div className="min-h-screen bg-white">

      {/* main : flex col center, padding 48px 0 56px */}
      <main className="papers-main flex flex-col items-center" style={{ padding: '48px 0 56px' }}>
        <style>{`
          @media (max-width: 767px) {
            .papers-main { padding: 24px 0 56px !important; }
            .papers-title-ko { font-size: 22px !important; }
            .papers-title-en { font-size: 15px !important; }
            .papers-section-heading { font-size: 22px !important; }
            .papers-badge { font-size: 15px !important; height: 24px !important; }
            .papers-meta-label { font-size: 15px !important; }
            .meta-value { font-size: 15px !important; }
            .papers-body-text { font-size: 15px !important; }
            .papers-btn-row { flex-direction: column !important; gap: 16px !important; }
            .papers-btn-pay-box { width: 100% !important; justify-content: flex-end !important; }
            .papers-btn-icon-left { width: 100% !important; }
          }
        `}</style>

        {/* wrap */}
        <div className="wrap flex flex-col gap-[48px]">

          {/* breadcrumb : display none on PC per CSS spec */}
          {paper && (
            <nav className="hidden items-center gap-1 flex-wrap">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <path d="M2 8L8 2l6 6v6H10v-4H6v4H2V8z" stroke="#8A949E" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
              </svg>
              {buildBreadcrumbs(paper).map((item, idx, arr) => (
                <BreadcrumbItem
                  key={idx}
                  label={item.label}
                  to={item.to}
                  isLast={idx === arr.length - 1}
                />
              ))}
            </nav>
          )}

          {/* contents-area */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Link to="/search" className="text-blue-600 hover:text-blue-800">검색 페이지로 이동</Link>
            </div>
          ) : paper ? (
            <div className="flex flex-col gap-[48px]">

              {/* ══ article__header : row, gap 60px ══ */}
              <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-[60px]">

                {/* article-cover : w 320px, fill height(min 340), bg #F4F5F6, rounded-xl, padding 32px */}
                <div
                  className="hidden lg:flex flex-shrink-0 flex-col justify-center items-center w-[320px] lg:self-stretch min-h-[340px] rounded-[12px]"
                  style={{ background: '#F4F5F6', padding: '32px' }}
                >
                  {(() => {
                    const rawCover = paper.cover_url ?? paper.venue?.cover_url;
                    const coverSrc = rawCover
                      ? (rawCover.startsWith('http') ? fixImageUrl(rawCover) : `${API_BASE_URL}${rawCover}`)
                      : null;
                    return coverSrc ? (
                      <img
                        src={coverSrc}
                        alt="저널 커버"
                        className="w-[200px] h-[276px] rounded object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-[200px] h-[276px] bg-[#D9DDE1] rounded flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                          <rect x="8" y="4" width="32" height="40" rx="3" stroke="#A0A8B0" strokeWidth="2" fill="none" />
                          <line x1="14" y1="14" x2="34" y2="14" stroke="#A0A8B0" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="14" y1="20" x2="34" y2="20" stroke="#A0A8B0" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="14" y1="26" x2="28" y2="26" stroke="#A0A8B0" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* article-info : flex col, gap 16px, flex-grow */}
                <div className="flex flex-col gap-[16px] flex-1 min-w-0">

                  {/* badge+btn row : space-between */}
                  <div className="flex flex-row justify-between items-center">
                    {/* badge-box : gap 8px — 자료유형(info) + 등재정보(primary) */}
                    <div className="flex flex-row items-center gap-[8px]">
                      {/* 자료유형 배지 */}
                      {(() => {
                        const key = paper.venue?.type?.trim().toLowerCase();
                        const label = (key && AWARD_BADGE_MAP[key]?.label) || '논문';
                        return (
                          <span className="badge badge-large badge-primary">
                            {label}
                          </span>
                        );
                      })()}
                      {/* 등재정보 배지 */}
                      {(() => {
                        const idx = paper.indexing;
                        const indexLabel =
                          idx?.index_info?.trim() ||
                          idx?.kci?.trim() ||
                          (paper.venue?.settings?.kci ? 'KCI등재' : null);
                        if (!indexLabel) return null;
                        return (
                          <span className="badge badge-large badge-color-primary">
                            {indexLabel}
                          </span>
                        );
                      })()}
                    </div>

                    {/* btn-icon-box : share, heart, bag icons (gap 16px) */}
                    <div className="flex flex-row justify-end items-center gap-[8px]">
                      {/* share */}
                      <div className="relative">
                        <button onClick={handleShareLink} title="URL복사" className="btn_icon-box icon-large">
                          {copied ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12l5 5L19 7" stroke="#256EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                          )}
                        </button>
                        {copied && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] text-white bg-[#1E2124] rounded px-2 py-0.5 whitespace-nowrap pointer-events-none">복사됨</span>
                        )}
                        {shareMenuOpen && renderShareMenu()}
                      </div>
                      {/* heart/scrap */}
                      <button
                        onClick={handleScrap}
                        disabled={scrapMutation.isPending}
                        title={isScraped ? '보관함 해제' : '보관함 담기'}
                        className="btn_icon-box icon-large"
                      >
                        {isScraped ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d63d4a" className="size-6">
                            <path fill-rule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clip-rule="evenodd" />
                          </svg>

                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                          </svg>
                        )}
                      </button>

                      {/* bag/cart */}
                      <button onClick={handleAddToCart} disabled={cartMutation.isPending} title="장바구니 담기" className="btn_icon-box icon-large">
                        <svg xmlns="http://www.w3.org/2000/svg" fill={isInCart ? '#256EF4' : 'none'} viewBox="0 0 24 24" stroke-width="1.5" stroke={isInCart ? '#256EF4' : 'currentColor'} className="size-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* title : gap 4px */}
                  <div className="flex flex-col gap-[4px]">
                    {/* 제목 : 32px, bold, letter-spacing 1px, #131416 */}
                    <h1
                      className="papers-title-ko text-[24px] lg:text-[32px] font-bold leading-[150%] text-[#131416]"
                      style={{ letterSpacing: '1px' }}
                    >
                      {paper.title}
                    </h1>
                    {/* 영문 제목 : 17px, #464C53 */}
                    {paper.title_en && (
                      <p className="papers-title-en text-[15px] lg:text-[17px] font-normal leading-[150%] text-[#464C53]">
                        {paper.title_en}
                      </p>
                    )}
                  </div>

                  {/* detail (메타정보) : padding 16px 0, gap 8px */}
                  <div className="flex flex-col gap-[8px] py-[16px]">

                    {/* 저자정보 */}
                    {paper.authors && paper.authors.length > 0 && (
                      <MetaRow label="저자정보">
                        <div className='meta-article'>
                          {paper.authors.map((a, i) => {
                            const name = typeof a === 'string' ? a : a.name;
                            return (
                              <span key={i} className='meta-value info-divider'>{name}</span>
                            );
                          })}
                        </div>
                      </MetaRow>
                    )}

                    {/* 발행정보 : 발행기관 > 저널 > 권호 > 페이지 with arrow icons */}
                    {(paper.venue || paper.published_at || (paper as any).year) && (
                      <MetaRow label="발행정보">
                        <div className='meta-article'>
                          {paper.provider && (
                            <>
                              {paper.provider.website_url ? (
                                <a href={/^https?:\/\//i.test(paper.provider.website_url) ? paper.provider.website_url : `https://${paper.provider.website_url}`} target="_blank" rel="noopener noreferrer"
                                  className='meta-value info-chevron'>
                                  {paper.provider.name}
                                </a>
                              ) : (
                                <span className='meta-value info-chevron'>{paper.provider.name}</span>
                              )}
                            </>
                          )}
                          {paper.venue && (
                            <>
                              {(() => {
                                const venueId = paper.venue?.id;
                                const isValidId = venueId && venueId !== '0' && venueId !== 'undefined' && venueId !== 'null';
                                const encodedName = paper.venue?.name ? encodeURIComponent(paper.venue.name) : null;
                                const journalTo = isValidId
                                  ? `/journal/${venueId}${encodedName ? `?name=${encodedName}` : ''}`
                                  : encodedName
                                    ? `/journal?name=${encodedName}`
                                    : null;
                                return journalTo ? (
                                  <Link
                                    to={journalTo}
                                    className='meta-value info-chevron'
                                  >
                                    {paper.venue.name}
                                  </Link>
                                ) : (
                                  <span className='meta-value info-chevron'>
                                    {paper.venue.name}
                                  </span>
                                );
                              })()}
                              {(() => {
                                const issue = paper.issue as any;
                                if (!issue) return null;
                                const vol = Number(issue.volume) || 0;
                                const num = Number(issue.number) || 0;
                                if (!vol && !num) return null;
                                const issueLabel = [
                                  vol ? `제${vol}권` : '',
                                  num ? `제${num}호` : '',
                                ].filter(Boolean).join(' ');
                                return (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#8A949E" className="size-4 mx-[2px]">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                    <span className='meta-value info-chevron'>{issueLabel}</span>
                                  </>
                                );
                              })()}
                              {(paper.page_start || paper.page_end) && (
                                <>
                                  <span className='meta-value info-chevron'>
                                    {paper.page_start && paper.page_end
                                      ? `pp.${paper.page_start}-${paper.page_end}`
                                      : paper.page_start ? `p.${paper.page_start}` : ''}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </MetaRow>
                    )}

                    {/* 발행년월 : YYYY.MM */}
                    {paper.published_at && (
                      <MetaRow label="발행년월">
                        <div className='meta-article'>
                          <span className="meta-value">
                            {(() => {
                              const d = new Date(paper.published_at);
                              return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
                            })()}
                          </span>
                        </div>
                      </MetaRow>
                    )}

                    {/* DOI */}
                    {paper.doi && (
                      <MetaRow label="DOI">
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="meta-value text-[17px] leading-[150%] text-[#464C53] hover:underline break-all"
                        >
                          {paper.doi}
                        </a>
                      </MetaRow>
                    )}
                  </div>

                  {/* button row : space-between, h-48px */}
                  <div className="papers-btn-row flex flex-row justify-between items-center">
                    {/* btn-icon-box left : 미리보기 / 인용하기 (gap 16px) */}
                    <div className="papers-btn-icon-left flex flex-row items-center gap-[16px]">
                      {/* 미리보기 button : h-32px, rounded-[4px], gap 4px, font 17px */}
                      <button
                        onClick={() => setPreviewOpen(true)}
                        className="btn_text btn_text-medium icon_document-search"
                      >
                        미리보기
                      </button>
                      {/* 인용하기 button */}
                      <button
                        onClick={handleOpenCite}
                        className="btn_text btn_text-medium icon_double-quotes-fill-L"
                      >
                        인용하기
                      </button>
                    </div>

                    {/* button-pay-box right : gap 16px */}
                    <div className="papers-btn-pay-box flex flex-row justify-end items-center gap-[16px]">
                      {/* btn-pay : 가격(ghost) + 구매하기(primary), gap 8px */}
                      <div className="flex flex-row items-center gap-[8px]">
                        {/* 가격 버튼 : transparent bg, #131416, h-48px, px-24 */}
                        {!isPurchased && paper.price != null && (
                          <span className="inline-flex items-center justify-center px-[24px] h-[48px] rounded-[6px] text-[17px] leading-[150%] text-[#131416] whitespace-nowrap">
                            ₩ {paper.price.toLocaleString()}
                          </span>
                        )}
                        {/* 구매하기 / 원문보기 : h-48px, bg #256EF4, rounded-[6px], px-24, white */}
                        <button
                          onClick={isPurchased ? handleViewFull : handlePurchase}
                          className="inline-flex items-center justify-center px-[24px] h-[48px] rounded-[6px] text-[17px] leading-[150%] text-white whitespace-nowrap transition-colors hover:opacity-90"
                          style={{ background: '#256EF4' }}
                        >
                          {isPurchased
                            ? '원문보기'
                            : '구매하기'}
                        </button>
                      </div>
                      {isPurchased && (
                        <button
                          onClick={handleDownload}
                          disabled={downloading}
                          title="PDF 다운로드"
                          className="inline-flex items-center justify-center w-[48px] h-[48px] rounded-[6px] border border-[#CDD1D5] hover:bg-[#F0F2F5] transition-colors disabled:opacity-50"
                        >
                          {downloading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E2124]" />
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 3v10M6 9l4 4 4-4" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M4 15h12" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* divider : h-1px, bg #CDD1D5 */}
              <div className="w-full h-px" style={{ background: '#CDD1D5' }} />

              {/* ══ article__detail : flex col, gap 64px ══ */}
              <div className="flex flex-col gap-[64px] w-full">

                {/* con-abstract : 초록 (국문 + 영문), gap 20px */}
                {(paper.abstract || paper.abstract_en) && (
                  <div ref={abstractRef} className="flex flex-col gap-[20px] w-full">
                    <h2 className="papers-section-heading text-[24px] font-bold leading-[150%] text-[#131416]">초록</h2>
                    {paper.abstract && (
                      <p className="papers-body-text text-[17px] font-normal leading-[150%] text-[#464C53] w-full break-words">{paper.abstract}</p>
                    )}
                    {paper.abstract_en && (
                      <p className="papers-body-text text-[17px] font-normal leading-[150%] text-[#464C53] w-full break-words">{paper.abstract_en}</p>
                    )}
                  </div>
                )}

                {/* con-keyword : 키워드, gap 20px */}
                {paper.keywords && paper.keywords.length > 0 && (
                  <div className="flex flex-col gap-[20px]">
                    <h2 className="papers-section-heading text-[24px] font-bold leading-[150%] text-[#131416]">키워드</h2>
                    {/* keyword__list : gap 10px */}
                    <div className="flex flex-wrap gap-[10px]">
                      {paper.keywords.map((kw, idx) => (
                        <button
                          key={idx}
                          onClick={() => navigate(`/search?q=${encodeURIComponent(kw)}`)}
                          className="inline-flex items-center justify-center h-[39px] rounded-[1000px] text-[15px] leading-[150%] font-normal hover:opacity-80 transition-opacity cursor-pointer"
                          style={{ background: '#EFF2F5', color: '#052B57', padding: '8px 20px' }}
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 영문 키워드 */}
                {paper.keywords_en && paper.keywords_en.length > 0 && (
                  <div className="flex flex-col gap-[20px]">
                    <h2 className="papers-section-heading text-[24px] font-bold leading-[150%] text-[#131416]">영문 키워드</h2>
                    <div className="flex flex-wrap gap-[10px]">
                      {paper.keywords_en.map((kw, idx) => (
                        <button
                          key={idx}
                          onClick={() => navigate(`/search?q=${encodeURIComponent(kw)}`)}
                          className="inline-flex items-center justify-center h-[39px] rounded-[1000px] text-[15px] leading-[150%] font-normal hover:opacity-80 transition-opacity cursor-pointer"
                          style={{ background: '#EFF2F5', color: '#052B57', padding: '8px 20px' }}
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* con-table : 목차, gap 20px */}
                <div className="flex flex-col gap-[20px]">
                  <h2 className="papers-section-heading text-[24px] font-bold leading-[150%] text-[#131416]">목차</h2>
                  <div className="papers-body-text text-[17px] font-normal leading-[150%] text-[#464C53] whitespace-pre-line">
                    {paper.body_content || '등록된 목차 정보가 없습니다.'}
                  </div>
                </div>

                {/* con-references : 참고문헌, gap 20px */}
                <div className="flex flex-col gap-[20px]">
                  <h2 className="papers-section-heading text-[24px] font-bold leading-[150%] text-[#131416]">참고문헌</h2>
                  {paper.references && paper.references.length > 0 ? (
                    <div className="flex flex-col">
                      {(showAllRefs ? paper.references : paper.references.slice(0, 8)).map((ref, idx) => {
                        const text = typeof ref === 'string' ? ref : (ref as { raw_text?: string }).raw_text ?? '';
                        return (
                          <ol key={idx}>
                            <li className="papers-body-text text-[13px] font-normal leading-[150%] text-[#464C53] py-[8px]">
                              {renderTextWithLinks(text)}
                            </li>
                            <div className="w-full h-px border-t-1 border-dashed bg-[#CDD1D5]" />
                          </ol>
                        );
                      })}
                      {paper.references.length > 8 && (
                        <button
                          onClick={() => setShowAllRefs(prev => !prev)}
                          className="flex items-center justify-center gap-[6px] mt-[12px] mx-auto text-[14px] font-medium text-[#464C53] hover:text-[#131416] transition-colors"
                        >
                          {showAllRefs ? '접기' : '펼치기'}
                          <svg
                            width="18" height="18" viewBox="0 0 18 18" fill="none"
                            style={{ transition: 'transform 0.2s', transform: showAllRefs ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          >
                            <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#464C53" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[17px] font-normal leading-[150%] text-[#131416]">등록된 참고문헌 정보가 없습니다.</p>
                  )}
                </div>

                {/* con-include : 해당 권호 수록 논문 — display: none per CSS spec */}
                {/* CSS spec에서 display:none이므로 숨김 처리 */}

                {/* con-include : 추천 논문 — display: none per CSS spec */}
                {/* CSS spec에서 display:none이므로 숨김 처리 */}

              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-500">논문 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </main>

      {/* 미리보기 모달 */}
      {previewOpen && paper && (
        <PdfPreviewModal
          paperId={paper.id}
          isPurchased={isPurchased}
          price={paper.price}
          onClose={() => setPreviewOpen(false)}
          onPurchase={() => { setPreviewOpen(false); handlePurchase(); }}
          onViewFull={() => { setPreviewOpen(false); handleViewFull(); }}
        />
      )}

      {pdfOpen && paper && (
        <PdfFullViewerModal paperId={paper.id} onClose={() => setPdfOpen(false)} />
      )}

      {/* 인용하기 모달 */}
      {citeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setCiteOpen(false); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#CDD1D5]">
              <span className="text-[17px] font-bold text-[#131416]">인용하기</span>
              <button
                onClick={() => setCiteOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="#1E2124" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-0 pb-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-y border-[#CDD1D5]">
                    <th className="py-2.5 px-4 w-[140px] text-[13px] font-medium text-[#8A949E] text-left">양식이름</th>
                    <th className="py-2.5 px-3 text-[13px] font-medium text-[#8A949E] text-left">인용양식</th>
                    <th className="py-2.5 px-4 w-[72px] text-[13px] font-medium text-[#8A949E] text-center">복사</th>
                  </tr>
                </thead>
                <tbody>
                  {CITE_FORMATS.map(({ key, label }) => (
                    <tr key={key} className="border-b border-[#CDD1D5] last:border-b-0">
                      <td className="py-4 px-4 w-[140px] align-top">
                        <span className="text-[13px] font-medium text-[#131416]">{label}</span>
                      </td>
                      <td className="py-4 px-3 align-top">
                        {citeLoadings[key] ? (
                          <span className="text-[13px] text-[#8A949E]">불러오는 중...</span>
                        ) : citeTexts[key] ? (
                          <span className="text-[13px] leading-[1.7em] text-[#131416] select-all">{citeTexts[key]}</span>
                        ) : (
                          <span className="text-[13px] text-[#8A949E]">인용 정보를 불러오지 못했습니다.</span>
                        )}
                      </td>
                      <td className="py-4 px-4 w-[72px] align-middle text-center">
                        <button
                          onClick={() => handleCiteCopy(key)}
                          disabled={!citeTexts[key] || citeLoadings[key]}
                          className="w-8 h-8 inline-flex items-center justify-center rounded hover:bg-[#F0F2F5] transition-colors disabled:opacity-40"
                          title="복사"
                        >
                          {citeCopied === key ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8l4 4 6-7" stroke="#256EF4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="5.5" y="1.5" width="9" height="11" rx="1.2" stroke="#8A949E" strokeWidth="1.2" />
                              <rect x="1.5" y="4.5" width="9" height="11" rx="1.2" stroke="#8A949E" strokeWidth="1.2" fill="white" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 맨 위로 */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-11 h-11 sm:w-[52px] sm:h-[52px] bg-white border border-[#CDD1D5] rounded-full shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08),0px_0px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-lg flex items-center justify-center transition-shadow"
        aria-label="맨 위로"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 19V5M5 12l7-7 7 7" stroke="#33363D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default function PaperDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      }
    >
      <PaperDetailContent />
    </Suspense>
  );
}
