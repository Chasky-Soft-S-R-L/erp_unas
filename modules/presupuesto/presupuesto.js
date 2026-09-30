/* ============================================================
   Planificación y Presupuesto · procesos P-01 a P-14
   Regla de oro (4.2.1): el saldo SE CALCULA, no se almacena, y la
   certificación se valida de forma transaccional y BLOQUEANTE.
   ============================================================ */
(function () {
  const D = SIGA.data.presupuesto;
  const FASES = ['Pendiente de aprobación', 'Certificado', 'Comprometido', 'Devengado', 'Girado', 'Pagado'];
  const FCLS = { 'Pendiente de aprobación': 't-amber', Certificado: 't-teal', Comprometido: 't-blue', Devengado: 't-blue', Girado: 't-green', Pagado: 't-green', Anulada: 't-red' };
  const FTE = { '00': 'RO', '09': 'RDR', '13': 'DyT', '18': 'Canon' };
  const vigente = c => c.fase !== 'Anulada';
  // Certificado histórico no listado (para que el saldo resulte de la suma de movimientos)
  D.marco.forEach(m => { m.hist = m.certTotal - D.certificaciones.filter(c => c.marco === m.id && vigente(c)).reduce((s, c) => s + c.monto, 0); });
  D.certificaciones.forEach(c => { if (c.comp == null) c.comp = FASES.indexOf(c.fase) >= 2 ? c.monto : 0; });

  const api = {
    FASES, FCLS, FTE,
    marco: id => D.marco.find(m => m.id === id),
    certificado: m => m.hist + D.certificaciones.filter(c => c.marco === m.id && vigente(c)).reduce((s, c) => s + c.monto, 0),
    saldo: m => m.pim - api.certificado(m),
    label: m => `${m.id} · ${FTE[m.fte]} · Meta ${m.meta} · ${m.clasif} ${m.desc}`,
    cert: num => D.certificaciones.find(c => c.num === num),
    certSaldo: c => c.monto - (c.comp || 0),
    pim: () => D.fuentes.reduce((s, f) => s + f.pim, 0),
    next: () => SIGA.ui.pad(Math.max(...D.certificaciones.map(c => +c.num)) + 1),
    fuente: cod => D.fuentes.find(f => f.cod === cod),
    genOf: m => D.genericas.find(g => m.clasif.startsWith(g.cod)) || D.genericas[0],
    // Acumula en los totales institucionales la fase alcanzada
    bump(fase, monto, m) {
      const k = { Certificado: 'cert', Comprometido: 'comp', Devengado: 'dev', Girado: 'gir', Pagado: 'pag' }[fase];
      if (k) D.fases[k] += monto;
      if (fase === 'Certificado' && m) api.fuente(m.fte).cert += monto;
      if (fase === 'Devengado' && m) { api.fuente(m.fte).dev += monto; api.genOf(m).dev += monto; }
    },
    // Circuito de recursos propios (CV-10): depósito confirmado → ampliación del crédito fuente 09
    ampliarRDR(monto, ref) {
      const f = api.fuente('09'); f.pim += monto; D.genericas[0].pim += monto;
      const m = api.marco('M04'); if (m) m.pim += monto;
      const n = 'NM-' + SIGA.ui.pad(34 + D.notas.filter(x => x.auto).length, 4);
      D.notas.unshift({ n, fecha: SIGA.ctx.hoy, tipo: 'Ampliación RDR', tipoCls: 't-teal', concepto: 'Ampliación automática por depósito confirmado · ' + ref, fte: '09', hab: monto, anu: 0, estado: 'Aprobada', auto: true });
      SIGA.siaf('Nota modificatoria · RDR', n, monto);
      SIGA.log('Presupuesto', 'Ampliación automática fuente 09', n, 'PIM 09 ' + SIGA.ui.money(f.pim - monto), 'PIM 09 ' + SIGA.ui.money(f.pim));
      return n;
    }
  };
  SIGA.ppto = api;

  const asientoFase = (c, fase) => {
    const m = api.marco(c.marco); const srv = m.clasif.startsWith('2.3.2'), act = m.clasif.startsWith('2.6');
    const gasto = act ? '1503' : srv ? '5302' : '5301';
    if (fase === 'Devengado') return SIGA.asiento('Devengado CCP ' + c.num + ' · ' + m.desc, [[gasto, c.monto, 0], ['2103', 0, c.monto]], 'Presupuesto');
    if (fase === 'Girado') return SIGA.asiento('Girado CCP ' + c.num, [['2103', c.monto, 0], ['1101', 0, c.monto]], 'Tesorería');
    return null;
  };

  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const P = () => SIGA.modules.presupuesto;
  const certRec = SIGA.recs.cert = {
    mod: 'Presupuesto', tipo: 'Certificación de crédito presupuestario', office: 'Oficina de Planificación y Presupuesto', key: c => 'CCP ' + c.num, title: c => 'Certificación N° ' + c.num, estado: 'fase', cls: false, anuladoValor: 'Anulada',
    view: c => P().verCert(c),
    fields: c => { const U = SIGA.ui, m = api.marco(c.marco); return [['Certificado', `<span class="code">${c.num}</span>`], ['Expediente', c.exp], ['Fecha', c.fecha], ['Monto', U.money(c.monto)], ['Centro de costo', m.ccn + ' · ' + m.cc, 1], ['Fuente · Meta', m.fte + ' · ' + api.fuente(m.fte).nom + ' · ' + m.meta], ['Clasificador', m.clasif + ' ' + m.desc], ['Fase', U.tag(c.fase, FCLS[c.fase])], ['Registró / Aprobó', c.user + ' / ' + (c.aprob || '—')], ['Justificación', U.esc(c.just || '—'), 1]]; },
    edit: [{ k: 'just', label: 'Justificación', type: 'textarea' }], canEdit: c => c.fase === 'Pendiente de aprobación',
    anular: true, anularLabel: 'Anular certificación', canAnular: c => ['Pendiente de aprobación', 'Certificado'].includes(c.fase),
    onAnular: (c, mot) => { const m = api.marco(c.marco); if (c.aprob) { SIGA.siaf('Anulación de certificación', 'CCP ' + c.num, -c.monto); D.fases.cert -= c.monto; api.fuente(m.fte).cert -= c.monto; } c.motivo = mot; },
    extra: c => [
      ...(c.fase === 'Pendiente de aprobación' ? [{ icon: 'fa-stamp', label: 'Aprobar (Jefe de P&P)', fn: x => P().aprobar(x) }] : []),
      ...(!['Pendiente de aprobación', 'Pagado', 'Anulada'].includes(c.fase) ? [{ icon: 'fa-forward-step', label: 'Pasar a ' + FASES[FASES.indexOf(c.fase) + 1], fn: x => P().avanzar(x) }] : []),
      ...(c.fase === 'Certificado' ? [{ icon: 'fa-scissors', label: 'Rebaja parcial (libera saldo)', fn: x => P().rebaja(x) }] : []),
      { icon: 'fa-route', label: 'Ver expediente', menuOnly: true, fn: x => { SIGA.ui.closeModal(); SIGA.go('expediente'); setTimeout(() => SIGA.modules.expediente.ver(x.exp), 60); } }
    ],
    print: c => { const U = SIGA.ui, m = api.marco(c.marco), it = c.items || []; return { tipo: 'Certificación de crédito presupuestario', num: c.num, fecha: 'Ejercicio 2026 · ' + c.fecha,
      pairs: [['Unidad ejecutora', '001 · Universidad Nacional Agraria de la Selva'], ['Expediente SIAF', c.siaf || 'por transmitir'], ['Centro de costo', m.cc + ' · ' + m.ccn, 1], ['Fuente de financiamiento', m.fte + ' · ' + api.fuente(m.fte).nom], ['Meta', m.meta], ['Clasificador de gasto', m.clasif + ' · ' + m.desc, 1], ['Fase', c.fase], ['Justificación', U.esc(c.just || '—'), 1]],
      body: (it.length ? dtbl([['Código'], ['Descripción'], ['U.M.'], ['Cant.', 1], ['P. unit.', 1], ['Total', 1]], it.map(r => [r[0], U.esc(r[1]), r[2], r[3], U.money(r[4], ''), U.money(r[3] * r[4], '')])) : '') + dtbl([['Concepto'], ['Importe S/', 1]], [['Monto certificado', '<b>' + U.money(c.monto, '') + '</b>'], ['Saldo de la específica luego de certificar', U.money(api.saldo(m), '')]]) + `<p class="mini">${U.montoLetras(c.monto)}</p>`,
      firmas: [['Registró', c.user], ['Aprobó', c.aprob || 'Jefe de P&P'], ['V.º B.º', 'Dirección General de Administración']] }; }
  };
  const notaRec = {
    mod: 'Presupuesto', tipo: 'Nota modificatoria', office: 'Oficina de Planificación y Presupuesto', key: r => r.n, cls: false,
    fields: r => { const U = SIGA.ui; return [['Nota', `<span class="code">${r.n}</span>`], ['Fecha', r.fecha], ['Tipo', U.tag(r.tipo, r.tipoCls)], ['Fuente', r.fte + ' · ' + (api.fuente(r.fte) || {}).nom], ['Concepto', U.esc(r.concepto), 1], ['Habilita', U.money(r.hab)], ['Anula', U.money(r.anu)], ['Efecto en el PIM', U.money(r.hab - r.anu)], ['Estado', U.tag(r.estado, r.estado === 'Aprobada' ? 't-green' : 't-gray')]]; },
    edit: [{ k: 'concepto', label: 'Concepto' }], canEdit: r => !r.auto,
    anular: true, anularLabel: 'Anular nota (revierte el marco)', canAnular: r => !r.auto && r.estado === 'Aprobada' && r.fecha === SIGA.ctx.hoy,
    onAnular: r => { const f = api.fuente(r.fte); f.pim -= r.hab - r.anu; D.genericas[0].pim -= r.hab - r.anu; SIGA.siaf('Anulación de nota modificatoria', r.n, -(r.hab - r.anu)); },
    print: r => ({ tipo: 'Nota modificatoria presupuestaria', num: r.n, body: dtbl([['Fuente'], ['Concepto'], ['Habilita', 1], ['Anula', 1]], [[r.fte, SIGA.ui.esc(r.concepto), SIGA.ui.money(r.hab, ''), SIGA.ui.money(r.anu, '')]]), firmas: [['Elaboró', 'Analista de Presupuesto'], ['Aprobó', 'M. Ríos · Jefe de P&P'], ['Autoriza', 'Titular del pliego']] })
  };

  SIGA.registerModule('presupuesto', {
    title: 'Presupuesto', icon: 'fa-file-invoice-dollar', group: 'Planificación y Presupuesto', badge: 'SIAF',
    f: 'Todas',
    alerts() {
      const out = [];
      D.marco.forEach(m => {
        const s = api.saldo(m);
        if (s < 0) out.push({ lvl: 'crit', t: `Sobregiro ${m.heredado ? 'heredado del sistema actual' : ''} · ${m.id}`, d: `${m.ccn} · ${m.clasif} · ${SIGA.ui.money(s)}` , fn: () => SIGA.showTab(document.getElementById('mod-root'), 'p', 'marco') });
        else if (s / m.pim < 0.05) out.push({ lvl: 'warn', t: `Saldo bajo umbral (5%) · ${m.id}`, d: `${m.ccn} · disponible ${SIGA.ui.money(s)}`, fn: () => SIGA.showTab(document.getElementById('mod-root'), 'p', 'marco') });
      });
      const p = D.certificaciones.filter(c => c.fase === 'Pendiente de aprobación').length;
      if (p) out.push({ lvl: 'warn', icon: 'fa-stamp', t: `${p} certificación(es) pendiente(s) de aprobación`, d: 'Requiere Jefe de Planificación y Presupuesto' });
      return out;
    },
    search(q) {
      return D.certificaciones.filter(c => (c.num + ' ' + c.exp + ' ' + c.just + ' ccp').toLowerCase().includes(q))
        .map(c => ({ t: 'CCP ' + c.num + ' · ' + SIGA.ui.money(c.monto), d: c.just, fn: () => this.verCert(c) }));
    },

    render(el) {
      const U = SIGA.ui, pim = api.pim();
      const cert = D.fases.cert, dev = D.fases.dev;
      el.innerHTML = `
      <div class="page-head"><div><h1>Planificación y Presupuesto</h1><p>Ejecución del gasto público · SIAF-SP · control transaccional de la disponibilidad · ejercicio ${SIGA.ctx.ejercicio}</p></div>
        <div class="row-flex"><button class="btn ghost" id="p-conc"><i class="fa-solid fa-right-left"></i> Conciliar con SIAF</button><button class="btn" id="p-nueva"><i class="fa-solid fa-plus"></i> Nueva certificación</button></div></div>
      ${U.kpis([
        { lab: 'PIA 2026', val: U.mill(D.pia), sub: 'Presupuesto Institucional de Apertura' },
        { lab: 'PIM 2026', val: U.mill(pim), sub: D.notas.length + ' notas modificatorias', chip: '+' + ((pim / D.pia - 1) * 100).toFixed(1) + '%' },
        { lab: 'Certificado', val: U.mill(cert), sub: U.pct(cert, pim) + ' del PIM', chip: U.pct(cert, pim, 0), chipType: 'info' },
        { lab: 'Devengado', val: U.mill(dev), sub: 'saldo por ejecutar ' + U.mill(pim - dev), chip: U.pct(dev, pim), chipType: 'warn' }
      ])}
      <div class="note teal"><i class="fa-solid fa-calculator"></i><div><b>El saldo se calcula, no se guarda.</b> saldo = PIM − Σ certificaciones vigentes, en cada consulta y dentro de una transacción que bloquea la fila del marco (<code>SELECT … FOR UPDATE</code>). Si el importe excede el saldo, la operación se revierte: <b>el sobregiro es estructuralmente imposible</b>.</div></div>
      <div class="seg-tabs" data-group="p">
        <button class="on" data-tab="cert">Certificaciones</button><button data-tab="marco">Marco y saldos</button><button data-tab="ctrl"><i class="fa-solid fa-shield-halved"></i> Control preventivo</button>
        <button data-tab="cuadro">Cuadro de necesidades</button><button data-tab="comp">Compromisos</button><button data-tab="notas">Notas modificatorias</button>
        <button data-tab="pmi">Multianual y POI</button><button data-tab="conc">Conciliación SIAF</button><button data-tab="eval">Evaluación</button></div>
      <div class="subpanel show" data-group="p" data-panel="cert"><div class="card"><h3><span class="dot"></span>Certificaciones de crédito presupuestario <span class="grow">trazabilidad certificación → compromiso → devengado → girado → pagado</span></h3>
        <div class="toolbar"><div class="chips" id="p-chips">${['Todas', ...FASES, 'Anulada'].map(f => `<span class="chipf ${f === this.f ? 'on' : ''}" data-f="${f}">${f}</span>`).join('')}</div></div><div id="p-tcert"></div></div></div>
      <div class="subpanel" data-group="p" data-panel="marco"><div class="card"><h3><span class="dot"></span>Marco presupuestal por específica <span class="grow">fuente · meta · clasificador · saldo calculado en línea</span></h3><div id="p-marco"></div>
        <p class="mini mt">Los sobregiros marcados como <b>heredados</b> fueron migrados del sistema actual (Figura 18 del informe). SIGA-U los expone para regularizarlos mediante nota modificatoria y no permite generar nuevos.</p></div></div>
      <div class="subpanel" data-group="p" data-panel="ctrl" id="p-ctrl"></div>
      <div class="subpanel" data-group="p" data-panel="cuadro" id="p-cuadro"></div>
      <div class="subpanel" data-group="p" data-panel="comp" id="p-comp"></div>
      <div class="subpanel" data-group="p" data-panel="notas"><div class="card"><h3><span class="dot"></span>Notas modificatorias <span class="grow">créditos, habilitaciones, anulaciones · actualizan el marco al instante</span></h3><div style="margin-bottom:12px"><button class="btn sm" id="p-nnota"><i class="fa-solid fa-plus"></i> Nueva nota</button></div><div id="p-tnotas"></div></div></div>
      <div class="subpanel" data-group="p" data-panel="pmi" id="p-pmi"></div>
      <div class="subpanel" data-group="p" data-panel="conc" id="p-concp"></div>
      <div class="subpanel" data-group="p" data-panel="eval" id="p-eval"></div>`;

      el.querySelector('#p-chips').addEventListener('click', e => { const c = e.target.closest('[data-f]'); if (!c) return; this.f = c.dataset.f; el.querySelectorAll('#p-chips .chipf').forEach(x => x.classList.toggle('on', x === c)); this.paintCerts(); });
      this.paintCerts(); this.paintMarco(); this.paintCtrl(); this.paintCuadro(); this.paintComp(); this.paintNotas(); this.paintPmi(); this.paintConc(); this.paintEval();
      el.querySelector('#p-nueva').addEventListener('click', () => this.nueva());
      el.querySelector('#p-nnota').addEventListener('click', () => this.nuevaNota());
      el.querySelector('#p-conc').addEventListener('click', () => { SIGA.showTab(el, 'p', 'conc'); this.conciliar(); });
    },

    /* ---------------- Certificaciones ---------------- */
    paintCerts() {
      const U = SIGA.ui;
      const rows = () => D.certificaciones.filter(c => this.f === 'Todas' || c.fase === this.f);
      document.getElementById('p-tcert').innerHTML = U.grid({
        id: 'ppto-cert', title: 'certificaciones', export: 'certificaciones_2026', rows, record: certRec, pageSize: 12,
        filter: { label: 'Centro de costo', get: r => api.marco(r.marco).ccn },
        cols: [
          { k: 'num', label: 'N° CCP', render: r => `<span class="code">${r.num}</span>` },
          { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha.split('/').reverse().join('') },
          { k: 'cc', label: 'Centro de costo', render: r => { const m = api.marco(r.marco); return `${m.ccn}<div class="mini">${m.cc}</div>`; }, csv: r => api.marco(r.marco).ccn },
          { k: 'fte', label: 'Fte / Meta', render: r => { const m = api.marco(r.marco); return `${m.fte} · ${m.meta}`; } },
          { k: 'clasif', label: 'Clasificador', render: r => `<span class="code">${api.marco(r.marco).clasif}</span>` },
          { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto) },
          { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, FCLS[r.fase]) },
          { k: 'user', label: 'Registró / Aprobó', render: r => `<span class="mini">${r.user}${r.aprob ? ' / ' + r.aprob : ''}</span>` }
        ],
        rowCls: r => (r.fase === 'Anulada' ? 'row-void' : '') + (r.nuevo ? ' row-new' : ''),
        actions: [
          { icon: 'fa-stamp', title: 'Aprobar (Jefe de P&P)', show: r => r.fase === 'Pendiente de aprobación', fn: c => this.aprobar(c) },
          { icon: 'fa-forward-step', title: 'Avanzar a la siguiente fase', show: r => r.fase !== 'Pendiente de aprobación' && r.fase !== 'Pagado' && r.fase !== 'Anulada', fn: c => this.avanzar(c) },
          { icon: 'fa-print', title: 'Imprimir certificado', fn: c => U.rec(certRec).imprimir(c) }
        ],
        tools: [{ icon: 'fa-plus', label: 'Nueva certificación', primary: true, fn: () => this.nueva() }],
        bulk: [
          { icon: 'fa-stamp', label: 'Aprobar pendientes', fn: rs => { const x = rs.filter(c => c.fase === 'Pendiente de aprobación'); if (!x.length) { U.toast('No hay certificaciones pendientes en la selección', 'info'); return; } if (!SIGA.sod(null, 'cert.aprobar')) return; const ok = x.filter(c => c.user !== SIGA.ctx.user.nombre); ok.forEach(c => this.aprobar(c, true)); U.toast(ok.length + ' certificaciones aprobadas y enviadas al SIAF' + (x.length > ok.length ? ' · ' + (x.length - ok.length) + ' excluidas por segregación de funciones' : '')); SIGA.refresh(); } },
          { icon: 'fa-print', label: 'Imprimir certificados', fn: rs => U.preview('Certificaciones · ' + rs.length, rs.map(c => U.doc(Object.assign({ office: certRec.office }, certRec.print(c)))).join('<div class="pg-break"></div>'), { file: 'certificaciones_lote' }) }
        ],
        foot: rs => `<tr><td colspan="6" class="r"><b>Total vigente (${rs.filter(vigente).length})</b></td><td class="r num"><b>${U.money(rs.filter(vigente).reduce((s, c) => s + c.monto, 0))}</b></td><td colspan="4"></td></tr>`
      });
    },
    rebaja(c) {
      const U = SIGA.ui, m = api.marco(c.marco);
      U.formModal('<i class="fa-solid fa-scissors"></i> Rebaja de certificación · CCP ' + c.num, [
        { k: 'act', label: 'Monto certificado', value: U.money(c.monto), ro: true, span: 1 }, { k: 'reb', label: 'Monto a rebajar S/', type: 'number', value: Math.round(c.monto * 0.1), span: 1 },
        { k: 'mot', label: 'Sustento', type: 'textarea', value: 'Menor valor adjudicado respecto del valor estimado' }
      ], v => {
        const r = parseFloat(v.reb) || 0;
        if (r <= 0 || r >= c.monto) { U.toast('La rebaja debe ser mayor que cero y menor al monto certificado', 'err'); return; }
        const antes = api.saldo(m); c.monto = Math.round((c.monto - r) * 100) / 100; D.fases.cert -= r; api.fuente(m.fte).cert -= r;
        SIGA.siaf('Rebaja de certificación', 'CCP ' + c.num, -r);
        SIGA.log('Presupuesto', 'Rebaja de certificación', 'CCP ' + c.num, 'Saldo ' + U.money(antes), 'Saldo ' + U.money(api.saldo(m)) + ' · ' + v.mot);
        U.closeModal(); U.toast(`CCP ${c.num} rebajada en ${U.money(r)} · saldo liberado en ${m.id}`); SIGA.refresh();
      }, 'Rebajar y liberar saldo');
    },
    verCert(c) {
      const U = SIGA.ui, m = api.marco(c.marco), idx = FASES.indexOf(c.fase);
      const steps = FASES.map((f, i) => ({ t: f === 'Pendiente de aprobación' ? 'Registro de la certificación' : f, st: c.fase === 'Anulada' ? (i === 0 ? 'done' : '') : i < idx ? 'done' : i === idx ? (i === FASES.length - 1 ? 'done' : 'cur') : '', sub: i === 0 ? 'Registró ' + c.user : i === 1 && c.aprob ? 'Aprobó ' + c.aprob + ' · SIAF ' + (c.siaf || '—') : '' }));
      const body = `<div class="split eq"><div>${U.kv([['Certificado', `<span class="code">${c.num}</span>`], ['Expediente', `<span class="code">${c.exp}</span>`], ['Fecha', c.fecha], ['Centro de costo', m.ccn + ' · ' + m.cc], ['Fuente', m.fte + ' · ' + api.fuente(m.fte).nom], ['Meta · Clasificador', m.meta + ' · ' + m.clasif], ['Específica', m.desc], ['Registro SIAF', c.siaf || 'se envía al aprobar'], ['Fase', U.tag(c.fase, FCLS[c.fase])], ['Saldo de la certificación', U.money(api.certSaldo(c))]])}
          <div class="mini mt"><b>Justificación:</b> ${c.just || '—'}</div></div>
          <div><div class="lbl-s" style="margin-bottom:8px">Recorrido del gasto</div>${U.timeline(steps)}</div></div>
        <h3 style="margin:14px 0 8px;font-size:12px"><span class="dot"></span>Ítems certificados (catálogo SIGA)</h3>
        ${U.table([{ k: 0, label: 'Código', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Descripción' }, { k: 2, label: 'Und' }, { k: 3, label: 'Cant', r: true }, { k: 4, label: 'P. Unit', r: true, render: r => U.money(r[4], '') }, { k: 't', label: 'Total', r: true, render: r => `<b>${U.money(r[3] * r[4], '')}</b>` }], c.items || [])}
        <div class="mf-note">${U.montoLetras(c.monto)}</div>`;
      const b = U.modal('Certificación de crédito presupuestario N° ' + c.num, body,
        `<button class="btn ghost" data-close>Cerrar</button>
         <button class="btn ghost" id="cv-exp"><i class="fa-solid fa-route"></i> Ver expediente</button>
         <button class="btn ghost" id="cv-hist"><i class="fa-solid fa-clock-rotate-left"></i> Historial</button>
         ${['Pendiente de aprobación', 'Certificado'].includes(c.fase) ? '<button class="btn danger" id="cv-an"><i class="fa-solid fa-ban"></i> Anular</button>' : ''}
         ${c.fase === 'Pendiente de aprobación' ? '<button class="btn" id="cv-apr"><i class="fa-solid fa-stamp"></i> Aprobar</button>' : ''}
         ${!['Pendiente de aprobación', 'Pagado', 'Anulada'].includes(c.fase) ? `<button class="btn" id="cv-av"><i class="fa-solid fa-forward-step"></i> Pasar a ${FASES[idx + 1]}</button>` : ''}
         <button class="btn sec" id="cv-print"><i class="fa-solid fa-print"></i> Imprimir</button>`, 'wide');
      b.querySelector('#cv-print').addEventListener('click', () => U.rec(certRec).imprimir(c));
      b.querySelector('#cv-exp').addEventListener('click', () => { U.closeModal(); SIGA.go('expediente'); setTimeout(() => SIGA.modules.expediente.ver(c.exp), 60); });
      b.querySelector('#cv-apr')?.addEventListener('click', () => { U.closeModal(); this.aprobar(c); });
      b.querySelector('#cv-hist').addEventListener('click', () => U.rec(certRec).historial(c));
      b.querySelector('#cv-an')?.addEventListener('click', () => U.rec(certRec).anular(c));
      b.querySelector('#cv-av')?.addEventListener('click', () => { U.closeModal(); this.avanzar(c); });
    },
    aprobar(c, silent) {
      if (!silent && !SIGA.sod(c.user, 'cert.aprobar')) return;
      const U = SIGA.ui, m = api.marco(c.marco);
      c.fase = 'Certificado'; c.aprob = SIGA.ctx.user.nombre;
      const msg = SIGA.siaf('Certificación', 'CCP ' + c.num, c.monto);
      c.siaf = 'en cola → ' + (msg ? '#' + msg.id : '');
      setTimeout(() => { if (msg && msg.resp.startsWith('Expediente')) c.siaf = msg.resp.replace('Expediente SIAF ', ''); }, 1600);
      api.bump('Certificado', c.monto, m);
      SIGA.exp?.stage(c.exp, 'cert', 'CCP ' + c.num, 'Aprobada por ' + SIGA.ctx.user.nombre);
      SIGA.log('Presupuesto', 'Aprobación de certificación', 'CCP ' + c.num, 'Pendiente de aprobación', 'Certificado');
      if (silent) return;
      U.toast(`CCP ${c.num} aprobada · enviada al SIAF-SP sin re-digitación`);
      SIGA.refresh();
    },
    avanzar(c) {
      const U = SIGA.ui, i = FASES.indexOf(c.fase), nf = FASES[i + 1], m = api.marco(c.marco);
      if (!nf) return;
      const antes = c.fase; c.fase = nf;
      if (nf === 'Comprometido') c.comp = c.monto;
      api.bump(nf, c.monto, m);
      const tipo = nf === 'Comprometido' ? 'Compromiso anual' : nf;
      SIGA.siaf(tipo, 'CCP ' + c.num, c.monto);
      const a = asientoFase(c, nf);
      const key = { Comprometido: 'comp', Devengado: 'dev', Girado: 'gir', Pagado: 'pag' }[nf];
      SIGA.exp?.stage(c.exp, key, nf + ' · CCP ' + c.num, a ? 'Asiento ' + a : '');
      SIGA.log('Presupuesto', 'Cambio de fase', 'CCP ' + c.num, antes, nf);
      U.toast(`CCP ${c.num} → <b>${nf}</b>${a ? ' · asiento contable ' + a + ' generado' : ''} · SIAF actualizado`);
      SIGA.refresh();
    },
    anular(c) { SIGA.ui.rec(certRec).anular(c); },

    nueva(mid) {
      const U = SIGA.ui, cat = D.catalogo;
      const opts = D.marco.map(m => api.label(m) + ' — saldo ' + U.money(api.saldo(m)));
      const findM = v => api.marco(String(v || '').split(' · ')[0]);
      const def = opts.find(o => o.startsWith((mid || 'M09') + ' '));
      const tot = rows => rows.reduce((s, r) => s + (parseFloat(r.cant) || 0) * (parseFloat(r.precio) || 0), 0);
      const cadena = m => ({ cc: m.cc + ' · ' + m.ccn, fte: m.fte + ' · ' + api.fuente(m.fte).nom, meta: m.meta, clasif: m.clasif + ' · ' + m.desc, fin: '00' + (500 + +m.meta.slice(-2)) });
      const c0 = cadena(findM(def));
      U.bigForm({
        title: 'Nueva certificación de crédito presupuestario', icon: 'fa-file-invoice-dollar', size: 'wide',
        intro: `<div class="note info"><i class="fa-solid fa-lightbulb"></i><div>La cadena funcional se completa y valida sola a partir de la específica. Para ver el <b>bloqueo de sobregiro</b>, elija <b>M01</b> (saldo S/ 800.00) o aumente la cantidad por encima del saldo.</div></div>`,
        sections: [
          { title: 'Datos generales', cols: 3, fields: [
            { k: 'num', label: 'Certificado N°', value: api.next(), ro: true, span: 1, hint: 'correlativo automático e irrepetible' },
            { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1, required: true },
            { k: 'tipo', label: 'Tipo', type: 'select', options: ['Certificación anual', 'Certificación con previsión multianual'], span: 1 },
            { k: 'esp', label: 'Específica de gasto (fuente · meta · clasificador) — saldo calculado en línea', type: 'select', options: opts, value: def, span: 3, required: true }
          ] },
          { title: 'Cadena funcional programática', hint: 'validada automáticamente contra el clasificador y la meta', cols: 3, fields: [
            { k: 'cc', label: 'Centro de costo', value: c0.cc, ro: true, span: 2 }, { k: 'fte', label: 'Fuente de financiamiento', value: c0.fte, ro: true, span: 1 },
            { k: 'funcion', label: 'Función', value: '22 · Educación', ro: true, span: 1 }, { k: 'division', label: 'División funcional', value: '048 · Educación superior', ro: true, span: 1 }, { k: 'grupo', label: 'Grupo funcional', value: '0106 · Educación superior universitaria', ro: true, span: 1 },
            { k: 'progpres', label: 'Programa presupuestal', value: '9002 · Asignaciones sin programa', ro: true, span: 1 }, { k: 'producto', label: 'Producto / proyecto', value: '3.000001 · Acciones comunes', ro: true, span: 1 }, { k: 'actividad', label: 'Actividad / obra', value: '5.000276 · Gestión del programa', ro: true, span: 1 },
            { k: 'meta', label: 'Meta', value: c0.meta, ro: true, span: 1 }, { k: 'finalidad', label: 'Finalidad', value: c0.fin, ro: true, span: 1 }, { k: 'clasif', label: 'Clasificador de gasto', value: c0.clasif, ro: true, span: 1 },
            { k: 'just', label: 'Justificación del requerimiento', type: 'textarea', value: 'Equipamiento del laboratorio de cómputo', span: 3, required: true }
          ] }
        ],
        items: {
          title: 'Ítems a certificar (catálogo SIGA-MEF)', hint: 'elija la descripción: código, unidad y precio se completan solos', addLabel: 'Agregar ítem',
          seed: { cod: cat[1][0], desc: cat[1][1], um: cat[1][2], cant: 1, precio: cat[1][3] },
          rows: [{ cod: cat[0][0], desc: cat[0][1], um: cat[0][2], cant: 2, precio: cat[0][3] }],
          columns: [
            { k: 'cod', label: 'Cód. SIGA', w: '15%' },
            { k: 'desc', label: 'Descripción', type: 'select', options: cat.map(c => c[1]), w: '37%', onPick: (r, v) => { const it = cat.find(c => c[1] === v); if (it) { r.cod = it[0]; r.um = it[2]; r.precio = it[3]; } } },
            { k: 'um', label: 'Und.', w: '11%' },
            { k: 'cant', label: 'Cant.', type: 'num', r: true, w: '10%' },
            { k: 'precio', label: 'P. Unit.', type: 'money', r: true, w: '12%' },
            { k: 'imp', label: 'Total', calc: r => (parseFloat(r.cant) || 0) * (parseFloat(r.precio) || 0), r: true, w: '15%' }
          ]
        },
        status: (rows, v) => {
          const m = findM(v.esp); if (!m) return '';
          const s = api.saldo(m), t = tot(rows), res = s - t, bad = t > s;
          return `<div class="card" style="margin:6px 0 10px;border-color:${bad ? 'rgba(239,68,68,.45)' : 'rgba(26,187,156,.4)'};background:${bad ? 'rgba(239,68,68,.04)' : 'rgba(26,187,156,.04)'}">
            <div class="row-flex" style="justify-content:space-between"><b style="font-size:12px">${bad ? '<i class="fa-solid fa-lock" style="color:var(--danger)"></i> BLOQUEADO · excede el saldo disponible' : '<i class="fa-solid fa-lock-open" style="color:var(--ok)"></i> Disponibilidad verificada en línea'}</b>${SIGA.ui.sem(res, m.pim)}</div>
            <div class="grid cols-3 mt" style="gap:10px"><div class="mini-card"><div class="lab">Saldo disponible</div><div class="v">${U.money(s)}</div><div class="s">PIM ${U.money(m.pim)}</div></div>
            <div class="mini-card"><div class="lab">Esta certificación</div><div class="v">${U.money(t)}</div><div class="s">${rows.length} ítem(s)</div></div>
            <div class="mini-card"><div class="lab">Saldo resultante</div><div class="v ${bad ? 'neg' : 'pos'}">${U.money(res)}</div><div class="s">${bad ? 'diferencia a retener ' + U.money(-res) : 'tras certificar'}</div></div></div>
            ${bad ? `<div class="mini mt" style="color:#991b1b">La transacción se revertiría (<code>ROLLBACK</code>). Puede certificar solo lo disponible y retener la diferencia.</div>` : ''}</div>`;
        },
        totals: rows => { const t = tot(rows); return [{ label: 'Monto a certificar S/', val: U.money(t, ''), big: true }]; },
        footNote: rows => U.montoLetras(tot(rows)),
        submitLabel: 'Validar y registrar',
        after: back => {
          const sel = back.querySelector('[data-k="esp"]');
          sel.addEventListener('change', () => { const c = cadena(findM(sel.value)); ['cc', 'fte', 'meta', 'clasif'].forEach(k => back.querySelector(`[data-k="${k}"]`).value = c[k]); back.querySelector('[data-k="finalidad"]').value = c.fin; });
        },
        onSubmit: (v, rows) => {
          const m = findM(v.esp), t = tot(rows), s = api.saldo(m);
          if (t <= 0) { U.toast('Agregue al menos un ítem con importe', 'err'); return; }
          const items = rows.map(r => [r.cod, r.desc, r.um, parseFloat(r.cant) || 0, parseFloat(r.precio) || 0]);
          const crear = (monto, nota) => {
            const c = { num: v.num, fecha: U.dmy(v.fecha), marco: m.id, monto, fase: 'Pendiente de aprobación', user: SIGA.ctx.user.nombre, aprob: '', siaf: '', exp: 'EXP-2026-' + v.num.slice(-4), just: v.just + (nota ? ' · ' + nota : ''), items, comp: 0 };
            D.certificaciones.unshift(c);
            SIGA.exp?.nuevo({ id: c.exp, asunto: v.just, cc: m.ccn, monto, cert: c.num });
            SIGA.log('Presupuesto', 'Registro de certificación', 'CCP ' + c.num, '—', U.money(monto) + ' · ' + m.clasif);
            U.closeModal(); this.f = 'Todas'; SIGA.refresh();
            U.toast(`CCP ${c.num} registrada por ${U.money(monto)} · saldo reservado · pendiente de aprobación del Jefe de P&P`);
          };
          if (t > s) {
            SIGA.log('Presupuesto', 'Certificación rechazada · saldo insuficiente', m.id + ' · ' + m.clasif, 'Saldo ' + U.money(s), 'Solicitado ' + U.money(t));
            const b = U.modal('<i class="fa-solid fa-lock" style="color:var(--danger)"></i> Operación bloqueada · saldo insuficiente',
              `<div class="sim-log" style="background:#0f172a;color:#cbd5e1;border-radius:10px;min-height:0">
                <div class="db">BEGIN;</div><div class="db">SELECT pim − Σ certificaciones FROM marco WHERE llave='${m.fte}|${m.meta}|${m.clasif}' FOR UPDATE;</div>
                <div>→ saldo disponible = ${U.money(s)}</div><div>→ importe solicitado = ${U.money(t)}</div>
                <div class="bad">✗ ${U.money(t)} &gt; ${U.money(s)} → ROLLBACK; (nada se registró)</div></div>
               <div class="bigq mt">"Si un centro pide mil y solo hay ochocientos, el sistema debería bloquear la diferencia."<em>— Oficina de Presupuesto, levantamiento de campo</em></div>
               <p class="mini mt">El intento quedó registrado en la bitácora de auditoría.</p>`,
              `<button class="btn ghost" data-close>Corregir importe</button>${s > 0 ? `<button class="btn" id="bk-part"><i class="fa-solid fa-scissors"></i> Certificar ${U.money(s)} y retener ${U.money(t - s)}</button>` : ''}`, 'narrow');
            b.querySelector('#bk-part')?.addEventListener('click', () => crear(Math.round(s * 100) / 100, 'diferencia retenida ' + U.money(t - s)));
            return;
          }
          crear(t);
        }
      });
    },

    /* ---------------- Marco y saldos ---------------- */
    paintMarco() {
      const U = SIGA.ui;
      const mRec = { mod: 'Presupuesto', tipo: 'Marco presupuestal por específica', office: 'Oficina de Planificación y Presupuesto', key: r => r.id, title: r => 'Específica ' + r.id + ' · ' + r.clasif, cls: false, view: m => this.verMarco(m),
        fields: m => [['Llave', m.id], ['Centro de costo', m.ccn + ' · ' + m.cc, 1], ['Fuente · Meta', m.fte + ' · ' + m.meta], ['Clasificador', m.clasif + ' ' + m.desc], ['PIM', U.money(m.pim)], ['Certificado', U.money(api.certificado(m))], ['Saldo', U.money(api.saldo(m))]],
        extra: m => [{ icon: 'fa-plus', label: 'Certificar con esta específica', fn: x => { U.closeModal(); this.nueva(x.id); } }, { icon: 'fa-file-pen', label: 'Nota modificatoria', fn: () => { U.closeModal(); this.nuevaNota(); } }],
        print: m => ({ tipo: 'Reporte de disponibilidad presupuestal', num: m.id, body: dtbl([['CCP'], ['Fecha'], ['Justificación'], ['Fase'], ['Monto', 1]], D.certificaciones.filter(c => c.marco === m.id).map(c => [c.num, c.fecha, U.esc(c.just || ''), c.fase, U.money(c.monto, '')])) + dtbl([['Concepto'], ['Importe', 1]], [['PIM', U.money(m.pim, '')], ['Certificado histórico', U.money(m.hist, '')], ['Certificaciones del periodo', U.money(api.certificado(m) - m.hist, '')], ['<b>Saldo disponible</b>', '<b>' + U.money(api.saldo(m), '') + '</b>']]) }) };
      document.getElementById('p-marco').innerHTML = U.grid({ id: 'ppto-marco', title: 'marco presupuestal', export: 'marco_presupuestal', rows: D.marco, record: mRec, pageSize: 15,
        filter: { label: 'Fuente', get: r => r.fte + ' · ' + FTE[r.fte] },
        cols: [
        { k: 'id', label: 'Llave', render: r => `<span class="code">${r.id}</span>` },
        { k: 'fte', label: 'Fte', render: r => r.fte + ' · ' + FTE[r.fte] }, { k: 'meta', label: 'Meta' },
        { k: 'ccn', label: 'Centro de costo', render: r => `${r.ccn}<div class="mini">${r.cc}</div>` },
        { k: 'clasif', label: 'Clasificador', render: r => `<span class="code">${r.clasif}</span><div class="mini">${r.desc}</div>` },
        { k: 'pim', label: 'PIM', r: true, render: r => U.money(r.pim, '') },
        { k: 'cert', label: 'Certificado', r: true, sv: r => api.certificado(r), render: r => U.money(api.certificado(r), '') },
        { k: 'saldo', label: 'Saldo', r: true, sv: r => api.saldo(r), render: r => { const s = api.saldo(r); return `<b class="${s < 0 ? 'saldo-neg' : 'saldo-pos'}">${U.money(s, '')}</b>`; } },
        { k: 'uso', label: 'Uso', sv: r => api.certificado(r) / r.pim, render: r => { const p = api.certificado(r) / r.pim * 100; return `<div class="mcell">${U.meter(Math.min(100, p), p > 100 ? 'var(--danger)' : p > 95 ? '#d97706' : p > 80 ? 'var(--warning)' : 'var(--primary)')}<span>${p.toFixed(0)}%</span></div>`; } },
        { k: 'sem', label: 'Semáforo', nosort: true, render: r => U.sem(api.saldo(r), r.pim) + (r.heredado ? `<div class="mini">heredado</div>` : '') }
      ], rowCls: r => api.saldo(r) < 0 ? 'row-bad' : '',
        actions: [{ icon: 'fa-plus', title: 'Certificar con esta específica', show: r => api.saldo(r) > 0, fn: m => this.nueva(m.id) }],
        foot: rs => `<tr><td colspan="5" class="r"><b>Total</b></td><td class="r num"><b>${U.money(rs.reduce((s, m) => s + m.pim, 0), '')}</b></td><td class="r num"><b>${U.money(rs.reduce((s, m) => s + api.certificado(m), 0), '')}</b></td><td class="r num"><b>${U.money(rs.reduce((s, m) => s + api.saldo(m), 0), '')}</b></td><td colspan="3"></td></tr>` });
    },
    verMarco(m) {
      const U = SIGA.ui, certs = D.certificaciones.filter(c => c.marco === m.id);
      U.modal('Específica ' + m.id + ' · ' + m.clasif, U.kv([['Centro de costo', m.ccn + ' · ' + m.cc], ['Fuente · Meta', m.fte + ' · ' + m.meta], ['Específica', m.desc], ['PIM', U.money(m.pim)], ['Certificado histórico', U.money(m.hist)], ['Certificaciones del periodo', U.money(certs.filter(vigente).reduce((s, c) => s + c.monto, 0))], ['Saldo calculado', `<b class="${api.saldo(m) < 0 ? 'saldo-neg' : 'saldo-pos'}">${U.money(api.saldo(m))}</b>`]]) +
        `<div class="note teal mt" style="font-size:11px"><i class="fa-solid fa-calculator"></i><div>saldo = PIM − certificado histórico − Σ certificaciones vigentes = ${U.money(m.pim)} − ${U.money(m.hist)} − ${U.money(certs.filter(vigente).reduce((s, c) => s + c.monto, 0))}</div></div>` +
        (certs.length ? U.table([{ k: 'num', label: 'CCP', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto) }, { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, FCLS[r.fase]) }], certs) : '') +
        (m.heredado ? `<div class="note warn mt"><i class="fa-solid fa-triangle-exclamation"></i><div>Sobregiro <b>heredado del sistema actual</b>: se ejecutó por encima de lo autorizado antes de la migración. Regularizar mediante nota modificatoria.</div></div>` : ''),
        `<button class="btn ghost" data-close>Cerrar</button>`, 'wide');
    },

    /* ---------------- Control preventivo + concurrencia ---------------- */
    paintCtrl() {
      const U = SIGA.ui;
      const opts = D.marco.map(m => `<option value="${m.id}" ${m.id === 'M01' ? 'selected' : ''}>${api.label(m)} — saldo ${U.money(api.saldo(m))}</option>`).join('');
      document.getElementById('p-ctrl').innerHTML = `
        <div class="split eq mb">
          <div class="card"><h3><span class="dot"></span>Prueba de disponibilidad en línea <span class="grow">P-05 · P-06 · D-13</span></h3>
            <div class="fgrid"><div class="fld fspan2"><label>Específica</label><select id="cp-m">${opts}</select></div>
            <div class="fld"><label>Importe solicitado S/</label><input id="cp-v" type="number" value="1000"></div>
            <div class="fld" style="justify-content:flex-end"><button class="btn" id="cp-go"><i class="fa-solid fa-bolt"></i> Validar disponibilidad</button></div></div>
            <div id="cp-out" class="mt"></div></div>
          <div class="card"><h3><span class="dot"></span>Lo que dijo Presupuesto en el levantamiento</h3>
            <div class="bigq">"El sistema es un reflejo del SIAF: se aprueba allá y se vuelve a escribir acá."<em>— Oficina de Presupuesto</em></div>
            <div class="bigq mt">"Si un centro pide mil y solo hay ochocientos, el sistema debería bloquear la diferencia."<em>— Oficina de Presupuesto</em></div>
            <div class="cmp mt"><div class="asis"><h5>Sistema actual</h5>El saldo se guarda como dato fijo · la validación advierte pero no bloquea · dos usuarios comprometen el mismo saldo · el error se descubre en el cierre.</div>
            <div class="tobe"><h5>SIGA-U</h5>El saldo se calcula al instante · la validación bloquea dentro de la transacción · las operaciones concurrentes se serializan · la diferencia se retiene.</div></div></div>
        </div>
        <div class="card"><h3><span class="dot"></span>Simulación · dos usuarios certifican el mismo saldo al mismo tiempo <span class="grow">condición de carrera (D-14)</span></h3>
          <p class="mini" style="margin-bottom:12px">Saldo de la específica: <b>S/ 10,000.00</b>. Usuario A (Esc. de Agronomía) solicita <b>S/ 8,000.00</b>; Usuario B (Fac. de Zootecnia) solicita <b>S/ 6,000.00</b> en el mismo segundo.</p>
          <div class="row-flex mb"><button class="btn" id="sim-go"><i class="fa-solid fa-play"></i> Ejecutar simulación</button><span class="mini" id="sim-st"></span></div>
          <div class="sim"><div class="sim-col old"><h4><i class="fa-solid fa-hard-drive"></i> Sistema actual · archivos DBF en carpeta compartida</h4><div class="sim-log" id="sim-a"><div class="mini">Presione "Ejecutar simulación".</div></div><div class="sim-saldo"><span>Saldo resultante</span><b id="sim-sa">S/ 10,000.00</b></div></div>
          <div class="sim-col new"><h4><i class="fa-solid fa-database"></i> SIGA-U · PostgreSQL transaccional</h4><div class="sim-log" id="sim-b"><div class="mini">Presione "Ejecutar simulación".</div></div><div class="sim-saldo"><span>Saldo resultante</span><b id="sim-sb">S/ 10,000.00</b></div></div></div>
        </div>`;
      const out = document.getElementById('cp-out');
      document.getElementById('cp-go').addEventListener('click', () => {
        const m = api.marco(document.getElementById('cp-m').value), v = parseFloat(document.getElementById('cp-v').value) || 0, s = api.saldo(m), ok = v <= s;
        out.innerHTML = `<div class="sim-log" style="background:#0f172a;color:#cbd5e1;border-radius:10px;min-height:0">
          <div class="db">BEGIN;</div><div class="db">SELECT … FROM marco WHERE llave='${m.fte}|${m.meta}|${m.clasif}' FOR UPDATE;</div>
          <div>→ saldo = ${U.money(m.pim)} − ${U.money(api.certificado(m))} = ${U.money(s)}</div>
          <div class="${ok ? 'ok' : 'bad'}">${ok ? '✓ ' + U.money(v) + ' ≤ saldo → la certificación puede registrarse · COMMIT;' : '✗ ' + U.money(v) + ' > saldo → ROLLBACK; diferencia retenida ' + U.money(v - s)}</div></div>`;
        if (!ok) SIGA.log('Presupuesto', 'Validación de disponibilidad rechazada', m.id, 'Saldo ' + U.money(s), 'Solicitado ' + U.money(v));
      });
      document.getElementById('sim-go').addEventListener('click', e => this.simular(e.currentTarget));
    },
    simular(btn) {
      btn.disabled = true;
      const A = document.getElementById('sim-a'), B = document.getElementById('sim-b'), sa = document.getElementById('sim-sa'), sb = document.getElementById('sim-sb'), st = document.getElementById('sim-st');
      A.innerHTML = ''; B.innerHTML = ''; sa.textContent = sb.textContent = 'S/ 10,000.00'; sa.className = sb.className = '';
      const L = (el, cls, t) => { const d = document.createElement('div'); d.className = cls; d.textContent = t; el.appendChild(d); };
      const steps = [
        () => { st.textContent = 't = 0 s · ambos usuarios presionan "Grabar"'; L(A, 'u1', '[A] lee saldo de movpar.dbf → 10,000.00'); L(A, 'u2', '[B] lee saldo de movpar.dbf → 10,000.00'); L(B, 'u1', '[A] BEGIN; SELECT … FOR UPDATE → 10,000.00 (fila bloqueada)'); L(B, 'u2', '[B] BEGIN; SELECT … FOR UPDATE → en espera…'); },
        () => { L(A, 'u1', '[A] valida 8,000 ≤ 10,000 → graba'); L(A, 'u2', '[B] valida 6,000 ≤ 10,000 → graba'); L(B, 'u1', '[A] 8,000 ≤ 10,000 → INSERT certificación'); L(B, 'ok', '[A] COMMIT ✓'); },
        () => { L(A, 'db', '[DBF] saldo almacenado = 10,000 − 8,000 − 6,000'); sa.textContent = '−S/ 4,000.00'; sa.className = 'neg'; L(B, 'u2', '[B] obtiene la fila · saldo recalculado = 2,000.00'); sb.textContent = 'S/ 2,000.00'; },
        () => { L(A, 'bad', '✗ SOBREGIRO de S/ 4,000.00 — nadie fue advertido'); L(A, 'mini', 'El error se descubre en el cierre, cuando ya se gastó.'); L(B, 'bad', '[B] 6,000 > 2,000 → ROLLBACK · rechazada'); L(B, 'ok', '✓ Diferencia retenida S/ 4,000.00 · se ofrece certificar S/ 2,000.00'); sb.className = 'pos'; st.textContent = 'Resultado: sistema actual con sobregiro · SIGA-U sin sobregiro'; btn.disabled = false; SIGA.log('Presupuesto', 'Simulación de concurrencia', 'Demostración D-14', 'AS-IS −4,000.00', 'SIGA-U 2,000.00'); }
      ];
      steps.forEach((f, i) => setTimeout(f, 250 + i * 1100));
    },

    /* ---------------- Cuadro de necesidades ---------------- */
    paintCuadro() {
      const U = SIGA.ui, C = D.cuadro, pim = api.pim();
      const top = D.centros, tMod = top.reduce((s, r) => s + r[2], 0), tEje = top.reduce((s, r) => s + r[3], 0), tIt = top.reduce((s, r) => s + r[4], 0);
      const oMod = pim - tMod, oEje = C.ejecutado - tEje;
      document.getElementById('p-cuadro').innerHTML = `
        <div class="grid cols-6 mb">
          ${[['Ítems', U.int(C.items), 'en el cuadro'], ['Centros de costo', C.centros, 'activos'], ['Programado', U.mill(C.programado), 'cuadro de necesidades'], ['Modificado', U.mill(pim), 'PIM'], ['Ejecutado', U.mill(C.ejecutado), 'devengado real'], ['Avance', U.pct(C.ejecutado, pim), 'saldo ' + U.mill(C.programado - C.ejecutado)]].map(x => `<div class="mini-card"><div class="lab">${x[0]}</div><div class="v">${x[1]}</div><div class="s">${x[2]}</div></div>`).join('')}
        </div>
        <div class="split mb">
          <div class="card"><h3><span class="dot"></span>Ejecución acumulada 2026 · programado vs devengado <span class="grow">millones de soles</span></h3>
            ${U.chart.line({ labels: D.mensual.labels, series: [{ name: 'Programado acumulado', data: D.mensual.prog }, { name: 'Devengado acumulado', data: D.mensual.dev }], fmt: v => 'S/ ' + v.toFixed(1) + ' M', axFmt: v => v.toFixed(0), area: false, h: 230 })}</div>
          <div class="card"><h3><span class="dot" style="background:var(--danger)"></span>Evidencia · no es una opinión</h3>
            <p class="mini">Cuadro de necesidades 2026 — <b>DGA Jefatura (104.07.08.01)</b>, 91 ítems. En el sistema actual se ejecutó más de lo programado:</p>
            <div class="row-flex mt">${['−4,600.00', '−8.80', '−8.68', '−6.00'].map(x => `<span class="tag t-red" style="font-size:12px">${x}</span>`).join('')}</div>
            <div class="note warn mt" style="margin-bottom:0"><i class="fa-solid fa-circle-exclamation"></i><div>Cada cifra es una <b>sobreejecución</b> que el sistema debió impedir. Con SIGA-U estas certificaciones habrían sido <b>bloqueadas</b> al registrarse.</div></div>
            <button class="btn sm mt" id="cu-dga"><i class="fa-solid fa-magnifying-glass"></i> Ver ítems del centro de costo</button></div>
        </div>
        <div class="card"><h3><span class="dot"></span>Centros de costo con mayor asignación · programado, modificado y ejecutado <span class="grow">clic para ver ítems · alerta de desviación</span></h3><div id="cu-t"></div></div>`;
      const cenRec = { mod: 'Presupuesto', tipo: 'Cuadro de necesidades por centro de costo', key: r => r[0], title: r => r[1], cls: false, view: r => this.verCentro(r),
        fields: r => [['Código', r[0]], ['Centro de costo', r[1], 1], ['Ítems', U.int(r[4])], ['Modificado', U.money(r[2])], ['Ejecutado', U.money(r[3])], ['Saldo', U.money(r[2] - r[3])], ['Avance', U.pct(r[3], r[2])]],
        extra: r => r[3] / r[2] < 0.2 ? [{ icon: 'fa-bell', label: 'Notificar desviación al responsable', fn: x => { SIGA.log('Presupuesto', 'Alerta de desviación notificada', x[0], U.pct(x[3], x[2]), 'Notificado al responsable'); U.closeModal(); U.toast('Alerta de desviación enviada al responsable de ' + x[1]); } }] : [] };
      document.getElementById('cu-t').innerHTML = U.grid({ id: 'ppto-cen', title: 'centros de costo', export: 'cuadro_necesidades_centros', rows: D.centros, record: cenRec, pageSize: 10,
        filter: { label: 'Alerta', get: r => { const p = r[3] / r[2] * 100; return p < 20 ? 'Desviación crítica' : p < 50 ? 'Bajo ritmo' : 'En ritmo'; } },
        cols: [
        { k: 0, label: 'Código', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Denominación' },
        { k: 4, label: 'Ítems', r: true, render: r => U.int(r[4]) },
        { k: 2, label: 'Modificado S/', r: true, render: r => U.money(r[2], '') }, { k: 3, label: 'Ejecutado S/', r: true, render: r => U.money(r[3], '') },
        { k: 's', label: 'Saldo S/', r: true, sv: r => r[2] - r[3], render: r => U.money(r[2] - r[3], '') },
        { k: 'a', label: 'Avance', sv: r => r[3] / r[2], render: r => { const p = r[3] / r[2] * 100; return `<div class="mcell">${U.meter(p)}<span>${p.toFixed(0)}%</span></div>`; } },
        { k: 'al', label: 'Alerta', nosort: true, render: r => { const p = r[3] / r[2] * 100; return p < 20 ? U.tag('Desviación crítica', 't-red') : p < 50 ? U.tag('Bajo ritmo', 't-amber') : U.tag('En ritmo', 't-green'); } }
      ],
        foot: `<tr><td></td><td class="mini">Otros ${D.cuadro.centros - top.length} centros de costo</td><td class="r num">${U.int(D.cuadro.items - tIt)}</td><td class="r num">${U.money(oMod, '')}</td><td class="r num">${U.money(oEje, '')}</td><td class="r num">${U.money(oMod - oEje, '')}</td><td>${U.meter(oEje / oMod * 100)}</td><td colspan="2"></td></tr>
          <tr><td></td><td style="font-weight:800">TOTAL INSTITUCIONAL</td><td class="r num" style="font-weight:700">${U.int(D.cuadro.items)}</td><td class="r num" style="font-weight:800">${U.money(pim, '')}</td><td class="r num" style="font-weight:800;color:var(--primary-dark)">${U.money(D.cuadro.ejecutado, '')}</td><td class="r num" style="font-weight:700">${U.money(pim - D.cuadro.ejecutado, '')}</td><td><b>${U.pct(D.cuadro.ejecutado, pim)}</b></td><td colspan="2"></td></tr>`
      });
      document.getElementById('cu-dga').addEventListener('click', () => this.verCentro(D.centros[1]));
    },
    verCentro(r) {
      const U = SIGA.ui;
      if (r[0] !== '104.07.08.01') {
        U.detail(r[1], [['Código', r[0]], ['Ítems en el cuadro', U.int(r[4])], ['Modificado', U.money(r[2])], ['Ejecutado', U.money(r[3])], ['Saldo por ejecutar', U.money(r[2] - r[3])], ['Avance', U.pct(r[3], r[2])]],
          null, `<div class="note info mt"><i class="fa-solid fa-circle-info"></i><div>Programado, modificado y ejecutado de los 254 centros en una sola pantalla, con alertas de desviación (P-13). El detalle de ítems de este centro se consulta en línea.</div></div>`);
        return;
      }
      const rows = D.cuadroDGA.map(x => { const prog = x[6] != null ? x[5] : x[3] * x[5], ejec = x[6] != null ? x[6] : x[4] * x[5]; return { cod: x[0], desc: x[1], um: x[2], cp: x[3], ce: x[4], pu: x[5], prog, ejec, saldo: prog - ejec }; });
      U.modal('Cuadro de necesidades 2026 · 104.07.08.01 DGA — Jefatura (91 ítems)', U.table([
        { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'desc', label: 'Descripción' }, { k: 'um', label: 'Und' },
        { k: 'cp', label: 'Cant. prog.', r: true }, { k: 'ce', label: 'Cant. ejec.', r: true },
        { k: 'prog', label: 'Programado', r: true, render: r => U.money(r.prog, '') }, { k: 'ejec', label: 'Ejecutado', r: true, render: r => U.money(r.ejec, '') },
        { k: 'saldo', label: 'Saldo (prog − ejec)', r: true, render: r => `<b class="${r.saldo < 0 ? 'saldo-neg' : 'saldo-pos'}">${U.money(r.saldo, '')}</b>` },
        { k: 'x', label: 'SIGA-U', render: r => r.saldo < 0 ? U.tag('Habría sido bloqueado', 't-red') : U.tag('Conforme', 't-green') }
      ], rows, { rowCls: r => r.saldo < 0 ? 'row-bad' : '' }) +
        `<div class="note warn mt"><i class="fa-solid fa-circle-exclamation"></i><div>Los valores negativos (−4,600.00 · −8.80 · −8.68 · −6.00) son ítems en los que se ejecutó <b>más de lo programado y modificado</b>. En el sistema actual la validación advierte pero no bloquea; en SIGA-U la transacción se revierte.</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn sec" id="cn-x"><i class="fa-solid fa-file-excel"></i> Exportar</button>`, 'wide')
        .querySelector('#cn-x').addEventListener('click', () => U.csv('cuadro_necesidades_104.07.08.01', ['Código', 'Descripción', 'Und', 'Cant. prog.', 'Cant. ejec.', 'Programado', 'Ejecutado', 'Saldo'], rows.map(r => [r.cod, r.desc, r.um, r.cp, r.ce, r.prog.toFixed(2), r.ejec.toFixed(2), r.saldo.toFixed(2)])));
    },

    /* ---------------- Compromisos ---------------- */
    paintComp() {
      const U = SIGA.ui, M = D.mensual.labels;
      const tot = M.map((_, i) => D.compromisos.reduce((s, c) => s + c.meses[i], 0) / 1000);
      const eje = M.map((_, i) => D.compromisos.reduce((s, c) => s + (i < c.ejec ? c.meses[i] : 0), 0) / 1000);
      document.getElementById('p-comp').innerHTML = `
        <div class="split eq mb"><div class="card"><h3><span class="dot"></span>Calendario de compromisos 2026 <span class="grow">miles de soles · programado vs ejecutado</span></h3>
          ${U.chart.cols({ labels: M, series: [{ name: 'Programado', data: tot }, { name: 'Ejecutado', data: eje }], fmt: v => 'S/ ' + U.int(Math.round(v)) + ' mil', axFmt: v => U.int(v), h: 220 })}</div>
          <div class="card"><h3><span class="dot"></span>Compromiso anual y mensual <span class="grow">P-07 · P-08</span></h3>
            <p class="mini">El compromiso anual afecta el crédito de forma preventiva por el total del ejercicio; el mensual habilita la ejecución del mes. Ambos se validan contra la certificación previa y se transmiten al SIAF sin digitación.</p>
            <div class="checklist mt">${[['Validación contra certificación', 'compromiso ≤ certificado'], ['Distribución mensual', 'según programación'], ['Registro SIAF', 'por interfaz, con reintento'], ['Alerta de desvío', 'ejecutado < programado del mes']].map(x => `<div class="ck ok"><i class="fa-solid fa-circle-check"></i><span>${x[0]}</span><em>${x[1]}</em></div>`).join('')}</div></div></div>
        <div class="card"><h3><span class="dot"></span>Compromisos anuales vigentes <span class="grow">clic para ver la distribución mensual</span></h3><div id="cm-t"></div></div>`;
      const verComp = c => {
          const cells = c.meses.map((v, i) => `<div class="mini-card" style="${i < c.ejec ? 'border-color:rgba(26,187,156,.5);background:rgba(26,187,156,.05)' : i === c.ejec ? 'border-color:var(--secondary)' : ''}"><div class="lab">${M[i]}</div><div class="v" style="font-size:13px">${v ? U.int(v) : '—'}</div><div class="s">${i < c.ejec ? 'ejecutado' : i === c.ejec ? 'mes en curso' : 'programado'}</div></div>`).join('');
          const b = U.modal('Compromiso ' + c.doc + ' · distribución mensual', `<p class="mini mb">${c.desc} · ${c.prov}</p><div class="grid cols-6" style="gap:8px">${cells}</div>`,
            `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="cm-pr"><i class="fa-solid fa-print"></i> Imprimir</button>${c.ejec < 12 ? `<button class="btn" id="cm-reg"><i class="fa-solid fa-calendar-check"></i> Registrar compromiso mensual de ${M[c.ejec]}</button>` : ''}`, 'wide');
          b.querySelector('#cm-pr').addEventListener('click', () => U.rec(cRec).imprimir(c));
          b.querySelector('#cm-reg')?.addEventListener('click', () => regMes(c));
      };
      const regMes = c => {
            if (c.ejec >= 12) return; const v = c.meses[c.ejec]; c.ejec++;
            SIGA.siaf('Compromiso mensual', c.doc + ' · ' + M[c.ejec - 1], v); SIGA.log('Presupuesto', 'Compromiso mensual', c.doc, '—', M[c.ejec - 1] + ' ' + U.money(v));
            U.closeModal(); U.toast(`Compromiso mensual ${M[c.ejec - 1]} de ${c.doc} registrado y enviado al SIAF`); SIGA.refresh();
      };
      const cRec = { mod: 'Presupuesto', tipo: 'Compromiso anual', office: 'Oficina de Planificación y Presupuesto', key: r => r.doc, title: r => 'Compromiso ' + r.doc, cls: false, view: verComp,
        fields: c => [['Documento', c.doc], ['Objeto', c.desc, 1], ['Contratista', c.prov, 1], ['Compromiso anual', U.money(c.anual)], ['Ejecutado', U.money(c.meses.slice(0, c.ejec).reduce((s, x) => s + x, 0))], ['Meses ejecutados', c.ejec + ' de 12']],
        extra: c => c.ejec < 12 ? [{ icon: 'fa-calendar-check', label: 'Registrar compromiso mensual de ' + M[c.ejec], fn: regMes }] : [],
        print: c => ({ tipo: 'Compromiso anual', num: c.doc, pairs: [['Objeto', U.esc(c.desc), 1], ['Contratista', U.esc(c.prov), 1], ['Compromiso anual', U.money(c.anual)]], body: dtbl([['Mes'], ['Programado', 1], ['Estado']], c.meses.map((v, i) => [M[i], U.money(v, ''), i < c.ejec ? 'Comprometido' : 'Programado'])) }) };
      document.getElementById('cm-t').innerHTML = U.grid({ id: 'ppto-comp', title: 'compromisos', export: 'compromisos_anuales', rows: D.compromisos, record: cRec,
        cols: [
        { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'desc', label: 'Objeto' }, { k: 'prov', label: 'Contratista' },
        { k: 'anual', label: 'Compromiso anual', r: true, render: r => U.money(r.anual) },
        { k: 'e', label: 'Ejecutado', r: true, sv: r => r.meses.slice(0, r.ejec).reduce((s, x) => s + x, 0), render: r => U.money(r.meses.slice(0, r.ejec).reduce((s, x) => s + x, 0)) },
        { k: 'p', label: 'Avance', sv: r => r.meses.slice(0, r.ejec).reduce((s, x) => s + x, 0) / r.anual, render: r => { const p = r.meses.slice(0, r.ejec).reduce((s, x) => s + x, 0) / r.anual * 100; return `<div class="mcell">${U.meter(p, 'var(--secondary)')}<span>${p.toFixed(0)}%</span></div>`; } }
      ],
        actions: [{ icon: 'fa-calendar-check', title: 'Registrar compromiso mensual', show: r => r.ejec < 12, fn: regMes }],
        foot: rs => `<tr><td colspan="3" class="r"><b>Total comprometido</b></td><td class="r num"><b>${U.money(rs.reduce((s, c) => s + c.anual, 0))}</b></td><td class="r num"><b>${U.money(rs.reduce((s, c) => s + c.meses.slice(0, c.ejec).reduce((a, x) => a + x, 0), 0))}</b></td><td colspan="2"></td></tr>` });
    },

    /* ---------------- Notas modificatorias ---------------- */
    paintNotas() {
      const U = SIGA.ui;
      document.getElementById('p-tnotas').innerHTML = U.grid({ id: 'ppto-notas', title: 'notas modificatorias', export: 'notas_modificatorias', rows: D.notas, record: notaRec,
        filter: { label: 'Tipo', get: r => r.tipo },
        cols: [
        { k: 'n', label: 'N° Nota', render: r => `<span class="code">${r.n}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha.split('/').reverse().join('') },
        { k: 'tipo', label: 'Tipo', render: r => U.tag(r.tipo, r.tipoCls) }, { k: 'fte', label: 'Fte' }, { k: 'concepto', label: 'Concepto' },
        { k: 'hab', label: 'Habilita', r: true, render: r => r.hab ? `<span class="saldo-pos">+${U.money(r.hab, '')}</span>` : '—' },
        { k: 'anu', label: 'Anula', r: true, render: r => r.anu ? `<span class="saldo-neg">−${U.money(r.anu, '')}</span>` : '—' },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.estado === 'Aprobada' ? 't-green' : 't-gray') + (r.auto ? ' ' + U.tag('automática', 't-teal') : '') }
      ], rowCls: r => r.anulado ? 'row-void' : '',
        foot: `<tr><td colspan="5" class="r" style="font-weight:700">PIA ${U.money(D.pia)} + modificaciones =</td><td colspan="2" class="r" style="font-weight:800;color:var(--primary-dark)">PIM ${U.money(api.pim())}</td><td colspan="2"></td></tr>` });
    },
    nuevaNota() {
      const U = SIGA.ui;
      U.bigForm({
        title: 'Nueva nota modificatoria', icon: 'fa-file-pen', size: '',
        sections: [{ title: 'Datos de la nota', cols: 2, fields: [
          { k: 'tipo', label: 'Tipo', type: 'select', options: ['Crédito suplem.', 'Habilitación', 'Anulación'], span: 1 },
          { k: 'fte', label: 'Fuente', type: 'select', options: D.fuentes.map(f => f.cod + ' · ' + f.nom), span: 1 },
          { k: 'concepto', label: 'Concepto', required: true, value: '' },
          { k: 'doc', label: 'Documento de respaldo', value: 'Resolución Rectoral N.º ', span: 1 },
          { k: 'x', label: ' ', value: '', ro: true, span: 1 },
          { k: 'hab', label: 'Habilita S/', type: 'number', value: 0, span: 1 }, { k: 'anu', label: 'Anula S/', type: 'number', value: 0, span: 1 }
        ] }],
        status: (r, v) => v.tipo === 'Habilitación' && Math.abs((+v.hab || 0) - (+v.anu || 0)) > 0.005 ? `<div class="note warn"><i class="fa-solid fa-scale-unbalanced"></i><div>En una habilitación el importe habilitado debe ser igual al anulado.</div></div>` : '',
        submitLabel: 'Registrar nota',
        onSubmit: v => {
          const hab = +v.hab || 0, anu = +v.anu || 0;
          if (v.tipo === 'Habilitación' && Math.abs(hab - anu) > 0.005) { U.toast('La habilitación debe cuadrar (habilita = anula)', 'err'); return; }
          if (!hab && !anu) { U.toast('Ingrese un importe', 'err'); return; }
          const f = api.fuente(v.fte.slice(0, 2)), antes = api.pim();
          f.pim += hab - anu; D.genericas[0].pim += hab - anu;
          const n = 'NM-' + SIGA.ui.pad(40 + D.notas.length, 4);
          D.notas.unshift({ n, fecha: SIGA.ctx.hoy, tipo: v.tipo, tipoCls: v.tipo === 'Habilitación' ? 't-amber' : v.tipo === 'Anulación' ? 't-red' : 't-blue', concepto: v.concepto, fte: f.cod, hab, anu, estado: 'Aprobada' });
          SIGA.siaf('Nota modificatoria', n, hab - anu);
          SIGA.log('Presupuesto', 'Nota modificatoria', n, 'PIM ' + U.money(antes), 'PIM ' + U.money(api.pim()));
          U.closeModal(); SIGA.refresh(); U.toast(`Nota ${n} registrada · marco actualizado al instante`);
        }
      });
    },

    /* ---------------- Multianual y POI ---------------- */
    paintPmi() {
      const U = SIGA.ui;
      document.getElementById('p-pmi').innerHTML = `<div class="card mb"><h3><span class="dot"></span>Programación multianual de gastos 2027–2029 <span class="grow">P-01 · proyección a tres años por centro de costo</span></h3><div id="pm-t"></div></div>
        <div class="card"><h3><span class="dot"></span>Seguimiento del Plan Operativo Institucional (POI) <span class="grow">P-10 · avance físico vs financiero por meta</span></h3><div id="poi-t"></div>
        <p class="mini mt">Cuando el avance físico supera al financiero, la meta avanza con menos recursos de los asignados; cuando ocurre lo inverso, se gasta sin resultado proporcional. Ambas desviaciones se alertan.</p></div>`;
      const pmRec = { mod: 'Presupuesto', tipo: 'Programación multianual', key: r => 'PMG ' + r[0], title: r => r[1], cls: false,
        fields: r => [['Centro de costo', r[0] + ' · ' + r[1], 1], ['PIM 2026', U.money(r[2])], ['2027', U.money(r[3])], ['2028', U.money(r[4])], ['2029', U.money(r[5])]],
        edit: [3, 4, 5].map((i, j) => ({ k: 'a' + i, label: 'Proyección ' + (2027 + j) + ' S/', type: 'number', span: 1, get: r => r[i], set: (r, v) => r[i] = v })) };
      document.getElementById('pm-t').innerHTML = U.grid({ id: 'ppto-pmg', title: 'programación multianual', export: 'programacion_multianual_2027_2029', rows: D.multianual, record: pmRec, search: false,
        cols: [
        { k: 0, label: 'Código', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Centro de costo' },
        { k: 2, label: 'PIM 2026', r: true, render: r => U.money(r[2], '') }, { k: 3, label: '2027', r: true, render: r => U.money(r[3], '') },
        { k: 4, label: '2028', r: true, render: r => U.money(r[4], '') }, { k: 5, label: '2029', r: true, render: r => U.money(r[5], '') },
        { k: 6, label: 'Var. 2027', r: true, sv: r => r[3] / r[2], render: r => { const p = (r[3] / r[2] - 1) * 100; return `<span class="${p < 0 ? 'saldo-neg' : 'saldo-pos'}">${p > 0 ? '+' : ''}${p.toFixed(1)}%</span>`; } }
      ], foot: rs => `<tr><td colspan="2" class="r"><b>Total</b></td>${[2, 3, 4, 5].map(i => `<td class="r num"><b>${U.money(rs.reduce((s, r) => s + r[i], 0), '')}</b></td>`).join('')}<td colspan="2"></td></tr>` });
      const poiRec = { mod: 'Presupuesto', tipo: 'Seguimiento POI', key: r => r[0], title: r => r[0] + ' · ' + r[1], cls: false,
        fields: r => [['Actividad operativa', r[0] + ' · ' + r[1], 1], ['Meta presupuestal', r[2]], ['Unidad de medida', r[3]], ['Meta física anual', U.int(r[4])], ['Avance físico', U.int(r[5]) + ' (' + r[6] + '%)'], ['Avance financiero', r[7] + '%']],
        edit: [{ k: 'av', label: 'Avance físico acumulado', type: 'number', span: 1, get: r => r[5], set: (r, v) => { r[5] = v; r[6] = Math.round(v / r[4] * 100); } }] };
      document.getElementById('poi-t').innerHTML = U.grid({ id: 'ppto-poi', title: 'POI', export: 'seguimiento_poi', rows: D.poi, record: poiRec, search: false,
        cols: [
        { k: 0, label: 'Actividad operativa', render: r => `<span class="code">${r[0]}</span><div>${r[1]}</div>` }, { k: 2, label: 'Meta' }, { k: 3, label: 'Unidad de medida' },
        { k: 4, label: 'Meta física', r: true, render: r => U.int(r[4]) }, { k: 5, label: 'Avance', r: true, render: r => U.int(r[5]) },
        { k: 6, label: '% físico', render: r => `<div class="mcell">${U.meter(r[6], 'var(--secondary)')}<span>${r[6]}%</span></div>` },
        { k: 7, label: '% financiero', render: r => `<div class="mcell">${U.meter(r[7], 'var(--primary)')}<span>${r[7]}%</span></div>` },
        { k: 8, label: 'Señal', sv: r => Math.abs(r[6] - r[7]), render: r => Math.abs(r[6] - r[7]) > 25 ? U.tag('Desalineado', 't-amber') : U.tag('Alineado', 't-green') }
      ], actions: [{ icon: 'fa-pen', title: 'Registrar avance físico', fn: r => U.rec(poiRec).editar(r) }] });
    },

    /* ---------------- Conciliación con el SIAF ---------------- */
    paintConc() {
      const U = SIGA.ui, C = SIGA.data.integracion.conciliacion;
      document.getElementById('p-concp').innerHTML = `
        <div class="cmp mb"><div class="asis"><h5>Hoy · conciliación manual</h5><div class="big-n neg">180 h</div>Contraste registro por registro entre el SIAF y el sistema interno. Ambos muestran cifras distintas mientras tanto.</div>
          <div class="tobe"><h5>SIGA-U · conciliación automática diaria</h5><div class="big-n pos">&lt; 7 h · −96%</div>El motor contrasta ambos sistemas cada noche y solo reporta diferencias reales.</div></div>
        <div class="card"><h3><span class="dot"></span>Conciliación SIGA-U ↔ SIAF-SP por fase del gasto <span class="grow" id="cc-when">última ejecución: 17/08/2026 23:00 · 0 diferencias</span></h3>
          <div id="cc-t"></div><div class="row-flex mt"><button class="btn" id="cc-go"><i class="fa-solid fa-rotate"></i> Conciliar ahora</button><span class="mini" id="cc-st"></span></div></div>`;
      document.getElementById('cc-t').innerHTML = U.table([
        { k: 0, label: 'Fase' }, { k: 1, label: 'Registros SIGA-U', r: true, render: r => U.int(r[1]) }, { k: 2, label: 'Importe SIGA-U', r: true, render: r => U.money(r[2], '') },
        { k: 3, label: 'Registros SIAF', r: true, render: r => U.int(r[3]) }, { k: 4, label: 'Importe SIAF', r: true, render: r => U.money(r[4], '') },
        { k: 5, label: 'Diferencia', r: true, render: r => `<b class="${Math.abs(r[2] - r[4]) > 0.005 ? 'saldo-neg' : 'saldo-pos'}">${U.money(r[2] - r[4], '')}</b>` },
        { k: 6, label: 'Estado', render: r => Math.abs(r[2] - r[4]) > 0.005 ? U.tag('Con diferencia', 't-red') : U.tag('Conciliado', 't-green') }
      ], C);
      document.getElementById('cc-go').addEventListener('click', () => this.conciliar());
    },
    conciliar() {
      const st = document.getElementById('cc-st'); if (!st) return;
      const U = SIGA.ui; let i = 0; const ph = ['Descargando marco vigente del SIAF…', 'Contrastando certificaciones…', 'Contrastando compromisos y devengados…', 'Contrastando girados y pagados…'];
      const t = setInterval(() => {
        if (i < ph.length) { st.textContent = ph[i++]; return; }
        clearInterval(t); st.innerHTML = '<b class="pos">✓ 0 diferencias · 5,350 registros conciliados</b>';
        document.getElementById('cc-when').textContent = 'última ejecución: ' + U.now() + ' · 0 diferencias';
        SIGA.log('Integración', 'Conciliación SIGA-U ↔ SIAF (manual)', SIGA.ctx.hoy, '—', '0 diferencias');
      }, 500);
    },

    /* ---------------- Evaluación presupuestaria ---------------- */
    paintEval() {
      const U = SIGA.ui, G = D.genericas;
      const sem1 = { '2.3': 0.83, '2.4': 0.78, '2.5': 0.80, '2.6': 0.66 }; // devengado al 30/06 respecto del devengado a la fecha
      const rows = G.map(g => { const e = g.dev * sem1[g.cod]; return { g: g.cod + ' ' + g.nom, pim: g.pim, e, p: e / g.pim * 100, meta: g.cod === '2.6' ? 40 : 50 }; });
      document.getElementById('p-eval').innerHTML = `<div class="card"><h3><span class="dot"></span>Evaluación presupuestaria · I semestre 2026 <span class="grow">P-09 · generada del propio registro, sin armado manual</span></h3>
        <div id="ev-t"></div><div class="row-flex mt"><button class="btn" id="ev-gen"><i class="fa-solid fa-file-lines"></i> Generar informe de evaluación</button><span class="mini">Formato del pliego · semestral y anual</span></div></div>`;
      document.getElementById('ev-t').innerHTML = U.table([
        { k: 'g', label: 'Genérica de gasto' }, { k: 'pim', label: 'PIM', r: true, render: r => U.money(r.pim, '') },
        { k: 'e', label: 'Ejecución al 30/06', r: true, render: r => U.money(r.e, '') },
        { k: 'p', label: 'Avance', render: r => `<div class="mcell">${U.meter(r.p / r.meta * 100)}<span>${r.p.toFixed(1)}%</span></div>` },
        { k: 'meta', label: 'Meta semestral', r: true, render: r => r.meta + '%' },
        { k: 'ef', label: 'Eficacia', render: r => { const e = r.p / r.meta; return U.tag((e * 100).toFixed(0) + '% · ' + (e >= 0.9 ? 'Muy buena' : e >= 0.7 ? 'Regular' : 'Deficiente'), e >= 0.9 ? 't-green' : e >= 0.7 ? 't-amber' : 't-red'); } }
      ], rows);
      document.getElementById('ev-gen').addEventListener('click', () => {
        const low = rows.slice().sort((a, b) => a.p / a.meta - b.p / b.meta)[0];
        const tot = rows.reduce((s, r) => s + r.e, 0), pim = rows.reduce((s, r) => s + r.pim, 0);
        U.preview('Informe de evaluación presupuestaria · I semestre 2026', `<div class="doc" style="position:static">
          <div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional Agraria de la Selva</b><span>Oficina de Planificación y Presupuesto</span></div></div><div class="doc-num"><div class="tp">Evaluación presupuestaria</div><div class="nn">I-2026</div><div class="yr">Generado ${U.now()}</div></div></div>
          <p style="font-size:11.5px;margin-bottom:10px"><b>1. Resumen.</b> Al cierre del primer semestre el pliego ejecutó ${U.money(tot)} de un PIM de ${U.money(pim)} (${U.pct(tot, pim)}). La genérica con menor eficacia es <b>${low.g}</b> (${low.p.toFixed(1)}% frente a una meta de ${low.meta}%), explicada principalmente por el bajo avance de la Unidad Ejecutora de Inversiones (6% en el cuadro de necesidades).</p>
          <p style="font-size:11.5px;margin-bottom:10px"><b>2. Recomendaciones.</b> (a) Priorizar el seguimiento semanal de las obras con certificación vigente; (b) reprogramar los saldos de los centros con avance menor al 20%; (c) mantener el control preventivo de disponibilidad, que en el periodo no registró sobregiros nuevos.</p>
          <table class="doc-tbl"><thead><tr><th>Genérica</th><th class="r">PIM</th><th class="r">Ejecución</th><th class="r">Avance</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.g}</td><td class="r">${U.money(r.pim, '')}</td><td class="r">${U.money(r.e, '')}</td><td class="r">${r.p.toFixed(1)}%</td></tr>`).join('')}</tbody></table>
          <div class="doc-sign"><div><b>Analista de Presupuesto</b>Elaboró</div><div><b>Jefe de P&P</b>Revisó</div><div><b>Rectorado</b>Toma conocimiento</div></div>
          <div class="doc-qr">${U.qr('EVAL-I-2026', 58)}<span>Documento generado desde el registro transaccional · ${U.now()}</span></div></div>`, { file: 'evaluacion_presupuestaria_I_2026', csv: () => U.csv('evaluacion_presupuestaria_I_2026', ['Genérica', 'PIM', 'Ejecución al 30/06', 'Avance %', 'Meta %'], rows.map(r => [r.g, r.pim.toFixed(2), r.e.toFixed(2), r.p.toFixed(1), r.meta])) });
        SIGA.log('Presupuesto', 'Generación de evaluación presupuestaria', 'I semestre 2026');
      });
    }
  });
})();
