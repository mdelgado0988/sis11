//block
//noreplace
/*
  *@name: cmdConfiguracionReaseguroPorSuma
  *@Purpose: Recupera el DTO para generación de documento de fianza (general)
  *@Author: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 21/04/2026
  *@Input: {CodigoContrato, Suma, Prima, SumaCoaseguro?, PrimaCoaseguro?, PolizaId?, CoberturaId?}
  *@Note AXX-302: Suma y Prima son la base A DISTRIBUIR, ya neta de coaseguro.
  *        SumaCoaseguro/PrimaCoaseguro son los importes de coaseguro informados (fuente nativa CoCession),
  *        para trazabilidad y validacion. Ausentes o cero => comportamiento identico al anterior.
  *@Note MSN-000038: entradas opcionales ProductoCodigo y Coberturas [{codigo, suma}] (sumas netas de coaseguro de
  *        todas las coberturas de la poliza). La suma evaluada contra la capacidad es la sumatoria de las coberturas
  *        con isCoverage = Si en cfgCoberturaProductoReaFianza para ese producto. Si la suma evaluada (o la propia
  *        cobertura) supera la ultima Capacidad del contrato, cada cobertura deja en el contrato la fraccion
  *        Capacidad / suma evaluada, repartida RET / CP con la ultima banda, y el excedente va a FAC (suma y prima),
  *        con la misma proporcion en todas las coberturas. Sin Coberturas => igual que antes, salvo que una suma sobre
  *        la capacidad ya no va 100% a FAC sino que se topa en la capacidad.
  *@Note MSN-000070 (AXX-4520, 2026-10-14): reparto al centavo. Si cada item de Coberturas trae {id, codigo, limite,
  *        prima, contrato} (contrato = la cobertura la distribuye este mismo contrato; en coaseguro por cobertura,
  *        ModoCoaseguro 3, ademas coSuma y coPrima) y CoberturaId esta entre ellas, la cadena reparte TOTALES de poliza
  *        y deja el residuo de redondeo en la cobertura mayor:
  *          - coaseguro por poliza (PorcentajeRetenido): suma sobre las coberturas isCoverage = Si y prima sobre todas,
  *            igual que la fila Coaseguro de frmDistribucionReaseguro (porcentaje x base, a 2 decimales);
  *          - base neta = emitido - coaseguro, por cobertura y al centavo;
  *          - tope de capacidad, RET / CP de suma y de prima, comision e impuesto, entre las coberturas de este contrato.
  *        Asi coaseguro + retencion + cuota parte + FAC = suma y prima de la poliza, al centavo. La salida trae ademas
  *        base y basePrima (la base neta de la cobertura): el contrato se la entrega al motor con la clave insuredSum,
  *        porque el motor netea el coaseguro sin redondear (23,396,787.86 x 40% = 9,358,715.144) y un reparto que se
  *        pasa por -0.004 le marcaba error a la linea FAC.
  *        Sin ese detalle, o si la base calculada se aparta de la del motor (SumaMotor) mas que el redondeo posible,
  *        reparte por cobertura como antes. En los dos caminos CP = base - RET (antes se redondeaban por separado y
  *        podian sumar un centavo de mas o de menos).
  *@Output: { pret, pcp, msret, mscp, mpret, mpcp, mccp, micp, pfp, msfp, mpfp, mcfp, mifp, SumaEvaluada, Capacidad,
  *          factorContrato, base, basePrima, reparto }
*/

const CodigoContrato = context.CodigoContrato;
const PolizaId = context.PolizaId || "n/d";
const CoberturaId = context.CoberturaId || "n/d";

let reaConfig;
setReaConfig();

//MSN-000038: capacidad = ultimo limite (Capacidad maxima) configurado para el contrato
const ultimaBanda = reaConfig.reduce((m, x) => (!m || x.Capacidad > m.Capacidad) ? x : m, null);
const Capacidad = ultimaBanda && !isNaN(ultimaBanda.Capacidad) ? ultimaBanda.Capacidad : 0;

//codigos de cobertura con isCoverage = Si para el producto; null = producto sin configuracion
const suman = getCoberturasQueSuman();

const detalle = getDetalle();
if (detalle)
  return repartoPoliza(detalle);
