/* ============================================================
   Tesorería · "Girar sin recalcular: retenciones y detracciones las hace el sistema"
   ============================================================ */
(function () {
  const T = SIGA.data.tesoreria;
  const spotPct = s => (T.spot.find(x => x[0] === s) || [0, 0])[1];
  const ECLS = { Girado: 't-blue', Pagado: 't-green', Anulado: 't-red' };
  const CHCLS = { 'En cartera': 't-amber', Entregado: 't-blue', Cobrado: 't-green', Anulado: 't-gray' };
  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const mod = () => SIGA.modules.tesoreria;
  const cpRec = SIGA.recs.cp = {
    mod: 'Tesorería', tipo: 'Comprobante de pago', office: 'Oficina de Tesorería', key: r => r.doc, title: r => 'Comprobante de pago ' + r.doc, cls: false,
    fields: c => { const U = SIGA.ui; return [['Beneficiario', U.esc(c.benef), 1], ['RUC / DNI', c.ruc], ['Fecha de giro', c.fecha], ['Concepto', U.esc(c.concepto), 1], ['Medio de pago', c.medio + ' · ' + c.ref], ['Importe bruto', U.money(c.bruto)], ['Detracción (SPOT)', c.detr ? U.money(c.detr) + ' · ' + (c.spot || '') : '—'], ['Retención renta 4.ª', c.ret && !c.medio.startsWith('Abono masivo') ? U.money(c.ret) : '—'], ['Neto girado', `<b>${U.money(c.neto)}</b>`], ['Registró / Confirmó', (c.user || '—') + ' / ' + (c.aprob || '—')], ['Estado', U.tag(c.estado, ECLS[c.estado])], ...(c.cert ? [['Certificación', c.cert]] : []), ...(c.motivo ? [['Motivo de anulación', U.esc(c.motivo), 1]] : [])]; },
    body: c => `<div class="mf-note">${SIGA.ui.montoLetras(c.neto)}</div>` + SIGA.ui.timeline([{ t: 'Devengado', sub: 'Contabilidad · conformidad y comprobante', st: 'done' }, { t: 'Girado', sub: (c.user || 'K. Ramos') + ' · ' + c.fecha, st: c.estado === 'Anulado' ? 'bad' : 'done' }, { t: 'Pagado', sub: c.aprob ? c.aprob + ' · abono confirmado' : 'pendiente de confirmación del Tesorero', st: c.estado === 'Pagado' ? 'done' : c.estado === 'Anulado' ? 'bad' : 'cur' }]),
    edit: [{ k: 'concepto', label: 'Concepto' }, { k: 'medio', label: 'Medio de pago', type: 'select', options: ['Abono CCI', 'Cheque', 'Carta orden'], span: 1 }, { k: 'ref', label: 'Referencia (CCI / cheque)', span: 1 }],
    canEdit: c => c.estado === 'Girado',
    anular: true, anularLabel: 'Anular giro', canAnular: c => c.estado === 'Girado',
    onAnular: c => {
      SIGA.data.presupuesto.fases.gir -= c.bruto;
      SIGA.siaf('Anulación de girado', c.doc, -c.neto);
      const chq = T.cheques.find(h => c.ref === 'Cheque ' + h.num); if (chq) chq.estado = 'Anulado';
      const ob = SIGA.data.ctaper?.obligaciones.find(o => o.cp === c.doc); if (ob) { ob.estado = ob.dias < 0 ? 'Vencida' : 'Por pagar'; delete ob.cp; }
    },
    extra: c => [
      ...(c.estado === 'Girado' ? [{ icon: 'fa-circle-check', label: 'Confirmar pago', fn: x => mod().pagar(x) }] : []),
      ...(c.detr ? [{ icon: 'fa-receipt', label: 'Constancia de depósito de detracción', menuOnly: true, fn: x => mod().constancia(x, 'det') }] : []),
      ...(c.ret ? [{ icon: 'fa-file-invoice', label: 'Certificado de retención', menuOnly: true, fn: x => mod().constancia(x, 'ret') }] : []),
      { icon: 'fa-book', label: 'Ver asiento contable', menuOnly: true, fn: x => mod().voucher(x) }
    ],
    print: c => { const U = SIGA.ui; return { tipo: 'Comprobante de pago', num: c.doc, pairs: [['Beneficiario', U.esc(c.benef), 1], ['RUC / DNI', c.ruc], ['Fecha', c.fecha], ['Medio de pago', c.medio + ' · ' + c.ref], ['Estado', c.estado]],
      body: dtbl([['Concepto'], ['Importe', 1]], [[U.esc(c.concepto), U.money(c.bruto, '')], ['(−) Detracción SPOT' + (c.spot ? ' · ' + c.spot : ''), c.detr ? U.money(c.detr, '') : '—'], ['(−) Retención renta 4.ª categoría', c.ret ? U.money(c.ret, '') : '—'], ['<b>Neto pagado</b>', '<b>' + U.money(c.neto, '') + '</b>']]) + `<p class="mini">${U.montoLetras(c.neto)}</p>`,
      firmas: [['Giró', c.user || 'K. Ramos'], ['Tesorero', c.aprob || 'L. Vargas'], ['Recibí conforme', U.esc(c.benef.split(' · ')[0])]] }; },
    mailTo: c => c.ruc && c.ruc.length === 11 ? 'facturacion@' + c.benef.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '.com.pe' : ''
  };

  SIGA.registerModule('tesoreria', {
    title: 'Tesorería', icon: 'fa-money-check-dollar', group: 'Ejecución del gasto',
    alerts() {
      const out = [], C = SIGA.data.ctaper;
      if (C) {
        const pv = C.obligaciones.filter(o => o.estado !== 'Pagado' && o.dias >= 0 && o.dias <= 7);
        if (pv.length) out.push({ lvl: 'warn', icon: 'fa-calendar-day', t: `${pv.length} obligaciones vencen en los próximos 7 días`, d: SIGA.ui.money(pv.reduce((s, o) => s + o.imp, 0)), fn: () => SIGA.showTab(document.getElementById('mod-root'), 't', 'prog') });
      }
      if (!T.conc.hecho) out.push({ lvl: 'info', icon: 'fa-scale-balanced', t: 'Conciliación bancaria de agosto pendiente', d: 'Cta. RDR ••7830 · 3 partidas por revisar', fn: () => SIGA.showTab(document.getElementById('mod-root'), 't', 'conc') });
      const g = T.cp.filter(c => c.estado === 'Girado').length;
      if (g) out.push({ lvl: 'info', icon: 'fa-money-check', t: `${g} comprobantes girados por confirmar pago`, d: 'Requiere Tesorero' });
      return out;
    },
    search(q) {
      return T.cp.filter(c => (c.doc + ' ' + c.benef + ' ' + c.ruc).toLowerCase().includes(q)).map(c => ({ t: c.doc + ' · ' + SIGA.ui.money(c.neto), d: c.benef + ' · ' + c.estado, fn: () => this.ver(c) }));
    },
    render(el) {
      const U = SIGA.ui, F = SIGA.data.presupuesto.fases, pim = SIGA.ppto.pim();
      const libros = T.bancos.reduce((s, b) => s + b.libros, 0);
      el.innerHTML = `
      <div class="page-head"><div><h1>Tesorería</h1><p>Devengado, girado y pagado · retenciones automáticas · conciliación bancaria · flujo de caja proyectado</p></div>
        <div class="row-flex"><button class="btn ghost" id="t-abono"><i class="fa-solid fa-file-export"></i> Abono masivo</button><button class="btn" id="t-ncp"><i class="fa-solid fa-plus"></i> Nuevo comprobante de pago</button></div></div>
      ${U.kpis([
        { lab: 'Girado 2026', val: U.mill(F.gir), sub: U.pct(F.gir, pim) + ' del PIM' },
        { lab: 'Pagado 2026', val: U.mill(F.pag), sub: U.pct(F.pag, pim) + ' del PIM' },
        { lab: 'Saldo en bancos', val: U.mill(libros, 2), sub: T.bancos.length + ' cuentas · según libros', color: 'var(--ok)' },
        { lab: 'Cheques en cartera', val: T.cheques.filter(c => c.estado === 'En cartera').length, sub: 'por entregar', chip: 'control', chipType: 'warn' }
      ])}
      <div class="note teal"><i class="fa-solid fa-link"></i><div><b>Sin doble digitación al SIAF.</b> El girado y el pagado se transmiten por interfaz; si el SIAF no responde, la operación queda en cola y se envía sola al restablecerse. Cada pago confirmado genera su asiento contable en el mismo acto.</div></div>
      <div class="seg-tabs" data-group="t"><button class="on" data-tab="cp">Comprobantes de pago</button><button data-tab="prog">Programación de pagos</button><button data-tab="flujo">Flujo de caja</button><button data-tab="conc">Conciliación bancaria</button><button data-tab="ban">Cuentas bancarias</button><button data-tab="chq">Cheques</button><button data-tab="abo">Abono masivo</button><button data-tab="ret">Retenciones y detracciones</button></div>
      <div class="subpanel show" data-group="t" data-panel="cp"><div class="card"><h3><span class="dot"></span>Comprobantes de pago <span class="grow">el pago lo confirma el Tesorero (segregación de funciones)</span></h3><div id="t-tcp"></div></div></div>
      <div class="subpanel" data-group="t" data-panel="prog" id="t-p-prog"></div>
      <div class="subpanel" data-group="t" data-panel="flujo" id="t-p-flujo"></div>
      <div class="subpanel" data-group="t" data-panel="conc" id="t-p-conc"></div>
      <div class="subpanel" data-group="t" data-panel="ban"><div class="card"><h3><span class="dot"></span>Cuentas bancarias por fuente de financiamiento <span class="grow">T-08</span></h3><div id="t-tban"></div></div></div>
      <div class="subpanel" data-group="t" data-panel="chq"><div class="card"><h3><span class="dot"></span>Control de cheques <span class="grow">T-09 · girados, entregados, cobrados y en cartera</span></h3><div id="t-tchq"></div></div></div>
      <div class="subpanel" data-group="t" data-panel="abo" id="t-p-abo"></div>
      <div class="subpanel" data-group="t" data-panel="ret" id="t-p-ret"></div>`;

      el.querySelector('#t-ncp').addEventListener('click', () => this.nuevoCP());
      el.querySelector('#t-abono').addEventListener('click', () => SIGA.showTab(el, 't', 'abo'));
      this.paintCP(); this.paintProg(); this.paintFlujo(); this.paintConc(); this.paintBan(); this.paintChq(); this.paintAbono(); this.paintRet();
    },

    paintCP() {
      const U = SIGA.ui;
      document.getElementById('t-tcp').innerHTML = U.grid({
        id: 'tes-cp', title: 'comprobantes de pago', export: 'comprobantes_pago', rows: T.cp, record: cpRec, pageSize: 12,
        filter: { label: 'Estado', get: r => r.estado },
        cols: [
          { k: 'doc', label: 'N° C/P', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha.split('/').reverse().join('') },
          { k: 'benef', label: 'Beneficiario', render: r => U.esc(r.benef) + `<div class="mini">${U.esc(r.concepto)}</div>`, csv: r => r.benef },
          { k: 'medio', label: 'Medio', render: r => r.medio + `<div class="mini">${r.ref}</div>` },
          { k: 'bruto', label: 'Bruto', r: true, render: r => U.money(r.bruto, '') },
          { k: 'ret', label: 'Detracción / retención', r: true, sv: r => r.detr + r.ret, render: r => (r.detr || r.ret) ? `<span class="saldo-neg">−${U.money(r.detr + r.ret, '')}</span>` : '—' },
          { k: 'neto', label: 'Neto', r: true, render: r => `<b>${U.money(r.neto, '')}</b>` },
          { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, ECLS[r.estado]) }
        ],
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-circle-check', title: 'Confirmar pago (Tesorero)', show: r => r.estado === 'Girado', fn: c => this.pagar(c) }, { icon: 'fa-print', title: 'Imprimir C/P', fn: c => U.rec(cpRec).imprimir(c) }],
        tools: [{ icon: 'fa-plus', label: 'Nuevo C/P', primary: true, fn: () => this.nuevoCP() }],
        bulk: [
          { icon: 'fa-circle-check', label: 'Confirmar pago de los girados', fn: rs => this.pagarLote(rs.filter(r => r.estado === 'Girado')) },
          { icon: 'fa-print', label: 'Imprimir comprobantes', fn: rs => U.preview('Comprobantes de pago · ' + rs.length, rs.map(c => U.doc(Object.assign({ office: cpRec.office }, cpRec.print(c)))).join('<div class="pg-break"></div>'), { file: 'comprobantes_pago_lote' }) }
        ],
        foot: rs => { const v = rs.filter(r => r.estado !== 'Anulado'); return `<tr><td colspan="5" class="r"><b>Total (${v.length} vigentes)</b></td><td class="r num"><b>${U.money(v.reduce((s, r) => s + r.bruto, 0), '')}</b></td><td class="r num saldo-neg">−${U.money(v.reduce((s, r) => s + r.detr + r.ret, 0), '')}</td><td class="r num"><b>${U.money(v.reduce((s, r) => s + r.neto, 0), '')}</b></td><td colspan="2"></td></tr>`; }
      });
    },
    ver(c) { SIGA.ui.rec(cpRec).ver(c); },
    pagarLote(rs) {
      const U = SIGA.ui;
      if (!rs.length) { U.toast('No hay comprobantes girados en la selección', 'info'); return; }
      if (!SIGA.sod(null, 'cp.pagar')) return;
      const propios = rs.filter(c => c.user === SIGA.ctx.user.nombre); if (propios.length) { U.toast('Se excluyen ' + propios.length + ' C/P registrados por usted (segregación de funciones)', 'err'); }
      const ok = rs.filter(c => c.user !== SIGA.ctx.user.nombre);
      ok.forEach(c => this.pagar(c, true));
      if (ok.length) { U.toast(`${ok.length} comprobantes pagados · ${U.money(ok.reduce((s, c) => s + c.neto, 0))} · SIAF y contabilidad actualizados`); SIGA.refresh(); }
    },
    constancia(c, t) {
      const U = SIGA.ui;
      const det = t === 'det';
      U.preview((det ? 'Constancia de depósito de detracción · ' : 'Certificado de retención · ') + c.doc, U.doc({ tipo: det ? 'Constancia de depósito SPOT' : 'Certificado de retención de renta 4.ª', num: (det ? 'SPOT-' : 'RET-') + c.doc.slice(-4), office: 'Oficina de Tesorería',
        pairs: [['Proveedor / locador', U.esc(c.benef), 1], ['RUC / DNI', c.ruc], ['Comprobante de pago', c.doc], ['Fecha', c.fecha], ['Operación', det ? (c.spot || 'Servicios gravados') : 'Recibo por honorarios'], ['Importe de la operación', U.money(c.bruto)], [det ? 'Monto depositado' : 'Monto retenido', '<b>' + U.money(det ? c.detr : c.ret) + '</b>'], ['Cuenta', det ? 'Banco de la Nación · cta. de detracciones del proveedor' : 'Declarado en PDT PLAME del periodo 08/2026']] }), { file: (det ? 'constancia_spot_' : 'certificado_retencion_') + c.doc.slice(-4) });
    },
    voucher(c) {
      const U = SIGA.ui, A = SIGA.data.contabilidad.asientos.find(a => (a.glosa || '').includes(c.doc));
      const lin = A ? A.lineas : [{ cta: '2103', debe: c.bruto, haber: 0 }, { cta: '1101', debe: 0, haber: c.neto }, ...(c.detr + c.ret ? [{ cta: '2101', debe: 0, haber: c.detr + c.ret }] : [])];
      const pc = SIGA.data.contabilidad.plan || {};
      U.modal('<i class="fa-solid fa-book"></i> Asiento contable · ' + c.doc, `${A ? `<p class="mini mb">Asiento <b>${A.num}</b> · ${A.glosa}</p>` : `<p class="mini mb">${c.estado === 'Pagado' ? 'Asiento del pago (registrado en el cierre del periodo)' : 'Asiento que se generará al confirmar el pago'}</p>`}` +
        U.table([{ k: 'cta', label: 'Cuenta', render: l => `<span class="code">${l.cta}</span> ${pc[l.cta] || ''}` }, { k: 'debe', label: 'Debe', r: true, render: l => l.debe ? U.money(l.debe, '') : '' }, { k: 'haber', label: 'Haber', r: true, render: l => l.haber ? U.money(l.haber, '') : '' }], lin), `<button class="btn ghost" data-close>Cerrar</button>`);
    },
    pagar(c, silent) {
      const U = SIGA.ui;
      if (!silent && !SIGA.sod(c.user, 'cp.pagar')) return;
      c.estado = 'Pagado'; c.aprob = SIGA.ctx.user.nombre;
      SIGA.siaf('Pagado', c.doc, c.neto);
      const a = SIGA.asiento('Pago ' + c.doc + ' · ' + c.benef, [['2103', c.bruto, 0], ['1101', 0, c.neto], ...(c.detr + c.ret ? [['2101', 0, c.detr + c.ret]] : [])], 'Tesorería');
      const b = T.bancos[0]; b.libros -= c.neto;
      SIGA.data.presupuesto.fases.pag += c.bruto;
      if (c.cert) { const ce = SIGA.ppto.cert(c.cert); if (ce && ce.fase === 'Girado') { ce.fase = 'Pagado'; SIGA.exp?.stage(ce.exp, 'pag', c.doc, 'abono confirmado'); } }
      const ob = SIGA.data.ctaper?.obligaciones.find(o => o.cp === c.doc); if (ob) ob.estado = 'Pagado';
      const chq = T.cheques.find(h => c.ref === 'Cheque ' + h.num); if (chq && chq.estado === 'En cartera') chq.estado = 'Entregado';
      SIGA.log('Tesorería', 'Pago confirmado', c.doc, 'Girado', 'Pagado');
      if (silent) return;
      U.toast(`${c.doc} pagado · SIAF actualizado · asiento ${a || ''} generado`); SIGA.refresh();
    },
    nuevoCP(ob) {
      const U = SIGA.ui;
      const next = 'C/P 2026-' + U.pad(615 + T.cp.filter(x => x.nuevo).length, 4);
      const esRH = ob && ob.tipo === 'RH';
      U.bigForm({
        title: 'Nuevo comprobante de pago (girado)', icon: 'fa-money-check-dollar',
        sections: [
          { title: 'Datos del giro', cols: 3, fields: [
            { k: 'num', label: 'C/P N°', value: next, ro: true, span: 1 }, { k: 'fecha', label: 'Fecha de giro', type: 'date', value: SIGA.ctx.hoyISO, span: 1, required: true },
            { k: 'dev', label: 'Devengado', value: ob ? ob.dev : 'DEV 2026-0', span: 1 },
            { k: 'medio', label: 'Medio de pago', type: 'select', options: ['Abono CCI', 'Cheque', 'Carta orden'], span: 1 },
            { k: 'banco', label: 'Cuenta de cargo', type: 'select', options: T.bancos.map(b => b.banco + ' ' + b.cta + ' · ' + b.fte), span: 2 }
          ] },
          { title: 'Beneficiario', cols: 3, fields: [
            { k: 'tipoDoc', label: 'Tipo de comprobante', type: 'select', options: ['01 · Factura', 'RH · Recibo por honorarios', '03 · Boleta'], value: esRH ? 'RH · Recibo por honorarios' : '01 · Factura', span: 1 },
            { k: 'ruc', label: 'RUC / DNI', value: ob ? ob.ruc : '', span: 1, required: true }, { k: 'cci', label: 'CCI', value: '', span: 1 },
            { k: 'benef', label: 'Nombre / Razón social', value: ob ? ob.prov : '', required: true, span: 3 }, { k: 'concepto', label: 'Concepto', value: ob ? 'Pago ' + ob.doc : '', span: 3 }
          ] },
          { title: 'Importe, detracción y retención', hint: 'calculadas automáticamente por el sistema', cols: 3, fields: [
            { k: 'bruto', label: 'Importe bruto (devengado) S/', type: 'number', value: ob ? ob.imp : 0, span: 1, required: true },
            { k: 'spot', label: 'Tipo de bien o servicio (SPOT)', type: 'select', options: T.spot.map(s => s[0]), value: esRH ? 'No sujeto a detracción' : 'Demás servicios gravados con el IGV', span: 2 }
          ] }
        ],
        totals: (r, v) => {
          const b = parseFloat(v.bruto) || 0, rh = v.tipoDoc.startsWith('RH');
          const pd = rh || b <= 700 ? 0 : spotPct(v.spot), det = Math.round(b * pd) / 100, ren = rh && b > 1500 ? Math.round(b * 8) / 100 : 0;
          return [{ label: 'Importe bruto', val: U.money(b, '') }, { label: `(−) Detracción ${pd}%`, val: U.money(det, ''), cls: 'neg' }, { label: '(−) Retención renta 4.ª (8%)', val: U.money(ren, ''), cls: 'neg' }, { label: 'NETO A GIRAR S/', val: U.money(b - det - ren, ''), big: true }];
        },
        status: (r, v) => { const b = parseFloat(v.bruto) || 0, rh = v.tipoDoc.startsWith('RH'); return `<div class="note info" style="margin:8px 0"><i class="fa-solid fa-robot"></i><div>${rh ? (b > 1500 ? 'Recibo por honorarios mayor a S/ 1,500: el sistema retiene 8% de renta de cuarta categoría.' : 'Recibo por honorarios hasta S/ 1,500: sin retención.') : b <= 700 ? 'Operación hasta S/ 700: no sujeta a detracción.' : `Detracción SPOT de ${spotPct(v.spot)}% aplicada según "${v.spot}". El depósito va a la cuenta de detracciones del proveedor en el Banco de la Nación.`} Se elimina la hoja de cálculo paralela.</div></div>`; },
        footNote: (r, v) => { const b = parseFloat(v.bruto) || 0, rh = v.tipoDoc.startsWith('RH'), det = rh || b <= 700 ? 0 : b * spotPct(v.spot) / 100, ren = rh && b > 1500 ? b * 0.08 : 0; return U.montoLetras(b - det - ren); },
        submitLabel: 'Girar comprobante',
        onSubmit: v => {
          const b = parseFloat(v.bruto) || 0, rh = v.tipoDoc.startsWith('RH'), det = rh || b <= 700 ? 0 : Math.round(b * spotPct(v.spot)) / 100, ren = rh && b > 1500 ? Math.round(b * 8) / 100 : 0, neto = b - det - ren;
          if (b <= 0) { U.toast('Ingrese el importe bruto', 'err'); return; }
          const c = { doc: v.num, fecha: U.dmy(v.fecha), benef: v.benef, ruc: v.ruc, concepto: v.concepto || 'Pago a proveedor', medio: v.medio, ref: v.medio === 'Cheque' ? 'Cheque •••' + (8906 + T.cheques.filter(x => x.nuevo).length) : 'CCI ' + (v.cci ? '•••' + v.cci.slice(-4) : '•••'), bruto: b, detr: det, ret: ren, neto, estado: 'Girado', user: SIGA.ctx.user.nombre, spot: v.spot, nuevo: true };
          T.cp.unshift(c);
          if (v.medio === 'Cheque') T.cheques.unshift({ num: c.ref.replace('Cheque ', ''), fecha: SIGA.ctx.hoy, benef: v.benef, monto: neto, estado: 'En cartera', nuevo: true });
          if (ob) { ob.estado = 'Programado'; ob.cp = c.doc; }
          SIGA.data.presupuesto.fases.gir += b;
          SIGA.siaf('Girado', c.doc, neto);
          SIGA.log('Tesorería', 'Giro de comprobante de pago', c.doc, '—', 'Neto ' + U.money(neto) + (det ? ' · detracción ' + U.money(det) : '') + (ren ? ' · renta ' + U.money(ren) : ''));
          U.closeModal(); SIGA.refresh(); U.toast(`${c.doc} girado · neto ${U.money(neto)} · pendiente de confirmación del Tesorero`);
        }
      });
    },

    paintProg() {
      const U = SIGA.ui, C = SIGA.data.ctaper; if (!C) return;
      const pr = { Urgente: 0, Normal: 1, Programada: 2 };
      const rows = C.obligaciones.filter(o => o.estado !== 'Pagado').slice().sort((a, b) => (a.estado === 'Vencida' ? -1 : 0) - (b.estado === 'Vencida' ? -1 : 0) || a.dias - b.dias || pr[a.prioridad] - pr[b.prioridad]);
      let disp = T.bancos[0].libros;
      document.getElementById('t-p-prog').innerHTML = `<div class="card"><h3><span class="dot"></span>Programación de pagos <span class="grow">T-02 · ordenada sola por vencimiento y prioridad · cobertura con fondos disponibles</span></h3><div id="pg-t"></div>
        <p class="mini mt">"Se ve con anticipación qué vence y con qué fondos se atiende." El saldo disponible se descuenta en cascada según el orden de pago.</p></div>`;
      const cob = new Map(); rows.forEach(r => { disp -= r.imp; cob.set(r, disp >= 0); });
      document.getElementById('pg-t').innerHTML = U.grid({
        id: 'tes-prog', title: 'programación de pagos', export: 'programacion_pagos', rows, record: SIGA.recs.obligacion, pageSize: 10,
        filter: { label: 'Prioridad', get: r => r.prioridad },
        cols: [
          { k: 'venc', label: 'Vence', sv: r => r.dias, render: r => r.venc + `<div class="mini" style="color:${r.dias < 0 ? 'var(--danger)' : r.dias <= 7 ? '#b45309' : 'var(--muted)'}">${r.dias < 0 ? 'vencida hace ' + (-r.dias) + ' d' : 'en ' + r.dias + ' d'}</div>` },
          { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'prov', label: 'Proveedor' },
          { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) },
          { k: 'prioridad', label: 'Prioridad', render: r => U.tag(r.prioridad, r.prioridad === 'Urgente' ? 't-red' : r.prioridad === 'Normal' ? 't-blue' : 't-gray') },
          { k: 'cob', label: 'Cobertura', nosort: true, render: r => cob.get(r) ? U.tag('Con fondos', 't-green') : U.tag('Sin fondos · reprogramar', 't-red') },
          { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.cls || (r.estado === 'Vencida' ? 't-red' : r.estado === 'Programado' ? 't-blue' : 't-amber')) }
        ],
        actions: [{ icon: 'fa-money-check-dollar', title: 'Girar', show: r => !r.cp, fn: o => this.nuevoCP(o) }],
        bulk: [{ icon: 'fa-calendar-check', label: 'Programar para esta semana', fn: rs => { rs.filter(o => o.estado !== 'Programado').forEach(o => { o.estado = 'Programado'; SIGA.log('Tesorería', 'Programación de pago', o.doc, 'Por pagar', 'Programado · semana 34'); }); U.toast(rs.length + ' obligaciones programadas para la semana 34'); SIGA.refresh(); } }],
        foot: rs => `<tr><td colspan="4" class="r"><b>Total por atender</b></td><td class="r num"><b>${U.money(rs.reduce((s, r) => s + r.imp, 0))}</b></td><td colspan="4"></td></tr>`
      });
    },
    paintFlujo() {
      const U = SIGA.ui, Fl = T.flujo, ini = T.bancos.reduce((s, b) => s + b.libros, 0) / 1000;
      let s = ini; const saldo = Fl.sem.map((_, i) => (s += Fl.ing[i] - Fl.egr[i]));
      const min = Math.min(...saldo);
      document.getElementById('t-p-flujo').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Flujo de caja proyectado · 12 semanas <span class="grow">T-12 · miles de soles</span></h3>
          ${U.chart.cols({ labels: Fl.sem, series: [{ name: 'Ingresos', data: Fl.ing }, { name: 'Egresos', data: Fl.egr }], fmt: v => 'S/ ' + U.int(v) + ' mil', h: 230 })}</div>
        <div class="card"><h3><span class="dot"></span>Saldo proyectado <span class="grow">miles de soles</span></h3>
          ${U.chart.line({ labels: Fl.sem, series: [{ name: 'Saldo de caja', data: saldo.map(x => Math.round(x)) }], fmt: v => 'S/ ' + U.int(v) + ' mil', area: true, h: 180 })}
          <div class="ef-row mt"><span>Saldo inicial (libros)</span><b>S/ ${U.int(Math.round(ini))} mil</b></div><div class="ef-row"><span>Saldo mínimo proyectado</span><b>S/ ${U.int(Math.round(min))} mil</b></div>
          <div class="note teal mt" style="margin-bottom:0"><i class="fa-solid fa-circle-check"></i><div>Sin déficit de caja en el horizonte · las semanas de planilla (S36, S40, S44) quedan cubiertas.</div></div></div></div>`;
    },
    paintConc() {
      const U = SIGA.ui, K = T.conc, b = T.bancos[1];
      const mE = new Set(K.libros.map(l => l[3])), mL = new Set(K.extracto.map(e => e[3]));
      const tran = K.libros.filter(l => !mL.has(l[3]) && l[2] > 0), chq = K.libros.filter(l => !mL.has(l[3]) && l[2] < 0), noReg = K.extracto.filter(e => !mE.has(e[3]) && !K.hecho);
      const tT = tran.reduce((s, x) => s + x[2], 0), tC = -chq.reduce((s, x) => s + x[2], 0), tN = -noReg.reduce((s, x) => s + x[2], 0);
      const conc = b.extracto + tT - tC, libAj = b.libros - tN, dif = conc - libAj;
      document.getElementById('t-p-conc').innerHTML = `<div class="split">
        <div class="card"><h3><span class="dot"></span>Conciliación automática · ${b.banco} ${b.cta} (RDR) <span class="grow">T-11 · se cruza el extracto con los libros y solo se revisan las diferencias reales</span></h3>
          <div class="grid cols-2" style="gap:12px"><div><div class="lbl-s mb">Extracto bancario</div>${U.table([{ k: 0, label: 'Fecha' }, { k: 1, label: 'Movimiento' }, { k: 2, label: 'Importe', r: true, render: r => `<span class="${r[2] < 0 ? 'saldo-neg' : ''}">${U.money(r[2], '')}</span>` }, { k: 3, label: '', render: r => r[3] && mE.has(r[3]) ? '<i class="fa-solid fa-link" style="color:var(--ok)" title="Emparejado"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color:#d97706" title="Sin par"></i>' }], K.extracto)}</div>
          <div><div class="lbl-s mb">Libros institucionales</div>${U.table([{ k: 0, label: 'Fecha' }, { k: 1, label: 'Registro' }, { k: 2, label: 'Importe', r: true, render: r => `<span class="${r[2] < 0 ? 'saldo-neg' : ''}">${U.money(r[2], '')}</span>` }, { k: 3, label: '', render: r => mL.has(r[3]) ? '<i class="fa-solid fa-link" style="color:var(--ok)"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color:#d97706"></i>' }], K.libros)}</div></div></div>
        <div class="card"><h3><span class="dot"></span>Resultado</h3>
          <div class="ef-row"><span>Saldo según extracto</span><b class="num">${U.money(b.extracto, '')}</b></div>
          <div class="ef-row sub"><span>(+) Depósitos en tránsito (${tran.length})</span><span class="num">${U.money(tT, '')}</span></div>
          <div class="ef-row sub"><span>(−) Cheques girados no cobrados (${chq.length})</span><span class="num">${U.money(tC, '')}</span></div>
          <div class="ef-row tot"><span>Saldo conciliado</span><span class="num">${U.money(conc, '')}</span></div>
          <div class="ef-row"><span>Saldo según libros</span><b class="num">${U.money(b.libros, '')}</b></div>
          <div class="ef-row sub"><span>(−) Cargos bancarios no registrados (${noReg.length})</span><span class="num">${U.money(tN, '')}</span></div>
          <div class="ef-row tot"><span>Diferencia</span><span class="num ${Math.abs(dif) < 0.005 ? 'saldo-pos' : 'saldo-neg'}">${U.money(dif, '')}</span></div>
          <button class="btn sm ghost mt" id="cc-acta"><i class="fa-solid fa-print"></i> Acta de conciliación</button>
          ${K.hecho ? `<div class="note teal mt" style="margin-bottom:0"><i class="fa-solid fa-circle-check"></i><div>Conciliación cuadrada · acta generada.</div></div>` : `<div class="note amber mt"><i class="fa-solid fa-magnifying-glass"></i><div>${K.extracto.filter(e => mE.has(e[3])).length} partidas emparejadas automáticamente. Queda 1 cargo bancario por registrar en libros.</div></div><button class="btn" id="cc-reg"><i class="fa-solid fa-pen-to-square"></i> Registrar cargo y cerrar conciliación</button>`}</div></div>`;
      document.getElementById('cc-acta').addEventListener('click', () => U.preview('Acta de conciliación bancaria · ' + b.cta, U.doc({ tipo: 'Conciliación bancaria', num: 'CB-2026-08-' + b.cta.slice(-4), office: 'Oficina de Tesorería', pairs: [['Banco', b.banco], ['Cuenta', b.cta + ' · ' + b.fte], ['Periodo', 'Agosto 2026'], ['Estado', K.hecho ? 'Cuadrada' : 'Con partidas pendientes']],
        body: dtbl([['Concepto'], ['Importe S/', 1]], [['Saldo según extracto bancario', U.money(b.extracto, '')], ['(+) Depósitos en tránsito · ' + tran.map(x => x[3]).join(', '), U.money(tT, '')], ['(−) Cheques girados no cobrados · ' + chq.map(x => x[3]).join(', '), U.money(tC, '')], ['<b>Saldo conciliado</b>', '<b>' + U.money(conc, '') + '</b>'], ['Saldo según libros', U.money(b.libros, '')], ['(−) Cargos bancarios no registrados', U.money(tN, '')], ['<b>Diferencia</b>', '<b>' + U.money(dif, '') + '</b>']]),
        firmas: [['Elaboró', 'K. Ramos · Tesorería'], ['Revisó', 'L. Vargas · Tesorero'], ['V.º B.º', 'R. Soto · Contador']] }), { file: 'conciliacion_' + b.cta.slice(-4) }));
      document.getElementById('cc-reg')?.addEventListener('click', () => {
        b.libros -= tN; K.hecho = true;
        SIGA.asiento('Comisión bancaria · conciliación agosto ' + b.cta, [['5302', tN, 0], ['1101', 0, tN]], 'Tesorería');
        SIGA.log('Tesorería', 'Conciliación bancaria', b.cta + ' · agosto 2026', 'Diferencia ' + U.money(tN), 'Diferencia S/ 0.00');
        U.toast('Conciliación de ' + b.cta + ' cuadrada · diferencia S/ 0.00'); SIGA.refresh();
      });
    },
    paintBan() {
      const U = SIGA.ui, tl = T.bancos.reduce((s, b) => s + b.libros, 0), te = T.bancos.reduce((s, b) => s + b.extracto, 0);
      const banRec = { mod: 'Tesorería', tipo: 'Estado de cuenta', office: 'Oficina de Tesorería', key: r => r.cta, title: r => r.banco + ' ' + r.cta, cls: false,
        fields: r => [['Banco', r.banco], ['Cuenta', `<span class="code">${r.cta}</span>`], ['Fuente de financiamiento', r.fte], ['Tipo', r.tipo], ['Saldo en libros', U.money(r.libros)], ['Saldo según banco', U.money(r.extracto)], ['Diferencia', U.money(r.libros - r.extracto)], ['Estado', Math.abs(r.libros - r.extracto) < 0.005 ? U.tag('Conciliada', 't-green') : U.tag('Por conciliar', 't-amber')]],
        body: r => { const m = T.cp.filter(c => c.estado === 'Pagado').slice(0, 6); return `<div class="lbl-s mt mb">Últimos cargos de la cuenta</div>` + U.table([{ k: 'fecha', label: 'Fecha' }, { k: 'doc', label: 'Documento', render: c => `<span class="code">${c.doc}</span>` }, { k: 'benef', label: 'Beneficiario' }, { k: 'neto', label: 'Cargo', r: true, render: c => U.money(-c.neto, '') }], m); },
        extra: r => [{ icon: 'fa-right-left', label: 'Transferencia entre cuentas', fn: x => this.transfer(x) }, ...(Math.abs(r.libros - r.extracto) > 0.005 ? [{ icon: 'fa-scale-balanced', label: 'Ir a conciliación', fn: () => { U.closeModal(); SIGA.showTab(document.getElementById('mod-root'), 't', 'conc'); } }] : [])],
        print: r => ({ tipo: 'Estado de cuenta', num: r.cta, pairs: [['Banco', r.banco], ['Fuente', r.fte], ['Periodo', 'Agosto 2026'], ['Saldo en libros', U.money(r.libros)]], body: dtbl([['Fecha'], ['Documento'], ['Beneficiario'], ['Cargo', 1]], T.cp.filter(c => c.estado === 'Pagado').map(c => [c.fecha, c.doc, U.esc(c.benef), U.money(c.neto, '')])) }) };
      document.getElementById('t-tban').innerHTML = U.grid({ id: 'tes-ban', title: 'cuentas bancarias', rows: T.bancos, record: banRec, search: false,
        cols: [{ k: 'banco', label: 'Banco' }, { k: 'cta', label: 'Cuenta', render: r => `<span class="code">${r.cta}</span>` }, { k: 'fte', label: 'Fuente' }, { k: 'tipo', label: 'Tipo' },
          { k: 'libros', label: 'Saldo libros', r: true, render: r => U.money(r.libros, '') }, { k: 'extracto', label: 'Saldo banco', r: true, render: r => U.money(r.extracto, '') },
          { k: 'd', label: 'Estado', render: r => Math.abs(r.libros - r.extracto) < 0.005 ? U.tag('Conciliada', 't-green') : U.tag('Por conciliar', 't-amber') }],
        foot: `<tr><td colspan="4" class="r" style="font-weight:700">Total disponible</td><td class="r num" style="font-weight:800;color:var(--primary-dark)">${U.money(tl, '')}</td><td class="r num" style="font-weight:700">${U.money(te, '')}</td><td colspan="2"></td></tr>` });
    },
    transfer(o) {
      const U = SIGA.ui, lab = b => b.banco + ' ' + b.cta + ' · ' + b.fte;
      U.formModal('<i class="fa-solid fa-right-left"></i> Transferencia entre cuentas', [
        { k: 'de', label: 'Cuenta de origen', type: 'select', options: T.bancos.map(lab), value: o ? lab(o) : '' }, { k: 'a', label: 'Cuenta de destino', type: 'select', options: T.bancos.map(lab), value: lab(T.bancos[0]) },
        { k: 'm', label: 'Importe S/', type: 'number', value: 10000, span: 1 }, { k: 'd', label: 'Documento sustento', value: 'Memorando N.º 0' + (140 + U.int(T.cp.length)) + '-2026-TES', span: 1 }
      ], v => {
        const de = T.bancos.find(b => lab(b) === v.de), a = T.bancos.find(b => lab(b) === v.a), m = parseFloat(v.m) || 0;
        if (de === a) { U.toast('Las cuentas deben ser distintas', 'err'); return; }
        if (m <= 0 || m > de.libros) { U.toast('Importe inválido o mayor al saldo de la cuenta de origen', 'err'); return; }
        de.libros -= m; a.libros += m; de.extracto -= m; a.extracto += m;
        SIGA.log('Tesorería', 'Transferencia entre cuentas', de.cta + ' → ' + a.cta, U.money(de.libros + m), U.money(m) + ' · ' + v.d);
        U.closeModal(); U.toast('Transferencia de ' + U.money(m) + ' ejecutada · ' + de.cta + ' → ' + a.cta); SIGA.refresh();
      }, 'Transferir');
    },
    paintChq() {
      const U = SIGA.ui;
      const chRec = { mod: 'Tesorería', tipo: 'Cheque', office: 'Oficina de Tesorería', key: r => 'Cheque ' + r.num, title: r => 'Cheque ' + r.num + ' · ' + r.benef, cls: false,
        fields: r => [['Cheque', `<span class="code">${r.num}</span>`], ['Fecha de giro', r.fecha], ['Beneficiario', U.esc(r.benef), 1], ['Monto', U.money(r.monto)], ['Estado', U.tag(r.estado, CHCLS[r.estado])], ['Comprobante', (T.cp.find(c => c.ref === 'Cheque ' + r.num) || {}).doc || r.cp || '—'], ['Cuenta de cargo', 'Banco de la Nación 00-068-••4521']],
        body: r => `<div class="mf-note">${U.montoLetras(r.monto)}</div>`,
        extra: r => [
          ...(r.estado === 'En cartera' ? [{ icon: 'fa-hand-holding', label: 'Registrar entrega', fn: x => { x.estado = 'Entregado'; SIGA.log('Tesorería', 'Entrega de cheque', 'Cheque ' + x.num, 'En cartera', 'Entregado · ' + x.benef); U.closeModal(); U.toast('Cheque ' + x.num + ' entregado a ' + x.benef); SIGA.refresh(); } }] : []),
          ...(r.estado === 'Entregado' ? [{ icon: 'fa-building-columns', label: 'Registrar cobro (extracto)', fn: x => { x.estado = 'Cobrado'; SIGA.log('Tesorería', 'Cobro de cheque', 'Cheque ' + x.num, 'Entregado', 'Cobrado'); U.closeModal(); U.toast('Cheque ' + x.num + ' cobrado según extracto'); SIGA.refresh(); } }] : [])
        ],
        anular: true, canAnular: r => r.estado === 'En cartera', anularLabel: 'Anular cheque',
        onAnular: r => { const c = T.cp.find(x => x.ref === 'Cheque ' + r.num && x.estado === 'Girado'); if (c) { c.estado = 'Anulado'; c.anulado = true; c.motivo = 'Cheque anulado'; SIGA.data.presupuesto.fases.gir -= c.bruto; SIGA.siaf('Anulación de girado', c.doc, -c.neto); } },
        print: r => ({ tipo: 'Comprobante de entrega de cheque', num: r.num, pairs: [['Beneficiario', U.esc(r.benef), 1], ['Monto', U.money(r.monto)], ['Fecha', r.fecha], ['Estado', r.estado]], body: `<p>${U.montoLetras(r.monto)}</p>`, firmas: [['Giró', 'K. Ramos'], ['Tesorero', 'L. Vargas'], ['Recibí conforme', U.esc(r.benef)]] }) };
      document.getElementById('t-tchq').innerHTML = U.grid({ id: 'tes-chq', title: 'cheques', export: 'cheques', rows: T.cheques, record: chRec, filter: { label: 'Estado', get: r => r.estado },
        cols: [{ k: 'num', label: 'Cheque', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha', sv: r => r.fecha.split('/').reverse().join('') }, { k: 'benef', label: 'Beneficiario' },
          { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto, '') }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, CHCLS[r.estado]) }],
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.estado === 'Anulado' ? ' row-void' : ''),
        actions: [{ icon: 'fa-hand-holding', title: 'Registrar entrega', show: r => r.estado === 'En cartera', fn: r => { r.estado = 'Entregado'; SIGA.log('Tesorería', 'Entrega de cheque', 'Cheque ' + r.num, 'En cartera', 'Entregado · ' + r.benef); U.toast('Cheque ' + r.num + ' entregado a ' + r.benef); SIGA.refresh(); } }],
        foot: rs => `<tr><td colspan="3" class="r"><b>En circulación (entregados no cobrados)</b></td><td class="r num"><b>${U.money(rs.filter(r => r.estado === 'Entregado').reduce((s, r) => s + r.monto, 0), '')}</b></td><td colspan="2"></td></tr>` });
    },
    paintAbono() {
      const U = SIGA.ui, A = T.abono, tot = A.reduce((s, r) => s + r[3], 0);
      const txt = ['H|20161749126|UNAS|' + SIGA.ctx.hoy.replace(/\//g, '') + '|' + A.length + '|' + tot.toFixed(2)].concat(A.map((r, i) => `D|${String(i + 1).padStart(4, '0')}|${r[1]}|${r[2].replace(/-/g, '')}|${r[3].toFixed(2).padStart(12, '0')}|${r[0].toUpperCase().slice(0, 30)}`)).join('\n');
      const abRec = { mod: 'Tesorería', tipo: 'Orden de abono', key: r => r[1], title: r => r[0], cls: false,
        fields: r => [['Beneficiario', U.esc(r[0]), 1], ['RUC / DNI', r[1]], ['CCI', `<span class="code">${r[2]}</span>`], ['Importe', U.money(r[3])]],
        edit: [{ k: 'cci', label: 'CCI (20 dígitos)', get: r => r[2], set: (r, v) => r[2] = v }, { k: 'imp', label: 'Importe S/', type: 'number', get: r => r[3], set: (r, v) => r[3] = v }],
        extra: () => [{ icon: 'fa-user-minus', label: 'Quitar del lote', danger: true, fn: x => { A.splice(A.indexOf(x), 1); SIGA.log('Tesorería', 'Retiro de abono del lote', x[1], U.money(x[3]), 'Retirado'); U.closeModal(); U.toast(U.esc(x[0]) + ' retirado del lote'); SIGA.refresh(); } }] };
      document.getElementById('t-p-abo').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Lote de abono en cuenta <span class="grow">T-10 · proveedores y planillas sin cheques</span></h3>${U.grid({ id: 'tes-abo', title: 'lote de abono', rows: A, record: abRec, search: false,
        cols: [{ k: 0, label: 'Beneficiario' }, { k: 1, label: 'RUC/DNI', render: r => `<span class="code">${r[1]}</span>` }, { k: 2, label: 'CCI', cls: 'mini' }, { k: 3, label: 'Importe', r: true, render: r => U.money(r[3], '') }],
        tools: [{ icon: 'fa-user-plus', label: 'Agregar', primary: true, fn: () => U.formModal('<i class="fa-solid fa-user-plus"></i> Agregar beneficiario al lote', [{ k: 'n', label: 'Beneficiario' }, { k: 'r', label: 'RUC / DNI', span: 1 }, { k: 'i', label: 'Importe S/', type: 'number', value: 0, span: 1 }, { k: 'c', label: 'CCI (20 dígitos)' }], v => { if (!/^\d{8}(\d{3})?$/.test(v.r.trim()) || !(parseFloat(v.i) > 0) || v.c.replace(/\D/g, '').length !== 20) { U.toast('Verifique RUC/DNI, importe y CCI de 20 dígitos', 'err'); return; } const c = v.c.replace(/\D/g, ''); A.push([v.n.trim() || 'Beneficiario', v.r.trim(), c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8, 18) + '-' + c.slice(18), parseFloat(v.i)]); SIGA.log('Tesorería', 'Alta en lote de abono', v.r, '—', U.money(parseFloat(v.i))); U.closeModal(); U.toast('Beneficiario agregado al lote'); SIGA.refresh(); }, 'Agregar') }],
        foot: `<tr><td colspan="3" class="r" style="font-weight:700">Total del lote</td><td class="r num" style="font-weight:800">${U.money(tot, '')}</td><td></td></tr>` })}</div>
        <div class="card"><h3><span class="dot"></span>Archivo generado para el banco</h3><div class="txtfile">${U.esc(txt)}</div>
          <div class="row-flex mt"><button class="btn" id="ab-send"><i class="fa-solid fa-paper-plane"></i> Enviar lote al banco</button><button class="btn ghost" id="ab-dl"><i class="fa-solid fa-download"></i> Descargar .txt</button></div></div></div>`;
      document.getElementById('ab-dl').addEventListener('click', () => U.download('ABONO_BN_' + SIGA.ctx.hoyISO.replace(/-/g, '') + '.txt', txt));
      document.getElementById('ab-send').addEventListener('click', () => { SIGA.siaf('Abono masivo', 'Lote proveedores ' + SIGA.ctx.hoy, tot, 'Banco'); SIGA.log('Tesorería', 'Envío de abono masivo', 'Lote ' + SIGA.ctx.hoy, '—', A.length + ' abonos · ' + U.money(tot)); U.toast('Lote de ' + A.length + ' abonos enviado al banco · ' + U.money(tot)); });
    },
    paintRet() {
      const U = SIGA.ui;
      const det = T.cp.filter(c => c.detr), ren = T.cp.filter(c => c.ret && c.medio !== 'Abono masivo');
      document.getElementById('t-p-ret').innerHTML = `<div class="grid cols-3">
        <div class="card"><h3><span class="dot"></span>Tasas de detracción (SPOT) <span class="grow">T-04 · parametrizadas</span></h3>${T.spot.map(s => `<div class="ef-row"><span>${s[0]}</span><b>${s[1]}%</b></div>`).join('')}<p class="mini mt">Operaciones hasta S/ 700 no están sujetas.</p></div>
        <div class="card"><h3><span class="dot"></span>Detracciones del mes</h3>${det.map(c => `<div class="ef-row"><span>${c.doc}<div class="mini">${c.benef}</div></span><b>${U.money(c.detr)}</b></div>`).join('') || '<div class="mini">—</div>'}<div class="ef-row tot"><span>Total a depositar</span><span>${U.money(det.reduce((s, c) => s + c.detr, 0))}</span></div></div>
        <div class="card"><h3><span class="dot"></span>Retenciones renta 4.ª y judiciales</h3>${ren.map(c => `<div class="ef-row"><span>${c.doc}<div class="mini">${c.benef}</div></span><b>${U.money(c.ret)}</b></div>`).join('')}
          <div class="ef-row"><span>Retenciones judiciales (planilla)<div class="mini">${SIGA.data.ctaper ? SIGA.data.ctaper.judiciales.length : 0} mandatos en la muestra</div></span><b>${U.money(SIGA.data.ctaper ? SIGA.data.ctaper.judiciales.reduce((s, j) => s + j.monto, 0) : 0)}</b></div>
          <div class="row-flex mt"><button class="btn sm" onclick="SIGA.go('ctaper',{c:'jud'})"><i class="fa-solid fa-gavel"></i> Ver mandatos</button><button class="btn sm ghost" id="rt-pdt"><i class="fa-solid fa-file-export"></i> Archivo PDT/PLAME</button><button class="btn sm ghost" id="rt-spot"><i class="fa-solid fa-file-export"></i> Lote SPOT (BN)</button></div></div></div>`;
      document.getElementById('rt-pdt').addEventListener('click', () => U.download('0601201608' + '20161749126.4ta', ren.map(c => ['R', c.ruc, c.benef.split(' · ')[0].toUpperCase(), c.fecha, c.bruto.toFixed(2), c.ret.toFixed(2)].join('|')).join('\n')));
      document.getElementById('rt-spot').addEventListener('click', () => U.download('D20161749126' + SIGA.ctx.hoyISO.replace(/-/g, '').slice(2) + '.txt', ['20161749126UNAS' + String(det.length).padStart(6, '0') + det.reduce((s, c) => s + c.detr, 0).toFixed(2).padStart(15, '0')].concat(det.map(c => '6' + c.ruc + ' '.repeat(35) + '000000000' + c.detr.toFixed(2).replace('.', '').padStart(15, '0') + '01' + c.doc.slice(-4))).join('\n')));
    }
  });
})();
