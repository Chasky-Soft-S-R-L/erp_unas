/* ============================================================
   Tablero de control de la Alta Dirección · centro de mando
   informe 4.9.4 y 7.2 · pitch lámina 14
   Todo se calcula en vivo de los registros de los módulos: al aprobar, pagar,
   vender o despachar en cualquier módulo, el tablero cambia en el mismo acto.
   ============================================================ */
(function () {
  const HOY = new Date(2026, 7, 18);
  const pd = s => { const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const dias = d => Math.round((d - HOY) / 864e5);
  const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);

  // Agenda: todo lo que vence o está programado en las próximas semanas, reunido de todos los módulos
  function agenda() {
    const D = SIGA.data, U = SIGA.ui, out = [];
    const add = (fecha, icon, tipo, t, d, mod, cls) => { const f = pd(fecha); if (!f) return; const n = dias(f); if (n < -30 || n > 45) return; out.push({ f, n, icon, tipo, t, d, mod, cls }); };
    D.ctaper.obligaciones.filter(o => !['Pagado', 'Anulado'].includes(o.estado)).forEach(o => add(o.venc, 'fa-file-invoice', 'Pago a proveedor', o.prov, o.doc + ' · ' + U.money(o.imp), 'ctaper', o.dias < 0 ? 'bad' : o.dias <= 7 ? 'warn' : ''));
    D.abastecimiento.encargos.filter(e => e.estado !== 'Rendido' && !e.anulado).forEach(e => add(e.vence, 'fa-hand-holding-dollar', 'Rendición de encargo', e.resp, e.num + ' · ' + U.money(e.monto - e.rendido), 'abastecimiento', e.estado === 'Vencido' ? 'bad' : 'warn'));
    D.abastecimiento.comisiones.filter(c => c.estado !== 'Rendido' && !c.anulado).forEach(c => add(c.vence, 'fa-plane-departure', 'Rendición de viáticos', c.com, c.num + ' · ' + c.dest, 'abastecimiento', c.estado === 'Rendición vencida' ? 'bad' : ''));
    D.abastecimiento.ordenes.filter(o => ['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(o.estado)).forEach(o => add(o.entrega, 'fa-truck', 'Entrega de proveedor', o.prov, o.doc + ' · ' + U.money(o.imp), 'abastecimiento', o.estado === 'Atrasada' ? 'bad' : ''));
    D.abastecimiento.contratos.forEach(c => { const m = /vence (\d{2}\/\d{2}\/\d{4})/.exec(c.garantia || ''); if (m) add(m[1], 'fa-shield', 'Vence garantía', c.con, c.num + ' · ' + c.garantia.split(' · ')[0], 'abastecimiento', 'warn'); });
    Object.values(D.pecuario).forEach(e => e.sanidad.filter(s => s[3] === 'Programada').forEach(s => add(s[0], 'fa-syringe', 'Sanidad · ' + e.nombre, s[1], s[2], 'pecuario', '')));
    D.agricola.campanas.filter(c => c.estado === 'En campaña').forEach(c => add(c.cosecha, 'fa-wheat-awn', 'Cosecha', c.cultivo.split(' · ')[0], c.id, 'agricola', ''));
    D.planilla.vacaciones.filter(v => /Programada/.test(v[4])).forEach(v => add(v[2].slice(0, 10), 'fa-umbrella-beach', 'Vacaciones', v[0], v[2], 'planilla', ''));
    D.almacen.items.filter(i => i.venc).forEach(i => add(i.venc, 'fa-calendar-xmark', 'Vence existencia', i.desc.split(' · ')[0], i.stock + ' ' + i.um.toLowerCase() + ' · ' + i.ubic, 'almacen', 'warn'));
    const venc = out.filter(x => x.n < 0).sort((a, b) => b.f - a.f), prox = out.filter(x => x.n >= 0).sort((a, b) => a.f - b.f);
    return { venc, prox, lista: venc.slice(0, 3).concat(prox) };
  }
  const cm = v => { const U = SIGA.ui; return Math.abs(v) >= 1e6 ? 'S/ ' + (v / 1e6).toFixed(2) + ' M' : Math.abs(v) >= 1e4 ? 'S/ ' + (v / 1e3).toFixed(1) + ' mil' : U.money(v); };

  // Pulso por área: cifras vivas de cada oficina
  function areas() {
    const D = SIGA.data, U = SIGA.ui, A = D.abastecimiento, T = D.tesoreria, L = D.almacen, PL = D.planilla, K = D.contabilidad, Q = D.integracion;
    const efectivoCaja = sum(D.caja.ingresos.filter(r => r.medio === 'Efectivo' && !r.depositado), r => r.total);
    const tr = PL.regimenes.reduce((s, r) => s + r[2], 0), bruto = PL.regimenes.reduce((s, r) => s + r[3], 0);
    const ing = sum(D.produccion.unidades, u => u.ing), cos = sum(D.produccion.unidades, u => u.cos);
    const top = D.produccion.unidades.slice().sort((a, b) => (b.ing - b.cos) - (a.ing - a.cos))[0];
    return [
      { t: 'Logística', icon: 'fa-boxes-stacked', go: 'abastecimiento', color: '#14967D', rows: [
        ['Órdenes en curso', A.ordenes.filter(o => ['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(o.estado)).length, 'ord'], ['Requerimientos en evaluación', A.requerimientos.filter(r => r.estado === 'En evaluación').length, 'req'],
        ['Órdenes con atraso', A.ordenes.filter(o => o.estado === 'Atrasada').length, 'con', 'bad'], ['Bienes bajo stock mínimo', L.items.filter(i => i.stock < i.min).length, null, 'warn', 'almacen'],
        ['Valor del almacén', cm(sum(L.items, i => i.stock * (SIGA.alm ? SIGA.alm.cprom(i.cod) : i.cprom))), null, '', 'almacen']] },
      { t: 'Tesorería', icon: 'fa-money-check-dollar', go: 'tesoreria', color: '#0D6EFD', rows: [
        ['Saldo en bancos', cm(sum(T.bancos, b => b.libros)), 'ban'], ['Girados por confirmar', T.cp.filter(c => c.estado === 'Girado').length, 'cp', 'warn'],
        ['Obligaciones vencidas', D.ctaper.obligaciones.filter(o => o.estado === 'Vencida').length, null, 'bad', 'ctaper'], ['Cheques en circulación', T.cheques.filter(c => c.estado === 'Entregado').length, 'chq'],
        ['Efectivo por depositar', cm(efectivoCaja), null, efectivoCaja ? 'warn' : '', 'caja']] },
      { t: 'Producción', icon: 'fa-industry', go: 'produccion', color: '#D97706', rows: [
        ['Ingresos de agosto', cm(ing), 'uni'], ['Excedente', cm(ing - cos), 'ren'], ['Órdenes en proceso', D.produccion.ordenes.filter(o => o.estado === 'En proceso').length, 'op'],
        ['Mejor resultado', top.nom.replace('Planta de café y cacao', 'Café y cacao'), 'uni'], ['Ventas por cobrar', cm(sum(D.ventas.comprobantes.filter(c => c.op === 'Crédito' && !c.anulado), c => c.total - (c.cobrado || 0))), null, '', 'ventas']] },
      { t: 'RR.HH.', icon: 'fa-users', go: 'planilla', color: '#7C3AED', rows: [
        ['Trabajadores', U.int(tr), 'res'], ['Planilla bruta', U.mill(bruto, 2), 'men'], ['Licencias por aprobar', PL.licencias.filter(l => l[3] === 'Solicitada').length, 'vac', 'warn'],
        ['Planilla de agosto', PL.generada ? 'Generada' : 'Por generar', 'men', PL.generada ? '' : 'warn'], ['Mandatos judiciales', D.ctaper.judiciales.filter(j => j.estado !== 'Levantado').length, null, '', 'ctaper']] },
      { t: 'Control', icon: 'fa-shield-halved', go: 'seguridad', color: '#DC2626', rows: [
        ['Alertas críticas', SIGA.alerts().filter(a => a.lvl === 'crit').length, null, 'bad', null], ['Bitácora de hoy', D.seguridad.bitacora.filter(b => b.ts.startsWith(SIGA.ctx.hoy)).length, 'bit'],
        ['Intentos denegados', D.seguridad.bitacora.filter(b => /Denegado|bloquead/i.test(b.despues + b.acc)).length, 'bit', 'bad'], ['Mensajes en cola SIAF', Q.msgs.filter(m => m.estado === 'En cola').length, null, '', 'integracion'],
        ['Asientos del mes', U.int(K.asientos.length), null, '', 'contabilidad']] }
    ];
  }

  SIGA.registerModule('dashboard', {
    title: 'Tablero de control', icon: 'fa-gauge-high', group: 'Principal',
    render(el) {
      const U = SIGA.ui, D = SIGA.data, P = D.presupuesto, api = SIGA.ppto, d = D.dashboard;
      const pim = api.pim(), F = P.fases, M = P.mensual;
      const prog = M.prog[7], metaMes = prog / M.prog[11];
      const fases = [['Asignado (PIM)', pim, 'fa-sack-dollar'], ['Certificado', F.cert, 'fa-file-invoice-dollar'], ['Comprometido', F.comp, 'fa-file-signature'], ['Devengado', F.dev, 'fa-scale-balanced'], ['Girado', F.gir, 'fa-money-check-dollar'], ['Pagado', F.pag, 'fa-building-columns']];
      const sem = Object.assign({}, d.semaforoBase);
      P.marco.forEach(m => { const s = api.saldo(m), p = s / m.pim; if (s < 0) sem.sobre++; else if (p < 0.05) sem.rojo++; else if (p < 0.2) sem.ambar++; else sem.verde++; });
      const rdr = D.caja.acumulado + sum(D.caja.ingresos.filter(r => r.nuevo), r => r.total);
      const bancos = sum(D.tesoreria.bancos, b => b.libros);
      const oblig = D.ctaper.obligaciones.filter(o => !['Pagado', 'Anulado'].includes(o.estado));
      const aTiempo = D.ctaper.obligaciones.length ? D.ctaper.obligaciones.filter(o => o.estado !== 'Vencida').length / D.ctaper.obligaciones.length : 1;
      const nuevasCert = P.certificaciones.filter(c => c.nuevo).length, nuevasOrd = D.abastecimiento.ordenes.filter(o => o.nuevo).length, nuevosCp = D.tesoreria.cp.filter(c => c.nuevo).length;
      const incr = M.dev.filter(v => v != null).map((v, i, a) => i ? v - a[i - 1] : v);
      const ventasMes = sum(D.ventas.comprobantes.filter(c => !c.anulado), c => c.total);
      const bandeja = SIGA.bandeja ? SIGA.bandeja.mias().length : 0;
      const ag = agenda(), ar = areas();
      const K = (lab, val, pre, suf, dec, sub, chip, spark, color, go) => ({ lab, val, pre, suf, dec, sub, chip, spark, color, go });
      const tiles = [
        K('PIM 2026', pim / 1e6, 'S/ ', ' M', 2, 'PIA ' + U.mill(P.pia, 1) + ' · ' + P.notas.length + ' notas', '+' + ((pim / P.pia - 1) * 100).toFixed(1) + '%', M.prog.slice(0, 8), '#14967D', 'presupuesto'),
        K('Certificado', F.cert / 1e6, 'S/ ', ' M', 2, U.pct(F.cert, pim) + ' del PIM', U.int(d.contadores.certActivas + nuevasCert) + ' CCP', M.prog.slice(0, 8).map((v, i) => v * 0.9 + i), '#0D6EFD', 'presupuesto'),
        K('Devengado', F.dev / 1e6, 'S/ ', ' M', 2, 'meta al mes ' + (metaMes * 100).toFixed(1) + '%', U.pct(F.dev, pim), M.dev.slice(0, 8), '#D97706', 'presupuesto'),
        K('Pagado', F.pag / 1e6, 'S/ ', ' M', 2, U.int(d.contadores.cp + nuevosCp) + ' comprobantes de pago', U.pct(F.pag, F.dev, 0) + ' del dev.', M.dev.slice(0, 8).map(v => v * 0.95), '#14967D', 'tesoreria'),
        K('Recursos propios', rdr / 1e6, 'S/ ', ' M', 2, 'meta anual ' + U.mill(d.metas.rdrAnual, 1), U.pct(rdr, d.metas.rdrAnual, 0), D.ventas.mensual.ventas, '#7C3AED', 'caja'),
        K('Saldo en bancos', bancos / 1e6, 'S/ ', ' M', 2, D.tesoreria.bancos.length + ' cuentas · por pagar ' + U.mill(sum(oblig, o => o.imp), 2), (bancos / Math.max(1, sum(oblig, o => o.imp))).toFixed(0) + '× cobertura', D.tesoreria.flujo.ing.slice(0, 8), '#0D6EFD', 'tesoreria')
      ];
      const heatRows = P.genericas.map(g => g.cod + ' ' + g.nom.replace('Adquisición de activos no financieros', 'Activos no financieros'));
      const heatData = P.genericas.map(g => incr.map((v, i) => Math.round(v * (d.pesos[g.cod] || [])[i] * 100) / 100));

      el.innerHTML = `
      <div class="cmd">
        <div class="cmd-top"><div><div class="eyebrow">${SIGA.ctx.inst} · ${SIGA.ctx.sede} · Ejercicio ${SIGA.ctx.ejercicio}</div>
          <h2>Centro de mando · Alta Dirección</h2>
          <p>Buenos días, <b>${SIGA.ctx.user.nombre}</b> · ${SIGA.ctx.user.rolTx}. Un solo sistema, un solo dato, una sola verdad: presupuesto, logística, tesorería, contabilidad, planillas y centros de producción en línea con SIAF-SP, SIGA-MEF y SUNAT.</p></div>
          <div class="cmd-clock"><b id="db-clock">${U.clock()}</b><span>${SIGA.ctx.hoy} · hora oficial</span>
            <div class="cmd-sys">${['SIAF-SP', 'SUNAT', 'SIGA-MEF', 'Banco'].map(s => `<span class="${D.integracion.caido[s] ? 'off' : 'on'}"><i></i>${s}</span>`).join('')}</div></div></div>
        <div class="cmd-stats">${d.hero.map(h => `<div><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')}<div><b data-cu="${(pim / 1e6).toFixed(2)}" data-dec="2" data-pre="S/ " data-suf=" M">S/ ${(pim / 1e6).toFixed(2)} M</b><span>PIM 2026</span></div>
          <div class="cmd-inbox" id="db-inbox"><b>${bandeja}</b><span>tareas en mi bandeja</span><i class="fa-solid fa-arrow-right"></i></div></div>
      </div>
      <div class="page-head"><div><h1>Tablero de control</h1><p>Ejecución consolidada de todas las fuentes · cifras vivas de los 18 módulos · actualizado ${U.now()}</p></div>
        <div class="row-flex"><button class="btn ghost" id="db-exp"><i class="fa-solid fa-file-excel"></i> Exportar</button><button class="btn ghost" id="db-rep"><i class="fa-solid fa-print"></i> Reporte ejecutivo</button><button class="btn ghost" id="db-imp"><i class="fa-solid fa-chart-line"></i> Impacto</button><button class="btn" id="db-new"><i class="fa-solid fa-plus"></i> Nueva certificación</button></div></div>
      <div class="ktiles mb">${tiles.map((k, i) => `<div class="ktile" data-go="${k.go}" style="--kc:${k.color}"><div class="kt-h"><span>${k.lab}</span><em>${k.chip}</em></div>
        <b data-cu="${k.val.toFixed(k.dec)}" data-dec="${k.dec}" data-pre="${k.pre}" data-suf="${k.suf}">${k.pre}${k.val.toFixed(k.dec)}${k.suf}</b><div class="kt-s">${k.sub}</div>${U.spark(k.spark, k.color, 36)}</div>`).join('')}</div>
      <div class="grid cols-4 mb gauges">
        <div class="card">${U.gauge(F.dev / pim, { label: 'Ejecución anual', sub: 'devengado / PIM · marca: meta a agosto', color: '#D97706', meta: metaMes })}</div>
        <div class="card">${U.gauge(F.cert / pim, { label: 'Certificación', sub: 'certificado / PIM', color: '#0D6EFD' })}</div>
        <div class="card">${U.gauge(rdr / d.metas.rdrAnual, { label: 'Recaudación RDR', sub: U.money(rdr) + ' de ' + U.mill(d.metas.rdrAnual, 1), color: '#7C3AED', meta: 8 / 12 })}</div>
        <div class="card">${U.gauge(aTiempo, { label: 'Pagos a tiempo', sub: 'obligaciones no vencidas · meta ' + (d.metas.pagosATiempo * 100) + '%', color: '#14967D', meta: d.metas.pagosATiempo })}</div>
      </div>
      <div class="card mb"><h3><span class="dot"></span>Cadena de ejecución del gasto · SIAF-SP <span class="grow">clic en una fase para ver sus certificaciones</span></h3>
        <div class="chain" id="db-siaf">${fases.map((s, i) => `<div class="ch-step ${i < 3 ? 'done' : i === 3 ? 'cur' : ''}" data-i="${i}"><i class="fa-solid ${s[2]}"></i><div class="k">${s[0]}</div><div class="v" data-cu="${(s[1] / 1e6).toFixed(2)}" data-dec="2" data-pre="S/ " data-suf=" M">S/ ${(s[1] / 1e6).toFixed(2)} M</div><div class="p">${U.pct(s[1], pim)}</div><div class="bar"><span style="width:${Math.min(100, s[1] / pim * 100)}%"></span></div></div>`).join('')}</div>
        <p class="mini mt">Ninguna fase puede superar a la que la precede. La brecha entre <b>comprometido</b> (${U.mill(F.comp)}) y <b>devengado</b> (${U.mill(F.dev)}) se concentra en la Unidad Ejecutora de Inversiones.</p></div>
      <div class="split mb">
        <div class="card"><h3><span class="dot"></span>Ejecución acumulada frente a la programación <span class="grow">millones de soles</span></h3>
          ${U.chart.line({ labels: M.labels, series: [{ name: 'Programado', data: M.prog }, { name: 'Devengado', data: M.dev }], fmt: v => 'S/ ' + v.toFixed(2) + ' M', axFmt: v => v.toFixed(0), h: 300 })}</div>
        <div class="card"><h3><span class="dot"></span>Pulso en vivo <span class="grow">bitácora de todas las oficinas</span></h3><div class="feed" id="db-feed"></div>
          <button class="btn sm ghost mt" onclick="SIGA.go('seguridad')"><i class="fa-solid fa-arrow-right"></i> Bitácora completa</button></div>
      </div>
      <div class="grid cols-5 mb areas">${ar.map((a, i) => `<div class="card area" style="--ac:${a.color}"><h3><i class="fa-solid ${a.icon}"></i> ${a.t}</h3>${a.rows.map((r, j) => `<div class="ar-row ${r[3] || ''}" data-a="${i}" data-r="${j}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<button class="btn sm ghost mt" data-ago="${a.go}"><i class="fa-solid fa-arrow-right"></i> ${SIGA.modules[a.go].title}</button></div>`).join('')}</div>
      <div class="split mb">
        <div class="card"><h3><span class="dot"></span>Devengado mensual por genérica de gasto <span class="grow">S/ millones · enero–agosto</span></h3>${U.heat({ rows: heatRows, cols: M.labels.slice(0, 8), data: heatData, fmt: v => v.toFixed(2), title: 'Devengado mensual por genérica' })}
          <div class="grid cols-4 mt" style="gap:8px">${(() => { const mx = Math.max(...incr), im = incr.indexOf(mx), prom = sum(incr) / incr.length, proy = M.dev[7] + prom * 4; return [['Devengado de agosto', 'S/ ' + incr[7].toFixed(2) + ' M', 'a la fecha de corte'], ['Promedio mensual', 'S/ ' + prom.toFixed(2) + ' M', 'enero–agosto'], ['Mes pico', M.labels[im], 'S/ ' + mx.toFixed(2) + ' M'], ['Proyección al cierre', 'S/ ' + proy.toFixed(1) + ' M', U.pct(proy * 1e6, pim) + ' del PIM al ritmo actual']].map(x => `<div class="mini-card"><div class="lab">${x[0]}</div><div class="v">${x[1]}</div><div class="s">${x[2]}</div></div>`).join(''); })()}</div>
          <div class="note warn mt" style="margin-bottom:0"><i class="fa-solid fa-triangle-exclamation"></i><div>Al ritmo actual la ejecución cerraría por debajo de la meta institucional del ${(d.metas.ejecucionAnual * 100).toFixed(0)}%: la genérica 2.6 (inversiones) concentra el saldo por ejecutar.</div></div></div>
        <div class="card"><h3><span class="dot"></span>Agenda de vencimientos <span class="grow">de todos los módulos · próximos 45 días</span></h3><div class="agenda" id="db-ag">${ag.lista.slice(0, 10).map(x => `<div class="ag-i ${x.cls}" data-go="${x.mod}"><div class="ag-d"><b>${x.f.getDate()}</b><span>${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'][x.f.getMonth()]}</span></div><div class="ag-c"><em><i class="fa-solid ${x.icon}"></i> ${x.tipo}</em><b>${U.esc(x.t)}</b><span>${U.esc(x.d)}</span></div><div class="ag-n">${x.n < 0 ? 'hace ' + (-x.n) + ' d' : x.n === 0 ? 'hoy' : 'en ' + x.n + ' d'}</div></div>`).join('')}</div>
          <div class="mini mt">${ag.prox.length} eventos próximos · ${ag.venc.length} vencidos por regularizar</div></div>
      </div>
      <div class="grid cols-3 mb">
        <div class="card"><h3><span class="dot"></span>Ejecución por genérica</h3>${U.bars(P.genericas.map((g, i) => [g.cod + ' ' + g.nom, g.dev / g.pim * 100, U.chart.PAL[i % 3], U.pct(g.dev, g.pim)]))}
          <div class="lbl-s mt mb">Por fuente de financiamiento</div>${U.bars(P.fuentes.map((f, i) => [f.cod + ' ' + f.nom, f.dev / f.pim * 100, U.chart.PAL[i % 3], U.pct(f.dev, f.pim)]))}</div>
        <div class="card"><h3><span class="dot"></span>Principales proveedores 2026 <span class="grow">monto en órdenes</span></h3><div id="db-prov"></div>
          <div class="lbl-s mt mb">Productos más vendidos · agosto</div><div id="db-prod"></div></div>
        <div class="card"><h3><span class="dot"></span>Semáforo de partidas <span class="grow">alerta temprana</span></h3>
          <div class="semaf">${[['Saldo &gt; 20%', sem.verde, 't-green', '#16a34a'], ['Saldo 5% – 20%', sem.ambar, 't-amber', '#d97706'], ['Saldo &lt; 5%', sem.rojo, 't-red', '#dc2626'], ['Sobregiro heredado', sem.sobre, 't-red', '#7f1d1d']].map(s => `<div><i style="background:${s[3]}"></i><span>${s[0]}</span><b data-cu="${s[1]}">${s[1]}</b></div>`).join('')}</div>
          <div class="lbl-s mt mb">Centros de costo con menor avance</div>
          ${P.centros.map(r => ({ r, p: r[3] / r[2] * 100 })).sort((a, b) => a.p - b.p).slice(0, 5).map(b => `<div style="margin-bottom:8px"><div class="row-flex" style="justify-content:space-between;font-size:11.5px"><span>${b.r[1].replace('Programa Académico de', 'P.A.').replace('Laboratorio de Sistemas de Producción Ganadera', 'Lab. Prod. Ganadera')}</span><b>${b.p.toFixed(0)}%</b></div>${U.meter(b.p, null, 7)}</div>`).join('')}
          <button class="btn sm ghost mt" id="db-sem-go"><i class="fa-solid fa-arrow-right"></i> Marco y saldos</button></div>
      </div>
      <div class="card"><h3><span class="dot"></span>Últimos movimientos presupuestales <span class="grow">con todas sus acciones: ver, aprobar, avanzar fase, imprimir, historial</span></h3><div id="db-mov"></div></div>`;

      // Rankings
      const provs = {}; D.abastecimiento.ordenes.filter(o => o.estado !== 'Anulada').forEach(o => provs[o.prov] = (provs[o.prov] || 0) + o.imp);
      const tp = Object.entries(provs).sort((a, b) => b[1] - a[1]).slice(0, 5);
      document.getElementById('db-prov').innerHTML = U.bars(tp.map((p, i) => [p[0].replace(/ (SAC|SRL|EIRL|SA)$/, ''), p[1] / tp[0][1] * 100, U.chart.PAL[i % 3], U.mill(p[1], 2)]));
      const pr = {}; D.ventas.comprobantes.filter(c => !c.anulado).forEach(c => c.items.forEach(([cod, q]) => { const p = D.ventas.productos.find(x => x.cod === cod); if (p) pr[p.desc] = (pr[p.desc] || 0) + q * p.pu; }));
      const tv = Object.entries(pr).sort((a, b) => b[1] - a[1]).slice(0, 5);
      document.getElementById('db-prod').innerHTML = U.bars(tv.map((p, i) => [p[0], p[1] / tv[0][1] * 100, U.chart.PAL[(i + 1) % 3], U.money(p[1])]));

      // Feed en vivo
      const feed = () => { const f = document.getElementById('db-feed'); if (!f) return false;
        f.innerHTML = D.seguridad.bitacora.slice(0, 9).map(b => `<div class="fd-i ${/Denegado|bloquead|rechaz/i.test(b.acc + b.despues) ? 'bad' : ''}"><span class="fd-av">${b.user.split(' ').map(w => w[0]).join('').slice(0, 2)}</span><div><b>${U.esc(b.acc)}</b><span>${U.esc(b.ref)} · ${U.esc(b.user)} · ${b.mod}</span></div><em>${b.ts.slice(0, 5) === SIGA.ctx.hoyCorta ? b.ts.slice(11, 16) : b.ts.slice(0, 5)}</em></div>`).join(''); return true; };
      feed();
      const tick = setInterval(() => { const c = document.getElementById('db-clock'); if (!c || !el.isConnected) { clearInterval(tick); return; } c.textContent = U.clock(); }, 1000);

      // Últimos movimientos con acciones completas
      document.getElementById('db-mov').innerHTML = U.grid({ id: 'db-mov', title: 'movimientos presupuestales', export: 'movimientos_presupuestales', rows: P.certificaciones, record: SIGA.recs.cert, pageSize: 8,
        filter: { label: 'Fase', get: r => r.fase },
        cols: [
          { k: 'num', label: 'CCP', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha.split('/').reverse().join('') },
          { k: 'fte', label: 'Fte', render: r => api.marco(r.marco).fte },
          { k: 'part', label: 'Clasificador', render: r => `<span class="code">${api.marco(r.marco).clasif}</span>` },
          { k: 'dep', label: 'Meta / Centro de costo', render: r => { const m = api.marco(r.marco); return m.meta + ' · ' + m.ccn; } },
          { k: 'monto', label: 'Importe', r: true, render: r => U.money(r.monto) },
          { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, api.FCLS[r.fase]) }
        ], rowCls: r => (r.nuevo ? 'row-new' : '') + (r.fase === 'Anulada' ? ' row-void' : '') });

      U.countUp(el);
      const fasesMap = [null, 'Certificado', 'Comprometido', 'Devengado', 'Girado', 'Pagado'];
      el.querySelectorAll('#db-siaf .ch-step').forEach(s => s.addEventListener('click', () => { const f = fasesMap[+s.dataset.i]; SIGA.modules.presupuesto.f = f || 'Todas'; SIGA.go('presupuesto'); }));
      el.querySelectorAll('.ktile[data-go]').forEach(t => t.addEventListener('click', () => SIGA.go(t.dataset.go)));
      el.querySelectorAll('[data-ago]').forEach(b => b.addEventListener('click', () => SIGA.go(b.dataset.ago)));
      el.querySelectorAll('.ar-row').forEach(r => r.addEventListener('click', () => { const a = ar[+r.dataset.a], row = a.rows[+r.dataset.r]; const mod = row[4] !== undefined ? row[4] : a.go; if (!mod) { document.getElementById('bell').click(); return; } const grp = { planilla: 'pl', abastecimiento: 'a', tesoreria: 't', produccion: 'cp', seguridad: 'sg' }[mod]; SIGA.go(mod, row[2] && grp ? { [grp]: row[2] } : undefined); }));
      el.querySelectorAll('#db-ag .ag-i').forEach(x => x.addEventListener('click', () => SIGA.go(x.dataset.go)));
      document.getElementById('db-inbox').addEventListener('click', () => SIGA.go('bandeja'));
      document.getElementById('db-exp').addEventListener('click', () => { SIGA.log('Tablero', 'Exportación de consolidado', 'Ejecución 2026'); U.csv('consolidado_ejecucion_2026', ['Rubro', 'Concepto', 'PIM', 'Certificado', 'Devengado', 'Avance %'], [...fases.map(f => ['Fase', f[0], pim.toFixed(2), '', f[1].toFixed(2), (f[1] / pim * 100).toFixed(2)]), ...P.genericas.map(g => ['Genérica', g.cod + ' ' + g.nom, g.pim.toFixed(2), '', g.dev.toFixed(2), (g.dev / g.pim * 100).toFixed(2)]), ...P.fuentes.map(f => ['Fuente', f.cod + ' ' + f.nom, f.pim.toFixed(2), f.cert.toFixed(2), f.dev.toFixed(2), (f.dev / f.pim * 100).toFixed(2)])]); });
      document.getElementById('db-rep').addEventListener('click', () => this.reporte());
      document.getElementById('db-imp').addEventListener('click', () => SIGA.go('impacto'));
      document.getElementById('db-new').addEventListener('click', () => { SIGA.go('presupuesto'); setTimeout(() => SIGA.modules.presupuesto.nueva(), 60); });
      document.getElementById('db-sem-go').addEventListener('click', () => SIGA.go('presupuesto', { p: 'marco' }));
    },
    reporte() {
      const U = SIGA.ui, D = SIGA.data, P = D.presupuesto, F = P.fases, pim = SIGA.ppto.pim(), dt = (h, rows) => `<table class="doc-tbl"><thead><tr>${h.map((x, i) => `<th class="${i ? 'r' : ''}">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${i ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      SIGA.log('Tablero', 'Reporte ejecutivo', 'Agosto 2026');
      U.preview('Reporte ejecutivo · agosto 2026', U.doc({ tipo: 'Reporte ejecutivo de gestión', num: 'RE-2026-08', office: 'Dirección General de Administración',
        pairs: [['PIM 2026', U.money(pim)], ['Devengado', U.money(F.dev) + ' (' + U.pct(F.dev, pim) + ')'], ['Saldo en bancos', U.money(sum(D.tesoreria.bancos, b => b.libros))], ['Recursos propios 2026', U.money(D.caja.acumulado)]],
        body: dt(['Fase del gasto', 'Importe S/', '% del PIM'], [['Certificado', F.cert, 0], ['Comprometido', F.comp, 0], ['Devengado', F.dev, 0], ['Girado', F.gir, 0], ['Pagado', F.pag, 0]].map(r => [r[0], U.money(r[1], ''), U.pct(r[1], pim)])) +
          dt(['Genérica de gasto', 'PIM', 'Devengado', 'Avance'], P.genericas.map(g => [g.cod + ' ' + g.nom, U.money(g.pim, ''), U.money(g.dev, ''), U.pct(g.dev, g.pim)])) +
          dt(['Fuente de financiamiento', 'PIM', 'Certificado', 'Devengado'], P.fuentes.map(f => [f.cod + ' ' + f.nom, U.money(f.pim, ''), U.money(f.cert, ''), U.money(f.dev, '')])) +
          `<p style="font-size:11.5px"><b>Alertas:</b> ${SIGA.alerts().filter(a => a.lvl === 'crit').map(a => U.esc(a.t)).join(' · ') || 'sin alertas críticas'}.</p>`,
        firmas: [['Director General de Administración', 'E. Mendoza'], ['Jefe de Planificación y Presupuesto', 'M. Ríos'], ['Rectorado', 'Toma conocimiento']] }), { file: 'reporte_ejecutivo_2026_08' });
    }
  });
})();
