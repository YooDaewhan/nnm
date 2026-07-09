import { useState } from 'react';

function loadFromSession<T>(key: string, initial: T): T {
  try {
    const saved = sessionStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : initial;
  } catch {
    return initial;
  }
}

/** useState처럼 쓰지만 sessionStorage에 미러링해 라우트 이동으로 언마운트돼도 복원됨 */
export function useSessionState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => loadFromSession(key, initial));

  const setPersisted = (value: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        // sessionStorage 접근 불가 시 무시 (state는 정상 동작)
      }
      return next;
    });
  };

  return [state, setPersisted] as const;
}
