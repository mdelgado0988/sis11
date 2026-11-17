/**
 * @author aiden_mission_configurator
 * @created 2026-10-31
 * @name ConsultaChequesTransferencias
 * @version 1.0.0
 * @summary 
 * @issue   
 *
  // MSN-000097 (global1): consulta de cheques y transferencias emitidos.
    // Revision 3: filtro Estado con dos opciones, Ejecutada (EXECUTED, por defecto) y Anulada (REVERTED que antes estuvo
    // ejecutada: la reversa del pago conserva su transferencia de pago, marcada como revertida). Las pendientes no se muestran.
    // Revision 6 (P1 a): reimpresion \u00abFiel copia\u00bb de los cheques ejecutados. La vista arma la copia como PDF (sin plantillas ni
    // librerias: un PDF minimo escrito aqui, con la marca de agua FIEL COPIA) y la registra como documento de la solicitud
    // (UploadBytes + RepoPaymentDocument ADD, name 'Fiel copia'); el AuditLog guarda usuario y fecha de cada una.
    // Revision 7 (P2): anulacion de pagos de siniestro ejecutados con los comandos nativos, solo para los miembros de
    // ANNUL_GROUPS (GetCurrentUser.Groups, validado al mostrar el boton y otra vez al ejecutar). Antes de escribir relee la
    // solicitud, sus transferencias de pago, sus asientos (Transaction entity ClaimPayment) y el mes contable; con todo en
    // regla pide causa/subcausa y confirmacion y ejecuta UnDoPaymentClaim de su transferencia de pago y, en el mismo paso,
    // ReverseTransaction del asiento del pago (tesoreria y contabilidad iguales). Los pagos manuales no tienen boton: la
    // celda explica el motivo. Las anuladas muestran fecha, causa y el detalle de la anulacion (historial nativo).
    // Escrituras de la vista: UploadBytes, RepoPaymentDocument ADD, UnDoPaymentClaim y ReverseTransaction.
    // Lecturas: RepoClaimPayment / RepoTransfer / RepoAccount / RepoPaymentMethodCatalog / RepoPaymentDocument / RepoCurrency /
    // RepoTransaction / RepoClosure / RepoTransferReversalCause / RepoTransferReversalSubcause (GET), GetCurrentUser y GetFile.
    // No usa comandos nuevos ni modifica vistas nativas. La solicitud se abre en la pantalla nativa (#/payments/<id>).
    // MSN-000099: (1) si falla la carga del catalogo de metodos de pago, la vista muestra el error con \u00abReintentar\u00bb (Buscar
    // tambien reintenta) en lugar de quedarse sin buscar en silencio; (2) el beneficiario se busca por las partes no vacias del
    // nombre del contacto y por el nombre que muestra la columna Beneficiario; (3) tras un error al anular (respuesta con error o
    // que no llego) se releen la solicitud, sus transferencias de pago y sus asientos y se dice en que quedo: si quedo anulada sin
    // la reversa del asiento, se avisa y se indica como completarla desde \u00abDetalle\u00bb; (4) \u00abRevertir asiento\u00bb vuelve a validar
    // grupo, solicitud, asiento y mes contable justo antes de ejecutar, igual que la anulacion.
    // GLOB-1365: bordes visibles en checkbox e inputs (estandar CLMovimientosDeCuenta); columnas N.o, Fecha, Moneda, Estado y
    // Solicitud centradas; la columna Numero pasa a "N.o cheque / transferencia"; la fiel copia replica ChequeFielCopia.docx
    // (lee tambien los asientos del pago con sus lineas); filtro Estado con "Ver Todos"; la anulacion se llama Reversar /
    // Reversada en toda la interfaz y sus mensajes ya no muestran comandos ni errores internos (van a la consola).
 */
