//block
//noreplace

/*
  *@name: cmdUpdateMasiveProductData
  *@Purpose: Rebuild payplan after Loadings Execution
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 17/06/2026
  *@Input: {}
  *@Output: [{ ok, msg }]
*/

return updateProducts();

function updateProducts() {
  const criteria = getCriteria();
  const products = getProducts();
  if (!Array.isArray(products) || products.length === 0) {
    return { ok: true, msg: "No se encontraron productos para actualizar." };
  }

  const missing = [];
  for (const product of products) {
    const validation = validateProduct(product, criteria);
    if (validation.missing.length > 0) {
      missing.push({
        code: product?.code ?? "",
        name: product?.name ?? "",
        missing: validation.missing
      });
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      msg: `No se actualizó nada porque hay productos sin la propiedad objetivo. Productos afectados: ${missing.map(x => x.code || x.name || "sin-code").join(", ")}`,
      outData: missing
    };
  }

  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (const product of products) {
    try {
      const prepared = prepareProduct(product, criteria);
      if (!prepared.changed) {
        skipped++;
        continue;
      }

      saveProduct(prepared.entity);
      if (!RepoProduct.ok) {
        throw new Error(RepoProduct.msg || "No se pudo actualizar el producto.");
      }

      updated++;
    } catch (error) {
      errors.push(`${product?.code ?? "sin-code"}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      msg: `Actualizados: ${updated}. Omitidos: ${skipped}. Errores: ${errors.join(" | ")}`
    };
  }

  return {
    ok: true,
    msg: `Actualizados: ${updated}. Omitidos: ${skipped}.`
  };
}

function getCriteria() {
  const source = normalizeContext();
  const property = source.property ?? source.field ?? source.key;
  const value = source.value;

  if (isNullOrEmpty(property)) {
    throw new Error("Debes enviar la propiedad a actualizar.");
  }

  return {
    property: String(property).trim(),
    value
  };
}

function getProducts() {
  const source = normalizeContext();
  const filter = isNullOrEmpty(source.filter) ? "" : String(source.filter).trim();

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Product",
      fields: "code,name,lobCode,parentCode,selfService,config,configJson,configJsonOwn",
      filter: isNullOrEmpty(source.filter) ? `code = 'TEST_MAD'` : String(source.filter).trim(),
      noTracking: true
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg || "No se pudieron recuperar los productos.");
  }
  return Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
}

function prepareProduct(product, criteria) {
  const entity = deepClone(product);
  let changed = false;

  const configObject = parseJsonLike(entity.configJson);
  if (configObject) {
    const updated = setDeepValue(configObject, buildTargetPath(criteria.property), criteria.value);
    if (updated) changed = true;
    entity.configJson = JSON.stringify(configObject, null, 2);
  }

  const configOwnObject = parseJsonLike(entity.configJsonOwn);
  if (configOwnObject) {
    const updated = setDeepValue(configOwnObject, buildTargetPath(criteria.property), criteria.value);
    if (updated) changed = true;
    entity.configJsonOwn = JSON.stringify(configOwnObject);
  }

  if (typeof entity.config === "string" && entity.config.trim().length > 0) {
    const updatedConfig = updateConfigText(entity.config, criteria.property, criteria.value);
    if (updatedConfig !== entity.config) {
      entity.config = updatedConfig;
      changed = true;
    }
  }

  return { entity, changed };
}

function validateProduct(product, criteria) {
  const missing = [];
  const propertyPath = buildTargetPath(criteria.property);
  const configJson = parseJsonLike(product?.configJson);
  const configJsonOwn = parseJsonLike(product?.configJsonOwn);

  if (configJson && !hasDeepValue(configJson, propertyPath)) {
    missing.push(`configJson:${criteria.property}`);
  }

  if (configJsonOwn && !hasDeepValue(configJsonOwn, propertyPath)) {
    missing.push(`configJsonOwn:${criteria.property}`);
  }

  if (typeof product?.config === "string" && product.config.trim().length > 0) {
    if (!hasConfigTextLine(product.config, criteria.property)) {
      missing.push(`config:${criteria.property}`);
    }
  }

  return { missing };
}

function buildTargetPath(property) {
  const normalized = String(property).trim();
  if (!normalized) return [];
  if (normalized.includes(".")) return normalized.split(".").filter(Boolean);
  return ["Main", normalized];
}

function updateConfigText(text, property, value) {
  const pattern = new RegExp(`(^\\s*${escapeRegExp(property)}:\\s*)(.*)$`, "m");
  if (!pattern.test(text)) {
    return text;
  }

  return text.replace(pattern, `$1${formatConfigScalar(value)}`);
}

function parseJsonLike(value) {
  if (value == null) return null;
  if (typeof value === "object") return deepClone(value);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function setDeepValue(target, path, value) {
  if (!target || !Array.isArray(path) || path.length === 0) return false;

  let current = target;
  for (let index = 0; index < path.length - 1; index++) {
    const key = path[index];
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  const leafKey = path[path.length - 1];
  if (current[leafKey] === value) {
    return false;
  }

  current[leafKey] = value;
  return true;
}

function hasDeepValue(target, path) {
  if (!target || !Array.isArray(path) || path.length === 0) return false;

  let current = target;
  for (const key of path) {
    if (current == null || typeof current !== "object" || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

function formatConfigScalar(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasConfigTextLine(text, property) {
  const pattern = new RegExp(`(^\\s*${escapeRegExp(property)}\\s*:)`, "m");
  return pattern.test(text);
}

function normalizeContext() {
  if (typeof context === "undefined" || context == null) return {};
  if (typeof context === "string") {
    try {
      return JSON.parse(context);
    } catch {
      return {};
    }
  }
  return context;
}

function isNullOrEmpty(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function saveProduct(entity) {
  doCmd({
    cmd: "RepoProduct",
    data: {
      operation: "UPDATE",
      entity
    }
  });
}

/*
Tarea 847
{
  property: "allowPastEffectDateInChanges",
  value: "-ChangeLoading -InformativeChange -TemporalStatusChange -TemporalStatusChange -InsuredObjectChange -ExclusionChange -ClauseChange -IntermediaryChange -RemoveCoverageChange -AddCoverageChange -ContingentBeneficiaryChange -BeneficiaryChange -TermChange -CapitalChange -CessionBeneficiaryChange -LoadingChange",
  filter: "code = '1_10'"
}
*/
