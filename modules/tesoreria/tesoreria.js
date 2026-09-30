/* ============================================================
   Tesorería · "Girar sin recalcular: retenciones y detracciones las hace el sistema"
   ============================================================ */
(function () {
  const T = SIGA.data.tesoreria;
  const spotPct = s => (T.spot.find(x => x[0] === s) || [0, 0])[1];
  const ECLS = { Girado: 't-blue', Pagado: 't-green', Anulado: 't-red' };
  const CHCLS = { 'En cartera': 't-amber', Entregado: 't-blue', Cobrado: 't-green', Anulado: 't-gray' };

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
      document.getElementById('t-tcp').innerHTML = U.table([
        { k: 'doc', label: 'N° C/P', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
        { k: 'benef', label: 'Beneficiario', render: r => r.benef + `<div class="mini">${r.concepto}</div>` }, { k: 'medio', label: 'Medio', render: r => r.medio + `<div class="mini">${r.ref}</div>` },
        { k: 'bruto', label: 'Bruto', r: true, render: r => U.money(r.bruto, '') },
        { k: 'ret', label: 'Detracción / retención', r: true, render: r => (r.detr || r.ret) ? `<span class="saldo-neg">−${U.money(r.detr + r.ret, '')}</span>` : '—' },
        { k: 'neto', label: 'Neto', r: true, render: r => `<b>${U.money(r.neto, '')}</b>` },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, ECLS[r.estado]) }
      ], T.cp, {
        onRow: c => this.ver(c), rowCls: r => r.nuevo ? 'row-new' : '',
        actions: [{ icon: 'fa-circle-check', title: 'Confirmar pago (Tesorero)', show: r => r.estado === 'Girado', fn: c => this.pagar(c) }, { icon: 'fa-eye', title: 'Ver', fn: c => this.ver(c) }]
      });
    },
    ver(c) {
      const U = SIGA.ui;
      const b = U.detail('Comprobante de pago ' + c.doc, [['Beneficiario', c.benef], ['RUC / DNI', c.ruc], ['Concepto', c.concepto], ['Fecha de giro', c.fecha], ['Medio de pago', c.medio + ' · ' + c.ref], ['Importe bruto', U.money(c.bruto)], ['Detracción (SPOT)', c.detr ? U.money(c.detr) + ' · ' + (c.spot || '') : '—'], ['Retención renta 4.ª', c.ret && !c.medio.startsWith('Abono masivo') ? U.money(c.ret) : '—'], ['Neto girado', `<b>${U.money(c.neto)}</b>`], ['Registró / Confirmó', (c.user || '—') + ' / ' + (c.aprob || '—')], ['Estado', U.tag(c.estado, ECLS[c.estado])]],
        `<button class="btn ghost" data-close>Cerrar</button>${c.estado === 'Girado' ? '<button class="btn" id="cp-pay"><i class="fa-solid fa-circle-check"></i> Confirmar pago</button>' : ''}`,
        `<div class="mf-note">${U.montoLetras(c.neto)}</div>`);
      b.querySelector('#cp-pay')?.addEventListener('click', () => { U.closeModal(); this.pagar(c); });
    },
    pagar(c) {
      const U = SIGA.ui;
      if (!SIGA.sod(c.user, 'cp.pagar')) return;
      c.estado = 'Pagado'; c.aprob = SIGA.ctx.user.nombre;
      SIGA.siaf('Pagado', c.doc, c.neto);
      const a = SIGA.asiento('Pago ' + c.doc + ' · ' + c.benef, [['2103', c.bruto, 0], ['1101', 0, c.neto], ...(c.detr + c.ret ? [['2101', 0, c.detr + c.ret]] : [])], 'Tesorería');
      const b = T.bancos[0]; b.libros -= c.neto;
      SIGA.data.presupuesto.fases.pag += c.bruto;
      if (c.cert) { const ce = SIGA.ppto.cert(c.cert); if (ce && ce.fase === 'Girado') { ce.fase = 'Pagado'; SIGA.exp?.stage(ce.exp, 'pag', c.doc, 'abono confirmado'); } }
      const ob = SIGA.data.ctaper?.obligaciones.find(o => o.cp === c.doc); if (ob) ob.estado = 'Pagado';
      SIGA.log('Tesorería', 'Pago confirmado', c.doc, 'Girado', 'Pagado');
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
      document.getElementById('pg-t').innerHTML = U.table([
        { k: 'venc', label: 'Vence', render: r => r.venc + `<div class="mini" style="color:${r.dias < 0 ? 'var(--danger)' : r.dias <= 7 ? '#b45309' : 'var(--muted)'}">${r.dias < 0 ? 'vencida hace ' + (-r.dias) + ' d' : 'en ' + r.dias + ' d'}</div>` },
        { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'prov', label: 'Proveedor' },
        { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) },
        { k: 'pri', label: 'Prioridad', render: r => U.tag(r.prioridad, r.prioridad === 'Urgente' ? 't-red' : r.prioridad === 'Normal' ? 't-blue' : 't-gray') },
        { k: 'cob', label: 'Cobertura', render: r => { disp -= r.imp; return disp >= 0 ? U.tag('Con fondos', 't-green') : U.tag('Sin fondos · reprogramar', 't-red'); } },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.cls || (r.estado === 'Vencida' ? 't-red' : r.estado === 'Programado' ? 't-blue' : 't-amber')) }
      ], rows, { actions: [{ icon: 'fa-money-check-dollar', title: 'Girar', show: r => !r.cp, fn: o => this.nuevoCP(o) }] });
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
          ${K.hecho ? `<div class="note teal mt" style="margin-bottom:0"><i class="fa-solid fa-circle-check"></i><div>Conciliación cuadrada · acta generada.</div></div>` : `<div class="note amber mt"><i class="fa-solid fa-magnifying-glass"></i><div>${K.extracto.filter(e => mE.has(e[3])).length} partidas emparejadas automáticamente. Queda 1 cargo bancario por registrar en libros.</div></div><button class="btn" id="cc-reg"><i class="fa-solid fa-pen-to-square"></i> Registrar cargo y cerrar conciliación</button>`}</div></div>`;
      document.getElementById('cc-reg')?.addEventListener('click', () => {
        b.libros -= tN; K.hecho = true;
        SIGA.asiento('Comisión bancaria · conciliación agosto ' + b.cta, [['5302', tN, 0], ['1101', 0, tN]], 'Tesorería');
        SIGA.log('Tesorería', 'Conciliación bancaria', b.cta + ' · agosto 2026', 'Diferencia ' + U.money(tN), 'Diferencia S/ 0.00');
        U.toast('Conciliación de ' + b.cta + ' cuadrada · diferencia S/ 0.00'); SIGA.refresh();
      });
    },
    paintBan() {
      const U = SIGA.ui, tl = T.bancos.reduce((s, b) => s + b.libros, 0), te = T.bancos.reduce((s, b) => s + b.extracto, 0);
      document.getElementById('t-tban').innerHTML = U.table([
        { k: 'banco', label: 'Banco' }, { k: 'cta', label: 'Cuenta', render: r => `<span class="code">${r.cta}</span>` }, { k: 'fte', label: 'Fuente' }, { k: 'tipo', label: 'Tipo' },
        { k: 'libros', label: 'Saldo libros', r: true, render: r => U.money(r.libros, '') }, { k: 'extracto', label: 'Saldo banco', r: true, render: r => U.money(r.extracto, '') },
        { k: 'd', label: 'Estado', render: r => Math.abs(r.libros - r.extracto) < 0.005 ? U.tag('Conciliada', 't-green') : U.tag('Por conciliar', 't-amber') }
      ], T.bancos, { foot: `<tr><td colspan="4" class="r" style="font-weight:700">Total disponible</td><td class="r num" style="font-weight:800;color:var(--primary-dark)">${U.money(tl, '')}</td><td class="r num" style="font-weight:700">${U.money(te, '')}</td><td></td></tr>` });
    },
    paintChq() {
      const U = SIGA.ui;
      document.getElementById('t-tchq').innerHTML = U.table([
        { k: 'num', label: 'Cheque', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'benef', label: 'Beneficiario' },
        { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto, '') }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, CHCLS[r.estado]) }
      ], T.cheques, {
        rowCls: r => r.nuevo ? 'row-new' : '',
        actions: [{ icon: 'fa-hand-holding', title: 'Registrar entrega', show: r => r.estado === 'En cartera', fn: r => { r.estado = 'Entregado'; SIGA.log('Tesorería', 'Entrega de cheque', r.num, 'En cartera', 'Entregado · ' + r.benef); SIGA.ui.toast('Cheque ' + r.num + ' entregado a ' + r.benef); SIGA.refresh(); } }]
      });
    },
    paintAbono() {
      const U = SIGA.ui, A = T.abono, tot = A.reduce((s, r) => s + r[3], 0);
      const txt = ['H|20161749126|UNAS|' + SIGA.ctx.hoy.replace(/\//g, '') + '|' + A.length + '|' + tot.toFixed(2)].concat(A.map((r, i) => `D|${String(i + 1).padStart(4, '0')}|${r[1]}|${r[2].replace(/-/g, '')}|${r[3].toFixed(2).padStart(12, '0')}|${r[0].toUpperCase().slice(0, 30)}`)).join('\n');
      document.getElementById('t-p-abo').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Lote de abono en cuenta <span class="grow">T-10 · proveedores y planillas sin cheques</span></h3>${U.table([{ k: 0, label: 'Beneficiario' }, { k: 1, label: 'RUC/DNI', render: r => `<span class="code">${r[1]}</span>` }, { k: 2, label: 'CCI', cls: 'mini' }, { k: 3, label: 'Importe', r: true, render: r => U.money(r[3], '') }], A, { foot: `<tr><td colspan="3" class="r" style="font-weight:700">Total del lote</td><td class="r num" style="font-weight:800">${U.money(tot, '')}</td></tr>` })}</div>
        <div class="card"><h3><span class="dot"></span>Archivo generado para el banco</h3><div class="txtfile">${U.esc(txt)}</div>
          <div class="row-flex mt"><button class="btn" id="ab-send"><i class="fa-solid fa-paper-plane"></i> Enviar lote al banco</button><button class="btn ghost" onclick="SIGA.ui.toast('Archivo descargado')"><i class="fa-solid fa-download"></i> Descargar .txt</button></div></div></div>`;
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
          <button class="btn sm mt" onclick="SIGA.go('ctaper',{c:'jud'})"><i class="fa-solid fa-gavel"></i> Ver mandatos</button></div></div>`;
    }
  });
})();
