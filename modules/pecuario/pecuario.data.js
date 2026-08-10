SIGA.data.pecuario = {
  porcino: {
    nombre: 'Porcinos', sub: 'de la marrana al beneficio (~24 semanas, 100 kg)',
    kpis: [['fa-piggy-bank', 'Población total', '356', 'cabezas'], ['fa-baby', 'Nacimientos del mes', '62', 'lechones vivos'], ['fa-drumstick-bite', 'Saca del mes', '38', 'beneficiados'], ['fa-triangle-exclamation', 'Mortalidad', '7.2%', 'lactancia']],
    ciclo: [['Reproductores', 31, '28 marranas · 3 verracos', 'var(--primary-dark)'], ['Lechones (lactancia)', 86, '0–4 semanas', 'var(--primary)'], ['Recría / destete', 120, '5–10 semanas', 'var(--secondary)'], ['Engorde / cebo', 95, '11–23 semanas', 'var(--info)'], ['Listos p/ saca', 24, '~100 kg', 'var(--warning)']],
    note: 'Ciclo reproductivo de la marrana: celo cada 21 días · gestación 114 días · destete a los 18–21 días.',
    eventos: [['18/12', 'Parto', 'Marrana M-014', '12', '11 vivos, 1 muerto'], ['17/12', 'Destete', 'Lote L-231', '10', 'pasan a recría'], ['16/12', 'Saca', 'Engorde E-118', '8', 'beneficio · 98 kg prom.'], ['15/12', 'Mortalidad', 'Lechones L-229', '1', 'lactancia'], ['14/12', 'Empadre', 'Marrana M-021', '1', 'servicio con verraco V-02']],
    indices: [['Prolificidad', '10.2 lechones/parto'], ['Ganancia diaria', '650 g/día'], ['Conversión alimenticia', '3.1'], ['Edad a la saca', '24 sem'], ['% mortalidad lactancia', '7.2%']],
    prod: { lab: 'Carne producida · mes', val: '3,720 kg', r1l: 'Beneficiados', r1v: '38', r2l: 'Peso promedio', r2v: '98 kg' }
  },
  aves: {
    nombre: 'Aves', sub: 'pollos de engorde y gallinas ponedoras',
    kpis: [['fa-drumstick-bite', 'Población total', '3,190', 'aves'], ['fa-egg', 'Ingreso pollitos BB', '600', 'del mes'], ['fa-drumstick-bite', 'Beneficiados', '1,240', 'del mes'], ['fa-egg', 'Huevos', '344', 'por día']],
    ciclo: [['Pollitos BB', 600, '0–2 semanas', 'var(--primary)'], ['Engorde', 1850, '3–6 semanas', 'var(--secondary)'], ['Listos p/ beneficio', 320, '~2.5 kg', 'var(--warning)'], ['Ponedoras', 420, 'en postura', 'var(--primary-dark)']],
    note: 'El pollo de engorde llega al beneficio en ~6 semanas con 2.5 kg. Las ponedoras se controlan por su % de postura diaria.',
    eventos: [['18/12', 'Ingreso', 'Pollitos BB', '600', 'lote nuevo galpón 3'], ['18/12', 'Recolección', 'Ponedoras', '344', 'huevos del día'], ['16/12', 'Beneficio', 'Engorde G2-08', '300', '2.5 kg prom.'], ['15/12', 'Mortalidad', 'Engorde G2-07', '9', 'descarte sanitario'], ['14/12', 'Vacunación', 'Pollitos G3', '600', 'Newcastle']],
    indices: [['% postura', '82%'], ['Conversión alimenticia', '1.9'], ['Edad de beneficio', '6 sem'], ['Peso al beneficio', '2.5 kg'], ['% mortalidad', '4.0%']],
    prod: { lab: 'Huevos · día', val: '344 und', r1l: 'Postura', r1v: '82%', r2l: 'Carne (mes)', r2v: '3,100 kg' }
  },
  cuyes: {
    nombre: 'Cuyes', sub: 'empadre permanente · saca a las 10 semanas',
    kpis: [['fa-paw', 'Población total', '1,125', 'cuyes'], ['fa-baby', 'Nacimientos del mes', '168', 'gazapos'], ['fa-drumstick-bite', 'Saca del mes', '92', 'beneficiados'], ['fa-triangle-exclamation', 'Mortalidad', '6.0%', 'general']],
    ciclo: [['Reproductoras (empadre)', 180, 'pozas de empadre', 'var(--primary-dark)'], ['Gazapos (lactancia)', 240, '0–2 semanas', 'var(--primary)'], ['Recría', 310, 'destetados', 'var(--secondary)'], ['Engorde', 280, 'hasta 10 sem', 'var(--info)'], ['Saca', 90, '~900 g', 'var(--warning)'], ['Descartes', 25, 'reprod. cumplidos', '#94a3b8']],
    note: 'Empadre permanente: el plantel se mantiene en empadre y el movimiento es el retiro de gazapos al destete. Gestación ~67 días.',
    eventos: [['18/12', 'Nacimiento', 'Poza P-08', '11', '3 partos · 11 gazapos'], ['17/12', 'Destete', 'Poza P-05', '14', 'pasan a recría'], ['16/12', 'Saca', 'Engorde E-12', '24', 'beneficio · 900 g'], ['15/12', 'Descarte', 'Reproductoras', '3', 'fin de vida productiva'], ['14/12', 'Mortalidad', 'Gazapos P-03', '2', 'lactancia']],
    indices: [['Prolificidad', '2.8 crías/parto'], ['Índice prod. destete (IPd)', '0.63'], ['Edad a la saca', '10 sem'], ['Peso a la saca', '0.9 kg'], ['% mortalidad', '6.0%']],
    prod: { lab: 'Carne producida · mes', val: '82 kg', r1l: 'Beneficiados', r1v: '92', r2l: 'Peso promedio', r2v: '0.9 kg' }
  },
  vacunos: {
    nombre: 'Vacunos (lechería)', sub: 'hato lechero · producción diaria de leche',
    kpis: [['fa-cow', 'Población total', '51', 'cabezas'], ['fa-baby', 'Nacimientos del mes', '3', 'terneros'], ['fa-glass-water', 'Leche', '336', 'litros/día'], ['fa-heart-pulse', 'Preñez', '78%', 'vacas']],
    ciclo: [['Terneros', 8, '0–8 meses', 'var(--primary)'], ['Vaquillonas', 11, 'recría / vientre', 'var(--secondary)'], ['Vacas en producción', 24, 'ordeño diario', 'var(--primary-dark)'], ['Vacas secas', 6, 'preparto', 'var(--info)'], ['Reproductor', 2, 'toros', '#94a3b8']],
    note: 'El hato se controla por estado productivo. Las vacas en producción se ordeñan a diario; las secas están en descanso preparto.',
    eventos: [['18/12', 'Ordeño', 'Vacas producción', '336', 'litros del día'], ['17/12', 'Parto', 'Vaca V-07', '1', 'ternero macho'], ['16/12', 'Secado', 'Vaca V-12', '1', 'pasa a preparto'], ['15/12', 'Inseminación', 'Vaquillona Q-04', '1', 'IA · pajilla Holstein'], ['13/12', 'Sanidad', 'Hato', '51', 'dosificación antiparasitaria']],
    indices: [['Leche por vaca', '14 L/día'], ['Intervalo entre partos', '13.5 meses'], ['% preñez', '78%'], ['Vacas en ordeño', '24 de 30'], ['% mortalidad', '1.9%']],
    prod: { lab: 'Leche · día', val: '336 L', r1l: 'Vacas en ordeño', r1v: '24', r2l: 'Promedio/vaca', r2v: '14 L' }
  }
};
