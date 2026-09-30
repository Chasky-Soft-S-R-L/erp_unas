/* Tablero de control de la Alta Dirección · informe 4.9.4 y 7.2 · pitch lámina 14 */
SIGA.registerModule('dashboard', {
  title: 'Tablero de control', icon: 'fa-gauge-high', group: 'Principal',
  render(el) {
    const U = SIGA.ui, P = SIGA.data.presupuesto, api = SIGA.ppto, d = SIGA.data.dashboard;
    const pim = api.pim(), F = P.fases;
    const prog = P.mensual.prog[7], metaMes = prog / P.mensual.prog[11] * 100;
    const fases = [['Asignado (PIM)', pim], ['Certificado', F.cert], ['Comprometido', F.comp], ['Devengado', F.dev], ['Girado', F.gir], ['Pagado', F.pag]];
    // Semáforo: base + específicas con movimiento (calculadas en línea)
    const sem = Object.assign({}, d.semaforoBase);
    P.marco.forEach(m => { const s = api.saldo(m), p = s / m.pim; if (s < 0) sem.sobre++; else if (p < 0.05) sem.rojo++; else if (p < 0.2) sem.ambar++; else sem.verde++; });
    const rdr = SIGA.data.caja ? SIGA.data.caja.acumulado + SIGA.data.caja.ingresos.reduce((s, r) => s + (r.nuevo ? r.total : 0), 0) : 0;
    const bancos = SIGA.data.tesoreria ? SIGA.data.tesoreria.bancos.reduce((s, b) => s + b.libros, 0) : 0;
    const porVencer = SIGA.data.ctaper ? SIGA.data.ctaper.obligaciones.filter(o => o.estado !== 'Pagado').reduce((s, o) => s + o.imp, 0) : 0;
    const prod = SIGA.data.produccion ? SIGA.data.produccion.unidades : [];
    const ing = prod.reduce((s, u) => s + u.ing, 0), cos = prod.reduce((s, u) => s + u.cos, 0);
    const bajos = P.centros.map(r => ({ r, p: r[3] / r[2] * 100 })).sort((a, b) => a.p - b.p).slice(0, 5);
    const c = P.fases;

    el.innerHTML = `
      <div class="hero">
        <div class="eyebrow">${SIGA.ctx.inst} · ${SIGA.ctx.sede}</div>
        <h2>SIGA&#8209;U · Un solo sistema. Un solo dato. Una sola verdad.</h2>
        <p>Presupuesto, abastecimiento, almacén, tesorería, contabilidad, planillas y los centros de producción en una sola plataforma web, con el saldo calculado en tiempo real y trazabilidad completa del gasto desde el requerimiento hasta el pago. Integrado con SIGA-MEF, SIAF-SP y SUNAT.</p>
        <div class="stats">${d.hero.map(h => `<div><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')}<div><b>${U.mill(pim)}</b><span>PIM 2026</span></div></div>
      </div>
      <div class="page-head"><div><h1>Tablero de control de la Alta Dirección</h1><p>Ejecución presupuestal consolidada · todas las fuentes · datos del cuadro de necesidades 2026 · actualizado ${U.now()}</p></div>
        <div class="row-flex"><button class="btn ghost" id="db-exp"><i class="fa-solid fa-file-excel"></i> Exportar</button><button class="btn ghost" id="db-imp"><i class="fa-solid fa-chart-line"></i> Impacto SIGA-U</button><button class="btn" id="db-new"><i class="fa-solid fa-plus"></i> Nueva certificación</button></div></div>
      ${U.kpis([
        { lab: 'PIM 2026', val: U.mill(pim), sub: 'Presupuesto Institucional Modificado' },
        { lab: 'Certificado', val: U.mill(F.cert), sub: U.pct(F.cert, pim) + ' del PIM', chip: U.pct(F.cert, pim, 0), chipType: 'info' },
        { lab: 'Devengado', val: U.mill(F.dev), sub: 'por ejecutar ' + U.mill(pim - F.dev), chip: U.pct(F.dev, pim), chipType: 'warn' },
        { lab: 'Recursos propios (RDR)', val: U.mill(rdr, 2), sub: 'recaudado 2026 · fuente 09', color: 'var(--primary-dark)', chip: 'RDR', chipType: 'info' }
      ])}
      <div class="card mb"><h3><span class="dot"></span>Cadena de ejecución del gasto — las seis fases en una sola línea <span class="grow">clic en una fase para ver sus certificaciones</span></h3>
        <div class="siaf" id="db-siaf">${fases.map((s, i) => `<div class="step ${i < 3 ? 'done' : i === 3 ? 'cur' : ''}" data-i="${i}" style="cursor:pointer"><div class="k">${s[0]}</div><div class="v">${U.mill(s[1])}</div><div class="p">${U.pct(s[1], pim)}</div></div>`).join('')}</div>
        <p class="mini mt">Ninguna fase puede superar a la que la precede. El estancamiento entre <b>comprometido</b> (${U.mill(F.comp)}) y <b>devengado</b> (${U.mill(F.dev)}) se concentra en la Unidad Ejecutora de Inversiones.</p></div>
      <div class="split mb">
        <div class="card"><h3><span class="dot"></span>Avance de ejecución anual frente a la meta institucional <span class="grow">millones de soles · acumulado</span></h3>
          ${U.chart.line({ labels: P.mensual.labels, series: [{ name: 'Programado', data: P.mensual.prog }, { name: 'Devengado', data: P.mensual.dev }], fmt: v => 'S/ ' + v.toFixed(2) + ' M', axFmt: v => v.toFixed(0), h: 340 })}</div>
        <div><div class="saldo-box mb"><div class="lab">Avance de ejecución anual</div><div class="big">${U.pct(F.dev, pim)}</div>
          <div class="row"><span>Meta al mes de agosto</span><span class="g">${metaMes.toFixed(1)}%</span></div>
          <div class="row"><span>Brecha frente a la meta</span><span>${U.mill(prog * 1e6 - F.dev)}</span></div>
          <div class="row"><span>Certificaciones activas</span><span>${U.int(d.contadores.certActivas + P.certificaciones.filter(x => x.fase !== 'Anulada').length - 6)}</span></div>
          <div class="row"><span>Órdenes emitidas</span><span>${U.int(d.contadores.ordenes + (SIGA.data.abastecimiento ? SIGA.data.abastecimiento.ordenes.filter(o => o.nuevo).length : 0))}</span></div>
          <div class="row"><span>Comprobantes de pago</span><span>${U.int(d.contadores.cp)}</span></div></div>
          <div class="card"><h3><span class="dot"></span>Semáforo de partidas <span class="grow">alerta temprana</span></h3>
            <div style="display:flex;flex-direction:column;gap:9px" id="db-sem">
              <div class="row-flex" style="justify-content:space-between"><span class="mini">Con saldo &gt; 20%</span>${U.tag(U.int(sem.verde), 't-green')}</div>
              <div class="row-flex" style="justify-content:space-between"><span class="mini">Saldo 5% – 20%</span>${U.tag(U.int(sem.ambar), 't-amber')}</div>
              <div class="row-flex" style="justify-content:space-between"><span class="mini">Saldo &lt; 5% · próximas al agotamiento</span>${U.tag(U.int(sem.rojo), 't-red')}</div>
              <div class="row-flex" style="justify-content:space-between"><span class="mini"><i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i> Sobregiro heredado del sistema actual</span>${U.tag(U.int(sem.sobre), 't-red')}</div></div>
            <button class="btn sm ghost mt" id="db-sem-go"><i class="fa-solid fa-arrow-right"></i> Ver marco y saldos</button></div></div>
      </div>
      <div class="grid cols-3 mb">
        <div class="card"><h3><span class="dot"></span>Ejecución por genérica de gasto</h3>${U.bars(P.genericas.map((g, i) => [g.cod + ' ' + g.nom, g.dev / g.pim * 100, U.chart.PAL[i % 3], U.pct(g.dev, g.pim)]))}
          <p class="mini mt">Devengado sobre PIM de cada genérica.</p></div>
        <div class="card"><h3><span class="dot"></span>Por fuente de financiamiento</h3>${U.bars(P.fuentes.map((f, i) => [f.cod + ' ' + f.nom, f.dev / f.pim * 100, U.chart.PAL[i % 3], U.pct(f.dev, f.pim)]))}
          <p class="mini mt">La fuente 18 (canon) concentra el mayor saldo por ejecutar.</p></div>
        <div class="card"><h3><span class="dot" style="background:var(--danger)"></span>Centros de costo con menor avance <span class="grow">de 254</span></h3>
          <div style="display:flex;flex-direction:column;gap:10px">${bajos.map(b => `<div><div class="row-flex" style="justify-content:space-between;font-size:11.5px"><span>${b.r[1].replace('Programa Académico de', 'P.A.').replace('Laboratorio de Sistemas de Producción Ganadera', 'Lab. Prod. Ganadera')}</span><b>${b.p.toFixed(0)}%</b></div>${U.meter(b.p, null, 7)}</div>`).join('')}</div>
          <button class="btn sm ghost mt" id="db-cuadro"><i class="fa-solid fa-table-list"></i> Cuadro de necesidades</button></div>
      </div>
      <div class="grid cols-3 mb">
        <div class="card"><h3><span class="dot"></span>Posición de caja</h3><div class="big-n">${U.money(bancos)}</div><div class="mini">saldo contable en ${SIGA.data.tesoreria ? SIGA.data.tesoreria.bancos.length : 0} cuentas bancarias</div>
          <div class="ef-row mt"><span>Obligaciones pendientes</span><b class="neg">${U.money(porVencer)}</b></div><div class="ef-row"><span>Cobertura</span><b>${porVencer ? (bancos / porVencer).toFixed(1) + '×' : '—'}</b></div>
          <button class="btn sm ghost mt" onclick="SIGA.go('tesoreria')"><i class="fa-solid fa-arrow-right"></i> Tesorería</button></div>
        <div class="card"><h3><span class="dot"></span>Centros de producción · agosto</h3><div class="big-n">${U.money(ing)}</div><div class="mini">ingresos de ${prod.length} unidades productivas</div>
          <div class="ef-row mt"><span>Costo de producción</span><b>${U.money(cos)}</b></div><div class="ef-row"><span>Excedente → investigación</span><b class="pos">${U.money(ing - cos)}</b></div>
          <button class="btn sm ghost mt" onclick="SIGA.go('produccion')"><i class="fa-solid fa-arrow-right"></i> Centros de producción</button></div>
        <div class="card"><h3><span class="dot"></span>Integración y control</h3>
          <div class="ef-row"><span>Operaciones enviadas al SIAF hoy</span><b>${SIGA.data.integracion.msgs.filter(m => m.ts.startsWith(SIGA.ctx.hoy)).length}</b></div>
          <div class="ef-row"><span>Operaciones digitadas dos veces</span><b class="pos">0</b></div>
          <div class="ef-row"><span>Registros en bitácora hoy</span><b>${SIGA.data.seguridad.bitacora.filter(b => b.ts.startsWith(SIGA.ctx.hoy)).length}</b></div>
          <div class="ef-row"><span>Alertas activas</span><b class="neg">${SIGA.alerts().filter(a => a.lvl !== 'info').length}</b></div>
          <button class="btn sm ghost mt" onclick="SIGA.go('integracion')"><i class="fa-solid fa-arrow-right"></i> Integración SIAF</button></div>
      </div>
      <div class="card"><h3><span class="dot"></span>Últimos movimientos presupuestales <span class="grow">en vivo · clic para ver detalle</span></h3><div id="db-mov"></div></div>`;

    document.getElementById('db-mov').innerHTML = U.table([
      { k: 'num', label: 'CCP', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
      { k: 'fte', label: 'Fte', render: r => api.marco(r.marco).fte },
      { k: 'part', label: 'Clasificador', render: r => `<span class="code">${api.marco(r.marco).clasif}</span>` },
      { k: 'dep', label: 'Meta / Centro de costo', render: r => { const m = api.marco(r.marco); return m.meta + ' · ' + m.ccn; } },
      { k: 'monto', label: 'Importe', r: true, render: r => U.money(r.monto) },
      { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, api.FCLS[r.fase]) }
    ], P.certificaciones.slice(0, 8), { onRow: r => { SIGA.go('presupuesto'); setTimeout(() => SIGA.modules.presupuesto.verCert(r), 60); } });

    const fasesMap = [null, 'Certificado', 'Comprometido', 'Devengado', 'Girado', 'Pagado'];
    el.querySelectorAll('#db-siaf .step').forEach(s => s.addEventListener('click', () => { const f = fasesMap[+s.dataset.i]; SIGA.modules.presupuesto.f = f || 'Todas'; SIGA.go('presupuesto'); }));
    document.getElementById('db-exp').addEventListener('click', () => { U.toast('Consolidado exportado a Excel · ' + U.now()); SIGA.log('Tablero', 'Exportación de consolidado', 'Ejecución 2026'); });
    document.getElementById('db-imp').addEventListener('click', () => SIGA.go('impacto'));
    document.getElementById('db-new').addEventListener('click', () => { SIGA.go('presupuesto'); setTimeout(() => SIGA.modules.presupuesto.nueva(), 60); });
    document.getElementById('db-sem-go').addEventListener('click', () => SIGA.go('presupuesto', { p: 'marco' }));
    document.getElementById('db-cuadro').addEventListener('click', () => SIGA.go('presupuesto', { p: 'cuadro' }));
  }
});