return repartoCobertura();

//MSN-000070: reparto de los totales de la poliza, residuo en la cobertura mayor
function repartoPoliza(d) {
  const items = d.items, actual = d.actual;
  const Suma = actual.net / 100, Prima = actual.netP / 100;
  validarBase(Suma, Prima, actual.coS / 100, actual.coP / 100);

  const enSuma = suman ? items.filter(x => suman.includes(x.codigo)) : [];
  const SumaEvaluada = suman ? sumar(enSuma.map(x => x.net)) / 100 : null;

  items.forEach(x => {
    x.ref = Math.max(SumaEvaluada === null ? x.net / 100 : SumaEvaluada, x.net / 100);
    x.tope = Capacidad > 0 && x.ref > Capacidad;
    x.banda = x.tope ? ultimaBanda : reaConfig.find(b => x.ref >= b.RangoSumaInicial && x.ref <= b.RangoSumaFinal);
    x.factor = !x.banda ? 0 : (x.tope ? Capacidad / x.ref : 1);
    x.pret = x.banda ? pct(x.banda.PorcentajeRet) : 0;
    x.pcp = x.banda ? pct(x.banda.PorcentajeCP) : 0;
    x.pccp = x.banda ? pct(x.banda.PorcentajeComision) : 0;
    x.picp = x.banda ? pct(x.banda.PorcentajeImpuesto) : 0;
  });

  //importes de este contrato: suma por grupo (isCoverage = Si juntas, el resto cada una sola), prima entre todas
  const propias = items.filter(x => x.contrato);
  const gruposSuma = [propias.filter(x => enSuma.includes(x))]
    .concat(propias.filter(x => !enSuma.includes(x)).map(x => [x]))
    .filter(g => g.length);
  gruposSuma.forEach(g => asignar(g, x => x.net / 100 * x.factor, "cont", x => x.net));
  gruposSuma.forEach(g => asignar(g, x => x.cont / 100 * x.pret, "ret", x => x.net));
  gruposSuma.forEach(g => partir(g, "cont", "ret", "cp", x => x.cont / 100 * x.pcp, x => x.net));
  propias.forEach(x => { x.fac = x.net - x.cont; });

  asignar(propias, x => x.netP / 100 * x.factor, "contP", x => x.netP);
  asignar(propias, x => x.contP / 100 * x.pret, "retP", x => x.netP);
  partir(propias, "contP", "retP", "cpP", x => x.contP / 100 * x.pcp, x => x.netP);
  propias.forEach(x => { x.facP = x.netP - x.contP; });
  asignar(propias, x => x.cpP / 100 * x.pccp, "com", x => x.netP);
  asignar(propias, x => x.cpP / 100 * x.picp, "imp", x => x.netP);

  const a = actual;
  ["cont", "ret", "cp", "fac", "contP", "retP", "cpP", "facP", "com", "imp"].forEach(k => {
    if (isNaN(a[k]) || a[k] < 0)
      throw "cmdConfiguracionReaseguroPorSuma: reparto invalido (" + k + " = " + a[k] / 100 + "). Contrato " + CodigoContrato +
            ", poliza " + PolizaId + ", cobertura " + CoberturaId + ", base " + Suma + ", prima " + Prima;
  });

  return { pret: a.pret, pcp: a.pcp,
           msret: a.ret / 100, mscp: a.cp / 100, mpret: a.retP / 100, mpcp: a.cpP / 100, mccp: a.com / 100, micp: a.imp / 100,
           pfp: !a.banda ? 100.00 : (a.tope ? (Suma ? Number((a.fac / a.net).toFixed(6)) : 0) : 0),
           msfp: a.fac / 100, mpfp: a.facP / 100, mcfp: 0, mifp: 0,
           SumaEvaluada: SumaEvaluada === null ? Suma : SumaEvaluada, Capacidad,
           factorContrato: !a.banda ? 0 : Number(a.factor.toFixed(6)),
           base: Suma, basePrima: Prima, reparto: "poliza" };
}

