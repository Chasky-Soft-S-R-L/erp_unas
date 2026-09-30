/* ============================================================
   Control pecuario · modelo de datos por especie
   Atributos y procesos tomados de sistemas de referencia:
   · porcinos (tipo PigCHAMP / Agriness): ficha de cerda, servicios, diagnóstico de
     gestación, partos (NT, NV, NM, momias), destete, IDS, DNP, PSY, lotes todo-dentro/todo-fuera
   · lechería (tipo DairyComp 305): días en leche, control lechero, proyección 305 d,
     células somáticas, días abiertos, intervalo entre partos, secado, servicios por concepción
   · avicultura: lotes con registro diario, curva estándar, FCR, viabilidad, EPEF, % postura
   · cuyes (INIA): pozas de empadre, tamaño de camada, índice productivo, destete a 15 d
   · sanidad con período de retiro, alimentación por ración, movilización con CSTI (SENASA),
     costo por lote (tipo software de engorde)
   ============================================================ */
(function () {
  const G = SIGA.gen, r = G.rng(2718);
  const HOY = new Date(2026, 7, 18);
  const P2 = n => String(n).padStart(2, '0');
  const D2 = d => P2(d.getDate()) + '/' + P2(d.getMonth() + 1) + '/' + d.getFullYear();
  const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const ago = n => D2(add(HOY, -n));
  const fwd = n => D2(add(HOY, n));
  const rfid = () => '604 000' + G.int(r, 100, 999) + ' ' + G.pad(G.int(r, 0, 999999), 6);

  /* ---------- Insumos veterinarios y alimentos en el almacén (una sola fuente de stock) ---------- */
  const L = SIGA.data.almacen;
  [
    { cod: '231100090102', desc: 'Oxitetraciclina LA 200 mg · frasco 100 ml', um: 'FRASCO', ubic: 'Cámara fría · CF-02', stock: 16, min: 6, max: 30, cprom: 38, venc: '10/04/2027' },
    { cod: '231100090115', desc: 'Vacuna Newcastle + bronquitis · frasco 1000 dosis', um: 'FRASCO', ubic: 'Cámara fría · CF-01', stock: 9, min: 4, max: 20, cprom: 64, venc: '30/12/2026' },
    { cod: '231100090120', desc: 'Vacuna contra fiebre aftosa · frasco 25 dosis', um: 'FRASCO', ubic: 'Cámara fría · CF-01', stock: 7, min: 4, max: 16, cprom: 95, venc: '15/02/2027' },
    { cod: '231100090131', desc: 'Hierro dextrano 200 mg · frasco 100 ml', um: 'FRASCO', ubic: 'Cámara fría · CF-02', stock: 11, min: 5, max: 24, cprom: 29.5, venc: '20/05/2027' },
    { cod: '231100090144', desc: 'Pomo intramamario para mastitis · caja x 24', um: 'CAJA', ubic: 'Cámara fría · CF-02', stock: 5, min: 3, max: 12, cprom: 168, venc: '31/01/2027' },
    { cod: '231100090151', desc: 'Semen congelado Brown Swiss · pajilla', um: 'PAJILLA', ubic: 'Termo de nitrógeno · TN-01', stock: 42, min: 20, max: 80, cprom: 45 },
    { cod: '231100090163', desc: 'Dosis seminal porcina Duroc · 80 ml', um: 'DOSIS', ubic: 'Conservadora 17 °C · CS-01', stock: 18, min: 12, max: 40, cprom: 32, venc: '22/08/2026' },
    { cod: '231100010052', desc: 'Alimento balanceado pollo inicio · saco 40 kg', um: 'SACO', ubic: 'Granja · G-03', stock: 64, min: 30, max: 160, cprom: 96 },
    { cod: '231100010066', desc: 'Alimento ponedora fase 1 · saco 40 kg', um: 'SACO', ubic: 'Granja · G-04', stock: 48, min: 30, max: 140, cprom: 88 },
    { cod: '231100010073', desc: 'Concentrado vacas en producción · saco 50 kg', um: 'SACO', ubic: 'Establo · E-01', stock: 58, min: 25, max: 120, cprom: 82 },
    { cod: '231100010089', desc: 'Forraje verde picado (maíz chala) · kg', um: 'KG', ubic: 'Establo · silo S-01', stock: 18400, min: 6000, max: 40000, cprom: 0.18 },
    { cod: '231100010094', desc: 'Alimento balanceado cuyes · saco 40 kg', um: 'SACO', ubic: 'Galpón de cuyes · GC-01', stock: 22, min: 10, max: 50, cprom: 74 }
  ].forEach(i => { if (!L.items.some(x => x.cod === i.cod)) L.items.push(i); });

  const E = {};

  /* =================== PORCINOS · Granja porcina =================== */
  (function () {
    const anim = [], lotes = [], eventos = [];
    const RAZ = ['Landrace × Large White', 'Large White', 'Landrace', 'Landrace × Large White', 'Camborough'];
    // Estado reproductivo de cada cerda: [id, paridad, estado, díasEnEstado, extra]
    const PLAN = [
      ['M-014', 5, 'Lactando', 1, { nt: 12, nv: 11 }], ['M-017', 4, 'Lactando', 8, { nt: 11, nv: 10 }], ['M-011', 3, 'Lactando', 21, { nt: 13, nv: 12 }], ['M-026', 2, 'Lactando', 14, { nt: 11, nv: 11 }], ['M-005', 6, 'Lactando', 25, { nt: 12, nv: 10 }],
      ['M-021', 3, 'Gestante', 112, {}], ['M-003', 4, 'Gestante', 108, {}], ['M-019', 2, 'Gestante', 96, {}], ['M-007', 5, 'Gestante', 88, {}], ['M-024', 1, 'Gestante', 81, {}], ['M-012', 3, 'Gestante', 74, {}],
      ['M-001', 6, 'Gestante', 66, {}], ['M-015', 2, 'Gestante', 59, {}], ['M-022', 4, 'Gestante', 52, {}], ['M-008', 3, 'Gestante', 45, {}], ['M-018', 1, 'Gestante', 38, {}], ['M-027', 2, 'Gestante', 31, {}],
      ['M-009', 3, 'Servida', 4, {}], ['M-023', 1, 'Servida', 11, {}], ['M-004', 5, 'Servida', 23, {}], ['M-016', 2, 'Servida', 27, {}],
      ['M-002', 7, 'Destetada', 6, {}], ['M-010', 4, 'Destetada', 3, {}], ['M-013', 2, 'Destetada', 9, {}], ['M-025', 3, 'Repetición', 2, {}],
      ['M-006', 8, 'Destetada', 12, { descarte: 'Baja prolificidad (8.º parto)' }], ['M-028', 0, 'Nulípara', 0, {}], ['M-029', 0, 'Nulípara', 0, {}]
    ];
    const MACHO = ['V-02 · Duroc', 'IA · Duroc (dosis 80 ml)', 'V-01 · Duroc', 'IA · Pietrain', 'V-03 · Pietrain'];
    PLAN.forEach(([id, par, est, d, x], k) => {
      const partos = [];
      // Fecha del último parto según el estado actual (parto → lactancia → destete → IDS → servicio)
      const ult = par === 0 ? null : est === 'Lactando' ? add(HOY, -d) : est === 'Gestante' || est === 'Servida' ? add(HOY, -d - G.int(r, 4, 7) - G.int(r, 20, 24)) : est === 'Repetición' ? add(HOY, -d - 21 - G.int(r, 4, 7) - G.int(r, 20, 24)) : add(HOY, -d - G.int(r, 20, 24));
      let fp = ult;
      for (let p = par; p >= 1; p--) {
        const cur = p === par && est === 'Lactando';
        const nt = p === par && x.nt ? x.nt : G.int(r, 9, 15), mom = nt > 12 ? G.int(r, 0, 1) : 0, nm = p === par && x.nv ? nt - x.nv - mom : G.int(r, 0, 2), nv = nt - nm - mom;
        const lact = G.int(r, 20, 24), dest = cur ? null : Math.max(0, nv - G.int(r, 0, 2));
        partos.push({ n: p, f: D2(fp), nt, nv, nm, mom, dest, fDest: cur ? '' : D2(add(fp, lact)), lact: cur ? null : lact, pesoDest: cur ? null : Math.round((6.2 + r() * 1.4) * 10) / 10, ids: G.int(r, 4, 7) });
        fp = add(fp, -(114 + G.int(r, 20, 24) + G.int(r, 4, 7)));
      }
      partos.reverse();
      const up = partos[partos.length - 1];
      const fServ = est === 'Gestante' || est === 'Servida' ? D2(add(HOY, -d)) : est === 'Repetición' ? D2(add(HOY, -d - 21)) : '';
      const serv = [];
      partos.forEach(pp => serv.push({ f: D2(add(new Date(+pp.f.slice(6), +pp.f.slice(3, 5) - 1, +pp.f.slice(0, 2)), -114)), macho: G.pick(r, MACHO), res: 'Parto' }));
      if (k % 7 === 3 && partos.length > 1) serv.splice(serv.length - 1, 0, { f: '—', macho: G.pick(r, MACHO), res: 'Repetición' });
      if (fServ) serv.push({ f: fServ, macho: id === 'M-009' ? 'V-02 · Duroc' : id === 'M-023' ? 'IA · Duroc (dosis 80 ml)' : G.pick(r, MACHO), res: est === 'Repetición' ? 'Repetición' : 'En curso' });
      const lechones = est === 'Lactando' ? up.nv - (id === 'M-011' ? 1 : G.int(r, 0, 1)) : 0;
      anim.push({
        id, rfid: rfid(), cat: par === 0 ? 'Primeriza' : 'Reproductora', sexo: 'H', raza: RAZ[k % RAZ.length], nac: D2(add(HOY, -(210 + par * 150 + G.int(r, 0, 40)))),
        madre: 'M-0' + G.pad(G.int(r, 1, 60) + 30, 2) + ' (histórica)', padre: G.pick(r, ['V-01 · Duroc', 'IA · Landrace PIC', 'IA · Large White']),
        ubic: est === 'Lactando' ? 'Maternidad · jaula MT-' + P2(k + 1) : est === 'Gestante' && d > 108 ? 'Maternidad · jaula MT-' + P2(k + 1) : est === 'Gestante' ? 'Gestación · G-' + P2(k + 1) : 'Servicio · S-' + P2(k % 8 + 1),
        par, rep: est, dEst: d, fServ, macho: fServ ? serv[serv.length - 1].macho : '', diag: est === 'Gestante' ? (d >= 28 ? 'Positivo · ecografía día ' + G.int(r, 24, 30) : 'Pendiente') : est === 'Servida' ? 'Pendiente' : '',
        fParto: est === 'Gestante' || est === 'Servida' ? D2(add(HOY, 114 - d)) : '', fUltParto: up ? up.f : '', lechones, partos, serv,
        cc: Math.round((2.6 + r() * 0.9) * 10) / 10, peso: G.int(r, 165, 265), estado: 'Activa', descarte: x.descarte || '', costoAcum: G.amt(r, 2600, 5200, 10)
      });
    });
    // Verracos
    [['V-01', 'Duroc', '12/03/2023', 38, 86], ['V-02', 'Duroc', '10/01/2022', 46, 88], ['V-03', 'Pietrain', '22/09/2024', 12, 83]].forEach(v => anim.push({ id: v[0], rfid: rfid(), cat: 'Verraco', sexo: 'M', raza: v[1], nac: v[2], madre: 'Centro genético · compra', padre: '—', ubic: 'Verraquera · VR-0' + v[0].slice(-1), par: 0, rep: 'Activo', dEst: 0, servicios: v[3], fertilidad: v[4], ultServ: v[0] === 'V-02' ? '14/08/2026' : ago(G.int(r, 3, 12)), cc: 3.2, peso: G.int(r, 260, 320), estado: 'Activo', partos: [], serv: [], costoAcum: G.amt(r, 3500, 6200, 10) }));
    // Lotes todo-dentro/todo-fuera (recría y engorde) · pesajes contra la curva estándar por edad
    // Curva estándar de crecimiento (kg por edad en días) · ≈ 100 kg a 165 días
    const TAB = [[0, 1.4], [21, 6.5], [42, 12], [63, 23], [70, 27], [100, 48], [128, 69], [150, 87], [165, 100], [180, 111]];
    const STD = d => { for (let i = 1; i < TAB.length; i++) if (d <= TAB[i][0]) { const [a, pa] = TAB[i - 1], [b, pb] = TAB[i]; return Math.round((pa + (pb - pa) * (d - a) / (b - a)) * 10) / 10; } return 111; };
    [['L-229', 'Recría', 'Recría · R-01', 58, 30, 30, 'M-022 · M-015 · M-001'], ['L-231', 'Recría', 'Recría · R-02', 42, 38, 39, 'M-002 · M-010 · M-013'], ['L-233', 'Recría', 'Recría · R-03', 31, 52, 53, 'M-006 · M-025 · M-016 · M-004'],
     ['E-125', 'Engorde', 'Engorde · C-04', 88, 28, 29, 'L-224'], ['E-123', 'Engorde', 'Engorde · C-03', 108, 31, 32, 'L-222'], ['E-121', 'Engorde', 'Engorde · C-02', 128, 24, 25, 'L-219'], ['E-118', 'Engorde', 'Engorde · C-01', 164, 6, 27, 'L-214']
    ].forEach(([id, etapa, ubic, edad, cab, cabIni, origen]) => {
      const fIng = D2(add(HOY, -(edad - (etapa === 'Recría' ? 21 : 70)))), eIng = etapa === 'Recría' ? 21 : 70, f = 0.94 + r() * 0.1;
      const pesos = []; for (let e = eIng; e <= edad; e += 14) pesos.push([D2(add(HOY, -(edad - e))), e, Math.round(STD(e) * (e === eIng ? 1 : f) * 10) / 10]);
      if (pesos[pesos.length - 1][1] !== edad) pesos.push([D2(add(HOY, -(edad - Math.min(edad, pesos[pesos.length - 1][1] + 7)))), Math.min(edad, pesos[pesos.length - 1][1] + 7), Math.round(STD(Math.min(edad, pesos[pesos.length - 1][1] + 7)) * f * 10) / 10]);
      const pa = pesos[pesos.length - 1][2], pi = pesos[0][2], vendidos = id === 'E-118' ? 20 : 0, muertes = cabIni - cab - vendidos;
      const gan = (pa - pi) * cab + (id === 'E-118' ? 20 * (97.5 - pi) : 0), fcr = etapa === 'Recría' ? 1.55 + r() * 0.15 : 2.75 + r() * 0.35, alim = Math.round(gan * fcr);
      lotes.push({ id, tipo: etapa, etapa, ubic, linea: 'Híbrido comercial (Camborough × Duroc)', fIng, eIng, edad, cabIni, cab, muertes, vendidos, pesos, alim, fcr: Math.round(fcr * 100) / 100, origen,
        costo: { alim: Math.round(alim * (etapa === 'Recría' ? 2.8 : 2.54)), san: G.amt(r, 180, 900, 10), mo: G.amt(r, 600, 2400, 10), otros: G.amt(r, 150, 700, 10), animales: cabIni * (etapa === 'Recría' ? 95 : 180) }, estado: 'Activo', pesoObj: 100, std: 'porcino' });
    });
    lotes.push({ id: 'E-114', tipo: 'Engorde', etapa: 'Engorde', ubic: 'Engorde · C-05', linea: 'Híbrido comercial (Camborough × Duroc)', fIng: '28/02/2026', eIng: 70, edad: 168, cabIni: 26, cab: 0, muertes: 1, vendidos: 25, pesos: [['28/02/2026', 70, 31.2], ['06/06/2026', 168, 99.4]], alim: 4620, fcr: 2.79, origen: 'L-209', costo: { alim: 11735, san: 640, mo: 2180, otros: 520, animales: 4680 }, estado: 'Cerrado', cierre: '06/06/2026', pesoObj: 100, std: 'porcino' });
    E.porcino = {
      key: 'porcino', nombre: 'Porcinos', icon: 'fa-piggy-bank', unidad: 'Granja porcina', cc: '104.07.13.03.02',
      sub: 'Ciclo completo · de la cerda a la saca (gestación 114 d · lactancia 21 d · engorde hasta 100 kg)', gest: 114,
      anim, lotes, eventos, stdPeso: STD,
      metas: { psy: 24, nv: 11.5, mortPre: 10, paricion: 85, ids: 6, dnp: 45, gdp: 700, fcr: 2.9, mortEng: 3 }
    };
  })();

  /* =================== VACUNOS · Establo lechero =================== */
  (function () {
    const anim = [];
    const NOM = ['Canela', 'Luna', 'Estrella', 'Paloma', 'Rosita', 'Margarita', 'Negra', 'Chola', 'Princesa', 'Duquesa', 'Morena', 'Linda', 'Perla', 'Gitana', 'Violeta', 'Mariposa', 'Jazmín', 'Flor', 'Dalia', 'Azucena', 'Clavel', 'Camelia', 'Gardenia', 'Magnolia', 'Orquídea', 'Begonia', 'Lirio', 'Amapola', 'Hortensia', 'Tulipán', 'Alelí', 'Violeta II', 'Dulce'];
    const RAZ = ['Brown Swiss', 'Gyr × Holstein', 'Holstein', 'Brown Swiss', 'Jersey × Brown Swiss', 'Gyrolando'];
    const wood = (t, k) => 9.2 * k * Math.pow(Math.max(1, t), 0.21) * Math.exp(-0.0042 * t);
    const p305 = k => { let s = 0; for (let t = 1; t <= 305; t++) s += wood(t, k); return Math.round(s); };
    for (let i = 1; i <= 33; i++) {
      const id = 'V-' + P2(i), lact = i === 7 ? 4 : G.int(r, 1, 6), k = (0.85 + r() * 0.3) * (lact === 1 ? 0.86 : 1);
      let del, rep, fServ = '', diag = '', nServ = 0, fParto = '', dab = null;
      // Días en leche: las madres de los terneros registrados paren en la fecha de nacimiento de su cría
      const MADRES = { 7: 1, 12: 9, 20: 23, 4: 37, 15: 52, 9: 68, 18: 85, 22: 110, 2: 150 }, RESTO = [18, 30, 44, 58, 64, 72, 96, 121, 138, 166, 188, 212, 239, 262, 291];
      if (i === 3 || i > 24) { del = 0; rep = 'Seca'; }
      else { del = MADRES[i] != null ? MADRES[i] : RESTO[(i * 7) % RESTO.length]; rep = del < 50 ? 'Vacía · espera voluntaria' : del < 80 ? (i % 2 ? 'Servida' : 'Vacía · en observación de celo') : 'Preñada'; }
      if (rep === 'Servida') { const ds = Math.min(del - 50, G.int(r, 8, 30)); fServ = ago(ds); diag = ds >= 30 ? 'Pendiente de palpación' : 'Pendiente'; nServ = G.int(r, 1, 2); fParto = fwd(283 - ds); }
      if (rep === 'Preñada') { const ds = Math.max(35 + (i * 7) % 30, del - G.int(r, 60, 110)); fServ = ago(ds); diag = 'Positivo · palpación rectal día ' + G.int(r, 40, 60); nServ = G.int(r, 1, 3); fParto = fwd(283 - ds); }
      if (rep === 'Preñada') dab = del - Math.round((HOY - new Date(+fServ.slice(6), +fServ.slice(3, 5) - 1, +fServ.slice(0, 2))) / 864e5);
      if (rep === 'Seca') { const ds = G.int(r, 225, 270); fServ = ago(ds); diag = 'Positivo'; nServ = G.int(r, 1, 3); fParto = fwd(283 - ds); dab = G.int(r, 85, 150); del = ds + dab; }
      const lecheD = rep === 'Seca' ? 0 : Math.round(wood(del, k) * 10) / 10;
      const ultParto = ago(del);
      const partos = []; for (let p = lact; p >= 1; p--) partos.push({ n: p, f: p === lact ? ultParto : ago(del + (lact - p) * G.int(r, 380, 440) + (rep === 'Seca' ? 330 : 0)), cria: 'T-' + G.int(r, 1900, 2199), sexo: G.pick(r, ['Macho', 'Hembra']), peso: G.int(r, 30, 42), facilidad: G.pick(r, ['Normal', 'Normal', 'Normal', 'Asistido']), leche305: p305(k * (0.9 + r() * 0.15)) });
      partos.reverse();
      anim.push({
        id, nombre: NOM[i - 1], rfid: rfid(), cat: rep === 'Seca' ? 'Vaca seca' : 'Vaca en producción', sexo: 'H', raza: RAZ[i % RAZ.length], nac: ago(lact * 400 + 800 + G.int(r, 0, 200)),
        madre: 'V-' + G.int(r, 40, 90) + ' (histórica)', padre: G.pick(r, ['IA · Brown Swiss "Jongleur"', 'IA · Holstein "Mogul"', 'TO-01 · Brown Swiss "Inca"', 'IA · Gyr "Radar"']),
        ubic: rep === 'Seca' ? 'Potrero de secas · P-06' : del < 100 ? 'Corral alta producción · CA' : 'Corral media producción · CM', lact, del: rep === 'Seca' ? 0 : del, dpp: del, rep, fServ, diag, nServ, fParto, fUltParto: ultParto,
        leche: lecheD, am: Math.round(lecheD * 0.56 * 10) / 10, pm: Math.round(lecheD * 0.44 * 10) / 10, p305: p305(k), ccs: G.pick(r, [85, 120, 150, 180, 210, 240, 310, 95, 140, 460, 130, 170, 620]),
        cc: Math.round((2.5 + r() * 1) * 4) / 4, peso: G.int(r, 430, 610), partos, iep: lact > 1 ? G.int(r, 385, 470) : null, diasAbiertos: dab, estado: 'Activa', costoAcum: G.amt(r, 5200, 9800, 10)
      });
    }
    // Vaquillonas, terneros y toro
    for (let i = 1; i <= 8; i++) { const ed = G.int(r, 13, 26), serv = ed >= 15; anim.push({ id: 'VQ-' + P2(i), nombre: NOM[(i * 5) % NOM.length] + ' (vaq.)', rfid: rfid(), cat: 'Vaquillona', sexo: 'H', raza: G.pick(r, RAZ), nac: ago(ed * 30), madre: 'V-' + P2(G.int(r, 1, 33)), padre: 'IA · Brown Swiss "Jongleur"', ubic: 'Potrero de recría · P-04', lact: 0, del: 0, rep: serv ? (i % 3 ? 'Preñada' : 'Servida') : 'Vacía · en desarrollo', fServ: serv ? ago(G.int(r, 10, 180)) : '', diag: serv ? (i % 3 ? 'Positivo' : 'Pendiente') : '', nServ: serv ? 1 : 0, fParto: '', fUltParto: '', leche: 0, ccs: null, cc: 3, peso: G.int(r, 280, 420), partos: [], estado: 'Activa', costoAcum: G.amt(r, 2200, 4200, 10) }); const a = anim[anim.length - 1]; if (a.fServ) a.fParto = D2(add(new Date(+a.fServ.slice(6), +a.fServ.slice(3, 5) - 1, +a.fServ.slice(0, 2)), 283)); }
    [['T-2208', 1, 'Macho', 'V-07', 38], ['T-2207', 9, 'Hembra', 'V-' + P2(12), 36], ['T-2206', 23, 'Hembra', 'V-' + P2(20), 34], ['T-2205', 37, 'Macho', 'V-' + P2(4), 40], ['T-2204', 52, 'Hembra', 'V-' + P2(15), 35], ['T-2203', 68, 'Macho', 'V-' + P2(9), 39], ['T-2202', 85, 'Hembra', 'V-' + P2(18), 33], ['T-2201', 110, 'Hembra', 'V-' + P2(22), 37], ['T-2199', 150, 'Macho', 'V-' + P2(2), 41]].forEach(t => anim.push({ id: t[0], nombre: '', rfid: rfid(), cat: 'Ternero', sexo: t[2] === 'Macho' ? 'M' : 'H', raza: 'Brown Swiss × Gyr', nac: ago(t[1]), madre: t[3], padre: 'IA · Brown Swiss "Jongleur"', ubic: t[1] < 60 ? 'Becerrera · B-0' + (t[1] % 4 + 1) : 'Potrero de recría · P-03', lact: 0, del: 0, rep: '—', leche: 0, lecheCons: t[1] < 90 ? 4 : 0, cc: 3, peso: Math.round(t[4] + t[1] * 0.62), pesoNac: t[4], partos: [], estado: 'Activo', edadD: t[1], costoAcum: G.amt(r, 300, 1400, 10) }));
    anim.push({ id: 'TO-01', nombre: 'Inca', rfid: rfid(), cat: 'Toro', sexo: 'M', raza: 'Brown Swiss', nac: '14/05/2021', madre: 'Centro genético · compra', padre: 'Importado', ubic: 'Corral de toro · CT', lact: 0, del: 0, rep: 'Activo', leche: 0, cc: 3.5, peso: 780, partos: [], estado: 'Activo', costoAcum: 12800 });
    // Tanque de leche de los últimos 14 días (el día 0 es el ordeño de hoy)
    const hoyL = Math.round(anim.filter(a => a.cat === 'Vaca en producción').reduce((s, a) => s + a.leche, 0));
    const tanque = []; for (let d = 13; d >= 0; d--) { const tot = d === 0 ? hoyL : Math.round(hoyL * (0.965 + r() * 0.05) - d * 0.4); tanque.push({ f: ago(d), am: Math.round(tot * 0.56), pm: tot - Math.round(tot * 0.56), desc: d <= 1 ? Math.round(anim.find(a => a.id === 'V-12').leche) : d < 9 ? 0 : G.int(r, 0, 12), planta: Math.round(tot * 0.72), venta: 0, grasa: Math.round((3.6 + r() * 0.4) * 100) / 100, st: Math.round((12.2 + r() * 0.6) * 100) / 100 }); const x = tanque[tanque.length - 1]; x.venta = x.am + x.pm - x.desc - x.planta; }
    E.vacuno = { key: 'vacuno', nombre: 'Vacunos de leche', icon: 'fa-cow', unidad: 'Establo lechero', cc: '104.07.13.03.03', sub: 'Doble propósito · control lechero diario, reproducción y calidad de leche (espera voluntaria 50 d · gestación 283 d · secado 60 d antes del parto)', gest: 283, anim, lotes: [], eventos: [], tanque, wood,
      metas: { leche: 14, del: 180, ccs: 250, iep: 400, dab: 110, spc: 1.8, preñez: 60, secas: 20 } };
  })();

  /* =================== AVES · Unidad avícola =================== */
  (function () {
    const COBB = [0.042, 0.19, 0.47, 0.93, 1.53, 2.19, 2.86]; // peso estándar por semana (kg)
    const stdAve = d => { const w = d / 7, i = Math.min(5, Math.floor(w)); return Math.round((COBB[i] + (COBB[i + 1] - COBB[i]) * (w - i)) * 1000) / 1000; };
    const consStd = d => Math.min(0.215, 0.012 + 0.0045 * d); // kg/ave/día
    const lotes = [];
    const engorde = (id, galpon, ing, cabIni, f, estado) => {
      const edad = Math.round((HOY - new Date(+ing.slice(6), +ing.slice(3, 5) - 1, +ing.slice(0, 2))) / 864e5), diario = [];
      let aves = cabIni, alim = 0, muertes = 0;
      for (let d = 1; d <= Math.min(edad, estado === 'Cerrado' ? 42 : edad); d++) { const m = d < 4 ? G.int(r, 0, 3) : G.int(r, 0, 1); aves -= m; muertes += m; const c = aves * consStd(d) * (0.97 + r() * 0.06); alim += c; if (edad - d < 14 || estado === 'Cerrado' && d > 28) diario.push({ f: D2(add(new Date(+ing.slice(6), +ing.slice(3, 5) - 1, +ing.slice(0, 2)), d)), edad: d, aves, muertes: m, alim: Math.round(c), agua: Math.round(c * 1.8), peso: d % 7 === 0 ? Math.round(stdAve(d) * f * 1000) / 1000 : null }); }
      const pesos = []; for (let w = 0; w * 7 <= Math.min(edad, 42); w++) pesos.push([D2(add(new Date(+ing.slice(6), +ing.slice(3, 5) - 1, +ing.slice(0, 2)), w * 7)), w * 7, w === 0 ? 0.042 : Math.round(stdAve(w * 7) * f * 1000) / 1000]);
      lotes.push({ id, tipo: 'Pollos de engorde', etapa: edad < 14 ? 'Cría' : 'Engorde', ubic: galpon, linea: 'Cobb 500', fIng: ing, eIng: 1, edad: Math.min(edad, estado === 'Cerrado' ? 42 : edad), cabIni, cab: estado === 'Cerrado' ? 0 : aves, muertes, vendidos: estado === 'Cerrado' ? aves : 0, pesos, alim: Math.round(alim), diario, estado, pesoObj: 2.5, std: 'ave', uniformidad: G.int(r, 82, 91),
        costo: { alim: Math.round(alim * 2.35), san: G.amt(r, 180, 520, 10), mo: G.amt(r, 400, 1400, 10), otros: G.amt(r, 200, 800, 10), animales: Math.round(cabIni * 2.6) }, cierre: estado === 'Cerrado' ? D2(add(new Date(+ing.slice(6), +ing.slice(3, 5) - 1, +ing.slice(0, 2)), 42)) : '' });
    };
    engorde('G3', 'Galpón 3', '18/08/2026', 600, 1, 'Activo');
    engorde('G2-09', 'Galpón 2 · sección A', '28/07/2026', 600, 0.99, 'Activo');
    engorde('G2-08', 'Galpón 2 · sección B', '07/07/2026', 1280, 0.985, 'Activo');
    engorde('G2-07', 'Galpón 1', '01/07/2026', 660, 0.868, 'Cerrado');
    lotes.find(l => l.id === 'G3').cab = 600; lotes.find(l => l.id === 'G3').muertes = 0; lotes.find(l => l.id === 'G3').diario = [{ f: '18/08/2026', edad: 0, aves: 600, muertes: 0, alim: 7, agua: 15, peso: 0.042 }];
    const pos = (id, galpon, ing, sem, aves0, aves, postura) => { const diario = []; for (let d = 13; d >= 0; d--) { const p = postura ? Math.min(0.95, postura + (r() - 0.5) * 0.04) : 0; const h = Math.round(aves * p); diario.push({ f: ago(d), edad: sem * 7 - d, aves, muertes: G.int(r, 0, 1), alim: Math.round(aves * (postura ? 0.112 : 0.085)), agua: Math.round(aves * 0.22), huevos: h, rotos: Math.round(h * 0.012), pesoHuevo: postura ? Math.round((60.8 + r() * 2.4) * 10) / 10 : null, postura: Math.round(p * 1000) / 10 }); }
      lotes.push({ id, tipo: 'Ponedoras', etapa: postura > 0.5 ? 'Postura' : 'Pre-postura', ubic: galpon, linea: 'Hy-Line Brown', fIng: ing, eIng: 1, edad: sem * 7, cabIni: aves0, cab: aves, muertes: aves0 - aves, vendidos: 0, pesos: [[ago(7), sem * 7 - 7, postura > 0.5 ? 1.94 : 1.49], [ago(0), sem * 7, postura > 0.5 ? 1.96 : 1.56]], alim: Math.round(aves * sem * 7 * 0.078), diario, estado: 'Activo', std: 'ponedora', postStd: postura > 0.5 ? 0.9 : 0,
        costo: { alim: Math.round(aves * sem * 7 * 0.078 * 2.2), san: G.amt(r, 400, 1200, 10), mo: G.amt(r, 2400, 5200, 10), otros: G.amt(r, 600, 1800, 10), animales: aves0 * 9 } }); };
    pos('P-01', 'Galpón de postura · jaulas A', '12/10/2025', 42, 450, 420, 0.82);
    pos('P-02', 'Galpón de postura · jaulas B', '03/05/2026', 18, 390, 380, 0.08);
    E.ave = { key: 'ave', nombre: 'Aves', icon: 'fa-dove', unidad: 'Unidad avícola', cc: '104.07.13.03.04', sub: 'Pollos de engorde Cobb 500 (beneficio a 42 d · 2.5 kg) y ponedoras Hy-Line Brown · registro diario por lote', anim: [], lotes, eventos: [], stdPeso: stdAve,
      metas: { epef: 350, fcr: 1.75, viab: 95, peso42: 2.8, postura: 88, pesoHuevo: 60, unif: 85 } };
  })();

  /* =================== CUYES · Galpón de cuyes =================== */
  (function () {
    const lotes = [], LIN = ['Perú', 'Andina', 'Inti', 'Perú'];
    for (let i = 1; i <= 18; i++) {
      const hem = i === 10 ? 9 : 10, ed = G.int(r, 20, 140), partos = Math.min(hem, Math.round(hem * (ed > 70 ? 0.9 : ed / 90))), nac = Math.round(partos * (2.6 + r() * 0.6)), viv = nac - G.int(r, 0, 3), mL = G.int(r, 0, 2);
      lotes.push({ id: 'P-' + P2(i), tipo: 'Poza de empadre', etapa: 'Empadre', ubic: 'Galpón de cuyes · nave ' + (i <= 9 ? 'A' : 'B'), linea: LIN[i % 4], fIng: ago(i === 10 ? 12 : ed), eIng: 90, edad: i === 10 ? 12 : ed, hembras: hem, macho: 'CM-' + P2(i), cabIni: hem + 1, cab: hem + 1 + Math.max(0, viv - mL - (ed > 30 ? viv : 0)), muertes: mL, vendidos: 0, partos: i === 10 ? 0 : partos, nacidos: i === 10 ? 0 : nac, vivos: i === 10 ? 0 : viv, destetados: i === 10 ? 0 : Math.max(0, viv - mL - (ed <= 30 ? viv : 0)), lactantes: i === 10 ? 0 : (ed <= 30 ? viv - mL : 0), pesos: [[ago(ed), 90, 0.95], [ago(0), 90 + ed, 1.25 + r() * 0.2]], alim: Math.round((hem + 1) * ed * 0.06), estado: 'Activo', std: 'cuy',
        costo: { alim: Math.round((hem + 1) * ed * 0.06 * 1.9), san: G.amt(r, 20, 90, 5), mo: G.amt(r, 60, 240, 10), otros: G.amt(r, 20, 90, 5), animales: (hem + 1) * 45 } });
    }
    const stdCuy = d => Math.round((0.15 + 0.0112 * d) * 1000) / 1000; // ≈ 0.9 kg a 70 días
    [['R-04', 'Recría', 38, 36, 21], ['R-05', 'Recría', 44, 44, 28], ['R-06', 'Recría', 40, 40, 16], ['E-11', 'Engorde', 30, 0, 72], ['E-12', 'Engorde', 28, 4, 70], ['E-13', 'Engorde', 34, 34, 58], ['E-14', 'Engorde', 36, 35, 49]].forEach(([id, etapa, ini, cab, edad]) => {
      const pesos = []; for (let e = 15; e <= edad; e += 7) pesos.push([ago(edad - e), e, Math.round(stdCuy(e) * (0.95 + r() * 0.08) * 1000) / 1000]);
      lotes.push({ id, tipo: etapa === 'Recría' ? 'Poza de recría' : 'Poza de engorde', etapa, ubic: 'Galpón de cuyes · nave C', linea: 'Perú mejorado', fIng: ago(edad - 15), eIng: 15, edad, cabIni: ini, cab, muertes: id === 'R-04' ? 3 : ini - cab - (etapa === 'Engorde' && edad >= 70 ? cab === 0 ? ini - 1 : ini - cab - 1 : 0), vendidos: id === 'E-11' ? 29 : id === 'E-12' ? 23 : 0, pesos, alim: Math.round(ini * edad * 0.045), estado: cab === 0 ? 'Cerrado' : 'Activo', pesoObj: 0.9, std: 'cuy',
        costo: { alim: Math.round(ini * edad * 0.045 * 1.9), san: G.amt(r, 20, 80, 5), mo: G.amt(r, 80, 260, 10), otros: G.amt(r, 20, 80, 5), animales: ini * 6 } });
    });
    lotes.forEach(l => { if (l.id === 'E-12') l.muertes = 1; if (l.id === 'E-11') l.muertes = 1; if (l.id === 'R-04') l.muertes = 2; });
    E.cuy = { key: 'cuy', nombre: 'Cuyes', icon: 'fa-paw', unidad: 'Galpón de cuyes', cc: '104.07.13.03.05', sub: 'Empadre continuo en pozas (1 macho × 10 hembras) · gestación ~67 d · destete a 15 d · saca a 10 semanas con 0.9 kg', gest: 67, anim: [], lotes, eventos: [], stdPeso: stdCuy,
      metas: { camada: 2.8, ip: 0.7, fert: 90, mortLact: 8, peso: 0.9, fcr: 3.8, partosAnio: 4.2 } };
  })();

  /* =================== Sanidad: plan, tratamientos con retiro y mortalidad =================== */
  const S = (f, act, prod, cod, dosis, via, obj, cab, estado, ret) => ({ id: 'PS-' + G.pad(G.int(r, 100, 999), 3), f, act, prod, cod, dosis, via, obj, cab, estado, ret: ret || 0 });
  E.porcino.plan = [
    S('20/08/2026', 'Vacuna peste porcina clásica', 'Vacuna PPC · frasco 50 dosis', '231100090034', '2 ml', 'IM', 'L-231 · recría', 38, 'Programada', 21),
    S('20/08/2026', 'Hierro dextrano · día 3', 'Hierro dextrano 200 mg', '231100090131', '1 ml', 'IM', 'Lechones de M-014', 11, 'Programada', 0),
    S('25/08/2026', 'Desparasitación · ivermectina', 'Ivermectina 1 %', '231100090088', '1 ml / 33 kg', 'SC', 'E-121 · engorde', 24, 'Programada', 28),
    S('01/09/2026', 'Vacuna mycoplasma · refuerzo', 'Vacuna mycoplasma', '', '2 ml', 'IM', 'E-123 · engorde', 31, 'Programada', 21),
    S('09/08/2026', 'Vacuna peste porcina clásica', 'Vacuna PPC · frasco 50 dosis', '231100090034', '2 ml', 'IM', 'L-229 · recría', 30, 'Aplicada', 21),
    S('04/08/2026', 'Hierro dextrano · día 3', 'Hierro dextrano 200 mg', '231100090131', '1 ml', 'IM', 'Lechones de M-017', 10, 'Aplicada', 0),
    S('01/08/2026', 'Desparasitación · ivermectina', 'Ivermectina 1 %', '231100090088', '1 ml / 33 kg', 'SC', 'Reproductores', 31, 'Aplicada', 28)
  ];
  E.vacuno.plan = [
    S('20/08/2026', 'Prueba CMT (mastitis subclínica)', 'Reactivo CMT', '', '—', '—', 'Vacas en producción', 24, 'Programada', 0),
    S('02/09/2026', 'Vacuna carbunco sintomático', 'Vacuna triple', '', '5 ml', 'SC', 'Terneros', 9, 'Programada', 21),
    S('15/09/2026', 'Vacuna contra fiebre aftosa · campaña SENASA', 'Vacuna fiebre aftosa', '231100090120', '2 ml', 'IM', 'Hato completo', 51, 'Programada', 0),
    S('05/08/2026', 'Vacuna contra fiebre aftosa', 'Vacuna fiebre aftosa', '231100090120', '2 ml', 'IM', 'Hato completo', 51, 'Aplicada', 0),
    S('01/08/2026', 'Control de garrapatas (baño)', 'Ectoparasiticida', '', 'Baño', 'Tópica', 'Hato completo', 51, 'Aplicada', 3)
  ];
  E.ave.plan = [
    S('25/08/2026', 'Vacuna bronquitis infecciosa', 'Vacuna Newcastle + bronquitis', '231100090115', '1 gota', 'Ocular', 'P-01 · ponedoras', 420, 'Programada', 0),
    S('25/08/2026', 'Vacuna Newcastle · día 7', 'Vacuna Newcastle + bronquitis', '231100090115', '1 gota', 'Ocular', 'G3 · pollitos', 600, 'Programada', 0),
    S('01/09/2026', 'Vacuna Gumboro · día 14', 'Vacuna Gumboro', '', 'Agua de bebida', 'Oral', 'G3 · pollitos', 600, 'Programada', 0),
    S('30/08/2026', 'Vacuna síndrome de baja postura (EDS)', 'Vacuna EDS', '', '0.5 ml', 'IM', 'P-02 · pre-postura', 380, 'Programada', 0),
    S('09/08/2026', 'Vacuna Newcastle + bronquitis', 'Vacuna Newcastle + bronquitis', '231100090115', 'Agua de bebida', 'Oral', 'G2-09 · engorde', 598, 'Aplicada', 0)
  ];
  E.cuy.plan = [
    S('22/08/2026', 'Control de ectoparásitos', 'Ectoparasiticida en polvo', '', 'Espolvoreo', 'Tópica', 'Todas las pozas', 1125, 'Programada', 7),
    S('05/09/2026', 'Dosificación antiparasitaria', 'Ivermectina 1 %', '231100090088', '0.1 ml', 'SC', 'Reproductoras', 180, 'Programada', 21),
    S('01/08/2026', 'Desinfección de pozas y cal', 'Cal viva', '', '—', '—', 'Galpón completo', 1125, 'Aplicada', 0)
  ];
  const T = (id, f, ref, diag, prod, cod, dosis, via, dias, retC, retL, vet, costo, estado, cant) => ({ id, f, ref, diag, prod, cod, dosis, via, dias, retC, retL, vet, costo, estado, cant: cant || 1 });
  E.porcino.trat = [T('TR-P-041', '16/08/2026', 'E-118', 'Neumonía enzoótica (tos, fiebre 40.5 °C)', 'Oxitetraciclina LA 200 mg', '231100090102', '1 ml / 10 kg', 'IM', 3, 28, 0, 'MV. R. Tello', 152, 'En tratamiento', 6), T('TR-P-040', '11/08/2026', 'M-011', 'Metritis posparto', 'Oxitetraciclina LA 200 mg', '231100090102', '20 ml', 'IM', 3, 28, 0, 'MV. R. Tello', 38, 'Alta'), T('TR-P-038', '02/08/2026', 'L-229', 'Diarrea posdestete', 'Enrofloxacina en agua', '', '1 ml / l', 'Oral', 5, 10, 0, 'MV. R. Tello', 86, 'Alta', 30)];
  E.vacuno.trat = [T('TR-V-027', '17/08/2026', 'V-12', 'Mastitis clínica · cuarto posterior derecho', 'Pomo intramamario (cefalosporina)', '231100090144', '1 pomo / 12 h', 'Intramamaria', 3, 4, 4, 'MV. C. Ruiz', 42, 'En tratamiento'), T('TR-V-026', '14/08/2026', 'V-20', 'Cojera · dermatitis digital', 'Oxitetraciclina tópica + curación', '', 'Spray', 'Tópica', 5, 0, 0, 'MV. C. Ruiz', 35, 'En tratamiento'), T('TR-V-025', '08/08/2026', 'V-05', 'Retención de placenta', 'Oxitetraciclina LA 200 mg', '231100090102', '50 ml', 'IM', 3, 28, 7, 'MV. C. Ruiz', 95, 'Alta')];
  E.ave.trat = [T('TR-A-012', '11/08/2026', 'G2-08', 'Estrés por calor · golpe de calor', 'Electrolitos + vitamina C', '', '1 g / l', 'Oral', 3, 0, 0, 'MV. R. Tello', 64, 'Alta', 1250)];
  E.cuy.trat = [T('TR-C-009', '04/08/2026', 'R-04', 'Neumonía', 'Enrofloxacina', '', '0.2 ml', 'IM', 5, 10, 0, 'MV. R. Tello', 48, 'Alta', 38)];
  E.porcino.mort = [{ f: '03/08/2026', ref: 'Lechones de M-011', cant: 1, causa: 'Aplastamiento', edad: '6 d', nec: 'No' }, { f: '17/08/2026', ref: 'Lechones de M-014', cant: 1, causa: 'Nacido muerto', edad: '0 d', nec: 'No' }, { f: '10/08/2026', ref: 'Lechones de M-017', cant: 1, causa: 'Aplastamiento', edad: '0 d', nec: 'No' }, { f: '13/08/2026', ref: 'L-233', cant: 1, causa: 'Diarrea posdestete', edad: '28 d', nec: 'Sí · colibacilosis' }, { f: '06/08/2026', ref: 'E-121', cant: 1, causa: 'Úlcera gástrica', edad: '118 d', nec: 'Sí' }, { f: '28/07/2026', ref: 'L-231', cant: 1, causa: 'Diarrea neonatal', edad: '5 d', nec: 'No' }];
  E.vacuno.mort = [{ f: '22/07/2026', ref: 'Ternero T-2200', cant: 1, causa: 'Neumonía neonatal', edad: '12 d', nec: 'Sí' }];
  E.ave.mort = [{ f: '11/08/2026', ref: 'G2-08', cant: 9, causa: 'Estrés por calor', edad: '35 d', nec: 'No' }, { f: '14/08/2026', ref: 'G2-09', cant: 3, causa: 'Síndrome ascítico', edad: '17 d', nec: 'Sí' }, { f: '15/08/2026', ref: 'P-01', cant: 1, causa: 'Prolapso', edad: '41 sem', nec: 'No' }, { f: '03/08/2026', ref: 'P-01', cant: 8, causa: 'Descarte · baja postura', edad: '40 sem', nec: 'No' }];
  E.cuy.mort = [{ f: '04/08/2026', ref: 'R-04', cant: 3, causa: 'Neumonía', edad: '8 sem', nec: 'Sí' }, { f: '12/08/2026', ref: 'P-08', cant: 2, causa: 'Aplastamiento de lactantes', edad: '3 d', nec: 'No' }, { f: '16/08/2026', ref: 'P-03', cant: 1, causa: 'Distocia (hembra)', edad: '9 m', nec: 'No' }];

  /* =================== Alimentación: raciones (fórmulas) y consumo =================== */
  const RA = (id, nombre, etapa, ing, pb, em, cod) => ({ id, nombre, etapa, ing, pb, em, cod, costoKg: Math.round(ing.reduce((s, x) => s + x[1] / 100 * x[2], 0) * 1000) / 1000 });
  E.porcino.rac = [RA('R-PC-01', 'Preinicio lechones', 'Lactancia · recría inicial', [['Maíz amarillo', 45, 1.32], ['Torta de soya', 22, 2.35], ['Lactosa / suero', 15, 5.4], ['Harina de pescado', 8, 4.9], ['Premezcla vitamínica', 10, 3.1]], 21, 3400, '231100010031'), RA('R-PC-02', 'Crecimiento', 'Recría', [['Maíz amarillo', 64, 1.32], ['Torta de soya', 26, 2.35], ['Afrecho de trigo', 6, 0.95], ['Premezcla y minerales', 4, 3.1]], 18, 3250, '231100010031'), RA('R-PC-03', 'Engorde · acabado', 'Engorde', [['Maíz amarillo', 72, 1.32], ['Torta de soya', 20, 2.35], ['Afrecho de trigo', 5, 0.95], ['Premezcla y minerales', 3, 3.1]], 15.5, 3200, '231100010045'), RA('R-PC-04', 'Gestación', 'Reproductoras', [['Maíz amarillo', 60, 1.32], ['Afrecho de trigo', 22, 0.95], ['Torta de soya', 14, 2.35], ['Premezcla y minerales', 4, 3.1]], 14, 2950, '231100010045'), RA('R-PC-05', 'Lactancia', 'Reproductoras en maternidad', [['Maíz amarillo', 62, 1.32], ['Torta de soya', 28, 2.35], ['Aceite vegetal', 3, 6.8], ['Premezcla y minerales', 7, 3.1]], 18.5, 3350, '231100010031')];
  E.vacuno.rac = [RA('R-VC-01', 'Vacas alta producción', '> 18 L/día', [['Forraje verde picado', 70, 0.18], ['Concentrado lechero', 22, 1.64], ['Heno de alfalfa', 6, 1.1], ['Sales minerales', 2, 3.8]], 16, 2650, '231100010073'), RA('R-VC-02', 'Vacas media producción', '< 18 L/día', [['Forraje verde picado', 80, 0.18], ['Concentrado lechero', 14, 1.64], ['Heno de alfalfa', 4, 1.1], ['Sales minerales', 2, 3.8]], 14, 2500, '231100010073'), RA('R-VC-03', 'Vacas secas y vaquillonas', 'Seca · recría', [['Forraje verde picado', 88, 0.18], ['Heno de alfalfa', 8, 1.1], ['Concentrado lechero', 3, 1.64], ['Sales minerales aniónicas', 1, 4.2]], 12, 2300, '231100010089')];
  E.ave.rac = [RA('R-AV-01', 'Pollo inicio', '1–21 días', [['Maíz amarillo', 55, 1.32], ['Torta de soya', 36, 2.35], ['Aceite vegetal', 4, 6.8], ['Premezcla', 5, 3.1]], 22, 3050, '231100010052'), RA('R-AV-02', 'Pollo engorde · acabado', '22–42 días', [['Maíz amarillo', 62, 1.32], ['Torta de soya', 30, 2.35], ['Aceite vegetal', 5, 6.8], ['Premezcla', 3, 3.1]], 19, 3200, '231100010052'), RA('R-AV-03', 'Ponedora fase 1', 'Postura', [['Maíz amarillo', 58, 1.32], ['Torta de soya', 25, 2.35], ['Carbonato de calcio', 10, 0.6], ['Premezcla', 7, 3.1]], 17, 2800, '231100010066')];
  E.cuy.rac = [RA('R-CU-01', 'Mixta · forraje + concentrado', 'Reproductoras', [['Forraje verde (alfalfa · chala)', 75, 0.18], ['Concentrado cuyes', 25, 1.85]], 18, 2800, '231100010094'), RA('R-CU-02', 'Engorde integral', 'Recría y engorde', [['Concentrado cuyes', 70, 1.85], ['Forraje verde', 30, 0.18]], 18, 2900, '231100010094')];
  const CON = (f, lote, rac, kg, doc) => ({ f, lote, rac, kg, doc });
  E.porcino.cons = [CON('16/08/2026', 'E-121', 'R-PC-03', 1200, 'PECOSA 001830'), CON('16/08/2026', 'E-123', 'R-PC-03', 1080, 'PECOSA 001830'), CON('15/08/2026', 'L-231', 'R-PC-02', 480, 'PECOSA 001821'), CON('12/08/2026', 'E-118', 'R-PC-03', 960, 'PECOSA 001822'), CON('12/08/2026', 'Reproductoras', 'R-PC-04', 1400, 'PECOSA 001822'), CON('09/08/2026', 'L-233', 'R-PC-01', 520, 'PECOSA 001821')];
  E.vacuno.cons = [CON('18/08/2026', 'Vacas en producción', 'R-VC-01', 1320, 'Consumo diario'), CON('17/08/2026', 'Vacas en producción', 'R-VC-01', 1310, 'Consumo diario'), CON('17/08/2026', 'Secas y vaquillonas', 'R-VC-03', 720, 'Consumo diario')];
  E.ave.cons = [CON('18/08/2026', 'G2-08', 'R-AV-02', 238, 'Consumo diario'), CON('18/08/2026', 'G2-09', 'R-AV-01', 72, 'Consumo diario'), CON('18/08/2026', 'P-01', 'R-AV-03', 47, 'Consumo diario')];
  E.cuy.cons = [CON('18/08/2026', 'Pozas de empadre', 'R-CU-01', 145, 'Consumo diario'), CON('18/08/2026', 'Recría y engorde', 'R-CU-02', 18, 'Consumo diario')];

  /* =================== Movimientos: sacas, ventas, compras, traslados y CSTI =================== */
  const MV = (id, f, tipo, ref, cant, kg, origen, destino, doc, csti, estado) => ({ id, f, tipo, ref, cant, kg, origen, destino, doc, csti, estado });
  E.porcino.mov = [MV('MV-P-088', '15/08/2026', 'Saca a beneficio', 'E-118', 8, 784, 'Granja porcina', 'Camal municipal de Tingo María', 'Guía T001-000418', 'CSTI 10-2026-004512', 'Concluido'), MV('MV-P-087', '12/08/2026', 'Saca a beneficio', 'E-118', 12, 1170, 'Granja porcina', 'Camal municipal de Tingo María', 'Guía T001-000414', 'CSTI 10-2026-004498', 'Concluido'), MV('MV-P-086', '16/08/2026', 'Traslado interno', 'L-231 → R-02', 39, 312, 'Maternidad', 'Recría · R-02', 'Papeleta 086', '', 'Concluido'), MV('MV-P-085', '09/08/2026', 'Venta de reproductores', 'Cachorras F1 (4)', 4, 520, 'Granja porcina', 'Asociación de Productores de Castillo Grande', 'Boleta B001-004797', 'CSTI 10-2026-004471', 'Concluido'), MV('MV-P-084', '02/08/2026', 'Compra', 'Dosis seminales Duroc (20)', 20, 0, 'Centro genético Lima', 'Granja porcina', 'O/C 000489', '', 'Concluido')];
  E.vacuno.mov = [MV('MV-V-041', '10/08/2026', 'Venta en pie', 'Toretes T-2190, T-2194', 2, 610, 'Establo lechero', 'Productor · Aucayacu', 'Boleta B001-004799', 'CSTI 10-2026-004480', 'Concluido'), MV('MV-V-040', '01/08/2026', 'Traslado interno', 'V-03 → potrero de secas', 1, 560, 'Corral CM', 'Potrero de secas · P-06', 'Papeleta 040', '', 'Concluido'), MV('MV-V-039', '25/07/2026', 'Descarte', 'V-34 (mastitis crónica)', 1, 480, 'Establo lechero', 'Camal municipal de Tingo María', 'Boleta B001-004774', 'CSTI 10-2026-004402', 'Concluido')];
  E.ave.mov = [MV('MV-A-033', '12/08/2026', 'Saca a beneficio', 'G2-07', 640, 1587, 'Unidad avícola', 'Centro de beneficio avícola UNAS', 'Parte de beneficio 033', '', 'Concluido'), MV('MV-A-032', '18/08/2026', 'Compra', 'Pollitos BB Cobb 500', 600, 25, 'Incubadora San Fernando', 'Galpón 3', 'O/C 000496', 'CSTI 15-2026-008812', 'Concluido')];
  E.cuy.mov = [MV('MV-C-019', '13/08/2026', 'Saca a beneficio', 'E-11', 29, 26, 'Galpón de cuyes', 'Planta de beneficio UNAS', 'Parte de beneficio 019', '', 'Concluido'), MV('MV-C-018', '08/08/2026', 'Venta de reproductores', 'Reproductores línea Perú (12)', 12, 13, 'Galpón de cuyes', 'Comunidad de Supte San Jorge', 'Boleta B001-004795', 'CSTI 10-2026-004466', 'Concluido')];

  /* =================== Eventos recientes (bitácora zootécnica) =================== */
  const EV = (f, tipo, ref, cant, det, user) => ({ f, tipo, ref, cant, det, user: user || 'P. Huamán' });
  E.porcino.eventos = [EV('17/08/2026', 'Parto', 'M-014', 12, '11 vivos · 1 nacido muerto · peso camada 16.8 kg'), EV('16/08/2026', 'Destete', 'M-002 · M-010 · M-013', 39, 'Forman el lote L-231 · 7.2 kg prom.'), EV('16/08/2026', 'Tratamiento', 'E-118', 6, 'Oxitetraciclina · retiro de carne 28 días'), EV('15/08/2026', 'Saca a beneficio', 'E-118', 8, '98 kg prom. · CSTI 10-2026-004512'), EV('14/08/2026', 'Servicio', 'M-009', 1, 'Monta natural con V-02 · Duroc'), EV('13/08/2026', 'Pesaje', 'E-121', 24, '66 kg prom. · GDP 648 g/día'), EV('12/08/2026', 'Saca a beneficio', 'E-118', 12, '97.5 kg prom.'), EV('10/08/2026', 'Parto', 'M-017', 11, '10 vivos · 1 nacido muerto'), EV('07/08/2026', 'Servicio', 'M-023', 1, 'Inseminación · Duroc dosis 80 ml'), EV('04/08/2026', 'Parto', 'M-026', 11, '11 vivos'), EV('03/08/2026', 'Mortalidad', 'Lechones de M-011', 1, 'Aplastamiento'), EV('28/07/2026', 'Parto', 'M-011', 13, '12 vivos · 1 nacido muerto')];
  E.vacuno.eventos = [EV('18/08/2026', 'Ordeño', 'Tanque', 342, 'Litros del día · 18 L descartados por retiro (V-12)', 'N. Flores'), EV('17/08/2026', 'Parto', 'V-07', 1, 'Ternero macho T-2208 · 38 kg · parto normal', 'N. Flores'), EV('17/08/2026', 'Tratamiento', 'V-12', 1, 'Mastitis clínica · retiro de leche 4 días', 'MV. C. Ruiz'), EV('13/08/2026', 'Inseminación', 'VQ-03', 1, 'Semen Brown Swiss "Jongleur"', 'N. Flores'), EV('11/08/2026', 'Secado', 'V-03', 1, '60 días antes del parto', 'N. Flores'), EV('09/08/2026', 'Parto', 'V-12', 1, 'Ternera T-2207 · 36 kg', 'N. Flores'), EV('08/08/2026', 'Pesaje', 'Terneros', 9, '118 kg prom.', 'N. Flores'), EV('05/08/2026', 'Vacunación', 'Hato completo', 51, 'Fiebre aftosa', 'MV. C. Ruiz')];
  E.ave.eventos = [EV('18/08/2026', 'Ingreso', 'G3', 600, 'Pollitos BB Cobb 500 · 42 g · CSTI 15-2026-008812'), EV('18/08/2026', 'Recolección', 'P-01', 344, 'Huevos del día · 82 % de postura'), EV('14/08/2026', 'Pesaje', 'G2-09', 594, '0.92 kg prom. · uniformidad 86 %'), EV('12/08/2026', 'Beneficio', 'G2-07', 640, '2.48 kg prom. · EPEF 334'), EV('11/08/2026', 'Mortalidad', 'G2-08', 9, 'Estrés por calor'), EV('09/08/2026', 'Vacunación', 'G2-09', 598, 'Newcastle + bronquitis')];
  E.cuy.eventos = [EV('17/08/2026', 'Parto', 'P-08', 11, '3 partos · 11 gazapos'), EV('16/08/2026', 'Destete', 'P-05', 14, 'Pasan a recría R-06'), EV('13/08/2026', 'Saca a beneficio', 'E-11', 29, '0.9 kg prom.'), EV('12/08/2026', 'Mortalidad', 'P-08', 2, 'Aplastamiento de lactantes'), EV('06/08/2026', 'Empadre', 'P-10', 10, '9 hembras + macho CM-10'), EV('04/08/2026', 'Mortalidad', 'R-04', 3, 'Neumonía')];

  // Causas de mortalidad y costos mensuales (para el tablero de indicadores)
  E.porcino.mensual = { labels: ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'], prod: [3420, 3610, 3380, 3790, 3920, 1954], costoKg: [5.92, 5.81, 6.04, 5.76, 5.68, 5.71], unidad: 'kg de carne en pie' };
  E.vacuno.mensual = { labels: ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'], prod: [9820, 9640, 10110, 10350, 10420, 5980], costoKg: [1.52, 1.55, 1.49, 1.46, 1.44, 1.43], unidad: 'litros de leche' };
  E.ave.mensual = { labels: ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'], prod: [3060, 2980, 3240, 3150, 3310, 1587], costoKg: [5.34, 5.41, 5.22, 5.28, 5.19, 5.16], unidad: 'kg de pollo' };
  E.cuy.mensual = { labels: ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'], prod: [78, 84, 81, 86, 90, 47], costoKg: [14.6, 14.2, 14.4, 13.9, 13.7, 13.8], unidad: 'kg de cuy beneficiado' };

  SIGA.data.pecuario = {
    especies: E,
    veterinarios: ['MV. R. Tello (porcinos, aves y cuyes)', 'MV. C. Ruiz (vacunos)'],
    predio: { codigo: 'Predio SENASA 10-06-01-0042', nombre: 'Fundo Tulumayo · Centro de Producción UNAS', ubigeo: 'Rupa Rupa · Leoncio Prado · Huánuco' }
  };
})();
