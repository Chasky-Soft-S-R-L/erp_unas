/* ============================================================
   Control pecuario · interfaz por especie
   Resumen y lista de acciones · fichas individuales · lotes con curva
   estándar · reproducción · producción (control lechero, registro diario)
   · sanidad con período de retiro · alimentación por ración · movilización
   con CSTI · costos, liquidación de lote e indicadores contra metas
   ============================================================ */
(function () {
  const X = SIGA.pec;
  const D = () => SIGA.data.pecuario, ESP = () => D().especies;
  const TABS = {
    porcino: [['acc', 'Resumen y acciones', 'fa-list-check'], ['ani', 'Reproductores', 'fa-id-card'], ['lot', 'Lotes de recría y engorde', 'fa-layer-group'], ['rep', 'Reproducción', 'fa-venus-mars'], ['prd', 'Producción y sacas', 'fa-chart-column'], ['san', 'Sanidad', 'fa-syringe'], ['ali', 'Alimentación', 'fa-wheat-awn'], ['mov', 'Movilización · SENASA', 'fa-truck'], ['cos', 'Costos e indicadores', 'fa-scale-balanced']],
    vacuno: [['acc', 'Resumen y acciones', 'fa-list-check'], ['ani', 'Hato · fichas', 'fa-id-card'], ['rep', 'Reproducción', 'fa-venus-mars'], ['prd', 'Control lechero', 'fa-bottle-droplet'], ['san', 'Sanidad', 'fa-syringe'], ['ali', 'Alimentación', 'fa-wheat-awn'], ['mov', 'Movilización · SENASA', 'fa-truck'], ['cos', 'Costos e indicadores', 'fa-scale-balanced']],
    ave: [['acc', 'Resumen y acciones', 'fa-list-check'], ['lot', 'Lotes y galpones', 'fa-layer-group'], ['prd', 'Registro diario y postura', 'fa-clipboard-list'], ['san', 'Sanidad', 'fa-syringe'], ['ali', 'Alimentación', 'fa-wheat-awn'], ['mov', 'Movilización · SENASA', 'fa-truck'], ['cos', 'Costos e indicadores', 'fa-scale-balanced']],
    cuy: [['acc', 'Resumen y acciones', 'fa-list-check'], ['ani', 'Pozas de empadre', 'fa-table-cells'], ['lot', 'Recría y engorde', 'fa-layer-group'], ['rep', 'Reproducción', 'fa-venus-mars'], ['prd', 'Producción y sacas', 'fa-chart-column'], ['san', 'Sanidad', 'fa-syringe'], ['ali', 'Alimentación', 'fa-wheat-awn'], ['mov', 'Movilización · SENASA', 'fa-truck'], ['cos', 'Costos e indicadores', 'fa-scale-balanced']]
  };
  const REPCLS = { Lactando: 't-teal', Gestante: 't-green', Preñada: 't-green', Servida: 't-blue', Destetada: 't-amber', 'Repetición': 't-red', 'Nulípara': 't-gray', Seca: 't-gray', Activo: 't-teal', 'Vacía · espera voluntaria': 't-gray', 'Vacía · en observación de celo': 't-amber', 'Vacía · en desarrollo': 't-gray' };
  const EVCLS = { Parto: 't-green', Destete: 't-blue', Servicio: 't-blue', Inseminación: 't-blue', 'Monta natural': 't-blue', 'Diagnóstico de gestación': 't-blue', 'Saca a beneficio': 't-amber', 'Venta en pie': 't-amber', Beneficio: 't-amber', Mortalidad: 't-red', Muerte: 't-red', Descarte: 't-gray', Tratamiento: 't-red', Vacunación: 't-teal', Sanidad: 't-teal', Pesaje: 't-blue', Secado: 't-gray', Ordeño: 't-teal', 'Control lechero': 't-teal', Recolección: 't-teal', Ingreso: 't-green', Empadre: 't-blue', 'Cambio de etapa': 't-blue' };
  const nota = (cls, ic, html) => `<div class="note ${cls}"><i class="fa-solid ${ic}"></i><div>${html}</div></div>`;
  const dtbl = (head, rows) => `<div class="tbl-wrap"><table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i] && head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${head.length}" class="empty-row">Sin registros</td></tr>`}</tbody></table></div>`;
  const mes = s => /\/08\/2026$/.test(s || '');
  const INT = v => SIGA.ui.int(Math.round(+v || 0));
  const fx = (v, d) => (v == null || isNaN(v)) ? '—' : (+v).toFixed(d);

  SIGA.registerModule('pecuario', {
    title: 'Control pecuario', icon: 'fa-cow', group: 'Centros de Producción · RDR', badge: 'ZOOTEC', badgeHot: true,
    esp: 'porcino', aveSel: 'G2-08',

    ir(k, tab, after) { this.esp = k; SIGA.go('pecuario', { pc: tab }); if (after) setTimeout(after, 60); },
    alerts() {
      const out = [];
      Object.values(ESP()).forEach(e => {
        X.retiros(e).forEach(r => out.push({ lvl: r.tipo === 'Leche' || e.lotes.some(l => l.id === r.ref && X.lm(e, l).peso >= (l.pesoObj || 1e9) * 0.95) ? 'warn' : 'info', icon: 'fa-ban', t: `Retiro de ${r.tipo.toLowerCase()} · ${r.ref} hasta el ${r.hasta.slice(0, 5)}`, d: e.nombre + ' · ' + r.prod + (r.tipo === 'Carne' ? ' · saca y venta bloqueadas' : ' · leche descartada'), fn: () => this.ir(e.key, 'san') }));
        X.tareas(e).filter(t => t.prio === 'Alta' && /Parto|Destete|Secado|beneficio|saca/i.test(t.tipo)).slice(0, 3).forEach(t => out.push({ lvl: 'warn', icon: 'fa-list-check', t: t.tipo + ' · ' + t.ref, d: e.unidad + ' · ' + t.det, fn: () => this.ir(e.key, 'acc') }));
        e.plan.filter(p => p.estado === 'Programada' && -X.dd(p.f) >= 0 && -X.dd(p.f) <= 3).forEach(p => out.push({ lvl: 'info', icon: 'fa-syringe', t: `${p.act} · ${p.f.slice(0, 5)}`, d: e.nombre + ' · ' + p.obj, fn: () => this.ir(e.key, 'san') }));
        X.cobertura(e).filter(c => c.dias < 7).forEach(c => out.push({ lvl: 'warn', icon: 'fa-wheat-awn', t: `Alimento para ${c.dias.toFixed(1)} días · ${c.it.desc.split(' · ')[0]}`, d: e.unidad + ' · requerimiento ' + INT(c.kgDia) + ' kg/día' + (c.it.pendiente ? ' · pedido ' + c.it.pendiente : ''), fn: () => this.ir(e.key, 'ali') }));
      });
      return out;
    },
    search(q) {
      const out = [], U = SIGA.ui;
      Object.values(ESP()).forEach(e => {
        e.anim.filter(a => (a.id + ' ' + (a.nombre || '') + ' ' + a.rfid + ' ' + a.raza).toLowerCase().includes(q)).forEach(a => out.push({ t: a.id + (a.nombre ? ' · ' + a.nombre : '') + ' · ' + a.cat, d: e.nombre + ' · ' + (a.rep && a.rep !== '—' ? a.rep + ' · ' : '') + a.ubic, fn: () => this.ir(e.key, 'ani', () => U.rec(this.aniRec(e)).ver(a)) }));
        e.lotes.filter(l => (l.id + ' ' + l.ubic + ' ' + (l.linea || '')).toLowerCase().includes(q)).forEach(l => out.push({ t: 'Lote ' + l.id + ' · ' + l.etapa, d: e.nombre + ' · ' + l.cab + ' cab. · ' + l.ubic, fn: () => this.ir(e.key, l.tipo === 'Poza de empadre' ? 'ani' : 'lot', () => U.rec(this.lotRec(e)).ver(l)) }));
      });
      return out;
    },

    render(el) {
      const U = SIGA.ui, E = ESP(), e = E[this.esp], k = X.KP[e.key](e), T = X.tareas(e), rt = X.retiros(e), tabs = TABS[e.key];
      el.innerHTML = `
        <div class="page-head"><div><h1>Control pecuario · gestión zootécnica por especie</h1><p>Fichas individuales y lotes, reproducción, producción, sanidad con período de retiro, alimentación por ración, movilización con CSTI y costo por lote</p></div>
          <div class="row-flex"><button class="btn ghost" id="pc-rfid"><i class="fa-solid fa-wifi"></i> Lectura RFID</button><button class="btn ghost" id="pc-hoja"><i class="fa-solid fa-print"></i> Hoja de trabajo</button><button class="btn" id="pc-ev"><i class="fa-solid fa-plus"></i> Registrar evento</button></div></div>
        <div class="seg-tabs" id="esp-tabs">${Object.values(E).map(x => `<button data-e="${x.key}" class="${x.key === e.key ? 'on' : ''}"><i class="fa-solid ${x.icon}"></i> ${x.nombre} <span class="cnt-b">${INT(X.KP[x.key](x).total)}</span></button>`).join('')}</div>
        <div class="card mb pc-head">
          <div class="pc-id"><div class="pc-ic"><i class="fa-solid ${e.icon}"></i></div><div><b>${e.unidad}</b><span>${e.sub}</span><em>Centro de costo ${e.cc} · ${D().predio.codigo} · ${D().predio.nombre} · ${D().veterinarios[e.key === 'vacuno' ? 1 : 0]}</em></div></div>
          <div class="pc-pipe">${this.pipe(e, k)}</div></div>
        ${this.kpiCards(e, k)}
        ${rt.length ? nota('warn', 'fa-ban', `<b>${rt.length} período(s) de retiro vigente(s):</b> ${rt.map(r => `${r.ref} · ${r.tipo.toLowerCase()} hasta el ${r.hasta} (${r.rest} d)`).join(' · ')} — el sistema bloquea la saca y la venta, y descarta la leche.`) : ''}
        <div class="seg-tabs" data-group="pc">${tabs.map((t, i) => `<button data-tab="${t[0]}" class="${i ? '' : 'on'}"><i class="fa-solid ${t[2]}"></i> ${t[1]}${t[0] === 'acc' ? ` <span class="cnt-b">${T.length}</span>` : ''}</button>`).join('')}</div>
        ${tabs.map((t, i) => `<div class="subpanel ${i ? '' : 'show'}" data-group="pc" data-panel="${t[0]}" id="pc-p-${t[0]}"></div>`).join('')}`;
      el.querySelector('#esp-tabs').addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b || b.dataset.e === this.esp) return;
        const t = el.querySelector('.seg-tabs[data-group="pc"] button.on')?.dataset.tab;
        this.ir(b.dataset.e, TABS[b.dataset.e].some(x => x[0] === t) ? t : 'acc');
      });
      el.querySelector('#pc-ev').addEventListener('click', () => X.chooser());
      el.querySelector('#pc-rfid').addEventListener('click', () => this.rfid());
      el.querySelector('#pc-hoja').addEventListener('click', () => this.hoja(e, T));
      el.querySelectorAll('[data-pp]').forEach(b => b.addEventListener('click', () => SIGA.showTab(el, 'pc', b.dataset.pp)));
      tabs.forEach(t => this['p_' + t[0]](el.querySelector('#pc-p-' + t[0]), e, k, T));
    },

    /* ---------- Cabecera: flujo productivo y KPI con meta ---------- */
    pipe(e, k) {
      const U = SIGA.ui, st = (n, lab, sub, col, ic, tab) => `<button class="pp-st" style="--c:${col}" data-pp="${tab}"><i class="fa-solid ${ic}"></i><b>${n}</b><span>${lab}</span><em>${sub}</em></button>`;
      const cnt = re => e.anim.filter(a => a.estado === 'Activa' && re.test(a.rep)).length, act = e.lotes.filter(l => l.estado === 'Activo');
      const sac = e.mov.filter(m => mes(m.f) && /Saca|Venta|Descarte/.test(m.tipo) && !m.anulado);
      const arr = { porcino: () => [st(cnt(/Destetada|Repetición|Nulípara|Servida/), 'Servicio', 'por servir y servidas', '#0D6EFD', 'fa-venus-mars', 'rep'), st(cnt(/Gestante/), 'Gestación', 'partos en 7 días: ' + X.tareas(e).filter(t => t.tipo === 'Parto probable').length, '#16A34A', 'fa-person-pregnant', 'rep'), st(cnt(/Lactando/), 'Maternidad', k.cab.lech + ' lechones al pie', '#14967D', 'fa-baby', 'ani'), st(k.cab.rec, 'Recría', act.filter(l => l.tipo === 'Recría').length + ' lotes', '#D97706', 'fa-layer-group', 'lot'), st(k.cab.eng, 'Engorde', act.filter(l => l.tipo === 'Engorde').length + ' lotes', '#B45309', 'fa-weight-scale', 'lot'), st(X.sum(sac, 'cant'), 'Saca · agosto', INT(X.sum(sac, 'kg')) + ' kg', '#64748B', 'fa-truck', 'mov')],
        vacuno: () => [st(k.cab.ter, 'Terneros', 'crianza artificial', '#D97706', 'fa-baby', 'ani'), st(k.cab.vaq, 'Vaquillonas', e.anim.filter(a => a.cat === 'Vaquillona' && a.rep === 'Preñada').length + ' preñadas', '#0D6EFD', 'fa-seedling', 'rep'), st(k.cab.lac, 'En producción', INT(k.litros) + ' L/día', '#14967D', 'fa-bottle-droplet', 'prd'), st(k.cab.sec, 'Secas', 'período seco de 60 d', '#64748B', 'fa-droplet-slash', 'rep'), st(e.anim.filter(a => a.fParto && -X.dd(a.fParto) <= 30 && -X.dd(a.fParto) >= 0 && /Activ/.test(a.estado)).length, 'Partos en 30 días', 'calendario reproductivo', '#16A34A', 'fa-calendar-check', 'rep'), st(k.ccsAlta, 'CCS > 400', 'mastitis subclínica', '#DC2626', 'fa-virus', 'prd')],
        ave: () => [st(k.cab.cria, 'Cría (0–14 d)', act.filter(l => l.tipo === 'Pollos de engorde' && l.edad < 15).map(l => l.id).join(' · ') || '—', '#D97706', 'fa-egg', 'lot'), st(k.cab.eng, 'Engorde', act.filter(l => l.tipo === 'Pollos de engorde' && l.edad >= 15).map(l => l.id).join(' · '), '#14967D', 'fa-drumstick-bite', 'lot'), st(X.sum(sac, 'cant'), 'Beneficio · agosto', INT(X.sum(sac, 'kg')) + ' kg', '#64748B', 'fa-industry', 'mov'), st(X.sum(act.filter(l => l.etapa === 'Pre-postura'), 'cab'), 'Pre-postura', 'recría de pollitas', '#0D6EFD', 'fa-dove', 'lot'), st(X.sum(act.filter(l => l.etapa === 'Postura'), 'cab'), 'Postura', k.postura.toFixed(1) + ' % gallina-día', '#16A34A', 'fa-egg', 'prd'), st(INT(k.huevos), 'Huevos hoy', Math.round(k.huevos / 30) + ' bandejas', '#B45309', 'fa-basket-shopping', 'prd')],
        cuy: () => [st(k.cab.rep, 'Empadre', k.pozas + ' pozas · 1 macho × 10 hembras', '#0D6EFD', 'fa-venus-mars', 'ani'), st(k.cab.lac, 'Lactancia', 'destete a los 15 días', '#14967D', 'fa-baby', 'ani'), st(k.cab.rec, 'Recría', 'sexaje a los 28 días', '#D97706', 'fa-layer-group', 'lot'), st(k.cab.eng, 'Engorde', 'saca a 9–10 semanas', '#B45309', 'fa-weight-scale', 'lot'), st(X.sum(sac, 'cant'), 'Saca · agosto', INT(X.sum(sac, 'kg')) + ' kg', '#64748B', 'fa-truck', 'mov')] };
      return arr[e.key]().join('<i class="fa-solid fa-chevron-right pp-ar"></i>');
    },
    kpiCards(e, k) {
      const U = SIGA.ui, M = e.metas;
      const c = (lab, ic, val, sub, v, meta, up, mTx) => { const s = meta != null ? X.semaf(v, meta, up) : null; return `<div class="card kpi pc-kpi">${s ? `<div class="chip ${s === 'ok' ? 'up' : s === 'warn' ? 'warn' : 'down'}" title="Meta de la unidad">meta ${mTx}</div>` : ''}<div class="lab"><i class="fa-solid ${ic}"></i> ${lab}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`; };
      const L = {
        porcino: [c('Inventario', 'fa-piggy-bank', INT(k.total), `${k.cab.rep} cerdas · ${k.cab.ver} verracos · ${k.cab.lech} lechones · ${k.cab.rec} recría · ${k.cab.eng} engorde`), c('PSY', 'fa-chart-line', fx(k.psy, 1), 'destetados por cerda al año', k.psy, M.psy, true, M.psy), c('Nacidos vivos / parto', 'fa-baby', fx(k.nv, 2), `NT ${fx(k.nt, 2)} · ${k.partos} partos en 12 meses`, k.nv, M.nv, true, M.nv), c('Mortalidad predestete', 'fa-heart-crack', fx(k.mortPre, 1) + ' %', `${fx(k.dest, 1)} destetados por camada`, k.mortPre, M.mortPre, false, M.mortPre + ' %'), c('Tasa de parición', 'fa-venus', fx(k.paricion, 1) + ' %', `IDS ${fx(k.ids, 1)} d · DNP ${INT(k.dnp)} d/año`, k.paricion, M.paricion, true, M.paricion + ' %'), c('Engorde · GDP', 'fa-weight-scale', INT(k.gdp) + ' g/d', `FCR ${fx(k.fcr, 2)} · mortalidad ${fx(k.mortEng, 1)} %`, k.gdp, M.gdp, true, M.gdp)],
        vacuno: [c('Leche del día', 'fa-bottle-droplet', INT(k.litros) + ' L', `${k.cab.lac} vacas en ordeño · ${INT(k.desc)} L descartados por retiro`), c('Promedio por vaca', 'fa-chart-line', fx(k.prom, 1) + ' L', `proyección 305 d ${INT(k.p305)} L`, k.prom, M.leche, true, M.leche + ' L'), c('Días en leche', 'fa-calendar-days', INT(k.del) + ' d', `${fx(k.secas, 1)} % de vacas secas`, k.del, M.del, false, M.del + ' d'), c('CCS del tanque', 'fa-virus', INT(k.ccs) + ' mil', `${k.ccsAlta} vaca(s) con más de 400 mil/ml`, k.ccs, M.ccs, false, M.ccs), c('Intervalo entre partos', 'fa-rotate', INT(k.iep) + ' d', `días abiertos ${INT(k.dab)} · SPC ${fx(k.spc, 2)}`, k.iep, M.iep, false, M.iep + ' d'), c('Vacas preñadas', 'fa-venus', fx(k.preñez, 1) + ' %', 'de las vacas tras la espera voluntaria', k.preñez, M.preñez, true, M.preñez + ' %')],
        ave: [c('Aves en granja', 'fa-dove', INT(k.total), `${INT(k.cab.cria + k.cab.eng)} pollos · ${INT(k.cab.pos)} ponedoras`), c('EPEF', 'fa-gauge-high', INT(k.epef), 'eficiencia productiva europea', k.epef, M.epef, true, M.epef), c('Conversión (FCR)', 'fa-wheat-awn', fx(k.fcr, 2), 'lotes de 35 días o más', k.fcr, M.fcr, false, M.fcr), c('Viabilidad', 'fa-heart-pulse', fx(k.viab, 1) + ' %', `peso ${fx(k.peso42, 2)} kg · uniformidad ${INT(k.unif)} %`, k.viab, M.viab, true, M.viab + ' %'), c('Postura', 'fa-egg', fx(k.postura, 1) + ' %', `${INT(k.huevos)} huevos · ${fx(k.pesoHuevo, 1)} g`, k.postura, M.postura, true, M.postura + ' %'), c('Alimento por docena', 'fa-scale-balanced', fx(k.kgDoc, 2) + ' kg', 'ponedoras en producción', k.kgDoc, 1.6, false, '1.6')],
        cuy: [c('Población', 'fa-paw', INT(k.total), `${k.cab.rep} reproductores · ${k.cab.lac} lactantes · ${k.cab.rec} recría · ${k.cab.eng} engorde`), c('Tamaño de camada', 'fa-baby', fx(k.camada, 2), 'crías por parto', k.camada, M.camada, true, M.camada), c('Fertilidad', 'fa-venus', fx(k.fert, 1) + ' %', 'pozas con más de 75 días', k.fert, M.fert, true, M.fert + ' %'), c('Mortalidad lactancia', 'fa-heart-crack', fx(k.mortLact, 1) + ' %', 'de los nacidos vivos', k.mortLact, M.mortLact, false, M.mortLact + ' %'), c('Índice productivo', 'fa-chart-line', fx(k.ip, 2), 'crías logradas por hembra al mes', k.ip, M.ip, true, M.ip), c('Peso a la saca', 'fa-weight-scale', fx(k.peso, 2) + ' kg', `FCR ${fx(k.fcr, 2)}`, k.peso, M.peso, true, M.peso + ' kg')]
      };
      return `<div class="grid cols-6 mb">${L[e.key].join('')}</div>`;
    },

    /* ---------- Registros (acciones estándar por fila) ---------- */
    evRec(e) {
      const U = SIGA.ui;
      return { mod: 'Control pecuario', tipo: 'Parte de evento zootécnico', office: 'Centro de Producción · ' + e.unidad, key: r => r.ref + ' ' + r.tipo + ' ' + r.f, title: r => r.tipo + ' · ' + r.ref + ' · ' + r.f, estado: 'est', cls: false,
        fields: r => [['Fecha', r.f], ['Evento', U.tag(r.tipo, EVCLS[r.tipo] || 't-gray')], ['Animal / lote', `<span class="code">${U.esc(r.ref)}</span>`], ['Cantidad', r.cant], ['Detalle', U.esc(r.det), 1], ['Registrado por', r.user], ['Especie · unidad', e.nombre + ' · ' + e.unidad]],
        edit: [{ k: 'det', label: 'Detalle / observación', span: 2 }], anular: true, anularLabel: 'Anular evento (corrección)',
        extra: r => { const x = X.findRef(e, r.ref.split(' ')[0]); return x ? [{ icon: 'fa-id-card', label: 'Abrir ficha de ' + x.id, fn: () => SIGA.ui.rec(X.esLote(x) ? this.lotRec(e) : this.aniRec(e)).ver(x) }] : []; } };
    },
    nextEv(e, a) {
      if (e.key === 'porcino') return { Gestante: 'parto', Servida: 'diag', Lactando: 'destete', Destetada: 'servicio', 'Repetición': 'servicio', 'Nulípara': 'servicio' }[a.rep] || null;
      if (a.cat === 'Ternero') return a.lecheCons > 0 ? 'destete' : 'pesaje';
      if (a.rep === 'Servida') return 'diag';
      if (/Vacía/.test(a.rep)) return a.cat === 'Vaquillona' && a.rep === 'Vacía · en desarrollo' ? 'pesaje' : 'servicio';
      if (a.rep === 'Seca' || (a.rep === 'Preñada' && a.cat === 'Vaquillona')) return 'parto';
      if (a.rep === 'Preñada') return -X.dd(a.fParto) <= 65 ? 'secado' : 'control';
      return a.cat === 'Vaca en producción' ? 'control' : null;
    },
    prox(e, a) {
      if (!/Activ/.test(a.estado)) return 'Baja · ' + ((a.baja && a.baja.f) || '');
      if (a.cat === 'Verraco' || a.cat === 'Toro') return 'Último servicio ' + (a.ultServ || '—');
      if (a.cat === 'Ternero') return a.lecheCons > 0 ? 'Destete ' + X.addD(a.nac, 90) : 'Recría';
      if (e.key === 'porcino') return { Gestante: 'Parto ' + a.fParto, Servida: 'Diagnóstico ' + X.addD(a.fServ || SIGA.ctx.hoy, 28), Lactando: 'Destete ' + X.addD(a.fUltParto, 21), Destetada: 'Servicio (celo)', 'Repetición': 'Reservicio', 'Nulípara': 'Primer servicio' }[a.rep] || '—';
      if (a.rep === 'Servida') return 'Palpación ' + X.addD(a.fServ, 40);
      if (a.rep === 'Preñada' || a.rep === 'Seca') return (a.cat === 'Vaca en producción' ? 'Secado ' + X.addD(a.fParto, -60) + ' · ' : '') + 'Parto ' + a.fParto;
      if (a.rep === 'Vacía · espera voluntaria') return 'Servicio desde ' + X.addD(a.fUltParto, 50);
      return a.rep === 'Vacía · en observación de celo' ? 'Servicio al celo' : '—';
    },
    aniRec(e) {
      const U = SIGA.ui, M = this;
      return {
        mod: 'Control pecuario', tipo: 'Ficha zootécnica', office: 'Centro de Producción · ' + e.unidad, key: a => a.id, title: a => a.id + (a.nombre ? ' · ' + a.nombre : '') + ' · ' + a.cat, estado: 'estado', cls: false, anuladoValor: 'Baja',
        fields: a => {
          const rt = X.retiroDe(e, a.id), rl = X.retiroDe(e, a.id, 'Leche');
          const base = [['Identificación', `<span class="code">${a.id}</span> · RFID ${a.rfid}`], ['Categoría', a.cat + ' · ' + (a.sexo === 'M' ? 'macho' : 'hembra')], ['Raza / línea', a.raza], ['Nacimiento', a.nac + ' · ' + Math.floor(X.dd(a.nac) / 30.4) + ' meses'], ['Genealogía', `Madre <b>${U.esc(a.madre)}</b> · Padre <b>${U.esc(a.padre)}</b>`, 1]];
          let esp = [];
          if (e.key === 'porcino' && a.cat !== 'Verraco') esp = [['Paridad', a.par], ['Estado reproductivo', U.tag(a.rep, REPCLS[a.rep]) + ' · ' + a.dEst + ' días'], ['Último servicio', a.fServ ? a.fServ + ' · ' + U.esc(a.macho) : '—'], ['Diagnóstico', a.diag || '—'], ['Parto probable', a.fParto || '—'], ['Lechones al pie', a.lechones || 0]];
          if (a.cat === 'Verraco') esp = [['Servicios realizados', a.servicios], ['Fertilidad', a.fertilidad + ' %'], ['Último servicio', a.ultServ]];
          if (e.key === 'vacuno' && /Vaca|Vaquillona/.test(a.cat)) esp = [['Lactancia N.º', a.lact || 0], ['Días en leche', a.cat === 'Vaca en producción' ? a.del : '—'], ['Producción', a.cat === 'Vaca en producción' ? `<b>${a.leche} L/día</b> (AM ${a.am} · PM ${a.pm})` : '—'], ['Proyección 305 d', a.p305 ? INT(a.p305) + ' L' : '—'], ['Células somáticas', a.ccs ? INT(a.ccs) + ' mil/ml' : '—'], ['Estado reproductivo', U.tag(a.rep, REPCLS[a.rep] || 't-gray')], ['Servicios en la lactancia', a.nServ || 0], ['Último servicio', a.fServ || '—'], ['Parto esperado', a.fParto || '—'], ['Intervalo entre partos', a.iep ? a.iep + ' d' : '—'], ['Días abiertos', a.diasAbiertos != null ? a.diasAbiertos + ' d' : '—']];
          if (a.cat === 'Ternero') esp = [['Edad', a.edadD + ' días'], ['Peso al nacer', a.pesoNac + ' kg'], ['Ganancia diaria', INT((a.peso - a.pesoNac) / Math.max(1, a.edadD) * 1000) + ' g/día'], ['Leche consumida', a.lecheCons ? a.lecheCons + ' L/día' : 'destetado']];
          return [...base, ...esp, ['Ubicación', a.ubic], ['Condición corporal', a.cc], ['Peso', a.peso + ' kg'], ['Costo acumulado', U.money(a.costoAcum || 0)], ['Estado', a.estado], ['Período de retiro', rt || rl ? [rt, rl].filter(Boolean).map(r => U.tag(r.tipo + ' hasta ' + r.hasta, 't-red')).join(' ') : U.tag('Sin retiro · apto', 't-green')]];
        },
        body: a => M.fichaBody(e, a),
        edit: [{ k: 'ubic', label: 'Ubicación', span: 2 }, { k: 'cc', label: 'Condición corporal (1–5)', type: 'number' }, { k: 'peso', label: 'Peso (kg)', type: 'number' }, { k: 'rfid', label: 'RFID' }],
        extra: a => { if (!/Activ/.test(a.estado)) return []; const out = []; const n = M.nextEv(e, a); if (n) out.push({ icon: X.EV[n].icon, label: X.EV[n].lbl, fn: () => X.openEvent(n, a.id) }); out.push({ icon: 'fa-kit-medical', label: 'Tratamiento', fn: () => X.tratForm(e, a.id) }); if (e.key === 'vacuno' && a.cat === 'Vaca en producción' && n !== 'control') out.push({ icon: 'fa-bottle-droplet', label: 'Control lechero', fn: () => X.openEvent('control', a.id) }); out.push({ icon: 'fa-user-slash', label: 'Descarte o baja', fn: () => X.openEvent('descarte', a.id), menuOnly: true }); return out; },
        print: a => ({ tipo: 'Ficha zootécnica', num: a.id, body: M.fichaHist(e, a) })
      };
    },
    fichaHist(e, a) {
      const U = SIGA.ui;
      if (e.key === 'porcino' && a.partos.length) return dtbl([['Parto'], ['Fecha'], ['NT', 1], ['NV', 1], ['NM', 1], ['Momias', 1], ['Destetados', 1], ['Lactancia', 1], ['Peso destete', 1], ['IDS', 1]], a.partos.slice().reverse().map(p => [p.n + '.º', p.f, p.nt, p.nv, p.nm, p.mom, p.dest == null ? '<i>en lactancia</i>' : p.dest, p.lact == null ? '—' : p.lact + ' d', p.pesoDest == null ? '—' : p.pesoDest + ' kg', p.ids == null ? '—' : p.ids + ' d']));
      if (e.key === 'vacuno' && a.partos && a.partos.length) return dtbl([['Parto'], ['Fecha'], ['Cría'], ['Sexo'], ['Peso', 1], ['Facilidad'], ['Leche 305 d', 1]], a.partos.slice().reverse().map(p => [p.n + '.º', p.f, `<span class="code">${U.esc(p.cria)}</span>`, p.sexo, p.peso + ' kg', p.facilidad, p.leche305 ? INT(p.leche305) + ' L' : '<i>en curso</i>']));
      return '';
    },
    fichaBody(e, a) {
      const U = SIGA.ui, tr = e.trat.filter(t => t.ref === a.id), ev = e.eventos.filter(x => x.ref.split(' · ').includes(a.id) || x.ref === a.id).slice(0, 8);
      let h = `<div class="row-flex mt">${U.barcode(a.id, 200, 44)}<div class="mini">Arete de identificación ${a.id}<br>RFID ${a.rfid} · ISO 11784/11785</div></div>`;
      if (e.key === 'porcino' && a.partos.length) {
        const p = a.partos, d = p.filter(x => x.dest != null);
        h += `<div class="grid cols-6 mt">${[['Partos', p.length], ['NT prom.', X.avg(p, 'nt').toFixed(1)], ['NV prom.', X.avg(p, 'nv').toFixed(1)], ['Destetados', d.length ? X.avg(d, 'dest').toFixed(1) : '—'], ['Peso destete', d.length ? X.avg(d, 'pesoDest').toFixed(1) + ' kg' : '—'], ['IDS prom.', p.filter(x => x.ids != null).length ? X.avg(p.filter(x => x.ids != null), 'ids').toFixed(1) + ' d' : '—']].map(x => `<div class="mini-card"><div class="lab">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('')}</div>`;
        h += `<div class="lbl-s mt mb">Historial de partos</div>${this.fichaHist(e, a)}`;
        h += `<div class="lbl-s mt mb">Servicios</div>${U.timeline(a.serv.slice().reverse().map(s => ({ t: s.macho, sub: 'Resultado: ' + s.res, when: s.f, st: s.res === 'Parto' ? 'done' : s.res === 'Repetición' ? 'bad' : 'cur' })))}`;
      }
      if (a.cat === 'Verraco') h += `<div class="lbl-s mt mb">Hembras servidas por ${a.id}</div>${dtbl([['Cerda'], ['Fecha'], ['Resultado']], ESP().porcino.anim.flatMap(c => c.serv.filter(s => s.macho.startsWith(a.id)).map(s => [c.id, s.f, s.res])).slice(0, 12))}`;
      if (e.key === 'vacuno' && a.cat === 'Vaca en producción') {
        const kk = a.leche / e.wood(Math.max(1, a.del), 1), labels = [], cur = [], pt = [];
        for (let t = 5; t <= 305; t += 15) { labels.push(t + ' d'); cur.push(Math.round(e.wood(t, kk) * 10) / 10); pt.push(Math.abs(t - a.del) < 7.5 ? a.leche : null); }
        h += `<div class="lbl-s mt mb">Curva de lactancia (Wood) · proyección 305 d ${INT(a.p305)} L</div>${U.chart.line({ labels, series: [{ name: 'Curva proyectada', data: cur, color: '#94A3B8', dash: true }, { name: 'Control actual (' + a.del + ' DEL)', data: pt, color: '#14967D' }], fmt: v => v.toFixed(1) + ' L', h: 190 })}`;
      }
      if (e.key === 'vacuno' && a.partos && a.partos.length) h += `<div class="lbl-s mt mb">Historial de partos y lactancias</div>${this.fichaHist(e, a)}`;
      if (a.cat === 'Ternero' || a.cat === 'Vaquillona') { const m = e.anim.find(x => x.id === a.madre); if (m) h += nota('info', 'fa-sitemap', `Madre <b>${m.id} ${U.esc(m.nombre || '')}</b> · ${m.raza} · lactancia ${m.lact} · proyección 305 d ${INT(m.p305 || 0)} L · CCS ${m.ccs || '—'} mil/ml`); }
      if (tr.length) h += `<div class="lbl-s mt mb">Tratamientos</div>${dtbl([['N.º'], ['Fecha'], ['Diagnóstico'], ['Producto'], ['Retiro'], ['Estado']], tr.map(t => [t.id, t.f, U.esc(t.diag), U.esc(t.prod), (t.retC ? 'carne ' + t.retC + ' d ' : '') + (t.retL ? 'leche ' + t.retL + ' d' : '') || '—', t.estado]))}`;
      if (ev.length) h += `<div class="lbl-s mt mb">Eventos recientes</div>${U.timeline(ev.map(x => ({ t: x.tipo, sub: U.esc(x.det) + ' · ' + x.user, when: x.f, st: 'done' })))}`;
      return h;
    },
    lotRec(e) {
      const U = SIGA.ui, M = this;
      return {
        mod: 'Control pecuario', tipo: 'Ficha de lote', office: 'Centro de Producción · ' + e.unidad, key: l => 'Lote ' + l.id, title: l => 'Lote ' + l.id + ' · ' + l.etapa + ' · ' + e.nombre, estado: 'estado', cls: false,
        fields: l => {
          const m = X.lm(e, l), rt = X.retiroDe(e, l.id), U2 = U;
          const base = [['Lote / poza', `<span class="code">${l.id}</span>`], ['Tipo · etapa', l.tipo + ' · ' + l.etapa], ['Ubicación', l.ubic], ['Línea genética', l.linea || '—'], ['Ingreso', l.fIng + (l.origen ? ' · origen ' + U2.esc(l.origen) : '')], ['Edad', l.std === 'ponedora' ? Math.round(l.edad / 7) + ' semanas' : l.edad + ' días']];
          if (l.tipo === 'Poza de empadre') return [...base, ['Hembras · macho', l.hembras + ' · ' + l.macho], ['Partos · nacidos · vivos', `${l.partos} · ${l.nacidos} · ${l.vivos}`], ['Lactantes · destetados', `${l.lactantes} · ${l.destetados}`], ['Tamaño de camada', l.partos ? (l.nacidos / l.partos).toFixed(2) : '—'], ['Mortalidad en lactancia', l.vivos ? (l.muertes / l.vivos * 100).toFixed(1) + ' %' : '—'], ['Costo acumulado', U2.money(m.costo)], ['Estado', l.estado]];
          return [...base, ['Cabezas', `${INT(l.cab)} de ${INT(l.cabIni)} · ${l.muertes} muertes (${m.mort.toFixed(1)} %) · ${l.vendidos || 0} vendidos`],
            ...(l.std === 'ponedora' ? [['Postura del día', m.dia ? m.dia.postura + ' % · ' + INT(m.dia.huevos) + ' huevos' : '—'], ['Peso del huevo', m.dia && m.dia.pesoHuevo ? m.dia.pesoHuevo + ' g' : '—']]
              : [['Peso estimado', `${m.peso.toFixed(e.key === 'porcino' ? 1 : 3)} kg` + (m.std ? ` · estándar ${m.std.toFixed(e.key === 'porcino' ? 1 : 3)} kg (${m.dev >= 0 ? '+' : ''}${m.dev.toFixed(1)} %)` : '')], ['Ganancia diaria (GDP)', INT(m.gdp * 1000) + ' g/día'], ['Conversión (FCR)', m.fcr ? m.fcr.toFixed(2) : '—'], ...(m.epef ? [['EPEF', INT(m.epef)]] : []), ['Días a peso objetivo', l.estado === 'Activo' && m.diasObj ? m.diasObj + ' días (' + X.addD(SIGA.ctx.hoy, m.diasObj) + ')' : '—']]),
            ['Alimento consumido', INT(l.alim) + ' kg'], ['Costo total', U2.money(m.costo)], ['Costo por kg producido', m.cKg ? U2.money(m.cKg) : '—'], ['Período de retiro', rt ? U2.tag('Carne hasta ' + rt.hasta, 't-red') : U2.tag('Sin retiro · apto para saca', 't-green')], ['Estado', l.estado + (l.cierre ? ' · ' + l.cierre : '')]];
        },
        body: l => M.lotBody(e, l),
        edit: [{ k: 'ubic', label: 'Ubicación', span: 2 }, { k: 'pesoObj', label: 'Peso objetivo (kg)', type: 'number' }],
        canEdit: l => l.estado === 'Activo',
        extra: l => l.estado !== 'Activo' ? [{ icon: 'fa-file-invoice-dollar', label: 'Liquidación del lote', fn: () => M.liquidar(e, l) }] : [
          ...(l.tipo === 'Poza de empadre' ? [{ icon: 'fa-baby', label: 'Parto', fn: () => X.openEvent('parto', l.id) }, ...(l.lactantes ? [{ icon: 'fa-people-arrows', label: 'Destete', fn: () => X.openEvent('destete', l.id) }] : [])]
            : [...(l.std === 'ponedora' || e.key === 'ave' ? [{ icon: 'fa-clipboard-list', label: 'Registro diario', fn: () => X.openEvent('diario', l.id) }] : []), ...(l.std !== 'ponedora' ? [{ icon: 'fa-weight-scale', label: 'Pesaje', fn: () => X.openEvent('pesaje', l.id) }] : [])]),
          ...(e.key !== 'ave' ? [{ icon: 'fa-skull-crossbones', label: 'Mortalidad', fn: () => X.openEvent('mortalidad', l.id) }] : []),
          { icon: 'fa-truck', label: 'Saca / venta', fn: () => X.movForm(e, l.id) }, { icon: 'fa-kit-medical', label: 'Tratamiento', fn: () => X.tratForm(e, l.id), menuOnly: true },
          { icon: 'fa-wheat-awn', label: 'Consumo de alimento', fn: () => X.consumoForm(e), menuOnly: true }, { icon: 'fa-file-invoice-dollar', label: 'Liquidación a la fecha', fn: () => M.liquidar(e, l), menuOnly: true }],
        print: l => ({ tipo: 'Ficha y liquidación de lote', num: l.id, body: M.liqHtml(e, l) })
      };
    },
    lotBody(e, l) {
      const U = SIGA.ui, m = X.lm(e, l);
      let h = '';
      if (l.std === 'ponedora' && l.diario.length) {
        h += `<div class="lbl-s mt mb">Curva de postura · últimos ${l.diario.length} días</div>${U.chart.line({ labels: l.diario.map(d => d.f.slice(0, 5)), series: [{ name: 'Estándar Hy-Line', data: l.diario.map(() => l.etapa === 'Postura' ? e.metas.postura : 0), color: '#94A3B8', dash: true }, { name: '% de postura', data: l.diario.map(d => d.postura), color: '#14967D' }], fmt: v => v.toFixed(1) + ' %', yMax: 100, h: 190 })}`;
      } else if (l.pesos && l.pesos.length > 1 && l.tipo !== 'Poza de empadre') {
        const pz = l.pesos, dec = e.key === 'porcino' ? 1 : 3;
        h += `<div class="lbl-s mt mb">Curva de crecimiento vs estándar de la línea</div>${U.chart.line({ labels: pz.map(p => p[1] + ' d'), series: [{ name: 'Estándar', data: pz.map(p => e.stdPeso ? e.stdPeso(p[1]) : null), color: '#94A3B8', dash: true }, { name: 'Peso real', data: pz.map(p => p[2]), color: '#14967D' }], fmt: v => v.toFixed(dec) + ' kg', axFmt: v => v < 5 ? v.toFixed(1) : INT(v), h: 190 })}`;
        h += `<div class="lbl-s mt mb">Pesajes</div>${dtbl([['Fecha'], ['Edad', 1], ['Peso prom.', 1], ['Estándar', 1], ['Desviación', 1]], pz.slice().reverse().map(p => { const s = e.stdPeso ? e.stdPeso(p[1]) : 0; return [p[0], p[1] + ' d', p[2].toFixed(dec) + ' kg', s ? s.toFixed(dec) + ' kg' : '—', s ? ((p[2] / s - 1) * 100).toFixed(1) + ' %' : '—']; }))}`;
      }
      if (l.costo) { const c = l.costo, t = m.costo || 1; h += `<div class="lbl-s mt mb">Estructura de costos · ${U.money(m.costo)}</div>${U.bars([['Alimento', c.alim / t * 100, '#14967D', U.money(c.alim)], ['Animales / pie de cría', c.animales / t * 100, '#0D6EFD', U.money(c.animales)], ['Mano de obra', c.mo / t * 100, '#D97706', U.money(c.mo)], ['Sanidad', c.san / t * 100, '#DC2626', U.money(c.san)], ['Otros (energía, cama, agua)', c.otros / t * 100, '#64748B', U.money(c.otros)]])}`; }
      const mo = e.mort.filter(x => x.ref === l.id);
      if (mo.length) h += `<div class="lbl-s mt mb">Mortalidad registrada</div>${dtbl([['Fecha'], ['Cant.', 1], ['Causa'], ['Edad'], ['Necropsia']], mo.map(x => [x.f, x.cant, x.causa, x.edad, x.nec]))}`;
      return h;
    },
    liqHtml(e, l) {
      const U = SIGA.ui, m = X.lm(e, l), p = SIGA.data.ventas.productos.find(x => x.cod === X.VENTA[e.key][0]), unit = p.um === 'KGM';
      const vend = (l.vendidos || 0), ing = unit ? m.kgVend * p.pu : vend * p.pu, inv = unit ? m.biom * p.pu : l.cab * p.pu, c = l.costo || {};
      const res = ing + inv - m.costo;
      return dtbl([['Concepto'], ['Detalle'], ['Importe', 1]], [
        ['Ventas y sacas', `${vend} cab. · ${INT(m.kgVend)} kg vivos`, U.money(ing)], ['Inventario en pie valorizado', `${l.cab} cab. · ${INT(m.biom)} kg a ${U.money(p.pu)}${unit ? '/kg' : '/und.'}`, U.money(inv)],
        ['(−) Animales / pie de cría', '', U.money(-(c.animales || 0))], ['(−) Alimento', `${INT(l.alim)} kg · FCR ${m.fcr ? m.fcr.toFixed(2) : '—'}`, U.money(-(c.alim || 0))], ['(−) Sanidad', '', U.money(-(c.san || 0))], ['(−) Mano de obra', '', U.money(-(c.mo || 0))], ['(−) Otros', '', U.money(-(c.otros || 0))],
        ['<b>Resultado del lote</b>', `margen ${ing + inv ? (res / (ing + inv) * 100).toFixed(1) : 0} % · costo ${U.money(m.cKg)} por kg`, `<b>${U.money(res)}</b>`]]) + `<p class="mini mt">Mortalidad ${m.mort.toFixed(1)} % · viabilidad ${m.viab.toFixed(1)} % · ${l.edad} días · precio de referencia: catálogo de Ventas (${U.esc(p.desc)}).</p>`;
    },
    liquidar(e, l) { SIGA.ui.preview('Liquidación del lote ' + l.id, SIGA.ui.doc({ office: 'Centro de Producción · ' + e.unidad, tipo: 'Liquidación de lote', num: l.id, pairs: [['Especie', e.nombre], ['Etapa', l.etapa], ['Ingreso', l.fIng], ['Cierre', l.cierre || 'lote activo · corte al ' + SIGA.ctx.hoy], ['Cabezas', l.cabIni + ' ingresadas'], ['Centro de costo', e.cc]], body: this.liqHtml(e, l), firmas: [['Elaboró', SIGA.ctx.user.nombre], ['Revisó', 'Jefe del Centro de Producción'], ['Aprobó', 'Contabilidad de costos']] }), { file: 'liquidacion_' + l.id }); },

    /* ---------- Pestaña: resumen y lista de acciones ---------- */
    p_acc(host, e, k, T) {
      const U = SIGA.ui, al = T.filter(t => t.prio === 'Alta').length, venc = T.filter(t => X.dd(t.f) > 0).length, hoy = T.filter(t => t.f === SIGA.ctx.hoy).length;
      host.innerHTML = `<div class="grid cols-4 mb">${[['Acciones pendientes', T.length, 'fa-list-check', ''], ['Prioridad alta', al, 'fa-bolt', 'var(--danger)'], ['Programadas para hoy', hoy, 'fa-calendar-day', ''], ['Vencidas', venc, 'fa-clock', venc ? '#b7791f' : '']].map(x => `<div class="mini-card"><div class="lab"><i class="fa-solid ${x[2]}"></i> ${x[0]}</div><div class="v" ${x[3] ? `style="color:${x[3]}"` : ''}>${x[1]}</div></div>`).join('')}</div>
        <div class="card mb"><h3><span class="dot"></span>Lista de acciones <span class="grow">generada del estado de cada animal y lote · se recalcula con cada evento</span></h3><div id="pc-tk"></div></div>
        <div class="card"><h3><span class="dot"></span>Bitácora zootécnica <span class="grow">eventos registrados por el personal de campo</span></h3><div id="pc-evs"></div></div>`;
      host.querySelector('#pc-tk').innerHTML = U.grid({ id: 'pc-tk-' + e.key, title: 'lista de acciones', export: 'acciones_' + e.key, rows: T, pageSize: 10, filter: { label: 'Acción', get: t => t.tipo },
        cols: [{ k: 'prio', label: 'Prioridad', sv: t => ({ Alta: 0, Media: 1, Baja: 2 })[t.prio], render: t => U.tag(t.prio, t.prio === 'Alta' ? 't-red' : t.prio === 'Media' ? 't-amber' : 't-gray') },
          { k: 'f', label: 'Fecha objetivo', sv: t => X.sv(t.f), render: t => t.f + (X.dd(t.f) > 0 ? ` <span class="mini" style="color:var(--danger)">vencida ${X.dd(t.f)} d</span>` : X.dd(t.f) === 0 ? ' <span class="mini">hoy</span>' : '') },
          { k: 'tipo', label: 'Acción', render: t => `<b>${U.esc(t.tipo)}</b>` }, { k: 'ref', label: 'Animal / lote', render: t => `<span class="code">${U.esc(t.ref)}</span>` }, { k: 'det', label: 'Detalle', cls: 'mini' },
          { k: 'lbl', label: '', nosort: true, noexport: true, render: t => t.lbl ? `<span class="mini" style="color:var(--primary-dark);font-weight:700">${t.lbl} ›</span>` : '' }],
        onRow: t => this.task(e, t), empty: 'Sin acciones pendientes',
        bulk: [{ icon: 'fa-print', label: 'Imprimir hoja de trabajo', fn: rs => this.hoja(e, rs) }], tools: [{ icon: 'fa-plus', label: 'Registrar evento', primary: true, fn: () => X.chooser() }] });
      host.querySelector('#pc-evs').innerHTML = U.grid({ id: 'pc-evs-' + e.key, title: 'eventos', export: 'eventos_' + e.key, rows: e.eventos, record: this.evRec(e), pageSize: 8, filter: { label: 'Evento', get: r => r.tipo },
        cols: [{ k: 'f', label: 'Fecha', sv: r => X.sv(r.f) }, { k: 'tipo', label: 'Evento', render: r => U.tag(r.tipo, EVCLS[r.tipo] || 't-gray') }, { k: 'ref', label: 'Animal / lote', render: r => `<span class="code">${U.esc(r.ref)}</span>` }, { k: 'cant', label: 'Cant.', r: true }, { k: 'det', label: 'Detalle', cls: 'mini' }, { k: 'user', label: 'Registró', cls: 'mini' }],
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : '') });
    },
    task(e, t) {
      const U = SIGA.ui;
      if (!t.ev) return;
      if (t.ev.startsWith('aplicar:')) { const p = e.plan.find(x => x.id === t.ev.slice(8)); if (p) X.aplicar(e, p); return; }
      if (t.ev.startsWith('alta:')) { const q = e.trat.find(x => x.id === t.ev.slice(5)); if (q) X.alta(e, q); return; }
      if (t.ev.startsWith('alm:')) { SIGA.modules.almacen.sel = t.ev.slice(4); SIGA.go('almacen', { l: 'kar' }); return; }
      if (t.ev === 'retiro') { SIGA.showTab(document.getElementById('mod-root'), 'pc', 'san'); return; }
      if (t.ev === 'lote') { const l = X.findRef(e, t.ref); if (l) U.rec(this.lotRec(e)).ver(l); return; }
      if (t.ev === 'ubic') {
        const a = X.findRef(e, t.ref);
        U.formModal('<i class="fa-solid fa-right-left"></i> Traslado a maternidad · ' + a.id, [{ k: 'u', label: 'Jaula de maternidad', type: 'select', options: ['MT-01', 'MT-04', 'MT-09', 'MT-12', 'MT-15'].map(x => 'Maternidad · jaula ' + x) }, { k: 'o', label: 'Observación', value: 'Lavado, desinfección y vacío sanitario de la jaula', type: 'textarea' }], v => {
          const antes = a.ubic; a.ubic = v.u; X.evento(e, 'Traslado a maternidad', a.id, 1, antes + ' → ' + v.u); U.closeModal(); SIGA.refresh(); U.toast(a.id + ' trasladada a ' + v.u);
        }, 'Trasladar');
        return;
      }
      X.openEvent(t.ev, t.ref);
    },
    hoja(e, T) {
      const U = SIGA.ui;
      U.preview('Hoja de trabajo · ' + e.unidad, U.doc({ office: 'Centro de Producción · ' + e.unidad, tipo: 'Hoja de trabajo diaria', num: e.unidad + ' · ' + SIGA.ctx.hoy, pairs: [['Acciones', T.length], ['Prioridad alta', T.filter(t => t.prio === 'Alta').length], ['Responsable', 'P. Huamán'], ['Médico veterinario', D().veterinarios[e.key === 'vacuno' ? 1 : 0]]],
        body: dtbl([['✓'], ['Prioridad'], ['Fecha'], ['Acción'], ['Animal / lote'], ['Detalle'], ['Observación']], T.map(t => ['☐', t.prio, t.f, t.tipo, t.ref, U.esc(t.det), '______________'])),
        firmas: [['Elaboró', SIGA.ctx.user.nombre], ['Ejecutó', 'Personal de campo'], ['Verificó', D().veterinarios[e.key === 'vacuno' ? 1 : 0].split(' (')[0]]] }), { file: 'hoja_trabajo_' + e.key });
    },
    rfid() {
      const U = SIGA.ui, all = Object.values(ESP()).flatMap(e => e.anim.filter(a => /Activ/.test(a.estado)).map(a => [e, a]));
      const b = U.modal('<i class="fa-solid fa-wifi"></i> Lectura de arete electrónico · RFID', `<p class="mini mb">Acerque el lector al arete (ISO 11784/11785) o digite el código. También acepta la identificación visual (p. ej. M-014, V-12, T-2208).</p>
        <div class="fld"><label>Código leído</label><input id="rf-in" placeholder="604 000xxx xxxxxx"></div><div id="rf-out" class="mt"></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn ghost" id="rf-sim"><i class="fa-solid fa-satellite-dish"></i> Simular lectura</button><button class="btn" id="rf-go"><i class="fa-solid fa-id-card"></i> Abrir ficha</button>`, 'narrow');
      const inp = b.querySelector('#rf-in');
      const hit = () => { const v = inp.value.trim().toLowerCase().replace(/\s+/g, ' '); return all.find(([, a]) => a.rfid.toLowerCase() === v || a.id.toLowerCase() === v); };
      const show = () => { const h = hit(); b.querySelector('#rf-out').innerHTML = h ? nota('teal', 'fa-circle-check', `<b>${h[1].id}${h[1].nombre ? ' · ' + U.esc(h[1].nombre) : ''}</b> · ${h[0].nombre} · ${h[1].cat} · ${h[1].rep && h[1].rep !== '—' ? h[1].rep + ' · ' : ''}${h[1].ubic}`) : (inp.value.trim().length > 3 ? nota('amber', 'fa-circle-question', 'Arete no registrado en el predio') : ''); };
      inp.addEventListener('input', show);
      b.querySelector('#rf-sim').addEventListener('click', () => { const p = all[Math.floor(Math.random() * all.length)]; inp.value = p[1].rfid; show(); SIGA.log('Control pecuario', 'Lectura RFID', p[1].id, '—', p[1].rfid); });
      b.querySelector('#rf-go').addEventListener('click', () => { const h = hit(); if (!h) { U.toast('Arete no registrado en el predio', 'err'); return; } U.closeModal(); this.ir(h[0].key, 'ani', () => U.rec(this.aniRec(h[0])).ver(h[1])); });
    },

    /* ---------- Pestaña: fichas (reproductores, hato, pozas) ---------- */
    p_ani(host, e) {
      const U = SIGA.ui;
      if (e.key === 'cuy') return this.pozas(host, e);
      const R = this.aniRec(e), vac = e.key === 'vacuno';
      const alert = a => { const t = []; const rt = X.retiroDe(e, a.id), rl = X.retiroDe(e, a.id, 'Leche'); if (rt) t.push(U.tag('Retiro carne ' + rt.hasta.slice(0, 5), 't-red')); if (rl) t.push(U.tag('Leche descartada', 't-red')); if (a.descarte) t.push(U.tag('Descarte', 't-gray')); if (vac && a.ccs > 400) t.push(U.tag('CCS alta', 't-amber')); if (a.cc && a.cc < 2.5 && /Vaca|Reproductora/.test(a.cat)) t.push(U.tag('CC baja', 't-amber')); if (e.trat.some(q => q.ref === a.id && q.estado === 'En tratamiento')) t.push(U.tag('En tratamiento', 't-amber')); return t.join(' ') || '<span class="mini">—</span>'; };
      const cols = vac ? [
        { k: 'id', label: 'Animal', render: a => `<span class="code">${a.id}</span> ${a.nombre ? '<b>' + U.esc(a.nombre) + '</b>' : ''}${a.nuevo ? ' ' + U.tag('nuevo', 't-green') : ''}<div class="mini">${a.rfid}</div>` }, { k: 'cat', label: 'Categoría' }, { k: 'raza', label: 'Raza', cls: 'mini' },
        { k: 'lact', label: 'Lact.', r: true }, { k: 'del', label: 'DEL', r: true, render: a => a.cat === 'Vaca en producción' ? a.del : '—' }, { k: 'leche', label: 'Leche L/d', r: true, render: a => a.leche ? `<b>${a.leche}</b>` : '—' },
        { k: 'p305', label: '305 d', r: true, render: a => a.p305 && a.cat === 'Vaca en producción' ? INT(a.p305) : '—' }, { k: 'ccs', label: 'CCS', r: true, render: a => a.ccs && a.cat === 'Vaca en producción' ? `<span style="color:${a.ccs > 400 ? 'var(--danger)' : a.ccs > 250 ? '#b7791f' : 'inherit'};font-weight:700">${a.ccs}</span>` : '—' },
        { k: 'rep', label: 'Estado reproductivo', render: a => /Activ/.test(a.estado) ? U.tag(a.rep, REPCLS[a.rep] || 't-gray') : U.tag('Baja', 't-gray') }, { k: 'px', label: 'Próximo evento', sv: a => this.prox(e, a), render: a => `<span class="mini">${this.prox(e, a)}</span>` }, { k: 'al', label: 'Alertas', nosort: true, render: alert }]
        : [{ k: 'id', label: 'Animal', render: a => `<span class="code">${a.id}</span>${a.nuevo ? ' ' + U.tag('nuevo', 't-green') : ''}<div class="mini">${a.rfid}</div>` }, { k: 'cat', label: 'Categoría' }, { k: 'raza', label: 'Raza / línea', cls: 'mini' }, { k: 'par', label: 'Paridad', r: true },
          { k: 'rep', label: 'Estado reproductivo', render: a => /Activ/.test(a.estado) ? U.tag(a.rep, REPCLS[a.rep] || 't-gray') + (a.cat !== 'Verraco' ? ` <span class="mini">${a.dEst} d</span>` : '') : U.tag('Baja', 't-gray') },
          { k: 'nv', label: 'NV prom.', r: true, sv: a => a.partos.length ? X.avg(a.partos, 'nv') : 0, render: a => a.partos.length ? X.avg(a.partos, 'nv').toFixed(1) : '—' },
          { k: 'dp', label: 'Destet. prom.', r: true, sv: a => X.avg(a.partos.filter(p => p.dest != null), 'dest'), render: a => a.partos.some(p => p.dest != null) ? X.avg(a.partos.filter(p => p.dest != null), 'dest').toFixed(1) : '—' },
          { k: 'lech', label: 'Al pie', r: true, render: a => a.lechones || '—' }, { k: 'px', label: 'Próximo evento', sv: a => this.prox(e, a), render: a => `<span class="mini">${this.prox(e, a)}</span>` }, { k: 'ubic', label: 'Ubicación', cls: 'mini' }, { k: 'al', label: 'Alertas', nosort: true, render: alert }];
      host.innerHTML = `<div class="card"><h3><span class="dot"></span>${vac ? 'Hato lechero · fichas individuales' : 'Reproductores · fichas individuales'} <span class="grow">identificación con arete y RFID, genealogía, historial productivo y reproductivo</span></h3><div id="pc-an"></div></div>`;
      host.querySelector('#pc-an').innerHTML = U.grid({ id: 'pc-an-' + e.key, title: 'fichas de ' + e.nombre.toLowerCase(), export: 'fichas_' + e.key, rows: e.anim, record: R, pageSize: 12,
        filter: { label: vac ? 'Categoría' : 'Estado', get: a => /Activ/.test(a.estado) ? (vac ? a.cat : a.rep) : 'Baja' },
        cols, rowCls: a => (/Activ/.test(a.estado) ? '' : 'row-void') + (a.nuevo ? ' row-new' : ''),
        actions: [{ icon: 'fa-bolt', title: 'Siguiente evento', show: a => /Activ/.test(a.estado) && !!this.nextEv(e, a), fn: a => X.openEvent(this.nextEv(e, a), a.id) }, { icon: 'fa-kit-medical', title: 'Tratamiento', show: a => /Activ/.test(a.estado), fn: a => X.tratForm(e, a.id) }],
        bulk: [{ icon: 'fa-barcode', label: 'Imprimir aretes', fn: rs => U.preview('Aretes de identificación · ' + rs.length, `<div class="doc" style="position:static"><div class="lbl-grid">${rs.map(a => `<div class="lbl-card"><b>${a.id}${a.nombre ? ' · ' + U.esc(a.nombre) : ''}</b><div class="mini">${a.cat} · ${a.raza}<br>RFID ${a.rfid}</div>${U.barcode(a.id, 190, 44)}</div>`).join('')}</div></div>`, { file: 'aretes_' + e.key }) },
          { icon: 'fa-syringe', label: 'Programar sanidad', fn: rs => { X.programar(e); SIGA.ui.toast(rs.length + ' animales seleccionados · elija el grupo en el formulario', 'info'); } }],
        tools: vac ? [{ icon: 'fa-bottle-droplet', label: 'Control lechero', primary: true, fn: () => X.openEvent('control') }, { icon: 'fa-venus-mars', label: 'Servicio', fn: () => X.openEvent('servicio') }] : [{ icon: 'fa-venus-mars', label: 'Servicio', primary: true, fn: () => X.openEvent('servicio') }, { icon: 'fa-baby', label: 'Parto', fn: () => X.openEvent('parto') }, { icon: 'fa-people-arrows', label: 'Destete', fn: () => X.openEvent('destete') }] });
    },
    pozas(host, e) {
      const U = SIGA.ui, rows = e.lotes.filter(l => l.tipo === 'Poza de empadre');
      host.innerHTML = `<div class="card"><h3><span class="dot"></span>Pozas de empadre <span class="grow">1 macho × 10 hembras · empadre continuo · destete a los 15 días (INIA)</span></h3><div id="pc-pz"></div></div>`;
      host.querySelector('#pc-pz').innerHTML = U.grid({ id: 'pc-pz', title: 'pozas de empadre', export: 'pozas_empadre', rows, record: this.lotRec(e), pageSize: 12, filter: { label: 'Nave', get: l => l.ubic.split(' · ')[1] || l.ubic },
        cols: [{ k: 'id', label: 'Poza', render: l => `<span class="code">${l.id}</span>${l.nuevo ? ' ' + U.tag('nueva', 't-green') : ''}` }, { k: 'linea', label: 'Línea' }, { k: 'edad', label: 'Días de empadre', r: true }, { k: 'hembras', label: 'Hembras', r: true }, { k: 'macho', label: 'Macho', render: l => `<span class="code">${l.macho}</span>` },
          { k: 'partos', label: 'Partos', r: true }, { k: 'nacidos', label: 'Nacidos', r: true }, { k: 'vivos', label: 'Vivos', r: true }, { k: 'lactantes', label: 'Lactantes', r: true, render: l => l.lactantes ? `<b>${l.lactantes}</b>` : '—' }, { k: 'destetados', label: 'Destetados', r: true },
          { k: 'cam', label: 'Camada', r: true, sv: l => l.partos ? l.nacidos / l.partos : 0, render: l => l.partos ? (l.nacidos / l.partos).toFixed(2) : '—' }, { k: 'fer', label: 'Fertilidad', r: true, sv: l => l.partos / Math.max(1, l.hembras), render: l => l.edad >= 75 ? (l.partos / Math.max(1, l.hembras) * 100).toFixed(0) + ' %' : '<span class="mini">en gestación</span>' },
          { k: 'ml', label: 'Mort. lact.', r: true, sv: l => l.vivos ? l.muertes / l.vivos : 0, render: l => l.vivos ? `<span style="color:${l.muertes / l.vivos * 100 > e.metas.mortLact ? 'var(--danger)' : 'inherit'}">${(l.muertes / l.vivos * 100).toFixed(1)} %</span>` : '—' }],
        rowCls: l => (l.estado !== 'Activo' ? 'row-void' : '') + (l.nuevo ? ' row-new' : ''),
        actions: [{ icon: 'fa-baby', title: 'Registrar parto', show: l => l.estado === 'Activo', fn: l => X.openEvent('parto', l.id) }, { icon: 'fa-people-arrows', title: 'Destete', show: l => l.lactantes > 0, fn: l => X.openEvent('destete', l.id) }],
        foot: rs => `<tr><td colspan="3" class="r"><b>Totales</b></td><td class="r num"><b>${X.sum(rs, 'hembras')}</b></td><td></td><td class="r num"><b>${X.sum(rs, 'partos')}</b></td><td class="r num"><b>${X.sum(rs, 'nacidos')}</b></td><td class="r num"><b>${X.sum(rs, 'vivos')}</b></td><td class="r num"><b>${X.sum(rs, 'lactantes')}</b></td><td class="r num"><b>${X.sum(rs, 'destetados')}</b></td><td class="r num"><b>${(X.sum(rs, 'nacidos') / Math.max(1, X.sum(rs, 'partos'))).toFixed(2)}</b></td><td colspan="3"></td></tr>`,
        tools: [{ icon: 'fa-venus-mars', label: 'Empadre', primary: true, fn: () => X.openEvent('empadre') }, { icon: 'fa-baby', label: 'Parto', fn: () => X.openEvent('parto') }] });
    },

    /* ---------- Pestaña: lotes ---------- */
    p_lot(host, e) {
      const U = SIGA.ui, rows = e.lotes.filter(l => l.tipo !== 'Poza de empadre'), cr = rows.filter(l => l.estado === 'Activo' && l.std !== 'ponedora' && l.pesos.length);
      const dec = e.key === 'porcino' ? 1 : 2;
      host.innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Peso actual vs estándar de la línea <span class="grow">${e.key === 'ave' ? 'Cobb 500' : e.key === 'porcino' ? 'curva comercial · 100 kg a 165 días' : 'cuy mejorado · 0.9 kg a 10 semanas'}</span></h3>
          ${cr.length ? U.chart.cols({ labels: cr.map(l => l.id), series: [{ name: 'Peso estimado hoy', data: cr.map(l => +X.lm(e, l).peso.toFixed(3)) }, { name: 'Estándar a la misma edad', data: cr.map(l => e.stdPeso ? +e.stdPeso(l.edad).toFixed(3) : 0), color: '#94A3B8' }], fmt: v => v.toFixed(dec) + ' kg', h: 220 }) : '<div class="mini">Sin lotes en crecimiento</div>'}</div>
        <div class="card"><h3><span class="dot"></span>Lotes activos</h3>${rows.filter(l => l.estado === 'Activo').map(l => { const m = X.lm(e, l), rt = X.retiroDe(e, l.id); return `<div class="ef-row"><span><span class="code">${l.id}</span> ${l.etapa} · ${INT(l.cab)} cab.</span><b>${l.std === 'ponedora' ? (m.dia ? m.dia.postura + ' %' : '—') : m.peso.toFixed(dec) + ' kg'}${rt ? ' ' + U.tag('retiro', 't-red') : ''}</b></div>`; }).join('')}</div></div>
        <div class="card"><h3><span class="dot"></span>Lotes y grupos <span class="grow">todo dentro / todo fuera · costo, conversión y liquidación por lote</span></h3><div id="pc-lt"></div></div>`;
      host.querySelector('#pc-lt').innerHTML = U.grid({ id: 'pc-lt-' + e.key, title: 'lotes de ' + e.nombre.toLowerCase(), export: 'lotes_' + e.key, rows, record: this.lotRec(e), pageSize: 10, filter: { label: 'Etapa', get: l => l.estado === 'Activo' ? l.etapa : 'Cerrado' },
        cols: [{ k: 'id', label: 'Lote', render: l => `<span class="code">${l.id}</span>${l.nuevo ? ' ' + U.tag('nuevo', 't-green') : ''}<div class="mini">${U.esc(l.linea || '')}</div>` }, { k: 'etapa', label: 'Etapa', render: l => U.tag(l.etapa, l.estado !== 'Activo' ? 't-gray' : /Engorde|Postura/.test(l.etapa) ? 't-teal' : 't-blue') }, { k: 'ubic', label: 'Ubicación', cls: 'mini' },
          { k: 'edad', label: 'Edad', r: true, render: l => l.std === 'ponedora' ? Math.round(l.edad / 7) + ' sem' : l.edad + ' d' }, { k: 'cab', label: 'Cabezas', r: true, render: l => `<b>${INT(l.cab)}</b> <span class="mini">/ ${INT(l.cabIni)}</span>` },
          { k: 'mort', label: 'Mortalidad', r: true, sv: l => X.lm(e, l).mort, render: l => { const m = X.lm(e, l).mort, lim = e.metas.mortEng || (e.metas.viab ? 100 - e.metas.viab : 5); return `<span style="color:${m > lim ? 'var(--danger)' : 'inherit'}">${m.toFixed(1)} %</span>`; } },
          { k: 'peso', label: 'Peso / postura', r: true, sv: l => X.lm(e, l).peso, render: l => { const m = X.lm(e, l); if (l.std === 'ponedora') return m.dia ? `<b>${m.dia.postura} %</b> <span class="mini">postura</span>` : '—'; return `<b>${m.peso.toFixed(dec)}</b> kg` + (m.dev != null && l.estado === 'Activo' ? `<div class="mini" style="color:${m.dev < -5 ? 'var(--danger)' : m.dev > 0 ? 'var(--ok)' : 'inherit'}">${m.dev >= 0 ? '+' : ''}${m.dev.toFixed(1)} % vs std</div>` : ''); } },
          { k: 'gdp', label: 'GDP g/d', r: true, sv: l => X.lm(e, l).gdp, render: l => l.std === 'ponedora' ? '—' : INT(X.lm(e, l).gdp * 1000) }, { k: 'fcr', label: 'FCR', r: true, sv: l => X.lm(e, l).fcr, render: l => { const f = X.lm(e, l).fcr; return f ? f.toFixed(2) : '—'; } },
          { k: 'ckg', label: 'Costo/kg', r: true, sv: l => X.lm(e, l).cKg, render: l => { const c = X.lm(e, l).cKg; return c ? U.money(c, '') : '—'; } },
          { k: 'est', label: 'Situación', sv: l => l.estado, render: l => { const m = X.lm(e, l), rt = X.retiroDe(e, l.id); if (l.estado !== 'Activo') return U.tag('Cerrado ' + (l.cierre || ''), 't-gray'); if (rt) return U.tag('Retiro hasta ' + rt.hasta.slice(0, 5), 't-red'); if (l.pesoObj && m.peso >= l.pesoObj * 0.95) return U.tag('Listo para saca', 't-green'); return m.diasObj ? `<span class="mini">${m.diasObj} d a ${l.pesoObj} kg</span>` : U.tag('En producción', 't-teal'); } }],
        rowCls: l => (l.estado !== 'Activo' ? 'row-void' : '') + (l.nuevo ? ' row-new' : ''),
        actions: [{ icon: 'fa-weight-scale', title: 'Pesaje', show: l => l.estado === 'Activo' && l.std !== 'ponedora', fn: l => X.openEvent('pesaje', l.id) }, { icon: 'fa-clipboard-list', title: 'Registro diario', show: l => l.estado === 'Activo' && e.key === 'ave', fn: l => X.openEvent('diario', l.id) }, { icon: 'fa-truck', title: 'Saca / venta', show: l => l.estado === 'Activo', fn: l => X.movForm(e, l.id) }, { icon: 'fa-file-invoice-dollar', title: 'Liquidación', show: l => l.estado !== 'Activo', fn: l => this.liquidar(e, l) }],
        foot: rs => { const a = rs.filter(l => l.estado === 'Activo'); return `<tr><td colspan="4" class="r"><b>Activos</b></td><td class="r num"><b>${INT(X.sum(a, 'cab'))}</b></td><td colspan="2" class="r mini">biomasa ${INT(X.sum(a, l => X.lm(e, l).biom))} kg</td><td colspan="5"></td></tr>`; },
        tools: e.key === 'ave' ? [{ icon: 'fa-truck-ramp-box', label: 'Ingreso de lote', primary: true, fn: () => X.openEvent('ingreso') }] : [{ icon: 'fa-weight-scale', label: 'Pesaje', primary: true, fn: () => X.openEvent('pesaje') }, { icon: 'fa-right-left', label: 'Cambio de etapa', fn: () => X.openEvent('etapa') }] });
    },

    /* ---------- Pestaña: reproducción ---------- */
    bench(e, k, filt) {
      const U = SIGA.ui, rows = X.BENCH[e.key](e, k).filter((r, i) => !filt || filt(r, i));
      return dtbl([['Indicador'], ['Valor', 1], ['Meta', 1], ['Brecha', 1], ['Estado'], ['Cálculo']], rows.map(r => { const s = X.semaf(r[1], r[2], r[4]), g = r[1] - r[2]; return [`<b>${r[0]}</b>`, (+r[1] || 0).toFixed(r[3]) + (r[5] ? ' ' + r[5] : ''), (+r[2]).toFixed(r[3]) + (r[5] ? ' ' + r[5] : ''), `<span style="color:${s === 'ok' ? 'var(--ok)' : s === 'warn' ? '#b7791f' : 'var(--danger)'}">${g >= 0 ? '+' : ''}${g.toFixed(r[3])}</span>`, U.tag(s === 'ok' ? 'En meta' : s === 'warn' ? 'Cerca' : 'Bajo meta', s === 'ok' ? 't-green' : s === 'warn' ? 't-amber' : 't-red'), `<span class="mini">${r[6]}</span>`]; }));
    },
    p_rep(host, e, k) {
      const U = SIGA.ui;
      if (e.key === 'porcino') {
        const cer = e.anim.filter(a => /Reproductora|Primeriza/.test(a.cat) && a.estado === 'Activa'), par = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(p => cer.filter(a => p === 8 ? a.par >= 8 : a.par === p).length);
        const prox = cer.filter(a => a.rep === 'Gestante' && -X.dd(a.fParto) <= 21).sort((a, b) => X.sv(a.fParto) - X.sv(b.fParto));
        const pts = cer.flatMap(a => a.partos.filter(p => X.dd(p.f) <= 365).map(p => Object.assign({ cerda: a.id }, p))).sort((a, b) => X.sv(b.f) - X.sv(a.f));
        const srv = cer.flatMap(a => a.serv.filter(s => s.f !== '—' && X.dd(s.f) <= 60).map(s => ({ cerda: a.id, f: s.f, macho: s.macho, res: s.res, par: a.par }))).sort((a, b) => X.sv(b.f) - X.sv(a.f));
        host.innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Indicadores reproductivos vs meta <span class="grow">referencia PigCHAMP / Agriness</span></h3>${this.bench(e, k, (r, i) => i < 9)}</div>
            <div class="card"><h3><span class="dot"></span>Estructura por paridad</h3>${U.chart.cols({ labels: ['Nulíp.', '1', '2', '3', '4', '5', '6', '7', '8+'], series: [{ name: 'Cerdas', data: par }], h: 200 })}<p class="mini">Primerizas y 1.er parto: ${((par[0] + par[1]) / Math.max(1, cer.length) * 100).toFixed(0)} % · cerdas de 7 o más partos: ${par[7] + par[8]} (candidatas a descarte).</p></div></div>
          <div class="split eq mb"><div class="card"><h3><span class="dot"></span>Partos próximos · 21 días</h3><div id="pc-pp"></div></div><div class="card"><h3><span class="dot"></span>Servicios de los últimos 60 días</h3><div id="pc-sv"></div></div></div>
          <div class="card"><h3><span class="dot"></span>Registro de partos · 12 meses <span class="grow">${pts.length} partos · NT ${k.nt.toFixed(2)} · NV ${k.nv.toFixed(2)}</span></h3><div id="pc-pt"></div></div>`;
        const R = this.aniRec(e), ver = r => U.rec(R).ver(e.anim.find(a => a.id === (r.cerda || r.id)));
        host.querySelector('#pc-pp').innerHTML = U.grid({ id: 'pc-pp', title: 'partos próximos', rows: prox, search: false, pageSize: 8, onRow: a => U.rec(R).ver(a), empty: 'Sin partos en los próximos 21 días',
          cols: [{ k: 'id', label: 'Cerda', render: a => `<span class="code">${a.id}</span>` }, { k: 'par', label: 'Paridad', r: true }, { k: 'fParto', label: 'Parto probable', sv: a => X.sv(a.fParto) }, { k: 'd', label: 'Faltan', r: true, sv: a => -X.dd(a.fParto), render: a => -X.dd(a.fParto) + ' d' }, { k: 'ubic', label: 'Ubicación', cls: 'mini' }],
          actions: [{ icon: 'fa-baby', title: 'Registrar parto', fn: a => X.openEvent('parto', a.id) }] });
        host.querySelector('#pc-sv').innerHTML = U.grid({ id: 'pc-sv', title: 'servicios', rows: srv, search: false, pageSize: 8, onRow: ver, filter: { label: 'Resultado', get: s => s.res },
          cols: [{ k: 'f', label: 'Fecha', sv: s => X.sv(s.f) }, { k: 'cerda', label: 'Cerda', render: s => `<span class="code">${s.cerda}</span>` }, { k: 'macho', label: 'Verraco / dosis', cls: 'mini' }, { k: 'res', label: 'Resultado', render: s => U.tag(s.res, s.res === 'Parto' ? 't-green' : s.res === 'Repetición' ? 't-red' : 't-blue') }] });
        host.querySelector('#pc-pt').innerHTML = U.grid({ id: 'pc-pt', title: 'partos', export: 'partos_12_meses', rows: pts, pageSize: 10, onRow: ver,
          cols: [{ k: 'f', label: 'Fecha', sv: p => X.sv(p.f) }, { k: 'cerda', label: 'Cerda', render: p => `<span class="code">${p.cerda}</span>` }, { k: 'n', label: 'Parto', r: true, render: p => p.n + '.º' }, { k: 'nt', label: 'NT', r: true }, { k: 'nv', label: 'NV', r: true, render: p => `<b>${p.nv}</b>` }, { k: 'nm', label: 'NM', r: true }, { k: 'mom', label: 'Momias', r: true },
            { k: 'dest', label: 'Destetados', r: true, render: p => p.dest == null ? U.tag('lactando', 't-teal') : p.dest }, { k: 'lact', label: 'Lactancia', r: true, render: p => p.lact == null ? '—' : p.lact + ' d' }, { k: 'pesoDest', label: 'Peso destete', r: true, render: p => p.pesoDest == null ? '—' : p.pesoDest + ' kg' }],
          foot: rs => `<tr><td colspan="3" class="r"><b>Promedio</b></td><td class="r num"><b>${X.avg(rs, 'nt').toFixed(2)}</b></td><td class="r num"><b>${X.avg(rs, 'nv').toFixed(2)}</b></td><td class="r num">${X.avg(rs, 'nm').toFixed(2)}</td><td class="r num">${X.avg(rs, 'mom').toFixed(2)}</td><td class="r num"><b>${X.avg(rs.filter(p => p.dest != null), 'dest').toFixed(2)}</b></td><td colspan="2"></td></tr>` });
        return;
      }
      if (e.key === 'vacuno') {
        const hem = e.anim.filter(a => /Vaca|Vaquillona/.test(a.cat) && a.estado === 'Activa'), est = {};
        hem.forEach(a => { est[a.rep] = (est[a.rep] || 0) + 1; });
        const lac = hem.filter(a => a.cat === 'Vaca en producción'), B = [[0, 50], [50, 100], [100, 150], [150, 200], [200, 305], [305, 999]], dl = B.map(b => lac.filter(a => a.del >= b[0] && a.del < b[1]).length);
        const cal = hem.filter(a => a.fServ || a.fParto).sort((a, b) => X.sv(a.fParto || '31/12/2099') - X.sv(b.fParto || '31/12/2099'));
        host.innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Indicadores reproductivos vs meta <span class="grow">referencia DairyComp 305</span></h3>${this.bench(e, k, (r, i) => i >= 4)}</div>
            <div class="card"><h3><span class="dot"></span>Estado reproductivo del hato</h3>${U.bars(Object.entries(est).sort((a, b) => b[1] - a[1]).map(([s, n]) => [s, n / hem.length * 100, /Preñada|Seca/.test(s) ? 'var(--ok)' : /Servida/.test(s) ? '#0D6EFD' : '#D97706', n + ' animales']))}
              <div class="lbl-s mt mb">Vacas en ordeño por días en leche</div>${U.chart.cols({ labels: ['0–49', '50–99', '100–149', '150–199', '200–304', '305+'], series: [{ name: 'Vacas', data: dl }], h: 160 })}</div></div>
          <div class="card"><h3><span class="dot"></span>Calendario reproductivo <span class="grow">servicio → palpación (40 d) → secado (60 d antes) → parto (283 d)</span></h3><div id="pc-cal"></div></div>`;
        host.querySelector('#pc-cal').innerHTML = U.grid({ id: 'pc-cal', title: 'calendario reproductivo', export: 'calendario_reproductivo', rows: cal, record: this.aniRec(e), pageSize: 12, filter: { label: 'Estado', get: a => a.rep },
          cols: [{ k: 'id', label: 'Animal', render: a => `<span class="code">${a.id}</span> ${U.esc(a.nombre || '')}` }, { k: 'cat', label: 'Categoría', cls: 'mini' }, { k: 'rep', label: 'Estado', render: a => U.tag(a.rep, REPCLS[a.rep] || 't-gray') }, { k: 'nServ', label: 'Serv.', r: true },
            { k: 'fServ', label: 'Último servicio', sv: a => X.sv(a.fServ) }, { k: 'dg', label: 'Días gest.', r: true, sv: a => a.fServ ? X.dd(a.fServ) : 0, render: a => /Preñada|Seca|Servida/.test(a.rep) && a.fServ ? X.dd(a.fServ) : '—' }, { k: 'diag', label: 'Diagnóstico', cls: 'mini' },
            { k: 'sec', label: 'Secado', sv: a => X.sv(a.fParto), render: a => a.cat === 'Vaca en producción' && a.fParto && a.rep === 'Preñada' ? X.addD(a.fParto, -60) : a.rep === 'Seca' ? U.tag('seca', 't-gray') : '—' }, { k: 'fParto', label: 'Parto esperado', sv: a => X.sv(a.fParto), render: a => a.fParto ? `<b>${a.fParto}</b>` : '—' }],
          actions: [{ icon: 'fa-bolt', title: 'Siguiente evento', show: a => !!this.nextEv(e, a), fn: a => X.openEvent(this.nextEv(e, a), a.id) }] });
        return;
      }
      const pz = e.lotes.filter(l => l.tipo === 'Poza de empadre' && l.estado === 'Activo' && l.partos);
      host.innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Indicadores reproductivos vs meta <span class="grow">referencia INIA · línea Perú</span></h3>${this.bench(e, k, (r, i) => i < 4)}</div>
          <div class="card"><h3><span class="dot"></span>Tamaño de camada por poza</h3>${U.chart.cols({ labels: pz.map(l => l.id), series: [{ name: 'Crías por parto', data: pz.map(l => +(l.nacidos / l.partos).toFixed(2)) }], fmt: v => v.toFixed(2), h: 210 })}</div></div>
        <div class="card"><h3><span class="dot"></span>Ranking de pozas por índice productivo <span class="grow">selección de reproductoras y reemplazo de machos</span></h3>${dtbl([['Poza'], ['Línea'], ['Macho'], ['Hembras', 1], ['Camada', 1], ['Fertilidad', 1], ['Mort. lactancia', 1], ['IP (crías/hembra/mes)', 1]], pz.filter(l => l.edad >= 75).map(l => [l, (l.vivos - l.muertes) / Math.max(1, l.hembras * l.edad / 30)]).sort((a, b) => b[1] - a[1]).map(([l, ip]) => [`<span class="code">${l.id}</span>`, l.linea, l.macho, l.hembras, (l.nacidos / l.partos).toFixed(2), (l.partos / l.hembras * 100).toFixed(0) + ' %', (l.vivos ? l.muertes / l.vivos * 100 : 0).toFixed(1) + ' %', `<b>${ip.toFixed(2)}</b>`]))}</div>`;
    },

    /* ---------- Pestaña: producción ---------- */
    p_prd(host, e, k) {
      const U = SIGA.ui, M = e.mensual;
      if (e.key === 'vacuno') return this.leche(host, e, k);
      if (e.key === 'ave') return this.diario(host, e);
      const sac = e.mov.filter(m => /Saca|Venta|Descarte/.test(m.tipo));
      let extra = '';
      if (e.key === 'porcino') {
        const cer = e.anim.filter(a => /Reproductora|Primeriza/.test(a.cat)), ms = ['03', '04', '05', '06', '07', '08'], lab = ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'];
        const pm = ms.map(m => cer.flatMap(a => a.partos.filter(p => p.f.slice(3) === m + '/2026')));
        extra = `<div class="card mb"><h3><span class="dot"></span>Partos, nacidos vivos y destetados por mes <span class="grow">flujo de lechones hacia recría</span></h3>${U.chart.cols({ labels: lab, series: [{ name: 'Partos', data: pm.map(x => x.length), color: '#0D6EFD' }, { name: 'Nacidos vivos', data: pm.map(x => X.sum(x, 'nv')) }, { name: 'Destetados', data: pm.map(x => X.sum(x, 'dest')), color: '#D97706' }], h: 220 })}</div>`;
      }
      host.innerHTML = `<div class="split eq mb"><div class="card"><h3><span class="dot"></span>Producción mensual · ${M.unidad}</h3>${U.chart.cols({ labels: M.labels, series: [{ name: M.unidad, data: M.prod }], h: 220 })}<p class="mini">Agosto al día 18.</p></div>
          <div class="card"><h3><span class="dot"></span>Costo unitario de producción</h3>${U.chart.line({ labels: M.labels, series: [{ name: 'S/ por kg', data: M.costoKg }], fmt: v => 'S/ ' + v.toFixed(2), area: true, h: 220 })}</div></div>
        ${extra}<div class="card"><h3><span class="dot"></span>Sacas, ventas y descartes <span class="grow">rendimiento de canal ${Math.round(X.REND[e.key] * 100)} % · la canal ingresa al almacén como producto terminado</span></h3><div id="pc-sc"></div></div>`;
      host.querySelector('#pc-sc').innerHTML = U.grid({ id: 'pc-sc-' + e.key, title: 'sacas y ventas', export: 'sacas_' + e.key, rows: sac, record: this.movRec(e), pageSize: 8,
        cols: [{ k: 'f', label: 'Fecha', sv: m => X.sv(m.f) }, { k: 'tipo', label: 'Tipo', render: m => U.tag(m.tipo, EVCLS[m.tipo] || 't-amber') }, { k: 'ref', label: 'Lote / animal', render: m => `<span class="code">${U.esc(m.ref)}</span>` }, { k: 'cant', label: 'Cab.', r: true }, { k: 'kg', label: 'Kg vivos', r: true, render: m => INT(m.kg) },
          { k: 'pp', label: 'Peso prom.', r: true, sv: m => m.kg / Math.max(1, m.cant), render: m => (m.kg / Math.max(1, m.cant)).toFixed(e.key === 'cuy' ? 2 : 1) + ' kg' }, { k: 'canal', label: 'Canal est.', r: true, render: m => /Venta/.test(m.tipo) ? '—' : INT(m.kg * X.REND[e.key]) + ' kg' }, { k: 'destino', label: 'Destino', cls: 'mini' }, { k: 'csti', label: 'CSTI', render: m => m.csti ? `<span class="code">${m.csti.replace('CSTI ', '')}</span>` : '—' }],
        foot: rs => `<tr><td colspan="3" class="r"><b>Total</b></td><td class="r num"><b>${X.sum(rs, 'cant')}</b></td><td class="r num"><b>${INT(X.sum(rs, 'kg'))}</b></td><td colspan="4"></td></tr>`,
        tools: [{ icon: 'fa-truck', label: 'Registrar saca / venta', primary: true, fn: () => X.movForm(e) }] });
    },
    leche(host, e, k) {
      const U = SIGA.ui, t = e.tanque, h = t[t.length - 1], lac = e.anim.filter(a => a.cat === 'Vaca en producción' && a.estado === 'Activa');
      const kk = lac.length ? X.avg(lac, a => a.leche / e.wood(Math.max(1, a.del), 1)) : 1, lb = [], std = [], real = [];
      for (let d = 0; d < 300; d += 30) { const g = lac.filter(a => a.del >= d && a.del < d + 30); lb.push(d + '–' + (d + 29)); std.push(+e.wood(d + 15, kk).toFixed(1)); real.push(g.length ? +X.avg(g, 'leche').toFixed(1) : null); }
      host.innerHTML = `<div class="grid cols-6 mb">${[['Ordeño AM', INT(h.am) + ' L', 'fa-sun'], ['Ordeño PM', INT(h.pm) + ' L', 'fa-moon'], ['Descartada (retiro)', INT(h.desc) + ' L', 'fa-ban'], ['A planta de lácteos', INT(h.planta) + ' L', 'fa-industry'], ['Venta directa', INT(h.venta) + ' L', 'fa-cash-register'], ['Grasa · sólidos tot.', h.grasa + ' · ' + h.st + ' %', 'fa-flask']].map(x => `<div class="mini-card"><div class="lab"><i class="fa-solid ${x[2]}"></i> ${x[0]}</div><div class="v">${x[1]}</div></div>`).join('')}</div>
        <div class="split eq mb"><div class="card"><h3><span class="dot"></span>Tanque de leche · 14 días <span class="grow">destino de la producción</span></h3>${U.chart.cols({ labels: t.map(x => x.f.slice(0, 5)), series: [{ name: 'Planta de lácteos', data: t.map(x => x.planta) }, { name: 'Venta directa', data: t.map(x => x.venta), color: '#0D6EFD' }, { name: 'Descartada', data: t.map(x => x.desc), color: '#DC2626' }], fmt: v => INT(v) + ' L', h: 220 })}</div>
          <div class="card"><h3><span class="dot"></span>Curva de lactancia del hato <span class="grow">promedio real por tramo de DEL vs curva de Wood</span></h3>${U.chart.line({ labels: lb, series: [{ name: 'Curva esperada', data: std, color: '#94A3B8', dash: true }, { name: 'Promedio real', data: real }], fmt: v => v.toFixed(1) + ' L', h: 220 })}</div></div>
        <div class="card"><h3><span class="dot"></span>Control lechero individual · ${h.f} <span class="grow">${lac.length} vacas · ${INT(k.litros)} L · ${k.prom.toFixed(1)} L/vaca · CCS ponderada ${INT(k.ccs)} mil/ml</span></h3><div id="pc-cl"></div></div>`;
      host.querySelector('#pc-cl').innerHTML = U.grid({ id: 'pc-cl', title: 'control lechero', export: 'control_lechero_' + SIGA.ctx.hoyISO, rows: lac, record: this.aniRec(e), pageSize: 12,
        cols: [{ k: 'id', label: 'Vaca', render: a => `<span class="code">${a.id}</span> ${U.esc(a.nombre)}` }, { k: 'lact', label: 'Lact.', r: true }, { k: 'del', label: 'DEL', r: true }, { k: 'am', label: 'AM', r: true }, { k: 'pm', label: 'PM', r: true }, { k: 'leche', label: 'Total L', r: true, render: a => `<b>${a.leche}</b>` },
          { k: 'p305', label: 'Proy. 305 d', r: true, render: a => INT(a.p305) }, { k: 'ccs', label: 'CCS', r: true, render: a => `<span style="color:${a.ccs > 400 ? 'var(--danger)' : a.ccs > 250 ? '#b7791f' : 'inherit'};font-weight:700">${a.ccs}</span>` },
          { k: 'rep', label: 'Reproducción', render: a => U.tag(a.rep, REPCLS[a.rep] || 't-gray') }, { k: 'ret', label: 'Leche', nosort: true, render: a => { const r = X.retiroDe(e, a.id, 'Leche'); return r ? U.tag('Descartar hasta ' + r.hasta.slice(0, 5), 't-red') : U.tag('Apta', 't-green'); } }],
        rowCls: a => X.retiroDe(e, a.id, 'Leche') ? 'row-void' : '',
        actions: [{ icon: 'fa-bottle-droplet', title: 'Control lechero', fn: a => X.openEvent('control', a.id) }, { icon: 'fa-kit-medical', title: 'Tratamiento', fn: a => X.tratForm(e, a.id) }],
        foot: rs => `<tr><td colspan="3" class="r"><b>Total del día</b></td><td class="r num"><b>${INT(X.sum(rs, 'am'))}</b></td><td class="r num"><b>${INT(X.sum(rs, 'pm'))}</b></td><td class="r num"><b>${INT(X.sum(rs, 'leche'))}</b></td><td colspan="5"></td></tr>`,
        tools: [{ icon: 'fa-industry', label: 'Destino de la leche', primary: true, fn: () => X.destinarLeche(e) }, { icon: 'fa-print', label: 'Reporte de control', fn: () => U.preview('Control lechero · ' + h.f, U.doc({ office: 'Centro de Producción · Establo lechero', tipo: 'Reporte de control lechero', num: 'CL-' + h.f.replace(/\//g, ''), pairs: [['Vacas en ordeño', lac.length], ['Litros del día', INT(k.litros) + ' L'], ['Promedio por vaca', k.prom.toFixed(1) + ' L'], ['CCS ponderada', INT(k.ccs) + ' mil/ml'], ['Leche descartada', INT(h.desc) + ' L'], ['DEL promedio', INT(k.del)]], body: dtbl([['Vaca'], ['Lact.', 1], ['DEL', 1], ['AM', 1], ['PM', 1], ['Total', 1], ['305 d', 1], ['CCS', 1]], lac.map(a => [a.id + ' ' + U.esc(a.nombre), a.lact, a.del, a.am, a.pm, a.leche, INT(a.p305), a.ccs])) }), { file: 'control_lechero_' + SIGA.ctx.hoyISO }) }] });
    },
    diario(host, e) {
      const U = SIGA.ui, ls = e.lotes.filter(l => l.diario && l.diario.length), l = ls.find(x => x.id === this.aveSel) || ls[0], m = X.lm(e, l), pos = l.tipo === 'Ponedoras';
      const cards = pos ? [['Aves', INT(l.cab)], ['Edad', Math.round(l.edad / 7) + ' semanas'], ['Postura hoy', m.dia ? m.dia.postura + ' %' : '—'], ['Huevos hoy', m.dia ? INT(m.dia.huevos) : '—'], ['Peso del huevo', m.dia && m.dia.pesoHuevo ? m.dia.pesoHuevo + ' g' : '—'], ['Alimento / docena', m.dia && m.dia.huevos ? (m.dia.alim / (m.dia.huevos / 12)).toFixed(2) + ' kg' : '—']]
        : [['Aves', INT(l.cab)], ['Edad', l.edad + ' días'], ['Viabilidad', m.viab.toFixed(1) + ' %'], ['Peso', m.peso.toFixed(3) + ' kg' + (m.dev != null ? ` (${m.dev >= 0 ? '+' : ''}${m.dev.toFixed(1)} %)` : '')], ['FCR', m.fcr ? m.fcr.toFixed(2) : '—'], ['EPEF', m.epef ? INT(m.epef) : '—']];
      const d = l.diario;
      host.innerHTML = `<div class="seg-tabs" id="pc-avs">${ls.map(x => `<button data-l="${x.id}" class="${x.id === l.id ? 'on' : ''}">${x.id} <span class="mini">${x.tipo === 'Ponedoras' ? x.etapa.toLowerCase() : x.estado === 'Activo' ? x.edad + ' d' : 'cerrado'}</span></button>`).join('')}</div>
        <div class="grid cols-6 mb">${cards.map(c => `<div class="mini-card"><div class="lab">${c[0]}</div><div class="v">${c[1]}</div></div>`).join('')}</div>
        <div class="split eq mb"><div class="card"><h3><span class="dot"></span>${pos ? '% de postura diario vs estándar Hy-Line' : 'Peso semanal vs estándar Cobb 500'}</h3>${pos ? U.chart.line({ labels: d.map(x => x.f.slice(0, 5)), series: [{ name: 'Estándar', data: d.map(() => l.etapa === 'Postura' ? e.metas.postura : 8), color: '#94A3B8', dash: true }, { name: '% postura', data: d.map(x => x.postura) }], fmt: v => v.toFixed(1) + ' %', yMax: 100, h: 210 }) : U.chart.line({ labels: l.pesos.map(p => 'Sem ' + Math.round(p[1] / 7)), series: [{ name: 'Estándar', data: l.pesos.map(p => e.stdPeso(p[1])), color: '#94A3B8', dash: true }, { name: 'Peso real', data: l.pesos.map(p => p[2]) }], fmt: v => v.toFixed(3) + ' kg', axFmt: v => v.toFixed(1), h: 210 })}</div>
          <div class="card"><h3><span class="dot"></span>Consumo diario de alimento y agua</h3>${U.chart.cols({ labels: d.map(x => x.f.slice(0, 5)), series: [{ name: 'Alimento (kg)', data: d.map(x => x.alim) }, { name: 'Agua (L)', data: d.map(x => x.agua), color: '#0D6EFD' }], h: 210 })}</div></div>
        <div class="card"><h3><span class="dot"></span>Registro diario del lote ${l.id} <span class="grow">${U.esc(l.linea)} · ${U.esc(l.ubic)}</span></h3><div id="pc-dr"></div></div>`;
      host.querySelectorAll('#pc-avs [data-l]').forEach(b => b.addEventListener('click', () => { this.aveSel = b.dataset.l; this.diario(host, e); }));
      host.querySelector('#pc-dr').innerHTML = U.grid({ id: 'pc-dr-' + l.id, title: 'registro diario ' + l.id, export: 'registro_diario_' + l.id, rows: d.slice().reverse(), pageSize: 10, search: false,
        cols: [{ k: 'f', label: 'Fecha', sv: x => X.sv(x.f) }, { k: 'edad', label: pos ? 'Edad (d)' : 'Día', r: true }, { k: 'aves', label: 'Aves', r: true, render: x => INT(x.aves) }, { k: 'muertes', label: 'Muertes', r: true, render: x => x.muertes ? `<b style="color:var(--danger)">${x.muertes}</b>` : 0 }, { k: 'alim', label: 'Alimento kg', r: true, render: x => INT(x.alim) }, { k: 'agua', label: 'Agua L', r: true, render: x => INT(x.agua) },
          ...(pos ? [{ k: 'huevos', label: 'Huevos', r: true, render: x => INT(x.huevos) }, { k: 'postura', label: '% postura', r: true, render: x => `<b>${x.postura}</b>` }, { k: 'rotos', label: 'Rotos', r: true }, { k: 'pesoHuevo', label: 'Peso huevo g', r: true, render: x => x.pesoHuevo || '—' }]
            : [{ k: 'cons', label: 'g/ave', r: true, render: x => x.aves ? INT(x.alim / x.aves * 1000) : '—' }, { k: 'peso', label: 'Peso kg', r: true, render: x => x.peso ? `<b>${x.peso.toFixed(3)}</b>` : '—' }])],
        rowCls: x => x.nuevo ? 'row-new' : '',
        tools: l.estado === 'Activo' ? [{ icon: 'fa-clipboard-list', label: 'Registro diario', primary: true, fn: () => X.openEvent('diario', l.id) }] : [] });
    },

    /* ---------- Pestaña: sanidad ---------- */
    p_san(host, e) {
      const U = SIGA.ui, rt = X.retiros(e), causas = {};
      e.mort.filter(m => !m.anulado).forEach(m => { causas[m.causa] = (causas[m.causa] || 0) + m.cant; });
      const mx = Math.max(1, ...Object.values(causas));
      host.innerHTML = `${rt.length ? `<div class="grid cols-3 mb">${rt.map(r => `<div class="mini-card pc-ret"><div class="lab"><i class="fa-solid fa-ban"></i> Retiro de ${r.tipo.toLowerCase()} · ${r.src}</div><div class="v">${U.esc(r.ref)}</div><div class="s">${U.esc(r.prod)} · hasta el <b>${r.hasta}</b> · faltan ${r.rest} días</div>${U.meter(100 - r.rest / 35 * 100, 'var(--danger)', 6)}</div>`).join('')}</div>` : nota('teal', 'fa-circle-check', 'Sin períodos de retiro vigentes: todos los animales y la leche están aptos.')}
        <div class="card mb"><h3><span class="dot"></span>Plan sanitario <span class="grow">vacunaciones, desparasitaciones y controles · la aplicación descuenta biológicos del almacén</span></h3><div id="pc-pl"></div></div>
        <div class="card mb"><h3><span class="dot"></span>Tratamientos y período de retiro <span class="grow">el retiro de carne bloquea la saca; el de leche la descarta del tanque</span></h3><div id="pc-tr"></div></div>
        <div class="split"><div class="card"><h3><span class="dot"></span>Registro de mortalidad</h3><div id="pc-mo"></div></div>
          <div class="card"><h3><span class="dot"></span>Mortalidad por causa</h3>${U.bars(Object.entries(causas).sort((a, b) => b[1] - a[1]).map(([c, n]) => [c, n / mx * 100, 'var(--danger)', n + ' cab.']))}</div></div>`;
      host.querySelector('#pc-pl').innerHTML = U.grid({ id: 'pc-pl-' + e.key, title: 'plan sanitario', export: 'plan_sanitario_' + e.key, rows: e.plan, pageSize: 8, filter: { label: 'Estado', get: p => p.estado },
        record: { mod: 'Control pecuario', tipo: 'Registro sanitario', office: 'Centro de Producción · ' + e.unidad, key: p => p.id, title: p => p.act + ' · ' + p.obj, estado: 'estado', cls: false, anuladoValor: 'Cancelada',
          fields: p => [['N.º', p.id], ['Fecha', p.f], ['Actividad', p.act], ['Producto', U.esc(p.prod) + (p.cod ? ` · <span class="code">${p.cod}</span>` : '')], ['Dosis · vía', p.dosis + ' · ' + p.via], ['Animales / lote', p.obj], ['Cabezas', p.cab], ['Retiro', p.ret ? p.ret + ' días' : 'Sin retiro'], ['Estado', p.estado], ['Salida de almacén', p.doc || '—'], ['Costo', p.costo ? U.money(p.costo) : '—']],
          edit: [{ k: 'f', label: 'Fecha programada' }, { k: 'cab', label: 'Cabezas', type: 'number' }], canEdit: p => p.estado === 'Programada',
          extra: p => p.estado === 'Programada' ? [{ icon: 'fa-syringe', label: 'Registrar aplicación', fn: () => X.aplicar(e, p) }] : [],
          anular: true, anularLabel: 'Cancelar actividad', canAnular: p => p.estado === 'Programada' },
        cols: [{ k: 'f', label: 'Fecha', sv: p => X.sv(p.f), render: p => p.f + (p.estado === 'Programada' && X.dd(p.f) > 0 ? ' ' + U.tag('vencida', 't-red') : '') }, { k: 'act', label: 'Actividad', render: p => `<b>${U.esc(p.act)}</b><div class="mini">${U.esc(p.prod)} · ${U.esc(p.dosis)} ${U.esc(p.via)}</div>` }, { k: 'obj', label: 'Animales / lote' }, { k: 'cab', label: 'Cab.', r: true },
          { k: 'ret', label: 'Retiro', r: true, render: p => p.ret ? p.ret + ' d' : '—' }, { k: 'stk', label: 'Stock', nosort: true, render: p => { const it = X.item(p.cod); return it ? `<span class="mini" style="color:${it.stock < it.min ? 'var(--danger)' : 'inherit'}">${it.stock} ${it.um.toLowerCase()}</span>` : '<span class="mini">—</span>'; } }, { k: 'estado', label: 'Estado', render: p => U.tag(p.estado, p.estado === 'Aplicada' ? 't-green' : p.estado === 'Cancelada' ? 't-gray' : 't-amber') }],
        rowCls: p => (p.nuevo ? 'row-new' : '') + (p.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-syringe', title: 'Registrar aplicación', show: p => p.estado === 'Programada', fn: p => X.aplicar(e, p) }],
        tools: [{ icon: 'fa-calendar-plus', label: 'Programar', primary: true, fn: () => X.programar(e) }] });
      host.querySelector('#pc-tr').innerHTML = U.grid({ id: 'pc-tr-' + e.key, title: 'tratamientos', export: 'tratamientos_' + e.key, rows: e.trat, pageSize: 8, filter: { label: 'Estado', get: t => t.estado },
        record: { mod: 'Control pecuario', tipo: 'Receta y registro de tratamiento', office: 'Centro de Producción · ' + e.unidad, key: t => t.id, title: t => t.id + ' · ' + t.ref + ' · ' + t.diag, estado: 'estado', cls: false, anuladoValor: 'Anulado',
          fields: t => { const f0 = X.addD(t.f, t.dias); return [['N.º', t.id], ['Fecha', t.f], ['Animal / lote', `<span class="code">${t.ref}</span> · ${t.cant} cab.`], ['Diagnóstico', U.esc(t.diag), 1], ['Producto', U.esc(t.prod)], ['Dosis · vía', t.dosis + ' · ' + t.via], ['Duración', t.dias + ' días (hasta ' + f0 + ')'], ['Retiro de carne', t.retC ? t.retC + ' d · hasta ' + X.addD(f0, t.retC) : 'No aplica'], ['Retiro de leche', t.retL ? t.retL + ' d · hasta ' + X.addD(f0, t.retL) : 'No aplica'], ['Médico veterinario', t.vet], ['Costo', U.money(t.costo || 0)], ['Salida de almacén', t.doc || '—'], ['Estado', t.estado + (t.fAlta ? ' · ' + t.fAlta : '')]]; },
          extra: t => t.estado === 'En tratamiento' ? [{ icon: 'fa-circle-check', label: 'Dar de alta', fn: () => X.alta(e, t) }] : [],
          anular: true, anularLabel: 'Anular registro (error de digitación)',
          print: t => ({ tipo: 'Receta veterinaria y registro de tratamiento', num: t.id, firmas: [['Prescribió', t.vet], ['Aplicó', 'Técnico de la unidad'], ['V.° B.°', 'Jefe del Centro de Producción']] }) },
        cols: [{ k: 'id', label: 'N.º', render: t => `<span class="code">${t.id}</span>` }, { k: 'f', label: 'Fecha', sv: t => X.sv(t.f) }, { k: 'ref', label: 'Animal / lote', render: t => `<span class="code">${t.ref}</span>` }, { k: 'diag', label: 'Diagnóstico', cls: 'mini' }, { k: 'prod', label: 'Producto', cls: 'mini' },
          { k: 'rc', label: 'Retiro carne', sv: t => X.sv(X.addD(X.addD(t.f, t.dias), t.retC)), render: t => { if (!t.retC) return '—'; const h = X.addD(X.addD(t.f, t.dias), t.retC); return X.dd(h) <= 0 && !t.anulado ? U.tag('hasta ' + h.slice(0, 5), 't-red') : '<span class="mini">cumplido</span>'; } },
          { k: 'rl', label: 'Retiro leche', render: t => { if (!t.retL) return '—'; const h = X.addD(X.addD(t.f, t.dias), t.retL); return X.dd(h) <= 0 && !t.anulado ? U.tag('hasta ' + h.slice(0, 5), 't-red') : '<span class="mini">cumplido</span>'; } },
          { k: 'costo', label: 'Costo', r: true, render: t => U.money(t.costo || 0, '') }, { k: 'estado', label: 'Estado', render: t => U.tag(t.estado, t.estado === 'Alta' ? 't-green' : t.estado === 'Anulado' ? 't-gray' : 't-amber') }],
        rowCls: t => (t.nuevo ? 'row-new' : '') + (t.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-circle-check', title: 'Dar de alta', show: t => t.estado === 'En tratamiento', fn: t => X.alta(e, t) }],
        tools: [{ icon: 'fa-kit-medical', label: 'Nuevo tratamiento', primary: true, fn: () => X.tratForm(e) }] });
      host.querySelector('#pc-mo').innerHTML = U.grid({ id: 'pc-mo-' + e.key, title: 'mortalidad', export: 'mortalidad_' + e.key, rows: e.mort, pageSize: 8, filter: { label: 'Causa', get: m => m.causa },
        record: { mod: 'Control pecuario', tipo: 'Registro de mortalidad', office: 'Centro de Producción · ' + e.unidad, key: m => m.ref + ' ' + m.f, title: m => 'Mortalidad · ' + m.ref + ' · ' + m.f, estado: 'est', cls: false,
          fields: m => [['Fecha', m.f], ['Animal / lote', m.ref], ['Cantidad', m.cant], ['Causa', m.causa], ['Edad', m.edad], ['Necropsia', m.nec]], edit: [{ k: 'causa', label: 'Causa', type: 'select', options: X.CAUSAS[e.key].concat(['Nacido muerto', 'Mortalidad en lactancia (ajuste al destete)']) }, { k: 'nec', label: 'Necropsia' }], anular: true, anularLabel: 'Anular registro' },
        cols: [{ k: 'f', label: 'Fecha', sv: m => X.sv(m.f) }, { k: 'ref', label: 'Animal / lote', render: m => `<span class="code">${U.esc(m.ref)}</span>` }, { k: 'cant', label: 'Cant.', r: true }, { k: 'causa', label: 'Causa' }, { k: 'edad', label: 'Edad', cls: 'mini' }, { k: 'nec', label: 'Necropsia', cls: 'mini' }],
        rowCls: m => (m.nuevo ? 'row-new' : '') + (m.anulado ? ' row-void' : ''),
        tools: e.key === 'vacuno' ? [] : [{ icon: 'fa-skull-crossbones', label: 'Registrar', primary: true, fn: () => X.openEvent(e.key === 'ave' ? 'diario' : 'mortalidad') }] });
    },

    /* ---------- Pestaña: alimentación ---------- */
    p_ali(host, e) {
      const U = SIGA.ui, req = X.requerimiento(e), cob = X.cobertura(e);
      host.innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Raciones · fórmulas <span class="grow">lista de materiales, aporte nutricional y costo por kg</span></h3><div id="pc-rc"></div></div>
          <div class="card"><h3><span class="dot"></span>Requerimiento diario <span class="grow">población × consumo estándar</span></h3>${dtbl([['Grupo'], ['Ración'], ['Cab.', 1], ['kg/cab.', 1], ['kg/día', 1]], req.map(q => [q.grupo, `<span class="code">${q.rac}</span>`, INT(q.cab), q.kgCab.toFixed(3), `<b>${INT(q.kg)}</b>`]))}
            <p class="mini mt">Costo diario de alimentación: <b>${U.money(req.reduce((s, q) => s + q.kg * ((e.rac.find(r => r.id === q.rac) || {}).costoKg || 0), 0))}</b></p></div></div>
        <div class="card mb"><h3><span class="dot"></span>Cobertura de alimento en almacén <span class="grow">stock ÷ requerimiento diario · explosión de raciones por insumo</span></h3><div id="pc-cb"></div></div>
        <div class="card"><h3><span class="dot"></span>Consumo registrado <span class="grow">cada consumo genera PECOSA, asiento de consumo e imputa el costo al lote</span></h3><div id="pc-cs"></div></div>`;
      const racRec = { mod: 'Control pecuario', tipo: 'Fórmula de ración', office: 'Centro de Producción · ' + e.unidad, key: r => r.id, title: r => r.id + ' · ' + r.nombre, estado: 'est', cls: false,
        fields: r => [['Código', r.id], ['Nombre', r.nombre], ['Etapa', r.etapa], ['Proteína bruta', r.pb + ' %'], ['Energía', INT(r.em) + ' kcal/kg'], ['Costo por kg', U.money(r.costoKg)], ['Costo por tonelada', U.money(r.costoKg * 1000)], ['Insumo de almacén', X.explota(r, 1).map(x => x.it ? x.it.desc.split(' · ')[0] : '—').join(' · ')]],
        body: r => `<div class="lbl-s mt mb">Composición (BOM)</div>${U.bars(r.ing.map(g => [g[0], g[1], '#14967D', g[1] + ' % · ' + U.money(g[2]) + '/kg']))}`,
        extra: r => [{ icon: 'fa-flask', label: 'Reformular', fn: () => X.reformular(e, r) }, { icon: 'fa-wheat-awn', label: 'Registrar consumo', fn: () => X.consumoForm(e, r.id) }],
        print: r => ({ tipo: 'Fórmula de ración', num: r.id, body: dtbl([['Insumo'], ['% inclusión', 1], ['S/ por kg', 1], ['Aporte S/ kg', 1]], r.ing.map(g => [g[0], g[1].toFixed(1), g[2].toFixed(2), (g[1] / 100 * g[2]).toFixed(3)]).concat([['<b>Total</b>', '100.0', '', `<b>${r.costoKg.toFixed(3)}</b>`]])) }) };
      host.querySelector('#pc-rc').innerHTML = U.grid({ id: 'pc-rc-' + e.key, title: 'raciones', export: 'raciones_' + e.key, rows: e.rac, record: racRec, search: false, pageSize: 8,
        cols: [{ k: 'id', label: 'Código', render: r => `<span class="code">${r.id}</span>` }, { k: 'nombre', label: 'Ración', render: r => `<b>${U.esc(r.nombre)}</b><div class="mini">${U.esc(r.etapa)}</div>` }, { k: 'n', label: 'Insumos', r: true, render: r => r.ing.length }, { k: 'pb', label: 'PB %', r: true }, { k: 'em', label: 'EM kcal', r: true, render: r => INT(r.em) }, { k: 'costoKg', label: 'S/ por kg', r: true, render: r => `<b>${r.costoKg.toFixed(3)}</b>` }],
        actions: [{ icon: 'fa-flask', title: 'Reformular', fn: r => X.reformular(e, r) }, { icon: 'fa-wheat-awn', title: 'Registrar consumo', fn: r => X.consumoForm(e, r.id) }] });
      host.querySelector('#pc-cb').innerHTML = U.grid({ id: 'pc-cb-' + e.key, title: 'cobertura', export: 'cobertura_alimento_' + e.key, rows: cob, search: false,
        cols: [{ k: 'cod', label: 'Bien', render: c => `<span class="code">${c.cod}</span> ${U.esc(c.it.desc)}` }, { k: 'rac', label: 'Raciones', cls: 'mini' }, { k: 'st', label: 'Stock', r: true, sv: c => c.it.stock, render: c => INT(c.it.stock) + ' ' + c.it.um.toLowerCase() }, { k: 'kgStock', label: 'Kg disponibles', r: true, render: c => INT(c.kgStock) }, { k: 'kgDia', label: 'Requerimiento kg/día', r: true, render: c => INT(c.kgDia) },
          { k: 'dias', label: 'Cobertura', r: true, render: c => U.tag(c.dias > 900 ? 'sin consumo' : c.dias.toFixed(1) + ' días', c.dias < 7 ? 't-red' : c.dias < 15 ? 't-amber' : 't-green') }, { k: 'p', label: 'Reposición', render: c => c.it.pendiente ? U.tag('Pedido ' + c.it.pendiente, 't-blue') : c.it.stock < c.it.min ? U.tag('Bajo mínimo', 't-red') : '<span class="mini">—</span>' }],
        actions: [{ icon: 'fa-book', title: 'Ver kárdex', fn: c => { SIGA.modules.almacen.sel = c.cod; SIGA.go('almacen', { l: 'kar' }); } }],
        tools: [{ icon: 'fa-cart-plus', label: 'Solicitar reposición', primary: true, fn: () => SIGA.modules.almacen.reponerTodo(cob.map(c => c.it)) }] });
      host.querySelector('#pc-cs').innerHTML = U.grid({ id: 'pc-cs-' + e.key, title: 'consumos', export: 'consumo_alimento_' + e.key, rows: e.cons, pageSize: 8,
        cols: [{ k: 'f', label: 'Fecha', sv: c => X.sv(c.f) }, { k: 'lote', label: 'Lote / grupo', render: c => `<span class="code">${U.esc(c.lote)}</span>` }, { k: 'rac', label: 'Ración', render: c => { const r = e.rac.find(x => x.id === c.rac); return `<span class="code">${c.rac}</span> <span class="mini">${r ? U.esc(r.nombre) : ''}</span>`; } }, { k: 'kg', label: 'Kg', r: true, render: c => INT(c.kg) },
          { k: 'costo', label: 'Costo', r: true, sv: c => c.costo || c.kg * ((e.rac.find(x => x.id === c.rac) || {}).costoKg || 0), render: c => U.money(c.costo || c.kg * ((e.rac.find(x => x.id === c.rac) || {}).costoKg || 0), '') }, { k: 'doc', label: 'Documento', render: c => `<span class="code">${U.esc(c.doc)}</span>` }],
        rowCls: c => c.nuevo ? 'row-new' : '', foot: rs => `<tr><td colspan="3" class="r"><b>Total</b></td><td class="r num"><b>${INT(X.sum(rs, 'kg'))}</b></td><td colspan="2"></td></tr>`,
        tools: [{ icon: 'fa-wheat-awn', label: 'Registrar consumo', primary: true, fn: () => X.consumoForm(e) }] });
    },

    /* ---------- Pestaña: movilización y SENASA ---------- */
    movRec(e) {
      const U = SIGA.ui, P = D().predio;
      return { mod: 'Control pecuario', tipo: 'Guía de movilización pecuaria', office: 'Centro de Producción · ' + e.unidad, key: m => m.id, title: m => m.id + ' · ' + m.tipo + ' · ' + m.ref, estado: 'estado', cls: false,
        fields: m => [['N.º', m.id], ['Fecha', m.f], ['Tipo', m.tipo], ['Animales / lote', `<span class="code">${U.esc(m.ref)}</span>`], ['Cantidad', m.cant + ' cab.'], ['Peso vivo', INT(m.kg) + ' kg · ' + (m.kg / Math.max(1, m.cant)).toFixed(1) + ' kg prom.'], ['Origen', U.esc(m.origen)], ['Destino', U.esc(m.destino)], ['Documento', U.esc(m.doc)], ['CSTI (SENASA)', m.csti || 'No requiere (movimiento interno)'], ['Transporte', m.transp || '—'], ['Estado', m.estado]],
        print: m => ({ tipo: 'Guía de movilización y datos del CSTI', num: m.id, pairs: [['Fecha de salida', m.f], ['Tipo de movimiento', m.tipo], ['Especie', e.nombre], ['Animales / lote', m.ref], ['Cantidad', m.cant + ' cabezas'], ['Peso vivo total', INT(m.kg) + ' kg'], ['Predio de origen', P.codigo + ' · ' + P.nombre], ['Ubigeo de origen', P.ubigeo], ['Destino', m.destino], ['CSTI', m.csti || 'No requiere'], ['Documento', m.doc], ['Transporte', m.transp || '—']],
          body: `<p class="mini">Declaración sanitaria del predio: los animales movilizados no se encuentran en período de retiro de medicamentos, cuentan con las vacunaciones del calendario oficial y proceden de un predio registrado. El número de CSTI se tramita ante SENASA; este documento consolida los datos para la movilización y la trazabilidad interna.</p>`,
          firmas: [['Responsable del predio', 'P. Huamán'], ['Médico veterinario', D().veterinarios[e.key === 'vacuno' ? 1 : 0].split(' (')[0]], ['Transportista', m.transp ? m.transp.split(' · ')[1] || '—' : '—']] }) };
    },
    p_mov(host, e) {
      const U = SIGA.ui, ag = e.mov.filter(m => mes(m.f)), sal = ag.filter(m => m.csti && m.tipo !== 'Compra');
      host.innerHTML = `<div class="grid cols-4 mb">${[['Movimientos · agosto', ag.length, 'fa-right-left'], ['CSTI tramitados', ag.filter(m => m.csti).length, 'fa-file-shield'], ['Cabezas que salieron', X.sum(sal, 'cant'), 'fa-truck'], ['Kg vivos despachados', INT(X.sum(sal, 'kg')), 'fa-weight-scale']].map(x => `<div class="mini-card"><div class="lab"><i class="fa-solid ${x[2]}"></i> ${x[0]}</div><div class="v">${x[1]}</div></div>`).join('')}</div>
        ${nota('info', 'fa-shield-halved', `<b>${D().predio.codigo}</b> · ${D().predio.nombre} · ${D().predio.ubigeo}. Toda salida del predio (beneficio, venta, descarte) genera guía y número de CSTI; el sistema la bloquea si el animal o lote tiene período de retiro vigente. Los ingresos registran el CSTI de procedencia.`)}
        <div class="card"><h3><span class="dot"></span>Movimientos de animales <span class="grow">sacas, ventas, compras, descartes y traslados internos</span></h3><div id="pc-mv"></div></div>`;
      host.querySelector('#pc-mv').innerHTML = U.grid({ id: 'pc-mv-' + e.key, title: 'movimientos', export: 'movimientos_' + e.key, rows: e.mov, record: this.movRec(e), pageSize: 10, filter: { label: 'Tipo', get: m => m.tipo },
        cols: [{ k: 'id', label: 'N.º', render: m => `<span class="code">${m.id}</span>` }, { k: 'f', label: 'Fecha', sv: m => X.sv(m.f) }, { k: 'tipo', label: 'Tipo', render: m => U.tag(m.tipo, /Compra/.test(m.tipo) ? 't-green' : /Traslado/.test(m.tipo) ? 't-blue' : 't-amber') }, { k: 'ref', label: 'Animales', render: m => `<span class="code">${U.esc(m.ref)}</span>` },
          { k: 'cant', label: 'Cab.', r: true }, { k: 'kg', label: 'Kg', r: true, render: m => INT(m.kg) }, { k: 'destino', label: 'Origen → destino', cls: 'mini', render: m => U.esc(m.origen) + ' → ' + U.esc(m.destino) }, { k: 'doc', label: 'Documento', cls: 'mini' }, { k: 'csti', label: 'CSTI', render: m => m.csti ? `<span class="code">${m.csti.replace('CSTI ', '')}</span>` : '<span class="mini">interno</span>' }],
        rowCls: m => m.nuevo ? 'row-new' : '',
        actions: [{ icon: 'fa-print', title: 'Imprimir guía y CSTI', fn: m => U.rec(this.movRec(e)).imprimir(m) }],
        tools: [{ icon: 'fa-truck', label: 'Saca / venta / traslado', primary: true, fn: () => X.movForm(e) }] });
    },

    /* ---------- Pestaña: costos e indicadores ---------- */
    p_cos(host, e, k) {
      const U = SIGA.ui, M = e.mensual, lts = e.lotes.filter(l => l.costo), R = this.lotRec(e);
      let costoDia = '';
      if (e.key === 'vacuno') {
        const req = X.requerimiento(e), ali = req.reduce((s, q) => s + q.kg * ((e.rac.find(r => r.id === q.rac) || {}).costoKg || 0), 0), mo = 486, san = 64, otros = 118, tot = ali + mo + san + otros;
        costoDia = `<div class="card mb"><h3><span class="dot"></span>Costo del litro de leche · hoy <span class="grow">${INT(k.litros)} L producidos · ${INT(k.litros - k.desc)} L aptos</span></h3>${U.bars([['Alimentación (raciones)', ali / tot * 100, '#14967D', U.money(ali)], ['Mano de obra', mo / tot * 100, '#D97706', U.money(mo)], ['Sanidad y reproducción', san / tot * 100, '#DC2626', U.money(san)], ['Energía, agua y otros', otros / tot * 100, '#64748B', U.money(otros)]])}<p class="mt"><b>Costo por litro apto: ${U.money(tot / Math.max(1, k.litros - k.desc))}</b> <span class="mini">· precio de venta ${U.money(SIGA.data.ventas.productos.find(p => p.cod === 'LEC-FRE').pu)} · margen ${((1 - tot / Math.max(1, k.litros - k.desc) / SIGA.data.ventas.productos.find(p => p.cod === 'LEC-FRE').pu) * 100).toFixed(1)} %</span></p></div>`;
      }
      host.innerHTML = `<div class="card mb"><h3><span class="dot"></span>Indicadores de desempeño vs metas <span class="grow">benchmark de la unidad · calculado de las fichas y lotes</span></h3>${this.bench(e, k)}</div>
        <div class="split eq mb"><div class="card"><h3><span class="dot"></span>Producción mensual · ${M.unidad}</h3>${U.chart.cols({ labels: M.labels, series: [{ name: M.unidad, data: M.prod }], h: 210 })}</div>
          <div class="card"><h3><span class="dot"></span>Costo unitario · S/ por ${e.key === 'vacuno' ? 'litro' : 'kg'}</h3>${U.chart.line({ labels: M.labels, series: [{ name: 'Costo unitario', data: M.costoKg, color: '#D97706' }], fmt: v => 'S/ ' + v.toFixed(2), area: true, h: 210 })}</div></div>
        ${costoDia}
        ${lts.length ? `<div class="card"><h3><span class="dot"></span>Costo por lote y liquidación <span class="grow">alimento, sanidad, mano de obra, otros y pie de cría</span></h3><div id="pc-cl2"></div></div>` : `<div class="card"><h3><span class="dot"></span>Costo acumulado por categoría</h3>${dtbl([['Categoría'], ['Animales', 1], ['Costo acumulado', 1], ['Promedio por animal', 1]], [...new Set(e.anim.map(a => a.cat))].map(c => { const g = e.anim.filter(a => a.cat === c && /Activ/.test(a.estado)); return [c, g.length, U.money(X.sum(g, 'costoAcum')), U.money(X.avg(g, 'costoAcum'))]; }))}</div>`}`;
      if (!lts.length) return;
      host.querySelector('#pc-cl2').innerHTML = U.grid({ id: 'pc-cl2-' + e.key, title: 'costo por lote', export: 'costo_lotes_' + e.key, rows: lts, record: R, pageSize: 10, filter: { label: 'Estado', get: l => l.estado },
        cols: [{ k: 'id', label: 'Lote', render: l => `<span class="code">${l.id}</span>` }, { k: 'etapa', label: 'Etapa' }, { k: 'a', label: 'Alimento', r: true, sv: l => l.costo.alim, render: l => U.money(l.costo.alim, '') }, { k: 's', label: 'Sanidad', r: true, sv: l => l.costo.san, render: l => U.money(l.costo.san, '') }, { k: 'm', label: 'M. obra', r: true, sv: l => l.costo.mo, render: l => U.money(l.costo.mo, '') }, { k: 'o', label: 'Otros', r: true, sv: l => l.costo.otros, render: l => U.money(l.costo.otros, '') }, { k: 'an', label: 'Pie de cría', r: true, sv: l => l.costo.animales, render: l => U.money(l.costo.animales, '') },
          { k: 't', label: 'Total', r: true, sv: l => X.lm(e, l).costo, render: l => `<b>${U.money(X.lm(e, l).costo, '')}</b>` }, { k: 'ck', label: 'S/ por kg', r: true, sv: l => X.lm(e, l).cKg, render: l => { const c = X.lm(e, l).cKg; return c ? c.toFixed(2) : '—'; } }, { k: 'st', label: 'Estado', render: l => U.tag(l.estado, l.estado === 'Activo' ? 't-teal' : 't-gray') }],
        actions: [{ icon: 'fa-file-invoice-dollar', title: 'Liquidación', fn: l => this.liquidar(e, l) }],
        foot: rs => `<tr><td colspan="7" class="r"><b>Total</b></td><td class="r num"><b>${U.money(X.sum(rs, l => X.lm(e, l).costo), '')}</b></td><td colspan="2"></td></tr>` });
    }
  });
})();
