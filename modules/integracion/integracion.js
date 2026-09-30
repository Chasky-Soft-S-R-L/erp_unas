/* ============================================================
   Integración con SIAF-SP, SIGA-MEF, SUNAT y bancos (informe 5.6 · pitch lámina 27)
   "Se acaba la doble digitación": cola de mensajes, reintentos, idempotencia,
   conciliación diaria e interruptor de circuito.
   ============================================================ */
SIGA.registerModule('integracion', {
  title: 'Integración SIAF · SUNAT', icon: 'fa-right-left', group: 'Configuración y control', badge: 'MEF',
  alerts() {
    const q = SIGA.data.integracion, out = [];
    Object.entries(q.caido).filter(([, v]) => v).forEach(([k]) => out.push({ lvl: 'crit', icon: 'fa-plug-circle-xmark', t: `${k} no responde · interruptor de circuito abierto`, d: q.msgs.filter(m => m.sistema === k && m.estado === 'En cola').length + ' operaciones en cola · se enviarán solas' }));
    return out;
  },
  search(q) { return SIGA.data.integracion.msgs.filter(m => (m.ref + ' ' + m.tipo + ' ' + m.resp).toLowerCase().includes(q)).map(m => ({ t: '#' + m.id + ' · ' + m.tipo + ' · ' + m.ref, d: m.sistema + ' · ' + m.estado, fn: () => this.ver(m) })); },
  render(el) {
    const U = SIGA.ui, Q = SIGA.data.integracion;
    const hoy = Q.msgs.filter(m => m.ts.startsWith(SIGA.ctx.hoy)), cola = Q.msgs.filter(m => m.estado === 'En cola' || m.estado === 'Enviando');
    const sis = [['SIAF-SP', 'fa-landmark', 'Certificación, compromiso, devengado, girado y pagado'], ['SIGA-MEF', 'fa-cubes', 'Catálogo de bienes y cuadro de necesidades'], ['SUNAT', 'fa-file-invoice', 'Facturas, boletas, notas y guías electrónicas'], ['Banco', 'fa-building-columns', 'Abono masivo y extractos']];
    el.innerHTML = `
      <div class="page-head"><div><h1>Integración con SIAF-SP, SIGA-MEF y SUNAT</h1><p>Cada operación se registra una vez y se transmite sola · si el sistema externo no responde, queda en cola y se envía al restablecerse</p></div>
        <div class="row-flex"><button class="btn ghost" id="in-test"><i class="fa-solid fa-vial"></i> Enviar operación de prueba</button><button class="btn" id="in-conc"><i class="fa-solid fa-scale-balanced"></i> Conciliar hoy</button></div></div>
      ${U.kpis([
        { lab: 'Operaciones enviadas hoy', val: hoy.length, sub: 'sin digitación manual' },
        { lab: 'Confirmadas', val: Q.msgs.filter(m => m.estado === 'Confirmado').length, sub: 'con número de expediente o CDR', color: 'var(--ok)' },
        { lab: 'En cola', val: cola.length, sub: cola.length ? 'se reenviarán automáticamente' : 'bandeja vacía', color: cola.length ? '#b45309' : '' },
        { lab: 'Duplicados evitados', val: Q.duplicados, sub: 'clave de idempotencia', chip: '0 dobles', chipType: 'up' }
      ])}
      <div class="cmp mb"><div class="asis"><h5>Hoy</h5>"El sistema es un reflejo del SIAF: se aprueba allá y se vuelve a escribir acá." Mientras tanto, ambos muestran cifras distintas. El 100% de las operaciones se digita dos veces.</div>
        <div class="tobe"><h5>SIGA-U</h5>Interfaz automática con reintentos, control de duplicados y conciliación diaria. Operaciones digitadas dos veces: <b>0%</b>.</div></div>
      <div class="grid cols-4 mb">${sis.map(s => { const down = Q.caido[s[0]], n = Q.msgs.filter(m => m.sistema === s[0]).length, c = Q.msgs.filter(m => m.sistema === s[0] && m.estado === 'En cola').length; return `<div class="card"><h3><i class="fa-solid ${s[1]}" style="color:var(--primary-dark)"></i> ${s[0]}<span class="grow">${down ? '<span class="pill bad"><span class="dot"></span>Circuito abierto</span>' : '<span class="pill ok"><span class="dot"></span>En línea</span>'}</span></h3><p class="mini">${s[2]}</p><div class="ef-row mt"><span>Mensajes</span><b>${n}</b></div><div class="ef-row"><span>En cola</span><b class="${c ? 'neg' : ''}">${c}</b></div>
        <button class="btn sm ${down ? '' : 'warn'} mt" data-sw="${s[0]}"><i class="fa-solid ${down ? 'fa-plug-circle-check' : 'fa-plug-circle-xmark'}"></i> ${down ? 'Restablecer servicio' : 'Simular caída'}</button></div>`; }).join('')}</div>
      <div class="seg-tabs" data-group="in"><button class="on" data-tab="msg">Bandeja de salida</button><button data-tab="conc">Conciliación diaria</button><button data-tab="pat">Patrones aplicados</button><button data-tab="cont">Contingencia</button></div>
      <div class="subpanel show" data-group="in" data-panel="msg"><div class="card"><h3><span class="dot"></span>Bandeja de salida transaccional <span class="grow">se actualiza en vivo · clic para ver lo enviado y la respuesta recibida</span></h3><div id="in-t"></div></div></div>
      <div class="subpanel" data-group="in" data-panel="conc"><div class="card"><h3><span class="dot"></span>Conciliación diaria SIGA-U ↔ SIAF-SP <span class="grow">motor de conciliación · 23:00 cada día</span></h3><div id="in-c"></div></div></div>
      <div class="subpanel" data-group="in" data-panel="pat"><div class="card"><h3><span class="dot"></span>Patrones de integración aplicados <span class="grow">informe Tabla 41</span></h3><div id="in-p"></div></div></div>
      <div class="subpanel" data-group="in" data-panel="cont"><div class="split eq"><div class="card"><h3><span class="dot"></span>Estrategia de contingencia</h3><p style="font-size:12px;line-height:1.6">Si el intercambio automático no estuviera disponible por decisión del ente rector o por indisponibilidad técnica, el sistema conserva la capacidad de <b>generar los archivos de carga</b> en el formato requerido e <b>importar los archivos de descarga</b>. En el peor escenario, la digitación se reduce a cargar un archivo, no a transcribir registro por registro.</p>
        <div class="row-flex mt"><button class="btn sm" id="in-file"><i class="fa-solid fa-file-export"></i> Generar archivo de carga SIAF</button></div></div>
        <div class="card"><h3><span class="dot"></span>Arquitectura del adaptador</h3>${SIGA.ui.timeline([{ t: 'Módulo de dominio', sub: 'registra la operación y el mensaje en la misma transacción', st: 'done' }, { t: 'Bandeja de salida', sub: 'mensaje persistido con clave de idempotencia', st: 'done' }, { t: 'Cola y reintentos', sub: 'espera creciente: 2 s · 4 s · 8 s · 16 s', st: 'done' }, { t: 'Adaptador SIAF / SUNAT / banco', sub: 'aísla el protocolo concreto de intercambio', st: 'done' }, { t: 'Motor de conciliación', sub: 'contrasta ambos sistemas y reporta diferencias', st: 'done' }])}</div></div></div>`;

    document.getElementById('in-t').innerHTML = U.table([
      { k: 'id', label: '#', render: r => `<span class="code">${r.id}</span>` }, { k: 'ts', label: 'Fecha y hora', cls: 'mini' }, { k: 'sistema', label: 'Destino', render: r => U.tag(r.sistema, r.sistema === 'SUNAT' ? 't-blue' : r.sistema === 'Banco' ? 't-gray' : 't-teal') },
      { k: 'tipo', label: 'Operación' }, { k: 'ref', label: 'Referencia', render: r => `<span class="code">${U.esc(r.ref)}</span>` }, { k: 'monto', label: 'Importe', r: true, render: r => r.monto ? U.money(r.monto, '') : '—' },
      { k: 'intentos', label: 'Intentos', r: true }, { k: 'estado', label: 'Estado', render: r => U.tag(r.estado === 'Enviando' ? '<i class="fa-solid fa-spinner fa-spin"></i> Enviando' : r.estado, { Confirmado: 't-green', 'En cola': 't-amber', Enviando: 't-blue', Error: 't-red' }[r.estado]) },
      { k: 'resp', label: 'Respuesta', cls: 'mini' }
    ], Q.msgs.slice(0, 40), { onRow: m => this.ver(m), rowCls: r => r.estado === 'En cola' ? 'row-warn' : '' });
    document.getElementById('in-c').innerHTML = U.table([{ k: 0, label: 'Fase' }, { k: 1, label: 'Registros SIGA-U', r: true, render: r => U.int(r[1]) }, { k: 2, label: 'Importe SIGA-U', r: true, render: r => U.money(r[2], '') }, { k: 3, label: 'Registros SIAF', r: true, render: r => U.int(r[3]) }, { k: 4, label: 'Importe SIAF', r: true, render: r => U.money(r[4], '') }, { k: 5, label: 'Diferencia', r: true, render: r => `<b class="saldo-pos">${U.money(r[2] - r[4], '')}</b>` }], Q.conciliacion);
    document.getElementById('in-p').innerHTML = U.table([{ k: 0, label: 'Patrón', render: r => `<b>${r[0]}</b>` }, { k: 1, label: 'Propósito' }, { k: 2, label: 'Problema que resuelve' }], Q.patrones);

    el.querySelectorAll('[data-sw]').forEach(b => b.addEventListener('click', () => this.toggle(b.dataset.sw)));
    el.querySelector('#in-test').addEventListener('click', () => { const n = Q.seq + 1; SIGA.siaf('Devengado', 'Prueba DEV-TEST-' + n, 1250); SIGA.log('Integración', 'Operación de prueba', '#' + n); U.toast(Q.caido['SIAF-SP'] ? 'SIAF caído: la operación queda en cola, no se pierde' : 'Operación enviada al SIAF-SP', Q.caido['SIAF-SP'] ? 'info' : 'ok'); SIGA.refresh(); });
    el.querySelector('#in-conc').addEventListener('click', () => { SIGA.showTab(el, 'in', 'conc'); SIGA.log('Integración', 'Conciliación SIGA-U ↔ SIAF (manual)', SIGA.ctx.hoy, '—', '0 diferencias'); U.toast('Conciliación ejecutada · 0 diferencias entre SIGA-U y SIAF-SP'); });
    el.querySelector('#in-file').addEventListener('click', () => { SIGA.log('Integración', 'Generación de archivo de carga', 'SIAF-SP ' + SIGA.ctx.hoy); U.toast('Archivo de carga SIAF generado con ' + Q.msgs.filter(m => m.sistema === 'SIAF-SP').length + ' operaciones'); });
  },
  toggle(s) {
    const U = SIGA.ui, Q = SIGA.data.integracion;
    if (!Q.caido[s]) {
      Q.caido[s] = true; SIGA.log('Integración', 'Interruptor de circuito abierto', s, 'En línea', 'Sin respuesta');
      U.toast(`${s} fuera de servicio (simulado). Registre operaciones: quedarán en cola, sin perderse ni duplicarse.`, 'info');
      SIGA.refresh();
    } else {
      Q.caido[s] = false; const n = SIGA.drain();
      SIGA.log('Integración', 'Servicio restablecido', s, 'Sin respuesta', n + ' mensajes reenviados');
      U.toast(`${s} restablecido · ${n} operación(es) en cola enviándose con reintento automático`); SIGA.refresh();
    }
  },
  ver(m) {
    const U = SIGA.ui;
    const payload = JSON.stringify({ entidad: '20161749126 · UNAS', ejercicio: 2026, operacion: m.tipo, referencia: m.ref, importe: m.monto, idempotencyKey: m.idem, usuario: SIGA.ctx.user.id, timestamp: m.ts }, null, 2);
    U.modal('Mensaje #' + m.id + ' · ' + m.sistema, `${U.kv([['Operación', m.tipo], ['Referencia', m.ref], ['Estado', U.tag(m.estado, m.estado === 'Confirmado' ? 't-green' : 't-amber')], ['Intentos', m.intentos], ['Clave de idempotencia', `<span class="code">${U.esc(m.idem)}</span>`]])}
      <div class="lbl-s mt mb">Contenido enviado</div><div class="txtfile">${U.esc(payload)}</div><div class="lbl-s mt mb">Respuesta recibida</div><div class="txtfile">${U.esc(m.resp)}</div>`, `<button class="btn ghost" data-close>Cerrar</button>`);
  }
});
