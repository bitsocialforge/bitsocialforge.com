#!/bin/bash

# Explicit integration verification; never invoked by lifecycle hooks.
set -u
cd "$(dirname "$0")/.." || exit 1

run_required_check() {
  local label="$1"
  shift

  echo "=== $label ==="
  if "$@" 2>&1; then
    echo ""
    return 0
  fi

  echo ""
  return 1
}

# Use the system python3: pyenv shims can fail in sandboxed shells.
check_html_local_refs() {
  /usr/bin/python3 - <<'PY'
import html.parser
import os
import sys
import urllib.parse

if not os.path.isfile("index.html"):
    print("index.html is missing")
    sys.exit(1)

class RefCollector(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "src") and value:
                self.refs.append((self.getpos()[0], value))

    handle_startendtag = handle_starttag

collector = RefCollector()
with open("index.html", encoding="utf-8") as f:
    collector.feed(f.read())

failures = []
checked = 0
for line, ref in collector.refs:
    if ref.startswith(("http://", "https://", "mailto:", "#", "tel:", "data:", "//")):
        continue
    path = urllib.parse.urlparse(ref).path
    if path.startswith("/_vercel/"):
        continue
    local = path.lstrip("/")
    if local == "" or local.endswith("/"):
        local = os.path.join(local, "index.html")
    checked += 1
    # Absolute URLs may resolve to Vite public/ passthrough files or to
    # source files in the project root.
    if not (os.path.isfile(os.path.join("public", local)) or os.path.isfile(local)):
        failures.append(f"index.html:{line}: local reference does not resolve: {ref}")

for failure in failures:
    print(failure)
print(f"checked {checked} local href/src reference(s)")
sys.exit(1 if failures else 0)
PY
}

check_css_url_refs() {
  /usr/bin/python3 - <<'PY'
import os
import re
import sys

failures = []
checked = 0
for css in ("styles.css", "fonts/fonts.css"):
    if not os.path.isfile(css):
        failures.append(f"{css}: file is missing")
        continue
    base = os.path.dirname(css)
    with open(css, encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            for match in re.finditer(r"url\(\s*(['\"]?)([^'\")]+)\1\s*\)", line):
                ref = match.group(2).strip()
                if ref.startswith(("http://", "https://", "data:", "#", "//")):
                    continue
                path = ref.split("#", 1)[0].split("?", 1)[0]
                if path.startswith("/"):
                    # Absolute URLs may resolve to Vite public/ passthrough files.
                    target = path.lstrip("/")
                    if os.path.isfile(os.path.join("public", target)):
                        target = os.path.join("public", target)
                else:
                    target = os.path.normpath(os.path.join(base, path))
                checked += 1
                if not os.path.isfile(target):
                    failures.append(f"{css}:{lineno}: url() does not resolve: {ref}")

for failure in failures:
    print(failure)
print(f"checked {checked} url() reference(s)")
sys.exit(1 if failures else 0)
PY
}

check_public_files_in_dist() {
  local missing=0
  while IFS= read -r file; do
    local rel="${file#public/}"
    if [ ! -f "dist/$rel" ]; then
      echo "public/$rel was not copied into dist/"
      missing=1
    fi
  done < <(find public -type f 2>/dev/null)
  if [ "$missing" -ne 0 ]; then
    return 1
  fi
  echo "all public/ files present in dist/"
}

check_html_structure() {
  /usr/bin/python3 - <<'PY'
import html.parser
import os
import sys

if not os.path.isfile("index.html"):
    print("index.html is missing")
    sys.exit(1)

VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

class StructureChecker(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
            return
        if any(open_tag == tag for open_tag, _ in self.stack):
            while self.stack and self.stack[-1][0] != tag:
                unclosed, line = self.stack.pop()
                self.errors.append(
                    f"index.html:{line}: <{unclosed}> is never closed"
                    f" (still open when </{tag}> appears at line {self.getpos()[0]})"
                )
            self.stack.pop()
        else:
            self.errors.append(f"index.html:{self.getpos()[0]}: unexpected closing tag </{tag}>")

checker = StructureChecker()
with open("index.html", encoding="utf-8") as f:
    checker.feed(f.read())
checker.close()
for tag, line in checker.stack:
    checker.errors.append(f"index.html:{line}: <{tag}> is never closed")

for error in checker.errors:
    print(error)
print(f"tag structure check found {len(checker.errors)} problem(s)")
sys.exit(1 if checker.errors else 0)
PY
}

echo "Running Vite/TypeScript checks, local asset reference checks, and HTML structure sanity check..."
echo ""

failures=0

run_required_check "TypeScript check passes" corepack yarn type-check || failures=1
run_required_check "Oxlint passes" corepack yarn lint || failures=1
run_required_check "Vite build passes" corepack yarn build || failures=1
run_required_check "public/ passthrough files land in dist/" check_public_files_in_dist || failures=1
run_required_check "index.html local href/src references resolve" check_html_local_refs || failures=1
run_required_check "styles.css and fonts/fonts.css url(...) references resolve" check_css_url_refs || failures=1
run_required_check "index.html tag structure sanity (html.parser)" check_html_structure || failures=1

if [ "$failures" -ne 0 ]; then
  echo "Verification failed." >&2
  exit 1
fi

echo "Verification complete."
