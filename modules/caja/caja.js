/* ============================================================
   Caja e ingresos · recursos directamente recaudados (fuente 09)
   Circuito de recursos propios (CV-10): la venta genera el ingreso, el ingreso
   se deposita, el depósito confirmado amplía el crédito de la fuente 09 y ese
   crédito habilita nuevas certificaciones.
   ============================================================ */
(function () {
  const K = SIGA.data.caja;
  // Los recibos vinculados a un comprobante toman su importe del propio CPE (un solo dato)
  K.ingresos.forEach(r => { if (r.total == null) { const c = SIGA.data.ventas.comprobantes.find(x => x.doc === r.comprob); r.total = c ? c.total : 0; } });
  const efectivo = () => K.ingresos.filter(r => r.medio === 'Efectivo' && !r.depositado).reduce((s, r) => s + r.total, 0);
  const clasifDe = u => /Laboratorio|maquinaria/.test(u) ? '1.3.3 9.1' : /Planta/.test(u) ? '1.3.1 3.1' : '1.3.1 1.1';

  SIGA.caja = {
    recibo({ concepto, unidad, pagador, medio, total, comprob }) {
      const r = { num: 'R-' + SIGA.ui.pad(++K.seq, 5), fecha: SIGA.ctx.hoy, concepto, clasif: clasifDe(unidad), unidad, pagador, medio, total, comprob, depositado: medio !== 'Efectivo', nuevo: true };
      K.ingresos.unshift(r);
      return r;
    }
  };

  SIGA.registerModule('caja', {
    title: 'Caja e ingresos RDR', icon: 'fa-sack-dollar', group: 'Centros de Producción · RDR',
    alerts() {
      const e = efectivo(), p = K.depositos.filter(d => d.estado !== 'Confirmado').length, out = [];
      if (e > 0) out.push({ lvl: 'info', icon: 'fa-building-columns', t: `Efectivo por depositar · ${SIGA.ui.money(e)}`, d: 'Depositar hoy en la cuenta RDR', fn: () => SIGA.showTab(document.getElementById('mod-root'), 'cj', 'dep') });
      if (p) out.push({ lvl: 'warn', icon: 'fa-hourglass-half', t: `${p} depósito(s) por confirmar en Tesorería`, d: 'Al confirmar se amplía el crédito de la fuente 09', fn: () => SIGA.showTab(document.getElementById('mod-root'), 'cj', 'dep') });
      return out;
    },
    search(q) { return K.ingresos.filter(r => (r.num + ' ' + r.concepto + ' ' + r.pagador + ' ' + (r.comprob || '')).toLowerCase().includes(q)).map(r => ({ t: r.num + ' · ' + SIGA.ui.money(r.total), d: r.concepto })); },
    render(el) {
      const U = SIGA.ui, hoy = K.ingresos.filter(r => r.fecha === SIGA.ctx.hoy), nuevos = K.ingresos.filter(r => r.nuevo).reduce((s, r) => s + r.total, 0);
      const mes = K.ingresos.reduce((s, r) => s + r.total, 0);
      el.innerHTML = `
      <div class="page-head"><div><h1>Caja e ingresos · Recursos Directamente Recaudados</h1><p>Recibos con clasificador de ingreso y unidad productiva de origen · arqueo · depósito · ampliación automática de la fuente 09</p></div>
        <div class="row-flex"><button class="btn ghost" id="cj-dep"><i class="fa-solid fa-building-columns"></i> Depositar efectivo</button><button class="btn" id="cj-ni"><i class="fa-solid fa-plus"></i> Registrar ingreso</button></div></div>
      ${U.kpis([
        { lab: 'Caja del día', val: U.money(hoy.reduce((s, r) => s + r.total, 0)), sub: hoy.length + ' recibos hoy' },
        { lab: 'Efectivo por depositar', val: U.money(efectivo()), sub: 'arqueo + depósito del día', color: efectivo() ? '#b45309' : '' },
        { lab: 'Recibos de agosto (muestra)', val: U.money(mes), sub: K.ingresos.length + ' recibos · fuente 09' },
        { lab: 'RDR acumulado 2026', val: U.mill(K.acumulado + nuevos, 2), sub: 'ejercicio 2026', color: 'var(--primary-dark)' }
      ])}
      <div class="card mb"><h3><span class="dot"></span>Circuito de recursos propios <span class="grow">CV-10 · lo que hoy demora semanas y a veces no se completa</span></h3>
        <div class="flow">${[['fa-receipt', 'Venta con CPE', 'boleta o factura electrónica', 'ventas'], ['fa-file-invoice-dollar', 'Recibo de ingreso', 'clasificador + unidad', 'caja'], ['fa-building-columns', 'Depósito', 'cuenta RDR ••7830', 'caja'], ['fa-circle-check', 'Confirmación', 'Tesorería', 'tesoreria'], ['fa-arrow-trend-up', 'Ampliación fuente 09', 'nota modificatoria automática', 'presupuesto'], ['fa-file-signature', 'Nuevas certificaciones', 'crédito disponible', 'presupuesto']].map((s, i) => `${i ? '<div class="fa"><i class="fa-solid fa-chevron-right"></i></div>' : ''}<div class="fs on" data-go="${s[3]}" style="cursor:pointer"><div class="fi"><i class="fa-solid ${s[0]}"></i></div><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div></div>
      <div class="seg-tabs" data-group="cj"><button class="on" data-tab="ing">Ingresos recaudados</button><button data-tab="arq">Arqueo de caja</button><button data-tab="dep">Depósitos</button><button data-tab="uni">Recaudación por unidad</button></div>
      <div class="subpanel show" data-group="cj" data-panel="ing"><div class="card"><h3><span class="dot"></span>Recibos de ingreso <span class="grow">T-13 · cada recibo listo para contabilidad</span></h3><div id="cj-t"></div></div></div>
      <div class="subpanel" data-group="cj" data-panel="arq" id="cj-p-arq"></div>
      <div class="subpanel" data-group="cj" data-panel="dep"><div class="card"><h3><span class="dot"></span>Depósitos en la cuenta RDR <span class="grow">la confirmación de Tesorería amplía el crédito presupuestal</span></h3><div id="cj-dt"></div></div></div>
      <div class="subpanel" data-group="cj" data-panel="uni" id="cj-p-uni"></div>`;
      el.querySelectorAll('.flow [data-go]').forEach(n => n.addEventListener('click', () => SIGA.go(n.dataset.go)));
      el.querySelector('#cj-ni').addEventListener('click', () => this.nuevo());
      el.querySelector('#cj-dep').addEventListener('click', () => this.depositar());
      this.paintIng(); this.paintArq(); this.paintDep(); this.paintUni();
    },
    paintIng() {
      const U = SIGA.ui;
      document.getElementById('cj-t').innerHTML = U.table([
        { k: 'num', label: 'Recibo', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
        { k: 'concepto', label: 'Concepto', render: r => r.concepto + `<div class="mini">${r.pagador}${r.comprob ? ' · CPE ' + r.comprob : ''}</div>` },
        { k: 'clasif', label: 'Clasificador', render: r => `<span class="code">${r.clasif}</span>` }, { k: 'unidad', label: 'Unidad productiva', cls: 'mini' },
        { k: 'medio', label: 'Medio', render: r => U.tag(r.medio, r.medio === 'Efectivo' ? 't-gray' : 't-blue') + (r.medio === 'Efectivo' ? `<div class="mini">${r.depositado ? 'depositado' : 'en caja'}</div>` : '') },
        { k: 'total', label: 'Monto', r: true, render: r => U.money(r.total) }
      ], K.ingresos, { rowCls: r => r.nuevo ? 'row-new' : '', actions: [{ icon: 'fa-print', title: 'Imprimir recibo', fn: r => U.toast('Recibo ' + r.num + ' enviado a impresión') }] });
    },
    paintArq() {
      const U = SIGA.ui, sisR = efectivo() + K.fondoSencillo, sis = Math.floor(sisR * 10 + 1e-6) / 10, red = sisR - sis;
      // Conteo sugerido (el cajero lo corrige): reparte el saldo esperado entre las denominaciones
      const cap = { 200: 18, 100: 12, 50: 16, 20: 25, 10: 20, 5: 20, 2: 20, 1: 20, 0.5: 10, 0.2: 10, 0.1: 10 }, pre = {};
      let rem = Math.round(sis * 100); K.denom.forEach(([d]) => { const c = Math.round(d * 100), n = Math.min(cap[d], Math.floor(rem / c)); pre[d] = n; rem -= n * c; });
      document.getElementById('cj-p-arq').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Arqueo de caja · ${SIGA.ctx.hoy} <span class="grow">T-15 · se genera del propio movimiento</span></h3>
        <div class="denoms">${K.denom.map(d => `<div class="denom"><b>S/ ${d[0] >= 1 ? d[0] : d[0].toFixed(2)}</b><input type="number" min="0" data-d="${d[0]}" value="${pre[d[0]] || 0}"><span data-s="${d[0]}"></span></div>`).join('')}</div></div>
        <div><div class="saldo-box mb"><div class="lab">Resultado del arqueo</div><div class="big" id="aq-c"></div>
          <div class="row"><span>Efectivo del día sin depositar</span><span>${U.money(efectivo())}</span></div><div class="row"><span>Fondo de sencillo</span><span>${U.money(K.fondoSencillo)}</span></div><div class="row"><span>Redondeo a favor del consumidor</span><span>−${U.money(red)}</span></div><div class="row"><span>Saldo esperado en caja</span><span>${U.money(sis)}</span></div><div class="row"><span>Diferencia</span><span class="g" id="aq-d"></span></div></div>
          <button class="btn" id="aq-go"><i class="fa-solid fa-file-signature"></i> Cerrar arqueo y emitir acta</button></div></div>`;
      const host = document.getElementById('cj-p-arq');
      const calc = () => { let t = 0; host.querySelectorAll('[data-d]').forEach(i => { const v = (+i.value || 0) * (+i.dataset.d); t += v; host.querySelector(`[data-s="${i.dataset.d}"]`).textContent = U.money(v, ''); }); t = Math.round(t * 100) / 100; host.querySelector('#aq-c').textContent = U.money(t); const d = t - sis; host.querySelector('#aq-d').textContent = Math.abs(d) < 0.005 ? 'S/ 0.00 · cuadrado' : (d > 0 ? 'Sobrante ' : 'Faltante ') + U.money(Math.abs(d)); return d; };
      host.querySelectorAll('[data-d]').forEach(i => i.addEventListener('input', calc)); calc();
      host.querySelector('#aq-go').addEventListener('click', () => { const d = calc(); SIGA.log('Caja', 'Arqueo de caja', SIGA.ctx.hoy, 'Sistema ' + U.money(sis), Math.abs(d) < 0.005 ? 'Cuadrado' : 'Diferencia ' + U.money(d)); U.toast(Math.abs(d) < 0.005 ? 'Arqueo cuadrado · acta firmada digitalmente' : 'Arqueo con diferencia de ' + U.money(d) + ' · se notifica a Tesorería', Math.abs(d) < 0.005 ? 'ok' : 'err'); });
    },
    paintDep() {
      const U = SIGA.ui;
      document.getElementById('cj-dt').innerHTML = U.table([
        { k: 'num', label: 'Depósito', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'cta', label: 'Cuenta' },
        { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto) }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.estado === 'Confirmado' ? 't-green' : 't-amber') }, { k: 'nota', label: 'Efecto presupuestal', cls: 'mini' }
      ], K.depositos, { rowCls: r => r.nuevo ? 'row-new' : '', actions: [{ icon: 'fa-circle-check', title: 'Confirmar abono (Tesorería)', show: r => r.estado !== 'Confirmado', fn: d => this.confirmar(d) }] });
    },
    paintUni() {
      const U = SIGA.ui, P = SIGA.data.produccion.unidades.filter(u => u.ing).slice().sort((a, b) => b.ing - a.ing);
      document.getElementById('cj-p-uni').innerHTML = `<div class="card"><h3><span class="dot"></span>Contribución de cada unidad productiva a los recursos propios · agosto <span class="grow">soles</span></h3>
        ${U.chart.cols({ labels: P.map(u => u.nom.replace('Laboratorio de análisis de suelos', 'Lab. suelos').replace('Servicios de maquinaria agrícola', 'Maquinaria').replace('Planta de café y cacao', 'Café y cacao').replace('Comedor universitario', 'Comedor')), series: [{ name: 'Ingresos', data: P.map(u => u.ing) }], fmt: v => U.money(v), axFmt: v => U.int(v / 1000) + 'k', h: 240 })}
        <p class="mini mt">Cada recibo lleva su unidad de origen: por primera vez se conoce la contribución efectiva de cada centro de producción.</p></div>`;
    },
    depositar() {
      const U = SIGA.ui, e = efectivo();
      if (e <= 0) { U.toast('No hay efectivo pendiente de depósito', 'info'); return; }
      U.confirm(`¿Registrar el depósito de <b>${U.money(e)}</b> en efectivo a la cuenta RDR ••7830? Tesorería confirmará el abono con el extracto.`, () => {
        const d = { num: 'DEP-' + U.pad(++K.dep, 4), fecha: SIGA.ctx.hoy, monto: e, cta: 'B. Nación ••7830 (RDR)', estado: 'Por confirmar', nota: 'al confirmar: ampliación automática de la fuente 09', nuevo: true };
        K.depositos.unshift(d); K.ingresos.filter(r => r.medio === 'Efectivo').forEach(r => r.depositado = true);
        SIGA.log('Caja', 'Depósito de efectivo', d.num, 'En caja ' + U.money(e), 'Depositado · por confirmar');
        U.toast(`${d.num} registrado · pendiente de confirmación de Tesorería`); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'cj', 'dep');
      }, 'Depositar', '');
    },
    confirmar(d) {
      const U = SIGA.ui;
      d.estado = 'Confirmado';
      SIGA.data.tesoreria.bancos[1].libros += d.monto;
      const n = SIGA.ppto.ampliarRDR(d.monto, d.num);
      d.nota = n + ' · fuente 09 ampliada en ' + U.money(d.monto);
      SIGA.log('Tesorería', 'Confirmación de depósito RDR', d.num, 'Por confirmar', 'Confirmado · ' + n);
      U.toast(`Depósito confirmado · <b>${n}</b>: el PIM de la fuente 09 sube ${U.money(d.monto)} y habilita nuevas certificaciones`); SIGA.refresh();
    },
    nuevo() {
      const U = SIGA.ui, un = [...SIGA.data.produccion.unidades.map(u => u.nom), 'Capacitación y extensión'];
      U.bigForm({
        title: 'Registrar ingreso · recibo RDR', icon: 'fa-sack-dollar',
        sections: [
          { title: 'Datos del recibo', cols: 3, fields: [{ k: 'num', label: 'Recibo N°', value: 'R-' + U.pad(K.seq + 1, 5), ro: true, span: 1 }, { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1 }, { k: 'medio', label: 'Medio de pago', type: 'select', options: ['Efectivo', 'Transferencia', 'Tarjeta', 'Depósito en cuenta'], span: 1 }] },
          { title: 'Concepto y origen', cols: 3, fields: [{ k: 'concepto', label: 'Concepto (clasificador de ingreso MEF)', type: 'select', options: ['Venta de bienes agropecuarios · 1.3.1 1.1', 'Venta de bienes agroindustriales · 1.3.1 3.1', 'Servicios de laboratorio y análisis · 1.3.3 9.1', 'Derechos educativos · cursos de extensión · 1.3.2 2.1', 'Alquiler de maquinaria · 1.3.3 5.1'], span: 2 }, { k: 'unidad', label: 'Unidad productiva de origen', type: 'select', options: un, span: 1 }, { k: 'pagador', label: 'Pagador', value: '', required: true, span: 2 }, { k: 'doc', label: 'DNI / RUC', value: '', span: 1 }] },
          { title: 'Importe', cols: 3, fields: [{ k: 'base', label: 'Importe recibido S/', type: 'number', value: 0, span: 1, required: true }] }
        ],
        totals: (r, v) => [{ label: 'TOTAL RECIBIDO S/', val: U.money(+v.base || 0, ''), big: true }],
        footNote: (r, v) => U.montoLetras(+v.base || 0),
        submitLabel: 'Registrar y emitir recibo',
        onSubmit: v => {
          const t = +v.base || 0; if (t <= 0) { U.toast('Ingrese el importe', 'err'); return; }
          const r = SIGA.caja.recibo({ concepto: v.concepto.split(' · ')[0], unidad: v.unidad, pagador: v.pagador, medio: v.medio, total: t });
          r.clasif = v.concepto.split(' · ').pop();
          SIGA.asiento('Ingreso RDR ' + r.num + ' · ' + r.concepto, [['1101', t, 0], [r.clasif.startsWith('1.3.1') ? '4301' : '4302', 0, t]], 'Caja');
          SIGA.log('Caja', 'Recibo de ingreso', r.num, '—', U.money(t) + ' · ' + v.unidad);
          U.closeModal(); SIGA.refresh(); U.toast(`Recibo ${r.num} por ${U.money(t)} registrado · asiento contable automático`);
        }
      });
    }
  });
})();
