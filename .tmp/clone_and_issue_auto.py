import json
import os
import sys
import urllib.error
import urllib.request


ENDPOINT = "https://sisos-api-iconx-latest.axxis-systems.net/int/cmd"
ENVIRONMENT = "globaluat"
POLICY_FILE = r"C:\Users\jacob\.codex\attachments\b9dee19a-bb1c-4f66-894f-7c9bd3b8c270\Texto pegado.txt"
OBJECT_FILE = r"C:\Users\jacob\.codex\attachments\b1271b33-9550-4e4e-9166-a177db2105b3\Texto pegado.txt"


def api(cmd, data):
    token = os.environ.get("SISOS_API_TOKEN")
    if not token:
        raise RuntimeError("Falta SISOS_API_TOKEN")
    body = json.dumps({"cmd": cmd, "data": data}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "X-Environment": ENVIRONMENT,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            parsed = json.loads(response.read().decode("utf-8"))
            if isinstance(parsed, str):
                parsed = json.loads(parsed)
            return parsed
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {raw[:1000]}") from exc


def out_one(response):
    out = response.get("outData") if isinstance(response, dict) else None
    if isinstance(out, list):
        return out[-1] if out else {}
    return out if isinstance(out, dict) else {}


def require_ok(step, response):
    if not isinstance(response, dict) or response.get("ok") is False:
        raise RuntimeError(f"{step}: {response.get('msg') if isinstance(response, dict) else response}")


def response_summary(response):
    out = out_one(response)
    selected = {}
    for key in ("id", "code", "active", "entityState", "processId", "estado", "annualPremium", "anualPremium", "annualTotal", "anualTotal"):
        if key in out:
            selected[key] = out[key]
    return {"ok": response.get("ok"), "msg": response.get("msg"), "outData": selected}


def coverage_for_add(coverage):
    keys = (
        "name", "code", "basic", "description", "mandatory", "limit", "premium", "deductible",
        "insurability", "commercialName", "internalBonus", "appliesTo", "number",
        "restrictUserEdition", "beneficiaries", "minLimit", "maxLimit", "loading",
        "extraPremium", "internalPremium", "periodicity", "ofnCode",
    )
    return {key: coverage.get(key) for key in keys if key in coverage}


def insured_for_add(insured):
    keys = ("contactId", "name", "relationship", "Contact", "role")
    result = {key: insured.get(key) for key in keys if key in insured}
    result["id"] = 0
    result["lifePolicyId"] = 0
    return result


def clone_policy(source):
    main_insured = source.get("MainInsured") or (source.get("Insureds") or [{}])[0]
    insureds = source.get("Insureds") or [main_insured]
    entity = {
        "currency": source.get("currency"),
        "Beneficiaries": [],
        "Surcharges": [],
        "Exclusions": source.get("Exclusions") or [],
        "Coinsureds": [],
        "Clauses": source.get("Clauses") or [],
        "policyType": source.get("policyType"),
        "indexation": source.get("indexation", 0),
        "lob": source.get("lob"),
        "segment": source.get("segment"),
        "channel": source.get("channel"),
        "branchCode": source.get("branchCode"),
        "holderId": source.get("holderId"),
        "payerId": source.get("payerId"),
        "cessionBeneficiary": source.get("cessionBeneficiary"),
        "paymentMethod": source.get("paymentMethod"),
        "receiptTypeCode": source.get("receiptTypeCode"),
        "MainInsured": insured_for_add(main_insured),
        "Insureds": [insured_for_add(item) for item in insureds],
        "insuredSum": source.get("insuredSum"),
        "start": source.get("start"),
        "end": source.get("end"),
        "duration": source.get("duration"),
        "durationMonths": source.get("durationMonths"),
        "durationDays": source.get("durationDays"),
        "coinsurance": source.get("coinsurance", 0),
        "groupCoverageType": source.get("groupCoverageType", "DIFFERENT"),
        "paymentDuration": source.get("paymentDuration", 0),
        "periodicity": source.get("periodicity"),
        "installmentSchemeId": source.get("installmentSchemeId"),
        "masterCode": source.get("masterCode"),
        "commercial": source.get("commercial"),
        "version": source.get("version", 1),
        "option": source.get("option", 1),
        "indexationPeriod": source.get("indexationPeriod", 1),
        "indexationStart": source.get("indexationStart", 1),
        "indexationFrequency": source.get("indexationFrequency", 1),
        "productCode": source.get("productCode"),
        "Coverages": [coverage_for_add(item) for item in source.get("Coverages", [])],
    }
    return entity


def current_process(process_id):
    response = api("LoadEntity", {
        "entity": "Proceso",
        "filter": f"id={process_id}",
        "fields": "id, estado",
        "noTracking": True,
    })
    require_ok("LoadEntity Proceso", response)
    return response, out_one(response)


def main():
    with open(POLICY_FILE, encoding="utf-8") as handle:
        source_policy = out_one(json.load(handle))
    with open(OBJECT_FILE, encoding="utf-8") as handle:
        source_objects = json.load(handle).get("outData") or []

    results = []
    response = api("RepoLifePolicy", {"operation": "ADD", "entity": clone_policy(source_policy)})
    require_ok("RepoLifePolicy ADD", response)
    results.append(("RepoLifePolicy ADD", response_summary(response)))
    created = out_one(response)
    policy_id = created.get("id")
    if not policy_id:
        raise RuntimeError("RepoLifePolicy ADD no devolvió policyId")

    process_id = created.get("processId")
    if not process_id:
        response, loaded = current_process(policy_id)
        results.append(("LoadEntity Proceso inicial", response_summary(response)))
        process_id = loaded.get("processId")
    if not process_id:
        policy_response = api("LoadEntity", {"entity": "LifePolicy", "filter": f"id={policy_id}", "fields": "id, processId, code, entityState", "noTracking": True})
        require_ok("LoadEntity LifePolicy inicial", policy_response)
        results.append(("LoadEntity LifePolicy inicial", response_summary(policy_response)))
        process_id = out_one(policy_response).get("processId")
    if not process_id:
        raise RuntimeError("No se pudo recuperar processId para la póliza creada")

    for source_object in source_objects:
        object_entity = {
            "lifePolicyId": policy_id,
            "objectDefinitionId": source_object.get("objectDefinitionId"),
            "jValues": source_object.get("jValues"),
        }
        response = api("RepoInsuredObject", {"operation": "ADD", "entity": object_entity})
        require_ok(f"RepoInsuredObject ADD {source_object.get('objectDefinitionId')}", response)
        results.append((f"RepoInsuredObject ADD {source_object.get('objectDefinitionId')}", response_summary(response)))

    response = api("GotoStep", {"procesoId": process_id, "estado": "_next"})
    require_ok("GotoStep inicial", response)
    results.append(("GotoStep inicial", response_summary(response)))

    response = api("QuotePolicy", {"policyId": policy_id, "dbMode": True, "save": True, "action": "QUOTE"})
    require_ok("QuotePolicy", response)
    results.append(("QuotePolicy", response_summary(response)))

    process_state = None
    for _ in range(4):
        response, process = current_process(process_id)
        results.append(("LoadEntity Proceso", response_summary(response)))
        process_state = process.get("estado")
        if process_state == "Borrador de Póliza":
            break
        response = api("GotoStep", {"procesoId": process_id, "estado": "_next"})
        require_ok("GotoStep emisión", response)
        results.append(("GotoStep emisión", response_summary(response)))
    if process_state != "Borrador de Póliza":
        raise RuntimeError(f"El flujo no llegó a Borrador de Póliza; estado actual: {process_state}")

    response = api("IssuePolicy", {"policyId": policy_id})
    require_ok("IssuePolicy", response)
    results.append(("IssuePolicy", response_summary(response)))

    response = api("LoadEntity", {
        "entity": "LifePolicy",
        "filter": f"id={policy_id}",
        "fields": "id, code, active, entityState, processId, annualPremium, annualTotal",
        "noTracking": True,
    })
    require_ok("LoadEntity LifePolicy final", response)
    final = out_one(response)
    results.append(("LoadEntity LifePolicy final", response_summary(response)))

    print(json.dumps({
        "policyId": policy_id,
        "processId": process_id,
        "final": {key: final.get(key) for key in ("id", "code", "active", "entityState", "processId", "annualPremium", "annualTotal") if key in final},
        "steps": results,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False, indent=2))
        sys.exit(1)
