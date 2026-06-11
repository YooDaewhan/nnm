export function highlightText(text: string, terms: string[]): React.ReactNode {
  const words = terms.flatMap(t => t.trim().split(/\s+/)).filter(Boolean);
  if (words.length === 0) return text;
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="text-[#D63D4A] font-semibold">{part}</span>
      : part
  );
}
