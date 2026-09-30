/* ============================================================
   Recursos Humanos y Planillas · "1,197 trabajadores, nueve regímenes, una sola planilla"
   ============================================================ */
(function () {
  const P = SIGA.data.planilla;
  const tot = (t, k) => t.c.filter(c => c[1] === k).reduce((s, c) => s + c[2], 0);
  const neto = t => tot(t, 'I') - tot(t, 'D');
  const R = () => P.regimenes.map(r => ({ cod: r[0], nom: r[1], n: r[2], ing: r[3], desc: r[4], apo: r[5], neto: r[3] - r[4], clas: r[6] }));

  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const PL = () => SIGA.modules.planilla;
  const boletaDoc = t => { const U = SIGA.ui; return U.doc({ tipo: 'Boleta de pago', num: t.cod, fecha: 'Agosto 2026', office: 'Unidad de Recursos Humanos',
    pairs: [['Cargo', t.cargo], ['Régimen', t.reg], ['Dependencia', t.dep], ['Sistema de pensiones', t.sis + (t.cuspp !== '—' ? ' · CUSPP ' + t.cuspp : '')], ['Fecha de ingreso', t.ing], ['Abono', t.banco]],
    body: dtbl([['Concepto'], ['Tipo'], ['Importe', 1]], t.c.map(c => [c[0], { I: 'Ingreso', D: 'Descuento', A: 'Aporte empleador' }[c[1]], U.money(c[2], '')])) + dtbl([['Resumen'], ['S/', 1]], [['Total ingresos (TOTGEN)', U.money(tot(t, 'I'), '')], ['Total descuentos', U.money(tot(t, 'D'), '')], ['<b>Neto a pagar (TOTNET)</b>', '<b>' + U.money(neto(t), '') + '</b>'], ['Aportes del empleador', U.money(tot(t, 'A'), '')]]) + `<p class="mini">${U.montoLetras(neto(t))}</p>`,
    firmas: [['Jefe de Recursos Humanos', 'Firma digital'], ['Trabajador', t.cod], ['Director General de Administración', 'E. Mendoza']] }); };
  const trabRec = SIGA.recs.trabajador = {
    mod: 'Planillas', tipo: 'Ficha del trabajador', office: 'Unidad de Recursos Humanos', key: t => t.cod, title: t => t.cod + ' · ' + t.cargo, estado: 'cond', cls: false, anuladoValor: 'Cesado',
    view: t => PL().legajo(t),
    fields: t => [['Código', t.cod], ['DNI', t.dni], ['Régimen', t.reg], ['Cargo', t.cargo], ['Dependencia', t.dep], ['Condición', t.cond], ['Ingreso', t.ing], ['Pensiones', t.sis], ['Cuenta', t.banco], ['Correo', t.correo], ['Neto de agosto', SIGA.ui.money(neto(t))]],
    edit: [{ k: 'cargo', label: 'Cargo' }, { k: 'dep', label: 'Dependencia', span: 1 }, { k: 'sis', label: 'Sistema de pensiones', type: 'select', options: ['ONP', 'AFP Integra', 'AFP Prima', 'AFP Profuturo', 'AFP Habitat', 'D.L. 20530', '—'], span: 1 }, { k: 'banco', label: 'Cuenta de abono', span: 1 }, { k: 'correo', label: 'Correo institucional', span: 1 }],
    onEdit: (t, v, ch) => t.hist.unshift([SIGA.ctx.hoy, 'Actualización del legajo · ' + ch.map(c => c[0]).join(', ')]),
    anular: true, anularLabel: 'Registrar cese', canAnular: t => !['Cesado', 'Pensionista'].includes(t.cond),
    onAnular: (t, m) => { t.hist.unshift([SIGA.ctx.hoy, 'Cese · ' + m]); const r = P.regimenes.find(x => x[0] === t.reg.slice(0, 2)); if (r) { r[2]--; r[3] -= tot(t, 'I'); } },
    extra: t => [
      { icon: 'fa-file-invoice', label: 'Boleta de agosto', fn: x => PL().boleta(x) },
      { icon: 'fa-file-signature', label: 'Constancia de haberes', menuOnly: true, fn: x => PL().constancia(x, 'haberes') },
      { icon: 'fa-award', label: 'Certificado de trabajo', menuOnly: true, fn: x => PL().constancia(x, 'trabajo') }
    ],
    print: t => ({ tipo: 'Ficha del trabajador', num: t.cod, body: dtbl([['Fecha'], ['Movimiento del legajo']], t.hist.map(h => [h[0], h[1]])) }),
    mailTo: t => t.correo.includes('•') ? 'trabajador@unas.edu.pe' : t.correo
  };

  SIGA.registerModule('planilla', {
    title: 'Planillas y RR.HH.', icon: 'fa-users', group: 'Registro y control',
    alerts() { return P.generada ? [] : [{ lvl: 'info', icon: 'fa-users', t: 'Planilla de agosto por generar', d: '1,197 trabajadores · 9 regímenes' }]; },
    search(q) { return P.trabajadores.filter(t => (t.cod + ' ' + t.cargo + ' ' + t.dep + ' ' + t.reg).toLowerCase().includes(q)).map(t => ({ t: t.cod + ' · ' + t.cargo, d: t.reg + ' · ' + t.dep, fn: () => this.legajo(t) })); },
    render(el) {
      const U = SIGA.ui, rs = R();
      const T = { n: rs.reduce((s, r) => s + r.n, 0), ing: rs.reduce((s, r) => s + r.ing, 0), desc: rs.reduce((s, r) => s + r.desc, 0), apo: rs.reduce((s, r) => s + r.apo, 0) };
      el.innerHTML = `
      <div class="page-head"><div><h1>Planillas y Recursos Humanos</h1><p>${U.int(T.n)} trabajadores · nueve regímenes laborales · hasta 36 ingresos, 10 descuentos y 6 aportes por trabajador</p></div>
        <div class="row-flex"><button class="btn ghost" id="pl-nt"><i class="fa-solid fa-user-plus"></i> Nuevo trabajador</button><button class="btn" id="pl-gen" ${P.generada ? 'disabled' : ''}><i class="fa-solid fa-file-circle-check"></i> ${P.generada ? 'Planilla de agosto generada' : 'Generar planilla de agosto'}</button></div></div>
      ${U.kpis([
        { lab: 'Total trabajadores', val: U.int(T.n), sub: '9 regímenes laborales' },
        { lab: 'Planilla bruta del mes', val: U.mill(T.ing, 2), sub: 'neto a pagar ' + U.mill(T.ing - T.desc, 2) },
        { lab: 'Aportes del empleador', val: U.money(T.apo), sub: 'EsSalud 9%' },
        { lab: 'Boletas electrónicas', val: P.generada ? '1,197' : '0', sub: P.generada ? 'enviadas · agosto' : 'se emiten al generar', chip: P.generada ? 'enviadas' : 'pendiente', chipType: P.generada ? 'up' : 'warn' }
      ])}
      <div class="seg-tabs" data-group="pl"><button class="on" data-tab="res">Resumen</button><button data-tab="tra">Legajo digital y boletas</button><button data-tab="men">Planilla mensual</button><button data-tab="apo">Aportes y retenciones</button><button data-tab="afe">Afectación presupuestal</button><button data-tab="asi">Asistencia</button><button data-tab="vac">Licencias y vacaciones</button></div>
      <div class="subpanel show" data-group="pl" data-panel="res" id="pl-p-res"></div>
      <div class="subpanel" data-group="pl" data-panel="tra"><div class="card"><h3><span class="dot"></span>Legajo digital <span class="grow">R-01 · datos personales, laborales, previsionales y bancarios con historial de cambios · clic para ver</span></h3><div id="pl-tra"></div></div></div>
      <div class="subpanel" data-group="pl" data-panel="men"><div class="card"><h3><span class="dot"></span>Planilla mensual consolidada · agosto 2026 <span class="grow">R-04 · cálculo por régimen</span></h3><div id="pl-men"></div></div></div>
      <div class="subpanel" data-group="pl" data-panel="apo" id="pl-p-apo"></div>
      <div class="subpanel" data-group="pl" data-panel="afe" id="pl-p-afe"></div>
      <div class="subpanel" data-group="pl" data-panel="asi"><div class="card"><h3><span class="dot"></span>Control de asistencia · agosto 2026 <span class="grow">R-09 · el efecto sobre los descuentos se calcula solo</span></h3><div id="pl-asi"></div></div></div>
      <div class="subpanel" data-group="pl" data-panel="vac" id="pl-p-vac"></div>`;
      this.paintRes(rs, T); this.paintTra(); this.paintMen(rs, T); this.paintApo(rs); this.paintAfe(rs); this.paintAsi(); this.paintVac();
      el.querySelector('#pl-gen').addEventListener('click', () => this.generar(T));
      el.querySelector('#pl-nt').addEventListener('click', () => this.alta());
    },
    paintRes(rs, T) {
      const U = SIGA.ui, max = Math.max(...rs.map(r => r.n));
      document.getElementById('pl-p-res').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Distribución del personal por régimen laboral <span class="grow">trabajadores · % del total</span></h3>
        ${U.bars(rs.map((r, i) => [r.cod + ' · ' + r.nom.split(' · ')[0].replace('Contratación administrativa de servicios', 'CAS'), r.n / max * 100, U.chart.PAL[i < 2 ? 0 : i < 4 ? 1 : 2], U.int(r.n) + ' · ' + (r.n / T.n * 100).toFixed(1) + '%']))}</div>
        <div><div class="card mb"><h3><span class="dot"></span>Estructura remunerativa <span class="grow">R-03 · tabla conremun</span></h3>
          <div style="display:flex;flex-direction:column;gap:8px">${[['1 · Ingresos (hasta 36)', 't-green', 'TOTGEN · bruto'], ['2 · Descuentos (hasta 10)', 't-red', '→ TOTNET · neto'], ['3 · Aportes (hasta 6)', 't-blue', 'carga del empleador'], ['4 · Reintegros', 't-amber', 'resoluciones retroactivas (R-11)'], ['5 · Encargaturas', 't-gray', 'efecto remunerativo (R-12)']].map(x => `<div class="row-flex" style="justify-content:space-between">${U.tag(x[0], x[1])}<span class="mini">${x[2]}</span></div>`).join('')}</div></div>
          <div class="card"><h3><span class="dot"></span>Lo que cambia para cada trabajador</h3><div class="checklist">${['Consulta y descarga su boleta sin pasar por la oficina', 'Histórico de boletas y constancias disponible', 'Aportes ONP/AFP/EsSalud y 5.ª calculados del maestro', 'La planilla afecta la específica de gasto en el mismo acto'].map(x => `<div class="ck ok"><i class="fa-solid fa-circle-check"></i><span>${x}</span></div>`).join('')}</div></div></div></div>`;
    },
    paintTra() {
      const U = SIGA.ui;
      document.getElementById('pl-tra').innerHTML = U.grid({ id: 'pla-tra', title: 'legajos', export: 'legajo_trabajadores', rows: P.trabajadores, record: trabRec, pageSize: 12,
        filter: { label: 'Régimen', get: r => r.reg },
        cols: [
        { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'cargo', label: 'Cargo', render: r => r.cargo + `<div class="mini">${r.dep}</div>` },
        { k: 'reg', label: 'Régimen' }, { k: 'sis', label: 'Pensiones' }, { k: 'cond', label: 'Condición', render: r => U.tag(r.cond, r.cond === 'Pensionista' ? 't-blue' : r.cond === 'Cesado' ? 't-gray' : 't-green') },
        { k: 'ing', label: 'Ingresos', r: true, sv: r => tot(r, 'I'), render: r => U.money(tot(r, 'I'), '') }, { k: 'neto', label: 'Neto', r: true, sv: neto, render: r => `<b>${U.money(neto(r), '')}</b>` }
      ], rowCls: r => (r.nuevo ? 'row-new' : '') + (r.cond === 'Cesado' ? ' row-void' : ''),
        actions: [{ icon: 'fa-file-invoice', title: 'Boleta electrónica', fn: t => this.boleta(t) }, { icon: 'fa-id-card', title: 'Legajo', fn: t => this.legajo(t) }],
        tools: [{ icon: 'fa-user-plus', label: 'Nuevo trabajador', primary: true, fn: () => this.alta() }],
        bulk: [
          { icon: 'fa-envelope', label: 'Enviar boletas por correo', fn: rs => { rs.forEach(t => SIGA.log('Planillas', 'Envío de boleta electrónica', t.cod + ' · agosto 2026', '—', t.correo)); U.toast(rs.length + ' boletas electrónicas enviadas con firma digital'); } },
          { icon: 'fa-print', label: 'Imprimir boletas', fn: rs => U.preview('Boletas de pago · agosto 2026 · ' + rs.length, rs.map(boletaDoc).join('<div class="pg-break"></div>'), { file: 'boletas_agosto_2026' }) }
        ],
        foot: rs => `<tr><td colspan="6" class="r"><b>Totales (${rs.length})</b></td><td class="r num"><b>${U.money(rs.reduce((s, t) => s + tot(t, 'I'), 0), '')}</b></td><td class="r num"><b>${U.money(rs.reduce((s, t) => s + neto(t), 0), '')}</b></td><td></td></tr>` });
    },
    constancia(t, tipo) {
      const U = SIGA.ui, hab = tipo === 'haberes';
      SIGA.log('Planillas', hab ? 'Emisión de constancia de haberes' : 'Emisión de certificado de trabajo', t.cod);
      U.preview(hab ? 'Constancia de haberes (R-13)' : 'Certificado de trabajo', U.doc({ tipo: hab ? 'Constancia de haberes' : 'Certificado de trabajo', num: 'N.º 0' + (412 + P.trabajadores.indexOf(t)) + '-2026-URH', office: 'Unidad de Recursos Humanos',
        body: hab ? `<p style="font-size:12px;line-height:1.7">La Unidad de Recursos Humanos hace constar que el trabajador identificado con código <b>${t.cod}</b>, con cargo de <b>${t.cargo}</b> bajo el régimen <b>${t.reg}</b>, percibe una remuneración bruta mensual de <b>${U.money(tot(t, 'I'))}</b> y un neto de <b>${U.money(neto(t))}</b> en el mes de agosto de 2026, conforme a la planilla de pagos de la institución.</p><p style="font-size:12px">Se expide la presente a solicitud del interesado. Tingo María, ${SIGA.ctx.hoy}.</p>`
          : `<p style="font-size:12px;line-height:1.7">Se certifica que el trabajador con código <b>${t.cod}</b> labora en la Universidad Nacional Agraria de la Selva desde el <b>${t.ing}</b>, desempeñando el cargo de <b>${t.cargo}</b> en ${t.dep}, bajo el régimen ${t.reg}, habiendo demostrado responsabilidad y eficiencia.</p><p style="font-size:12px">Tingo María, ${SIGA.ctx.hoy}.</p>`,
        firmas: [['Jefe de la Unidad de Recursos Humanos', 'Firma digital']] }), { file: (hab ? 'constancia_haberes_' : 'certificado_trabajo_') + t.cod.replace(/\W/g, '') });
    },
    boleta(t) {
      const U = SIGA.ui, col = (k, c, title) => `<div style="flex:1;min-width:190px"><div style="font-weight:700;color:${c};font-size:11px;text-transform:uppercase;margin-bottom:6px">${title}</div>${t.c.filter(x => x[1] === k).map(x => `<div class="ef-row"><span>${x[0]}</span><span class="num">${U.money(x[2], '')}</span></div>`).join('') || '<div class="mini">—</div>'}<div class="ef-row tot"><span>Total</span><span class="num">${U.money(tot(t, k), '')}</span></div></div>`;
      const b = U.modal('Boleta de pago electrónica · agosto 2026', `<div class="doc" style="position:static;padding:20px">
        <div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional Agraria de la Selva</b><span>Unidad de Recursos Humanos · RUC 20161749126</span></div></div><div class="doc-num"><div class="tp">Boleta de pago</div><div class="nn">${t.cod}</div><div class="yr">Agosto 2026</div></div></div>
        <div class="doc-party"><div><div class="k">Cargo</div><div class="v">${t.cargo}</div></div><div><div class="k">Régimen</div><div class="v">${t.reg}</div></div><div><div class="k">Dependencia</div><div class="v">${t.dep}</div></div><div><div class="k">Sistema de pensiones</div><div class="v">${t.sis} ${t.cuspp !== '—' ? '· CUSPP ' + t.cuspp : ''}</div></div><div><div class="k">Fecha de ingreso</div><div class="v">${t.ing}</div></div><div><div class="k">Abono</div><div class="v">${t.banco}</div></div></div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">${col('I', 'var(--ok)', 'Ingresos')}${col('D', 'var(--danger)', 'Descuentos')}${col('A', 'var(--secondary-dark)', 'Aportes del empleador')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:2px solid var(--line)"><b style="font-size:13px">NETO A PAGAR</b><b style="font-size:20px;color:var(--primary-dark)">${U.money(neto(t))}</b></div>
        <div class="doc-letras" style="margin-top:8px">${U.montoLetras(neto(t))}</div>
        <div class="mini" style="text-align:center"><i class="fa-solid fa-qrcode"></i> Boleta electrónica con firma digital · TOTGEN = Σ ingresos · TOTNET = TOTGEN − descuentos</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="bo-hist"><i class="fa-solid fa-clock-rotate-left"></i> Histórico</button><button class="btn sec" id="bo-mail"><i class="fa-solid fa-envelope"></i> Enviar al correo</button><button class="btn" id="bo-pdf"><i class="fa-solid fa-print"></i> Imprimir / PDF</button>`, 'wide');
      b.querySelector('#bo-pdf').addEventListener('click', () => U.preview('Boleta de pago · ' + t.cod, boletaDoc(t), { file: 'boleta_' + t.cod.replace(/\W/g, '') + '_2026_08' }));
      b.querySelector('#bo-mail').addEventListener('click', () => { SIGA.log('Planillas', 'Envío de boleta electrónica', t.cod + ' · agosto 2026', '—', t.correo); U.mail({ to: t.correo.includes('•') ? 'trabajador@unas.edu.pe' : t.correo, asunto: 'Boleta de pago · agosto 2026 · ' + t.cod, adj: 'boleta_' + t.cod.replace(/\W/g, '') + '_2026_08.pdf' }); });
      b.querySelector('#bo-hist').addEventListener('click', () => U.modal('Histórico de boletas · ' + t.cod, U.table([{ k: 0, label: 'Periodo' }, { k: 1, label: 'Neto', r: true, render: r => U.money(r[1]) }, { k: 2, label: 'Estado', render: () => U.tag('Descargable', 't-green') }], ['Agosto', 'Julio', 'Junio', 'Mayo', 'Abril', 'Marzo'].map((m, i) => [m + ' 2026', neto(t) * (i === 0 ? 1 : 0.99)])), `<button class="btn ghost" data-close>Cerrar</button>`, 'narrow'));
    },
    legajo(t) {
      const U = SIGA.ui;
      const b = U.modal('Legajo digital · ' + t.cod, `<div class="ficha mb">${[['Datos personales', [['Código', t.cod], ['DNI', t.dni], ['Correo institucional', t.correo]]], ['Datos laborales', [['Régimen', t.reg], ['Cargo', t.cargo], ['Dependencia', t.dep], ['Condición', t.cond], ['Fecha de ingreso', t.ing]]], ['Previsionales y bancarios', [['Sistema de pensiones', t.sis], ['CUSPP', t.cuspp], ['Salud', 'EsSalud'], ['Cuenta de abono', t.banco]]]].map(g => `<div class="mini-card"><div class="lab" style="margin-bottom:6px">${g[0]}</div>${g[1].map(p => `<div class="ef-row"><span class="mini">${p[0]}</span><b style="font-size:11.5px">${p[1]}</b></div>`).join('')}</div>`).join('')}</div>
        <div class="split eq"><div><div class="lbl-s mb">Historial de cambios (bitácora)</div>${U.timeline(t.hist.map(h => ({ t: h[1], when: h[0], st: 'done' })))}</div>
        <div><div class="lbl-s mb">Documentos del legajo</div>${['Resolución de nombramiento o contrato', 'Grados y títulos (SUNEDU)', 'Declaración jurada de bienes', 'Constancia de afiliación previsional'].map(d => `<div class="doc-attach"><i class="fa-solid fa-file-pdf"></i><span>${d}.pdf</span>${U.tag('verificado', 't-green')}</div>`).join('')}</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="lg-hist"><i class="fa-solid fa-clock-rotate-left"></i> Historial</button><button class="btn ghost" id="lg-edit"><i class="fa-solid fa-pen"></i> Editar</button><button class="btn ghost" id="lg-cons"><i class="fa-solid fa-file-signature"></i> Constancia de haberes</button><button class="btn" id="lg-bol"><i class="fa-solid fa-file-invoice"></i> Boleta de agosto</button>`, 'wide');
      b.querySelector('#lg-bol').addEventListener('click', () => this.boleta(t));
      b.querySelector('#lg-cons').addEventListener('click', () => this.constancia(t, 'haberes'));
      b.querySelector('#lg-edit').addEventListener('click', () => U.rec(Object.assign({}, trabRec, { view: null })).editar(t));
      b.querySelector('#lg-hist').addEventListener('click', () => U.rec(trabRec).historial(t));
    },
    paintMen(rs, T) {
      const U = SIGA.ui;
      const regRec = { mod: 'Planillas', tipo: 'Resumen de planilla por régimen', key: r => 'Régimen ' + r.cod, title: r => r.cod + ' · ' + r.nom, cls: false,
        fields: r => [['Régimen', r.cod + ' · ' + r.nom, 1], ['Trabajadores', U.int(r.n)], ['Clasificador', r.clas], ['Ingresos', U.money(r.ing)], ['Descuentos', U.money(r.desc)], ['Aportes', U.money(r.apo)], ['Neto a pagar', `<b>${U.money(r.neto)}</b>`]],
        body: r => { const ts = P.trabajadores.filter(t => t.reg.slice(0, 2) === r.cod); return ts.length ? `<div class="lbl-s mt mb">Trabajadores de la muestra (${ts.length})</div>` + U.table([{ k: 'cod', label: 'Código' }, { k: 'cargo', label: 'Cargo' }, { k: 'n', label: 'Neto', r: true, render: t => U.money(neto(t)) }], ts, { onRow: t => this.boleta(t) }) : ''; },
        extra: r => [{ icon: 'fa-file-export', label: 'Archivo de abono del régimen', fn: x => U.download('ABONO_PLANILLA_' + x.cod + '_202608.txt', ['H|20161749126|PLANILLA ' + x.cod + '|' + x.n + '|' + x.neto.toFixed(2)].concat(P.trabajadores.filter(t => t.reg.slice(0, 2) === x.cod).map((t, i) => 'D|' + String(i + 1).padStart(4, '0') + '|' + t.dni + '|' + t.banco + '|' + neto(t).toFixed(2))).join('\n')) }] };
      document.getElementById('pl-men').innerHTML = U.grid({ id: 'pla-men', title: 'planilla mensual', export: 'planilla_agosto_2026', rows: rs, record: regRec, search: false, cols: [
        { k: 'cod', label: 'Régimen', render: r => `<b>${r.cod}</b> · ${r.nom}` }, { k: 'n', label: 'Trab.', r: true, render: r => U.int(r.n) },
        { k: 'ing', label: 'Ingresos', r: true, render: r => U.money(r.ing, '') }, { k: 'desc', label: 'Descuentos', r: true, render: r => U.money(r.desc, '') },
        { k: 'apo', label: 'Aportes', r: true, render: r => U.money(r.apo, '') }, { k: 'neto', label: 'Neto a pagar', r: true, render: r => `<b>${U.money(r.neto, '')}</b>` }
      ], foot: `<tr><td style="font-weight:800">TOTAL</td><td class="r num" style="font-weight:700">${U.int(T.n)}</td><td class="r num" style="font-weight:700">${U.money(T.ing, '')}</td><td class="r num" style="font-weight:700">${U.money(T.desc, '')}</td><td class="r num" style="font-weight:700">${U.money(T.apo, '')}</td><td class="r num" style="font-weight:800;color:var(--primary-dark)">${U.money(T.ing - T.desc, '')}</td><td></td></tr>` });
    },
    paintApo(rs) {
      const U = SIGA.ui;
      const rows = [['ONP · Sistema Nacional de Pensiones', '13% del remunerativo', 612, 372480.20], ['AFP · aporte obligatorio', '10%', 438, 206330.10], ['AFP · prima de seguro', '1.37%', 438, 28267.22], ['AFP · comisión', 'según AFP', 187, 7102.40], ['Renta de 5.ª categoría', 'escala anual proyectada', 264, 118420.65], ['EsSalud · aporte del empleador', '9%', 1082, 407682.00], ['EsSalud · pensionistas', '4%', 115, 9944.00], ['Retenciones judiciales', 'con tope legal', 71, 42180.00]];
      document.getElementById('pl-p-apo').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Aportes y retenciones · agosto 2026 <span class="grow">R-05 · R-06 · R-07 · calculados del propio maestro, sin planillas auxiliares</span></h3>
        ${U.table([{ k: 0, label: 'Concepto' }, { k: 1, label: 'Base / tasa', cls: 'mini' }, { k: 2, label: 'Trabajadores', r: true, render: r => U.int(r[2]) }, { k: 3, label: 'Importe', r: true, render: r => U.money(r[3]) }], rows)}</div>
        <div class="card"><h3><span class="dot"></span>Declaraciones generadas automáticamente</h3>
          ${[['PDT PLAME · SUNAT', 'fa-landmark', 'Remuneraciones, 5.ª categoría y EsSalud'], ['AFPnet', 'fa-piggy-bank', 'Aportes, prima y comisión por AFP'], ['T-Registro', 'fa-id-badge', 'Altas, bajas y modificaciones'], ['AIRHSP · MEF', 'fa-building-columns', 'Registro de plazas y montos']].map(d => `<div class="doc-attach"><i class="fa-solid ${d[1]}" style="color:var(--primary-dark);font-size:15px"></i><span><b>${d[0]}</b><br><span class="mini">${d[2]}</span></span><button class="btn sm ghost" data-dj="${d[0]}">Generar</button></div>`).join('')}
          <p class="mini mt">En el sistema actual esta información no se genera automáticamente (informe 3.3.5).</p></div></div>`;
      const W = P.trabajadores.filter(t => t.cond !== 'Cesado');
      const files = {
        'PDT PLAME · SUNAT': ['0601202608' + '20161749126.rem', W.map(t => ['01', t.dni, t.c.filter(c => c[1] === 'I').map(c => c[2].toFixed(2)).join('|')].join('|')).join('\r\n')],
        'AFPnet': ['AFPNET_202608.csv', 'CUSPP;DNI;AFP;REM_ASEGURABLE;APORTE;PRIMA\n' + W.filter(t => t.sis.startsWith('AFP')).map(t => [t.cuspp, t.dni, t.sis, tot(t, 'I').toFixed(2), (tot(t, 'I') * 0.1).toFixed(2), (tot(t, 'I') * 0.0137).toFixed(2)].join(';')).join('\n')],
        'T-Registro': ['TREGISTRO_20161749126_202608.txt', W.filter(t => t.nuevo || t.cond === 'Cesado').map(t => [t.nuevo ? 'ALTA' : 'BAJA', t.dni, t.reg, t.ing].join('|')).join('\n') || 'SIN MOVIMIENTOS EN EL PERIODO'],
        'AIRHSP · MEF': ['AIRHSP_UNAS_202608.csv', 'CODIGO;REGIMEN;CARGO;DEPENDENCIA;MONTO\n' + W.map(t => [t.cod, t.reg, t.cargo, t.dep, tot(t, 'I').toFixed(2)].join(';')).join('\n')]
      };
      document.querySelectorAll('#pl-p-apo [data-dj]').forEach(b => b.addEventListener('click', () => { const f = files[b.dataset.dj]; SIGA.log('Planillas', 'Generación de archivo', b.dataset.dj); U.download(f[0], f[1]); }));
    },
    paintAfe(rs) {
      const U = SIGA.ui, M = P.marcoPersonal, mes = rs.reduce((s, r) => s + r.ing + r.apo, 0);
      document.getElementById('pl-p-afe').innerHTML = `<div class="card"><h3><span class="dot"></span>Afectación presupuestal automática de la planilla <span class="grow">R-14 · certificación, compromiso y devengado en el mismo acto</span></h3>
        <div class="grid cols-3 mb">${[['Marco de personal 2026', U.money(M.pim), 'genéricas 2.1 y 2.2'], ['Ejecutado a julio', U.money(M.ejecutado), U.pct(M.ejecutado, M.pim)], ['Planilla de agosto', U.money(mes), 'ingresos + aportes']].map(x => `<div class="mini-card"><div class="lab">${x[0]}</div><div class="v">${x[1]}</div><div class="s">${x[2]}</div></div>`).join('')}</div>
        ${U.table([{ k: 'cod', label: 'Régimen', render: r => r.cod + ' · ' + r.nom.split(' · ')[0] }, { k: 'clas', label: 'Clasificador de gasto', render: r => `<span class="code">${r.clas}</span>` }, { k: 'm', label: 'Afectación del mes', r: true, render: r => U.money(r.ing + r.apo, '') }, { k: 'e', label: 'Estado', render: () => P.generada ? U.tag('Devengado ✓', 't-green') : U.tag('Se afecta al generar', 't-amber') }], rs)}
        <p class="mini mt">La genérica 2.1 se ejecuta vía planillas y no forma parte del cuadro de necesidades de bienes, servicios e inversiones.</p></div>`;
    },
    paintAsi() {
      const U = SIGA.ui;
      const asRec = { mod: 'Planillas', tipo: 'Reporte de asistencia', key: r => 'ASIS ' + r[0], title: r => 'Asistencia · ' + r[0], cls: false,
        fields: r => [['Dependencia', r[0]], ['Trabajadores', r[1]], ['Tardanzas', r[2]], ['Faltas', r[3]], ['Descuento aplicado', U.money(r[4])], ['Puntualidad', (100 - r[2] / r[1] * 100).toFixed(1) + '%']],
        edit: [{ k: 't', label: 'Tardanzas', type: 'number', span: 1, get: r => r[2], set: (r, v) => r[2] = v }, { k: 'f', label: 'Faltas', type: 'number', span: 1, get: r => r[3], set: (r, v) => r[3] = v }],
        onEdit: r => { r[4] = Math.round((r[2] * 3.1 + r[3] * 72.5) * 100) / 100; } };
      document.getElementById('pl-asi').innerHTML = U.grid({ id: 'pla-asi', title: 'asistencia', export: 'asistencia_agosto_2026', rows: P.asistencia, record: asRec, search: false, pageSize: 15, cols: [{ k: 0, label: 'Dependencia' }, { k: 1, label: 'Trabajadores', r: true }, { k: 2, label: 'Tardanzas', r: true }, { k: 3, label: 'Faltas', r: true }, { k: 4, label: 'Descuento aplicado', r: true, render: r => U.money(r[4]) }, { k: 5, label: 'Puntualidad', sv: r => 1 - r[2] / r[1], render: r => { const p = 100 - r[2] / r[1] * 100; return `<div class="mcell">${U.meter(p)}<span>${p.toFixed(0)}%</span></div>`; } }],
        foot: rs => `<tr><td class="r"><b>Totales</b></td><td class="r num"><b>${rs.reduce((s, r) => s + r[1], 0)}</b></td><td class="r num"><b>${rs.reduce((s, r) => s + r[2], 0)}</b></td><td class="r num"><b>${rs.reduce((s, r) => s + r[3], 0)}</b></td><td class="r num"><b>${U.money(rs.reduce((s, r) => s + r[4], 0))}</b></td><td colspan="2"></td></tr>` });
    },
    paintVac() {
      const U = SIGA.ui;
      document.getElementById('pl-p-vac').innerHTML = `<div class="split eq"><div class="card"><h3><span class="dot"></span>Rol vacacional <span class="grow">R-10</span></h3><div id="vac-t"></div></div><div class="card"><h3><span class="dot"></span>Licencias</h3><div id="lic-t"></div></div></div>`;
      const vRec = { mod: 'Planillas', tipo: 'Rol vacacional', key: r => r[0].split(' · ')[0] + ' ' + r[2].slice(0, 10), title: r => 'Vacaciones · ' + r[0], estado: 4, cls: false,
        fields: r => [['Trabajador', r[0]], ['Régimen', r[1]], ['Periodo', r[2]], ['Días', r[3]], ['Estado', r[4]]],
        edit: [{ k: 'p', label: 'Periodo (dd/mm/aaaa – dd/mm/aaaa)', get: r => r[2], set: (r, v) => r[2] = v }, { k: 'd', label: 'Días', type: 'number', span: 1, get: r => r[3], set: (r, v) => r[3] = v }],
        canEdit: r => /Programada/.test(r[4]),
        extra: r => /Programada/.test(r[4]) ? [{ icon: 'fa-plane', label: 'Iniciar goce', fn: x => { x[4] = 'En curso'; SIGA.log('Planillas', 'Inicio de vacaciones', x[0], 'Programada', 'En curso'); U.closeModal(); SIGA.refresh(); } }] : r[4] === 'En curso' ? [{ icon: 'fa-circle-check', label: 'Marcar como gozada', fn: x => { x[4] = 'Gozada'; SIGA.log('Planillas', 'Vacaciones gozadas', x[0], 'En curso', 'Gozada'); U.closeModal(); SIGA.refresh(); } }] : [],
        anular: true, anularLabel: 'Anular programación', canAnular: r => /Programada/.test(r[4]) };
      const lRec = { mod: 'Planillas', tipo: 'Resolución de licencia', key: r => r[0].split(' · ')[0] + ' ' + r[1].slice(0, 12), title: r => r[1] + ' · ' + r[0], estado: 3, cls: false, anuladoValor: 'Rechazada',
        fields: r => [['Trabajador', r[0]], ['Tipo', r[1]], ['Periodo', r[2]], ['Estado', r[3]], ['Efecto en planilla', /sin goce/i.test(r[1]) ? 'Descuento de los días de licencia' : 'Sin descuento (con goce)']],
        extra: r => r[3] === 'Solicitada' ? [{ icon: 'fa-stamp', label: 'Aprobar licencia', fn: x => this.aprobarLic(x) }] : [],
        anular: true, anularLabel: 'Rechazar solicitud', canAnular: r => r[3] === 'Solicitada',
        print: r => ({ tipo: 'Resolución de licencia', num: 'RL-' + (100 + P.licencias.indexOf(r)) + '-2026', body: `<p>Se ${r[3] === 'Rechazada' ? 'deniega' : 'concede'} a <b>${r[0]}</b> la <b>${r[1].toLowerCase()}</b> por el periodo ${r[2]}.</p>` }) };
      document.getElementById('vac-t').innerHTML = U.grid({ id: 'pla-vac', title: 'rol vacacional', export: 'rol_vacacional', rows: P.vacaciones, record: vRec, filter: { label: 'Estado', get: r => r[4] }, pageSize: 8, cols: [{ k: 0, label: 'Trabajador' }, { k: 1, label: 'Régimen' }, { k: 2, label: 'Periodo', cls: 'mini' }, { k: 3, label: 'Días', r: true }, { k: 4, label: 'Estado', render: r => U.tag(r[4], r[4] === 'En curso' ? 't-blue' : r[4] === 'Gozada' ? 't-green' : r[4] === 'Anulado' ? 't-red' : 't-gray') }],
        tools: [{ icon: 'fa-plus', label: 'Programar', primary: true, fn: () => U.formModal('<i class="fa-solid fa-umbrella-beach"></i> Programar vacaciones', [{ k: 't', label: 'Trabajador', type: 'select', options: P.trabajadores.filter(t => !['Cesado', 'Pensionista'].includes(t.cond)).map(t => t.cod + ' · ' + t.cargo) }, { k: 'p', label: 'Periodo', value: '01/10/2026 – 15/10/2026', span: 1 }, { k: 'd', label: 'Días', type: 'number', value: 15, span: 1 }], v => { const t = P.trabajadores.find(x => v.t.startsWith(x.cod)); const row = [v.t, t.reg, v.p, +v.d || 15, 'Programada']; P.vacaciones.unshift(row); SIGA.log('Planillas', 'Programación de vacaciones', v.t, '—', v.p); U.closeModal(); SIGA.refresh(); U.toast('Vacaciones programadas · ' + v.t); }, 'Programar') }] });
      document.getElementById('lic-t').innerHTML = U.grid({ id: 'pla-lic', title: 'licencias', export: 'licencias', rows: P.licencias, record: lRec, filter: { label: 'Estado', get: r => r[3] }, pageSize: 8, cols: [{ k: 0, label: 'Trabajador' }, { k: 1, label: 'Tipo' }, { k: 2, label: 'Periodo', cls: 'mini' }, { k: 3, label: 'Estado', render: r => U.tag(r[3], r[3] === 'Solicitada' ? 't-amber' : r[3] === 'En curso' ? 't-blue' : r[3] === 'Rechazada' ? 't-red' : 't-green') }],
        actions: [{ icon: 'fa-stamp', title: 'Aprobar', show: r => r[3] === 'Solicitada', fn: r => this.aprobarLic(r) }],
        tools: [{ icon: 'fa-plus', label: 'Solicitar', primary: true, fn: () => U.formModal('<i class="fa-solid fa-file-medical"></i> Solicitud de licencia', [{ k: 't', label: 'Trabajador', type: 'select', options: P.trabajadores.filter(t => !['Cesado', 'Pensionista'].includes(t.cond)).map(t => t.cod + ' · ' + t.cargo) }, { k: 'k', label: 'Tipo', type: 'select', options: ['Licencia con goce · capacitación oficializada', 'Licencia por salud (CITT)', 'Licencia por paternidad', 'Licencia sin goce · asuntos personales', 'Permiso por onomástico'] }, { k: 'p', label: 'Periodo', value: '25/08/2026 – 27/08/2026' }], v => { P.licencias.unshift([v.t, v.k, v.p, 'Solicitada']); SIGA.log('Planillas', 'Solicitud de licencia', v.t, '—', v.k); U.closeModal(); SIGA.refresh(); U.toast('Solicitud registrada · pasa a aprobación del jefe inmediato'); }, 'Registrar solicitud') }] });
    },
    aprobarLic(r) {
      if (!SIGA.sod(null, 'lic.aprobar')) return;
      r[3] = 'Aprobada'; SIGA.log('Planillas', 'Aprobación de licencia', r[0], 'Solicitada', 'Aprobada · ' + r[1]);
      SIGA.ui.closeModal(); SIGA.ui.toast('Licencia aprobada · ' + (/sin goce/i.test(r[1]) ? 'el descuento se aplica automáticamente en la planilla' : 'sin efecto en la remuneración')); SIGA.refresh();
    },
    generar(T) {
      const U = SIGA.ui;
      const steps = ['Cálculo de ingresos por régimen (36 conceptos)', 'Descuentos: ONP, AFP, 5.ª categoría, judiciales con tope', 'Aportes del empleador (EsSalud 9%)', 'Afectación presupuestal · certificación y devengado', 'Asiento contable automático', 'Boletas electrónicas enviadas a 1,197 trabajadores', 'Archivo de abono masivo para el banco'];
      const b = U.modal('<i class="fa-solid fa-gears"></i> Generando planilla de agosto 2026', `<div class="checklist" id="gp-l">${steps.map(s => `<div class="ck"><i class="fa-regular fa-circle"></i><span>${s}</span><em></em></div>`).join('')}</div><div class="cmp mt"><div class="asis"><h5>Hoy</h5>96 horas: cálculo, verificación e impresión de boletas.</div><div class="tobe"><h5>SIGA-U</h5>Minutos, con boleta electrónica y afectación presupuestal en el mismo acto.</div></div>`, `<button class="btn ghost" data-close>Cerrar</button>`, 'narrow');
      const res = [U.money(T.ing), U.money(T.desc), U.money(T.apo), 'genérica 2.1 afectada', '', '1,197 boletas', 'lote listo'];
      b.querySelectorAll('.ck').forEach((ck, i) => {
        setTimeout(() => { ck.className = 'ck run'; ck.querySelector('i').className = 'fa-solid fa-spinner'; }, i * 380);
        setTimeout(() => {
          if (i === 3) SIGA.siaf('Devengado · planilla', 'Planilla agosto 2026', T.ing + T.apo);
          if (i === 4) res[4] = SIGA.asiento('Planilla de remuneraciones · agosto 2026', [['5101', T.ing + T.apo, 0], ['2102', 0, T.ing - T.desc], ['2101', 0, T.desc + T.apo]], 'Planillas');
          ck.className = 'ck ok'; ck.querySelector('i').className = 'fa-solid fa-circle-check'; ck.querySelector('em').textContent = res[i];
          if (i === steps.length - 1) { P.generada = true; SIGA.log('Planillas', 'Generación de planilla', 'Agosto 2026', '—', '1,197 trabajadores · neto ' + U.money(T.ing - T.desc)); U.toast('Planilla de agosto generada · boletas electrónicas enviadas'); setTimeout(() => { U.closeModal(); SIGA.refresh(); }, 900); }
        }, i * 380 + 320);
      });
    },
    alta() {
      const U = SIGA.ui;
      U.bigForm({
        title: 'Alta de trabajador · legajo digital', icon: 'fa-user-plus',
        sections: [
          { title: 'Datos personales', cols: 3, fields: [{ k: 'dni', label: 'DNI', value: '', span: 1, required: true, hint: 'validado con RENIEC' }, { k: 'nombres', label: 'Apellidos y nombres', value: '', required: true, span: 2 }, { k: 'nac', label: 'Fecha de nacimiento', type: 'date', value: '1990-01-01', span: 1 }, { k: 'correo', label: 'Correo institucional', value: '@unas.edu.pe', span: 2 }] },
          { title: 'Datos laborales', cols: 3, fields: [{ k: 'regimen', label: 'Régimen laboral', type: 'select', options: P.regimenes.map(r => r[0] + ' · ' + r[1]), required: true, span: 3 }, { k: 'cargo', label: 'Cargo', value: '', required: true, span: 2 }, { k: 'dep', label: 'Dependencia', value: '', span: 1 }, { k: 'fechaIng', label: 'Fecha de ingreso', type: 'date', value: SIGA.ctx.hoyISO, span: 1 }, { k: 'basico', label: 'Remuneración mensual S/', type: 'number', value: 2800, span: 1, required: true }] },
          { title: 'Datos previsionales y bancarios', cols: 3, fields: [{ k: 'sistema', label: 'Sistema de pensiones', type: 'select', options: ['ONP', 'AFP Integra', 'AFP Prima', 'AFP Profuturo', 'AFP Habitat'], span: 1 }, { k: 'cuspp', label: 'CUSPP (si AFP)', value: '', span: 1 }, { k: 'banco', label: 'Banco', type: 'select', options: ['Banco de la Nación', 'BCP', 'Interbank', 'BBVA'], span: 1 }] }
        ],
        totals: (r, v) => { const b = +v.basico || 0, onp = v.sistema === 'ONP', d = onp ? b * 0.13 : b * 0.1137; return [{ label: 'Remuneración', val: U.money(b, '') }, { label: onp ? '(−) ONP 13%' : '(−) AFP 10% + seguro 1.37%', val: U.money(d, ''), cls: 'neg' }, { label: 'EsSalud 9% (empleador)', val: U.money(b * 0.09, '') }, { label: 'NETO ESTIMADO S/', val: U.money(b - d, ''), big: true }]; },
        submitLabel: 'Registrar trabajador',
        onSubmit: v => {
          const b = +v.basico || 0, onp = v.sistema === 'ONP', reg = v.regimen.split(' · ')[0];
          const t = { cod: '••' + (700 + P.trabajadores.length), nom: 'Nuevo ••••', dni: v.dni.slice(0, 1) + '•••••' + v.dni.slice(-2), reg: v.regimen.split(' · ').slice(0, 2).join(' · '), cargo: v.cargo, dep: v.dep || '—', cond: 'Activo', ing: U.dmy(v.fechaIng), sis: v.sistema, cuspp: v.cuspp || '—', banco: v.banco + ' ••' + v.dni.slice(-4), correo: v.correo, nuevo: true,
            c: [['Remuneración mensual', 'I', b], onp ? ['ONP 13%', 'D', b * 0.13] : ['AFP · aporte obligatorio 10%', 'D', b * 0.1], ...(onp ? [] : [['AFP · prima de seguro 1.37%', 'D', b * 0.0137]]), ['EsSalud 9%', 'A', b * 0.09]], hist: [[SIGA.ctx.hoy, 'Alta en el legajo digital']] };
          P.trabajadores.unshift(t); const r = P.regimenes.find(x => x[0] === reg); if (r) { r[2]++; r[3] += b; }
          SIGA.log('Planillas', 'Alta de trabajador', t.cod, '—', t.reg + ' · ' + t.cargo);
          U.closeModal(); SIGA.refresh(); U.toast('Trabajador ' + t.cod + ' registrado en el legajo digital · neto ' + U.money(neto(t)));
        }
      });
    }
  });
})();
