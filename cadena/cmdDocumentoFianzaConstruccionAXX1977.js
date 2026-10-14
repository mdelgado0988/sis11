//block
//noreplace
// AXX-1977: contexto documental exclusivo de Construccion Gobierno, cobertura 303.
// name: cmdDocumentoFianzaConstruccionAXX1977
const id = Number(context.policyId);
if (!Number.isInteger(id) || id <= 0) throw new Error('policyId requerido');
doCmd({cmd:'ExeChain',data:{chain:'cmdDocumentoFianzaDTO',context:JSON.stringify({policyId:id})}});
if (!ExeChain.ok) throw new Error(ExeChain.msg);
const resultado = ExeChain.outData;
doCmd({cmd:'RepoLifePolicy',data:{operation:'GET',filter:'id='+id,include:['Coverages','InsuredObjects']}});
if (!RepoLifePolicy.ok || !RepoLifePolicy.outData.length) throw new Error('Poliza no disponible');
const pol = RepoLifePolicy.outData[0];
resultado.NombreRamo = getNombreRamo(pol);
resultado.NombreProducto = getNombreProducto(pol);
resultado.TipoMovimientoFactura = /^nuevo$/i.test(String(resultado.TipoMovimiento || '').trim())
  ? 'NUEVA'
  : resultado.TipoMovimiento;
const fechaPartesFactura = String(resultado.FechaActual || '').split('/');
resultado.FechaActualFactura = fechaPartesFactura.length === 3
  ? fechaPartesFactura[0].padStart(2, '0') + '/' + fechaPartesFactura[1].padStart(2, '0') + '/' + fechaPartesFactura[2]
  : resultado.FechaActual;
if (pol.productCode !== '81FIAGCCOG') return resultado;
const oa = (pol.InsuredObjects || []).find(x => x.objectDefinitionId === 44);
if (!oa) return resultado;
const datos = oa.userData || {};
const principal = (pol.Coverages || []).find(x => String(x.code) === '303');
if (!principal) return resultado;
let filas;
try { filas = JSON.parse(datos.hiddenCobtar || '[]'); } catch(e) { filas = []; }
const fila = filas.find(x => String(x.coverageCode) === '303');
const dias = Number(fila && fila['Duración Días']);
const tipos = {'2':'hábiles','3':'calendario'};
const tipo = tipos[String(datos.tipo_vigencia).trim()] || '';
if (Number.isFinite(dias) && dias > 0) resultado.DiasVigencia = dias;
resultado.TipoDias = tipo;
resultado.DiasVigenciaTexto = resultado.DiasVigencia+' DÍAS '+tipo.toUpperCase()+' A PARTIR DEL '+resultado.DesdeTexto;
resultado.NumeroContrato = String(datos.txtNumeroContratoFianza || datos.txtNumeroContrato || '').trim();

// AXX-1977 BA: presentation fields exclusive to the invoice.
// AXX-2419 (GLOBUAT-269 #11): limite de responsabilidad con el monto en letras entre parentesis, formato contractual.
const sumaLetras = String(resultado.SumaLetras || '').replace(/\s+/g, ' ').trim();
if (sumaLetras) resultado.SumaTextoTotal = String(resultado.MonedaMonto || '').trim() + ' (' + sumaLetras + ')';
resultado.SumaTextoTotal = String(resultado.SumaTextoTotal || '').replace(/B\/\.\s+/g, 'B/.');
// AXX-2419 r2 (GLOBUAT-269 #3): vigencia de la factura con día y mes a dos dígitos (06/09/2026, no 6/9/2026).
const dosDigitos = f => { const p = String(f || '').split('/'); return p.length === 3 ? p[0].padStart(2, '0') + '/' + p[1].padStart(2, '0') + '/' + p[2] : f; };
resultado.Desde = dosDigitos(resultado.Desde);
resultado.Hasta = dosDigitos(resultado.Hasta);
// AXX-2419 r2 (#4): el contrato imprime «Días{custom.TipoDias}»; el espacio va con el tipo, así sin tipo no queda «Días ,».
resultado.TipoDias = String(resultado.TipoDias || '').trim() ? ' ' + String(resultado.TipoDias).trim() : '';
return resultado;

function getNombreRamo(policy) {
  doCmd({
    cmd: 'RepoLob',
    data: {
      operation: 'GET',
      filter: `code = '${String(policy && policy.lob || '').replace(/'/g, "''")}'`
    }
  });

  const ramo = RepoLob && RepoLob.outData && RepoLob.outData[0];
  return String(ramo && ramo.name || '').trim().replace(/^\s*\d+\s*-\s*/, '').trim().toUpperCase();
}

function getNombreProducto(policy) {
  doCmd({
    cmd: 'RepoProduct',
    data: {
      operation: 'GET',
      filter: `code = '${String(policy && policy.productCode || '').replace(/'/g, "''")}'`
    }
  });

  const producto = RepoProduct && RepoProduct.outData && RepoProduct.outData[0];
  return String(producto && producto.name || '').trim().replace(/^\s*\d+\s*-\s*/, '').trim();
}
