/* ============================================================
   Centros de producción · manufactura
   Procesos tomados de ERP de manufactura (Odoo MRP, Quality, Maintenance):
   · Receta / lista de materiales (BOM) versionada con ruta de operaciones y puntos de control
   · Planificación de requerimientos (MRP): explosión de materiales contra stock y faltantes
   · Recepción de materia prima con análisis contra especificación (aprobación, concesión, rechazo)
   · Lotes de producto terminado con control de calidad al cierre (liberado / cuarentena),
     trazabilidad hacia atrás y hacia adelante, y retiro del mercado
   · Mantenimiento preventivo por horas o por calendario, correctivo por falla, órdenes de trabajo
   ============================================================ */
(function () {
  const P = SIGA.data.produccion, HOY = new Date(2026, 7, 18);
  const P2 = n => String(n).padStart(2, '0');
  const pd = s => /^\d{2}\/\d{2}\/\d{4}$/.test(s || '') ? new Date(+s.slice(6), +s.slice(3, 5) - 1, +s.slice(0, 2)) : null;
  const fd = d => P2(d.getDate()) + '/' + P2(d.getMonth() + 1) + '/' + d.getFullYear();
  const addD = (s, n) => { const d = new Date(pd(s)); d.setDate(d.getDate() + n); return fd(d); };
  const dd = s => Math.round((HOY - pd(s)) / 864e5);           // días transcurridos desde s (negativo: futuro)
  const sv = s => +(pd(s) || 0);
  const num = v => parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0;
  const INT = v => SIGA.ui.int(Math.round(+v || 0));
  const item = cod => SIGA.data.almacen.items.find(i => i.cod === cod);
  const nota = (cls, ic, html) => `<div class="note ${cls}"><i class="fa-solid ${ic}"></i><div>${html}</div></div>`;
  const dtbl = (head, rows) => `<div class="tbl-wrap"><table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i] && head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${head.length}" class="empty-row">Sin registros</td></tr>`}</tbody></table></div>`;
  const nextId = (list, key, pre, pad) => pre + SIGA.ui.pad(Math.max(0, ...list.map(x => +(String(x[key]).match(/(\d+)$/) || [0, 0])[1])) + 1, pad);

  // Materia prima de cada orden en proceso (vínculo con la recepción analizada)
  [['OP-0228', ['RMP-0405']], ['OP-0230', ['RMP-0406', 'RMP-0410']], ['OP-0229', ['RMP-0407']], ['OP-0231', ['RMP-0400']]].forEach(([op, r]) => { const o = P.ordenes.find(x => x.op === op); if (o) o.rmp = r; });
  P.ordenes.forEach(o => { const l = P.lotesPT.find(x => x.op === o.op); if (l) { o.lote = l.lote; o.rmp = o.rmp || l.mp; } });

  /* =================== Recetas y MRP =================== */
  const receta = o => P.recetas.find(r => new RegExp(r.pat).test(o.prod));
  const cuIng = g => g[0] !== '—' && g[0] !== 'LECHE' && item(g[0]) ? (SIGA.alm ? SIGA.alm.cprom(g[0]) : item(g[0]).cprom) : g[4];
  const lecheDia = () => { const t = SIGA.data.pecuario && SIGA.data.pecuario.especies.vacuno.tanque; return t ? t[t.length - 1].planta : 220; };
  function costoReceta(r) {
    // mano de obra: tiempo activo de cada operación (las esperas largas cuentan como supervisión de 2 h) × 1.5 operarios × S/ 9.50
    const mp = r.ing.reduce((s, g) => s + g[3] * cuIng(g), 0), min = r.ops.reduce((s, o) => s + o[2], 0), mo = r.ops.reduce((s, o) => s + Math.min(o[2], 120), 0) / 60 * 1.5 * 9.5;
    const util = r.base * r.rend / 100, tot = mp + mo + r.dep + mp * 0.06;
    const pv = (SIGA.data.ventas.productos.find(p => p.cod === r.venta) || {}).pu || 0;
    return { mp, mo, dep: r.dep, cif: mp * 0.06, tot, util, cu: tot / util, pv, mar: pv ? (pv - tot / util) / pv * 100 : 0, min };
  }
  function explotar(r, qty) {
    const f = qty / (r.base * r.rend / 100);
    return r.ing.map(g => {
      const req = g[3] * f, it = g[0] !== '—' && g[0] !== 'LECHE' ? item(g[0]) : null;
      const stock = g[0] === 'LECHE' ? lecheDia() : it ? it.stock : null;
      return { cod: g[0], desc: g[1], um: g[2], req, cu: cuIng(g), costo: req * cuIng(g), it, stock, falta: g[0] === 'LECHE' ? 0 : it ? Math.max(0, req - it.stock) : 0, leche: g[0] === 'LECHE' };
    });
  }
  // Cantidad por producir según el plan del mes (pendiente) o un lote estándar
  const planPend = r => { const p = P.plan.find(x => new RegExp(r.pat).test(x[1])); if (!p) return r.base * 4; const pend = Math.max(0, p[3] - p[4]); return r.um === 'bolsa' ? pend * 2 : Math.round(pend); };

  /* =================== Calidad de materia prima =================== */
  const evalP = (s, v) => { if (typeof s[2] === 'string') return v === s[2]; const x = parseFloat(v); if (v === '' || v == null || isNaN(x)) return null; return (s[2] == null || x >= s[2]) && (s[3] == null || x <= s[3]); };
  const specTxt = s => typeof s[2] === 'string' ? s[2] : s[2] != null && s[3] != null ? `${s[2]} – ${s[3]} ${s[1]}` : s[2] != null ? `≥ ${s[2]} ${s[1]}` : `≤ ${s[3]} ${s[1]}`;
  function dictamen(mp, res) {
    const sp = P.specs[mp] || [], f = sp.filter(s => evalP(s, res[s[0]]) === false);
    if (f.some(s => s[4] === 'crítico')) return ['Rechazado', f];
    if (f.some(s => s[4] === 'mayor')) return ['Aprobado con observación', f];
    return ['Aprobado', f];
  }
  function recibir(o) {
    const id = nextId(P.recepciones, 'id', 'RMP-', 4);
    P.recepciones.unshift({ id, f: SIGA.ctx.hoy, mp: /leche/i.test(o.mp) ? 'Leche fresca de vaca' : o.mp, prov: o.prov, origen: o.origen || '', cant: o.cant, um: o.um, destino: o.destino, res: o.grasa ? { Grasa: o.grasa, 'Sólidos totales': o.st } : {}, estado: 'Pendiente de análisis', analista: '', obs: '', nuevo: true });
    SIGA.log('Centros de producción', 'Recepción de materia prima', id, '—', o.mp + ' · ' + o.cant + ' ' + o.um + ' · ' + o.prov);
    return id;
  }
  SIGA.prod = SIGA.prod || {}; SIGA.prod.recibir = recibir;

  /* =================== Lotes y trazabilidad =================== */
  function distribucion() {
    const out = {}, by = {};
    P.lotesPT.forEach(l => { out[l.lote] = []; (by[l.venta] = by[l.venta] || []).push(l); });
    Object.values(by).forEach(ls => ls.sort((a, b) => sv(a.f) - sv(b.f)));
    const asig = {}; P.lotesPT.forEach(l => { asig[l.lote] = 0; });
    SIGA.data.ventas.comprobantes.filter(c => !c.anulado && c.items).slice().sort((a, b) => sv(a.fecha) - sv(b.fecha)).forEach(c => c.items.forEach(([cod, q]) => {
      let rest = q;
      for (const l of by[cod] || []) {
        if (sv(l.f) > sv(c.fecha) || /Cuarentena|Retenido/.test(l.estado) || (l.recall && sv(l.recall.f) <= sv(c.fecha))) continue;
        const d = l.cant - l.previo - asig[l.lote]; if (d <= 0) continue;
        const t = Math.min(d, rest); asig[l.lote] += t; out[l.lote].push({ doc: c.doc, fecha: c.fecha, cli: c.cli, docCli: c.docCli, cant: t }); rest -= t; if (!rest) break;
      }
    }));
    return { out, asig };
  }
  const dispDe = (l, D) => Math.max(0, l.cant - l.previo - (D.asig[l.lote] || 0) - (l.retirado || 0));
  const estLote = l => l.estado === 'Liberado' && dd(l.venc) > 0 ? 'Vencido' : l.estado;

  /* =================== Mantenimiento =================== */
  function prox(e) {
    const [t, n] = e.frec;
    if (t === 'h') { const ph = e.ult[1] + n, rest = ph - e.horas; return { txt: `a las ${INT(ph)} h`, rest, u: 'h', venc: rest <= 0, cerca: rest > 0 && rest <= 50 }; }
    const f = addD(e.ult[0], n), rest = -dd(f); return { txt: f, rest, u: 'd', venc: rest < 0, cerca: rest >= 0 && rest <= 7, f };
  }
  const dispEq = e => Math.max(0, 100 - e.parada / 2400 * 100);
  const otCosto = o => o.rep.reduce((s, r) => s + r[1] * r[2], 0) + (o.ext || 0);

  const M = {
    receta, costoReceta, explotar, recibir, distribucion, prox, dictamen,
    alerts() {
      const out = [], D = distribucion();
      P.equipos.forEach(e => { const p = prox(e); if (p.venc && e.estado !== 'Fuera de servicio') out.push({ lvl: e.crit === 'Alta' ? 'warn' : 'info', icon: 'fa-screwdriver-wrench', t: `Mantenimiento preventivo vencido · ${e.nom}`, d: e.unidad + ' · ' + (p.u === 'h' ? `excedido en ${INT(-p.rest)} h de uso` : `desde el ${p.f}`), fn: () => M.ir('mnt') }); if (e.estado === 'Fuera de servicio') out.push({ lvl: e.crit === 'Alta' ? 'crit' : 'warn', icon: 'fa-triangle-exclamation', t: `Equipo fuera de servicio · ${e.nom}`, d: e.unidad + ' · OT correctiva en curso', fn: () => M.ir('mnt') }); });
      const pend = P.recepciones.filter(r => r.estado === 'Pendiente de análisis');
      if (pend.length) out.push({ lvl: 'info', icon: 'fa-flask-vial', t: `${pend.length} recepción(es) de materia prima por analizar`, d: pend.map(r => r.id + ' · ' + r.mp).join(' · '), fn: () => M.ir('cal') });
      P.lotesPT.forEach(l => { const d = dispDe(l, D); if (l.estado === 'Liberado' && d > 0 && -dd(l.venc) <= 5 && -dd(l.venc) >= 0) out.push({ lvl: 'warn', icon: 'fa-hourglass-end', t: `Lote ${l.lote} vence el ${l.venc.slice(0, 5)}`, d: `${INT(d)} ${l.um} disponibles · ${l.prod} · promover venta o donación`, fn: () => M.ir('lot') }); if (l.estado === 'En cuarentena') out.push({ lvl: 'info', icon: 'fa-lock', t: `Lote ${l.lote} en cuarentena`, d: l.prod + ' · pendiente de liberación por calidad', fn: () => M.ir('lot') }); });
      return out;
    },
    search(q) {
      const out = [];
      P.lotesPT.filter(l => (l.lote + ' ' + l.prod + ' ' + l.op).toLowerCase().includes(q)).forEach(l => out.push({ t: 'Lote ' + l.lote + ' · ' + l.prod, d: 'Producto terminado · ' + l.estado + ' · vence ' + l.venc, fn: () => M.ir('lot', () => M.traza(l)) }));
      P.recepciones.filter(r => (r.id + ' ' + r.mp + ' ' + r.prov).toLowerCase().includes(q)).forEach(r => out.push({ t: r.id + ' · ' + r.mp, d: r.prov + ' · ' + r.estado, fn: () => M.ir('cal', () => SIGA.ui.rec(M.recRec()).ver(r)) }));
      P.equipos.filter(e => (e.cod + ' ' + e.nom + ' ' + e.patr).toLowerCase().includes(q)).forEach(e => out.push({ t: e.cod + ' · ' + e.nom, d: e.unidad + ' · ' + e.estado, fn: () => M.ir('mnt', () => SIGA.ui.rec(M.eqRec()).ver(e)) }));
      P.recetas.filter(r => (r.cod + ' ' + r.prod).toLowerCase().includes(q)).forEach(r => out.push({ t: r.cod + ' · ' + r.prod, d: 'Receta ' + r.ver + ' · ' + r.unidad, fn: () => M.ir('bom', () => SIGA.ui.rec(M.bomRec()).ver(r)) }));
      return out;
    },
    ir(tab, after) { SIGA.go('produccion', { cp: tab }); if (after) setTimeout(after, 60); },
    kpis() {
      const D = distribucion(), pend = P.recepciones.filter(r => r.estado === 'Pendiente de análisis').length, rec = P.recepciones.filter(r => /\/08\/2026$/.test(r.f) && r.estado !== 'Pendiente de análisis');
      const lib = P.lotesPT.filter(l => l.estado === 'Liberado').length, cua = P.lotesPT.filter(l => l.estado === 'En cuarentena').length;
      const abiertas = P.ots.filter(o => !/Cerrada|Anulada/.test(o.estado)).length, venc = P.equipos.filter(e => prox(e).venc).length;
      return SIGA.ui.kpis([
        { lab: 'Materia prima · agosto', val: rec.length ? Math.round(rec.filter(r => /^Aprobado/.test(r.estado)).length / rec.length * 100) + ' % aprobada' : '—', sub: `${rec.length} recepciones analizadas · ${rec.filter(r => r.estado === 'Rechazado').length} rechazadas · ${pend} por analizar` },
        { lab: 'Lotes de producto terminado', val: P.lotesPT.length, sub: `${lib} liberados · ${cua} en cuarentena · ${P.lotesPT.filter(l => l.estado === 'Retirado del mercado').length} retirados · ${INT(P.lotesPT.reduce((s, l) => s + dispDe(l, D), 0))} und. disponibles` },
        { lab: 'Mantenimiento', val: abiertas + ' OT abiertas', sub: `${venc} preventivo(s) vencido(s) · ${P.equipos.filter(e => e.estado !== 'Operativo').length} equipo(s) detenido(s)`, chip: venc ? 'atender' : 'al día', chipType: venc ? 'warn' : 'up' },
        { lab: 'Disponibilidad de equipos', val: (P.equipos.reduce((s, e) => s + dispEq(e), 0) / P.equipos.length).toFixed(1) + ' %', sub: `${P.equipos.length} equipos · ${P.equipos.reduce((s, e) => s + e.parada, 0)} h de parada en 12 meses` }
      ]);
    },

    /* ---------- Recetas (BOM) y MRP ---------- */
    bomRec() {
      const U = SIGA.ui;
      return { mod: 'Centros de producción', tipo: 'Receta · lista de materiales', office: 'Centros de Producción de Bienes y Servicios', key: r => r.cod, title: r => r.cod + ' · ' + r.prod + ' · ' + r.ver, estado: 'estado', cls: false, anuladoValor: 'Obsoleta',
        fields: r => { const c = costoReceta(r); return [['Código · versión', `<span class="code">${r.cod}</span> · ${r.ver} vigente desde ${r.vig}`], ['Producto', r.prod], ['Unidad productiva', r.unidad], ['Lote base', INT(r.base) + ' ' + r.um + ' · rendimiento ' + r.rend + ' %'], ['Vida útil', r.vida + ' días'], ['Responsable', r.resp], ['Costo de materiales', U.money(c.mp) + ' por lote base'], ['Costo unitario estándar', `<b>S/ ${c.cu.toFixed(2)}</b> por ${r.um}`], ['Precio de venta', c.pv ? U.money(c.pv) + ' · margen ' + c.mar.toFixed(1) + ' %' : '—'], ['Tiempo de ciclo', INT(c.min / 60) + ' h de proceso']]; },
        body: r => `<div class="lbl-s mt mb">Lista de materiales por ${INT(r.base)} ${r.um}</div>${dtbl([['Código'], ['Insumo'], ['Und.'], ['Cantidad', 1], ['Costo unit.', 1], ['Subtotal', 1], ['Stock', 1]], r.ing.map(g => { const it = g[0] !== '—' && g[0] !== 'LECHE' ? item(g[0]) : null; return [g[0] === 'LECHE' ? '<span class="code">establo</span>' : g[0] === '—' ? '—' : `<span class="code">${g[0]}</span>`, g[1], g[2], (+g[3]).toLocaleString('es-PE', { maximumFractionDigits: 3 }), U.money(cuIng(g), ''), U.money(g[3] * cuIng(g), ''), g[0] === 'LECHE' ? INT(lecheDia()) + ' L/día' : it ? INT(it.stock) + ' ' + it.um.toLowerCase() : 'compra directa']; }))}
          <div class="lbl-s mt mb">Ruta de operaciones</div>${U.timeline(r.ops.map((o, i) => ({ t: (i + 1) + '. ' + o[0], sub: o[1] + (o[3] ? ` · <span class="code">${o[3]}</span>` : ''), when: o[2] ? (o[2] >= 60 ? (o[2] / 60).toFixed(o[2] % 60 ? 1 : 0) + ' h' : o[2] + ' min') : '90 días', st: 'done' })))}
          <div class="lbl-s mt mb">Puntos de control de calidad</div>${dtbl([['Control'], ['Especificación'], ['Etapa'], ['Tipo']], r.qc.map(q => [q[0], q[1], q[2], U.tag(q[3], q[3] === 'PCC' ? 't-red' : q[3] === 'crítico' ? 't-amber' : 't-gray')]))}`,
        extra: r => [{ icon: 'fa-diagram-project', label: 'Explosión de materiales (MRP)', fn: () => M.mrpForm(r) }, { icon: 'fa-industry', label: 'Crear orden de producción', fn: () => M.mrpForm(r) }, { icon: 'fa-code-branch', label: 'Nueva versión de la receta', fn: () => M.versionar(r) }],
        anular: true, anularLabel: 'Declarar obsoleta', canAnular: r => r.estado === 'Vigente',
        print: r => ({ tipo: 'Receta · lista de materiales y ruta', num: r.cod + ' ' + r.ver, body: M.bomRec().body(r), firmas: [['Elaboró', r.resp], ['Revisó', 'Aseguramiento de la calidad'], ['Aprobó', 'Jefe de Centros de Producción']] }) };
    },
    paintBom(host) {
      const U = SIGA.ui, R = this.bomRec();
      const mrp = P.recetas.filter(r => r.estado === 'Vigente').map(r => ({ r, q: planPend(r) }));
      const agg = {}; mrp.forEach(({ r, q }) => explotar(r, q).forEach(x => { const k = x.cod === '—' ? x.desc : x.cod; const a = agg[k] || (agg[k] = { cod: x.cod, desc: x.desc, um: x.um, req: 0, stock: x.stock, it: x.it, leche: x.leche, cu: x.cu, usos: [] }); a.req += x.req; a.usos.push(r.cod.slice(4, 7)); }));
      const need = Object.values(agg).map(a => Object.assign(a, { falta: a.leche ? 0 : a.it ? Math.max(0, a.req - a.it.stock) : 0, dias: a.leche ? a.req / Math.max(1, a.stock) : null })).sort((a, b) => (b.falta > 0) - (a.falta > 0) || (a.it ? 0 : 1) - (b.it ? 0 : 1));
      host.innerHTML = `${nota('info', 'fa-diagram-project', 'Cada producto tiene su <b>receta versionada</b> (lista de materiales, ruta de operaciones con equipos y puntos de control). La orden de producción se genera desde la receta: los materiales se explotan contra el stock del almacén y los faltantes se convierten en requerimiento.')}
        <div class="card mb"><h3><span class="dot"></span>Recetas y listas de materiales <span class="grow">costo estándar por unidad · clic para ver la ficha</span></h3><div id="bom-g"></div></div>
        <div class="card"><h3><span class="dot"></span>Planificación de requerimientos (MRP) · saldo del plan de agosto <span class="grow">necesidades brutas → stock → necesidades netas</span></h3>
          <div class="grid cols-6 mb">${mrp.map(({ r, q }) => `<div class="mini-card clickable" data-mrp="${r.cod}"><div class="lab">${U.esc(r.prod.split(' · ')[0])}</div><div class="v">${INT(q)}</div><div class="s">${r.um} por producir</div></div>`).join('')}</div>
          <div id="mrp-g"></div></div>`;
      host.querySelector('#bom-g').innerHTML = U.grid({ id: 'bom-g', title: 'recetas', export: 'recetas_bom', rows: P.recetas, record: R, pageSize: 10,
        cols: [{ k: 'cod', label: 'Receta', render: r => `<span class="code">${r.cod}</span> <span class="mini">${r.ver}</span>` }, { k: 'prod', label: 'Producto', render: r => `<b>${U.esc(r.prod)}</b><div class="mini">${U.esc(r.unidad)}</div>` }, { k: 'base', label: 'Lote base', r: true, render: r => INT(r.base) + ' ' + r.um },
          { k: 'n', label: 'Insumos · operaciones · controles', render: r => `${r.ing.length} · ${r.ops.length} · ${r.qc.length}` }, { k: 'rend', label: 'Rend.', r: true, render: r => r.rend + ' %' }, { k: 'vida', label: 'Vida útil', r: true, render: r => r.vida + ' d' },
          { k: 'cu', label: 'Costo estándar', r: true, sv: r => costoReceta(r).cu, render: r => `<b>S/ ${costoReceta(r).cu.toFixed(2)}</b>` }, { k: 'pv', label: 'Precio', r: true, render: r => { const c = costoReceta(r); return c.pv ? 'S/ ' + c.pv.toFixed(2) : '—'; } },
          { k: 'mar', label: 'Margen', r: true, sv: r => costoReceta(r).mar, render: r => { const m = costoReceta(r).mar; return `<span style="color:${m < 10 ? 'var(--danger)' : m < 20 ? '#b7791f' : 'var(--ok)'};font-weight:700">${m.toFixed(1)} %</span>`; } }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.estado === 'Vigente' ? 't-green' : 't-gray') }],
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-diagram-project', title: 'Explosión y orden de producción', show: r => r.estado === 'Vigente', fn: r => this.mrpForm(r) }] });
      host.querySelectorAll('[data-mrp]').forEach(b => b.addEventListener('click', () => this.mrpForm(P.recetas.find(r => r.cod === b.dataset.mrp))));
      host.querySelector('#mrp-g').innerHTML = U.grid({ id: 'mrp-g', title: 'necesidades de materiales', export: 'mrp_agosto', rows: need, search: false, pageSize: 20,
        cols: [{ k: 'desc', label: 'Material', render: a => (a.cod !== '—' && !a.leche ? `<span class="code">${a.cod}</span> ` : '') + U.esc(a.desc) }, { k: 'usos', label: 'Recetas', cls: 'mini', render: a => [...new Set(a.usos)].join(' · ') },
          { k: 'req', label: 'Necesidad bruta', r: true, render: a => (+a.req).toLocaleString('es-PE', { maximumFractionDigits: a.req < 10 ? 2 : 0 }) + ' ' + a.um }, { k: 'stock', label: 'Disponible', r: true, render: a => a.leche ? INT(a.stock) + ' L/día' : a.it ? INT(a.it.stock) + ' ' + a.it.um.toLowerCase() : '—' },
          { k: 'falta', label: 'Necesidad neta', r: true, render: a => a.leche ? `<span class="mini">${a.dias.toFixed(1)} días de ordeño</span>` : a.it ? (a.falta > 0 ? `<b style="color:var(--danger)">${(+a.falta).toLocaleString('es-PE', { maximumFractionDigits: 2 })}</b>` : '0') : '<span class="mini">compra directa</span>' },
          { k: 'cob', label: 'Situación', render: a => a.leche ? U.tag('Producción propia', 't-teal') : !a.it ? U.tag('Caja chica / compra local', 't-gray') : a.falta > 0 ? U.tag(a.it.pendiente ? 'Pedido ' + a.it.pendiente : 'Requiere compra', a.it.pendiente ? 't-blue' : 't-red') : U.tag('Cubierto', 't-green') }],
        tools: [{ icon: 'fa-cart-plus', label: 'Requerimiento de faltantes', primary: true, fn: () => this.reqFaltantes(need.filter(a => a.falta > 0 && a.it)) }] });
    },
    reqFaltantes(list) {
      const U = SIGA.ui, ab = SIGA.data.abastecimiento;
      if (!list.length) { U.toast('El stock cubre las necesidades del plan', 'info'); return; }
      const tot = list.reduce((s, a) => s + a.falta * a.cu, 0);
      U.confirm(`Se generará un requerimiento por <b>${list.length}</b> material(es) faltante(s) del MRP (${U.money(tot)}):<br><span class="mini">${list.map(a => U.esc(a.desc) + ' · ' + a.falta.toFixed(2) + ' ' + a.um).join('<br>')}</span>`, () => {
        const n = 'REQ 2026-' + U.pad(939 + ab.requerimientos.filter(x => x.nuevo).length, 4);
        ab.requerimientos.unshift({ num: n, fecha: SIGA.ctx.hoy, cc: 'Centros de producción · MRP', desc: 'Materiales faltantes del plan de producción de agosto · ' + list.length + ' ítems', monto: Math.round(tot * 100) / 100, estado: 'En evaluación', user: SIGA.ctx.user.nombre, aprob: [], nuevo: true });
        SIGA.log('Centros de producción', 'Requerimiento por MRP', n, list.length + ' faltantes', U.money(tot));
        U.toast(`${n} enviado a Abastecimiento`); SIGA.refresh();
      }, 'Generar requerimiento', '');
    },
    mrpForm(r) {
      const U = SIGA.ui, def = planPend(r);
      U.bigForm({
        title: 'Explosión de materiales · ' + r.prod, icon: 'fa-diagram-project',
        sections: [{ title: 'Orden desde la receta ' + r.cod + ' ' + r.ver, cols: 3, fields: [{ k: 'q', label: 'Cantidad a producir (' + r.um + ')', type: 'number', value: def || r.base, span: 1, required: true }, { k: 'ini', label: 'Inicio', type: 'date', value: SIGA.ctx.hoyISO, span: 1 }, { k: 'dias', label: 'Plazo (días)', type: 'number', value: Math.max(2, Math.ceil(r.ops.reduce((s, o) => s + o[2], 0) / 480)), span: 1 }] }],
        status: (rows, v) => {
          const q = num(v.q), ex = explotar(r, q), c = costoReceta(r), f = q / c.util, falt = ex.filter(x => x.falta > 0);
          return dtbl([['Material'], ['Necesidad', 1], ['Disponible', 1], ['Faltante', 1], ['Costo', 1]], ex.map(x => [U.esc(x.desc), (+x.req).toLocaleString('es-PE', { maximumFractionDigits: 2 }) + ' ' + x.um, x.leche ? INT(x.stock) + ' L/día' : x.it ? INT(x.it.stock) + ' ' + x.it.um.toLowerCase() : 'compra directa', x.falta > 0 ? `<b style="color:var(--danger)">${x.falta.toFixed(2)}</b>` : '—', U.money(x.costo, '')]))
            + (falt.length ? nota('warn', 'fa-triangle-exclamation', `${falt.length} material(es) sin stock suficiente: la orden se crea y los faltantes pasan a requerimiento.`) : nota('teal', 'fa-circle-check', 'Materiales cubiertos por el stock del almacén.'))
            + nota('info', 'fa-calculator', `Costo estimado de la orden <b>${U.money(c.tot * f)}</b> · costo unitario S/ ${c.cu.toFixed(2)} · ${r.ops.length} operaciones · ${r.qc.length} controles de calidad`);
        },
        submitLabel: 'Crear orden de producción',
        onSubmit: v => {
          const q = num(v.q); if (q <= 0) { U.toast('Indique la cantidad', 'err'); return; }
          const ex = explotar(r, q), c = costoReceta(r), f = q / c.util, op = 'OP-' + U.pad(232 + P.ordenes.filter(o => o.nuevo).length, 4);
          const o = { op, prod: r.prod, unidad: r.unidad, cant: q, um: r.um, pv: c.pv, avance: 0, inicio: U.dmy(v.ini), fin: addD(U.dmy(v.ini), Math.max(1, num(v.dias))), estado: 'En proceso', receta: r.cod + ' ' + r.ver,
            insumos: ex.map(x => [x.leche || x.cod === '—' ? '—' : x.cod, x.leche ? 'Leche fresca (del establo)' : x.desc, x.um, Math.round(x.req * 1000) / 1000, Math.round(x.cu * 100) / 100]), mo: [Math.round(c.mo / 9.5 * f * 10) / 10, 9.5], dep: Math.round(r.dep * f), cif: 6, merma: 100 - r.rend, nuevo: true };
          P.ordenes.unshift(o);
          SIGA.log('Centros de producción', 'Orden de producción desde receta', op, r.cod + ' ' + r.ver, INT(q) + ' ' + r.um);
          U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'cp', 'op');
          U.toast(`${op} creada desde ${r.cod} · ${ex.filter(x => x.falta > 0).length} faltante(s) de material`);
        }
      });
    },
    versionar(r) {
      const U = SIGA.ui;
      U.bigForm({
        title: 'Nueva versión de la receta ' + r.cod, icon: 'fa-code-branch',
        sections: [{ cols: 3, fields: [{ k: 'ver', label: 'Versión', value: 'v' + (+r.ver.slice(1) + 1), ro: true, span: 1 }, { k: 'rend', label: 'Rendimiento %', type: 'number', value: r.rend, span: 1 }, { k: 'motivo', label: 'Motivo del cambio', value: 'Ajuste de formulación', span: 1, required: true }] }],
        items: { title: 'Lista de materiales por ' + INT(r.base) + ' ' + r.um, addLabel: 'Agregar material', seed: { cod: '—', desc: 'Nuevo material', um: 'kg', q: 1, c: 1 },
          rows: r.ing.map(g => ({ cod: g[0], desc: g[1], um: g[2], q: g[3], c: g[4] })),
          columns: [{ k: 'cod', label: 'Código', w: '120px' }, { k: 'desc', label: 'Material' }, { k: 'um', label: 'Und.', w: '70px' }, { k: 'q', label: 'Cantidad', type: 'num', r: true, w: '90px' }, { k: 'c', label: 'Costo unit.', type: 'num', r: true, w: '90px' }, { k: 's', label: 'Subtotal', calc: x => (+x.q || 0) * (+x.c || 0), w: '100px' }] },
        totals: rows => { const mp = rows.reduce((s, x) => s + (+x.q || 0) * (+x.c || 0), 0); return [{ label: 'Materiales por lote base', val: U.money(mp) }, { label: 'Anterior', val: U.money(costoReceta(r).mp) }]; },
        submitLabel: 'Aprobar nueva versión',
        onSubmit: (v, rows) => {
          const antes = r.ver + ' · ' + U.money(costoReceta(r).mp);
          Object.assign(r, { ver: v.ver, vig: SIGA.ctx.hoy, rend: num(v.rend) || r.rend, ing: rows.map(x => [x.cod || '—', x.desc, x.um, +x.q || 0, +x.c || 0]), nuevo: true });
          SIGA.log('Centros de producción', 'Nueva versión de receta', r.cod, antes, r.ver + ' · ' + v.motivo);
          U.closeModal(); SIGA.refresh(); U.toast(`${r.cod} ${r.ver} vigente · las nuevas órdenes usan esta versión`);
        }
      });
    },
    // Ruta, controles y lote en el detalle de una orden de producción
    opExtra(o) {
      const U = SIGA.ui, r = receta(o); if (!r) return '';
      const done = Math.round(o.avance / 100 * r.ops.length);
      return `<div class="split eq mt"><div><div class="lbl-s mb">Ruta de operaciones · ${r.cod} ${r.ver}</div>${U.timeline(r.ops.map((x, i) => ({ t: x[0], sub: x[1] + (x[3] ? ' · ' + x[3] : ''), st: o.estado !== 'En proceso' || i < done ? 'done' : i === done ? 'cur' : '' })))}</div>
        <div><div class="lbl-s mb">Controles de calidad</div>${dtbl([['Control'], ['Especificación'], ['Resultado']], r.qc.map((q, i) => [q[0], q[1], o.qc ? U.tag(o.qc[i] ? o.qc[i][1] : '—', o.qc[i] && o.qc[i][1] === 'Conforme' ? 't-green' : 't-red') : '<span class="mini">al cierre</span>']))}
        ${o.rmp ? `<div class="lbl-s mt mb">Materia prima</div>${o.rmp.map(id => { const x = P.recepciones.find(y => y.id === id); return x ? `<div class="ef-row"><span><span class="code">${x.id}</span> ${U.esc(x.mp)} · ${x.f}</span>${U.tag(x.estado, /^Aprobado$/.test(x.estado) ? 't-green' : 't-amber')}</div>` : ''; }).join('')}` : ''}
        ${o.lote ? `<div class="lbl-s mt mb">Lote de producto terminado</div><span class="code">${o.lote}</span>` : ''}</div></div>`;
    },
    // Cierre de orden con control de calidad: lote liberado o en cuarentena
    cerrarOP(o) {
      const U = SIGA.ui, r = receta(o), c = SIGA.prod.costeo(o), qc = r ? r.qc : [['Inspección visual y rotulado', 'Conforme', 'Producto terminado', 'mayor']];
      const pre = (r ? r.cod.slice(4, 7) : 'GEN'), lote = 'LT-' + pre + '-' + SIGA.ctx.hoyISO.slice(2).replace(/-/g, ''), venc = addD(SIGA.ctx.hoy, r ? r.vida : 30);
      U.bigForm({
        title: 'Control de calidad y cierre · ' + o.op + ' · ' + o.prod, icon: 'fa-clipboard-check',
        sections: [{ title: 'Puntos de control ' + (r ? '· receta ' + r.cod + ' ' + r.ver : ''), cols: 2, fields: qc.map((q, i) => ({ k: 'q' + i, label: `${q[0]} · ${q[1]} (${q[3]})`, type: 'select', options: ['Conforme', 'No conforme'], span: 1 })) },
          { title: 'Lote de producto terminado', cols: 3, fields: [{ k: 'lote', label: 'Lote asignado', value: lote, ro: true, span: 1 }, { k: 'venc', label: 'Vencimiento', value: venc, ro: true, span: 1 }, { k: 'real', label: 'Cantidad obtenida (' + o.um + ')', type: 'number', value: Math.round(c.util), span: 1 }, { k: 'obs', label: 'Observaciones del control', value: '', span: 3 }] }],
        status: (rows, v) => { const nc = qc.filter((q, i) => v['q' + i] === 'No conforme'); return nc.length ? nota('warn', 'fa-lock', `<b>${nc.length} control(es) no conforme(s)</b> (${nc.map(q => q[0]).join(', ')}): el lote ingresa al almacén <b>en cuarentena</b> y no podrá venderse hasta su liberación.`) : nota('teal', 'fa-circle-check', `Todos los controles conformes: el lote <b>${lote}</b> se libera para la venta · costo unitario real S/ ${(c.tot / Math.max(1, num(v.real))).toFixed(2)} por ${o.um}.`); },
        submitLabel: 'Cerrar orden e ingresar lote',
        onSubmit: v => {
          const real = Math.round(num(v.real)); if (real <= 0) { U.toast('Indique la cantidad obtenida', 'err'); return; }
          const nc = qc.filter((q, i) => v['q' + i] === 'No conforme'), cu = c.tot / real;
          o.estado = 'Cerrada'; o.avance = 100; o.lote = lote; o.qc = qc.map((q, i) => [q[0], v['q' + i]]);
          SIGA.alm && SIGA.alm.ingreso([{ cod: 'PT-' + o.op, desc: o.prod + ' · lote ' + lote, um: o.um.toUpperCase(), cant: real, pu: cu }], 'NIPT ' + o.op.slice(3), '', o.unidad);
          const a = SIGA.asiento('Ingreso de producto terminado · ' + o.op + ' · ' + o.prod, [['1302', c.tot, 0], ['1301', 0, c.tot]], 'Centro de producción');
          const mp = o.rmp || (r ? P.specs && Object.keys(P.specs).map(k => r.ing.some(g => new RegExp(k.split(' ')[0], 'i').test(g[1])) ? (P.recepciones.find(x => x.mp === k && /^Aprobado/.test(x.estado)) || {}).id : null).filter(Boolean) : []);
          P.lotesPT.unshift({ lote, prod: o.prod, venta: r ? r.venta : '', op: o.op, f: SIGA.ctx.hoy, venc, cant: real, um: o.um, mp, qc: nc.length ? 'No conforme' : 'Conforme', estado: nc.length ? 'En cuarentena' : 'Liberado', previo: 0, obs: v.obs, nuevo: true });
          SIGA.log('Centros de producción', 'Cierre de orden con control de calidad', o.op, 'Terminada', lote + ' · ' + (nc.length ? 'en cuarentena' : 'liberado') + ' · CU S/ ' + cu.toFixed(2));
          U.closeModal(); SIGA.refresh(); U.toast(`${o.op} cerrada · lote ${lote} ${nc.length ? 'en cuarentena' : 'liberado'} · ${INT(real)} ${o.um} a S/ ${cu.toFixed(2)} · asiento ${a || ''}`);
        }
      });
    },

    /* ---------- Recepción y calidad ---------- */
    recRec() {
      const U = SIGA.ui;
      return { mod: 'Centros de producción', tipo: 'Recepción de materia prima', office: 'Aseguramiento de la calidad · Centros de producción', key: r => r.id, title: r => r.id + ' · ' + r.mp + ' · ' + r.estado, estado: 'estado', cls: false, anuladoValor: 'Anulada',
        fields: r => [['Recepción', `<span class="code">${r.id}</span>`], ['Fecha', r.f], ['Materia prima', r.mp], ['Proveedor', U.esc(r.prov)], ['Origen / guía', U.esc(r.origen) + (r.loteProv ? ' · lote ' + r.loteProv : '')], ['Cantidad', INT(r.cant) + ' ' + r.um], ['Destino', r.destino], ['Dictamen', U.tag(r.estado, CLS[r.estado] || 't-gray')], ['Analista', r.analista || '—'], ['Observación', U.esc(r.obs) || '—', 1]],
        body: r => { const sp = P.specs[r.mp] || []; return sp.length ? `<div class="lbl-s mt mb">Resultados contra especificación</div>${dtbl([['Parámetro'], ['Especificación'], ['Resultado', 1], ['Severidad'], ['']], sp.map(s => { const v = r.res[s[0]], ok = evalP(s, v); return [s[0], specTxt(s), v == null || v === '' ? '—' : v + (typeof s[2] === 'string' ? '' : ' ' + s[1]), s[4], ok == null ? '<span class="mini">pendiente</span>' : ok ? U.tag('Conforme', 't-green') : U.tag('Fuera de especificación', 't-red')]; }))}` + (() => { const l = P.lotesPT.filter(x => (x.mp || []).includes(r.id)); return l.length ? `<div class="lbl-s mt mb">Lotes elaborados con esta materia prima</div>${l.map(x => `<span class="code">${x.lote}</span> ${U.esc(x.prod)}`).join('<br>')}` : ''; })() : ''; },
        extra: r => r.estado === 'Pendiente de análisis' ? [{ icon: 'fa-flask-vial', label: 'Registrar análisis', fn: () => M.analisis(r) }] : [],
        anular: true, anularLabel: 'Anular recepción', canAnular: r => r.estado === 'Pendiente de análisis',
        print: r => ({ tipo: 'Certificado de análisis de materia prima', num: r.id, body: M.recRec().body(r), firmas: [['Analista', r.analista || SIGA.ctx.user.nombre], ['Jefe de planta', 'Ing. A. Valdivia'], ['Aseguramiento de la calidad', 'Comité HACCP']] }) };
    },
    paintCal(host) {
      const U = SIGA.ui, ag = P.recepciones.filter(r => /\/08\/2026$/.test(r.f)), an = ag.filter(r => r.estado !== 'Pendiente de análisis');
      const rech = an.filter(r => r.estado === 'Rechazado');
      host.innerHTML = `<div class="grid cols-4 mb">${[['Recepciones · agosto', ag.length, 'fa-truck-ramp-box'], ['Aprobadas', an.filter(r => r.estado === 'Aprobado').length + ' · ' + an.filter(r => r.estado === 'Aprobado con observación').length + ' con observación', 'fa-circle-check'], ['Rechazadas', rech.length + ' · ' + INT(rech.reduce((s, r) => s + r.cant, 0)) + ' kg/L', 'fa-ban'], ['Por analizar', ag.filter(r => r.estado === 'Pendiente de análisis').length, 'fa-flask-vial']].map(x => `<div class="mini-card"><div class="lab"><i class="fa-solid ${x[2]}"></i> ${x[0]}</div><div class="v">${x[1]}</div></div>`).join('')}</div>
        <div class="card mb"><h3><span class="dot"></span>Recepción de materia prima <span class="grow">ninguna materia prima pasa a producción sin dictamen de calidad</span></h3><div id="cal-g"></div></div>
        <div class="card"><h3><span class="dot"></span>Especificaciones de materia prima <span class="grow">parámetros críticos rechazan · mayores se aceptan con observación</span></h3>
          ${Object.entries(P.specs).map(([k, sp]) => `<div class="lbl-s mt mb">${k}</div>${dtbl([['Parámetro'], ['Especificación'], ['Severidad']], sp.map(s => [s[0], specTxt(s), U.tag(s[4], s[4] === 'crítico' ? 't-red' : s[4] === 'mayor' ? 't-amber' : 't-gray')]))}`).join('')}</div>`;
      host.querySelector('#cal-g').innerHTML = U.grid({ id: 'cal-g', title: 'recepciones de materia prima', export: 'recepciones_materia_prima', rows: P.recepciones, record: this.recRec(), pageSize: 10, filter: { label: 'Dictamen', get: r => r.estado },
        cols: [{ k: 'id', label: 'Recepción', render: r => `<span class="code">${r.id}</span>` }, { k: 'f', label: 'Fecha', sv: r => sv(r.f) }, { k: 'mp', label: 'Materia prima', render: r => `<b>${U.esc(r.mp)}</b><div class="mini">${U.esc(r.origen)}</div>` }, { k: 'prov', label: 'Proveedor', cls: 'mini' },
          { k: 'cant', label: 'Cantidad', r: true, render: r => INT(r.cant) + ' ' + r.um }, { k: 'destino', label: 'Destino', cls: 'mini' },
          { k: 'fx', label: 'Fuera de especificación', nosort: true, render: r => { if (r.estado === 'Pendiente de análisis') return '<span class="mini">—</span>'; const f = dictamen(r.mp, r.res)[1]; return f.length ? f.map(s => U.tag(s[0], s[4] === 'crítico' ? 't-red' : 't-amber')).join(' ') : U.tag('Ninguno', 't-green'); } },
          { k: 'estado', label: 'Dictamen', render: r => U.tag(r.estado, CLS[r.estado] || 't-gray') }],
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-flask-vial', title: 'Registrar análisis', show: r => r.estado === 'Pendiente de análisis', fn: r => this.analisis(r) }, { icon: 'fa-print', title: 'Certificado de análisis', show: r => r.estado !== 'Pendiente de análisis', fn: r => SIGA.ui.rec(this.recRec()).imprimir(r) }],
        tools: [{ icon: 'fa-plus', label: 'Nueva recepción', primary: true, fn: () => this.nuevaRecepcion() }] });
    },
    nuevaRecepcion() {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-truck-ramp-box"></i> Recepción de materia prima', [
        { k: 'mp', label: 'Materia prima', type: 'select', options: Object.keys(P.specs), span: 1 }, { k: 'cant', label: 'Cantidad', type: 'number', value: 200, span: 1 },
        { k: 'um', label: 'Unidad', type: 'select', options: ['L', 'kg'], span: 1 }, { k: 'dest', label: 'Destino', type: 'select', options: ['Planta de lácteos', 'Planta de café y cacao'], span: 1 },
        { k: 'prov', label: 'Proveedor', type: 'select', options: ['Establo lechero UNAS', 'Asociación de Cafetaleros de Tulumayo', 'Cooperativa Agraria del Alto Huallaga', 'Agroindustrias del Huallaga SAC'] }, { k: 'guia', label: 'Guía / lote del proveedor', value: '', span: 1 }
      ], v => {
        if (num(v.cant) <= 0) { U.toast('Indique la cantidad', 'err'); return; }
        const id = recibir({ mp: v.mp, prov: v.prov, cant: num(v.cant), um: v.um, destino: v.dest, origen: v.guia ? 'Guía ' + v.guia : 'Ingreso en balanza' });
        U.closeModal(); SIGA.refresh(); U.toast(`${id} registrada · pendiente de análisis de calidad`);
      }, 'Registrar recepción');
    },
    analisis(r) {
      const U = SIGA.ui, sp = P.specs[r.mp] || [];
      const def = s => r.res[s[0]] != null ? r.res[s[0]] : typeof s[2] === 'string' ? s[2] : s[2] != null && s[3] != null ? +((s[2] + s[3]) / 2).toFixed(3) : s[2] != null ? +(s[2] * 1.05).toFixed(2) : +(s[3] * (s[3] < 0 ? 1.2 : 0.8)).toFixed(2);
      U.bigForm({
        title: 'Análisis de calidad · ' + r.id + ' · ' + r.mp, icon: 'fa-flask-vial',
        sections: [{ title: INT(r.cant) + ' ' + r.um + ' · ' + r.prov + ' · ' + r.origen, cols: 3, fields: [...sp.map((s, i) => typeof s[2] === 'string' ? { k: 'p' + i, label: s[0] + ' (' + s[4] + ')', type: 'select', options: [s[2], /Negativ/.test(s[2]) ? s[2].replace('Negativ', 'Positiv') : 'No conforme'], value: def(s), span: 1 } : { k: 'p' + i, label: `${s[0]} · ${specTxt(s)} (${s[4]})`, type: 'number', value: def(s), span: 1 }), { k: 'obs', label: 'Observación', value: '', span: 3 }] }],
        status: (rows, v) => { const res = {}; sp.forEach((s, i) => { res[s[0]] = typeof s[2] === 'string' ? v['p' + i] : num(v['p' + i]); }); const [d, f] = dictamen(r.mp, res); return nota(d === 'Rechazado' ? 'warn' : d === 'Aprobado' ? 'teal' : 'amber', d === 'Rechazado' ? 'fa-ban' : 'fa-circle-check', `Dictamen automático: <b>${d}</b>` + (f.length ? ' · fuera de especificación: ' + f.map(s => s[0] + ' (' + s[4] + ')').join(', ') : ' · todos los parámetros conformes') + (d === 'Rechazado' ? '. La materia prima no ingresa a producción: se devuelve al proveedor o se descarta.' : '')); },
        submitLabel: 'Emitir dictamen',
        onSubmit: v => {
          const res = {}; sp.forEach((s, i) => { res[s[0]] = typeof s[2] === 'string' ? v['p' + i] : num(v['p' + i]); });
          const [d, f] = dictamen(r.mp, res), antes = r.estado;
          Object.assign(r, { res, estado: d, analista: SIGA.ctx.user.nombre, obs: v.obs || (f.length ? 'Fuera de especificación: ' + f.map(s => s[0]).join(', ') : ''), destino: d === 'Rechazado' ? (/Leche/.test(r.mp) ? 'Descarte' : 'Devolución al proveedor') : r.destino });
          SIGA.log('Centros de producción', 'Dictamen de calidad', r.id, antes, d + (f.length ? ' · ' + f.map(s => s[0]).join(', ') : ''));
          U.closeModal(); SIGA.refresh(); U.toast(`${r.id}: ${d}`, d === 'Rechazado' ? 'err' : 'ok');
        }
      });
    },

    /* ---------- Lotes y trazabilidad ---------- */
    lotRec() {
      const U = SIGA.ui;
      return { mod: 'Centros de producción', tipo: 'Lote de producto terminado', office: 'Aseguramiento de la calidad · Centros de producción', key: l => l.lote, title: l => 'Lote ' + l.lote + ' · ' + l.prod, estado: 'estado', cls: false, anuladoValor: 'Anulado',
        view: l => M.traza(l),
        fields: l => { const D = distribucion(); return [['Lote', `<span class="code">${l.lote}</span>`], ['Producto', l.prod], ['Orden de producción', l.op], ['Fecha de producción', l.f], ['Vencimiento', l.venc + ' (' + (-dd(l.venc)) + ' días)'], ['Cantidad producida', INT(l.cant) + ' ' + l.um], ['Distribuido', INT(l.previo + (D.asig[l.lote] || 0)) + ' ' + l.um], ['Disponible', INT(dispDe(l, D)) + ' ' + l.um], ['Control de calidad', l.qc], ['Estado', estLote(l)]]; },
        edit: [{ k: 'venc', label: 'Vencimiento' }], canEdit: l => l.estado === 'En cuarentena',
        extra: l => [{ icon: 'fa-diagram-project', label: 'Trazabilidad', fn: () => M.traza(l) }, ...(l.estado === 'En cuarentena' ? [{ icon: 'fa-lock-open', label: 'Liberar lote', fn: () => M.liberar(l) }] : []), { icon: 'fa-qrcode', label: 'Etiquetas con QR', fn: () => M.etiquetas(l) }, ...(l.estado !== 'Retirado del mercado' ? [{ icon: 'fa-rotate-left', label: 'Retiro del mercado', fn: () => M.recall(l), danger: true }] : [])],
        print: l => ({ tipo: 'Ficha de trazabilidad de lote', num: l.lote, body: M.trazaHtml(l) }) };
    },
    paintLot(host) {
      const U = SIGA.ui, D = distribucion();
      host.innerHTML = `${nota('info', 'fa-diagram-project', 'Cada lote vincula la <b>materia prima analizada</b> (y, en lácteos, el tanque del establo y las vacas en ordeño), la orden de producción con sus controles y los <b>comprobantes de venta</b> a los que se despachó. Ante un reclamo, el retiro del mercado identifica en segundos a quién notificar.')}
        <div class="card"><h3><span class="dot"></span>Lotes de producto terminado <span class="grow">liberación, vencimiento, distribución y retiro</span></h3><div id="lot-g"></div></div>`;
      host.querySelector('#lot-g').innerHTML = U.grid({ id: 'lot-g', title: 'lotes de producto terminado', export: 'lotes_producto_terminado', rows: P.lotesPT, record: this.lotRec(), pageSize: 10, filter: { label: 'Estado', get: l => estLote(l) },
        cols: [{ k: 'lote', label: 'Lote', render: l => `<span class="code">${l.lote}</span>${l.nuevo ? ' ' + U.tag('nuevo', 't-green') : ''}` }, { k: 'prod', label: 'Producto', render: l => `<b>${U.esc(l.prod)}</b><div class="mini">${l.op}</div>` }, { k: 'f', label: 'Producción', sv: l => sv(l.f) },
          { k: 'venc', label: 'Vence', sv: l => sv(l.venc), render: l => { const r = -dd(l.venc); return l.venc + (r < 0 ? ' ' + U.tag('vencido', 't-red') : r <= 5 ? ' ' + U.tag(r + ' d', 't-amber') : ''); } },
          { k: 'cant', label: 'Producido', r: true, render: l => INT(l.cant) }, { k: 'dist', label: 'Distribuido', r: true, sv: l => l.previo + (D.asig[l.lote] || 0), render: l => INT(l.previo + (D.asig[l.lote] || 0)) }, { k: 'disp', label: 'Disponible', r: true, sv: l => dispDe(l, D), render: l => `<b>${INT(dispDe(l, D))}</b> <span class="mini">${l.um}</span>` },
          { k: 'cli', label: 'Clientes', r: true, sv: l => (D.out[l.lote] || []).length, render: l => (D.out[l.lote] || []).length }, { k: 'mp', label: 'Materia prima', cls: 'mini', render: l => (l.mp || []).join(' · ') || '—' },
          { k: 'estado', label: 'Estado', render: l => { const s = estLote(l); return U.tag(s, s === 'Liberado' ? 't-green' : s === 'En cuarentena' ? 't-amber' : 't-red'); } }],
        rowCls: l => (l.nuevo ? 'row-new' : '') + (l.estado === 'Retirado del mercado' ? ' row-void' : ''),
        actions: [{ icon: 'fa-diagram-project', title: 'Trazabilidad', fn: l => this.traza(l) }, { icon: 'fa-lock-open', title: 'Liberar', show: l => l.estado === 'En cuarentena', fn: l => this.liberar(l) }],
        tools: [{ icon: 'fa-stopwatch', label: 'Simulacro de retiro', primary: true, fn: () => { const l = P.lotesPT.filter(x => x.estado === 'Liberado')[0]; SIGA.log('Centros de producción', 'Simulacro de trazabilidad', l.lote); this.traza(l, true); } }] });
    },
    trazaHtml(l) {
      const U = SIGA.ui, D = distribucion(), dist = D.out[l.lote] || [], r = P.recetas.find(x => x.venta === l.venta), op = P.ordenes.find(o => o.op === l.op);
      const back = [];
      (l.mp || []).forEach(id => { const x = P.recepciones.find(y => y.id === id); if (!x) return; back.push({ t: `${x.id} · ${U.esc(x.mp)} · ${INT(x.cant)} ${x.um}`, sub: `${U.esc(x.prov)} · ${U.esc(x.origen)}${x.loteProv ? ' · lote ' + x.loteProv : ''} · dictamen <b>${x.estado}</b>`, when: x.f, st: /^Aprobado/.test(x.estado) ? 'done' : 'bad' });
        if (/Leche/.test(x.mp) && SIGA.data.pecuario) { const V = SIGA.data.pecuario.especies.vacuno; back.push({ t: 'Establo lechero · control lechero y sanidad del hato', sub: `${V.anim.filter(a => a.cat === 'Vaca en producción').length} vacas en ordeño · leche de vacas en período de retiro excluida del tanque · ${SIGA.data.pecuario.predio.codigo}`, when: x.f, st: 'done' }); } });
      if (op) back.push({ t: `Orden ${op.op} · ${U.esc(op.prod)}`, sub: `${op.inicio} – ${op.fin} · ${op.unidad}${r ? ' · receta ' + r.cod + ' ' + r.ver : ''}`, when: op.fin, st: 'done' });
      else back.push({ t: `Orden ${l.op} (archivo de julio)`, sub: 'Registro histórico migrado', when: l.f, st: 'done' });
      back.push({ t: 'Control de calidad del producto terminado', sub: (r ? r.qc.map(q => q[0]).join(' · ') : 'Inspección') + ' · ' + l.qc, when: l.f, st: l.qc === 'Conforme' ? 'done' : 'bad' });
      const fwd = dist.map(d => [d.fecha, `<span class="code">${d.doc}</span>`, U.esc(d.cli), d.docCli || '—', INT(d.cant)]);
      if (l.previo) fwd.unshift([l.f + ' →', '<span class="mini">boletas consolidadas</span>', 'Tienda universitaria y ventas al por menor', '—', INT(l.previo)]);
      return `<div class="split eq"><div><div class="lbl-s mb"><i class="fa-solid fa-arrow-left"></i> Hacia atrás · origen</div>${U.timeline(back)}</div>
        <div><div class="lbl-s mb"><i class="fa-solid fa-arrow-right"></i> Hacia adelante · destino (${dist.length} comprobantes)</div>${dtbl([['Fecha'], ['Comprobante'], ['Cliente'], ['Documento'], ['Cant.', 1]], fwd)}
          <div class="ef-row mt"><span>Disponible en almacén</span><b>${INT(dispDe(l, D))} ${l.um}</b></div>${l.recall ? nota('warn', 'fa-rotate-left', `<b>Retirado del mercado el ${l.recall.f}</b> · ${U.esc(l.recall.motivo)} · ${l.recall.clientes} cliente(s) notificados`) : ''}</div></div>`;
    },
    traza(l, simulacro) {
      const U = SIGA.ui, t0 = performance.now();
      const b = U.modal(`<i class="fa-solid fa-diagram-project"></i> Trazabilidad · lote ${l.lote} · ${U.esc(l.prod)}`, (simulacro ? nota('teal', 'fa-stopwatch', `<b>Simulacro de retiro:</b> origen y destino del lote reconstruidos en ${Math.max(1, Math.round(performance.now() - t0))} ms. Con registros en papel la misma consulta tomaba 1 a 2 días.`) : '') + this.trazaHtml(l),
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="tz-et"><i class="fa-solid fa-qrcode"></i> Etiquetas</button><button class="btn ghost" id="tz-pr"><i class="fa-solid fa-print"></i> Imprimir</button>${l.estado === 'En cuarentena' ? '<button class="btn" id="tz-lb"><i class="fa-solid fa-lock-open"></i> Liberar</button>' : ''}${l.estado !== 'Retirado del mercado' ? '<button class="btn danger" id="tz-rc"><i class="fa-solid fa-rotate-left"></i> Retiro del mercado</button>' : ''}`, 'wide');
      b.querySelector('#tz-pr').addEventListener('click', () => U.rec(this.lotRec()).imprimir(l));
      b.querySelector('#tz-et').addEventListener('click', () => this.etiquetas(l));
      b.querySelector('#tz-lb')?.addEventListener('click', () => this.liberar(l));
      b.querySelector('#tz-rc')?.addEventListener('click', () => this.recall(l));
    },
    liberar(l) {
      SIGA.ui.confirm(`¿Liberar el lote <b>${l.lote}</b> para la venta? Confirme que las no conformidades fueron corregidas o evaluadas por Aseguramiento de la calidad.`, () => {
        l.estado = 'Liberado'; l.qc = 'Conforme tras reevaluación';
        SIGA.log('Centros de producción', 'Liberación de lote', l.lote, 'En cuarentena', 'Liberado');
        SIGA.refresh(); SIGA.ui.toast('Lote ' + l.lote + ' liberado para la venta');
      }, 'Liberar lote', '');
    },
    recall(l) {
      const U = SIGA.ui, D = distribucion(), dist = D.out[l.lote] || [], clis = [...new Set(dist.map(d => d.cli))];
      if (SIGA.ctx.user.readOnly) { U.toast('El rol OCI tiene acceso de solo consulta', 'err'); return; }
      U.bigForm({
        title: 'Retiro del mercado · lote ' + l.lote, icon: 'fa-rotate-left',
        intro: nota('warn', 'fa-triangle-exclamation', `Se bloqueará el stock disponible (${INT(dispDe(l, D))} ${l.um}) y se notificará a <b>${clis.length} cliente(s)</b> que recibieron ${INT(dist.reduce((s, d) => s + d.cant, 0))} ${l.um} del lote.`),
        sections: [{ cols: 2, fields: [{ k: 'mot', label: 'Motivo', type: 'select', options: ['Resultado microbiológico fuera de especificación', 'Reclamo de cliente', 'Materia prima observada', 'Error de rotulado o alérgenos', 'Envase defectuoso'], span: 1 }, { k: 'cls', label: 'Clasificación', type: 'select', options: ['Clase I · riesgo grave para la salud', 'Clase II · riesgo moderado', 'Clase III · sin riesgo para la salud'], span: 1 }, { k: 'acc', label: 'Acción con el producto recuperado', type: 'select', options: ['Destrucción con acta', 'Reproceso', 'Devolución y reemplazo'], span: 1 }, { k: 'ref', label: 'Documento de sustento', value: 'Informe de calidad N.º ' + (40 + P.lotesPT.filter(x => x.recall).length) + '-2026', span: 1 }] }],
        status: () => dtbl([['Cliente'], ['Comprobantes'], ['Cantidad', 1]], clis.map(c => [U.esc(c), dist.filter(d => d.cli === c).map(d => d.doc).join(' · '), INT(dist.filter(d => d.cli === c).reduce((s, d) => s + d.cant, 0))])),
        submitLabel: 'Ejecutar retiro',
        onSubmit: v => {
          const disp = dispDe(l, D), antes = l.estado;
          l.recall = { f: SIGA.ctx.hoy, motivo: v.mot, clase: v.cls, accion: v.acc, ref: v.ref, clientes: clis.length }; l.retirado = disp; l.estado = 'Retirado del mercado';
          const it = SIGA.data.almacen.items.find(i => i.cod === 'PT-' + l.op); if (it) it.stock = Math.max(0, it.stock - disp);
          SIGA.log('Centros de producción', 'Retiro del mercado', l.lote, antes, v.mot + ' · ' + clis.length + ' clientes notificados · ' + v.ref);
          U.closeModal(); SIGA.refresh();
          U.preview('Informe de retiro del mercado · ' + l.lote, U.doc({ office: 'Aseguramiento de la calidad · Centros de producción', tipo: 'Informe de retiro del mercado', num: l.lote, pairs: [['Producto', l.prod], ['Producción · vencimiento', l.f + ' · ' + l.venc], ['Motivo', v.mot], ['Clasificación', v.cls], ['Acción', v.acc], ['Sustento', v.ref], ['Cantidad distribuida', INT(dist.reduce((s, d) => s + d.cant, 0)) + ' ' + l.um], ['Bloqueado en almacén', INT(disp) + ' ' + l.um]],
            body: dtbl([['Cliente'], ['Comprobante'], ['Fecha'], ['Cantidad', 1], ['Contacto']], dist.map(d => { const c = SIGA.data.ventas.clientes.find(x => x.nom === d.cli); return [U.esc(d.cli), d.doc, d.fecha, INT(d.cant), c ? c.correo : 'aviso público']; })) + '<p class="mini">Se notifica a DIGESA y a los clientes; el producto recuperado se registra con acta.</p>', firmas: [['Elaboró', SIGA.ctx.user.nombre], ['Jefe de planta', 'Ing. A. Valdivia'], ['Aprobó', 'Dirección General de Administración']] }), { file: 'retiro_' + l.lote });
          U.toast(`Lote ${l.lote} retirado del mercado · ${clis.length} cliente(s) por notificar`, 'err');
        }
      });
    },
    etiquetas(l) {
      const U = SIGA.ui;
      U.preview('Etiquetas del lote ' + l.lote, `<div class="doc" style="position:static"><div class="lbl-grid">${Array.from({ length: 6 }, () => `<div class="lbl-card"><b>${U.esc(l.prod)}</b><div class="mini">Lote ${l.lote} · elab. ${l.f} · vence ${l.venc}<br>UNAS · Centros de Producción · RUC 20161749126</div><div class="row-flex mt">${U.qr(l.lote + l.venc, 64)}${U.barcode(l.lote, 150, 40)}</div></div>`).join('')}</div></div>`, { file: 'etiquetas_' + l.lote });
    },

    /* ---------- Mantenimiento ---------- */
    eqRec() {
      const U = SIGA.ui;
      return { mod: 'Centros de producción', tipo: 'Ficha de equipo', office: 'Mantenimiento · Centros de producción', key: e => e.cod, title: e => e.cod + ' · ' + e.nom, estado: 'estado', cls: false, anuladoValor: 'Dado de baja',
        fields: e => { const p = prox(e); return [['Equipo', `<span class="code">${e.cod}</span> · ${U.esc(e.nom)}`], ['Unidad productiva', e.unidad], ['Código patrimonial', `<span class="code">${e.patr}</span>`], ['Marca · año', e.marca], ['Criticidad', e.crit], ['Horas de uso', INT(e.horas) + ' h'], ['Plan preventivo', 'cada ' + e.frec[1] + (e.frec[0] === 'h' ? ' horas de uso' : ' días')], ['Último mantenimiento', e.ult[0] + ' · ' + INT(e.ult[1]) + ' h'], ['Próximo', p.txt + (p.venc ? ' · VENCIDO' : '')], ['Fallas en 12 meses', e.fallas], ['Horas de parada', e.parada + ' h · disponibilidad ' + dispEq(e).toFixed(1) + ' %'], ['Costo de mantenimiento 12 m', U.money(e.costo12)], ['Estado', e.estado]]; },
        body: e => { const os = P.ots.filter(o => o.eq === e.cod); return `<div class="lbl-s mt mb">Historial de órdenes de trabajo</div>${dtbl([['OT'], ['Fecha'], ['Tipo'], ['Descripción'], ['Costo', 1], ['Estado']], os.map(o => [o.ot, o.f, o.tipo, U.esc(o.desc), U.money(otCosto(o), ''), o.estado]))}`; },
        edit: [{ k: 'horas', label: 'Horómetro (h)', type: 'number' }],
        extra: e => [{ icon: 'fa-calendar-plus', label: 'Programar OT', fn: () => M.otForm(e) }, ...(e.estado === 'Operativo' ? [{ icon: 'fa-triangle-exclamation', label: 'Reportar falla', fn: () => M.falla(e) }] : [])],
        print: e => ({ tipo: 'Ficha técnica y de mantenimiento', num: e.cod }) };
    },
    otRec() {
      const U = SIGA.ui;
      return { mod: 'Centros de producción', tipo: 'Orden de trabajo de mantenimiento', office: 'Mantenimiento · Centros de producción', key: o => o.ot, title: o => o.ot + ' · ' + o.tipo + ' · ' + o.eq, estado: 'estado', cls: false, anuladoValor: 'Anulada',
        fields: o => { const e = P.equipos.find(x => x.cod === o.eq) || {}; return [['OT', o.ot], ['Fecha', o.f], ['Equipo', `<span class="code">${o.eq}</span> ${U.esc(e.nom || '')}`], ['Unidad', e.unidad || '—'], ['Tipo', o.tipo], ['Prioridad', o.prio], ['Trabajo', U.esc(o.desc), 1], ['Técnico / proveedor', o.tec], ['Horas de trabajo', o.horas], ['Repuestos', o.rep.length ? o.rep.map(r => `${r[1]} × ${U.esc(r[0])}`).join(' · ') : '—'], ['Costo', U.money(otCosto(o))], ['Estado', o.estado + (o.fCierre ? ' · ' + o.fCierre : '')]]; },
        edit: [{ k: 'f', label: 'Fecha programada' }, { k: 'tec', label: 'Técnico / proveedor' }], canEdit: o => o.estado === 'Programada',
        extra: o => [...(o.estado === 'Programada' ? [{ icon: 'fa-play', label: 'Iniciar trabajo', fn: () => M.iniciarOT(o) }] : []), ...(/Programada|En ejecución|Pendiente/.test(o.estado) ? [{ icon: 'fa-flag-checkered', label: 'Cerrar OT', fn: () => M.cerrarOT(o) }] : [])],
        anular: true, anularLabel: 'Anular OT', canAnular: o => o.estado === 'Programada',
        print: o => ({ tipo: 'Orden de trabajo de mantenimiento', num: o.ot, body: dtbl([['Repuesto / material'], ['Cant.', 1], ['Costo unit.', 1], ['Subtotal', 1]], o.rep.map(r => [U.esc(r[0]), r[1], U.money(r[2], ''), U.money(r[1] * r[2], '')]).concat(o.ext ? [['Servicio externo', '', '', U.money(o.ext, '')]] : [])), firmas: [['Solicitó', 'Jefe de la unidad'], ['Ejecutó', o.tec], ['Conformidad', 'Jefe de Centros de Producción']] }) };
    },
    paintMnt(host) {
      const U = SIGA.ui, E = P.equipos, venc = E.filter(e => prox(e).venc), ab = P.ots.filter(o => !/Cerrada|Anulada/.test(o.estado));
      const cal = E.map(e => [e, prox(e)]).filter(([e, p]) => p.venc || p.cerca || (p.u === 'd' && p.rest <= 30) || (p.u === 'h' && p.rest <= 120)).sort((a, b) => (a[1].u === 'h' ? a[1].rest / 8 : a[1].rest) - (b[1].u === 'h' ? b[1].rest / 8 : b[1].rest));
      host.innerHTML = `<div class="grid cols-4 mb">${[['Equipos registrados', E.length + ' · ' + E.filter(e => e.crit === 'Alta').length + ' críticos', 'fa-gears'], ['Operativos', E.filter(e => e.estado === 'Operativo').length + ' de ' + E.length, 'fa-circle-check'], ['Preventivos vencidos', venc.length, 'fa-calendar-xmark'], ['Costo 12 meses', U.money(E.reduce((s, e) => s + e.costo12, 0)), 'fa-coins']].map(x => `<div class="mini-card"><div class="lab"><i class="fa-solid ${x[2]}"></i> ${x[0]}</div><div class="v">${x[1]}</div></div>`).join('')}</div>
        <div class="split mb"><div class="card"><h3><span class="dot"></span>Equipos de producción <span class="grow">plan preventivo por horas de uso o calendario · vínculo con el inventario patrimonial</span></h3><div id="eq-g"></div></div>
          <div class="card"><h3><span class="dot"></span>Próximos mantenimientos</h3>${cal.map(([e, p]) => `<div class="ef-row"><span><span class="code">${e.cod}</span> ${U.esc(e.nom.split(' ').slice(0, 3).join(' '))}</span><b>${p.venc ? U.tag('vencido', 't-red') : ''} ${p.u === 'h' ? (p.rest > 0 ? 'faltan ' + INT(p.rest) + ' h' : INT(-p.rest) + ' h excedido') : p.txt}</b></div>`).join('') || '<div class="mini">Sin mantenimientos próximos</div>'}</div></div>
        <div class="card"><h3><span class="dot"></span>Órdenes de trabajo <span class="grow">${ab.length} abiertas · preventivas, correctivas y de calibración</span></h3><div id="ot-g"></div></div>`;
      host.querySelector('#eq-g').innerHTML = U.grid({ id: 'eq-g', title: 'equipos', export: 'equipos_mantenimiento', rows: E, record: this.eqRec(), pageSize: 8, filter: { label: 'Unidad', get: e => e.unidad },
        cols: [{ k: 'cod', label: 'Equipo', render: e => `<span class="code">${e.cod}</span> <b>${U.esc(e.nom)}</b><div class="mini">${U.esc(e.unidad)} · patr. ${e.patr}</div>` }, { k: 'crit', label: 'Criticidad', render: e => U.tag(e.crit, e.crit === 'Alta' ? 't-red' : e.crit === 'Media' ? 't-amber' : 't-gray') }, { k: 'horas', label: 'Horas', r: true, render: e => INT(e.horas) },
          { k: 'px', label: 'Próximo preventivo', sv: e => { const p = prox(e); return p.u === 'h' ? p.rest / 8 : p.rest; }, render: e => { const p = prox(e); return `${p.txt}<div class="mini" style="color:${p.venc ? 'var(--danger)' : p.cerca ? '#b7791f' : 'inherit'}">${p.u === 'h' ? (p.rest > 0 ? 'faltan ' + INT(p.rest) + ' h' : 'excedido ' + INT(-p.rest) + ' h') : p.rest >= 0 ? 'en ' + p.rest + ' días' : 'vencido hace ' + (-p.rest) + ' días'}</div>`; } },
          { k: 'disp', label: 'Disponib.', r: true, sv: dispEq, render: e => dispEq(e).toFixed(1) + ' %' }, { k: 'estado', label: 'Estado', render: e => U.tag(e.estado, e.estado === 'Operativo' ? 't-green' : e.estado === 'En mantenimiento' ? 't-amber' : 't-red') }],
        rowCls: e => e.estado !== 'Operativo' ? 'row-void' : '',
        actions: [{ icon: 'fa-calendar-plus', title: 'Programar OT', fn: e => this.otForm(e) }, { icon: 'fa-triangle-exclamation', title: 'Reportar falla', show: e => e.estado === 'Operativo', fn: e => this.falla(e) }] });
      host.querySelector('#ot-g').innerHTML = U.grid({ id: 'ot-g', title: 'órdenes de trabajo', export: 'ordenes_trabajo', rows: P.ots, record: this.otRec(), pageSize: 8, filter: { label: 'Estado', get: o => o.estado },
        cols: [{ k: 'ot', label: 'OT', render: o => `<span class="code">${o.ot}</span>` }, { k: 'f', label: 'Fecha', sv: o => sv(o.f) }, { k: 'eq', label: 'Equipo', render: o => `<span class="code">${o.eq}</span> <span class="mini">${U.esc((P.equipos.find(e => e.cod === o.eq) || {}).nom || '')}</span>` }, { k: 'tipo', label: 'Tipo', render: o => U.tag(o.tipo, o.tipo === 'Correctivo' ? 't-red' : 't-blue') },
          { k: 'desc', label: 'Trabajo', cls: 'mini' }, { k: 'tec', label: 'Técnico', cls: 'mini' }, { k: 'c', label: 'Costo', r: true, sv: otCosto, render: o => U.money(otCosto(o), '') }, { k: 'estado', label: 'Estado', render: o => U.tag(o.estado, o.estado === 'Cerrada' ? 't-green' : o.estado === 'En ejecución' ? 't-amber' : o.estado === 'Anulada' ? 't-gray' : 't-blue') }],
        rowCls: o => (o.nuevo ? 'row-new' : '') + (o.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-play', title: 'Iniciar', show: o => o.estado === 'Programada', fn: o => this.iniciarOT(o) }, { icon: 'fa-flag-checkered', title: 'Cerrar OT', show: o => /Programada|En ejecución|Pendiente/.test(o.estado), fn: o => this.cerrarOT(o) }],
        tools: [{ icon: 'fa-calendar-plus', label: 'Programar OT', primary: true, fn: () => this.otForm() }] });
    },
    otForm(e) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-calendar-plus"></i> Programar orden de trabajo', [
        { k: 'eq', label: 'Equipo', type: 'select', options: P.equipos.map(x => x.cod + ' · ' + x.nom), value: e ? e.cod + ' · ' + e.nom : undefined },
        { k: 'tipo', label: 'Tipo', type: 'select', options: ['Preventivo', 'Correctivo', 'Calibración', 'Predictivo (inspección)'], span: 1 }, { k: 'f', label: 'Fecha', type: 'date', value: '2026-08-25', span: 1 },
        { k: 'desc', label: 'Trabajo a realizar', type: 'textarea', value: e ? 'Mantenimiento preventivo según plan (' + e.frec[1] + (e.frec[0] === 'h' ? ' h' : ' días') + ')' : '' },
        { k: 'tec', label: 'Técnico / proveedor', type: 'select', options: ['Taller UNAS · J. Rengifo', 'Taller UNAS · M. Pinedo', 'Servicio técnico externo'], span: 1 }, { k: 'prio', label: 'Prioridad', type: 'select', options: ['Alta', 'Media', 'Baja'], span: 1 }
      ], v => {
        const ot = nextId(P.ots, 'ot', 'OT-2026-', 3);
        P.ots.unshift({ ot, eq: v.eq.split(' · ')[0], tipo: v.tipo, f: U.dmy(v.f), desc: v.desc, tec: v.tec, prio: v.prio, rep: [], horas: 0, estado: 'Programada', fCierre: '', ext: 0, nuevo: true });
        SIGA.log('Centros de producción', 'Orden de trabajo de mantenimiento', ot, '—', v.tipo + ' · ' + v.eq.split(' · ')[0]);
        U.closeModal(); SIGA.refresh(); U.toast(`${ot} programada para el ${U.dmy(v.f)}`);
      }, 'Programar');
    },
    falla(e) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-triangle-exclamation"></i> Reportar falla · ' + e.nom, [{ k: 'sint', label: 'Síntoma observado', type: 'textarea', value: '' }, { k: 'impacto', label: 'Impacto en la producción', type: 'select', options: ['Detiene la producción', 'Reduce la capacidad', 'Sin impacto inmediato'], span: 1 }, { k: 'prio', label: 'Prioridad', type: 'select', options: ['Alta', 'Media'], span: 1 }], v => {
        if (v.sint.trim().length < 5) { U.toast('Describa el síntoma', 'err'); return; }
        const ot = nextId(P.ots, 'ot', 'OT-2026-', 3), antes = e.estado;
        if (v.impacto === 'Detiene la producción') e.estado = 'Fuera de servicio';
        e.fallas++;
        P.ots.unshift({ ot, eq: e.cod, tipo: 'Correctivo', f: SIGA.ctx.hoy, desc: v.sint, tec: 'Taller UNAS · J. Rengifo', prio: v.prio, rep: [], horas: 0, estado: 'Pendiente', fCierre: '', ext: 0, nuevo: true });
        SIGA.log('Centros de producción', 'Reporte de falla de equipo', e.cod, antes, e.estado + ' · ' + ot);
        U.closeModal(); SIGA.refresh(); U.toast(`Falla registrada · ${ot} correctiva creada` + (e.estado === 'Fuera de servicio' ? ' · equipo fuera de servicio' : ''), 'err');
      }, 'Reportar');
    },
    iniciarOT(o) {
      const e = P.equipos.find(x => x.cod === o.eq);
      o.estado = 'En ejecución'; if (e && e.estado === 'Operativo') e.estado = 'En mantenimiento';
      SIGA.log('Centros de producción', 'Inicio de orden de trabajo', o.ot, 'Programada', 'En ejecución');
      SIGA.refresh(); SIGA.ui.toast(o.ot + ' en ejecución · ' + (e ? e.nom + ' en mantenimiento' : ''));
    },
    cerrarOT(o) {
      const U = SIGA.ui, e = P.equipos.find(x => x.cod === o.eq);
      U.bigForm({
        title: 'Cierre de ' + o.ot + ' · ' + (e ? e.nom : o.eq), icon: 'fa-flag-checkered',
        sections: [{ cols: 3, fields: [{ k: 'horas', label: 'Horas de trabajo', type: 'number', value: o.horas || 3, span: 1 }, { k: 'parada', label: 'Horas de parada del equipo', type: 'number', value: o.tipo === 'Correctivo' ? 8 : 2, span: 1 }, { k: 'ext', label: 'Servicio externo S/', type: 'number', value: o.ext || 0, span: 1 }, { k: 'horo', label: 'Horómetro al cierre', type: 'number', value: e ? e.horas : 0, span: 1 }, { k: 'obs', label: 'Trabajo realizado', value: o.desc, span: 2 }] }],
        items: { title: 'Repuestos y materiales', addLabel: 'Agregar repuesto', seed: { d: 'Repuesto', q: 1, c: 0 }, rows: o.rep.map(r => ({ d: r[0], q: r[1], c: r[2] })), columns: [{ k: 'd', label: 'Repuesto' }, { k: 'q', label: 'Cant.', type: 'num', r: true, w: '80px' }, { k: 'c', label: 'Costo unit.', type: 'num', r: true, w: '100px' }, { k: 's', label: 'Subtotal', calc: x => (+x.q || 0) * (+x.c || 0), w: '100px' }] },
        totals: (rows, v) => { const rep = rows.reduce((s, x) => s + (+x.q || 0) * (+x.c || 0), 0); return [{ label: 'Repuestos', val: U.money(rep) }, { label: 'Servicio externo', val: U.money(num(v.ext)) }, { label: 'Costo de la OT', val: U.money(rep + num(v.ext)), big: true }]; },
        submitLabel: 'Cerrar OT',
        onSubmit: (v, rows) => {
          o.rep = rows.filter(x => x.d).map(x => [x.d, +x.q || 0, +x.c || 0]); o.horas = num(v.horas); o.ext = num(v.ext); o.estado = 'Cerrada'; o.fCierre = SIGA.ctx.hoy; o.desc = v.obs || o.desc;
          const rep = o.rep.reduce((s, r) => s + r[1] * r[2], 0), tot = rep + o.ext;
          if (e) { e.estado = 'Operativo'; e.horas = Math.max(e.horas, num(v.horo)); e.parada += num(v.parada); e.costo12 += tot; if (o.tipo !== 'Correctivo' || e.frec[0] === 'h') e.ult = [SIGA.ctx.hoy, e.horas]; }
          const a = tot > 0 ? SIGA.asiento('Mantenimiento ' + o.ot + ' · ' + (e ? e.nom : o.eq), [...(rep ? [['5301', rep, 0]] : []), ...(o.ext ? [['5302', o.ext, 0]] : []), ['2103', 0, tot]], 'Centros de producción') : null;
          SIGA.log('Centros de producción', 'Cierre de orden de trabajo', o.ot, 'En ejecución', 'Cerrada · ' + U.money(tot));
          U.closeModal(); SIGA.refresh(); U.toast(`${o.ot} cerrada · ${e ? e.nom + ' operativo' : ''} · costo ${U.money(tot)}` + (a ? ' · asiento ' + a : ''));
        }
      });
    }
  };
  const CLS = { Aprobado: 't-green', 'Aprobado con observación': 't-amber', Rechazado: 't-red', 'Pendiente de análisis': 't-blue', Anulada: 't-gray' };
  SIGA.mrp = M;
})();
