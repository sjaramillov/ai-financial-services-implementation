#!/usr/bin/env python3
"""Export the authored Archify views to ArchiMate Open Exchange XML (stdlib only).

Archify JSON remains authoritative for the diagrams. Explicit semantic mapping is
kept in archimate-mapping.json; no ArchiMate type is inferred from a visual color.
"""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
NS = 'http://www.opengroup.org/xsd/archimate/3.0/'
XSI = 'http://www.w3.org/2001/XMLSchema-instance'
XML = 'http://www.w3.org/XML/1998/namespace'
ET.register_namespace('', NS)
ET.register_namespace('xsi', XSI)

def sub(parent, tag, text=None, **attrs):
    child = ET.SubElement(parent, '{'+NS+'}'+tag, attrs)
    if text is not None:
        child.text = text
    return child

def name(parent, value):
    child = sub(parent, 'name', value)
    child.set('{'+XML+'}lang', 'es')

def props(parent, source):
    properties = sub(parent, 'properties')
    for key, value in [('status','proposed'),('source',source)]:
        prop = sub(properties, 'property', propertyDefinitionRef='prop-'+key)
        sub(prop, 'value', value)

mapping = json.loads((ROOT/'archimate-mapping.json').read_text())
specs = {v: json.loads((ROOT/(v+'.architecture.json')).read_text()) for v in mapping['views']}
model = ET.Element('{'+NS+'}model', {'identifier':'model-financial-ai-controls',
    '{'+XSI+'}schemaLocation': NS+' https://www.opengroup.org/xsd/archimate/3.1/archimate3_Diagram.xsd'})
name(model, 'Controles de IA en servicios financieros')
sub(model, 'documentation', 'Diseño propuesto con datos sintéticos. Dos ejercicios independientes: asistente de operaciones y AI Evaluation Lab. No acredita despliegue, cumplimiento ni disponibilidad. Fuente editable: tres JSON Archify y su mapeo semántico explícito.')
elements = sub(model, 'elements')
for view_id, spec in specs.items():
    for node in spec['components']:
        element = sub(elements, 'element', identifier=node['id'])
        element.set('{'+XSI+'}type', mapping['elements'][node['id']])
        name(element, node['label'])
        sub(element, 'documentation', node['sublabel']+'. Estado: propuesta. '+mapping['notes'].get(node['id'],''))
        props(element, view_id+'.architecture.json#'+node['id'])
relationships = sub(model, 'relationships')
for view_id, spec in specs.items():
    for edge in spec['connections']:
        semantic = mapping['relationships'].get(edge['id'], {'type':'Association'})
        relationship = sub(relationships, 'relationship', identifier=edge['id'], source=edge['from'], target=edge['to'])
        relationship.set('{'+XSI+'}type', semantic['type'])
        if semantic['type']=='Association': relationship.set('isDirected','true')
        if 'accessType' in semantic: relationship.set('accessType',semantic['accessType'])
        name(relationship,edge['label'])
        sub(relationship,'documentation','Relación propuesta. La etiqueta describe el contrato; la vista no demuestra enforcement ni despliegue.')
property_defs = sub(model,'propertyDefinitions')
for key,label in [('status','evidence_status'),('source','source_view')]:
    prop = sub(property_defs,'propertyDefinition',identifier='prop-'+key,type='string')
    name(prop,label)
views = sub(model,'views')
diagrams = sub(views,'diagrams')
colors = {'BusinessActor':(255,245,180),'BusinessRole':(255,245,180),'DataObject':(182,219,243),'ApplicationComponent':(187,234,241),'ApplicationService':(187,234,241),'ApplicationInterface':(187,234,241)}
for view_id,spec in specs.items():
    diagram = sub(diagrams,'view',identifier='view-'+view_id)
    diagram.set('{'+XSI+'}type','Diagram')
    name(diagram,spec['meta']['title'])
    sub(diagram,'documentation',spec['meta']['subtitle']+'. La notación ArchiMate corresponde al XML; la apariencia del HTML usa Archify.')
    for node in spec['components']:
        item = sub(diagram,'node',identifier='node-'+view_id+'-'+node['id'],elementRef=node['id'],x=str(node['pos'][0]),y=str(node['pos'][1]),w=str(node['size'][0]),h=str(node['size'][1]))
        item.set('{'+XSI+'}type','Element')
        style=sub(item,'style')
        r,g,b=colors.get(mapping['elements'][node['id']],(210,234,209))
        sub(style,'fillColor',r=str(r),g=str(g),b=str(b))
    for edge in spec['connections']:
        connection=sub(diagram,'connection',identifier='line-'+view_id+'-'+edge['id'],relationshipRef=edge['id'],source='node-'+view_id+'-'+edge['from'],target='node-'+view_id+'-'+edge['to'])
        connection.set('{'+XSI+'}type','Relationship')
        for x,y in edge.get('via',[]):sub(connection,'bendpoint',x=str(x),y=str(y))
ET.indent(model, space='  ')
output=ROOT/'financial-ai.archimate.xml'
ET.ElementTree(model).write(output,encoding='utf-8',xml_declaration=True)
print(output.name)
