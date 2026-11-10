import json
p=r'C:\Users\jacob\.codex\attachments\b9dee19a-bb1c-4f66-894f-7c9bd3b8c270\Texto pegado.txt'
row=json.load(open(p,encoding='utf-8'))['outData'][0]
prod=row.get('Product') or {}
print('product keys', list(prod.keys()))
print('product', {k:prod.get(k) for k in ['id','code','name','lobCode','configJson'] if k in prod})
