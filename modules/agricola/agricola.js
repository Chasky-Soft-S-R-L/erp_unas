/* ============================================================
   Control agrícola · campaña por parcela: superficie, labores culturales,
   insumos aplicados y rendimiento obtenido (pitch lámina 23 · informe 4.7.3)
   ============================================================ */
(function () {
  const G = SIGA.data.agricola;
  const parc = id => G.parcelas.find(p => p.id === id);
  const cHa = c => c.costo.reduce((s, x) => s + x, 0);
  const cKg = c => cHa(c) / ((c.rendReal || c.rendProg) * 1000);

  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const AG = () => SIGA.modules.agricola;
  const camRec = SIGA.recs.campana = {
    mod: 'Control agrícola', tipo: 'Ficha de campaña agrícola', office: 'Centro de Producción · Campos de cultivo', key: c => c.id, title: c => c.id + ' · ' + c.cultivo, cls: false,
    fields: c => { const U = SIGA.ui, p = parc(c.parcela); return [['Campaña', c.id], ['Cultivo', c.cultivo], ['Parcela', p.id + ' · ' + p.nom + ' · ' + p.ha + ' ha', 1], ['Siembra → cosecha', c.siembra + ' → ' + c.cosecha], ['Fase', c.fase + ' · ' + c.avance + '%'], ['Rendimiento', c.rendReal ? c.rendReal + ' t/ha (real)' : c.rendProg + ' t/ha (programado)'], ['Costo por ha', U.money(cHa(c))], ['Costo total', U.money(cHa(c) * p.ha)], ['Costo por kg', 'S/ ' + cKg(c).toFixed(2)], ['Precio de venta', 'S/ ' + c.precio.toFixed(2) + ' por kg'], ['Estado', c.estado]]; },
    body: c => { const U = SIGA.ui, fi = G.fases.indexOf(c.fase), lab = G.labores.filter(l => l[1] === c.id); return `<div class="lbl-s mt mb">Fases del cultivo</div>` + U.timeline(G.fases.map((f, i) => ({ t: f, st: c.estado === 'Cerrada' || i < fi ? 'done' : i === fi ? 'cur' : '' }))) + (lab.length ? `<div class="lbl-s mt mb">Labores imputadas (${lab.length})</div>` + U.table([{ k: 0, label: 'Fecha' }, { k: 2, label: 'Labor' }, { k: 5, label: 'Costo', r: true, render: l => U.money(l[5]) }], lab) : ''); },
    edit: [{ k: 'fase', label: 'Fase', type: 'select', options: G.fases, span: 1 }, { k: 'avance', label: 'Avance %', type: 'number', span: 1 }, { k: 'cosecha', label: 'Fecha estimada de cosecha', span: 1 }, { k: 'precio', label: 'Precio de venta S/ por kg', type: 'number', span: 1 }],
    canEdit: c => c.estado === 'En campaña',
    extra: c => c.estado === 'En campaña' ? [{ icon: 'fa-person-digging', label: 'Registrar labor', fn: x => AG().labor(x) }, { icon: 'fa-wheat-awn', label: 'Registrar cosecha', fn: x => AG().cosecha(x) }] : [],
    anular: true, anularLabel: 'Anular campaña (siniestro)', anuladoValor: 'Siniestrada', canAnular: c => c.estado === 'En campaña',
    print: c => { const U = SIGA.ui, p = parc(c.parcela); return { tipo: 'Cuaderno de campo digital', num: c.id, pairs: [['Cultivo', c.cultivo], ['Parcela', p.nom + ' · ' + p.ha + ' ha'], ['Siembra', c.siembra], ['Cosecha', c.cosecha]],
      body: dtbl([['Fecha'], ['Labor'], ['Jornales', 1], ['H. máq.', 1], ['Costo', 1]], G.labores.filter(l => l[1] === c.id).map(l => [l[0], l[2], l[3], l[4], U.money(l[5], '')])) + dtbl([['Fecha'], ['Insumo'], ['Dosis'], ['Cantidad'], ['Costo', 1]], G.insumos.filter(l => l[1] === c.id).map(l => [l[0], l[2], l[3], l[4], U.money(l[5], '')])) + dtbl([['Estructura de costo por ha'], ['S/', 1]], ['Mano de obra', 'Maquinaria', 'Insumos', 'Riego', 'Otros'].map((n, i) => [n, U.money(c.costo[i], '')]).concat([['<b>Total por ha</b>', '<b>' + U.money(cHa(c), '') + '</b>']])) }; }
  };

  SIGA.registerModule('agricola', {
    title: 'Control agrícola', icon: 'fa-seedling', group: 'Centros de Producción · RDR', badge: 'NUEVO', badgeNew: true,
    alerts() {
      const c = G.campanas.find(x => x.id === 'C-2026-B01');
      return c && c.estado === 'En campaña' ? [{ lvl: 'info', icon: 'fa-wheat-awn', t: 'Cosecha de arroz en 18 días · ' + c.id, d: parc(c.parcela).nom + ' · ' + parc(c.parcela).ha + ' ha · programar maquinaria y sacos', fn: () => SIGA.showTab(document.getElementById('mod-root'), 'ag', 'cam') }] : [];
    },
    search(q) { return G.campanas.filter(c => (c.id + ' ' + c.cultivo).toLowerCase().includes(q)).map(c => ({ t: c.id + ' · ' + c.cultivo, d: parc(c.parcela).nom + ' · ' + c.fase })); },
    render(el) {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña');
      const ha = G.parcelas.reduce((s, p) => s + p.ha, 0);
      const arroz = act.filter(c => c.cultivo.startsWith('Arroz'));
      el.innerHTML = `
      <div class="page-head"><div><h1>Control agrícola</h1><p>Catastro de parcelas · campaña por parcela y cultivo · labores, insumos y riego con su costo · cosecha, poscosecha y rendimiento comparado</p></div>
        <div class="row-flex"><button class="btn ghost" id="ag-lab"><i class="fa-solid fa-person-digging"></i> Registrar labor</button><button class="btn" id="ag-cos"><i class="fa-solid fa-wheat-awn"></i> Registrar cosecha</button></div></div>
      ${U.kpis([
        { lab: 'Superficie en producción', val: ha.toFixed(1) + ' ha', sub: G.parcelas.length + ' parcelas registradas' },
        { lab: 'Campañas activas', val: act.length, sub: act.map(c => c.cultivo.split(' · ')[0]).join(' · ') },
        { lab: 'Costo por hectárea · arroz', val: U.money(arroz.reduce((s, c) => s + cHa(c), 0) / (arroz.length || 1)), sub: 'S/ ' + cKg(arroz[0]).toFixed(2) + ' por kg en cáscara' },
        { lab: 'Rendimiento programado', val: '6.5 t/ha', sub: 'arroz · campaña anterior 6.1–6.8 t/ha', chip: 'CA-09', chipType: 'info' }
      ])}
      <div class="cmp mb"><div class="asis"><h5>Hoy</h5>Hojas de cálculo por campaña: no se conoce el costo por hectárea ni se compara el rendimiento con campañas anteriores.</div>
        <div class="tobe"><h5>SIGA-U</h5>Cada labor, insumo y riego se imputa a su campaña con costo. El sistema calcula costo por hectárea, costo por kilo y rendimiento comparado.</div></div>
      <div class="seg-tabs" data-group="ag"><button class="on" data-tab="cam">Campañas</button><button data-tab="par">Parcelas</button><button data-tab="lab">Labores e insumos</button><button data-tab="cos">Costo por hectárea</button><button data-tab="ren">Rendimiento comparado</button></div>
      <div class="subpanel show" data-group="ag" data-panel="cam" id="ag-p-cam"></div>
      <div class="subpanel" data-group="ag" data-panel="par"><div class="card"><h3><span class="dot"></span>Catastro de parcelas <span class="grow">CA-01</span></h3><div id="ag-par"></div></div></div>
      <div class="subpanel" data-group="ag" data-panel="lab" id="ag-p-lab"></div>
      <div class="subpanel" data-group="ag" data-panel="cos" id="ag-p-cos"></div>
      <div class="subpanel" data-group="ag" data-panel="ren" id="ag-p-ren"></div>`;
      el.querySelector('#ag-lab').addEventListener('click', () => this.labor());
      el.querySelector('#ag-cos').addEventListener('click', () => this.cosecha());
      this.paintCam(); this.paintPar(); this.paintLab(); this.paintCos(); this.paintRen();
    },
    paintCam() {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña');
      document.getElementById('ag-p-cam').innerHTML = `<div class="grid cols-3 mb">${act.map(c => { const p = parc(c.parcela), fi = G.fases.indexOf(c.fase); return `<div class="card"><h3><span class="dot"></span>${c.cultivo.split(' · ')[0]} · ${p.nom}<span class="grow">${c.id}</span></h3>
        <div class="row-flex" style="justify-content:space-between"><span class="mini">${c.cultivo.split(' · ')[1] || ''} · ${p.ha} ha</span>${U.tag(c.fase, 't-teal')}</div>
        <div class="mt">${U.meter(c.avance, 'var(--primary)', 10)}</div><div class="row-flex mini" style="justify-content:space-between;margin-top:4px"><span>Siembra ${c.siembra}</span><span>${c.avance}%</span><span>Cosecha ${c.cosecha}</span></div>
        <div class="row-flex mt" style="gap:3px">${G.fases.map((f, i) => `<span title="${f}" style="flex:1;height:6px;border-radius:4px;background:${i < fi ? 'var(--primary)' : i === fi ? 'var(--secondary)' : 'var(--line)'}"></span>`).join('')}</div>
        <div class="ef-row mt"><span>Costo por ha</span><b>${U.money(cHa(c))}</b></div><div class="ef-row"><span>Costo total de la campaña</span><b>${U.money(cHa(c) * p.ha)}</b></div><div class="ef-row"><span>Producción esperada</span><b>${U.int(c.rendProg * p.ha * 1000)} kg</b></div><div class="ef-row"><span>Ingreso proyectado</span><b class="pos">${U.money(c.rendProg * p.ha * 1000 * c.precio)}</b></div></div>`; }).join('')}</div>
        <div class="split"><div class="card"><h3><span class="dot"></span>Todas las campañas <span class="grow">CA-02 · apertura por parcela y cultivo</span></h3><div id="cam-t"></div></div>
          <div class="card"><h3><span class="dot"></span>Platanera · cosecha continua <span class="grow">racimos por semana</span></h3>${U.chart.line({ labels: G.platano.labels, series: [{ name: 'Racimos cosechados', data: G.platano.racimosSem }], fmt: v => v + ' racimos', area: true, h: 180 })}<p class="mini mt">Plátano en racimo · 3.8 ha · venta a S/ 14.00 por racimo.</p></div></div>`;
      document.getElementById('cam-t').innerHTML = U.grid({ id: 'agr-cam', title: 'campañas', export: 'campanas_agricolas', rows: G.campanas, record: camRec, pageSize: 8, filter: { label: 'Estado', get: r => r.estado }, cols: [
        { k: 'id', label: 'Campaña', render: r => `<span class="code">${r.id}</span>` }, { k: 'c', label: 'Cultivo · parcela', render: r => r.cultivo + `<div class="mini">${parc(r.parcela).nom} · ${parc(r.parcela).ha} ha</div>` },
        { k: 's', label: 'Siembra → cosecha', render: r => r.siembra + ' → ' + r.cosecha }, { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, r.estado === 'Cerrada' ? 't-gray' : 't-teal') },
        { k: 'r', label: 'Rendimiento', r: true, sv: r => r.rendReal || r.rendProg, render: r => r.rendReal ? `<b>${r.rendReal} t/ha</b>` : `<span class="mini">prog. ${r.rendProg} t/ha</span>` }
      ], rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-person-digging', title: 'Registrar labor', show: r => r.estado === 'En campaña', fn: c => this.labor(c) }, { icon: 'fa-book', title: 'Cuaderno de campo', fn: c => U.rec(camRec).imprimir(c) }],
        tools: [{ icon: 'fa-plus', label: 'Abrir campaña', primary: true, fn: () => this.abrir() }] });
    },
    paintPar() {
      const U = SIGA.ui;
      const pRec = { mod: 'Control agrícola', tipo: 'Ficha de parcela', key: r => r.id, title: r => r.id + ' · ' + r.nom, cls: false,
        fields: r => [['Parcela', r.id], ['Nombre', r.nom], ['Extensión', r.ha + ' ha'], ['Ubicación', r.ubic, 1], ['Suelo', r.suelo], ['Riego', r.riego], ['Cultivo actual', r.cultivo]],
        body: r => { const cs = G.campanas.filter(c => c.parcela === r.id); return `<div class="lbl-s mt mb">Historial de campañas (${cs.length})</div>` + U.table([{ k: 'id', label: 'Campaña' }, { k: 'cultivo', label: 'Cultivo' }, { k: 'r', label: 'Rendimiento', r: true, render: c => (c.rendReal || c.rendProg) + ' t/ha' + (c.rendReal ? '' : ' (prog.)') }, { k: 'estado', label: 'Estado' }], cs, { onRow: c => U.rec(camRec).ver(c) }); },
        edit: [{ k: 'suelo', label: 'Tipo de suelo', span: 1 }, { k: 'riego', label: 'Sistema de riego', span: 1 }, { k: 'cultivo', label: 'Cultivo actual', span: 1 }, { k: 'ha', label: 'Extensión (ha)', type: 'number', span: 1 }],
        extra: r => [{ icon: 'fa-flask', label: 'Solicitar análisis de suelo', fn: x => { U.closeModal(); SIGA.log('Control agrícola', 'Solicitud de análisis de suelo', x.id, '—', 'Laboratorio de análisis de suelos'); U.toast('Solicitud de análisis de fertilidad enviada al laboratorio · ' + x.id); } }] };
      document.getElementById('ag-par').innerHTML = U.grid({ id: 'agr-par', title: 'parcelas', export: 'parcelas', rows: G.parcelas, record: pRec, search: false, cols: [{ k: 'id', label: 'Parcela', render: r => `<span class="code">${r.id}</span>` }, { k: 'nom', label: 'Nombre' }, { k: 'ha', label: 'Extensión', r: true, render: r => r.ha + ' ha' }, { k: 'ubic', label: 'Ubicación' }, { k: 'suelo', label: 'Suelo' }, { k: 'riego', label: 'Riego' }, { k: 'cultivo', label: 'Cultivo actual', render: r => U.tag(r.cultivo, 't-green') }],
        foot: `<tr><td></td><td style="font-weight:700">Total</td><td class="r num" style="font-weight:800">${G.parcelas.reduce((s, p) => s + p.ha, 0).toFixed(1)} ha</td><td colspan="5"></td></tr>` });
    },
    paintLab() {
      const U = SIGA.ui;
      document.getElementById('ag-p-lab').innerHTML = `<div class="split eq mb"><div class="card"><h3><span class="dot"></span>Labores culturales <span class="grow">CA-03 · mano de obra y maquinaria imputadas</span></h3><div id="lab-t"></div></div>
        <div class="card"><h3><span class="dot"></span>Insumos aplicados <span class="grow">CA-04 · salen del almacén de campo</span></h3><div id="ins-t"></div></div></div>
        <div class="card"><h3><span class="dot"></span>Riego <span class="grow">CA-05</span></h3><div id="rie-t"></div></div>`;
      const lRec = (tipo, iCost) => ({ mod: 'Control agrícola', tipo, key: r => r[1] + ' ' + r[0] + ' ' + r[2], title: r => r[2] + ' · ' + r[1], estado: 9, cls: false,
        fields: r => r.map((v, i) => [['Fecha', 'Campaña', tipo === 'Labor cultural' ? 'Labor' : tipo === 'Riego' ? 'Evento' : 'Insumo', tipo === 'Labor cultural' ? 'Jornales' : tipo === 'Riego' ? 'Volumen' : 'Dosis', tipo === 'Labor cultural' ? 'Horas-máquina' : tipo === 'Riego' ? 'Costo' : 'Cantidad', 'Costo'][i], i === iCost ? U.money(v) : v]).filter(x => x[0]),
        extra: r => [{ icon: 'fa-seedling', label: 'Ver campaña', fn: x => { const c = G.campanas.find(k => k.id === x[1]); if (c) U.rec(camRec).ver(c); } }],
        anular: true, anularLabel: 'Anular registro' });
      const cols = (a, b, ic) => [{ k: 0, label: 'Fecha', sv: r => r[0].slice(3) + r[0].slice(0, 2) }, { k: 1, label: 'Campaña', render: r => `<span class="code">${r[1]}</span>` }, ...a, { k: ic, label: 'Costo', r: true, render: r => r.anulado ? `<s>${U.money(r[ic], '')}</s>` : U.money(r[ic], '') }];
      document.getElementById('lab-t').innerHTML = U.grid({ id: 'agr-lab', title: 'labores', export: 'labores_culturales', rows: G.labores, record: lRec('Labor cultural', 5), pageSize: 8, filter: { label: 'Campaña', get: r => r[1] }, cols: cols([{ k: 2, label: 'Labor' }, { k: 3, label: 'Jornales', r: true }, { k: 4, label: 'H. máq.', r: true }], 0, 5), rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        tools: [{ icon: 'fa-plus', label: 'Labor', primary: true, fn: () => this.labor() }], foot: rs => `<tr><td colspan="6" class="r"><b>Total</b></td><td class="r num"><b>${U.money(rs.filter(r => !r.anulado).reduce((s, r) => s + r[5], 0), '')}</b></td><td></td></tr>` });
      document.getElementById('ins-t').innerHTML = U.grid({ id: 'agr-ins', title: 'insumos', export: 'insumos_aplicados', rows: G.insumos, record: lRec('Aplicación de insumo', 5), pageSize: 8, filter: { label: 'Campaña', get: r => r[1] }, cols: cols([{ k: 2, label: 'Insumo' }, { k: 3, label: 'Dosis', cls: 'mini' }, { k: 4, label: 'Cantidad' }], 0, 5), rowCls: r => r.anulado ? 'row-void' : '',
        tools: [{ icon: 'fa-plus', label: 'Aplicación', primary: true, fn: () => this.insumo() }], foot: rs => `<tr><td colspan="6" class="r"><b>Total</b></td><td class="r num"><b>${U.money(rs.filter(r => !r.anulado).reduce((s, r) => s + r[5], 0), '')}</b></td><td></td></tr>` });
      document.getElementById('rie-t').innerHTML = U.grid({ id: 'agr-rie', title: 'riegos', export: 'riegos', rows: G.riego, record: lRec('Riego', 4), search: false, cols: cols([{ k: 2, label: 'Evento' }, { k: 3, label: 'Volumen' }], 0, 4), rowCls: r => r.anulado ? 'row-void' : '' });
    },
    insumo() {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña'), its = SIGA.data.almacen.items.filter(i => /Campo|Granja|Planta/.test(i.ubic) || /Urea|fosfato|semilla/i.test(i.desc));
      U.formModal('<i class="fa-solid fa-flask"></i> Aplicación de insumo (sale del almacén de campo)', [
        { k: 'c', label: 'Campaña', type: 'select', options: act.map(c => c.id + ' · ' + c.cultivo.split(' · ')[0] + ' · ' + parc(c.parcela).nom) },
        { k: 'i', label: 'Insumo', type: 'select', options: its.map(i => i.cod + ' · ' + i.desc + ' · stock ' + i.stock) }, { k: 'd', label: 'Dosis', value: '2 sacos/ha', span: 1 }, { k: 'q', label: 'Cantidad', type: 'number', value: 5, span: 1 }
      ], v => {
        const c = G.campanas.find(x => x.id === v.c.split(' · ')[0]), it = SIGA.data.almacen.items.find(x => x.cod === v.i.split(' · ')[0]), q = parseFloat(v.q) || 0;
        if (!it || q <= 0 || q > it.stock) { U.toast('Cantidad inválida o sin stock suficiente en el almacén', 'err'); return; }
        const n = SIGA.data.abastecimiento.docTipos.pec.num, costo = Math.round(q * SIGA.alm.cprom(it.cod) * 100) / 100;
        SIGA.alm.salida([{ cod: it.cod, cant: q }], 'Campaña ' + c.id, 'PECOSA ' + n, 'Jefe del Centro de Producción'); SIGA.data.abastecimiento.docTipos.pec.num = U.pad(+n + 1, n.length);
        G.insumos.unshift(Object.assign([SIGA.ctx.hoyCorta, c.id, it.desc.split(' · ')[0], v.d, q + ' ' + it.um.toLowerCase(), costo], { nuevo: true }));
        SIGA.asiento('Consumo de insumos · ' + c.id + ' · PECOSA ' + n, [['5301', costo, 0], ['1301', 0, costo]], 'Almacén');
        SIGA.log('Control agrícola', 'Aplicación de insumo', c.id, '—', it.desc + ' · ' + q + ' · PECOSA ' + n);
        U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'ag', 'lab'); U.toast(`Insumo aplicado a ${c.id} · PECOSA ${n} · kárdex y costo de la campaña actualizados`);
      }, 'Registrar aplicación');
    },
    abrir() {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-seedling"></i> Apertura de campaña agrícola', [
        { k: 'p', label: 'Parcela', type: 'select', options: G.parcelas.filter(p => !G.campanas.some(c => c.parcela === p.id && c.estado === 'En campaña')).map(p => p.id + ' · ' + p.nom + ' · ' + p.ha + ' ha') },
        { k: 'c', label: 'Cultivo y variedad', value: 'Maíz amarillo duro · INIA 619' }, { k: 's', label: 'Fecha de siembra', value: '01/09/2026', span: 1 }, { k: 'k', label: 'Cosecha estimada', value: '15/01/2027', span: 1 },
        { k: 'r', label: 'Rendimiento programado (t/ha)', type: 'number', value: 5.2, span: 1 }, { k: 'pr', label: 'Precio esperado S/ por kg', type: 'number', value: 1.3, span: 1 }
      ], v => {
        if (!v.p) { U.toast('No hay parcelas libres', 'err'); return; }
        const id = 'C-2026-' + (/^.. /.test(v.p) ? '' : '') + 'C' + String(G.campanas.filter(c => c.id.startsWith('C-2026-C')).length + 1).padStart(2, '0');
        G.campanas.unshift({ id, parcela: v.p.split(' · ')[0], cultivo: v.c, siembra: v.s, cosecha: v.k, fase: 'Preparación', avance: 0, rendProg: parseFloat(v.r) || 0, rendReal: null, precio: parseFloat(v.pr) || 0, costo: [1650, 980, 1920, 0, 210], estado: 'En campaña', nuevo: true });
        SIGA.log('Control agrícola', 'Apertura de campaña', id, '—', v.c + ' · ' + v.p);
        U.closeModal(); SIGA.refresh(); U.toast('Campaña ' + id + ' abierta · costos estándar por ha cargados');
      }, 'Abrir campaña');
    },
    paintCos() {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña'), comp = ['Mano de obra', 'Maquinaria', 'Insumos', 'Riego', 'Otros'];
      document.getElementById('ag-p-cos').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Estructura del costo por hectárea <span class="grow">CA-08 · soles por ha</span></h3>
        ${U.chart.cols({ labels: comp, series: act.map((c, i) => ({ name: c.id.replace('C-2026-', '') + ' · ' + c.cultivo.split(' · ')[0], data: c.costo })), fmt: v => U.money(v), axFmt: v => U.int(v), h: 240 })}</div>
        <div class="card"><h3><span class="dot"></span>Costo unitario de producción</h3>${U.table([{ k: 'id', label: 'Campaña', render: r => `<span class="code">${r.id}</span>` }, { k: 'h', label: 'Costo/ha', r: true, render: r => U.money(cHa(r), '') }, { k: 'k', label: 'Costo/kg', r: true, render: r => 'S/ ' + cKg(r).toFixed(2) }, { k: 'p', label: 'Precio/kg', r: true, render: r => 'S/ ' + r.precio.toFixed(2) }, { k: 'm', label: 'Margen', render: r => { const m = (r.precio - cKg(r)) / r.precio * 100; return U.tag(m.toFixed(0) + '%', m > 15 ? 't-green' : 't-amber'); } }], G.campanas)}</div></div>`;
    },
    paintRen() {
      const U = SIGA.ui, par = [['P-01 · Arroz', 'C-2026-B01', 'C-2026-A01'], ['P-02 · Arroz', 'C-2026-B02', 'C-2026-A02'], ['P-03 · Maíz', 'C-2026-B03', 'C-2025-B03']];
      const f = id => G.campanas.find(c => c.id === id);
      document.getElementById('ag-p-ren').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Rendimiento comparado <span class="grow">CA-09 · t/ha · programado vs campaña anterior vs actual</span></h3>
        ${U.chart.cols({ labels: par.map(p => p[0]), series: [{ name: 'Programado', data: par.map(p => f(p[1]).rendProg), color: '#94A3B8' }, { name: 'Campaña anterior', data: par.map(p => f(p[2]).rendReal) }, { name: 'Campaña actual', data: par.map(p => f(p[1]).rendReal || 0) }], fmt: v => v ? v.toFixed(1) + ' t/ha' : 'en curso', axFmt: v => v.toFixed(1), h: 240 })}</div>
        <div class="card"><h3><span class="dot"></span>Lectura</h3><div class="checklist">${par.map(p => { const a = f(p[2]), b = f(p[1]); const d = (a.rendReal / b.rendProg - 1) * 100; return `<div class="ck ${d >= 0 ? 'ok' : ''}"><i class="fa-solid ${d >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}" style="color:${d >= 0 ? 'var(--ok)' : 'var(--danger)'}"></i><span>${p[0]} · campaña anterior ${a.rendReal} t/ha</span><em>${d >= 0 ? '+' : ''}${d.toFixed(0)}% vs programado</em></div>`; }).join('')}</div>
          <p class="mini mt">La campaña actual completa su barra al registrar la cosecha. La comparación permite investigar las causas del menor rendimiento del maíz en 2025 (sequía de agosto).</p></div></div>`;
    },
    labor(pre) {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña'), lab = c => c.id + ' · ' + c.cultivo.split(' · ')[0] + ' · ' + parc(c.parcela).nom;
      U.bigForm({
        title: 'Registrar labor cultural', icon: 'fa-person-digging', size: '',
        sections: [{ title: 'Labor', cols: 2, fields: [
          { k: 'camp', label: 'Campaña', type: 'select', options: act.map(lab), value: pre && pre.id ? lab(pre) : undefined, span: 2 },
          { k: 'labor', label: 'Labor', type: 'select', options: ['Deshierbo', 'Fertilización', 'Control fitosanitario', 'Riego', 'Aporque', 'Cosecha', 'Secado', 'Pilado'], span: 1 },
          { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1 },
          { k: 'jor', label: 'Jornales', type: 'number', value: 4, span: 1 }, { k: 'tar', label: 'Costo por jornal S/', type: 'number', value: 65, span: 1 },
          { k: 'hm', label: 'Horas de maquinaria', type: 'number', value: 0, span: 1 }, { k: 'thm', label: 'Costo hora-máquina S/', type: 'number', value: 140, span: 1 }
        ] }],
        totals: (r, v) => { const t = (+v.jor || 0) * (+v.tar || 0) + (+v.hm || 0) * (+v.thm || 0); return [{ label: 'Costo imputado a la campaña S/', val: U.money(t, ''), big: true }]; },
        submitLabel: 'Registrar labor',
        onSubmit: v => {
          const t = (+v.jor || 0) * (+v.tar || 0) + (+v.hm || 0) * (+v.thm || 0), id = v.camp.split(' · ')[0];
          G.labores.unshift(Object.assign([U.dmy(v.fecha).slice(0, 5), id, v.labor, +v.jor || 0, +v.hm || 0, t], { nuevo: true }));
          SIGA.log('Control agrícola', 'Registro de labor', id, '—', v.labor + ' · ' + U.money(t));
          U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'ag', 'lab'); U.toast(`Labor "${v.labor}" imputada a ${id} · ${U.money(t)}`);
        }
      });
    },
    cosecha(pre) {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña'), lab = c => c.id + ' · ' + c.cultivo.split(' · ')[0] + ' · ' + parc(c.parcela).nom;
      U.bigForm({
        title: 'Registrar cosecha y poscosecha', icon: 'fa-wheat-awn', size: '',
        sections: [{ title: 'Cosecha', cols: 2, fields: [
          { k: 'camp', label: 'Campaña', type: 'select', options: act.map(lab), value: pre && pre.id ? lab(pre) : undefined, span: 2 },
          { k: 'fecha', label: 'Fecha de cosecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1 }, { k: 'kg', label: 'Cosecha en campo (kg)', type: 'number', value: 56100, span: 1 },
          { k: 'hum', label: 'Humedad de cosecha %', type: 'number', value: 22, span: 1 }, { k: 'hfin', label: 'Humedad tras secado %', type: 'number', value: 14, span: 1 }
        ] }],
        status: (r, v) => { const c = G.campanas.find(x => x.id === v.camp.split(' · ')[0]), p = parc(c.parcela), seco = (+v.kg || 0) * (100 - (+v.hum || 0)) / (100 - (+v.hfin || 0)), rend = seco / p.ha / 1000; return `<div class="note ${rend >= c.rendProg ? 'teal' : 'amber'}"><i class="fa-solid fa-scale-balanced"></i><div>Peso seco: <b>${U.int(Math.round(seco))} kg</b> · rendimiento <b>${rend.toFixed(2)} t/ha</b> frente a ${c.rendProg} t/ha programado (${((rend / c.rendProg - 1) * 100).toFixed(0)}%). Costo: S/ ${(cHa(c) / (rend * 1000)).toFixed(2)} por kg.</div></div>`; },
        submitLabel: 'Registrar cosecha',
        onSubmit: v => {
          const c = G.campanas.find(x => x.id === v.camp.split(' · ')[0]), p = parc(c.parcela), seco = (+v.kg || 0) * (100 - (+v.hum || 0)) / (100 - (+v.hfin || 0));
          c.rendReal = Math.round(seco / p.ha / 100) / 10; c.fase = 'Poscosecha'; c.avance = 100; c.estado = 'Cerrada'; c.nuevo = true;
          const cu = cHa(c) / (c.rendReal * 1000);
          SIGA.alm?.ingreso([{ cod: 'AGR-' + c.id, desc: c.cultivo.split(' · ')[0] + ' en cáscara · ' + c.id, um: 'KG', cant: Math.round(seco), pu: cu }], 'NIPT ' + c.id.slice(-3), '', 'Campos de cultivo');
          SIGA.asiento('Ingreso de cosecha ' + c.id + ' al almacén', [['1302', seco * cu, 0], ['1301', 0, seco * cu]], 'Centro de producción');
          SIGA.log('Control agrícola', 'Registro de cosecha', c.id, 'Rend. prog. ' + c.rendProg + ' t/ha', 'Rend. real ' + c.rendReal + ' t/ha');
          U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'ag', 'ren'); U.toast(`Cosecha de ${c.id}: ${c.rendReal} t/ha · ${U.int(Math.round(seco))} kg ingresados al almacén con su costo`);
        }
      });
    }
  });
})();
