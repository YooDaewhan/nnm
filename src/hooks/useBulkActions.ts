import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { OpenSearchTextResultItem } from '@/api/search';
import { addToCart, addToCartBatch } from '@/api/cart';
import { addScrapBatch } from '@/api/scraps';

export function useBulkActions(
  selectedIds: Set<string>,
  searchResults: OpenSearchTextResultItem[],
  scrapIds: string[],
  isLoggedIn: boolean,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [bulkCartLoading, setBulkCartLoading] = useState(false);
  const [bulkScrapLoading, setBulkScrapLoading] = useState(false);

  const handleBulkCite = async () => {
    const citations = searchResults
      .filter(r => selectedIds.has(r.id))
      .map(r => {
        const authors = r.authors?.slice(0, 3).join(', ') ?? '';
        const year = r.year ?? '';
        const journal = (r.metadata.journal as string | null)?.trim() ?? '';
        return `${authors}${authors ? ' ' : ''}(${year}). ${r.title}. ${journal}`.trim();
      })
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(citations);
      alert('인용 정보가 복사되었습니다.');
    } catch (e) {
      console.error('복사 실패', e);
    }
  };

  const handleBulkBuy = async () => {
    if (!isLoggedIn) { navigate('/login', { state: { from: location.pathname + location.search } }); return; }
    setBulkCartLoading(true);
    const ids = [...selectedIds];
    try {
      const res = await addToCartBatch(ids);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const added = (res?.data as any)?.result?.added ?? ids.length;
      const skipped = ids.length - added;
      if (skipped > 0) {
        alert(`${added}개가 장바구니에 추가되었습니다.\n(${skipped}개는 추가할 수 없는 논문입니다.)`);
      } else {
        alert(`${added}개가 장바구니에 추가되었습니다.`);
      }
    } catch {
      const results = await Promise.allSettled(ids.map(id => addToCart({ publication_id: id })));
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (succeeded === 0) {
        alert(`선택한 논문을 장바구니에 추가할 수 없습니다.`);
      } else {
        alert(`${succeeded}개가 장바구니에 추가되었습니다.${failed > 0 ? `\n(${failed}개는 구매 불가 논문입니다.)` : ''}`);
      }
    } finally {
      setBulkCartLoading(false);
    }
  };

  const handleBulkScrap = async () => {
    if (!isLoggedIn) { navigate('/login', { state: { from: location.pathname + location.search } }); return; }
    setBulkScrapLoading(true);
    const ids = [...selectedIds];
    try {
      await addScrapBatch(ids);
      queryClient.invalidateQueries({ queryKey: ['publications-status', scrapIds] });
      alert(`${ids.length}개를 스크랩에 추가했습니다.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '스크랩 추가에 실패했습니다.');
    } finally {
      setBulkScrapLoading(false);
    }
  };

  return { bulkCartLoading, bulkScrapLoading, handleBulkCite, handleBulkBuy, handleBulkScrap };
}
