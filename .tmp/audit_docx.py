from docx import Document
from pathlib import Path
p=Path(r'C:\Proyectos\Global\Documentación\Documentacion tecnica - importacion y emision auto.docx')
d=Document(p)
print('paragraphs', len(d.paragraphs))
print('tables', len(d.tables))
print('sections', len(d.sections))
print('title', d.paragraphs[0].text)
print('headings', sum(1 for x in d.paragraphs if x.style.name.startswith('Heading')))
print('code_like', sum(1 for x in d.paragraphs if x.runs and any(r.font.name=='Consolas' for r in x.runs)))
print('size', p.stat().st_size)
