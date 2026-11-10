from docx import Document
from pathlib import Path
p=Path(r'C:\Proyectos\Global\Documentación\Guia tecnica de catalogos para integracion de auto.docx')
d=Document(p)
print('catalog paragraphs', len(d.paragraphs))
print('catalog tables', len(d.tables))
print('catalog headings', sum(1 for x in d.paragraphs if x.style.name.startswith('Heading')))
print('catalog size', p.stat().st_size)
