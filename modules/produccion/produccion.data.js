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
    { op: 'OP-0228', prod: 'Queso fresco 1 kg', unidad: 'Planta de lácteos', cant: 180, um: 'kg', pv: 24, avance: 100, inicio: '10/08/2026', fin: '16/08/2026', estado: 'Terminada',
      insumos: [['—', 'Leche fresca (del establo)', 'litro', 1260, 2.44], ['—', 'Cuajo y sal', 'kg', 6, 12]], mo: [36, 9.5], dep: 120, cif: 6, merma: 4 },
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
    O('OP-0220', 'Queso fresco 1 kg', 'Planta de lácteos', 150, 'kg', 24, '27/07/2026', '31/07/2026', [['—', 'Leche fresca (del establo)', 'litro', 1050, 2.44], ['—', 'Cuajo y sal', 'kg', 5, 12]], [30, 9.5], 100, 6, 4)
  );
  P.plan.push(['Campos de arroz', 'Arroz en cáscara', 'kg', 42000, 0], ['Vivero forestal', 'Plantones', 'unidades', 4500, 2980], ['Laboratorio de análisis de suelos', 'Análisis', 'muestras', 180, 118], ['Servicios de maquinaria agrícola', 'Horas de tractor', 'horas', 160, 74], ['Unidad avícola', 'Pollo beneficiado', 'kg', 3600, 1850], ['Planta de lácteos', 'Queso fresco', 'kg', 360, 180]);
  P.merma.push(['Granja porcina', 'Mortalidad de lechones en lactancia', 4.1, 1340], ['Establo lechero', 'Leche descartada por tratamiento antibiótico', 1.8, 264]);
})();

/* ============================================================
   Manufactura (referencia: Odoo MRP · Quality · Maintenance · PLM)
   · Recetas / lista de materiales (BOM) con ruta de operaciones y puntos de control de calidad
   · Recepción de materia prima con análisis contra especificación
   · Lotes de producto terminado con trazabilidad hacia atrás y hacia adelante (retiro del mercado)
   · Mantenimiento preventivo y correctivo de equipos con órdenes de trabajo
   ============================================================ */
