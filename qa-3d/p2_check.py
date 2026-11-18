# DNA Gallery 3D · P2 checks against a local production server (default http://127.0.0.1:3100, never the port-3000 preview).
# Usage (from dna-gallery):  uv run --no-project --offline --with playwright python qa-3d/p2_check.py [base_url] [--headed-fps]
# Writes qa-3d/shots/*.png and qa-3d/results.json. Edge (installed channel), GPU via ANGLE D3D11.
import json, pathlib, re, statistics as st, sys
from playwright.sync_api import sync_playwright

base = next((a for a in sys.argv[1:] if a.startswith("http")), "http://127.0.0.1:3100")
headed_fps = "--headed-fps" in sys.argv
here = pathlib.Path(__file__).resolve().parent
shots = here / "shots"; shots.mkdir(exist_ok=True)
SIZES = [(1920, 1080), (1440, 900), (1366, 768), (1280, 720), (1024, 768), (768, 1024), (390, 844), (360, 740)]
ARGS = ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--disable-smooth-scrolling"]
out = {"base": base, "errors": {}, "layout": {}, "selection": {}, "keyboard": {}, "pause": {}, "fallback": {}, "bundles": {}, "return": {}, "fps": None}

AUDIT = """() => {
  const R = e => { const r = e.getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; };
  const ov = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const inV = r => r.x >= -0.5 && r.y >= -0.5 && r.x+r.w <= innerWidth+0.5 && r.y+r.h <= innerHeight+0.5;
  const host = document.querySelector('.helix3d');
  const smalls = [...document.querySelectorAll('.h3d-small[data-show]')].map(e => ({i:+e.dataset.i, r:R(e)}));
  const card = R(document.querySelector('.h3d-active')), dock = R(document.querySelector('.h3d-dock')), hdr = R(document.querySelector('.site-header'));
  const lines = [...document.querySelectorAll('.h3d-intro .eyebrow, .h3d-intro h1, .h3d-intro .intro-copy')].filter(e => getComputedStyle(e).display !== 'none')
    .flatMap(e => { const rg = document.createRange(); rg.selectNodeContents(e); return [...rg.getClientRects()].map(r => ({x:r.left,y:r.top,w:r.width,h:r.height})); });
  const p = [];
  smalls.forEach((s,k) => { if (!inV(s.r)) p.push(`card ${s.i} outside viewport`);
    if (ov(s.r, card)) p.push(`card ${s.i} over active card`); if (ov(s.r, dock)) p.push(`card ${s.i} over dock`);
    if (hdr.y + hdr.h > 0 && ov(s.r, hdr)) p.push(`card ${s.i} over header`);
    lines.forEach(t => { if (ov(s.r, t)) p.push(`card ${s.i} over intro text`); });
    smalls.slice(k+1).forEach(o => { if (ov(s.r, o.r)) p.push(`cards ${s.i}/${o.i} overlap`); }); });
  if (!inV(card)) p.push('active card outside viewport'); if (ov(card, dock)) p.push('active card over dock');
  lines.forEach(t => { if (ov(card, t)) p.push('active card over intro'); });
  [...document.querySelectorAll('.h3d-dock button')].forEach(b => { if (!inV(R(b))) p.push('dock button outside viewport: ' + (b.getAttribute('aria-label')||'')); });
  if (document.documentElement.scrollWidth > innerWidth + 1) p.push('horizontal overflow ' + document.documentElement.scrollWidth);
  // phone: anchor dots over the intro text (leaders svg circles)
  const dots = [...document.querySelectorAll('.h3d-leaders circle')].map(c => ({x:+c.getAttribute('cx'), y:+c.getAttribute('cy')}));
  const fr = document.querySelector('.h3d-frame').getBoundingClientRect();
  dots.forEach(d => lines.forEach(t => { const x = d.x + fr.left, y = d.y + fr.top; if (x > t.x && x < t.x+t.w && y > t.y && y < t.y+t.h) p.push('anchor dot over intro text'); }));
  const scrim = document.querySelector('.h3d-scrim'); const scrimH = getComputedStyle(scrim).display === 'none' ? 0 : scrim.getBoundingClientRect().height;
  const h1 = document.querySelector('.h3d-intro h1').getBoundingClientRect();
  return { problems: p, active: +host.dataset.active, neighboursShown: smalls.map(s => s.i), scrimCoversHeadline: scrimH >= h1.bottom - fr.top,
           mode: host.dataset.mode, state: host.dataset.state };
}"""

