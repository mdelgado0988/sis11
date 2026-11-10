import json
p=r'C:\Users\jacob\.codex\attachments\b1271b33-9550-4e4e-9166-a177db2105b3\Texto pegado.txt'
d=json.load(open(p,encoding='utf-8'))
for c in json.load(open(r'C:\Users\jacob\.codex\attachments\b9dee19a-bb1c-4f66-894f-7c9bd3b8c270\Texto pegado.txt',encoding='utf-8'))['outData'][0]['Coverages']:
 print({k:c.get(k) for k in ['code','name','basic','mandatory','limit','premium','deductible','insurability','commercialName','appliesTo','number']})
print('DTAUT object def', d['outData'][0]['objectDefinitionId'])
