# P1 prototype checks. Usage (from prototype-3d):  uv run --no-project --offline --with playwright python tools/check.py
# Edge (installed channel) over file://, software WebGL like design-p0/shoot.py. Writes shots/*.png and shots/check.json.
import json, pathlib, sys
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent.parent
page_uri = (here / "index.html").as_uri()
SIZES = [(1920, 1080), (1440, 900), (1366, 768), (1024, 768), (768, 1024), (390, 844)]
AUDIT = """() => {
  const R = e => { const r = e.getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; };
  const ov = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const inV = r => r.x >= -0.5 && r.y >= -0.5 && r.x+r.w <= innerWidth+0.5 && r.y+r.h <= innerHeight+0.5;
  const smalls = [...document.querySelectorAll('.small')].filter(e => !e.hidden).map(e => ({i:+e.dataset.i, r:R(e)}));
  const card = R(document.getElementById('active')), dock = R(document.getElementById('dock')), hdr = R(document.querySelector('header'));
  const intro = [...document.getElementById('intro').children].filter(e => getComputedStyle(e).display !== 'none').flatMap(e => { const rg = document.createRange(); rg.selectNodeContents(e); return [...rg.getClientRects()].map(r => ({x:r.left,y:r.top,w:r.width,h:r.height})); });
  const problems = [];
  smalls.forEach((s,k) => { if (!inV(s.r)) problems.push(`card ${s.i} outside viewport`);
    if (ov(s.r, card)) problems.push(`card ${s.i} over active card`); if (ov(s.r, dock)) problems.push(`card ${s.i} over dock`); if (ov(s.r, hdr)) problems.push(`card ${s.i} over header`);
    intro.forEach(t => { if (ov(s.r, t)) problems.push(`card ${s.i} over intro text`); });
    smalls.slice(k+1).forEach(o => { if (ov(s.r, o.r)) problems.push(`cards ${s.i}/${o.i} overlap`); }); });
  if (!inV(card)) problems.push('active card outside viewport'); if (ov(card, dock)) problems.push('active card over dock');
  intro.forEach(t => { if (ov(card, t)) problems.push('active card over intro'); });
  [...document.querySelectorAll('.dock button')].forEach(b => { if (!inV(R(b))) problems.push('dock button outside viewport: ' + b.textContent.trim()); });
  const docW = document.documentElement.scrollWidth;
  if (docW > innerWidth + 1) problems.push('horizontal overflow ' + docW);
  return { visibleSmall: smalls.map(s => s.i), anchors: document.querySelectorAll('#leaders circle').length, problems,
           state: window.__dna.state(), gl: (() => { const c = document.getElementById('gl').getContext('webgl2') || document.getElementById('gl').getContext('webgl'); const d = c && c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; })() };
}"""

