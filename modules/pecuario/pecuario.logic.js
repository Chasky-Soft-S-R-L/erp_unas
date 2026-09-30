/* ============================================================
   Control pecuario · motor de cálculo y registro de eventos
   · Índices por especie calculados desde las fichas (no almacenados):
     porcinos PSY, NV, mortalidad predestete, tasa de parición, IDS, DNP, GDP, FCR
     lechería DEL, producción, proyección 305 d, CCS ponderada, IEP, días abiertos, SPC
     aves EPEF, FCR, viabilidad, % postura, kg de alimento por docena
     cuyes tamaño de camada, fertilidad, mortalidad en lactancia, índice productivo
   · Período de retiro: bloquea la saca/venta y descarta la leche
   · Listas de acción generadas del estado de cada animal y lote
   · Eventos con efecto real: fichas, lotes, almacén (PECOSA), contabilidad,
     ventas (CPE) y movilización con CSTI
   ============================================================ */
(function () {
  const HOY = new Date(2026, 7, 18);
  const P2 = n => String(n).padStart(2, '0');
  const pd = s => /^\d{2}\/\d{2}\/\d{4}$/.test(s || '') ? new Date(+s.slice(6), +s.slice(3, 5) - 1, +s.slice(0, 2)) : null;
  const fd = d => P2(d.getDate()) + '/' + P2(d.getMonth() + 1) + '/' + d.getFullYear();
  const addD = (s, n) => { const d = new Date(typeof s === 'string' ? pd(s) : s); d.setDate(d.getDate() + n); return fd(d); };
  const dd = (a, b) => Math.round(((b ? pd(b) : HOY) - pd(a)) / 864e5);        // días transcurridos de a hasta b (u hoy)
  const sv = s => +(pd(s) || 0);
  const inDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v.slice(8) + '/' + v.slice(5, 7) + '/' + v.slice(0, 4) : (v || SIGA.ctx.hoy);
  const sum = (a, f) => a.reduce((s, x) => s + (+(typeof f === 'function' ? f(x) : x[f]) || 0), 0);
  const avg = (a, f) => a.length ? sum(a, f) / a.length : 0;
  const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  const num = v => parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0;
  const int = v => Math.round(num(v));
  const I = v => SIGA.ui.int(Math.round(+v || 0));
  const seq = (list, re) => Math.max(0, ...list.map(s => { const m = re.exec(s); return m ? +m[1] : 0; }));
  const err = m => { throw new Error(m); };
  const D = () => SIGA.data.pecuario, ESP = () => D().especies;
  const item = cod => SIGA.data.almacen.items.find(i => i.cod === cod);
  const kgUnidad = it => { if (!it) return 1; const m = /(\d+)\s*kg/i.exec(it.desc); return it.um === 'KG' ? 1 : m ? +m[1] : 1; };
  const esLote = x => x && x.cabIni != null;
  const findRef = (e, ref) => e.anim.find(a => a.id === ref) || e.lotes.find(l => l.id === ref) || null;
  const refTxt = x => esLote(x) ? `${x.etapa} · ${x.cab} cab. · ${x.ubic}` : [x.nombre, x.cat, x.rep && x.rep !== '—' ? x.rep : ''].filter(Boolean).join(' · ');

  // Retiro por producto (días carne, días leche) · según ficha técnica
  const RET_DEF = { '231100090102': [28, 7], '231100090144': [4, 4], '231100090088': [28, 35], '231100090034': [21, 0] };
  const REND = { porcino: 0.78, vacuno: 0.52, ave: 0.76, cuy: 0.68 };            // rendimiento de canal
  const PREF = { porcino: 'P', vacuno: 'V', ave: 'A', cuy: 'C' };
  const CANAL = { porcino: ['PEC-CER-CANAL', 'Carcasa de cerdo · canal'], vacuno: ['PEC-VAC-CANAL', 'Carcasa de vacuno · canal'], ave: ['PEC-POL-CANAL', 'Pollo beneficiado · canal'], cuy: ['PEC-CUY-CANAL', 'Cuy beneficiado · canal'] };
  const VENTA = { porcino: ['CER-PIE', 'CER-REP'], vacuno: ['VAC-PIE', 'VAC-PIE'], ave: ['POL-PIE', 'POL-PIE'], cuy: ['CUY-BEN', 'CUY-REP'] };
  const CAUSAS = {
    porcino: ['Aplastamiento', 'Diarrea neonatal', 'Diarrea posdestete', 'Neumonía', 'Úlcera gástrica', 'Nacido débil / inanición', 'Prolapso', 'Causa desconocida'],
    vacuno: ['Neumonía neonatal', 'Diarrea neonatal', 'Timpanismo', 'Accidente', 'Mastitis tóxica', 'Causa desconocida'],
    ave: ['Estrés por calor', 'Síndrome ascítico', 'Muerte súbita', 'Problemas de patas', 'Onfalitis', 'Prolapso', 'Descarte · baja postura', 'Causa desconocida'],
    cuy: ['Neumonía', 'Aplastamiento de lactantes', 'Salmonelosis', 'Distocia (hembra)', 'Timpanismo', 'Causa desconocida']
  };
  const DESTINOS = ['Camal municipal de Tingo María', 'Centro de beneficio avícola UNAS', 'Planta de beneficio UNAS'];

  // Productos de venta en pie y reproductores (catálogo de Ventas · CV-01)
  const VP = SIGA.data.ventas.productos;
  [{ cod: 'CER-PIE', desc: 'Cerdo en pie (peso vivo)', um: 'KGM', pu: 8.4, afect: 'Exonerado', unidad: 'Granja porcina', ico: 'fa-piggy-bank' },
   { cod: 'CER-REP', desc: 'Reproductor porcino (cachorra o verraco)', um: 'NIU', pu: 980, afect: 'Exonerado', unidad: 'Granja porcina', ico: 'fa-piggy-bank' },
   { cod: 'VAC-PIE', desc: 'Vacuno en pie (peso vivo)', um: 'KGM', pu: 7.2, afect: 'Exonerado', unidad: 'Establo lechero', ico: 'fa-cow' },
   { cod: 'POL-PIE', desc: 'Pollo en pie (peso vivo)', um: 'KGM', pu: 7.4, afect: 'Exonerado', unidad: 'Unidad avícola', ico: 'fa-dove' },
   { cod: 'CUY-REP', desc: 'Cuy reproductor mejorado', um: 'NIU', pu: 38, afect: 'Exonerado', unidad: 'Galpón de cuyes', ico: 'fa-paw' }
  ].forEach(p => { if (!VP.some(x => x.cod === p.cod)) VP.push(p); });
  const PD = D(); PD.cstiSeq = PD.cstiSeq || 4513; PD.guiaSeq = PD.guiaSeq || 419;

  /* =================== Período de retiro =================== */
  function retiros(e) {
    const out = [];
    (e.trat || []).filter(t => !t.anulado).forEach(t => {
      const f0 = addD(t.f, t.dias);
      if (t.retC) { const h = addD(f0, t.retC); if (dd(h) <= 0) out.push({ ref: t.ref, tipo: 'Carne', hasta: h, rest: -dd(h), prod: t.prod, src: t.id }); }
      if (t.retL) { const h = addD(f0, t.retL); if (dd(h) <= 0) out.push({ ref: t.ref, tipo: 'Leche', hasta: h, rest: -dd(h), prod: t.prod, src: t.id }); }
    });
    (e.plan || []).filter(p => p.estado === 'Aplicada' && p.ret && !p.anulado).forEach(p => { const h = addD(p.f, p.ret); if (dd(h) <= 0) out.push({ ref: p.obj.split(' · ')[0], tipo: 'Carne', hasta: h, rest: -dd(h), prod: p.prod, src: p.id }); });
    return out.sort((a, b) => b.rest - a.rest);
  }
  const GRUPO = { Reproductores: a => /Reproductora|Primeriza|Verraco/.test(a.cat), 'Hato completo': () => true, 'Todas las pozas': () => true };
  function retiroDe(e, ref, tipo = 'Carne') {
    const a = e.anim.find(x => x.id === ref);
    return retiros(e).find(x => x.tipo === tipo && (x.ref === ref || (a && GRUPO[x.ref] && GRUPO[x.ref](a)) || (!a && x.ref === 'Todas las pozas'))) || null;
  }

  /* =================== Indicadores de lote =================== */
  function pesoLote(e, l) {
    const pz = l.pesos || [], last = pz[pz.length - 1];
    if (!last) return 0;
    if (l.estado === 'Cerrado' || !e.stdPeso || l.std === 'ponedora' || l.tipo === 'Poza de empadre' || last[1] >= l.edad || !(e.stdPeso(last[1]) > 0)) return last[2];
    return Math.round(e.stdPeso(l.edad) * last[2] / e.stdPeso(last[1]) * 1000) / 1000;
  }
  function lm(e, l) {
    const pz = l.pesos || [], p0 = pz[0] || [l.fIng, l.eIng, 0], peso = pesoLote(e, l), crec = l.tipo !== 'Poza de empadre' && l.std !== 'ponedora';
    const gdp = crec && peso > p0[2] ? (peso - p0[2]) / Math.max(1, l.edad - p0[1]) : 0;
    const std = crec && e.stdPeso ? e.stdPeso(l.edad) : null;
    const movs = (e.mov || []).filter(m => m.ref === l.id && /Saca|Venta/.test(m.tipo) && !m.anulado);
    const kgVend = movs.length ? sum(movs, 'kg') : (l.vendidos || 0) * peso;
    const biom = l.cab * peso, kgProd = crec ? Math.max(0, biom + kgVend - l.cabIni * p0[2]) : 0;
    const fcr = crec ? (kgProd > 0 && l.alim ? l.alim / kgProd : (l.fcr || 0)) : 0;
    const costo = l.costo ? sum(Object.values(l.costo), v => v) : 0;
    const cKg = biom + kgVend > 0 ? costo / (biom + kgVend) : 0;
    const viab = l.cabIni ? (l.cab + (l.vendidos || 0)) / l.cabIni * 100 : 100;
    const mort = l.cabIni ? l.muertes / l.cabIni * 100 : 0;
    const diasObj = l.pesoObj && gdp > 0 && peso < l.pesoObj ? Math.ceil((l.pesoObj - peso) / gdp) : 0;
    const epef = l.tipo === 'Pollos de engorde' && fcr > 0 && l.edad > 0 ? viab * peso * 100 / (l.edad * fcr) : null;
    const dia = l.diario && l.diario.length ? l.diario[l.diario.length - 1] : null;
    return { peso, gdp, std, dev: std ? (peso / std - 1) * 100 : null, biom, kgVend, kgProd, fcr, costo, cKg, viab, mort, diasObj, epef, dia };
  }
  // Proyección de la lactancia a 305 días con la curva de Wood escalada al control actual
  const p305 = (e, leche, del) => { const k = leche / e.wood(Math.max(1, del), 1); let s = 0; for (let t = 1; t <= 305; t++) s += e.wood(t, k); return Math.round(s); };

  /* =================== Índices por especie =================== */
  const KP = {
    porcino(e) {
      const cer = e.anim.filter(a => /Reproductora|Primeriza/.test(a.cat) && a.estado === 'Activa'), prod = cer.filter(a => a.par > 0);
      const pts = []; cer.forEach(a => a.partos.forEach(p => { if (dd(p.f) <= 365) pts.push(p); }));
      const dst = pts.filter(p => p.dest != null), pca = pts.length / Math.max(1, prod.length), lact = avg(dst, 'lact') || 21;
      const srv = cer.flatMap(a => a.serv.filter(s => s.res !== 'En curso'));
      const act = e.lotes.filter(l => l.estado === 'Activo'), eng = act.filter(l => l.tipo === 'Engorde'), mE = eng.map(l => lm(e, l));
      const cab = { rep: cer.length, ver: e.anim.filter(a => a.cat === 'Verraco' && a.estado === 'Activo').length, lech: sum(cer, 'lechones'), rec: sum(act.filter(l => l.tipo === 'Recría'), 'cab'), eng: sum(eng, 'cab') };
      return {
        cab, total: cab.rep + cab.ver + cab.lech + cab.rec + cab.eng, partos: pts.length,
        nt: avg(pts, 'nt'), nv: avg(pts, 'nv'), nm: sum(pts, 'nm') / Math.max(1, sum(pts, 'nt')) * 100, mom: sum(pts, 'mom') / Math.max(1, sum(pts, 'nt')) * 100,
        dest: avg(dst, 'dest'), pesoDest: avg(dst, 'pesoDest'), mortPre: (1 - sum(dst, 'dest') / Math.max(1, sum(dst, 'nv'))) * 100,
        pca, psy: pca * avg(dst, 'dest'), ids: avg(pts.filter(p => p.ids != null), 'ids'), lact, dnp: Math.max(0, 365 - pca * (114 + lact)),
        paricion: srv.length ? srv.filter(s => s.res === 'Parto').length / srv.length * 100 : 0,
        gdp: avg(mE, 'gdp') * 1000, fcr: avg(mE, 'fcr'), mortEng: sum(eng, 'muertes') / Math.max(1, sum(eng, 'cabIni')) * 100
      };
    },
    vacuno(e) {
      const vac = e.anim.filter(a => /Vaca/.test(a.cat) && a.estado === 'Activa'), lac = vac.filter(a => a.cat === 'Vaca en producción');
      const lit = sum(lac, 'leche'), preg = vac.filter(a => a.rep === 'Preñada' || a.rep === 'Seca'), elig = vac.filter(a => a.rep === 'Seca' || a.del >= 50);
      const n = c => e.anim.filter(a => a.cat === c && /Activ/.test(a.estado)).length;
      const cab = { vac: vac.length, lac: lac.length, sec: vac.length - lac.length, vaq: n('Vaquillona'), ter: n('Ternero'), toro: n('Toro') };
      return {
        cab, total: cab.vac + cab.vaq + cab.ter + cab.toro, litros: lit, prom: lit / Math.max(1, lac.length), del: avg(lac, 'del'),
        ccs: lit ? sum(lac, a => a.ccs * a.leche) / lit : 0, p305: avg(lac, 'p305'), secas: (vac.length - lac.length) / Math.max(1, vac.length) * 100,
        preñez: elig.length ? preg.length / elig.length * 100 : 0, spc: avg(preg, 'nServ'), iep: avg(vac.filter(a => a.iep), 'iep'),
        dab: avg(vac.filter(a => a.diasAbiertos != null), 'diasAbiertos'), desc: sum(lac.filter(a => retiroDe(e, a.id, 'Leche')), 'leche'),
        ccsAlta: lac.filter(a => a.ccs > 400).length
      };
    },
    ave(e) {
      const act = e.lotes.filter(l => l.estado === 'Activo'), eng = act.filter(l => l.tipo === 'Pollos de engorde'), pos = act.filter(l => l.tipo === 'Ponedoras');
      const ref = e.lotes.filter(l => l.tipo === 'Pollos de engorde' && l.edad >= 35).map(l => lm(e, l));
      const P = pos.find(l => l.etapa === 'Postura'), d = P ? P.diario[P.diario.length - 1] : null;
      const cab = { cria: sum(eng.filter(l => l.edad < 15), 'cab'), eng: sum(eng.filter(l => l.edad >= 15), 'cab'), pos: sum(pos, 'cab') };
      return {
        cab, total: cab.cria + cab.eng + cab.pos, epef: avg(ref, 'epef'), fcr: avg(ref, 'fcr'), viab: avg(ref, 'viab'), peso42: avg(ref, 'peso'),
        postura: d ? d.postura : 0, huevos: d ? d.huevos : 0, pesoHuevo: d ? d.pesoHuevo : 0, kgDoc: d && d.huevos ? d.alim / (d.huevos / 12) : 0,
        unif: avg(eng.filter(l => l.uniformidad), 'uniformidad')
      };
    },
    cuy(e) {
      const act = e.lotes.filter(l => l.estado === 'Activo'), pz = act.filter(l => l.tipo === 'Poza de empadre'), mad = pz.filter(l => l.edad >= 75);
      const viv = sum(pz, 'vivos'), sac = e.lotes.filter(l => l.tipo === 'Poza de engorde' && l.edad >= 63).map(l => lm(e, l));
      const cab = { rep: sum(pz, 'hembras') + pz.length, lac: sum(pz, 'lactantes'), rec: sum(act.filter(l => l.etapa === 'Recría'), 'cab'), eng: sum(act.filter(l => l.etapa === 'Engorde'), 'cab') };
      return {
        cab, total: cab.rep + cab.lac + cab.rec + cab.eng, pozas: pz.length,
        camada: sum(pz, 'nacidos') / Math.max(1, sum(pz, 'partos')), fert: sum(mad, 'partos') / Math.max(1, sum(mad, 'hembras')) * 100,
        mortLact: viv ? sum(pz, 'muertes') / viv * 100 : 0, ip: sum(mad, l => l.vivos - l.muertes) / Math.max(1, sum(mad, l => l.hembras * l.edad / 30)),
        peso: avg(sac, 'peso'), fcr: avg(sac, 'fcr')
      };
    }
  };
  // Tablero de referencia (benchmark) · [indicador, valor, meta, decimales, mayor es mejor, unidad, cómo se calcula]
  const BENCH = {
    porcino: (e, k) => [['PSY · destetados por cerda al año', k.psy, e.metas.psy, 1, true, '', 'partos/cerda/año × destetados por parto'], ['Nacidos vivos por parto (NV)', k.nv, e.metas.nv, 2, true, '', 'promedio de partos de 12 meses'], ['Nacidos totales por parto (NT)', k.nt, 12.5, 2, true, '', 'vivos + muertos + momias'], ['Mortalidad predestete', k.mortPre, e.metas.mortPre, 1, false, '%', '1 − destetados ÷ nacidos vivos'], ['Tasa de parición', k.paricion, e.metas.paricion, 1, true, '%', 'servicios que terminan en parto'], ['Partos por cerda al año', k.pca, 2.35, 2, true, '', 'partos de 12 meses ÷ cerdas productivas'], ['Intervalo destete–servicio (IDS)', k.ids, e.metas.ids, 1, false, 'd', 'días del destete al servicio fértil'], ['Días no productivos (DNP)', k.dnp, e.metas.dnp, 0, false, 'd', '365 − partos/año × (gestación + lactancia)'], ['Peso al destete', k.pesoDest, 6.5, 1, true, 'kg', 'promedio por lechón'], ['Ganancia diaria en engorde (GDP)', k.gdp, e.metas.gdp, 0, true, 'g/d', 'desde el ingreso al último pesaje'], ['Conversión alimenticia (FCR)', k.fcr, e.metas.fcr, 2, false, '', 'kg alimento ÷ kg ganados'], ['Mortalidad en engorde', k.mortEng, e.metas.mortEng, 1, false, '%', 'muertes ÷ cabezas ingresadas']],
    vacuno: (e, k) => [['Producción por vaca en ordeño', k.prom, e.metas.leche, 1, true, 'L/d', 'litros del día ÷ vacas en producción'], ['Días en leche promedio (DEL)', k.del, e.metas.del, 0, false, 'd', 'días desde el último parto'], ['Proyección a 305 días', k.p305, 4200, 0, true, 'L', 'curva de Wood escalada al control'], ['Células somáticas del tanque (CCS)', k.ccs, e.metas.ccs, 0, false, 'mil/ml', 'ponderada por litros'], ['Intervalo entre partos (IEP)', k.iep, e.metas.iep, 0, false, 'd', 'último parto − parto anterior'], ['Días abiertos', k.dab, e.metas.dab, 0, false, 'd', 'parto → concepción'], ['Servicios por concepción', k.spc, e.metas.spc, 2, false, '', 'servicios en vacas preñadas'], ['Vacas preñadas (tras espera voluntaria)', k.preñez, e.metas.preñez, 1, true, '%', 'preñadas ÷ vacas con más de 50 DEL'], ['Vacas secas en el hato', k.secas, e.metas.secas, 1, false, '%', 'vacas secas ÷ total vacas']],
    ave: (e, k) => [['Índice de eficiencia productiva (EPEF)', k.epef, e.metas.epef, 0, true, '', 'viabilidad × peso × 100 ÷ (edad × FCR)'], ['Conversión alimenticia (FCR)', k.fcr, e.metas.fcr, 2, false, '', 'kg alimento ÷ kg producidos'], ['Viabilidad', k.viab, e.metas.viab, 1, true, '%', 'aves vivas y vendidas ÷ ingresadas'], ['Peso al beneficio', k.peso42, e.metas.peso42, 2, true, 'kg', 'lotes de 35 días o más'], ['Uniformidad del lote', k.unif, e.metas.unif, 0, true, '%', 'aves dentro de ±10 % del promedio'], ['Postura (gallina-día)', k.postura, e.metas.postura, 1, true, '%', 'huevos ÷ aves presentes'], ['Peso del huevo', k.pesoHuevo, e.metas.pesoHuevo, 1, true, 'g', 'muestra diaria'], ['Alimento por docena de huevos', k.kgDoc, 1.6, 2, false, 'kg', 'kg de alimento ÷ docenas']],
    cuy: (e, k) => [['Tamaño de camada', k.camada, e.metas.camada, 2, true, 'crías', 'nacidos ÷ partos'], ['Fertilidad', k.fert, e.metas.fert, 1, true, '%', 'partos ÷ hembras empadradas'], ['Mortalidad en lactancia', k.mortLact, e.metas.mortLact, 1, false, '%', 'muertes ÷ nacidos vivos'], ['Índice productivo (IP)', k.ip, e.metas.ip, 2, true, '', 'crías logradas ÷ hembra ÷ mes'], ['Peso a la saca', k.peso, e.metas.peso, 2, true, 'kg', 'lotes de 9 semanas o más'], ['Conversión alimenticia', k.fcr, e.metas.fcr, 2, false, '', 'kg alimento ÷ kg ganados']]
  };
  const semaf = (v, m, up) => { if (!m) return 'ok'; const r = up ? v / m : m / Math.max(v, 1e-9); return r >= 1 ? 'ok' : r >= 0.9 ? 'warn' : 'bad'; };

  /* =================== Listas de acción =================== */
  function tareas(e) {
    const T = [], hoy = SIGA.ctx.hoy;
    const add = (prio, f, tipo, ref, det, ev, lbl) => T.push({ prio, f, tipo, ref, det, ev, lbl });
    if (e.key === 'porcino') {
      e.anim.filter(a => a.estado === 'Activa').forEach(a => {
        if (a.rep === 'Gestante') {
          const fal = -dd(a.fParto);
          if (fal <= 7) add(fal <= 2 ? 'Alta' : 'Media', a.fParto, 'Parto probable', a.id, `${fal <= 0 ? 'Parto vencido' : 'En ' + fal + ' día(s)'} · día ${dd(a.fServ)} de gestación · ${a.ubic}`, 'parto', 'Registrar parto');
          if (dd(a.fServ) >= 107 && !/Maternidad/.test(a.ubic)) add('Alta', addD(a.fServ, 107), 'Traslado a maternidad', a.id, 'Día ' + dd(a.fServ) + ' de gestación · lavar y desinfectar la jaula', 'ubic', 'Trasladar');
        }
        if (a.rep === 'Servida' && a.dEst >= 18 && a.dEst < 25) add('Media', addD(a.fServ, 21), 'Control de retorno a celo', a.id, 'Día ' + a.dEst + ' posservicio · revisar con verraco', 'diag', 'Registrar resultado');
        if (a.rep === 'Servida' && a.dEst >= 25) add(a.dEst > 35 ? 'Alta' : 'Media', addD(a.fServ, 28), 'Diagnóstico de gestación', a.id, 'Ecografía · día ' + a.dEst + ' posservicio', 'diag', 'Registrar diagnóstico');
        if (a.rep === 'Lactando' && a.dEst >= 19) add(a.dEst >= 24 ? 'Alta' : 'Media', addD(a.fUltParto, 21), 'Destete', a.id, a.lechones + ' lechones · ' + a.dEst + ' días de lactancia', 'destete', 'Registrar destete');
        if (/Destetada|Repetición|Nulípara/.test(a.rep) && !a.descarte) add(a.rep === 'Repetición' || a.dEst > 7 ? 'Alta' : 'Media', a.rep === 'Nulípara' ? hoy : addD(hoy, Math.max(0, 5 - a.dEst)), a.rep === 'Repetición' ? 'Reservicio (repetición)' : a.rep === 'Nulípara' ? 'Primer servicio de cachorra' : 'Servicio', a.id, a.rep + (a.dEst ? ' hace ' + a.dEst + ' días' : '') + (a.dEst > 7 ? ' · acumula días no productivos' : ''), 'servicio', 'Registrar servicio');
        if (a.descarte) add('Media', hoy, 'Descarte recomendado', a.id, a.descarte + ' · ' + a.par + ' partos', 'descarte', 'Dar de baja');
      });
      e.lotes.filter(l => l.estado === 'Activo').forEach(l => {
        const m = lm(e, l), rt = retiroDe(e, l.id), up = l.pesos[l.pesos.length - 1];
        if (l.tipo === 'Engorde' && m.peso >= l.pesoObj * 0.95) add(rt ? 'Media' : 'Alta', rt ? rt.hasta : hoy, 'Programar saca', l.id, `${l.cab} cab. · ${r1(m.peso)} kg estimado` + (rt ? ` · bloqueado por retiro hasta ${rt.hasta}` : ''), 'saca', 'Registrar saca');
        if (l.tipo === 'Recría' && l.edad >= 63) add(l.edad >= 70 ? 'Alta' : 'Media', addD(hoy, Math.max(0, 70 - l.edad)), 'Pasar a engorde', l.id, l.edad + ' días · ' + r1(m.peso) + ' kg estimado', 'etapa', 'Cambiar de etapa');
        if (up && dd(up[0]) >= 14) add('Baja', addD(up[0], 14), 'Pesaje de control', l.id, 'Último pesaje hace ' + dd(up[0]) + ' días', 'pesaje', 'Registrar pesaje');
      });
    }
    if (e.key === 'vacuno') {
      e.anim.filter(a => /Activ/.test(a.estado)).forEach(a => {
        if ((a.rep === 'Preñada' || a.rep === 'Seca') && a.fParto) { const fal = -dd(a.fParto); if (fal <= 21) add(fal <= 7 ? 'Alta' : 'Media', a.fParto, 'Parto esperado', a.id, (a.nombre ? a.nombre + ' · ' : '') + 'en ' + fal + ' días · preparar potrero de maternidad', 'parto', 'Registrar parto'); }
        if (a.cat === 'Vaca en producción' && a.rep === 'Preñada' && -dd(a.fParto) <= 65) add(-dd(a.fParto) <= 60 ? 'Alta' : 'Media', addD(a.fParto, -60), 'Secado', a.id, (a.nombre || '') + ' · parto el ' + a.fParto + ' · ' + a.leche + ' L/día', 'secado', 'Registrar secado');
        if (a.rep === 'Servida' && a.fServ && dd(a.fServ) >= 35) add('Media', addD(a.fServ, 40), 'Diagnóstico de preñez', a.id, (a.nombre || '') + ' · servida hace ' + dd(a.fServ) + ' días', 'diag', 'Registrar palpación');
        if (a.rep === 'Vacía · en observación de celo') add(a.del > 80 ? 'Alta' : 'Media', hoy, 'Servicio (IA)', a.id, (a.nombre || '') + ' · ' + a.del + ' DEL · vacía', 'servicio', 'Registrar servicio');
        if (a.rep === 'Vacía · espera voluntaria' && a.del >= 42) add('Baja', addD(a.fUltParto, 50), 'Fin de espera voluntaria', a.id, (a.nombre || '') + ' · ' + a.del + ' DEL · revisar para servicio', 'servicio', 'Registrar servicio');
        if (a.cat === 'Vaca en producción' && a.ccs > 400) add('Media', hoy, 'CCS alta · mastitis subclínica', a.id, (a.nombre || '') + ' · ' + a.ccs + ' mil células/ml · prueba CMT y cultivo', 'trat', 'Registrar tratamiento');
        if (a.cat === 'Ternero' && a.lecheCons > 0 && a.edadD >= 80) add('Media', addD(a.nac, 90), 'Destete de ternero', a.id, a.edadD + ' días · ' + a.peso + ' kg', 'destete', 'Registrar destete');
        if (a.cat === 'Vaquillona' && a.rep === 'Vacía · en desarrollo' && a.peso >= 330) add('Baja', hoy, 'Primer servicio de vaquillona', a.id, a.peso + ' kg · apta para servicio', 'servicio', 'Registrar servicio');
      });
    }
    if (e.key === 'ave') {
      e.lotes.filter(l => l.estado === 'Activo').forEach(l => {
        const m = lm(e, l), d = m.dia;
        if (d && d.f !== hoy) add('Media', hoy, 'Registro diario pendiente', l.id, 'Mortalidad, alimento, agua' + (l.tipo === 'Ponedoras' ? ' y huevos' : ''), 'diario', 'Registrar');
        if (l.tipo === 'Pollos de engorde' && l.edad >= 38) add(l.edad >= 42 ? 'Alta' : 'Media', addD(l.fIng, 42), 'Programar beneficio', l.id, `${l.cab} aves · ${m.peso.toFixed(2)} kg · ${l.edad} días`, 'saca', 'Registrar saca');
        if (l.tipo === 'Pollos de engorde' && l.edad > 0 && l.edad % 7 === 0 && !(d && d.peso)) add('Media', hoy, 'Pesaje semanal', l.id, 'Semana ' + l.edad / 7 + ' · muestra de 5 % del lote', 'pesaje', 'Registrar pesaje');
        if (l.tipo === 'Ponedoras' && l.etapa === 'Postura' && d && d.postura < e.metas.postura - 3) add('Media', hoy, 'Postura bajo el estándar', l.id, `${d.postura} % vs ${e.metas.postura} % Hy-Line · revisar luz, agua y alimento`, 'lote', 'Ver lote');
        if (l.tipo === 'Ponedoras' && l.etapa === 'Pre-postura' && l.edad >= 17 * 7) add('Alta', hoy, 'Inicio de postura', l.id, 'Semana ' + Math.round(l.edad / 7) + ' · cambio a alimento de postura y fotoperiodo', 'etapa', 'Cambiar de etapa');
      });
    }
    if (e.key === 'cuy') {
      e.lotes.filter(l => l.estado === 'Activo').forEach(l => {
        if (l.tipo === 'Poza de empadre' && l.lactantes > 0) add('Media', addD(hoy, 2), 'Destete (15 días)', l.id, l.lactantes + ' lactantes · separar a recría', 'destete', 'Registrar destete');
        if (l.tipo === 'Poza de empadre' && l.edad >= 60 && l.edad <= 80 && l.partos < l.hembras) add('Baja', addD(l.fIng, 67), 'Partos esperados', l.id, (l.hembras - l.partos) + ' hembras por parir · día ' + l.edad + ' del empadre', 'parto', 'Registrar parto');
        if (l.etapa === 'Recría' && l.edad >= 28) add('Media', hoy, 'Sexaje y paso a engorde', l.id, l.cab + ' cuyes · ' + l.edad + ' días', 'etapa', 'Cambiar de etapa');
        if (l.etapa === 'Engorde' && l.edad >= 63) add(l.edad >= 70 ? 'Alta' : 'Media', addD(l.fIng, 70 - l.eIng), 'Saca a beneficio', l.id, `${l.cab} cuyes · ${lm(e, l).peso.toFixed(2)} kg estimado`, 'saca', 'Registrar saca');
      });
    }
    (e.plan || []).filter(p => p.estado === 'Programada' && -dd(p.f) <= 10).forEach(p => add(-dd(p.f) <= 2 ? 'Alta' : 'Media', p.f, 'Sanidad programada', p.obj.split(' · ')[0], p.act + ' · ' + p.prod + ' · ' + p.cab + ' cab.', 'aplicar:' + p.id, 'Registrar aplicación'));
    (e.trat || []).filter(t => t.estado === 'En tratamiento').forEach(t => add('Alta', addD(t.f, t.dias), 'Tratamiento en curso', t.ref, t.diag + ' · ' + t.prod + ' · alta prevista ' + addD(t.f, t.dias), 'alta:' + t.id, 'Dar de alta'));
    retiros(e).forEach(r => add('Media', r.hasta, 'Retiro de ' + r.tipo.toLowerCase() + ' vigente', r.ref, r.prod + ' · ' + (r.tipo === 'Leche' ? 'descartar la leche' : 'no enviar a beneficio ni vender') + ' hasta el ' + r.hasta, 'retiro', 'Ver retiro'));
    const cods = new Set([...(e.rac || []).flatMap(x => explota(x, 1).map(y => y.cod)), ...(e.plan || []).filter(p => p.estado === 'Programada').map(p => p.cod)].filter(Boolean));
    cods.forEach(c => { const it = item(c); if (it && it.stock < it.min) add('Media', hoy, 'Insumo bajo el mínimo', it.cod, it.desc + ' · stock ' + it.stock + ' ' + it.um.toLowerCase() + ' (mín. ' + it.min + ')' + (it.pendiente ? ' · pedido ' + it.pendiente : ''), 'alm:' + c, 'Ver kárdex'); });
    const w = { Alta: 0, Media: 1, Baja: 2 };
    return T.sort((a, b) => w[a.prio] - w[b.prio] || sv(a.f) - sv(b.f));
  }

  /* =================== Alimentación: explosión de la ración =================== */
  // Si un ingrediente existe en el almacén (forraje, concentrado) se descuenta por ingrediente;
  // si no, la ración es un balanceado comprado y se descuenta el ítem de la ración.
  const ING = [[/forraje/i, '231100010089'], [/concentrado lechero/i, '231100010073'], [/concentrado cuyes/i, '231100010094']];
  function explota(rac, kg) {
    const out = [];
    rac.ing.forEach(g => { const m = ING.find(x => x[0].test(g[0])); if (m) out.push({ cod: m[1], kg: kg * g[1] / 100, ing: g[0] }); });
    if (!out.length) out.push({ cod: rac.cod, kg, ing: rac.nombre });
    return out.map(o => { const it = item(o.cod); return Object.assign(o, { it, und: it ? (it.um === 'KG' ? Math.round(o.kg) : Math.ceil(o.kg / kgUnidad(it) - 1e-9)) : 0 }); });
  }
  // Requerimiento diario por grupo (población × consumo estándar por cabeza)
  function requerimiento(e) {
    const R = [], add = (rac, grupo, cab, kgCab) => { if (cab > 0) R.push({ rac, grupo, cab, kgCab, kg: cab * kgCab }); };
    const act = e.lotes.filter(l => l.estado === 'Activo');
    if (e.key === 'porcino') {
      const c = r => e.anim.filter(a => a.estado === 'Activa' && r.test(a.rep)), rec = act.filter(l => l.tipo === 'Recría');
      add('R-PC-01', 'Lechones lactantes (creep feeding)', sum(c(/Lactando/), 'lechones'), 0.05); add('R-PC-01', 'Recría inicial (< 35 d)', sum(rec.filter(l => l.edad < 35), 'cab'), 0.45);
      add('R-PC-02', 'Recría', sum(rec.filter(l => l.edad >= 35), 'cab'), 1.1); add('R-PC-03', 'Engorde', sum(act.filter(l => l.tipo === 'Engorde'), 'cab'), 2.5);
      add('R-PC-04', 'Gestantes, servidas y vacías', c(/Gestante|Servida|Destetada|Repetición|Nulípara/).length, 2.4); add('R-PC-04', 'Verracos', e.anim.filter(a => a.cat === 'Verraco' && a.estado === 'Activo').length, 2.6);
      add('R-PC-05', 'Cerdas lactando', c(/Lactando/).length, 6);
    }
    if (e.key === 'vacuno') {
      const v = e.anim.filter(a => /Activ/.test(a.estado));
      add('R-VC-01', 'Vacas de alta producción (≥ 15 L)', v.filter(a => a.cat === 'Vaca en producción' && a.leche >= 15).length, 42);
      add('R-VC-02', 'Vacas de media producción', v.filter(a => a.cat === 'Vaca en producción' && a.leche < 15).length, 38);
      add('R-VC-03', 'Vacas secas, vaquillonas y toro', v.filter(a => /Vaca seca|Vaquillona|Toro/.test(a.cat)).length, 30);
    }
    if (e.key === 'ave') {
      act.filter(l => l.tipo === 'Pollos de engorde').forEach(l => add(l.edad <= 21 ? 'R-AV-01' : 'R-AV-02', 'Lote ' + l.id + ' · ' + l.edad + ' d', l.cab, Math.min(0.215, 0.012 + 0.0045 * Math.max(1, l.edad))));
      act.filter(l => l.tipo === 'Ponedoras').forEach(l => add('R-AV-03', 'Lote ' + l.id + ' · ' + l.etapa.toLowerCase(), l.cab, l.etapa === 'Postura' ? 0.112 : 0.085));
    }
    if (e.key === 'cuy') {
      const pz = act.filter(l => l.tipo === 'Poza de empadre');
      add('R-CU-01', 'Reproductores y lactantes', sum(pz, 'cab'), 0.35); add('R-CU-02', 'Recría y engorde', sum(act.filter(l => l.tipo !== 'Poza de empadre'), 'cab'), 0.12);
    }
    return R;
  }
  function cobertura(e) {
    const req = requerimiento(e), by = {};
    req.forEach(q => { const rac = e.rac.find(r => r.id === q.rac); if (!rac) return; explota(rac, q.kg).forEach(x => { const o = by[x.cod] || (by[x.cod] = { cod: x.cod, it: x.it, kgDia: 0, rac: new Set() }); o.kgDia += x.kg; o.rac.add(rac.id); }); });
    return Object.values(by).filter(o => o.it).map(o => { const kgStock = o.it.stock * kgUnidad(o.it); return Object.assign(o, { kgStock, dias: o.kgDia ? kgStock / o.kgDia : 999, rac: [...o.rac].join(' · ') }); }).sort((a, b) => a.dias - b.dias);
  }

  /* =================== Servicios transversales =================== */
  function evento(e, tipo, ref, cant, det, f) {
    e.eventos.unshift({ f: f || SIGA.ctx.hoy, tipo, ref, cant, det, user: SIGA.ctx.user.nombre, nuevo: true });
    SIGA.log('Control pecuario', tipo, e.nombre + ' · ' + ref, '—', (cant != null ? cant + ' · ' : '') + SIGA.ui.strip(det));
  }
  // Salida de almacén con PECOSA y asiento de consumo (5301 / 1301)
  function pecosa(rows, dest, glosa) {
    const U = SIGA.ui; rows = rows.filter(r => r.cod && r.cant > 0);
    if (!rows.length) return { doc: '', costo: 0 };
    rows.forEach(r => { const it = item(r.cod); if (!it) err('El bien ' + r.cod + ' no existe en el catálogo del almacén'); if (it.stock < r.cant) err(`Stock insuficiente de <b>${U.esc(it.desc)}</b>: disponible ${I(it.stock)} ${it.um.toLowerCase()}, se requiere ${I(r.cant)}`); });
    const A = SIGA.data.abastecimiento.docTipos.pec, n = A.num; A.num = U.pad(+n + 1, n.length);
    const costo = r2(rows.reduce((s, r) => s + r.cant * (SIGA.alm ? SIGA.alm.cprom(r.cod) : item(r.cod).cprom), 0));
    SIGA.alm.salida(rows, dest, 'PECOSA ' + n, 'Jefe del Centro de Producción');
    const as = costo > 0 ? SIGA.asiento(glosa + ' · PECOSA ' + n, [['5301', costo, 0], ['1301', 0, costo]], 'Control pecuario') : null;
    return { doc: 'PECOSA ' + n, costo, as };
  }
  const imputar = (e, ref, rubro, monto) => { const x = findRef(e, ref); if (!x || !monto) return; if (esLote(x)) { x.costo = x.costo || { alim: 0, san: 0, mo: 0, otros: 0, animales: 0 }; x.costo[rubro] = r2((x.costo[rubro] || 0) + monto); } else x.costoAcum = r2((x.costoAcum || 0) + monto); };
  function syncTanque(e) {
    const t = e.tanque && e.tanque[e.tanque.length - 1]; if (!t) return;
    const lac = e.anim.filter(a => a.cat === 'Vaca en producción' && a.estado === 'Activa');
    t.am = Math.round(sum(lac, 'am')); t.pm = Math.round(sum(lac, 'pm')); t.desc = Math.round(sum(lac.filter(a => retiroDe(e, a.id, 'Leche')), 'leche'));
    const disp = t.am + t.pm - t.desc; if (t.planta > disp) t.planta = disp; t.venta = Math.max(0, disp - t.planta);
  }

  // Salida de animales: saca a beneficio, venta en pie o de reproductores, descarte y traslado
  function registrarMov(e, o) {
    const U = SIGA.ui, x = o.x, ext = !/Traslado/.test(o.tipo);
    if (ext) { const rt = retiroDe(e, x.id, 'Carne'); if (rt) err(`<b>${x.id}</b> está en período de retiro por ${U.esc(rt.prod)} hasta el <b>${rt.hasta}</b>: no puede salir a beneficio ni venderse (inocuidad alimentaria · SENASA)`); }
    if (o.cant <= 0) err('Indique la cantidad de animales');
    if (esLote(x)) {
      if (o.cant > x.cab) err(`El lote ${x.id} tiene ${x.cab} animales`);
      if (ext) { x.cab -= o.cant; x.vendidos = (x.vendidos || 0) + o.cant; if (x.tipo === 'Poza de empadre') x.hembras = Math.max(0, x.hembras - o.cant); if (x.cab === 0) { x.estado = 'Cerrado'; x.cierre = o.f; } }
      else x.ubic = o.destino;
    } else if (ext) { x.estado = 'Baja'; x.baja = { f: o.f, motivo: o.motivo || o.tipo, destino: o.destino }; }
    else x.ubic = o.destino;
    const id = 'MV-' + PREF[e.key] + '-' + U.pad(seq(e.mov.map(m => m.id), /-(\d+)$/) + 1, 3);
    const csti = ext ? 'CSTI 10-2026-' + U.pad(D().cstiSeq++, 6) : '';
    let doc = ext ? 'Guía T001-' + U.pad(D().guiaSeq++, 6) : 'Papeleta ' + id.slice(-3), extra = '';
    if (/Venta/.test(o.tipo) && o.cli) {
      const cod = /reproductor/i.test(o.tipo) ? VENTA[e.key][1] : VENTA[e.key][0], p = VP.find(v => v.cod === cod), qty = p.um === 'KGM' ? r1(o.kg) : o.cant;
      const c = SIGA.ventas.emitir({ tipo: o.cli.doc.startsWith('RUC') ? '01' : '03', cli: o.cli.nom, docCli: o.cli.doc, op: o.op || 'Contado', items: [[cod, qty]], medio: o.op === 'Crédito' ? 'Crédito' : 'Transferencia', venc: o.op === 'Crédito' ? addD(o.f, 30) : undefined });
      doc += ' · ' + (c.tipo === '01' ? 'Factura ' : 'Boleta ') + c.doc; extra = ' · ' + (c.tipo === '01' ? 'factura ' : 'boleta ') + c.doc + ' por ' + U.money(c.total);
    }
    if (ext && !/Venta|Muerte/.test(o.tipo) && o.kg > 0) {
      const canal = r1(o.kg * REND[e.key]), base = esLote(x) ? lm(e, x).cKg : (x.costoAcum || 0) / Math.max(1, o.kg), pu = r2(base / REND[e.key] || 0), val = r2(canal * pu);
      SIGA.alm.ingreso([{ cod: CANAL[e.key][0], desc: CANAL[e.key][1], um: 'KG', cant: canal, pu }], 'NIPT ' + id.slice(-3), '', e.unidad);
      if (val > 0) SIGA.asiento('Ingreso de producto terminado · ' + CANAL[e.key][1] + ' · ' + x.id, [['1302', val, 0], ['1301', 0, val]], 'Control pecuario');
      extra = ` · ${I(canal)} kg de canal ingresan al almacén (rendimiento ${Math.round(REND[e.key] * 100)} %)`;
    }
    e.mov.unshift({ id, f: o.f, tipo: o.tipo, ref: x.id, cant: o.cant, kg: r1(o.kg), origen: e.unidad, destino: o.destino, doc, csti, estado: 'Concluido', transp: o.transp || '', nuevo: true });
    evento(e, o.tipo, x.id, o.cant, `${I(o.kg)} kg · ${o.destino}` + (csti ? ' · ' + csti : ''), o.f);
    return { id, csti, doc, extra };
  }

  SIGA.pec = { HOY, P2, pd, fd, addD, dd, sv, inDate, sum, avg, r1, r2, num, int, seq, err, item, kgUnidad, esLote, findRef, refTxt, RET_DEF, REND, PREF, VENTA, CAUSAS, DESTINOS,
    retiros, retiroDe, pesoLote, lm, p305, KP, BENCH, semaf, tareas, explota, requerimiento, cobertura, evento, pecosa, imputar, syncTanque, registrarMov };
})();
