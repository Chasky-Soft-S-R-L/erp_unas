/* ============================================================
   Control agrícola · campaña por parcela: superficie, labores culturales,
   insumos aplicados y rendimiento obtenido (pitch lámina 23 · informe 4.7.3)
   ============================================================ */
(function () {
  const G = SIGA.data.agricola;
  const parc = id => G.parcelas.find(p => p.id === id);
  const cHa = c => c.costo.reduce((s, x) => s + x, 0);
  const cKg = c => cHa(c) / ((c.rendReal || c.rendProg) * 1000);

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
      document.getElementById('cam-t').innerHTML = U.table([
        { k: 'id', label: 'Campaña', render: r => `<span class="code">${r.id}</span>` }, { k: 'c', label: 'Cultivo · parcela', render: r => r.cultivo + `<div class="mini">${parc(r.parcela).nom} · ${parc(r.parcela).ha} ha</div>` },
        { k: 's', label: 'Siembra → cosecha', render: r => r.siembra + ' → ' + r.cosecha }, { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, r.estado === 'Cerrada' ? 't-gray' : 't-teal') },
        { k: 'r', label: 'Rendimiento', r: true, render: r => r.rendReal ? `<b>${r.rendReal} t/ha</b>` : `<span class="mini">prog. ${r.rendProg} t/ha</span>` }
      ], G.campanas, { rowCls: r => r.nuevo ? 'row-new' : '' });
    },
    paintPar() {
      const U = SIGA.ui;
      document.getElementById('ag-par').innerHTML = U.table([{ k: 'id', label: 'Parcela', render: r => `<span class="code">${r.id}</span>` }, { k: 'nom', label: 'Nombre' }, { k: 'ha', label: 'Extensión', r: true, render: r => r.ha + ' ha' }, { k: 'ubic', label: 'Ubicación' }, { k: 'suelo', label: 'Suelo' }, { k: 'riego', label: 'Riego' }, { k: 'cultivo', label: 'Cultivo actual', render: r => U.tag(r.cultivo, 't-green') }], G.parcelas,
        { foot: `<tr><td></td><td style="font-weight:700">Total</td><td class="r num" style="font-weight:800">${G.parcelas.reduce((s, p) => s + p.ha, 0).toFixed(1)} ha</td><td colspan="4"></td></tr>` });
    },
    paintLab() {
      const U = SIGA.ui;
      document.getElementById('ag-p-lab').innerHTML = `<div class="split eq mb"><div class="card"><h3><span class="dot"></span>Labores culturales <span class="grow">CA-03 · mano de obra y maquinaria imputadas</span></h3><div id="lab-t"></div></div>
        <div class="card"><h3><span class="dot"></span>Insumos aplicados <span class="grow">CA-04 · salen del almacén de campo</span></h3><div id="ins-t"></div></div></div>
        <div class="card"><h3><span class="dot"></span>Riego <span class="grow">CA-05</span></h3><div id="rie-t"></div></div>`;
      document.getElementById('lab-t').innerHTML = U.table([{ k: 0, label: 'Fecha' }, { k: 1, label: 'Campaña', render: r => `<span class="code">${r[1]}</span>` }, { k: 2, label: 'Labor' }, { k: 3, label: 'Jornales', r: true }, { k: 4, label: 'H. máq.', r: true }, { k: 5, label: 'Costo', r: true, render: r => U.money(r[5], '') }], G.labores, { rowCls: r => r.nuevo ? 'row-new' : '' });
      document.getElementById('ins-t').innerHTML = U.table([{ k: 0, label: 'Fecha' }, { k: 1, label: 'Campaña', render: r => `<span class="code">${r[1]}</span>` }, { k: 2, label: 'Insumo' }, { k: 3, label: 'Dosis', cls: 'mini' }, { k: 4, label: 'Cantidad' }, { k: 5, label: 'Costo', r: true, render: r => U.money(r[5], '') }], G.insumos);
      document.getElementById('rie-t').innerHTML = U.table([{ k: 0, label: 'Fecha' }, { k: 1, label: 'Campaña', render: r => `<span class="code">${r[1]}</span>` }, { k: 2, label: 'Evento' }, { k: 3, label: 'Volumen' }, { k: 4, label: 'Costo', r: true, render: r => U.money(r[4], '') }], G.riego);
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
    labor() {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña');
      U.bigForm({
        title: 'Registrar labor cultural', icon: 'fa-person-digging', size: '',
        sections: [{ title: 'Labor', cols: 2, fields: [
          { k: 'camp', label: 'Campaña', type: 'select', options: act.map(c => c.id + ' · ' + c.cultivo.split(' · ')[0] + ' · ' + parc(c.parcela).nom), span: 2 },
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
    cosecha() {
      const U = SIGA.ui, act = G.campanas.filter(c => c.estado === 'En campaña');
      U.bigForm({
        title: 'Registrar cosecha y poscosecha', icon: 'fa-wheat-awn', size: '',
        sections: [{ title: 'Cosecha', cols: 2, fields: [
          { k: 'camp', label: 'Campaña', type: 'select', options: act.map(c => c.id + ' · ' + c.cultivo.split(' · ')[0] + ' · ' + parc(c.parcela).nom), span: 2 },
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
