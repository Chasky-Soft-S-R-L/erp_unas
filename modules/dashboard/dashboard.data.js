SIGA.data.dashboard = {
  // Semáforo de partidas: específicas sin movimiento reciente (las con movimiento se calculan del marco)
  semaforoBase: { verde: 176, ambar: 58, rojo: 21, sobre: 0 },
  // Contadores institucionales a la fecha de corte (la muestra de la demo se suma encima)
  contadores: { certActivas: 1342, ordenes: 1126, cp: 954, usuarios: 250 },
  hero: [['18', 'Módulos integrados'], ['126', 'Procesos cubiertos'], ['254', 'Centros de costo'], ['1,197', 'Trabajadores'], ['14', 'Unidades productivas']],
  metas: { rdrAnual: 3600000, ejecucionAnual: 0.92, pagosATiempo: 0.95 },
  // Devengado mensual 2026 por genérica (S/ millones) · se reparte el devengado mensual del pliego según la estructura de cada genérica
  pesos: { '2.3': [0.62, 0.55, 0.58, 0.54, 0.53, 0.52, 0.50, 0.49], '2.4': [0.01, 0.02, 0.02, 0.03, 0.02, 0.03, 0.02, 0.03], '2.5': [0.05, 0.07, 0.06, 0.07, 0.06, 0.07, 0.07, 0.06], '2.6': [0.32, 0.36, 0.34, 0.36, 0.39, 0.38, 0.41, 0.42] }
};
