//block
//noreplace

/*
 * Name: cmdReporteFiniquitoIN
 * Description: Generates the claim settlement document DTO
 * Author: Michael Delgado
 * Email: michael.delgado@axxis-systems.com
 * Creation Date: 06/01/2026
 * Input: { row: { reclamo } }
 * Output: { resultado }
 */

const claimId = context?.row?.reclamo;
const timeZoneOffsetMinutes = Number.isFinite(Number(context?.row?.timeZoneOffsetMinutes))
  ? Number(context.row.timeZoneOffsetMinutes)
  : -300;
const objectDefinitionId = [46,47]
const quitarCodigo = texto => texto.split(" - ").slice(1).join(" - ");
const n2 = value => Number(String(value ?? '').replace(/,/g, ''));

if (!claimId) {
  throw new Error("No se recibió el reclamo");
}

const claim = getClaim();
const policy = getPolicy(claim);
const cessionBeneficiary = getCessionBeneficiary(policy);
const claimerContact = getClaimerContact(claim);
const lob = getLob(policy);
const product = getProduct(policy);

//return { lob, product }

let resultado = {};

resultado.reclamo = claim.code;
resultado.asegurado = claimerContact.name;
resultado.identificacion = claimerContact.cnp;
resultado.provincia = getCatalogValue("RepoStateCatalog", `countryCode = '${policy.insuredObject?.userData?.cmbPais ?? "0"}' AND code = '${policy.insuredObject?.userData?.cmbProvincia ?? "0"}'`)
resultado.ciudad = getCatalogValue("RepoCityCatalog", `stateCode = '${policy.insuredObject?.userData?.cmbProvincia ?? "0"}' AND code = '${policy.insuredObject?.userData?.cmbMunicipio ?? "0"}'`)
resultado.corregimiento = getCatalogValue("RepoSectorCatalog", `code = '${policy.insuredObject?.userData?.cmbSector ?? "0"}'`)
resultado.barriada = policy.insuredObject?.userData?.txtBarriadas ?? "";
resultado.edificio = policy.insuredObject?.userData?.txtEdificios ?? "";
resultado.apartamento = policy.insuredObject?.userData?.aptoocasa ?? "";
resultado.calle = policy.insuredObject?.userData?.calleoavenida ?? "";
resultado.poliza = policy.code;
resultado.fechaSiniestro = claim.occurrence;
const ubicacion = [resultado.edificio, resultado.calle]
  .map(value => String(value ?? '').trim())
  .filter(Boolean);
const referencias = [
  resultado.apartamento ? `${String(resultado.apartamento).trim()}` : '',
  resultado.corregimiento ? `Corregimiento de ${String(resultado.corregimiento).trim()}` : '',
  resultado.ciudad ? `Distrito de ${String(resultado.ciudad).trim()}` : '',
  resultado.provincia ? `Provincia de ${String(resultado.provincia).trim()}` : ''
].filter(Boolean);
const descripcionUbicacion = [...ubicacion, ...referencias].join(', ');
resultado.descripcionSiniestro = descripcionUbicacion
  ? `la Propiedad Asegurada ${descripcionUbicacion}`
  : 'la Propiedad Asegurada';
resultado.ramo = quitarCodigo(lob.name);
resultado.telefono = claimerContact.phone;
resultado.correo = claimerContact.email;
resultado.producto = product.name;
resultado.nombreCobertura = getNombreCobertura(claim);
//resultado.coverages = policy.coverages;

resultado.lifeCoverageIdsHoteleria = getCoverageIdsByCodes(policy.coverages, ["251", "954"]);

resultado.totalhotel = sumPaymentDetailsByCoverageIds(claim.payments, resultado.lifeCoverageIdsHoteleria);

resultado.chequehotel = getCurrentCheckNumber(claim.payments, payment =>
  (payment.detail || []).some(d =>
    resultado.lifeCoverageIdsHoteleria.includes(Number(d.lifeCoverageId))
  )
);

resultado.lifeCoverageIdsContenido = getCoverageIdsByCodes(policy.coverages, ["256", "258"]);

resultado.totalcontenido = formatN2(sumPaymentDetailsByCoverageIds(claim.payments, resultado.lifeCoverageIdsContenido));


// Edificio sigue el criterio histórico: todo lo pagado que no pertenezca a contenido.
resultado.totaledificio = formatN2(sumPaymentDetailsExcludingCoverageIds(claim.payments, resultado.lifeCoverageIdsContenido));
resultado.total = formatN2(sumPaymentDetails(claim.payments));

resultado.chequetotal = getCurrentCheckNumber(claim.payments);

