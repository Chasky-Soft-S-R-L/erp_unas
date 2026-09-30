/* Control pecuario · ciclo de vida animal por especie (informe 4.7.2 · Tabla 33) */
SIGA.registerModule('pecuario', {
  title: 'Control pecuario', icon: 'fa-cow', group: 'Centros de Producción · RDR', badge: 'CICLO', badgeHot: true,
  esp: 'porcino',
  alerts() {
    const D = SIGA.data.pecuario, out = [];
    out.push({ lvl: 'warn', icon: 'fa-baby', t: 'Parto probable · marrana M-021 en 2 días', d: 'Granja porcina · preparar paridera (114 días desde el servicio del 28/04)', fn: () => { this.esp = 'porcino'; SIGA.refresh(); } });
    Object.entries(D).forEach(([k, e]) => e.sanidad.filter(s => s[3] === 'Programada' && ['20/08/2026', '21/08/2026', '22/08/2026'].includes(s[0])).forEach(s => out.push({ lvl: 'info', icon: 'fa-syringe', t: `${s[1]} · ${s[0].slice(0, 5)}`, d: e.nombre + ' · ' + s[2], fn: () => { this.esp = k; SIGA.refresh(); } })));
    return out;
  },
  search(q) {
    const out = [];
    Object.entries(SIGA.data.pecuario).forEach(([k, e]) => e.animales.filter(a => (a[0] + ' ' + a[1] + ' ' + a[2]).toLowerCase().includes(q)).forEach(a => out.push({ t: a[0] + ' · ' + a[1], d: e.nombre + ' · ' + a[7], fn: () => { this.esp = k; SIGA.refresh(); } })));
    return out;
  },
  render(el) {
    const U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Control pecuario · ciclo de vida animal</h1><p>Registro zootécnico: población, nacimientos, destete, engorde, saca, sanidad y mortalidad · índices calculados por especie</p></div>
        <button class="btn" id="pc-ev"><i class="fa-solid fa-plus"></i> Registrar evento</button></div>
      <div class="note info"><i class="fa-solid fa-cow"></i><div>Cada especie se controla a lo largo de todo su ciclo —del nacimiento a la saca—. La estructura de etapas y eventos es parametrizable: incorporar una nueva especie no requiere desarrollo adicional. Las alertas avisan partos, vacunaciones y desviaciones antes de que ocurran.</div></div>
      <div class="seg-tabs" id="esp-tabs">
        <button data-e="porcino"><i class="fa-solid fa-piggy-bank"></i> Porcinos</button><button data-e="aves"><i class="fa-solid fa-dove"></i> Aves</button>
        <button data-e="cuyes"><i class="fa-solid fa-paw"></i> Cuyes</button><button data-e="vacunos"><i class="fa-solid fa-cow"></i> Vacunos</button></div>
      <div id="pec-kpis" class="grid cols-4" style="margin-bottom:14px"></div>
      <div class="seg-tabs" data-group="pc"><button class="on" data-tab="ciclo">Ciclo y eventos</button><button data-tab="ani">Animales y lotes</button><button data-tab="san">Calendario sanitario</button><button data-tab="prd">Productividad</button></div>
      <div class="subpanel show" data-group="pc" data-panel="ciclo">
        <div class="card mb"><h3><span class="dot"></span>Ciclo de vida <span class="grow" id="pec-sub"></span></h3>
          <div id="pec-ciclo" style="display:flex;gap:0;overflow-x:auto;padding-bottom:4px"></div><p class="mini" id="pec-note" style="margin-top:12px"></p></div>
        <div class="split"><div class="card"><h3><span class="dot"></span>Registro de eventos del ciclo <span class="grow">últimos movimientos</span></h3><div id="pec-ev"></div></div>
          <div><div class="card mb"><h3><span class="dot"></span>Índices zootécnicos</h3><div id="pec-ind" style="display:flex;flex-direction:column;gap:9px"></div></div>
            <div class="saldo-box"><div class="lab" id="pec-plab"></div><div class="big" id="pec-pval" style="color:var(--primary-light)"></div>
              <div class="row"><span id="pec-r1l"></span><span class="g" id="pec-r1v"></span></div><div class="row"><span id="pec-r2l"></span><span id="pec-r2v"></span></div></div></div></div></div>
      <div class="subpanel" data-group="pc" data-panel="ani"><div class="card"><h3><span class="dot"></span>Fichas individuales y lotes <span class="grow">identificación, genealogía, último y próximo evento</span></h3><div id="pec-ani"></div></div></div>
      <div class="subpanel" data-group="pc" data-panel="san"><div class="card"><h3><span class="dot"></span>Calendario sanitario <span class="grow">vacunaciones, dosificaciones y controles con alerta</span></h3><div id="pec-san"></div></div></div>
      <div class="subpanel" data-group="pc" data-panel="prd"><div class="split"><div class="card"><h3><span class="dot"></span><span id="pec-ctit"></span></h3><div id="pec-chart"></div></div>
        <div><div class="card mb"><h3><span class="dot"></span>Alimentación y costo</h3><div id="pec-ali"></div></div><div class="card"><h3><span class="dot"></span>Mortalidad por causa · agosto</h3><div id="pec-cau"></div></div></div></div></div>`;
    el.querySelector('#esp-tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; this.esp = b.dataset.e; this.paint(el); });
    el.querySelector('#pc-ev').addEventListener('click', () => this.evModal(el));
    this.paint(el);
  },

  paint(el) {
    const U = SIGA.ui, d = SIGA.data.pecuario[this.esp];
    el.querySelectorAll('#esp-tabs button').forEach(x => x.classList.toggle('on', x.dataset.e === this.esp));
    el.querySelector('#pec-kpis').innerHTML = d.kpis.map(k => `<div class="card kpi"><div class="lab"><i class="fa-solid ${k[0]}"></i> ${k[1]}</div><div class="val">${k[2]}</div><div class="sub">${k[3]}</div></div>`).join('');
    el.querySelector('#pec-sub').textContent = d.sub; el.querySelector('#pec-note').textContent = d.note;
    el.querySelector('#pec-ciclo').innerHTML = d.ciclo.map((s, i) => `<div style="min-width:118px;flex:1;border:1px solid var(--line);border-top:3px solid ${s[3]};border-radius:10px;padding:12px 10px;text-align:center;background:#fff"><div style="font-size:24px;font-weight:800;color:${s[3]}">${s[1]}</div><div style="font-size:11.5px;font-weight:700;margin-top:2px">${s[0]}</div><div class="mini" style="margin-top:2px">${s[2]}</div></div>${i < d.ciclo.length - 1 ? '<div style="display:flex;align-items:center;color:var(--primary);font-size:20px;font-weight:800;padding:0 2px">›</div>' : ''}`).join('');
    const cls = { Parto: 't-green', Nacimiento: 't-green', Ingreso: 't-green', Destete: 't-blue', Saca: 't-amber', Beneficio: 't-amber', Ordeño: 't-teal', Recolección: 't-teal', Mortalidad: 't-red', Descarte: 't-gray', Empadre: 't-blue', Inseminación: 't-blue', Vacunación: 't-teal', Sanidad: 't-teal', Secado: 't-gray', Pesaje: 't-blue', 'Cambio de etapa': 't-blue' };
    el.querySelector('#pec-ev').innerHTML = U.table([{ k: 0, label: 'Fecha', cls: 'num' }, { k: 1, label: 'Evento', render: r => U.tag(r[1], cls[r[1]] || 't-gray') }, { k: 2, label: 'Lote / categoría' }, { k: 3, label: 'Cant.', r: true }, { k: 4, label: 'Detalle', cls: 'mini' }], d.eventos, { rowCls: r => r.nuevo ? 'row-new' : '' });
    el.querySelector('#pec-ind').innerHTML = d.indices.map(x => `<div class="row-flex" style="justify-content:space-between"><span class="mini">${x[0]}</span><b>${x[1]}</b></div>`).join('');
    ['plab', 'pval', 'r1l', 'r1v', 'r2l', 'r2v'].forEach(k => el.querySelector('#pec-' + k).textContent = d.prod[{ plab: 'lab', pval: 'val' }[k] || k]);
    el.querySelector('#pec-ani').innerHTML = U.table([
      { k: 0, label: 'Identificación', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Categoría' }, { k: 2, label: 'Raza / línea' }, { k: 3, label: 'Nacimiento / ingreso' },
      { k: 4, label: 'Datos productivos', cls: 'mini' }, { k: 5, label: 'Último evento' }, { k: 6, label: 'Próximo evento', render: r => /probable|estimad|Destete|Saca/.test(r[6]) ? `<b>${r[6]}</b>` : r[6] }, { k: 7, label: 'Estado', render: r => U.tag(r[7], 't-teal') }
    ], d.animales);
    el.querySelector('#pec-san').innerHTML = U.table([
      { k: 0, label: 'Fecha' }, { k: 1, label: 'Actividad sanitaria' }, { k: 2, label: 'Lote / animales' }, { k: 3, label: 'Estado', render: r => U.tag(r[3], r[3] === 'Aplicada' ? 't-green' : 't-amber') }
    ], d.sanidad, {
      actions: [{ icon: 'fa-syringe', title: 'Registrar aplicación', show: r => r[3] === 'Programada', fn: r => {
        r[3] = 'Aplicada'; d.eventos.unshift(Object.assign([SIGA.ctx.hoyCorta, 'Vacunación', r[2], (r[2].match(/\((\d+)\)/) || [0, '—'])[1], r[1]], { nuevo: true }));
        SIGA.log('Control pecuario', 'Aplicación sanitaria', d.nombre + ' · ' + r[2], 'Programada', 'Aplicada · ' + r[1]); U.toast(r[1] + ' registrada en ' + r[2]); this.paint(el);
      } }]
    });
    const c = d.curva; el.querySelector('#pec-ctit').textContent = c.titulo;
    el.querySelector('#pec-chart').innerHTML = U.chart.line({ labels: c.labels, series: [{ name: c.stdName || 'Estándar de la línea', data: c.std, color: '#94A3B8', dash: true }, { name: 'Real', data: c.real, color: '#14967D' }], fmt: v => (c.fmt === '%' ? v.toFixed(1) + '%' : c.fmt === 'L' ? U.int(v) + ' L' : v.toFixed(2) + ' kg'), axFmt: v => c.fmt === 'kg' && v < 5 ? v.toFixed(1) : U.int(v), yMax: c.fmt === '%' ? 100 : null, h: 240 });
    el.querySelector('#pec-ali').innerHTML = d.alimento.map(a => `<div class="ef-row"><span>${a[0]}</span><b>${a[1]}</b></div>`).join('');
    const mx = Math.max(1, ...d.causas.map(x => x[1]));
    el.querySelector('#pec-cau').innerHTML = U.bars(d.causas.map(x => [x[0], x[1] / mx * 100, 'var(--danger)', x[1] + ' casos']));
  },

  evModal(el) {
    const U = SIGA.ui, d = SIGA.data.pecuario[this.esp];
    U.bigForm({
      title: 'Registrar evento del ciclo · ' + d.nombre, icon: 'fa-clipboard-list',
      sections: [
        { title: 'Datos del evento', cols: 3, fields: [
          { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1, required: true },
          { k: 'tipo', label: 'Tipo de evento', type: 'select', options: ['Nacimiento', 'Parto', 'Destete', 'Cambio de etapa', 'Saca', 'Beneficio', 'Mortalidad', 'Descarte', 'Empadre', 'Inseminación', 'Vacunación', 'Pesaje', 'Ordeño', 'Recolección'], span: 1, required: true },
          { k: 'responsable', label: 'Responsable', value: SIGA.ctx.user.nombre, span: 1 },
          { k: 'lote', label: 'Lote / poza / categoría', type: 'select', options: d.animales.map(a => a[0] + ' · ' + a[1]), span: 1 },
          { k: 'identif', label: 'Identificación (arete/registro)', value: '', span: 1 },
          { k: 'cant', label: 'Cantidad (cabezas)', type: 'number', value: 1, span: 1, required: true }
        ] },
        { title: 'Datos productivos', cols: 3, fields: [
          { k: 'peso', label: 'Peso promedio (kg)', type: 'number', value: 0, span: 1 }, { k: 'edad', label: 'Edad (semanas)', type: 'number', value: 0, span: 1 },
          { k: 'destino', label: 'Destino / etapa siguiente', type: 'select', options: ['—', 'Recría', 'Engorde', 'Reproducción', 'Beneficio/Venta', 'Baja'], span: 1 },
          { k: 'sanidad', label: 'Observación sanitaria / causa', value: '', span: 3, ph: 'vacunas, tratamiento, causa de mortalidad…' }
        ] }
      ],
      status: (r, v) => v.tipo === 'Mortalidad' ? `<div class="note amber"><i class="fa-solid fa-triangle-exclamation"></i><div>La mortalidad se descuenta de la población, recalcula el índice de la especie y queda para el análisis de causas. Si supera el umbral, alerta al responsable.</div></div>` : v.tipo === 'Beneficio' || v.tipo === 'Saca' ? `<div class="note teal"><i class="fa-solid fa-link"></i><div>La saca genera el ingreso de producto al almacén de la unidad y queda disponible para la venta con comprobante electrónico.</div></div>` : '',
      submitLabel: 'Registrar evento',
      onSubmit: v => {
        const det = [v.peso > 0 ? v.peso + ' kg' : '', v.destino !== '—' ? v.destino : '', v.sanidad].filter(Boolean).join(' · ') || '—';
        d.eventos.unshift(Object.assign([U.dmy(v.fecha).slice(0, 5), v.tipo, v.lote.split(' · ')[0] + ' · ' + v.lote.split(' · ')[1], String(v.cant), det], { nuevo: true }));
        SIGA.log('Control pecuario', 'Registro de evento', d.nombre + ' · ' + v.lote.split(' · ')[0], '—', v.tipo + ' · ' + v.cant);
        U.closeModal(); this.paint(el); U.toast(`Evento "${v.tipo}" registrado · índices de ${d.nombre.toLowerCase()} actualizados`);
      }
    });
  }
});