out = {"sizes": {}, "selection": {}, "errors": {}}
with sync_playwright() as p:
    br = p.chromium.launch(channel="msedge", args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-smooth-scrolling"])
    for w, h in SIZES:
        pg = br.new_page(viewport={"width": w, "height": h}, device_scale_factor=2 if w < 500 else 1)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        pg.goto(page_uri + "#a=2&still=1"); pg.wait_for_function("window.__ready===true", timeout=60000); pg.wait_for_timeout(900)
        pg.screenshot(path=str(here / "shots" / f"{w}x{h}.png"))
        a = pg.evaluate(AUDIT)
        # motion-on view of the same size, mid-breath
        pg.goto(page_uri + "#a=2"); pg.reload(); pg.wait_for_function("window.__ready===true", timeout=60000); pg.wait_for_timeout(1500)
        pg.screenshot(path=str(here / "shots" / f"{w}x{h}-motion.png"))
        b = pg.evaluate(AUDIT)
        out["sizes"][f"{w}x{h}"] = {"still": a, "motion": b}; out["errors"][f"{w}x{h}"] = errs + pg.evaluate("window.__dnaErrors")
        print(f"{w}x{h}", "errors:", out["errors"][f"{w}x{h}"], "problems:", a["problems"] + b["problems"], "small:", a["visibleSmall"], b["visibleSmall"], a["gl"][:40])
        pg.close()

    # first and last artwork selected (callouts on the other side of the travel range)
    out["ends"] = {}
    for w, h in [(1366, 768), (390, 844)]:
        for a in [0, 5]:
            pg = br.new_page(viewport={"width": w, "height": h}, device_scale_factor=2 if w < 500 else 1); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
            pg.goto(page_uri + f"#a={a}&still=1"); pg.wait_for_function("window.__ready===true", timeout=60000); pg.wait_for_timeout(900)
            pg.screenshot(path=str(here / "shots" / f"{w}x{h}-a{a + 1:02d}.png")); r = pg.evaluate(AUDIT)
            out["ends"][f"{w}x{h}-a{a}"] = {"problems": r["problems"], "visibleSmall": r["visibleSmall"], "errors": errs}
            print(f"{w}x{h} a={a}", "errors:", errs, "problems:", r["problems"], "small:", r["visibleSmall"]); pg.close()

    # selection across all six at 1366x768: real wheel input, then the picker
    pg = br.new_page(viewport={"width": 1366, "height": 768}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(page_uri); pg.wait_for_function("window.__ready===true", timeout=60000)
    step = pg.evaluate("window.__dna.state().step"); pg.mouse.move(900, 400)
    wheel = []
    for i in range(6):
        y0 = pg.evaluate("scrollY"); goal = i * step
        while abs(goal - pg.evaluate("scrollY")) > 1:
            d = goal - pg.evaluate("scrollY"); pg.mouse.wheel(0, max(-120, min(120, d))); pg.wait_for_timeout(16)
        pg.wait_for_timeout(1600)
        s = pg.evaluate("window.__dna.state()")
        wheel.append({"i": i, "active": s["active"], "cur": round(s["cur"], 4), "scrollY": s["scrollY"], "ok": s["active"] == i and abs(s["cur"] - i / 5) < 0.005 and not s["scrolling"]})
    # in-between positions: 0.4 and 0.6 of a step after artwork 2
    between = []
    for frac, want in [(0.4, 2), (0.6, 3)]:
        pg.evaluate(f"window.scrollTo(0,{round((2 + frac) * step)})"); pg.wait_for_timeout(1600)
        s = pg.evaluate("window.__dna.state()"); between.append({"frac": frac, "active": s["active"], "want": want, "ok": s["active"] == want and abs(s["cur"] - want / 5) < 0.005, "scrollY": s["scrollY"]})
    picker = []
    for i in [5, 0, 3, 1, 4, 2]:
        pg.click(f"#picker button:nth-child({i + 1})"); pg.wait_for_timeout(1400)
        s = pg.evaluate("window.__dna.state()"); focus = pg.evaluate("document.activeElement.id")
        picker.append({"i": i, "active": s["active"], "cur": round(s["cur"], 4), "scrollY": s["scrollY"], "focus": focus, "ok": s["active"] == i and abs(s["cur"] - i / 5) < 0.005 and s["scrollY"] == i * step and focus == "active"})
    # the animation never scrolls the page: 2.5 s of idle breathing
    y = pg.evaluate("scrollY"); pg.wait_for_timeout(2500); still_y = pg.evaluate("scrollY") == y
    # keyboard: ArrowRight from the active card
    pg.focus("#active"); pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(1000); kb = pg.evaluate("window.__dna.state().active")
    out["selection"] = {"wheel": wheel, "between": between, "picker": picker, "pageNotScrolledByAnimation": still_y, "arrowRightFrom2": kb, "errors": errs}
    print("wheel", [w_["ok"] for w_ in wheel], "between", [b_["ok"] for b_ in between], "picker", [p_["ok"] for p_ in picker], "idle-no-scroll", still_y, "arrow->", kb, "errors", errs)
    pg.close()

    # no WebGL -> static list
    br2 = p.chromium.launch(channel="msedge", args=["--disable-webgl", "--disable-3d-apis"])
    pg = br2.new_page(viewport={"width": 1366, "height": 768}); pg.goto(page_uri); pg.wait_for_timeout(800)
    out["noWebGL"] = pg.evaluate("({cls: document.body.className, links: [...document.querySelectorAll('#static a')].filter(a => a.offsetParent).length})")
    pg.screenshot(path=str(here / "shots" / "no-webgl-1366x768.png")); print("no-webgl", out["noWebGL"]); br2.close()
    br.close()
(here / "shots" / "check.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
