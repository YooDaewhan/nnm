import { useState, Suspense, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaperDetail, PaperDetail } from '../api/search';
import { API_BASE_URL } from '../api/client';
import { PdfPreviewModal } from '../components/PdfPreviewModal';
import { PdfFullViewerModal } from '../components/PdfFullViewerModal';
import { addToCart } from '../api/cart';
import { addScrapBatch, deleteScrapBatch, checkScrapBatch } from '../api/scraps';

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
  thesis:        { label: '개인논문',    bg: '#F5F3FF', color: '#6D28D9' },
  journal:       { label: '정기간행물',  bg: '#EFF6FF', color: '#1D4ED8' },
  report:        { label: '연구보고서',  bg: '#FFF7ED', color: '#C2410C' },
  conference:    { label: '학술대회지',  bg: '#ECFDF5', color: '#065F46' },
  book:          { label: '도서',        bg: '#FEF9C3', color: '#92400E' },
  other:         { label: '기타',        bg: '#F3F4F6', color: '#6B7280' },
};
import { getPayments } from '../api/payment';
import { isAuthenticated } from '../lib/auth';
import { addRecentPaper } from './mypage/MyPageRecentPage';


/* 메타 행 컴포넌트 — CSS: info-1 row, label 100px w-[100px], f ont-weight:600, 17px, #1E2124 */
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-start">
      <div className="flex-shrink-0 w-[100px]">
        <span className="papers-meta-label text-[17px] font-semibold leading-[150%] text-[#1E2124]">{label}</span>
      </div>
      <div className="flex items-center flex-wrap gap-x-[6px]">{children}</div>
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
  const abstractRef = useRef<HTMLDivElement>(null);
  const loggedPaperIdRef = useRef<string | null>(null);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [buyBtnHovered, setBuyBtnHovered] = useState(false);

  const [citeOpen, setCiteOpen] = useState(false);
  const [citeTexts, setCiteTexts] = useState<Record<string, string>>({});
  const [citeLoadings, setCiteLoadings] = useState<Record<string, boolean>>({});
  const [citeCopied, setCiteCopied] = useState<string | null>(null);

  const loggedIn = isAuthenticated();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: paper, isLoading, error: fetchError } = useQuery<OSPaperDetail>({
    queryKey: ['paper', id],
    queryFn: () => getPaperDetail(id!) as Promise<OSPaperDetail>,
    enabled: !!id,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders-paid'],
    queryFn: () => getPayments({ status: 'paid', per_page: 100 }),
    enabled: loggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const { data: scrappedIds = new Set<string>() } = useQuery({
    queryKey: ['scrap-batch', id ? [id] : []],
    queryFn: () => checkScrapBatch([id!]),
    select: (data) => new Set(data),
    enabled: loggedIn && !!id,
    staleTime: 1000 * 60 * 5,
  });

  const isScraped = id ? scrappedIds.has(id) : false;

  const scrapMutation = useMutation({
    mutationFn: () => isScraped ? deleteScrapBatch([id!]) : addScrapBatch([id!]),
    onSuccess: () => {
      queryClient.setQueryData<Set<string>>(['scrap-batch', id ? [id] : []], (old = new Set()) => {
        const next = new Set(old);
        if (isScraped) next.delete(id!);
        else next.add(id!);
        return next;
      });
    },
    onError: (err) => alert(err instanceof Error ? err.message : '스크랩 처리에 실패했습니다.'),
  });

  const cartMutation = useMutation({
    mutationFn: () => addToCart({ publication_id: id! }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cart'] }); alert('장바구니에 추가되었습니다.'); },
    onError: (err) => alert(err instanceof Error ? err.message : '장바구니 추가에 실패했습니다.'),
  });

  const handleShare = () => {
    const url = window.location.href;
    const doCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
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
  };

  const handleScrap = () => {
    if (!loggedIn) { navigate('/login'); return; }
    scrapMutation.mutate();
  };

  const handleAddToCart = () => {
    if (!loggedIn) { navigate('/login'); return; }
    cartMutation.mutate();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (paper && loggedPaperIdRef.current !== paper.id) {
      loggedPaperIdRef.current = paper.id;
      console.log('[PaperDetail] 전체 응답:', paper);
      console.log('[PaperDetail] table_of_contents:', paper.table_of_contents);
      console.log('[PaperDetail] abstract:', paper.abstract);
      console.log('[PaperDetail] abstract_en:', paper.abstract_en);
      console.log('[PaperDetail] keywords:', paper.keywords);
      console.log('[PaperDetail] keywords_en:', (paper as OSPaperDetail).keywords_en);
      console.log('[PaperDetail] references:', paper.references);
      console.log('[PaperDetail] body_content:', paper.body_content);
      console.log('[PaperDetail] venue (전체):', JSON.stringify(paper.venue));
      console.log('[PaperDetail] venue.type:', paper.venue?.type);
      console.log('[PaperDetail] venue.settings.award:', paper.venue?.settings?.award);
      console.log('[PaperDetail] cover_url (paper):', paper.cover_url);
      console.log('[PaperDetail] cover_url (venue):', paper.venue?.cover_url);
      console.log('[PaperDetail] JSON:', JSON.stringify(paper));
      addRecentPaper({
        id: paper.id,
        title: paper.title,
        authors: Array.isArray(paper.authors) ? paper.authors.map((a) => (typeof a === 'string' ? a : a.name)) : [],
        published_at: paper.published_at ?? undefined,
        venue: typeof paper.venue === 'string' ? paper.venue : paper.venue?.name,
      });
    }
    if (fetchError) console.error('[PapersPage] error:', fetchError);
  }, [paper, fetchError]);

  const paidOrders = ordersData?.success ? ordersData.orders.data : [];

  const isPurchased = loggedIn && paidOrders.some(
    (order) => ((order as any).metadata?.items as { publication_id?: string }[] ?? []).some(
      (item) => item.publication_id === paper?.id
    )
  );

  const handlePurchase = () => {
    if (!loggedIn) {
      navigate('/login');
      return;
    }
    sessionStorage.setItem('directBuyItem', JSON.stringify({
      publication_id: paper!.id,
      title: paper!.title,
      unit_price: 7000,
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
            .papers-meta-value { font-size: 15px !important; }
            .papers-body-text { font-size: 15px !important; }
            .papers-btn-row { flex-direction: column !important; gap: 16px !important; }
            .papers-btn-pay-box { width: 100% !important; justify-content: flex-end !important; }
            .papers-btn-icon-left { width: 100% !important; }
          }
        `}</style>

        {/* wrap : max-w 1280px, padding 0 16px, gap 48px */}
        <div className="w-full max-w-[1280px] px-4 flex flex-col gap-[48px]">

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
              <div className="flex flex-col lg:flex-row items-start gap-[60px]">

                {/* article-cover : 320px × 340px, bg #F4F5F6, rounded-xl */}
                <div
                  className="hidden lg:flex flex-shrink-0 flex-col justify-center items-center w-[320px] h-[340px] rounded-[12px]"
                  style={{ background: '#F4F5F6', padding: '16px' }}
                >
                  {(() => {
                    const rawCover = paper.cover_url ?? paper.venue?.cover_url;
                    const coverSrc = rawCover
                      ? (rawCover.startsWith('http') ? rawCover : `${API_BASE_URL}${rawCover}`)
                      : null;
                    return coverSrc ? (
                      <img
                        src={coverSrc}
                        alt="저널 커버"
                        className="w-[200px] h-[300px] rounded object-cover"
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
                    {/* badge-box : gap 8px */}
                    <div className="flex flex-row items-start gap-[8px]">
                      {/* venue.type 기반 동적 배지 */}
                      {(() => {
                        const key = paper.venue?.type?.trim().toLowerCase();
                        const badge = key ? AWARD_BADGE_MAP[key] : null;
                        if (!badge) return null;
                        return (
                          <span
                            key={key}
                            className="papers-badge inline-flex items-center justify-center px-[8px] h-[32px] rounded text-[17px] leading-[150%] font-normal"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* btn-icon-box : share, heart, bag icons (gap 16px) */}
                    <div className="flex flex-row justify-end items-center gap-[16px]">
                      {/* share */}
                      <div className="relative">
                        <button onClick={handleShare} title="링크 복사" className="flex items-center justify-center w-[28px] h-[40px] rounded-[6px] hover:bg-[#F0F2F5] transition-colors">
                          {copied ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12l5 5L19 7" stroke="#256EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        {copied && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] text-white bg-[#1E2124] rounded px-2 py-0.5 whitespace-nowrap pointer-events-none">복사됨</span>
                        )}
                      </div>
                      {/* heart/scrap */}
                      <button onClick={handleScrap} disabled={scrapMutation.isPending} title={isScraped ? '스크랩 해제' : '스크랩'} className="flex items-center justify-center w-[28px] h-[40px] rounded-[6px] hover:bg-[#F0F2F5] transition-colors disabled:opacity-50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                            stroke={isScraped ? '#256EF4' : '#33363D'}
                            fill={isScraped ? '#256EF4' : 'none'}
                            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {/* bag/cart */}
                      <button onClick={handleAddToCart} disabled={cartMutation.isPending} title="장바구니 담기" className="flex items-center justify-center w-[28px] h-[40px] rounded-[6px] hover:bg-[#F0F2F5] transition-colors disabled:opacity-50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
                        <span className="papers-meta-value text-[17px] leading-[150%] text-[#464C53]">
                          {paper.authors.slice(0, 3).map((a) => (typeof a === 'string' ? a : a.name)).join(' ')}
                          {paper.authors.length > 3 ? ` 외 ${paper.authors.length - 3}명` : ''}
                        </span>
                      </MetaRow>
                    )}

                    {/* 발행정보 : 발행기관 > 저널 > 권호 > 페이지 with arrow icons */}
                    {(paper.venue || paper.published_at || (paper as any).year) && (
                      <MetaRow label="발행정보">
                        <div className="flex items-center flex-wrap gap-x-[6px]">
                          {paper.provider && (
                            <>
                              {paper.provider.website_url ? (
                                <a href={/^https?:\/\//i.test(paper.provider.website_url) ? paper.provider.website_url : `https://${paper.provider.website_url}`} target="_blank" rel="noopener noreferrer"
                                  className="papers-meta-value text-[17px] leading-[150%] text-[#464C53] hover:underline">
                                  {paper.provider.name}
                                </a>
                              ) : (
                                <span className="papers-meta-value text-[17px] leading-[150%] text-[#464C53]">{paper.provider.name}</span>
                              )}
                              {/* arrow-to-right icon 16px, stroke #CDD1D5 */}
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                <path d="M6.17 3.67l4.33 4.33-4.33 4.33" stroke="#CDD1D5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </>
                          )}
                          {paper.venue && (
                            <>
                              <Link
                                to={`/journal/${paper.venue.id}`}
                                className="papers-meta-value text-[17px] leading-[150%] text-[#464C53] hover:underline"
                              >
                                {paper.venue.name}
                              </Link>
                              {paper.issue?.label && (
                                <>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                    <path d="M6.17 3.67l4.33 4.33-4.33 4.33" stroke="#CDD1D5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <span className="papers-meta-value text-[17px] leading-[150%] text-[#464C53]">{paper.issue.label}</span>
                                </>
                              )}
                              {(paper.page_start || paper.page_end) && (
                                <>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                    <path d="M6.17 3.67l4.33 4.33-4.33 4.33" stroke="#CDD1D5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <span className="papers-meta-value text-[17px] leading-[150%] text-[#464C53]">
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

                    {/* DOI */}
                    {paper.doi && (
                      <MetaRow label="DOI">
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="papers-meta-value text-[17px] leading-[150%] text-[#464C53] hover:underline break-all"
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
                        onClick={() => { console.log('[미리보기] 클릭 paper:', paper?.id, 'previewOpen:', previewOpen); setPreviewOpen(true); }}
                        className="flex items-center gap-[4px] px-[2px] h-[32px] rounded text-[17px] leading-[150%] text-[#1E2124] hover:bg-[#F0F2F5] transition-colors"
                      >
                        {/* document-search icon 20px */}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <rect x="3.5" y="2.5" width="10" height="13" rx="1.2" stroke="#33363D" strokeWidth="1.6" />
                          <line x1="6" y1="7" x2="11" y2="7" stroke="#33363D" strokeWidth="1.1" strokeLinecap="round" />
                          <line x1="6" y1="10" x2="9" y2="10" stroke="#33363D" strokeWidth="1.1" strokeLinecap="round" />
                          <circle cx="14" cy="14" r="3" stroke="#33363D" strokeWidth="1.6" />
                          <line x1="16.5" y1="16.5" x2="18" y2="18" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        미리보기
                      </button>
                      {/* 인용하기 button */}
                      <button
                        onClick={handleOpenCite}
                        className="flex items-center gap-[4px] px-[2px] h-[32px] rounded text-[17px] leading-[150%] text-[#1E2124] hover:bg-[#F0F2F5] transition-colors"
                      >
                        {/* double-quotes icon 20px */}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M5 8.5C5 7 6 6 7.5 6H8v2H7.5C7.2 8 7 8.2 7 8.5V9h1.5v3.5H5V8.5z" fill="#33363D" />
                          <path d="M11.5 8.5C11.5 7 12.5 6 14 6h.5v2H14c-.3 0-.5.2-.5.5V9H15v3.5h-3.5V8.5z" fill="#33363D" />
                        </svg>
                        인용하기
                      </button>
                    </div>

                    {/* button-pay-box right : gap 16px */}
                    <div className="papers-btn-pay-box flex flex-row justify-end items-center gap-[16px]">
                      {/* 원문 받기 button (outline) : h-48px, rounded-[6px], px-24, font 17px */}
                      {/*!isPurchased && (
                        <button
                          onClick={handleScrollToAbstract}
                          className="inline-flex items-center justify-center px-[24px] h-[48px] rounded-[6px] text-[17px] leading-[150%] text-[#131416] hover:bg-[#F0F2F5] transition-colors"
                        >
                          초록보기
                        </button>
                      )*/}
                      {/* 구매하기 / 원문보기 button : h-48px, bg #256EF4, rounded-[6px], px-24, font 17px, white */}
                      <button
                        onClick={isPurchased ? handleViewFull : handlePurchase}
                        onMouseEnter={() => setBuyBtnHovered(true)}
                        onMouseLeave={() => setBuyBtnHovered(false)}
                        className="inline-flex items-center justify-center px-[24px] h-[48px] rounded-[6px] text-[17px] leading-[150%] text-white"
                        style={{ background: '#256EF4', overflow: 'hidden', position: 'relative' }}
                      >
                        <span style={{
                          display: 'inline-block',
                          transition: 'transform 0.2s ease, opacity 0.2s ease',
                          transform: !isPurchased && buyBtnHovered ? 'translateY(-120%)' : 'translateY(0)',
                          opacity: !isPurchased && buyBtnHovered ? 0 : 1,
                        }}>
                          {isPurchased ? '원문보기' : '구매하기'}
                        </span>
                        {!isPurchased && (
                          <span style={{
                            position: 'absolute',
                            transition: 'transform 0.2s ease, opacity 0.2s ease',
                            transform: buyBtnHovered ? 'translateY(0)' : 'translateY(120%)',
                            opacity: buyBtnHovered ? 1 : 0,
                          }}>
                            {paper.price ? `₩${paper.price.toLocaleString()}` : '구매하기'}
                          </span>
                        )}
                      </button>
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

                {/* con-abstract : 초록, gap 20px */}
                {paper.abstract && (
                  <div ref={abstractRef} className="flex flex-col gap-[20px] w-full">
                    <h2 className="papers-section-heading text-[24px] font-bold leading-[150%] text-[#131416]">초록</h2>
                    <p className="papers-body-text text-[17px] font-normal leading-[150%] text-[#464C53] w-full break-words">{paper.abstract}</p>
                  </div>
                )}

                {/* 영문초록 */}
                {paper.abstract_en && (
                  <div className="flex flex-col gap-[20px] w-full">
                    <h2 className="papers-section-heading text-[24px] font-bold leading-[150%] text-[#131416]">영문초록</h2>
                    <p className="papers-body-text text-[17px] font-normal leading-[150%] text-[#464C53] w-full break-words">{paper.abstract_en}</p>
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
                      {paper.references.map((ref, idx) => {
                        const text = typeof ref === 'string' ? ref : (ref as { raw_text?: string }).raw_text ?? '';
                        return (
                          <div key={idx}>
                            <p className="papers-body-text text-[17px] font-normal leading-[150%] text-[#464C53] py-[12px]">
                              {renderTextWithLinks(text)}
                            </p>
                            <div className="w-full h-px bg-[#CDD1D5]" />
                          </div>
                        );
                      })}
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