//reparto por cobertura (llamada sin detalle, o base fuera de tolerancia): como antes, con CP = base - RET
function repartoCobertura() {
  const Suma = n2(toNumber(context.Suma || 0));
  const Prima = n2(toNumber(context.Prima || 0));
  validarBase(Suma, Prima, toNumber(context.SumaCoaseguro || 0), toNumber(context.PrimaCoaseguro || 0));

  const SumaEvaluada = getSumaEvaluada(Suma);
  const SumaReferencia = Math.max(SumaEvaluada, Suma);

  if (Capacidad > 0 && SumaReferencia > Capacidad) {
    //Excedente a facultativo, manteniendo la proporcion por cobertura en cada linea (RET, CP, FAC)
    const factorContrato = Capacidad / SumaReferencia;
    const SumaContrato = n2(Suma * factorContrato);
    const PrimaContrato = n2(Prima * factorContrato);
    const xpret = pct(ultimaBanda.PorcentajeRet), xpcp = pct(ultimaBanda.PorcentajeCP),
          xpccp = pct(ultimaBanda.PorcentajeComision), xpicp = pct(ultimaBanda.PorcentajeImpuesto);
    let xmsret = n2(xpret * SumaContrato),
        xmscp = n2(SumaContrato - xmsret),
        xmsfp = n2(Suma - SumaContrato),
        xmpret = n2(xpret * PrimaContrato),
        xmpcp = n2(PrimaContrato - xmpret),
        xmpfp = n2(Prima - PrimaContrato);
    let xmccp = n2(xpccp * xmpcp),
        xmicp = n2(xpicp * xmpcp);
    return { pret: xpret, pcp: xpcp, msret: xmsret, mscp: xmscp, mpret: xmpret, mpcp: xmpcp, mccp: xmccp, micp: xmicp,
            pfp: Suma ? Number((xmsfp / Suma).toFixed(6)) : 0,
            msfp: xmsfp,
            mpfp: xmpfp,
            mcfp: 0,
            mifp: 0,
            SumaEvaluada, Capacidad, factorContrato: Number(factorContrato.toFixed(6)),
            base: Suma, basePrima: Prima, reparto: "cobertura" }
  }

  // El rango se determina con la suma acumulada de todas las coberturas que
  // participan en el reaseguro, pero los importes se calculan para la cobertura actual.
  const config = reaConfig.find(x => SumaReferencia >= x.RangoSumaInicial && SumaReferencia <= x.RangoSumaFinal);

  if(!config)
    return { pret: 0, pcp: 0, msret: 0, mscp: 0, mpret: 0, mpcp: 0, mccp: 0, micp: 0, pfp: 100.00, msfp: Suma, mpfp: Prima, mcfp: 0, mifp: 0, SumaEvaluada, Capacidad, factorContrato: 0,
             base: Suma, basePrima: Prima, reparto: "cobertura" }

  //MSN-000038: porcentajes sin redondear a 2 decimales (5.5% se leia como 6% y 94.5% como 94%)
  let pret = pct(config.PorcentajeRet),
        pcp = pct(config.PorcentajeCP),
        pccp = pct(config.PorcentajeComision),
        picp = pct(config.PorcentajeImpuesto);
  //MSN-000070: CP = base - RET cuando las dos lineas suman 100%; redondeadas por separado sumaban un centavo de mas o de menos
  const completa = Math.abs(pret + pcp - 1) < 0.000001;
  let msret = n2(pret * Suma),
        mscp = completa ? n2(Suma - msret) : n2(pcp * Suma),
        mpret = n2(pret * Prima),
        mpcp = completa ? n2(Prima - mpret) : n2(pcp * Prima);
  let mccp = n2(pccp * mpcp),
        micp = n2(picp * mpcp);

  return { pret, pcp, msret, mscp, mpret, mpcp, mccp, micp,
          pfp: 0,
          msfp: 0,
          mpfp: 0,
          mcfp: 0,
          mifp: 0,
          SumaEvaluada, Capacidad, factorContrato: 1,
          base: Suma, basePrima: Prima, reparto: "cobertura" }
}

