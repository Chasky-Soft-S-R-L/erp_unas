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

  const EST = { 'Entregado': ['t-green', 'fa-circle-check'], 'Pendiente de entrega': ['t-amber', 'fa-hourglass-half'], 'Por pedir': ['t-red', 'fa-cart-plus'], 'Anulado': ['t-red', 'fa-ban'] };
  const kpush = (it, row) => (L.kardex[it.cod] = L.kardex[it.cod] || [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', it.stock, it.cprom]]).push(row);
  const docTbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const irA = cod => { const m = SIGA.modules.almacen; m.sel = cod; m.paintKar(); SIGA.showTab(document.getElementById('mod-root'), 'l', 'kar'); };

  /* ---------- Acciones por registro ---------- */
  const movRec = {
    mod: 'Almacén', office: 'Oficina de Abastecimiento · Almacén central', cls: false,
    key: r => r.doc === '—' ? r.cod : r.doc, title: r => (r.doc === '—' ? 'Por pedir' : r.doc) + ' · ' + (r.item || '').split(' · ')[0],
    tipo: 'Movimiento de almacén',
    fields: r => { const it = item(r.cod) || {}; return [['Documento', `<span class="code">${r.doc}</span>`], ['Fecha', r.fecha], ['Bien', r.item, 1], ['Código SIGA', r.cod], ['Cantidad', SIGA.ui.int(r.cant) + ' ' + (it.um || '').toLowerCase()], ['Valor (costo promedio)', SIGA.ui.money(r.cant * cpromDe(r.cod))], ['Dependencia', r.dep], ['Estado', SIGA.ui.tag(r.estado, (EST[r.estado] || EST['Anulado'])[0])], ['Pidió', r.pidio || '—'], ['Autorizó', r.autorizo || '—'], ['Recibió', r.recibio || '—'], ['Registro', r.hora || '—'], ...(r.nota ? [['Observación', r.nota, 1]] : []), ...(r.motivo ? [['Motivo de anulación', r.motivo, 1]] : [])]; },
    body: r => r.estado === 'Por pedir' ? '' : `<div class="lbl-s mt" style="margin-bottom:8px">Despacho trazable · quién pidió, quién autorizó, quién recibió y cuándo</div>` + SIGA.ui.timeline([{ t: 'Pidió', sub: r.pidio, st: 'done' }, { t: 'Autorizó', sub: r.autorizo, st: 'done' }, { t: r.estado === 'Entregado' ? 'Despachó' : 'Registro', sub: 'J. Castro · Almacenero', st: 'done', when: r.hora }, { t: 'Recibió', sub: r.recibio, st: r.estado === 'Entregado' ? 'done' : r.estado === 'Anulado' ? 'bad' : 'cur' }]),
    edit: [{ k: 'dep', label: 'Dependencia receptora' }, { k: 'recibio', label: 'Recibió (nombre)', span: 1 }, { k: 'autorizo', label: 'Autorizó', span: 1 }, { k: 'nota', label: 'Observación', type: 'textarea' }],
    canEdit: r => r.estado !== 'Por pedir',
    anular: true, anularLabel: 'Anular PECOSA (reingreso)', canAnular: r => r.estado === 'Entregado' && /^PECOSA/.test(r.doc),
    onAnular: r => {
      const it = item(r.cod); if (!it) return;
      const cp = cpromDe(it.cod); it.stock += r.cant; kpush(it, [SIGA.ctx.hoyCorta, 'Anul. ' + r.doc, 'Reingreso por anulación · ' + r.dep, 'E', r.cant, cp]);
      SIGA.asiento('Reversión de consumo · anulación de ' + r.doc, [['1301', r.cant * cp, 0], ['5301', 0, r.cant * cp]], 'Almacén');
    },
    extra: r => [
      ...(r.estado === 'Pendiente de entrega' && /^NEA/.test(r.doc) ? [{ icon: 'fa-truck-ramp-box', label: 'Despachar al área (PECOSA)', fn: m => SIGA.modules.almacen.despachar(m) }] : []),
      ...(r.estado === 'Por pedir' ? [{ icon: 'fa-cart-plus', label: 'Generar requerimiento', fn: m => SIGA.modules.almacen.pedir(m.it) }] : []),
      ...(r.cod ? [{ icon: 'fa-book-open', label: 'Ver kárdex del bien', fn: m => { SIGA.ui.closeModal(); irA(m.cod); } }] : []),
      { icon: 'fa-barcode', label: 'Etiqueta del bien', menuOnly: true, fn: m => etiquetas([item(m.cod)].filter(Boolean)) }
    ],
    print: r => { const U = SIGA.ui, it = item(r.cod) || { um: '', cprom: 0 }, cp = cpromDe(r.cod);
      return { tipo: /^NEA/.test(r.doc) ? 'Nota de entrada a almacén' : /^O\/C/.test(r.doc) ? 'Orden de compra · pendiente de entrega' : 'Pedido comprobante de salida', num: r.doc,
        pairs: [['Fecha', r.fecha + '/2026'], ['Dependencia', r.dep], ['Solicitante', r.pidio], ['Autorizó', r.autorizo], ['Estado', r.estado], ['Almacén', (it.ubic || 'Central').split(' · ')[0]]],
        body: docTbl([['Código'], ['Descripción'], ['U.M.'], ['Cantidad', 1], ['C. unit.', 1], ['Total', 1]], [[r.cod, U.esc(r.item), it.um, U.int(r.cant), cp.toFixed(4), U.money(r.cant * cp, '')]]),
        firmas: [['Solicitante', r.pidio || '—'], ['Almacenero', 'J. Castro'], ['Recibí conforme', r.recibio || '—']] }; }
  };
  const etiquetas = list => {
    const U = SIGA.ui; if (!list.length) return;
    U.preview('Etiquetas de ubicación · ' + list.length + ' bien(es)', `<div class="doc" style="position:static"><div class="lbl-grid">${list.map(i => `<div class="lbl-card"><b>${U.esc(i.desc)}</b><div class="mini">${i.ubic} · ${i.um}</div>${U.barcode(i.cod, 190, 44)}<div class="mini">mín. ${i.min} · máx. ${i.max}</div></div>`).join('')}</div></div>`, { file: 'etiquetas_almacen' });
    SIGA.log('Almacén', 'Impresión de etiquetas', list.length + ' bienes');
  };
  const itemRec = {
    mod: 'Almacén', tipo: 'Ficha de existencia', office: 'Oficina de Abastecimiento · Almacén central', cls: false,
    key: r => r.cod, title: r => r.desc,
    fields: r => { const U = SIGA.ui; return [['Código SIGA', `<span class="code">${r.cod}</span>`], ['Unidad de medida', r.um], ['Descripción', U.esc(r.desc), 1], ['Ubicación física', r.ubic], ['Stock', `<b>${U.int(r.stock)}</b>`], ['Mínimo · máximo', r.min + ' · ' + r.max], ['Costo promedio', 'S/ ' + cpromDe(r.cod).toFixed(4)], ['Valor en almacén', U.money(r.stock * cpromDe(r.cod))], ['Vencimiento', r.venc || 'No perecible'], ['Pedido en curso', r.pendiente || '—'], ['Dependencia usuaria', r.dep || 'Almacén central']]; },
    body: r => `<div class="row-flex mt">${SIGA.ui.barcode(r.cod, 220, 48)}<div style="flex:1">${SIGA.ui.meter(r.max ? r.stock / r.max * 100 : 0, r.stock < r.min ? 'var(--danger)' : 'var(--primary)', 10)}<div class="mini">Nivel de stock ${r.max ? Math.round(r.stock / r.max * 100) : 0}% del máximo</div></div></div>`,
    edit: [{ k: 'desc', label: 'Descripción' }, { k: 'ubic', label: 'Ubicación física', span: 1 }, { k: 'um', label: 'Unidad de medida', span: 1 }, { k: 'min', label: 'Stock mínimo', type: 'number', span: 1 }, { k: 'max', label: 'Stock máximo', type: 'number', span: 1 }, { k: 'venc', label: 'Vencimiento (dd/mm/aaaa)', span: 1 }, { k: 'dep', label: 'Dependencia usuaria', span: 1 }],
    extra: r => [
      { icon: 'fa-book-open', label: 'Ver kárdex', fn: x => { SIGA.ui.closeModal(); irA(x.cod); } },
      ...(r.stock < r.min && !r.pendiente ? [{ icon: 'fa-cart-plus', label: 'Reponer', fn: x => SIGA.modules.almacen.pedir(x) }] : []),
      { icon: 'fa-right-left', label: 'Transferir a otro almacén', fn: x => SIGA.modules.almacen.transferir(x) },
      { icon: 'fa-barcode', label: 'Imprimir etiqueta', menuOnly: true, fn: x => etiquetas([x]) },
      { icon: 'fa-trash-can', label: 'Proponer baja (L-10)', danger: true, fn: x => SIGA.modules.almacen.baja(x) }
    ],
    print: r => ({ tipo: 'Tarjeta de control visible', num: r.cod, body: SIGA.ui.barcode(r.cod, 260, 56) + docTbl([['Fecha'], ['Documento'], ['Detalle'], ['Entrada', 1], ['Salida', 1], ['Saldo', 1], ['C. prom.', 1]], kardexDe(r.cod).map(k => [k.f, k.doc, k.det, k.e ? k.e[0] : '', k.s ? k.s[0] : '', SIGA.ui.int(k.q), k.cp.toFixed(4)])) })
  };

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
      const rows = () => [...L.movs, ...pp].filter(m => this.fe === 'Todos' || m.estado === this.fe);
      const RM = U.rec(movRec);
      document.getElementById('l-tmov').innerHTML = U.grid({
        id: 'alm-mov', title: 'movimientos de almacén', export: 'movimientos_almacen', rows, record: movRec, pageSize: 12,
        filter: { label: 'Dependencia', get: r => r.dep.split(' · ')[0] },
        cols: [
          { k: 'doc', label: 'Documento', render: r => r.doc === '—' ? '<span class="mini">—</span>' : `<span class="code">${r.doc}</span>` },
          { k: 'item', label: 'Ítem', render: r => U.esc(r.item) + (r.nota ? `<div class="mini">${r.nota}</div>` : r.sug ? `<div class="mini">stock ${r.it.stock} · mín. ${r.it.min} · sugerido ${r.sug} ${r.it.um.toLowerCase()}</div>` : ''), csv: r => r.item },
          { k: 'dep', label: 'Dependencia' }, { k: 'cant', label: 'Cant.', r: true },
          { k: 'val', label: 'Valor S/', r: true, sv: r => r.cant * cpromDe(r.cod), render: r => U.money(r.cant * cpromDe(r.cod), '') },
          { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha === '—' ? '' : r.fecha.split('/').reverse().join('') },
          { k: 'estado', label: 'Estado', render: r => U.tag('<i class="fa-solid ' + (EST[r.estado] || EST['Anulado'])[1] + '"></i> ' + r.estado, (EST[r.estado] || EST['Anulado'])[0]) }
        ],
        onRow: r => r.estado === 'Por pedir' ? this.pedir(r.it) : RM.ver(r),
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [
          { icon: 'fa-truck-ramp-box', title: 'Despachar al área (PECOSA)', show: r => r.estado === 'Pendiente de entrega' && r.doc.startsWith('NEA'), fn: r => this.despachar(r) },
          { icon: 'fa-cart-plus', title: 'Generar requerimiento de reposición', show: r => r.estado === 'Por pedir', fn: r => this.pedir(r.it) },
          { icon: 'fa-print', title: 'Imprimir documento', show: r => r.doc !== '—', fn: r => RM.imprimir(r) },
          { icon: 'fa-book-open', title: 'Ver kárdex', show: r => !!r.cod, fn: r => irA(r.cod) }
        ],
        bulk: [
          { icon: 'fa-print', label: 'Imprimir PECOSA seleccionadas', fn: rs => { const docs = rs.filter(r => r.doc !== '—'); U.preview('PECOSA · ' + docs.length + ' documento(s)', docs.map(r => U.doc(Object.assign({ office: movRec.office }, movRec.print(r)))).join('<div class="pg-break"></div>'), { file: 'pecosa_lote' }); } },
          { icon: 'fa-barcode', label: 'Etiquetas de los bienes', fn: rs => etiquetas([...new Set(rs.map(r => r.cod))].map(item).filter(Boolean)) }
        ],
        foot: rs => `<tr><td colspan="4" class="r"><b>Total valorizado (${rs.length})</b></td><td class="r num"><b>${U.money(rs.reduce((s, r) => s + (r.estado === 'Anulado' ? 0 : r.cant * cpromDe(r.cod)), 0), '')}</b></td><td colspan="3"></td></tr>`
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
        const nreq = 'REQ 2026-' + SIGA.ui.pad(939 + ab.requerimientos.filter(x => x.nuevo).length, 4);
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
          <span class="pill ok"><span class="dot"></span>Saldo ${U.int(last.q)} ${it.um.toLowerCase()}</span><span class="pill">Costo promedio S/ ${last.cp.toFixed(4)}</span><span class="pill">Valor ${U.money(last.val)}</span><span style="flex:1"></span><button class="btn sm ghost" id="kar-x"><i class="fa-solid fa-file-excel"></i> Excel</button><button class="btn sm ghost" id="kar-p"><i class="fa-solid fa-print"></i> Imprimir kárdex</button></div>
        <div id="kar-t"></div></div>`;
      document.getElementById('kar-t').innerHTML = U.table([
        { k: 'f', label: 'Fecha' }, { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'det', label: 'Detalle' },
        { k: 'ec', label: 'Entrada', r: true, render: r => r.e ? U.int(r.e[0]) : '—' }, { k: 'ev', label: 'Valor ent.', r: true, render: r => r.e ? U.money(r.e[1], '') : '—' },
        { k: 'sc', label: 'Salida', r: true, render: r => r.s ? U.int(r.s[0]) : '—' }, { k: 'sv', label: 'Valor sal.', r: true, render: r => r.s ? U.money(r.s[1], '') : '—' },
        { k: 'q', label: 'Saldo', r: true, render: r => `<b>${U.int(r.q)}</b>` }, { k: 'cp', label: 'C. prom.', r: true, render: r => r.cp.toFixed(4) }, { k: 'val', label: 'Saldo S/', r: true, render: r => U.money(r.val, '') }
      ], k);
      document.getElementById('kar-sel').addEventListener('change', e => { this.sel = e.target.value; this.paintKar(); });
      document.getElementById('kar-x').addEventListener('click', () => U.csv('kardex_' + it.cod, ['Fecha', 'Documento', 'Detalle', 'Entrada', 'Valor entrada', 'Salida', 'Valor salida', 'Saldo', 'Costo promedio', 'Saldo S/'], k.map(r => [r.f, r.doc, r.det, r.e ? r.e[0] : '', r.e ? r.e[1].toFixed(2) : '', r.s ? r.s[0] : '', r.s ? r.s[1].toFixed(2) : '', r.q, r.cp.toFixed(4), r.val.toFixed(2)])));
      document.getElementById('kar-p').addEventListener('click', () => U.preview('Kárdex valorizado · ' + it.desc, U.doc({ tipo: 'Kárdex valorizado', num: it.cod, office: 'Almacén central', pairs: [['Bien', U.esc(it.desc), 1], ['Unidad', it.um], ['Método', 'Costo promedio ponderado'], ['Saldo final', U.int(last.q)], ['Valor', U.money(last.val)]], body: docTbl([['Fecha'], ['Documento'], ['Detalle'], ['Entrada', 1], ['Salida', 1], ['Saldo', 1], ['C. prom.', 1], ['Saldo S/', 1]], k.map(r => [r.f, r.doc, r.det, r.e ? r.e[0] : '', r.s ? r.s[0] : '', U.int(r.q), r.cp.toFixed(4), U.money(r.val, '')])) }), { file: 'kardex_' + it.cod }));
    },
    paintStk() {
      const U = SIGA.ui;
      const est = r => r.stock === 0 ? 'Agotado' : r.stock < r.min ? 'Bajo mínimo' : r.stock < r.min * 1.5 ? 'Reponer pronto' : 'Normal';
      document.getElementById('l-tstk').innerHTML = U.grid({
        id: 'alm-stk', title: 'existencias', export: 'existencias_almacen', rows: L.items, record: itemRec, pageSize: 12,
        filter: { label: 'Estado', get: est },
        cols: [
          { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'desc', label: 'Bien', render: r => U.esc(r.desc) + (r.venc ? `<div class="mini">vence ${r.venc}</div>` : '') + (r.pendiente ? `<div class="mini">en curso: ${r.pendiente}</div>` : ''), csv: r => r.desc },
          { k: 'ubic', label: 'Ubicación' }, { k: 'stock', label: 'Stock', r: true, render: r => `<b>${U.int(r.stock)}</b> <span class="mini">${r.um.toLowerCase()}</span>`, csv: r => r.stock },
          { k: 'mm', label: 'Mín · Máx', r: true, nosort: true, render: r => r.min + ' · ' + r.max },
          { k: 'niv', label: 'Nivel', nosort: true, noexport: true, render: r => `<div class="mcell">${U.meter(r.max ? r.stock / r.max * 100 : 0, r.stock < r.min ? 'var(--danger)' : r.stock < r.min * 1.5 ? 'var(--warning)' : 'var(--primary)')}</div>` },
          { k: 'val', label: 'Valor S/', r: true, sv: r => r.stock * cpromDe(r.cod), render: r => U.money(r.stock * cpromDe(r.cod), '') },
          { k: 'est', label: 'Estado', sv: est, render: r => ({ 'Agotado': U.tag('Agotado', 't-red'), 'Bajo mínimo': U.tag('Bajo mínimo', 't-red'), 'Reponer pronto': U.tag('Reponer pronto', 't-amber'), 'Normal': U.tag('Normal', 't-green') })[est(r)] }
        ],
        rowCls: r => r.stock < r.min ? 'row-bad' : '',
        actions: [{ icon: 'fa-cart-plus', title: 'Reponer', show: r => r.stock < r.min && !r.pendiente, fn: r => this.pedir(r) }, { icon: 'fa-book-open', title: 'Kárdex', fn: r => irA(r.cod) }],
        tools: [{ icon: 'fa-plus', label: 'Nuevo bien', primary: true, fn: () => this.nuevoItem() }, { icon: 'fa-wand-magic-sparkles', label: 'Reponer todo lo bajo mínimo', fn: () => this.reponerTodo() }],
        bulk: [{ icon: 'fa-barcode', label: 'Imprimir etiquetas', fn: rs => etiquetas(rs) }, { icon: 'fa-cart-plus', label: 'Requerimiento consolidado', fn: rs => this.reponerTodo(rs) }],
        foot: rs => `<tr><td colspan="6" class="r"><b>Valor total de ${rs.length} bienes</b></td><td class="r num"><b>${U.money(rs.reduce((s, r) => s + r.stock * cpromDe(r.cod), 0), '')}</b></td><td></td><td></td></tr>`
      });
    },
    nuevoItem() {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-plus"></i> Alta de bien en el catálogo de almacén', [
        { k: 'cod', label: 'Código SIGA (catálogo MEF)', value: '7408050' + U.pad(Math.floor(Math.random() * 99999), 5), span: 1 }, { k: 'um', label: 'Unidad de medida', type: 'select', options: ['UNIDAD', 'CAJA', 'PAQUETE', 'MILLAR', 'SACO', 'GALÓN', 'KG', 'FRASCO', 'BOLSA'], span: 1 },
        { k: 'desc', label: 'Descripción' }, { k: 'ubic', label: 'Ubicación física', value: 'Central · A-03-01', span: 1 }, { k: 'cprom', label: 'Costo referencial S/', type: 'number', value: 10, span: 1 },
        { k: 'min', label: 'Stock mínimo', type: 'number', value: 10, span: 1 }, { k: 'max', label: 'Stock máximo', type: 'number', value: 100, span: 1 }
      ], v => {
        if (!v.desc.trim()) { U.toast('Ingrese la descripción del bien', 'err'); return; }
        if (item(v.cod)) { U.toast('El código ya existe en el catálogo', 'err'); return; }
        L.items.unshift({ cod: v.cod, desc: v.desc.trim(), um: v.um, ubic: v.ubic, stock: 0, min: +v.min || 0, max: +v.max || 0, cprom: +v.cprom || 0, nuevo: true });
        SIGA.log('Almacén', 'Alta de bien en catálogo', v.cod, '—', v.desc);
        U.closeModal(); U.toast('Bien <b>' + U.esc(v.desc) + '</b> incorporado al catálogo'); SIGA.refresh();
      }, 'Registrar bien');
    },
    reponerTodo(list) {
      const U = SIGA.ui, ab = SIGA.data.abastecimiento, sel = (list || L.items).filter(i => i.stock < i.min && !i.pendiente);
      if (!sel.length) { U.toast('No hay bienes bajo el mínimo sin pedido en curso', 'info'); return; }
      const tot = sel.reduce((s, i) => s + Math.max(1, i.max - i.stock) * i.cprom, 0);
      U.confirm(`Se generará un <b>requerimiento consolidado</b> de reposición por ${sel.length} bien(es) (${U.money(tot)} estimado) · regla mín.–máx.:<br><span class="mini">${sel.map(i => U.esc(i.desc.split(' · ')[0])).join(' · ')}</span>`, () => {
        const nreq = 'REQ 2026-' + U.pad(939 + ab.requerimientos.filter(x => x.nuevo).length, 4);
        ab.requerimientos.unshift({ num: nreq, fecha: SIGA.ctx.hoy, cc: 'Almacén central', desc: 'Reposición consolidada de stock · ' + sel.length + ' bienes', monto: Math.round(tot * 100) / 100, estado: 'En evaluación', user: SIGA.ctx.user.nombre, aprob: '', saldo: true, nuevo: true });
        sel.forEach(i => i.pendiente = nreq);
        SIGA.log('Almacén', 'Requerimiento consolidado de reposición', nreq, sel.length + ' bienes bajo mínimo', U.money(tot));
        U.toast(`${nreq} generado con ${sel.length} bienes y enviado a Abastecimiento`); SIGA.refresh();
      }, 'Generar requerimiento', '');
    },
    transferir(it) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-right-left"></i> Transferencia entre almacenes · ' + U.esc(it ? it.desc : ''), [
        { k: 'cod', label: 'Bien', type: 'select', options: L.items.filter(i => i.stock > 0).map(i => i.cod + ' · ' + i.desc), value: it ? it.cod + ' · ' + it.desc : '' },
        { k: 'dest', label: 'Almacén destino', type: 'select', options: ['Almacén Granja Zootecnia', 'Almacén Planta de Lácteos', 'Almacén Planta de Café', 'Almacén Campos agrícolas', 'Almacén Laboratorios'], span: 1 },
        { k: 'cant', label: 'Cantidad', type: 'number', value: 1, span: 1 }, { k: 'mot', label: 'Motivo', type: 'textarea', value: 'Atención de necesidades operativas del centro de producción' }
      ], v => {
        const x = item(v.cod.split(' · ')[0]), c = num(v.cant);
        if (!x || c <= 0 || c > x.stock) { U.toast('Cantidad inválida o mayor al stock disponible', 'err'); return; }
        const n = 'TRF-2026-' + U.pad(16 + L.transferencias.filter(t => t.nuevo).length, 3);
        const row = [n, SIGA.ctx.hoy, 'Almacén central', v.dest, x.desc.split(' · ')[0] + ' · ' + c + ' ' + x.um.toLowerCase(), 'En tránsito']; row.nuevo = true;
        L.transferencias.unshift(row); x.stock -= c; kpush(x, [SIGA.ctx.hoyCorta, n, 'Transferencia a ' + v.dest, 'S', c]);
        SIGA.log('Almacén', 'Transferencia entre almacenes', n, 'Almacén central', v.dest + ' · ' + c);
        U.closeModal(); U.toast(`${n} emitida · ${c} ${x.um.toLowerCase()} en tránsito a ${v.dest}`); SIGA.refresh();
      }, 'Emitir guía de transferencia');
    },
    baja(it) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-trash-can"></i> Proponer baja de bienes (L-10)', [
        { k: 'cod', label: 'Bien', type: 'select', options: L.items.filter(i => i.stock > 0).map(i => i.cod + ' · ' + i.desc), value: it ? it.cod + ' · ' + it.desc : '' },
        { k: 'cant', label: 'Cantidad', type: 'number', value: 1, span: 1 }, { k: 'causal', label: 'Causal', type: 'select', options: ['Vencimiento', 'Deterioro', 'Obsolescencia', 'Siniestro', 'Pérdida'], span: 1 },
        { k: 'inf', label: 'Informe técnico N.º', value: 'Informe técnico N.º 0' + (23 + L.bajas.filter(b => b.nuevo).length) + '-2026-ALM' }
      ], v => {
        const x = item(v.cod.split(' · ')[0]), c = num(v.cant);
        if (!x || c <= 0 || c > x.stock) { U.toast('Cantidad inválida o mayor al stock', 'err'); return; }
        const n = 'BAJ-2026-' + U.pad(5 + L.bajas.filter(b => b.nuevo).length, 3);
        const row = [n, SIGA.ctx.hoy, x.desc.split(' · ')[0] + ' · ' + c + ' ' + x.um.toLowerCase(), v.causal, v.inf, Math.round(c * cpromDe(x.cod) * 100) / 100, 'En trámite']; row.nuevo = true; row.cod = x.cod; row.cant = c;
        L.bajas.unshift(row);
        SIGA.log('Almacén', 'Propuesta de baja', n, '—', v.causal + ' · ' + U.money(row[5]));
        U.closeModal(); U.toast(`${n} registrada · pasa a la DGA para resolución`); SIGA.refresh();
      }, 'Registrar propuesta');
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
      const host = document.getElementById('l-p-otr');
      const trRec = { mod: 'Almacén', tipo: 'Guía de transferencia entre almacenes', key: r => r[0], estado: 5, cls: false,
        fields: r => [['N.º', `<span class="code">${r[0]}</span>`], ['Fecha', r[1]], ['Origen', r[2]], ['Destino', r[3]], ['Bienes', r[4], 1], ['Estado', U.tag(r[5], r[5] === 'Recibido' ? 't-green' : r[5] === 'Anulado' ? 't-red' : 't-amber')]],
        extra: r => r[5] === 'En tránsito' ? [{ icon: 'fa-circle-check', label: 'Confirmar recepción en destino', fn: x => { x[5] = 'Recibido'; SIGA.log('Almacén', 'Recepción de transferencia', x[0], 'En tránsito', 'Recibido · ' + x[3]); U.closeModal(); U.toast(x[0] + ' recibida en ' + x[3]); SIGA.refresh(); } }] : [],
        anular: true, canAnular: r => r[5] === 'En tránsito', anularLabel: 'Anular transferencia' };
      const baRec = { mod: 'Almacén', tipo: 'Resolución de baja de bienes', key: r => r[0], estado: 6, cls: false,
        fields: r => [['N.º', `<span class="code">${r[0]}</span>`], ['Fecha', r[1]], ['Bienes', r[2], 1], ['Causal', r[3]], ['Sustento', r[4]], ['Valor', U.money(r[5])], ['Estado', U.tag(r[6] || 'Aprobada', (r[6] || 'Aprobada') === 'Aprobada' ? 't-green' : r[6] === 'Anulado' ? 't-red' : 't-amber')]],
        extra: r => (r[6] === 'En trámite') ? [{ icon: 'fa-stamp', label: 'Aprobar con resolución (DGA)', fn: x => {
          if (!SIGA.sod(null, 'baja.aprobar')) return;
          const it = item(x.cod); if (it && x.cant) { it.stock -= x.cant; kpush(it, [SIGA.ctx.hoyCorta, x[0], 'Baja por ' + x[3].toLowerCase(), 'S', x.cant]); }
          x[6] = 'Aprobada'; x[4] = 'Res. Directoral N.º ' + (112 + L.bajas.filter(b => b[6] === 'Aprobada' && b.nuevo).length) + '-2026-DGA';
          SIGA.asiento('Baja de existencias · ' + x[0] + ' · ' + x[3], [['5301', x[5], 0], ['1301', 0, x[5]]], 'Almacén');
          SIGA.log('Almacén', 'Aprobación de baja', x[0], 'En trámite', 'Aprobada · ' + x[4]); U.closeModal(); U.toast(x[0] + ' aprobada · stock, kárdex y contabilidad actualizados'); SIGA.refresh(); } }] : [],
        anular: true, canAnular: r => r[6] === 'En trámite', anularLabel: 'Desestimar baja' };
      const cuRec = { mod: 'Almacén', tipo: 'Acta de custodia', key: r => r[0], estado: 4, cls: false,
        fields: r => [['N.º', `<span class="code">${r[0]}</span>`], ['Bien', r[1], 1], ['Propietario', r[2]], ['Devolución', r[3]], ['Estado', U.tag(r[4] || 'En custodia', r[4] === 'Devuelto' ? 't-gray' : 't-blue')]],
        edit: [{ k: 3, label: 'Fecha de devolución', get: r => r[3], set: (r, v) => r[3] = v }],
        extra: r => r[4] !== 'Devuelto' ? [{ icon: 'fa-rotate-left', label: 'Registrar devolución', fn: x => { x[4] = 'Devuelto'; SIGA.log('Almacén', 'Devolución de bien en custodia', x[0], 'En custodia', 'Devuelto a ' + x[2]); U.closeModal(); U.toast(x[0] + ' devuelto a ' + x[2]); SIGA.refresh(); } }] : [] };
      host.innerHTML = `<div class="card mb"><h3><span class="dot"></span>Transferencias entre almacenes <span class="grow">L-08 · guía de remisión interna</span></h3><div id="o-tr"></div></div>
        <div class="grid cols-2"><div class="card"><h3><span class="dot"></span>Baja de bienes <span class="grow">L-10 · con resolución</span></h3><div id="o-ba"></div></div>
        <div class="card"><h3><span class="dot"></span>Bienes en custodia o préstamo <span class="grow">L-09</span></h3><div id="o-cu"></div></div></div>`;
      host.querySelector('#o-tr').innerHTML = U.grid({ id: 'alm-tr', title: 'transferencias', rows: L.transferencias, record: trRec, pageSize: 6, rowCls: r => r.nuevo ? 'row-new' : '',
        cols: [{ k: 0, label: 'N.º', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Fecha' }, { k: 2, label: 'Origen' }, { k: 3, label: 'Destino' }, { k: 4, label: 'Bienes' }, { k: 5, label: 'Estado', render: r => U.tag(r[5], r[5] === 'Recibido' ? 't-green' : r[5] === 'Anulado' ? 't-red' : 't-amber') }],
        tools: [{ icon: 'fa-plus', label: 'Nueva transferencia', primary: true, fn: () => this.transferir() }] });
      host.querySelector('#o-ba').innerHTML = U.grid({ id: 'alm-ba', title: 'bajas', rows: L.bajas, record: baRec, pageSize: 6, rowCls: r => r.nuevo ? 'row-new' : '',
        cols: [{ k: 0, label: 'N.º', render: r => `<span class="code">${r[0]}</span>` }, { k: 2, label: 'Bienes', render: r => r[2] + `<div class="mini">${r[1]} · ${r[4]}</div>` }, { k: 3, label: 'Causal' }, { k: 5, label: 'Valor', r: true, render: r => U.money(r[5], '') }, { k: 6, label: 'Estado', render: r => U.tag(r[6] || 'Aprobada', (r[6] || 'Aprobada') === 'Aprobada' ? 't-green' : r[6] === 'Anulado' ? 't-red' : 't-amber') }],
        tools: [{ icon: 'fa-plus', label: 'Proponer baja', primary: true, fn: () => this.baja() }] });
      host.querySelector('#o-cu').innerHTML = U.grid({ id: 'alm-cu', title: 'custodia', rows: L.custodia, record: cuRec, pageSize: 6,
        cols: [{ k: 0, label: 'N.º', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Bien', render: r => r[1] + `<div class="mini">${r[2]}</div>` }, { k: 3, label: 'Devolución' }, { k: 4, label: 'Estado', render: r => U.tag(r[4] || 'En custodia', r[4] === 'Devuelto' ? 't-gray' : 't-blue') }],
        tools: [{ icon: 'fa-plus', label: 'Registrar', primary: true, fn: () => U.formModal('<i class="fa-solid fa-handshake"></i> Recepción de bien en custodia', [{ k: 'b', label: 'Bien' }, { k: 'p', label: 'Propietario / entidad' }, { k: 'f', label: 'Fecha de devolución', value: '31/12/2026', span: 1 }], v => { if (!v.b.trim()) { U.toast('Describa el bien', 'err'); return; } const n = 'CUS-2026-' + U.pad(5 + L.custodia.filter(c => c.nuevo).length, 3); const row = [n, v.b, v.p || '—', v.f]; row.nuevo = true; L.custodia.unshift(row); SIGA.log('Almacén', 'Recepción en custodia', n, '—', v.b); U.closeModal(); U.toast(n + ' registrado'); SIGA.refresh(); }, 'Registrar acta') }] });
    }
  });
})();
