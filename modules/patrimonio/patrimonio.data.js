/* Control patrimonial · procesos del módulo Patrimonio del SIGA-MEF y normas de la SBN
   altas, asignación en uso, desplazamientos, devoluciones, bajas, inventario físico,
   depreciación y conciliación Patrimonio–Contabilidad */
SIGA.data.patrimonio = {
  totalInst: 18642,
  cuentas: [
    ['1503.0101', 'Edificios e instalaciones', 142300000, 3],
    ['1503.0201', 'Vehículos', 6840000, 20],
    ['1503.0202', 'Maquinaria y equipo agrícola', 9120000, 10],
    ['1503.0301', 'Mobiliario y enseres', 4860000, 10],
    ['1503.0302', 'Equipos de cómputo', 8919200, 25],
    ['1503.0303', 'Equipos de laboratorio', 14380800, 10]
  ],
  locales: ['Sede central · Pabellón administrativo', 'Facultad de Agronomía', 'Facultad de Zootecnia', 'Laboratorio de Análisis de Suelos', 'Planta de Lácteos', 'Oficina de Tecnologías de la Información', 'Biblioteca Central', 'Granja Zootecnia', 'Planta de Café y Cacao', 'Servicios de maquinaria agrícola'],
  bienes: [], movimientos: [], bajas: [], inventario: { anio: 2026, inicio: '01/08/2026', avance: {}, hallazgos: [] }
};
(function () {
  const PA = SIGA.data.patrimonio, G = SIGA.gen, r = G.rng(1414), K = SIGA.data.contabilidad;
  const RESP = ['M. Ríos', 'C. Quinto', 'J. Paredes', 'A. Torres', 'L. Vargas', 'R. Soto', 'K. Ramos', 'E. Mendoza', 'J. Castro', 'Dr. H. Flores', 'Ing. L. Castañeda', 'Mg. P. Vela', 'N. Flores', 'P. Huamán', 'H. Saavedra', 'M. Tello'];
  const CAT = [
    ['740880370089', 'Computadora de escritorio', 'HP ProDesk 400 G9', '1503.0302', 3200, 4800, 0],
    ['740899500041', 'Computadora portátil', 'Lenovo ThinkPad E14', '1503.0302', 3800, 5200, 5],
    ['746441870091', 'Impresora multifuncional láser', 'Brother MFC-L5900', '1503.0302', 1200, 2800, 0],
    ['952282870013', 'Proyector multimedia', 'Epson PowerLite X49', '1503.0302', 2100, 3400, 6],
    ['112218240027', 'Escritorio de melamina', 'Fabricación nacional', '1503.0301', 450, 900, 0],
    ['112227060143', 'Silla giratoria ergonómica', 'Fabricación nacional', '1503.0301', 220, 480, 0],
    ['112280370077', 'Armario metálico de 2 puertas', 'Fabricación nacional', '1503.0301', 650, 1100, 0],
    ['462252180006', 'Aire acondicionado split 24 000 BTU', 'LG Dual Inverter', '1503.0301', 2400, 3900, 5],
    ['536467740012', 'Microscopio binocular', 'Olympus CX23', '1503.0303', 4500, 9800, 3],
    ['536428890008', 'Balanza analítica', 'Ohaus Pioneer PX224', '1503.0303', 3200, 6500, 3],
    ['536446170031', 'Estufa de secado de laboratorio', 'Memmert UN55', '1503.0303', 5000, 12000, 3],
    ['536424440052', 'Espectrofotómetro UV-VIS', 'Thermo Genesys 30', '1503.0303', 14000, 22000, 3],
    ['740841650027', 'Servidor en rack', 'Dell PowerEdge R650', '1503.0302', 18000, 42000, 4]
  ];
  const loc = c => c[3] === '1503.0303' ? G.pick(r, ['Laboratorio de Análisis de Suelos', 'Facultad de Agronomía', 'Facultad de Zootecnia', 'Planta de Lácteos']) : c[0] === '740841650027' ? 'Oficina de Tecnologías de la Información' : G.pick(r, PA.locales.slice(0, 7));
  const corr = {}, add = b => { corr[b.sbn] = (corr[b.sbn] || 0) + 1; b.cod = b.sbn + '-' + G.pad(b.corr || corr[b.sbn], 4); delete b.corr; PA.bienes.push(b); };
  // Activos que ya controla Contabilidad (mismo código, una sola fuente)
  const cta = { '740899500012': '1503.0202', '112275000045': '1503.0201', '602200000871': '1503.0302', '536400000017': '1503.0202', '952200000033': '1503.0202', '740805000082': '1503.0302', '401000000102': '1503.0101' };
  K.activos.forEach(a => add({ sbn: a[0], desc: a[1], marca: '—', serie: 'S/N', cuenta: cta[a[0]] || '1503.0302', fecha: a[2], valor: a[3], tasa: a[4], local: a[5], resp: G.pick(r, RESP), estado: 'Bueno', situacion: 'En uso', origen: a[0] === '740805000082' ? 'O/C 000503' : 'Inventario inicial', contable: true }));
  for (let i = 0; i < 46; i++) {
    const c = CAT[i % CAT.length], y = G.int(r, 2015, 2025), f = G.pad(G.int(r, 1, 28), 2) + '/' + G.pad(G.int(r, 1, 12), 2) + '/' + y;
    const est = G.pick(r, ['Bueno', 'Bueno', 'Bueno', 'Regular', 'Regular', 'Malo']);
    add({ sbn: c[0], desc: c[1], marca: c[2], serie: c[2].split(' ')[0].slice(0, 3).toUpperCase() + G.int(r, 100000, 999999), cuenta: c[3], fecha: f, valor: G.amt(r, c[4], c[5], 10), tasa: c[3] === '1503.0302' ? 25 : 10, local: loc(c), resp: G.pick(r, RESP), estado: est, situacion: est === 'Malo' && G.int(r, 0, 2) === 0 ? 'En almacén (devuelto)' : 'En uso', origen: 'O/C 000' + G.int(r, 180, 480) + '-' + y });
  }
  // Alta del mes: las 8 portátiles de Ciberseguridad (O/C 000503) · una por equipo en el registro patrimonial
  // (se registran como lote en el activo contable 740805000082-0001)
  const bajaCand = PA.bienes.filter(b => b.estado === 'Malo');
  bajaCand.slice(0, 2).forEach((b, i) => { PA.bajas.push({ num: 'BAJ-PAT-2026-00' + (7 - i), fecha: '1' + (2 + i * 3) + '/08/2026', cod: b.cod, bien: b.desc + ' · ' + b.marca, causal: i ? 'Mantenimiento o reparación onerosa' : 'Obsolescencia técnica', valor: b.valor, informe: 'Informe técnico N.º 0' + (31 + i) + '-2026-OTI', resol: '', estado: 'En trámite' }); b.situacion = 'En proceso de baja'; });
  PA.bajas.push(
    { num: 'BAJ-PAT-2026-005', fecha: '22/07/2026', cod: '740880370089-0099', bien: 'Computadoras de escritorio (12) · RAEE', causal: 'Residuos de aparatos eléctricos y electrónicos (RAEE)', valor: 38400, informe: 'Informe técnico N.º 027-2026-OTI', resol: 'R.D. N.º 097-2026-DGA', estado: 'Aprobada' },
    { num: 'BAJ-PAT-2026-004', fecha: '30/06/2026', cod: '112275000031-0001', bien: 'Camioneta pick-up 4×2 (2009)', causal: 'Estado de excedencia', valor: 64500, informe: 'Informe técnico N.º 019-2026-UST', resol: 'R.D. N.º 082-2026-DGA', estado: 'Aprobada' },
    { num: 'BAJ-PAT-2026-003', fecha: '12/05/2026', cod: '536428890003-0001', bien: 'Balanza analítica averiada', causal: 'Mantenimiento o reparación onerosa', valor: 2350, informe: 'Informe técnico N.º 011-2026-LAB', resol: 'R.D. N.º 061-2026-DGA', estado: 'Aprobada' }
  );
  // Movimientos patrimoniales del periodo
  const M = (num, fecha, tipo, cod, de, a, doc) => PA.movimientos.push({ num, fecha, tipo, cod, de, a, doc });
  const pick = n => PA.bienes[n % PA.bienes.length];
  M('MOV-2026-0184', '14/08/2026', 'Alta', '740805000082-0001', 'Almacén central', 'P.A. Ingeniería en Ciberseguridad', 'O/C 000503 · NEA 000307');
  M('MOV-2026-0183', '14/08/2026', 'Asignación en uso', '740805000082-0001', '—', 'Mg. P. Vela', 'Acta N.º 0183-2026');
  [['Desplazamiento', 9], ['Asignación en uso', 12], ['Devolución', 15], ['Desplazamiento', 20], ['Asignación en uso', 23], ['Mejora', 26], ['Desplazamiento', 31], ['Asignación en uso', 34], ['Devolución', 38], ['Asignación en uso', 41], ['Desplazamiento', 44], ['Alta', 47]].forEach(([t, n], i) => {
    const b = pick(n), f = G.pad(13 - i, 2) + '/08/2026';
    M('MOV-2026-0' + (182 - i), f, t, b.cod, t === 'Alta' ? 'Almacén central' : t === 'Devolución' ? b.resp : t === 'Desplazamiento' ? G.pick(r, PA.locales) : '—', t === 'Devolución' ? 'Oficina de Patrimonio' : t === 'Desplazamiento' ? b.local : t === 'Mejora' ? 'Ampliación de memoria y disco SSD' : b.resp, t === 'Mejora' ? 'O/S 000' + (270 + i) + ' · S/ ' + (380 + i * 10) : 'Acta N.º 0' + (182 - i) + '-2026');
  });
  // Toma de inventario 2026 (en curso): avance por local, sobrantes y faltantes
  PA.locales.forEach((l, i) => { const t = PA.bienes.filter(b => b.local === l).length + G.int(r, 180, 900); PA.inventario.avance[l] = [t, Math.round(t * [1, 1, 0.92, 1, 0.86, 1, 0.64, 0.78, 0.55, 0.4][i])]; });
  const fb = PA.bienes.filter(b => !b.contable)[3], fb2 = PA.bienes.filter(b => !b.contable)[17];
  PA.inventario.hallazgos.push(
    { id: 'INV-26-S01', tipo: 'Sobrante', local: 'Facultad de Agronomía', desc: 'Silla giratoria ergonómica sin etiqueta patrimonial', valor: 320, estado: 'Por regularizar', cod: '' },
    { id: 'INV-26-S02', tipo: 'Sobrante', local: 'Biblioteca Central', desc: 'Estante metálico de 5 niveles', valor: 480, estado: 'Por regularizar', cod: '' },
    { id: 'INV-26-F01', tipo: 'Faltante', local: fb.local, desc: fb.desc + ' · ' + fb.marca, valor: fb.valor, estado: 'Por regularizar', cod: fb.cod, resp: fb.resp },
    { id: 'INV-26-F02', tipo: 'Faltante', local: fb2.local, desc: fb2.desc + ' · ' + fb2.marca, valor: fb2.valor, estado: 'En deslinde de responsabilidad', cod: fb2.cod, resp: fb2.resp },
    { id: 'INV-26-S03', tipo: 'Sobrante', local: 'Planta de Lácteos', desc: 'Selladora de envases (donación sin registrar)', valor: 1850, estado: 'Regularizado', cod: '' }
  );
})();