//AXX-302: si la base llega negativa, el coaseguro supera lo emitido. Se detiene con error trazable.
function validarBase(Suma, Prima, SumaCoaseguro, PrimaCoaseguro) {
  if (Suma < 0)
    throw "cmdConfiguracionReaseguroPorSuma: el coaseguro supera la SUMA emitida. Contrato " + CodigoContrato +
          ", poliza " + PolizaId + ", cobertura " + CoberturaId +
          ". Suma emitida " + n2(Suma + SumaCoaseguro) + ", coaseguro " + SumaCoaseguro + ", a distribuir " + Suma;
  if (Prima < 0)
    throw "cmdConfiguracionReaseguroPorSuma: el coaseguro supera la PRIMA emitida. Contrato " + CodigoContrato +
          ", poliza " + PolizaId + ", cobertura " + CoberturaId +
          ". Prima emitida " + n2(Prima + PrimaCoaseguro) + ", coaseguro " + PrimaCoaseguro + ", a distribuir " + Prima;
}

//MSN-000070: coberturas con su emitido y su coaseguro en centavos, y la cobertura actual. null = reparto por cobertura.
function getDetalle() {
  const coberturas = Array.isArray(context.Coberturas) ? context.Coberturas : [];
  if (!coberturas.length || context.CoberturaId == null) return null;
  if (!coberturas.every(c => c && c.id != null && c.limite != null && c.prima != null && c.contrato != null)) return null;
  const pos = coberturas.findIndex(c => String(c.id) == String(context.CoberturaId));
  if (pos < 0 || !coberturas[pos].contrato) return null;

  const modo = toNumber(context.ModoCoaseguro || 0);
  const retenido = context.PorcentajeRetenido == null ? 100 : toNumber(context.PorcentajeRetenido);
  if (isNaN(modo) || isNaN(retenido)) return null;

  const items = coberturas.map(c => ({
    id: c.id, codigo: String(c.codigo || "").trim(), contrato: c.contrato === true || c.contrato === 1 || c.contrato === "true",
    lim: cents(toNumber(c.limite)), pri: cents(toNumber(c.prima)),
    coS: modo == 3 ? cents(toNumber(c.coSuma || 0)) : 0,
    coP: modo == 3 ? cents(toNumber(c.coPrima || 0)) : 0 }));
  if (items.some(x => isNaN(x.lim) || isNaN(x.pri) || isNaN(x.coS) || isNaN(x.coP))) return null;

  //coaseguro por poliza: porcentaje cedido x base, a 2 decimales, como la fila Coaseguro del formulario
  const porcentajeCo = modo > 0 && modo != 3 ? 100 - retenido : 0;
  if (porcentajeCo > 0) {
    const enSuma = suman ? items.filter(x => suman.includes(x.codigo)) : [];
    if (enSuma.length) asignar(enSuma, x => x.lim / 100 * porcentajeCo / 100, "coS", x => x.lim);
    items.filter(x => !enSuma.includes(x)).forEach(x => { x.coS = cents(n2(x.lim / 100 * porcentajeCo / 100)); });
    asignar(items, x => x.pri / 100 * porcentajeCo / 100, "coP", x => x.pri);
  }
  items.forEach(x => { x.net = x.lim - x.coS; x.netP = x.pri - x.coP; });

  //la base tiene que ser la del motor salvo el redondeo; si no, algo distinto paso y se reparte por cobertura
  const actual = items[pos];
  const tolerancia = 0.005 * (items.length + 1) + 0.000001;
  if (context.SumaMotor != null && Math.abs(actual.net / 100 - toNumber(context.SumaMotor)) > tolerancia) return null;
  if (context.PrimaMotor != null && Math.abs(actual.netP / 100 - toNumber(context.PrimaMotor)) > tolerancia) return null;
  return { items, actual };
}

//reparte el total redondeado de los importes exactos del grupo: cada una el suyo a 2 decimales, la mayor el residuo
function asignar(grupo, exacto, campo, tamano) {
  if (!grupo.length) return;
  const exactos = grupo.map(exacto);
  let ancla = 0;
  grupo.forEach((x, k) => { if (tamano(x) > tamano(grupo[ancla])) ancla = k; });
  let otras = 0;
  grupo.forEach((x, k) => { if (k != ancla) { x[campo] = cents(n2(exactos[k])); otras += x[campo]; } });
  const resto = cents(n2(exactos.reduce((t, v) => t + v, 0))) - otras;
  grupo[ancla][campo] = resto < 0 && exactos[ancla] >= 0 ? cents(n2(exactos[ancla])) : resto;
}

