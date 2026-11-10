import re
from pathlib import Path
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r'C:\Proyectos\Global\Documentación\Documentacion tecnica - importacion y emision auto.md')
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(r'C:\Proyectos\Global\Documentación\Documentacion tecnica - importacion y emision auto.docx')

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tcPr.append(shd)
    shd.set(qn('w:fill'), fill)

def borders(table, color='D9D9D9', size='6'):
    tbl = table._tbl
    tblPr = tbl.tblPr
    b = tblPr.first_child_found_in('w:tblBorders')
    if b is None:
        b = OxmlElement('w:tblBorders')
        tblPr.append(b)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        tag = 'w:' + edge
        el = b.find(qn(tag))
        if el is None:
            el = OxmlElement(tag)
            b.append(el)
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), size)
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), color)

def set_cell_text(cell, text, bold=False, color=None, size=8.5):
    cell.text = ''
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.05
    r = p.add_run(text)
    r.bold = bold
    r.font.name = 'Arial'
    r._element.rPr.rFonts.set(qn('w:ascii'), 'Arial')
    r._element.rPr.rFonts.set(qn('w:hAnsi'), 'Arial')
    r.font.size = Pt(size)
    if color:
        r.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def add_inline(p, text):
    parts = re.split(r'(`[^`]+`|\*\*[^*]+\*\*)', text)
    for part in parts:
        if not part:
            continue
        if part.startswith('`') and part.endswith('`'):
            r = p.add_run(part[1:-1])
            r.font.name = 'Consolas'; r.font.size = Pt(9)
        elif part.startswith('**') and part.endswith('**'):
            r = p.add_run(part[2:-2]); r.bold = True
        else:
            r = p.add_run(part)
        r.font.name = r.font.name or 'Arial'
        r._element.rPr.rFonts.set(qn('w:ascii'), r.font.name)
        r._element.rPr.rFonts.set(qn('w:hAnsi'), r.font.name)

def add_code(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.right_indent = Inches(0.18)
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.0
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), 'F2F2F2'); pPr.append(shd)
    r = p.add_run(text)
    r.font.name = 'Consolas'; r._element.rPr.rFonts.set(qn('w:ascii'), 'Consolas'); r._element.rPr.rFonts.set(qn('w:hAnsi'), 'Consolas')
    r.font.size = Pt(8)

def add_table(doc, rows):
    cols = len(rows[0])
    table = doc.add_table(rows=len(rows), cols=cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    borders(table)
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            set_cell_text(table.cell(i, j), val, bold=(i == 0), color=('FFFFFF' if i == 0 else None), size=8.2)
            if i == 0:
                shade(table.cell(i, j), '1F4E78')
            elif i % 2 == 0:
                shade(table.cell(i, j), 'F7F9FB')
    doc.add_paragraph().paragraph_format.space_after = Pt(1)

def parse_table(line, lines, i):
    rows = []
    while i < len(lines) and lines[i].strip().startswith('|'):
        raw = lines[i].strip().strip('|')
        vals = [x.strip() for x in raw.split('|')]
        if not all(re.fullmatch(r':?-+:?', x) for x in vals):
            rows.append(vals)
        i += 1
    return rows, i

def main():
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.65); sec.bottom_margin = Inches(0.65); sec.left_margin = Inches(0.7); sec.right_margin = Inches(0.7)
    styles = doc.styles
    styles['Normal'].font.name = 'Arial'; styles['Normal']._element.rPr.rFonts.set(qn('w:ascii'), 'Arial'); styles['Normal']._element.rPr.rFonts.set(qn('w:hAnsi'), 'Arial'); styles['Normal'].font.size = Pt(9.5)
    for name, size in [('Title', 20), ('Heading 1', 14), ('Heading 2', 11), ('Heading 3', 10)]:
        st = styles[name]; st.font.name = 'Arial'; st._element.rPr.rFonts.set(qn('w:ascii'), 'Arial'); st._element.rPr.rFonts.set(qn('w:hAnsi'), 'Arial'); st.font.size = Pt(size); st.font.color.rgb = RGBColor(0,0,0)
    styles['Title'].font.bold = True
    for name in ('Heading 1','Heading 2','Heading 3'):
        styles[name].font.bold = True

    lines = SRC.read_text(encoding='utf-8').splitlines()
    i = 0; in_code = False; code = []
    while i < len(lines):
        line = lines[i]
        if line.startswith('```'):
            if in_code:
                add_code(doc, '\n'.join(code)); code=[]; in_code=False
            else:
                in_code=True
            i += 1; continue
        if in_code:
            code.append(line); i += 1; continue
        if not line.strip():
            i += 1; continue
        m = re.match(r'^(#{1,3})\s+(.*)$', line)
        if m:
            level = len(m.group(1)); text = re.sub(r'[`*_]', '', m.group(2))
            p = doc.add_paragraph(style='Title' if level == 1 else f'Heading {level}')
            p.paragraph_format.space_before = Pt(10 if level == 1 else 8); p.paragraph_format.space_after = Pt(4)
            p.add_run(text)
            i += 1; continue
        if line.startswith('|'):
            rows, i = parse_table(line, lines, i); add_table(doc, rows); continue
        if re.match(r'^\s*[-*]\s+', line):
            p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after=Pt(2); add_inline(p, re.sub(r'^\s*[-*]\s+', '', line)); i += 1; continue
        if re.match(r'^\s*\d+\.\s+', line):
            p=doc.add_paragraph(style='List Number'); p.paragraph_format.space_after=Pt(2); add_inline(p, re.sub(r'^\s*\d+\.\s+', '', line)); i += 1; continue
        p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(5); p.paragraph_format.line_spacing = 1.08; add_inline(p, line); i += 1

    # Footer with simple page field.
    footer = sec.footer.paragraphs[0]; footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = footer.add_run('Documentación técnica de importación y emisión de auto  |  '); run.font.name='Arial'; run.font.size=Pt(8); run.font.color.rgb=RGBColor(100,100,100)
    fld = OxmlElement('w:fldSimple'); fld.set(qn('w:instr'), 'PAGE'); footer._p.append(fld)
    doc.core_properties.title = 'Documentación técnica de importación y emisión de auto'
    doc.core_properties.subject = 'Comandos y flujo de emisión de pólizas de auto'
    doc.core_properties.author = 'Axxis Systems'
    doc.save(OUT)

if __name__ == '__main__': main()
