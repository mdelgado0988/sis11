//block
//noreplace
/*
Michael Delgado. 2025.12.17. GLOB-119
Parameters:
 context.row.reclamo       Id del siniestro
 simular: { row: { reclamo: 23 } }

details:
  lifeCoverageId = 251 cobertura de gastos de hoteleria
*/

const claimId = context.row.reclamo;
let claim;
let policy;
let cessionBeneficiary;
let claimerContact;
let lob;
let product;
const objectDefinitionId = [46,47]
const quitarCodigo = texto => texto.split(" - ").slice(1).join(" - ");
const n2 = value => Number(String(value ?? '').replace(/,/g, ''));

setClaim();
setPolicy();
setCessionBeneficiary();
setClaimerContact();
setLob();
setProduct();

//return { lob, product }

let resultado = {};

resultado.reclamo = claim.code;
resultado.asegurado = claimerContact.name;
resultado.identificacion = claimerContact.cnp;
resultado.reclamo = claim.code;
resultado.provincia = getCatalogValue("RepoStateCatalog", `countryCode = '${policy.insuredObject?.userData?.cmbPais ?? "0"}' AND code = '${policy.insuredObject?.userData?.cmbProvincia ?? "0"}'`)
resultado.ciudad = getCatalogValue("RepoCityCatalog", `stateCode = '${policy.insuredObject?.userData?.cmbProvincia ?? "0"}' AND code = '${policy.insuredObject?.userData?.cmbMunicipio ?? "0"}'`)
resultado.corregimiento = getCatalogValue("RepoSectorCatalog", `code = '${policy.insuredObject?.userData?.cmbSector ?? "0"}'`)
resultado.barriada = policy.insuredObject?.userData?.txtBarriadas ?? "";
resultado.edificio = policy.insuredObject?.userData?.txtEdificios ?? "";
resultado.apartamento = policy.insuredObject?.userData?.aptoocasa ?? "";
resultado.calle = policy.insuredObject?.userData?.calleoavenida ?? "";
resultado.poliza = policy.code;
resultado.fechaSiniestro = claim.occurrence;
resultado.ramo = quitarCodigo(lob.name);
resultado.telefono = claimerContact.phone;
resultado.correo = claimerContact.email;
resultado.producto = product.name;
//resultado.coverages = policy.coverages;

resultado.lifeCoverageIdsHoteleria = policy.coverages
  .filter(c => ["251", "954"].includes(c.code))
  .map(c => c.id);

resultado.totalhotel = claim.payments.reduce((sum, payment) => {
  return sum + (payment.detail || [])
    .filter(d => resultado.lifeCoverageIdsHoteleria.includes(d.lifeCoverageId))
    .reduce((subSum, d) => subSum + Number(d.amount || 0), 0);
}, 0);

resultado.chequehotel = claim.payments.reduce((max, payment) => {
  const aplica = (payment.detail || []).some(d =>
    resultado.lifeCoverageIdsHoteleria.includes(d.lifeCoverageId)
  );

  return aplica
    ? Math.max(max, Number(payment.checkNum || 0))
    : max;
}, 0);

resultado.lifeCoverageIdsContenido = policy.coverages
  .filter(c => ["256", "258"].includes(c.code))
  .map(c => c.id);

resultado.totalcontenido = claim.payments.reduce((sum, payment) => {
  return sum + (payment.detail || [])
    .filter(d => resultado.lifeCoverageIdsContenido.includes(d.lifeCoverageId))
    .reduce((subSum, d) => subSum + Number(d.amount || 0), 0);
}, 0);

resultado.totaledificio = formatN2(policy.insuredObject?.userData?.txtSA ?? "0.00");
resultado.total = claim.payments.reduce((sum, payment) => {
  return sum + (payment.detail || [])
    .reduce((subSum, d) => subSum + Number(d.amount || 0), 0);
}, 0);
resultado.total = formatN2(resultado.total ?? 0);

resultado.chequetotal = claim.payments.reduce(
  (max, payment) => Math.max(max, Number(payment.checkNum || 0)),
  0
);

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
resultado.fechaletras = fechaEnLetras(resultado.fechaSiniestro);
resultado.totalletras = montoEnLetras(n2(resultado.total));

return resultado;

function setClaim() {
  doCmd({cmd: "LoadEntity", data: { entity: "Claim", fields:"code, occurrence, lifePolicyId, contactId", filter: `id = ${claimId}` }})
  claim = LoadEntity.outData ?? {};
  
  doCmd({cmd: "LoadEntities", data: { entity: "ClaimPayment", fields:"contactId, date, user, total, jDetail, currency", filter: `claimId = ${claimId} AND entityState = 'EXECUTED'` }})
  claim.payments = LoadEntities.outData ?? [];
  for (let payment of claim.payments) {
    payment.detail = payment?.jDetail ? JSON.parse(payment.jDetail) : {};
  }
  
}

function setPolicy() {
  doCmd({cmd: "LoadEntity", data: { entity: "LifePolicy", fields:"id, code, holderId, cessionBeneficiary, lob, productCode", filter: `id = ${claim.lifePolicyId}` }})
  policy = LoadEntity.outData ?? {};

  const ids = objectDefinitionId.join(',');
  
  doCmd({cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifepolicyId = ${policy.id} AND objectDefinitionId in (${ids})` }})
  policy.insuredObject = RepoInsuredObject.outData?.[0] ?? {};

  doCmd({cmd: "LoadEntities", data: { entity: "LifeCoverage", fields: "id, code, name, limit, deductible", filter: `lifepolicyId = ${policy.id}` }})
  policy.coverages = LoadEntities.outData ?? [];
  
}

function setLob() {
  doCmd({cmd: "LoadEntity", data: { entity: "Lob", fields:"code, name", filter: `code = '${policy.lob}'` }})
  lob = LoadEntity.outData ?? {};
}

function setProduct() {
  doCmd({cmd: "LoadEntity", data: { entity: "Product", fields:"code, name", filter: `code = '${policy.productCode}'` }})
  product = LoadEntity.outData ?? {};
}

function setClaimerContact() {
  doCmd({cmd: "LoadEntity", data: { entity: "Contact", fields:`id, CASE
        WHEN isPerson = 1 THEN LTRIM(RTRIM(CONCAT_WS(' ', name, middleName, surname1, surname2)))
        ELSE surname2
    END AS name, cnp, phone, email`, filter: `id = ${claim.contactId}` }})
  claimerContact = LoadEntity.outData ?? {};
}

function setCessionBeneficiary() {
  doCmd({cmd: "LoadEntity", data: { entity: "Contact", fields:`id, CASE
        WHEN isPerson = 1 THEN LTRIM(RTRIM(CONCAT_WS(' ', name, middleName, surname1, surname2)))
        ELSE surname2
    END AS name, CASE WHEN isPerson = 1 THEN cnp ELSE nif END cnp`, filter: `id = ${policy.cessionBeneficiary}` }})
  cessionBeneficiary = LoadEntity.outData ?? {};
}

function getCatalogValue(cmd, filter, field = "name") {
  doCmd({
    cmd,
    data: {
      operation: "GET",
      filter
    }
  });

  return this[cmd]?.outData?.[0]?.[field] ?? "";
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

function fechaEnLetras(fecha) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const f = new Date(fecha);

  if (isNaN(f)) return '';

  const dia = f.getDate();
  const mes = meses[f.getMonth()];
  const anio = f.getFullYear();

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