//CP = contrato - RET cuando las dos lineas suman 100%; si la banda no suma 100%, CP por su porcentaje
function partir(grupo, total, ret, campo, exacto, tamano) {
  if (!grupo.length) return;
  if (grupo.every(x => Math.abs(x.pret + x.pcp - 1) < 0.000001))
    grupo.forEach(x => { x[campo] = x[total] - x[ret]; });
  else
    asignar(grupo, exacto, campo, tamano);
}

function getCoberturasQueSuman() {
  const coberturas = Array.isArray(context.Coberturas) ? context.Coberturas : [];
  const producto = String(context.ProductoCodigo || "").trim();
  if (!coberturas.length || !producto) return null;

  doCmd({cmd :"GetFullTable", data: {table: "cfgCoberturaProductoReaFianza"}});
  if(!GetFullTable.ok)
    throw "cmdConfiguracionReaseguroPorSuma: no se pudo leer cfgCoberturaProductoReaFianza: " + GetFullTable.msg;

  const filas = mapearTablaConfig(GetFullTable.outData ?? [])
    .filter(x => String(x.productCode || "").trim() == producto);
  if (!filas.length) return null;

  return filas
    .filter(x => String(x.isCoverage || "").trim().toUpperCase() == "SI")
    .map(x => String(x.coverageCode || "").trim());
}

//MSN-000038: sumatoria (neta de coaseguro) de las coberturas de la poliza con isCoverage = Si para el producto.
//Sin Coberturas o sin el producto en la tabla => la propia Suma (comportamiento por cobertura).
function getSumaEvaluada(Suma) {
  if (!suman) return Suma;
  const coberturas = Array.isArray(context.Coberturas) ? context.Coberturas : [];
  return n2(coberturas
    .filter(c => suman.includes(String(c.codigo || "").trim()))
    .reduce((t, c) => t + toNumber(c.suma || 0), 0));
}

function pct(value) {
  return Number((toNumber(value) / 100).toFixed(6));
}

function sumar(valores) {
  return valores.reduce((t, v) => t + v, 0);
}

function cents(value) {
  return Math.round(n2(value) * 100);
}

function setReaConfig() {

  doCmd({cmd :"GetFullTable", data: {table: "cfgContratoReaseguroPorSuma"}});

   if(!GetFullTable.ok)
      console.error("Error leyendo configuración de contrato");

  reaConfig = mapearTablaConfig(GetFullTable.outData ?? []);
  reaConfig = reaConfig.filter(x => x.CodigoContrato == CodigoContrato);

  reaConfig.forEach(x => {
    x["PorcentajeRet"] = toNumber(x["PorcentajeRet"]);
    x["PorcentajeCP"] = toNumber(x["PorcentajeCP"]);
    x["Capacidad"] = toNumber(x["Capacidad"]);
    x["PorcentajeComision"] = toNumber(x["PorcentajeComision"]);
    x["PorcentajeImpuesto"] = toNumber(x["PorcentajeImpuesto"]);
    x["RangoSumaInicial"] = toNumber(x["RangoSumaInicial"]);
    x["RangoSumaFinal"] = toNumber(x["RangoSumaFinal"]);
  });
  
}

function mapearTablaConfig(data) {

  if (!data || !data.length) return [];

  const headersOriginal = data[0];

  // Resolver nombres duplicados
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = h.trim();

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  // Mapear filas
  const result = data.slice(1).map(row => {
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = row[i];
    });

    return obj;
  });

  return result;
}

function toNumber(value) {
  // Si ya es número, retornarlo (validando NaN)
  if (typeof value === 'number') {
    return Number.isNaN(value) ? NaN : value;
  }

  // Si no es string ni number, no es válido
  if (typeof value !== 'string') return NaN;

  // Elimina separadores de miles (comas)
  const normalized = value.replace(/,/g, '');

  // Convierte a número
  return Number(normalized);
}

function n2(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return NaN;

  return Number(value.toFixed(2)); // devuelve string
}

/*
test: 
CodigoContrato: CPF
Suma: 450000
*/
