import json
import sys

sys.path.insert(0, r"C:\Proyectos\Global\.tmp")
import clone_and_issue_auto as m

response = m.api("RepoLifePolicy", {
    "operation": "GET",
    "filter": "holderId=155 and productCode='GLA'",
    "size": 100,
    "noTracking": True,
})
rows = response.get("outData") if isinstance(response, dict) else []
print(json.dumps({
    "responseType": type(response).__name__,
    "responsePreview": str(response)[:500],
    "rootKeys": list(response.keys()) if isinstance(response, dict) else None,
    "rootOk": response.get("ok") if isinstance(response, dict) else None,
    "rootMsg": str(response.get("msg"))[:300] if isinstance(response, dict) else None,
    "outCount": len(rows) if isinstance(rows, list) else None,
    "rows": [{key: row.get(key) for key in ("id", "code", "entityState", "active", "processId", "created")} for row in rows if isinstance(row, dict)],
}, ensure_ascii=False, indent=2))
