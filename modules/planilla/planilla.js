SIGA.registerModule('planilla', {
  title: 'Planillas', icon: 'fa-users', group: 'Registro y control',
  render(el) {
    const d = SIGA.data.planilla, U = SIGA.ui;
    const bars = `<div class="bars">${d.regimenes.map(b => `<div class="brow"><span>${b[0]}</span><div class="track"><i style="width:${b[1]}%;background:${b[2]}"></i></div><span class="amt num">${b[3]}</span></div>`).join('')}</div>`;
    el.innerHTML = `
      <div class="page-head"><div><h1>Planillas · Personal</h1><p>1,197 trabajadores · remuneraciones por régimen laboral y concepto</p></div>
        <div style="display:flex;gap:8px"><button class="btn ghost" id="nt"><i class="fa-solid fa-user-plus"></i> Nuevo trabajador</button><button class="btn" id="gen"><i class="fa-solid fa-file-circle-check"></i> Generar planilla</button></div></div>
      ${U.kpis([
        { lab: 'Total trabajadores', val: '1,197', sub: 'activos' },
        { lab: 'Planilla del mes', val: 'S/ 4.38 M', sub: 'neto a pagar · Dic.' },
        { lab: 'Aportes ONP/AFP', val: 'S/ 612 K', sub: 'previsionales' },
        { lab: 'Regímenes', val: '9', sub: 'tipos de planilla' }
      ])}
      <div class="seg-tabs" data-group="pl"><button class="on" data-tab="res">Resumen</button><button data-tab="tra">Trabajadores</button><button data-tab="men">Planilla mensual</button></div>
      <div class="subpanel show" data-group="pl" data-panel="res"><div class="split">
        <div class="card"><h3><span class="dot"></span>Distribución por régimen laboral</h3>${bars}</div>
        <div class="card"><h3><span class="dot"></span>Conceptos de planilla</h3>
          <p class="mini" style="margin-bottom:10px">Hasta 36 ingresos, 10 descuentos y 6 aportes (tabla <code>conremun</code>):</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between">${U.tag('1 · Ingresos', 't-green')}<span class="mini">TOTGEN (bruto)</span></div>
            <div style="display:flex;justify-content:space-between">${U.tag('2 · Descuentos', 't-red')}<span class="mini">→ TOTNET (neto)</span></div>
            <div style="display:flex;justify-content:space-between">${U.tag('3 · Aportes', 't-blue')}<span class="mini">carga empleador</span></div>
            <div style="display:flex;justify-content:space-between">${U.tag('4 · Reintegros', 't-amber')}<span class="mini"></span></div>
            <div style="display:flex;justify-content:space-between">${U.tag('5 · Encargaturas', 't-gray')}<span class="mini"></span></div></div></div>
      </div></div>
      <div class="subpanel" data-group="pl" data-panel="tra"><div class="card"><h3><span class="dot"></span>Trabajadores <span class="grow">clic para ver boleta</span></h3><div id="ttra"></div></div></div>
      <div class="subpanel" data-group="pl" data-panel="men"><div class="card"><h3><span class="dot"></span>Planilla mensual consolidada <span class="grow">Diciembre 2025</span></h3><div id="tmen"></div></div></div>`;

    const boleta = t => {
      const body = `<div class="boleta-doc">
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div style="flex:1;min-width:180px"><div style="font-weight:700;color:var(--ok);font-size:11px;text-transform:uppercase;margin-bottom:6px">Ingresos</div>
            <div class="ef-row"><span>Remuneración principal</span><span class="num">${U.money(t.ing * .55, '')}</span></div>
            <div class="ef-row"><span>Remun. reunificada</span><span class="num">${U.money(t.ing * .30, '')}</span></div>
            <div class="ef-row"><span>Bonificaciones</span><span class="num">${U.money(t.ing * .15, '')}</span></div>
            <div class="ef-row tot"><span>Total ingresos</span><span class="num">${U.money(t.ing, '')}</span></div></div>
          <div style="flex:1;min-width:180px"><div style="font-weight:700;color:var(--danger);font-size:11px;text-transform:uppercase;margin-bottom:6px">Descuentos</div>
            <div class="ef-row"><span>ONP / AFP (13%)</span><span class="num">${U.money(t.desc * .75, '')}</span></div>
            <div class="ef-row"><span>Renta 5.ª</span><span class="num">${U.money(t.desc * .15, '')}</span></div>
            <div class="ef-row"><span>Otros</span><span class="num">${U.money(t.desc * .10, '')}</span></div>
            <div class="ef-row tot"><span>Total descuentos</span><span class="num">${U.money(t.desc, '')}</span></div></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:2px solid var(--line)"><b style="font-size:13px">NETO A PAGAR</b><b class="num" style="font-size:20px;color:var(--primary-dark)">${U.money(t.neto)}</b></div>
        <div class="note teal" style="margin-top:12px;font-size:11px"><i class="fa-solid fa-calculator"></i><div>TOTGEN=Σ ingresos · TOTNET=TOTGEN−descuentos · aporte empleador ${U.money(t.apo)} (<code>bolsueldo.prg</code>)</div></div></div>`;
      U.modal('Boleta de pago · ' + t.cod + ' · ' + t.reg, body, `<button class="btn ghost" data-close>Cerrar</button><button class="btn sec" onclick="SIGA.ui.toast('Imprimiendo boleta…')"><i class="fa-solid fa-print"></i> Imprimir</button>`);
    };

    document.getElementById('ttra').innerHTML = U.table([
      { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'nom', label: 'Trabajador' },
      { k: 'reg', label: 'Régimen' }, { k: 'cargo', label: 'Cargo' }, { k: 'cond', label: 'Condición', render: r => U.tag(r.cond, r.cls) },
      { k: 'neto', label: 'Neto', r: true, render: r => `<span class="num">${U.money(r.neto)}</span>` }
    ], d.trabajadores, { onRow: boleta, actions: [{ icon: 'fa-file-invoice', title: 'Ver boleta', fn: boleta }] });

    document.getElementById('tmen').innerHTML = U.table([
      { k: 0, label: 'Régimen' }, { k: 1, label: 'Trab.', r: true }, { k: 2, label: 'Ingresos', r: true, render: r => U.int(r[2]) },
      { k: 3, label: 'Descuentos', r: true, render: r => U.int(r[3]) }, { k: 4, label: 'Aportes', r: true, render: r => U.int(r[4]) },
      { k: 5, label: 'Neto a pagar', r: true, render: r => `<b class="num">${U.int(r[5])}</b>` }
    ], d.mensual, { foot: `<tr><td style="font-weight:700">TOTAL</td><td class="r num" style="font-weight:700">1,197</td><td class="r num" style="font-weight:700">4,638,100</td><td class="r num" style="font-weight:700">656,100</td><td class="r num" style="font-weight:700">475,300</td><td class="r num" style="font-weight:800;color:var(--primary-dark)">3,982,000</td></tr>` });

    document.getElementById('gen').addEventListener('click', () => U.confirm('¿Generar la planilla de <b>Diciembre 2025</b> para los 1,197 trabajadores? Se calcularán ingresos, descuentos y aportes.', () => U.toast('Planilla de Diciembre 2025 generada ✓')));

    document.getElementById('nt').addEventListener('click', () => {
      U.bigForm({
        title: 'Alta de trabajador', icon: 'fa-user-plus', size: 'wide',
        sections: [
          { title: 'Datos personales', cols: 3, fields: [
            { k: 'dni', label: 'DNI', value: '', span: 1, required: true },
            { k: 'nombres', label: 'Apellidos y nombres', value: '', required: true, span: 2 },
            { k: 'nac', label: 'Fecha de nacimiento', type: 'date', value: '1990-01-01', span: 1 },
            { k: 'sexo', label: 'Sexo', type: 'select', options: ['Masculino', 'Femenino'], span: 1 },
            { k: 'estadoCivil', label: 'Estado civil', type: 'select', options: ['Soltero(a)', 'Casado(a)', 'Conviviente', 'Viudo(a)'], span: 1 }
          ]},
          { title: 'Datos laborales', cols: 3, fields: [
            { k: 'regimen', label: 'Régimen laboral', type: 'select', options: ['01 · Docente nombrado', '02 · D.L. 276', '03 · Contratado', '06 · CAS', '07 · Practicante', '10 · Pensionista'], required: true },
            { k: 'cargo', label: 'Cargo', value: '', required: true },
            { k: 'dependencia', label: 'Dependencia', value: '' },
            { k: 'fechaIng', label: 'Fecha de ingreso', type: 'date', value: '2025-12-19', span: 1 },
            { k: 'condicion', label: 'Condición', type: 'select', options: ['Nombrado', 'Contratado', 'Activo', 'Cesante'], span: 1 },
            { k: 'jornada', label: 'Dedicación', type: 'select', options: ['Tiempo completo', 'Tiempo parcial', 'Dedicación exclusiva'], span: 1 }
          ]},
          { title: 'Datos previsionales y bancarios', cols: 3, fields: [
            { k: 'sistema', label: 'Sistema de pensiones', type: 'select', options: ['ONP', 'AFP Integra', 'AFP Prima', 'AFP Profuturo', 'AFP Habitat'], span: 1, required: true },
            { k: 'cuspp', label: 'CUSPP (si AFP)', value: '', span: 1 },
            { k: 'essalud', label: 'Régimen de salud', type: 'select', options: ['EsSalud', 'EPS'], span: 1 },
            { k: 'banco', label: 'Banco', type: 'select', options: ['B. Nación', 'BCP', 'Interbank', 'BBVA'], span: 1 },
            { k: 'cci', label: 'Cuenta de abono (CCI)', value: '', span: 2 },
            { k: 'basico', label: 'Remuneración básica S/', type: 'number', value: 0, span: 1, required: true }
          ]}
        ],
        submitLabel: 'Registrar trabajador',
        onSubmit: v => {
          const basico = parseFloat(v.basico) || 0; const desc = basico * 0.13; const neto = basico - desc;
          d.trabajadores.unshift({ cod: '••' + Math.floor(100 + Math.random() * 899), nom: (v.nombres || 'Nuevo').split(' ')[0] + ' ••••', reg: v.regimen, cargo: v.cargo, cond: v.condicion, cls: 't-green', neto, ing: basico, desc, apo: basico * 0.09 });
          U.closeModal(); this.render(el); U.bindTabs(el); U.toast('Trabajador dado de alta ✓ · neto ' + U.money(neto));
        }
      });
    });
  }
});
