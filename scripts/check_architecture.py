#!/usr/bin/env python3
"""Check committed artifact identity and XML references; does not rerun XSD/Archify."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


for name in ['conceptual', 'target', 'evaluation-lab']:
    receipt = json.loads((ROOT / 'architecture/receipts' / (name + '.json')).read_text())
    assert receipt['ok'] is True
    for field, record in [('input', 'specification'), ('output', 'artifact')]:
        path = (ROOT / receipt[field]).resolve()
        assert path.is_relative_to(ROOT)
        assert digest(path) == receipt[record]['sha256'], f'Stale {record}: {name}'
        assert path.stat().st_size == receipt[record]['bytes']
    checks = receipt['validation']
    assert checks['checksPassed'] == checks['checkCount'] == 9
    assert checks['errors'] == checks['warnings'] == 0

evidence = json.loads((ROOT / 'architecture/evidence.json').read_text())
for claim in evidence['claims']:
    assert digest(ROOT / 'architecture' / claim['source']) == claim['source_sha256']

receipt = json.loads((ROOT / 'architecture/receipts/archimate-validation.json').read_text())
model = ROOT / receipt['model']
assert digest(model) == receipt['sha256'], 'Stale XML receipt'
tree = ET.parse(model)
ids = [e.attrib['identifier'] for e in tree.iter() if 'identifier' in e.attrib]
assert len(ids) == len(set(ids)), 'Duplicate XML identifiers'
for element in tree.iter():
    for key in ['source', 'target', 'elementRef', 'relationshipRef', 'propertyDefinitionRef']:
        if key in element.attrib:
            assert element.attrib[key] in ids, f'Unresolved {key}'
print('Architecture integrity: 3 JSON/HTML pairs, evidence hashes and XML references passed.')
