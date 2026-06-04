const API_BASE = 'http://125.129.246.231/api';

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildJsonLd(paper, pageUrl) {
  const authorList = Array.isArray(paper.authors)
    ? paper.authors.map(a => ({ '@type': 'Person', name: typeof a === 'string' ? a : (a.name || '') }))
    : [];

  const obj = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    name: paper.title || '',
    url: pageUrl,
    author: authorList,
  };

  if (paper.title_en) obj.alternativeHeadline = paper.title_en;
  if (paper.abstract) obj.abstract = paper.abstract;
  if (paper.abstract_en && !paper.abstract) obj.abstract = paper.abstract_en;
  if (paper.published_at) obj.datePublished = paper.published_at;
  if (paper.doi) obj.sameAs = `https://doi.org/${paper.doi}`;

  const kw = [...(Array.isArray(paper.keywords) ? paper.keywords : []), ...(Array.isArray(paper.keywords_en) ? paper.keywords_en : [])];
  if (kw.length > 0) obj.keywords = kw.join(', ');

  // 발행정보: 저널 > 권호
  if (paper.venue?.name) {
    const periodical = { '@type': 'Periodical', name: paper.venue.name };
    if (paper.issue) {
      const vol = paper.issue.volume ? String(paper.issue.volume) : null;
      const num = paper.issue.number ? String(paper.issue.number) : null;
      const issuePart = { '@type': 'PublicationIssue', isPartOf: periodical };
      if (vol) issuePart.volumeNumber = vol;
      if (num) issuePart.issueNumber = num;
      obj.isPartOf = issuePart;
    } else {
      obj.isPartOf = periodical;
    }
  }

  if (paper.provider?.name) {
    obj.publisher = { '@type': 'Organization', name: paper.provider.name };
    if (paper.provider.website_url) obj.publisher.url = paper.provider.website_url;
  }

  if (paper.page_start) obj.pageStart = paper.page_start;
  if (paper.page_end)   obj.pageEnd   = paper.page_end;

  // 목차
  const toc = paper.table_of_contents || paper.body_content || null;
  if (toc) obj.tableOfContents = toc;

  // 참고문헌
  if (Array.isArray(paper.references) && paper.references.length > 0) {
    obj.citation = paper.references.map(ref => {
      const text = typeof ref === 'string' ? ref : (ref.raw_text || ref.text || '');
      return { '@type': 'CreativeWork', description: text };
    });
  }

  // </script> 이스케이프 (HTML 안에 임베드할 때 파싱 오류 방지)
  return JSON.stringify(obj).replace(/<\/script>/gi, '<\\/script>');
}

