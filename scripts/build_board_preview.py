#!/usr/bin/env python3
"""Generate the README image from the board's SVG, styles and licensed local fonts."""
from base64 import b64encode
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BOARD = ROOT / 'board'
SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)


def build():
    source = (BOARD / 'index.html').read_text()
    diagram = ET.fromstring(re.search(r'<svg class="diagram".*?</svg>', source, re.S).group())
    for layer in list(diagram):
        if layer.get('class') == 'extension-layer':
            diagram.remove(layer)
    for element in diagram.iter():
        for key in ('data-step', 'aria-hidden', 'hidden'):
            element.attrib.pop(key, None)
        if element.get('class', '').startswith('reveal'):
            element.set('class', 'is-visible')
    diagram.set('x', '40')
    diagram.set('y', '176')
    diagram.set('width', '1440')
    diagram.set('height', '720')

    tokens = re.search(r':root\s*\{(.*?)\}', (BOARD / 'board.css').read_text(), re.S).group(1)
    fonts = (BOARD / 'assets/fonts/fonts.css').read_text()
    def embed(match):
        filename = match.group(1)
        payload = b64encode((BOARD / 'assets/fonts' / filename).read_bytes()).decode('ascii')
        return f'url("data:font/woff2;base64,{payload}")'
    fonts = re.sub(r'url\("\./([^"/]+)"\)', embed, fonts)
    styles = ':root {' + tokens + '}\n' + fonts + '\n' + (BOARD / 'diagram.css').read_text()
    styles += '''
.diagram { font-family: 'Atkinson Hyperlegible', sans-serif; }
.diagram .node-title { font-family: 'Archivo', sans-serif; }
.preview-title { font: 650 46px 'Bricolage Grotesque', sans-serif; letter-spacing: -1.8px; fill: var(--ink); }
.preview-copy { font: 400 20px 'Atkinson Hyperlegible', sans-serif; fill: var(--ink-soft); }
.preview-label { font: 650 12px 'Archivo', sans-serif; letter-spacing: 1.8px; fill: var(--ink-muted); }
'''
    root = ET.Element('svg', {'xmlns': SVG, 'width': '1520', 'height': '962', 'viewBox': '0 0 1520 962', 'role': 'img', 'aria-labelledby': 'preview-title preview-desc'})
    ET.SubElement(root, 'title', id='preview-title').text = 'La frontera de autoridad — tablero de controles de IA financiera'
    ET.SubElement(root, 'desc', id='preview-desc').text = 'El modelo propone. Identidad, política, revisión humana y API de dominio autorizan el efecto. Una lectura independiente verifica el resultado y la auditoría registra la cadena. Diseño de referencia con datos sintéticos.'
    # Keep applicable notices inside the image when it is distributed on its own.
    project_notice = '\n'.join((ROOT / 'NOTICE').read_text(encoding='utf-8').splitlines()[:2])
    notices = (
        project_notice + '\n\nOriginal diagram: Apache License 2.0.\n'
        + (ROOT / 'LICENSE').read_text(encoding='utf-8')
        + '\n\nEmbedded fonts: separate SIL Open Font License 1.1 notices.\n'
        + (BOARD / 'assets/fonts/FONT-LICENSES.txt').read_text(encoding='utf-8')
    )
    ET.SubElement(root, 'metadata', id='license-notices').text = '\n'.join(line.rstrip() for line in notices.splitlines())
    ET.SubElement(root, 'style').text = styles
    defs = ET.SubElement(root, 'defs')
    grid = ET.SubElement(defs, 'pattern', id='paper-grid', width='28', height='28', patternUnits='userSpaceOnUse')
    ET.SubElement(grid, 'path', d='M 28 0 H 0 V 28', fill='none', stroke='#e9e4d9', **{'stroke-width': '1'})
    ET.SubElement(root, 'rect', width='1520', height='962', rx='16', fill='var(--canvas)')
    ET.SubElement(root, 'rect', width='1520', height='962', rx='16', fill='url(#paper-grid)')
    ET.SubElement(root, 'text', x='54', y='39', **{'class': 'preview-label'}).text = 'AI FINANCIAL SERVICES / CUADERNO DE ARQUITECTURA'
    ET.SubElement(root, 'text', x='54', y='94', **{'class': 'preview-title'}).text = 'La frontera de autoridad.'
    ET.SubElement(root, 'text', x='54', y='132', **{'class': 'preview-copy'}).text = 'El modelo propone. El dominio autoriza. La evidencia permite comprobar el resultado.'
    ET.SubElement(root, 'rect', x='28', y='158', width='1464', height='751', rx='14', fill='var(--surface)', stroke='var(--line)')
    root.append(diagram)
    ET.SubElement(root, 'text', x='54', y='940', **{'class': 'preview-label'}).text = 'DISEÑO DE REFERENCIA · DATOS SINTÉTICOS · SIN INFRAESTRUCTURA DESPLEGADA'
    ET.SubElement(root, 'text', x='1466', y='940', **{'class': 'preview-label', 'text-anchor': 'end'}).text = '7 PASOS DE CONTROL'
    ET.indent(root, space='  ')
    output = BOARD / 'preview.svg'
    output.write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding='unicode') + '\n')
    print(f'Generated {output.relative_to(ROOT)} ({output.stat().st_size:,} bytes)')


if __name__ == '__main__':
    build()
