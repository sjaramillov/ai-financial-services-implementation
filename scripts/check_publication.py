#!/usr/bin/env python3
"""Conservative checks for accidental operational data in the public tree.

This is a guardrail, not a guarantee that all sensitive content is detected.
Additional organization-specific deny terms can be checked privately before release.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'.git', '.terraform', 'node_modules', '__pycache__', '.pytest_cache'}
FORBIDDEN_NAMES = re.compile(r'(^\.env($|\.)|credentials.*\.json$|\.tfstate($|\.)|\.tfplan$|\.(pem|key)$)')
PATTERNS = {
    'private-key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'aws-key': re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'github-token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b'),
    'machine-path': re.compile(r'/(?:Users|home)/[A-Za-z][\w.-]+/'),
    'cloud-resource-id': re.compile(r'\b(?:eni|vpc|subnet|i|sg|vol)-[0-9a-f]{8,17}\b'),
    'account-arn': re.compile(r'arn:aws[^:\s]*:[^\s"<>]*:\d{12}:'),
    'live-api-endpoint': re.compile(r'https://[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com'),
    'url-password': re.compile(r'https?://[^/\s:@]+:[^/\s@]+@'),
}


def check(root=ROOT):
    findings = []
    count = 0
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if any(part in SKIP for part in rel.parts):
            continue
        if path.is_symlink():
            findings.append(f'{rel}: symlink not allowed in public artifacts')
            continue
        if not path.is_file():
            continue
        count += 1
        if 'private' in rel.parts or FORBIDDEN_NAMES.search(path.name) and path.name != '.env.example':
            findings.append(f'{rel}: private file type')
        if path.name.endswith(('.tfvars', '.tfvars.json')):
            findings.append(f'{rel}: local Terraform values')
        if path.stat().st_size > 5 * 1024 * 1024:
            findings.append(f'{rel}: exceeds 5 MiB publication limit')
        try:
            content = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            if path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp', '.woff2', '.pdf'}:
                findings.append(f'{rel}: unexpected binary file')
            continue
        for name, pattern in PATTERNS.items():
            for match in pattern.finditer(content):
                line = content.count('\n', 0, match.start()) + 1
                findings.append(f'{rel}:{line}: {name}')
    return count, findings


if __name__ == '__main__':
    count, findings = check()
    for finding in findings:
        print(finding)
    print(f'Publication check: {count} files, {len(findings)} findings.')
    sys.exit(bool(findings))
