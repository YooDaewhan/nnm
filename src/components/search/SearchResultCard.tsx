import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { OpenSearchTextResultItem } from '@/api/search';
import { addScrapBatch, deleteScrapBatch } from '@/api/scraps';
import { highlightText } from '@/utils/highlight';
import { PublicationMeta } from './PublicationMeta';
import { CitationModal, CITE_FORMATS } from './CitationModal';

interface SearchResultCardProps {
  result: OpenSearchTextResultItem;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onBuyNow: (e: React.MouseEvent, id: string) => void;
  isLoggedIn: boolean;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  cartLoading: boolean;
  buyLoading: boolean;
  highlightTerms?: string[];
  isScraped: boolean;
  onScrapToggle: (id: string, isScrapped: boolean) => void;
}

export function SearchResultCard({
  result,
  onAddToCart,
  onBuyNow,
  isLoggedIn,
  isSelected,
  onToggleSelect,
  cartLoading,
  buyLoading,
  highlightTerms = [],
  isScraped,
  onScrapToggle,
}: SearchResultCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [citeOpen, setCiteOpen] = useState(false);
  const [citeTexts, setCiteTexts] = useState<Record<string, string>>({});
  const [citeLoadings, setCiteLoadings] = useState<Record<string, boolean>>({});
  const [citeCopied, setCiteCopied] = useState<string | null>(null);

  const scrapMutation = useMutation({
    mutationFn: () =>
      isScraped ? deleteScrapBatch([result.id]) : addScrapBatch([result.id]),
    onSuccess: () => onScrapToggle(result.id, !isScraped),
    onError: (err) => alert(err instanceof Error ? err.message : '스크랩 처리에 실패했습니다.'),
  });

  const handleScrap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login'); return; }
    scrapMutation.mutate();
  };

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

  const paperUrl = (() => {
    const provider = (result.metadata.provider_name as string | null)?.trim();
    const venue = (result.metadata.venue_name as string | null)?.trim();
    const journal = (result.metadata.journal as string | null)?.trim();
    if (provider && venue && journal) {
      return `/papers/${encodeURIComponent(provider)}/${encodeURIComponent(venue)}/${encodeURIComponent(journal)}/${result.id}`;
    }
    return `/papers/${result.id}`;
  })();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = window.location.origin + paperUrl;
    const doCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(doCopy).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        doCopy();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      doCopy();
    }
  };

  return (
    <>
      <div className={`bg-white border rounded-xl hover:shadow-md transition-shadow flex items-stretch
        ${isSelected ? 'border-[#256EF4]' : 'border-[#E4E7EA]'}`}
      >
        <div onClick={onToggleSelect} className="flex items-start justify-center pt-5 px-3 md:px-4 shrink-0 cursor-pointer">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
            ${isSelected ? 'bg-[#256EF4] border-[#256EF4]' : 'border-[#CDD1D5] bg-white hover:border-[#256EF4]'}`}
          >
            {isSelected && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>

        <div onClick={() => navigate(paperUrl)} className="flex-1 min-w-0 py-4 pr-5 pl-0 cursor-pointer">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center h-[22px] px-2.5 bg-[#ECF2FE] text-[#0B50D0] text-[12px] font-medium rounded-full">학술저널</span>
              <span className="inline-flex items-center h-[22px] px-2.5 bg-[#EAF6EC] text-[#267337] text-[12px] font-medium rounded-full">KCI등재</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <button type="button" onClick={handleShare} className="text-[#8A949E] hover:text-[#1E2124] transition-colors" title="링크 복사">
                  {copied ? (
                    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10L8.5 14.5L16 6" stroke="#256EF4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                      <circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.4"/>
                      <circle cx="15" cy="16" r="2" stroke="currentColor" strokeWidth="1.4"/>
                      <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M7 9L13 5M7 11L13 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] text-white bg-[#1E2124] rounded px-2 py-0.5 whitespace-nowrap pointer-events-none">복사됨</span>
                )}
              </div>
              <button onClick={handleScrap} disabled={scrapMutation.isPending} className="text-[#8A949E] hover:text-[#1E2124] transition-colors disabled:opacity-50" title={isScraped ? '스크랩 해제' : '스크랩'}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                  <path d="M5 3H15C15.55 3 16 3.45 16 4V18L10 14.5L4 18V4C4 3.45 4.45 3 5 3Z"
                    stroke={isScraped ? '#256EF4' : 'currentColor'}
                    fill={isScraped ? '#256EF4' : 'none'}
                    strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={(e) => onAddToCart(e, result.id)} disabled={cartLoading} className="text-[#8A949E] hover:text-[#1E2124] transition-colors disabled:opacity-50" title="장바구니 담기">
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                  <path d="M3.5 6.5H16.5L15 15H5L3.5 6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M7.5 6.5C7.5 4.6 8.7 3 10 3C11.3 3 12.5 4.6 12.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <h4 className="text-[16px] font-bold text-[#1E2124] leading-[1.5em] mb-2">
            {result.title ? highlightText(result.title, highlightTerms) : '제목 없음'}
          </h4>

          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap text-[13px] text-[#464C53] mb-1">
                {result.authors && result.authors.length > 0 && (
                  <>
                    {result.authors.slice(0, 3).map((a: string, i: number) => (
                      <span key={i}>{a}</span>
                    ))}
                    {result.authors.length > 3 && <span>외 {result.authors.length - 3}명</span>}
                    <span className="text-[#CDD1D5] mx-0.5">|</span>
                  </>
                )}
                {result.year != null && (
                  <><span>{result.year}</span><span className="text-[#CDD1D5] mx-0.5">|</span></>
                )}
                <span>KCI등재</span>
              </div>
              <PublicationMeta metadata={result.metadata} />
            </div>
            <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[14px] font-bold text-[#AB2B36] border border-[#AB2B36] rounded-md px-3 py-1">￦ 7,000</span>
              <button
                onClick={(e) => onBuyNow(e, result.id)}
                disabled={buyLoading}
                className="h-8 px-4 bg-[#256EF4] text-white text-[13px] font-medium rounded-md hover:bg-[#1e4ec9] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {buyLoading ? '처리 중...' : '구매하기'}
              </button>
            </div>
          </div>

          <div className="flex md:hidden items-center justify-end gap-3 mt-2 mb-1">
            <span className="text-[14px] font-bold text-[#AB2B36] border border-[#AB2B36] rounded-md px-3 py-1">￦ 7,000</span>
            <button
              onClick={(e) => onBuyNow(e, result.id)}
              disabled={buyLoading}
              className="h-8 px-4 bg-[#256EF4] text-white text-[13px] font-medium rounded-md hover:bg-[#1e4ec9] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {buyLoading ? '처리 중...' : '구매하기'}
            </button>
          </div>

          <div className="hidden md:flex items-center border-t border-[#F4F5F6] pt-2.5 mt-1" onClick={(e) => e.stopPropagation()}>
            <button className="flex items-center gap-1 pr-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              미리보기
            </button>
            <div className="w-px h-3 bg-[#CDD1D5]"/>
            <button
              onClick={(e) => { e.stopPropagation(); if (result.abstract) setExpanded(v => !v); }}
              className={`flex items-center gap-1 px-3 text-[13px] transition-colors ${result.abstract ? 'text-[#464C53] hover:text-[#256EF4]' : 'text-[#CDD1D5] cursor-default'}`}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M4.5 6H11.5M4.5 9.5H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {!result.abstract ? '초록 없음' : expanded ? '접기' : '초록보기'}
            </button>
            <div className="w-px h-3 bg-[#CDD1D5]"/>
            <button className="flex items-center gap-1 px-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L9.8 5.5L14 6.1L11 9L11.8 13.2L8 11.1L4.2 13.2L5 9L2 6.1L6.2 5.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              AI 요약
            </button>
            <div className="w-px h-3 bg-[#CDD1D5]"/>
            <button onClick={handleOpenCite} className="flex items-center gap-1 px-3 text-[13px] text-[#464C53] hover:text-[#256EF4] transition-colors">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 5.5C2.5 4.67 3.17 4 4 4H5.5V7.5H2.5V5.5ZM8.5 5.5C8.5 4.67 9.17 4 10 4H11.5V7.5H8.5V5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M2.5 7.5V12H5.5V7.5M8.5 7.5V12H11.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
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
