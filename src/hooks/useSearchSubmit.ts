import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DetailedSearchCondition } from '@/api/search';

export interface SubmittedState {
  conditions: DetailedSearchCondition[];
  sort: 'relevance' | 'latest';
  filters: { year_from?: number; year_to?: number; year_label?: string; journal?: string };
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
    const field: DetailedSearchCondition['field'] =
      VALID_FIELDS.includes(fieldParam as DetailedSearchCondition['field'])
        ? (fieldParam as DetailedSearchCondition['field'])
        : 'title';
    setDetailedSort('relevance');
    setSubmittedState({
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
    setSubmittedState(prev => prev ? { ...prev, conditions: next } : prev);
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
