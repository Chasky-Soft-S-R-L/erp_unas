SIGA.registerModule('tesoreria', {
  title: 'Tesorería', icon: 'fa-money-check-dollar', group: 'Ejecución del gasto',
  render(el) {
    const d = SIGA.data.tesoreria, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Tesorería</h1><p>Fase girado y pagado · comprobantes de pago, cuentas bancarias y conciliación</p></div>
        <button class="btn" id="ncp"><i class="fa-solid fa-plus"></i> Nuevo comprobante</button></div>
      ${U.kpis([
        { lab: 'Girado 2025', val: 'S/ 104.7 M', sub: '88.4% del PIM' },
        { lab: 'Pagado 2025', val: 'S/ 103.9 M', sub: '87.8% del PIM' },
        { lab: 'Saldo en bancos', val: 'S/ 908,560', sub: 'disponible', color: 'var(--ok)' },
        { lab: 'Cheques en cartera', val: '12', sub: 'por entregar', chip: '12', chipType: 'warn' }
      ])}
      <div class="seg-tabs" data-group="t"><button class="on" data-tab="cp">Comprobantes de pago</button><button data-tab="ban">Cuentas bancarias</button><button data-tab="con">Conciliación</button></div>
      <div class="subpanel show" data-group="t" data-panel="cp"><div class="card"><h3><span class="dot"></span>Comprobantes de pago <span class="grow">clic para ver</span></h3><div id="tcp"></div></div></div>
      <div class="subpanel" data-group="t" data-panel="ban"><div class="card"><h3><span class="dot"></span>Cuentas bancarias de la entidad</h3><div id="tban"></div></div></div>
      <div class="subpanel" data-group="t" data-panel="con"><div class="split">
        <div class="card"><h3><span class="dot"></span>Conciliación bancaria · Cta. RDR ••7830</h3>
          <div class="ef-row"><span>Saldo según libros</span><b class="num">368,900.00</b></div>
          <div class="ef-row sub"><span>(+) Depósitos en tránsito</span><span class="num">2,520.00</span></div>
          <div class="ef-row sub"><span>(−) Cheques girados no cobrados</span><span class="num">0.00</span></div>
          <div class="ef-row tot"><span>Saldo conciliado</span><span class="num">371,420.00</span></div>
          <div class="ef-row"><span>Saldo según extracto</span><b class="num">371,420.00</b></div>
          <div class="note teal" style="margin-top:12px;font-size:11px"><i class="fa-solid fa-circle-check"></i><div>Conciliación cuadrada · diferencia S/ 0.00</div></div></div>
        <div class="card"><h3><span class="dot"></span>Cheques en cartera</h3>
          <table><thead><tr><th>Cheque</th><th>Beneficiario</th><th class="r">Monto</th></tr></thead><tbody>
          <tr><td class="code">•••8901</td><td>Proveedor A</td><td class="r num">4,320.00</td></tr>
          <tr><td class="code">•••8902</td><td>Proveedor B</td><td class="r num">1,890.00</td></tr>
          <tr><td class="code">•••8903</td><td>Viáticos comisión</td><td class="r num">2,100.00</td></tr></tbody></table></div>
      </div></div>`;

    const ver = c => {
      U.detail('Comprobante ' + c.doc, [['Beneficiario', c.benef], ['Fecha', c.fecha], ['Banco', c.banco], ['Cheque/CCI', c.ref], ['Total', U.money(c.total)], ['Estado', U.tag(c.estado, c.cls)]],
        `<button class="btn ghost" data-close>Cerrar</button>${c.estado === 'Girado' ? '<button class="btn" id="pagar"><i class="fa-solid fa-check"></i> Marcar pagado</button>' : ''}`);
      document.getElementById('pagar')?.addEventListener('click', () => { c.estado = 'Pagado'; c.cls = 't-green'; U.closeModal(); this.render(el); U.toast(c.doc + ' marcado como pagado ✓'); });
    };
    document.getElementById('tcp').innerHTML = U.table([
      { k: 'doc', label: 'N° C/P', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
      { k: 'benef', label: 'Beneficiario' }, { k: 'banco', label: 'Banco' }, { k: 'ref', label: 'Cheque/CCI', render: r => `<span class="code">${r.ref}</span>` },
      { k: 'total', label: 'Total', r: true, render: r => `<span class="num">${U.money(r.total)}</span>` }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.cls) }
    ], d.cp, { onRow: ver, actions: [{ icon: 'fa-eye', title: 'Ver', fn: ver }] });

    document.getElementById('tban').innerHTML = U.table([
      { k: 0, label: 'Banco' }, { k: 1, label: 'Cuenta', render: r => `<span class="code">${r[1]}</span>` }, { k: 2, label: 'Fuente' },
      { k: 3, label: 'Tipo' }, { k: 4, label: 'Saldo contable', r: true, render: r => U.money(r[4], '') }, { k: 5, label: 'Saldo bancario', r: true, render: r => U.money(r[5], '') }
    ], d.bancos, { foot: `<tr><td colspan="4" class="r" style="font-weight:700">Total disponible</td><td class="r num" style="font-weight:800;color:var(--primary-dark)">908,560.00</td><td class="r num" style="font-weight:700">911,080.00</td></tr>` });

    document.getElementById('ncp').addEventListener('click', () => {
      U.bigForm({
        title: 'Nuevo comprobante de pago (girado)', icon: 'fa-money-check-dollar', size: 'wide',
        sections: [
          { title: 'Datos del giro', cols: 3, fields: [
            { k: 'num', label: 'C/P N°', value: 'CP-1079', ro: true, span: 1 },
            { k: 'fecha', label: 'Fecha de giro', type: 'date', value: '2025-12-19', span: 1, required: true },
            { k: 'exp', label: 'Expediente SIAF', value: '2025-0004515', span: 1 },
            { k: 'tipoOp', label: 'Tipo de operación', type: 'select', options: ['Pago a proveedor', 'Pago de planilla', 'Devolución', 'Encargo', 'Viáticos'], span: 1 },
            { k: 'medio', label: 'Medio de pago', type: 'select', options: ['Cheque', 'Carta orden', 'Abono en cuenta (CCI)', 'Efectivo'], span: 1 },
            { k: 'banco', label: 'Banco / cuenta', type: 'select', options: ['B. Nación ••4521 (RO)', 'B. Nación ••7830 (RDR)', 'BCP ••8890', 'Interbank ••1120'], span: 1 }
          ]},
          { title: 'Beneficiario', cols: 3, fields: [
            { k: 'tipoDoc', label: 'Tipo doc.', type: 'select', options: ['6 · RUC', '1 · DNI'], span: 1, required: true },
            { k: 'ruc', label: 'N° documento', value: '', span: 1, required: true },
            { k: 'cci', label: 'CCI (cuenta interbancaria)', value: '', span: 1 },
            { k: 'benef', label: 'Nombre / Razón social', value: '', required: true, span: 3 }
          ]},
          { title: 'Importe y retenciones', cols: 3, fields: [
            { k: 'bruto', label: 'Importe bruto (devengado) S/', type: 'number', value: 0, span: 1, required: true },
            { k: 'detr', label: 'Detracción %', type: 'number', value: 0, span: 1, hint: 'SPOT · según bien/servicio' },
            { k: 'renta', label: 'Renta 4ta % ', type: 'number', value: 0, span: 1, hint: 'recibos por honorarios' }
          ]}
        ],
        totals: (rows, v) => {
          const bruto = parseFloat(v.bruto) || 0, det = bruto * (parseFloat(v.detr) || 0) / 100, ren = bruto * (parseFloat(v.renta) || 0) / 100;
          const neto = bruto - det - ren; window.__cpNeto = neto;
          return [
            { label: 'Importe bruto', val: U.money(bruto, '') },
            { label: '(−) Detracción', val: U.money(det, ''), cls: 'neg' },
            { label: '(−) Retención renta 4ta', val: U.money(ren, ''), cls: 'neg' },
            { label: 'NETO A GIRAR S/', val: U.money(neto, ''), big: true }
          ];
        },
        footNote: () => U.montoLetras(window.__cpNeto || 0),
        submitLabel: 'Girar comprobante',
        onSubmit: (v) => {
          const neto = window.__cpNeto || 0;
          d.cp.unshift({ doc: v.num, fecha: (v.fecha || '').split('-').reverse().join('/'), benef: v.benef, banco: (v.banco || '').split(' ')[0] + ' ' + (v.banco || '').split(' ')[1], ref: v.medio === 'Cheque' ? '•••' + Math.floor(1000 + Math.random() * 9000) : 'Abono CCI', total: neto, estado: 'Girado', cls: 't-blue' });
          U.closeModal(); this.render(el); U.toast('C/P ' + v.num + ' girado · ' + U.money(neto) + ' ✓');
        }
      });
    });
  }
});
