var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-9ltvaR/bundledWorker-0.9799639144457777.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var API_BASE = "http://125.129.246.231/api";
function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escapeAttr, "escapeAttr");
__name2(escapeAttr, "escapeAttr");
function buildJsonLd(paper, pageUrl) {
  const authorList = Array.isArray(paper.authors) ? paper.authors.map((a) => ({ "@type": "Person", name: typeof a === "string" ? a : a.name || "" })) : [];
  const obj = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    name: paper.title || "",
    headline: paper.title || "",
    url: pageUrl,
    author: authorList
  };
  if (paper.title_en) obj.alternativeHeadline = paper.title_en;
  if (paper.abstract) obj.abstract = paper.abstract;
  if (paper.abstract_en && !paper.abstract) obj.abstract = paper.abstract_en;
  if (paper.published_at) obj.datePublished = paper.published_at;
  if (paper.doi) obj.sameAs = `https://doi.org/${paper.doi}`;
  const kw = [...Array.isArray(paper.keywords) ? paper.keywords : [], ...Array.isArray(paper.keywords_en) ? paper.keywords_en : []];
  if (kw.length > 0) obj.keywords = kw.join(", ");
  if (paper.venue?.name) {
    const periodical = { "@type": "Periodical", name: paper.venue.name };
    if (paper.issue) {
      const vol = paper.issue.volume ? String(paper.issue.volume) : null;
      const num = paper.issue.number ? String(paper.issue.number) : null;
      const issuePart = { "@type": "PublicationIssue", isPartOf: periodical };
      if (vol) issuePart.volumeNumber = vol;
      if (num) issuePart.issueNumber = num;
      obj.isPartOf = issuePart;
    } else {
      obj.isPartOf = periodical;
    }
  }
  if (paper.provider?.name) {
    obj.publisher = { "@type": "Organization", name: paper.provider.name };
    if (paper.provider.website_url) obj.publisher.url = paper.provider.website_url;
  }
  if (paper.page_start) obj.pageStart = paper.page_start;
  if (paper.page_end) obj.pageEnd = paper.page_end;
  const toc = paper.table_of_contents || paper.body_content || null;
  if (toc) obj.tableOfContents = toc;
  if (Array.isArray(paper.references) && paper.references.length > 0) {
    obj.citation = paper.references.map((ref) => {
      const text = typeof ref === "string" ? ref : ref.raw_text || ref.text || "";
      return { "@type": "CreativeWork", description: text };
    });
  }
  return JSON.stringify(obj).replace(/<\/script>/gi, "<\\/script>");
}
__name(buildJsonLd, "buildJsonLd");
__name2(buildJsonLd, "buildJsonLd");
function injectMeta(html, paper, pageUrl) {
  const title = paper.title || "\uB17C\uBB38";
  const safeTitle = escapeAttr(title);
  const abstractText = (paper.abstract || paper.abstract_en || "").slice(0, 200);
  const safeDesc = escapeAttr(abstractText);
  const safeUrl = escapeAttr(pageUrl);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle} - \uB274\uB17C\uBB38</title>`);
  html = html.replace(/<meta name="description"[^>]*\/?>/, `<meta name="description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${safeTitle}" />`);
  html = html.replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:type"[^>]*\/?>/, `<meta property="og:type" content="article" />`);
  html = html.replace(/<meta property="og:url"[^>]*\/?>/, `<meta property="og:url" content="${safeUrl}" />`);
  html = html.replace(/<meta name="twitter:title"[^>]*\/?>/, `<meta name="twitter:title" content="${safeTitle}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${safeDesc}" />`);
  let extra = "";
  const authorNames = Array.isArray(paper.authors) ? paper.authors.map((a) => typeof a === "string" ? a : a.name).filter(Boolean) : [];
  if (authorNames.length > 0) {
    extra += `  <meta name="author" content="${escapeAttr(authorNames.join(", "))}" />
`;
    for (const name of authorNames) {
      extra += `  <meta name="citation_author" content="${escapeAttr(name)}" />
