import json
import sys
sys.path.insert(0, r"C:\Proyectos\Global\.tmp")
import clone_and_issue_auto as m

for cmd, data in [
    ("RepoLifePolicy", {"operation": "GET", "filter": "id=5141", "include": ["Coverages", "Insureds"], "noTracking": True}),
    ("RepoInsuredObject", {"operation": "GET", "filter": "lifePolicyId=5141", "size": 100, "noTracking": True}),
    ("LoadEntity", {"entity": "Proceso", "filter": "id=9318", "fields": "id, estado", "noTracking": True}),
    ("LoadEntity", {"entity": "LifePolicy", "filter": "id=5141", "fields": "id, code, active, entityState, processId, annualPremium, annualTotal", "noTracking": True}),
]:
    r = m.api(cmd, data)
    out = r.get("outData") if isinstance(r, dict) else None
    if isinstance(out, list): out = out[0] if out else {}
    if not isinstance(out, dict): out = {}
    print(json.dumps({"cmd": cmd, "ok": r.get("ok") if isinstance(r, dict) else None, "msg": r.get("msg") if isinstance(r, dict) else None, "out": {k: out.get(k) for k in ("id", "code", "active", "entityState", "processId", "estado", "annualPremium", "annualTotal") if k in out}, "objectCount": len(r.get("outData") or []) if cmd == "RepoInsuredObject" and isinstance(r, dict) else None}, ensure_ascii=False))
