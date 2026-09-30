/* Almacén · procesos L-01 a L-12 · tablero pedido por Almacén (pitch láminas 19–20) */
SIGA.data.almacen = {
  kpiBase: { enStock: 1284, entregados: 312, pendientes: 47, bajoMin: 23 },
  items: [
    { cod: '740805000071', desc: 'Papel bond A4 75 g', um: 'MILLAR', ubic: 'Central · A-01-02', stock: 420, min: 100, max: 600, cprom: 22.03 },
    { cod: '231611008471', desc: 'Tóner HP 26A para impresora láser', um: 'UNIDAD', ubic: 'Central · A-02-01', stock: 18, min: 20, max: 80, cprom: 320 },
    { cod: '231100010045', desc: 'Alimento balanceado porcino engorde · saco 40 kg', um: 'SACO', ubic: 'Granja · G-01', stock: 36, min: 60, max: 300, cprom: 101.5, pendiente: 'O/C 000511' },
    { cod: '231100010031', desc: 'Alimento balanceado porcino inicio · saco 40 kg', um: 'SACO', ubic: 'Granja · G-02', stock: 120, min: 40, max: 200, cprom: 112 },
    { cod: '740805000233', desc: 'Lapicero de tinta seca color azul', um: 'CAJA', ubic: 'Central · A-01-05', stock: 64, min: 20, max: 150, cprom: 18.5 },
    { cod: '231100070119', desc: 'Combustible diésel B5 S-50', um: 'GALÓN', ubic: 'Tanque · T-01', stock: 240, min: 200, max: 1000, cprom: 17.4 },
    { cod: '230800030012', desc: 'Reactivo de laboratorio · kit de fertilidad de suelos', um: 'KIT', ubic: 'Laboratorio · L-03-02', stock: 6, min: 15, max: 60, cprom: 145, pendiente: 'O/C 000512' },
    { cod: '740805000410', desc: 'Archivador de cartón con palanca', um: 'UNIDAD', ubic: 'Central · A-01-07', stock: 210, min: 50, max: 400, cprom: 3.73 },
    { cod: '235600100021', desc: 'Guantes de nitrilo · caja x 100', um: 'CAJA', ubic: 'Laboratorio · L-01-04', stock: 0, min: 10, max: 60, cprom: 28.5, dep: 'Lab. Sistemas de Producción' },
    { cod: '180200040011', desc: 'Cemento Portland tipo I · bolsa 42.5 kg', um: 'BOLSA', ubic: 'Patio · P-02', stock: 3, min: 20, max: 200, cprom: 32, dep: 'Unidad Ejecutora de Inversiones' },
    { cod: '231100090034', desc: 'Vacuna contra peste porcina clásica · frasco 50 dosis', um: 'FRASCO', ubic: 'Cámara fría · CF-01', stock: 8, min: 6, max: 40, cprom: 112.5, venc: '30/11/2026' },
    { cod: '231100090051', desc: 'Vitamina AD3E · frasco 250 ml', um: 'FRASCO', ubic: 'Cámara fría · CF-01', stock: 12, min: 5, max: 30, cprom: 39.9, venc: '05/09/2026' },
    { cod: '231100060022', desc: 'Urea agrícola · saco 50 kg', um: 'SACO', ubic: 'Campo · C-01', stock: 45, min: 30, max: 200, cprom: 118 },
    { cod: '231100080015', desc: 'Envase de vidrio 1 L (Planta de Lácteos)', um: 'UNIDAD', ubic: 'Planta lácteos · PL-02', stock: 480, min: 300, max: 2000, cprom: 1.35 },
    { cod: '231100080044', desc: 'Café pergamino (insumo de la planta)', um: 'KG', ubic: 'Planta café · PC-01', stock: 850, min: 400, max: 3000, cprom: 9.8 }
  ],
  // Tablero de movimientos: entregado · pendiente de entrega (los "por pedir" se calculan del stock)
  movs: [
    { doc: 'PECOSA 001842', cod: '740805000071', item: 'Papel bond A4 · 75 g', dep: 'Facultad de Agronomía', cant: 40, fecha: '18/08', estado: 'Entregado', pidio: 'Secretaría · Fac. Agronomía', autorizo: 'Decano de Agronomía', recibio: 'M. Soto', hora: '18/08 09:40' },
    { doc: 'PECOSA 001841', cod: '231611008471', item: 'Tóner HP 26A', dep: 'Vicerrectorado Académico', cant: 6, fecha: '18/08', estado: 'Entregado', pidio: 'Asistente del Vicerrectorado', autorizo: 'Vicerrector Académico', recibio: 'R. Llanos', hora: '18/08 08:55' },
    { doc: 'NEA 000318', cod: '231100010031', item: 'Alimento balanceado inicio · saco', dep: 'Granja Porcina', cant: 120, fecha: '17/08', estado: 'Pendiente de entrega', pidio: 'P. Huamán', autorizo: 'Jefe de Abastecimiento', recibio: '— por despachar', hora: '17/08 16:20', nota: 'Recibido del proveedor con NEA · por despachar' },
    { doc: 'O/C 000512', cod: '230800030012', item: 'Reactivo de laboratorio · kit', dep: 'Lab. Análisis de Suelos', cant: 15, fecha: '18/08', estado: 'Pendiente de entrega', pidio: 'Jefe de Laboratorio', autorizo: 'Jefe de Abastecimiento', recibio: '— proveedor no entrega', hora: '18/08 08:05', nota: 'Comprometido en orden · el proveedor aún no entrega' },
    { doc: 'O/C 000511', cod: '231100010045', item: 'Alimento balanceado engorde · saco', dep: 'Granja Porcina', cant: 120, fecha: '17/08', estado: 'Pendiente de entrega', pidio: 'P. Huamán', autorizo: 'Jefe de Abastecimiento', recibio: '— proveedor no entrega', hora: '17/08 15:40', nota: 'Comprometido en orden · entrega hasta el 22/08' },
    { doc: 'PECOSA 001840', cod: '231100070119', item: 'Combustible diésel B5', dep: 'Servicios de maquinaria agrícola', cant: 120, fecha: '17/08', estado: 'Entregado', pidio: 'Operador de maquinaria', autorizo: 'Jefe de Servicios', recibio: 'A. Pérez', hora: '17/08 07:30' },
    { doc: 'PECOSA 001839', cod: '231100060022', item: 'Urea agrícola · saco 50 kg', dep: 'Campos de arroz · campaña 2026-B', cant: 20, fecha: '16/08', estado: 'Entregado', pidio: 'Responsable de campaña', autorizo: 'Jefe del Centro de Producción', recibio: 'L. Rengifo', hora: '16/08 10:15', nota: 'Salida a campaña agrícola (L-12)' }
  ],
  // Kárdex valorizado por costo promedio ponderado: [fecha, documento, detalle, 'E'|'S'|'I', cantidad, costo unitario (solo entradas)]
  kardex: {
    '740805000071': [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', 380, 21.80], ['05/08', 'NEA 000309', 'Ingreso · O/C 000495', 'E', 200, 22.50], ['08/08', 'PECOSA 001820', 'Salida · Comedor Universitario', 'S', 60], ['12/08', 'PECOSA 001831', 'Salida · Vicerrectorado Académico', 'S', 45], ['15/08', 'NEA 000316', 'Ingreso · O/C 000502', 'E', 100, 23.10], ['16/08', 'PECOSA 001836', 'Salida · Facultad de Zootecnia', 'S', 115], ['18/08', 'PECOSA 001842', 'Salida · Facultad de Agronomía', 'S', 40]],
    '231100010045': [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', 90, 101.50], ['06/08', 'PECOSA 001822', 'Salida · Granja Porcina · lote E-118', 'S', 30], ['12/08', 'PECOSA 001830', 'Salida · Granja Porcina · lote E-121', 'S', 24]],
    '231100070119': [['01/08', 'Saldo inicial', 'Inventario al 31/07', 'I', 180, 17.10], ['04/08', 'NEA 000305', 'Ingreso · O/C 000491', 'E', 300, 17.55], ['09/08', 'PECOSA 001826', 'Salida · maquinaria agrícola', 'S', 120], ['17/08', 'PECOSA 001840', 'Salida · maquinaria agrícola', 'S', 120]]
  },
  // Toma de inventario físico programada
  inventario: { fecha: '15/08/2026', almacen: 'Almacén central', conteo: { '740805000071': 418, '231611008471': 18, '740805000233': 65, '231100070119': 236.5, '740805000410': 210 } },
  transferencias: [
    ['TRF-2026-014', '14/08/2026', 'Almacén central', 'Almacén Granja Zootecnia', 'Vitamina AD3E · 6 frascos', 'Recibido'],
    ['TRF-2026-013', '07/08/2026', 'Almacén central', 'Almacén Planta de Lácteos', 'Envases de vidrio 1 L · 500 und', 'Recibido']
  ],
  bajas: [
    ['BAJ-2026-003', '12/08/2026', 'Reactivos vencidos · 4 kits', 'Vencimiento', 'Res. Directoral N.º 108-2026-DGA', 580],
    ['BAJ-2026-002', '20/07/2026', 'Balanza analítica averiada', 'Deterioro', 'Res. Directoral N.º 091-2026-DGA', 2350]
  ],
  custodia: [
    ['CUS-2026-004', 'Equipo de georradar (préstamo del INIA)', 'Instituto Nacional de Innovación Agraria', '30/09/2026'],
    ['CUS-2026-003', 'Mobiliario del proyecto CONCYTEC', 'CONCYTEC', '31/12/2026']
  ]
};

/* Ampliación de la muestra: catálogo, despachos con PECOSA de agosto y registros de apoyo */
(function () {
  const L = SIGA.data.almacen;
  L.items.push(
    { cod: '740805000512', desc: 'Folder manila A4 · paquete x 25', um: 'PAQUETE', ubic: 'Central · A-01-09', stock: 140, min: 30, max: 200, cprom: 12.5 },
    { cod: '740805000618', desc: 'Cuaderno de registro empastado 200 hojas', um: 'UNIDAD', ubic: 'Central · A-01-11', stock: 55, min: 20, max: 120, cprom: 14.9 },
    { cod: '231611008512', desc: 'Tóner Brother TN-3479 para impresora láser', um: 'UNIDAD', ubic: 'Central · A-02-03', stock: 9, min: 10, max: 40, cprom: 285, pendiente: 'REQ 2026-0926' },
    { cod: '740805000799', desc: 'Tinta para impresora Epson T664 · frasco', um: 'FRASCO', ubic: 'Central · A-02-05', stock: 4, min: 12, max: 60, cprom: 33 },
    { cod: '231100050077', desc: 'Semilla de arroz certificada INIA 509 · saco 40 kg', um: 'SACO', ubic: 'Campo · C-02', stock: 68, min: 40, max: 200, cprom: 165 },
    { cod: '231100060041', desc: 'Fosfato diamónico · saco 50 kg', um: 'SACO', ubic: 'Campo · C-01', stock: 52, min: 30, max: 150, cprom: 142 },
    { cod: '231100090088', desc: 'Ivermectina 1 % · frasco 500 ml', um: 'FRASCO', ubic: 'Cámara fría · CF-02', stock: 14, min: 6, max: 30, cprom: 86, venc: '15/03/2027' },
    { cod: '231100080061', desc: 'Fermento láctico para yogur · sobre 50 U', um: 'SOBRE', ubic: 'Planta lácteos · PL-01', stock: 22, min: 10, max: 60, cprom: 48.5, venc: '20/10/2026' },
    { cod: '231100080077', desc: 'Azúcar rubia · bolsa 50 kg', um: 'BOLSA', ubic: 'Planta lácteos · PL-03', stock: 18, min: 10, max: 60, cprom: 172 },
    { cod: '235600100045', desc: 'Mascarilla N95 · caja x 20', um: 'CAJA', ubic: 'Laboratorio · L-01-05', stock: 25, min: 10, max: 50, cprom: 64 },
    { cod: '180200040023', desc: 'Fierro corrugado 1/2" · varilla 9 m', um: 'VARILLA', ubic: 'Patio · P-01', stock: 160, min: 50, max: 400, cprom: 38.9 },
    { cod: '231100070131', desc: 'Gasolina 90 octanos', um: 'GALÓN', ubic: 'Tanque · T-02', stock: 95, min: 80, max: 400, cprom: 18.2 }
  );
  // Despachos del mes: los que figuran en el kárdex llevan exactamente su documento y cantidad
  const P = (n, cod, dep, cant, dia, pidio, autorizo, recibio, h) => ({ doc: 'PECOSA 0018' + n, cod, item: (L.items.find(i => i.cod === cod) || {}).desc, dep, cant, fecha: dia, estado: 'Entregado', pidio, autorizo, recibio, hora: dia + ' ' + h });
  L.movs.push(
    P(38, '740805000233', 'Facultad de Ingeniería en Informática', 6, '16/08', 'Secretaría · FIIS', 'Decano de Informática', 'C. Pinedo', '11:20'),
    P(37, '740805000410', 'Oficina de Tesorería', 20, '16/08', 'K. Ramos', 'Tesorero', 'K. Ramos', '10:05'),
    P(36, '740805000071', 'Facultad de Zootecnia', 115, '16/08', 'Secretaría · Fac. Zootecnia', 'Decano de Zootecnia', 'E. Vásquez', '09:12'),
    P(35, '235600100021', 'Lab. Sistemas de Producción', 10, '15/08', 'Jefe de Laboratorio', 'Jefe de Abastecimiento', 'G. Tello', '15:40'),
    P(34, '231100090034', 'Granja Porcina', 4, '15/08', 'P. Huamán', 'Jefe del Centro de Producción', 'Médico veterinario', '08:30'),
    P(33, '231100060022', 'Campos de arroz · campaña 2026-B', 25, '14/08', 'Responsable de campaña', 'Jefe del Centro de Producción', 'L. Rengifo', '07:45'),
    P(32, '231100080015', 'Planta de Lácteos', 300, '13/08', 'Jefe de planta', 'Jefe del Centro de Producción', 'N. Flores', '10:30'),
    P(31, '740805000071', 'Vicerrectorado Académico', 45, '12/08', 'Asistente del Vicerrectorado', 'Vicerrector Académico', 'R. Llanos', '12:10'),
    P(30, '231100010045', 'Granja Porcina · lote E-121', 24, '12/08', 'P. Huamán', 'Jefe del Centro de Producción', 'Técnico de granja', '07:20'),
    P(29, '231100080044', 'Planta de Café', 400, '11/08', 'Jefe de planta', 'Jefe del Centro de Producción', 'H. Saavedra', '09:50'),
    P(28, '231611008471', 'Oficina de Contabilidad', 2, '11/08', 'R. Soto', 'Contador General', 'Asistente contable', '16:05'),
    P(27, '231100090051', 'Granja Zootecnia', 6, '10/08', 'Médico veterinario', 'Jefe del Centro de Producción', 'Técnico pecuario', '08:15'),
    P(26, '231100070119', 'Servicios de maquinaria agrícola', 120, '09/08', 'Operador de maquinaria', 'Jefe de Servicios', 'A. Pérez', '07:05'),
    P(25, '180200040011', 'Unidad Ejecutora de Inversiones', 40, '08/08', 'Residente de obra', 'Jefe de la UEI', 'Ing. D. Chávez', '14:25'),
    P(20, '740805000071', 'Comedor Universitario', 60, '08/08', 'Administrador del comedor', 'Jefe de Bienestar', 'S. Ramírez', '10:40'),
    P(24, '740805000233', 'Dirección General de Administración', 4, '07/08', 'Secretaría DGA', 'Director General de Administración', 'M. Tello', '11:35'),
    P(23, '740805000410', 'Oficina de Abastecimiento', 30, '07/08', 'J. Paredes', 'Jefe de Abastecimiento', 'J. Paredes', '09:00'),
    P(22, '231100010045', 'Granja Porcina · lote E-118', 30, '06/08', 'P. Huamán', 'Jefe del Centro de Producción', 'Técnico de granja', '07:10'),
    P(21, '231100010031', 'Granja Porcina', 40, '06/08', 'P. Huamán', 'Jefe del Centro de Producción', 'Técnico de granja', '07:00')
  );
  L.movs.splice(3, 0, { doc: 'NEA 000317', cod: '231100060041', item: 'Fosfato diamónico · saco 50 kg', dep: 'Campos de arroz · campaña 2026-B', cant: 30, fecha: '17/08', estado: 'Pendiente de entrega', pidio: 'Responsable de campaña', autorizo: 'Jefe de Abastecimiento', recibio: '— por despachar', hora: '17/08 11:05', nota: 'Recibido del proveedor con NEA · por despachar' });
  L.transferencias.push(
    ['TRF-2026-012', '31/07/2026', 'Almacén central', 'Almacén Planta de Café', 'Sacos de yute · 200 und', 'Recibido'],
    ['TRF-2026-011', '24/07/2026', 'Almacén Granja Zootecnia', 'Almacén central', 'Vacunas por reasignar · 4 frascos', 'Recibido'],
    ['TRF-2026-010', '10/07/2026', 'Almacén central', 'Almacén Campos agrícolas', 'Urea agrícola · 40 sacos', 'Recibido']
  );
  L.transferencias.unshift(['TRF-2026-015', '18/08/2026', 'Almacén central', 'Almacén Campos agrícolas', 'Fosfato diamónico · 10 sacos', 'En tránsito']);
  L.bajas.push(['BAJ-2026-001', '15/06/2026', 'Material de limpieza deteriorado por humedad', 'Deterioro', 'Res. Directoral N.º 074-2026-DGA', 410]);
  L.bajas.unshift(['BAJ-2026-004', '18/08/2026', 'Vitamina AD3E · 3 frascos por vencer', 'Vencimiento', 'Informe técnico N.º 022-2026-ALM', 119.7, 'En trámite']);
  L.custodia.push(
    ['CUS-2026-002', 'Planta piloto de biogás (convenio)', 'Gobierno Regional de Huánuco', '31/03/2027'],
    ['CUS-2026-001', 'Motocultor · préstamo municipal', 'Municipalidad Provincial de Leoncio Prado', '15/09/2026']
  );
})();
