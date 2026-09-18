#!/usr/bin/env python3
"""Validate using official schemas supplied locally; never downloads resources.

Usage: python3 architecture/scripts/validate_archimate.py --schema-dir /path/to/xsd
Requires lxml. Place archimate3_{Diagram,View,Model}.xsd and xml.xsd in that directory.
"""
import argparse
import hashlib
import json
from pathlib import Path
from lxml import etree

ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--schema-dir', type=Path, required=True)
args=parser.parse_args()
schema_dir=args.schema_dir.resolve()
class LocalResolver(etree.Resolver):
    def resolve(self, url, pubid, context):
        name=url.rsplit('/',1)[-1]
        if name not in {'xml.xsd','archimate3_Model.xsd','archimate3_View.xsd','archimate3_Diagram.xsd'}:
            raise ValueError('Schema dependency is not on the allowlist')
        return self.resolve_filename(str(schema_dir/name),context)
xml_parser=etree.XMLParser(no_network=True,resolve_entities=False)
xml_parser.resolvers.add(LocalResolver())
schema=etree.XMLSchema(etree.parse(str(schema_dir/'archimate3_Diagram.xsd'),xml_parser))
model=ROOT/'financial-ai.archimate.xml'
document=etree.parse(str(model),etree.XMLParser(no_network=True,resolve_entities=False))
schema.assertValid(document)
ns={'a':'http://www.opengroup.org/xsd/archimate/3.0/'}
ids=document.xpath('//@identifier')
assert len(ids)==len(set(ids)), 'Identifiers must be unique'
idset=set(ids)
for attribute in ['source','target','elementRef','relationshipRef','propertyDefinitionRef']:
    assert all(v in idset for v in document.xpath('//@'+attribute)), 'Unresolved '+attribute
files=['archimate3_Diagram.xsd','archimate3_View.xsd','archimate3_Model.xsd','xml.xsd']
receipt={
 'model':'architecture/financial-ai.archimate.xml',
 'sha256':hashlib.sha256(model.read_bytes()).hexdigest(),
 'xsd_validation':'passed','reference_integrity':'passed',
 'element_count':len(document.xpath('/a:model/a:elements/a:element',namespaces=ns)),
 'relationship_count':len(document.xpath('/a:model/a:relationships/a:relationship',namespaces=ns)),
 'diagram_count':len(document.xpath('/a:model/a:views/a:diagrams/a:view',namespaces=ns)),
 'semantic_review':'manual mapping; no automated ArchiMate metamodel compliance claim',
 'archi_import':'not_executed',
 'schemas':[{'file':name,'source':('https://www.w3.org/2001/' if name=='xml.xsd' else 'https://www.opengroup.org/xsd/archimate/3.1/')+name,'sha256':hashlib.sha256((schema_dir/name).read_bytes()).hexdigest()} for name in files]
}
(ROOT/'receipts'/'archimate-validation.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2))
