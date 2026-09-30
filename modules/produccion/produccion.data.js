/* Centros de Producción de Bienes y Servicios · procesos CP-01 a CP-12 · 14 unidades (informe Tabla 5) */
SIGA.data.produccion = {
  unidades: [
    { nom: 'Granja porcina', linea: 'Carne de cerdo · lechones · reproductores', tipo: 'Pecuaria', cc: '104.07.13.03.02', ing: 52300, cos: 36900, estado: 'Operativa', antes: 'Cuaderno de campo' },
    { nom: 'Unidad avícola', linea: 'Pollo de carne · huevo de gallina', tipo: 'Pecuaria', cc: '104.07.13.03.04', ing: 41800, cos: 31200, estado: 'Operativa', antes: 'Cuaderno de campo' },
    { nom: 'Galpón de cuyes', linea: 'Carne de cuy · reproductores', tipo: 'Pecuaria', cc: '104.07.13.03.05', ing: 18600, cos: 10400, estado: 'Operativa', antes: 'Cuaderno de campo' },
    { nom: 'Establo lechero', linea: 'Leche fresca · terneros', tipo: 'Pecuaria', cc: '104.07.13.03.03', ing: 30200, cos: 22700, estado: 'Operativa', antes: 'Cuaderno de campo' },
    { nom: 'Campos de arroz', linea: 'Arroz en cáscara y pilado', tipo: 'Agrícola', cc: '104.07.13.02.01', ing: 34500, cos: 22800, estado: 'En campaña', antes: 'Hoja de cálculo' },
    { nom: 'Campos de maíz', linea: 'Maíz amarillo duro', tipo: 'Agrícola', cc: '104.07.13.02.02', ing: 12400, cos: 8900, estado: 'En campaña', antes: 'Hoja de cálculo' },
    { nom: 'Platanera', linea: 'Plátano en racimo', tipo: 'Agrícola', cc: '104.07.13.02.03', ing: 9800, cos: 5600, estado: 'Operativa', antes: 'Hoja de cálculo' },
    { nom: 'Planta de lácteos', linea: 'Yogur · queso · manjar', tipo: 'Agroindustrial', cc: '104.07.13.04.01', ing: 27900, cos: 19300, estado: 'Operativa', antes: 'Cuaderno y hoja de cálculo' },
    { nom: 'Planta de café y cacao', linea: 'Café tostado y molido · chocolate', tipo: 'Agroindustrial', cc: '104.07.13.04.02', ing: 31600, cos: 20100, estado: 'Operativa', antes: 'Cuaderno y hoja de cálculo' },
    { nom: 'Planta procesadora de alimentos', linea: 'Productos transformados', tipo: 'Agroindustrial', cc: '104.07.13.03.15', ing: 0, cos: 3600, estado: 'En implementación', antes: 'En implementación' },
    { nom: 'Vivero forestal', linea: 'Plantones forestales y frutales', tipo: 'Agrícola', cc: '104.07.13.02.05', ing: 8650, cos: 4300, estado: 'Operativa', antes: 'Cuaderno de campo' },
    { nom: 'Laboratorio de análisis de suelos', linea: 'Servicio de análisis a terceros', tipo: 'Servicios', cc: '104.07.13.05.01', ing: 9400, cos: 3700, estado: 'Operativa', antes: 'Registro manual de solicitudes' },
    { nom: 'Servicios de maquinaria agrícola', linea: 'Alquiler de maquinaria', tipo: 'Servicios', cc: '104.07.13.05.02', ing: 7300, cos: 3900, estado: 'Operativa', antes: 'Registro manual' },
    { nom: 'Comedor universitario', linea: 'Alimentación a terceros', tipo: 'Servicios', cc: '104.08.02.07', ing: 14500, cos: 12100, estado: 'Operativa', antes: 'Registro manual' }
  ],
  // Costo unitario real (CP-07): [producto, unidad, insumos, mano de obra, depreciación, costos indirectos, merma %, precio de venta, unidad productiva]
  costos: [
    ['Leche fresca', 'litro', 1.42, 0.58, 0.21, 0.18, 2, 3.50, 'Establo lechero'],
    ['Carne de cerdo beneficiado', 'kg', 7.85, 1.60, 0.40, 1.17, 0, 16.00, 'Granja porcina'],
    ['Pollo beneficiado', 'kg', 6.10, 0.90, 0.30, 0.75, 1, 11.50, 'Unidad avícola'],
    ['Cuy beneficiado (~900 g)', 'unidad', 9.80, 3.20, 0.90, 1.90, 0, 25.00, 'Galpón de cuyes'],
    ['Huevo de gallina', 'unidad', 0.31, 0.06, 0.04, 0.03, 3, 0.60, 'Unidad avícola'],
    ['Arroz pilado', 'saco 50 kg', 98.00, 22.00, 9.00, 12.00, 0, 175.00, 'Campos de arroz'],
    ['Café tostado y molido', 'bolsa 500 g', 7.34, 0.76, 0.60, 0.83, 1, 28.00, 'Planta de café y cacao'],
    ['Yogur frutado', 'botella 1 L', 3.90, 1.20, 0.40, 0.50, 2, 8.50, 'Planta de lácteos'],
    ['Análisis de fertilidad de suelo', 'muestra', 38.00, 22.00, 9.00, 6.00, 0, 120.00, 'Laboratorio de análisis de suelos'],
    ['Plantón forestal', 'unidad', 0.65, 0.40, 0.05, 0.10, 8, 2.50, 'Vivero forestal']
  ],
  ordenes: [
    { op: 'OP-0231', prod: 'Café tostado y molido 500 g', unidad: 'Planta de café y cacao', cant: 800, um: 'bolsa', pv: 28, avance: 80, inicio: '12/08/2026', fin: '20/08/2026', estado: 'En proceso',
      insumos: [['231100080044', 'Café pergamino', 'kg', 520, 9.80], ['—', 'Bolsa laminada con válvula', 'und', 800, 0.85], ['—', 'Etiqueta impresa', 'und', 800, 0.12], ['—', 'Gas GLP · balón 10 kg', 'und', 3, 58]], mo: [64, 9.5], dep: 482, cif: 8, merma: 1 },
    { op: 'OP-0230', prod: 'Yogur frutado 1 L', unidad: 'Planta de lácteos', cant: 1200, um: 'botella', pv: 8.5, avance: 55, inicio: '14/08/2026', fin: '22/08/2026', estado: 'En proceso',
      insumos: [['—', 'Leche fresca (del establo)', 'litro', 1250, 2.44], ['—', 'Pulpa de fruta', 'kg', 90, 6.5], ['—', 'Azúcar', 'kg', 96, 3.8], ['231100080015', 'Envase de vidrio 1 L', 'und', 1200, 1.35]], mo: [120, 9.5], dep: 380, cif: 6, merma: 2 },
    { op: 'OP-0229', prod: 'Chocolate 70% · barra 100 g', unidad: 'Planta de café y cacao', cant: 600, um: 'barra', pv: 7.5, avance: 30, inicio: '16/08/2026', fin: '28/08/2026', estado: 'En proceso',
      insumos: [['—', 'Cacao en grano CCN-51', 'kg', 48, 11.5], ['—', 'Azúcar', 'kg', 20, 3.8], ['—', 'Envoltura y caja', 'und', 600, 0.45]], mo: [40, 9.5], dep: 160, cif: 8, merma: 3 },
    { op: 'OP-0228', prod: 'Queso fresco 1 kg', unidad: 'Planta de lácteos', cant: 180, um: 'kg', pv: 18, avance: 100, inicio: '10/08/2026', fin: '16/08/2026', estado: 'Terminada',
      insumos: [['—', 'Leche fresca (del establo)', 'litro', 1440, 2.44], ['—', 'Cuajo y sal', 'kg', 6, 12]], mo: [36, 9.5], dep: 120, cif: 6, merma: 4 },
    { op: 'OP-0227', prod: 'Engorde porcino · lote E-121', unidad: 'Granja porcina', cant: 2280, um: 'kg en pie', pv: 9.2, avance: 60, inicio: '05/05/2026', fin: '03/09/2026', estado: 'En proceso',
      insumos: [['231100010045', 'Alimento balanceado engorde', 'saco', 96, 101.5], ['231100010031', 'Alimento balanceado inicio', 'saco', 28, 112], ['231100090034', 'Vacunas y sanidad', 'frasco', 6, 112.5]], mo: [310, 9.5], dep: 640, cif: 5, merma: 1 }
  ],
  // Plan de producción del mes (CP-02): [unidad, producto, unidad de medida, plan, real a la fecha]
  plan: [
    ['Establo lechero', 'Leche fresca', 'litros', 10500, 6048], ['Granja porcina', 'Carne de cerdo', 'kg', 4200, 2480], ['Unidad avícola', 'Huevo', 'unidades', 10400, 6192],
    ['Galpón de cuyes', 'Cuy beneficiado', 'unidades', 110, 64], ['Planta de lácteos', 'Yogur frutado', 'litros', 2400, 1520], ['Planta de café y cacao', 'Café tostado', 'kg', 520, 310]
  ],
  mensual: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'], ing: [248, 262, 281, 290, 276, 301, 312, 299], cos: [176, 181, 192, 198, 190, 205, 210, 206] },
  merma: [['Planta de lácteos', 'Suero y producto fuera de especificación', 2.4, 612], ['Vivero forestal', 'Plantones no viables', 8.1, 190], ['Unidad avícola', 'Huevo roto o sucio', 3.2, 186], ['Planta de café y cacao', 'Grano defectuoso en selección', 1.4, 71]],
  excedente: [['Investigación (prioritario · Ley 30220)', 50], ['Reinversión y equipamiento', 30], ['Retribución a participantes', 20]]
};

