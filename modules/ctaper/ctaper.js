/* Cuentas por pagar · obligaciones por proveedor y vencimiento, antigüedad y mandatos judiciales */
(function () {
  const C = SIGA.data.ctaper;
  const ECLS = { 'Por pagar': 't-amber', Programado: 't-blue', Vencida: 't-red', Pagado: 't-green', Anulado: 't-gray' };
  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const programar = o => { const a = o.estado; o.estado = 'Programado'; o.prioridad = a === 'Vencida' ? 'Urgente' : o.prioridad; SIGA.log('Cuentas por pagar', 'Programación de pago', o.doc, a, 'Programado'); };
  const aTesoreria = o => { SIGA.ui.closeModal(); SIGA.go('tesoreria'); setTimeout(() => SIGA.modules.tesoreria.nuevoCP(o), 80); };
  const oblRec = SIGA.recs.obligacion = {
    mod: 'Cuentas por pagar', tipo: 'Obligación por pagar', office: 'Oficina de Contabilidad · Cuentas por pagar', key: r => r.doc, title: r => r.tipo + ' ' + r.doc + ' · ' + r.prov, cls: false,
    fields: o => { const U = SIGA.ui; return [['Comprobante', `<span class="code">${o.doc}</span> · ${o.tipo}`], ['Proveedor', U.esc(o.prov), 1], ['RUC', o.ruc], ['Devengado SIAF', `<span class="code">${o.dev}</span>`], ['Importe', `<b>${U.money(o.imp)}</b>`], ['Emisión', o.emision], ['Vencimiento', o.venc + ` <span class="mini">(${o.dias < 0 ? 'hace ' + (-o.dias) + ' d' : 'en ' + o.dias + ' d'})</span>`], ['Prioridad', o.prioridad], ['Estado', U.tag(o.estado, ECLS[o.estado])], ['Comprobante de pago', o.cp || '—'], ...(o.obs ? [['Observación', U.esc(o.obs), 1]] : []), ...(o.motivo ? [['Motivo de anulación', U.esc(o.motivo), 1]] : [])]; },
    body: o => SIGA.ui.timeline([{ t: 'Conformidad y devengado', sub: o.dev + ' · ' + o.emision, st: 'done' }, { t: 'Programado para pago', sub: o.estado === 'Por pagar' || o.estado === 'Vencida' ? 'pendiente' : 'Tesorería', st: o.estado === 'Por pagar' || o.estado === 'Vencida' ? 'cur' : o.estado === 'Anulado' ? 'bad' : 'done' }, { t: 'Girado', sub: o.cp || 'sin comprobante de pago', st: o.cp ? 'done' : '' }, { t: 'Pagado', sub: o.estado === 'Pagado' ? 'abono confirmado' : '', st: o.estado === 'Pagado' ? 'done' : '' }]),
    edit: [{ k: 'prioridad', label: 'Prioridad', type: 'select', options: ['Normal', 'Urgente', 'Programada'], span: 1 }, { k: 'venc', label: 'Vencimiento (dd/mm/aaaa)', span: 1 }, { k: 'obs', label: 'Observación', type: 'textarea' }],
    canEdit: o => o.estado !== 'Pagado',
    onEdit: o => { const [d, m, y] = String(o.venc).split('/'); const x = new Date(+y, m - 1, +d); if (!isNaN(x)) { o.dias = Math.round((x - new Date(2026, 7, 18)) / 864e5); if (o.estado !== 'Programado') o.estado = o.dias < 0 ? 'Vencida' : 'Por pagar'; } },
    anular: true, anularLabel: 'Anular obligación (nota de crédito)', canAnular: o => (o.estado === 'Por pagar' || o.estado === 'Vencida') && !o.cp,
    extra: o => [
      ...(o.estado === 'Por pagar' || o.estado === 'Vencida' ? [{ icon: 'fa-calendar-check', label: 'Programar pago', fn: x => { programar(x); SIGA.ui.closeModal(); SIGA.ui.toast('Pago de ' + x.doc + ' programado · visible en Tesorería'); SIGA.refresh(); } }] : []),
      ...(!o.cp && o.estado !== 'Pagado' && o.estado !== 'Anulado' ? [{ icon: 'fa-arrow-right-to-bracket', label: 'Enviar a Tesorería (girar)', fn: aTesoreria }] : []),
      ...(o.cp ? [{ icon: 'fa-money-check-dollar', label: 'Ver comprobante de pago', fn: x => { const c = SIGA.data.tesoreria.cp.find(k => k.doc === x.cp); if (c) SIGA.ui.rec(SIGA.recs.cp).ver(c); } }] : []),
      ...(o.estado !== 'Pagado' && o.estado !== 'Anulado' ? [{ icon: 'fa-scale-unbalanced', label: 'Aplicar penalidad por mora', menuOnly: true, fn: x => SIGA.modules.ctaper.penalidad(x) }] : []),
      { icon: 'fa-file-contract', label: 'Constancia de deuda / pago', menuOnly: true, fn: x => SIGA.ui.rec(oblRec).imprimir(x) }
    ],
    print: o => { const U = SIGA.ui; return { tipo: o.estado === 'Pagado' ? 'Constancia de pago a proveedor' : 'Constancia de obligación pendiente', num: o.doc, pairs: [['Proveedor', U.esc(o.prov), 1], ['RUC', o.ruc], ['Devengado', o.dev], ['Emisión', o.emision], ['Vencimiento', o.venc], ['Estado', o.estado], ['Comprobante de pago', o.cp || '—']], body: dtbl([['Concepto'], ['Importe S/', 1]], [[o.tipo + ' ' + o.doc, U.money(o.imp, '')]]) + `<p class="mini">${U.montoLetras(o.imp)}</p>` }; }
  };
  const judRec = {
    mod: 'Cuentas por pagar', tipo: 'Constancia de retención judicial', office: 'Oficina de Recursos Humanos · Tesorería', key: r => r.exp, title: r => 'Mandato ' + r.exp, cls: false, anuladoValor: 'Levantado',
    fields: j => { const U = SIGA.ui, t = j.concepto.startsWith('Pensión') ? 60 : 33.3; return [['Expediente', `<span class="code">${j.exp}</span>`], ['Trabajador', j.trab], ['Concepto', j.concepto], ['Porcentaje', j.pct + '% (tope ' + t + '%)'], ['Neto base', U.money(j.base)], ['Retención mensual', `<b>${U.money(j.monto)}</b>`], ['Depósito a', j.benef, 1], ['Estado', U.tag(j.estado || 'Vigente', j.estado === 'Levantado' ? 't-gray' : 't-green')]]; },
    body: j => { const U = SIGA.ui; return `<div class="lbl-s mt mb">Depósitos de los últimos meses</div>` + U.table([{ k: 0, label: 'Planilla' }, { k: 1, label: 'Depósito', r: true, render: x => U.money(x[1]) }, { k: 2, label: 'Operación', cls: 'mini' }], ['Agosto 2026', 'Julio 2026', 'Junio 2026', 'Mayo 2026'].map((m, i) => [m, j.monto, i ? 'BN-OP ' + (48812 - i * 311) : 'programado'])); },
    edit: [{ k: 'pct', label: 'Porcentaje ordenado %', type: 'number', span: 1 }, { k: 'base', label: 'Neto base S/', type: 'number', span: 1 }, { k: 'benef', label: 'Cuenta del beneficiario' }],
    canEdit: j => j.estado !== 'Levantado',
    onEdit: j => { const t = j.concepto.startsWith('Pensión') ? 60 : 33.3; if (j.pct > t) { j.pct = t; SIGA.ui.toast('El porcentaje se ajustó al tope legal de ' + t + '%', 'err'); } j.monto = Math.round(j.base * j.pct) / 100; },
    anular: true, anularLabel: 'Levantar mandato', canAnular: j => j.estado !== 'Levantado',
    print: j => ({ pairs: [['Expediente', j.exp], ['Trabajador', j.trab], ['Concepto', j.concepto], ['Porcentaje', j.pct + '%'], ['Retención mensual', SIGA.ui.money(j.monto)], ['Beneficiario', j.benef, 1]], body: `<p>Se deja constancia de que la Universidad Nacional Agraria de la Selva retiene y deposita mensualmente el monto indicado en cumplimiento del mandato judicial.</p>` })
  };
  const bucket = o => o.dias >= 0 ? 'Por vencer' : -o.dias <= 30 ? '1–30 días' : -o.dias <= 60 ? '31–60 días' : -o.dias <= 90 ? '61–90 días' : 'Más de 90 días';
  const B = ['Por vencer', '1–30 días', '31–60 días', '61–90 días', 'Más de 90 días'];
  const pend = () => C.obligaciones.filter(o => o.estado !== 'Pagado');

  SIGA.registerModule('ctaper', {
    title: 'Cuentas por pagar', icon: 'fa-file-invoice', group: 'Ejecución del gasto',
    alerts() {
      const v = C.obligaciones.filter(o => o.estado === 'Vencida');
      return v.length ? [{ lvl: 'crit', icon: 'fa-file-invoice', t: `${v.length} obligaciones vencidas con proveedores`, d: SIGA.ui.money(v.reduce((s, o) => s + o.imp, 0)) + ' · riesgo de intereses y reclamos', fn: () => SIGA.showTab(document.getElementById('mod-root'), 'c', 'aging') }] : [];
    },
    search(q) { return C.obligaciones.filter(o => (o.doc + ' ' + o.prov + ' ' + o.ruc + ' ' + o.dev).toLowerCase().includes(q)).map(o => ({ t: o.doc + ' · ' + SIGA.ui.money(o.imp), d: o.prov + ' · ' + o.estado })); },
    render(el) {
      const U = SIGA.ui, P = pend(), tot = P.reduce((s, o) => s + o.imp, 0), venc = P.filter(o => o.estado === 'Vencida');
      el.innerHTML = `
      <div class="page-head"><div><h1>Cuentas por pagar</h1><p>Obligaciones con proveedores por vencimiento · antigüedad de la deuda · retenciones por mandato judicial</p></div>
        <button class="btn" id="c-no"><i class="fa-solid fa-plus"></i> Registrar obligación</button></div>
      ${U.kpis([
        { lab: 'Por pagar', val: U.money(tot), sub: P.length + ' obligaciones en la muestra', color: 'var(--danger)' },
        { lab: 'Proveedores con deuda', val: C.totalesInst.proveedores, sub: 'acreedores institucionales' },
        { lab: 'Retenciones judiciales', val: U.money(C.totalesInst.retencionMes), sub: C.totalesInst.mandatos + ' mandatos · agosto' },
        { lab: 'Vencidas', val: venc.length, sub: U.money(venc.reduce((s, o) => s + o.imp, 0)), chip: 'atender', chipType: 'warn' }
      ])}
      <div class="seg-tabs" data-group="c"><button class="on" data-tab="obl">Obligaciones</button><button data-tab="aging">Antigüedad de deuda</button><button data-tab="cal">Calendario de vencimientos</button><button data-tab="jud">Retenciones judiciales</button></div>
      <div class="subpanel show" data-group="c" data-panel="obl"><div class="card"><h3><span class="dot"></span>Obligaciones pendientes <span class="grow">programar → enviar a Tesorería → girar → pagar</span></h3><div id="c-tobl"></div></div></div>
      <div class="subpanel" data-group="c" data-panel="aging" id="c-p-aging"></div>
      <div class="subpanel" data-group="c" data-panel="cal" id="c-p-cal"></div>
      <div class="subpanel" data-group="c" data-panel="jud" id="c-p-jud"></div>`;
      el.querySelector('#c-no').addEventListener('click', () => this.nueva());
      this.paintObl(); this.paintAging(); this.paintCal(); this.paintJud();
    },
    paintObl() {
      const U = SIGA.ui;
      document.getElementById('c-tobl').innerHTML = U.grid({
        id: 'cxp-obl', title: 'obligaciones', export: 'obligaciones_por_pagar', rows: C.obligaciones, record: oblRec, pageSize: 12,
        filter: { label: 'Estado', get: r => r.estado },
        cols: [
          { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span><div class="mini">${r.tipo}</div>` }, { k: 'prov', label: 'Proveedor', render: r => U.esc(r.prov) + (r.obs ? `<div class="mini" style="color:#b45309">${U.esc(r.obs)}</div>` : ''), csv: r => r.prov },
          { k: 'dev', label: 'Devengado', render: r => `<span class="code">${r.dev}</span>` }, { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) },
          { k: 'venc', label: 'Vencimiento', sv: r => r.dias, render: r => r.venc + `<div class="mini" style="color:${r.dias < 0 && r.estado !== 'Pagado' ? 'var(--danger)' : 'var(--muted)'}">${r.dias < 0 ? 'hace ' + (-r.dias) + ' días' : 'en ' + r.dias + ' días'}</div>` },
          { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, ECLS[r.estado]) + (r.cp ? `<div class="mini">${r.cp}</div>` : '') }
        ],
        rowCls: r => r.estado === 'Vencida' ? 'row-bad' : (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [
          { icon: 'fa-calendar-check', title: 'Programar pago', show: r => r.estado === 'Por pagar' || r.estado === 'Vencida', fn: o => { programar(o); U.toast('Pago de ' + o.doc + ' programado · visible en Tesorería'); SIGA.refresh(); } },
          { icon: 'fa-arrow-right-to-bracket', title: 'Enviar a Tesorería para girado', show: r => !r.cp && r.estado !== 'Pagado' && r.estado !== 'Anulado', fn: aTesoreria }
        ],
        tools: [{ icon: 'fa-plus', label: 'Registrar obligación', primary: true, fn: () => this.nueva() }],
        bulk: [
          { icon: 'fa-calendar-check', label: 'Programar pago', fn: rs => { const x = rs.filter(o => o.estado === 'Por pagar' || o.estado === 'Vencida'); x.forEach(programar); U.toast(x.length + ' obligaciones programadas · ' + U.money(x.reduce((s, o) => s + o.imp, 0))); SIGA.refresh(); } },
          { icon: 'fa-envelope', label: 'Estado de cuenta a proveedores', fn: rs => U.mail({ asunto: 'Estado de cuenta · UNAS · ' + [...new Set(rs.map(o => o.prov))].length + ' proveedor(es)', adj: 'estado_cuenta_proveedores.pdf', to: 'proveedores@unas.edu.pe' }) }
        ],
        foot: rs => { const p = rs.filter(o => o.estado !== 'Pagado' && o.estado !== 'Anulado'); return `<tr><td colspan="4" class="r"><b>Pendiente de pago (${p.length})</b></td><td class="r num"><b>${U.money(p.reduce((s, o) => s + o.imp, 0))}</b></td><td colspan="3"></td></tr>`; }
      });
    },
    penalidad(o) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-scale-unbalanced"></i> Penalidad por mora · ' + o.doc, [
        { k: 'dias', label: 'Días de atraso en la entrega', type: 'number', value: 5, span: 1 }, { k: 'plazo', label: 'Plazo contractual (días)', type: 'number', value: 30, span: 1 },
        { k: 'info', label: 'Fórmula (RLCE art. 162)', value: 'Penalidad diaria = 0.10 × monto / (F × plazo) · F = 0.40', ro: true }
      ], v => {
        const d = +v.dias || 0, pl = +v.plazo || 1, pen = Math.min(o.imp * 0.1, Math.round(d * 0.10 * o.imp / (0.40 * pl) * 100) / 100);
        if (d <= 0) { U.toast('Indique los días de atraso', 'err'); return; }
        const antes = o.imp; o.imp = Math.round((o.imp - pen) * 100) / 100; o.obs = 'Penalidad por mora ' + d + ' días · ' + U.money(pen);
        SIGA.log('Cuentas por pagar', 'Aplicación de penalidad', o.doc, U.money(antes), U.money(o.imp) + ' · penalidad ' + U.money(pen));
        U.closeModal(); U.toast('Penalidad de ' + U.money(pen) + ' aplicada a ' + o.doc + ' (tope 10%)'); SIGA.refresh();
      }, 'Aplicar penalidad');
    },
    paintAging() {
      const U = SIGA.ui, P = pend();
      const tot = B.map(b => P.filter(o => bucket(o) === b).reduce((s, o) => s + o.imp, 0));
      document.getElementById('c-p-aging').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Antigüedad de la deuda <span class="grow">soles · por tramo de vencimiento</span></h3>
        ${U.chart.cols({ labels: B, series: [{ name: 'Importe', data: tot }], fmt: v => U.money(v), axFmt: v => U.int(v / 1000) + 'k', h: 230 })}</div>
        <div class="card"><h3><span class="dot"></span>Resumen por tramo</h3>${B.map((b, i) => `<div class="ef-row"><span>${b}</span><b class="${i > 0 && tot[i] ? 'neg' : ''}">${U.money(tot[i])}</b></div>`).join('')}
          <div class="ef-row tot"><span>Total</span><span>${U.money(tot.reduce((s, x) => s + x, 0))}</span></div>
          <p class="mini mt">Las obligaciones de más de 60 días suelen estar observadas (sin conformidad o con penalidad). El sistema las identifica para regularizarlas.</p></div></div>`;
    },
    paintCal() {
      const U = SIGA.ui, P = pend().filter(o => o.dias >= 0);
      const sem = [['17 – 23 ago', 0, 5], ['24 – 30 ago', 6, 12], ['31 ago – 6 set', 13, 19], ['7 – 13 set', 20, 26], ['14 – 20 set', 27, 33]];
      const host = document.getElementById('c-p-cal');
      host.onclick = e => { const c = e.target.closest('[data-ob]'); if (c) U.rec(oblRec).ver(C.obligaciones.find(o => o.doc === c.dataset.ob)); };
      host.innerHTML = `<div class="grid cols-5">${sem.map(s => { const os = P.filter(o => o.dias >= s[1] && o.dias <= s[2]); return `<div class="card"><h3><span class="dot"></span>${s[0]}</h3><div class="big-n" style="font-size:20px">${U.money(os.reduce((a, o) => a + o.imp, 0))}</div><div class="mini mb">${os.length} obligación(es)</div>${os.map(o => `<div class="mini-card mb clickable" data-ob="${U.esc(o.doc)}"><b style="font-size:11.5px">${o.prov}</b><div class="s">${o.doc} · vence ${o.venc}</div><div class="row-flex" style="justify-content:space-between"><b>${U.money(o.imp)}</b>${U.tag(o.estado, ECLS[o.estado])}</div></div>`).join('')}</div>`; }).join('')}</div>`;
    },
    paintJud() {
      const U = SIGA.ui;
      document.getElementById('c-p-jud').innerHTML = `<div class="card"><h3><span class="dot"></span>Retenciones por mandato judicial <span class="grow">R-07 · se descuentan en planilla con su tope legal y Tesorería las deposita</span></h3><div id="j-t"></div>
        <div class="row-flex mt"><button class="btn sm" id="j-new"><i class="fa-solid fa-plus"></i> Registrar mandato</button><span class="mini">Enlazado con Planillas (tabla <code>movjud</code>): la retención se aplica sobre el neto y se deposita al beneficiario.</span></div></div>`;
      document.getElementById('j-t').innerHTML = U.grid({ id: 'cxp-jud', title: 'mandatos judiciales', export: 'mandatos_judiciales', rows: C.judiciales, record: judRec, filter: { label: 'Concepto', get: r => r.concepto },
        cols: [
          { k: 'exp', label: 'Expediente', render: r => `<span class="code">${r.exp}</span>` }, { k: 'trab', label: 'Trabajador' }, { k: 'concepto', label: 'Concepto' },
          { k: 'pct', label: '% ret.', r: true, render: r => r.pct + '%' }, { k: 'monto', label: 'Monto mes', r: true, render: r => U.money(r.monto) },
          { k: 'tope', label: 'Tope legal', nosort: true, render: r => { const t = r.concepto.startsWith('Pensión') ? 60 : 33.3; return r.pct <= t ? U.tag('✓ dentro del tope (' + t + '%)', 't-green') : U.tag('excede el tope', 't-red'); } },
          { k: 'benef', label: 'Depósito a', cls: 'mini' }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado || 'Vigente', r.estado === 'Levantado' ? 't-gray' : 't-green') }
        ],
        rowCls: r => r.estado === 'Levantado' ? 'row-void' : '',
        foot: rs => `<tr><td colspan="4" class="r"><b>Retención mensual vigente</b></td><td class="r num"><b>${U.money(rs.filter(r => r.estado !== 'Levantado').reduce((s, r) => s + r.monto, 0))}</b></td><td colspan="4"></td></tr>` });
      document.getElementById('j-new').addEventListener('click', () => {
        U.bigForm({
          title: 'Registrar mandato judicial', icon: 'fa-gavel', size: '',
          sections: [{ title: 'Mandato', cols: 2, fields: [
            { k: 'exp', label: 'Expediente judicial', value: 'EXP-', required: true, span: 1 }, { k: 'trab', label: 'Trabajador', value: '••', required: true, span: 1 },
            { k: 'concepto', label: 'Concepto', type: 'select', options: ['Pensión de alimentos', 'Embargo por deuda civil'], span: 1 }, { k: 'pct', label: 'Porcentaje ordenado %', type: 'number', value: 30, span: 1 },
            { k: 'base', label: 'Neto base del trabajador S/', type: 'number', value: 3000, span: 1 }, { k: 'benef', label: 'Cuenta del beneficiario', value: 'cta. BN ••', span: 1 }
          ] }],
          status: (r, v) => { const t = v.concepto.startsWith('Pensión') ? 60 : 33.3, p = +v.pct || 0; return `<div class="note ${p > t ? 'warn' : 'teal'}"><i class="fa-solid ${p > t ? 'fa-ban' : 'fa-circle-check'}"></i><div>${p > t ? `El porcentaje excede el tope legal de ${t}% para "${v.concepto}". No puede registrarse.` : `Dentro del tope legal de ${t}%. Retención mensual: <b>${U.money((+v.base || 0) * p / 100)}</b>.`}</div></div>`; },
          submitLabel: 'Registrar mandato',
          onSubmit: v => {
            const t = v.concepto.startsWith('Pensión') ? 60 : 33.3, p = +v.pct || 0;
            if (p > t) { U.toast('Excede el tope legal', 'err'); return; }
            C.judiciales.unshift({ exp: v.exp, trab: v.trab, concepto: v.concepto, pct: p, base: +v.base || 0, monto: (+v.base || 0) * p / 100, benef: v.benef });
            SIGA.log('Cuentas por pagar', 'Registro de mandato judicial', v.exp, '—', p + '% · ' + v.trab);
            U.closeModal(); SIGA.refresh(); U.toast('Mandato ' + v.exp + ' registrado · se aplicará en la próxima planilla');
          }
        });
      });
    },
    nueva() {
      const U = SIGA.ui;
      U.bigForm({
        title: 'Registrar obligación por pagar', icon: 'fa-file-invoice',
        sections: [
          { title: 'Comprobante del proveedor', cols: 3, fields: [
            { k: 'tipo', label: 'Tipo', type: 'select', options: ['Factura', 'RH', 'Nota de crédito'], span: 1 }, { k: 'doc', label: 'Serie-número', value: '', required: true, ph: 'F001-000000', span: 1 },
            { k: 'emision', label: 'Emisión', type: 'date', value: SIGA.ctx.hoyISO, span: 1 }, { k: 'prov', label: 'Proveedor', value: '', required: true, span: 2 }, { k: 'ruc', label: 'RUC', value: '', span: 1 }
          ] },
          { title: 'Devengado y vencimiento', cols: 3, fields: [
            { k: 'dev', label: 'Devengado SIAF', value: 'DEV 2026-0', span: 1 }, { k: 'plazo', label: 'Plazo de pago (días)', type: 'number', value: 15, span: 1 },
            { k: 'prioridad', label: 'Prioridad', type: 'select', options: ['Normal', 'Urgente', 'Programada'], span: 1 }, { k: 'imp', label: 'Importe S/', type: 'number', value: 0, required: true, span: 1 }
          ] }
        ],
        submitLabel: 'Registrar obligación',
        onSubmit: v => {
          const d = parseInt(v.plazo, 10) || 0, x = new Date(v.emision + 'T12:00:00'); x.setDate(x.getDate() + d);
          const hoy = new Date(SIGA.ctx.hoyISO + 'T12:00:00'), dias = Math.round((x - hoy) / 864e5);
          C.obligaciones.unshift({ doc: v.doc, tipo: v.tipo, prov: v.prov, ruc: v.ruc, dev: v.dev, imp: parseFloat(v.imp) || 0, emision: U.dmy(v.emision), venc: U.dmy(x.toISOString().slice(0, 10)), dias, estado: dias < 0 ? 'Vencida' : 'Por pagar', prioridad: v.prioridad, nuevo: true });
          SIGA.log('Cuentas por pagar', 'Registro de obligación', v.doc, '—', U.money(parseFloat(v.imp) || 0));
          U.closeModal(); SIGA.refresh(); U.toast('Obligación ' + v.doc + ' registrada');
        }
      });
    }
  });
})();
