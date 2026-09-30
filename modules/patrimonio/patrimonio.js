/* ============================================================
   Patrimonio · control de bienes muebles e inmuebles (SIGA-MEF · SBN)
   Alta → asignación en uso → desplazamiento/devolución → inventario → baja,
   con depreciación y conciliación Patrimonio–Contabilidad en línea.
   ============================================================ */
(function () {
  const PA = SIGA.data.patrimonio, K = SIGA.data.contabilidad;
  const HOY = new Date(2026, 7, 18);
  const pd = s => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d); };
  const meses = b => Math.max(0, (HOY.getFullYear() - pd(b.fecha).getFullYear()) * 12 + HOY.getMonth() - pd(b.fecha).getMonth());
  const depAcum = b => Math.min(b.valor, b.valor * b.tasa / 100 / 12 * meses(b)) + (b.mejora || 0) * 0;
  const neto = b => b.valor + (b.mejora || 0) - depAcum(b);
  const bien = cod => PA.bienes.find(b => b.cod === cod);
  const vigentes = () => PA.bienes.filter(b => b.situacion !== 'Baja');
  const ctaNom = c => (PA.cuentas.find(x => x[0] === c) || [0, c])[1];
  const ECL = { 'En uso': 't-green', 'En almacén (devuelto)': 't-gray', 'En proceso de baja': 't-amber', Baja: 't-red', Faltante: 't-red' };
  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const nextMov = () => 'MOV-2026-0' + (185 + PA.movimientos.filter(m => m.nuevo).length);
  const mov = (tipo, cod, de, a, doc) => { const m = { num: nextMov(), fecha: SIGA.ctx.hoy, tipo, cod, de, a, doc, nuevo: true }; PA.movimientos.unshift(m); return m; };
  const PM = () => SIGA.modules.patrimonio;
  // Conciliación: saldo contable de la 1503 por subcuenta frente al registro patrimonial
  const concil = () => {
    const altasMes = c => PA.bienes.filter(b => b.cuenta === c && /\/08\/2026$/.test(b.fecha) && b.situacion !== 'Baja').reduce((s, b) => s + b.valor, 0) + PA.bienes.filter(b => b.cuenta === c && b.mejora).reduce((s, b) => s + b.mejora, 0);
    const bajasMes = c => PA.bajas.filter(x => x.estado === 'Aprobada' && x.nuevo && (bien(x.cod) || {}).cuenta === c).reduce((s, x) => s + x.valor, 0);
    const contMov = {}; K.asientos.forEach(a => a.lineas.filter(l => l.cta === '1503').forEach(l => { const c = /edific|obra|pabell/i.test(a.glosa) ? '1503.0101' : /vehícul|camioneta/i.test(a.glosa) ? '1503.0201' : /tractor|maquinaria/i.test(a.glosa) ? '1503.0202' : /mobiliario|escritorio|silla/i.test(a.glosa) ? '1503.0301' : /laboratorio|microscop|balanza/i.test(a.glosa) ? '1503.0303' : '1503.0302'; contMov[c] = (contMov[c] || 0) + l.debe - l.haber; }));
    return PA.cuentas.map(c => { const pat = c[2] + altasMes(c[0]) - bajasMes(c[0]), con = c[2] + (contMov[c[0]] || 0); return { cta: c[0], nom: c[1], pat, con, dif: con - pat }; });
  };
  const API = SIGA.patrimonio = {
    aprobarBaja(x) {
      const U = SIGA.ui;
      if (!SIGA.sod(null, 'baja.aprobar')) return;
      const b = bien(x.cod), da = b ? depAcum(b) : x.valor * 0.9;
      x.estado = 'Aprobada'; x.resol = 'R.D. N.º ' + (118 + PA.bajas.filter(k => k.nuevo || k.estado === 'Aprobada').length) + '-2026-DGA'; x.nuevo = true;
      if (b) { b.situacion = 'Baja'; mov('Baja', b.cod, b.local, 'Disposición final', x.resol); }
      const a = SIGA.asiento('Baja de activo ' + x.cod + ' · ' + x.causal, [['1508', Math.min(da, x.valor), 0], ...(x.valor - da > 0.005 ? [['5801', x.valor - da, 0]] : []), ['1503', 0, x.valor]], 'Patrimonio');
      SIGA.log('Patrimonio', 'Aprobación de baja', x.num, 'En trámite', 'Aprobada · ' + x.resol);
      U.closeModal(); U.toast(`${x.num} aprobada con ${x.resol} · bien retirado del registro y asiento ${a || ''}`); SIGA.refresh();
    }
  };

  const bienRec = SIGA.recs.bien = {
    mod: 'Patrimonio', tipo: 'Ficha patrimonial del bien', office: 'Oficina de Control Patrimonial', key: b => b.cod, title: b => b.cod + ' · ' + b.desc, estado: 'situacion', cls: false, anuladoValor: 'Baja',
    fields: b => { const U = SIGA.ui; return [['Código patrimonial', `<span class="code">${b.cod}</span>`], ['Catálogo SBN', b.sbn], ['Denominación', U.esc(b.desc), 1], ['Marca / modelo', b.marca], ['Serie', b.serie], ['Cuenta contable', b.cuenta + ' · ' + ctaNom(b.cuenta)], ['Fecha de alta', b.fecha], ['Documento de origen', b.origen], ['Valor de adquisición', U.money(b.valor)], ...(b.mejora ? [['Mejoras', U.money(b.mejora)]] : []), ['Tasa de depreciación', b.tasa + '% anual'], ['Depreciación acumulada', U.money(depAcum(b))], ['Valor neto', `<b>${U.money(neto(b))}</b>`], ['Ubicación', b.local], ['Responsable (asignado en uso)', b.resp], ['Estado de conservación', b.estado], ['Situación', U.tag(b.situacion, ECL[b.situacion] || 't-gray')]]; },
    body: b => { const U = SIGA.ui, ms = PA.movimientos.filter(m => m.cod === b.cod); return `<div class="row-flex mt" style="gap:16px">${U.qr(b.cod, 72)}${U.barcode(b.cod, 230, 50)}<span class="mini">Etiqueta patrimonial · verificación por QR en el inventario</span></div>` + (ms.length ? `<div class="lbl-s mt mb">Movimientos del bien</div>` + U.timeline(ms.map(m => ({ t: m.tipo, sub: (m.de !== '—' ? m.de + ' → ' : '') + m.a + ' · ' + m.doc, when: m.fecha, st: 'done' }))) : ''); },
    edit: [{ k: 'estado', label: 'Estado de conservación', type: 'select', options: ['Bueno', 'Regular', 'Malo'], span: 1 }, { k: 'serie', label: 'Serie', span: 1 }, { k: 'marca', label: 'Marca / modelo' }],
    canEdit: b => b.situacion !== 'Baja',
    extra: b => b.situacion === 'Baja' ? [] : [
      { icon: 'fa-user-check', label: 'Asignar en uso', fn: x => PM().asignar([x]) },
      { icon: 'fa-right-left', label: 'Desplazamiento a otro local', fn: x => PM().desplazar([x]) },
      ...(b.situacion === 'En uso' ? [{ icon: 'fa-rotate-left', label: 'Devolución a Patrimonio', fn: x => PM().devolver([x]) }] : []),
      { icon: 'fa-screwdriver-wrench', label: 'Registrar mejora', menuOnly: true, fn: x => PM().mejora(x) },
      { icon: 'fa-qrcode', label: 'Imprimir etiqueta', menuOnly: true, fn: x => PM().etiquetas([x]) },
      { icon: 'fa-chart-line', label: 'Cuadro de depreciación', menuOnly: true, fn: x => PM().cuadroDep(x) },
      ...(b.situacion !== 'En proceso de baja' ? [{ icon: 'fa-trash-can', label: 'Proponer baja', danger: true, fn: x => PM().proponerBaja(x) }] : [])
    ],
    print: b => ({ tipo: 'Ficha patrimonial', num: b.cod, body: SIGA.ui.qr(b.cod, 80) + dtbl([['Fecha'], ['Movimiento'], ['Origen'], ['Destino'], ['Documento']], PA.movimientos.filter(m => m.cod === b.cod).map(m => [m.fecha, m.tipo, m.de, m.a, m.doc])), firmas: [['Responsable del bien', b.resp], ['Control Patrimonial', 'Jefe de Patrimonio'], ['V.º B.º', 'Dirección General de Administración']] })
  };

  SIGA.registerModule('patrimonio', {
    title: 'Patrimonio', icon: 'fa-building-columns', group: 'Ejecución del gasto', badge: 'NUEVO', badgeNew: true,
    alerts() {
      const out = [], f = PA.inventario.hallazgos.filter(h => h.tipo === 'Faltante' && h.estado !== 'Regularizado'), bj = PA.bajas.filter(b => b.estado === 'En trámite'), dif = concil().filter(c => Math.abs(c.dif) > 0.005);
      if (f.length) out.push({ lvl: 'warn', icon: 'fa-magnifying-glass', t: `${f.length} bienes faltantes en la toma de inventario 2026`, d: SIGA.ui.money(f.reduce((s, h) => s + h.valor, 0)) + ' · deslinde de responsabilidad', fn: () => SIGA.go('patrimonio', { pa: 'inv' }) });
      if (bj.length) out.push({ lvl: 'info', icon: 'fa-building-circle-xmark', t: `${bj.length} bajas patrimoniales por resolver`, d: 'Requiere Director General de Administración', fn: () => SIGA.go('patrimonio', { pa: 'baj' }) });
      if (dif.length) out.push({ lvl: 'warn', icon: 'fa-scale-unbalanced', t: 'Diferencia Patrimonio–Contabilidad', d: dif.map(c => c.cta + ' ' + SIGA.ui.money(c.dif)).join(' · '), fn: () => SIGA.go('patrimonio', { pa: 'con' }) });
      return out;
    },
    search(q) { return PA.bienes.filter(b => (b.cod + ' ' + b.desc + ' ' + b.serie + ' ' + b.resp).toLowerCase().includes(q)).slice(0, 8).map(b => ({ t: b.cod + ' · ' + b.desc, d: b.resp + ' · ' + b.local, fn: () => SIGA.ui.rec(bienRec).ver(b) })); },
    render(el) {
      const U = SIGA.ui, V = vigentes(), C = concil();
      const vb = C.reduce((s, c) => s + c.pat, 0), dep = -((K.base['1508'] || [0, 0])[0] - (K.base['1508'] || [0, 0])[1]) + K.asientos.reduce((s, a) => s + a.lineas.filter(l => l.cta === '1508').reduce((t, l) => t + l.haber - l.debe, 0), 0);
      const inv = Object.values(PA.inventario.avance), invT = inv.reduce((s, x) => s + x[0], 0), invV = inv.reduce((s, x) => s + x[1], 0);
      el.innerHTML = `
      <div class="page-head"><div><h1>Control patrimonial</h1><p>Bienes muebles e inmuebles con código SBN · alta, asignación en uso, desplazamiento, devolución, baja · inventario físico con QR · depreciación y conciliación con Contabilidad</p></div>
        <div class="row-flex"><button class="btn ghost" id="pa-inv"><i class="fa-solid fa-qrcode"></i> Toma de inventario</button><button class="btn" id="pa-alta"><i class="fa-solid fa-plus"></i> Alta de bien</button></div></div>
      ${U.kpis([
        { lab: 'Bienes registrados', val: U.int(PA.totalInst + PA.bienes.filter(b => b.nuevo).length), sub: V.length + ' en la muestra · ' + PA.cuentas.length + ' subcuentas' },
        { lab: 'Valor de los activos', val: U.mill(vb, 2), sub: 'cuenta 1503 · según Patrimonio' },
        { lab: 'Depreciación acumulada', val: U.mill(dep, 2), sub: 'cuenta 1508 · neto ' + U.mill(vb - dep, 2), color: '#b45309' },
        { lab: 'Inventario físico 2026', val: U.pct(invV, invT, 0), sub: U.int(invV) + ' de ' + U.int(invT) + ' bienes verificados', chip: 'en curso', chipType: 'info' }
      ])}
      <div class="cmp mb"><div class="asis"><h5>Hoy</h5>El inventario patrimonial se lleva en hojas de cálculo por oficina; las bajas y los desplazamientos no se reflejan en la contabilidad hasta el cierre anual y la conciliación demanda semanas.</div>
        <div class="tobe"><h5>SIGA-U</h5>Cada bien tiene su ficha con QR, responsable y ubicación; toda alta, baja o mejora genera su asiento y la conciliación Patrimonio–Contabilidad se ve en línea, cuenta por cuenta.</div></div>
      <div class="seg-tabs" data-group="pa"><button class="on" data-tab="bie">Bienes</button><button data-tab="asg">Asignaciones en uso</button><button data-tab="mov">Movimientos</button><button data-tab="inv">Inventario físico</button><button data-tab="baj">Bajas</button><button data-tab="dep">Depreciación</button><button data-tab="con">Conciliación contable</button></div>
      <div class="subpanel show" data-group="pa" data-panel="bie"><div class="card"><h3><span class="dot"></span>Registro patrimonial <span class="grow">clic para la ficha con QR · selección múltiple para asignar, desplazar o etiquetar en lote</span></h3><div id="pa-tb"></div></div></div>
      <div class="subpanel" data-group="pa" data-panel="asg" id="pa-p-asg"></div>
      <div class="subpanel" data-group="pa" data-panel="mov"><div class="card"><h3><span class="dot"></span>Movimientos patrimoniales <span class="grow">altas, asignaciones, desplazamientos, devoluciones, mejoras y bajas</span></h3><div id="pa-tm"></div></div></div>
      <div class="subpanel" data-group="pa" data-panel="inv" id="pa-p-inv"></div>
      <div class="subpanel" data-group="pa" data-panel="baj"><div class="card"><h3><span class="dot"></span>Bajas de bienes <span class="grow">causal SBN · informe técnico · resolución de la DGA · asiento automático</span></h3><div id="pa-tj"></div></div></div>
      <div class="subpanel" data-group="pa" data-panel="dep" id="pa-p-dep"></div>
      <div class="subpanel" data-group="pa" data-panel="con" id="pa-p-con"></div>`;
      el.querySelector('#pa-alta').addEventListener('click', () => this.alta());
      el.querySelector('#pa-inv').addEventListener('click', () => SIGA.showTab(el, 'pa', 'inv'));
      this.paintBienes(); this.paintAsg(); this.paintMov(); this.paintInv(invT, invV); this.paintBajas(); this.paintDep(); this.paintCon(C);
    },
    paintBienes() {
      const U = SIGA.ui;
      document.getElementById('pa-tb').innerHTML = U.grid({ id: 'pat-bie', title: 'bienes', export: 'registro_patrimonial', rows: PA.bienes, record: bienRec, pageSize: 12,
        filter: { label: 'Local', get: b => b.local },
        cols: [
          { k: 'cod', label: 'Código patrimonial', render: b => `<span class="code">${b.cod}</span>` },
          { k: 'desc', label: 'Bien', cls: 'w2', render: b => `${U.esc(b.desc)}<div class="mini">${b.marca} · serie ${b.serie}</div>`, csv: b => b.desc },
          { k: 'cuenta', label: 'Cuenta', render: b => `<span class="code">${b.cuenta}</span>` }, { k: 'resp', label: 'Responsable', cls: 'w1', render: b => b.resp + `<div class="mini">${b.local}</div>`, csv: b => b.resp },
          { k: 'valor', label: 'Valor', r: true, render: b => U.money(b.valor, '') }, { k: 'neto', label: 'Valor neto', r: true, sv: neto, render: b => U.money(neto(b), '') },
          { k: 'estado', label: 'Conservación', render: b => U.tag(b.estado, b.estado === 'Bueno' ? 't-green' : b.estado === 'Regular' ? 't-amber' : 't-red') },
          { k: 'situacion', label: 'Situación', render: b => U.tag(b.situacion, ECL[b.situacion] || 't-gray') }
        ], rowCls: b => (b.nuevo ? 'row-new' : '') + (b.situacion === 'Baja' ? ' row-void' : ''),
        actions: [{ icon: 'fa-qrcode', title: 'Etiqueta', fn: b => this.etiquetas([b]) }, { icon: 'fa-user-check', title: 'Asignar en uso', show: b => b.situacion !== 'Baja', fn: b => this.asignar([b]) }],
        tools: [{ icon: 'fa-plus', label: 'Alta de bien', primary: true, fn: () => this.alta() }],
        bulk: [{ icon: 'fa-user-check', label: 'Asignar en uso', fn: bs => this.asignar(bs.filter(b => b.situacion !== 'Baja')) }, { icon: 'fa-right-left', label: 'Desplazar', fn: bs => this.desplazar(bs.filter(b => b.situacion !== 'Baja')) }, { icon: 'fa-qrcode', label: 'Etiquetas QR', fn: bs => this.etiquetas(bs) }],
        foot: bs => `<tr><td colspan="5" class="r"><b>Totales (${bs.length})</b></td><td class="r num"><b>${U.money(bs.reduce((s, b) => s + b.valor, 0), '')}</b></td><td class="r num"><b>${U.money(bs.reduce((s, b) => s + neto(b), 0), '')}</b></td><td colspan="3"></td></tr>` });
    },
    paintAsg() {
      const U = SIGA.ui, g = {};
      vigentes().forEach(b => { (g[b.resp] = g[b.resp] || []).push(b); });
      const rows = Object.entries(g).map(([resp, bs]) => ({ resp, bs, n: bs.length, v: bs.reduce((s, b) => s + b.valor, 0), locs: [...new Set(bs.map(b => b.local))].join(' · ') }));
      const aRec = { mod: 'Patrimonio', tipo: 'Acta de asignación de bienes en uso', office: 'Oficina de Control Patrimonial', key: r => 'Asignación ' + r.resp, title: r => 'Bienes asignados a ' + r.resp, cls: false,
        fields: r => [['Responsable', r.resp], ['Bienes a su cargo', r.n], ['Valor total', U.money(r.v)], ['Ubicaciones', r.locs, 1]],
        body: r => `<div class="lbl-s mt mb">Bienes a cargo</div>` + U.table([{ k: 'cod', label: 'Código', render: b => `<span class="code">${b.cod}</span>` }, { k: 'desc', label: 'Bien' }, { k: 'estado', label: 'Estado' }, { k: 'valor', label: 'Valor', r: true, render: b => U.money(b.valor) }], r.bs, { onRow: b => U.rec(bienRec).ver(b) }),
        extra: r => [{ icon: 'fa-right-left', label: 'Transferir todos a otro responsable', fn: x => this.asignar(x.bs) }, { icon: 'fa-file-signature', label: 'Constancia de no adeudo de bienes', menuOnly: true, fn: x => U.preview('Constancia de no adeudo de bienes · ' + x.resp, U.doc({ tipo: 'Constancia de no adeudo de bienes', num: 'CNB-2026-' + U.pad(rows.indexOf(x) + 41, 4), office: 'Oficina de Control Patrimonial', body: x.n ? `<p>El servidor <b>${x.resp}</b> mantiene a su cargo ${x.n} bien(es) por ${U.money(x.v)}; la constancia se emite cuando los devuelva o transfiera.</p>` : '<p>No mantiene bienes a su cargo.</p>' }), { file: 'no_adeudo_bienes' }) }],
        print: r => ({ tipo: 'Acta de asignación de bienes en uso', num: 'ASG-' + r.resp.replace(/\W/g, '').toUpperCase().slice(0, 8), pairs: [['Responsable', r.resp], ['Ubicaciones', r.locs, 1]], body: dtbl([['Código'], ['Bien'], ['Marca / serie'], ['Estado'], ['Valor', 1]], r.bs.map(b => [b.cod, U.esc(b.desc), b.marca + ' · ' + b.serie, b.estado, U.money(b.valor, '')])) + `<p class="mini">El responsable declara recibir los bienes en el estado indicado y se compromete a su custodia y uso exclusivo para fines institucionales (Directiva SBN).</p>`, firmas: [['Entrega', 'Oficina de Control Patrimonial'], ['Recibe', r.resp], ['V.º B.º', 'Jefe inmediato']] }) };
      document.getElementById('pa-p-asg').innerHTML = `<div class="card"><h3><span class="dot"></span>Bienes asignados en uso por responsable <span class="grow">acta de asignación firmada · constancia de no adeudo al cese</span></h3><div id="pa-ta"></div></div>`;
      document.getElementById('pa-ta').innerHTML = U.grid({ id: 'pat-asg', title: 'asignaciones', export: 'asignaciones_en_uso', rows, record: aRec,
        cols: [{ k: 'resp', label: 'Responsable', render: r => `<b>${r.resp}</b>` }, { k: 'n', label: 'Bienes', r: true }, { k: 'v', label: 'Valor', r: true, render: r => U.money(r.v) }, { k: 'locs', label: 'Ubicaciones', cls: 'mini' }],
        actions: [{ icon: 'fa-file-signature', title: 'Acta de asignación', fn: r => U.rec(aRec).imprimir(r) }] });
    },
    paintMov() {
      const U = SIGA.ui, MCL = { Alta: 't-green', 'Asignación en uso': 't-teal', Desplazamiento: 't-blue', 'Devolución': 't-amber', Mejora: 't-blue', Baja: 't-red' };
      const mRec = { mod: 'Patrimonio', tipo: 'Papeleta de movimiento patrimonial', office: 'Oficina de Control Patrimonial', key: m => m.num, title: m => m.num + ' · ' + m.tipo, cls: false,
        fields: m => [['N.º', m.num], ['Fecha', m.fecha], ['Tipo', U.tag(m.tipo, MCL[m.tipo])], ['Bien', m.cod + ' · ' + ((bien(m.cod) || {}).desc || ''), 1], ['Origen', m.de], ['Destino', m.a], ['Documento', m.doc]],
        extra: m => bien(m.cod) ? [{ icon: 'fa-box', label: 'Ver ficha del bien', fn: x => U.rec(bienRec).ver(bien(x.cod)) }] : [],
        print: m => ({ tipo: 'Papeleta de ' + m.tipo.toLowerCase(), num: m.num, body: dtbl([['Código'], ['Bien'], ['Origen'], ['Destino']], [[m.cod, U.esc((bien(m.cod) || {}).desc || ''), m.de, m.a]]), firmas: [['Entrega', m.de], ['Recibe', m.a], ['Control Patrimonial', 'Jefe de Patrimonio']] }) };
      document.getElementById('pa-tm').innerHTML = U.grid({ id: 'pat-mov', title: 'movimientos', export: 'movimientos_patrimoniales', rows: PA.movimientos, record: mRec, filter: { label: 'Tipo', get: m => m.tipo },
        cols: [{ k: 'num', label: 'N.º', render: m => `<span class="code">${m.num}</span>` }, { k: 'fecha', label: 'Fecha', sv: m => m.fecha.split('/').reverse().join('') }, { k: 'tipo', label: 'Tipo', render: m => U.tag(m.tipo, MCL[m.tipo]) }, { k: 'cod', label: 'Bien', render: m => `<span class="code">${m.cod}</span><div class="mini">${U.esc((bien(m.cod) || {}).desc || '')}</div>` }, { k: 'de', label: 'Origen' }, { k: 'a', label: 'Destino' }, { k: 'doc', label: 'Documento', cls: 'mini' }],
        rowCls: m => m.nuevo ? 'row-new' : '', actions: [{ icon: 'fa-print', title: 'Papeleta', fn: m => U.rec(mRec).imprimir(m) }] });
    },
    paintInv(invT, invV) {
      const U = SIGA.ui, I = PA.inventario;
      const hRec = { mod: 'Patrimonio', tipo: 'Hallazgo de inventario', key: h => h.id, title: h => h.id + ' · ' + h.tipo + ' · ' + h.desc, cls: false,
        fields: h => [['Hallazgo', h.id], ['Tipo', U.tag(h.tipo, h.tipo === 'Sobrante' ? 't-blue' : 't-red')], ['Local', h.local], ['Bien', U.esc(h.desc), 1], ['Valor estimado', U.money(h.valor)], ['Estado', h.estado], ...(h.resp ? [['Responsable registrado', h.resp]] : []), ...(h.cod ? [['Código patrimonial', h.cod]] : [])],
        extra: h => h.estado === 'Regularizado' ? [] : h.tipo === 'Sobrante' ? [{ icon: 'fa-plus', label: 'Regularizar: alta por sobrante', fn: x => this.regSobrante(x) }] : [{ icon: 'fa-magnifying-glass-location', label: 'Bien ubicado (regularizar)', fn: x => { x.estado = 'Regularizado'; const b = bien(x.cod); if (b) b.situacion = 'En uso'; SIGA.log('Patrimonio', 'Faltante ubicado', x.id, 'Faltante', 'Ubicado en ' + x.local); U.closeModal(); U.toast(x.id + ' regularizado · bien ubicado'); SIGA.refresh(); } }, ...(h.estado !== 'En deslinde de responsabilidad' ? [{ icon: 'fa-gavel', label: 'Iniciar deslinde de responsabilidad', fn: x => { x.estado = 'En deslinde de responsabilidad'; const b = bien(x.cod); if (b) b.situacion = 'Faltante'; SIGA.log('Patrimonio', 'Deslinde de responsabilidad', x.id, 'Por regularizar', 'Informe a la Secretaría Técnica PAD · ' + (x.resp || '')); U.closeModal(); U.toast('Deslinde iniciado · informe remitido a la Secretaría Técnica'); SIGA.refresh(); } }] : [])] };
      document.getElementById('pa-p-inv').innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Toma de inventario físico ${I.anio} · avance por local <span class="grow">inicio ${I.inicio} · lectura de QR con el móvil</span></h3>
        ${U.bars(Object.entries(I.avance).map(([l, x], i) => [l, x[1] / x[0] * 100, x[1] >= x[0] ? 'var(--primary)' : x[1] / x[0] > 0.7 ? U.chart.PAL[1] : U.chart.PAL[2], U.int(x[1]) + ' / ' + U.int(x[0])]))}</div>
        <div><div class="saldo-box mb"><div class="lab">Avance institucional</div><div class="big">${U.pct(invV, invT)}</div><div class="row"><span>Bienes verificados</span><span>${U.int(invV)}</span></div><div class="row"><span>Por verificar</span><span>${U.int(invT - invV)}</span></div><div class="row"><span>Sobrantes</span><span>${I.hallazgos.filter(h => h.tipo === 'Sobrante').length}</span></div><div class="row"><span>Faltantes</span><span class="g">${I.hallazgos.filter(h => h.tipo === 'Faltante').length}</span></div></div>
          <div class="card"><h3><span class="dot"></span>Verificar un bien</h3><div class="fgrid"><div class="fld fspan2"><label>Código patrimonial (lectura de QR)</label><input id="inv-code" placeholder="740880370089-0001"></div></div><div class="row-flex mt"><button class="btn" id="inv-go"><i class="fa-solid fa-qrcode"></i> Verificar</button><button class="btn ghost" id="inv-acta"><i class="fa-solid fa-print"></i> Acta de conciliación</button></div><div id="inv-out" class="mt"></div></div></div></div>
        <div class="card"><h3><span class="dot"></span>Sobrantes y faltantes <span class="grow">se regularizan con alta por sobrante o deslinde de responsabilidad</span></h3><div id="inv-h"></div></div>`;
      document.getElementById('inv-h').innerHTML = U.grid({ id: 'pat-inv', title: 'hallazgos', export: 'hallazgos_inventario_2026', rows: I.hallazgos, record: hRec, search: false,
        cols: [{ k: 'id', label: 'Hallazgo', render: h => `<span class="code">${h.id}</span>` }, { k: 'tipo', label: 'Tipo', render: h => U.tag(h.tipo, h.tipo === 'Sobrante' ? 't-blue' : 't-red') }, { k: 'local', label: 'Local' }, { k: 'desc', label: 'Bien' }, { k: 'valor', label: 'Valor', r: true, render: h => U.money(h.valor) }, { k: 'estado', label: 'Estado', render: h => U.tag(h.estado, h.estado === 'Regularizado' ? 't-green' : h.estado.startsWith('En deslinde') ? 't-red' : 't-amber') }] });
      const go = () => {
        const c = document.getElementById('inv-code').value.trim(), b = bien(c), out = document.getElementById('inv-out');
        if (!b) { out.innerHTML = `<div class="note warn" style="margin:0"><i class="fa-solid fa-circle-question"></i><div>Código no registrado. Si el bien existe físicamente, regístrelo como <b>sobrante</b>.</div></div>`; return; }
        const loc = Object.keys(I.avance).find(l => l === b.local); if (loc && !b.verif) { I.avance[loc][1] = Math.min(I.avance[loc][0], I.avance[loc][1] + 1); b.verif = true; }
        SIGA.log('Patrimonio', 'Verificación de inventario', b.cod, '—', 'Verificado en ' + b.local);
        out.innerHTML = `<div class="note teal" style="margin:0"><i class="fa-solid fa-circle-check"></i><div><b>${U.esc(b.desc)}</b> · ${b.marca}<br>Responsable ${b.resp} · ${b.local} · estado ${b.estado}. Verificado para la toma ${I.anio}.</div></div>`;
      };
      document.getElementById('inv-go').addEventListener('click', go);
      document.getElementById('inv-code').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      document.getElementById('inv-acta').addEventListener('click', () => U.preview('Acta de conciliación del inventario físico ' + I.anio, U.doc({ tipo: 'Acta de inventario físico', num: 'INV-PAT-' + I.anio, office: 'Comisión de inventario · Control Patrimonial', pairs: [['Bienes verificados', U.int(invV) + ' de ' + U.int(invT)], ['Avance', U.pct(invV, invT)]], body: dtbl([['Local'], ['Total', 1], ['Verificados', 1], ['Avance', 1]], Object.entries(I.avance).map(([l, x]) => [l, U.int(x[0]), U.int(x[1]), U.pct(x[1], x[0])])) + dtbl([['Hallazgo'], ['Tipo'], ['Bien'], ['Valor', 1], ['Estado']], I.hallazgos.map(h => [h.id, h.tipo, U.esc(h.desc), U.money(h.valor, ''), h.estado])), firmas: [['Presidente de la comisión', 'Jefe de Patrimonio'], ['Miembro', 'Contador General'], ['Veedor', 'Órgano de Control Institucional']] }), { file: 'acta_inventario_' + I.anio }));
    },
    paintBajas() {
      const U = SIGA.ui;
      const jRec = { mod: 'Patrimonio', tipo: 'Resolución de baja de bienes', office: 'Dirección General de Administración', key: x => x.num, title: x => x.num + ' · ' + x.bien, estado: 'estado', cls: false, anuladoValor: 'Rechazada',
        fields: x => [['N.º', x.num], ['Fecha', x.fecha], ['Bien', U.esc(x.bien), 1], ['Código', x.cod], ['Causal (SBN)', x.causal], ['Valor', U.money(x.valor)], ['Informe técnico', x.informe], ['Resolución', x.resol || 'pendiente'], ['Estado', U.tag(x.estado, x.estado === 'Aprobada' ? 't-green' : x.estado === 'Rechazada' ? 't-gray' : 't-amber')]],
        body: x => U.timeline([{ t: 'Informe técnico', sub: x.informe, st: 'done' }, { t: 'Informe de Control Patrimonial', st: 'done' }, { t: 'Resolución de baja (DGA)', sub: x.resol, st: x.estado === 'Aprobada' ? 'done' : x.estado === 'Rechazada' ? 'bad' : 'cur' }, { t: 'Acto de disposición final', sub: x.estado === 'Aprobada' ? 'donación / subasta / destrucción RAEE' : '', st: x.estado === 'Aprobada' ? 'cur' : '' }]),
        extra: x => x.estado === 'En trámite' ? [{ icon: 'fa-stamp', label: 'Aprobar baja (DGA)', fn: API.aprobarBaja }] : [],
        anular: true, anularLabel: 'Rechazar solicitud de baja', canAnular: x => x.estado === 'En trámite', onAnular: x => { const b = bien(x.cod); if (b) b.situacion = 'En uso'; },
        print: x => ({ tipo: 'Resolución de baja', num: x.resol || x.num, body: `<p>Se resuelve dar de baja el bien <b>${U.esc(x.bien)}</b> (código ${x.cod}), valorizado en ${U.money(x.valor)}, por la causal <b>${x.causal}</b>, conforme al ${x.informe} y a las normas de la Superintendencia Nacional de Bienes Estatales.</p>` }) };
      document.getElementById('pa-tj').innerHTML = U.grid({ id: 'pat-baj', title: 'bajas', export: 'bajas_patrimoniales', rows: PA.bajas, record: jRec, filter: { label: 'Estado', get: x => x.estado },
        cols: [{ k: 'num', label: 'N.º', render: x => `<span class="code">${x.num}</span>` }, { k: 'fecha', label: 'Fecha', sv: x => x.fecha.split('/').reverse().join('') }, { k: 'bien', label: 'Bien', render: x => U.esc(x.bien) + `<div class="mini">${x.cod}</div>` }, { k: 'causal', label: 'Causal' }, { k: 'valor', label: 'Valor', r: true, render: x => U.money(x.valor) }, { k: 'resol', label: 'Resolución', cls: 'mini' }, { k: 'estado', label: 'Estado', render: x => U.tag(x.estado, x.estado === 'Aprobada' ? 't-green' : x.estado === 'Rechazada' ? 't-gray' : 't-amber') }],
        rowCls: x => x.nuevo ? 'row-new' : '', actions: [{ icon: 'fa-stamp', title: 'Aprobar (DGA)', show: x => x.estado === 'En trámite', fn: API.aprobarBaja }] });
    },
    paintDep() {
      const U = SIGA.ui, rows = PA.cuentas.filter(c => c[3]).map(c => ({ cta: c[0], nom: c[1], base: c[2], tasa: c[3], mes: c[2] * c[3] / 100 / 12 }));
      const tot = rows.reduce((s, r) => s + r.mes, 0), dm = SIGA.modules.contabilidad;
      document.getElementById('pa-p-dep').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Depreciación mensual por subcuenta <span class="grow">línea recta · tasas de la Directiva de la DGCP</span></h3><div id="dep-t"></div>
        <div class="row-flex mt"><button class="btn" id="dep-go" ${K.depAgosto ? 'disabled' : ''}><i class="fa-solid fa-calculator"></i> ${K.depAgosto ? 'Depreciación de agosto registrada' : 'Calcular depreciación de agosto'}</button><span class="mini">Genera el asiento 5801 / 1508 en Contabilidad (un solo cálculo para ambos módulos).</span></div></div>
        <div class="card"><h3><span class="dot"></span>Depreciación mensual estimada <span class="grow">soles</span></h3>${U.chart.cols({ labels: rows.map(r => r.nom.split(' ')[0]), series: [{ name: 'Depreciación del mes', data: rows.map(r => Math.round(r.mes)) }], fmt: v => U.money(v), axFmt: v => U.int(v / 1000) + 'k', h: 230 })}</div></div>`;
      document.getElementById('dep-t').innerHTML = U.grid({ id: 'pat-dep', title: 'depreciación', export: 'depreciacion_subcuentas', rows, search: false,
        cols: [{ k: 'cta', label: 'Subcuenta', render: r => `<span class="code">${r.cta}</span>` }, { k: 'nom', label: 'Denominación' }, { k: 'base', label: 'Valor depreciable', r: true, render: r => U.money(r.base, '') }, { k: 'tasa', label: 'Tasa', r: true, render: r => r.tasa + '%' }, { k: 'mes', label: 'Depreciación mensual', r: true, render: r => U.money(r.mes, '') }],
        foot: `<tr><td colspan="4" class="r"><b>Total mensual institucional</b></td><td class="r num"><b>${U.money(tot, '')}</b></td></tr>` });
      document.getElementById('dep-go').addEventListener('click', () => { if (SIGA.ctx.user.readOnly) { U.toast('El rol OCI tiene acceso de solo consulta', 'err'); return; } const m = dm.depreciar(); U.toast('Depreciación de agosto registrada · ' + U.money(m) + ' · asiento en Contabilidad'); SIGA.refresh(); });
    },
    paintCon(C) {
      const U = SIGA.ui, dif = C.filter(c => Math.abs(c.dif) > 0.005);
      document.getElementById('pa-p-con').innerHTML = `<div class="card"><h3><span class="dot"></span>Conciliación Patrimonio – Contabilidad · cuenta 1503 <span class="grow">en línea · cada alta, baja o mejora actualiza ambos registros</span></h3><div id="con-t"></div>
        ${dif.length ? `<div class="note warn mt" style="margin-bottom:0"><i class="fa-solid fa-scale-unbalanced"></i><div>Hay ${dif.length} subcuenta(s) con diferencia: activos devengados en Contabilidad que aún no tienen <b>alta patrimonial</b>. Regístrelos con "Alta de bien".</div></div>` : `<div class="note teal mt" style="margin-bottom:0"><i class="fa-solid fa-circle-check"></i><div>Patrimonio y Contabilidad coinciden en todas las subcuentas: se elimina la conciliación manual de fin de año.</div></div>`}
        <div class="row-flex mt"><button class="btn ghost" id="con-acta"><i class="fa-solid fa-print"></i> Acta de conciliación</button></div></div>`;
      document.getElementById('con-t').innerHTML = U.grid({ id: 'pat-con', title: 'conciliación', export: 'conciliacion_patrimonio_contabilidad', rows: C, search: false,
        cols: [{ k: 'cta', label: 'Subcuenta', render: r => `<span class="code">${r.cta}</span>` }, { k: 'nom', label: 'Denominación' }, { k: 'pat', label: 'Según Patrimonio', r: true, render: r => U.money(r.pat, '') }, { k: 'con', label: 'Según Contabilidad', r: true, render: r => U.money(r.con, '') }, { k: 'dif', label: 'Diferencia', r: true, render: r => `<b class="${Math.abs(r.dif) > 0.005 ? 'saldo-neg' : 'saldo-pos'}">${U.money(r.dif, '')}</b>` }, { k: 'e', label: 'Estado', render: r => Math.abs(r.dif) > 0.005 ? U.tag('Alta pendiente', 't-red') : U.tag('Conciliado', 't-green') }],
        actions: [{ icon: 'fa-plus', title: 'Registrar alta pendiente', show: r => r.dif > 0.005, fn: r => this.alta(r) }],
        foot: `<tr><td colspan="2" class="r"><b>Total 1503</b></td><td class="r num"><b>${U.money(C.reduce((s, c) => s + c.pat, 0), '')}</b></td><td class="r num"><b>${U.money(C.reduce((s, c) => s + c.con, 0), '')}</b></td><td class="r num"><b>${U.money(C.reduce((s, c) => s + c.dif, 0), '')}</b></td><td colspan="2"></td></tr>` });
      document.getElementById('con-acta').addEventListener('click', () => U.preview('Acta de conciliación Patrimonio–Contabilidad', U.doc({ tipo: 'Conciliación patrimonial-contable', num: 'CPC-2026-08', office: 'Control Patrimonial · Contabilidad', body: dtbl([['Subcuenta'], ['Denominación'], ['Patrimonio', 1], ['Contabilidad', 1], ['Diferencia', 1]], C.map(c => [c.cta, c.nom, U.money(c.pat, ''), U.money(c.con, ''), U.money(c.dif, '')])), firmas: [['Jefe de Control Patrimonial', 'Firma digital'], ['Contador General', 'R. Soto'], ['Director General de Administración', 'E. Mendoza']] }), { file: 'conciliacion_patrimonio_contabilidad' }));
    },

    /* ---------- Operaciones ---------- */
    alta(pend) {
      const U = SIGA.ui, cats = [...new Map(PA.bienes.map(b => [b.sbn, b])).values()];
      U.bigForm({
        title: 'Alta de bien patrimonial', icon: 'fa-plus',
        sections: [
          { title: 'Identificación (catálogo SBN)', cols: 3, fields: [
            { k: 'cat', label: 'Catálogo de bienes (SBN)', type: 'select', options: cats.map(b => b.sbn + ' · ' + b.desc), span: 2 }, { k: 'cant', label: 'Cantidad (una ficha por unidad)', type: 'number', value: 1, span: 1 },
            { k: 'marca', label: 'Marca / modelo', value: '', span: 2 }, { k: 'serie', label: 'Serie', value: '', span: 1 } ] },
          { title: 'Origen y valor', cols: 3, fields: [
            { k: 'origen', label: 'Documento de origen', value: pend ? 'Devengado ' + pend.cta : 'O/C 000', span: 1 }, { k: 'valor', label: 'Valor unitario S/', type: 'number', value: pend ? Math.round(pend.dif * 100) / 100 : 0, span: 1, required: true },
            { k: 'cuenta', label: 'Cuenta contable', type: 'select', options: PA.cuentas.map(c => c[0] + ' · ' + c[1]), value: pend ? pend.cta + ' · ' + pend.nom : undefined, span: 1 } ] },
          { title: 'Asignación inicial', cols: 3, fields: [
            { k: 'local', label: 'Local', type: 'select', options: PA.locales, span: 2 }, { k: 'resp', label: 'Responsable', value: SIGA.ctx.user.nombre, span: 1 } ] }
        ],
        status: (r, v) => pend ? `<div class="note info"><i class="fa-solid fa-link"></i><div>Alta para conciliar la subcuenta ${pend.cta}: el activo ya fue devengado en Contabilidad (diferencia ${U.money(pend.dif)}). No se genera un segundo asiento.</div></div>` : `<div class="note teal"><i class="fa-solid fa-circle-info"></i><div>Si el bien proviene de una orden ya devengada, el asiento contable existe. Para donaciones o sobrantes se genera el asiento 1503 / 4501.</div></div>`,
        submitLabel: 'Registrar alta',
        onSubmit: v => {
          const n = Math.max(1, parseInt(v.cant, 10) || 1), val = parseFloat(v.valor) || 0, sbn = v.cat.split(' · ')[0], base = PA.bienes.find(b => b.sbn === sbn), cta = v.cuenta.split(' · ')[0];
          if (val <= 0) { U.toast('Indique el valor del bien', 'err'); return; }
          const nuevos = [];
          for (let i = 0; i < n; i++) { const corr = PA.bienes.filter(b => b.sbn === sbn).length + 1; const b = { sbn, cod: sbn + '-' + U.pad(corr, 4), desc: base.desc, marca: v.marca || base.marca, serie: v.serie ? v.serie + (n > 1 ? '-' + (i + 1) : '') : 'S/N', cuenta: cta, fecha: SIGA.ctx.hoy, valor: val, tasa: (PA.cuentas.find(c => c[0] === cta) || [0, 0, 0, 10])[3], local: v.local, resp: v.resp, estado: 'Bueno', situacion: 'En uso', origen: v.origen, nuevo: true }; PA.bienes.unshift(b); nuevos.push(b); mov('Alta', b.cod, 'Almacén central', v.local, v.origen); }
          if (!pend && !/^O\/C|^Devengado/.test(v.origen)) SIGA.asiento('Alta de bienes por ' + v.origen + ' · ' + base.desc, [['1503', val * n, 0], ['4501', 0, val * n]], 'Patrimonio');
          SIGA.log('Patrimonio', 'Alta de bien', nuevos[0].cod + (n > 1 ? ' y ' + (n - 1) + ' más' : ''), '—', U.money(val * n) + ' · ' + v.origen);
          U.closeModal(); SIGA.refresh(); U.toast(`${n} bien(es) incorporado(s) al registro patrimonial · etiquetas QR listas`);
          this.etiquetas(nuevos);
        }
      });
    },
    asignar(bs) {
      const U = SIGA.ui; if (!bs.length) return;
      const resp = [...new Set(PA.bienes.map(b => b.resp).concat(SIGA.ctx.users.map(u => u.nombre)))].sort();
      U.formModal('<i class="fa-solid fa-user-check"></i> Asignación en uso · ' + bs.length + ' bien(es)', [{ k: 'r', label: 'Nuevo responsable', type: 'select', options: resp }, { k: 'o', label: 'Observación', value: 'Para el cumplimiento de sus funciones' }], v => {
        const n = 'Acta N.º 0' + (185 + PA.movimientos.filter(m => m.nuevo).length) + '-2026';
        bs.forEach(b => { const a = b.resp; b.resp = v.r; b.situacion = 'En uso'; mov('Asignación en uso', b.cod, a, v.r, n); });
        SIGA.log('Patrimonio', 'Asignación en uso', bs.map(b => b.cod).join(', ').slice(0, 60), bs[0].resp, v.r + ' · ' + n);
        U.closeModal(); SIGA.refresh(); U.toast(bs.length + ' bien(es) asignado(s) a ' + v.r + ' · ' + n + ' lista para firma');
        U.preview('Acta de asignación en uso · ' + v.r, U.doc({ tipo: 'Acta de asignación de bienes en uso', num: n, office: 'Oficina de Control Patrimonial', pairs: [['Responsable', v.r], ['Observación', U.esc(v.o), 1]], body: dtbl([['Código'], ['Bien'], ['Local'], ['Estado'], ['Valor', 1]], bs.map(b => [b.cod, U.esc(b.desc), b.local, b.estado, U.money(b.valor, '')])), firmas: [['Entrega', 'Control Patrimonial'], ['Recibe', v.r], ['V.º B.º', 'Jefe inmediato']] }), { file: 'acta_asignacion_' + n.replace(/\W/g, '') });
      }, 'Asignar y emitir acta');
    },
    desplazar(bs) {
      const U = SIGA.ui; if (!bs.length) return;
      U.formModal('<i class="fa-solid fa-right-left"></i> Desplazamiento · ' + bs.length + ' bien(es)', [{ k: 'l', label: 'Local de destino', type: 'select', options: PA.locales }, { k: 'm', label: 'Motivo', value: 'Reubicación por necesidad del servicio' }], v => {
        bs.forEach(b => { const a = b.local; b.local = v.l; mov('Desplazamiento', b.cod, a, v.l, 'Papeleta de desplazamiento'); });
        SIGA.log('Patrimonio', 'Desplazamiento de bienes', bs.length + ' bienes', '—', v.l);
        U.closeModal(); SIGA.refresh(); U.toast(bs.length + ' bien(es) desplazado(s) a ' + v.l);
      }, 'Registrar desplazamiento');
    },
    devolver(bs) {
      const U = SIGA.ui;
      U.confirm(`¿Registrar la devolución de ${bs.length} bien(es) a la Oficina de Control Patrimonial? El responsable queda liberado de su custodia.`, () => {
        bs.forEach(b => { const a = b.resp; b.resp = 'Oficina de Patrimonio'; b.situacion = 'En almacén (devuelto)'; mov('Devolución', b.cod, a, 'Oficina de Patrimonio', 'Papeleta de devolución'); });
        SIGA.log('Patrimonio', 'Devolución de bienes', bs.map(b => b.cod).join(', ').slice(0, 60), 'En uso', 'Devuelto');
        U.toast('Devolución registrada · bien(es) en custodia de Patrimonio'); SIGA.refresh();
      }, 'Registrar devolución', '');
    },
    mejora(b) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-screwdriver-wrench"></i> Mejora del bien · ' + b.cod, [{ k: 'd', label: 'Descripción de la mejora', value: 'Ampliación de memoria y disco de estado sólido' }, { k: 'v', label: 'Valor de la mejora S/', type: 'number', value: 420, span: 1 }, { k: 'o', label: 'Documento (O/S)', value: 'O/S 000', span: 1 }], v => {
        const m = parseFloat(v.v) || 0; if (m <= 0) { U.toast('Indique el valor', 'err'); return; }
        b.mejora = (b.mejora || 0) + m; mov('Mejora', b.cod, '—', v.d, v.o + ' · ' + U.money(m));
        SIGA.asiento('Mejora de activo ' + b.cod + ' · ' + v.d, [['1503', m, 0], ['2103', 0, m]], 'Patrimonio');
        SIGA.log('Patrimonio', 'Mejora de bien', b.cod, U.money(b.valor), 'Mejora ' + U.money(m));
        U.closeModal(); SIGA.refresh(); U.toast('Mejora capitalizada · el valor del bien y la cuenta 1503 se actualizan');
      }, 'Registrar mejora');
    },
    proponerBaja(b) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-trash-can"></i> Solicitud de baja · ' + b.cod, [{ k: 'c', label: 'Causal (Directiva SBN)', type: 'select', options: ['Estado de excedencia', 'Obsolescencia técnica', 'Mantenimiento o reparación onerosa', 'Pérdida, robo o sustracción', 'Destrucción o siniestro', 'Residuos de aparatos eléctricos y electrónicos (RAEE)', 'Reembolso o reposición'] }, { k: 'i', label: 'Informe técnico', value: 'Informe técnico N.º 0' + (33 + PA.bajas.filter(x => x.nuevo).length) + '-2026', span: 1 }], v => {
        const x = { num: 'BAJ-PAT-2026-0' + U.pad(8 + PA.bajas.filter(k => k.nuevo).length, 2), fecha: SIGA.ctx.hoy, cod: b.cod, bien: b.desc + ' · ' + b.marca, causal: v.c, valor: b.valor, informe: v.i, resol: '', estado: 'En trámite', nuevo: true };
        PA.bajas.unshift(x); b.situacion = 'En proceso de baja';
        SIGA.log('Patrimonio', 'Solicitud de baja', x.num, '—', b.cod + ' · ' + v.c);
        U.closeModal(); SIGA.refresh(); U.toast(x.num + ' registrada · pasa a la bandeja de la DGA');
      }, 'Registrar solicitud');
    },
    regSobrante(h) {
      const U = SIGA.ui;
      U.confirm(`¿Dar de alta el sobrante <b>${U.esc(h.desc)}</b> (${U.money(h.valor)}) en ${h.local}? Se genera el asiento 1503 / 4501 (alta por sobrante de inventario).`, () => {
        const sbn = /silla/i.test(h.desc) ? '112227060143' : /estante|armario/i.test(h.desc) ? '112280370077' : '536499990001';
        const corr = PA.bienes.filter(b => b.sbn === sbn).length + 1, b = { sbn, cod: sbn + '-' + U.pad(corr, 4), desc: h.desc.split(' sin ')[0].split(' (')[0], marca: '—', serie: 'S/N', cuenta: /silla|estante|armario/i.test(h.desc) ? '1503.0301' : '1503.0303', fecha: SIGA.ctx.hoy, valor: h.valor, tasa: 10, local: h.local, resp: 'Oficina de Patrimonio', estado: 'Bueno', situacion: 'En uso', origen: 'Sobrante ' + h.id, nuevo: true };
        PA.bienes.unshift(b); h.estado = 'Regularizado'; h.cod = b.cod; mov('Alta', b.cod, 'Sobrante de inventario', h.local, h.id);
        SIGA.asiento('Alta por sobrante de inventario ' + h.id, [['1503', h.valor, 0], ['4501', 0, h.valor]], 'Patrimonio');
        SIGA.log('Patrimonio', 'Alta por sobrante', h.id, 'Por regularizar', 'Regularizado · ' + b.cod);
        U.toast('Sobrante regularizado · código ' + b.cod); SIGA.refresh();
      }, 'Dar de alta', '');
    },
    etiquetas(bs) {
      const U = SIGA.ui; if (!bs.length) return;
      U.preview('Etiquetas patrimoniales · ' + bs.length, `<div class="doc" style="position:static"><div class="lbl-grid">${bs.map(b => `<div class="lbl-card"><b>UNAS · PATRIMONIO</b><div class="row-flex" style="gap:8px">${U.qr(b.cod, 64)}<div><b style="font-size:11px">${U.esc(b.desc)}</b><div class="mini">${b.cuenta} · ${b.local}</div></div></div>${U.barcode(b.cod, 200, 42)}</div>`).join('')}</div></div>`, { file: 'etiquetas_patrimoniales' });
      SIGA.log('Patrimonio', 'Impresión de etiquetas', bs.length + ' bienes');
    },
    cuadroDep(b) {
      const U = SIGA.ui, y0 = pd(b.fecha).getFullYear(), anual = b.valor * b.tasa / 100, rows = []; let acc = 0;
      for (let y = y0; y <= 2026 && acc < b.valor - 0.005; y++) { const m = y === y0 ? 12 - pd(b.fecha).getMonth() : y === 2026 ? 8 : 12, d = Math.min(b.valor - acc, anual / 12 * m); acc += d; rows.push([y, U.money(d, ''), U.money(acc, ''), U.money(b.valor - acc, '')]); }
      U.preview('Cuadro de depreciación · ' + b.cod, U.doc({ tipo: 'Cuadro de depreciación', num: b.cod, office: 'Control Patrimonial', pairs: [['Bien', U.esc(b.desc), 1], ['Valor', U.money(b.valor)], ['Tasa', b.tasa + '% anual'], ['Alta', b.fecha]], body: dtbl([['Ejercicio'], ['Depreciación', 1], ['Acumulada', 1], ['Valor neto', 1]], rows) }), { file: 'depreciacion_' + b.cod });
    }
  });
})();
