/* ============================================================
   Centros de Producción · "Por primera vez, saber cuánto cuesta producir lo que producimos"
   ============================================================ */
(function () {
  const P = SIGA.data.produccion;
  // Costeo de una orden: materia prima + mano de obra + depreciación + CIF (% sobre MP), con merma
  const costeo = o => {
    const mp = o.insumos.reduce((s, i) => s + i[3] * i[4], 0), mo = o.mo[0] * o.mo[1], cif = mp * o.cif / 100, tot = mp + mo + o.dep + cif;
    const util = o.cant * (1 - o.merma / 100);
    return { mp, mo, dep: o.dep, cif, tot, util, cu: util ? tot / util : 0, ing: util * o.pv, mar: util * o.pv - tot };
  };
  const cu = c => (c[2] + c[3] + c[4] + c[5]) * (1 + c[6] / 100);
  SIGA.prod = { costeo };

  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const PM = () => SIGA.modules.produccion;
  const ECL = { 'En proceso': 't-blue', Terminada: 't-amber', Cerrada: 't-green', Anulada: 't-red' };
  const opRec = SIGA.recs.op = {
    mod: 'Centros de producción', tipo: 'Orden de producción', office: 'Centros de Producción de Bienes y Servicios', key: o => o.op, title: o => o.op + ' · ' + o.prod, cls: false, anuladoValor: 'Anulada',
    view: o => PM().verOP(o),
    fields: o => { const U = SIGA.ui, c = costeo(o); return [['Orden', o.op], ['Producto', o.prod], ['Unidad productiva', o.unidad], ['Cantidad', U.int(o.cant) + ' ' + o.um], ['Inicio · fin', o.inicio + ' · ' + o.fin], ['Avance', o.avance + '%'], ['Costo total', U.money(c.tot)], ['Costo unitario', 'S/ ' + c.cu.toFixed(2)], ['Estado', o.estado]]; },
    edit: [{ k: 'avance', label: 'Avance %', type: 'number', span: 1 }, { k: 'fin', label: 'Fecha meta', span: 1 }, { k: 'merma', label: 'Merma real %', type: 'number', span: 1 }],
    canEdit: o => o.estado === 'En proceso',
    onEdit: o => { o.avance = Math.max(0, Math.min(100, o.avance)); if (o.avance >= 100) { o.estado = 'Terminada'; SIGA.ui.toast(o.op + ' terminada · lista para ingresar al almacén'); } },
    anular: true, anularLabel: 'Anular orden', canAnular: o => o.estado === 'En proceso' && o.avance < 50,
    extra: o => [...(o.estado === 'Terminada' ? [{ icon: 'fa-box-archive', label: 'Cerrar e ingresar producto terminado', fn: x => PM().cerrarOP(x) }] : []), ...(o.estado === 'En proceso' ? [{ icon: 'fa-dolly', label: 'Solicitar insumos (PECOSA)', fn: x => { const ab = SIGA.modules.abastecimiento; ab.tipo = 'pec'; if (ab.st) { ab.st.v.pec.dep = x.unidad; ab.st.v.pec.ref = 'Insumos para ' + x.op + ' · ' + x.prod; ab.st.items.pec = x.insumos.filter(i => i[0] !== '—').map(i => ({ cod: i[0], desc: i[1], um: i[2].toUpperCase(), cant: Math.ceil(i[3] * (1 - x.avance / 100)), pu: i[4] })); } SIGA.ui.closeModal(); SIGA.go('abastecimiento'); } }] : [])],
    print: o => { const U = SIGA.ui, c = costeo(o); return { tipo: 'Orden de producción · hoja de costos', num: o.op, pairs: [['Producto', o.prod], ['Unidad productiva', o.unidad], ['Cantidad', U.int(o.cant) + ' ' + o.um + ' · merma ' + o.merma + '%'], ['Periodo', o.inicio + ' – ' + o.fin]],
      body: dtbl([['Insumo'], ['Und'], ['Cant.', 1], ['C. unit.', 1], ['Subtotal', 1]], o.insumos.map(i => [i[1], i[2], i[3], U.money(i[4], ''), U.money(i[3] * i[4], '')])) + dtbl([['Elemento del costo'], ['S/', 1]], [['Materia prima', U.money(c.mp, '')], ['Mano de obra (' + o.mo[0] + ' h)', U.money(c.mo, '')], ['Depreciación', U.money(c.dep, '')], ['Costos indirectos', U.money(c.cif, '')], ['<b>Costo total</b>', '<b>' + U.money(c.tot, '') + '</b>'], ['Costo unitario por ' + o.um, c.cu.toFixed(4)], ['Margen estimado', U.money(c.mar, '')]]) }; }
  };

  SIGA.registerModule('produccion', {
    title: 'Centros de producción', icon: 'fa-industry', group: 'Centros de Producción · RDR', badge: 'RDR', badgeHot: true,
    alerts() {
      const t = P.ordenes.filter(o => o.estado === 'Terminada').length;
      return t ? [{ lvl: 'info', icon: 'fa-industry', t: `${t} orden(es) de producción terminada(s) por ingresar a almacén`, d: 'Producto terminado con su costo', fn: () => SIGA.showTab(document.getElementById('mod-root'), 'cp', 'op') }] : [];
    },
    search(q) { return P.ordenes.filter(o => (o.op + ' ' + o.prod + ' ' + o.unidad).toLowerCase().includes(q)).map(o => ({ t: o.op + ' · ' + o.prod, d: o.unidad + ' · ' + o.estado, fn: () => this.verOP(o) })); },
    render(el) {
      const U = SIGA.ui, ing = P.unidades.reduce((s, u) => s + u.ing, 0), cos = P.unidades.reduce((s, u) => s + u.cos, 0), exc = ing - cos;
      el.innerHTML = `
      <div class="page-head"><div><h1>Centros de Producción de Bienes y Servicios</h1><p>14 unidades productivas · costeo real · control productivo · autofinanciamiento con recursos directamente recaudados (fuente 09)</p></div>
        <div class="row-flex"><button class="btn ghost" onclick="SIGA.go('ventas')"><i class="fa-solid fa-receipt"></i> Punto de venta</button><button class="btn" id="cp-nop"><i class="fa-solid fa-plus"></i> Orden de producción</button></div></div>
      <div class="cmp mb"><div class="asis"><h5>Hoy · sin ningún sistema</h5><b>14</b> unidades con cuadernos y hojas de cálculo · <b>0</b> costos determinados · <b>0</b> facturación electrónica · <b>0</b> indicadores productivos.</div>
        <div class="tobe"><h5>SIGA-U</h5>Costo unitario real por producto, inventario valorizado, control pecuario y agrícola, comprobante electrónico y margen por línea para decidir qué expandir y qué reconvertir.</div></div>
      ${U.kpis([
        { lab: 'Unidades productivas', val: P.unidades.length, sub: P.unidades.filter(u => u.estado !== 'En implementación').length + ' operando' },
        { lab: 'Ingresos de agosto', val: U.money(ing), sub: 'ventas + servicios · fuente 09', color: 'var(--primary-dark)', chip: 'RDR', chipType: 'info' },
        { lab: 'Costo de producción', val: U.money(cos), sub: 'insumos + mano de obra + depreciación + CIF' },
        { lab: 'Excedente', val: U.money(exc), sub: '→ prioridad investigación', chip: U.pct(exc, ing, 0) }
      ])}
      <div class="seg-tabs" data-group="cp"><button class="on" data-tab="uni">Unidades productivas</button><button data-tab="cu">Costo unitario real</button><button data-tab="op">Órdenes de producción</button><button data-tab="plan">Plan de producción</button><button data-tab="ren">Rentabilidad y excedente</button></div>
      <div class="subpanel show" data-group="cp" data-panel="uni"><div class="card"><h3><span class="dot"></span>Unidades productivas <span class="grow">CP-01 · clic para ver detalle</span></h3><div id="cp-uni"></div></div></div>
      <div class="subpanel" data-group="cp" data-panel="cu" id="cp-p-cu"></div>
      <div class="subpanel" data-group="cp" data-panel="op"><div class="card"><h3><span class="dot"></span>Órdenes de producción con costeo <span class="grow">CP-03 a CP-09 · insumos del almacén, mano de obra, depreciación y CIF</span></h3><div id="cp-ops"></div></div></div>
      <div class="subpanel" data-group="cp" data-panel="plan" id="cp-p-plan"></div>
      <div class="subpanel" data-group="cp" data-panel="ren" id="cp-p-ren"></div>`;
      el.querySelector('#cp-nop').addEventListener('click', () => this.nuevaOP());
      this.paintUni(); this.paintCU(); this.paintOps(); this.paintPlan(); this.paintRen(ing, cos);
    },
    paintUni() {
      const U = SIGA.ui;
      const goOf = u => u.tipo === 'Pecuaria' ? 'pecuario' : u.tipo === 'Agrícola' ? 'agricola' : 'ventas';
      const uRec = { mod: 'Centros de producción', tipo: 'Ficha de unidad productiva', key: u => u.cc, title: u => u.nom, cls: false,
        fields: u => [['Línea de producción', u.linea, 1], ['Tipo', u.tipo], ['Centro de costo presupuestal (CP-12)', `<span class="code">${u.cc}</span>`], ['Ingresos de agosto', U.money(u.ing)], ['Costo de producción', U.money(u.cos)], ['Resultado', `<b class="${u.ing - u.cos >= 0 ? 'saldo-pos' : 'saldo-neg'}">${U.money(u.ing - u.cos)}</b>`], ['Registro anterior', u.antes], ['Estado', u.estado]],
        body: u => { const os = P.ordenes.filter(o => o.unidad === u.nom); return os.length ? `<div class="lbl-s mt mb">Órdenes de producción (${os.length})</div>` + U.table([{ k: 'op', label: 'Orden' }, { k: 'prod', label: 'Producto' }, { k: 'estado', label: 'Estado', render: o => U.tag(o.estado, ECL[o.estado]) }, { k: 'c', label: 'Costo', r: true, render: o => U.money(costeo(o).tot) }], os, { onRow: o => this.verOP(o) }) : ''; },
        edit: [{ k: 'estado', label: 'Estado', type: 'select', options: ['Operativa', 'En campaña', 'En mantenimiento', 'En implementación', 'Suspendida'], span: 1 }, { k: 'linea', label: 'Línea de producción' }],
        extra: u => [{ icon: 'fa-arrow-right', label: 'Ir a ' + SIGA.modules[goOf(u)].title, fn: x => { U.closeModal(); SIGA.go(goOf(x)); } }, { icon: 'fa-industry', label: 'Nueva orden de producción', fn: () => { U.closeModal(); this.nuevaOP(); } }] };
      document.getElementById('cp-uni').innerHTML = U.grid({ id: 'pro-uni', title: 'unidades productivas', export: 'unidades_productivas', rows: P.unidades, record: uRec, pageSize: 14, filter: { label: 'Tipo', get: r => r.tipo }, cols: [
        { k: 'nom', label: 'Unidad productiva', render: r => `<b>${r.nom}</b><div class="mini">${r.linea}</div>`, csv: r => r.nom }, { k: 'tipo', label: 'Tipo', render: r => U.tag(r.tipo, { Pecuaria: 't-teal', Agrícola: 't-green', Agroindustrial: 't-blue', Servicios: 't-gray' }[r.tipo]) },
        { k: 'ing', label: 'Ingresos', r: true, render: r => U.money(r.ing) }, { k: 'cos', label: 'Costo', r: true, render: r => U.money(r.cos) },
        { k: 'm', label: 'Margen', sv: r => r.ing ? (r.ing - r.cos) / r.ing : -1, render: r => r.ing ? `<div class="mcell">${U.meter((r.ing - r.cos) / r.ing * 100 * 1.6)}<span>${((r.ing - r.cos) / r.ing * 100).toFixed(0)}%</span></div>` : '<span class="mini">—</span>' },
        { k: 'antes', label: 'Registro anterior', render: r => `<span class="mini" style="text-decoration:line-through">${r.antes}</span>` },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.estado === 'Operativa' ? 't-green' : r.estado === 'En campaña' ? 't-amber' : 't-gray') }
      ], foot: rs => `<tr><td colspan="3" class="r"><b>Total</b></td><td class="r num"><b>${U.money(rs.reduce((s, u) => s + u.ing, 0))}</b></td><td class="r num"><b>${U.money(rs.reduce((s, u) => s + u.cos, 0))}</b></td><td colspan="4"></td></tr>` });
    },
    paintCU() {
      const U = SIGA.ui;
      document.getElementById('cp-p-cu').innerHTML = `<div class="card"><h3><span class="dot"></span>¿Cuánto cuesta un litro de leche o un kilo de carne? <span class="grow">CP-07 · costo unitario real con merma</span></h3><div id="cu-t"></div>
        <p class="mini mt">Costo unitario = (insumos + mano de obra + depreciación + costos indirectos) × (1 + merma). Por primera vez los precios de venta se sustentan en información de costos.</p></div>`;
      const cuRec = { mod: 'Centros de producción', tipo: 'Estructura de costo unitario', key: r => 'CU ' + r[0], title: r => 'Costo unitario · ' + r[0], cls: false,
        fields: r => [['Producto', r[0]], ['Unidad', r[1]], ['Unidad productiva', r[8]], ['Insumos', r[2].toFixed(2)], ['Mano de obra', r[3].toFixed(2)], ['Depreciación', r[4].toFixed(2)], ['CIF', r[5].toFixed(2)], ['Merma', r[6] + '%'], ['Costo unitario', `<b>S/ ${cu(r).toFixed(2)}</b>`], ['Precio de venta', 'S/ ' + r[7].toFixed(2)], ['Margen', ((r[7] - cu(r)) / r[7] * 100).toFixed(1) + '%']],
        edit: [[2, 'Insumos S/'], [3, 'Mano de obra S/'], [4, 'Depreciación S/'], [5, 'CIF S/'], [6, 'Merma %'], [7, 'Precio de venta S/']].map(([i, l]) => ({ k: 'c' + i, label: l, type: 'number', span: 1, get: r => r[i], set: (r, v) => r[i] = v })),
        onEdit: r => { const p = SIGA.data.ventas.productos.find(x => r[0].toLowerCase().startsWith(x.desc.toLowerCase().split(' ')[0]) && x.unidad === r[8]); if (p && p.pu !== r[7]) { p.pu = r[7]; SIGA.ui.toast('Precio de ' + p.desc + ' actualizado en el catálogo de ventas'); } } };
      document.getElementById('cu-t').innerHTML = U.grid({ id: 'pro-cu', title: 'costos unitarios', export: 'costo_unitario_real', rows: P.costos, record: cuRec, pageSize: 12, cols: [
        { k: 0, label: 'Producto', render: r => `<b>${r[0]}</b><div class="mini">${r[8]} · por ${r[1]}</div>`, csv: r => r[0] },
        { k: 2, label: 'Insumos', r: true, render: r => r[2].toFixed(2) }, { k: 3, label: 'Mano de obra', r: true, render: r => r[3].toFixed(2) }, { k: 4, label: 'Deprec.', r: true, render: r => r[4].toFixed(2) }, { k: 5, label: 'CIF', r: true, render: r => r[5].toFixed(2) }, { k: 6, label: 'Merma', r: true, render: r => r[6] + '%' },
        { k: 'cu', label: 'Costo unitario', r: true, sv: cu, render: r => `<b>S/ ${cu(r).toFixed(2)}</b>` }, { k: 7, label: 'Precio', r: true, render: r => 'S/ ' + r[7].toFixed(2) },
        { k: 'm', label: 'Margen', sv: r => (r[7] - cu(r)) / r[7], render: r => { const m = (r[7] - cu(r)) / r[7] * 100; return `<div class="mcell">${U.meter(m * 1.4)}<span>${m.toFixed(0)}%</span></div>`; } }
      ] });
    },
    paintOps() {
      const U = SIGA.ui;
      document.getElementById('cp-ops').innerHTML = U.grid({ id: 'pro-ops', title: 'órdenes de producción', export: 'ordenes_produccion', rows: P.ordenes, record: opRec, pageSize: 10, filter: { label: 'Estado', get: r => r.estado }, cols: [
        { k: 'op', label: 'Orden', render: r => `<span class="code">${r.op}</span>` }, { k: 'prod', label: 'Producto', render: r => `${r.prod}<div class="mini">${r.unidad}</div>`, csv: r => r.prod },
        { k: 'cant', label: 'Cantidad', r: true, render: r => U.int(r.cant) + ' ' + r.um },
        { k: 'c', label: 'Costo total', r: true, sv: r => costeo(r).tot, render: r => U.money(costeo(r).tot) }, { k: 'u', label: 'Costo unit.', r: true, sv: r => costeo(r).cu, render: r => 'S/ ' + costeo(r).cu.toFixed(2) },
        { k: 'mar', label: 'Margen est.', r: true, sv: r => costeo(r).mar, render: r => { const c = costeo(r); return `<span class="${c.mar >= 0 ? 'saldo-pos' : 'saldo-neg'}">${U.money(c.mar)}</span>`; } },
        { k: 'avance', label: 'Avance', render: r => `<div class="mcell">${U.meter(r.avance, 'var(--secondary)')}<span>${r.avance}%</span></div>` },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, ECL[r.estado]) }
      ], rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-box-archive', title: 'Cerrar e ingresar producto terminado', show: r => r.estado === 'Terminada', fn: o => this.cerrarOP(o) }, { icon: 'fa-gauge-high', title: 'Registrar avance', show: r => r.estado === 'En proceso', fn: o => U.rec(opRec).editar(o) }, { icon: 'fa-print', title: 'Hoja de costos', fn: o => U.rec(opRec).imprimir(o) }],
        tools: [{ icon: 'fa-plus', label: 'Nueva orden', primary: true, fn: () => this.nuevaOP() }],
        foot: rs => { const v = rs.filter(o => o.estado !== 'Anulada'); return `<tr><td colspan="4" class="r"><b>Total (${v.length})</b></td><td class="r num"><b>${U.money(v.reduce((s, o) => s + costeo(o).tot, 0))}</b></td><td></td><td class="r num"><b>${U.money(v.reduce((s, o) => s + costeo(o).mar, 0))}</b></td><td colspan="3"></td></tr>`; } });
    },
    verOP(o) {
      const U = SIGA.ui, c = costeo(o);
      const b = U.modal('Orden de producción ' + o.op + ' · ' + o.prod, `<div class="split"><div>
        ${U.table([{ k: 1, label: 'Insumo / material', render: r => r[1] + (r[0] !== '—' ? ` <span class="code">${r[0]}</span>` : '') }, { k: 2, label: 'Und' }, { k: 3, label: 'Cant.', r: true }, { k: 4, label: 'C. unit.', r: true, render: r => U.money(r[4], '') }, { k: 5, label: 'Subtotal', r: true, render: r => U.money(r[3] * r[4], '') }], o.insumos)}
        <p class="mini mt">Los insumos con código salen del almacén de la unidad con PECOSA y se imputan al costo de la orden (L-12 · CP-04).</p></div>
        <div><div class="saldo-box"><div class="lab">Costo unitario real</div><div class="big">S/ ${c.cu.toFixed(2)}</div><div class="mini" style="color:var(--sidebar-ink)">por ${o.um} · ${U.int(c.util)} ${o.um} útiles tras ${o.merma}% de merma</div>
          <div class="row"><span>Materia prima e insumos</span><span>${U.money(c.mp)}</span></div><div class="row"><span>Mano de obra (${o.mo[0]} h × S/ ${o.mo[1]})</span><span>${U.money(c.mo)}</span></div>
          <div class="row"><span>Depreciación de equipos</span><span>${U.money(c.dep)}</span></div><div class="row"><span>Costos indirectos (${o.cif}% MP)</span><span>${U.money(c.cif)}</span></div>
          <div class="row"><span><b>Costo total</b></span><span><b>${U.money(c.tot)}</b></span></div><div class="row"><span>Ingreso proyectado (S/ ${o.pv}/${o.um})</span><span class="g">${U.money(c.ing)}</span></div>
          <div class="row"><span>Margen estimado</span><span class="g">${U.money(c.mar)} · ${(c.mar / c.ing * 100).toFixed(0)}%</span></div></div></div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="op-h"><i class="fa-solid fa-clock-rotate-left"></i> Historial</button>${o.estado === 'En proceso' ? '<button class="btn ghost" id="op-av"><i class="fa-solid fa-gauge-high"></i> Registrar avance</button>' : ''}<button class="btn sec" id="op-pr"><i class="fa-solid fa-print"></i> Hoja de costos</button>${o.estado === 'Terminada' ? '<button class="btn" id="op-close"><i class="fa-solid fa-box-archive"></i> Ingresar producto terminado</button>' : ''}`, 'wide');
      b.querySelector('#op-close')?.addEventListener('click', () => { U.closeModal(); this.cerrarOP(o); });
      b.querySelector('#op-av')?.addEventListener('click', () => U.rec(opRec).editar(o));
      b.querySelector('#op-h').addEventListener('click', () => U.rec(opRec).historial(o));
      b.querySelector('#op-pr').addEventListener('click', () => U.rec(opRec).imprimir(o));
    },
    cerrarOP(o) {
      const U = SIGA.ui, c = costeo(o);
      U.confirm(`¿Cerrar <b>${o.op}</b> e ingresar ${U.int(c.util)} ${o.um} de ${o.prod} al almacén de productos terminados a S/ ${c.cu.toFixed(2)} por ${o.um}?`, () => {
        o.estado = 'Cerrada'; o.avance = 100;
        SIGA.alm?.ingreso([{ cod: 'PT-' + o.op, desc: o.prod + ' (producto terminado)', um: o.um.toUpperCase(), cant: Math.round(c.util), pu: c.cu }], 'NIPT ' + o.op.slice(3), '', o.unidad);
        const a = SIGA.asiento('Ingreso de producto terminado · ' + o.op + ' · ' + o.prod, [['1302', c.tot, 0], ['1301', 0, c.tot]], 'Centro de producción');
        SIGA.log('Centros de producción', 'Cierre de orden de producción', o.op, 'Terminada', 'Ingresado a almacén · CU S/ ' + c.cu.toFixed(2));
        U.toast(`${o.op} cerrada · producto terminado valorizado en ${U.money(c.tot)} · asiento ${a || ''}`); SIGA.refresh();
      }, 'Cerrar e ingresar', '');
    },
    paintPlan() {
      const U = SIGA.ui;
      document.getElementById('cp-p-plan').innerHTML = `<div class="card"><h3><span class="dot"></span>Plan de producción · agosto 2026 <span class="grow">CP-02 · programado vs real al ${SIGA.ctx.hoyCorta} (día 18 de 31 · 58% del mes)</span></h3><div id="pl-t"></div></div>`;
      const plRec = { mod: 'Centros de producción', tipo: 'Plan de producción', key: r => 'PLAN ' + r[0] + ' ' + r[1], title: r => r[1] + ' · ' + r[0], cls: false,
        fields: r => [['Unidad', r[0]], ['Producto', r[1]], ['Plan del mes', U.int(r[3]) + ' ' + r[2]], ['Real a la fecha', U.int(r[4]) + ' ' + r[2]], ['Avance', (r[4] / r[3] * 100).toFixed(1) + '%'], ['Proyección al cierre', U.int(Math.round(r[4] / 0.58)) + ' ' + r[2]]],
        edit: [{ k: 'real', label: 'Producción real acumulada', type: 'number', span: 1, get: r => r[4], set: (r, v) => r[4] = v }, { k: 'plan', label: 'Plan del mes', type: 'number', span: 1, get: r => r[3], set: (r, v) => r[3] = v }] };
      document.getElementById('pl-t').innerHTML = U.grid({ id: 'pro-plan', title: 'plan de producción', export: 'plan_produccion_agosto', rows: P.plan, record: plRec, search: false, pageSize: 15, cols: [
        { k: 0, label: 'Unidad' }, { k: 1, label: 'Producto' }, { k: 3, label: 'Plan del mes', r: true, render: r => U.int(r[3]) + ' ' + r[2] }, { k: 4, label: 'Real a la fecha', r: true, render: r => U.int(r[4]) + ' ' + r[2] },
        { k: 'a', label: 'Avance', render: r => { const p = r[4] / r[3] * 100; return `<div class="mcell">${U.meter(p / 0.58, p >= 55 ? 'var(--primary)' : 'var(--warning)')}<span>${p.toFixed(0)}%</span></div>`; } },
        { k: 's', label: 'Ritmo', sv: r => r[4] / r[3], render: r => r[4] / r[3] >= 0.55 ? U.tag('En ritmo', 't-green') : U.tag('Bajo ritmo', 't-amber') }
      ], actions: [{ icon: 'fa-pen', title: 'Registrar producción', fn: r => U.rec(plRec).editar(r) }] });
    },
    paintRen(ing, cos) {
      const U = SIGA.ui, M = P.mensual, exc = ing - cos;
      const lines = P.unidades.filter(u => u.ing).map(u => ({ n: u.nom, r: u.ing - u.cos })).sort((a, b) => b.r - a.r);
      document.getElementById('cp-p-ren').innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Ingresos y costos 2026 <span class="grow">miles de soles por mes</span></h3>
          ${U.chart.cols({ labels: M.labels, series: [{ name: 'Ingresos', data: M.ing }, { name: 'Costos', data: M.cos }], fmt: v => 'S/ ' + v + ' mil', h: 230 })}</div>
        <div class="saldo-box"><div class="lab">Distribución del excedente de agosto</div><div class="big">${U.money(exc)}</div>${P.excedente.map(e => `<div class="row"><span>${e[0]}</span><span class="g">${e[1]}% · ${U.money(exc * e[1] / 100)}</span></div>`).join('')}
          <p class="mini" style="color:var(--sidebar-ink);margin-top:10px">Los centros deben autofinanciarse; el excedente se destina prioritariamente a investigación.</p></div></div>
        <div class="split"><div class="card"><h3><span class="dot"></span>Resultado por unidad productiva <span class="grow">CP-10 · qué expandir y qué reconvertir</span></h3>${U.bars(lines.map((l, i) => [l.n, l.r / lines[0].r * 100, i < 3 ? U.chart.PAL[0] : U.chart.PAL[1], U.money(l.r)]))}</div>
          <div class="card"><h3><span class="dot"></span>Merma y desecho <span class="grow">CP-09 · efecto sobre el costo</span></h3>${U.table([{ k: 0, label: 'Unidad' }, { k: 1, label: 'Causa' }, { k: 2, label: '%', r: true, render: r => r[2] + '%' }, { k: 3, label: 'Costo', r: true, render: r => U.money(r[3]) }], P.merma)}</div></div>`;
    },
    nuevaOP() {
      const U = SIGA.ui, un = P.unidades.filter(u => u.estado !== 'En implementación').map(u => u.nom);
      const next = 'OP-' + (232 + P.ordenes.filter(o => o.nuevo).length);
      const calc = (rows, v) => { const o = { insumos: rows.map(r => ['', '', '', parseFloat(r.cant) || 0, parseFloat(r.costo) || 0]), mo: [parseFloat(v.horas) || 0, parseFloat(v.tarifa) || 0], dep: parseFloat(v.dep) || 0, cif: parseFloat(v.cif) || 0, merma: parseFloat(v.merma) || 0, cant: parseFloat(v.cant) || 0, pv: parseFloat(v.pv) || 0 }; return costeo(o); };
      U.bigForm({
        title: 'Nueva orden de producción con costeo', icon: 'fa-industry',
        sections: [
          { title: 'Datos de la orden', cols: 3, fields: [{ k: 'op', label: 'Orden N°', value: next, ro: true, span: 1 }, { k: 'ini', label: 'Inicio', type: 'date', value: SIGA.ctx.hoyISO, span: 1 }, { k: 'fin', label: 'Fecha meta', type: 'date', value: '2026-08-28', span: 1 }, { k: 'unidad', label: 'Unidad productiva', type: 'select', options: un, value: 'Planta de lácteos', span: 2 }, { k: 'resp', label: 'Responsable', value: SIGA.ctx.user.nombre, span: 1 }] },
          { title: 'Producto', cols: 3, fields: [{ k: 'prod', label: 'Producto', value: 'Manjar blanco 500 g', required: true, span: 1 }, { k: 'cant', label: 'Cantidad a producir', type: 'number', value: 400, span: 1 }, { k: 'um', label: 'Unidad', type: 'select', options: ['frasco', 'botella', 'kg', 'bolsa', 'unidad'], span: 1 }, { k: 'pv', label: 'Precio de venta S/', type: 'number', value: 9, span: 1 }, { k: 'merma', label: 'Merma esperada %', type: 'number', value: 2, span: 1 }] },
          { title: 'Mano de obra, depreciación y CIF', hint: 'CP-05 · CP-06', cols: 3, fields: [{ k: 'horas', label: 'Horas-hombre', type: 'number', value: 48, span: 1 }, { k: 'tarifa', label: 'Tarifa S/ por hora', type: 'number', value: 9.5, span: 1 }, { k: 'dep', label: 'Depreciación de equipos S/', type: 'number', value: 140, span: 1 }, { k: 'cif', label: 'Costos indirectos % de MP', type: 'number', value: 6, span: 1 }] }
        ],
        items: { title: 'Insumos y materiales (salen del almacén de la unidad)', addLabel: 'Agregar insumo', seed: { insumo: '', um: 'kg', cant: 1, costo: 0 },
          rows: [{ insumo: 'Leche fresca (del establo)', um: 'litro', cant: 800, costo: 2.44 }, { insumo: 'Azúcar', um: 'kg', cant: 90, costo: 3.8 }, { insumo: 'Frasco de vidrio 500 g', um: 'und', cant: 400, costo: 0.95 }],
          columns: [{ k: 'insumo', label: 'Insumo', w: '44%' }, { k: 'um', label: 'Und.', w: '12%' }, { k: 'cant', label: 'Cant.', type: 'num', r: true, w: '12%' }, { k: 'costo', label: 'Costo unit.', type: 'money', r: true, w: '14%' }, { k: 'sub', label: 'Subtotal', calc: r => (parseFloat(r.cant) || 0) * (parseFloat(r.costo) || 0), r: true, w: '18%' }] },
        totals: (rows, v) => { const c = calc(rows, v); return [{ label: 'Materia prima', val: U.money(c.mp, '') }, { label: 'Mano de obra', val: U.money(c.mo, '') }, { label: 'Depreciación + CIF', val: U.money(c.dep + c.cif, '') }, { label: 'Costo total', val: U.money(c.tot, '') }, { label: 'Costo unitario', val: 'S/ ' + c.cu.toFixed(2) }, { label: 'MARGEN ESTIMADO S/', val: U.money(c.mar, ''), big: true, cls: c.mar < 0 ? 'neg' : '' }]; },
        status: (rows, v) => { const c = calc(rows, v); return c.mar < 0 ? `<div class="note warn"><i class="fa-solid fa-triangle-exclamation"></i><div>El precio de venta no cubre el costo unitario (S/ ${c.cu.toFixed(2)}). Revise antes de producir.</div></div>` : `<div class="note teal"><i class="fa-solid fa-chart-line"></i><div>Margen estimado antes de producir: <b>${(c.mar / (c.ing || 1) * 100).toFixed(0)}%</b> · costo unitario S/ ${c.cu.toFixed(2)} por ${v.um}.</div></div>`; },
        submitLabel: 'Crear orden',
        onSubmit: (v, rows) => {
          const o = { op: v.op, prod: v.prod, unidad: v.unidad, cant: parseFloat(v.cant) || 0, um: v.um, pv: parseFloat(v.pv) || 0, avance: 0, inicio: U.dmy(v.ini), fin: U.dmy(v.fin), estado: 'En proceso', insumos: rows.map(r => ['—', r.insumo, r.um, parseFloat(r.cant) || 0, parseFloat(r.costo) || 0]), mo: [parseFloat(v.horas) || 0, parseFloat(v.tarifa) || 0], dep: parseFloat(v.dep) || 0, cif: parseFloat(v.cif) || 0, merma: parseFloat(v.merma) || 0, nuevo: true };
          P.ordenes.unshift(o);
          SIGA.log('Centros de producción', 'Orden de producción', o.op, '—', o.prod + ' · CU S/ ' + costeo(o).cu.toFixed(2));
          U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'cp', 'op'); U.toast(`${o.op} creada · costo unitario estimado S/ ${costeo(o).cu.toFixed(2)}`);
        }
      });
    }
  });
})();
