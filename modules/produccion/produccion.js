SIGA.registerModule('produccion', {
  title: 'Centro de Producción', icon: 'fa-industry', group: 'Producción agropecuaria · RDR', badge: 'RDR', badgeHot: true,
  render(el) {
    const d = SIGA.data.produccion, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Centro de Producción de Bienes y Servicios</h1><p>Unidades productivas · autofinanciamiento y generación de recursos propios (RDR)</p></div>
        <button class="btn" id="nop"><i class="fa-solid fa-plus"></i> Orden de producción</button></div>
      <div class="note info"><i class="fa-solid fa-circle-info"></i><div>Los centros de producción de universidades públicas realizan extracción, transformación, producción y comercialización de bienes, además de servicios. Deben <b>autofinanciarse</b>; el excedente se destina prioritariamente a investigación. Los ingresos entran como fuente <b>09 · RDR</b>.</div></div>
      ${U.kpis([
        { lab: 'Unidades productivas', val: '8', sub: 'activas este periodo' },
        { lab: 'Ingresos del mes', val: 'S/ 312,480', sub: 'ventas + servicios', color: 'var(--primary-dark)', chip: '+12.4%' },
        { lab: 'Costo de producción', val: 'S/ 198,600', sub: 'insumos + mano de obra' },
        { lab: 'Excedente', val: 'S/ 113,880', sub: '→ prioridad investigación', chip: '36.4%' }
      ])}
      <div class="split">
        <div class="card"><h3><span class="dot"></span>Unidades productivas <span class="grow">clic para ver</span></h3><div id="tuni"></div></div>
        <div>
          <div class="card" style="margin-bottom:14px"><h3><span class="dot"></span>Órdenes de producción activas</h3><div id="ops"></div></div>
          <div class="saldo-box"><div class="lab">Distribución del excedente</div><div class="big num" style="color:var(--primary-light)">S/ 113,880</div>
            <div class="row"><span>Investigación (prioritario)</span><span class="g">50%</span></div>
            <div class="row"><span>Reinversión / equipamiento</span><span>30%</span></div>
            <div class="row"><span>Retribución participantes</span><span>20%</span></div></div>
        </div>
      </div>`;

    document.getElementById('tuni').innerHTML = U.table([
      { k: 0, label: 'Unidad productiva' }, { k: 1, label: 'Línea' },
      { k: 2, label: 'Ingreso', r: true, render: r => U.money(r[2]) },
      { k: 3, label: 'Margen', r: true, render: r => U.tag(r[3], r[4]) },
      { k: 5, label: 'Estado', render: r => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r[6]};margin-right:6px"></span>${r[5]}` }
    ], d.unidades, {
      onRow: u => U.detail(u[0], [['Línea', u[1]], ['Ingreso del mes', U.money(u[2])], ['Margen', u[3]], ['Estado', u[5]]],
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn" onclick="SIGA.go('ventas')"><i class="fa-solid fa-arrow-right"></i> Ver ventas</button>`)
    });

    document.getElementById('ops').innerHTML = d.ordenesProd.map(o => `<div style="margin-bottom:11px"><div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px"><b>${o.op} · ${o.prod}</b><span class="mini">${o.pct}%</span></div><div style="height:8px;background:var(--bg);border-radius:20px;overflow:hidden"><i style="display:block;height:100%;width:${o.pct}%;background:${o.color}"></i></div></div>`).join('');

    document.getElementById('nop').addEventListener('click', () => {
      U.bigForm({
        title: 'Nueva orden de producción', icon: 'fa-industry', size: 'wide',
        sections: [
          { title: 'Datos de la orden', cols: 3, fields: [
            { k: 'op', label: 'Orden N°', value: 'OP-0232', ro: true, span: 1 },
            { k: 'fecha', label: 'Fecha de inicio', type: 'date', value: '2025-12-19', span: 1, required: true },
            { k: 'meta', label: 'Fecha meta', type: 'date', value: '2026-01-15', span: 1, required: true },
            { k: 'unidad', label: 'Unidad productiva', type: 'select', options: d.unidades.map(u => u[0]), required: true },
            { k: 'responsable', label: 'Responsable de producción', value: '' }
          ]},
          { title: 'Producto a elaborar', cols: 3, fields: [
            { k: 'prod', label: 'Producto', value: '', required: true, span: 2 },
            { k: 'cant', label: 'Cantidad a producir', type: 'number', value: 100, span: 1, required: true },
            { k: 'um', label: 'Unidad de medida', type: 'select', options: ['Unidad', 'Kilogramo', 'Litro', 'Saco', 'Racimo'], span: 1 },
            { k: 'precioVenta', label: 'Precio de venta unit. S/', type: 'number', value: 0, span: 1 }
          ]}
        ],
        items: {
          title: 'Insumos y materiales (costo de producción)', addLabel: 'Agregar insumo',
          seed: { insumo: '', um: 'KG', cant: 1, costo: 0 },
          rows: [{ insumo: 'Materia prima', um: 'KG', cant: 50, costo: 4.5 }],
          columns: [
            { k: 'insumo', label: 'Insumo / material', w: '40%' },
            { k: 'um', label: 'Und.', type: 'select', options: ['KG', 'LT', 'UND', 'HORA'], w: '15%' },
            { k: 'cant', label: 'Cant.', type: 'num', r: true, w: '13%' },
            { k: 'costo', label: 'Costo unit.', type: 'money', r: true, w: '15%' },
            { k: 'sub', label: 'Subtotal', calc: r => (parseFloat(r.cant) || 0) * (parseFloat(r.costo) || 0), r: true, w: '15%' }
          ]
        },
        totals: (rows, v) => {
          let costo = 0; rows.forEach(r => costo += (parseFloat(r.cant) || 0) * (parseFloat(r.costo) || 0));
          const ingreso = (parseFloat(v.cant) || 0) * (parseFloat(v.precioVenta) || 0);
          window.__opRows = rows;
          return [
            { label: 'Costo de producción', val: U.money(costo, '') },
            { label: 'Ingreso proyectado', val: U.money(ingreso, '') },
            { label: 'Margen estimado', val: U.money(ingreso - costo, ''), big: true, cls: ingreso - costo < 0 ? 'neg' : '' }
          ];
        },
        submitLabel: 'Crear orden',
        onSubmit: v => {
          d.ordenesProd.unshift({ op: v.op, prod: v.prod || 'Producto', pct: 0, color: 'var(--primary)' });
          U.closeModal(); this.render(el); U.toast('Orden ' + v.op + ' creada · ' + v.cant + ' und ✓');
        }
      });
    });
  }
});
