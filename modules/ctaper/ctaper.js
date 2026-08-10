SIGA.registerModule('ctaper', {
  title: 'Cuentas por Pagar', icon: 'fa-file-invoice', group: 'Ejecución del gasto',
  render(el) {
    const d = SIGA.data.ctaper, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Cuentas por Pagar</h1><p>Obligaciones con proveedores, devengados pendientes y retenciones judiciales</p></div>
        <button class="btn" id="no"><i class="fa-solid fa-plus"></i> Registrar obligación</button></div>
      ${U.kpis([
        { lab: 'Por pagar', val: 'S/ 384,600', sub: 'obligaciones pendientes', color: 'var(--danger)' },
        { lab: 'Proveedores con deuda', val: '28', sub: 'acreedores' },
        { lab: 'Retenciones judiciales', val: 'S/ 42,180', sub: '71 mandatos' },
        { lab: 'Vencidas', val: '5', sub: 'requieren atención', chip: '5', chipType: 'warn' }
      ])}
      <div class="seg-tabs" data-group="c"><button class="on" data-tab="obl">Obligaciones pendientes</button><button data-tab="jud">Retenciones judiciales</button></div>
      <div class="subpanel show" data-group="c" data-panel="obl"><div class="card"><h3><span class="dot"></span>Obligaciones pendientes</h3><div id="tobl"></div></div></div>
      <div class="subpanel" data-group="c" data-panel="jud"><div class="card"><h3><span class="dot"></span>Retenciones por mandato judicial <span class="grow">descuento en planilla</span></h3><div id="tjud"></div>
        <p class="mini" style="margin-top:10px">Enlazado con Planillas: la retención se descuenta del neto y se deposita al beneficiario vía Tesorería (tabla <code>movjud</code>).</p></div></div>`;

    const render = () => {
      document.getElementById('tobl').innerHTML = U.table([
        { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'prov', label: 'Proveedor' },
        { k: 'dev', label: 'Devengado', render: r => `<span class="code">${r.dev}</span>` },
        { k: 'imp', label: 'Importe', r: true, render: r => `<span class="num">${U.money(r.imp)}</span>` },
        { k: 'venc', label: 'Vencimiento', cls: 'num' }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.cls) }
      ], d.obligaciones, {
        actions: [{ icon: 'fa-calendar-check', title: 'Programar pago', fn: o => { o.estado = 'Programado'; o.cls = 't-blue'; render(); U.toast('Pago de ' + o.doc + ' programado ✓'); } },
        { icon: 'fa-arrow-right-to-bracket', title: 'Enviar a Tesorería', fn: o => U.confirm(`¿Enviar <b>${o.doc}</b> (${U.money(o.imp)}) a Tesorería para girado?`, () => { U.toast(o.doc + ' enviado a Tesorería ✓'); SIGA.go('tesoreria'); }, 'Enviar') }]
      });
    };
    render();

    document.getElementById('tjud').innerHTML = U.table([
      { k: 0, label: 'Expediente', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Trabajador' },
      { k: 2, label: 'Concepto' }, { k: 3, label: '% Ret.', r: true }, { k: 4, label: 'Monto mes', r: true, render: r => U.money(r[4]) }
    ], d.judiciales);

    document.getElementById('no').addEventListener('click', () => {
      U.bigForm({
        title: 'Registrar obligación por pagar', icon: 'fa-file-invoice', size: 'wide',
        sections: [
          { title: 'Documento del proveedor', cols: 3, fields: [
            { k: 'tipoDoc', label: 'Tipo comprobante', type: 'select', options: ['01 · Factura', '07 · Nota de crédito', 'RH · Recibo por honorarios'], span: 1, required: true },
            { k: 'doc', label: 'Serie-Número', value: '', span: 1, required: true, ph: 'F001-0000' },
            { k: 'fechaDoc', label: 'Fecha de emisión', type: 'date', value: '2025-12-19', span: 1 },
            { k: 'prov', label: 'Proveedor', value: '', required: true, span: 2 },
            { k: 'ruc', label: 'RUC', value: '', span: 1 }
          ]},
          { title: 'Devengado y vencimiento', cols: 3, fields: [
            { k: 'dev', label: 'Devengado SIAF', value: 'DEV-', span: 1 },
            { k: 'venc', label: 'Fecha de vencimiento', type: 'date', value: '2026-01-05', span: 1, required: true },
            { k: 'prioridad', label: 'Prioridad', type: 'select', options: ['Normal', 'Urgente', 'Programada'], span: 1 }
          ]},
          { title: 'Importe y retenciones', cols: 3, fields: [
            { k: 'bruto', label: 'Importe S/', type: 'number', value: 0, span: 1, required: true },
            { k: 'detr', label: 'Detracción %', type: 'number', value: 0, span: 1 },
            { k: 'ret', label: 'Retención renta %', type: 'number', value: 0, span: 1 }
          ]}
        ],
        totals: (rows, v) => {
          const b = parseFloat(v.bruto) || 0, det = b * (parseFloat(v.detr) || 0) / 100, ret = b * (parseFloat(v.ret) || 0) / 100;
          window.__oblNeto = b - det - ret; window.__oblBruto = b;
          return [{ label: 'Bruto', val: U.money(b, '') }, { label: '(−) Detracción', val: U.money(det, ''), cls: 'neg' }, { label: '(−) Retención', val: U.money(ret, ''), cls: 'neg' }, { label: 'NETO A PAGAR S/', val: U.money(b - det - ret, ''), big: true }];
        },
        submitLabel: 'Registrar obligación',
        onSubmit: v => {
          d.obligaciones.unshift({ doc: v.doc || 'F001-0000', prov: v.prov, dev: v.dev, imp: window.__oblBruto || 0, venc: (v.venc || '').split('-').reverse().join('/'), estado: 'Por pagar', cls: 't-amber' });
          U.closeModal(); render(); U.toast('Obligación ' + (v.doc || '') + ' registrada ✓');
        }
      });
    });
  }
});
