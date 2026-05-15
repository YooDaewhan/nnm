import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DetailedSearchCondition } from '@/api/search';

export interface SubmittedState {
  conditions: DetailedSearchCondition[];
  sort: 'relevance' | 'latest';
  filters: { year_from?: number; year_to?: number; year_label?: string };
}

function loadFromSession(): SubmittedState | null {
  try {
    const saved = sessionStorage.getItem('search_submitted');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export function useSearchSubmit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q');

  const [submittedState, setSubmittedState] = useState<SubmittedState | null>(loadFromSession);
  const [detailedSort, setDetailedSort] = useState<'relevance' | 'latest'>(() => {
    return loadFromSession()?.sort ?? 'relevance';
  });

  useEffect(() => {
    if (!qParam) return;
    setDetailedSort('relevance');
    setSubmittedState({
      conditions: [{ field: 'title', keyword: qParam, operator: 'AND' }],
      sort: 'relevance',
      filters: {},
    });
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.set('page', '1');
      return next;
    }, { replace: true });
  }, [qParam]); // eslint-disable-line react-hooks/exhaustive-deps

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