(function () {
  
    
    var CODES_ALL = ['CH', 'TF', 'ACH'];
    var METHOD_GROUPS = [
      { key: 'CHEQUE', label: 'Cheque', codes: ['CH'] },
      { key: 'TRANSFER', label: 'Transferencia', codes: ['TF', 'ACH'] }
    ];
    // Estados que muestra la vista (revision 3). Anulada = REVERTED con transferencia de pago (se ejecuto y despues se anulo).
    var STATES = [
      { key: 'EXECUTED', label: 'Ejecutada', color: 'green' },
      { key: 'REVERTED', label: 'Reversada', color: 'red' }
    ];
    // GLOB-1365 (punto 6): opcion del filtro Estado que trae ejecutadas y reversadas juntas, sin restringir por estado.
    var ALL_STATES = 'ALL';
    var STATUS_OPTIONS = STATES.concat([{ key: ALL_STATES, label: 'Ver Todos' }]);
    var stateOf = function (key) {
      var s = STATES.filter(function (x) { return x.key === key; })[0];
      return s || { key: key, label: key || '', color: 'default' };
    };
    var COLUMNS = [
      { key: 'numero', title: 'N.\u00ba cheque / transferencia', def: true },
      { key: 'fecha', title: 'Fecha', def: true },
      { key: 'beneficiario', title: 'Beneficiario', def: true },
      { key: 'monto', title: 'Monto', def: true },
      { key: 'moneda', title: 'Moneda', def: true },
      { key: 'metodo', title: 'M\u00e9todo', def: true },
      { key: 'estado', title: 'Estado', def: true },
      { key: 'solicitud', title: 'Solicitud', def: true },
      { key: 'cuenta', title: 'Cuenta origen', def: false },
      { key: 'referencia', title: 'Referencia', def: false }
    ];
    var DEFAULT_VISIBLE = COLUMNS.filter(function (c) { return c.def; }).map(function (c) { return c.key; });
    var EMPTY_FILTER = { dates: null, checkNum: '', beneficiary: '', methods: [], status: STATES[0].key, requestId: '' };
    
    var sqlText = function (s) {
      return String(s).replace(/'/g, "''").replace(/;/g, ' ').replace(/--/g, ' ').replace(/[\[\]%_]/g, ' ').trim();
    };
    var toInt = function (s) {
      var n = parseInt(String(s).replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? null : n;
    };
    var quoteList = function (arr) { return arr.map(function (c) { return "'" + c + "'"; }).join(','); };
    // Nombre del contacto para buscar: solo las partes no vacias, separadas por un espacio (CONCAT_WS omite los NULL).
    var namePart = function (col) { return 'NULLIF(LTRIM(RTRIM(ct.' + col + ")),'')"; };
    var CONTACT_NAME_SQL = "CONCAT_WS(' '," + ['name', 'middleName', 'surname1', 'surname2'].map(namePart).join(',') + ')';
    // Nombre que muestra la columna Beneficiario (nombre completo nativo del contacto; global1 no configura
    // Contacts.fullNameFields): persona = nombre y apellidos, sin segundo nombre; empresa = razon social (surname2).
    var SHOWN_NAME_SQL = "CASE WHEN ct.isPerson = 1 THEN CONCAT_WS(' '," + ['name', 'surname1', 'surname2'].map(namePart).join(',') + ') ELSE ' + namePart('surname2') + ' END';
    
    // Filtro SQL de RepoClaimPayment GET (se agrega a SELECT * FROM [ClaimPayment] WHERE ...).
    var buildFilter = function (f) {
      var parts = [];
      var codes = [];
      METHOD_GROUPS.forEach(function (g) { if (f.methods && f.methods.indexOf(g.key) >= 0) codes = codes.concat(g.codes); });
      if (!codes.length) codes = CODES_ALL;
      parts.push('paymentMethodCode IN (' + quoteList(codes) + ')');
      var status = STATUS_OPTIONS.filter(function (x) { return x.key === f.status; }).length ? f.status : STATES[0].key;
      var reverted = "(entityState = 'REVERTED' AND EXISTS (SELECT 1 FROM [Transfer] tp WHERE tp.claimPaymentId = [ClaimPayment].id))";
      if (status === ALL_STATES) parts.push("(entityState = 'EXECUTED' OR " + reverted + ')');
      else if (status === 'REVERTED') parts.push(reverted);
      else parts.push("entityState = '" + status + "'");
      parts.push('total >= 0');
      if (f.dates && f.dates[0] && f.dates[1]) {
        var from = moment(f.dates[0]).startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss');
        var to = moment(f.dates[1]).endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss');
        parts.push("ISNULL((SELECT MIN(td.date) FROM [Transfer] td WHERE td.claimPaymentId = [ClaimPayment].id), [ClaimPayment].date) BETWEEN '" + from + "' AND '" + to + "'");
      }
      var chk = toInt(f.checkNum);
      // Same number the "N.º cheque / transferencia" column shows: check number for checks, id of the first
      // payment transfer (earliest date) for transfers and ACH.
      if (f.checkNum !== '' && chk !== null) {
        parts.push("((paymentMethodCode = 'CH' AND checkNum = " + chk + ") OR (paymentMethodCode <> 'CH' AND " +
          '(SELECT TOP 1 tn.id FROM [Transfer] tn WHERE tn.claimPaymentId = [ClaimPayment].id ORDER BY tn.date, tn.id) = ' + chk + '))');
      }
      var req = toInt(f.requestId);
      if (f.requestId !== '' && req !== null) parts.push('[ClaimPayment].id = ' + req);
      // Beneficiario (MSN-000099): el nombre armado solo con las partes no vacias (sin el doble espacio que dejaba CONCAT cuando
      // falta el segundo nombre o el segundo apellido) o el nombre que muestra la columna Beneficiario.
      var ben = sqlText(f.beneficiary || '').replace(/\s+/g, ' ');
      if (ben) parts.push('contactId IN (SELECT ct.id FROM Contact ct WHERE ' + CONTACT_NAME_SQL + " LIKE N'%" + ben + "%' OR " + SHOWN_NAME_SQL + " LIKE N'%" + ben + "%')");
      return parts.join(' AND ');
    };
    
    var chunks = function (arr, n) {
      var out = [];
      for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
      return out;
    };
    var uniq = function (arr) {
      var seen = {}, out = [];
      arr.forEach(function (x) { if (x !== null && x !== undefined && !seen[x]) { seen[x] = true; out.push(x); } });
      return out;
    };
    var fail = function (r) { throw new Error((r && r.msg) || 'Error de comunicaci\u00f3n'); };
    var errText = function (x) { return (x && (x.msg || x.message)) || 'sin respuesta'; };
    
    // Transferencias de pago (ExeClaimPayment) por solicitud: la primera es la del pago (first); paid = cuantas siguen
    // ejecutadas (status 1), que decide si la anulacion nativa (una transferencia por anulacion) deja la solicitud en regla.
    var loadTransfers = function (ids) {
      var map = {}, paid = {};
      if (!ids.length) return Promise.resolve({ first: map, paid: paid });
      return chunks(ids, 400).reduce(function (p, part) {
        return p.then(function () {
          return exe('RepoTransfer', { operation: 'GET', filter: 'claimPaymentId IN (' + part.join(',') + ')', size: 0 }).then(function (r) {
            if (!r || !r.ok) fail(r);
            (r.outData || []).forEach(function (t) {
              var cur = map[t.claimPaymentId];
              if (!cur || moment.utc(t.date).isBefore(moment.utc(cur.date))) map[t.claimPaymentId] = t;
              if (t.status === 1) paid[t.claimPaymentId] = (paid[t.claimPaymentId] || 0) + 1;
            });
          });
        });
      }, Promise.resolve()).then(function () { return { first: map, paid: paid }; });
    };
    var loadAccounts = function (ids) {
      if (!ids.length) return Promise.resolve({});
      var map = {};
      return chunks(ids, 400).reduce(function (p, part) {
        return p.then(function () {
          return exe('RepoAccount', { operation: 'GET', filter: 'id IN (' + part.join(',') + ')', size: 0 }).then(function (r) {
            if (!r || !r.ok) fail(r);
            (r.outData || []).forEach(function (a) { map[a.id] = a; });
          });
        });
      }, Promise.resolve()).then(function () { return map; });
    };
    
    var toRow = function (p, transfers, accounts, methodNames) {
      var t = transfers.first[p.id];
      var isCheque = p.paymentMethodCode === 'CH';
      var acc = p.sourceAccountId ? accounts[p.sourceAccountId] : null;
      var st = stateOf(p.entityState);
      return {
        id: p.id,
        contactId: p.contactId,
        numero: isCheque ? (p.checkNum === null || p.checkNum === undefined ? null : p.checkNum) : (t ? t.id : null),
        numeroTipo: isCheque ? 'cheque' : 'transferencia',
        fecha: t ? t.date : p.date,
        fechaTipo: t ? 'pago' : 'solicitud',
        beneficiario: (p.beneficiaryName || '').trim(),
        monto: p.total,
        moneda: p.currency || '',
        metodoCode: p.paymentMethodCode,
        metodo: methodNames[p.paymentMethodCode] || p.paymentMethodCode,
        estadoRaw: p.entityState,
        estado: st.label,
        estadoColor: st.color,
        transferId: t ? t.id : null,
        transferReversed: !!(t && (t.status === 2 || t.reversalDate)),
        cuenta: acc ? (acc.accNo || acc.name || String(acc.id)) : (p.sourceAccountId ? String(p.sourceAccountId) : ''),
        cuentaNo: acc ? acc.accNo || '' : '',
        fechaSolicitud: p.date,
        referencia: p.reference || '',
        concepto: p.concept || '',
        anuladaFecha: t && t.status === 2 ? t.reversalDate : null,
        causa: t && t.status === 2 ? t.reversalCause || '' : '',
        annul: annulInfo(p, transfers.paid[p.id] || 0)
      };
    };
    
    // Consulta completa: solicitudes + transferencias de pago + cuentas.
    var query = function (filter, page, size, methodNames) {
      return exe('RepoClaimPayment', {
        operation: 'GET',
        custom: true,
        filter: buildFilter(filter),
        size: size,
        page: page
      }).then(function (r) {
        if (!r || !r.ok) fail(r);
        var list = r.outData || [];
        var ids = list.map(function (p) { return p.id; });
        var accIds = uniq(list.map(function (p) { return p.sourceAccountId; }));
        return Promise.all([loadTransfers(ids), loadAccounts(accIds)]).then(function (res) {
          return { total: r.total, rows: list.map(function (p) { return toRow(p, res[0], res[1], methodNames); }) };
        });
      });
    };
    
    var fmtDate = function (d) { return d ? moment.utc(d).local().format('DD/MM/YYYY') : ''; };
    var fmtMoney = function (n) {
      if (n === null || n === undefined) return '';
      return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    // Excel date: local calendar day only, no time (the writer uses getTime in UTC).
    var excelDate = function (d) {
      if (!d) return null;
      var m = moment.utc(d).local();
      return new Date(Date.UTC(m.year(), m.month(), m.date()));
    };
    var excelValue = function (row, key) {
      if (key === 'numero') return row.numero === null ? '' : Number(row.numero);
      if (key === 'fecha') return excelDate(row.fecha);
      if (key === 'monto') return Number(row.monto);
      if (key === 'solicitud') return Number(row.id);
      if (key === 'beneficiario') return row.beneficiario;
      if (key === 'moneda') return row.moneda;
      if (key === 'metodo') return row.metodo;
      if (key === 'estado') return row.estado;
      if (key === 'cuenta') return row.cuenta;
      if (key === 'referencia') return row.referencia;
      return '';
    };
    
    // ---- Revision 6: reimpresion \u00abFiel copia\u00bb (P1 opcion a) ----
    var COPY_NAME = 'Fiel copia';
    
    // Monto en letras (espanol, mayusculas, como en un cheque): 5000 -> CINCO MIL; 21000 -> VEINTIUN MIL; 1000000 -> UN MILLON.
    var UNITS = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE',
      'CATORCE', 'QUINCE', 'DIECIS\u00c9IS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTID\u00d3S', 'VEINTITR\u00c9S',
      'VEINTICUATRO', 'VEINTICINCO', 'VEINTIS\u00c9IS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    var TENS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    var HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS',
      'OCHOCIENTOS', 'NOVECIENTOS'];
    // 1..999; apocope = forma corta delante de MIL / MILLONES (UN, VEINTIUN, TREINTA Y UN).
    var words999 = function (n, apocope) {
      if (n === 100) return 'CIEN';
      var h = Math.floor(n / 100), r = n % 100, out = [];
      if (h) out.push(HUNDREDS[h]);
      if (r) {
        var w = r < 30 ? UNITS[r] : TENS[Math.floor(r / 10)] + (r % 10 ? ' Y ' + UNITS[r % 10] : '');
        if (apocope) {
          if (w === 'UNO') w = 'UN';
          else if (w === 'VEINTIUNO') w = 'VEINTI\u00daN';
          else w = w.replace(/ Y UNO$/, ' Y UN');
        }
        out.push(w);
      }
      return out.join(' ');
    };
    var words6 = function (n, apocope) {
      var th = Math.floor(n / 1000), r = n % 1000, out = [];
      if (th) out.push(th === 1 ? 'MIL' : words999(th, true) + ' MIL');
      if (r) out.push(words999(r, apocope));
      return out.join(' ');
    };
    var numberWords = function (n) {
      if (!n) return 'CERO';
      var m = Math.floor(n / 1000000), r = n % 1000000, out = [];
      if (m) out.push(m === 1 ? 'UN MILL\u00d3N' : words6(m, true) + ' MILLONES');
      if (r) out.push(words6(r, false));
      return out.join(' ');
    };
    // Las letras salen de la misma cifra que se muestra (fmtMoney), asi cifras y letras nunca difieren en un centavo.
    // mark: simbolo de moneda antes de los centavos, como en el cheque de referencia (CIENTO SETENTA Y CINCO B/ CON 55/100).
    var amountWords = function (amount, mark) {
      var parts = fmtMoney(Math.abs(Number(amount) || 0)).replace(/,/g, '').split('.');
      return numberWords(parseInt(parts[0], 10) || 0) + (mark ? ' ' + mark : '') + ' CON ' + (parts[1] || '00') + '/100';
    };
    
    // PDF minimo (PDF 1.4, una pagina carta, fuentes base Helvetica/Courier con WinAnsiEncoding): sin librerias.
    var WIN_ANSI = { 8364: 128, 8218: 130, 402: 131, 8222: 132, 8230: 133, 8224: 134, 8225: 135, 710: 136, 8240: 137, 352: 138,
      8249: 139, 338: 140, 381: 142, 8216: 145, 8217: 146, 8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151, 732: 152,
      8482: 153, 353: 154, 8250: 155, 339: 156, 382: 158, 376: 159 };
    var pdfText = function (s) {
      var str = String(s === null || s === undefined ? '' : s), out = '(';
      for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 32) c = 32;
        else if (c > 126 && !(c >= 160 && c <= 255)) c = WIN_ANSI[c] || 63;
        if (c === 40 || c === 41 || c === 92) out += '\\' + String.fromCharCode(c);
        else if (c > 126) out += '\\' + ('00' + c.toString(8)).slice(-3);
        else out += String.fromCharCode(c);
      }
      return out + ')';
    };
    // GLOB-1365 (punto 4): la fiel copia replica el formato de referencia ChequeFielCopia.docx (cheque arriba, banda magnetica,
    // talon con concepto y bloques contables, pie con transaccion, solicitud y comprobante). Fuentes base Times y Courier.
    var FIEL_COPIA_EM = 5.806; // ancho de 'FIEL COPIA' en Times-Bold, en em (F611 I389 E667 L667 sp250 C722 O778 P611 I389 A722)
    // Ruta y transito de la banda magnetica (parte central, entre el numero de cheque y la cuenta). No esta en los datos de la
    // cuenta: se toma del formato de referencia. Si el banco cambia, se ajusta aqui.
    var MICR_TRANSIT = 'A0001-1508';
    var COMPANY_NAME = 'Aseguradora Global S.A';
    var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var longDate = function (d) {
      if (!d) return '';
      var m = moment.utc(d).local();
      return m.format('DD') + ' de ' + MONTHS_ES[m.month()] + ' de ' + m.year();
    };
    var pdfNum = function (v) { return String(Math.round(v * 1000) / 1000); };
    // Ancho en Times de cifras (digitos 500, punto, coma y espacio 250) y de las mayusculas de los titulos DEBE / HABER
    // (Times-Bold): alinea a la derecha importes y titulos de columna.
    var BOLD_CAPS = { A: 722, B: 667, D: 722, E: 667, H: 778, R: 722 };
    var numWidth = function (s, size) {
      var w = 0;
      String(s).split('').forEach(function (ch) { w += BOLD_CAPS[ch] || (ch === '.' || ch === ',' || ch === ' ' ? 250 : 500); });
      return w * size / 1000;
    };
    var wrapText = function (s, max, maxLines) {
      var words = String(s || '').replace(/\s+/g, ' ').trim().split(' '), lines = [], cur = '';
      words.forEach(function (w) {
        while (w.length > max) { if (cur) { lines.push(cur); cur = ''; } lines.push(w.slice(0, max)); w = w.slice(max); }
        if (!cur) cur = w;
        else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
        else { lines.push(cur); cur = w; }
      });
      if (cur) lines.push(cur);
      if (!lines.length) lines.push('');
      if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].slice(0, max - 3) + '...'; }
      return lines;
    };
    var digitsOnly = function (s) { return String(s || '').replace(/[^0-9]/g, ''); };
    // Banda magnetica: C + numero de cheque en 8 digitos + C, ruta/transito, cuenta bancaria sin guiones + C.
    var micrLine = function (numero, cuentaBanco) {
      var chk = numero === null || numero === undefined ? '' : ('00000000' + digitsOnly(numero)).slice(-8);
      var acc = digitsOnly(cuentaBanco);
      return ['C' + chk + 'C', MICR_TRANSIT, acc ? acc + 'C' : ''];
    };
    // d: {id, numero, fechaLarga, beneficiario, monto, cuentaBanco, concepto, bloques: [{lineas: [{cuenta, descripcion, debe,
    //     haber}], totalDebe, totalHaber}], transaccion, fechaPago, horaPago, solicitudPeriodo, comprobantePeriodo,
    //     comprobanteNumero, copia, usuario, registrada}. Devuelve el PDF como cadena binaria (un caracter = un byte).
    var buildCopyPdf = function (d) {
      var ops = [];
      var text = function (font, size, x, y, s) { ops.push('BT /' + font + ' ' + size + ' Tf 1 0 0 1 ' + pdfNum(x) + ' ' + pdfNum(y) + ' Tm ' + pdfText(s) + ' Tj ET'); };
      var right = function (font, size, xRight, y, s) { text(font, size, xRight - numWidth(s, size), y, s); };
      var spaced = function (size, x, y, s, spacing) { ops.push('BT /F3 ' + size + ' Tf ' + spacing + ' Tc 1 0 0 1 ' + pdfNum(x) + ' ' + pdfNum(y) + ' Tm ' + pdfText(s) + ' Tj 0 Tc ET'); };
      var hline = function (x1, x2, y) { ops.push('0.75 G 0.5 w ' + pdfNum(x1) + ' ' + pdfNum(y) + ' m ' + pdfNum(x2) + ' ' + pdfNum(y) + ' l S 0 G'); };
      var numero = d.numero === null || d.numero === undefined ? 'S/N' : String(d.numero);
      var monto = fmtMoney(Math.abs(Number(d.monto) || 0));
      // marca de agua primero: el texto se imprime encima
      (function () {
        var size = 104, a = 47 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), w = FIEL_COPIA_EM * size, h = 0.66 * size;
        var cx = 300, cy = 432, x = cx - (w / 2) * c + (h / 2) * s, y = cy - (w / 2) * s - (h / 2) * c;
        ops.push('q 0.9 g BT /F2 ' + size + ' Tf ' + [c, s, -s, c, x, y].map(pdfNum).join(' ') + ' Tm (FIEL COPIA) Tj ET Q');
      })();
      // cheque
      text('F2', 12, 112, 750, 'Cuenta No.  ' + (d.cuentaBanco || ''));
      text('F2', 12, 435, 750, 'Cheque: N\u00famero:  ' + numero);
      text('F2', 12, 400, 734, d.fechaLarga);
      text('F2', 7, 80, 696, 'Paguese a la');
      text('F2', 7, 88, 688, 'orden de:');
      text('F2', 12, 126, 689, '*' + wrapText(d.beneficiario, 48, 1)[0] + '*');
      text('F2', 12, 126, 675, '***' + amountWords(d.monto, 'B/') + '***');
      text('F2', 7, 421, 697, 'B/');
      text('F2', 7, 421, 689, 'US$');
      text('F2', 12, 476, 690, '***' + monto + '***');
      text('F1', 10, 421, 675, 'D\u00f3lares o');
      text('F1', 10, 421, 663, 'Balboas');
      var micr = micrLine(d.numero, d.cuentaBanco);
      spaced(11, 119, 497, micr[0], 2.4);
      spaced(11, 260, 497, micr[1], 2.4);
      spaced(11, 384, 497, micr[2], 2.4);
      // talon
      text('F2', 12, 40, 390, COMPANY_NAME);
      text('F2', 12, 397, 390, 'Cheque: N\u00famero:  ' + numero);
      text('F2', 12, 40, 353, 'Concepto:');
      var y = 353;
      wrapText(d.concepto || '-', 62, 4).forEach(function (l) { text('F5', 11, 125, y, l); y -= 13; });
      y = Math.min(y - 10, 292);
      // bloques contables (uno por asiento del pago)
      var bloques = d.bloques && d.bloques.length ? d.bloques : [{ lineas: [], totalDebe: 0, totalHaber: 0 }];
      var BOTTOM = 175;
      bloques.forEach(function (b) {
        if (y < BOTTOM + 40) return;
        hline(40, 574, y);
        text('F2', 9, 437, y - 9, 'MONEDA NACIONAL');
        text('F2', 9, 40, y - 24, 'CUENTA');
        text('F2', 9, 165, y - 24, 'DESCRIPCION');
        right('F2', 9, 482, y - 24, 'DEBE');
        right('F2', 9, 574, y - 24, 'HABER');
        y -= 34;
        var shown = 0;
        b.lineas.forEach(function (l) {
          if (y < BOTTOM + 12) return;
          text('F1', 8, 40, y, wrapText(l.cuenta, 30, 1)[0]);
          text('F1', 8, 165, y, wrapText(l.descripcion, 55, 1)[0]);
          right('F1', 8, 482, y, fmtMoney(l.debe));
          right('F1', 8, 574, y, fmtMoney(l.haber));
          y -= 10;
          shown++;
        });
        if (shown < b.lineas.length) { text('F4', 8, 165, y, '(' + (b.lineas.length - shown) + ' l\u00edneas m\u00e1s en el asiento)'); y -= 10; }
        text('F2', 9, 40, y - 1, 'TOTAL');
        right('F2', 9, 482, y - 1, fmtMoney(b.totalDebe));
        right('F2', 9, 574, y - 1, fmtMoney(b.totalHaber));
        y -= 12;
      });
      // pie: transaccion, solicitud y comprobante; registro de la fiel copia
      var fy = Math.min(146, y - 30);
      var tx = String(d.transaccion || '');
      var foot = [[40, 'Transacci\u00f3n :'], [133 - numWidth(tx, 8.5), tx], [142, d.fechaPago || ''], [196, d.horaPago || ''],
        [246, 'Solicitud  :'], [311, d.solicitudPeriodo || ''], [362, String(d.id)], [400, 'Comprobante :'],
        [471, d.comprobantePeriodo || ''], [574 - numWidth(String(d.comprobanteNumero || ''), 8.5), String(d.comprobanteNumero || '')]];
      foot.forEach(function (f) { text('F1', 8.5, f[0], fy, f[1]); });
      ops.push('0.4 g');
      text('F4', 7, 40, fy - 12, 'Fiel copia N.\u00ba ' + d.copia + ' generada el ' + d.registrada + ' por ' + d.usuario + '.');
      ops.push('0 g');
      var content = ops.join('\n');
      var objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R /F5 8 0 R >> >> /Contents 9 0 R >>'
      ];
      ['Times-Roman', 'Times-Bold', 'Courier', 'Times-Italic', 'Helvetica'].forEach(function (f) {
        objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /' + f + ' /Encoding /WinAnsiEncoding >>');
      });
      objs.push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
      objs.push('<< /Title ' + pdfText('Fiel copia del cheque ' + numero + ' - solicitud ' + d.id) + ' /Author ' + pdfText(d.usuario) +
        ' /Creator (SISos) /CreationDate (D:' + moment.utc().format('YYYYMMDDHHmmss') + 'Z) >>');
      var out = '%PDF-1.4\n%' + String.fromCharCode(226, 227, 207, 211) + '\n', offsets = [];
      objs.forEach(function (o, i) { offsets.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
      var xref = out.length;
      out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
      offsets.forEach(function (off) { out += ('000000000' + off).slice(-10) + ' 00000 n \n'; });
      out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R /Info ' + objs.length + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
      return out;
    };
    var pdfBlob = function (bin) {
      var u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i) & 255;
      return new Blob([u], { type: 'application/pdf' });
    };
    var copiesFilter = function (ids) { return 'paymentId IN (' + ids.join(',') + ") AND name = '" + COPY_NAME + "'"; };
    // Copias registradas por solicitud (para la columna Fiel copia de la pagina visible).
    var loadCopies = function (ids) {
      if (!ids.length) return Promise.resolve({});
      return exe('RepoPaymentDocument', { operation: 'GET', filter: copiesFilter(ids), size: 0 }).then(function (r) {
        if (!r || !r.ok) fail(r);
        var map = {};
        (r.outData || []).forEach(function (doc) { map[doc.paymentId] = (map[doc.paymentId] || 0) + 1; });
        return map;
      });
    };
    // Reimprime: relee la solicitud (sigue ejecutada y es cheque), arma el PDF y lo registra en la solicitud. Sin registro no hay copia.
    var registerCopy = function (row, methodNames) {
      var id = row.id;
      var fresh = Object.assign({}, EMPTY_FILTER, { requestId: String(id), methods: ['CHEQUE'], status: 'EXECUTED' });
      return Promise.all([
        query(fresh, 0, 1, methodNames),
        exe('GetCurrentUser', {}),
        exe('RepoPaymentDocument', { operation: 'GET', filter: copiesFilter([id]), size: 0 }),
        exe('RepoTransaction', { operation: 'GET', filter: "entity = 'ClaimPayment' AND entityId = " + id, include: ['Lines', 'Lines.Account'], size: 0 })
      ]).then(function (res) {
        var r = res[0].rows[0];
        if (!r) throw new Error('La solicitud ' + id + ' ya no es un cheque ejecutado: no se reimprime.');
        if (!res[2] || !res[2].ok) fail(res[2]);
        if (!res[3] || !res[3].ok) fail(res[3]);
        var user = res[1] && res[1].ok && res[1].outData ? res[1].outData : {};
        // Asientos del pago (sin sus reversas): un bloque contable por asiento, como en el cheque de referencia.
        var entries = (res[3].outData || []).filter(function (e) { return !e.reversalOfId; }).sort(function (a, b) { return a.id - b.id; });
        var bloques = entries.map(function (e) {
          var lineas = (e.Lines || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).map(function (l) {
            return { cuenta: l.account || '', descripcion: l.Account ? l.Account.name : (l.comments || ''), debe: Number(l.debit) || 0, haber: Number(l.credit) || 0 };
          });
          var sum = function (k) { return lineas.reduce(function (s, l) { return s + l[k]; }, 0); };
          return { lineas: lineas, totalDebe: sum('debe'), totalHaber: sum('haber') };
        });
        var entry = entries[0] || null;
        var paid = r.fecha ? moment.utc(r.fecha).local() : null;
        var now = moment();
        var fileName = 'FielCopia_Cheque' + (r.numero === null ? 'SN' : r.numero) + '_Solicitud' + id + '_' + now.format('YYYYMMDD-HHmmss') + '.pdf';
        var copia = (res[2].outData || []).length + 1;
        var bin = buildCopyPdf({
          id: id, numero: r.numero, fechaLarga: longDate(r.fecha), beneficiario: r.beneficiario, monto: r.monto,
          cuentaBanco: r.cuentaNo || r.cuenta, concepto: r.concepto, bloques: bloques,
          transaccion: r.transferId === null ? '' : r.transferId,
          fechaPago: paid ? paid.format('D/MM/YYYY') : '', horaPago: paid ? paid.format('HH:mm:ss') : '',
          solicitudPeriodo: r.fechaSolicitud ? moment.utc(r.fechaSolicitud).local().format('YYYYMM') : '',
          comprobantePeriodo: entry && entry.date ? moment.utc(entry.date).local().format('YYYYMM') : '',
          comprobanteNumero: entry ? entry.id : '',
          copia: copia,
          usuario: (user.nombre ? user.nombre + ' ' : '') + (user.email ? '(' + user.email + ')' : '') || 'usuario actual',
          registrada: now.format('DD/MM/YYYY HH:mm')
        });
        return exe('UploadBytes', { fileName: fileName, bytes: btoa(bin) }).then(function (up) {
          if (!up || !up.ok) fail(up);
          var o = up.outData || {};
          if (!o.docServerOk || !o.url) throw new Error('El servidor de documentos no guard\u00f3 la copia: ' + (o.docServerMsg || 'sin respuesta') + '. No se imprime.');
          return exe('RepoPaymentDocument', { operation: 'ADD', entity: { paymentId: id, name: COPY_NAME, fileName: fileName, url: o.url, created: new Date().toISOString() } }).then(function (add) {
            if (!add || !add.ok) throw new Error('La copia no qued\u00f3 registrada en la solicitud: ' + ((add && add.msg) || 'sin respuesta') + '. No se imprime.');
            return { doc: (add.outData || [])[0] || {}, bin: bin, fileName: fileName, copia: copia };
          });
        });
      });
    };
    
    // ---- Revision 7: anulacion (P2) ----
    // Grupos cuyos miembros pueden anular: nombre del grupo tal como lo devuelve GetCurrentUser (Groups[].name).
    var ANNUL_GROUPS = ['Gerencia de Siniestros'];
    var VIEW_REF = 'vista \u00abConsulta de cheques y transferencias emitidos\u00bb (#/view/75)';
    var MANUAL_HELP = 'Desde esta vista s\u00f3lo se reversan pagos de siniestro. Los pagos manuales no tienen el bot\u00f3n \u00abReversar\u00bb.';
    var groupsLabel = function () {
      return ANNUL_GROUPS.length ? ANNUL_GROUPS.map(function (g) { return '\u00ab' + g + '\u00bb'; }).join(' o ') : '(ninguno)';
    };
    var notMemberText = function () { return 'S\u00f3lo pueden reversar los miembros del grupo ' + groupsLabel() + '.'; };
    var groupNames = function (user) {
      return ((user && user.Groups) || []).map(function (g) { return g ? g.name || (g.Group && g.Group.name) || '' : ''; }).filter(function (n) { return !!n; });
    };
    var isMember = function (user) {
      return groupNames(user).some(function (n) { return ANNUL_GROUPS.indexOf(n) >= 0; });
    };
    // Que admite una fila: OK (boton Anular), MANUAL / BLOCKED (texto con el motivo), NONE (nada).
    var annulInfo = function (p, paidCount) {
      if (p.entityState !== 'EXECUTED') return { kind: 'NONE' };
      if (!p.claimId) {
        var manual = !p.producer || String(p.producer).toUpperCase() === 'MANUAL';
        return { kind: 'MANUAL', text: manual ? 'No reversable: pago manual' : 'No reversable: no es pago de siniestro', help: MANUAL_HELP };
      }
      if (!p.payoutId) return { kind: 'BLOCKED', text: 'No reversable', help: 'El pago de siniestro no tiene un pago de reserva asociado, por eso no se puede reversar.' };
      if (paidCount !== 1) {
        return { kind: 'BLOCKED', text: 'No reversable', help: paidCount ? 'La solicitud tiene ' + paidCount + ' pagos ejecutados y s\u00f3lo se puede reversar uno: los dem\u00e1s quedar\u00edan pagados. Consulte con Tesorer\u00eda.' : 'La solicitud no tiene un pago ejecutado que reversar.' };
      }
      return { kind: 'OK' };
    };
    var paymentLabel = function (p) {
      if (p.paymentMethodCode !== 'CH') return 'transferencia';
      return 'cheque ' + (p.checkNum === null || p.checkNum === undefined ? 'sin n\u00famero registrado' : 'N.\u00ba ' + p.checkNum);
    };
    // Asientos del pago (los genera la contabilizacion de ExeClaimPayment con entity ClaimPayment). ReverseTransaction copia
    // entity/entityId en el asiento inverso y apunta al original con reversalOfId: un original esta revertido si otro lo nombra.
    var splitEntries = function (entries) {
      var reversals = {};
      entries.forEach(function (e) { if (e.reversalOfId) reversals[e.reversalOfId] = e; });
      var originals = entries.filter(function (e) { return !e.reversalOfId; }).sort(function (a, b) { return a.id - b.id; });
      var open = originals.filter(function (e) { return !reversals[e.id] && !e.reversalDate; });
      return {
        originals: originals.map(function (e) { return { entry: e, reversal: reversals[e.id] || null }; }),
        pending: open.filter(function (e) { return e.status === 1; }),
        drafts: open.filter(function (e) { return e.status === 0; })
      };
    };
    // Asiento inverso de un asiento del pago si ya lo tiene ({ id: null } si el original figura revertido sin que se vea el
    // inverso); null si sigue sin revertir o ya no esta.
    var reversalOf = function (entries, entry) {
      var o = splitEntries(entries).originals.filter(function (x) { return x.entry.id === entry.id; })[0];
      if (!o) return null;
      return o.reversal || (o.entry.reversalDate ? { id: null } : null);
    };
    var loadEntries = function (id) {
      return exe('RepoTransaction', { operation: 'GET', filter: "entity = 'ClaimPayment' AND entityId = " + id, size: 0 }).then(function (r) {
        if (!r || !r.ok) fail(r);
        return r.outData || [];
      });
    };
    // Mes contable cerrado (ReverseTransaction registra la reversa con la fecha de hoy y la rechaza en un mes cerrado).
    var closedMonth = function (entry) {
      var now = moment.utc();
      var org = entry.organizationId;
      var f = 'year = ' + now.year() + ' AND month = ' + (now.month() + 1) + ' AND status > 0 AND (organizationId IS NULL' + (org ? ' OR organizationId = ' + Number(org) : '') + ')';
      return exe('RepoClosure', { operation: 'GET', filter: f, size: 0 }).then(function (r) {
        if (!r || !r.ok) fail(r);
        return (r.outData || []).length ? (now.month() + 1) + '/' + now.year() : null;
      });
    };
    // Relectura previa a la anulacion: todo lo que la decide se lee de nuevo; nada sale de la tabla.
    var loadAnnulContext = function (id) {
      return Promise.all([
        exe('RepoClaimPayment', { operation: 'GET', custom: true, filter: '[ClaimPayment].id = ' + id, size: 1, page: 0 }),
        exe('RepoTransfer', { operation: 'GET', filter: 'claimPaymentId = ' + id, size: 0 }),
        loadEntries(id),
        exe('GetCurrentUser', {})
      ]).then(function (res) {
        if (!res[0] || !res[0].ok) fail(res[0]);
        if (!res[1] || !res[1].ok) fail(res[1]);
        var p = (res[0].outData || [])[0] || null;
        var user = res[3] && res[3].ok ? res[3].outData : null;
        var ctx = { id: id, p: p, user: user, member: isMember(user), transfer: null, entry: null, problems: [] };
        if (!p) { ctx.problems.push('La solicitud ' + id + ' ya no existe.'); return ctx; }
        var paid = (res[1].outData || []).filter(function (t) { return t.status === 1; });
        var info = annulInfo(p, paid.length);
        if (p.entityState !== 'EXECUTED') ctx.problems.push('La solicitud ' + id + ' ya no est\u00e1 ejecutada (estado ' + stateOf(p.entityState).label + '): no se reversa.');
        else if (info.kind !== 'OK') ctx.problems.push(info.help);
        if (paid.length === 1) {
          ctx.transfer = paid[0];
          if (!ctx.transfer.sourceAccountId || !ctx.transfer.destinationAccountId) ctx.problems.push('La transferencia de pago ' + ctx.transfer.id + ' no tiene cuenta origen y cuenta destino: no se puede reversar.');
        }
        var ent = splitEntries(res[2]);
        if (ent.drafts.length) ctx.problems.push('El asiento ' + ent.drafts.map(function (e) { return e.id; }).join(', ') + ' del pago no est\u00e1 contabilizado: s\u00f3lo se pueden revertir asientos contabilizados.');
        if (ent.pending.length > 1) ctx.problems.push('El pago tiene ' + ent.pending.length + ' asientos contables sin revertir (' + ent.pending.map(function (e) { return e.id; }).join(', ') + '): no se puede saber cu\u00e1l revertir, as\u00ed que no se reversa desde esta vista.');
        if (ent.pending.length === 1) ctx.entry = ent.pending[0];
        if (!ctx.member) ctx.problems.push(notMemberText());
        return ctx;
      }).then(function (ctx) {
        if (!ctx.entry || ctx.problems.length) return ctx;
        return closedMonth(ctx.entry).then(function (closed) {
          if (closed) ctx.problems.push('El mes contable ' + closed + ' est\u00e1 cerrado: la reversa del asiento ' + ctx.entry.id + ' no se puede registrar, y reversar s\u00f3lo el pago dejar\u00eda tesorer\u00eda y contabilidad distintas.');
          return ctx;
        });
      });
    };
    var annulNotes = function (ctx, cause, sub) {
      return 'Reversi\u00f3n de la solicitud de pago ' + ctx.id + ' (' + paymentLabel(ctx.p) + ') desde la ' + VIEW_REF + ': transferencia de pago ' +
        ctx.transfer.id + ' revertida; causa ' + cause.code + ' ' + cause.name + (sub ? ', subcausa ' + sub.code + ' ' + sub.name : '') + '.';
    };
    var reverseNotes = function (id, transferId) {
      return 'Reversa del asiento del pago de la solicitud ' + id + ', ya reversada' + (transferId ? ' (transferencia de pago ' + transferId + ' revertida)' : '') +
        ', registrada desde la ' + VIEW_REF + '.';
    };
    // UnDoPaymentClaim y, si el pago tiene asiento, ReverseTransaction en el mismo paso. Resultado: kind DONE (anulada y, si habia
    // asiento, revertido), PENDING (anulada con el asiento sin revertir: se completa desde el detalle de la anulacion) o UNKNOWN
    // (no se pudo saber en que quedo). Si al releer se confirma que no se anulo, se lanza el error.
    // MSN-000099 (punto 3): un error no prueba que no se haya hecho. Si la respuesta no llega (timeout, red), exe devuelve ok:false
    // aunque el servidor haya ejecutado el comando; por eso, tras cualquier error, se relee el estado antes de decir nada.
    var afterAnnulError = function (ctx, why) {
      return Promise.all([
        exe('RepoClaimPayment', { operation: 'GET', custom: true, filter: '[ClaimPayment].id = ' + ctx.id, size: 1, page: 0 }),
        exe('RepoTransfer', { operation: 'GET', filter: 'claimPaymentId = ' + ctx.id, size: 0 }),
        loadEntries(ctx.id)
      ]).then(function (res) {
        if (!res[0] || !res[0].ok) fail(res[0]);
        if (!res[1] || !res[1].ok) fail(res[1]);
        return { p: (res[0].outData || [])[0] || null, transfers: res[1].outData || [], entries: res[2] };
      }).then(function (x) {
        var t = x.transfers.filter(function (y) { return y.id === ctx.transfer.id; })[0] || null;
        var tReverted = !!(t && (t.status === 2 || t.reversalDate));
        if (x.p && x.p.entityState === 'REVERTED') {
          if (!ctx.entry) return { kind: 'DONE', entry: null, late: why };
          var rev = reversalOf(x.entries, ctx.entry);
          if (rev) return { kind: 'DONE', entry: ctx.entry, reversal: rev, late: why };
          return { kind: 'PENDING', stage: 'annul', entry: ctx.entry, transfer: ctx.transfer, error: why };
        }
        if (x.p && x.p.entityState === 'EXECUTED' && t && !tReverted) {
          throw new Error('No se pudo reversar la solicitud ' + ctx.id + '. Sigue Ejecutada y no qued\u00f3 nada a medias: puede intentarlo de nuevo.');
        }
        return { kind: 'UNKNOWN', error: why, state: x.p ? stateOf(x.p.entityState).label : 'no encontrada', transferReverted: tReverted };
      }, function (e) {
        return { kind: 'UNKNOWN', error: why, readError: errText(e) };
      });
    };
    // Tras un error de ReverseTransaction (la anulacion ya quedo hecha) se relee el asiento para saber si quedo revertido.
    var afterReverseError = function (ctx, why) {
      return loadEntries(ctx.id).then(function (entries) {
        var rev = reversalOf(entries, ctx.entry);
        if (rev) return { kind: 'DONE', entry: ctx.entry, reversal: rev, late: why };
        return { kind: 'PENDING', stage: 'reverse', entry: ctx.entry, transfer: ctx.transfer, error: why };
      }, function (e) {
        return { kind: 'PENDING', stage: 'reverse', entry: ctx.entry, transfer: ctx.transfer, error: why, unsure: errText(e) };
      });
    };
    var annulPayment = function (ctx, cause, sub) {
      var reverse = function () {
        if (!ctx.entry) return { kind: 'DONE', entry: null };
        return exe('ReverseTransaction', { transactionId: ctx.entry.id, notes: annulNotes(ctx, cause, sub) }).then(function (rt) {
          if (rt && rt.ok) return { kind: 'DONE', entry: ctx.entry, reversal: rt.outData || {} };
          return afterReverseError(ctx, errText(rt));
        }, function (e) { return afterReverseError(ctx, errText(e)); });
      };
      return exe('UnDoPaymentClaim', { transferId: ctx.transfer.id, reversalCause: cause.code, reversalSubcause: sub ? sub.code : null, jReversalFormValues: null }).then(function (r) {
        if (r && r.ok) return reverse();
        return afterAnnulError(ctx, errText(r));
      }, function (e) { return afterAnnulError(ctx, errText(e)); });
    };
    // Historial de una anulada: lo que dejaron los comandos nativos (transferencia revertida con fecha y causa, solicitud de
    // reversa en negativo con su usuario, asiento inverso). Sirve igual para las anuladas fuera de esta vista.
    var loadAnnulHistory = function (id) {
      return Promise.all([
        exe('RepoClaimPayment', { operation: 'GET', custom: true, filter: '[ClaimPayment].id = ' + id, size: 1, page: 0 }),
        exe('RepoTransfer', { operation: 'GET', filter: 'claimPaymentId = ' + id, size: 0 }),
        loadEntries(id),
        exe('RepoTransferReversalCause', { operation: 'GET' }),
        exe('RepoTransferReversalSubcause', { operation: 'GET' }),
        exe('GetCurrentUser', {})
      ]).then(function (res) {
        [0, 1, 3, 4].forEach(function (i) { if (!res[i] || !res[i].ok) fail(res[i]); });
        var p = (res[0].outData || [])[0] || null;
        var transfers = (res[1].outData || []).slice().sort(function (a, b) { return a.id - b.id; });
        var t = transfers.filter(function (x) { return x.status === 2; })[0] || transfers[0] || null;
        var h = {
          p: p, transfer: t, entries: splitEntries(res[2]), reversalRequest: null,
          user: res[5] && res[5].ok ? res[5].outData : null,
          cause: (res[3].outData || []).filter(function (c) { return t && c.code === t.reversalCause; })[0] || null,
          sub: (res[4].outData || []).filter(function (s) { return t && s.code === t.reversalSubcause && s.causeCode === t.reversalCause; })[0] || null
        };
        if (!p || !t || !t.reversalDate || !p.claimId) return h;
        // La solicitud de reversa (copia en negativo) la crea UnDoPaymentClaim en el mismo instante en que revierte la transferencia.
        var at = moment.utc(t.reversalDate);
        var f = '[ClaimPayment].claimId = ' + Number(p.claimId) + (p.payoutId ? ' AND [ClaimPayment].payoutId = ' + Number(p.payoutId) : '') +
          ' AND [ClaimPayment].total = ' + (-Number(p.total)) + " AND [ClaimPayment].date BETWEEN '" + at.clone().subtract(5, 'minutes').format('YYYY-MM-DDTHH:mm:ss') +
          "' AND '" + at.clone().add(5, 'minutes').format('YYYY-MM-DDTHH:mm:ss') + "'";
        return exe('RepoClaimPayment', { operation: 'GET', custom: true, filter: f, size: 1, page: 0 }).then(function (r) {
          h.reversalRequest = r && r.ok ? (r.outData || [])[0] || null : null;
          return h;
        });
      });
    };
    // MSN-000099 (punto 4): relectura justo antes de \u00abRevertir asiento\u00bb, igual que la anulacion: el usuario sigue en el grupo,
    // la solicitud sigue anulada, el asiento sigue siendo el unico del pago sin revertir (sin asientos sin contabilizar) y el mes
    // contable de hoy esta abierto.
    var checkReverse = function (id, entry) {
      return loadAnnulHistory(id).then(function (h) {
        var problems = [];
        if (!isMember(h.user)) problems.push('S\u00f3lo pueden revertir el asiento los miembros del grupo ' + groupsLabel() + ' (se valida con su usuario).');
        if (!h.p) problems.push('La solicitud ' + id + ' ya no existe.');
        else if (h.p.entityState !== 'REVERTED') problems.push('La solicitud ' + id + ' ya no est\u00e1 reversada (estado ' + stateOf(h.p.entityState).label + '): no se revierte su asiento.');
        var ent = h.entries;
        var same = ent.pending.filter(function (e) { return e.id === entry.id; })[0] || null;
        if (!same) {
          var o = ent.originals.filter(function (x) { return x.entry.id === entry.id; })[0];
          var rv = o ? o.reversal : null;
          problems.push('El asiento ' + entry.id + ' ya no est\u00e1 pendiente de revertir' + (rv ? ': lo revirti\u00f3 el asiento ' + rv.id + ' del ' + dateTime(rv.date) + (rv.user ? ' (' + rv.user + ')' : '') : '') + '.');
        } else if (ent.pending.length > 1) {
          problems.push('El pago tiene ' + ent.pending.length + ' asientos contables sin revertir (' + ent.pending.map(function (e) { return e.id; }).join(', ') + '): no se puede saber cu\u00e1l revertir, as\u00ed que no se revierte desde esta vista.');
        }
        if (ent.drafts.length) problems.push('El asiento ' + ent.drafts.map(function (e) { return e.id; }).join(', ') + ' del pago no est\u00e1 contabilizado: s\u00f3lo se pueden revertir asientos contabilizados.');
        return { h: h, entry: same, problems: problems };
      }).then(function (chk) {
        if (!chk.entry || chk.problems.length) return chk;
        return closedMonth(chk.entry).then(function (closed) {
          if (closed) chk.problems.push('El mes contable ' + closed + ' est\u00e1 cerrado: la reversa del asiento ' + chk.entry.id + ' no se puede registrar.');
          return chk;
        });
      });
    };
    
    // ---- Excel export: plain-code port of the native DownloadOptions "Excel" button ----
    // Native: antd-table-saveas-excel 2.1.4 -> better-xlsx 0.7.6 (+ jszip 3.7.1) -> file-saver 2.0.5.
    // The XML below reproduces better-xlsx byte for byte (same attributes, same style table order and
    // de-duplication quirks) so the file Excel shows is identical; the zip is written uncompressed.
    
    // better-xlsx templates.js XL_THEME_THEME (verbatim, non-ASCII escaped).
    var XLSX_THEME = [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"Office-Design\">",
      "  <a:themeElements>",
      "    <a:clrScheme name=\"Office\">",
      "      <a:dk1>",
      "        <a:sysClr val=\"windowText\" lastClr=\"000000\"/>",
      "      </a:dk1>",
      "      <a:lt1>",
      "        <a:sysClr val=\"window\" lastClr=\"FFFFFF\"/>",
      "      </a:lt1>",
      "      <a:dk2>",
      "        <a:srgbClr val=\"1F497D\"/>",
      "      </a:dk2>",
      "      <a:lt2>",
      "        <a:srgbClr val=\"EEECE1\"/>",
      "      </a:lt2>",
      "      <a:accent1>",
      "        <a:srgbClr val=\"4F81BD\"/>",
      "      </a:accent1>",
      "      <a:accent2>",
      "        <a:srgbClr val=\"C0504D\"/>",
      "      </a:accent2>",
      "      <a:accent3>",
      "        <a:srgbClr val=\"9BBB59\"/>",
      "      </a:accent3>",
      "      <a:accent4>",
      "        <a:srgbClr val=\"8064A2\"/>",
      "      </a:accent4>",
      "      <a:accent5>",
      "        <a:srgbClr val=\"4BACC6\"/>",
      "      </a:accent5>",
      "      <a:accent6>",
      "        <a:srgbClr val=\"F79646\"/>",
      "      </a:accent6>",
      "      <a:hlink>",
      "        <a:srgbClr val=\"0000FF\"/>",
      "      </a:hlink>",
      "      <a:folHlink>",
      "        <a:srgbClr val=\"800080\"/>",
      "      </a:folHlink>",
      "    </a:clrScheme>",
      "    <a:fontScheme name=\"Office\">",
      "      <a:majorFont>",
      "        <a:latin typeface=\"Cambria\"/>",
      "        <a:ea typeface=\"\"/>",
      "        <a:cs typeface=\"\"/>",
      "        <a:font script=\"Jpan\" typeface=\"\uff2d\uff33 \uff30\u30b4\u30b7\u30c3\u30af\"/>",
      "        <a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/>",
      "        <a:font script=\"Hans\" typeface=\"\u5b8b\u4f53\"/>",
      "        <a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/>",
      "        <a:font script=\"Arab\" typeface=\"Times New Roman\"/>",
      "        <a:font script=\"Hebr\" typeface=\"Times New Roman\"/>",
      "        <a:font script=\"Thai\" typeface=\"Tahoma\"/>",
      "        <a:font script=\"Ethi\" typeface=\"Nyala\"/>",
      "        <a:font script=\"Beng\" typeface=\"Vrinda\"/>",
      "        <a:font script=\"Gujr\" typeface=\"Shruti\"/>",
      "        <a:font script=\"Khmr\" typeface=\"MoolBoran\"/>",
      "        <a:font script=\"Knda\" typeface=\"Tunga\"/>",
      "        <a:font script=\"Guru\" typeface=\"Raavi\"/>",
      "        <a:font script=\"Cans\" typeface=\"Euphemia\"/>",
      "        <a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/>",
      "        <a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/>",
      "        <a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/>",
      "        <a:font script=\"Thaa\" typeface=\"MV Boli\"/>",
      "        <a:font script=\"Deva\" typeface=\"Mangal\"/>",
      "        <a:font script=\"Telu\" typeface=\"Gautami\"/>",
      "        <a:font script=\"Taml\" typeface=\"Latha\"/>",
      "        <a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/>",
      "        <a:font script=\"Orya\" typeface=\"Kalinga\"/>",
      "        <a:font script=\"Mlym\" typeface=\"Kartika\"/>",
      "        <a:font script=\"Laoo\" typeface=\"DokChampa\"/>",
      "        <a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/>",
      "        <a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/>",
      "        <a:font script=\"Viet\" typeface=\"Times New Roman\"/>",
      "        <a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/>",
      "        <a:font script=\"Geor\" typeface=\"Sylfaen\"/>",
      "      </a:majorFont>",
      "      <a:minorFont>",
      "        <a:latin typeface=\"Calibri\"/>",
      "        <a:ea typeface=\"\"/>",
      "        <a:cs typeface=\"\"/>",
      "        <a:font script=\"Jpan\" typeface=\"\uff2d\uff33 \uff30\u30b4\u30b7\u30c3\u30af\"/>",
      "        <a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/>",
      "        <a:font script=\"Hans\" typeface=\"\u5b8b\u4f53\"/>",
      "        <a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/>",
      "        <a:font script=\"Arab\" typeface=\"Arial\"/>",
      "        <a:font script=\"Hebr\" typeface=\"Arial\"/>",
      "        <a:font script=\"Thai\" typeface=\"Tahoma\"/>",
      "        <a:font script=\"Ethi\" typeface=\"Nyala\"/>",
      "        <a:font script=\"Beng\" typeface=\"Vrinda\"/>",
      "        <a:font script=\"Gujr\" typeface=\"Shruti\"/>",
      "        <a:font script=\"Khmr\" typeface=\"DaunPenh\"/>",
      "        <a:font script=\"Knda\" typeface=\"Tunga\"/>",
      "        <a:font script=\"Guru\" typeface=\"Raavi\"/>",
      "        <a:font script=\"Cans\" typeface=\"Euphemia\"/>",
      "        <a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/>",
      "        <a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/>",
      "        <a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/>",
      "        <a:font script=\"Thaa\" typeface=\"MV Boli\"/>",
      "        <a:font script=\"Deva\" typeface=\"Mangal\"/>",
      "        <a:font script=\"Telu\" typeface=\"Gautami\"/>",
      "        <a:font script=\"Taml\" typeface=\"Latha\"/>",
      "        <a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/>",
      "        <a:font script=\"Orya\" typeface=\"Kalinga\"/>",
      "        <a:font script=\"Mlym\" typeface=\"Kartika\"/>",
      "        <a:font script=\"Laoo\" typeface=\"DokChampa\"/>",
      "        <a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/>",
      "        <a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/>",
      "        <a:font script=\"Viet\" typeface=\"Arial\"/>",
      "        <a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/>",
      "        <a:font script=\"Geor\" typeface=\"Sylfaen\"/>",
      "      </a:minorFont>",
      "    </a:fontScheme>",
      "    <a:fmtScheme name=\"Office\">",
      "      <a:fillStyleLst>",
      "        <a:solidFill>",
      "          <a:schemeClr val=\"phClr\"/>",
      "        </a:solidFill>",
      "        <a:gradFill rotWithShape=\"1\">",
      "          <a:gsLst>",
      "            <a:gs pos=\"0\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"50000\"/>",
      "                <a:satMod val=\"300000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "            <a:gs pos=\"35000\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"37000\"/>",
      "                <a:satMod val=\"300000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "            <a:gs pos=\"100000\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"15000\"/>",
      "                <a:satMod val=\"350000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "          </a:gsLst>",
      "          <a:lin ang=\"16200000\" scaled=\"1\"/>",
      "        </a:gradFill>",
      "        <a:gradFill rotWithShape=\"1\">",
      "          <a:gsLst>",
      "            <a:gs pos=\"0\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"100000\"/>",
      "                <a:shade val=\"100000\"/>",
      "                <a:satMod val=\"130000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "            <a:gs pos=\"100000\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"50000\"/>",
      "                <a:shade val=\"100000\"/>",
      "                <a:satMod val=\"350000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "          </a:gsLst>",
      "          <a:lin ang=\"16200000\" scaled=\"0\"/>",
      "        </a:gradFill>",
      "      </a:fillStyleLst>",
      "      <a:lnStyleLst>",
      "        <a:ln w=\"9525\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\">",
      "          <a:solidFill>",
      "            <a:schemeClr val=\"phClr\">",
      "              <a:shade val=\"95000\"/>",
      "              <a:satMod val=\"105000\"/>",
      "            </a:schemeClr>",
      "          </a:solidFill>",
      "          <a:prstDash val=\"solid\"/>",
      "        </a:ln>",
      "        <a:ln w=\"25400\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\">",
      "          <a:solidFill>",
      "            <a:schemeClr val=\"phClr\"/>",
      "          </a:solidFill>",
      "          <a:prstDash val=\"solid\"/>",
      "        </a:ln>",
      "        <a:ln w=\"38100\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\">",
      "          <a:solidFill>",
      "            <a:schemeClr val=\"phClr\"/>",
      "          </a:solidFill>",
      "          <a:prstDash val=\"solid\"/>",
      "        </a:ln>",
      "      </a:lnStyleLst>",
      "      <a:effectStyleLst>",
      "        <a:effectStyle>",
      "          <a:effectLst>",
      "            <a:outerShdw blurRad=\"40000\" dist=\"20000\" dir=\"5400000\" rotWithShape=\"0\">",
      "              <a:srgbClr val=\"000000\">",
      "                <a:alpha val=\"38000\"/>",
      "              </a:srgbClr>",
      "            </a:outerShdw>",
      "          </a:effectLst>",
      "        </a:effectStyle>",
      "        <a:effectStyle>",
      "          <a:effectLst>",
      "            <a:outerShdw blurRad=\"40000\" dist=\"23000\" dir=\"5400000\" rotWithShape=\"0\">",
      "              <a:srgbClr val=\"000000\">",
      "                <a:alpha val=\"35000\"/>",
      "              </a:srgbClr>",
      "            </a:outerShdw>",
      "          </a:effectLst>",
      "        </a:effectStyle>",
      "        <a:effectStyle>",
      "          <a:effectLst>",
      "            <a:outerShdw blurRad=\"40000\" dist=\"23000\" dir=\"5400000\" rotWithShape=\"0\">",
      "              <a:srgbClr val=\"000000\">",
      "                <a:alpha val=\"35000\"/>",
      "              </a:srgbClr>",
      "            </a:outerShdw>",
      "          </a:effectLst>",
      "          <a:scene3d>",
      "            <a:camera prst=\"orthographicFront\">",
      "              <a:rot lat=\"0\" lon=\"0\" rev=\"0\"/>",
      "            </a:camera>",
      "            <a:lightRig rig=\"threePt\" dir=\"t\">",
      "              <a:rot lat=\"0\" lon=\"0\" rev=\"1200000\"/>",
      "            </a:lightRig>",
      "          </a:scene3d>",
      "          <a:sp3d>",
      "            <a:bevelT w=\"63500\" h=\"25400\"/>",
      "          </a:sp3d>",
      "        </a:effectStyle>",
      "      </a:effectStyleLst>",
      "      <a:bgFillStyleLst>",
      "        <a:solidFill>",
      "          <a:schemeClr val=\"phClr\"/>",
      "        </a:solidFill>",
      "        <a:gradFill rotWithShape=\"1\">",
      "          <a:gsLst>",
      "            <a:gs pos=\"0\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"40000\"/>",
      "                <a:satMod val=\"350000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "            <a:gs pos=\"40000\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"45000\"/>",
      "                <a:shade val=\"99000\"/>",
      "                <a:satMod val=\"350000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "            <a:gs pos=\"100000\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:shade val=\"20000\"/>",
      "                <a:satMod val=\"255000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "          </a:gsLst>",
      "          <a:path path=\"circle\">",
      "            <a:fillToRect l=\"50000\" t=\"-80000\" r=\"50000\" b=\"180000\"/>",
      "          </a:path>",
      "        </a:gradFill>",
      "        <a:gradFill rotWithShape=\"1\">",
      "          <a:gsLst>",
      "            <a:gs pos=\"0\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:tint val=\"80000\"/>",
      "                <a:satMod val=\"300000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "            <a:gs pos=\"100000\">",
      "              <a:schemeClr val=\"phClr\">",
      "                <a:shade val=\"30000\"/>",
      "                <a:satMod val=\"200000\"/>",
      "              </a:schemeClr>",
      "            </a:gs>",
      "          </a:gsLst>",
      "          <a:path path=\"circle\">",
      "            <a:fillToRect l=\"50000\" t=\"50000\" r=\"50000\" b=\"50000\"/>",
      "          </a:path>",
      "        </a:gradFill>",
      "      </a:bgFillStyleLst>",
      "    </a:fmtScheme>",
      "  </a:themeElements>",
      "  <a:objectDefaults>",
      "    <a:spDef>",
      "      <a:spPr/>",
      "      <a:bodyPr/>",
      "      <a:lstStyle/>",
      "      <a:style>",
      "        <a:lnRef idx=\"1\">",
      "          <a:schemeClr val=\"accent1\"/>",
      "        </a:lnRef>",
      "        <a:fillRef idx=\"3\">",
      "          <a:schemeClr val=\"accent1\"/>",
      "        </a:fillRef>",
      "        <a:effectRef idx=\"2\">",
      "          <a:schemeClr val=\"accent1\"/>",
      "        </a:effectRef>",
      "        <a:fontRef idx=\"minor\">",
      "          <a:schemeClr val=\"lt1\"/>",
      "        </a:fontRef>",
      "      </a:style>",
      "    </a:spDef>",
      "    <a:lnDef>",
      "      <a:spPr/>",
      "      <a:bodyPr/>",
      "      <a:lstStyle/>",
      "      <a:style>",
      "        <a:lnRef idx=\"2\">",
      "          <a:schemeClr val=\"accent1\"/>",
      "        </a:lnRef>",
      "        <a:fillRef idx=\"0\">",
      "          <a:schemeClr val=\"accent1\"/>",
      "        </a:fillRef>",
      "        <a:effectRef idx=\"1\">",
      "          <a:schemeClr val=\"accent1\"/>",
      "        </a:effectRef>",
      "        <a:fontRef idx=\"minor\">",
      "          <a:schemeClr val=\"tx1\"/>",
      "        </a:fontRef>",
      "      </a:style>",
      "    </a:lnDef>",
      "  </a:objectDefaults>",
      "  <a:extraClrSchemeLst/>",
      "</a:theme>"
    ].join("\n");
    
    var XLSX_XML = '<?xml version="1.0" encoding="UTF-8"?>';
    var XLSX_SS_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    var XLSX_DOC_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    var XLSX_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
    var XLSX_CT = 'application/vnd.openxmlformats-';
    
    // Parts that do not depend on the data (better-xlsx file.js makeParts, one sheet named "Sheet1").
    var XLSX_STATIC = {
      workbook: XLSX_XML + '<workbook xmlns="' + XLSX_SS_NS + '" xmlns:r="' + XLSX_DOC_REL + '"><fileVersion appName="JS XLSX"/><workbookPr showObjects="all"/><bookViews><workbookView showHorizontalScroll="1" showSheetTabs="1" showVerticalScroll="1" tabRatio="204" windowHeight="8192" windowWidth="16384" xWindow="0" yWindow="0"/></bookViews><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1" state="visible"/></sheets><calcPr iterateCount="100" iterate="0" iterateDelta="0.001" refMode="A1"/></workbook>',
      rels: XLSX_XML + '\n<Relationships xmlns="' + XLSX_PKG_REL + '">\n' +
        '  <Relationship Id="rId1" Type="' + XLSX_DOC_REL + '/officeDocument" Target="xl/workbook.xml"/>\n' +
        '  <Relationship Id="rId2" Type="' + XLSX_PKG_REL + '/metadata/core-properties" Target="docProps/core.xml"/>\n' +
        '  <Relationship Id="rId3" Type="' + XLSX_DOC_REL + '/extended-properties" Target="docProps/app.xml"/>\n' +
        '</Relationships>',
      app: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n  <TotalTime>0</TotalTime>\n  <Application>JS XLSX</Application>\n</Properties>',
      core: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></cp:coreProperties>',
      wbRels: XLSX_XML + '<Relationships xmlns="' + XLSX_PKG_REL + '">' +
        '<Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="' + XLSX_DOC_REL + '/worksheet"/>' +
        '<Relationship Id="rId2" Target="sharedStrings.xml" Type="' + XLSX_DOC_REL + '/sharedStrings"/>' +
        '<Relationship Id="rId3" Target="theme/theme1.xml" Type="' + XLSX_DOC_REL + '/theme"/>' +
        '<Relationship Id="rId4" Target="styles.xml" Type="' + XLSX_DOC_REL + '/styles"/></Relationships>',
      types: XLSX_XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="' + XLSX_CT + 'package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/_rels/.rels" ContentType="' + XLSX_CT + 'package.relationships+xml"/>' +
        '<Override PartName="/docProps/app.xml" ContentType="' + XLSX_CT + 'officedocument.extended-properties+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="' + XLSX_CT + 'package.core-properties+xml"/>' +
        '<Override PartName="/xl/_rels/workbook.xml.rels" ContentType="' + XLSX_CT + 'package.relationships+xml"/>' +
        '<Override PartName="/xl/sharedStrings.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.sharedStrings+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/theme/theme1.xml" ContentType="' + XLSX_CT + 'officedocument.theme+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="' + XLSX_CT + 'officedocument.spreadsheetml.worksheet+xml"/></Types>'
    };
    
    // better-xlsx node.js escape() for text nodes (only & < > and CR).
    var xlsxEsc = function (s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
    };
    
    // better-xlsx lib.js num2col: 0 -> A, 26 -> AA.
    var xlsxColName = function (c) {
      var s = '';
      for (++c; c; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(((c - 1) % 26) + 65) + s;
      return s;
    };
    
    // jszip utf8.js string2buf (what jszip uses in the browser; differs from TextEncoder on lone surrogates).
    var xlsxUtf8 = function (str) {
      var out = [], i, c, c2;
      for (i = 0; i < str.length; i++) {
        c = str.charCodeAt(i);
        if ((c & 0xfc00) === 0xd800 && i + 1 < str.length) {
          c2 = str.charCodeAt(i + 1);
          if ((c2 & 0xfc00) === 0xdc00) { c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00); i++; }
        }
        if (c < 0x80) out.push(c);
        else if (c < 0x800) out.push(0xc0 | (c >>> 6), 0x80 | (c & 0x3f));
        else if (c < 0x10000) out.push(0xe0 | (c >>> 12), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f));
        else out.push(0xf0 | (c >>> 18), 0x80 | ((c >>> 12) & 0x3f), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
      return new Uint8Array(out);
    };
    
    var xlsxCrcTable = null;
    var xlsxCrc32 = function (bytes) {
      var c, n, k, crc = -1;
      if (!xlsxCrcTable) {
        xlsxCrcTable = [];
        for (n = 0; n < 256; n++) {
          c = n;
          for (k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          xlsxCrcTable.push(c >>> 0);
        }
      }
      for (n = 0; n < bytes.length; n++) crc = (crc >>> 8) ^ xlsxCrcTable[(crc ^ bytes[n]) & 0xff];
      return (crc ^ -1) >>> 0;
    };
    
    // Minimal zip writer (STORE). parts: [[path, xmlString], ...] in jszip insertion order.
    var xlsxZip = function (parts) {
      var now = new Date();
      // jszip stamps entries with the UTC DOS date/time.
      var dosTime = (now.getUTCHours() << 11) | (now.getUTCMinutes() << 5) | (now.getUTCSeconds() / 2);
      var dosDate = ((now.getUTCFullYear() - 1980) << 9) | ((now.getUTCMonth() + 1) << 5) | now.getUTCDate();
      var entries = [], size = 22, cdSize = 0, i;
      for (i = 0; i < parts.length; i++) {
        var name = xlsxUtf8(parts[i][0]), body = xlsxUtf8(parts[i][1]);
        entries.push({ name: name, body: body, crc: xlsxCrc32(body) });
        size += 30 + name.length + body.length + 46 + name.length;
        cdSize += 46 + name.length;
      }
      var buf = new Uint8Array(size), dv = new DataView(buf.buffer), p = 0;
      var head = function (sig, e, central) {
        dv.setUint32(p, sig, true); p += 4;
        if (central) { dv.setUint16(p, 20, true); p += 2; }
        dv.setUint16(p, 20, true); dv.setUint16(p + 2, 0, true); dv.setUint16(p + 4, 0, true);
        dv.setUint16(p + 6, dosTime, true); dv.setUint16(p + 8, dosDate, true);
        dv.setUint32(p + 10, e.crc, true); dv.setUint32(p + 14, e.body.length, true); dv.setUint32(p + 18, e.body.length, true);
        dv.setUint16(p + 22, e.name.length, true); dv.setUint16(p + 24, 0, true); p += 26;
        if (central) {
          dv.setUint16(p, 0, true); dv.setUint16(p + 2, 0, true); dv.setUint16(p + 4, 0, true);
          dv.setUint32(p + 6, 0, true); dv.setUint32(p + 10, e.offset, true); p += 14;
        }
        buf.set(e.name, p); p += e.name.length;
      };
      for (i = 0; i < entries.length; i++) {
        entries[i].offset = p;
        head(0x04034b50, entries[i], false);
        buf.set(entries[i].body, p); p += entries[i].body.length;
      }
      var cdStart = p;
      for (i = 0; i < entries.length; i++) head(0x02014b50, entries[i], true);
      dv.setUint32(p, 0x06054b50, true); dv.setUint16(p + 4, 0, true); dv.setUint16(p + 6, 0, true);
      dv.setUint16(p + 8, entries.length, true); dv.setUint16(p + 10, entries.length, true);
      dv.setUint32(p + 12, cdSize, true); dv.setUint32(p + 16, cdStart, true); dv.setUint16(p + 20, 0, true);
      return buf;
    };
    
    // file-saver 2.0.5 "download attribute" branch (Chromium): same anchor, MIME and timers.
    var xlsxSaveBlob = function (blob, name) {
      var U = window.URL || window.webkitURL;
      var a = document.createElement('a');
      name = name || blob.name || 'download';
      a.download = name;
      a.rel = 'noopener';
      a.href = U.createObjectURL(blob);
      setTimeout(function () { U.revokeObjectURL(a.href); }, 4E4);
      setTimeout(function () {
        try {
          a.dispatchEvent(new MouseEvent('click'));
        } catch (e) {
          var evt = document.createEvent('MouseEvents');
          evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
          a.dispatchEvent(evt);
        }
      }, 0);
    };
    
    // saveXlsx(data, "payments") == native exportXlsx() with filename "payments" -> "payments.xlsx".
    var saveXlsx = function (data, filename) {
      var exportData = data;
      // Same as native: only the first row's keys become columns; empty data throws a TypeError here.
      var fields = Object.keys(exportData[0]);
      // antd-table-saveas-excel style.ts default font.
      var fontName = /macintosh|mac os x/i.test(navigator.userAgent.toLowerCase()) ? 'PingFang SC' : 'Microsoft YaHei';
    
      // Style tables, filled in the order better-xlsx registers them (cols first, then cells row by row).
      var fontBase = '<sz val="12"/><name val="' + fontName + '"/>';
      var FONT_BODY = '<font>' + fontBase + '</font>';
      var FONT_HEAD = '<font>' + fontBase + '<color rgb="FF333333"/><b/></font>';
      var FILL_NONE = '<fill><patternFill patternType="none"><fgColor rgb="FFFFFFFF"/><bgColor rgb="00000000"/></patternFill></fill>';
      var FILL_GRAY = '<fill><patternFill patternType="lightGray"></patternFill></fill>';
      var FILL_HEAD = '<fill><patternFill patternType="solid"><fgColor rgb="FF88c849"/><bgColor rgb="ffffffff"/></patternFill></fill>';
      var side = function (color) {
        var s = '';
        ['left', 'right', 'top', 'bottom'].forEach(function (k) {
          s += '<' + k + ' style="' + (color ? 'thin' : 'none') + '">' + (color ? '<color rgb="' + color + '"/>' : '') + '</' + k + '>';
        });
        return '<border>' + s + '</border>';
      };
      var BORDER_NONE = side(null), BORDER_HEAD = side('FF000000');
      var fonts = [], fills = [], borders = [BORDER_NONE];
      var idx = function (list, item) {
        var i = list.indexOf(item);
        if (i < 0) { i = list.length; list.push(item); }
        return i;
      };
      // numFmtId keeps its JS type: better-xlsx compares ids with ===, so 0 (strings) and '0' (numbers)
      // become two identical-looking xfs; the "#type" suffix keeps that split.
      var xfXml = function (fo, fi, bo, h, v, wrap, fmt) {
        return '<xf applyAlignment="0" applyBorder="0" applyFont="0" applyFill="0" applyNumberFormat="' + (fmt > 0 ? 1 : 0) +
          '" applyProtection="0" borderId="' + bo + '" fillId="' + fi + '" fontId="' + fo + '" numFmtId="' + fmt +
          '"><alignment horizontal="' + h + '" indent="0" shrinkToFit="0" textRotation="0" vertical="' + v +
          '" wrapText="' + (wrap ? 1 : 0) + '"/></xf>#' + typeof fmt;
      };
      var xfs = [xfXml(0, 0, 0, 'general', 'bottom', false, 0)]; // cellXfs[0] = default Xxf
      var xf = function (font, fill, border, h, v, wrap, fmt) {
        var fo = idx(fonts, font), fi = idx(fills, fill);
        idx(fills, FILL_GRAY); // better-xlsx style.js "HACK" grey fill after every style
        return idx(xfs, xfXml(fo, fi, idx(borders, border), h, v, wrap, fmt));
      };
    
      // Shared strings (reftable.js keeps a plain object, quirks included).
      var strings = [], known = {};
      var addString = function (s) {
        if (known[s] === undefined) { known[s] = strings.length; strings.push(s); }
        return known[s];
      };
    
      var ROW_HT = 1 * 28.3464567; // setHeightCM(1): header and every data row
      var rows = [];
      var maxCell = 0;
      var cell = function (r, c, value, styleId) {
        var ref = xlsxColName(c) + (r + 1), kind, tag, out;
        if (c > maxCell) maxCell = c;
        // better-xlsx cell.js value setter, with kind-of 6 type detection.
        if (value === undefined || value === null) { value = ''; kind = 'string'; }
        else {
          kind = typeof value;
          if (kind === 'object' && !Array.isArray(value) &&
            (value instanceof Date || (typeof value.toDateString === 'function' && typeof value.getDate === 'function' && typeof value.setDate === 'function'))) kind = 'date';
          else if (kind !== 'string' && kind !== 'number' && kind !== 'boolean') {
            tag = Object.prototype.toString.call(value);
            kind = tag === '[object Number]' ? 'number' : tag === '[object String]' ? 'string' : tag === '[object Boolean]' ? 'boolean' : 'other';
          }
          if (kind === 'other') { value = value.toString(); kind = 'string'; }
        }
        if (kind === 'string') {
          out = '<c r="' + ref + '" t="s" s="' + styleId(0) + '"';
          return value ? out + '><v>' + String(addString(value)) + '</v></c>' : out + '/>';
        }
        if (kind === 'boolean') return '<c r="' + ref + '" t="b" s="' + styleId(0) + '"><v>' + (value ? 1 : 0) + '</v></c>';
        if (kind === 'number') return '<c r="' + ref + '" s="' + styleId('0') + '"><v>' + String(value) + '</v></c>';
        return '<c r="' + ref + '" s="' + styleId('164') + '"><v>' + String(value.getTime() / 1000 / 86400.0 + 25569.0) + '</v></c>';
      };
    
      // Columns: width px2cm(150) = 20, left aligned.
      var colsXml = '';
      fields.forEach(function (f, i) {
        var s = xf(FONT_BODY, FILL_NONE, BORDER_NONE, 'left', 'bottom', false, 0);
        colsXml += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" hidden="0" width="20" customWidth="1" collapsed="0" outlineLevel="0" style="' + s + '"/>';
      });
      var headStyle = function () { return xf(FONT_HEAD, FILL_HEAD, BORDER_HEAD, 'left', 'center', true, 0); };
      var bodyStyle = function (fmt) { return xf(FONT_BODY, FILL_NONE, BORDER_NONE, 'general', 'bottom', true, fmt); };
      // No header row when the first row has no keys (getColumnsMaxDepth([]) is -Infinity).
      if (fields.length) rows.push(fields.map(function (f, c) { return cell(0, c, f, headStyle); }).join(''));
      exportData.forEach(function (item) {
        var r = rows.length;
        rows.push(fields.map(function (f, c) { return cell(r, c, item[f], bodyStyle); }).join(''));
      });
    
      var sheetData = rows.map(function (cells, r) {
        var open = '<row r="' + (r + 1) + '" customHeight="1" ht="' + ROW_HT + '" outlineLevel="0"';
        return cells ? open + '>' + cells + '</row>' : open + '/>';
      }).join('');
      var dim = 'A1:' + xlsxColName(maxCell) + (rows.length ? rows.length : 1);
      if (dim === 'A1:A1') dim = 'A1';
      var sheet = XLSX_XML + '<worksheet xmlns="' + XLSX_SS_NS + '" xmlns:r="' + XLSX_DOC_REL + '">' +
        '<sheetPr filterMode="0"><pageSetUpPr fitToPage="0"/></sheetPr><dimension ref="' + dim + '"/>' +
        '<sheetViews><sheetView colorId="64" defaultGridColor="1" rightToLeft="0" showFormulas="0" showGridLines="1" showOutlineSymbols="1" showRowColHeaders="1" showZeros="1" tabSelected="1" topLeftCell="A1" view="normal" windowProtection="0" workbookViewId="0" zoomScale="100" zoomScaleNormal="100" zoomScalePageLayoutView="100"><selection activeCell="A1" activeCellId="0" pane="topLeft" sqref="A1"/></sheetView></sheetViews>' +
        '<sheetFormatPr defaultRowHeight="12.85"/>' +
        (colsXml ? '<cols>' + colsXml + '</cols>' : '<cols/>') +
        (sheetData ? '<sheetData>' + sheetData + '</sheetData>' : '<sheetData/>') +
        '<printOptions gridLines="0" gridLinesSet="1" headings="0" horizontalCentered="0" verticalCentered="0"/>' +
        '<pageMargins left="0.7875" right="0.7875" top="1.05277777777778" bottom="1.05277777777778" header="0.7875" footer="0.7875"/>' +
        '<pageSetup blackAndWhite="0" cellComments="none" copies="1" draft="0" firstPageNumber="1" fitToHeight="1" fitToWidth="1" horizontalDpi="300" orientation="portrait" pageOrder="downThenOver" paperSize="9" scale="100" useFirstPageNumber="1" usePrinterDefaults="0" verticalDpi="300"/>' +
        '<headerFooter><oddHeader>&amp;C&amp;"Times New Roman,Regular"&amp;12&amp;A</oddHeader><oddFooter>&amp;C&amp;"Times New Roman,Regular"&amp;12Page &amp;P</oddFooter></headerFooter></worksheet>';
    
      var sst = XLSX_XML + '<sst xmlns="' + XLSX_SS_NS + '"' + (strings.length ? '>' + strings.map(function (s) {
        return '<si><t>' + (typeof s === 'string' ? xlsxEsc(s) : s.toString()) + '</t></si>';
      }).join('') + '</sst>' : '/>');
    
      var list = function (tag, items) { return items.length ? '<' + tag + ' count="' + items.length + '">' + items.join('') + '</' + tag + '>' : ''; };
      var styles = XLSX_XML + '<styleSheet xmlns="' + XLSX_SS_NS + '">' +
        '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>' + list('fonts', fonts) + list('fills', fills) +
        list('borders', borders) + list('cellXfs', xfs.map(function (x) { return x.split('#')[0]; })) + '</styleSheet>';
    
      var zip = xlsxZip([
        ['xl/worksheets/sheet1.xml', sheet],
        ['xl/workbook.xml', XLSX_STATIC.workbook],
        ['_rels/.rels', XLSX_STATIC.rels],
        ['docProps/app.xml', XLSX_STATIC.app],
        ['docProps/core.xml', XLSX_STATIC.core],
        ['xl/theme/theme1.xml', XLSX_THEME],
        ['xl/sharedStrings.xml', sst],
        ['xl/_rels/workbook.xml.rels', XLSX_STATIC.wbRels],
        ['[Content_Types].xml', XLSX_STATIC.types],
        ['xl/styles.xml', styles]
      ]);
      // jszip generateAsync({type: 'blob'}) default mimeType.
      xlsxSaveBlob(new Blob([zip], { type: 'application/zip' }), filename + '.xlsx');
    };
    
    
    var Field = function (props) {
      return (
        <div style={{ marginBottom: 4 }}>
          <div className="cc-label">{props.label}</div>
          {props.children}
        </div>
      );
    };
    
    var ColumnPicker = function (props) {
      var content = (
        <div style={{ maxWidth: 220 }}>
          <A.Checkbox.Group
            value={props.value}
            onChange={function (v) { if (v.length) props.onChange(COLUMNS.filter(function (c) { return v.indexOf(c.key) >= 0; }).map(function (c) { return c.key; })); }}
          >
            {COLUMNS.map(function (c) {
              return <div key={c.key}><A.Checkbox value={c.key}>{c.title}</A.Checkbox></div>;
            })}
          </A.Checkbox.Group>
        </div>
      );
      return (
        <A.Popover overlayClassName="cc-std" content={content} title={'Columnas visibles'} trigger="click" placement="bottomRight">
          <A.Button className="msn97-columns cc-action">{'Columnas'}</A.Button>
        </A.Popover>
      );
    };
    
    // Ventana \u00abFiel copia\u00bb de una solicitud: copias registradas, reimpresion (solo cheques ejecutados), vista previa e impresion.
    var CopyModal = function (props) {
      var row = props.row;
      var ds = useState([]), docs = ds[0], setDocs = ds[1];
      var ls = useState(true), loading = ls[0], setLoading = ls[1];
      var bs = useState(false), busy = bs[0], setBusy = bs[1];
      var ps = useState(null), preview = ps[0], setPreview = ps[1];
      var frame = React.useRef(null);
      var urls = React.useRef([]);
      var canReprint = row.metodoCode === 'CH' && row.estadoRaw === 'EXECUTED';
    
      var show = function (bin, title) {
        var url = URL.createObjectURL(pdfBlob(bin));
        urls.current.push(url);
        setPreview({ url: url, title: title });
      };
      var load = function () {
        setLoading(true);
        return exe('RepoPaymentDocument', { operation: 'GET', filter: copiesFilter([row.id]), size: 0 }).then(function (r) {
          if (!r || !r.ok) fail(r);
          var list = (r.outData || []).slice().sort(function (a, b) { return a.id - b.id; });
          list = list.map(function (doc, i) { return Object.assign({}, doc, { n: i + 1 }); }).reverse();
          setDocs(list);
          setLoading(false);
          props.onCount(row.id, list.length);
        }).catch(function (e) {
          setLoading(false);
          A.message.error(e.message);
        });
      };
      useEffect(function () {
        load();
        return function () { urls.current.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) { } }); };
      }, []);
    
      var reprint = function () {
        setBusy(true);
        registerCopy(row, props.methodNames).then(function (res) {
          setBusy(false);
          A.message.success('Fiel copia N.\u00ba ' + res.copia + ' registrada como documento ' + (res.doc.id || '') + ' de la solicitud ' + row.id + '.');
          show(res.bin, res.fileName);
          load();
        }).catch(function (e) {
          setBusy(false);
          A.message.error(e.message);
        });
      };
      var view = function (doc) {
        exe('GetFile', { fileName: String(doc.url || '').replace(/^\//, '') }).then(function (r) {
          if (!r || !r.ok || !r.outData || !r.outData.base64) fail(r);
          show(atob(r.outData.base64), doc.fileName);
        }).catch(function (e) { A.message.error(e.message); });
      };
      var print = function () {
        try {
          var w = frame.current.contentWindow;
          w.focus();
          w.print();
        } catch (e) {
          window.open(preview.url, '_blank');
        }
      };
      var copyColumns = [
        { title: 'N.\u00ba', dataIndex: 'n', key: 'n', width: 56 },
        { title: 'Registrada', key: 'created', render: function (v, doc) { return moment.utc(doc.created).local().format('DD/MM/YYYY HH:mm:ss'); } },
        { title: 'Documento', dataIndex: 'id', key: 'id' },
        { title: 'Archivo', dataIndex: 'fileName', key: 'fileName' },
        { title: '', key: 'ver', render: function (v, doc) { return <a className="msn97-view-copy" onClick={function () { view(doc); }}>{'Ver'}</a>; } }
      ];
      var title = 'Fiel copia del cheque ' + (row.numero === null ? '(sin n\u00famero registrado)' : 'N.\u00ba ' + row.numero) + ' \u00b7 solicitud ' + row.id;
      return (
        <A.Modal className="msn97-copy cc-std" visible={true} width={920} footer={null} title={title} onCancel={props.onClose}>
          <div style={{ marginBottom: 8 }}>{row.beneficiario + ' \u00b7 ' + row.moneda + ' ' + fmtMoney(row.monto) + ' \u00b7 ' + row.estado}</div>
          {canReprint ? (
            <A.Alert type="info" showIcon style={{ marginBottom: 8 }} message={'La copia sale con la marca de agua \u00abFIEL COPIA\u00bb y queda registrada como documento de la solicitud ' + row.id + ', con su usuario, la fecha y la hora.'} />
          ) : (
            <A.Alert type="warning" showIcon style={{ marginBottom: 8 }} message={'S\u00f3lo se reimprimen cheques de solicitudes ejecutadas. Esta solicitud est\u00e1 ' + String(row.estado).toLowerCase() + ': abajo est\u00e1n las copias registradas antes.'} />
          )}
          <A.Space style={{ marginBottom: 8 }}>
            {canReprint ? <A.Button type="primary" className="msn97-reprint-go" loading={busy} onClick={reprint}>{'Generar fiel copia'}</A.Button> : null}
            {preview ? <A.Button className="msn97-print" onClick={print}>{'Imprimir'}</A.Button> : null}
            {preview ? <A.Button className="msn97-open" onClick={function () { window.open(preview.url, '_blank'); }}>{'Abrir en otra pesta\u00f1a'}</A.Button> : null}
          </A.Space>
          <A.Table className="msn97-copies" size="small" rowKey="id" loading={loading} dataSource={docs} columns={copyColumns} pagination={false} locale={{ emptyText: 'Sin copias registradas' }} />
          {preview ? <iframe className="msn97-preview" ref={frame} title={preview.title} src={preview.url} style={{ width: '100%', height: 560, border: '1px solid #f0f0f0', marginTop: 8 }} /> : null}
        </A.Modal>
      );
    };
    
    var rowPaymentLabel = function (row) {
      return (row.metodoCode === 'CH' ? 'cheque' : 'transferencia') + (row.numero === null ? ' sin n\u00famero' : ' N.\u00ba ' + row.numero);
    };
    var dateTime = function (d) { return d ? moment.utc(d).local().format('DD/MM/YYYY HH:mm:ss') : '-'; };
    // MSN-000099 (punto 3): aviso de una anulada sin la reversa del asiento, con lo que paso y como completarla desde \u00abDetalle\u00bb.
    var pendingHelp = function (id, res) {
      var m = res.entry.id;
      return (
        <div className="msn99-annul-pending-help">
          <p>{'El pago qued\u00f3 reversado, pero el asiento contable ' + m + ' no se pudo revertir. Tesorer\u00eda y contabilidad difieren hasta revertirlo.'}</p>
          <p>{'Para completarlo:'}</p>
          <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li>{'En el filtro Estado elija \u00abReversada\u00bb y pulse \u00abBuscar\u00bb (puede poner ' + id + ' en N\u00famero de solicitud).'}</li>
            <li>{'En la fila de la solicitud ' + id + ', columna Reversi\u00f3n, pulse \u00abDetalle\u00bb.'}</li>
            <li>{'Pulse \u00abRevertir asiento ' + m + '\u00bb y confirme.'}</li>
          </ol>
        </div>
      );
    };
    var unknownHelp = function (id, res) {
      return (
        <div className="msn99-annul-unknown-help">
          <p>{'La operaci\u00f3n no respondi\u00f3 como se esperaba y no se pudo confirmar en qu\u00e9 estado qued\u00f3 la solicitud. Puede haber quedado reversada.'}</p>
          <p>{'Antes de volver a intentarlo, b\u00fasquela con el filtro Estado = \u00abReversada\u00bb (N\u00famero de solicitud ' + id + '): si aparece, abra \u00abDetalle\u00bb y, si el asiento del pago figura sin revertir, pulse \u00abRevertir asiento\u00bb. Si sigue en \u00abEjecutada\u00bb, puede reversarla de nuevo.'}</p>
        </div>
      );
    };

    // Ventana \u00abReversar\u00bb: relectura previa, causa y subcausa del catalogo nativo, confirmacion y ejecucion.
    var AnnulModal = function (props) {
      var row = props.row;
      var cs = useState(null), ctx = cs[0], setCtx = cs[1];
      var es = useState(null), error = es[0], setError = es[1];
      var cas = useState([]), causes = cas[0], setCauses = cas[1];
      var sbs = useState([]), subs = sbs[0], setSubs = sbs[1];
      var sls = useState(false), subsLoading = sls[0], setSubsLoading = sls[1];
      var fs = useState({ cause: undefined, sub: undefined }), form = fs[0], setForm = fs[1];
      var ts = useState(false), touched = ts[0], setTouched = ts[1];
      var bs = useState(false), busy = bs[0], setBusy = bs[1];
      var subSeq = React.useRef(0);
    
      useEffect(function () {
        Promise.all([loadAnnulContext(row.id), exe('RepoTransferReversalCause', { operation: 'GET' })]).then(function (res) {
          if (!res[1] || !res[1].ok) fail(res[1]);
          setCauses(res[1].outData || []);
          setCtx(res[0]);
        }).catch(function (e) { setError(e.message); });
      }, []);
    
      var pickCause = function (code) {
        var my = ++subSeq.current;
        setForm({ cause: code, sub: undefined });
        setSubs([]);
        if (!code) return;
        setSubsLoading(true);
        exe('RepoTransferReversalSubcause', { operation: 'GET', filter: "causeCode = '" + sqlText(code) + "'" }).then(function (r) {
          if (my !== subSeq.current) return;
          setSubsLoading(false);
          if (!r || !r.ok) fail(r);
          setSubs((r.outData || []).slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }));
        }).catch(function (e) {
          if (my !== subSeq.current) return;
          setSubsLoading(false);
          A.message.error(e.message);
        });
      };
      var cause = causes.filter(function (c) { return c.code === form.cause; })[0] || null;
      var sub = subs.filter(function (s) { return s.code === form.sub; })[0] || null;
      var causeMissing = !cause;
      var subMissing = !!cause && (subsLoading || (subs.length > 0 && !sub));
      var ready = !!ctx && !ctx.problems.length;
    
      var execute = function () {
        setBusy(true);
        // otra relectura justo antes de escribir: el estado pudo cambiar mientras la ventana estaba abierta
        return loadAnnulContext(row.id).then(function (fresh) {
          if (fresh.problems.length) { setCtx(fresh); throw new Error('No se revers\u00f3: ' + fresh.problems[0]); }
          if (fresh.transfer.id !== ctx.transfer.id || (fresh.entry ? fresh.entry.id : null) !== (ctx.entry ? ctx.entry.id : null)) {
            setCtx(fresh);
            throw new Error('La solicitud cambi\u00f3 mientras la ventana estaba abierta: revise los datos y vuelva a confirmar.');
          }
          return annulPayment(fresh, cause, sub);
        }).then(function (res) {
          setBusy(false);
          props.onDone(row, res);
        }).catch(function (e) {
          setBusy(false);
          A.message.error(e.message, 8);
        });
      };
      var confirm = function () {
        setTouched(true);
        if (!ready || causeMissing || subMissing) return;
        A.Modal.confirm({
          title: '\u00bfReversar la solicitud ' + row.id + '?',
          content: 'Se revierte la transferencia de pago ' + ctx.transfer.id + ' (' + row.moneda + ' ' + fmtMoney(row.monto) + ')' +
            (ctx.entry ? ' y el asiento contable ' + ctx.entry.id : '') + ', con la causa ' + cause.code + ' - ' + cause.name +
            (sub ? ' / ' + sub.code + ' - ' + sub.name : '') + '. La solicitud queda Reversada.',
          okText: 'S\u00ed, reversar',
          okType: 'danger',
          cancelText: 'No',
          onOk: function () { return execute(); }
        });
      };
      var err = function (show, text) { return show ? <div className="msn97-annul-err" style={{ color: '#ff4d4f', fontSize: 12 }}>{text}</div> : null; };
      return (
        <A.Modal className="msn97-annul-modal cc-std" visible={true} width={720} maskClosable={false} title={'Reversar ' + rowPaymentLabel(row) + ' \u00b7 solicitud ' + row.id}
          onCancel={function () { if (!busy) props.onClose(); }}
          footer={[
            <A.Button key="cancel" className="msn97-annul-cancel" disabled={busy} onClick={props.onClose}>{'Cancelar'}</A.Button>,
            ready ? <A.Button key="go" className="msn97-annul-go" type="primary" danger={true} loading={busy} onClick={confirm}>{'Reversar'}</A.Button> : null
          ]}>
          <div style={{ marginBottom: 8 }}>{row.beneficiario + ' \u00b7 ' + row.moneda + ' ' + fmtMoney(row.monto) + ' \u00b7 ' + row.metodo + ' \u00b7 ' + row.estado}</div>
          {error ? <A.Alert className="msn97-annul-error" type="error" showIcon message={error} /> : null}
          {!ctx && !error ? <div style={{ textAlign: 'center', padding: 16 }}><A.Spin /></div> : null}
          {ctx && ctx.problems.length ? (
            <A.Alert className="msn97-annul-blocked" type="warning" showIcon message={'No se puede reversar esta solicitud'}
              description={<div>{ctx.problems.map(function (m, i) { return <div key={i}>{m}</div>; })}</div>} />
          ) : null}
          {ready ? (
            <div>
              <A.Alert className="msn97-annul-plan" type="info" showIcon style={{ marginBottom: 12 }} message={'Qu\u00e9 ocurre al reversar'} description={
                <div>
                  <div>{'1. Se revierte el pago (transferencia de pago ' + ctx.transfer.id + '): la solicitud pasa a Reversada y el monto vuelve a la reserva del siniestro ' + ctx.p.claimId + '. No se borra nada.'}</div>
                  <div>{ctx.entry ? '2. Se registra el asiento inverso del asiento contable ' + ctx.entry.id + (ctx.entry.reference ? ' (' + ctx.entry.reference + ')' : '') + ', con fecha de hoy.' : '2. El pago no tiene asiento contable que revertir.'}</div>
                </div>} />
              <Field label={'Causa'}>
                <A.Select className="msn97-annul-cause" style={{ width: '100%' }} placeholder={'Seleccione la causa'} value={form.cause} onChange={pickCause} disabled={busy}>
                  {causes.map(function (c) { return <A.Select.Option key={c.code} value={c.code}>{c.code + ' - ' + c.name}</A.Select.Option>; })}
                </A.Select>
                {err(touched && causeMissing, 'Seleccione la causa.')}
              </Field>
              <Field label={'Subcausa'}>
                <A.Select className="msn97-annul-sub" style={{ width: '100%' }} placeholder={cause ? 'Seleccione la subcausa' : 'Primero la causa'} value={form.sub}
                  disabled={!cause || busy} loading={subsLoading} showSearch={true} optionFilterProp="children"
                  onChange={function (v) { setForm({ cause: form.cause, sub: v }); }}>
                  {subs.map(function (s) { return <A.Select.Option key={s.code} value={s.code}>{s.code + ' - ' + s.name}</A.Select.Option>; })}
                </A.Select>
                {err(touched && subMissing && !subsLoading, 'Seleccione la subcausa.')}
              </Field>
              <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>{'Queda registrado qui\u00e9n revers\u00f3 la solicitud, cu\u00e1ndo y con qu\u00e9 causa.'}</div>
            </div>
          ) : null}
        </A.Modal>
      );
    };
    
    // Detalle de una solicitud anulada: el historial que dejaron los comandos nativos y, si el asiento del pago quedo sin
    // revertir (la reversa fallo despues de la anulacion), la reversa pendiente.
    var AnnulDetail = function (props) {
      var row = props.row;
      var hs = useState(null), h = hs[0], setH = hs[1];
      var es = useState(null), error = es[0], setError = es[1];
      var bs = useState(false), busy = bs[0], setBusy = bs[1];
      var load = function () {
        setError(null);
        loadAnnulHistory(row.id).then(function (x) { setH(x); }).catch(function (e) { setError(e.message); });
      };
      useEffect(function () { load(); }, []);
      var member = h ? isMember(h.user) : false;
      var reverted = !!(h && h.p && h.p.entityState === 'REVERTED');
      var pending = reverted ? h.entries.pending : [];
      // Tras un error de ReverseTransaction se relee el asiento: la respuesta pudo perderse con la reversa ya hecha.
      var afterReverseFail = function (entry, why) {
        return loadEntries(row.id).then(function (entries) {
          var rev = reversalOf(entries, entry);
          setBusy(false);
          if (rev) {
            A.message.success('Asiento ' + entry.id + ' revertido' + (rev.id ? ' con el asiento ' + rev.id : '') + '.', 8);
            if (props.onChanged) props.onChanged();
          } else {
            if (window.console) console.error('Revertir asiento ' + entry.id + ':', why);
            A.message.error('No se pudo revertir el asiento ' + entry.id + '. Sigue sin revertir: puede intentarlo de nuevo.', 10);
          }
          load();
        }, function (e) {
          setBusy(false);
          if (window.console) console.error('Revertir asiento ' + entry.id + ':', why, errText(e));
          A.message.error('No se pudo confirmar si el asiento ' + entry.id + ' qued\u00f3 revertido: vuelva a abrir este detalle antes de reintentar.', 10);
        });
      };
      var reverse = function () {
        var entry = pending[0];
        A.Modal.confirm({
          title: '\u00bfRevertir el asiento ' + entry.id + '?',
          content: 'La solicitud ' + row.id + ' ya est\u00e1 reversada. Se registra el asiento inverso del pago con fecha de hoy para que tesorer\u00eda y contabilidad queden iguales.',
          okText: 'S\u00ed, revertir',
          okType: 'danger',
          cancelText: 'No',
          onOk: function () {
            setBusy(true);
            // MSN-000099 (punto 4): grupo, solicitud, asiento y mes contable se vuelven a validar justo antes de escribir
            return checkReverse(row.id, entry).then(function (chk) {
              if (chk.problems.length) {
                setBusy(false);
                setH(chk.h);
                A.Modal.warning({
                  className: 'msn99-reverse-blocked',
                  title: 'No se revirti\u00f3 el asiento ' + entry.id,
                  content: <div>{chk.problems.map(function (m, i) { return <div key={i}>{m}</div>; })}</div>
                });
                return;
              }
              return exe('ReverseTransaction', { transactionId: entry.id, notes: reverseNotes(row.id, chk.h.transfer ? chk.h.transfer.id : null) }).then(function (r) {
                if (!r || !r.ok) return afterReverseFail(entry, errText(r));
                setBusy(false);
                A.message.success('Asiento ' + entry.id + ' revertido.', 8);
                load();
                if (props.onChanged) props.onChanged();
              }, function (e) { return afterReverseFail(entry, errText(e)); });
            }).catch(function (e) {
              setBusy(false);
              A.message.error('No se revirti\u00f3 el asiento ' + entry.id + ': ' + errText(e), 8);
            });
          }
        });
      };
      var items = [];
      if (h) {
        var t = h.transfer, rq = h.reversalRequest;
        items.push(['Estado de la solicitud', h.p ? stateOf(h.p.entityState).label : '-']);
        items.push(['Reversada el', t ? dateTime(t.reversalDate) : '-']);
        items.push(['Reversada por', rq && rq.user ? rq.user : 'no disponible']);
        items.push(['Causa', t && t.reversalCause ? t.reversalCause + (h.cause ? ' - ' + h.cause.name : '') : '-']);
        items.push(['Subcausa', t && t.reversalSubcause ? t.reversalSubcause + (h.sub ? ' - ' + h.sub.name : '') : '-']);
        items.push(['Transferencia de pago', t ? t.id + ' \u00b7 ' + (t.status === 2 ? 'revertida' : t.status === 1 ? 'ejecutada' : 'estado ' + t.status) + ' \u00b7 ' + t.currency + ' ' + fmtMoney(t.amount) + ' \u00b7 pagada el ' + dateTime(t.date) : '-']);
        items.push(['Solicitud de reversa', rq ? <span>{<a href={'#/payments/' + rq.id}>{rq.id}</a>}{' \u00b7 ' + rq.currency + ' ' + fmtMoney(rq.total) + ' \u00b7 ' + dateTime(rq.date)}</span> : 'no encontrada']);
        items.push(['Asiento contable del pago', h.entries.originals.length ? (
          <div>{h.entries.originals.map(function (x) {
            var e = x.entry, rv = x.reversal;
            return <div key={e.id}>{'Asiento ' + e.id + ' del ' + dateTime(e.date) + (e.reference ? ' (' + e.reference + ')' : '') + (rv ? ' \u2192 revertido por el asiento ' + rv.id + ' del ' + dateTime(rv.date) + (rv.user ? ' (' + rv.user + ')' : '') : e.status === 1 ? ' \u2192 sin revertir' : ' \u2192 no contabilizado')}</div>;
          })}</div>) : 'El pago no tiene asiento contable.']);
      }
      return (
        <A.Modal className="msn97-annul-detail-modal cc-std" visible={true} width={820} footer={null} title={'Reversi\u00f3n de la solicitud ' + row.id + ' \u00b7 ' + rowPaymentLabel(row)} onCancel={props.onClose}>
          <div style={{ marginBottom: 8 }}>{row.beneficiario + ' \u00b7 ' + row.moneda + ' ' + fmtMoney(row.monto) + ' \u00b7 ' + row.metodo}</div>
          {error ? <A.Alert type="error" showIcon message={error} /> : null}
          {!h && !error ? <div style={{ textAlign: 'center', padding: 16 }}><A.Spin /></div> : null}
          {pending.length ? (
            <A.Alert className="msn97-annul-pending" type="warning" showIcon style={{ marginBottom: 8 }}
              message={'Asiento del pago sin revertir: tesorer\u00eda y contabilidad difieren'}
              description={pending.length > 1 ? 'El pago tiene ' + pending.length + ' asientos sin revertir (' + pending.map(function (e) { return e.id; }).join(', ') + '): rev\u00edselos en Contabilidad.' :
                (member ? 'La reversa del asiento ' + pending[0].id + ' no qued\u00f3 registrada. Puede registrarla aqu\u00ed.' : 'La reversa del asiento ' + pending[0].id + ' no qued\u00f3 registrada. ' + notMemberText())} />
          ) : null}
          {pending.length === 1 && member ? (
            <A.Button className="msn97-annul-reverse" danger={true} loading={busy} style={{ marginBottom: 8 }} onClick={reverse}>{'Revertir asiento ' + pending[0].id}</A.Button>
          ) : null}
          {h ? (
            <A.Descriptions className="msn97-annul-history" bordered={true} size="small" column={1}>
              {items.map(function (it, i) { return <A.Descriptions.Item key={i} label={it[0]}>{it[1]}</A.Descriptions.Item>; })}
            </A.Descriptions>
          ) : null}
          {h ? <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>{'Nada se borra al reversar: la solicitud original, su pago, el pago inverso y los asientos quedan registrados con usuario y fecha.'}</div> : null}
        </A.Modal>
      );
    };
    
    // Estandar visual de las vistas (mismo que CLPagos, PG_CSS): encabezado con marca de acento, barra suave, grilla con borde.
    var CC_CSS = [
      ".cc-shell { --view-ink:#1e293b; --view-muted:#64748b; --view-line:#e2e8f0; --view-line-strong:#cbd5e1; --view-page:#f4f6fa; --view-brand:#1e4b8f; --view-brand-dark:#15356b; --view-good:#137a4c; --view-bad:#cf1322; }",
      ".cc-shell { width:100%; height:calc(100dvh - 72px); padding:4px; box-sizing:border-box; display:flex; flex-direction:column; background:var(--view-page); color:var(--view-ink); font:13px/1.45 -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif; }",
      ".cc-shell *, .cc-shell *::before, .cc-shell *::after { box-sizing:border-box; }",
      ".cc-card { flex:1 1 auto; display:flex; flex-direction:column; min-width:0; min-height:0; background:#fff; border:1px solid #aebdcd; border-radius:8px; box-shadow:0 1px 2px rgba(15,23,42,.04); overflow:hidden; }",
      ".cc-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:50px; padding:6px 8px; background:var(--view-page); border-bottom:2px solid var(--view-brand); }",
      ".cc-title { display:flex; align-items:center; gap:12px; color:var(--view-brand-dark); font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.3; }",
      ".cc-title-mark { width:6px; height:30px; flex:0 0 6px; border-radius:3px; background:var(--view-brand); }",
      ".cc-body { flex:1 1 auto; min-width:0; min-height:0; padding:4px; display:flex; flex-direction:column; }",
      ".cc-filters { flex:0 0 auto; margin:0 0 4px; padding:6px 8px 2px; border:1px solid var(--view-line); border-radius:8px; background:#fff; }",
      ".cc-label { margin-bottom:2px; color:var(--view-muted); font-size:12px; font-weight:500; }",
      ".cc-toolbar { flex:0 0 auto; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; min-height:32px; margin:0 0 2px; padding:4px; background:#eaf1fb; border:1px solid #c7d9f2; border-radius:8px; }",
      ".cc-toolbar-group { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }",
      ".cc-total { padding:0 4px; color:var(--view-brand-dark); font-size:12.5px; font-weight:600; }",
      ".cc-action.ant-btn { height:32px; padding:0 15px; border-radius:4px; font-size:14px; font-weight:500; box-shadow:none; background:#fff; border-color:#d9d9d9; color:#262626; }",
      ".cc-action.ant-btn:not([disabled]):hover, .cc-action.ant-btn:not([disabled]):focus { border-color:#1890ff; color:#1890ff; }",
      ".cc-action.ant-btn-primary { background:#1890ff; border-color:#1890ff; color:#fff; }",
      ".cc-action.ant-btn-primary:not([disabled]):hover, .cc-action.ant-btn-primary:not([disabled]):focus { background:#147bd1; border-color:#147bd1; color:#fff; }",
      ".cc-action.ant-btn[disabled], .cc-action.ant-btn[disabled]:hover { background:#f1f5f9; border-color:#aebdcd; color:#526174; opacity:1; }",
      ".cc-grid { flex:1 1 auto; min-width:0; min-height:0; overflow:hidden; border:1px solid #9aacc1; border-radius:8px; background:#fff; }",
      ".cc-shell .ant-table { width:100%; max-width:100%; color:#183153; font-size:12px; table-layout:fixed; }",
      ".cc-shell .ant-table-thead > tr > th { padding:5px 8px; background:#bfbfbf; color:#262626; border-bottom:1px solid #9aacc1; font-weight:700; white-space:nowrap; }",
      ".cc-shell .ant-table-tbody > tr > td { height:36px; padding:4px 8px; border-bottom:1px solid #c4d0de; vertical-align:middle; }",
      ".cc-shell .ant-table-tbody > tr:hover > td { background:#b7d7ff; }",
      ".cc-shell .ant-table-tbody > tr.ant-table-row-selected > td, .cc-shell .ant-table-tbody > tr.ant-table-row-selected:hover > td { background:#86b4ff; }",
      ".cc-grid .ant-table-body { overflow-y:scroll !important; overflow-x:hidden !important; }",
      ".cc-shell .ant-table-pagination { margin:6px 8px; padding-top:5px; border-top:1px solid #9aacc1; }",
      ".cc-ellipsis { display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle; }",
      // GLOB-1365 (punto 1): bordes visibles en checkbox e inputs, mismo estandar que CLMovimientosDeCuenta. El selector de
      // columnas (popover) y las ventanas se dibujan fuera de .cc-shell, por eso llevan su propia clase cc-std.
      ".cc-shell .ant-checkbox-inner, .cc-std .ant-checkbox-inner { border:1px solid #8c9db5; }",
      ".cc-shell .ant-checkbox-checked .ant-checkbox-inner, .cc-std .ant-checkbox-checked .ant-checkbox-inner { border-color:#1890ff; }",
      ".cc-shell .ant-checkbox-wrapper:hover .ant-checkbox-inner, .cc-shell .ant-checkbox:hover .ant-checkbox-inner, .cc-std .ant-checkbox-wrapper:hover .ant-checkbox-inner, .cc-std .ant-checkbox:hover .ant-checkbox-inner { border-color:var(--view-brand, #1e4b8f); }",
      ".cc-shell .ant-input, .cc-shell .ant-input-affix-wrapper, .cc-shell .ant-picker, .cc-shell .ant-calendar-picker-input, .cc-shell .ant-select:not(.ant-select-customize-input) .ant-select-selector, .cc-shell .ant-select-selection, .cc-std .ant-input, .cc-std .ant-input-affix-wrapper, .cc-std .ant-picker, .cc-std .ant-select:not(.ant-select-customize-input) .ant-select-selector, .cc-std .ant-select-selection { border:1px solid #aebdcd !important; border-radius:4px; }",
      ".cc-shell .ant-input-affix-wrapper .ant-input, .cc-std .ant-input-affix-wrapper .ant-input { border:none !important; }",
      ".cc-shell .ant-input:hover, .cc-shell .ant-input-affix-wrapper:hover, .cc-shell .ant-picker:hover, .cc-shell .ant-picker-focused, .cc-shell .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .cc-shell .ant-select-focused .ant-select-selector, .cc-shell .ant-select-selection:hover, .cc-std .ant-input:hover, .cc-std .ant-picker:hover, .cc-std .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .cc-std .ant-select-focused .ant-select-selector { border-color:#1e4b8f !important; }",
      ".cc-amount { font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }",
      ".cc-amount-pos { color:var(--view-good); }",
      ".cc-amount-neg { color:var(--view-bad); }",
      ".cc-amount-zero { color:var(--view-ink); font-weight:400; }",
      ".msn97-annul-detail-modal .ant-descriptions-view { overflow:hidden; }",
      ".msn97-annul-detail-modal .ant-descriptions-view > table { table-layout:fixed; width:100%; }",
      ".msn97-annul-detail-modal .ant-descriptions-item-label { width:170px; }",
      ".msn97-annul-detail-modal .ant-descriptions-item-content { white-space:normal; overflow-wrap:anywhere; word-break:break-word; }"
    ].join("\n");
    var amountClass = function (n) {
      var v = Number(n);
      if (!v) return 'cc-amount cc-amount-zero';
      return v > 0 ? 'cc-amount cc-amount-pos' : 'cc-amount cc-amount-neg';
    };

    var ChequesTransferencias = function () {
      var fs = useState(EMPTY_FILTER), form = fs[0], setForm = fs[1];
      var as = useState(EMPTY_FILTER), applied = as[0], setApplied = as[1];
      var ps = useState({ current: 1, pageSize: 20 }), pager = ps[0], setPager = ps[1];
      var rs = useState([]), rows = rs[0], setRows = rs[1];
      var ts = useState(0), total = ts[0], setTotal = ts[1];
      var ls = useState(false), loading = ls[0], setLoading = ls[1];
      var es = useState(false), exporting = es[0], setExporting = es[1];
      var vs = useState(DEFAULT_VISIBLE), visible = vs[0], setVisible = vs[1];
      var ms = useState(null), methodNames = ms[0], setMethodNames = ms[1];
      var mes = useState(null), methodsError = mes[0], setMethodsError = mes[1];
      var mls = useState(false), methodsLoading = mls[0], setMethodsLoading = mls[1];
      var cs = useState({}), copies = cs[0], setCopies = cs[1];
      var crs = useState(null), copyRow = crs[0], setCopyRow = crs[1];
      var us = useState(null), currentUser = us[0], setCurrentUser = us[1];
      var ars = useState(null), annulRow = ars[0], setAnnulRow = ars[1];
      var drs = useState(null), detailRow = drs[0], setDetailRow = drs[1];
      var ss = useState([]), selectedRowKeys = ss[0], setSelectedRowKeys = ss[1];
      var seq = React.useRef(0);
      var wanted = React.useRef({ filter: EMPTY_FILTER, size: 20 });
      var gridRef = React.useRef(null);
      var hs = useState(260), tableHeight = hs[0], setTableHeight = hs[1];

      useEffect(function () {
        var measure = function () {
          if (!gridRef.current) return;
          // Reserve the table header and pagination so both remain visible.
          var next = Math.max(160, gridRef.current.clientHeight - 94);
          setTableHeight(function (previous) { return Math.abs(previous - next) > 1 ? next : previous; });
        };
        measure();
        if (typeof ResizeObserver === 'undefined') {
          window.addEventListener('resize', measure);
          return function () { window.removeEventListener('resize', measure); };
        }
        var observer = new ResizeObserver(measure);
        observer.observe(gridRef.current);
        return function () { observer.disconnect(); };
      }, []);
    
      var set = function (k, v) { setForm(function (f) { var n = Object.assign({}, f); n[k] = v; return n; }); };
      var selectRow = function (row) { setSelectedRowKeys(row ? [row.id] : []); };
    
      var run = function (filter, page, size, names) {
        var my = ++seq.current;
        setLoading(true);
        query(filter, page - 1, size, names).then(function (res) {
          if (my !== seq.current) return;
          setRows(res.rows);
          setTotal(res.total || 0);
          setLoading(false);
          var cheques = res.rows.filter(function (x) { return x.metodoCode === 'CH'; }).map(function (x) { return x.id; });
          loadCopies(cheques).then(function (m) { if (my === seq.current) setCopies(m); }).catch(function () { });
        }).catch(function (e) {
          if (my !== seq.current) return;
          setLoading(false);
          A.message.error(e.message);
        });
      };
    
      // MSN-000099 (punto 1): catalogo de metodos de pago. Si su carga falla (error del servidor, red, respuesta inesperada) la
      // vista lo dice y ofrece \u00abReintentar\u00bb; sin catalogo no se busca, y \u00abBuscar\u00bb vuelve a intentar la carga con su filtro.
      var loadMethods = function () {
        setMethodsError(null);
        setMethodsLoading(true);
        Promise.resolve().then(function () {
          return exe('RepoPaymentMethodCatalog', { operation: 'GET' });
        }).then(function (r) {
          if (!r || !r.ok) fail(r);
          if (!Array.isArray(r.outData)) throw new Error('respuesta inesperada del cat\u00e1logo');
          var names = {};
          r.outData.forEach(function (m) { if (m && m.code) names[m.code] = m.name; });
          return names;
        }).then(function (names) {
          setMethodsLoading(false);
          setMethodNames(names);
          run(wanted.current.filter, 1, wanted.current.size, names);
        }, function (e) {
          setMethodsLoading(false);
          setMethodsError(errText(e));
        });
      };
    
      useEffect(function () {
        loadMethods();
        // permiso de anulacion: grupos del usuario actual (se vuelve a validar al abrir la ventana y al ejecutar)
        exe('GetCurrentUser', {}).then(function (r) { setCurrentUser(r && r.ok && r.outData ? r.outData : {}); }, function () { setCurrentUser({}); });
      }, []);
    
      var search = function () {
        setApplied(form);
        setPager({ current: 1, pageSize: pager.pageSize });
        if (!methodNames) {
          // sin catalogo no se busca: se reintenta su carga y la busqueda sale con este filtro
          wanted.current = { filter: form, size: pager.pageSize };
          if (!methodsLoading) loadMethods();
          return;
        }
        run(form, 1, pager.pageSize, methodNames);
      };
      var clear = function () {
        setForm(EMPTY_FILTER);
        setApplied(EMPTY_FILTER);
        setPager({ current: 1, pageSize: pager.pageSize });
        wanted.current = { filter: EMPTY_FILTER, size: pager.pageSize };
        if (methodNames) run(EMPTY_FILTER, 1, pager.pageSize, methodNames);
      };
      var onPage = function (current, pageSize) {
        var p = { current: pageSize !== pager.pageSize ? 1 : current, pageSize: pageSize };
        setPager(p);
        run(applied, p.current, p.pageSize, methodNames);
      };
    
      var doExport = function () {
        if (!total) { A.message.info('No hay registros para exportar con el filtro aplicado.'); return; }
        setExporting(true);
        query(applied, 0, 0, methodNames).then(function (res) {
          var cols = COLUMNS.filter(function (c) { return visible.indexOf(c.key) >= 0; });
          var data = res.rows.map(function (row) {
            var o = {};
            cols.forEach(function (c) { o[c.title] = excelValue(row, c.key); });
            return o;
          });
          setExporting(false);
          if (!data.length) { A.message.info('No hay registros para exportar con el filtro aplicado.'); return; }
          saveXlsx(data, 'cheques-y-transferencias-' + moment().format('YYYYMMDD-HHmm'));
          A.message.success(data.length + ' registros exportados.');
        }).catch(function (e) {
          setExporting(false);
          A.message.error(e.message);
        });
      };
    
      var allColumns = {
        numero: {
          width: 92,
          title: <A.Tooltip title={'Cheque: n\u00famero de cheque. Transferencia: n\u00famero de la transferencia de pago.'}><span>{'N.\u00ba cheque / transferencia'}</span></A.Tooltip>,
          key: 'numero', align: 'center',
          render: function (v, r) { return r.numero === null ? <span style={{ color: '#bfbfbf' }}>{'-'}</span> : <span title={r.numeroTipo}>{r.numero}</span>; }
        },
        fecha: {
          width: 96,
          title: <A.Tooltip title={'Fecha de pago (en las reversadas, la del pago que se revers\u00f3); si no tiene pago, fecha de la solicitud.'}><span>{'Fecha'}</span></A.Tooltip>,
          key: 'fecha', align: 'center',
          render: function (v, r) { return <span title={r.fechaTipo === 'pago' ? 'Fecha de pago' : 'Fecha de la solicitud'}>{fmtDate(r.fecha)}</span>; }
        },
        beneficiario: { title: 'Beneficiario', width: 250, dataIndex: 'beneficiario', key: 'beneficiario', render: function (v) { return <A.Tooltip title={v}><span className="cc-ellipsis">{v}</span></A.Tooltip>; } },
        monto: {
          title: 'Monto', width: 110, key: 'monto', align: 'right',
          render: function (v, r) { return <span className={amountClass(r.monto)}>{fmtMoney(r.monto)}</span>; }
        },
        moneda: { title: 'Moneda', width: 76, dataIndex: 'moneda', key: 'moneda', align: 'center' },
        metodo: { title: 'M\u00e9todo', width: 85, dataIndex: 'metodo', key: 'metodo', align: 'center', render: function (v) { return <A.Tooltip title={v}><span className="cc-ellipsis">{v}</span></A.Tooltip>; } },
        estado: {
          title: 'Estado', width: 120, key: 'estado', align: 'center',
          render: function (v, r) { return <A.Tag color={r.estadoColor} title={r.estadoRaw || ''}>{r.estado}</A.Tag>; }
        },
        solicitud: {
          title: 'Solicitud', width: 88, key: 'solicitud', align: 'center',
          render: function (v, r) { return <a href={'#/payments/' + r.id} title={'Abrir la solicitud en Money Out'}>{r.id}</a>; }
        },
        cuenta: { title: 'Cuenta origen', width: 170, dataIndex: 'cuenta', key: 'cuenta', render: function (v) { return <A.Tooltip title={v}><span className="cc-ellipsis">{v}</span></A.Tooltip>; } },
        referencia: { title: 'Referencia', width: 190, dataIndex: 'referencia', key: 'referencia', render: function (v) { return <A.Tooltip title={v}><span className="cc-ellipsis">{v}</span></A.Tooltip>; } }
      };
      // Columna fija (no entra al selector de columnas ni a la exportaci\u00f3n): reimpresi\u00f3n \u00abFiel copia\u00bb de los cheques.
      var copyColumn = {
        width: 85,
        title: <A.Tooltip title={'Cheques ejecutados: reimpresi\u00f3n con la marca de agua FIEL COPIA, registrada como documento de la solicitud. Entre par\u00e9ntesis, las copias ya registradas.'}><span>{'Fiel copia'}</span></A.Tooltip>,
        key: 'fielcopia',
        render: function (v, r) {
          var n = copies[r.id] || 0;
          if (r.metodoCode !== 'CH' || (r.estadoRaw !== 'EXECUTED' && !n)) return <span style={{ color: '#bfbfbf' }}>{'-'}</span>;
          var label = (r.estadoRaw === 'EXECUTED' ? 'Reimprimir' : 'Copias') + (n ? ' (' + n + ')' : '');
          return <A.Button className="msn97-reprint" size="small" onClick={function () { setCopyRow(r); }}>{label}</A.Button>;
        }
      };
      // Columna fija (no entra al selector de columnas ni a la exportaci\u00f3n): anulaci\u00f3n de los pagos de siniestro ejecutados y,
      // en las anuladas, fecha, causa y detalle de la anulaci\u00f3n.
      var annulColumn = {
        width: 150,
        title: <A.Tooltip title={'Pagos de siniestro ejecutados: reversi\u00f3n del pago y de su asiento contable, s\u00f3lo para los miembros del grupo ' + groupsLabel() + '. En las reversadas: fecha y causa de la reversi\u00f3n, y su detalle.'}><span>{'Reversi\u00f3n'}</span></A.Tooltip>,
        key: 'anulacion',
        render: function (v, r) {
          if (r.estadoRaw === 'REVERTED') {
            return (
              <span style={{ whiteSpace: 'nowrap' }}>
                <span className="msn97-annul-when">{(r.anuladaFecha ? fmtDate(r.anuladaFecha) : 'Reversada') + (r.causa ? ' \u00b7 ' + r.causa : '') + ' '}</span>
                <A.Button className="msn97-annul-detail" size="small" type="link" onClick={function () { setDetailRow(r); }}>{'Detalle'}</A.Button>
              </span>
            );
          }
          var a = r.annul || {};
          if (a.kind === 'OK') {
            var allowed = isMember(currentUser);
            var btn = <A.Button className="msn97-annul" size="small" danger={true} disabled={!allowed} onClick={function () { setAnnulRow(r); }}>{'Reversar'}</A.Button>;
            return allowed ? btn : <A.Tooltip title={currentUser ? notMemberText() : 'Validando su usuario...'}><span className="msn97-annul-locked">{btn}</span></A.Tooltip>;
          }
          if (a.kind === 'MANUAL' || a.kind === 'BLOCKED') {
            return <A.Tooltip title={a.help}><span className="msn97-annul-no" style={{ color: '#8c8c8c', whiteSpace: 'nowrap', cursor: 'help' }}>{a.text}</span></A.Tooltip>;
          }
          return <span style={{ color: '#bfbfbf' }}>{'-'}</span>;
        }
      };
      var tableColumns = COLUMNS.filter(function (c) { return visible.indexOf(c.key) >= 0; }).map(function (c) { return allColumns[c.key]; }).concat([copyColumn, annulColumn]);
      var setCount = function (id, n) { setCopies(function (m) { var o = Object.assign({}, m); o[id] = n; return o; }); };
      var refresh = function () { if (methodNames) run(applied, pager.current, pager.pageSize, methodNames); };
      var annulDone = function (row, res) {
        setAnnulRow(null);
        if (res.error || res.late || res.readError) { if (window.console) console.error('Reversar solicitud ' + row.id + ':', res.error || res.late, res.readError || res.unsure || ''); }
        var head = 'Solicitud ' + row.id + ' reversada';
        if (res.kind === 'PENDING') {
          A.Modal.warning({ className: 'msn99-annul-pending', width: 620, title: 'Solicitud ' + row.id + ' reversada; falta revertir el asiento ' + res.entry.id, content: pendingHelp(row.id, res) });
        } else if (res.kind === 'UNKNOWN') {
          A.Modal.warning({ className: 'msn99-annul-unknown', width: 620, title: 'No se pudo confirmar si la solicitud ' + row.id + ' qued\u00f3 reversada', content: unknownHelp(row.id, res) });
        } else {
          var late = '';
          if (res.entry) A.message.success(head + '; asiento ' + res.entry.id + ' revertido' + (res.reversal && res.reversal.id ? ' con el asiento ' + res.reversal.id : '') + '.' + late, late ? 12 : 8);
          else A.message.success(head + '; el pago no ten\u00eda asiento contable que revertir.' + late, late ? 12 : 8);
        }
        refresh();
      };
    
      return (
        <div className="msn97-view cc-shell">
          <style>{CC_CSS}</style>
          <div className="cc-card">
          <div className="cc-head">
            <div className="cc-title"><span className="cc-title-mark" aria-hidden="true" />{'Consulta de cheques y transferencias emitidos'}</div>
          </div>
          <div className="cc-body">
          <div className="cc-filters">
            <A.Row gutter={[12, 4]}>
              <A.Col xs={24} md={8}>
                <Field label={'Rango de fechas'}>
                  <A.DatePicker.RangePicker className="msn97-dates" style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={['Desde', 'Hasta']} value={form.dates} onChange={function (v) { set('dates', v); }} />
                </Field>
              </A.Col>
              <A.Col xs={12} md={4}>
                <Field label={'N.\u00ba cheque / transferencia'}>
                  <A.Input className="msn97-check" value={form.checkNum} allowClear onChange={function (e) { set('checkNum', e.target.value); }} onPressEnter={search} />
                </Field>
              </A.Col>
              <A.Col xs={12} md={6}>
                <Field label={'Beneficiario'}>
                  <A.Input className="msn97-beneficiary" value={form.beneficiary} allowClear onChange={function (e) { set('beneficiary', e.target.value); }} onPressEnter={search} />
                </Field>
              </A.Col>
              <A.Col xs={12} md={6}>
                <Field label={'M\u00e9todo'}>
                  <A.Select className="msn97-methods" mode="multiple" allowClear style={{ width: '100%' }} placeholder={'Cheque y transferencia'} value={form.methods} onChange={function (v) { set('methods', v); }}>
                    {METHOD_GROUPS.map(function (g) { return <A.Select.Option key={g.key} value={g.key}>{g.label}</A.Select.Option>; })}
                  </A.Select>
                </Field>
              </A.Col>
              <A.Col xs={24} md={8}>
                <Field label={<A.Tooltip title={'Ejecutada: solicitudes ejecutadas (ya impresas y pagadas). Reversada: solicitudes que se ejecutaron y despu\u00e9s se reversaron. Ver Todos: ejecutadas y reversadas. Las pendientes no aparecen.'}><span>{'Estado'}</span></A.Tooltip>}>
                  <A.Select className="msn97-status" style={{ width: '100%' }} value={form.status} onChange={function (v) { set('status', v); }}>
                    {STATUS_OPTIONS.map(function (s) { return <A.Select.Option key={s.key} value={s.key}>{s.label}</A.Select.Option>; })}
                  </A.Select>
                </Field>
              </A.Col>
              <A.Col xs={12} md={4}>
                <Field label={'N\u00famero de solicitud'}>
                  <A.Input className="msn97-request" value={form.requestId} allowClear onChange={function (e) { set('requestId', e.target.value); }} onPressEnter={search} />
                </Field>
              </A.Col>
              <A.Col xs={24} md={12} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <A.Space style={{ marginBottom: 4 }}>
                  <A.Button className="msn97-clear cc-action" onClick={clear}>{'Limpiar'}</A.Button>
                  <A.Button className="msn97-search cc-action" type="primary" onClick={search} loading={loading || methodsLoading}>{'Buscar'}</A.Button>
                </A.Space>
              </A.Col>
            </A.Row>
          </div>
          {methodsError ? (
            <A.Alert className="msn99-methods-error" type="error" showIcon style={{ marginBottom: 4 }}
              message={'No se pudieron cargar los m\u00e9todos de pago: ' + methodsError}
              description={'Sin ellos la vista no puede buscar. Pulse \u00abReintentar\u00bb (o \u00abBuscar\u00bb); si el error sigue, avise al administrador del sistema.'}
              action={<A.Button className="msn99-methods-retry" size="small" type="primary" onClick={function () { loadMethods(); }}>{'Reintentar'}</A.Button>} />
          ) : null}
          <div className="cc-toolbar">
            <span className="msn97-total cc-total">{total + ' registros'}</span>
            <div className="cc-toolbar-group">
              <ColumnPicker value={visible} onChange={setVisible} />
              <A.Button className="msn97-export cc-action" onClick={doExport} loading={exporting} disabled={!total}>{'Exportar a Excel'}</A.Button>
            </div>
          </div>
          <div className="cc-grid" ref={gridRef}>
          <A.Table
            className="msn97-table"
            rowKey="id"
            size="small"
            loading={loading || methodsLoading}
            columns={tableColumns}
            dataSource={rows}
            rowSelection={{ type: 'radio', selectedRowKeys: selectedRowKeys, onChange: function (keys, selected) { selectRow(selected && selected.length ? selected[selected.length - 1] : null); } }}
            onRow={function (record) { return { onClick: function () { selectRow(record); } }; }}
            scroll={{ y: tableHeight }}
            pagination={{ current: pager.current, pageSize: pager.pageSize, total: total, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], onChange: onPage, showTotal: function (t) { return t + ' registros'; } }}
          />
          </div>
          </div>
          </div>
          {copyRow ? <CopyModal key={copyRow.id} row={copyRow} methodNames={methodNames} onCount={setCount} onClose={function () { setCopyRow(null); }} /> : null}
          {annulRow ? <AnnulModal key={'a' + annulRow.id} row={annulRow} onDone={annulDone} onClose={function () { setAnnulRow(null); }} /> : null}
          {detailRow ? <AnnulDetail key={'d' + detailRow.id} row={detailRow} onChanged={refresh} onClose={function () { setDetailRow(null); }} /> : null}
        </div>
      );
    };
    
    return ChequesTransferencias;
    })()
    
