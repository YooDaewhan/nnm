const EMBED_MODEL = "@cf/baai/bge-m3";

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

  const kw = [
    ...(Array.isArray(paper.keywords) ? paper.keywords : []),
    ...(Array.isArray(paper.keywords_en) ? paper.keywords_en : []),
  ];
  if (kw.length > 0) obj.keywords = kw.join(', ');

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
  if (paper.page_end) obj.pageEnd = paper.page_end;

  const toc = paper.table_of_contents || paper.body_content || null;
  if (toc) obj.tableOfContents = toc;

  if (Array.isArray(paper.references) && paper.references.length > 0) {
    obj.citation = paper.references.map(ref => {
      const text = typeof ref === 'string' ? ref : (ref.raw_text || ref.text || '');
      return { '@type': 'CreativeWork', description: text };
    });
  }

  return JSON.stringify(obj).replace(/<\/script>/gi, '<\\/script>');
}

function injectMeta(html, paper, pageUrl) {
  const title = paper.title || '논문';
  const safeTitle = escapeAttr(title);
  const abstractText = (paper.abstract || paper.abstract_en || '').slice(0, 200);
  const safeDesc = escapeAttr(abstractText);
  const safeUrl = escapeAttr(pageUrl);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle} - 뉴논문</title>`);
  html = html.replace(/<meta name="description"[^>]*\/?>/, `<meta name="description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${safeTitle}" />`);
  html = html.replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:type"[^>]*\/?>/, `<meta property="og:type" content="article" />`);
  html = html.replace(/<meta property="og:url"[^>]*\/?>/, `<meta property="og:url" content="${safeUrl}" />`);
  html = html.replace(/<meta name="twitter:title"[^>]*\/?>/, `<meta name="twitter:title" content="${safeTitle}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${safeDesc}" />`);

  let extra = '';

  const authorNames = Array.isArray(paper.authors)
    ? paper.authors.map(a => typeof a === 'string' ? a : a.name).filter(Boolean)
    : [];

  if (authorNames.length > 0) {
    for (const name of authorNames) {
      extra += `  <meta name="citation_author" content="${escapeAttr(name)}" />\n`;
    }
  }

  if (paper.doi) {
    extra += `  <link rel="canonical" href="https://doi.org/${escapeAttr(paper.doi)}" />\n`;
    extra += `  <meta name="citation_doi" content="${escapeAttr(paper.doi)}" />\n`;
  }

  const kw = [
    ...(Array.isArray(paper.keywords) ? paper.keywords : []),
    ...(Array.isArray(paper.keywords_en) ? paper.keywords_en : []),
  ];
  if (kw.length > 0) {
    extra += `  <meta name="keywords" content="${escapeAttr(kw.join(', '))}" />\n`;
  }

  if (paper.venue?.name) extra += `  <meta name="citation_journal_title" content="${escapeAttr(paper.venue.name)}" />\n`;
  if (paper.provider?.name) extra += `  <meta name="citation_publisher" content="${escapeAttr(paper.provider.name)}" />\n`;
  if (paper.published_at) extra += `  <meta name="citation_publication_date" content="${escapeAttr(paper.published_at.slice(0, 10))}" />\n`;
  if (paper.issue?.volume) extra += `  <meta name="citation_volume" content="${escapeAttr(String(paper.issue.volume))}" />\n`;
  if (paper.issue?.number) extra += `  <meta name="citation_issue" content="${escapeAttr(String(paper.issue.number))}" />\n`;
  if (paper.page_start) extra += `  <meta name="citation_firstpage" content="${escapeAttr(String(paper.page_start))}" />\n`;
  if (paper.page_end) extra += `  <meta name="citation_lastpage" content="${escapeAttr(String(paper.page_end))}" />\n`;

  extra += `  <script type="application/ld+json">${buildJsonLd(paper, pageUrl)}</script>\n`;

  if (extra) html = html.replace('</head>', extra + '</head>');

  return html;
}

async function handleVectorAsk(request, env) {
  if (!env.AI) {
    return Response.json({ message: "AI binding is missing" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { question, top_k, min_similarity } = body;

  if (!question) {
    return Response.json({ message: "question is required" }, { status: 422 });
  }

  const API_BASE = ((env.VITE_API_URL || 'https://api.newnonmun.com').replace(/\/$/, '')) + '/api';

  try {
    const embeddingResult = await env.AI.run(EMBED_MODEL, {
      text: [question],
    });

    if (!embeddingResult?.data?.[0]) {
      return Response.json({ message: "Embedding failed", raw: embeddingResult }, { status: 500 });
    }

    const embedding = embeddingResult.data[0];

    const authHeader = request.headers.get('Authorization');

    const backendRes = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; NewnonmunSEO/1.0)',
        'Referer': 'https://newnonmun-front.pages.dev/',
        'Origin': 'https://newnonmun-front.pages.dev',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify({ question, embedding, top_k, min_similarity }),
    });

    const contentType = backendRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await backendRes.text();
      return Response.json({ message: "Backend non-JSON response", status: backendRes.status, body: text.slice(0, 300) }, { status: 502 });
    }

    const data = await backendRes.json();
    return Response.json(data, { status: backendRes.status });
  } catch (err) {
    return Response.json({ message: "Vector ask failed", error: String(err) }, { status: 500 });
  }
}

async function handleVectorUpsert(request, env) {
  if (!env.AI) {
    return Response.json({ message: "AI binding is missing" }, { status: 500 });
  }

  if (!env.VECTORIZE) {
    return Response.json({ message: "VECTORIZE binding is missing" }, { status: 500 });
  }

  const auth = request.headers.get("Authorization");

  if (auth !== `Bearer ${env.VECTOR_TOKEN}`) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;

  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const papers = body.papers || [];

  if (!Array.isArray(papers) || papers.length === 0) {
    return Response.json({ message: "papers is required" }, { status: 422 });
  }

  if (papers.length > 20) {
    return Response.json(
      { message: "테스트는 한 번에 20개 이하로 보내세요." },
      { status: 422 }
    );
  }

  const validPapers = papers.filter((paper) => {
    return paper && paper.id && paper.title;
  });

  if (validPapers.length === 0) {
    return Response.json(
      { message: "id와 title이 있는 논문이 필요합니다." },
      { status: 422 }
    );
  }

  const texts = validPapers.map((paper) => {
    return [
      `제목: ${paper.title || ""}`,
      `영문제목: ${paper.title_en || ""}`,
      `초록: ${paper.abstract || ""}`,
      `영문초록: ${paper.abstract_en || ""}`,
      `키워드: ${Array.isArray(paper.keywords) ? paper.keywords.join(", ") : (paper.keywords || "")}`,
      `영문키워드: ${Array.isArray(paper.keywords_en) ? paper.keywords_en.join(", ") : (paper.keywords_en || "")}`,
      `학술지: ${paper.journal || paper.venue?.name || ""}`,
      `연도: ${paper.year || paper.published_at || ""}`,
      `분야: ${paper.category || ""}`,
    ].join("\n");
  });

  try {
    const embeddingResult = await env.AI.run(EMBED_MODEL, {
      text: texts,
    });

    if (!embeddingResult?.data || !Array.isArray(embeddingResult.data)) {
      return Response.json(
        {
          message: "Embedding failed",
          raw: embeddingResult,
        },
        { status: 500 }
      );
    }

    const vectors = validPapers.map((paper, index) => {
      const journal = paper.journal || paper.venue?.name || "";
      const year = paper.year || (paper.published_at ? String(paper.published_at).slice(0, 4) : "");

      return {
        id: String(paper.id),
        values: embeddingResult.data[index],
        metadata: {
          paper_id: String(paper.id),
          title: String(paper.title || "").slice(0, 200),
          journal: String(journal || "").slice(0, 100),
          year: year ? Number(year) : undefined,
          category: String(paper.category || "").slice(0, 100),
        },
      };
    });

    await env.VECTORIZE.upsert(vectors);

    return Response.json({
      ok: true,
      model: EMBED_MODEL,
      count: vectors.length,
      ids: vectors.map((v) => v.id),
    });
  } catch (err) {
    return Response.json(
      {
        message: "Vector upsert failed",
        error: String(err),
      },
      { status: 500 }
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // ── Vectorize 임베딩 저장 테스트 엔드포인트 ─────────────────────
    if (pathname === "/vector/upsert" && request.method === "POST") {
      return handleVectorUpsert(request, env);
    }

    // ── AI 분석: 질의 임베딩 후 백엔드 프록시 ────────────────────────
    if (pathname === "/api/ai/ask" && request.method === "POST") {
      return handleVectorAsk(request, env);
    }

    const API_BASE = ((env.VITE_API_URL || 'https://api.newnonmun.com').replace(/\/$/, '')) + '/api';

    // ── 디버그 엔드포인트: /__debug__/:paperId ─────────────────────
    if (pathname.startsWith('/__debug__/')) {
      const id = pathname.replace('/__debug__/', '');
      try {
        const res = await fetch(`${API_BASE}/papers/${id}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; NewnonmunSEO/1.0)',
            'Referer': 'https://newnonmun-front.pages.dev/',
            'Origin': 'https://newnonmun-front.pages.dev',
          },
        });

        const body = await res.text();

        return new Response(
          JSON.stringify({ status: res.status, ok: res.ok, body: body.slice(0, 500) }, null, 2),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }, null, 2), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ── 논문 상세 페이지 감지 ─────────────────────────────────────
    const segments = pathname.split('/').filter(Boolean);
    const isPaperDetail =
      segments[0] === 'papers' &&
      (segments.length === 2 || segments.length === 5);

    if (isPaperDetail) {
      const id = segments[segments.length - 1];
      console.log(`[worker] paper detail: ${id}`);

      let html = null;

      try {
        const htmlRes = await env.ASSETS.fetch(new URL('/index.html', url).toString());
        if (htmlRes.ok) html = await htmlRes.text();
      } catch (e) {
        console.error('[worker] index.html fetch 실패:', e);
      }

      if (html) {
        try {
          const paperRes = await fetch(`${API_BASE}/papers/${id}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; NewnonmunSEO/1.0)',
              'Referer': 'https://newnonmun-front.pages.dev/',
              'Origin': 'https://newnonmun-front.pages.dev',
            },
          });

          console.log(`[worker] API status: ${paperRes.status}`);

          if (paperRes.ok) {
            const paper = await paperRes.json();
            html = injectMeta(html, paper, url.href);
            console.log(`[worker] 메타 주입 완료: ${paper.title}`);

            return new Response(html, {
              headers: {
                'Content-Type': 'text/html;charset=UTF-8',
                'X-Worker': 'meta-injected',
              },
            });
          } else {
            console.warn(`[worker] API 비정상 응답: ${paperRes.status}`);
          }
        } catch (err) {
          console.error('[worker] API 요청 실패:', err);
        }

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'X-Worker': 'api-failed-fallback',
          },
        });
      }
    }

    // ── 정적 파일 서빙 ───────────────────────────────────────────
    const response = await env.ASSETS.fetch(request);

    if (response.status === 404) {
      return env.ASSETS.fetch(new URL('/index.html', url).toString());
    }

    return response;
  },
};