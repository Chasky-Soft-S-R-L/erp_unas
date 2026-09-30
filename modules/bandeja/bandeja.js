/* ============================================================
   Mi bandeja · todo lo que espera una decisión, según el rol en sesión
   (flujo de aprobación electrónica · informe 4.9.3)
   Cada tarea se resuelve desde aquí o abre el registro en su módulo.
   ============================================================ */
(function () {
  const U = () => SIGA.ui;
  // Catálogo de tareas pendientes: se recalcula en cada consulta a partir de los registros vivos
  function tareas() {
    const D = SIGA.data, u = U(), out = [];
    const T = (tipo, icon, perm, ref, desc, monto, fecha, mod, ver, accion, prio) => out.push({ tipo, icon, perm, ref, desc, monto, fecha, mod, ver, accion, prio: prio || 'Normal' });
    D.presupuesto.certificaciones.filter(c => c.fase === 'Pendiente de aprobación').forEach(c => T('Aprobar certificación', 'fa-stamp', 'cert.aprobar', 'CCP ' + c.num, c.just || SIGA.ppto.marco(c.marco).desc, c.monto, c.fecha, 'presupuesto',
      () => SIGA.modules.presupuesto.verCert(c), { label: 'Aprobar', fn: () => SIGA.modules.presupuesto.aprobar(c) }, c.monto > 30000 ? 'Alta' : 'Normal'));
    D.abastecimiento.requerimientos.filter(r => r.estado === 'En evaluación').forEach(r => T('Aprobar requerimiento', 'fa-clipboard-check', r.monto > 30000 ? 'req.aprobar.alto' : 'req.aprobar', r.num, r.desc, r.monto, r.fecha, 'abastecimiento',
      () => u.rec(SIGA.recs.req).ver(r), { label: 'Aprobar', fn: () => SIGA.modules.abastecimiento.aprobarReq(r) }, r.monto > 30000 ? 'Alta' : 'Normal'));
    D.tesoreria.cp.filter(c => c.estado === 'Girado').forEach(c => T('Confirmar pago', 'fa-money-check-dollar', 'cp.pagar', c.doc, c.benef + ' · ' + c.concepto, c.neto, c.fecha, 'tesoreria',
      () => u.rec(SIGA.recs.cp).ver(c), { label: 'Pagar', fn: () => SIGA.modules.tesoreria.pagar(c) }, 'Alta'));
    D.caja.depositos.filter(d => d.estado !== 'Confirmado').forEach(d => T('Confirmar depósito RDR', 'fa-building-columns', 'dep.confirmar', d.num, 'Abono en ' + d.cta + ' · amplía la fuente 09', d.monto, d.fecha, 'caja',
      () => SIGA.go('caja', { cj: 'dep' }), { label: 'Confirmar', fn: () => SIGA.modules.caja.confirmar(d) }));
    D.almacen.bajas.filter(b => b[6] === 'En trámite').forEach(b => T('Aprobar baja de bienes', 'fa-trash-can', 'baja.aprobar', b[0], b[2] + ' · ' + b[3], b[5], b[1], 'almacen',
      () => SIGA.go('almacen', { l: 'otr' }), null));
    (D.patrimonio ? D.patrimonio.bajas.filter(b => b.estado === 'En trámite') : []).forEach(b => T('Aprobar baja patrimonial', 'fa-building-circle-xmark', 'baja.aprobar', b.num, b.bien + ' · ' + b.causal, b.valor, b.fecha, 'patrimonio',
      () => SIGA.go('patrimonio', { pa: 'baj' }), SIGA.patrimonio ? { label: 'Aprobar', fn: () => SIGA.patrimonio.aprobarBaja(b) } : null, 'Normal'));
    D.planilla.licencias.filter(l => l[3] === 'Solicitada').forEach(l => T('Aprobar licencia', 'fa-file-medical', 'lic.aprobar', l[0].split(' · ')[0], l[1] + ' · ' + l[2], 0, SIGA.ctx.hoy, 'planilla',
      () => SIGA.go('planilla', { pl: 'vac' }), { label: 'Aprobar', fn: () => SIGA.modules.planilla.aprobarLic(l) }));
    D.ctaper.obligaciones.filter(o => o.estado === 'Vencida').forEach(o => T('Obligación vencida', 'fa-file-invoice', 'cp.pagar', o.doc, o.prov + ' · vencida hace ' + (-o.dias) + ' días', o.imp, o.venc, 'ctaper',
      () => u.rec(SIGA.recs.obligacion).ver(o), { label: 'Girar', fn: () => { SIGA.go('tesoreria'); setTimeout(() => SIGA.modules.tesoreria.nuevoCP(o), 80); } }, 'Alta'));
    D.abastecimiento.encargos.filter(e => e.estado === 'Vencido').forEach(e => T('Rendición vencida', 'fa-hand-holding-dollar', 'cp.pagar', e.num, e.resp + ' · ' + e.act, e.monto - e.rendido, e.vence, 'abastecimiento',
      () => SIGA.go('abastecimiento', { a: 'enc' }), { label: 'Rendir', fn: () => SIGA.modules.abastecimiento.rendir(e) }, 'Alta'));
    D.ventas.comprobantes.filter(c => c.sunat === 'Pendiente' || c.sunat === 'En cola').forEach(c => T('Enviar a SUNAT', 'fa-paper-plane', null, c.doc, c.cli, c.total, c.fecha, 'ventas',
      () => SIGA.modules.ventas.ver(c), { label: 'Enviar', fn: () => SIGA.modules.ventas.enviar(c) }));
    D.produccion.ordenes.filter(o => o.estado === 'Terminada').forEach(o => T('Cerrar orden de producción', 'fa-box-archive', null, o.op, o.prod + ' · ' + o.unidad, SIGA.prod.costeo(o).tot, o.fin, 'produccion',
      () => SIGA.modules.produccion.verOP(o), { label: 'Cerrar', fn: () => SIGA.modules.produccion.cerrarOP(o) }));
    (D.produccion.recepciones || []).filter(r => r.estado === 'Pendiente de análisis').forEach(r => T('Analizar materia prima', 'fa-flask-vial', null, r.id, r.mp + ' · ' + r.cant + ' ' + r.um + ' · ' + r.prov, 0, r.f, 'produccion',
      () => SIGA.go('produccion', { cp: 'cal' }), SIGA.mrp ? { label: 'Analizar', fn: () => SIGA.mrp.analisis(r) } : null, 'Alta'));
    (D.produccion.lotesPT || []).filter(l => l.estado === 'En cuarentena').forEach(l => T('Liberar lote en cuarentena', 'fa-lock', null, l.lote, l.prod + ' · ' + l.cant + ' ' + l.um, 0, l.f, 'produccion',
      () => SIGA.mrp.traza(l), { label: 'Liberar', fn: () => SIGA.mrp.liberar(l) }));
    (D.produccion.ots || []).filter(o => o.estado === 'Pendiente').forEach(o => T('Atender falla de equipo', 'fa-screwdriver-wrench', null, o.ot, ((D.produccion.equipos || []).find(e => e.cod === o.eq) || {}).nom + ' · ' + o.desc, 0, o.f, 'produccion',
      () => SIGA.go('produccion', { cp: 'mnt' }), { label: 'Iniciar', fn: () => SIGA.mrp.iniciarOT(o) }, o.prio === 'Alta' ? 'Alta' : 'Normal'));
    if (D.contabilidad.cierres[0][0] !== 'Agosto 2026') T('Cierre contable de agosto', 'fa-lock', 'cierre', 'Agosto 2026', 'Verificación de consistencia y estados financieros', 0, '31/08/2026', 'contabilidad', () => SIGA.go('contabilidad', { k: 'cie' }), { label: 'Ir al cierre', fn: () => SIGA.go('contabilidad', { k: 'cie' }) });
    if (!D.planilla.generada) T('Generar planilla de agosto', 'fa-users', null, 'Planilla 08/2026', '1,197 trabajadores · 9 regímenes', 0, '25/08/2026', 'planilla', () => SIGA.go('planilla', { pl: 'men' }), { label: 'Ir a planillas', fn: () => SIGA.go('planilla') });
    return out;
  }
  const mia = t => !t.perm || SIGA.can(t.perm);
  SIGA.bandeja = { tareas, mias: () => tareas().filter(mia) };

  SIGA.registerModule('bandeja', {
    title: 'Mi bandeja', icon: 'fa-inbox', group: 'Principal', solo: true,
    alerts() { const n = SIGA.bandeja.mias().filter(t => t.perm).length; return n ? [{ lvl: 'info', icon: 'fa-inbox', t: `${n} tarea(s) esperan su aprobación`, d: SIGA.ctx.user.rolTx, fn: () => SIGA.go('bandeja') }] : []; },
    search(q) { return tareas().filter(t => (t.ref + ' ' + t.desc + ' ' + t.tipo).toLowerCase().includes(q)).map(t => ({ t: t.tipo + ' · ' + t.ref, d: t.desc, fn: t.ver })); },
    render(el) {
      const u = U(), all = tareas(), mine = all.filter(mia), rows = this.solo ? mine : all;
      const tipos = {}; rows.forEach(t => { tipos[t.tipo] = tipos[t.tipo] || { n: 0, m: 0, icon: t.icon }; tipos[t.tipo].n++; tipos[t.tipo].m += t.monto || 0; });
      el.innerHTML = `
        <div class="page-head"><div><h1>Mi bandeja de aprobaciones</h1><p>Lo que espera una decisión suya como <b>${SIGA.ctx.user.rolTx}</b> · aprobación electrónica con segregación de funciones y registro en la bitácora</p></div>
          <div class="row-flex"><div class="seg-tabs" id="bj-scope" style="margin:0"><button class="${this.solo ? 'on' : ''}" data-s="1">Para mi rol (${mine.length})</button><button class="${this.solo ? '' : 'on'}" data-s="0">Todas las oficinas (${all.length})</button></div>
          <button class="btn ghost" id="bj-user"><i class="fa-solid fa-user-gear"></i> Cambiar de usuario</button></div></div>
        ${u.kpis([
          { lab: 'Tareas pendientes', val: rows.length, sub: this.solo ? 'asignadas a su rol' : 'en toda la institución' },
          { lab: 'Prioridad alta', val: rows.filter(t => t.prio === 'Alta').length, sub: 'montos altos, pagos y vencidos', color: 'var(--danger)' },
          { lab: 'Importe en decisión', val: u.money(rows.reduce((s, t) => s + (t.monto || 0), 0)), sub: 'suma de las tareas' },
          { lab: 'Tiempo medio de atención', val: '46 min', sub: 'antes: 3 a 5 días con expediente físico', chip: '−98%' }
        ])}
        <div class="grid cols-4 mb">${Object.entries(tipos).map(([k, v]) => `<div class="card bj-t" data-t="${u.esc(k)}"><h3><i class="fa-solid ${v.icon}" style="color:var(--primary-dark)"></i> ${k}</h3><div class="big-n" style="font-size:22px">${v.n}</div><div class="mini">${v.m ? u.money(v.m) : 'sin importe'}</div></div>`).join('') || '<div class="card"><h3><i class="fa-solid fa-circle-check" style="color:var(--ok)"></i> Bandeja al día</h3><p class="mini">No hay tareas pendientes para su rol. Cambie de usuario para ver las de otras oficinas.</p></div>'}</div>
        <div class="card"><h3><span class="dot"></span>Tareas <span class="grow">clic en la fila para ver el registro · acción directa en el botón</span></h3><div id="bj-t"></div></div>`;
      el.querySelectorAll('#bj-scope [data-s]').forEach(b => b.addEventListener('click', () => { this.solo = b.dataset.s === '1'; SIGA.refresh(); }));
      el.querySelector('#bj-user').addEventListener('click', e => { e.stopPropagation(); document.querySelector('.topbar .user').click(); });
      el.querySelectorAll('.bj-t').forEach(c => c.addEventListener('click', () => { const i = document.querySelector('#bj-t [data-gq]'); if (i) { i.value = c.dataset.t; i.dispatchEvent(new Event('input')); } }));
      document.getElementById('bj-t').innerHTML = u.grid({ id: 'bj-' + (this.solo ? 'mia' : 'all'), title: 'tareas', export: 'bandeja_' + SIGA.ctx.user.id, rows, pageSize: 12, empty: 'Sin tareas pendientes',
        filter: { label: 'Tipo', get: t => t.tipo },
        cols: [
          { k: 'prio', label: 'Prioridad', render: t => u.tag(t.prio, t.prio === 'Alta' ? 't-red' : 't-gray') },
          { k: 'tipo', label: 'Tarea', render: t => `<i class="fa-solid ${t.icon}" style="color:var(--primary-dark);width:16px"></i> <b>${t.tipo}</b><div class="mini">${SIGA.modules[t.mod].title}</div>`, csv: t => t.tipo },
          { k: 'ref', label: 'Documento', render: t => `<span class="code">${u.esc(t.ref)}</span>` }, { k: 'desc', label: 'Detalle', render: t => `<span class="mini">${u.esc(t.desc)}</span>` },
          { k: 'monto', label: 'Importe', r: true, render: t => t.monto ? u.money(t.monto) : '—' }, { k: 'fecha', label: 'Fecha', sv: t => (t.fecha || '').split('/').reverse().join('') },
          { k: 'q', label: 'Responsable', nosort: true, render: t => !t.perm ? u.tag('cualquier rol', 't-gray') : SIGA.can(t.perm) ? u.tag('usted', 't-teal') : u.tag((SIGA.ctx.users.find(x => (({ 'cert.aprobar': ['jefppto'], 'req.aprobar': ['jefaba', 'dga'], 'req.aprobar.alto': ['dga'], 'cp.pagar': ['tesorero', 'dga'], 'dep.confirmar': ['tesorero', 'dga'], 'baja.aprobar': ['dga'], 'lic.aprobar': ['dga'], 'cierre': ['contador'] })[t.perm] || []).includes(x.rol)) || {}).rolTx || 'otro rol', 't-amber') }
        ],
        onRow: t => t.ver(),
        actions: [{ icon: 'fa-bolt', title: 'Resolver', show: t => !!t.accion, fn: t => t.accion.fn() }, { icon: 'fa-arrow-up-right-from-square', title: 'Abrir en su módulo', fn: t => SIGA.go(t.mod) }],
        bulk: [{ icon: 'fa-bolt', label: 'Resolver seleccionadas', fn: ts => { const ok = ts.filter(t => t.accion && mia(t)); if (!ok.length) { u.toast('Ninguna de las tareas seleccionadas puede resolverse con su rol', 'err'); return; } ok.forEach(t => t.accion.fn()); } }] });
    }
  });
})();
