/* ============================================================
   Control pecuario · eventos zootécnicos y formularios operativos
   Cada evento valida el estado del animal o lote, actualiza la ficha,
   recalcula los índices y, cuando corresponde, descuenta insumos del
   almacén (PECOSA + asiento), emite comprobante o genera el CSTI.
   ============================================================ */
(function () {
  const X = SIGA.pec, { P2, addD, dd, num, int, r1, r2, seq, err, item, esLote, findRef, refTxt, lm, evento, pecosa, imputar, syncTanque, retiroDe } = X;
  const U = () => SIGA.ui, INT = v => SIGA.ui.int(Math.round(+v || 0));
  const ESP = () => SIGA.data.pecuario.especies;
  const cur = () => ESP()[SIGA.modules.pecuario.esp];
  const nota = (cls, ic, html) => `<div class="note ${cls}"><i class="fa-solid ${ic}"></i><div>${html}</div></div>`;
  const stockTx = cod => { const it = item(cod); return it ? `${INT(it.stock)} ${it.um.toLowerCase()} en almacén` : 'sin stock en almacén'; };
  const run = fn => { try { return fn(); } catch (e) { SIGA.ui.toast(e.message, 'err'); return null; } };
  const vivos = e => e.lotes.filter(l => l.estado === 'Activo' && l.cab > 0);
  const act = e => e.anim.filter(a => /Activ/.test(a.estado));

  /* =================== Definición de eventos por especie =================== */
  const EV = {
    servicio: {
      lbl: 'Servicio / inseminación', icon: 'fa-venus-mars', esp: ['porcino', 'vacuno'],
      refs: e => e.key === 'porcino' ? e.anim.filter(a => a.estado === 'Activa' && /Destetada|Repetición|Nulípara/.test(a.rep)).sort((a, b) => b.dEst - a.dEst) : e.anim.filter(a => a.estado === 'Activa' && /Vaca en|Vaquillona/.test(a.cat) && /Vacía|Servida/.test(a.rep) && a.rep !== 'Vacía · en desarrollo').sort((a, b) => (b.rep === 'Vacía · en observación de celo') - (a.rep === 'Vacía · en observación de celo') || b.del - a.del),
      fields: e => e.key === 'porcino' ? [
        { k: 'macho', label: 'Verraco o dosis seminal', type: 'select', options: ['IA · Duroc (dosis 80 ml)', ...e.anim.filter(v => v.cat === 'Verraco' && v.estado === 'Activo').map(v => v.id + ' · ' + v.raza)], span: 2 },
        { k: 'dosis', label: 'Dosis aplicadas (IA)', type: 'number', value: 2, span: 1, hint: 'se descuentan del almacén' },
        { k: 'celo', label: 'Intensidad del celo', type: 'select', options: ['Fuerte (reflejo de inmovilidad)', 'Medio', 'Débil'], span: 1 },
        { k: 'tec', label: 'Técnico', value: 'P. Huamán', span: 1 }]
        : [{ k: 'macho', label: 'Toro o pajilla', type: 'select', options: ['IA · Brown Swiss "Jongleur" (pajilla)', 'TO-01 · Brown Swiss "Inca" (monta natural)'], span: 2 },
          { k: 'celo', label: 'Detección de celo', type: 'select', options: ['Observación visual (monta)', 'Parches detectores', 'Podómetro / actividad'], span: 1 },
          { k: 'tec', label: 'Inseminador', value: 'N. Flores', span: 1 }],
      status: (e, a, v) => e.key === 'porcino'
        ? nota('info', 'fa-calendar-check', `Parto probable <b>${addD(X.inDate(v.fecha), 114)}</b> (114 días) · diagnóstico por ecografía el ${addD(X.inDate(v.fecha), 28)}` + (/^IA/.test(v.macho || '') ? ` · dosis seminal Duroc: ${stockTx('231100090163')}` : ''))
        : (a.cat === 'Vaca en producción' && a.del < 50 ? nota('amber', 'fa-triangle-exclamation', `<b>${a.id}</b> tiene ${a.del} días en leche: aún está en el período de espera voluntaria (50 d).`) : '') + nota('info', 'fa-calendar-check', `Parto esperado <b>${addD(X.inDate(v.fecha), 283)}</b> (283 días) · palpación a los 40 días` + (/pajilla/.test(v.macho || '') ? ` · pajillas: ${stockTx('231100090151')}` : '')),
      apply(e, a, v, f) {
        if (e.key === 'porcino') {
          const ia = /^IA/.test(v.macho), n = Math.max(1, int(v.dosis)), p = ia ? pecosa([{ cod: '231100090163', cant: n }], e.unidad, 'Dosis seminales · servicio ' + a.id) : { doc: '' };
          const up = a.partos[a.partos.length - 1]; if (up && up.fDest && up.ids == null) up.ids = dd(up.fDest, f);
          Object.assign(a, { rep: 'Servida', dEst: dd(f), fServ: f, macho: v.macho, diag: 'Pendiente', fParto: addD(f, 114) });
          a.serv.push({ f, macho: v.macho, res: 'En curso' });
          const ver = e.anim.find(x => x.id === v.macho.split(' · ')[0]); if (ver) { ver.servicios++; ver.ultServ = f; }
          if (p.costo) imputar(e, a.id, 'san', p.costo);
          evento(e, 'Servicio', a.id, 1, (ia ? 'Inseminación · ' + n + ' dosis' : 'Monta natural') + ' · ' + v.macho + (p.doc ? ' · ' + p.doc : ''), f);
          return `Servicio de ${a.id} registrado · parto probable ${a.fParto}` + (p.doc ? ` · ${p.doc} emitida` : '');
        }
        const ia = /pajilla/.test(v.macho), p = ia ? pecosa([{ cod: '231100090151', cant: 1 }], e.unidad, 'Pajilla de semen · IA ' + a.id) : { doc: '' };
        Object.assign(a, { rep: 'Servida', fServ: f, nServ: (a.nServ || 0) + 1, diag: 'Pendiente', fParto: addD(f, 283), toroServ: v.macho });
        if (p.costo) imputar(e, a.id, 'san', p.costo);
        evento(e, ia ? 'Inseminación' : 'Monta natural', a.id, 1, v.macho + ' · servicio N.º ' + a.nServ + (p.doc ? ' · ' + p.doc : ''), f);
        return `Servicio N.º ${a.nServ} de ${a.id} registrado · parto esperado ${a.fParto}`;
      }
    },
    diag: {
      lbl: 'Diagnóstico de gestación', icon: 'fa-stethoscope', esp: ['porcino', 'vacuno'],
      refs: e => e.anim.filter(a => /Activ/.test(a.estado) && a.rep === 'Servida' && a.fServ && dd(a.fServ) >= (e.key === 'porcino' ? 18 : 30)).sort((a, b) => X.sv(a.fServ) - X.sv(b.fServ)),
      fields: (e, a) => e.key === 'porcino' ? [
        { k: 'met', label: 'Método', type: 'select', options: ['Ecografía', 'Detección de celo con verraco (retorno)'], span: 1 },
        { k: 'res', label: 'Resultado', type: 'select', options: ['Positivo · gestante', 'Negativo · repetición'], span: 1 }]
        : [{ k: 'met', label: 'Método', type: 'select', options: ['Palpación rectal', 'Ecografía'], span: 1 },
          { k: 'res', label: 'Resultado', type: 'select', options: ['Preñada', 'Vacía'], span: 1 },
          { k: 'dg', label: 'Días de gestación estimados', type: 'number', value: a && a.fServ ? dd(a.fServ) : 40, span: 1 }],
      status: (e, a) => nota('info', 'fa-circle-info', `Servida el <b>${a.fServ}</b> (${dd(a.fServ)} días) con ${U().esc(a.macho || a.toroServ || 'IA')}.`),
      apply(e, a, v, f) {
        const pos = /Positivo|Preñada/.test(v.res), d = dd(a.fServ, f);
        if (e.key === 'porcino') {
          if (pos) Object.assign(a, { rep: 'Gestante', dEst: dd(a.fServ), diag: 'Positivo · ' + v.met.toLowerCase() + ' día ' + d, ubic: /Servicio/.test(a.ubic) ? 'Gestación · G-' + P2(int(a.id.slice(-2))) : a.ubic });
          else { const s = a.serv[a.serv.length - 1]; if (s) s.res = 'Repetición'; Object.assign(a, { rep: 'Repetición', dEst: dd(f), fParto: '', diag: 'Negativo · ' + v.met.toLowerCase() }); }
        } else if (pos) Object.assign(a, { rep: 'Preñada', diag: 'Positivo · ' + v.met.toLowerCase() + ' día ' + int(v.dg), diasAbiertos: a.cat === 'Vaca en producción' ? Math.max(0, a.del - dd(a.fServ)) : a.diasAbiertos });
        else Object.assign(a, { rep: a.cat === 'Vaquillona' ? 'Vacía · en desarrollo' : 'Vacía · en observación de celo', fParto: '', diag: 'Negativo · ' + v.met.toLowerCase() });
        evento(e, 'Diagnóstico de gestación', a.id, 1, v.met + ' · ' + v.res, f);
        return `${a.id}: ${pos ? 'gestación confirmada · parto ' + a.fParto : 'vacía · vuelve a la lista de servicio'}`;
      }
    },
    parto: {
      lbl: 'Parto', icon: 'fa-baby', esp: ['porcino', 'vacuno', 'cuy'],
      refs: e => e.key === 'cuy' ? vivos(e).filter(l => l.tipo === 'Poza de empadre' && l.partos < l.hembras).sort((a, b) => b.edad - a.edad) : e.anim.filter(a => /Activ/.test(a.estado) && (e.key === 'porcino' ? a.rep === 'Gestante' : a.rep === 'Preñada' || a.rep === 'Seca')).sort((a, b) => X.sv(a.fParto) - X.sv(b.fParto)),
      fields: (e, a) => e.key === 'porcino' ? [
        { k: 'nt', label: 'Nacidos totales (NT)', type: 'number', value: 12, span: 1 }, { k: 'nv', label: 'Nacidos vivos (NV)', type: 'number', value: 11, span: 1 },
        { k: 'nm', label: 'Nacidos muertos', type: 'number', value: 1, span: 1 }, { k: 'mom', label: 'Momias', type: 'number', value: 0, span: 1 },
        { k: 'pc', label: 'Peso de la camada (kg)', type: 'number', value: 15.8, span: 1 }, { k: 'asist', label: 'Asistencia', type: 'select', options: ['No', 'Manual', 'Oxitocina'], span: 1 }]
        : e.key === 'vacuno' ? [
          { k: 'sexo', label: 'Sexo de la cría', type: 'select', options: ['Hembra', 'Macho'], span: 1 }, { k: 'peso', label: 'Peso al nacer (kg)', type: 'number', value: 36, span: 1 },
          { k: 'fac', label: 'Facilidad de parto', type: 'select', options: ['Normal', 'Asistido', 'Distocia (veterinario)'], span: 1 }, { k: 'est', label: 'Estado de la cría', type: 'select', options: ['Viva', 'Muerta'], span: 1 },
          { k: 'cal', label: 'Calostro (primeras 6 h)', type: 'select', options: ['Sí · 4 L', 'Sí · menos de 4 L', 'No'], span: 1 }]
        : (q => [{ k: 'partos', label: 'Hembras paridas', type: 'number', value: q, span: 1 }, { k: 'nac', label: 'Crías nacidas', type: 'number', value: q * 3, span: 1 }, { k: 'viv', label: 'Crías vivas', type: 'number', value: q * 3, span: 1 }])(a ? Math.max(1, Math.min(2, a.hembras - a.partos)) : 2),
      status: (e, a, v) => {
        if (e.key === 'cuy') return nota('info', 'fa-circle-info', `Poza <b>${a.id}</b> · ${a.hembras} hembras · ${a.partos} partos registrados en el ciclo · camada del registro: <b>${(int(v.nac) / Math.max(1, int(v.partos))).toFixed(2)}</b> crías.`);
        if (e.key === 'vacuno') return (-dd(a.fParto) > 10 ? nota('amber', 'fa-triangle-exclamation', `Parto adelantado ${-dd(a.fParto)} días respecto de la fecha esperada: evalúe prematuridad o error de servicio.`) : '') + nota('info', 'fa-circle-info', `Parto esperado el <b>${a.fParto}</b> · la cría recibe arete y RFID y la madre inicia la lactancia N.º ${(a.lact || 0) + 1} (espera voluntaria de 50 días).`);
        const g = dd(a.fServ, X.inDate(v.fecha)), ok = int(v.nt) === int(v.nv) + int(v.nm) + int(v.mom);
        return (ok ? '' : nota('warn', 'fa-circle-exclamation', 'NT debe ser igual a vivos + muertos + momias.')) + nota(g < 111 || g > 117 ? 'amber' : 'info', 'fa-calendar', `Duración de la gestación: <b>${g} días</b> (normal 111–117) · se programa hierro dextrano al día 3.`);
      },
      apply(e, a, v, f) {
        if (e.key === 'porcino') {
          const nt = int(v.nt), nv = int(v.nv), nm = int(v.nm), mom = int(v.mom);
          if (nt <= 0 || nt !== nv + nm + mom) err('Nacidos totales (NT) debe ser igual a vivos + muertos + momias');
          const s = a.serv[a.serv.length - 1]; if (s) s.res = 'Parto';
          a.par++; a.cat = 'Reproductora';
          a.partos.push({ n: a.par, f, nt, nv, nm, mom, dest: null, fDest: '', lact: null, pesoDest: null, ids: null, pesoCamada: num(v.pc), asist: v.asist });
          Object.assign(a, { rep: 'Lactando', dEst: dd(f), lechones: nv, fUltParto: f, fParto: '', diag: '', ubic: /Maternidad/.test(a.ubic) ? a.ubic : 'Maternidad · jaula MT-' + P2(int(a.id.slice(-2))) });
          if (nm) e.mort.unshift({ f, ref: 'Lechones de ' + a.id, cant: nm, causa: 'Nacido muerto', edad: '0 d', nec: 'No' });
          e.plan.unshift({ id: 'PS-' + U().pad(seq(e.plan.map(p => p.id), /(\d+)$/) + 1, 3), f: addD(f, 3), act: 'Hierro dextrano · día 3', prod: 'Hierro dextrano 200 mg', cod: '231100090131', dosis: '1 ml', via: 'IM', obj: 'Lechones de ' + a.id, cab: nv, estado: 'Programada', ret: 0, nuevo: true });
          evento(e, 'Parto', a.id, nt, `${nv} vivos · ${nm} nacidos muertos · ${mom} momias · camada ${num(v.pc)} kg`, f);
          return `Parto de ${a.id} (${a.par}.º) · ${nv} nacidos vivos · hierro programado para el ${addD(f, 3)}`;
        }
        if (e.key === 'vacuno') {
          const viva = v.est === 'Viva', idc = 'T-' + (seq(e.anim.map(x => x.id), /^T-(\d+)$/) + 1);
          if (a.fUltParto) a.iep = dd(a.fUltParto, f);
          a.lact = (a.lact || 0) + 1;
          a.partos.push({ n: a.lact, f, cria: viva ? idc : '— (nació muerta)', sexo: v.sexo, peso: num(v.peso), facilidad: v.fac, leche305: null });
          const leche = r1(e.wood(Math.max(1, dd(f)), 1));
          Object.assign(a, { cat: 'Vaca en producción', rep: 'Vacía · espera voluntaria', del: dd(f), dpp: dd(f), fUltParto: f, fServ: '', diag: '', nServ: 0, fParto: '', diasAbiertos: null, leche, am: r1(leche * 0.56), pm: r1(leche * 0.44), ccs: 180, ubic: 'Corral alta producción · CA', nombre: (a.nombre || '').replace(' (vaq.)', '') });
          a.p305 = X.p305(e, a.leche, a.del);
          if (viva) e.anim.push({ id: idc, nombre: '', rfid: '604 000' + (100 + seq(e.anim.map(x => x.id), /(\d+)$/) % 900) + ' ' + U().pad(Date.now() % 1e6, 6), cat: 'Ternero', sexo: v.sexo === 'Macho' ? 'M' : 'H', raza: /Brown Swiss/.test(a.raza) ? 'Brown Swiss' : a.raza + ' × Brown Swiss', nac: f, madre: a.id, padre: (a.toroServ || 'IA · Brown Swiss "Jongleur"').replace(' (pajilla)', '').replace(' (monta natural)', ''), ubic: 'Becerrera · B-01', lact: 0, del: 0, rep: '—', leche: 0, lecheCons: 4, cc: 3, peso: num(v.peso), pesoNac: num(v.peso), partos: [], estado: 'Activo', edadD: dd(f), costoAcum: 0, nuevo: true });
          else e.mort.unshift({ f, ref: 'Cría de ' + a.id, cant: 1, causa: 'Nacido muerto', edad: '0 d', nec: 'No' });
          syncTanque(e);
          evento(e, 'Parto', a.id, 1, (viva ? `${v.sexo === 'Macho' ? 'Ternero macho' : 'Ternera'} ${idc}` : 'Cría muerta') + ` · ${num(v.peso)} kg · parto ${v.fac.toLowerCase()} · calostro ${v.cal.toLowerCase()}`, f);
          return `Parto de ${a.id} registrado` + (viva ? ` · cría ${idc} con ficha y arete` : '') + ` · inicia la lactancia N.º ${a.lact}`;
        }
        const pa = int(v.partos), na = int(v.nac), vi = int(v.viv);
        if (pa <= 0 || na < pa || vi > na) err('Revise los datos: al menos un parto y crías vivas ≤ nacidas');
        if (a.partos + pa > a.hembras) err(`La poza ${a.id} tiene ${a.hembras} hembras y ya registra ${a.partos} partos en el ciclo`);
        a.partos += pa; a.nacidos += na; a.vivos += vi; a.lactantes += vi; a.cab += vi;
        if (na > vi) e.mort.unshift({ f, ref: a.id, cant: na - vi, causa: 'Nacido muerto', edad: '0 d', nec: 'No' });
        evento(e, 'Parto', a.id, na, `${pa} partos · ${na} gazapos (${vi} vivos) · camada ${(na / pa).toFixed(1)}`, f);
        return `Partos registrados en ${a.id} · ${vi} lactantes · destete programado a los 15 días`;
      }
    },
    destete: {
      lbl: 'Destete', icon: 'fa-people-arrows', esp: ['porcino', 'vacuno', 'cuy'],
      refs: e => e.key === 'porcino' ? e.anim.filter(a => a.estado === 'Activa' && a.rep === 'Lactando') : e.key === 'vacuno' ? e.anim.filter(a => a.cat === 'Ternero' && a.estado === 'Activo' && a.lecheCons > 0 && a.edadD >= 60) : vivos(e).filter(l => l.tipo === 'Poza de empadre' && l.lactantes > 0),
      fields: (e, a) => e.key === 'vacuno' ? [{ k: 'peso', label: 'Peso al destete (kg)', type: 'number', value: a ? Math.round(a.pesoNac + a.edadD * 0.62) : 90, span: 1 }, { k: 'ubic', label: 'Destino', type: 'select', options: ['Potrero de recría · P-03', 'Potrero de recría · P-04'], span: 1 }]
        : [{ k: 'dest', label: e.key === 'porcino' ? 'Lechones destetados' : 'Gazapos destetados', type: 'number', value: a ? (e.key === 'porcino' ? a.lechones : a.lactantes) : 0, span: 1 },
          { k: 'peso', label: 'Peso promedio (kg)', type: 'number', value: e.key === 'porcino' ? 6.8 : 0.32, span: 1 },
          { k: 'lote', label: 'Lote de recría de destino', type: 'select', options: [...vivos(e).filter(l => l.etapa === 'Recría' && l.edad <= (e.key === 'porcino' ? 35 : 30)).map(l => l.id + ' · ' + l.ubic), 'Nuevo lote de recría'], span: 2 }],
      status: (e, a, v) => e.key === 'vacuno' ? nota('info', 'fa-circle-info', `${a.id} · ${a.edadD} días · nacido con ${a.pesoNac} kg · GDP ${INT((num(v.peso) - a.pesoNac) / Math.max(1, a.edadD) * 1000)} g/día.`)
        : (e.key === 'porcino' ? int(v.dest) < a.lechones : int(v.dest) < a.lactantes) ? nota('amber', 'fa-triangle-exclamation', `La diferencia con los ${e.key === 'porcino' ? a.lechones + ' lechones al pie' : a.lactantes + ' lactantes'} se registra como mortalidad en lactancia.`)
          : nota('info', 'fa-circle-info', 'Los animales destetados forman o se suman a un lote de recría con costo y curva de crecimiento propios.'),
      apply(e, a, v, f) {
        if (e.key === 'vacuno') { a.lecheCons = 0; a.peso = num(v.peso); a.ubic = v.ubic; evento(e, 'Destete', a.id, 1, `${a.peso} kg · ${a.edadD} días · pasa a ${v.ubic}`, f); return `Ternero ${a.id} destetado`; }
        const n = int(v.dest), tiene = e.key === 'porcino' ? a.lechones : a.lactantes;
        if (n <= 0 || n > tiene) err(`Los destetados deben estar entre 1 y ${tiene}`);
        let edadDest = 15;
        if (e.key === 'porcino') {
          const p = a.partos[a.partos.length - 1]; edadDest = dd(p.f, f);
          Object.assign(p, { dest: n, fDest: f, lact: edadDest, pesoDest: num(v.peso) });
          if (tiene > n) e.mort.unshift({ f, ref: 'Lechones de ' + a.id, cant: tiene - n, causa: 'Mortalidad en lactancia (ajuste al destete)', edad: edadDest + ' d', nec: 'No' });
          Object.assign(a, { rep: 'Destetada', dEst: dd(f), lechones: 0, ubic: 'Servicio · S-0' + (int(a.id.slice(-1)) % 8 + 1) });
        } else {
          a.destetados += n; a.muertes += tiene - n; a.cab -= tiene; a.lactantes = 0;
          if (tiene > n) e.mort.unshift({ f, ref: a.id, cant: tiene - n, causa: 'Mortalidad en lactancia (ajuste al destete)', edad: '15 d', nec: 'No' });
        }
        let l = e.lotes.find(x => x.id === v.lote.split(' · ')[0]);
        if (!l) {
          const id = e.key === 'porcino' ? 'L-' + (seq(e.lotes.map(x => x.id), /^L-(\d+)$/) + 1) : 'R-' + P2(seq(e.lotes.map(x => x.id), /^R-(\d+)$/) + 1);
          l = { id, tipo: e.key === 'porcino' ? 'Recría' : 'Poza de recría', etapa: 'Recría', ubic: e.key === 'porcino' ? 'Recría · R-04' : 'Galpón de cuyes · nave C', linea: e.key === 'porcino' ? 'Híbrido comercial (Camborough × Duroc)' : a.linea, fIng: f, eIng: edadDest, edad: edadDest + dd(f), cabIni: 0, cab: 0, muertes: 0, vendidos: 0, pesos: [[f, edadDest, num(v.peso)]], alim: 0, origen: '', costo: { alim: 0, san: 0, mo: 0, otros: 0, animales: 0 }, estado: 'Activo', pesoObj: e.key === 'porcino' ? 100 : 0.9, std: e.key, nuevo: true };
          e.lotes.unshift(l);
        }
        l.cabIni += n; l.cab += n; l.origen = l.origen ? l.origen + ' · ' + a.id : a.id; l.costo.animales += n * (e.key === 'porcino' ? 95 : 6);
        evento(e, 'Destete', a.id, n, `${n} ${e.key === 'porcino' ? 'lechones' : 'gazapos'} · ${num(v.peso)} kg prom. · pasan al lote ${l.id}`, f);
        return `Destete de ${a.id} registrado · ${n} animales al lote ${l.id}` + (e.key === 'porcino' ? ' · la cerda pasa a la lista de servicio' : '');
      }
    },
    pesaje: {
      lbl: 'Pesaje', icon: 'fa-weight-scale', esp: ['porcino', 'vacuno', 'ave', 'cuy'],
      refs: e => e.key === 'vacuno' ? e.anim.filter(a => /Ternero|Vaquillona/.test(a.cat) && /Activ/.test(a.estado)) : vivos(e).filter(l => l.tipo !== 'Poza de empadre' && l.std !== 'ponedora' && l.edad >= 7),
      fields: (e, x) => esLote(x) ? [{ k: 'peso', label: 'Peso promedio (kg)', type: 'number', value: x ? (e.key === 'porcino' ? r1(X.pesoLote(e, x)) : X.pesoLote(e, x).toFixed(3)) : 0, span: 1 }, { k: 'cab', label: 'Animales pesados (muestra)', type: 'number', value: x ? (e.key === 'ave' ? Math.ceil(x.cab * 0.05) : x.cab) : 0, span: 1 }, { k: 'unif', label: 'Uniformidad (%)', type: 'number', value: x && x.uniformidad || 85, span: 1 }]
        : [{ k: 'peso', label: 'Peso (kg)', type: 'number', value: x ? x.peso : 0, span: 1 }, { k: 'cc', label: 'Condición corporal (1–5)', type: 'number', value: x ? x.cc : 3, span: 1 }],
      status: (e, x, v) => {
        if (!esLote(x)) return nota('info', 'fa-circle-info', `${x.id} · último peso ${x.peso} kg` + (x.pesoNac ? ` · nacimiento ${x.pesoNac} kg · GDP ${INT((num(v.peso) - x.pesoNac) / Math.max(1, x.edadD) * 1000)} g/día` : ''));
        const st = e.stdPeso ? e.stdPeso(x.edad) : null, p = num(v.peso), dev = st ? (p / st - 1) * 100 : 0;
        return nota(st && dev < -8 ? 'amber' : 'info', 'fa-chart-line', `Edad ${x.edad} días · estándar de la línea <b>${st ? st.toFixed(e.key === 'porcino' ? 1 : 3) : '—'} kg</b> · desviación <b>${dev >= 0 ? '+' : ''}${dev.toFixed(1)} %</b>` + (st && dev < -8 ? ' · revisar consumo, sanidad y densidad' : ''));
      },
      apply(e, x, v, f) {
        const p = num(v.peso); if (p <= 0) err('Ingrese el peso');
        if (!esLote(x)) { const ant = x.peso; x.peso = p; x.cc = num(v.cc) || x.cc; evento(e, 'Pesaje', x.id, 1, `${p} kg (antes ${ant} kg) · CC ${x.cc}`, f); return `Pesaje de ${x.id} registrado`; }
        const ed = x.edad - dd(f), i = x.pesos.findIndex(q => q[0] === f); if (i > -1) x.pesos.splice(i, 1);
        x.pesos.push([f, ed, p]); x.pesos.sort((a, b) => a[1] - b[1]);
        if (num(v.unif)) x.uniformidad = num(v.unif);
        const m = lm(e, x);
        evento(e, 'Pesaje', x.id, int(v.cab) || x.cab, `${p} kg prom. · GDP ${INT(m.gdp * 1000)} g/día` + (m.std ? ` · ${m.dev >= 0 ? '+' : ''}${r1(m.dev)} % vs estándar` : ''), f);
        return `Pesaje del lote ${x.id} registrado · GDP ${INT(m.gdp * 1000)} g/día`;
      }
    },
    mortalidad: {
      lbl: 'Mortalidad', icon: 'fa-skull-crossbones', esp: ['porcino', 'ave', 'cuy'],
      refs: e => [...vivos(e), ...(e.key === 'porcino' ? e.anim.filter(a => a.estado === 'Activa' && a.rep === 'Lactando' && a.lechones > 0) : [])],
      refLbl: 'Lote, poza o camada',
      fields: (e, x) => [{ k: 'cant', label: 'Animales muertos', type: 'number', value: 1, span: 1 }, { k: 'causa', label: 'Causa', type: 'select', options: X.CAUSAS[e.key], span: 1 },
        ...(e.key === 'cuy' && x && x.tipo === 'Poza de empadre' ? [{ k: 'cat', label: 'Categoría', type: 'select', options: x.lactantes ? ['Lactantes', 'Reproductoras'] : ['Reproductoras'], span: 1 }] : []),
        { k: 'nec', label: 'Necropsia', type: 'select', options: ['No', 'Sí'], span: 1 }, { k: 'dx', label: 'Hallazgo de necropsia / observación', value: '', span: 2 }],
      status: (e, x, v) => { if (!esLote(x)) return nota('info', 'fa-circle-info', `Camada de ${x.id} · ${x.lechones} lechones al pie.`); if (x.tipo === 'Poza de empadre') return nota('info', 'fa-circle-info', `Poza ${x.id} · ${x.hembras} reproductoras · ${x.lactantes} lactantes · mortalidad en lactancia del ciclo ${x.vivos ? (x.muertes / x.vivos * 100).toFixed(1) : 0} %`); const m = (x.muertes + int(v.cant)) / Math.max(1, x.cabIni) * 100, lim = e.metas.mortEng || (e.metas.viab ? 100 - e.metas.viab : 5); return nota(m > lim ? 'warn' : 'info', 'fa-chart-simple', `Mortalidad acumulada del lote tras el registro: <b>${m.toFixed(1)} %</b> (umbral ${lim} %)` + (m > lim ? ' · se alertará al médico veterinario' : '')); },
      apply(e, x, v, f) {
        const n = int(v.cant); let ref = x.id, edad = '';
        if (n <= 0) err('Indique la cantidad');
        if (!esLote(x)) { if (n > x.lechones) err(`${x.id} tiene ${x.lechones} lechones al pie`); x.lechones -= n; ref = 'Lechones de ' + x.id; edad = dd(x.fUltParto) + ' d'; }
        else {
          if (n > x.cab) err(`El lote ${x.id} tiene ${x.cab} animales`);
          if (x.tipo === 'Poza de empadre') { if (v.cat === 'Lactantes') { if (n > x.lactantes) err(`La poza tiene ${x.lactantes} lactantes`); x.lactantes -= n; } else x.hembras = Math.max(0, x.hembras - n); }
          x.cab -= n; x.muertes += n; edad = e.key === 'ave' && x.tipo === 'Ponedoras' ? Math.round(x.edad / 7) + ' sem' : x.edad + ' d';
          if (x.cab === 0) { x.estado = 'Cerrado'; x.cierre = f; }
        }
        e.mort.unshift({ f, ref, cant: n, causa: v.causa, edad, nec: v.nec === 'Sí' ? 'Sí' + (v.dx ? ' · ' + v.dx : '') : 'No', nuevo: true });
        evento(e, 'Mortalidad', ref, n, v.causa + (v.dx ? ' · ' + v.dx : ''), f);
        return `Mortalidad registrada en ${ref} · ${n} animal(es) · ${v.causa}`;
      }
    },
    etapa: {
      lbl: 'Cambio de etapa / traslado', icon: 'fa-right-left', esp: ['porcino', 'ave', 'cuy'],
      refs: e => vivos(e).filter(l => e.key === 'porcino' ? l.tipo === 'Recría' : e.key === 'ave' ? l.tipo === 'Ponedoras' && l.etapa === 'Pre-postura' : l.etapa === 'Recría'),
      fields: (e, x) => e.key === 'porcino' ? [{ k: 'ubic', label: 'Corral de engorde', type: 'select', options: ['Engorde · C-06', 'Engorde · C-07', 'Engorde · C-01 (tras vaciado)'], span: 2 }]
        : e.key === 'ave' ? [{ k: 'ubic', label: 'Galpón de postura', type: 'select', options: ['Galpón de postura · jaulas B', 'Galpón de postura · jaulas C'], span: 2 }, { k: 'luz', label: 'Fotoperiodo', type: 'select', options: ['14 h luz (inicio)', '16 h luz (pico)'], span: 1 }]
          : [{ k: 'et', label: 'Destino', type: 'select', options: ['Engorde (toda la poza)', 'Reproducción · selección de hembras para nueva poza de empadre'], span: 2 }, { k: 'cant', label: 'Hembras seleccionadas', type: 'number', value: 10, span: 1 }],
      status: (e, x) => nota('info', 'fa-circle-info', `${x.id} · ${x.cab} animales · ${x.edad} días · ${x.ubic}` + (e.key === 'porcino' ? ' · pasa a la ración de engorde R-PC-03' : e.key === 'ave' ? ' · pasa a alimento de postura R-AV-03' : '')),
      apply(e, x, v, f) {
        const antes = x.etapa + ' · ' + x.ubic;
        if (e.key === 'porcino') Object.assign(x, { tipo: 'Engorde', etapa: 'Engorde', ubic: v.ubic });
        else if (e.key === 'ave') Object.assign(x, { etapa: 'Postura', ubic: v.ubic, postStd: 0.9, luz: v.luz });
        else if (/^Engorde/.test(v.et)) Object.assign(x, { tipo: 'Poza de engorde', etapa: 'Engorde' });
        else {
          const n = int(v.cant); if (n <= 0 || n > x.cab) err('Cantidad inválida');
          const id = 'P-' + P2(seq(e.lotes.map(l => l.id), /^P-(\d+)$/) + 1);
          x.cab -= n; if (x.cab === 0) { x.estado = 'Cerrado'; x.cierre = f; }
          e.lotes.unshift({ id, tipo: 'Poza de empadre', etapa: 'Empadre', ubic: 'Galpón de cuyes · nave B', linea: x.linea, fIng: f, eIng: 90, edad: dd(f), hembras: n, macho: 'CM-' + id.slice(2), cabIni: n + 1, cab: n + 1, muertes: 0, vendidos: 0, partos: 0, nacidos: 0, vivos: 0, destetados: 0, lactantes: 0, pesos: [[f, x.edad, r2(X.pesoLote(e, x))]], alim: 0, estado: 'Activo', std: 'cuy', costo: { alim: 0, san: 0, mo: 0, otros: 0, animales: (n + 1) * 45 }, nuevo: true });
          evento(e, 'Empadre', id, n + 1, `${n} hembras seleccionadas de ${x.id} + macho CM-${id.slice(2)}`, f);
          return `Nueva poza de empadre ${id} con ${n} hembras de ${x.id}`;
        }
        e.mov.unshift({ id: 'MV-' + X.PREF[e.key] + '-' + U().pad(seq(e.mov.map(m => m.id), /-(\d+)$/) + 1, 3), f, tipo: 'Traslado interno', ref: x.id + ' → ' + x.ubic, cant: x.cab, kg: r1(x.cab * X.pesoLote(e, x)), origen: antes.split(' · ').slice(1).join(' · '), destino: x.ubic, doc: 'Papeleta interna', csti: '', estado: 'Concluido', nuevo: true });
        evento(e, 'Cambio de etapa', x.id, x.cab, antes + ' → ' + x.etapa + ' · ' + x.ubic, f);
        return `${x.id} pasa a ${x.etapa.toLowerCase()} · ${x.ubic}`;
      }
    },
    secado: {
      lbl: 'Secado', icon: 'fa-droplet-slash', esp: ['vacuno'],
      refs: e => e.anim.filter(a => a.cat === 'Vaca en producción' && a.estado === 'Activa' && a.rep === 'Preñada').sort((a, b) => X.sv(a.fParto) - X.sv(b.fParto)),
      fields: () => [{ k: 'trat', label: 'Terapia de secado', type: 'select', options: ['Sellador interno sin antibiótico', 'Pomo de secado (antibiótico)'], span: 2 }],
      status: (e, a) => { const f = -dd(a.fParto); return nota(f > 70 || f < 45 ? 'amber' : 'info', 'fa-calendar', `Parto esperado el <b>${a.fParto}</b> (en ${f} días) · se recomienda secar 60 días antes · producción actual ${a.leche} L/día.`); },
      apply(e, a, v, f) {
        Object.assign(a, { cat: 'Vaca seca', rep: 'Seca', leche: 0, am: 0, pm: 0, del: 0, ubic: 'Potrero de secas · P-06', fSecado: f });
        syncTanque(e);
        evento(e, 'Secado', a.id, 1, `${-dd(a.fParto)} días antes del parto · ${v.trat.toLowerCase()}`, f);
        return `${a.id} secada · pasa a la ración de vacas secas`;
      }
    },
    control: {
      lbl: 'Control lechero', icon: 'fa-bottle-droplet', esp: ['vacuno'],
      refs: e => e.anim.filter(a => a.cat === 'Vaca en producción' && a.estado === 'Activa'),
      fields: (e, a) => [{ k: 'am', label: 'Ordeño AM (L)', type: 'number', value: a ? a.am : 0, span: 1 }, { k: 'pm', label: 'Ordeño PM (L)', type: 'number', value: a ? a.pm : 0, span: 1 }, { k: 'ccs', label: 'CCS (miles/ml)', type: 'number', value: a ? a.ccs : 150, span: 1 }, { k: 'grasa', label: 'Grasa (%)', type: 'number', value: 3.8, span: 1 }, { k: 'prot', label: 'Proteína (%)', type: 'number', value: 3.2, span: 1 }],
      status: (e, a, v) => { const t = num(v.am) + num(v.pm), p = X.p305(e, t || 0.1, a.del); return nota(int(v.ccs) > 400 ? 'warn' : 'info', 'fa-chart-line', `Total <b>${r1(t)} L</b> (antes ${a.leche} L) · ${a.del} DEL · proyección 305 d <b>${INT(p)} L</b>` + (int(v.ccs) > 400 ? ' · CCS alta: mastitis subclínica probable' : '')); },
      apply(e, a, v, f) {
        const am = num(v.am), pm = num(v.pm); if (am + pm <= 0) err('Registre la producción del día');
        const ant = a.leche; Object.assign(a, { am, pm, leche: r1(am + pm), ccs: int(v.ccs) || a.ccs, grasa: num(v.grasa), prot: num(v.prot) });
        a.p305 = X.p305(e, a.leche, a.del); syncTanque(e);
        evento(e, 'Control lechero', a.id, a.leche, `AM ${am} · PM ${pm} L (antes ${ant}) · CCS ${a.ccs} mil/ml · grasa ${a.grasa} %`, f);
        return `Control de ${a.id} registrado · proyección 305 d ${INT(a.p305)} L`;
      }
    },
    diario: {
      lbl: 'Registro diario de lote', icon: 'fa-clipboard-list', esp: ['ave'],
      refs: e => vivos(e),
      fields: (e, l) => { const d = l && l.diario[l.diario.length - 1] || {}; return [{ k: 'muertes', label: 'Mortalidad del día', type: 'number', value: 0, span: 1 }, { k: 'causa', label: 'Causa principal', type: 'select', options: X.CAUSAS.ave, span: 1 }, { k: 'alim', label: 'Alimento (kg)', type: 'number', value: d.alim || 0, span: 1 }, { k: 'agua', label: 'Agua (L)', type: 'number', value: d.agua || 0, span: 1 }, { k: 'tmax', label: 'Temperatura máx. (°C)', type: 'number', value: 29, span: 1 },
        ...(l && l.tipo === 'Ponedoras' ? [{ k: 'huevos', label: 'Huevos recolectados', type: 'number', value: d.huevos || 0, span: 1 }, { k: 'rotos', label: 'Rotos / sucios', type: 'number', value: d.rotos || 0, span: 1 }, { k: 'ph', label: 'Peso del huevo (g)', type: 'number', value: d.pesoHuevo || 0, span: 1 }] : [{ k: 'peso', label: 'Peso promedio (kg · 0 si no se pesó)', type: 'number', value: 0, span: 1 }])]; },
      status: (e, l, v) => { const aves = l.cab - int(v.muertes); if (l.tipo === 'Ponedoras') { const p = aves ? int(v.huevos) / aves * 100 : 0; return nota(p < e.metas.postura - 3 ? 'amber' : 'info', 'fa-egg', `Postura del día <b>${p.toFixed(1)} %</b> (estándar ${e.metas.postura} %) · ${Math.round(int(v.huevos) / 30)} bandejas · ${(num(v.alim) / Math.max(1, int(v.huevos) / 12)).toFixed(2)} kg de alimento por docena`); } return nota(int(v.muertes) > l.cab * 0.005 ? 'amber' : 'info', 'fa-dove', `${aves} aves al cierre del día · consumo ${(num(v.alim) / Math.max(1, aves) * 1000).toFixed(0)} g/ave · relación agua/alimento ${(num(v.agua) / Math.max(1, num(v.alim))).toFixed(2)}` + (num(v.tmax) >= 32 ? ' · <b>riesgo de estrés por calor</b>' : '')); },
      apply(e, l, v, f) {
        const m = int(v.muertes); if (m < 0 || m > l.cab) err('Mortalidad inválida');
        l.cab -= m; l.muertes += m; l.alim += num(v.alim);
        const reg = { f, edad: l.edad, aves: l.cab, muertes: m, alim: Math.round(num(v.alim)), agua: Math.round(num(v.agua)), tmax: num(v.tmax), nuevo: true };
        if (l.tipo === 'Ponedoras') Object.assign(reg, { huevos: int(v.huevos), rotos: int(v.rotos), pesoHuevo: num(v.ph), postura: Math.round(int(v.huevos) / Math.max(1, l.cab) * 1000) / 10 });
        else { reg.peso = num(v.peso) || null; if (reg.peso) { const i = l.pesos.findIndex(q => q[0] === f); if (i > -1) l.pesos.splice(i, 1); l.pesos.push([f, l.edad, reg.peso]); } }
        const i = l.diario.findIndex(d => d.f === f); if (i > -1) l.diario.splice(i, 1, reg); else l.diario.push(reg);
        if (m) e.mort.unshift({ f, ref: l.id, cant: m, causa: v.causa, edad: l.tipo === 'Ponedoras' ? Math.round(l.edad / 7) + ' sem' : l.edad + ' d', nec: 'No', nuevo: true });
        evento(e, l.tipo === 'Ponedoras' ? 'Recolección' : 'Registro diario', l.id, l.tipo === 'Ponedoras' ? reg.huevos : l.cab, l.tipo === 'Ponedoras' ? `${reg.huevos} huevos · ${reg.postura} % de postura · ${m} muertes` : `${m} muertes · ${reg.alim} kg de alimento · ${reg.agua} L de agua`, f);
        return `Registro diario del lote ${l.id} guardado`;
      }
    },
    empadre: {
      lbl: 'Empadre', icon: 'fa-venus-mars', esp: ['cuy'],
      refs: e => vivos(e).filter(l => l.tipo === 'Poza de empadre' && l.lactantes === 0),
      fields: e => [{ k: 'poza', label: 'Poza', type: 'select', options: ['Nueva poza de empadre', ...vivos(e).filter(l => l.tipo === 'Poza de empadre' && l.lactantes === 0).map(l => l.id + ' · reempadre')], span: 1 }, { k: 'hem', label: 'Hembras', type: 'number', value: 10, span: 1 }, { k: 'macho', label: 'Macho reproductor', value: 'CM-' + P2(seq(e.lotes.map(l => l.macho || ''), /CM-(\d+)/) + 1), span: 1 }, { k: 'lin', label: 'Línea', type: 'select', options: ['Perú', 'Andina', 'Inti'], span: 1 }],
      noRef: true,
      status: () => nota('info', 'fa-circle-info', 'Empadre continuo · 1 macho por 10 hembras · gestación de ~67 días · se aprovecha el celo posparto.'),
      apply(e, x, v, f) {
        const n = int(v.hem); if (n <= 0 || n > 15) err('Entre 1 y 15 hembras por poza');
        let l = e.lotes.find(p => p.id === v.poza.split(' · ')[0]);
        if (!l) { l = { id: 'P-' + P2(seq(e.lotes.map(p => p.id), /^P-(\d+)$/) + 1), tipo: 'Poza de empadre', etapa: 'Empadre', ubic: 'Galpón de cuyes · nave B', eIng: 90, muertes: 0, vendidos: 0, pesos: [[f, 90, 0.95]], alim: 0, estado: 'Activo', std: 'cuy', costo: { alim: 0, san: 0, mo: 0, otros: 0, animales: (n + 1) * 45 }, nuevo: true }; e.lotes.unshift(l); }
        Object.assign(l, { linea: v.lin, fIng: f, edad: dd(f), hembras: n, macho: v.macho, cabIni: n + 1, cab: n + 1, partos: 0, nacidos: 0, vivos: 0, destetados: 0, lactantes: 0 });
        evento(e, 'Empadre', l.id, n + 1, `${n} hembras + macho ${v.macho} · línea ${v.lin}`, f);
        return `Empadre registrado en la poza ${l.id}`;
      }
    },
    ingreso: {
      lbl: 'Ingreso de lote', icon: 'fa-truck-ramp-box', esp: ['ave'], noRef: true,
      fields: () => [{ k: 'tipo', label: 'Tipo', type: 'select', options: ['Pollos de engorde', 'Ponedoras'], span: 1 }, { k: 'galpon', label: 'Galpón', type: 'select', options: ['Galpón 1', 'Galpón 4', 'Galpón 2 · sección A'], span: 1 }, { k: 'cant', label: 'Aves recibidas', type: 'number', value: 800, span: 1 },
        { k: 'linea', label: 'Línea genética', type: 'select', options: ['Cobb 500', 'Ross 308', 'Hy-Line Brown'], span: 1 }, { k: 'prov', label: 'Proveedor', value: 'Incubadora San Fernando', span: 1 }, { k: 'pu', label: 'Costo por ave (S/)', type: 'number', value: 2.6, span: 1 }, { k: 'csti', label: 'CSTI de procedencia', value: 'CSTI 15-2026-00' + (8813 + Math.floor(Math.random() * 90)), span: 1 }],
      status: (e, x, v) => nota('info', 'fa-shield-virus', `Se genera el plan sanitario del lote (Newcastle día 7, Gumboro día 14) y el costo inicial ${U().money(int(v.cant) * num(v.pu))}.`),
      apply(e, x, v, f) {
        const n = int(v.cant); if (n <= 0) err('Indique las aves recibidas');
        const g = /Galpón (\d)/.exec(v.galpon)[1], id = 'G' + g + '-' + P2(seq(e.lotes.map(l => l.id), new RegExp('^G' + g + '-(\\d+)$')) + 1), pos = v.tipo === 'Ponedoras';
        e.lotes.unshift({ id, tipo: v.tipo, etapa: pos ? 'Pre-postura' : 'Cría', ubic: v.galpon, linea: v.linea, fIng: f, eIng: 1, edad: dd(f), cabIni: n, cab: n, muertes: 0, vendidos: 0, pesos: [[f, 0, 0.042]], alim: 0, diario: [{ f, edad: 0, aves: n, muertes: 0, alim: Math.round(n * 0.012), agua: Math.round(n * 0.025), peso: 0.042 }], estado: 'Activo', pesoObj: pos ? null : 2.5, std: pos ? 'ponedora' : 'ave', uniformidad: 90, costo: { alim: 0, san: 0, mo: 0, otros: 0, animales: r2(n * num(v.pu)) }, nuevo: true });
        [[7, 'Vacuna Newcastle · día 7', 'Vacuna Newcastle + bronquitis', '231100090115', '1 gota', 'Ocular'], [14, 'Vacuna Gumboro · día 14', 'Vacuna Gumboro', '', 'Agua de bebida', 'Oral']].forEach(q => e.plan.unshift({ id: 'PS-' + U().pad(seq(e.plan.map(p => p.id), /(\d+)$/) + 1, 3), f: addD(f, q[0]), act: q[1], prod: q[2], cod: q[3], dosis: q[4], via: q[5], obj: id + ' · ' + (pos ? 'pollitas' : 'pollitos'), cab: n, estado: 'Programada', ret: 0, nuevo: true }));
        e.mov.unshift({ id: 'MV-A-' + U().pad(seq(e.mov.map(m => m.id), /-(\d+)$/) + 1, 3), f, tipo: 'Compra', ref: id + ' · ' + v.linea, cant: n, kg: r1(n * 0.042), origen: v.prov, destino: v.galpon, doc: 'Guía del proveedor', csti: v.csti, estado: 'Concluido', nuevo: true });
        evento(e, 'Ingreso', id, n, `${v.tipo} ${v.linea} · ${v.prov} · ${v.csti}`, f);
        return `Lote ${id} ingresado con ${n} aves · plan sanitario generado`;
      }
    },
    descarte: {
      lbl: 'Descarte o baja', icon: 'fa-user-slash', esp: ['porcino', 'vacuno'],
      refs: e => act(e).filter(a => e.key === 'porcino' ? /Reproductora|Primeriza|Verraco/.test(a.cat) && a.rep !== 'Lactando' : true),
      fields: e => [{ k: 'motivo', label: 'Motivo', type: 'select', options: e.key === 'porcino' ? ['Baja prolificidad', 'Edad / número de partos', 'Problemas de aplomos', 'Falla reproductiva (repeticiones)', 'Muerte'] : ['Mastitis crónica', 'Infertilidad', 'Baja producción', 'Problemas podales', 'Edad', 'Muerte'], span: 1 },
        { k: 'dest', label: 'Destino', type: 'select', options: ['Camal municipal de Tingo María', 'Venta en pie', 'Muerte · necropsia'], span: 1 }, { k: 'kg', label: 'Peso vivo (kg)', type: 'number', value: 0, span: 1 },
        { k: 'cli', label: 'Cliente (si es venta)', type: 'select', options: SIGA.data.ventas.clientes.map(c => c.nom), span: 2 }],
      status: (e, a, v) => { const rt = retiroDe(e, a.id); return rt && !/Muerte/.test(v.dest) ? nota('warn', 'fa-ban', `<b>Bloqueado:</b> ${a.id} está en período de retiro por ${U().esc(rt.prod)} hasta el <b>${rt.hasta}</b>. Solo puede registrarse como muerte.`) : nota('info', 'fa-circle-info', `${a.id} · ${a.cat} · ${a.peso || '—'} kg · la salida del predio genera guía y CSTI.`); },
      apply(e, a, v, f) {
        if (/Muerte/.test(v.dest) || v.motivo === 'Muerte') {
          a.estado = 'Baja'; a.baja = { f, motivo: v.motivo, destino: 'Muerte' };
          e.mort.unshift({ f, ref: a.id, cant: 1, causa: v.motivo === 'Muerte' ? 'Causa desconocida' : v.motivo, edad: '—', nec: 'Sí · pendiente', nuevo: true });
          evento(e, 'Muerte', a.id, 1, v.motivo, f); return `${a.id} dado de baja por muerte`;
        }
        const kg = num(v.kg) || a.peso || 0, venta = /Venta/.test(v.dest);
        const r = X.registrarMov(e, { f, tipo: venta ? 'Venta en pie' : 'Descarte', x: a, cant: 1, kg, destino: venta ? v.cli : v.dest, motivo: v.motivo, cli: venta ? SIGA.data.ventas.clientes.find(c => c.nom === v.cli) : null, op: 'Contado' });
        return `${a.id} dado de baja (${v.motivo.toLowerCase()}) · ${r.csti}${r.extra}`;
      }
    },
    saca: { lbl: 'Saca / venta', icon: 'fa-truck', esp: ['porcino', 'vacuno', 'ave', 'cuy'], custom: (e, ref) => movForm(e, ref) },
    trat: { lbl: 'Tratamiento', icon: 'fa-kit-medical', esp: ['porcino', 'vacuno', 'ave', 'cuy'], custom: (e, ref) => tratForm(e, ref) }
  };

  /* =================== Motor de formularios de evento =================== */
  function openEvent(id, ref, esp) {
    const u = U(), e = esp ? ESP()[esp] : cur(), d = EV[id];
    if (!d) return;
    if (d.custom) return d.custom(e, ref);
    const list = d.refs ? d.refs(e) : [];
    if (d.refs && !d.noRef && !list.length) { u.toast(`No hay animales o lotes en condición para "${d.lbl}"`, 'info'); return; }
    let x = null;
    if (!d.noRef) {
      x = ref ? list.find(o => o.id === ref) : list[0];
      if (!x) { u.toast(`${ref} no está en condición para "${d.lbl}"`, 'info'); return; }
    }
    u.bigForm({
      title: d.lbl + ' · ' + e.nombre, icon: d.icon,
      sections: [{ title: x ? (esLote(x) ? 'Lote / poza' : 'Animal') + ' y fecha' : 'Datos del registro', cols: 3, fields: [
        ...(x ? [{ k: 'ref', label: d.refLbl || (esLote(x) ? 'Lote / poza' : 'Animal'), type: 'select', options: list.map(o => o.id + ' · ' + refTxt(o)), value: x.id + ' · ' + refTxt(x), span: 2 }] : []),
        { k: 'fecha', label: 'Fecha del evento', type: 'date', value: SIGA.ctx.hoyISO, span: 1, required: true },
        ...d.fields(e, x)] }],
      status: (rows, v) => d.status ? d.status(e, x, v) : '',
      after: back => back.querySelector('[data-k="ref"]')?.addEventListener('change', ev => openEvent(id, ev.target.value.split(' · ')[0], e.key)),
      submitLabel: 'Registrar ' + d.lbl.toLowerCase().split(' / ')[0],
      onSubmit: v => {
        const f = X.inDate(v.fecha);
        if (dd(f) < 0) { u.toast('La fecha no puede ser posterior a hoy', 'err'); return; }
        const msg = run(() => d.apply(e, x, v, f)); if (!msg) return;
        u.closeModal(); SIGA.refresh(); u.toast(msg);
      }
    });
  }
  // Selector visual de eventos de la especie
  function chooser() {
    const u = U(), e = cur(), list = Object.entries(EV).filter(([, d]) => d.esp.includes(e.key));
    const b = u.modal(`<i class="fa-solid fa-clipboard-list"></i> Registrar evento · ${e.nombre}`, `<p class="mini mb">Seleccione el evento. El sistema muestra solo los animales o lotes en condición de recibirlo (p. ej. parto solo para gestantes).</p>
      <div class="ev-grid">${list.map(([k, d]) => { const n = d.refs && !d.noRef ? d.refs(e).length : null; return `<button class="ev-btn" data-ev="${k}" ${n === 0 ? 'disabled' : ''}><i class="fa-solid ${d.icon}"></i><b>${d.lbl}</b><span>${n == null ? 'nuevo registro' : n + ' en condición'}</span></button>`; }).join('')}</div>`, `<button class="btn ghost" data-close>Cerrar</button>`, 'wide');
    b.querySelectorAll('[data-ev]').forEach(x => x.addEventListener('click', () => { u.closeModal(); openEvent(x.dataset.ev); }));
  }

  /* =================== Movilización: saca, venta y traslado =================== */
  function movForm(e, ref) {
    const u = U(), cand = [...vivos(e).filter(l => l.tipo !== 'Poza de empadre' || e.key === 'cuy'), ...act(e).filter(a => !/Ternero/.test(a.cat) || e.key === 'vacuno')];
    if (!cand.length) { u.toast('No hay animales disponibles', 'info'); return; }
    const x = cand.find(c => c.id === ref) || cand[0], lote = esLote(x), peso = lote ? X.pesoLote(e, x) : (x.peso || 0);
    const tipos = ['Saca a beneficio', 'Venta en pie', 'Venta de reproductores', 'Traslado interno'];
    u.bigForm({
      title: 'Saca, venta o movilización · ' + e.nombre, icon: 'fa-truck',
      sections: [
        { title: 'Animales', cols: 3, fields: [
          { k: 'ref', label: 'Lote o animal', type: 'select', options: cand.map(c => c.id + ' · ' + refTxt(c)), value: x.id + ' · ' + refTxt(x), span: 2 },
          { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1, required: true },
          { k: 'tipo', label: 'Tipo de movimiento', type: 'select', options: tipos, span: 1 },
          { k: 'cant', label: 'Cantidad (cabezas)', type: 'number', value: lote ? x.cab : 1, span: 1, required: true },
          { k: 'kg', label: 'Peso vivo total (kg)', type: 'number', value: r1((lote ? x.cab : 1) * peso), span: 1, hint: 'balanza de la unidad' }] },
        { title: 'Destino y documentos', cols: 3, fields: [
          { k: 'dest', label: 'Camal / destino interno', type: 'select', options: [...X.DESTINOS, 'Otra ubicación del predio'], value: e.key === 'ave' ? X.DESTINOS[1] : e.key === 'cuy' ? X.DESTINOS[2] : X.DESTINOS[0], span: 2 },
          { k: 'op', label: 'Condición de venta', type: 'select', options: ['Contado', 'Crédito'], span: 1 },
          { k: 'cli', label: 'Cliente (ventas)', type: 'select', options: SIGA.data.ventas.clientes.map(c => c.nom), span: 2 },
          { k: 'transp', label: 'Transporte (placa · conductor)', value: 'AHK-742 · J. Rengifo', span: 1 }] }],
      status: (rows, v) => {
        const y = X.findRef(e, v.ref.split(' · ')[0]) || x, rt = !/Traslado/.test(v.tipo) && retiroDe(e, y.id), kg = num(v.kg), c = int(v.cant);
        if (rt) return nota('warn', 'fa-ban', `<b>Salida bloqueada:</b> ${y.id} está en período de retiro por ${u.esc(rt.prod)} (${rt.src}) hasta el <b>${rt.hasta}</b>. Los residuos de medicamento impiden el beneficio y la venta.`);
        const pr = SIGA.data.ventas.productos.find(p => p.cod === (/reproductor/i.test(v.tipo) ? X.VENTA[e.key][1] : X.VENTA[e.key][0]));
        const base = `Peso promedio <b>${c ? (kg / c).toFixed(e.key === 'porcino' || e.key === 'vacuno' ? 1 : 2) : 0} kg</b>`;
        if (/Traslado/.test(v.tipo)) return nota('info', 'fa-right-left', base + ' · movimiento interno: no requiere CSTI.');
        if (/Venta/.test(v.tipo)) return nota('teal', 'fa-file-invoice', `${base} · se emite comprobante a <b>${u.esc(v.cli)}</b> por ${pr.um === 'KGM' ? INT(kg) + ' kg' : c + ' und.'} de "${u.esc(pr.desc)}" (${u.money(pr.um === 'KGM' ? kg * pr.pu : c * pr.pu)} ${pr.afect.toLowerCase()}) · guía de remisión y CSTI de SENASA.`);
        return nota('teal', 'fa-industry', `${base} · canal estimada <b>${INT(kg * X.REND[e.key])} kg</b> (rendimiento ${Math.round(X.REND[e.key] * 100)} %) que ingresa al almacén como producto terminado · se genera guía y CSTI.`);
      },
      after: back => back.querySelector('[data-k="ref"]').addEventListener('change', ev => movForm(e, ev.target.value.split(' · ')[0])),
      submitLabel: 'Registrar movimiento',
      onSubmit: v => {
        const f = X.inDate(v.fecha), y = X.findRef(e, v.ref.split(' · ')[0]), tr = /Traslado/.test(v.tipo);
        const r = run(() => X.registrarMov(e, { f, tipo: v.tipo, x: y, cant: int(v.cant), kg: num(v.kg), destino: tr ? (v.dest === 'Otra ubicación del predio' ? 'Predio · ' + y.ubic : v.dest) : /Venta/.test(v.tipo) ? v.cli : v.dest, cli: /Venta/.test(v.tipo) ? SIGA.data.ventas.clientes.find(c => c.nom === v.cli) : null, op: v.op, transp: v.transp }));
        if (!r) return;
        u.closeModal(); SIGA.refresh(); u.toast(`${v.tipo} ${r.id} registrada` + (r.csti ? ' · ' + r.csti : '') + r.extra);
      }
    });
  }

  /* =================== Sanidad =================== */
  const vetItems = () => SIGA.data.almacen.items.filter(i => /^23110009/.test(i.cod));
  function tratForm(e, ref) {
    const u = U(), cand = [...act(e), ...vivos(e)];
    const x = cand.find(c => c.id === ref) || cand[0], its = vetItems(), def = its.find(i => i.cod === '231100090102') || its[0];
    u.bigForm({
      title: 'Tratamiento veterinario · ' + e.nombre, icon: 'fa-kit-medical',
      sections: [
        { title: 'Paciente y diagnóstico', cols: 3, fields: [
          { k: 'ref', label: 'Animal o lote', type: 'select', options: cand.map(c => c.id + ' · ' + refTxt(c)), value: x.id + ' · ' + refTxt(x), span: 2 },
          { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1, required: true },
          { k: 'diag', label: 'Diagnóstico presuntivo', value: '', span: 2, required: true, ph: 'p. ej. neumonía, mastitis clínica, diarrea' },
          { k: 'cant', label: 'Animales tratados', type: 'number', value: esLote(x) ? x.cab : 1, span: 1 }] },
        { title: 'Prescripción y período de retiro', cols: 3, fields: [
          { k: 'prod', label: 'Producto (almacén)', type: 'select', options: [...its.map(i => i.cod + ' · ' + i.desc), 'Otro · receta externa'], value: def.cod + ' · ' + def.desc, span: 2 },
          { k: 'und', label: 'Unidades a retirar del almacén', type: 'number', value: 1, span: 1 },
          { k: 'dosis', label: 'Dosis', value: '1 ml / 10 kg', span: 1 }, { k: 'via', label: 'Vía', type: 'select', options: ['IM', 'SC', 'IV', 'Oral', 'Intramamaria', 'Tópica'], span: 1 },
          { k: 'dias', label: 'Días de tratamiento', type: 'number', value: 3, span: 1 },
          { k: 'retC', label: 'Retiro de carne (días)', type: 'number', value: (X.RET_DEF[def.cod] || [0, 0])[0], span: 1 }, { k: 'retL', label: 'Retiro de leche (días)', type: 'number', value: e.key === 'vacuno' ? (X.RET_DEF[def.cod] || [0, 0])[1] : 0, span: 1 },
          { k: 'vet', label: 'Médico veterinario', type: 'select', options: SIGA.data.pecuario.veterinarios.map(v => v.split(' (')[0]), value: e.key === 'vacuno' ? 'MV. C. Ruiz' : 'MV. R. Tello', span: 1 }] }],
      status: (rows, v) => {
        const f = X.inDate(v.fecha), fin = addD(f, int(v.dias)), rc = int(v.retC), rl = int(v.retL), cod = v.prod.split(' · ')[0], it = item(cod);
        return nota(rc || rl ? 'amber' : 'info', 'fa-hourglass-half', `Alta prevista el <b>${fin}</b>` + (rc ? ` · retiro de carne hasta el <b>${addD(fin, rc)}</b>: se bloqueará la saca y venta de ${v.ref.split(' · ')[0]}` : '') + (rl ? ` · leche descartada hasta el <b>${addD(fin, rl)}</b>` : '') + (it ? ` · ${stockTx(cod)} · costo ${u.money(int(v.und) * (SIGA.alm ? SIGA.alm.cprom(cod) : it.cprom))}` : ''));
      },
      after: back => {
        back.querySelector('[data-k="ref"]').addEventListener('change', ev => tratForm(e, ev.target.value.split(' · ')[0]));
        back.querySelector('[data-k="prod"]').addEventListener('change', ev => { const r = X.RET_DEF[ev.target.value.split(' · ')[0]] || [0, 0]; back.querySelector('[data-k="retC"]').value = r[0]; back.querySelector('[data-k="retL"]').value = e.key === 'vacuno' ? r[1] : 0; });
      },
      submitLabel: 'Registrar tratamiento',
      onSubmit: v => {
        const f = X.inDate(v.fecha), y = X.findRef(e, v.ref.split(' · ')[0]), cod = /^\d{12}/.test(v.prod) ? v.prod.split(' · ')[0] : '', it = item(cod);
        const r = run(() => {
          const p = cod ? pecosa([{ cod, cant: int(v.und) }], e.unidad, 'Medicamentos · tratamiento ' + y.id) : { doc: '', costo: 0 };
          const id = 'TR-' + X.PREF[e.key] + '-' + u.pad(seq(e.trat.map(t => t.id), /-(\d+)$/) + 1, 3);
          e.trat.unshift({ id, f, ref: y.id, diag: v.diag, prod: it ? it.desc.split(' · ')[0] : 'Receta externa', cod, dosis: v.dosis, via: v.via, dias: int(v.dias), retC: int(v.retC), retL: int(v.retL), vet: v.vet, costo: p.costo, estado: 'En tratamiento', cant: int(v.cant) || 1, doc: p.doc, nuevo: true });
          imputar(e, y.id, 'san', p.costo);
          if (int(v.retL)) syncTanque(e);
          evento(e, 'Tratamiento', y.id, int(v.cant) || 1, `${v.diag} · ${it ? it.desc.split(' · ')[0] : 'receta externa'}` + (int(v.retC) ? ` · retiro de carne ${int(v.retC)} d` : '') + (int(v.retL) ? ` · retiro de leche ${int(v.retL)} d` : '') + (p.doc ? ' · ' + p.doc : ''), f);
          return id;
        });
        if (!r) return;
        u.closeModal(); SIGA.refresh(); u.toast(`Tratamiento ${r} registrado` + (int(v.retC) ? ` · ${y.id} bloqueado para saca hasta el ${addD(addD(f, int(v.dias)), int(v.retC))}` : ''));
      }
    });
  }
  function aplicar(e, p) {
    const u = U(), it = item(p.cod), m = it && /(\d+)\s*dosis/i.exec(it.desc), sug = it ? (m ? Math.ceil(p.cab / +m[1]) : 1) : 0;
    u.bigForm({
      title: 'Registrar aplicación · ' + p.act, icon: 'fa-syringe',
      sections: [{ cols: 3, fields: [
        { k: 'obj', label: 'Animales / lote', value: p.obj, ro: true, span: 2 }, { k: 'fecha', label: 'Fecha de aplicación', type: 'date', value: SIGA.ctx.hoyISO, span: 1 },
        { k: 'cab', label: 'Cabezas vacunadas / tratadas', type: 'number', value: p.cab, span: 1 }, { k: 'und', label: it ? 'Unidades del almacén (' + it.um.toLowerCase() + ')' : 'Sin descuento de almacén', type: 'number', value: sug, span: 1, ro: !it },
        { k: 'lote', label: 'Lote del biológico', value: 'LB-' + (2600 + (p.id.charCodeAt(4) || 7)), span: 1 }, { k: 'resp', label: 'Responsable', value: SIGA.data.pecuario.veterinarios[e.key === 'vacuno' ? 1 : 0].split(' (')[0], span: 1 }] }],
      status: (rows, v) => nota(p.ret ? 'amber' : 'info', 'fa-circle-info', `${u.esc(p.prod)} · ${u.esc(p.dosis)} ${u.esc(p.via)}` + (it ? ` · ${stockTx(p.cod)} · costo ${u.money(int(v.und) * (SIGA.alm ? SIGA.alm.cprom(p.cod) : it.cprom))}` : '') + (p.ret ? ` · inicia retiro de ${p.ret} días (hasta el ${addD(X.inDate(v.fecha), p.ret)})` : '')),
      submitLabel: 'Registrar aplicación',
      onSubmit: v => {
        const f = X.inDate(v.fecha);
        const r = run(() => {
          const q = it ? pecosa([{ cod: p.cod, cant: int(v.und) }], e.unidad, 'Biológicos · ' + p.act) : { doc: '', costo: 0 };
          Object.assign(p, { estado: 'Aplicada', f, cab: int(v.cab), doc: q.doc, costo: q.costo, loteBio: v.lote, resp: v.resp });
          imputar(e, p.obj.split(' · ')[0], 'san', q.costo);
          evento(e, /Vacuna/i.test(p.act) ? 'Vacunación' : 'Sanidad', p.obj.split(' · ')[0], int(v.cab), p.act + (q.doc ? ' · ' + q.doc : ''), f);
          return q.doc || 'sin salida de almacén';
        });
        if (!r) return;
        u.closeModal(); SIGA.refresh(); u.toast(`${p.act} aplicada · ${r}`);
      }
    });
  }
  function programar(e) {
    const u = U(), its = vetItems(), obj = [...vivos(e).map(l => l.id + ' · ' + l.etapa.toLowerCase()), ...(e.key === 'porcino' ? ['Reproductores', 'Lechones lactantes'] : e.key === 'vacuno' ? ['Hato completo', 'Vacas en producción', 'Terneros', 'Vaquillonas'] : e.key === 'cuy' ? ['Todas las pozas'] : [])];
    u.formModal('<i class="fa-solid fa-calendar-plus"></i> Programar actividad sanitaria · ' + e.nombre, [
      { k: 'f', label: 'Fecha', type: 'date', value: '2026-08-28', span: 1 }, { k: 'act', label: 'Actividad', value: 'Vacunación', span: 1 },
      { k: 'prod', label: 'Producto', type: 'select', options: [...its.map(i => i.cod + ' · ' + i.desc), 'Otro · sin stock'] },
      { k: 'obj', label: 'Animales / lote', type: 'select', options: obj, span: 1 }, { k: 'cab', label: 'Cabezas', type: 'number', value: 30, span: 1 },
      { k: 'dosis', label: 'Dosis', value: '2 ml', span: 1 }, { k: 'via', label: 'Vía', type: 'select', options: ['IM', 'SC', 'Oral', 'Ocular', 'Agua de bebida', 'Tópica'], span: 1 },
      { k: 'ret', label: 'Retiro de carne (días)', type: 'number', value: 0, span: 1 }
    ], v => {
      const cod = /^\d{12}/.test(v.prod) ? v.prod.split(' · ')[0] : '', it = item(cod);
      e.plan.unshift({ id: 'PS-' + u.pad(seq(e.plan.map(p => p.id), /(\d+)$/) + 1, 3), f: X.inDate(v.f), act: v.act, prod: it ? it.desc.split(' · ')[0] : v.act, cod, dosis: v.dosis, via: v.via, obj: v.obj, cab: int(v.cab), estado: 'Programada', ret: int(v.ret), nuevo: true });
      SIGA.log('Control pecuario', 'Programación sanitaria', e.nombre + ' · ' + v.obj, '—', v.act + ' · ' + X.inDate(v.f));
      u.closeModal(); SIGA.refresh(); u.toast('Actividad programada · aparecerá en la lista de acciones y en la agenda del tablero');
    }, 'Programar');
  }
  function alta(e, t) {
    U().confirm(`¿Dar de alta el tratamiento <b>${t.id}</b> de ${t.ref} (${U().esc(t.diag)})?` + (t.retC || t.retL ? `<br><span class="mini">El período de retiro sigue vigente hasta cumplirse${t.retC ? ' · carne ' + addD(addD(t.f, t.dias), t.retC) : ''}${t.retL ? ' · leche ' + addD(addD(t.f, t.dias), t.retL) : ''}.</span>` : ''), () => {
      t.estado = 'Alta'; t.fAlta = SIGA.ctx.hoy;
      evento(e, 'Alta sanitaria', t.ref, t.cant, t.id + ' · ' + t.diag);
      SIGA.refresh(); U().toast('Tratamiento ' + t.id + ' cerrado con alta clínica');
    }, 'Dar de alta', '');
  }

  /* =================== Alimentación =================== */
  function consumoForm(e, racId) {
    const u = U(), grupos = [...vivos(e).map(l => l.id + ' · ' + l.etapa.toLowerCase()), ...(e.key === 'porcino' ? ['Reproductoras'] : e.key === 'vacuno' ? ['Vacas en producción', 'Secas y vaquillonas'] : e.key === 'cuy' ? ['Pozas de empadre'] : [])];
    const r0 = e.rac.find(r => r.id === racId) || e.rac[0];
    u.bigForm({
      title: 'Consumo de alimento · ' + e.nombre, icon: 'fa-wheat-awn',
      sections: [{ cols: 3, fields: [
        { k: 'grupo', label: 'Lote o grupo', type: 'select', options: grupos, span: 2 }, { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1 },
        { k: 'rac', label: 'Ración (fórmula)', type: 'select', options: e.rac.map(r => r.id + ' · ' + r.nombre), value: r0.id + ' · ' + r0.nombre, span: 2 }, { k: 'kg', label: 'Kilos suministrados', type: 'number', value: 400, span: 1, required: true }] }],
      status: (rows, v) => {
        const rac = e.rac.find(r => r.id === v.rac.split(' · ')[0]), ex = X.explota(rac, num(v.kg));
        return `<div class="note teal"><i class="fa-solid fa-diagram-project"></i><div><b>Explosión de la ración</b> · salida de almacén con PECOSA:<br>${ex.map(x => `${u.esc(x.it ? x.it.desc : x.ing)} · <b>${INT(x.und)} ${x.it ? x.it.um.toLowerCase() : ''}</b> (${INT(x.kg)} kg) · stock ${x.it ? INT(x.it.stock) : 0}` + (x.it && x.it.stock < x.und ? ' <b style="color:var(--danger)">insuficiente</b>' : '')).join('<br>')}<br>Costo estimado <b>${u.money(ex.reduce((s, x) => s + x.und * (x.it ? (SIGA.alm ? SIGA.alm.cprom(x.cod) : x.it.cprom) : 0), 0))}</b> · costo de fórmula ${u.money(rac.costoKg * num(v.kg))}</div></div>`;
      },
      submitLabel: 'Registrar consumo',
      onSubmit: v => {
        const rac = e.rac.find(r => r.id === v.rac.split(' · ')[0]), kg = num(v.kg), g = v.grupo.split(' · ')[0], f = X.inDate(v.fecha);
        if (kg <= 0) { u.toast('Indique los kilos', 'err'); return; }
        const r = run(() => {
          const p = pecosa(X.explota(rac, kg).map(x => ({ cod: x.cod, cant: x.und })), e.unidad + ' · ' + g, 'Alimento ' + rac.nombre + ' · ' + g);
          e.cons.unshift({ f, lote: g, rac: rac.id, kg, doc: p.doc, costo: p.costo, nuevo: true });
          const l = e.lotes.find(x => x.id === g); if (l) { l.costo.alim = r2(l.costo.alim + p.costo); if (e.key !== 'ave') l.alim += kg; }
          evento(e, 'Consumo de alimento', g, kg, rac.nombre + ' · ' + p.doc + ' · ' + SIGA.ui.money(p.costo), f);
          return p;
        });
        if (!r) return;
        u.closeModal(); SIGA.refresh(); u.toast(`Consumo registrado · ${r.doc} · ${u.money(r.costo)} imputado al costo`);
      }
    });
  }
  function reformular(e, rac) {
    const u = U();
    u.bigForm({
      title: 'Formulación de ración · ' + rac.id + ' ' + rac.nombre, icon: 'fa-flask',
      sections: [{ cols: 3, fields: [{ k: 'nombre', label: 'Nombre', value: rac.nombre, span: 1 }, { k: 'pb', label: 'Proteína bruta (%)', type: 'number', value: rac.pb, span: 1 }, { k: 'em', label: 'Energía (kcal/kg)', type: 'number', value: rac.em, span: 1 }] }],
      items: { title: 'Lista de materiales de la fórmula (BOM)', hint: 'la inclusión debe sumar 100 %', addLabel: 'Agregar insumo', seed: { n: 'Nuevo insumo', p: 0, c: 1 },
        rows: rac.ing.map(g => ({ n: g[0], p: g[1], c: g[2] })),
        columns: [{ k: 'n', label: 'Insumo' }, { k: 'p', label: '% inclusión', type: 'num', r: true, w: '110px' }, { k: 'c', label: 'S/ por kg', type: 'num', r: true, w: '110px' }, { k: 'a', label: 'Aporte S/ kg', calc: row => (+row.p || 0) / 100 * (+row.c || 0), w: '120px' }] },
      totals: rows => { const p = rows.reduce((s, r) => s + (+r.p || 0), 0), c = rows.reduce((s, r) => s + (+r.p || 0) / 100 * (+r.c || 0), 0); return [{ label: 'Inclusión total', val: p.toFixed(1) + ' %', cls: Math.abs(p - 100) > 0.01 ? 'bad' : '' }, { label: 'Costo por kg', val: u.money(c) }, { label: 'Costo por tonelada', val: u.money(c * 1000), big: true }]; },
      status: rows => { const p = rows.reduce((s, r) => s + (+r.p || 0), 0); return Math.abs(p - 100) > 0.01 ? nota('warn', 'fa-circle-exclamation', `La fórmula suma ${p.toFixed(1)} %: ajuste la inclusión a 100 %.`) : nota('info', 'fa-circle-check', 'Fórmula balanceada · el nuevo costo por kg se aplica a los consumos siguientes.'); },
      submitLabel: 'Guardar fórmula',
      onSubmit: (v, rows) => {
        const p = rows.reduce((s, r) => s + (+r.p || 0), 0); if (Math.abs(p - 100) > 0.01) { u.toast('La inclusión debe sumar 100 %', 'err'); return; }
        const antes = rac.costoKg;
        Object.assign(rac, { nombre: v.nombre, pb: num(v.pb), em: num(v.em), ing: rows.filter(r => +r.p > 0).map(r => [r.n, +r.p, +r.c]) });
        rac.costoKg = Math.round(rac.ing.reduce((s, x) => s + x[1] / 100 * x[2], 0) * 1000) / 1000;
        SIGA.log('Control pecuario', 'Reformulación de ración', rac.id + ' · ' + rac.nombre, 'S/ ' + antes + ' por kg', 'S/ ' + rac.costoKg + ' por kg');
        u.closeModal(); SIGA.refresh(); u.toast(`Fórmula ${rac.id} actualizada · costo ${u.money(rac.costoKg)} por kg`);
      }
    });
  }

  /* =================== Leche: destino del ordeño del día =================== */
  function destinarLeche(e) {
    const u = U(), t = e.tanque[e.tanque.length - 1], disp = t.am + t.pm - t.desc;
    u.bigForm({
      title: 'Destino de la leche del día · ' + t.f, icon: 'fa-bottle-droplet',
      sections: [{ cols: 3, fields: [
        { k: 'disp', label: 'Leche apta (L)', value: disp, ro: true, span: 1 }, { k: 'planta', label: 'A la planta de lácteos (L)', type: 'number', value: t.planta, span: 1 }, { k: 'venta', label: 'Venta directa (L)', type: 'number', value: disp - t.planta, span: 1 },
        { k: 'cli', label: 'Cliente de la venta', type: 'select', options: SIGA.data.ventas.clientes.map(c => c.nom), span: 2 }, { k: 'op', label: 'Condición', type: 'select', options: ['Contado', 'Crédito'], span: 1 }] }],
      status: (rows, v) => { const s = num(v.planta) + num(v.venta); return nota(s > disp ? 'warn' : t.desc ? 'amber' : 'info', 'fa-circle-info', (s > disp ? `El destino (${INT(s)} L) supera la leche apta. ` : '') + `Ordeño AM ${INT(t.am)} L + PM ${INT(t.pm)} L · <b>${INT(t.desc)} L descartados</b> por período de retiro · la entrega a planta crea la recepción de materia prima para análisis de calidad.`); },
      submitLabel: 'Registrar destino',
      onSubmit: v => {
        const pl = num(v.planta), ve = num(v.venta);
        if (pl < 0 || ve < 0 || pl + ve > disp) { u.toast('La suma de destinos no puede superar la leche apta', 'err'); return; }
        const r = run(() => {
          let doc = '';
          if (ve > 0) { const cl = SIGA.data.ventas.clientes.find(c => c.nom === v.cli), c = SIGA.ventas.emitir({ tipo: cl.doc.startsWith('RUC') ? '01' : '03', cli: cl.nom, docCli: cl.doc, op: v.op, items: [['LEC-FRE', ve]], medio: v.op === 'Crédito' ? 'Crédito' : 'Efectivo', venc: v.op === 'Crédito' ? '17/09/2026' : undefined }); doc = c.doc; }
          t.planta = pl; t.venta = ve; t.entregado = true;
          const rc = pl > 0 && SIGA.prod && SIGA.prod.recibir ? SIGA.prod.recibir({ mp: 'Leche fresca de vaca', prov: 'Establo lechero UNAS', cant: pl, um: 'L', destino: 'Planta de lácteos', origen: 'Control lechero ' + t.f, grasa: t.grasa, st: t.st }) : null;
          evento(e, 'Entrega de leche', 'Tanque', pl + ve, `${INT(pl)} L a planta` + (rc ? ' (' + rc + ')' : '') + ` · ${INT(ve)} L de venta` + (doc ? ' · ' + doc : '') + ` · ${INT(t.desc)} L descartados`);
          return (rc ? rc + ' · ' : '') + (doc ? 'comprobante ' + doc : 'sin venta directa');
        });
        if (!r) return;
        u.closeModal(); SIGA.refresh(); u.toast('Destino de la leche registrado · ' + r);
      }
    });
  }

  Object.assign(SIGA.pec, { EV, openEvent, chooser, movForm, tratForm, aplicar, programar, alta, consumoForm, reformular, destinarLeche, vetItems });
})();
