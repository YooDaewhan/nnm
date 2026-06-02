interface JournalTabsProps {
  activeTab: 'recent' | 'top10';
  onChange: (tab: 'recent' | 'top10') => void;
}

/**
 * Figma: 12505:23277 (tab)
 * - 컨테이너: row, full-width, border 1px #B1B8BE, border-radius 8px, 흰 배경
 * - 각 탭: height 56px, fill width
 * - 활성: #063A74 배경 + 흰 텍스트
 * - 비활성: 투명 배경 + #464C53 텍스트
 * - 텍스트: Pretendard GOV Bold 19px
 */
export function JournalTabs({ activeTab, onChange }: JournalTabsProps) {
  const fontFamily = "'Pretendard GOV', sans-serif";

  const tabStyle = (active: boolean, position: 'first' | 'last'): React.CSSProperties => ({
    flex: 1,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    background: active ? '#063A74' : 'transparent',
    color: active ? '#FFFFFF' : '#464C53',
    fontFamily,
    fontWeight: 700,
    fontSize: 19,
    lineHeight: '150%',
    border: 'none',
    cursor: 'pointer',
    borderRadius: position === 'first' ? '8px 0 0 8px' : '0 8px 8px 0',
    transition: 'background-color 0.15s, color 0.15s',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignSelf: 'stretch',
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #B1B8BE',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => onChange('recent')}
        style={tabStyle(activeTab === 'recent', 'first')}
      >
        최근 발간된 논문
      </button>
      <button
        type="button"
        onClick={() => onChange('top10')}
        style={tabStyle(activeTab === 'top10', 'last')}
      >
        논문 상세정보 열람 Top 10
      </button>
    </div>
  );
}
