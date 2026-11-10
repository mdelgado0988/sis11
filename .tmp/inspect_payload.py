import json
p=r'C:\Users\jacob\.codex\attachments\b9dee19a-bb1c-4f66-894f-7c9bd3b8c270\Texto pegado.txt'
d=json.load(open(p,encoding='utf-8'))
row=d['outData'][0]
for k in ['id','code','entityState','processId','productCode','lob','holderId','payerId','cessionBeneficiary','branchCode','paymentMethod','periodicity','installmentSchemeId','start','end','insuredSum','active']:
 print(f'{k}={row.get(k)!r}')
print('process=', row.get('Process',{}).get('estado'))
for k,v in row.items():
 if any(s.lower() in k.lower() for s in ['insured','coverage','object']):
  print(k, type(v).__name__, len(v) if isinstance(v,(list,dict)) else '')
