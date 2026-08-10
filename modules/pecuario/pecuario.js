SIGA.registerModule('pecuario', {
  title: 'Control pecuario', icon: 'fa-cow', group: 'Producción agropecuaria · RDR', badge: 'CICLO', badgeHot: true,
  esp: 'porcino',
  render(el) {
    const U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Control pecuario · Ciclo de vida animal</h1><p>Registro zootécnico: población, nacimientos, destete, engorde, saca y mortalidad</p></div>
        <button class="btn" id="ev"><i class="fa-solid fa-plus"></i> Registrar evento</button></div>
      <div class="note info"><i class="fa-solid fa-cow"></i><div>Cada especie se controla a lo largo de todo su ciclo productivo —del nacimiento a la saca— registrando nacimientos, destetes, cambios de etapa, mortalidad y beneficio, y calculando los índices zootécnicos.</div></div>
      <div class="seg-tabs" id="esp-tabs">
        <button class="on" data-e="porcino"><i class="fa-solid fa-piggy-bank"></i> Porcinos</button>
        <button data-e="aves"><i class="fa-solid fa-drumstick-bite"></i> Aves</button>
        <button data-e="cuyes"><i class="fa-solid fa-paw"></i> Cuyes</button>
        <button data-e="vacunos"><i class="fa-solid fa-cow"></i> Vacunos</button></div>
      <div id="pec-kpis" class="grid cols-4" style="margin-bottom:14px"></div>
      <div class="card" style="margin-bottom:14px"><h3><span class="dot"></span>Ciclo de vida <span class="grow" id="pec-sub"></span></h3>
        <div id="pec-ciclo" style="display:flex;gap:0;overflow-x:auto;padding-bottom:4px"></div>
        <p class="mini" id="pec-note" style="margin-top:12px"></p></div>
      <div class="split">
        <div class="card"><h3><span class="dot"></span>Registro de eventos del ciclo <span class="grow">últimos movimientos</span></h3><div id="pec-ev"></div></div>
        <div><div class="card" style="margin-bottom:14px"><h3><span class="dot"></span>Índices zootécnicos</h3><div id="pec-ind" style="display:flex;flex-direction:column;gap:9px"></div></div>
          <div class="saldo-box"><div class="lab" id="pec-plab"></div><div class="big num" id="pec-pval" style="color:var(--primary-light)"></div>
            <div class="row"><span id="pec-r1l"></span><span class="g" id="pec-r1v"></span></div>
            <div class="row"><span id="pec-r2l"></span><span id="pec-r2v"></span></div></div></div>
      </div>`;

    el.querySelector('#esp-tabs').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      el.querySelectorAll('#esp-tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on');
      this.esp = b.dataset.e; this.paint(el);
    });
    el.querySelector('#ev').addEventListener('click', () => this.evModal(el));
    this.paint(el);
  },

  paint(el) {
    const U = SIGA.ui, d = SIGA.data.pecuario[this.esp];
    el.querySelector('#pec-kpis').innerHTML = d.kpis.map(k => `<div class="card kpi"><div class="lab"><i class="fa-solid ${k[0]}"></i> ${k[1]}</div><div class="val num">${k[2]}</div><div class="sub">${k[3]}</div></div>`).join('');
    el.querySelector('#pec-sub').textContent = d.sub;
    el.querySelector('#pec-note').textContent = d.note;
    el.querySelector('#pec-ciclo').innerHTML = d.ciclo.map((s, i) => {
      const arrow = i < d.ciclo.length - 1 ? `<div style="display:flex;align-items:center;color:var(--primary);font-size:20px;font-weight:800;padding:0 2px">›</div>` : '';
      return `<div style="min-width:118px;flex:1;border:1px solid var(--line);border-top:3px solid ${s[3]};border-radius:10px;padding:12px 10px;text-align:center;background:#fff"><div class="num" style="font-size:24px;font-weight:800;color:${s[3]}">${s[1]}</div><div style="font-size:11.5px;font-weight:700;margin-top:2px">${s[0]}</div><div class="mini" style="margin-top:2px">${s[2]}</div></div>${arrow}`;
    }).join('');
    const cls = { Parto: 't-green', Nacimiento: 't-green', Ingreso: 't-green', Destete: 't-blue', Saca: 't-amber', Beneficio: 't-amber', Ordeño: 't-teal', Recolección: 't-teal', Mortalidad: 't-red', Descarte: 't-gray', Empadre: 't-blue', Inseminación: 't-blue', Vacunación: 't-teal', Sanidad: 't-teal' };
    el.querySelector('#pec-ev').innerHTML = U.table([
      { k: 0, label: 'Fecha', cls: 'num' }, { k: 1, label: 'Evento', render: r => U.tag(r[1], cls[r[1]] || 't-gray') },
      { k: 2, label: 'Lote / Categoría' }, { k: 3, label: 'Cant.', r: true }, { k: 4, label: 'Detalle', cls: 'mini' }
    ], d.eventos);
    el.querySelector('#pec-ind').innerHTML = d.indices.map(x => `<div style="display:flex;justify-content:space-between"><span class="mini">${x[0]}</span><b>${x[1]}</b></div>`).join('');
    el.querySelector('#pec-plab').textContent = d.prod.lab; el.querySelector('#pec-pval').textContent = d.prod.val;
    el.querySelector('#pec-r1l').textContent = d.prod.r1l; el.querySelector('#pec-r1v').textContent = d.prod.r1v;
    el.querySelector('#pec-r2l').textContent = d.prod.r2l; el.querySelector('#pec-r2v').textContent = d.prod.r2v;
  },

  evModal(el) {
    const U = SIGA.ui, d = SIGA.data.pecuario[this.esp];
    U.bigForm({
      title: 'Registrar evento del ciclo · ' + d.nombre, icon: 'fa-clipboard-list', size: 'wide',
      sections: [
        { title: 'Datos del evento', cols: 3, fields: [
          { k: 'fecha', label: 'Fecha', type: 'date', value: '2025-12-19', span: 1, required: true },
          { k: 'tipo', label: 'Tipo de evento', type: 'select', options: ['Nacimiento', 'Parto', 'Destete', 'Cambio de etapa', 'Saca', 'Beneficio', 'Mortalidad', 'Descarte', 'Empadre', 'Inseminación', 'Vacunación', 'Pesaje'], span: 1, required: true },
          { k: 'responsable', label: 'Responsable', value: 'Técnico zootecnista', span: 1 },
          { k: 'lote', label: 'Lote / Poza / Categoría', value: '', required: true, span: 1 },
          { k: 'identif', label: 'Identificación (arete/registro)', value: '', span: 1 },
          { k: 'cant', label: 'Cantidad (cabezas)', type: 'number', value: 1, span: 1, required: true }
        ]},
        { title: 'Datos productivos', cols: 3, fields: [
          { k: 'peso', label: 'Peso promedio (kg)', type: 'number', value: 0, span: 1 },
          { k: 'edad', label: 'Edad (semanas)', type: 'number', value: 0, span: 1 },
          { k: 'destino', label: 'Destino / etapa siguiente', type: 'select', options: ['Recría', 'Engorde', 'Reproducción', 'Beneficio/Venta', 'Baja', '—'], span: 1 },
          { k: 'sanidad', label: 'Observación sanitaria / detalle', value: '', span: 3, ph: 'vacunas, tratamiento, causa de mortalidad, etc.' }
        ]}
      ],
      submitLabel: 'Registrar evento',
      onSubmit: v => {
        const det = [v.peso ? v.peso + ' kg' : '', v.destino !== '—' ? v.destino : '', v.sanidad].filter(Boolean).join(' · ') || '—';
        d.eventos.unshift([(v.fecha || '').slice(8, 10) + '/' + (v.fecha || '').slice(5, 7), v.tipo, v.lote || '—', String(v.cant), det]);
        U.closeModal(); this.paint(el); U.toast('Evento "' + v.tipo + '" registrado ✓');
      }
    });
  }
});