function injectMeta(html, paper, pageUrl) {
  const title     = paper.title || '논문';
  const safeTitle = escapeAttr(title);
  const abstractText = (paper.abstract || paper.abstract_en || '').slice(0, 200);
  const safeDesc  = escapeAttr(abstractText);
  const safeUrl   = escapeAttr(pageUrl);

  html = html.replace(/<title>[^<]*<\/title>/,                  `<title>${safeTitle} - 뉴논문</title>`);
  html = html.replace(/<meta name="description"[^>]*\/?>/,      `<meta name="description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:title"[^>]*\/?>/,     `<meta property="og:title" content="${safeTitle}" />`);
  html = html.replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:type"[^>]*\/?>/,      `<meta property="og:type" content="article" />`);
  html = html.replace(/<meta property="og:url"[^>]*\/?>/,       `<meta property="og:url" content="${safeUrl}" />`);
  html = html.replace(/<meta name="twitter:title"[^>]*\/?>/,    `<meta name="twitter:title" content="${safeTitle}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${safeDesc}" />`);

  let extra = '';

  // 저자
  const authorNames = Array.isArray(paper.authors)
    ? paper.authors.map(a => typeof a === 'string' ? a : a.name).filter(Boolean)
    : [];
  if (authorNames.length > 0) {
    for (const name of authorNames) {
      extra += `  <meta name="citation_author" content="${escapeAttr(name)}" />\n`;
    }
  }

  // DOI / canonical
  if (paper.doi) {
    extra += `  <link rel="canonical" href="https://doi.org/${escapeAttr(paper.doi)}" />\n`;
    extra += `  <meta name="citation_doi" content="${escapeAttr(paper.doi)}" />\n`;
  }

  // 키워드
  const kw = [...(Array.isArray(paper.keywords) ? paper.keywords : []), ...(Array.isArray(paper.keywords_en) ? paper.keywords_en : [])];
  if (kw.length > 0) extra += `  <meta name="keywords" content="${escapeAttr(kw.join(', '))}" />\n`;

  // 발행정보 (Google Scholar citation_ 메타)
  if (paper.venue?.name)     extra += `  <meta name="citation_journal_title" content="${escapeAttr(paper.venue.name)}" />\n`;
  if (paper.provider?.name)  extra += `  <meta name="citation_publisher" content="${escapeAttr(paper.provider.name)}" />\n`;
  if (paper.published_at)    extra += `  <meta name="citation_publication_date" content="${escapeAttr(paper.published_at.slice(0, 10))}" />\n`;
  if (paper.issue?.volume)   extra += `  <meta name="citation_volume" content="${escapeAttr(String(paper.issue.volume))}" />\n`;
  if (paper.issue?.number)   extra += `  <meta name="citation_issue" content="${escapeAttr(String(paper.issue.number))}" />\n`;
  if (paper.page_start)      extra += `  <meta name="citation_firstpage" content="${escapeAttr(String(paper.page_start))}" />\n`;
  if (paper.page_end)        extra += `  <meta name="citation_lastpage" content="${escapeAttr(String(paper.page_end))}" />\n`;

  // JSON-LD 구조화 데이터 (제목·발행정보·저자·초록·목차·참고문헌 포함)
  extra += `  <script type="application/ld+json">${buildJsonLd(paper, pageUrl)}</script>\n`;

  if (extra) html = html.replace('</head>', extra + '</head>');

  return html;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // ── 디버그 엔드포인트: /__debug__/:paperId ──────────────────────────
    if (pathname.startsWith('/__debug__/')) {
      const id = pathname.replace('/__debug__/', '');
      try {
        const res = await fetch(`${API_BASE}/papers/${id}`);
        const body = await res.text();
        return new Response(
          JSON.stringify({ status: res.status, ok: res.ok, body: body.slice(0, 500) }, null, 2),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }, null, 2), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ── 논문 상세 페이지 감지 ──────────────────────────────────────────
    const segments = pathname.split('/').filter(Boolean);
    const isPaperDetail =
      segments[0] === 'papers' &&
      (segments.length === 2 || segments.length === 5);

    if (isPaperDetail) {
      const id = segments[segments.length - 1];
      console.log(`[worker] paper detail: ${id}`);

      // index.html 먼저 가져옴 (API 실패해도 SPA는 서빙)
      let html = null;
      try {
        const htmlRes = await env.ASSETS.fetch(new URL('/index.html', url).toString());
        if (htmlRes.ok) html = await htmlRes.text();
      } catch (e) {
        console.error('[worker] index.html fetch 실패:', e);
      }

      if (html) {
        // API에서 논문 데이터 가져와서 메타 주입 시도
        try {
          const paperRes = await fetch(`${API_BASE}/papers/${id}`);
          console.log(`[worker] API status: ${paperRes.status}`);
          if (paperRes.ok) {
            const paper = await paperRes.json();
            html = injectMeta(html, paper, url.href);
            console.log(`[worker] 메타 주입 완료: ${paper.title}`);
            return new Response(html, {
              headers: { 'Content-Type': 'text/html;charset=UTF-8', 'X-Worker': 'meta-injected' },
            });
          } else {
            console.warn(`[worker] API 비정상 응답: ${paperRes.status}`);
          }
        } catch (err) {
          console.error('[worker] API 요청 실패:', err);
        }

        // API 실패해도 index.html은 그대로 반환
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8', 'X-Worker': 'api-failed-fallback' },
        });
      }
    }

    // ── 정적 파일 서빙 ────────────────────────────────────────────────
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return env.ASSETS.fetch(new URL('/index.html', url).toString());
    }
    return response;
  },
};
