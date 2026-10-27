//block
//noreplace

/*
  *@name: cmdFinVigencia30Junio
  *@Purpose: MSN-000090 (AXX-5809) - EG6 Plan colaboradores: la vigencia termina siempre el 1 de julio.
  *  Devuelve la fecha fin: el próximo 1 de julio posterior a la fecha de inicio, contado sobre el día
  *  calendario local del ambiente (Main.timeOffset; Panamá = -5) y con la misma hora de la fecha de inicio.
  *  Inicio 01/01/2026 -> fin 01/07/2026. Inicio 01/07/2026 o 01/08/2026 -> fin 01/07/2027. Nunca más de un año.
  *  Sólo calcula, no escribe nada. La usan los triggers EG6FINVIGENCIA (QuotePolicy y RepoLifePolicy).
  *@Input: {start}  fecha de inicio ISO; sin zona horaria se toma como UTC, que es como la guarda la base
  *@Output: {ok, end, dias, diasAnio, inicioLocal, finLocal, msg}
*/

const entrada = context || {};
const msDia = 86400000;

let offsetHoras = -5;
try {
  doCmd({cmd: "GetConfig", data: {path: "$.Main.timeOffset"}});
  const valorOffset = GetConfig.ok ? Number(GetConfig.outData) : NaN;
  if (GetConfig.outData !== null && GetConfig.outData !== undefined && isFinite(valorOffset)) offsetHoras = valorOffset;
} catch (errorConfig) { }

const texto = String(entrada.start || "").trim();
if (!texto) return {ok: false, msg: "Falta la fecha de inicio"};
const conZona = /(Z|[+-]\d\d:?\d\d)$/i.test(texto) ? texto : texto + "Z";
const inicio = new Date(conZona);
if (isNaN(inicio.getTime())) return {ok: false, msg: "Fecha de inicio inválida: " + texto};

//día calendario local de la fecha de inicio
const local = new Date(inicio.getTime() + offsetHoras * 3600000);
const anio = local.getUTCFullYear();
const mes = local.getUTCMonth();
const dia = local.getUTCDate();
const diaInicio = Date.UTC(anio, mes, dia);

//próximo 1 de julio estrictamente posterior al día de inicio
let objetivo = Date.UTC(anio, 6, 1);
if (objetivo <= diaInicio) objetivo = Date.UTC(anio + 1, 6, 1);

const dias = Math.round((objetivo - diaInicio) / msDia);
const diasAnio = Math.round((Date.UTC(anio + 1, mes, dia) - diaInicio) / msDia);
const fin = new Date(inicio.getTime() + dias * msDia);
const fechaTexto = ms => new Date(ms).toISOString().slice(0, 10);

return {
  ok: true,
  end: fin.toISOString(),
  dias: dias,
  diasAnio: diasAnio,
  inicioLocal: fechaTexto(diaInicio),
  finLocal: fechaTexto(objetivo),
  msg: "Fin de vigencia " + fechaTexto(objetivo) + " (" + dias + " de " + diasAnio + " días)"
};