resultado.acreedor = cessionBeneficiary.name ?? "No Tiene";
resultado.identificacionacreedor = cessionBeneficiary.cnp ?? "";
resultado.beneficiario = claimerContact.name ?? "";
resultado.identificacionbeneficiario = claimerContact.cnp ?? "";

//resultado.pagos = claim.payments

/*
cmbPais: "591"
cmbProvincia: "8"
cmbMunicipio: "808"
cmbSector: "80802"
*/

resultado.totalhotelletras = montoEnLetras(n2(resultado.totalhotel));
resultado.fechaletras = fechaEnLetras(resultado.fechaSiniestro, timeZoneOffsetMinutes);
resultado.totalletras = montoEnLetras(n2(resultado.total));

return resultado;

function getClaim() {
  doCmd({cmd: "LoadEntity", data: { entity: "Claim", fields:"code, occurrence, lifePolicyId, contactId", filter: `id = ${claimId}` }})
  const claim = LoadEntity.outData ?? {};

  if (!claim?.code) {
    throw new Error(`No se encontró el reclamo ${claimId}`);
  }

  if (!claim?.lifePolicyId) {
    throw new Error(`El reclamo ${claimId} no tiene póliza asociada`);
  }

  if (!claim?.contactId) {
    throw new Error(`El reclamo ${claimId} no tiene asegurado asociado`);
  }
  
  doCmd({cmd: "LoadEntities", data: { entity: "ClaimPayment", fields:"contactId, date, user, total, jDetail, currency, coverageId, checkNum", filter: `claimId = ${claimId}` }})
  claim.payments = LoadEntities.outData ?? [];
  for (let payment of claim.payments) {
    payment.detail = payment?.jDetail ? safeJson(payment.jDetail, []) : [];
  }
  return claim;
}

