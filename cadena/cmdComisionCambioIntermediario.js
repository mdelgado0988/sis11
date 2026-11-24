//block
//noreplace
/**
 * @name cmdComisionCambioIntermediario
 * @version 1.0
 * @author AIDEN (MSN-000249, AXX-11476)
 * @created 2026-11-24
 * @env globaluat
 * @purpose Comisiones y contabilizacion del endoso de cambio de intermediario (IntermediaryChange).
 *   Por cobertura, desde la fecha efectiva hasta el fin de su vigencia:
 *   - corredor anterior: linea negativa por la porcion no devengada del credito de comision que tiene registrado;
 *   - corredor nuevo: linea positiva = prima de la cobertura (mas su parte de recargos, como cmdGetCommission) x su %
 *     de CommissionSchemeTbl (fila del producto, si no la del ramo) x la misma porcion.
 *   Si corredor, contrato e importe no cambian, no escribe nada. Reemplaza las lineas Portfolio_Transfer (CAN/TRA) que
 *   ExeChangeIntermediary escribe para el mismo cambio (traslado completo, sin prorrateo ni % del nuevo); quedan
 *   registradas en Change.jAfter. El asiento (plantilla CambioIntermediario) es por la diferencia neta; sin diferencia
 *   no hay asiento.
 * @context mode
 *   'preview' {changeId} o {policyId, newSellerId, newIntermediary, effectiveDate:'aaaa-mm-dd'}: solo lectura.
 *   'apply' {changeId}: despues de ejecutar el cambio (trigger posterior de ExeChangeIntermediary). Una vez por cambio.
 *   'context' {changeId}: fila de contexto de la plantilla CambioIntermediario ([] si la diferencia neta es 0).
 */
