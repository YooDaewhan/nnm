import { useNavigate } from 'react-router-dom';

export function PublicationMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const navigate = useNavigate();
  const providerName = (metadata.provider_name || metadata.publisher_name) as string | null;
  const venueName = (metadata.venue_name || metadata.journal) as string | null;
  const venueId = metadata.venue_id as number | string | null | undefined;
  const volume = metadata.volume as string | null | number;
  const issue = (metadata.issue_number || metadata.number) as string | null;
  const volumeIssue = volume || issue
    ? [volume ? `${volume}권` : '', issue ? `(${issue}호)` : ''].filter(Boolean).join(' ')
    : null;
  const pageStart = metadata.page_start as string | null;
  const pageEnd = metadata.page_end as string | null;
  const pageRange = (metadata.page_range as string | null)
    || (pageStart || pageEnd
      ? 'pp. ' + [pageStart, pageEnd].filter(Boolean).join('-')
      : null);

  type Seg = { text: string; link?: string };
  const segments: Seg[] = [
    providerName ? { text: providerName } : null,
    venueName
      ? {
          text: venueName,
          link: venueId
            ? `/journal/${venueId}?name=${encodeURIComponent(venueName)}`
            : `/journal?name=${encodeURIComponent(venueName)}`,
        }
      : null,
    volumeIssue ? { text: volumeIssue } : null,
    pageRange ? { text: pageRange } : null,
  ].filter(Boolean) as Seg[];

  if (segments.length === 0) return null;
  return (
    <div className="meta-article meta-static">
      {segments.map((seg, i) =>
        seg.link ? (
          <a
            key={i}
            href={seg.link}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(seg.link!); }}
            className="meta-value info-chevron text-[15px] hover:text-[#256EF4] hover:underline transition-colors"
            style={{ margin: 0 }}
          >
            {seg.text}
          </a>
        ) : (
          <span key={i} className="meta-value info-chevron text-[15px]" style={{ margin: 0 }}>
            {seg.text}
          </span>
        )
      )}
    </div>
  );
}
