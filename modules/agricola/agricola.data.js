/* Control agrícola · procesos CA-01 a CA-09 (informe Tabla 34) */
SIGA.data.agricola = {
  parcelas: [
    { id: 'P-01', nom: 'Lote Tulumayo A', ha: 8.5, ubic: 'Fundo Tulumayo · sector La Divisoria', suelo: 'Franco arcilloso', riego: 'Gravedad (canal)', cultivo: 'Arroz' },
    { id: 'P-02', nom: 'Lote Tulumayo B', ha: 6.0, ubic: 'Fundo Tulumayo · sector La Divisoria', suelo: 'Franco arcilloso', riego: 'Gravedad (canal)', cultivo: 'Arroz' },
    { id: 'P-03', nom: 'Lote La Divisoria', ha: 5.2, ubic: 'Fundo Tulumayo', suelo: 'Franco', riego: 'Secano', cultivo: 'Maíz' },
    { id: 'P-04', nom: 'Platanera del campus', ha: 3.8, ubic: 'Campus universitario · margen del río Huallaga', suelo: 'Aluvial', riego: 'Secano', cultivo: 'Plátano' },
    { id: 'P-05', nom: 'Parcela de café', ha: 4.0, ubic: 'Campus universitario · ladera', suelo: 'Franco arenoso', riego: 'Secano', cultivo: 'Café' },
    { id: 'P-06', nom: 'Parcela de cacao', ha: 3.2, ubic: 'Campus universitario', suelo: 'Franco', riego: 'Goteo', cultivo: 'Cacao' },
    { id: 'P-07', nom: 'Vivero forestal', ha: 0.6, ubic: 'Campus universitario', suelo: 'Sustrato', riego: 'Aspersión', cultivo: 'Plantones' }
  ],
  // costo por ha: [mano de obra, maquinaria, insumos, riego, otros]
  campanas: [
    { id: 'C-2026-B01', parcela: 'P-01', cultivo: 'Arroz · var. Bellavista', siembra: '05/05/2026', cosecha: '05/09/2026', fase: 'Maduración', avance: 85, rendProg: 6.5, rendReal: null, precio: 1.45, costo: [2850, 1420, 2480, 380, 290], estado: 'En campaña' },
    { id: 'C-2026-B02', parcela: 'P-02', cultivo: 'Arroz · var. Bellavista', siembra: '20/05/2026', cosecha: '20/09/2026', fase: 'Llenado de grano', avance: 72, rendProg: 6.5, rendReal: null, precio: 1.45, costo: [2790, 1380, 2410, 360, 280], estado: 'En campaña' },
    { id: 'C-2026-B03', parcela: 'P-03', cultivo: 'Maíz amarillo duro · Marginal 28 Tropical', siembra: '10/06/2026', cosecha: '10/10/2026', fase: 'Floración', avance: 55, rendProg: 5.2, rendReal: null, precio: 1.30, costo: [1650, 980, 1920, 0, 210], estado: 'En campaña' },
    { id: 'C-2026-A01', parcela: 'P-01', cultivo: 'Arroz · var. Bellavista', siembra: '02/11/2025', cosecha: '28/03/2026', fase: 'Cosechada', avance: 100, rendProg: 6.5, rendReal: 6.1, precio: 1.40, costo: [2780, 1390, 2350, 370, 280], estado: 'Cerrada' },
    { id: 'C-2026-A02', parcela: 'P-02', cultivo: 'Arroz · var. Bellavista', siembra: '15/11/2025', cosecha: '10/04/2026', fase: 'Cosechada', avance: 100, rendProg: 6.5, rendReal: 6.8, precio: 1.40, costo: [2700, 1360, 2330, 350, 270], estado: 'Cerrada' },
    { id: 'C-2025-B03', parcela: 'P-03', cultivo: 'Maíz amarillo duro · Marginal 28 Tropical', siembra: '12/06/2025', cosecha: '15/10/2025', fase: 'Cosechada', avance: 100, rendProg: 5.2, rendReal: 4.6, precio: 1.25, costo: [1600, 950, 1860, 0, 200], estado: 'Cerrada' }
  ],
  fases: ['Preparación', 'Siembra', 'Macollamiento / crecimiento', 'Floración', 'Llenado de grano', 'Maduración', 'Cosecha', 'Poscosecha'],
  labores: [
    ['16/08', 'C-2026-B01', 'Control fitosanitario (piricularia)', 3, 0, 195],
    ['14/08', 'C-2026-B03', 'Aporque y deshierbo', 12, 0, 780],
    ['12/08', 'C-2026-B02', 'Fertilización 3.ª (potasio)', 4, 0, 260],
    ['05/08', 'C-2026-B01', 'Riego de mantenimiento', 2, 0, 130],
    ['28/06', 'C-2026-B01', 'Fertilización 2.ª (urea)', 4, 0, 260],
    ['10/06', 'C-2026-B03', 'Siembra mecanizada', 6, 8, 1360],
    ['10/06', 'C-2026-B01', 'Control de malezas', 6, 0, 390],
    ['05/05', 'C-2026-B01', 'Trasplante', 38, 0, 2470],
    ['03/05', 'C-2026-B01', 'Preparación de terreno (fangueo)', 4, 12, 2320]
  ],
  insumos: [
    ['16/08', 'C-2026-B01', 'Fungicida triciclazol', '0.5 L/ha', '4.25 L', 382.5],
    ['12/08', 'C-2026-B02', 'Cloruro de potasio', '1 saco/ha', '6 sacos', 588],
    ['28/06', 'C-2026-B01', 'Urea agrícola', '2 sacos/ha', '17 sacos', 2006],
    ['10/06', 'C-2026-B03', 'Semilla certificada Marginal 28 T', '25 kg/ha', '130 kg', 1105],
    ['10/06', 'C-2026-B03', 'Fosfato diamónico', '2 sacos/ha', '10.4 sacos', 1352],
    ['25/05', 'C-2026-B01', 'Urea agrícola', '2 sacos/ha', '17 sacos', 2006],
    ['05/05', 'C-2026-B01', 'Semilla certificada var. Bellavista', '40 kg/ha', '340 kg', 1360]
  ],
  riego: [['17/08', 'C-2026-B02', 'Riego por gravedad · 6 h', '1,800 m³', 118], ['09/08', 'C-2026-B01', 'Riego por gravedad · 8 h', '2,550 m³', 156], ['30/07', 'C-2026-B02', 'Riego por gravedad · 6 h', '1,800 m³', 118]],
  platano: { racimosSem: [118, 124, 121, 130, 127, 133, 129, 136], labels: ['S27', 'S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34'] }
};
