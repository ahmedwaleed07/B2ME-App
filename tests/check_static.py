from pathlib import Path
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
for filename in ("index.html", "provider-dashboard.html"):
    html = (root / filename).read_text(encoding="utf-8")
    assert "<!doctype html>" in html.lower(), filename
    scripts = re.findall(r"<script[^>]*>(.*?)</script>", html, flags=re.S | re.I)
    assert scripts, f"No inline JavaScript in {filename}"
    for source in scripts:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write(source)
            temp_path = Path(f.name)
        try:
            subprocess.run(["node", "--check", str(temp_path)], check=True)
        finally:
            temp_path.unlink(missing_ok=True)
assert "Powered by" in (root / "index.html").read_text(encoding="utf-8")
print("B2ME standalone files: syntax + brand smoke checks passed")
