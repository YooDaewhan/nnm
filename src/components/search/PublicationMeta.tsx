export function PublicationMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const providerName = (metadata.provider_name || metadata.publisher_name) as string | null;
  const venueName = (metadata.venue_name || metadata.journal) as string | null;
  const volume = metadata.volume as string | null | number;
  const issue = (metadata.issue_number || metadata.number) as string | null;
  const volumeIssue = volume || issue
    ? [volume ? `${volume}권` : '', issue ? `(${issue}호)` : ''].filter(Boolean).join(' ')
    : null;
  const pageStart = metadata.page_start as string | null;
  const pageEnd = metadata.page_end as string | null;
  const pageRange = (metadata.page_range as string | null)
    || (pageStart || pageEnd
      ? [pageStart, pageEnd].filter(Boolean).join('-') + 'p'
      : null);
  const segments = [providerName, venueName, volumeIssue, pageRange].filter(Boolean) as string[];
  if (segments.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap text-[14px] text-[#6B7280]">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {seg}
          {i < segments.length - 1 && <span className="text-[#CDD1D5]">›</span>}
        </span>
      ))}
    </div>
  );
}
