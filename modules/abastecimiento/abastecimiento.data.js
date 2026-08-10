SIGA.data.abastecimiento = {
  docTipos: {
    oc: { t: 'Orden de Compra', s: 'Bienes · SIGA', ico: 'fa-cart-shopping', num: '0895', docTp: 'Orden de Compra' },
    os: { t: 'Orden de Servicio', s: 'Servicios · obras', ico: 'fa-screwdriver-wrench', num: '0452', docTp: 'Orden de Servicio' },
    via: { t: 'Planilla de Viáticos', s: 'Bolsa de viaje', ico: 'fa-plane-departure', num: '0231', docTp: 'Bolsa de Viaje / Viáticos' },
    pec: { t: 'PECOSA', s: 'Salida de almacén', ico: 'fa-dolly', num: '1129', docTp: 'PECOSA · Pedido Comprobante de Salida' },
    nea: { t: 'NEA', s: 'Entrada a almacén', ico: 'fa-inbox', num: '0241', docTp: 'Nota de Entrada a Almacén' }
  },
  itemsSemilla: {
    oc: [['740805000082', 'Papel bond A4 de 80 g', 'MILLAR', 20, 26], ['231611008471', 'Tóner para impresora láser', 'UNIDAD', 6, 320], ['055300010036', 'Cuaderno de laboratorio', 'UNIDAD', 40, 8.5]],
    os: [['170100031921', 'Servicio de mantenimiento de equipos', 'SERVICIO', 1, 3200], ['607500070061', 'Servicio de calibración de balanzas', 'SERVICIO', 4, 450]],
    pec: [['740805000082', 'Papel bond A4 de 80 g', 'MILLAR', 10, 26], ['055300010036', 'Cuaderno de laboratorio', 'UNIDAD', 15, 8.5]],
    nea: [['231611008471', 'Tóner para impresora láser', 'UNIDAD', 6, 320]]
  },
  proveedores: ['Distribuidora Agropecuaria del Huallaga SAC', 'Comercial Ferretera Tingo María SRL', 'Servicios Informáticos Selva EIRL', 'Importaciones Tecnológicas del Perú SAC'],
  ordenes: [
    { doc: 'O/C 0894', fecha: '18/12/2025', prov: 'Distribuidora Agropecuaria del Huallaga SAC', ref: 'Insumos de laboratorio', part: '2.2.1 1.1 1', imp: 12480, estado: 'Atendida', cls: 't-green' },
    { doc: 'O/S 0451', fecha: '17/12/2025', prov: 'Servicios Informáticos Selva EIRL', ref: 'Operación de red de datos', part: '2.2.2 3.1 1', imp: 18000, estado: 'En proceso', cls: 't-blue' },
    { doc: 'O/C 0893', fecha: '16/12/2025', prov: 'Comercial Ferretera Tingo María SRL', ref: 'Repuestos maquinaria', part: '2.3.1 5.1 2', imp: 4320, estado: 'Atendida', cls: 't-green' },
    { doc: 'O/C 0892', fecha: '15/12/2025', prov: 'Importaciones Tecnológicas del Perú SAC', ref: 'Equipos de cómputo', part: '2.6.3 2.2 1', imp: 23100, estado: 'Pendiente', cls: 't-amber' }
  ],
  kardex: [
    ['02/12', 'NEA-0231', 'Ingreso · compra', 500, 0, 500, 6250, 't-green'],
    ['08/12', 'PS-1120', 'Salida · comedor', 0, 180, 320, 4000, 't-blue'],
    ['15/12', 'PS-1128', 'Salida · laboratorio', 0, 90, 230, 2875, 't-blue'],
    ['20/12', 'NEA-0240', 'Ingreso · compra', 300, 0, 530, 6625, 't-green']
  ],
  stock: [
    ['2.2.1 1.1 1', 'Papel bond A4 (millar)', 420, 100, 600, 6300, 'Normal', 't-green'],
    ['2.3.1 5.1 2', 'Tóner de impresora', 18, 20, 80, 5400, 'Reponer', 't-amber'],
    ['2.3.1 3.1 1', 'Combustible diésel (gal)', 240, 200, 1000, 4080, 'Normal', 't-green'],
    ['2.3.1 8.1 1', 'Reactivos de laboratorio', 6, 15, 60, 3600, 'Crítico', 't-red']
  ],
  pac: [
    ['PROC-041', 'Adquisición de equipos de laboratorio', 'Licitación Pública', 480000, 'III', 'Adjudicado', 't-green'],
    ['PROC-052', 'Servicio de mantenimiento de infraestructura', 'Concurso Público', 320000, 'IV', 'En proceso', 't-blue'],
    ['PROC-058', 'Suministro de insumos agropecuarios', 'Adjud. Simplificada', 96000, 'IV', 'Convocado', 't-amber']
  ]
};
