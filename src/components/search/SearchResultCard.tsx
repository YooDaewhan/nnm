import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { OpenSearchTextResultItem, fetchAiSummary } from '@/api/search';
import { getPdfFull, PdfApiError } from '@/api/pdf';
import { PdfFullViewerModal } from '../PdfFullViewerModal';
import { addScrapBatch, deleteScrapBatch } from '@/api/scraps';
import { addToCart, removeFromCartByPublicationId } from '@/api/cart';
import { highlightText } from '@/utils/highlight';
import { PublicationMeta } from './PublicationMeta';
import { CitationModal, CITE_FORMATS } from './CitationModal';
import { PdfPreviewModal } from '../PdfPreviewModal';

const VENUE_TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  thesis:     { label: '개인논문',   bg: '#F3EDFE', color: '#6B21A8' },
  journal:    { label: '정기간행물', bg: '#ECF2FE', color: '#0B50D0' },
  report:     { label: '연구보고서', bg: '#FFF7ED', color: '#C2410C' },
  conference: { label: '학술대회지', bg: '#ECFDF5', color: '#065F46' },
  book:       { label: '도서',       bg: '#FDF4FF', color: '#7E22CE' },
  other:      { label: '기타',       bg: '#F4F5F6', color: '#464C53' },
};

interface SearchResultCardProps {
  result: OpenSearchTextResultItem;
  onBuyNow: (e: React.MouseEvent, id: string) => void;
  isLoggedIn: boolean;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  buyLoading: boolean;
  highlightTerms?: string[];
  isScraped: boolean;
  onScrapToggle: () => void;
  isPurchased?: boolean;
  isInCart?: boolean;
  onCartToggle?: () => void;
}

