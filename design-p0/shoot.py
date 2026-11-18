# Renders the P0 mockups to PNG. Usage: uv run --no-project --with playwright python shoot.py
# Uses the installed Edge with software WebGL; reads files only from this repo and agent-office/vendor.
import pathlib
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).resolve().parent
page = (here / "mockup.html").as_uri()
shots = [("option-a-liquid-ribbon-1440x900.png", "v=a", 1440, 900),
         ("option-b-pebble-chain-1440x900.png", "v=b", 1440, 900),
         ("option-c-pearl-ribbon-1440x900.png", "v=c", 1440, 900),
         ("recommended-ribbon-droplets-1440x900.png", "v=r", 1440, 900)]
import sys
if len(sys.argv) > 1: shots.append((f"phone-{sys.argv[1]}-390x844.png", f"v={sys.argv[1]}&phone=1", 390, 844))
with sync_playwright() as p:
    br = p.chromium.launch(channel="msedge", args=["--allow-file-access-from-files", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    for name, q, w, h in shots:
        pg = br.new_page(viewport={"width": w, "height": h}, device_scale_factor=1 if w > 500 else 2); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        pg.goto(page + "#" + q + "&still=1"); pg.wait_for_function("window.__ready===true", timeout=60000); pg.wait_for_timeout(1200)
        pg.screenshot(path=str(here / name)); print(name, "errors:", errs); pg.close()
    br.close()