def page_with_errors(br, w, h, **kw):
    ctx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=2 if w <= 600 else 1, **kw)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.on("response", lambda r: r.status >= 400 and errs.append(f"HTTP {r.status} {r.url}"))
    return ctx, pg, errs

def ready(pg):
    pg.wait_for_function("document.querySelector('.helix3d')?.dataset.state === '3d' && document.querySelector('.helix3d').dataset.progress !== undefined", timeout=60000)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(700)

with sync_playwright() as p:
    br = p.chromium.launch(channel="msedge", args=ARGS)
    # ---------- 1. layout: 8 sizes × 6 artworks, picker-driven ----------
    for w, h in SIZES:
        ctx, pg, errs = page_with_errors(br, w, h)
        pg.goto(base + "/gallery"); ready(pg)
        rows = []
        for i in range(6):
            pg.click(f".h3d-picker button:nth-child({i + 1})"); pg.wait_for_timeout(1300)
            a = pg.evaluate(AUDIT); a["want"] = i
            a["ok"] = a["active"] == i and not a["problems"] and len(a["neighboursShown"]) >= 1
            rows.append(a)
            if i in (0, 2, 5): pg.screenshot(path=str(shots / f"{w}x{h}-a{i + 1:02d}.png"))
        out["layout"][f"{w}x{h}"] = rows; out["errors"][f"layout {w}x{h}"] = errs
        print(f"{w}x{h}", "ok:", [r["ok"] for r in rows], "neighbours:", [r["neighboursShown"] for r in rows],
              "problems:", sorted({q for r in rows for q in r["problems"]}), "scrim:", rows[2]["scrimCoversHeadline"], "errors:", errs)
        ctx.close()

    # ---------- 2. selection by wheel, between positions, picker focus, Prev/Next focus, arrows, live region ----------
    ctx, pg, errs = page_with_errors(br, 1366, 768)
    pg.goto(base + "/gallery"); ready(pg)
    step = round(768 * 0.7); pg.mouse.move(900, 400); wheel = []
    for i in range(6):
        goal = i * step
        for _ in range(200):
            d = goal - pg.evaluate("scrollY")
            if abs(d) <= 1: break
            pg.mouse.wheel(0, max(-120, min(120, d))); pg.wait_for_timeout(16)
        pg.wait_for_timeout(1500)
        s = pg.evaluate("({a: +document.querySelector('.helix3d').dataset.active, p: +document.querySelector('.helix3d').dataset.progress, y: scrollY})")
        wheel.append({"i": i, **s, "ok": s["a"] == i and abs(s["p"] - i / 5) < 0.005})
    between = []
    for frac, want in [(0.4, 2), (0.6, 3)]:
        pg.evaluate(f"window.scrollTo(0,{round((2 + frac) * step)})"); pg.wait_for_timeout(1500)
        s = pg.evaluate("({a: +document.querySelector('.helix3d').dataset.active, p: +document.querySelector('.helix3d').dataset.progress})")
        between.append({"frac": frac, "want": want, **s, "ok": s["a"] == want and abs(s["p"] - want / 5) < 0.005})
    picker = []
    for i in [5, 0, 3, 1, 4, 2]:
        pg.click(f".h3d-picker button:nth-child({i + 1})"); pg.wait_for_timeout(1200)
        s = pg.evaluate("""({a: +document.querySelector('.helix3d').dataset.active, p: +document.querySelector('.helix3d').dataset.progress, y: scrollY,
            focus: document.activeElement.getAttribute('aria-label'), live: document.querySelector('.h3d-live').textContent,
            current: [...document.querySelectorAll('.h3d-picker button')].map(b => b.getAttribute('aria-current'))})""")
        picker.append({"i": i, **s, "ok": s["a"] == i and abs(s["p"] - i / 5) < 0.005 and s["y"] == i * step and s["focus"] and s["focus"].startswith(f"{i + 1:02d} ") and s["current"].count("true") == 1})
    pg.focus(".h3d-next"); pg.keyboard.press("Enter"); pg.wait_for_timeout(1100)
    nxt = pg.evaluate("({a: +document.querySelector('.helix3d').dataset.active, focus: document.activeElement.getAttribute('aria-label'), live: document.querySelector('.h3d-live').textContent})")
    pg.focus(".h3d-prev"); pg.keyboard.press("Enter"); pg.wait_for_timeout(1100)
    prv = pg.evaluate("({a: +document.querySelector('.helix3d').dataset.active, focus: document.activeElement.getAttribute('aria-label')})")
    pg.focus(".h3d-active"); pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(1100)
    arrow = pg.evaluate("+document.querySelector('.helix3d').dataset.active")
    y0 = pg.evaluate("scrollY"); pg.wait_for_timeout(2500); idle_still = pg.evaluate("scrollY") == y0
    out["selection"] = {"wheel": wheel, "between": between, "picker": picker, "next": nxt, "prev": prv, "arrowRightFrom2": arrow, "pageNotScrolledByAnimation": idle_still}
    out["errors"]["selection"] = errs
    print("wheel", [x["ok"] for x in wheel], "between", [x["ok"] for x in between], "picker", [x["ok"] for x in picker], "next", nxt, "prev", prv, "arrow", arrow, "idle-still", idle_still, "errors", errs)

    # ---------- 3. Tab order and focusable neighbour cards ----------
    pg.goto(base + "/gallery"); ready(pg); pg.evaluate("document.activeElement.blur(); window.scrollTo(0,0)"); seq = []
    for _ in range(16):
        pg.keyboard.press("Tab")
        seq.append(pg.evaluate("(() => { const a = document.activeElement; return (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\\s+/g,' ').slice(0,40); })()"))
    focusable_smalls = pg.evaluate("[...document.querySelectorAll('.h3d-small')].filter(b => b.tabIndex >= 0 || b.getAttribute('aria-hidden') === 'false').length")
    smalls_hidden = pg.evaluate("document.querySelector('.h3d-smalls').getAttribute('aria-hidden')")
    picker_names = pg.evaluate("[...document.querySelectorAll('.h3d-picker button')].map(b => [b.getAttribute('aria-label'), b.title])")
    out["keyboard"] = {"tabSequence": seq, "focusableNeighbourCards": focusable_smalls, "smallsAriaHidden": smalls_hidden, "pickerNames": picker_names}
    print("tab:", seq); print("focusable neighbour cards:", focusable_smalls, "picker names:", picker_names[2])

    # ---------- 4. return context: active card → detail → Back; fragment ----------
    pg.click(".h3d-picker button:nth-child(4)"); pg.wait_for_timeout(1200)
    pg.click(".h3d-active"); pg.wait_for_url(re.compile(r"/artwork/little-waves\?layout=helix")); pg.wait_for_timeout(500)
    back_href = pg.get_attribute("a.back-link", "href")
    pg.go_back(); ready(pg); pg.wait_for_timeout(600)
    ret = pg.evaluate("({a: +document.querySelector('.helix3d').dataset.active, focus: document.activeElement.className, p: +document.querySelector('.helix3d').dataset.progress})")
    pg.goto(base + "/gallery#artwork-sample-005"); ready(pg); pg.wait_for_timeout(600)
    frag = pg.evaluate("({a: +document.querySelector('.helix3d').dataset.active, focus: document.activeElement.className})")
    pg.goto(base + back_href); ready(pg); pg.wait_for_timeout(600)
    backlink = pg.evaluate("+document.querySelector('.helix3d').dataset.active")
    out["return"] = {"history": ret, "fragment005": frag, "detailBackLink": back_href, "backLinkActive": backlink}
    out["errors"]["return"] = errs
    print("return:", out["return"]); ctx.close()

    # ---------- 5. Pause / Resume, and OS reduced motion ----------
    ctx, pg, errs = page_with_errors(br, 1440, 900)
    pg.goto(base + "/gallery"); ready(pg)
    st_ = lambda: pg.evaluate("(() => { const b = document.querySelector('.h3d-pause'); return {text: b.textContent.trim(), aria: b.getAttribute('aria-label'), title: b.title, motion: b.dataset.motion, pressed: b.getAttribute('aria-pressed'), icon: b.querySelector('svg path') ? 'play' : 'bars'}; })()")
    a = st_(); pg.click(".h3d-pause"); pg.wait_for_timeout(300); b = st_()
    pg.screenshot(path=str(shots / "1440x900-paused.png"))
    pg.reload(); ready(pg); c = st_()
    ctx.close()
    ctx, pg, errs2 = page_with_errors(br, 1440, 900, reduced_motion="reduce")
    pg.goto(base + "/gallery"); ready(pg); d = st_(); pg.click(".h3d-pause"); pg.wait_for_timeout(300); e = st_(); pg.reload(); ready(pg); f = st_()
    out["pause"] = {"start": a, "afterPress": b, "afterReloadSameSession": c, "reducedStart": d, "reducedAfterPress": e, "reducedAfterReload": f}
    out["errors"]["pause"] = errs + errs2
    print("pause:", json.dumps(out["pause"])); ctx.close()

    # ---------- 6. which pages load three.js ----------
    for path in ["/gallery", "/helix", "/grid", "/info", "/connections", "/saved", "/artwork/daylight?layout=helix"]:
        ctx, pg, errs = page_with_errors(br, 1366, 768); hits = []
        def on_resp(r, hits=hits):
            if r.url.endswith(".js") and "/_next/" in r.url:
                try:
                    if "WebGLRenderer" in r.text() and "MeshPhysicalMaterial" in r.text(): hits.append(r.url.rsplit("/", 1)[-1])
                except Exception: pass
        pg.on("response", on_resp); pg.goto(base + path); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(800)
        out["bundles"][path] = {"threeChunks": hits, "errors": errs}; print("three.js on", path, ":", bool(hits), errs); ctx.close()
    br.close()

    # ---------- 7. fallbacks: no WebGL, no JavaScript ----------
    br2 = p.chromium.launch(channel="msedge", args=["--disable-webgl", "--disable-3d-apis"])
    ctx, pg, errs = page_with_errors(br2, 1366, 768); pg.goto(base + "/gallery"); pg.wait_for_timeout(1500)
    nowebgl = pg.evaluate("({state: document.querySelector('.helix3d').dataset.state, links: [...document.querySelectorAll('.h3d-static a.artwork-link')].filter(a => a.offsetParent).length, canvas: !!document.querySelector('.h3d-canvas')})")
    pg.screenshot(path=str(shots / "no-webgl-1366x768.png"), full_page=True); ctx.close(); br2.close()
    # real JavaScript-off browser (Blink setting; Playwright's java_script_enabled still reports scripting: enabled)
    # real JavaScript-off browser (Blink setting; Playwright's java_script_enabled still reports scripting: enabled)
    br3 = p.chromium.launch(channel="msedge", args=["--blink-settings=scriptEnabled=false"])
    pg = br3.new_page(viewport={"width": 1366, "height": 768}); nojs = {}
    NOJS = """() => { const vis = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
      const main = document.querySelector('main'), foot = document.querySelector('.site-footer'), h1 = document.querySelector('main h1');
      const mainBox = main.getBoundingClientRect(), footTop = foot.getBoundingClientRect().top + scrollY;
      const links = [...document.querySelectorAll('main a.artwork-link')].filter(vis);
      const detailLinks = [...document.querySelectorAll('main a[href^="/artwork/"]')].filter(vis);
      const hiddenStream = !!document.querySelector('div[hidden][id^="S:"]');
      const loading = [...document.querySelectorAll('body *')].some(e => e.childElementCount === 0 && /Gathering the collection/.test(e.textContent) && vis(e));
      const below = [...document.querySelectorAll('main *')].filter(vis).filter(e => !(e.closest('details:not([open])') && !e.closest('summary'))).every(e => e.getBoundingClientRect().top + scrollY < footTop + 1);
      return { h1: h1 ? h1.textContent.trim().slice(0, 40) : null, h1Visible: vis(h1), mainHeight: Math.round(mainBox.height), artworkLinks: links.length, detailLinks: detailLinks.length,
               loadingText: loading, hiddenStream, contentAboveFooter: below, img: [...document.querySelectorAll('main img')].filter(vis).length }; }"""
    routes = ["/gallery", "/helix", "/grid", "/connections", "/saved", "/info", "/artwork/daylight?layout=helix"]
    for i, path in enumerate(routes):
        pg.goto(base + path); pg.wait_for_timeout(500)
        r = pg.evaluate(NOJS)
        need_links = 6 if path in ("/gallery", "/helix", "/grid") else 0
        r["ok"] = bool(r["h1Visible"]) and not r["loadingText"] and not r["hiddenStream"] and r["contentAboveFooter"] and r["mainHeight"] > 200 and r["artworkLinks"] >= need_links
        nojs[path] = r
        pg.screenshot(path=str(shots / f"no-js-{path.strip('/').split('?')[0].replace('/', '-') or 'home'}-1366x768.png"), full_page=True)
    br3.close()
    out["fallback"] = {"noWebGL": nowebgl, "noWebGLErrors": errs, "noJS": nojs}
    print("no-webgl:", nowebgl, errs)
    for k, v in nojs.items(): print("no-js", k, "ok" if v["ok"] else "FAIL", v)

    # ---------- 7b. M1 look: still pose at 1440x900, artwork 03, side by side with the approved mockup ----------
    br5 = p.chromium.launch(channel="msedge", args=ARGS)
    ctx, pg, errs5 = page_with_errors(br5, 1440, 900, reduced_motion="reduce")
    pg.goto(base + "/gallery#artwork-sample-003"); ready(pg); pg.wait_for_timeout(800)
    pg.evaluate("document.activeElement.blur()"); pg.wait_for_timeout(200)
    p2 = shots / "p2fix-1440x900-a03-still.png"; pg.screenshot(path=str(p2)); ctx.close()
    mock = (here.parent / "design-p0" / "recommended-ribbon-droplets-1440x900.png").as_uri()
    page_html = f"""<html><body style="margin:0;background:#fff6d7;font:600 22px Segoe UI,sans-serif;color:#2d2333">
      <div style="display:flex;gap:16px;padding:16px"><figure style="margin:0"><figcaption style="margin-bottom:8px">Approved P0 mockup (recommended-ribbon-droplets)</figcaption><img src="{mock}" width="1440" height="900"></figure>
      <figure style="margin:0"><figcaption style="margin-bottom:8px">P2 fix round, three r187, artwork 03, still pose</figcaption><img src="{p2.as_uri()}" width="1440" height="900"></figure></div></body></html>"""
    cmp_file = here / "look-compare.html"; cmp_file.write_text(page_html, encoding="utf-8")
    pg = br5.new_page(viewport={"width": 2928, "height": 970})
    pg.goto(cmp_file.as_uri()); pg.wait_for_timeout(500); pg.screenshot(path=str(shots / "look-compare-mockup-vs-p2fix-1440x900.png")); br5.close(); cmp_file.unlink()
    out["errors"]["look"] = errs5; print("look compare written", errs5)

    # ---------- 8. frame rate in a visible window (real GPU, display vsync) ----------
    if headed_fps:
        br4 = p.chromium.launch(channel="msedge", headless=False, args=["--use-angle=d3d11", "--disable-smooth-scrolling"])
        ctx = br4.new_context(viewport={"width": 1366, "height": 768})
        # test-only probe: timestamps of animation frames in which WebGL drew (no hook in the app code)
        ctx.add_init_script("""(() => { window.__draws = []; let mark = -1;
          const wrap = (proto) => { for (const n of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) { const f = proto[n]; if (!f) continue;
            proto[n] = function(...a) { const t = performance.now(); if (t - mark > 4) { window.__draws.push(t); mark = t; } return f.apply(this, a); }; } };
          if (window.WebGL2RenderingContext) wrap(WebGL2RenderingContext.prototype); if (window.WebGLRenderingContext) wrap(WebGLRenderingContext.prototype); })();""")
        pg = ctx.new_page(); pg.goto(base + "/gallery"); ready(pg); pg.mouse.move(900, 400)
        gpu = pg.evaluate("(() => { const c = document.createElement('canvas').getContext('webgl'); const d = c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; })()")
        raf = pg.evaluate("new Promise(r => { const t = []; let l = 0; (function f(n) { if (l) t.push(n - l); l = n; if (t.length < 120) requestAnimationFrame(f); else r(t); })(performance.now()); })")
        def intervals(js_from):
            d = pg.evaluate(f"window.__draws.filter(t => t >= {js_from})"); return [b - a for a, b in zip(d, d[1:])]
        t0 = pg.evaluate("performance.now()")
        for _ in range(2):
            for d in [40] * 60 + [-40] * 60: pg.mouse.wheel(0, d); pg.wait_for_timeout(16)
        travel = intervals(t0); pg.wait_for_timeout(1500)
        t1 = pg.evaluate("performance.now()")
        for i in [5, 1, 4, 0]: pg.click(f".h3d-picker button:nth-child({i + 1})"); pg.wait_for_timeout(900)
        flights = intervals(t1)
        t2 = pg.evaluate("performance.now()"); pg.wait_for_timeout(4000); breathing = intervals(t2)
        def summ(xs):
            xs = sorted(x for x in xs if x < 250)   # drop pauses between gestures
            if not xs: return None
            q = lambda f: xs[min(len(xs) - 1, int(f * len(xs)))]
            return {"n": len(xs), "median_ms": round(st.median(xs), 2), "p95_ms": round(q(0.95), 2), "max_ms": round(xs[-1], 2), "fps_median": round(1000 / st.median(xs), 1),
                    "share_over_20ms": round(sum(1 for x in xs if x > 20) / len(xs), 3)}
        out["fps"] = {"gpu": gpu, "visibleWindow": True, "rAF": summ(raf), "travel": summ(travel), "flights": summ(flights), "breathing": summ(breathing)}
        print("fps:", json.dumps(out["fps"])); br4.close()

(here / "results.json").write_text(json.dumps(out, indent=1), encoding="utf-8")