function getPolicy(claim) {
  doCmd({cmd: "LoadEntity", data: { entity: "LifePolicy", fields:"id, code, holderId, cessionBeneficiary, lob, productCode", filter: `id = ${claim.lifePolicyId}` }})
  const policy = LoadEntity.outData ?? {};

  const ids = objectDefinitionId.join(',');
  
  doCmd({cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifepolicyId = ${policy.id} AND objectDefinitionId in (${ids})` }})
  policy.insuredObject = RepoInsuredObject.outData?.[0] ?? {};

  doCmd({cmd: "LoadEntities", data: { entity: "LifeCoverage", fields: "id, code, name, limit, deductible", filter: `lifepolicyId = ${policy.id}` }})
  policy.coverages = LoadEntities.outData ?? [];
  return policy;
}

function getLob(policy) {
  doCmd({cmd: "LoadEntity", data: { entity: "Lob", fields:"code, name", filter: `code = '${policy.lob}'` }})
  return LoadEntity.outData ?? {};
}

function getProduct(policy) {
  doCmd({cmd: "LoadEntity", data: { entity: "Product", fields:"code, name", filter: `code = '${policy.productCode}'` }})
  return LoadEntity.outData ?? {};
}

function getClaimerContact(claim) {
  doCmd({cmd: "LoadEntity", data: { entity: "Contact", fields:`id, CASE
        WHEN isPerson = 1 THEN LTRIM(RTRIM(CONCAT_WS(' ', name, middleName, surname1, surname2)))
        ELSE surname2
    END AS name, cnp, phone, email`, filter: `id = ${claim.contactId}` }})
  return LoadEntity.outData ?? {};
}

function getCessionBeneficiary(policy) {
  if (!policy?.cessionBeneficiary) return {};
  doCmd({cmd: "LoadEntity", data: { entity: "Contact", fields:`id, CASE
        WHEN isPerson = 1 THEN LTRIM(RTRIM(CONCAT_WS(' ', name, middleName, surname1, surname2)))
        ELSE surname2
    END AS name, CASE WHEN isPerson = 1 THEN cnp ELSE nif END cnp`, filter: `id = ${policy.cessionBeneficiary}` }})
  return LoadEntity.outData ?? {};
}

function getCatalogValue(cmd, filter, field = "name") {
  doCmd({
    cmd,
    data: {
      operation: "GET",
      filter
    }
  });

  // El runtime expone el resultado del último doCmd en this[cmd].
  // Este patrón ya es el contrato esperado por los chains y no ha mostrado problemas en la ejecución actual.
  return this[cmd]?.outData?.[0]?.[field] ?? "";
}

function getNombreCobertura(claim) {
  const coverageId = Number((claim?.payments || [])
    .flatMap(payment => Array.isArray(payment?.detail) ? payment.detail : [])
    .find(detail => Number(detail?.lifeCoverageId) > 0)?.lifeCoverageId || 0);

  if (!coverageId) return "";

  return (policy.coverages || []).find(item => Number(item?.id) === coverageId)?.name || "";
}

function sumPaymentDetails(payments) {
  return (payments || []).reduce((sum, payment) => {
    const rows = Array.isArray(payment?.detail) ? payment.detail : [];
    return sum + rows.reduce((subSum, row) => subSum + Number(row?.amount || 0), 0);
  }, 0);
}

function sumPaymentDetailsByCoverageIds(payments, coverageIds) {
  const coverageSet = new Set((coverageIds || []).map(id => Number(id)).filter(id => id > 0));

  return (payments || []).reduce((sum, payment) => {
    const rows = Array.isArray(payment?.detail) ? payment.detail : [];
    return sum + rows
      .filter(row => coverageSet.has(Number(row?.lifeCoverageId)))
      .reduce((subSum, row) => subSum + Number(row?.amount || 0), 0);
    }, 0);
}

function sumPaymentDetailsExcludingCoverageIds(payments, coverageIds) {
  const coverageSet = new Set((coverageIds || []).map(id => Number(id)).filter(id => id > 0));

  return (payments || []).reduce((sum, payment) => {
    const rows = Array.isArray(payment?.detail) ? payment.detail : [];
    return sum + rows
      .filter(row => !coverageSet.has(Number(row?.lifeCoverageId)))
      .reduce((subSum, row) => subSum + Number(row?.amount || 0), 0);
  }, 0);
}

function getCoverageIdsByCodes(coverages, codes) {
  const codeSet = new Set((codes || []).map(code => String(code)));

  return (coverages || [])
    .filter(coverage => codeSet.has(String(coverage?.code)))
    .map(coverage => Number(coverage?.id))
    .filter(id => id > 0);
}

function getCurrentCheckNumber(payments, predicate = () => true) {
  const candidates = (payments || [])
    .filter(payment => predicate(payment))
    .map(payment => ({
      checkNum: Number(payment?.checkNum || 0),
      date: parsePaymentDate(payment?.date)
    }))
    .filter(item => item.checkNum > 0 && item.date);

  if (!candidates.length) {
    return '';
  }

  candidates.sort((a, b) => {
    const timeDiff = b.date.getTime() - a.date.getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.checkNum - a.checkNum;
  });

  return candidates[0].checkNum;
}

function parsePaymentDate(value) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function safeJson(raw, fallback) {
  try {
    if (!raw || !String(raw).trim()) return fallback;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    return fallback;
  }
}

function montoEnLetras(monto) {
  const UNIDADES = ['', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
  const DIEZ_A_DIECINUEVE = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
  const DECENAS = ['', '', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
  const CENTENAS = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];

  function convertirNumero(n) {
    if (n === 0) return 'Cero';
    if (n === 100) return 'Cien';

    let texto = '';

    if (n > 99) {
      texto += CENTENAS[Math.floor(n / 100)] + ' ';
      n = n % 100;
    }

    if (n >= 10 && n < 20) {
      texto += DIEZ_A_DIECINUEVE[n - 10];
    } else if (n >= 20) {
      texto += DECENAS[Math.floor(n / 10)];
      if (n % 10 !== 0) texto += ' y ' + UNIDADES[n % 10];
    } else if (n > 0) {
      texto += UNIDADES[n];
    }

    return texto.trim();
  }

  function convertirMiles(n) {
    if (n < 1000) return convertirNumero(n);
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;

    let texto = miles === 1 ? 'Mil' : convertirNumero(miles) + ' Mil';
    if (resto > 0) texto += ' ' + convertirNumero(resto);
    return texto;
  }

  const entero = Math.floor(monto);
  const decimales = Math.round((monto - entero) * 100)
    .toString()
    .padStart(2, '0');

  let letras = convertirMiles(entero);

  letras += ' Dólares con ' + decimales + '/100';

  return letras;
}

function fechaEnLetras(fecha, timeZoneOffsetMinutes = -300) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const f = new Date(fecha);

  if (isNaN(f)) return '';

  const offset = Number.isFinite(Number(timeZoneOffsetMinutes))
    ? Number(timeZoneOffsetMinutes)
    : -300;
  const localDate = new Date(f.getTime() + offset * 60 * 1000);
  const dia = localDate.getUTCDate();
  const mes = meses[localDate.getUTCMonth()];
  const anio = localDate.getUTCFullYear();

  return `${dia} de ${mes} de ${anio}`;
}

function formatN2(value) {
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }

  const num = Number(String(value).replace(/,/g, ''));

  if (isNaN(num)) {
    return '0.00';
  }

  return num
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
