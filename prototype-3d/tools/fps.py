# Frame-rate measurement at 1366x768 over file:// in Edge on the real GPU (ANGLE D3D11).
# Usage (from prototype-3d):  uv run --no-project --offline --with playwright python tools/fps.py [headed]
# Reports: the GPU string, rAF rate, render intervals while travelling (wheel scroll + picker flights) and while
# breathing, and the JS cost per rendered frame and per geometry update.
import json, pathlib, statistics as st, sys
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent.parent
uri = (here / "index.html").as_uri()
headed = len(sys.argv) > 1 and sys.argv[1] == "headed"

def summary(xs):
    if not xs: return None
    xs = sorted(xs); p = lambda q: xs[min(len(xs) - 1, int(q * len(xs)))]
    return {"n": len(xs), "median_ms": round(st.median(xs), 2), "p95_ms": round(p(0.95), 2), "max_ms": round(xs[-1], 2), "fps_median": round(1000 / max(st.median(xs), 1e-3), 1)}

with sync_playwright() as p:
    br = p.chromium.launch(channel="msedge", headless=not headed,
                           args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--disable-smooth-scrolling"])
    pg = br.new_page(viewport={"width": 1366, "height": 768}, device_scale_factor=1)
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(uri + "#a=0"); pg.wait_for_function("window.__ready===true", timeout=60000); pg.wait_for_timeout(800)
    gl = pg.evaluate("(() => { const c = document.getElementById('gl'); const x = c.getContext('webgl2') || c.getContext('webgl'); const d = x.getExtension('WEBGL_debug_renderer_info'); return d ? x.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; })()")
    raf = pg.evaluate("new Promise(r => { const t = []; let last = 0; (function f(n) { if (last) t.push(n - last); last = n; if (t.length < 180) requestAnimationFrame(f); else r(t); })(performance.now()); })")
    # breathing (idle) for 4 s
    pg.evaluate("window.__perf.breathing.length = 0; window.__perf.cost.length = 0; window.__perf.geomCost.length = 0"); pg.wait_for_timeout(4000)
    breath = pg.evaluate("({ b: window.__perf.breathing.slice(), c: window.__perf.cost.slice(), g: window.__perf.geomCost.slice() })")
    # travel: continuous wheel scrolling, top to bottom and back
    pg.evaluate("window.__perf.moving.length = 0; window.__perf.cost.length = 0"); pg.mouse.move(900, 400)
    for _ in range(2):
        for d in [40] * 70 + [-40] * 70: pg.mouse.wheel(0, d); pg.wait_for_timeout(16)
    pg.wait_for_timeout(800)
    travel = pg.evaluate("({ m: window.__perf.moving.slice(), c: window.__perf.cost.slice() })")
    # flights: picker 0 -> 5 -> 1 -> 4
    pg.evaluate("window.__perf.moving.length = 0; window.__perf.cost.length = 0")
    for i in [5, 1, 4, 0]: pg.click(f"#picker button:nth-child({i + 1})"); pg.wait_for_timeout(900)
    flights = pg.evaluate("({ m: window.__perf.moving.slice(), c: window.__perf.cost.slice() })")
    bench = pg.evaluate("window.__dna.benchRender(240, false)"); bench_geo = pg.evaluate("window.__dna.benchRender(120, 1)")
    res = {"gpu_finish_travel_frame": summary(bench), "gpu_finish_breathing_frame": summary(bench_geo), "gpu": gl, "headless": not headed, "rAF": summary(raf), "breathing_render_interval": summary(breath["b"]),
           "breathing_frame_cost": summary(breath["c"]), "geometry_update_cost": summary(breath["g"]),
           "travel_render_interval": summary(travel["m"]), "travel_frame_cost": summary(travel["c"]),
           "flight_render_interval": summary(flights["m"]), "flight_frame_cost": summary(flights["c"]), "errors": errs}
    print(json.dumps(res, indent=1))
    (here / "shots" / ("fps-headed.json" if headed else "fps.json")).write_text(json.dumps(res, indent=1), encoding="utf-8")
    br.close()
