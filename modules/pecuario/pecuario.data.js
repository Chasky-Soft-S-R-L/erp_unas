/* Control pecuario · ciclo de vida por especie (informe Tabla 33) */
SIGA.data.pecuario = {
  porcino: {
    nombre: 'Porcinos', sub: 'de la marrana al beneficio (~24 semanas, 100 kg)',
    kpis: [['fa-piggy-bank', 'Población total', '356', 'cabezas'], ['fa-baby', 'Nacimientos del mes', '62', 'lechones vivos'], ['fa-drumstick-bite', 'Saca del mes', '38', 'beneficiados'], ['fa-triangle-exclamation', 'Mortalidad', '7.2%', 'lactancia']],
    ciclo: [['Reproductores', 31, '28 marranas · 3 verracos', 'var(--primary-dark)'], ['Lechones (lactancia)', 86, '0–4 semanas', 'var(--primary)'], ['Recría / destete', 120, '5–10 semanas', 'var(--secondary)'], ['Engorde / cebo', 95, '11–23 semanas', 'var(--info)'], ['Listos p/ saca', 24, '~100 kg', 'var(--warning)']],
    note: 'Ciclo reproductivo de la marrana: celo cada 21 días · gestación 114 días · destete a los 18–21 días.',
    eventos: [['17/08', 'Parto', 'Marrana M-014', '12', '11 vivos, 1 muerto'], ['16/08', 'Destete', 'Lote L-231', '10', 'pasan a recría · 7.2 kg prom.'], ['15/08', 'Saca', 'Engorde E-118', '8', 'beneficio · 98 kg prom.'], ['14/08', 'Mortalidad', 'Lechones L-229', '1', 'lactancia · aplastamiento'], ['14/08', 'Empadre', 'Marrana M-009', '1', 'servicio con verraco V-02']],
    indices: [['Prolificidad', '10.2 lechones/parto'], ['Ganancia diaria', '650 g/día'], ['Conversión alimenticia', '3.1'], ['Edad a la saca', '24 sem'], ['% mortalidad lactancia', '7.2%']],
    prod: { lab: 'Carne producida · agosto', val: '3,720 kg', r1l: 'Beneficiados', r1v: '38', r2l: 'Peso promedio', r2v: '98 kg' },
    animales: [
      ['M-014', 'Reproductora', 'Landrace × Large White', '12/03/2023', '4 partos · 10.8 vivos/parto', 'Parto 17/08 · 11 vivos', 'Destete estimado 07/09', 'Lactancia'],
      ['M-021', 'Reproductora', 'Large White', '05/06/2023', '3 partos · 10.3 vivos/parto', 'Servicio 28/04 con V-02', 'Parto probable 20/08', 'Gestación · día 112'],
      ['M-009', 'Reproductora', 'Landrace', '20/01/2023', '3 partos · 9.7 vivos/parto', 'Servicio 14/08 con V-02', 'Diagnóstico de gestación 04/09', 'Servida'],
      ['V-02', 'Verraco', 'Duroc', '10/01/2022', '46 servicios · 88% fertilidad', 'Servicio a M-009 · 14/08', 'Descanso hasta 19/08', 'Activo'],
      ['L-231', 'Lote destete', 'Híbrido comercial', '20/07/2026', '10 lechones · 7.2 kg prom.', 'Destete 16/08', 'Vacuna PPC 20/08', 'Recría'],
      ['E-121', 'Lote engorde', 'Híbrido comercial', '12/04/2026', '24 cabezas · 66 kg prom.', 'Pesaje 15/08', 'Saca estimada 03/09', 'Engorde']
    ],
    sanidad: [['20/08/2026', 'Vacuna peste porcina clásica', 'Lote L-231 (10)', 'Programada'], ['20/08/2026', 'Hierro dextrano · día 3', 'Lechones de M-014 (11)', 'Programada'], ['25/08/2026', 'Desparasitación · ivermectina', 'Engorde E-121 (24)', 'Programada'], ['12/08/2026', 'Vacuna Mycoplasma', 'Recría (32)', 'Aplicada']],
    curva: { titulo: 'Curva de crecimiento · lote E-121 vs estándar (kg)', labels: ['4 s', '6 s', '8 s', '10 s', '12 s', '14 s', '16 s', '18 s', '20 s', '22 s', '24 s'], std: [7.5, 11, 17, 25, 34, 44, 55, 66, 77, 88, 100], real: [7.2, 10.6, 16.4, 24.3, 33.5, 43.1, 54.2, 65.8, null, null, null], fmt: 'kg' },
    alimento: [['Consumo de alimento del mes', '18,420 kg'], ['Costo de alimentación', 'S/ 34,860'], ['Conversión alimenticia', '3.1 kg/kg'], ['Costo por kg producido', 'S/ 9.37']],
    causas: [['Aplastamiento en lactancia', 3], ['Diarrea neonatal', 2], ['Otras causas', 1]]
  },
  aves: {
    nombre: 'Aves', sub: 'pollos de engorde y gallinas ponedoras',
    kpis: [['fa-drumstick-bite', 'Población total', '3,190', 'aves'], ['fa-egg', 'Ingreso pollitos BB', '600', 'del mes'], ['fa-drumstick-bite', 'Beneficiados', '1,240', 'del mes'], ['fa-egg', 'Huevos', '344', 'por día']],
    ciclo: [['Pollitos BB', 600, '0–2 semanas', 'var(--primary)'], ['Engorde', 1850, '3–6 semanas', 'var(--secondary)'], ['Listos p/ beneficio', 320, '~2.5 kg', 'var(--warning)'], ['Ponedoras', 420, 'en postura', 'var(--primary-dark)']],
    note: 'El pollo de engorde llega al beneficio en ~6 semanas con 2.5 kg. Las ponedoras se controlan por su porcentaje de postura diaria.',
    eventos: [['18/08', 'Ingreso', 'Pollitos BB', '600', 'lote G3 · galpón 3 · línea Cobb 500'], ['18/08', 'Recolección', 'Ponedoras', '344', 'huevos del día'], ['16/08', 'Beneficio', 'Engorde G2-08', '300', '2.5 kg prom.'], ['15/08', 'Mortalidad', 'Engorde G2-07', '9', 'descarte sanitario'], ['14/08', 'Vacunación', 'Pollitos G2-09', '600', 'Newcastle']],
    indices: [['% postura', '82%'], ['Conversión alimenticia', '1.9'], ['Edad de beneficio', '6 sem'], ['Peso al beneficio', '2.5 kg'], ['% mortalidad', '4.0%']],
    prod: { lab: 'Huevos · día', val: '344 und', r1l: 'Postura', r1v: '82%', r2l: 'Carne (mes)', r2v: '3,100 kg' },
    animales: [
      ['G3', 'Lote pollitos BB', 'Cobb 500', '18/08/2026', '600 aves · 0.04 kg', 'Ingreso 18/08', 'Vacuna Gumboro 01/09', 'Cría'],
      ['G2-09', 'Lote engorde', 'Cobb 500', '28/07/2026', '594 aves · 0.92 kg', 'Vacuna Newcastle 14/08', 'Pesaje 21/08', 'Engorde · 3 sem'],
      ['G2-08', 'Lote engorde', 'Cobb 500', '07/07/2026', '1,256 aves · 2.02 kg', 'Beneficio parcial 16/08', 'Beneficio final 22/08', 'Engorde · 6 sem'],
      ['P-01', 'Lote ponedoras', 'Hy-Line Brown', '12/10/2025', '420 aves · 82% postura', 'Recolección diaria', 'Vacuna bronquitis 25/08', 'Postura · sem 42']
    ],
    sanidad: [['25/08/2026', 'Vacuna bronquitis infecciosa', 'Ponedoras P-01 (420)', 'Programada'], ['01/09/2026', 'Vacuna Gumboro · día 14', 'Pollitos G3 (600)', 'Programada'], ['08/09/2026', 'Refuerzo Newcastle · día 21', 'Pollitos G3 (600)', 'Programada'], ['14/08/2026', 'Vacuna Newcastle', 'Engorde G2-09 (600)', 'Aplicada']],
    curva: { titulo: 'Porcentaje de postura diaria · ponedoras P-01 (últimos 14 días)', labels: ['05/08', '06/08', '07/08', '08/08', '09/08', '10/08', '11/08', '12/08', '13/08', '14/08', '15/08', '16/08', '17/08', '18/08'], std: [84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84, 84], real: [81.2, 82.6, 80.9, 83.1, 82.4, 81.7, 83.3, 82.9, 80.5, 81.9, 82.6, 83.8, 81.4, 81.9], fmt: '%', stdName: 'Estándar Hy-Line' },
    alimento: [['Consumo de alimento del mes', '11,240 kg'], ['Costo de alimentación', 'S/ 21,580'], ['Conversión alimenticia (engorde)', '1.9 kg/kg'], ['Costo por huevo', 'S/ 0.31']],
    causas: [['Descarte sanitario', 9], ['Estrés por calor', 4], ['Otras causas', 3]]
  },
  cuyes: {
    nombre: 'Cuyes', sub: 'empadre permanente · saca a las 10 semanas',
    kpis: [['fa-paw', 'Población total', '1,125', 'cuyes'], ['fa-baby', 'Nacimientos del mes', '168', 'gazapos'], ['fa-drumstick-bite', 'Saca del mes', '92', 'beneficiados'], ['fa-triangle-exclamation', 'Mortalidad', '6.0%', 'general']],
    ciclo: [['Reproductoras (empadre)', 180, 'pozas de empadre', 'var(--primary-dark)'], ['Gazapos (lactancia)', 240, '0–2 semanas', 'var(--primary)'], ['Recría', 310, 'destetados', 'var(--secondary)'], ['Engorde', 280, 'hasta 10 sem', 'var(--info)'], ['Saca', 90, '~900 g', 'var(--warning)'], ['Descartes', 25, 'reprod. cumplidos', '#94a3b8']],
    note: 'Empadre permanente: el plantel se mantiene en empadre y el movimiento es el retiro de gazapos al destete. Gestación ~67 días.',
    eventos: [['17/08', 'Nacimiento', 'Poza P-08', '11', '3 partos · 11 gazapos'], ['16/08', 'Destete', 'Poza P-05', '14', 'pasan a recría'], ['15/08', 'Saca', 'Engorde E-12', '24', 'beneficio · 900 g'], ['14/08', 'Descarte', 'Reproductoras', '3', 'fin de vida productiva'], ['13/08', 'Mortalidad', 'Gazapos P-03', '2', 'lactancia']],
    indices: [['Prolificidad', '2.8 crías/parto'], ['Índice productivo al destete', '0.63'], ['Edad a la saca', '10 sem'], ['Peso a la saca', '0.9 kg'], ['% mortalidad', '6.0%']],
    prod: { lab: 'Carne producida · agosto', val: '82 kg', r1l: 'Beneficiados', r1v: '92', r2l: 'Peso promedio', r2v: '0.9 kg' },
    animales: [
      ['P-08', 'Poza de empadre', 'Línea Perú', '—', '10 hembras : 1 macho', 'Nacimiento 17/08 · 11 gazapos', 'Destete 31/08', 'Empadre'],
      ['P-05', 'Poza de empadre', 'Línea Andina', '—', '10 hembras : 1 macho', 'Destete 16/08 · 14 gazapos', 'Partos esperados 04/09', 'Empadre'],
      ['R-14', 'Poza de recría', 'Línea Perú', '02/08/2026', '28 cuyes · 0.36 kg', 'Traslado 16/08', 'Sexaje 23/08', 'Recría'],
      ['E-13', 'Poza de engorde', 'Línea Perú', '12/06/2026', '26 cuyes · 0.82 kg', 'Pesaje 15/08', 'Saca estimada 26/08', 'Engorde · 9 sem']
    ],
    sanidad: [['22/08/2026', 'Control de ectoparásitos', 'Todas las pozas', 'Programada'], ['26/08/2026', 'Suplemento vitamínico C', 'Engorde E-13', 'Programada'], ['10/08/2026', 'Desinfección de pozas', 'Galpón completo', 'Aplicada']],
    curva: { titulo: 'Curva de crecimiento · poza E-13 vs estándar (kg)', labels: ['1 s', '2 s', '3 s', '4 s', '5 s', '6 s', '7 s', '8 s', '9 s', '10 s'], std: [0.2, 0.28, 0.36, 0.45, 0.53, 0.62, 0.7, 0.78, 0.85, 0.92], real: [0.19, 0.27, 0.35, 0.43, 0.52, 0.6, 0.68, 0.75, 0.82, null], fmt: 'kg' },
    alimento: [['Forraje verde del mes', '9,800 kg'], ['Concentrado del mes', '1,120 kg'], ['Costo de alimentación', 'S/ 4,960'], ['Costo por cuy beneficiado', 'S/ 15.80']],
    causas: [['Lactancia', 7], ['Neumonía', 4], ['Otras causas', 3]]
  },
  vacunos: {
    nombre: 'Vacunos (lechería)', sub: 'hato lechero · producción diaria de leche',
    kpis: [['fa-cow', 'Población total', '51', 'cabezas'], ['fa-baby', 'Nacimientos del mes', '3', 'terneros'], ['fa-glass-water', 'Leche', '336', 'litros/día'], ['fa-heart-pulse', 'Preñez', '78%', 'vacas']],
    ciclo: [['Terneros', 8, '0–8 meses', 'var(--primary)'], ['Vaquillonas', 11, 'recría / vientre', 'var(--secondary)'], ['Vacas en producción', 24, 'ordeño diario', 'var(--primary-dark)'], ['Vacas secas', 6, 'preparto', 'var(--info)'], ['Reproductor', 2, 'toros', '#94a3b8']],
    note: 'El hato se controla por estado productivo. Las vacas en producción se ordeñan a diario; las secas están en descanso preparto.',
    eventos: [['18/08', 'Ordeño', 'Vacas en producción', '336', 'litros del día'], ['17/08', 'Parto', 'Vaca V-07', '1', 'ternero macho T-2208'], ['16/08', 'Secado', 'Vaca V-12', '1', 'pasa a preparto'], ['15/08', 'Inseminación', 'Vaquillona Q-04', '1', 'IA · pajilla Holstein'], ['13/08', 'Sanidad', 'Hato', '51', 'dosificación antiparasitaria']],
    indices: [['Leche por vaca', '14 L/día'], ['Intervalo entre partos', '13.5 meses'], ['% preñez', '78%'], ['Vacas en ordeño', '24 de 30'], ['% mortalidad', '1.9%']],
    prod: { lab: 'Leche · día', val: '336 L', r1l: 'Vacas en ordeño', r1v: '24', r2l: 'Promedio/vaca', r2v: '14 L' },
    animales: [
      ['V-07', 'Vaca en producción', 'Holstein', '14/02/2020', '3 partos · 16 L/día', 'Parto 17/08 · macho', 'Ordeño diario · control CMT 20/08', 'Producción'],
      ['V-03', 'Vaca en producción', 'Brown Swiss × Holstein', '02/09/2019', '4 partos · 18 L/día', 'IA 02/07', 'Diagnóstico de preñez 20/08', 'Producción'],
      ['V-12', 'Vaca seca', 'Holstein', '21/05/2021', '2 partos', 'Secado 16/08', 'Parto probable 10/10', 'Preparto'],
      ['Q-04', 'Vaquillona', 'Holstein', '10/03/2024', '— · 340 kg', 'IA 15/08 · pajilla Holstein', 'Diagnóstico de preñez 13/09', 'Servida'],
      ['T-2208', 'Ternero', 'Holstein', '17/08/2026', 'Macho · 38 kg', 'Calostrado 17/08', 'Descorne 15/09', 'Cría'],
      ['B-01', 'Toro reproductor', 'Brown Swiss', '05/01/2019', '—', 'Revisión andrológica 01/08', '—', 'Activo']
    ],
    sanidad: [['20/08/2026', 'Prueba CMT (mastitis)', 'Vacas en producción (24)', 'Programada'], ['30/08/2026', 'Vacuna carbunco sintomático', 'Hato (51)', 'Programada'], ['13/08/2026', 'Dosificación antiparasitaria', 'Hato (51)', 'Aplicada']],
    curva: { titulo: 'Producción diaria de leche · últimos 14 días (litros)', labels: ['05/08', '06/08', '07/08', '08/08', '09/08', '10/08', '11/08', '12/08', '13/08', '14/08', '15/08', '16/08', '17/08', '18/08'], std: [340, 340, 340, 340, 340, 340, 340, 340, 340, 340, 340, 340, 340, 340], real: [322, 318, 330, 327, 335, 331, 338, 336, 329, 341, 337, 339, 334, 336], fmt: 'L', stdName: 'Meta diaria' },
    alimento: [['Forraje y concentrado del mes', '42,600 kg'], ['Costo de alimentación', 'S/ 14,320'], ['Costo por litro de leche', 'S/ 2.44'], ['Leche vendida a la planta de lácteos', '6,480 L']],
    causas: [['Neumonía en terneros', 1], ['Otras causas', 0]]
  }
};