(function () {
  const P = SIGA.data.produccion;
  // Ficha ampliada de cada unidad productiva: [responsable, personal, infraestructura, capacidad instalada, uso %, habilitación sanitaria]
  const UX = {
    'Granja porcina': ['Ing. P. Huamán', 5, 'Galpones de gestación, maternidad (16 jaulas), recría y engorde · 2 400 m²', '30 cerdas · 700 cerdos/año', 84, 'Predio registrado en SENASA'],
    'Unidad avícola': ['MV. R. Tello', 3, '3 galpones de engorde y 1 de postura · 1 800 m²', '9 000 pollos/año · 900 ponedoras', 71, 'Predio registrado en SENASA'],
    'Galpón de cuyes': ['Ing. L. Ramírez', 2, '1 galpón de 3 naves · 180 pozas', '1 500 cuyes/año', 78, 'Predio registrado en SENASA'],
    'Establo lechero': ['MV. C. Ruiz', 4, 'Sala de ordeño 4 puestos · tanque de frío 1 000 L · 38 ha de pastos', '400 L/día', 77, 'Predio registrado en SENASA'],
    'Campos de arroz': ['Ing. M. Salazar', 6, '12 ha bajo riego', '90 t/campaña', 88, '—'],
    'Campos de maíz': ['Ing. M. Salazar', 3, '8 ha', '40 t/campaña', 64, '—'],
    'Platanera': ['Ing. J. Tuesta', 2, '6 ha', '5 000 racimos/año', 70, '—'],
    'Planta de lácteos': ['Ing. A. Valdivia', 5, 'Sala de proceso 180 m² · cámara fría 20 m³', '600 L de leche/día', 62, 'Autorización sanitaria DIGESA · HACCP en implementación'],
    'Planta de café y cacao': ['Ing. R. Chávez', 4, 'Sala de tostado y molienda 120 m²', '1 200 kg de café/mes', 58, 'Autorización sanitaria DIGESA'],
    'Planta procesadora de alimentos': ['Ing. A. Valdivia', 1, 'En implementación (PIP 2025)', '—', 0, 'En trámite'],
    'Vivero forestal': ['Ing. F. Rengifo', 3, 'Vivero de 2 500 m² con malla sombra', '30 000 plantones/año', 66, 'Registro de vivero SERFOR'],
    'Laboratorio de análisis de suelos': ['Dr. E. Paredes', 3, 'Laboratorio con espectrofotómetro y absorción atómica', '250 muestras/mes', 47, 'Acreditación INACAL en trámite'],
    'Servicios de maquinaria agrícola': ['Téc. J. Rengifo', 2, '2 tractores · implementos', '320 h/mes', 46, '—'],
    'Comedor universitario': ['Lic. N. Ruiz', 14, 'Cocina industrial · 400 comensales', '1 200 raciones/día', 91, 'Autorización sanitaria DIGESA']
  };
  P.unidades.forEach(u => { const x = UX[u.nom]; if (x) Object.assign(u, { resp: x[0], personal: x[1], infra: x[2], capacidad: x[3], uso: x[4], habilit: x[5] }); });

  // Recetas (BOM) por lote base · ingredientes [código almacén | '—', descripción, um, cantidad, costo unitario, origen]
  P.recetas = [
    { cod: 'REC-YOG-01', prod: 'Yogur frutado 1 L', pat: '^Yogur', venta: 'YOG-FRU', unidad: 'Planta de lácteos', base: 100, um: 'botella', ver: 'v3', vig: '01/03/2026', rend: 98, vida: 21, dep: 32, estado: 'Vigente', resp: 'Ing. A. Valdivia',
      ing: [['LECHE', 'Leche fresca de vaca (establo UNAS)', 'litro', 104, 2.44], ['231100080061', 'Fermento láctico para yogur · sobre 50 U', 'sobre', 0.5, 48.5], ['231100080077', 'Azúcar rubia · bolsa 50 kg', 'bolsa', 0.16, 172], ['—', 'Pulpa de fruta (fresa / durazno)', 'kg', 7.5, 6.5], ['—', 'Estabilizante (gelatina)', 'kg', 0.3, 38], ['231100080015', 'Envase de vidrio 1 L', 'und', 100, 1.35], ['—', 'Tapa y etiqueta', 'und', 100, 0.18]],
      ops: [['Recepción y filtrado de la leche', 'Tina de recepción', 20, ''], ['Pasteurización 85 °C × 15 min', 'Pasteurizador de placas', 45, 'EQ-PL-01'], ['Inoculación e incubación 42 °C × 5 h', 'Incubadora', 300, 'EQ-PL-03'], ['Batido, saborizado y envasado', 'Mesa de envasado', 60, ''], ['Enfriamiento y almacenamiento a 4 °C', 'Cámara fría', 720, 'EQ-PL-05']],
      qc: [['Acidez de la leche', '13–17 °D', 'Recepción', 'crítico'], ['Temperatura y tiempo de pasteurización', '≥ 85 °C por 15 min', 'Pasteurización', 'PCC'], ['pH al corte de la incubación', '4.4 – 4.6', 'Incubación', 'crítico'], ['Hermeticidad y rotulado', 'Conforme', 'Envasado', 'mayor'], ['Coliformes totales', '< 10 UFC/ml', 'Producto terminado', 'crítico']] },
    { cod: 'REC-QUE-01', prod: 'Queso fresco 1 kg', pat: '^Queso', venta: 'QUE-FRE', unidad: 'Planta de lácteos', base: 100, um: 'kg', ver: 'v2', vig: '15/01/2026', rend: 96, vida: 21, dep: 64, estado: 'Vigente', resp: 'Ing. A. Valdivia',
      ing: [['LECHE', 'Leche fresca de vaca (establo UNAS)', 'litro', 700, 2.44], ['—', 'Cuajo líquido', 'litro', 0.08, 95], ['—', 'Cloruro de calcio', 'kg', 0.2, 12], ['—', 'Sal de mesa', 'kg', 2, 1.6], ['—', 'Bolsa para empaque al vacío', 'und', 100, 0.35]],
      ops: [['Pasteurización lenta 65 °C × 30 min', 'Marmita de doble camisa', 60, 'EQ-PL-02'], ['Coagulación a 35 °C × 40 min', 'Tina quesera', 40, ''], ['Corte, desuerado y moldeo', 'Tina quesera', 60, ''], ['Prensado y salado', 'Prensa', 120, ''], ['Empacado al vacío', 'Empacadora al vacío', 45, 'EQ-PL-06']],
      qc: [['Acidez de la leche', '13–17 °D', 'Recepción', 'crítico'], ['Temperatura de pasteurización', '≥ 65 °C por 30 min', 'Pasteurización', 'PCC'], ['Humedad del queso', '≤ 55 %', 'Producto terminado', 'mayor'], ['Sal', '1.5 – 2.0 %', 'Producto terminado', 'menor'], ['Staphylococcus aureus', '< 10² UFC/g', 'Producto terminado', 'crítico']] },
    { cod: 'REC-MAN-01', prod: 'Manjar blanco 500 g', pat: '^Manjar', venta: 'MAN-BLA', unidad: 'Planta de lácteos', base: 100, um: 'frasco', ver: 'v1', vig: '10/06/2025', rend: 98, vida: 90, dep: 28, estado: 'Vigente', resp: 'Ing. A. Valdivia',
      ing: [['LECHE', 'Leche fresca de vaca (establo UNAS)', 'litro', 120, 2.44], ['231100080077', 'Azúcar rubia · bolsa 50 kg', 'bolsa', 0.8, 172], ['—', 'Bicarbonato de sodio', 'kg', 0.08, 9], ['—', 'Frasco de vidrio 500 g con tapa', 'und', 100, 0.95]],
      ops: [['Concentración en marmita', 'Marmita de doble camisa', 240, 'EQ-PL-02'], ['Envasado en caliente (> 85 °C)', 'Mesa de envasado', 45, ''], ['Enfriamiento y rotulado', 'Sala de proceso', 120, '']],
      qc: [['Sólidos solubles', '68 – 72 °Bx', 'Concentración', 'crítico'], ['Temperatura de envasado', '> 85 °C', 'Envasado', 'PCC'], ['Cierre hermético', 'Conforme', 'Envasado', 'mayor']] },
    { cod: 'REC-CAF-01', prod: 'Café tostado y molido 500 g', pat: '^Café', venta: 'CAF-TOS', unidad: 'Planta de café y cacao', base: 100, um: 'bolsa', ver: 'v4', vig: '02/02/2026', rend: 99, vida: 180, dep: 60, estado: 'Vigente', resp: 'Ing. R. Chávez',
      ing: [['231100080044', 'Café pergamino (insumo de la planta)', 'kg', 65, 9.8], ['—', 'Bolsa laminada con válvula', 'und', 100, 0.85], ['—', 'Etiqueta impresa', 'und', 100, 0.12], ['—', 'Gas GLP · balón 10 kg', 'und', 0.4, 58]],
      ops: [['Trillado y selección', 'Trilladora', 60, 'EQ-PC-01'], ['Tostado 210 °C × 14 min', 'Tostadora de café 15 kg', 120, 'EQ-PC-02'], ['Enfriamiento y reposo 24 h', 'Silo de reposo', 1440, ''], ['Molienda', 'Molino de discos', 40, 'EQ-PC-03'], ['Envasado con válvula desgasificadora', 'Selladora', 60, 'EQ-PC-04']],
      qc: [['Humedad del pergamino', '10 – 12 %', 'Recepción', 'crítico'], ['Rendimiento de trilla', '≥ 78 %', 'Trillado', 'mayor'], ['Color de tueste (Agtron)', '55 – 65', 'Tostado', 'mayor'], ['Peso neto', '500 g ± 1 %', 'Envasado', 'mayor']] },
    { cod: 'REC-CHO-01', prod: 'Chocolate 70% · barra 100 g', pat: '^Chocolate', venta: 'CHO-070', unidad: 'Planta de café y cacao', base: 100, um: 'barra', ver: 'v2', vig: '20/04/2026', rend: 97, vida: 180, dep: 28, estado: 'Vigente', resp: 'Ing. R. Chávez',
      ing: [['—', 'Cacao en grano CCN-51 fermentado', 'kg', 8, 11.5], ['231100080077', 'Azúcar rubia · bolsa 50 kg', 'bolsa', 0.066, 172], ['—', 'Manteca de cacao', 'kg', 0.3, 42], ['—', 'Envoltura y caja', 'und', 100, 0.45]],
      ops: [['Tostado del grano 120 °C', 'Tostadora de café 15 kg', 40, 'EQ-PC-02'], ['Descascarillado', 'Descascarilladora', 60, ''], ['Molienda, refinado y conchado 24 h', 'Refinadora (melanger)', 1440, 'EQ-PC-05'], ['Temperado y moldeo', 'Mesa de temperado', 90, ''], ['Desmoldeo y envoltura', 'Sala de empaque', 60, '']],
      qc: [['Fermentación del grano (prueba de corte)', '≥ 70 %', 'Recepción', 'crítico'], ['Finura de la pasta', '≤ 25 µm', 'Refinado', 'mayor'], ['Temperado (brillo y quiebre)', 'Conforme', 'Temperado', 'mayor'], ['Peso neto', '100 g ± 2 %', 'Empaque', 'menor']] },
    { cod: 'REC-PLN-01', prod: 'Plantón forestal (caoba / bolaina)', pat: '^Plant', venta: 'PLN-FOR', unidad: 'Vivero forestal', base: 1000, um: 'unidad', ver: 'v1', vig: '01/01/2026', rend: 92, vida: 120, dep: 20, estado: 'Vigente', resp: 'Ing. F. Rengifo',
      ing: [['—', 'Semilla forestal certificada', 'kg', 2, 180], ['—', 'Bolsa de vivero 7 × 10', 'millar', 1, 45], ['—', 'Sustrato preparado (tierra, arena, compost)', 'm3', 1.3, 85]],
      ops: [['Siembra en germinador', 'Germinador', 480, ''], ['Repique a bolsa', 'Área de repique', 960, ''], ['Crecimiento y endurecimiento (90 d)', 'Vivero con malla sombra', 0, '']],
      qc: [['Germinación', '≥ 75 %', 'Germinador', 'mayor'], ['Altura del plantón', '≥ 25 cm', 'Despacho', 'mayor'], ['Sanidad (sin plagas)', 'Conforme', 'Despacho', 'crítico']] }
  ];

  // Especificaciones de materia prima: [parámetro, unidad, mínimo, máximo | texto esperado, severidad]
  P.specs = {
    'Leche fresca de vaca': [['Acidez titulable', '°D', 13, 17, 'crítico'], ['Densidad a 15 °C', 'g/ml', 1.028, 1.034, 'mayor'], ['Grasa', '%', 3.2, null, 'mayor'], ['Sólidos totales', '%', 11.4, null, 'mayor'], ['Prueba de alcohol 72 %', '', 'Negativa', null, 'crítico'], ['Antibióticos (β-lactámicos)', '', 'Negativo', null, 'crítico'], ['Temperatura de llegada', '°C', null, 8, 'menor']],
    'Café pergamino': [['Humedad', '%', 10, 12, 'crítico'], ['Defectos primarios', 'por 300 g', null, 5, 'mayor'], ['Rendimiento pergamino → oro', '%', 78, null, 'mayor'], ['Puntaje de taza (SCA)', 'pts', 80, null, 'menor']],
    'Cacao en grano CCN-51': [['Humedad', '%', null, 7.5, 'crítico'], ['Fermentación (prueba de corte)', '%', 70, null, 'mayor'], ['Granos pizarrosos', '%', null, 3, 'mayor'], ['Granos mohosos', '%', null, 3, 'crítico']],
    'Pulpa de fruta': [['Sólidos solubles', '°Bx', 10, null, 'mayor'], ['pH', '', 3.2, 4.2, 'mayor'], ['Temperatura (congelada)', '°C', null, -12, 'menor']]
  };
  const R = (id, f, mp, prov, origen, cant, um, destino, res, estado, analista, obs, loteProv) => ({ id, f, mp, prov, origen, cant, um, destino, res, estado, analista: analista || 'Ing. A. Valdivia', obs: obs || '', loteProv: loteProv || '' });
  const L = v => ({ 'Acidez titulable': v[0], 'Densidad a 15 °C': v[1], Grasa: v[2], 'Sólidos totales': v[3], 'Prueba de alcohol 72 %': v[4] || 'Negativa', 'Antibióticos (β-lactámicos)': v[5] || 'Negativo', 'Temperatura de llegada': v[6] || 6 });
  P.recepciones = [
    R('RMP-0413', '18/08/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Ordeño AM 18/08 · 23 vacas (sin vacas en retiro)', 150, 'L', 'Planta de lácteos', {}, 'Pendiente de análisis', ''),
    R('RMP-0412', '17/08/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 17/08 · leche de V-12 descartada', 226, 'L', 'Planta de lácteos', L([15.5, 1.031, 3.7, 12.5, 'Negativa', 'Negativo', 5.5]), 'Aprobado'),
    R('RMP-0410', '16/08/2026', 'Pulpa de fruta', 'Agroindustrias del Huallaga SAC', 'Pulpa de fresa congelada', 90, 'kg', 'Planta de lácteos', { 'Sólidos solubles': 11.2, pH: 3.6, 'Temperatura (congelada)': -15 }, 'Aprobado', '', '', 'AH-PF-2608'),
    R('RMP-0409', '16/08/2026', 'Café pergamino', 'Asociación de Cafetaleros de Tulumayo', 'Pergamino seco · 4 sacos', 180, 'kg', 'Planta de café y cacao', { Humedad: 13.8, 'Defectos primarios': 7, 'Rendimiento pergamino → oro': 76, 'Puntaje de taza (SCA)': 79 }, 'Rechazado', 'Ing. R. Chávez', 'Humedad sobre 12 %: riesgo de hongos y ocratoxina. Devuelto al proveedor para secado.', 'ACT-0816'),
    R('RMP-0407', '15/08/2026', 'Cacao en grano CCN-51', 'Cooperativa Agraria del Alto Huallaga', 'Grano seco fermentado · 1 saco', 48, 'kg', 'Planta de café y cacao', { Humedad: 7.1, 'Fermentación (prueba de corte)': 68, 'Granos pizarrosos': 2.5, 'Granos mohosos': 1 }, 'Aprobado con observación', 'Ing. R. Chávez', 'Fermentación 68 % (mín. 70 %): se aprueba para chocolate de cobertura con ajuste de conchado.', 'CAAH-CC-0815'),
    R('RMP-0406', '14/08/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 14/08', 1250, 'L', 'Planta de lácteos', L([14.8, 1.030, 3.8, 12.6]), 'Aprobado'),
    R('RMP-0405', '10/08/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 09–10/08', 1260, 'L', 'Planta de lácteos', L([15.9, 1.031, 3.6, 12.2]), 'Aprobado'),
    R('RMP-0404', '08/08/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 08/08 · incluyó leche de V-05 en tratamiento', 310, 'L', 'Descarte', L([15.1, 1.030, 3.7, 12.4, 'Negativa', 'Positivo', 6]), 'Rechazado', '', 'β-lactámicos positivo: la vaca V-05 inició tratamiento con oxitetraciclina el mismo día. Tanque descartado. Con el control pecuario, la leche en retiro ya no ingresa al tanque.'),
    R('RMP-0402', '04/08/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 03–04/08', 840, 'L', 'Planta de lácteos', L([16.2, 1.032, 3.9, 12.8]), 'Aprobado'),
    R('RMP-0400', '31/07/2026', 'Café pergamino', 'Asociación de Cafetaleros de Tulumayo', 'Pergamino seco · 10 sacos', 460, 'kg', 'Planta de café y cacao', { Humedad: 11.2, 'Defectos primarios': 3, 'Rendimiento pergamino → oro': 80, 'Puntaje de taza (SCA)': 83 }, 'Aprobado', 'Ing. R. Chávez', '', 'ACT-0731'),
    R('RMP-0397', '28/07/2026', 'Pulpa de fruta', 'Agroindustrias del Huallaga SAC', 'Pulpa de fresa congelada', 75, 'kg', 'Planta de lácteos', { 'Sólidos solubles': 10.8, pH: 3.5, 'Temperatura (congelada)': -14 }, 'Aprobado', '', '', 'AH-PF-2607'),
    R('RMP-0396', '28/07/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 27–28/07', 1040, 'L', 'Planta de lácteos', L([15.2, 1.031, 3.7, 12.4]), 'Aprobado'),
    R('RMP-0395', '27/07/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 26–27/07', 1050, 'L', 'Planta de lácteos', L([14.6, 1.030, 3.6, 12.1]), 'Aprobado'),
    R('RMP-0391', '18/07/2026', 'Cacao en grano CCN-51', 'Cooperativa Agraria del Alto Huallaga', 'Grano seco fermentado', 40, 'kg', 'Planta de café y cacao', { Humedad: 6.8, 'Fermentación (prueba de corte)': 78, 'Granos pizarrosos': 1.5, 'Granos mohosos': 0.5 }, 'Aprobado', 'Ing. R. Chávez', '', 'CAAH-CC-0718'),
    R('RMP-0386', '20/07/2026', 'Café pergamino', 'Asociación de Cafetaleros de Tulumayo', 'Pergamino seco · 8 sacos', 400, 'kg', 'Planta de café y cacao', { Humedad: 11.6, 'Defectos primarios': 4, 'Rendimiento pergamino → oro': 79, 'Puntaje de taza (SCA)': 82 }, 'Aprobado', 'Ing. R. Chávez', '', 'ACT-0720'),
    R('RMP-0380', '10/07/2026', 'Leche fresca de vaca', 'Establo lechero UNAS', 'Tanque 09–10/07', 860, 'L', 'Planta de lácteos', L([15.4, 1.031, 3.8, 12.5]), 'Aprobado')
  ];

  // Lotes de producto terminado: la distribución hacia adelante se deduce de los comprobantes de venta (FIFO)
  const T = (lote, prod, venta, op, f, venc, cant, um, mp, qc, estado, previo) => ({ lote, prod, venta, op, f, venc, cant, um, mp, qc, estado, previo: previo || 0 });
  P.lotesPT = [
    T('LT-QUE-260731', 'Queso fresco 1 kg', 'QUE-FRE', 'OP-0220', '31/07/2026', '21/08/2026', 144, 'kg', ['RMP-0395'], 'Conforme', 'Liberado', 58),
    T('LT-YOG-260803', 'Yogur frutado 1 L', 'YOG-FRU', 'OP-0223', '03/08/2026', '24/08/2026', 980, 'botella', ['RMP-0396', 'RMP-0397'], 'Conforme', 'Liberado', 690),
    T('LT-MAN-260715', 'Manjar blanco 500 g', 'MAN-BLA', 'OP-0212', '15/07/2026', '13/10/2026', 400, 'frasco', ['RMP-0380'], 'Conforme', 'Liberado', 318),
    T('LT-MAN-260808', 'Manjar blanco 500 g', 'MAN-BLA', 'OP-0225', '08/08/2026', '06/11/2026', 412, 'frasco', ['RMP-0402'], 'Conforme', 'Liberado', 40),
    T('LT-CAF-260722', 'Café tostado y molido 500 g', 'CAF-TOS', 'OP-0217', '22/07/2026', '18/01/2027', 620, 'bolsa', ['RMP-0386'], 'Conforme', 'Liberado', 540),
    T('LT-CAF-260809', 'Café tostado y molido 500 g', 'CAF-TOS', 'OP-0226', '09/08/2026', '05/02/2027', 693, 'bolsa', ['RMP-0400'], 'Conforme', 'Liberado', 120),
    T('LT-CHO-260731', 'Chocolate 70% · barra 100 g', 'CHO-070', 'OP-0222', '31/07/2026', '27/01/2027', 485, 'barra', ['RMP-0391'], 'Conforme', 'Liberado', 180),
    T('LT-PLN-260731', 'Plantón forestal (caoba / bolaina)', 'PLN-FOR', 'OP-0221', '31/07/2026', '28/11/2026', 2760, 'unidad', [], 'Conforme', 'Liberado', 1200)
  ];

  // Equipos y mantenimiento: frecuencia por horas de uso ('h') o por días ('d')
  const E = (cod, nom, unidad, patr, marca, crit, horas, frec, ult, estado, fallas, parada, costo12) => ({ cod, nom, unidad, patr, marca, crit, horas, frec, ult, estado, fallas, parada, costo12 });
  P.equipos = [
    E('EQ-PL-01', 'Pasteurizador de placas 1 000 L/h', 'Planta de lácteos', '536400000031', 'Inoxidables del Perú · 2021', 'Alta', 2410, ['h', 250], ['15/07/2026', 2210], 'Operativo', 1, 6, 1480),
    E('EQ-PL-02', 'Marmita de doble camisa 300 L', 'Planta de lácteos', '536400000038', 'Metalmecánica Selva · 2020', 'Media', 1860, ['d', 30], ['20/07/2026', 1790], 'Operativo', 0, 0, 420),
    E('EQ-PL-03', 'Incubadora de yogur 500 L', 'Planta de lácteos', '536400000044', 'Inoxidables del Perú · 2022', 'Media', 3900, ['d', 90], ['10/06/2026', 3620], 'Operativo', 0, 0, 260),
    E('EQ-PL-05', 'Cámara frigorífica 20 m³ (4 °C)', 'Planta de lácteos', '536400000052', 'Frío Andino · 2019', 'Alta', 8760, ['d', 90], ['02/06/2026', 8010], 'Operativo', 1, 14, 1860),
    E('EQ-PL-06', 'Empacadora al vacío de campana', 'Planta de lácteos', '536400000057', 'Henkelman · 2023', 'Media', 940, ['h', 400], ['10/05/2026', 700], 'Fuera de servicio', 2, 22, 530),
    E('EQ-PC-01', 'Trilladora de café 150 kg/h', 'Planta de café y cacao', '952200000029', 'Penagos · 2019', 'Media', 2280, ['h', 300], ['05/08/2026', 2210], 'Operativo', 0, 0, 380),
    E('EQ-PC-02', 'Tostadora de café 15 kg', 'Planta de café y cacao', '952200000033', 'Toper · 2020', 'Alta', 3120, ['h', 200], ['01/07/2026', 2900], 'Operativo', 1, 8, 1240),
    E('EQ-PC-03', 'Molino de discos para café', 'Planta de café y cacao', '952200000036', 'Bunn · 2021', 'Baja', 1410, ['h', 500], ['12/03/2026', 1050], 'Operativo', 0, 0, 180),
    E('EQ-PC-05', 'Refinadora de chocolate (melanger) 20 kg', 'Planta de café y cacao', '952200000041', 'Premier · 2022', 'Media', 2960, ['h', 500], ['20/06/2026', 2600], 'Operativo', 0, 0, 310),
    E('EQ-EL-01', 'Ordeñadora mecánica de 4 puestos', 'Establo lechero', '536400000017', 'DeLaval · 2022', 'Alta', 4380, ['h', 500], ['30/07/2026', 4200], 'Operativo', 1, 5, 1650),
    E('EQ-EL-02', 'Tanque de enfriamiento de leche 1 000 L', 'Establo lechero', '536400000021', 'Packo · 2022', 'Alta', 6120, ['d', 60], ['25/06/2026', 5000], 'Operativo', 0, 0, 720),
    E('EQ-GP-01', 'Molino y mezcladora de alimento balanceado', 'Granja porcina', '740899500031', 'Vulcano · 2018', 'Media', 5220, ['h', 250], ['18/06/2026', 5010], 'Operativo', 2, 12, 980),
    E('EQ-AV-01', 'Criadora a gas para pollitos (6 und)', 'Unidad avícola', '740899500040', 'Ecuaclima · 2021', 'Media', 2600, ['d', 45], ['10/07/2026', 2400], 'Operativo', 0, 0, 240),
    E('EQ-MA-01', 'Tractor agrícola 90 HP con implementos', 'Servicios de maquinaria agrícola', '740899500012', 'Massey Ferguson · 2019', 'Alta', 5480, ['h', 250], ['02/08/2026', 5300], 'Operativo', 1, 16, 3420),
    E('EQ-LB-01', 'Espectrofotómetro UV-Vis (calibración)', 'Laboratorio de análisis de suelos', '602200000510', 'Thermo · 2020', 'Alta', 1620, ['d', 365], ['10/09/2025', 1290], 'Operativo', 0, 0, 1100)
  ];
  const O = (ot, eq, tipo, f, desc, tec, prio, rep, horas, estado, fCierre, ext) => ({ ot, eq, tipo, f, desc, tec, prio, rep, horas, estado, fCierre: fCierre || '', ext: ext || 0 });
  P.ots = [
    O('OT-2026-084', 'EQ-PC-02', 'Preventivo', '19/08/2026', 'Mantenimiento de 200 h: limpieza de ciclón y chimenea, revisión de quemador y termocupla', 'Taller UNAS · J. Rengifo', 'Alta', [['Termocupla tipo K', 1, 95]], 4, 'Programada'),
    O('OT-2026-083', 'EQ-PL-06', 'Correctivo', '16/08/2026', 'La barra de sellado no alcanza temperatura: cambio de resistencias y teflón', 'Taller UNAS · J. Rengifo', 'Alta', [['Resistencia de sellado 400 W', 2, 145], ['Cinta de teflón', 1, 60]], 5, 'En ejecución'),
    O('OT-2026-082', 'EQ-PL-01', 'Preventivo', '22/08/2026', 'Mantenimiento de 250 h: cambio de empaquetaduras de placas y limpieza CIP ácida', 'Servicio técnico externo', 'Media', [['Juego de empaquetaduras', 1, 380]], 6, 'Programada', '', 450),
    O('OT-2026-081', 'EQ-PL-02', 'Preventivo', '19/08/2026', 'Mantenimiento mensual: revisión de válvula de seguridad, manómetro y agitador', 'Taller UNAS · M. Pinedo', 'Media', [], 2, 'Programada'),
    O('OT-2026-080', 'EQ-MA-01', 'Preventivo', '02/08/2026', 'Mantenimiento de 250 h: cambio de aceite de motor, filtros de aceite, combustible y aire', 'Taller UNAS · J. Rengifo', 'Media', [['Aceite de motor 15W-40 (galón)', 4, 78], ['Kit de filtros', 1, 265]], 4, 'Cerrada', '02/08/2026'),
    O('OT-2026-079', 'EQ-EL-01', 'Preventivo', '30/07/2026', 'Cambio de pezoneras (16) y revisión de pulsadores y bomba de vacío', 'Servicio técnico DeLaval', 'Alta', [['Juego de pezoneras (16)', 1, 420]], 3, 'Cerrada', '30/07/2026', 280),
    O('OT-2026-078', 'EQ-PL-05', 'Correctivo', '24/07/2026', 'Fuga de refrigerante R-404A en la unidad condensadora · 14 h de parada', 'Frío Andino (externo)', 'Alta', [['Refrigerante R-404A (kg)', 6, 55]], 6, 'Cerrada', '25/07/2026', 350),
    O('OT-2026-077', 'EQ-GP-01', 'Correctivo', '18/07/2026', 'Rotura de fajas del molino de martillos', 'Taller UNAS · M. Pinedo', 'Media', [['Faja B-52', 3, 38]], 3, 'Cerrada', '18/07/2026'),
    O('OT-2026-076', 'EQ-AV-01', 'Preventivo', '10/07/2026', 'Limpieza de quemadores y revisión de reguladores de gas antes de la campaña', 'Taller UNAS · M. Pinedo', 'Media', [], 2, 'Cerrada', '10/07/2026')
  ];
})();
