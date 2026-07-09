import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DetailedSearchCondition } from '@/api/search';

export type SearchMode = 'text' | 'detailed';

export interface SubmittedState {
  /** text=일반검색(/text, 전체 필드), detailed=상세검색·결과 내 재검색(/detailed) */
  mode?: SearchMode;
  conditions: DetailedSearchCondition[];
  sort: 'relevance' | 'latest';
  filters: { year_from?: number; year_to?: number; year_label?: string; journal?: string };
}

/** 조건 1개·전체필드면 /text 일반검색, 그 외엔 /detailed 상세검색 */
export function baseModeOf(conditions: DetailedSearchCondition[]): SearchMode {
  return conditions.length === 1 && conditions[0].field === 'full_text' ? 'text' : 'detailed';
}

function loadFromSession(): SubmittedState | null {
  try {
    const saved = sessionStorage.getItem('search_submitted');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

const VALID_FIELDS: DetailedSearchCondition['field'][] = ['title', 'author', 'abstract', 'keyword', 'doi', 'full_text'];

export function useSearchSubmit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q');
  const fieldParam = searchParams.get('field');

  const [submittedState, setSubmittedState] = useState<SubmittedState | null>(loadFromSession);
  const [detailedSort, setDetailedSort] = useState<'relevance' | 'latest'>(() => {
    return loadFromSession()?.sort ?? 'relevance';
  });

  useEffect(() => {
    if (!qParam) return;
    const hasField = VALID_FIELDS.includes(fieldParam as DetailedSearchCondition['field']);
    // 필드 미선택(전체) → /text 일반검색, 필드 선택 → /detailed 상세검색
    const field: DetailedSearchCondition['field'] = hasField
      ? (fieldParam as DetailedSearchCondition['field'])
      : 'full_text';
    setDetailedSort('relevance');
    setSubmittedState({
      mode: hasField ? 'detailed' : 'text',
      conditions: [{ field, keyword: qParam, operator: 'AND' }],
      sort: 'relevance',
      filters: {},
    });
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.delete('field');
      next.set('page', '1');
      return next;
    }, { replace: true });
  }, [qParam, fieldParam]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (submittedState) sessionStorage.setItem('search_submitted', JSON.stringify(submittedState));
    else sessionStorage.removeItem('search_submitted');
  }, [submittedState]);

  const handleReset = () => {
    setSubmittedState(null);
    setDetailedSort('relevance');
    sessionStorage.removeItem('search_submitted');
    setSearchParams({});
  };

  const removeConditionBadge = (idx: number) => {
    if (!submittedState) return;
    const next = submittedState.conditions.filter((_, i) => i !== idx);
    if (next.length === 0) { handleReset(); return; }
    setSubmittedState(prev => prev ? {
      ...prev,
      conditions: next,
      mode: baseModeOf(next),
    } : prev);
    setSearchParams({ page: '1' });
  };

  const removeYearFilter = () => {
    setSubmittedState(prev => prev ? { ...prev, filters: {} } : prev);
    setSearchParams({ page: '1' });
  };

  return {
    submittedState,
    setSubmittedState,
    detailedSort,
    setDetailedSort,
    searchParams,
    setSearchParams,
    handleReset,
    removeConditionBadge,
    removeYearFilter,
  };
}
