import json
import sys

sys.path.insert(0, r"C:\Proyectos\Global\.tmp")
import clone_and_issue_auto as m

POLICY_ID = 5141
PROCESS_ID = 9318
OBJECT_FILE = r"C:\Users\jacob\.codex\attachments\b1271b33-9550-4e4e-9166-a177db2105b3\Texto pegado.txt"


def main():
    with open(OBJECT_FILE, encoding="utf-8") as handle:
        source_objects = json.load(handle).get("outData") or []
    results = []
    existing = m.api("RepoInsuredObject", {"operation": "GET", "filter": f"lifePolicyId={POLICY_ID}", "size": 100, "noTracking": True})
    m.require_ok("RepoInsuredObject GET", existing)
    existing_defs = {row.get("objectDefinitionId") for row in (existing.get("outData") or []) if isinstance(row, dict)}
    results.append(("RepoInsuredObject GET", {"ok": existing.get("ok"), "msg": existing.get("msg"), "objectDefinitionIds": sorted(existing_defs)}))
    for source_object in source_objects:
        definition_id = source_object.get("objectDefinitionId")
        if definition_id in existing_defs:
            continue
        response = m.api("RepoInsuredObject", {"operation": "ADD", "entity": {
            "lifePolicyId": POLICY_ID,
            "objectDefinitionId": definition_id,
            "jValues": source_object.get("jValues"),
        }})
        m.require_ok(f"RepoInsuredObject ADD {definition_id}", response)
        results.append((f"RepoInsuredObject ADD {definition_id}", m.response_summary(response)))

    response, process = m.current_process(PROCESS_ID)
    results.append(("LoadEntity Proceso inicial", m.response_summary(response)))
    state = process.get("estado")
    if state not in ("Borrador de Póliza", "Generar Documento"):
        response = m.api("GotoStep", {"procesoId": PROCESS_ID, "estado": "_next"})
        m.require_ok("GotoStep inicial", response)
        results.append(("GotoStep inicial", m.response_summary(response)))

    response = m.api("QuotePolicy", {"policyId": POLICY_ID, "dbMode": True, "save": True, "action": "QUOTE"})
    m.require_ok("QuotePolicy", response)
    results.append(("QuotePolicy", m.response_summary(response)))

    state = None
    for _ in range(4):
        response, process = m.current_process(PROCESS_ID)
        results.append(("LoadEntity Proceso", m.response_summary(response)))
        state = process.get("estado")
        if state == "Borrador de Póliza":
            break
        response = m.api("GotoStep", {"procesoId": PROCESS_ID, "estado": "_next"})
        m.require_ok("GotoStep emisión", response)
        results.append(("GotoStep emisión", m.response_summary(response)))
    if state != "Borrador de Póliza":
        raise RuntimeError(f"El flujo no llegó a Borrador de Póliza; estado actual: {state}")

    response = m.api("IssuePolicy", {"policyId": POLICY_ID})
    m.require_ok("IssuePolicy", response)
    results.append(("IssuePolicy", m.response_summary(response)))
    response = m.api("LoadEntity", {"entity": "LifePolicy", "filter": f"id={POLICY_ID}", "fields": "id, code, active, entityState, processId, annualPremium, annualTotal", "noTracking": True})
    m.require_ok("LoadEntity LifePolicy final", response)
    final = m.out_one(response)
    results.append(("LoadEntity LifePolicy final", m.response_summary(response)))
    print(json.dumps({"policyId": POLICY_ID, "processId": PROCESS_ID, "final": {key: final.get(key) for key in ("id", "code", "active", "entityState", "processId", "annualPremium", "annualTotal") if key in final}, "steps": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False, indent=2))
        sys.exit(1)
