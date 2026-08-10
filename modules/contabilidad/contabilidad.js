SIGA.registerModule('contabilidad', {
  title: 'Contabilidad', icon: 'fa-book', group: 'Registro y control',
  render(el) {
    const d = SIGA.data.contabilidad, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Contabilidad</h1><p>Registro contable gubernamental · asientos, plan contable y estados financieros</p></div>
        <button class="btn" id="na"><i class="fa-solid fa-plus"></i> Nuevo asiento</button></div>
      ${U.kpis([
        { lab: 'Asientos del mes', val: '1,284', sub: 'diciembre 2025' },
        { lab: 'Plan contable', val: '4,861', sub: 'cuentas (placta)' },
        { lab: 'Balance', val: 'Cuadrado', sub: 'debe = haber', color: 'var(--ok)' },
        { lab: 'Último cierre', val: 'Nov 2025', sub: 'mes cerrado' }
      ])}
      <div class="seg-tabs" data-group="k"><button class="on" data-tab="bal">Balance de comprobación</button><button data-tab="asi">Asientos</button><button data-tab="ef">Estados financieros</button></div>
      <div class="subpanel show" data-group="k" data-panel="bal"><div class="card"><h3><span class="dot"></span>Balance de comprobación <span class="grow">al 31/12/2025</span></h3><div id="tbal"></div>
        <p class="mini" style="margin-top:10px">Mayorización (<code>int320.prg</code>): si <code>debe − haber &lt; 0</code> → saldo acreedor; si <code>≥ 0</code> → saldo deudor.</p></div></div>
      <div class="subpanel" data-group="k" data-panel="asi"><div class="card"><h3><span class="dot"></span>Libro diario <span class="grow">últimos asientos</span></h3><div id="tasi"></div></div></div>
      <div class="subpanel" data-group="k" data-panel="ef"><div class="split">
        <div class="card"><h3><span class="dot"></span>Estado de Situación Financiera <span class="grow">EF-1</span></h3>
          <div class="ef-row" style="font-weight:700;color:var(--secondary-dark)"><span>ACTIVO</span><span></span></div>
          <div class="ef-row sub"><span>Activo corriente</span><span class="num">1,268,360</span></div>
          <div class="ef-row sub"><span>Activo no corriente</span><span class="num">48,920,000</span></div>
          <div class="ef-row tot"><span>Total activo</span><span class="num">50,188,360</span></div>
          <div class="ef-row" style="font-weight:700;color:var(--secondary-dark);margin-top:8px"><span>PASIVO Y PATRIMONIO</span><span></span></div>
          <div class="ef-row sub"><span>Pasivo corriente</span><span class="num">384,600</span></div>
          <div class="ef-row sub"><span>Patrimonio</span><span class="num">49,803,760</span></div>
          <div class="ef-row tot"><span>Total pasivo y patrimonio</span><span class="num">50,188,360</span></div></div>
        <div class="card"><h3><span class="dot"></span>Estado de Gestión <span class="grow">EF-2</span></h3>
          <div class="ef-row"><span>Ingresos (transf. + RDR)</span><span class="num">121,820,000</span></div>
          <div class="ef-row sub"><span>(−) Gastos de personal</span><span class="num">52,110,800</span></div>
          <div class="ef-row sub"><span>(−) Bienes y servicios</span><span class="num">31,640,200</span></div>
          <div class="ef-row sub"><span>(−) Otros gastos</span><span class="num">6,300,000</span></div>
          <div class="ef-row tot"><span>Resultado del ejercicio</span><span class="num saldo-pos">31,769,000</span></div>
          <p class="mini" style="margin-top:10px">EEFF gubernamentales para la Cuenta General de la República.</p></div>
      </div></div>`;

    document.getElementById('tbal').innerHTML = U.table([
      { k: 0, label: 'Cuenta', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Denominación' },
      { k: 2, label: 'Debe', r: true, render: r => U.int(r[2]) }, { k: 3, label: 'Haber', r: true, render: r => U.int(r[3]) },
      { k: 4, label: 'Saldo', r: true, render: r => `<span class="${r[4] < 0 ? 'saldo-neg' : 'saldo-pos'} num">${U.int(r[4])}</span>` }
    ], d.balance);

    document.getElementById('tasi').innerHTML = U.table([
      { k: 0, label: 'Asiento', render: r => r[0] ? `<span class="code">${r[0]}</span>` : '' }, { k: 1, label: 'Fecha', cls: 'num' },
      { k: 2, label: 'Glosa' }, { k: 3, label: 'Cuenta', render: r => `<span class="code">${r[3]}</span>` },
      { k: 4, label: 'Debe', r: true, render: r => r[4] ? U.money(r[4], '') : '—' }, { k: 5, label: 'Haber', r: true, render: r => r[5] ? U.money(r[5], '') : '—' }
    ], d.asientos);

    document.getElementById('na').addEventListener('click', () => {
      U.bigForm({
        title: 'Nuevo asiento contable', icon: 'fa-book', size: 'wide',
        sections: [{ title: 'Cabecera del asiento', cols: 3, fields: [
          { k: 'num', label: 'Asiento N°', value: 'A-4823', ro: true, span: 1 },
          { k: 'fecha', label: 'Fecha', type: 'date', value: '2025-12-19', span: 1, required: true },
          { k: 'tipo', label: 'Tipo de operación', type: 'select', options: ['Apertura', 'Operativo', 'Ajuste', 'Cierre'], span: 1 },
          { k: 'glosa', label: 'Glosa', value: '', span: 3, required: true, ph: 'Descripción de la operación' }
        ]}],
        items: {
          title: 'Movimientos (partida doble)', addLabel: 'Agregar línea',
          seed: { cuenta: SIGA.data.contabilidad.cuentasCbl[0], debe: 0, haber: 0 },
          rows: [{ cuenta: '5301 Bienes y Servicios', debe: 12480, haber: 0 }, { cuenta: '2103 Cuentas por Pagar', debe: 0, haber: 12480 }],
          columns: [
            { k: 'cuenta', label: 'Cuenta contable', type: 'select', options: SIGA.data.contabilidad.cuentasCbl, w: '46%' },
            { k: 'glosad', label: 'Glosa detalle', w: '24%' },
            { k: 'debe', label: 'Debe', type: 'money', r: true, w: '15%' },
            { k: 'haber', label: 'Haber', type: 'money', r: true, w: '15%' }
          ]
        },
        totals: rows => {
          let td = 0, th = 0; rows.forEach(r => { td += parseFloat(r.debe) || 0; th += parseFloat(r.haber) || 0; });
          window.__asiOK = Math.abs(td - th) < 0.005 && td > 0;
          return [
            { label: 'Total debe', val: U.money(td, '') },
            { label: 'Total haber', val: U.money(th, '') },
            { label: window.__asiOK ? 'Asiento cuadrado ✓' : 'Diferencia (debe cuadrar)', val: U.money(td - th, ''), big: true, cls: window.__asiOK ? '' : 'neg' }
          ];
        },
        submitLabel: 'Registrar asiento',
        onSubmit: (v, rows) => {
          if (!window.__asiOK) { U.toast('El asiento no cuadra: debe = haber', 'err'); return; }
          for (let i = rows.length - 1; i >= 0; i--) { const r = rows[i]; d.asientos.unshift([i === 0 ? v.num : '', i === 0 ? '19/12' : '', i === 0 ? v.glosa : '', r.cuenta.slice(0, 4), parseFloat(r.debe) || 0, parseFloat(r.haber) || 0]); }
          U.closeModal(); this.render(el); U.toast('Asiento ' + v.num + ' registrado ✓');
        }
      });
    });
  }
});
