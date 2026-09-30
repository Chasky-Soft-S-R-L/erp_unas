/* ============================================================
   Almacén · "Qué se entregó, qué falta y qué hay que pedir"
   Tres estados visibles en una sola pantalla + kárdex detrás de cada línea
   ============================================================ */
(function () {
  const L = SIGA.data.almacen;
  const item = cod => L.items.find(i => i.cod === cod);
  const num = v => parseFloat(String(v == null ? '' : v).replace(/,/g, '')) || 0;
  // Kárdex con costo promedio ponderado (calculado, no almacenado)
  const kardexDe = cod => {
    const it = item(cod), mv = L.kardex[cod] || [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', it ? it.stock : 0, it ? it.cprom : 0]];
    let q = 0, val = 0; const rows = [];
    mv.forEach(m => {
      const [f, doc, det, t, c, cu] = m; let e = null, s = null;
      if (t === 'I' || t === 'E') { q += c; val += c * cu; e = [c, c * cu]; }
      else { const cp = q ? val / q : 0; q -= c; val -= c * cp; s = [c, c * cp]; }
      rows.push({ f, doc, det, t, e, s, q, cp: q ? val / q : 0, val });
    });
    return rows;
  };
  const cpromDe = cod => { const k = kardexDe(cod); return k.length ? k[k.length - 1].cp : (item(cod) || {}).cprom || 0; };
  const porPedir = () => L.items.filter(i => i.stock < i.min && !i.pendiente);
  const bajoMin = () => L.items.filter(i => i.stock < i.min);
  const pend = () => L.movs.filter(m => m.estado === 'Pendiente de entrega');
  const valor = () => L.items.reduce((s, i) => s + i.stock * cpromDe(i.cod), 0);
  // Desfase entre lo que se muestra y la muestra de ítems de la demo (los KPI del pitch son institucionales)
  const base = { stock: L.kpiBase.enStock - L.items.filter(i => i.stock > 0).length, ent: L.kpiBase.entregados - L.movs.filter(m => m.estado === 'Entregado').length, pen: L.kpiBase.pendientes - pend().length, bajo: L.kpiBase.bajoMin - bajoMin().length };

  // API usada por Abastecimiento (PECOSA/NEA) y Producción (insumos a órdenes)
  SIGA.alm = {
    stockDe: cod => (item(cod) || { stock: 0 }).stock,
    cprom: cpromDe,
    salida(rows, dep, doc, autor) {
      rows.forEach(r => {
        const it = item(r.cod); if (!it) return;
        const c = num(r.cant); it.stock -= c;
        (L.kardex[r.cod] = L.kardex[r.cod] || [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', it.stock + c, it.cprom]]).push([SIGA.ctx.hoyCorta, doc, 'Salida · ' + dep, 'S', c]);
        L.movs.unshift({ doc, cod: r.cod, item: it.desc, dep, cant: c, fecha: SIGA.ctx.hoyCorta, estado: 'Entregado', pidio: dep, autorizo: autor || 'Jefe de área', recibio: 'Responsable de ' + dep, hora: SIGA.ui.now().slice(0, 16), nuevo: true });
      });
    },
    ingreso(rows, doc, ocDoc, prov) {
      rows.forEach(r => {
        let it = item(r.cod);
        if (!it) { it = { cod: r.cod || ('NEW' + SIGA.ui.rid()), desc: r.desc, um: r.um, ubic: 'Central · por asignar', stock: 0, min: 0, max: 0, cprom: num(r.pu) }; L.items.push(it); }
        const c = num(r.cant); it.stock += c; delete it.pendiente;
        (L.kardex[it.cod] = L.kardex[it.cod] || [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', it.stock - c, it.cprom]]).push([SIGA.ctx.hoyCorta, doc, 'Ingreso · ' + (ocDoc || prov || ''), 'E', c, num(r.pu)]);
        const i = L.movs.findIndex(m => m.doc === ocDoc && m.cod === it.cod); if (i > -1) L.movs.splice(i, 1);
        L.movs.unshift({ doc, cod: it.cod, item: it.desc, dep: 'Almacén · por despachar', cant: c, fecha: SIGA.ctx.hoyCorta, estado: 'Pendiente de entrega', pidio: '—', autorizo: 'Jefe de Abastecimiento', recibio: '— por despachar', hora: SIGA.ui.now().slice(0, 16), nota: 'Recibido con ' + doc + (ocDoc ? ' · vinculado a ' + ocDoc : ''), nuevo: true });
      });
    }
  };

  const EST = { 'Entregado': ['t-green', 'fa-circle-check'], 'Pendiente de entrega': ['t-amber', 'fa-hourglass-half'], 'Por pedir': ['t-red', 'fa-cart-plus'] };

  SIGA.registerModule('almacen', {
    title: 'Almacén', icon: 'fa-warehouse', group: 'Ejecución del gasto', badge: 'NUEVO', badgeNew: true,
    fe: 'Todos', sel: '740805000071',
    alerts() {
      const out = [];
      const b = bajoMin();
      if (b.length) out.push({ lvl: 'warn', icon: 'fa-boxes-stacked', t: `${b.length} ítems bajo stock mínimo en la muestra`, d: b.slice(0, 3).map(i => i.desc.split(' · ')[0]).join(' · '), fn: () => SIGA.showTab(document.getElementById('mod-root'), 'l', 'stk') });
      L.items.filter(i => i.venc && i.venc.endsWith('/09/2026')).forEach(i => out.push({ lvl: 'warn', icon: 'fa-calendar-xmark', t: `Próximo a vencer · ${i.desc}`, d: 'vence ' + i.venc + ' · ' + i.stock + ' ' + i.um.toLowerCase() }));
      return out;
    },
    search(q) {
      return L.movs.filter(m => (m.doc + ' ' + m.item + ' ' + m.dep).toLowerCase().includes(q)).map(m => ({ t: m.doc + ' · ' + m.item, d: m.dep + ' · ' + m.estado, fn: () => this.traza(m) }));
    },
    render(el) {
      const U = SIGA.ui;
      const pp = porPedir();
      const counts = { 'Entregado': L.movs.filter(m => m.estado === 'Entregado').length, 'Pendiente de entrega': pend().length, 'Por pedir': pp.length };
      el.innerHTML = `
      <div class="page-head"><div><h1>Almacén</h1><p>Recepción, custodia y despacho · kárdex valorizado en línea · stock mínimo con alerta · inventario físico asistido</p></div>
        <div class="row-flex"><button class="btn ghost" id="l-inv"><i class="fa-solid fa-clipboard-check"></i> Toma de inventario</button><button class="btn" id="l-pec"><i class="fa-solid fa-dolly"></i> Despachar (PECOSA)</button></div></div>
      ${U.kpis([
        { lab: 'Ítems en stock', val: U.int(base.stock + L.items.filter(i => i.stock > 0).length), sub: 'valor de la muestra ' + U.money(valor()) },
        { lab: 'Entregados este mes', val: U.int(base.ent + counts['Entregado']), sub: 'con PECOSA firmada', chip: 'agosto', chipType: 'info' },
        { lab: 'Pendientes de entrega', val: U.int(base.pen + counts['Pendiente de entrega']), sub: 'NEA por despachar u O/C sin entregar', color: '#b45309' },
        { lab: 'Bajo stock mínimo', val: U.int(base.bajo + bajoMin().length), sub: 'el sistema los propone antes de que falten', color: 'var(--danger)' }
      ])}
      <div class="bigq mb">"Necesito ver qué se entregó, qué está pendiente y qué falta pedir."<em>— Almacén, levantamiento de campo</em></div>
      <div class="seg-tabs" data-group="l"><button class="on" data-tab="mov">Tablero de movimientos</button><button data-tab="kar">Kárdex valorizado</button><button data-tab="stk">Existencias y alertas</button><button data-tab="inv">Inventario físico</button><button data-tab="otr">Transferencias, bajas y custodia</button></div>
      <div class="subpanel show" data-group="l" data-panel="mov">
        <div class="grid cols-3 mb" id="l-states">${Object.entries(counts).map(([k, n]) => `<div class="state-box ${this.fe === k ? 'on' : ''}" data-e="${k}"><div class="row-flex" style="justify-content:space-between"><span class="t">${k}</span>${U.tag('<i class="fa-solid ' + EST[k][1] + '"></i>', EST[k][0])}</div><div class="n">${n}</div><div class="d">${{ 'Entregado': 'Despachado con PECOSA firmada: fecha, responsable y dependencia receptora. Kárdex actualizado en el mismo acto.', 'Pendiente de entrega': 'Recibido con NEA y aún no despachado, o comprometido en orden que el proveedor todavía no entrega.', 'Por pedir': 'Ítems bajo el stock mínimo sin orden emitida. El sistema los propone antes de que falten.' }[k]}</div></div>`).join('')}</div>
        <div class="card"><h3><span class="dot"></span>Movimientos <span class="grow">un filtro, tres estados y el kárdex detrás de cada línea · clic para ver la trazabilidad</span></h3>
          <div class="toolbar"><div class="chips" id="l-chips">${['Todos', 'Entregado', 'Pendiente de entrega', 'Por pedir'].map(f => `<span class="chipf ${f === this.fe ? 'on' : ''}" data-f="${f}">${f}</span>`).join('')}</div></div><div id="l-tmov"></div></div></div>
      <div class="subpanel" data-group="l" data-panel="kar" id="l-p-kar"></div>
      <div class="subpanel" data-group="l" data-panel="stk"><div class="card"><h3><span class="dot"></span>Existencias, ubicación física y alertas <span class="grow">L-05 · L-06 · mínimos y máximos configurables</span></h3><div id="l-tstk"></div></div></div>
      <div class="subpanel" data-group="l" data-panel="inv" id="l-p-inv"></div>
      <div class="subpanel" data-group="l" data-panel="otr" id="l-p-otr"></div>`;

      const setF = f => { this.fe = f; el.querySelectorAll('#l-chips .chipf').forEach(x => x.classList.toggle('on', x.dataset.f === f)); el.querySelectorAll('#l-states .state-box').forEach(x => x.classList.toggle('on', x.dataset.e === f)); this.paintMov(); };
      el.querySelector('#l-chips').addEventListener('click', e => { const c = e.target.closest('[data-f]'); if (c) setF(c.dataset.f); });
      el.querySelector('#l-states').addEventListener('click', e => { const c = e.target.closest('[data-e]'); if (c) setF(this.fe === c.dataset.e ? 'Todos' : c.dataset.e); });
      el.querySelector('#l-inv').addEventListener('click', () => SIGA.showTab(el, 'l', 'inv'));
      el.querySelector('#l-pec').addEventListener('click', () => { const ab = SIGA.modules.abastecimiento; ab.tipo = 'pec'; SIGA.go('abastecimiento'); });
      this.paintMov(); this.paintKar(); this.paintStk(); this.paintInv(); this.paintOtr();
    },

    paintMov() {
      const U = SIGA.ui;
      const pp = porPedir().map(i => ({ doc: '—', cod: i.cod, item: i.desc, dep: i.dep || 'Almacén central', cant: i.stock, fecha: '—', estado: 'Por pedir', sug: Math.max(0, i.max - i.stock), it: i }));
      const rows = [...L.movs, ...pp].filter(m => this.fe === 'Todos' || m.estado === this.fe);
      document.getElementById('l-tmov').innerHTML = U.table([
        { k: 'doc', label: 'Documento', render: r => r.doc === '—' ? '<span class="mini">—</span>' : `<span class="code">${r.doc}</span>` },
        { k: 'item', label: 'Ítem', render: r => r.item + (r.nota ? `<div class="mini">${r.nota}</div>` : r.sug ? `<div class="mini">stock ${r.it.stock} · mín. ${r.it.min} · sugerido ${r.sug} ${r.it.um.toLowerCase()}</div>` : '') },
        { k: 'dep', label: 'Dependencia' }, { k: 'cant', label: 'Cant.', r: true }, { k: 'fecha', label: 'Fecha', cls: 'num' },
        { k: 'estado', label: 'Estado', render: r => U.tag('<i class="fa-solid ' + EST[r.estado][1] + '"></i> ' + r.estado, EST[r.estado][0]) }
      ], rows, {
        onRow: r => r.estado === 'Por pedir' ? this.pedir(r.it) : this.traza(r),
        rowCls: r => r.nuevo ? 'row-new' : '',
        actions: [
          { icon: 'fa-truck-ramp-box', title: 'Despachar al área (PECOSA)', show: r => r.estado === 'Pendiente de entrega' && r.doc.startsWith('NEA'), fn: r => this.despachar(r) },
          { icon: 'fa-cart-plus', title: 'Generar requerimiento de reposición', show: r => r.estado === 'Por pedir', fn: r => this.pedir(r.it) },
          { icon: 'fa-book-open', title: 'Ver kárdex', show: r => !!r.cod, fn: r => { this.sel = r.cod; this.paintKar(); SIGA.showTab(document.getElementById('mod-root'), 'l', 'kar'); } }
        ]
      });
    },
    traza(m) {
      const U = SIGA.ui;
      U.modal('Trazabilidad · ' + m.doc, U.kv([['Ítem', m.item], ['Cantidad', m.cant], ['Dependencia', m.dep], ['Estado', U.tag(m.estado, EST[m.estado][0])]]) +
        `<div class="lbl-s mt" style="margin-bottom:8px">Despacho trazable · quién pidió, quién autorizó, quién recibió y cuándo</div>` +
        U.timeline([{ t: 'Pidió', sub: m.pidio, st: 'done' }, { t: 'Autorizó', sub: m.autorizo, st: 'done' }, { t: m.estado === 'Entregado' ? 'Despachó' : 'Registro', sub: 'J. Castro · Almacenero', st: 'done', when: m.hora }, { t: 'Recibió', sub: m.recibio, st: m.estado === 'Entregado' ? 'done' : 'cur' }]),
        `<button class="btn ghost" data-close>Cerrar</button>${m.estado === 'Pendiente de entrega' && m.doc.startsWith('NEA') ? '<button class="btn" id="tz-d"><i class="fa-solid fa-truck-ramp-box"></i> Despachar ahora</button>' : ''}`)
        .querySelector('#tz-d')?.addEventListener('click', () => { U.closeModal(); this.despachar(m); });
    },
    despachar(m) {
      const U = SIGA.ui, ab = SIGA.data.abastecimiento, n = ab.docTipos.pec.num, it = item(m.cod);
      const dest = m.dep.startsWith('Almacén') ? 'Granja Porcina' : m.dep;
      if (!it || it.stock < m.cant) { U.toast('Stock insuficiente para despachar', 'err'); return; }
      U.confirm(`¿Despachar <b>${m.cant} ${it.um.toLowerCase()}</b> de ${it.desc} a <b>${dest}</b> con la PECOSA ${n}?`, () => {
        m.estado = 'Entregado'; m.recibio = 'Responsable de ' + dest; m.dep = dest;
        it.stock -= m.cant; (L.kardex[it.cod] = L.kardex[it.cod] || [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', it.stock + m.cant, it.cprom]]).push([SIGA.ctx.hoyCorta, 'PECOSA ' + n, 'Salida · ' + dest, 'S', m.cant]);
        const v = m.cant * cpromDe(it.cod);
        SIGA.asiento('Consumo de existencias · PECOSA ' + n + ' · ' + dest, [['5301', v, 0], ['1301', 0, v]], 'Almacén');
        SIGA.log('Almacén', 'Despacho con PECOSA', 'PECOSA ' + n, m.doc + ' · pendiente', 'Entregado · ' + dest);
        ab.docTipos.pec.num = U.pad(+n + 1, n.length);
        U.toast(`PECOSA ${n} · ${m.cant} ${it.um.toLowerCase()} entregados a ${dest} · kárdex y contabilidad actualizados`); SIGA.refresh();
      }, 'Despachar', '');
    },
    pedir(it) {
      const U = SIGA.ui, ab = SIGA.data.abastecimiento, q = Math.max(1, it.max - it.stock);
      U.confirm(`<b>${it.desc}</b><br>Stock ${it.stock} · mínimo ${it.min} · máximo ${it.max}.<br>¿Generar el requerimiento de reposición por <b>${q} ${it.um.toLowerCase()}</b> (${U.money(q * it.cprom)} estimado)?`, () => {
        const nreq = 'REQ 2026-' + (939 + ab.requerimientos.filter(x => x.nuevo).length);
        ab.requerimientos.unshift({ num: nreq, fecha: SIGA.ctx.hoy, cc: it.dep || 'Almacén central', desc: 'Reposición de stock · ' + it.desc, monto: q * it.cprom, estado: 'En evaluación', user: SIGA.ctx.user.nombre, aprob: '', saldo: true, nuevo: true });
        it.pendiente = nreq;
        SIGA.log('Almacén', 'Requerimiento de reposición', nreq, 'Stock ' + it.stock, 'Solicitado ' + q);
        U.toast(`${nreq} generado y enviado a Abastecimiento · ${it.desc.split(' · ')[0]}`); SIGA.refresh();
      }, 'Generar requerimiento', '');
    },

    paintKar() {
      const U = SIGA.ui, host = document.getElementById('l-p-kar'); if (!host) return;
      const it = item(this.sel) || L.items[0], k = kardexDe(it.cod), last = k[k.length - 1];
      host.innerHTML = `<div class="card"><h3><span class="dot"></span>Kárdex valorizado · costo promedio ponderado <span class="grow">L-03 · entradas y salidas sin recalcular a mano</span></h3>
        <div class="toolbar"><div class="fld" style="min-width:340px"><select id="kar-sel">${L.items.map(i => `<option value="${i.cod}" ${i.cod === it.cod ? 'selected' : ''}>${i.cod} · ${i.desc}</option>`).join('')}</select></div>
          <span class="pill ok"><span class="dot"></span>Saldo ${U.int(last.q)} ${it.um.toLowerCase()}</span><span class="pill">Costo promedio S/ ${last.cp.toFixed(4)}</span><span class="pill">Valor ${U.money(last.val)}</span></div>
        <div id="kar-t"></div></div>`;
      document.getElementById('kar-t').innerHTML = U.table([
        { k: 'f', label: 'Fecha' }, { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'det', label: 'Detalle' },
        { k: 'ec', label: 'Entrada', r: true, render: r => r.e ? U.int(r.e[0]) : '—' }, { k: 'ev', label: 'Valor ent.', r: true, render: r => r.e ? U.money(r.e[1], '') : '—' },
        { k: 'sc', label: 'Salida', r: true, render: r => r.s ? U.int(r.s[0]) : '—' }, { k: 'sv', label: 'Valor sal.', r: true, render: r => r.s ? U.money(r.s[1], '') : '—' },
        { k: 'q', label: 'Saldo', r: true, render: r => `<b>${U.int(r.q)}</b>` }, { k: 'cp', label: 'C. prom.', r: true, render: r => r.cp.toFixed(4) }, { k: 'val', label: 'Saldo S/', r: true, render: r => U.money(r.val, '') }
      ], k);
      document.getElementById('kar-sel').addEventListener('change', e => { this.sel = e.target.value; this.paintKar(); });
    },
    paintStk() {
      const U = SIGA.ui;
      document.getElementById('l-tstk').innerHTML = U.table([
        { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'desc', label: 'Bien', render: r => r.desc + (r.venc ? `<div class="mini">vence ${r.venc}</div>` : '') },
        { k: 'ubic', label: 'Ubicación' }, { k: 'stock', label: 'Stock', r: true, render: r => `<b>${U.int(r.stock)}</b> <span class="mini">${r.um.toLowerCase()}</span>` },
        { k: 'mm', label: 'Mín · Máx', r: true, render: r => r.min + ' · ' + r.max },
        { k: 'niv', label: 'Nivel', render: r => `<div class="mcell">${U.meter(r.max ? r.stock / r.max * 100 : 0, r.stock < r.min ? 'var(--danger)' : r.stock < r.min * 1.5 ? 'var(--warning)' : 'var(--primary)')}</div>` },
        { k: 'val', label: 'Valor S/', r: true, render: r => U.money(r.stock * cpromDe(r.cod), '') },
        { k: 'est', label: 'Estado', render: r => r.stock === 0 ? U.tag('Agotado', 't-red') : r.stock < r.min ? U.tag('Bajo mínimo', 't-red') : r.stock < r.min * 1.5 ? U.tag('Reponer pronto', 't-amber') : U.tag('Normal', 't-green') }
      ], L.items, { rowCls: r => r.stock < r.min ? 'row-bad' : '', actions: [{ icon: 'fa-cart-plus', title: 'Reponer', show: r => r.stock < r.min && !r.pendiente, fn: r => this.pedir(r) }, { icon: 'fa-book-open', title: 'Kárdex', fn: r => { this.sel = r.cod; this.paintKar(); SIGA.showTab(document.getElementById('mod-root'), 'l', 'kar'); } }] });
    },
    paintInv() {
      const U = SIGA.ui, I = L.inventario, host = document.getElementById('l-p-inv');
      const rows = Object.keys(I.conteo).map(cod => ({ it: item(cod), c: I.conteo[cod] })).filter(r => r.it);
      host.innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Toma de inventario físico · ${I.almacen} <span class="grow">L-07 · diferencias calculadas al instante</span></h3>
        <div class="tbl-wrap"><table><thead><tr><th>Bien</th><th>Ubicación</th><th class="r">Sistema</th><th class="r" style="width:110px">Conteo físico</th><th class="r">Diferencia</th><th class="r">Valor dif.</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${r.it.desc}</td><td class="mini">${r.it.ubic}</td><td class="r num">${r.it.stock}</td><td class="r"><input class="inv-c" data-c="${r.it.cod}" value="${r.c}" style="width:90px;text-align:right;border:1px solid var(--line);border-radius:6px;padding:5px 7px;font-family:inherit"></td><td class="r num" data-d="${r.it.cod}"></td><td class="r num" data-v="${r.it.cod}"></td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="5" class="r" style="font-weight:700">Diferencia valorizada neta</td><td class="r num" id="inv-tot" style="font-weight:800"></td></tr></tfoot></table></div>
        <div class="row-flex mt"><button class="btn" id="inv-go"><i class="fa-solid fa-file-signature"></i> Conciliar y emitir acta</button><span class="mini">Ajusta el stock, registra el kárdex y genera el asiento del faltante o sobrante.</span></div></div>
        <div><div class="cmp" style="grid-template-columns:1fr"><div class="asis"><h5>Hoy</h5><div class="big-n neg">320 h</div>Conteo manual y conciliación contra el registro en hojas de cálculo.</div><div class="tobe"><h5>SIGA-U</h5><div class="big-n pos">en el acto</div>El conteo se digita (o escanea) y la diferencia valorizada aparece de inmediato.</div></div></div></div>`;
      const calc = () => {
        let t = 0;
        rows.forEach(r => { const c = num(host.querySelector(`[data-c="${r.it.cod}"]`).value), d = c - r.it.stock, v = d * cpromDe(r.it.cod); t += v; host.querySelector(`[data-d="${r.it.cod}"]`).innerHTML = `<b class="${d < 0 ? 'saldo-neg' : d > 0 ? 'saldo-pos' : ''}">${d > 0 ? '+' : ''}${d}</b>`; host.querySelector(`[data-v="${r.it.cod}"]`).innerHTML = `<span class="${v < 0 ? 'saldo-neg' : v > 0 ? 'saldo-pos' : ''}">${U.money(v, '')}</span>`; });
        host.querySelector('#inv-tot').innerHTML = `<span class="${t < 0 ? 'saldo-neg' : 'saldo-pos'}">${U.money(t)}</span>`; return t;
      };
      host.querySelectorAll('.inv-c').forEach(i => i.addEventListener('input', calc)); calc();
      host.querySelector('#inv-go').addEventListener('click', () => {
        if (SIGA.ctx.user.readOnly) { U.toast('El rol OCI tiene acceso de solo consulta', 'err'); return; }
        const adj = []; let t = 0;
        rows.forEach(r => { const c = num(host.querySelector(`[data-c="${r.it.cod}"]`).value), d = c - r.it.stock; if (!d) return; const v = d * cpromDe(r.it.cod); t += v; adj.push([r.it.desc, d, v]); (L.kardex[r.it.cod] = L.kardex[r.it.cod] || [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', r.it.stock, r.it.cprom]]).push([SIGA.ctx.hoyCorta, 'Acta INV-2026-08', d < 0 ? 'Ajuste por faltante' : 'Ajuste por sobrante', d < 0 ? 'S' : 'E', Math.abs(d), cpromDe(r.it.cod)]); r.it.stock = c; I.conteo[r.it.cod] = c; });
        if (!adj.length) { U.toast('Sin diferencias: inventario conforme', 'info'); return; }
        const a = t < 0 ? SIGA.asiento('Ajuste de inventario físico · faltante', [['5301', -t, 0], ['1301', 0, -t]], 'Almacén') : SIGA.asiento('Ajuste de inventario físico · sobrante', [['1301', t, 0], ['5301', 0, t]], 'Almacén');
        SIGA.log('Almacén', 'Conciliación de inventario físico', 'INV-2026-08', adj.length + ' diferencias', U.money(t));
        U.modal('Acta de inventario físico INV-2026-08', U.table([{ k: 0, label: 'Bien' }, { k: 1, label: 'Diferencia', r: true, render: r => `<b class="${r[1] < 0 ? 'saldo-neg' : 'saldo-pos'}">${r[1] > 0 ? '+' : ''}${r[1]}</b>` }, { k: 2, label: 'Valor', r: true, render: r => U.money(r[2]) }], adj) + `<div class="note teal mt"><i class="fa-solid fa-circle-check"></i><div>Stock y kárdex ajustados · asiento ${a || ''} generado · acta firmada digitalmente por la comisión de inventario.</div></div>`, `<button class="btn ghost" data-close>Cerrar</button>`);
        SIGA.refresh();
      });
    },
    paintOtr() {
      const U = SIGA.ui;
      document.getElementById('l-p-otr').innerHTML = `<div class="grid cols-3">
        <div class="card"><h3><span class="dot"></span>Transferencias entre almacenes <span class="grow">L-08</span></h3><div id="o-tr"></div></div>
        <div class="card"><h3><span class="dot"></span>Baja de bienes <span class="grow">L-10 · con resolución</span></h3><div id="o-ba"></div></div>
        <div class="card"><h3><span class="dot"></span>Bienes en custodia o préstamo <span class="grow">L-09</span></h3><div id="o-cu"></div></div></div>`;
      document.getElementById('o-tr').innerHTML = L.transferencias.map(t => `<div class="mini-card mb"><div class="row-flex" style="justify-content:space-between"><span class="code">${t[0]}</span>${U.tag(t[5], 't-green')}</div><b style="font-size:12px">${t[4]}</b><div class="s">${t[2]} → ${t[3]} · ${t[1]}</div></div>`).join('');
      document.getElementById('o-ba').innerHTML = L.bajas.map(b => `<div class="mini-card mb"><div class="row-flex" style="justify-content:space-between"><span class="code">${b[0]}</span>${U.tag(b[3], 't-amber')}</div><b style="font-size:12px">${b[2]}</b><div class="s">${b[4]} · ${U.money(b[5])}</div></div>`).join('');
      document.getElementById('o-cu').innerHTML = L.custodia.map(c => `<div class="mini-card mb"><span class="code">${c[0]}</span><b style="font-size:12px;display:block">${c[1]}</b><div class="s">${c[2]} · devolución ${c[3]}</div></div>`).join('');
    }
  });
})();
