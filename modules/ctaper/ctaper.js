/* Cuentas por pagar · obligaciones por proveedor y vencimiento, antigüedad y mandatos judiciales */
(function () {
  const C = SIGA.data.ctaper;
  const ECLS = { 'Por pagar': 't-amber', Programado: 't-blue', Vencida: 't-red', Pagado: 't-green' };
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
      document.getElementById('c-tobl').innerHTML = U.table([
        { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span><div class="mini">${r.tipo}</div>` }, { k: 'prov', label: 'Proveedor', render: r => r.prov + (r.obs ? `<div class="mini" style="color:#b45309">${r.obs}</div>` : '') },
        { k: 'dev', label: 'Devengado', render: r => `<span class="code">${r.dev}</span>` }, { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) },
        { k: 'venc', label: 'Vencimiento', render: r => r.venc + `<div class="mini" style="color:${r.dias < 0 ? 'var(--danger)' : 'var(--muted)'}">${r.dias < 0 ? 'hace ' + (-r.dias) + ' días' : 'en ' + r.dias + ' días'}</div>` },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, ECLS[r.estado]) + (r.cp ? `<div class="mini">${r.cp}</div>` : '') }
      ], C.obligaciones, {
        rowCls: r => r.estado === 'Vencida' ? 'row-bad' : r.nuevo ? 'row-new' : '',
        actions: [
          { icon: 'fa-calendar-check', title: 'Programar pago', show: r => r.estado === 'Por pagar' || r.estado === 'Vencida', fn: o => { const a = o.estado; o.estado = 'Programado'; o.prioridad = a === 'Vencida' ? 'Urgente' : o.prioridad; SIGA.log('Cuentas por pagar', 'Programación de pago', o.doc, a, 'Programado'); SIGA.ui.toast('Pago de ' + o.doc + ' programado · visible en Tesorería'); SIGA.refresh(); } },
          { icon: 'fa-arrow-right-to-bracket', title: 'Enviar a Tesorería para girado', show: r => !r.cp && r.estado !== 'Pagado', fn: o => { SIGA.go('tesoreria'); setTimeout(() => SIGA.modules.tesoreria.nuevoCP(o), 80); } }
        ]
      });
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
      document.getElementById('c-p-cal').innerHTML = `<div class="grid cols-5">${sem.map(s => { const os = P.filter(o => o.dias >= s[1] && o.dias <= s[2]); return `<div class="card"><h3><span class="dot"></span>${s[0]}</h3><div class="big-n" style="font-size:20px">${U.money(os.reduce((a, o) => a + o.imp, 0))}</div><div class="mini mb">${os.length} obligación(es)</div>${os.map(o => `<div class="mini-card mb"><b style="font-size:11.5px">${o.prov}</b><div class="s">${o.doc} · vence ${o.venc}</div><div class="row-flex" style="justify-content:space-between"><b>${U.money(o.imp)}</b>${U.tag(o.estado, ECLS[o.estado])}</div></div>`).join('')}</div>`; }).join('')}</div>`;
    },
    paintJud() {
      const U = SIGA.ui;
      document.getElementById('c-p-jud').innerHTML = `<div class="card"><h3><span class="dot"></span>Retenciones por mandato judicial <span class="grow">R-07 · se descuentan en planilla con su tope legal y Tesorería las deposita</span></h3><div id="j-t"></div>
        <div class="row-flex mt"><button class="btn sm" id="j-new"><i class="fa-solid fa-plus"></i> Registrar mandato</button><span class="mini">Enlazado con Planillas (tabla <code>movjud</code>): la retención se aplica sobre el neto y se deposita al beneficiario.</span></div></div>`;
      document.getElementById('j-t').innerHTML = U.table([
        { k: 'exp', label: 'Expediente', render: r => `<span class="code">${r.exp}</span>` }, { k: 'trab', label: 'Trabajador' }, { k: 'concepto', label: 'Concepto' },
        { k: 'pct', label: '% ret.', r: true, render: r => r.pct + '%' }, { k: 'monto', label: 'Monto mes', r: true, render: r => U.money(r.monto) },
        { k: 'tope', label: 'Tope legal', render: r => { const t = r.concepto.startsWith('Pensión') ? 60 : 33.3; return r.pct <= t ? U.tag('✓ dentro del tope (' + t + '%)', 't-green') : U.tag('excede el tope', 't-red'); } },
        { k: 'benef', label: 'Depósito a', cls: 'mini' }
      ], C.judiciales);
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