export function SearchResultCard({
  result,
  onBuyNow,
  isLoggedIn,
  isSelected,
  onToggleSelect,
  buyLoading,
  highlightTerms = [],
  isScraped,
  onScrapToggle,
  isPurchased = false,
  isInCart = false,
  onCartToggle,
}: SearchResultCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeTexts, setCiteTexts] = useState<Record<string, string>>({});
  const [citeLoadings, setCiteLoadings] = useState<Record<string, boolean>>({});
  const [citeCopied, setCiteCopied] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [aiSummaryExpanded, setAiSummaryExpanded] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(false);

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [localScraped, setLocalScraped] = useState(isScraped);
  const [localInCart, setLocalInCart] = useState(isInCart);
  useEffect(() => { setLocalScraped(isScraped); }, [isScraped]);
  useEffect(() => { setLocalInCart(isInCart); }, [isInCart]);

  const resultPrice = result.price ?? result.metadata?.price;
  const isAccessible = isPurchased || resultPrice === 0;

  const scrapMutation = useMutation({
    mutationFn: (wasScraped: boolean) =>
      wasScraped ? deleteScrapBatch([result.id]) : addScrapBatch([result.id]),
    onSuccess: () => onScrapToggle(),
    onError: (err, wasScraped) => {
      setLocalScraped(wasScraped);
      alert(err instanceof Error ? err.message : '스크랩 처리에 실패했습니다.');
    },
  });

  const cartMutation = useMutation({
    mutationFn: (wasInCart: boolean) =>
      wasInCart
        ? removeFromCartByPublicationId(result.id)
        : addToCart({ publication_id: result.id }),
    onSuccess: () => { onCartToggle?.(); },
    onError: (err, wasInCart) => {
      setLocalInCart(wasInCart);
      alert(err instanceof Error ? err.message : '장바구니 처리에 실패했습니다.');
    },
  });

  const handleScrap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login', { state: { from: location.pathname + location.search } }); return; }
    const wasScraped = localScraped;
    setLocalScraped(!wasScraped);
    scrapMutation.mutate(wasScraped);
  };

  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login', { state: { from: location.pathname + location.search } }); return; }
    const wasInCart = localInCart;
    setLocalInCart(!wasInCart);
    cartMutation.mutate(wasInCart);
  };

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const { url: pdfUrl } = await getPdfFull(result.id);
      const proxiedUrl = pdfUrl.replace('https://newnonmun-archive.s3.ap-northeast-2.amazonaws.com', '/s3-proxy');
      const res = await fetch(proxiedUrl);
      if (!res.ok) throw new Error('다운로드 실패');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${result.title.replace(/[\\/:*?"<>|]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if (err instanceof PdfApiError && err.status === 403) {
        alert('다운로드 권한이 없습니다. 논문을 구매해 주세요.');
      } else {
        alert('PDF 다운로드에 실패했습니다.');
      }
    } finally {
      setDownloading(false);
    }
  }, [result]);

  const fetchCitation = useCallback(async (fmt: string) => {
    setCiteLoadings(prev => ({ ...prev, [fmt]: true }));
    try {
      const { API_BASE_URL } = await import('../../api/client');
      const res = await fetch(`${API_BASE_URL}/api/citations/${result.id}?format=${fmt}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      const text: string = json.citation ?? json.data?.citation ?? JSON.stringify(json);
      setCiteTexts(prev => ({ ...prev, [fmt]: text }));
    } catch {
      const authors = result.authors?.slice(0, 3).join(', ') ?? '';
      const year = result.year ?? '';
      const journal = (result.metadata.journal as string | null)?.trim() ?? '';
      setCiteTexts(prev => ({ ...prev, [fmt]: `${authors} (${year}). ${result.title}. ${journal}.` }));
    } finally {
      setCiteLoadings(prev => ({ ...prev, [fmt]: false }));
    }
  }, [result]);

  const handleOpenCite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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

  const paperUrl = `/papers/${result.id}`;

  const handleAiSummary = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiSummaryExpanded) {
      setAiSummaryExpanded(false);
      return;
    }
    setAiSummaryExpanded(true);
    if (aiSummary !== null) return;
    setAiSummaryLoading(true);
    setAiSummaryError(false);
    try {
      const summary = await fetchAiSummary(result.id);
      setAiSummary(summary);
    } catch {
      setAiSummaryError(true);
    } finally {
      setAiSummaryLoading(false);
    }
  }, [aiSummaryExpanded, aiSummary, result.title]);

  const handleShareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShareMenuOpen(prev => !prev);
  };

  const handleShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + paperUrl;
    const doCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(doCopy).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); doCopy();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta); doCopy();
    }
    setShareMenuOpen(false);
  };

  const handleShareNotion = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + paperUrl;
    if (navigator.clipboard) { navigator.clipboard.writeText(url).catch(() => {}); }
    window.open('https://www.notion.so', '_blank', 'noopener,noreferrer');
    setShareMenuOpen(false);
  };

  const handleShareEvernote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + paperUrl;
    const evernoteUrl = `https://www.evernote.com/clip.action?url=${encodeURIComponent(url)}&title=${encodeURIComponent(result.title)}`;
    window.open(evernoteUrl, '_blank', 'noopener,noreferrer');
    setShareMenuOpen(false);
  };

  const handleShareKakao = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + paperUrl;
    const text = `${result.title}\n${url}`;
    window.location.href = `kakaotalk://send?text=${encodeURIComponent(text)}`;
    if (navigator.clipboard) { navigator.clipboard.writeText(url).catch(() => {}); }
    setShareMenuOpen(false);
  };

  const shareMenuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '9px 16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Pretendard GOV', sans-serif",
    fontSize: 14,
    color: '#1E2124',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  const renderShareMenu = () => (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        onClick={(e) => { e.stopPropagation(); setShareMenuOpen(false); }}
      />
      <div
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          zIndex: 999,
          background: '#FFFFFF',
          border: '1px solid #CDD1D5',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          padding: '4px 0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleShareLink}
          style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.5 9.5a3.18 3.18 0 0 0 4.5 0l1.5-1.5a3.18 3.18 0 0 0-4.5-4.5L7 5" stroke="#464C53" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M9.5 6.5a3.18 3.18 0 0 0-4.5 0L3.5 8a3.18 3.18 0 0 0 4.5 4.5L9 11" stroke="#464C53" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          링크 복사
        </button>
        <button
          onClick={handleShareNotion}
          style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, background: '#1E2124', borderRadius: 3,
            fontWeight: 700, fontSize: 11, color: '#FFFFFF', fontFamily: 'serif', flexShrink: 0,
          }}>N</span>
          노션
        </button>
        <button
          onClick={handleShareEvernote}
          style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#00A82D"/>
            <path d="M5.5 11.5V7c0-.83.67-1.5 1.5-1.5h2.5c.55 0 1 .45 1 1V8c0 .55-.45 1-1 1H7v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 9h2" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          에버노트
        </button>
        <button
          onClick={handleShareKakao}
          style={shareMenuItemStyle}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F5F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <ellipse cx="8" cy="7.2" rx="6.3" ry="5.2" fill="#FEE500"/>
            <path d="M5.2 9.6 4.3 12l3-2.1M8 5.4v2.4M6.1 6.3l1.9 1.5 1.9-1.5" stroke="#3A1D1D" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          카카오톡
        </button>
      </div>
    </>
  );

  /* ── 데스크탑 구매 버튼 ── */
  const renderPurchaseButtons = () => {
    if (isAccessible) {
      return (
        <div className="flex flex-col items-stretch gap-2 w-[112px]">
          <button
            onClick={(e) => { e.stopPropagation(); if (!isLoggedIn) { navigate('/login', { state: { from: location.pathname + location.search } }); return; } setViewerOpen(true); }}
            className="h-9 w-full bg-white border border-[#256EF4] text-[#0B50D0] text-[13px] font-medium rounded-md hover:bg-[#ECF2FE] transition-colors"
          >
            원문보기
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="h-9 w-full bg-[#256EF4] text-white text-[13px] font-medium rounded-md hover:bg-[#1e4ec9] transition-colors disabled:opacity-50"
          >
            {downloading ? '다운로드 중...' : '다운로드'}
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-stretch gap-2 w-[112px]">
        <div className="h-9 w-full flex items-center justify-center border border-[#AB2B36] rounded-md">
          <span className="text-[14px] font-bold text-[#AB2B36]">
            ￦ {(result.price ?? result.metadata?.price ?? 0).toLocaleString()}
          </span>
        </div>
        <button
          onClick={(e) => onBuyNow(e, result.id)}
          disabled={buyLoading}
          className="h-9 w-full bg-[#256EF4] text-white text-[13px] font-semibold rounded-md hover:bg-[#1e4ec9] transition-colors disabled:opacity-50"
        >
          {buyLoading ? '처리 중...' : '구매하기'}
        </button>
      </div>
    );
  };

  /* ── 아이콘 버튼 공통 클래스 (데스크탑) ── */
  const iconBtn = 'w-8 h-8 flex items-center justify-center rounded-md text-[#8A949E] hover:text-[#1E2124] hover:bg-[#F4F5F6] transition-colors';

  /* ───────────────────────────────────────────────────────
     모바일 카드 (Figma: article-list__mo / Type=box-mo)
  ─────────────────────────────────────────────────────── */
  const renderMobileCard = () => {
    const price = result.price ?? result.metadata?.price ?? 0;

    const mobileIconBtn: React.CSSProperties = {
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: '1px solid rgba(0,0,0,0)',
      borderRadius: 4,
      cursor: 'pointer',
      color: '#8A949E',
      padding: 0,
    };

    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #CDD1D5',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* contents: column, gap 8px, padding 20px */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 20,
          }}
        >
          {/* row-1: badge-box (left) + btn-icon-box (right), space-between */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* badge-box */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {result.type && VENUE_TYPE_MAP[result.type] && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 24,
                    padding: '0 8px',
                    borderRadius: 4,
                    background: VENUE_TYPE_MAP[result.type].bg,
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: '150%',
                    color: VENUE_TYPE_MAP[result.type].color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {VENUE_TYPE_MAP[result.type].label}
                </span>
              )}
            </div>

            {/* btn-icon-box: gap 8px (기존 16px → 절반) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* 공유 */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={handleShareToggle}
                  title="공유하기"
                  style={mobileIconBtn}
                >
                  {copied ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10L8.5 14.5L16 6" stroke="#256EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <img src="/svg/share-android.svg" width={20} height={20} style={{ display: 'block' }} alt="공유하기" />
                  )}
                </button>
                {copied && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -28,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 11,
                      color: '#FFFFFF',
                      background: '#1E2124',
                      borderRadius: 4,
                      padding: '2px 8px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    복사됨
                  </span>
                )}
                {shareMenuOpen && renderShareMenu()}
              </div>

              {/* 보관함(스크랩) */}
              <button
                onClick={handleScrap}
                disabled={scrapMutation.isPending}
                title={localScraped ? '보관함 해제' : '보관함 담기'}
                style={{
                  ...mobileIconBtn,
                  opacity: scrapMutation.isPending ? 0.5 : 1,
                }}
              >
                <img src={localScraped ? '/svg/heart-fill.svg' : '/svg/heart.svg'} width={20} height={20} style={{ display: 'block' }} alt="보관함 담기" />
              </button>

              {/* 장바구니 (유료 논문 구매 전에만 표시) */}
              {!isPurchased && (result.price ?? result.metadata?.price ?? 0) > 0 && (
                <button
                  onClick={handleCart}
                  disabled={cartMutation.isPending}
                  title={localInCart ? '장바구니 제거' : '장바구니 담기'}
                  style={{
                    ...mobileIconBtn,
                    opacity: cartMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <img src={localInCart ? '/svg/bag-B-fill.svg' : '/svg/bag-B.svg'} width={20} height={20} style={{ display: 'block' }} alt="장바구니 담기" />
                </button>
              )}
            </div>
          </div>

          {/* row-2: meta-box */}
          <div
            onClick={() => navigate(paperUrl)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 700,
                  fontSize: 19,
                  lineHeight: '150%',
                  color: '#1E2124',
                  flex: 1,
                }}
              >
                {result.title ? highlightText(result.title, highlightTerms) : '제목 없음'}
              </h3>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              {result.authors && result.authors.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {result.authors.slice(0, 3).map((author: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 24,
                        padding: '0 2px',
                        fontFamily: "'Pretendard GOV', sans-serif",
                        fontWeight: 400,
                        fontSize: 15,
                        lineHeight: '150%',
                        color: '#464C53',
                      }}
                    >
                      {author}
                    </span>
                  ))}
                  {result.authors.length > 3 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 24,
                        padding: '0 2px',
                        fontFamily: "'Pretendard GOV', sans-serif",
                        fontWeight: 400,
                        fontSize: 15,
                        lineHeight: '150%',
                        color: '#464C53',
                      }}
                    >
                      외 {result.authors.length - 3}명
                    </span>
                  )}
                </div>
              )}

              {result.authors && result.authors.length > 0 && result.year != null && (
                <svg width="1" height="12" viewBox="0 0 1 12" fill="none" style={{ flexShrink: 0, margin: '0 2px' }}>
                  <line x1="0.5" y1="0" x2="0.5" y2="12" stroke="#CDD1D5" />
                </svg>
              )}

              {result.year != null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 24,
                    padding: '0 2px',
                    fontFamily: "'Pretendard GOV', sans-serif",
                    fontWeight: 400,
                    fontSize: 15,
                    lineHeight: '150%',
                    color: '#464C53',
                  }}
                >
                  {result.year}
                </span>
              )}
            </div>

            <PublicationMeta metadata={result.metadata} />
          </div>
        </div>

        {/* btn-before */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '0 20px 20px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isAccessible ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); if (!isLoggedIn) { navigate('/login', { state: { from: location.pathname + location.search } }); return; } setViewerOpen(true); }}
                style={{
                  height: 40,
                  padding: '0 16px',
                  background: '#FFFFFF',
                  border: '1px solid #256EF4',
                  borderRadius: 6,
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  color: '#0B50D0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                원문보기
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  height: 40,
                  padding: '0 16px',
                  background: '#256EF4',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: downloading ? 0.5 : 1,
                }}
              >
                {downloading ? '다운로드 중...' : '다운로드'}
              </button>
            </>
          ) : (
            <>
              <span
                style={{
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#131416',
                  whiteSpace: 'nowrap',
                }}
              >
                ￦ {price.toLocaleString()}
              </span>
              <button
                onClick={(e) => onBuyNow(e, result.id)}
                disabled={buyLoading}
                style={{
                  height: 40,
                  padding: '0 16px',
                  background: '#256EF4',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: "'Pretendard GOV', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: buyLoading ? 0.5 : 1,
                }}
              >
                {buyLoading ? '처리 중...' : '구매하기'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ───────────── 모바일 카드 ───────────── */}
      <div className="md:hidden">
        {renderMobileCard()}
      </div>

      {/* ───────────── 데스크탑 카드 ───────────── */}
      <div className={`hidden md:flex flex-row items-start gap-4 py-6 border-t bg-white
        ${isSelected ? 'border-t-[#256EF4]' : 'border-t-[#CDD1D5]'}`}
      >
        {/* 체크박스 */}
        <div
          onClick={onToggleSelect}
          role="checkbox"
          aria-checked={isSelected}
          aria-label="논문 선택"
          className="flex items-start justify-center pt-0.5 shrink-0 cursor-pointer"
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
            ${isSelected ? 'bg-[#256EF4] border-[#256EF4]' : 'border-[#CDD1D5] bg-white hover:border-[#256EF4]'}`}
          >
            {isSelected && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div onClick={() => navigate(paperUrl)} className="flex-1 min-w-0 cursor-pointer">
          {/* 뱃지 + 아이콘 3개 */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {result.type && VENUE_TYPE_MAP[result.type] && (
                <span
                  className="inline-flex items-center h-[22px] px-2.5 text-[12px] font-medium rounded-full"
                  style={{ background: VENUE_TYPE_MAP[result.type].bg, color: VENUE_TYPE_MAP[result.type].color }}
                >
                  {VENUE_TYPE_MAP[result.type].label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button type="button" onClick={handleShareToggle} className={iconBtn} title="공유하기">
                  {copied ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10L8.5 14.5L16 6" stroke="#256EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <img src="/svg/share-android.svg" width={20} height={20} style={{ display: 'block' }} alt="공유하기" />
                  )}
                </button>
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] text-white bg-[#1E2124] rounded px-2 py-0.5 whitespace-nowrap pointer-events-none">복사됨</span>
                )}
                {shareMenuOpen && renderShareMenu()}
              </div>
              <button onClick={handleScrap} disabled={scrapMutation.isPending} className={`${iconBtn} disabled:opacity-50`} title={localScraped ? '보관함 해제' : '보관함 담기'}>
                <img src={localScraped ? '/svg/heart-fill.svg' : '/svg/heart.svg'} width={20} height={20} style={{ display: 'block' }} alt="보관함 담기" />
              </button>
              {(result.price ?? result.metadata?.price ?? 0) > 0 && !isPurchased && (
                <button onClick={handleCart} disabled={cartMutation.isPending} className={`${iconBtn} disabled:opacity-50`} title={localInCart ? '장바구니 제거' : '장바구니 담기'}>
                  <img src={localInCart ? '/svg/bag-B-fill.svg' : '/svg/bag-B.svg'} width={20} height={20} style={{ display: 'block' }} alt="장바구니 담기" />
                </button>
              )}
            </div>
          </div>

          {/* 제목 */}
          <h4 className="text-[16px] font-bold text-[#1E2124] leading-[1.5em] mb-2">
            {result.title ? highlightText(result.title, highlightTerms) : '제목 없음'}
          </h4>

          {/* 메타 + 구매 버튼 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap text-[13px] text-[#464C53] mb-1">
                {result.authors && result.authors.length > 0 && (
                  <>
                    {result.authors.slice(0, 3).map((a: string, i: number) => (<span key={i}>{a}</span>))}
                    {result.authors.length > 3 && <span>외 {result.authors.length - 3}명</span>}
                    <span className="text-[#CDD1D5] mx-0.5">|</span>
                  </>
                )}
                {result.year != null && (<><span>{result.year}</span></>)}
              </div>
              <PublicationMeta metadata={result.metadata} />
            </div>
            <div className="hidden md:block shrink-0">{renderPurchaseButtons()}</div>
          </div>

          <div className="flex md:hidden justify-end mt-4">{renderPurchaseButtons()}</div>

          {/* 하단 액션 버튼 */}
          <div className="hidden md:flex items-center border-t border-[#F4F5F6] pt-2.5 mt-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
              className="flex items-center gap-1 pr-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              미리보기
            </button>
            <div className="w-px h-3 bg-[#CDD1D5]" />
            <button
              onClick={(e) => { e.stopPropagation(); if (result.abstract) setExpanded(v => !v); }}
              className={`flex items-center gap-1 px-3 text-[13px] transition-colors ${result.abstract ? 'text-[#464C53] hover:text-[#256EF4]' : 'text-[#CDD1D5] cursor-default'}`}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M4.5 6H11.5M4.5 9.5H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {!result.abstract ? '초록 없음' : expanded ? '접기' : '초록보기'}
            </button>
            <div className="w-px h-3 bg-[#CDD1D5]" />
            <button onClick={handleOpenCite} className="flex items-center gap-1 px-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 5.5C2.5 4.67 3.17 4 4 4H5.5V7.5H2.5V5.5ZM8.5 5.5C8.5 4.67 9.17 4 10 4H11.5V7.5H8.5V5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M2.5 7.5V12H5.5V7.5M8.5 7.5V12H11.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              인용하기
            </button>
          </div>

          {expanded && result.abstract && (
            <div className="mt-3 p-3 bg-[#F8F9FA] rounded-lg border border-[#E4E7EA]">
              <p className="text-[13px] text-[#464C53] leading-[1.6em]">
                {highlightText(result.abstract, highlightTerms)}
              </p>
            </div>
          )}
        </div>
      </div>

      {previewOpen && (
        <PdfPreviewModal
          paperId={result.id}
          isPurchased={isPurchased}
          price={result.price ?? result.metadata?.price}
          onClose={() => setPreviewOpen(false)}
          onPurchase={() => { setPreviewOpen(false); navigate(paperUrl); }}
          onViewFull={() => { setPreviewOpen(false); setViewerOpen(true); }}
        />
      )}
      {viewerOpen && (
        <PdfFullViewerModal paperId={result.id} onClose={() => setViewerOpen(false)} />
      )}
      <CitationModal
        open={citeOpen}
        onClose={() => setCiteOpen(false)}
        citeTexts={citeTexts}
        citeLoadings={citeLoadings}
        citeCopied={citeCopied}
        onCopy={handleCiteCopy}
      />
    </>
  );
}