try {
  var ctx = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {})
  var mode = String(ctx.mode || 'preview')
  var tag = 'MSN-000249'
  var templateCode = 'CambioIntermediario'

  var q = function (sql) { doCmd({ cmd: 'DoQuery', data: { sql: sql } }); if (!DoQuery.ok) throw DoQuery.msg; return DoQuery.outData || [] }
  var num = function (v) { if (v === null || v === undefined || v === '') return null; var n = Number(v); return isFinite(n) ? n : null }
  var r2 = function (v) { return Math.round((Number(v) || 0) * 100) / 100 }
  var key = function (v) { return String(v === null || v === undefined ? '' : v).trim().toUpperCase() }
  var same = function (a, b) { return (num(a) === null ? null : Number(a)) === (num(b) === null ? null : Number(b)) }
  var parse = function (s) { if (!s) return null; try { return JSON.parse(s) } catch (x) { return null } }
  var sq = function (s) { return String(s).replace(/'/g, "''") }

  var offsetH = 0
  doCmd({ cmd: 'GetConfig', data: { path: '$.Main.timeOffset' } })
  if (typeof GetConfig !== 'undefined' && GetConfig && GetConfig.ok !== false && num(GetConfig.outData) !== null) offsetH = num(GetConfig.outData)

  // calendar day (number of days since 1970-01-01) of a date in the environment's local time; 'aaaa-mm-dd' is already local
  var dayOf = function (v) {
    if (v === null || v === undefined || v === '') return null
    var s = String(v).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return Math.floor(Date.parse(s + 'T00:00:00Z') / 86400000)
    s = s.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1')
    if (!/(Z|[+-]\d\d:\d\d)$/.test(s)) s += 'Z'
    var t = Date.parse(s)
    return isFinite(t) ? Math.floor((t + offsetH * 3600000) / 86400000) : null
  }
  var dayText = function (d) { return d === null ? '' : new Date(d * 86400000).toISOString().slice(0, 10) }
  // share of the term [from, to) that falls on or after eff
  var portion = function (from, to, eff) {
    if (from === null || to === null || eff === null || !(to > from)) return 0
    if (eff <= from) return 1
    if (eff >= to) return 0
    return (to - eff) / (to - from)
  }

  var loadPolicy = function (pid) {
    doCmd({ cmd: 'RepoLifePolicy', data: { operation: 'GET', filter: 'id=' + Number(pid), include: ['Coverages', 'Surcharges', 'Product'], noTracking: true } })
    var pol = typeof RepoLifePolicy !== 'undefined' && RepoLifePolicy && RepoLifePolicy.ok !== false && RepoLifePolicy.outData ? RepoLifePolicy.outData[0] : null
    if (!pol) throw 'Poliza ' + pid + ' no encontrada'
    return JSON.parse(JSON.stringify(pol))
  }

  // % of the broker for the policy's product, else for its branch (same rule as cmdGetCommission); null without a row
  var schemePct = function (sellerId, lob, productCode) {
    if (!(Number(sellerId) > 0)) return null
    doCmd({ cmd: 'GetFullTable', data: { table: 'CommissionSchemeTbl', filter: '1=1' } })
    var table = typeof GetFullTable !== 'undefined' && GetFullTable && GetFullTable.ok !== false && GetFullTable.outData ? JSON.parse(JSON.stringify(GetFullTable.outData)) : null
    if (!table || table.length < 2) return null
    var txt = function (v) { return String(v === null || v === undefined ? '' : v).trim() }
    var head = table[0].map(txt)
    var cSeller = head.indexOf('Seller Id'), cLob = head.indexOf('Lob Code'), cProduct = head.indexOf('Product Code'), cPct = head.indexOf('Commission %')
    if (cSeller < 0 || cLob < 0 || cProduct < 0 || cPct < 0) throw 'CommissionSchemeTbl necesita las columnas Seller Id, Lob Code, Product Code y Commission %'
    var branch = txt(lob), product = txt(productCode).toUpperCase()
    var rows = table.slice(1).filter(function (r) { return r && txt(r[cSeller]) !== '' && Number(txt(r[cSeller])) === Number(sellerId) })
    var row = rows.find(function (r) { return txt(r[cProduct]) !== '' && txt(r[cProduct]).toUpperCase() === product && (txt(r[cLob]) === '' || txt(r[cLob]) === branch) }) ||
      rows.find(function (r) { return txt(r[cProduct]) === '' && txt(r[cLob]) === branch })
    if (!row) return null
    var raw = txt(row[cPct])
    var pct = Number(raw.replace('%', '').replace(',', '.'))
    if (raw === '' || !isFinite(pct) || pct < 0) throw 'CommissionSchemeTbl: % invalido "' + raw + '" para el corredor ' + sellerId
    return pct
  }

  var contractName = function (id) {
    if (num(id) === null) return ''
    var r = q('SELECT name FROM ComContract WHERE id = ' + Number(id))[0]
    return r ? String(r.name || '') : ''
  }

  var chSql = "SELECT c.id, c.status, c.lifePolicyId, c.Discriminator, CONVERT(varchar(19), c.effectiveDate, 126) eff," +
    " CONVERT(varchar(19), c.executionDate, 126) exe, c.oldIntermediary, c.newIntermediary, c.oldSellerId, c.newSellerId," +
    " c.oldComPercentage, c.newComPercentage, c.jAfter FROM [Change] c"
  var loadChange = function (id) { return id > 0 ? q(chSql + ' WHERE c.id = ' + Number(id))[0] || null : null }

  /**
   * Lines the change implies. s: {changeId, pid, eff (day), oldSeller, oldContract, newSeller, newContract}.
   * Rows of this change (changeId) are left out of what the old broker holds. Each held row is reversed for the share of
   * its own window still unearned at the effective date: a row booked by an earlier intermediary change covers from that
   * change's effective date, every other row from the coverage start.
   */
  var plan = function (s) {
    var pol = loadPolicy(s.pid)
    var cyRow = q('SELECT MAX(contractYear) cy FROM PayPlan WHERE lifePolicyId = ' + Number(s.pid))[0]
    var cy = cyRow && num(cyRow.cy) !== null ? Number(cyRow.cy) : 1
    var rows = q('SELECT id, comContractId, lifeCoverageId, covCode, sellerId, CAST(credit AS float) credit, lineId, type, eventName, changeId,' +
      ' contractYear, masterCode, productCode, version, distributor, ofnCode, ofnGroup, currency FROM Commission WHERE lifePolicyId = ' + Number(s.pid) + ' ORDER BY id')
    var term = rows.filter(function (r) { return (num(r.contractYear) === null || Number(r.contractYear) === cy) && !(s.changeId > 0 && Number(r.changeId) === Number(s.changeId)) })
    var hadBroker = num(s.oldSeller) !== null || num(s.oldContract) !== null
    var held = !hadBroker ? [] : term.filter(function (r) {
      return num(s.oldSeller) !== null ? same(r.sellerId, s.oldSeller) : (num(r.sellerId) === null && same(r.comContractId, s.oldContract))
    })
    var icEff = {}
    q("SELECT id, CONVERT(varchar(19), effectiveDate, 126) eff FROM [Change] WHERE lifePolicyId = " + Number(s.pid) + " AND Discriminator = 'IntermediaryChange'")
      .forEach(function (c) { icEff[Number(c.id)] = dayOf(c.eff) })
    var covs = pol.Coverages || []
    var surch = (pol.Surcharges || []).reduce(function (a, c) { return a + (Number(c.value) || 0) }, 0)
    var premOf = function (c) { return Number(c.premium || c.basePremium) || 0 }
    var withPrem = covs.filter(function (c) { return premOf(c) > 0 }).length
    var pct = num(s.newSeller) !== null ? schemePct(s.newSeller, pol.lob, pol.productCode) : null
    var pStart = dayOf(pol.start), pEnd = dayOf(pol.end)
    var oldName = contractName(s.oldContract !== null && s.oldContract !== undefined ? s.oldContract : (held[0] && held[0].comContractId))
    var newName = contractName(s.newContract)

    var ids = []
    covs.forEach(function (c) { if (ids.indexOf(Number(c.id)) < 0) ids.push(Number(c.id)) })
    held.forEach(function (r) { if (num(r.lifeCoverageId) !== null && ids.indexOf(Number(r.lifeCoverageId)) < 0) ids.push(Number(r.lifeCoverageId)) })

    var lines = [], notes = []
    if (num(s.newSeller) !== null && pct === null) notes.push('El corredor nuevo ' + s.newSeller + ' no tiene fila en CommissionSchemeTbl para el ramo ' + pol.lob + ' / producto ' + pol.productCode + ': comision nueva 0')
    if (num(s.newSeller) !== null && num(s.newContract) === null) notes.push('El cambio no trae contrato de comision nuevo: no se generan lineas para el corredor nuevo')
    ids.forEach(function (cid) {
      var cov = covs.find(function (c) { return Number(c.id) === cid }) || null
      var mine = held.filter(function (r) { return Number(r.lifeCoverageId) === cid })
      var sample = term.find(function (r) { return Number(r.lifeCoverageId) === cid && r.lineId === 'INI' }) || term.find(function (r) { return Number(r.lifeCoverageId) === cid }) || {}
      var from = cov ? dayOf(cov.start) : pStart, to = cov ? dayOf(cov.end) : pEnd
      if (from === null) from = pStart
      if (to === null) to = pEnd
      var heldAmt = mine.reduce(function (a, r) { return a + (Number(r.credit) || 0) }, 0)
      var unearned = mine.reduce(function (a, r) {
        var rf = num(r.changeId) !== null && icEff[Number(r.changeId)] !== undefined && icEff[Number(r.changeId)] !== null ? Math.max(from, icEff[Number(r.changeId)]) : from
        return a + (Number(r.credit) || 0) * portion(rf, to, s.eff)
      }, 0)
      var rev = unearned > 0 ? -r2(unearned) : 0
      var prem = cov ? premOf(cov) : 0
      if (prem > 0 && surch !== 0 && withPrem > 0) prem += surch / withPrem
      var annual = pct === null || num(s.newContract) === null ? 0 : r2(prem * pct / 100)
      var fNew = portion(from, to, s.eff)
      var add = r2(annual * fNew)
      var unchanged = same(s.oldSeller, s.newSeller) && same(s.oldContract, s.newContract) && Math.abs(add + rev) < 0.005
      if (unchanged) return
      var base = {
        lifePolicyId: Number(s.pid), lifeCoverageId: cid, covCode: cov ? String(cov.code) : String(sample.covCode || ''),
        lineId: 'CHG', type: 'Commission_Change', eventName: 'Policy_Change', commission: 0, changeId: s.changeId > 0 ? Number(s.changeId) : 0,
        contractYear: cy, masterCode: sample.masterCode || pol.masterCode, productCode: sample.productCode || pol.productCode,
        version: num(sample.version) !== null ? Number(sample.version) : (num(pol.version) !== null ? Number(pol.version) : 1),
        ofnCode: num(sample.ofnCode) !== null ? Number(sample.ofnCode) : 0, ofnGroup: num(sample.ofnGroup) !== null ? Number(sample.ofnGroup) : 0,
        currency: sample.currency || pol.currency, origin: cid, err: false, paymentStatus: null
      }
      var span = dayText(Math.max(s.eff, from)) + ' a ' + dayText(to)
      if (rev !== 0) {
        lines.push(Object.assign({}, base, {
          role: 'old', comContractId: Number(num(s.oldContract) !== null ? s.oldContract : mine[0].comContractId), sellerId: num(s.oldSeller),
          credit: rev, distributor: oldName, extCode: oldName + '_Commission_Change_0_0',
          msg: tag + ' cambio de intermediario ' + base.changeId + ': corredor anterior',
          formula: 'Cambio de intermediario ' + base.changeId + ' efectivo ' + dayText(s.eff) + ': reverso de la porcion no devengada (' + span +
            ') de ' + r2(heldAmt) + ' registrados = ' + (-rev)
        }))
      }
      if (add !== 0) {
        lines.push(Object.assign({}, base, {
          role: 'new', comContractId: Number(s.newContract), sellerId: num(s.newSeller),
          credit: add, distributor: newName, extCode: newName + '_Commission_Change_0_0',
          msg: tag + ' cambio de intermediario ' + base.changeId + ': corredor nuevo',
          formula: 'Cambio de intermediario ' + base.changeId + ' efectivo ' + dayText(s.eff) + ': prima ' + r2(prem) + ' x ' + pct + '% = ' +
            annual + ' anual x ' + r2(fNew * 100) + '% (' + span + ')'
        }))
      }
    })
    var net = r2(lines.reduce(function (a, l) { return a + l.credit }, 0))
    return {
      policyId: Number(s.pid), policy: pol.code, contractYear: cy, effectiveDate: dayText(s.eff), oldSellerId: num(s.oldSeller), newSellerId: num(s.newSeller),
      oldContract: num(s.oldContract), newContract: num(s.newContract), newPct: pct, heldByOld: r2(held.reduce(function (a, r) { return a + (Number(r.credit) || 0) }, 0)),
      lines: lines, net: net, notes: notes
    }
  }

  var specOf = function (ch) {
    return { changeId: Number(ch.id), pid: Number(ch.lifePolicyId), eff: dayOf(ch.eff), oldSeller: num(ch.oldSellerId), oldContract: num(ch.oldIntermediary),
      newSeller: num(ch.newSellerId), newContract: num(ch.newIntermediary) }
  }

  // ------------------------------------------------------------------ preview (read only)
  if (mode === 'preview') {
    var pid = Number(ctx.changeId) > 0 ? 0 : Number(ctx.policyId || 0)
    var spec
    if (Number(ctx.changeId) > 0) {
      var pc = loadChange(Number(ctx.changeId))
      if (!pc || pc.Discriminator !== 'IntermediaryChange') return { ok: false, msg: 'El cambio ' + ctx.changeId + ' no es un cambio de intermediario' }
      spec = specOf(pc)
    } else {
      if (!(pid > 0)) return { ok: false, msg: 'Indica changeId o policyId' }
      var cur = q('SELECT sellerId, comContractId FROM LifePolicy WHERE id = ' + pid)[0] || {}
      spec = { changeId: 0, pid: pid, eff: dayOf(ctx.effectiveDate || new Date().toISOString()), oldSeller: num(cur.sellerId), oldContract: num(cur.comContractId),
        newSeller: num(ctx.newSellerId), newContract: num(ctx.newIntermediary !== undefined ? ctx.newIntermediary : cur.comContractId) }
    }
    var pv = plan(spec)
    pv.ok = true
    pv.mode = 'preview'
    pv.msg = 'Vista previa: ' + pv.lines.length + ' linea(s), diferencia neta ' + pv.net + (pv.net === 0 ? ' (sin asiento)' : '')
    return pv
  }

  // ------------------------------------------------------------------ context (accounting template scan)
  if (mode === 'context') {
    var xid = Number(ctx.changeId || ctx.id || 0)
    var xc = loadChange(xid)
    if (!xc || xc.Discriminator !== 'IntermediaryChange' || Number(xc.status) !== 1) return []
    var tot = q("SELECT CAST(ISNULL(SUM(credit), 0) AS float) net, COUNT(*) n FROM Commission WHERE changeId = " + xid + " AND msg LIKE '" + tag + "%'")[0] || {}
    var net = r2(tot.net)
    if (Math.abs(net) < 0.005) return []
    var xp = loadPolicy(xc.lifePolicyId)
    doCmd({ cmd: 'GetFullTable', data: { table: 'CuentasEmisionGeneral' } })
    var acc = typeof GetFullTable !== 'undefined' && GetFullTable && GetFullTable.ok !== false && GetFullTable.outData ? JSON.parse(JSON.stringify(GetFullTable.outData)) : []
    if (!Array.isArray(acc) || acc.length < 2) throw 'No se encontro la tabla de cuentas CuentasEmisionGeneral'
    var head = acc[0].map(key)
    var lob = String(xp.lob || '').trim(), prod = String(xp.productCode || '').trim()
    var li = lob ? head.indexOf(key(lob)) : -1, pi = lob && prod ? head.indexOf(key(lob + '-' + prod)) : -1
    var pick = function (name) {
      var row = acc.find(function (r) { return Array.isArray(r) && key(r[0]) === key(name) })
      var a = row && pi > 0 ? String(row[pi] || '').trim() : '', b = row && li > 0 ? String(row[li] || '').trim() : ''
      return a || b
    }
    var cuentaComision = pick('Comision'), cuentaReservasxPagar = pick('ReservasxPagar')
    if (!cuentaComision || !cuentaReservasxPagar) throw 'CuentasEmisionGeneral no tiene cuenta Comision o ReservasxPagar para el ramo ' + lob + ' / producto ' + prod
    doCmd({ cmd: 'RepoLob', data: { operation: 'GET', filter: "code = '" + sq(lob) + "'", noTracking: true } })
    var ramo = typeof RepoLob !== 'undefined' && RepoLob && Array.isArray(RepoLob.outData) ? RepoLob.outData[0] : null
    var nombreRamo = String(ramo && ramo.name || '').trim().replace(/^\s*[^-]+\s*-\s*/, '').trim()
    var months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    var ed = dayOf(xc.exe)
    var dd = ed === null ? new Date() : new Date(ed * 86400000)
    var productName = xp.Product && xp.Product.name ? String(xp.Product.name) : ''
    return [{
      cuentaComision: cuentaComision, cuentaReservasxPagar: cuentaReservasxPagar, commisiones: net, reservasPorPagar: net,
      anioMes: months[dd.getUTCMonth()] + ' ' + dd.getUTCFullYear(),
      reference: 'Endoso Cambio de Intermediario ' + nombreRamo + ' # ' + xid,
      description: 'Endoso de Cambio de Intermediario ' + productName + ' Poliza # ' + String(xp.code || ''),
      code: templateCode, changeId: xid, policyId: Number(xp.id), lines: Number(tot.n) || 0
    }]
  }

  // ------------------------------------------------------------------ apply (after execution)
  if (mode === 'apply') {
    var id = Number(ctx.changeId || 0)
    var ch = loadChange(id)
    if (!ch || ch.Discriminator !== 'IntermediaryChange' || Number(ch.status) !== 1) return { ok: true, msg: 'Comision cambio de intermediario: el cambio ' + id + ' no es un cambio de intermediario ejecutado' }
    var setJson = function (obj) {
      doCmd({ cmd: 'SetField', data: { entity: 'Change', entityId: id, raw: true, fieldValue: "jAfter = N'" + sq(JSON.stringify(obj)) + "'" } })
      return !(typeof SetField === 'undefined' || !SetField || SetField.ok === false)
    }
    var prev = parse(ch.jAfter)
    var res, msg, ok = true
    if (prev && prev.tag === tag && prev.done) {
      res = prev
      msg = 'Comision cambio de intermediario ' + id + ': ya procesado el ' + prev.processedAt
    } else {
      var already = Number((q("SELECT COUNT(*) n FROM Commission WHERE changeId = " + id + " AND msg LIKE '" + tag + "%'")[0] || {}).n || 0)
      if (already > 0) {
        return { ok: false, msg: 'Comision cambio de intermediario ' + id + ': ya hay ' + already + ' linea(s) de esta configuracion sin marca de cierre en el cambio; revisar a mano' }
      }
      var pl = plan(specOf(ch))
      res = { tag: tag, done: false, processedAt: new Date().toISOString(), effectiveDate: pl.effectiveDate, executedAt: ch.exe, oldSellerId: pl.oldSellerId,
        newSellerId: pl.newSellerId, oldContract: pl.oldContract, newContract: pl.newContract, newPct: pl.newPct, heldByOld: pl.heldByOld,
        removedTransfer: [], lines: [], net: pl.net, notes: pl.notes, failed: 0 }
      // the engine's full portfolio transfer of this same change is replaced by the prorated lines
      var tr = q("SELECT id, lineId, type, sellerId, comContractId, lifeCoverageId, CAST(credit AS float) credit, CAST(commission AS float) commission FROM Commission" +
        " WHERE changeId = " + id + " AND eventName = 'Portfolio_Transfer' AND comLiquidationId IS NULL AND lifePolicyId = " + Number(ch.lifePolicyId))
      if (tr.length) {
        q('DELETE FROM Commission WHERE id IN (' + tr.map(function (r) { return Number(r.id) }).join(',') + ") AND changeId = " + id + " AND eventName = 'Portfolio_Transfer' AND comLiquidationId IS NULL; SELECT @@ROWCOUNT n")
        res.removedTransfer = tr
      }
      pl.lines.forEach(function (l) {
        var e = Object.assign({}, l)
        delete e.role
        e.created = new Date().toISOString()
        doCmd({ cmd: 'RepoCommission', data: { operation: 'ADD', entity: e } })
        var okL = typeof RepoCommission !== 'undefined' && RepoCommission && RepoCommission.ok !== false
        var rec = okL && RepoCommission.outData && RepoCommission.outData.records ? RepoCommission.outData.records[0] : null
        res.lines.push({ id: rec && rec.id ? rec.id : null, role: l.role, sellerId: l.sellerId, coverage: l.covCode, credit: l.credit, ok: okL, msg: okL ? null : String(RepoCommission && RepoCommission.msg) })
        if (!okL) res.failed++
      })
      res.done = res.failed === 0
      ok = res.done
      msg = 'Comision cambio de intermediario ' + id + ' (efectivo ' + pl.effectiveDate + '): ' + res.lines.length + ' linea(s), diferencia neta ' + pl.net +
        (res.removedTransfer.length ? ', ' + res.removedTransfer.length + ' linea(s) de traslado del motor reemplazadas' : '') + (res.failed ? ', ' + res.failed + ' FALLIDA(S)' : '')
    }
    if (ok && Math.abs(Number(res.net) || 0) >= 0.005) {
      doCmd({ cmd: 'ExeTransactionTemplate', data: { code: templateCode, scanContext: { id: id } } })
      var okT = typeof ExeTransactionTemplate !== 'undefined' && ExeTransactionTemplate && ExeTransactionTemplate.ok !== false
      res.accounting = String((ExeTransactionTemplate && ExeTransactionTemplate.msg) || '').slice(0, 300)
      msg += '. Asiento: ' + res.accounting
      if (!okT) ok = false
    } else if (ok) {
      res.accounting = 'sin diferencia: sin asiento'
      msg += '. Sin diferencia neta: sin asiento'
    }
    var saved = setJson(res)
    return { ok: ok, msg: msg + (saved ? '' : ' (resultado NO registrado en el cambio: ' + (SetField && SetField.msg) + ')'), net: res.net, lines: res.lines }
  }

  return { ok: false, msg: 'Modo desconocido: ' + mode }
} catch (e) {
  return { ok: false, msg: 'cmdComisionCambioIntermediario: ' + String(e && e.message ? e.message : e) }
}
