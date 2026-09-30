/* ============================================================
   Recursos Humanos y Planillas · "1,197 trabajadores, nueve regímenes, una sola planilla"
   ============================================================ */
(function () {
  const P = SIGA.data.planilla;
  const tot = (t, k) => t.c.filter(c => c[1] === k).reduce((s, c) => s + c[2], 0);
  const neto = t => tot(t, 'I') - tot(t, 'D');
  const R = () => P.regimenes.map(r => ({ cod: r[0], nom: r[1], n: r[2], ing: r[3], desc: r[4], apo: r[5], neto: r[3] - r[4], clas: r[6] }));

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
      document.getElementById('pl-tra').innerHTML = U.table([
        { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'cargo', label: 'Cargo', render: r => r.cargo + `<div class="mini">${r.dep}</div>` },
        { k: 'reg', label: 'Régimen' }, { k: 'sis', label: 'Pensiones' }, { k: 'cond', label: 'Condición', render: r => U.tag(r.cond, r.cond === 'Pensionista' ? 't-blue' : 't-green') },
        { k: 'ing', label: 'Ingresos', r: true, render: r => U.money(tot(r, 'I'), '') }, { k: 'neto', label: 'Neto', r: true, render: r => `<b>${U.money(neto(r), '')}</b>` }
      ], P.trabajadores, { onRow: t => this.legajo(t), rowCls: r => r.nuevo ? 'row-new' : '', actions: [{ icon: 'fa-file-invoice', title: 'Boleta electrónica', fn: t => this.boleta(t) }, { icon: 'fa-id-card', title: 'Legajo', fn: t => this.legajo(t) }] });
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
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="bo-hist"><i class="fa-solid fa-clock-rotate-left"></i> Histórico</button><button class="btn sec" id="bo-mail"><i class="fa-solid fa-envelope"></i> Enviar al correo</button><button class="btn" onclick="SIGA.ui.toast('Boleta descargada en PDF')"><i class="fa-solid fa-download"></i> PDF</button>`, 'wide');
      b.querySelector('#bo-mail').addEventListener('click', () => { SIGA.log('Planillas', 'Envío de boleta electrónica', t.cod + ' · agosto 2026', '—', t.correo); U.toast('Boleta enviada a ' + t.correo); });
      b.querySelector('#bo-hist').addEventListener('click', () => U.modal('Histórico de boletas · ' + t.cod, U.table([{ k: 0, label: 'Periodo' }, { k: 1, label: 'Neto', r: true, render: r => U.money(r[1]) }, { k: 2, label: 'Estado', render: () => U.tag('Descargable', 't-green') }], ['Agosto', 'Julio', 'Junio', 'Mayo', 'Abril', 'Marzo'].map((m, i) => [m + ' 2026', neto(t) * (i === 0 ? 1 : 0.99)])), `<button class="btn ghost" data-close>Cerrar</button>`, 'narrow'));
    },
    legajo(t) {
      const U = SIGA.ui;
      const b = U.modal('Legajo digital · ' + t.cod, `<div class="ficha mb">${[['Datos personales', [['Código', t.cod], ['DNI', t.dni], ['Correo institucional', t.correo]]], ['Datos laborales', [['Régimen', t.reg], ['Cargo', t.cargo], ['Dependencia', t.dep], ['Condición', t.cond], ['Fecha de ingreso', t.ing]]], ['Previsionales y bancarios', [['Sistema de pensiones', t.sis], ['CUSPP', t.cuspp], ['Salud', 'EsSalud'], ['Cuenta de abono', t.banco]]]].map(g => `<div class="mini-card"><div class="lab" style="margin-bottom:6px">${g[0]}</div>${g[1].map(p => `<div class="ef-row"><span class="mini">${p[0]}</span><b style="font-size:11.5px">${p[1]}</b></div>`).join('')}</div>`).join('')}</div>
        <div class="split eq"><div><div class="lbl-s mb">Historial de cambios (bitácora)</div>${U.timeline(t.hist.map(h => ({ t: h[1], when: h[0], st: 'done' })))}</div>
        <div><div class="lbl-s mb">Documentos del legajo</div>${['Resolución de nombramiento o contrato', 'Grados y títulos (SUNEDU)', 'Declaración jurada de bienes', 'Constancia de afiliación previsional'].map(d => `<div class="doc-attach"><i class="fa-solid fa-file-pdf"></i><span>${d}.pdf</span>${U.tag('verificado', 't-green')}</div>`).join('')}</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="lg-cons"><i class="fa-solid fa-file-signature"></i> Constancia de haberes</button><button class="btn" id="lg-bol"><i class="fa-solid fa-file-invoice"></i> Boleta de agosto</button>`, 'wide');
      b.querySelector('#lg-bol').addEventListener('click', () => this.boleta(t));
      b.querySelector('#lg-cons').addEventListener('click', () => {
        SIGA.log('Planillas', 'Emisión de constancia de haberes', t.cod);
        U.modal('Constancia de haberes (R-13)', `<div class="doc" style="position:static"><div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional Agraria de la Selva</b><span>Unidad de Recursos Humanos</span></div></div><div class="doc-num"><div class="tp">Constancia</div><div class="nn">N° 0${412 + Math.floor(Math.random() * 80)}-2026</div></div></div>
          <p style="font-size:12px;line-height:1.7">La Unidad de Recursos Humanos hace constar que el trabajador identificado con código <b>${t.cod}</b>, con cargo de <b>${t.cargo}</b> bajo el régimen <b>${t.reg}</b>, percibe una remuneración bruta mensual de <b>${U.money(tot(t, 'I'))}</b> y un neto de <b>${U.money(neto(t))}</b> en el mes de agosto de 2026, conforme a la planilla de pagos de la institución.</p>
          <p style="font-size:12px;margin-top:10px">Se expide la presente a solicitud del interesado. Tingo María, ${SIGA.ctx.hoy}.</p><div class="doc-sign" style="grid-template-columns:1fr"><div><b>Jefe de la Unidad de Recursos Humanos</b>Firma digital</div></div></div>`, `<button class="btn ghost" data-close>Cerrar</button>`, 'wide');
      });
    },
    paintMen(rs, T) {
      const U = SIGA.ui;
      document.getElementById('pl-men').innerHTML = U.table([
        { k: 'cod', label: 'Régimen', render: r => `<b>${r.cod}</b> · ${r.nom}` }, { k: 'n', label: 'Trab.', r: true, render: r => U.int(r.n) },
        { k: 'ing', label: 'Ingresos', r: true, render: r => U.money(r.ing, '') }, { k: 'desc', label: 'Descuentos', r: true, render: r => U.money(r.desc, '') },
        { k: 'apo', label: 'Aportes', r: true, render: r => U.money(r.apo, '') }, { k: 'neto', label: 'Neto a pagar', r: true, render: r => `<b>${U.money(r.neto, '')}</b>` }
      ], rs, { foot: `<tr><td style="font-weight:800">TOTAL</td><td class="r num" style="font-weight:700">${U.int(T.n)}</td><td class="r num" style="font-weight:700">${U.money(T.ing, '')}</td><td class="r num" style="font-weight:700">${U.money(T.desc, '')}</td><td class="r num" style="font-weight:700">${U.money(T.apo, '')}</td><td class="r num" style="font-weight:800;color:var(--primary-dark)">${U.money(T.ing - T.desc, '')}</td></tr>` });
    },
    paintApo(rs) {
      const U = SIGA.ui;
      const rows = [['ONP · Sistema Nacional de Pensiones', '13% del remunerativo', 612, 372480.20], ['AFP · aporte obligatorio', '10%', 438, 206330.10], ['AFP · prima de seguro', '1.37%', 438, 28267.22], ['AFP · comisión', 'según AFP', 187, 7102.40], ['Renta de 5.ª categoría', 'escala anual proyectada', 264, 118420.65], ['EsSalud · aporte del empleador', '9%', 1082, 407682.00], ['EsSalud · pensionistas', '4%', 115, 9944.00], ['Retenciones judiciales', 'con tope legal', 71, 42180.00]];
      document.getElementById('pl-p-apo').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Aportes y retenciones · agosto 2026 <span class="grow">R-05 · R-06 · R-07 · calculados del propio maestro, sin planillas auxiliares</span></h3>
        ${U.table([{ k: 0, label: 'Concepto' }, { k: 1, label: 'Base / tasa', cls: 'mini' }, { k: 2, label: 'Trabajadores', r: true, render: r => U.int(r[2]) }, { k: 3, label: 'Importe', r: true, render: r => U.money(r[3]) }], rows)}</div>
        <div class="card"><h3><span class="dot"></span>Declaraciones generadas automáticamente</h3>
          ${[['PDT PLAME · SUNAT', 'fa-landmark', 'Remuneraciones, 5.ª categoría y EsSalud'], ['AFPnet', 'fa-piggy-bank', 'Aportes, prima y comisión por AFP'], ['T-Registro', 'fa-id-badge', 'Altas, bajas y modificaciones'], ['AIRHSP · MEF', 'fa-building-columns', 'Registro de plazas y montos']].map(d => `<div class="doc-attach"><i class="fa-solid ${d[1]}" style="color:var(--primary-dark);font-size:15px"></i><span><b>${d[0]}</b><br><span class="mini">${d[2]}</span></span><button class="btn sm ghost" onclick="SIGA.log('Planillas','Generación de archivo','${d[0]}');SIGA.ui.toast('${d[0]} · archivo de agosto generado')">Generar</button></div>`).join('')}
          <p class="mini mt">En el sistema actual esta información no se genera automáticamente (informe 3.3.5).</p></div></div>`;
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
      document.getElementById('pl-asi').innerHTML = U.table([{ k: 0, label: 'Dependencia' }, { k: 1, label: 'Trabajadores', r: true }, { k: 2, label: 'Tardanzas', r: true }, { k: 3, label: 'Faltas', r: true }, { k: 4, label: 'Descuento aplicado', r: true, render: r => U.money(r[4]) }, { k: 5, label: 'Puntualidad', render: r => { const p = 100 - r[2] / r[1] * 100; return `<div class="mcell">${U.meter(p)}<span>${p.toFixed(0)}%</span></div>`; } }], P.asistencia);
    },
    paintVac() {
      const U = SIGA.ui;
      document.getElementById('pl-p-vac').innerHTML = `<div class="split eq"><div class="card"><h3><span class="dot"></span>Rol vacacional <span class="grow">R-10</span></h3><div id="vac-t"></div></div><div class="card"><h3><span class="dot"></span>Licencias</h3><div id="lic-t"></div></div></div>`;
      document.getElementById('vac-t').innerHTML = U.table([{ k: 0, label: 'Trabajador' }, { k: 1, label: 'Régimen' }, { k: 2, label: 'Periodo', cls: 'mini' }, { k: 3, label: 'Días', r: true }, { k: 4, label: 'Estado', render: r => U.tag(r[4], r[4] === 'En curso' ? 't-blue' : r[4] === 'Gozada' ? 't-green' : 't-gray') }], P.vacaciones);
      document.getElementById('lic-t').innerHTML = U.table([{ k: 0, label: 'Trabajador' }, { k: 1, label: 'Tipo' }, { k: 2, label: 'Periodo', cls: 'mini' }, { k: 3, label: 'Estado', render: r => U.tag(r[3], r[3] === 'Solicitada' ? 't-amber' : r[3] === 'En curso' ? 't-blue' : 't-green') }], P.licencias,
        { actions: [{ icon: 'fa-stamp', title: 'Aprobar', show: r => r[3] === 'Solicitada', fn: r => { r[3] = 'Aprobada'; SIGA.log('Planillas', 'Aprobación de licencia', r[0], 'Solicitada', 'Aprobada'); U.toast('Licencia aprobada · el descuento se aplica automáticamente'); SIGA.refresh(); } }] });
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
