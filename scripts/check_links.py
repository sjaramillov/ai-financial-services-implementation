#!/usr/bin/env python3
"""Check relative file links in authored Markdown and HTML without network calls."""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'.git', '.terraform', 'node_modules', '__pycache__'}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if value and key in {'href', 'src'} and tag in {'a', 'link', 'script', 'img', 'iframe'}:
                self.links.append(value)


def main():
    failures = []
    checked = 0
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file() or any(x in SKIP for x in path.relative_to(ROOT).parts):
            continue
        if path.suffix not in {'.md', '.html'}:
            continue
        content = path.read_text()
        if path.suffix == '.html':
            parser = Links()
            parser.feed(content)
            links = parser.links
        else:
            # Ignore fenced examples; only actual prose links are publication links.
            content = re.sub(r'```.*?```', '', content, flags=re.S)
            links = re.findall(r'\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)', content)
        for link in links:
            url = urlsplit(link)
            if url.scheme or url.netloc or not url.path:
                continue
            target = (path.parent / unquote(url.path)).resolve()
            checked += 1
            if not target.is_relative_to(ROOT) or not target.exists():
                failures.append(f'{path.relative_to(ROOT)}: missing or outside repository: {link}')
    for failure in failures:
        print(failure)
    print(f'Local link check: {checked} links, {len(failures)} failures.')
    return bool(failures)


if __name__ == '__main__':
    sys.exit(main())
