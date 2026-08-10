SIGA.registerModule('presupuesto', {
  title: 'Presupuesto', icon: 'fa-file-invoice-dollar', group: 'Ejecución del gasto', badge: 'SIAF',
  render(el) {
    const d = SIGA.data.presupuesto, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Presupuesto</h1><p>Ejecución del gasto público · SIAF · Certificación y control del crédito</p></div>
        <div style="display:flex;gap:8px"><button class="btn sec" id="siaf"><i class="fa-solid fa-right-left"></i> Registro SIAF</button><button class="btn" id="nueva"><i class="fa-solid fa-plus"></i> Nueva certificación</button></div></div>
      ${U.kpis([
        { lab: 'PIA inicial', val: 'S/ 102.6 M', sub: 'Presup. de Apertura' },
        { lab: 'PIM modificado', val: 'S/ 118.4 M', sub: 'tras notas', chip: '+15.4%' },
        { lab: 'Certificado', val: 'S/ 116.9 M', sub: '98.7% del PIM' },
        { lab: 'Devengado', val: 'S/ 108.0 M', sub: 'avance', chip: '91.2%' }
      ])}
      <div class="seg-tabs" data-group="p"><button class="on" data-tab="cert">Certificaciones</button><button data-tab="marco">Marco presupuestal</button><button data-tab="notas">Notas modificatorias</button></div>
      <div class="subpanel show" data-group="p" data-panel="cert"><div class="card"><h3><span class="dot"></span>Certificaciones de crédito presupuestario <span class="grow">clic para ver ítems</span></h3><div id="tcert"></div></div></div>
      <div class="subpanel" data-group="p" data-panel="marco"><div class="card"><h3><span class="dot"></span>Marco presupuestal por genérica <span class="grow">PIA → PIM → Ejecución</span></h3><div id="tmarco"></div></div></div>
      <div class="subpanel" data-group="p" data-panel="notas"><div class="card"><h3><span class="dot"></span>Notas modificatorias <span class="grow">Ejercicio 2025</span></h3><div style="margin-bottom:12px"><button class="btn sm" id="nnota"><i class="fa-solid fa-plus"></i> Nueva nota</button></div><div id="tnotas"></div></div></div>`;

    const verCert = c => {
      const body = `<div style="margin-bottom:12px" class="dl">
          <dt>Certificado</dt><dd>${c.num}</dd><dt>Dependencia</dt><dd>${c.dep}</dd>
          <dt>Fuente</dt><dd>${c.fte}</dd><dt>Partida</dt><dd class="code">${c.part}</dd>
          <dt>Registro SIAF</dt><dd>${c.siaf}</dd><dt>Fase</dt><dd>${U.tag(c.fase, c.faseCls)}</dd></div>
        <h3 style="margin:14px 0 8px;font-size:12px"><span class="dot"></span>Ítems certificados</h3>
        ${U.table([{ k: 0, label: 'SIGA', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Descripción' }, { k: 2, label: 'Und' }, { k: 3, label: 'Cant', r: true }, { k: 4, label: 'P.Unit', r: true, render: r => U.money(r[4], '') }, { k: 'tot', label: 'Total', r: true, render: r => `<b class="num">${U.money(r[3] * r[4], '')}</b>` }], d.items)}
        <div class="note teal" style="margin-top:12px;font-size:11px"><i class="fa-solid fa-calculator"></i><div>saldo = (inicial + créditos − anulaciones) − ejecutado &nbsp;·&nbsp; <code>actsal.prg</code></div></div>`;
      U.modal('Certificación N° ' + c.num, body,
        `<button class="btn ghost" data-close>Cerrar</button>
         ${c.fase === 'Certificado' ? '<button class="btn" id="mv-comp"><i class="fa-solid fa-check"></i> Comprometer</button>' : ''}
         <button class="btn sec" id="mv-print"><i class="fa-solid fa-print"></i> Imprimir</button>`, 'wide');
      document.getElementById('mv-print')?.addEventListener('click', () => U.toast('Enviando certificado a impresión…'));
      document.getElementById('mv-comp')?.addEventListener('click', () => { U.closeModal(); U.toast('Certificado ' + c.num + ' comprometido ✓'); });
    };

    document.getElementById('tcert').innerHTML = U.table([
      { k: 'num', label: 'N°', render: r => `<span class="code">${r.num}</span>` },
      { k: 'fecha', label: 'Fecha', cls: 'num' }, { k: 'dep', label: 'Dependencia' }, { k: 'fte', label: 'Fte' },
      { k: 'part', label: 'Partida', render: r => `<span class="code">${r.part}</span>` },
      { k: 'monto', label: 'Monto', r: true, render: r => `<span class="num">${U.money(r.monto)}</span>` },
      { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, r.faseCls) }
    ], d.certificaciones, {
      onRow: verCert,
      actions: [
        { icon: 'fa-eye', title: 'Ver', fn: verCert },
        { icon: 'fa-ban', title: 'Anular', cls: 'del', fn: c => U.confirm(`¿Anular la certificación <b>${c.num}</b>? El saldo volverá a la partida.`, () => U.toast('Certificación ' + c.num + ' anulada', 'err'), 'Anular') }
      ]
    });

    document.getElementById('tmarco').innerHTML = U.table([
      { k: 0, label: 'Genérica' }, { k: 1, label: 'PIA', r: true, render: r => U.int(r[1]) },
      { k: 2, label: 'Modif.', r: true, render: r => U.int(r[2]) }, { k: 3, label: 'PIM', r: true, render: r => U.int(r[3]) },
      { k: 4, label: 'Certificado', r: true, render: r => U.int(r[4]) }, { k: 5, label: 'Devengado', r: true, render: r => U.int(r[5]) },
      { k: 6, label: 'Saldo', r: true, render: r => `<span class="saldo-pos num">${U.int(r[6])}</span>` },
      { k: 7, label: 'Avance', r: true, render: r => U.tag(r[7], r[8]) }
    ], d.marco, { foot: `<tr><td style="font-weight:700">TOTAL</td><td class="r num" style="font-weight:700">102,600,000</td><td class="r num" style="font-weight:700">15,800,000</td><td class="r num" style="font-weight:700">118,400,000</td><td class="r num" style="font-weight:700">116,900,000</td><td class="r num" style="font-weight:700;color:var(--primary-dark)">108,000,000</td><td class="r num" style="font-weight:700">10,400,000</td><td class="r" style="font-weight:700">91.2%</td></tr>` });

    const renderNotas = () => {
      document.getElementById('tnotas').innerHTML = U.table([
        { k: 'n', label: 'N° Nota', render: r => `<span class="code">${r.n}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
        { k: 'tipo', label: 'Tipo', render: r => U.tag(r.tipo, r.tipoCls) }, { k: 'concepto', label: 'Concepto' },
        { k: 'hab', label: 'Habilita', r: true, render: r => r.hab ? `<span class="saldo-pos num">+${U.int(r.hab)}</span>` : '—' },
        { k: 'anu', label: 'Anula', r: true, render: r => r.anu ? `<span class="saldo-neg num">-${U.int(r.anu)}</span>` : '—' },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.estado === 'Aprobada' ? 't-green' : 't-gray') }
      ], d.notas);
    };
    renderNotas();

    document.getElementById('nueva').addEventListener('click', () => {
      const segFin = () => (parseFloat(1) || 0);
      U.bigForm({
        title: 'Nueva certificación de crédito presupuestario', icon: 'fa-file-invoice-dollar', size: 'wide',
        sections: [
          { title: 'Datos generales', cols: 3, fields: [
            { k: 'num', label: 'Certificado N°', value: '000343', ro: true, span: 1 },
            { k: 'fecha', label: 'Fecha', type: 'date', value: '2025-12-19', span: 1, required: true },
            { k: 'fte', label: 'Fuente de financiamiento', type: 'select', options: d.fuentes, span: 1, required: true },
            { k: 'dep', label: 'Dependencia solicitante', type: 'select', options: d.dependencias },
            { k: 'rubro', label: 'Rubro', type: 'select', options: ['00 · Recursos Ordinarios', '09 · Recursos Directamente Recaudados', '13 · Donaciones y Transferencias', '18 · Canon y Sobrecanon'], span: 1 }
          ]},
          { title: 'Cadena funcional programática', hint: 'estructura del gasto público (SIAF-MEF)', cols: 3, fields: [
            { k: 'funcion', label: 'Función', value: '22 · Educación', span: 1, required: true },
            { k: 'division', label: 'División funcional', value: '048 · Educación superior', span: 1 },
            { k: 'grupo', label: 'Grupo funcional', value: '0106 · Educación superior univ.', span: 1 },
            { k: 'progpres', label: 'Programa presupuestal', value: '9002 · APNOP', span: 1 },
            { k: 'proyecto', label: 'Producto / Proyecto', value: '3.000001', span: 1 },
            { k: 'actividad', label: 'Actividad / Obra', value: '5.000276', span: 1 },
            { k: 'meta', label: 'Meta', value: '0087', span: 1, required: true },
            { k: 'finalidad', label: 'Finalidad', value: '00512', span: 1 },
            { k: 'clasif', label: 'Clasificador de gasto', value: '2.3.1 5.1 2', span: 1, required: true }
          ]}
        ],
        items: {
          title: 'Ítems a certificar (catálogo SIGA)', addLabel: 'Agregar ítem',
          seed: { cod: '', desc: '', um: 'UNIDAD', cant: 1, precio: 0 },
          rows: [{ cod: '740805000082', desc: 'Computadora personal portátil', um: 'UNIDAD', cant: 2, precio: 3850 }],
          columns: [
            { k: 'cod', label: 'Cód. SIGA', w: '18%' }, { k: 'desc', label: 'Descripción', w: '34%' },
            { k: 'um', label: 'Und.', type: 'select', options: ['UNIDAD', 'SERVICIO', 'KG', 'MILLAR'], w: '13%' },
            { k: 'cant', label: 'Cant.', type: 'num', r: true, w: '10%' },
            { k: 'precio', label: 'P. Unit.', type: 'money', r: true, w: '12%' },
            { k: 'imp', label: 'Total', calc: r => (parseFloat(r.cant) || 0) * (parseFloat(r.precio) || 0), r: true, w: '13%' }
          ]
        },
        totals: (rows) => { let s = 0; rows.forEach(r => s += (parseFloat(r.cant) || 0) * (parseFloat(r.precio) || 0)); window.__certTot = s; return [{ label: 'Monto a certificar S/', val: U.money(s, ''), big: true }]; },
        footNote: () => U.montoLetras(window.__certTot || 0),
        submitLabel: 'Certificar',
        onSubmit: v => {
          const s = window.__certTot || 0;
          d.certificaciones.unshift({ num: v.num, fecha: (v.fecha || '').split('-').reverse().join('/'), dep: v.dep, fte: v.fte.slice(0, 2), part: v.clasif, monto: s, fase: 'Certificado', faseCls: 't-teal', siaf: '2025-0004513' });
          U.closeModal(); this.render(el); U.bindTabs(el); U.toast('Certificación ' + v.num + ' · ' + U.money(s) + ' registrada ✓');
        }
      });
    });
    document.getElementById('nnota').addEventListener('click', () => {
      U.formModal('Nueva nota modificatoria', [
        { k: 'tipo', label: 'Tipo', type: 'select', options: ['Crédito suplem.', 'Habilitación', 'Anulación'] },
        { k: 'concepto', label: 'Concepto' },
        { k: 'hab', label: 'Habilita S/', type: 'number', value: 0, span: 1 },
        { k: 'anu', label: 'Anula S/', type: 'number', value: 0, span: 1 }
      ], v => {
        d.notas.unshift({ n: 'NM-00' + (43 + d.notas.length), fecha: '19/12/2025', tipo: v.tipo, tipoCls: 't-blue', concepto: v.concepto, hab: +v.hab, anu: +v.anu, estado: 'Registrada' });
        U.closeModal(); renderNotas(); U.toast('Nota modificatoria registrada ✓');
      }, 'Registrar');
    });
    document.getElementById('siaf').addEventListener('click', () => U.toast('Sincronizando con el SIAF-MEF…'));
  }
});
