SIGA.registerModule('caja', {
  title: 'Caja e ingresos', icon: 'fa-sack-dollar', group: 'Producción agropecuaria · RDR',
  render(el) {
    const d = SIGA.data.caja, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Caja e ingresos · Recursos Directamente Recaudados</h1><p>Arqueo de caja, depósitos y captación de recursos propios (fuente 09)</p></div>
        <div style="display:flex;gap:8px"><button class="btn ghost" id="dep"><i class="fa-solid fa-building-columns"></i> Depositar</button><button class="btn" id="ni"><i class="fa-solid fa-plus"></i> Registrar ingreso</button></div></div>
      ${U.kpis([
        { lab: 'Caja del día', val: 'S/ 9,842', sub: 'efectivo + tarjeta' },
        { lab: 'Depositado', val: 'S/ 7,120', sub: 'cta. cte. del centro' },
        { lab: 'RDR del mes', val: 'S/ 312,480', sub: '→ ampliación fuente 09', color: 'var(--primary-dark)' },
        { lab: 'RDR acumulado', val: 'S/ 3.42 M', sub: 'ejercicio 2025' }
      ])}
      <div class="note teal"><i class="fa-solid fa-link"></i><div><b>Enlace con el ciclo SIAF.</b> Cada depósito confirmado por Tesorería incrementa el crédito de la fuente <b>09 · RDR</b> en Presupuesto (campo <code>totcre</code> de <code>Movpar</code>), habilitando nuevas certificaciones.</div></div>
      <div class="card"><h3><span class="dot"></span>Ingresos recaudados <span class="grow">últimos movimientos</span></h3><div id="ting"></div></div>`;

    const render = () => {
      document.getElementById('ting').innerHTML = U.table([
        { k: 0, label: 'Recibo', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Fecha', cls: 'num' },
        { k: 2, label: 'Concepto (clasificador de ingreso)' }, { k: 3, label: 'Unidad productiva' },
        { k: 4, label: 'Medio', render: r => U.tag(r[4], r[5]) }, { k: 6, label: 'Monto', r: true, render: r => `<span class="num">${U.money(r[6])}</span>` }
      ], d.ingresos, {
        actions: [{ icon: 'fa-print', title: 'Imprimir recibo', fn: r => U.toast('Imprimiendo recibo ' + r[0] + '…') }]
      });
    };
    render();

    document.getElementById('ni').addEventListener('click', () => {
      U.bigForm({
        title: 'Registrar ingreso · Recibo RDR', icon: 'fa-sack-dollar', size: 'wide',
        sections: [
          { title: 'Datos del recibo', cols: 3, fields: [
            { k: 'num', label: 'Recibo N°', value: 'R-08842', ro: true, span: 1 },
            { k: 'fecha', label: 'Fecha', type: 'date', value: '2025-12-19', span: 1, required: true },
            { k: 'medio', label: 'Medio de pago', type: 'select', options: ['Efectivo', 'Transferencia', 'Tarjeta', 'Depósito en cuenta'], span: 1 },
            { k: 'concepto', label: 'Concepto (clasificador de ingreso MEF)', type: 'select', options: d.conceptos, span: 2, required: true },
            { k: 'clasif', label: 'Clasificador', value: '1.3.2 1.1', span: 1, hint: 'venta de bienes' }
          ]},
          { title: 'Pagador y unidad', cols: 3, fields: [
            { k: 'pagador', label: 'Pagador / cliente', value: '', required: true, span: 2 },
            { k: 'docId', label: 'DNI / RUC', value: '', span: 1 },
            { k: 'unidad', label: 'Unidad productiva', type: 'select', options: ['Planta de Café', 'Planta de Lácteos', 'Granja Porcina', 'Avícola', 'Galpón de Cuyes', 'Lab. Suelos', 'Vivero Forestal', 'Capacitación'] },
            { k: 'comprob', label: 'Comprobante asociado', value: '', span: 1, hint: 'B/F emitida' }
          ]},
          { title: 'Importe', cols: 3, fields: [
            { k: 'base', label: 'Base imponible S/', type: 'number', value: 0, span: 1, required: true },
            { k: 'afecto', label: 'Afecto a IGV', type: 'select', options: ['Sí (18%)', 'No'], span: 1 }
          ]}
        ],
        totals: (rows, v) => {
          const base = parseFloat(v.base) || 0; const igv = (v.afecto === 'No') ? 0 : base * 0.18;
          window.__recTot = base + igv;
          return [{ label: 'Base', val: U.money(base, '') }, { label: 'IGV', val: U.money(igv, '') }, { label: 'TOTAL RECIBIDO S/', val: U.money(base + igv, ''), big: true }];
        },
        footNote: () => U.montoLetras(window.__recTot || 0),
        submitLabel: 'Registrar y emitir recibo',
        onSubmit: v => {
          const total = window.__recTot || 0;
          d.ingresos.unshift([v.num, (v.fecha || '').split('-').reverse().join('/'), v.concepto, v.unidad || '—', v.medio, v.medio === 'Efectivo' ? 't-gray' : 't-blue', total]);
          U.closeModal(); this.render(el); U.toast('Recibo ' + v.num + ' · ' + U.money(total) + ' registrado ✓');
        }
      });
    });
    document.getElementById('dep').addEventListener('click', () => U.confirm('¿Registrar depósito del efectivo de caja a la cuenta RDR? Tesorería confirmará el abono.', () => U.toast('Depósito registrado · pendiente de confirmación en Tesorería')));
  }
});