`;
    }
  }
  if (paper.doi) {
    extra += `  <link rel="canonical" href="https://doi.org/${escapeAttr(paper.doi)}" />
`;
    extra += `  <meta name="citation_doi" content="${escapeAttr(paper.doi)}" />
`;
  }
  const kw = [...Array.isArray(paper.keywords) ? paper.keywords : [], ...Array.isArray(paper.keywords_en) ? paper.keywords_en : []];
  if (kw.length > 0) extra += `  <meta name="keywords" content="${escapeAttr(kw.join(", "))}" />
`;
  if (paper.venue?.name) extra += `  <meta name="citation_journal_title" content="${escapeAttr(paper.venue.name)}" />
`;
  if (paper.provider?.name) extra += `  <meta name="citation_publisher" content="${escapeAttr(paper.provider.name)}" />
`;
  if (paper.published_at) extra += `  <meta name="citation_publication_date" content="${escapeAttr(paper.published_at.slice(0, 10))}" />
`;
  if (paper.published_at) extra += `  <meta name="article:published_time" content="${escapeAttr(paper.published_at)}" />
`;
  if (paper.issue?.volume) extra += `  <meta name="citation_volume" content="${escapeAttr(String(paper.issue.volume))}" />
`;
  if (paper.issue?.number) extra += `  <meta name="citation_issue" content="${escapeAttr(String(paper.issue.number))}" />
`;
  if (paper.page_start) extra += `  <meta name="citation_firstpage" content="${escapeAttr(String(paper.page_start))}" />
`;
  if (paper.page_end) extra += `  <meta name="citation_lastpage" content="${escapeAttr(String(paper.page_end))}" />
`;
  extra += `  <script type="application/ld+json">${buildJsonLd(paper, pageUrl)}<\/script>
`;
  if (extra) html = html.replace("</head>", extra + "</head>");
  return html;
}
__name(injectMeta, "injectMeta");
__name2(injectMeta, "injectMeta");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname.startsWith("/__debug__/")) {
      const id = pathname.replace("/__debug__/", "");
      try {
        const res = await fetch(`${API_BASE}/papers/${id}`);
        const body = await res.text();
        return new Response(
          JSON.stringify({ status: res.status, ok: res.ok, body: body.slice(0, 500) }, null, 2),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }, null, 2), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    const segments = pathname.split("/").filter(Boolean);
    const isPaperDetail = segments[0] === "papers" && (segments.length === 2 || segments.length === 5);
    if (isPaperDetail) {
      const id = segments[segments.length - 1];
      console.log(`[worker] paper detail: ${id}`);
      let html = null;
      try {
        const htmlRes = await env.ASSETS.fetch(new URL("/index.html", url).toString());
        if (htmlRes.ok) html = await htmlRes.text();
      } catch (e) {
        console.error("[worker] index.html fetch \uC2E4\uD328:", e);
      }
      if (html) {
        try {
          const paperRes = await fetch(`${API_BASE}/papers/${id}`);
          console.log(`[worker] API status: ${paperRes.status}`);
          if (paperRes.ok) {
            const paper = await paperRes.json();
            html = injectMeta(html, paper, url.href);
            console.log(`[worker] \uBA54\uD0C0 \uC8FC\uC785 \uC644\uB8CC: ${paper.title}`);
            return new Response(html, {
              headers: { "Content-Type": "text/html;charset=UTF-8", "X-Worker": "meta-injected" }
            });
          } else {
            console.warn(`[worker] API \uBE44\uC815\uC0C1 \uC751\uB2F5: ${paperRes.status}`);
          }
        } catch (err) {
          console.error("[worker] API \uC694\uCCAD \uC2E4\uD328:", err);
        }
        return new Response(html, {
          headers: { "Content-Type": "text/html;charset=UTF-8", "X-Worker": "api-failed-fallback" }
        });
      }
    }
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return env.ASSETS.fetch(new URL("/index.html", url).toString());
    }
    return response;
  }
};
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-ebMz5g/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-ebMz5g/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=bundledWorker-0.9799639144457777.js.map