/* Ampliación: órdenes de producción cerradas de julio y agosto, plan de las demás unidades y merma */
(function () {
  const P = SIGA.data.produccion;
  const O = (op, prod, unidad, cant, um, pv, inicio, fin, insumos, mo, dep, cif, merma, estado) => ({ op, prod, unidad, cant, um, pv, avance: 100, inicio, fin, estado: estado || 'Cerrada', insumos, mo, dep, cif, merma });
  P.ordenes.push(
    O('OP-0226', 'Café tostado y molido 500 g', 'Planta de café y cacao', 700, 'bolsa', 28, '01/08/2026', '09/08/2026', [['231100080044', 'Café pergamino', 'kg', 455, 9.80], ['—', 'Bolsa laminada con válvula', 'und', 700, 0.85], ['—', 'Etiqueta impresa', 'und', 700, 0.12]], [56, 9.5], 420, 8, 1),
    O('OP-0225', 'Manjar blanco 500 g', 'Planta de lácteos', 420, 'frasco', 9, '04/08/2026', '08/08/2026', [['—', 'Leche fresca (del establo)', 'litro', 840, 2.44], ['—', 'Azúcar', 'kg', 95, 3.8], ['—', 'Frasco de vidrio 500 g', 'und', 420, 0.95]], [44, 9.5], 130, 6, 2),
    O('OP-0224', 'Pollo beneficiado · campaña 31', 'Unidad avícola', 1850, 'kg', 11.5, '26/06/2026', '06/08/2026', [['—', 'Pollito BB línea Cobb', 'und', 1100, 2.6], ['—', 'Alimento balanceado de pollos', 'saco', 58, 96], ['—', 'Vacunas avícolas', 'frasco', 4, 68]], [180, 9.5], 360, 5, 3),
    O('OP-0223', 'Yogur frutado 1 L', 'Planta de lácteos', 1000, 'botella', 8.5, '28/07/2026', '03/08/2026', [['—', 'Leche fresca (del establo)', 'litro', 1040, 2.44], ['—', 'Pulpa de fruta', 'kg', 75, 6.5], ['—', 'Azúcar', 'kg', 80, 3.8], ['231100080015', 'Envase de vidrio 1 L', 'und', 1000, 1.35]], [100, 9.5], 320, 6, 2),
    O('OP-0222', 'Chocolate 70% · barra 100 g', 'Planta de café y cacao', 500, 'barra', 7.5, '20/07/2026', '31/07/2026', [['—', 'Cacao en grano CCN-51', 'kg', 40, 11.5], ['—', 'Azúcar', 'kg', 17, 3.8], ['—', 'Envoltura y caja', 'und', 500, 0.45]], [34, 9.5], 140, 8, 3),
    O('OP-0221', 'Plantones de caoba y bolaina', 'Vivero forestal', 3000, 'unidad', 2.5, '02/05/2026', '31/07/2026', [['—', 'Semilla forestal certificada', 'kg', 6, 180], ['—', 'Bolsa de vivero', 'millar', 3, 45], ['—', 'Sustrato preparado', 'm3', 4, 85]], [220, 9.5], 60, 5, 8),
    O('OP-0220', 'Queso fresco 1 kg', 'Planta de lácteos', 150, 'kg', 18, '27/07/2026', '31/07/2026', [['—', 'Leche fresca (del establo)', 'litro', 1200, 2.44], ['—', 'Cuajo y sal', 'kg', 5, 12]], [30, 9.5], 100, 6, 4)
  );
  P.plan.push(['Campos de arroz', 'Arroz en cáscara', 'kg', 42000, 0], ['Vivero forestal', 'Plantones', 'unidades', 4500, 2980], ['Laboratorio de análisis de suelos', 'Análisis', 'muestras', 180, 118], ['Servicios de maquinaria agrícola', 'Horas de tractor', 'horas', 160, 74], ['Unidad avícola', 'Pollo beneficiado', 'kg', 3600, 1850], ['Planta de lácteos', 'Queso fresco', 'kg', 360, 180]);
  P.merma.push(['Granja porcina', 'Mortalidad de lechones en lactancia', 4.1, 1340], ['Establo lechero', 'Leche descartada por tratamiento antibiótico', 1.8, 264]);
})();
