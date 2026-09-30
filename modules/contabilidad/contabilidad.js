/* ============================================================
   Contabilidad · "El cierre deja de ser una reconstrucción y pasa a ser una revisión"
   El asiento es un efecto automático del registro de la operación (4.6)
   ============================================================ */
(function () {
  const K = SIGA.data.contabilidad;
  const cls = c => c[0];
  // Balance = sumas base + todas las líneas de asiento (libro diario y mayor son vistas del mismo registro)
  const balance = () => {
    const b = {}; Object.entries(K.base).forEach(([c, v]) => b[c] = [v[0], v[1]]);
    K.asientos.forEach(a => a.lineas.forEach(l => { const k = l.cta; if (!b[k]) b[k] = [0, 0]; b[k][0] += l.debe; b[k][1] += l.haber; }));
    // Hacienda nacional se fija sobre la base (no sobre los movimientos del mes)
    if (!K._hac) { const bd = Object.values(K.base).reduce((s, v) => s + v[0], 0), bh = Object.values(K.base).reduce((s, v) => s + v[1], 0); K._hac = bd - bh; }
    const h3 = b['3101'] || [0, 0]; b['3101'] = [h3[0], h3[1] + K._hac];
    return b;
  };
  const saldo = (b, c) => b[c] ? b[c][0] - b[c][1] : 0;
  const ef = () => {
    const b = balance(), s = c => saldo(b, c);
    const act = ['1101', '1202', '1301', '1302', '1503', '1508'].reduce((t, c) => t + s(c), 0);
    const pas = -['2101', '2102', '2103'].reduce((t, c) => t + s(c), 0);
    const ing = -['4301', '4302', '4501'].reduce((t, c) => t + s(c), 0), gas = ['5101', '5301', '5302', '5801'].reduce((t, c) => t + s(c), 0);
    return { b, s, act, pas, pat: K._hac, res: ing - gas, ing, gas };
  };
  const depMes = () => K.activos.reduce((t, a) => { const [d, m, y] = a[2].split('/').map(Number); const meses = (2026 - y) * 12 + (8 - m); const tot = a[3] * a[4] / 100 / 12; return t + (meses * tot < a[3] && meses >= 0 ? tot : 0); }, 0);

  SIGA.registerModule('contabilidad', {
    title: 'Contabilidad', icon: 'fa-book', group: 'Registro y control',
    sel: '1101', running: false,
    alerts() { return K.depAgosto ? [] : [{ lvl: 'info', icon: 'fa-calculator', t: 'Depreciación de agosto por calcular', d: 'Se ejecuta automáticamente en el cierre', fn: () => SIGA.showTab(document.getElementById('mod-root'), 'k', 'act') }]; },
    search(q) { return K.asientos.filter(a => (a.num + ' ' + a.glosa).toLowerCase().includes(q)).map(a => ({ t: a.num + ' · ' + a.glosa, d: a.origen + (a.auto ? ' · automático' : ' · manual') })); },
    render(el) {
      const U = SIGA.ui, E = ef(), b = E.b;
      const td = Object.values(b).reduce((s, v) => s + v[0], 0), th = Object.values(b).reduce((s, v) => s + v[1], 0);
      const autos = K.asientos.filter(a => a.auto).length;
      el.innerHTML = `
      <div class="page-head"><div><h1>Contabilidad</h1><p>Registro contable gubernamental · asiento automático · libros como vistas del mismo registro · estados financieros para la DGCP</p></div>
        <div class="row-flex"><button class="btn ghost" id="k-cierre"><i class="fa-solid fa-lock"></i> Cierre de agosto</button><button class="btn" id="k-na"><i class="fa-solid fa-plus"></i> Asiento de ajuste</button></div></div>
      ${U.kpis([
        { lab: 'Asientos del periodo', val: U.int(1284 + K.asientos.length - 5), sub: autos + ' de ' + K.asientos.length + ' recientes son automáticos' },
        { lab: 'Plan contable', val: U.int(4861), sub: 'cuentas y subcuentas (placta)' },
        { lab: 'Balance', val: Math.abs(td - th) < 0.01 ? 'Cuadrado' : 'Descuadre', sub: 'debe = haber · verificación permanente', color: Math.abs(td - th) < 0.01 ? 'var(--ok)' : 'var(--danger)' },
        { lab: 'Último cierre', val: K.cierres[0][0], sub: 'en ' + K.cierres[0][2] + ' · antes 10 días', chip: '−90%' }
      ])}
      <div class="cmp mb"><div class="asis"><h5>Hoy · integración contable posterior</h5>La contabilidad se "integra" al final: se vuelve a transcribir lo registrado en otro lado. El cierre inmoviliza a cinco oficinas durante <b>diez días</b>.</div>
        <div class="tobe"><h5>SIGA-U · asiento en el mismo acto</h5>Cada devengado, giro, salida de almacén, venta o planilla genera su asiento al instante según la dinámica configurada. <b>Contabilidad revisa; ya no transcribe.</b></div></div>
      <div class="seg-tabs" data-group="k"><button class="on" data-tab="dia">Libro diario</button><button data-tab="may">Libro mayor</button><button data-tab="bal">Balance de comprobación</button><button data-tab="ef">Estados financieros</button><button data-tab="din">Dinámica contable</button><button data-tab="act">Activos fijos</button><button data-tab="conc">Conciliación presupuestal</button><button data-tab="cie">Cierre del periodo</button></div>
      <div class="subpanel show" data-group="k" data-panel="dia"><div class="card"><h3><span class="dot"></span>Libro diario <span class="grow">los asientos automáticos llegan en vivo desde cada módulo</span></h3><div id="k-dia"></div></div></div>
      <div class="subpanel" data-group="k" data-panel="may" id="k-p-may"></div>
      <div class="subpanel" data-group="k" data-panel="bal"><div class="card"><h3><span class="dot"></span>Balance de comprobación <span class="grow">al ${SIGA.ctx.hoy} · incluye los movimientos del día</span></h3><div id="k-bal"></div>
        <p class="mini mt">Mayorización en línea: si debe − haber &lt; 0 el saldo es acreedor; si ≥ 0, deudor. No existe proceso nocturno de recálculo.</p></div></div>
      <div class="subpanel" data-group="k" data-panel="ef" id="k-p-ef"></div>
      <div class="subpanel" data-group="k" data-panel="din"><div class="card"><h3><span class="dot"></span>Dinámica contable parametrizada <span class="grow">C-02 · cada tipo de operación con sus cuentas · editable por Contabilidad</span></h3><div id="k-din"></div></div></div>
      <div class="subpanel" data-group="k" data-panel="act" id="k-p-act"></div>
      <div class="subpanel" data-group="k" data-panel="conc" id="k-p-conc"></div>
      <div class="subpanel" data-group="k" data-panel="cie" id="k-p-cie"></div>`;
      el.querySelector('#k-na').addEventListener('click', () => this.nuevoAsiento());
      el.querySelector('#k-cierre').addEventListener('click', () => { SIGA.showTab(el, 'k', 'cie'); });
      this.paintDia(); this.paintMay(); this.paintBal(E); this.paintEF(E); this.paintDin(); this.paintAct(); this.paintConc(); this.paintCie();
    },
    paintDia() {
      const U = SIGA.ui, rows = [];
      K.asientos.forEach((a, ai) => a.lineas.forEach((l, i) => rows.push({ a, l, i, ai })));
      document.getElementById('k-dia').innerHTML = U.table([
        { k: 'n', label: 'Asiento', render: r => r.i ? '' : `<span class="code">${r.a.num}</span>` }, { k: 'f', label: 'Fecha', render: r => r.i ? '' : r.a.fecha },
        { k: 'g', label: 'Glosa', render: r => r.i ? '' : r.a.glosa + `<div>${r.a.auto ? U.tag('<i class="fa-solid fa-bolt"></i> automático · ' + r.a.origen, 't-teal') : U.tag('manual · ' + r.a.user, 't-gray')}</div>` },
        { k: 'c', label: 'Cuenta', render: r => `<span class="code">${r.l.cta}</span> <span class="mini">${K.plan[r.l.cta] || ''}</span>` },
        { k: 'd', label: 'Debe', r: true, render: r => r.l.debe ? U.money(r.l.debe, '') : '—' }, { k: 'h', label: 'Haber', r: true, render: r => r.l.haber ? U.money(r.l.haber, '') : '—' }
      ], rows.slice(0, 60), { rowCls: r => r.a.auto && r.ai < K.asientos.length - 5 ? 'row-new' : '' });
    },
    paintMay() {
      const U = SIGA.ui, host = document.getElementById('k-p-may'), c = this.sel;
      const bs = K.base[c] || [0, 0]; let s = bs[0] - bs[1];
      const mov = []; K.asientos.slice().reverse().forEach(a => a.lineas.filter(l => l.cta === c).forEach(l => { s += l.debe - l.haber; mov.push({ f: a.fecha, n: a.num, g: a.glosa, d: l.debe, h: l.haber, s }); }));
      host.innerHTML = `<div class="card"><h3><span class="dot"></span>Libro mayor <span class="grow">C-06 · mayorización automática</span></h3>
        <div class="toolbar"><div class="fld" style="min-width:320px"><select id="may-sel">${Object.keys(K.plan).map(k => `<option value="${k}" ${k === c ? 'selected' : ''}>${k} · ${K.plan[k]}</option>`).join('')}</select></div><span class="pill">Saldo al 31/07: ${U.money(bs[0] - bs[1])}</span><span class="pill ok"><span class="dot"></span>Saldo actual ${U.money(s)}</span></div><div id="may-t"></div></div>`;
      document.getElementById('may-t').innerHTML = U.table([{ k: 'f', label: 'Fecha' }, { k: 'n', label: 'Asiento', render: r => `<span class="code">${r.n}</span>` }, { k: 'g', label: 'Glosa' }, { k: 'd', label: 'Debe', r: true, render: r => r.d ? U.money(r.d, '') : '—' }, { k: 'h', label: 'Haber', r: true, render: r => r.h ? U.money(r.h, '') : '—' }, { k: 's', label: 'Saldo', r: true, render: r => `<b>${U.money(r.s, '')}</b>` }], mov, { empty: 'Sin movimientos en el periodo para esta cuenta' });
      document.getElementById('may-sel').addEventListener('change', e => { this.sel = e.target.value; this.paintMay(); });
    },
    paintBal(E) {
      const U = SIGA.ui, b = E.b, rows = Object.keys(b).sort().map(c => [c, K.plan[c] || '', b[c][0], b[c][1], b[c][0] - b[c][1]]);
      const td = rows.reduce((s, r) => s + r[2], 0), th = rows.reduce((s, r) => s + r[3], 0);
      document.getElementById('k-bal').innerHTML = U.table([
        { k: 0, label: 'Cuenta', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Denominación' },
        { k: 2, label: 'Sumas debe', r: true, render: r => U.money(r[2], '') }, { k: 3, label: 'Sumas haber', r: true, render: r => U.money(r[3], '') },
        { k: 4, label: 'Saldo deudor', r: true, render: r => r[4] >= 0 ? `<span class="saldo-pos">${U.money(r[4], '')}</span>` : '' },
        { k: 5, label: 'Saldo acreedor', r: true, render: r => r[4] < 0 ? `<span class="saldo-neg">${U.money(-r[4], '')}</span>` : '' }
      ], rows, { foot: `<tr><td></td><td style="font-weight:800">TOTALES</td><td class="r num" style="font-weight:800">${U.money(td, '')}</td><td class="r num" style="font-weight:800">${U.money(th, '')}</td><td colspan="2" class="r">${Math.abs(td - th) < 0.01 ? U.tag('✓ Cuadrado', 't-green') : U.tag('Descuadre ' + U.money(td - th), 't-red')}</td></tr>` });
    },
    paintEF(E) {
      const U = SIGA.ui, s = E.s, row = (t, v, c = '') => `<div class="ef-row ${c}"><span>${t}</span><span class="num">${U.money(v, '')}</span></div>`;
      const aCorr = s('1101') + s('1202') + s('1301') + s('1302'), aNo = s('1503') + s('1508');
      const flu = [['Cobranza de ventas y servicios', 2410000], ['Traspasos del Tesoro Público', 56880000], ['(−) Pagos a proveedores', -12640000], ['(−) Pagos de remuneraciones', -31820000], ['(−) Adquisición de activos', -9658700]];
      const vari = flu.reduce((t, f) => t + f[1], 0);
      document.getElementById('k-p-ef').innerHTML = `<div class="grid cols-2 mb">
        <div class="card"><h3><span class="dot"></span>Estado de Situación Financiera <span class="grow">EF-1 · calculado del balance</span></h3>
          <div class="ef-row" style="font-weight:700;color:var(--secondary-dark)"><span>ACTIVO</span><span></span></div>
          ${row('Efectivo y equivalentes', s('1101'), 'sub')}${row('Cuentas por cobrar', s('1202'), 'sub')}${row('Existencias y productos terminados', s('1301') + s('1302'), 'sub')}${row('Total activo corriente', aCorr)}
          ${row('Edificios, maquinaria y equipo (neto)', aNo, 'sub')}${row('Total activo', E.act, 'tot')}
          <div class="ef-row" style="font-weight:700;color:var(--secondary-dark);margin-top:8px"><span>PASIVO Y PATRIMONIO</span><span></span></div>
          ${row('Impuestos y retenciones por pagar', -s('2101'), 'sub')}${row('Remuneraciones por pagar', -s('2102'), 'sub')}${row('Cuentas por pagar a proveedores', -s('2103'), 'sub')}${row('Total pasivo', E.pas)}
          ${row('Hacienda nacional', E.pat, 'sub')}${row('Resultado del ejercicio', E.res, 'sub')}${row('Total pasivo y patrimonio', E.pas + E.pat + E.res, 'tot')}
          <div class="mt">${Math.abs(E.act - (E.pas + E.pat + E.res)) < 0.01 ? U.tag('✓ Activo = Pasivo + Patrimonio', 't-green') : U.tag('Descuadre', 't-red')}</div></div>
        <div class="card"><h3><span class="dot"></span>Estado de Gestión <span class="grow">EF-2 · enero a agosto 2026</span></h3>
          ${row('Traspasos y remesas recibidas', -s('4501'))}${row('Venta de bienes (centros de producción)', -s('4301'))}${row('Venta de servicios', -s('4302'))}${row('Total ingresos', E.ing, 'tot')}
          ${row('(−) Gastos de personal', s('5101'), 'sub')}${row('(−) Compra de bienes', s('5301'), 'sub')}${row('(−) Contratación de servicios', s('5302'), 'sub')}${row('(−) Depreciación', s('5801'), 'sub')}
          <div class="ef-row tot"><span>Resultado del ejercicio</span><span class="num ${E.res >= 0 ? 'saldo-pos' : 'saldo-neg'}">${U.money(E.res, '')}</span></div></div></div>
        <div class="grid cols-2"><div class="card"><h3><span class="dot"></span>Estado de Cambios en el Patrimonio <span class="grow">EF-3</span></h3>
          ${row('Saldo al 01/01/2026 · Hacienda nacional', E.pat)}${row('Resultado del ejercicio', E.res, 'sub')}${row('Patrimonio al ' + SIGA.ctx.hoy, E.pat + E.res, 'tot')}</div>
          <div class="card"><h3><span class="dot"></span>Estado de Flujos de Efectivo <span class="grow">EF-4 · método directo</span></h3>
          ${flu.map(f => row(f[0], f[1], f[1] < 0 ? 'sub' : '')).join('')}${row('Variación neta del efectivo', vari, 'tot')}${row('Saldo inicial de efectivo', s('1101') - vari, 'sub')}${row('Saldo final de efectivo', s('1101'), 'tot')}</div></div>
        <p class="mini mt">Formatos exigidos por la Dirección General de Contabilidad Pública (Cuenta General de la República) generados del registro, sin armado paralelo. Notas a los estados financieros (C-12) asistidas.</p>`;
    },
    paintDin() {
      const U = SIGA.ui;
      document.getElementById('k-din').innerHTML = U.table([{ k: 0, label: 'Tipo de operación' }, { k: 1, label: 'Módulo de origen' }, { k: 2, label: 'Debe', render: r => r[2].split(' · ').map(c => `<span class="code">${c}</span>`).join(' ') }, { k: 3, label: 'Haber', render: r => r[3].split(' · ').map(c => `<span class="code">${c}</span>`).join(' ') }, { k: 4, label: 'Estado', render: () => U.tag('Activa', 't-green') }], K.dinamica);
    },
    paintAct() {
      const U = SIGA.ui;
      const rows = K.activos.map(a => { const [d, m, y] = a[2].split('/').map(Number); const meses = Math.max(0, (2026 - y) * 12 + (7 - m) + 1); const mens = a[3] * a[4] / 100 / 12; const acum = Math.min(a[3], mens * meses); return { a, mens, acum, neto: a[3] - acum, meses }; });
      const mes = depMes();
      document.getElementById('k-p-act').innerHTML = `<div class="card"><h3><span class="dot"></span>Control de activos fijos y depreciación <span class="grow">C-13 · C-14 · depreciación en línea recta</span></h3><div id="act-t"></div>
        <div class="row-flex mt"><button class="btn" id="act-dep" ${K.depAgosto ? 'disabled' : ''}><i class="fa-solid fa-calculator"></i> ${K.depAgosto ? 'Depreciación de agosto registrada' : 'Calcular depreciación de agosto · ' + U.money(mes)}</button><span class="mini">Genera el asiento 5801 / 1508 automáticamente.</span></div></div>`;
      document.getElementById('act-t').innerHTML = U.table([
        { k: 0, label: 'Código patrimonial', render: r => `<span class="code">${r.a[0]}</span>` }, { k: 1, label: 'Bien', render: r => r.a[1] + `<div class="mini">${r.a[5]}</div>` },
        { k: 2, label: 'Adquisición', render: r => r.a[2] }, { k: 3, label: 'Valor', r: true, render: r => U.money(r.a[3], '') }, { k: 4, label: 'Tasa', r: true, render: r => r.a[4] + '%' },
        { k: 5, label: 'Dep. acumulada', r: true, render: r => U.money(r.acum, '') }, { k: 6, label: 'Valor neto', r: true, render: r => `<b>${U.money(r.neto, '')}</b>` },
        { k: 7, label: 'Vida consumida', render: r => `<div class="mcell">${U.meter(r.acum / r.a[3] * 100, 'var(--secondary)')}<span>${(r.acum / r.a[3] * 100).toFixed(0)}%</span></div>` }
      ], rows);
      document.getElementById('act-dep').addEventListener('click', () => this.depreciar());
    },
    depreciar() {
      if (K.depAgosto) return 0;
      const m = Math.round(depMes() * 100) / 100; K.depAgosto = true;
      const a = SIGA.asiento('Depreciación del mes de agosto 2026', [['5801', m, 0], ['1508', 0, m]], 'Contabilidad');
      SIGA.log('Contabilidad', 'Cálculo de depreciación', 'Agosto 2026', '—', SIGA.ui.money(m) + ' · ' + a);
      return m;
    },
    paintConc() {
      const U = SIGA.ui;
      document.getElementById('k-p-conc').innerHTML = `<div class="card"><h3><span class="dot"></span>Conciliación presupuestal-contable · agosto 2026 <span class="grow">C-15 · lo presupuestal y lo contable parten del mismo dato</span></h3><div id="cc-t"></div>
        <div class="note teal mt" style="margin-bottom:0"><i class="fa-solid fa-circle-check"></i><div>Sin diferencias: dejan de existir dos versiones de la misma cifra. En el sistema actual esta conciliación se hacía al cierre, registro por registro.</div></div></div>`;
      document.getElementById('cc-t').innerHTML = U.table([{ k: 0, label: 'Genérica' }, { k: 1, label: 'Devengado presupuestal', r: true, render: r => U.money(r[1], '') }, { k: 2, label: 'Registro contable', r: true, render: r => U.money(r[2], '') }, { k: 3, label: 'Cuentas', render: r => `<span class="mini">${r[3]}</span>` }, { k: 4, label: 'Diferencia', r: true, render: r => `<b class="saldo-pos">${U.money(r[1] - r[2], '')}</b>` }], K.conciliacion);
    },
    paintCie() {
      const U = SIGA.ui;
      const steps = ['Operaciones del mes con asiento automático', 'Partida doble verificada (debe = haber)', 'Conciliación bancaria sin diferencias', 'Conciliación presupuestal-contable', 'Depreciación del mes registrada', 'Inventario de existencias valorizado', 'Libros diario y mayor generados', 'Estados financieros EF-1 a EF-4 generados'];
      document.getElementById('k-p-cie').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Cierre asistido de agosto 2026 <span class="grow">C-16 · verificación de consistencia en un día</span></h3>
        <div class="checklist" id="cie-l">${steps.map((s, i) => `<div class="ck" data-i="${i}"><i class="fa-regular fa-circle"></i><span>${s}</span><em></em></div>`).join('')}</div>
        <div class="row-flex mt"><button class="btn" id="cie-go"><i class="fa-solid fa-play"></i> Ejecutar cierre</button><span class="mini">Requiere el rol <b>Contador</b> (aprueba el cierre contable).</span></div></div>
        <div><div class="saldo-box mb"><div class="lab">Duración del cierre mensual</div><div class="big">de 10 días a 1</div><div class="row"><span>Horas de proceso</span><span class="g">240 h → 24 h</span></div><div class="row"><span>Oficinas inmovilizadas</span><span>5 → 0</span></div></div>
          <div class="card"><h3><span class="dot"></span>Cierres anteriores</h3>${K.cierres.map(c => `<div class="ef-row"><span>${c[0]}<div class="mini">${c[1]} · ${c[3]}</div></span><b>${c[2]}</b></div>`).join('')}</div></div></div>`;
      document.getElementById('cie-go').addEventListener('click', e => this.cerrar(e.currentTarget));
    },
    cerrar(btn) {
      if (!SIGA.sod(null, 'cierre')) return;
      if (K.cierres[0][0] === 'Agosto 2026') { SIGA.ui.toast('El periodo de agosto ya está cerrado', 'info'); return; }
      const U = SIGA.ui, E = ef(); btn.disabled = true;
      const tesok = SIGA.data.tesoreria.conc.hecho;
      const res = ['Todos los registros tienen asiento', 'Debe = Haber ✓', tesok ? '0 diferencias' : 'cargo registrado automáticamente', '0 diferencias', '', U.money(SIGA.alm ? SIGA.data.almacen.items.reduce((s, i) => s + i.stock * SIGA.alm.cprom(i.cod), 0) : 0), 'vistas del registro', 'EF-1 · EF-2 · EF-3 · EF-4'];
      document.querySelectorAll('#cie-l .ck').forEach((ck, i) => {
        setTimeout(() => { ck.className = 'ck run'; ck.querySelector('i').className = 'fa-solid fa-spinner'; }, i * 420);
        setTimeout(() => {
          if (i === 2 && !tesok) { const b = SIGA.data.tesoreria.bancos[1]; b.libros -= 25; SIGA.data.tesoreria.conc.hecho = true; SIGA.asiento('Comisión bancaria · conciliación en cierre', [['5302', 25, 0], ['1101', 0, 25]], 'Tesorería'); }
          if (i === 4) res[4] = K.depAgosto ? 'ya registrada' : U.money(this.depreciar());
          ck.className = 'ck ok'; ck.querySelector('i').className = 'fa-solid fa-circle-check'; ck.querySelector('em').textContent = res[i];
          if (i === 7) {
            K.cierres.unshift(['Agosto 2026', SIGA.ctx.hoy, '1 día', SIGA.ctx.user.nombre]);
            SIGA.log('Contabilidad', 'Cierre de periodo', 'Agosto 2026', 'Abierto', 'Cerrado · resultado ' + U.money(E.res));
            U.toast('Cierre de agosto completado · estados financieros generados'); setTimeout(() => SIGA.refresh(), 900);
          }
        }, i * 420 + 380);
      });
    },
    nuevoAsiento() {
      const U = SIGA.ui, ctas = Object.entries(K.plan).map(([k, v]) => k + ' ' + v);
      U.bigForm({
        title: 'Asiento de ajuste (manual)', icon: 'fa-book',
        sections: [{ title: 'Cabecera del asiento', cols: 3, fields: [
          { k: 'num', label: 'Asiento N°', value: 'A-' + (K.seq + 1), ro: true, span: 1 }, { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1, required: true },
          { k: 'tipo', label: 'Tipo', type: 'select', options: ['Ajuste', 'Reclasificación', 'Provisión', 'Apertura', 'Cierre'], span: 1 },
          { k: 'glosa', label: 'Glosa', value: '', span: 3, required: true, ph: 'Descripción de la operación' }
        ] }],
        items: { title: 'Movimientos (partida doble)', addLabel: 'Agregar línea', seed: { cuenta: ctas[0], debe: 0, haber: 0 },
          rows: [{ cuenta: ctas.find(c => c.startsWith('5302')), debe: 250, haber: 0 }, { cuenta: ctas.find(c => c.startsWith('2103')), debe: 0, haber: 250 }],
          columns: [{ k: 'cuenta', label: 'Cuenta contable', type: 'select', options: ctas, w: '58%' }, { k: 'debe', label: 'Debe', type: 'money', r: true, w: '21%' }, { k: 'haber', label: 'Haber', type: 'money', r: true, w: '21%' }] },
        totals: rows => { let td = 0, th = 0; rows.forEach(r => { td += parseFloat(r.debe) || 0; th += parseFloat(r.haber) || 0; }); const ok = Math.abs(td - th) < 0.005 && td > 0; return [{ label: 'Total debe', val: U.money(td, '') }, { label: 'Total haber', val: U.money(th, '') }, { label: ok ? 'Asiento cuadrado ✓' : 'Diferencia (debe cuadrar)', val: U.money(td - th, ''), big: true, cls: ok ? '' : 'neg' }]; },
        submitLabel: 'Registrar asiento',
        onSubmit: (v, rows) => {
          let td = 0, th = 0; rows.forEach(r => { td += parseFloat(r.debe) || 0; th += parseFloat(r.haber) || 0; });
          if (!(Math.abs(td - th) < 0.005 && td > 0)) { SIGA.log('Contabilidad', 'Asiento rechazado por descuadre', v.num, 'Debe ' + U.money(td), 'Haber ' + U.money(th)); U.toast('El sistema no acepta un asiento descuadrado: debe = haber', 'err'); return; }
          const num = 'A-' + (++K.seq);
          K.asientos.unshift({ num, fecha: U.dmy(v.fecha).slice(0, 5), glosa: v.glosa + ' (' + v.tipo.toLowerCase() + ')', origen: 'Manual', auto: false, user: SIGA.ctx.user.nombre, lineas: rows.map(r => ({ cta: r.cuenta.slice(0, 4), debe: parseFloat(r.debe) || 0, haber: parseFloat(r.haber) || 0 })) });
          SIGA.log('Contabilidad', 'Asiento de ajuste', num, '—', U.money(td));
          U.closeModal(); SIGA.refresh(); U.toast('Asiento ' + num + ' registrado · balance actualizado');
        }
      });
    }
  });
})();
