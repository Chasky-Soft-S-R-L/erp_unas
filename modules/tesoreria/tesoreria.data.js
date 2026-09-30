/* Tesorería · procesos T-01 a T-15 */
SIGA.data.tesoreria = {
  cp: [
    { doc: 'C/P 2026-0614', fecha: '18/08/2026', benef: 'Servicios Informáticos Selva EIRL', ruc: '20457812093', concepto: 'Servicio de red de datos · julio', medio: 'Abono CCI', ref: 'CCI •••8890', bruto: 18000, detr: 2160, ret: 0, neto: 15840, estado: 'Girado', user: 'K. Ramos', spot: 'Demás servicios gravados con el IGV' },
    { doc: 'C/P 2026-0613', fecha: '18/08/2026', benef: 'Consorcio Constructor Tingo María', ruc: '20605541237', concepto: 'Valorización N.º 5 · pabellón de laboratorios', medio: 'Abono CCI', ref: 'CCI •••3310', bruto: 312400, detr: 12496, ret: 0, neto: 299904, estado: 'Girado', user: 'K. Ramos', spot: 'Contratos de construcción' },
    { doc: 'C/P 2026-0612', fecha: '18/08/2026', benef: 'Distribuidora Agropecuaria del Huallaga SAC', ruc: '20489217701', concepto: 'Víveres para el Comedor Universitario', medio: 'Abono CCI', ref: 'CCI •••4521', bruto: 12480, detr: 0, ret: 0, neto: 12480, estado: 'Pagado', user: 'K. Ramos', aprob: 'L. Vargas' },
    { doc: 'C/P 2026-0611', fecha: '17/08/2026', benef: 'J. Ruiz · locador de servicios', ruc: '10458830211', concepto: 'Servicios profesionales · RH E001-44', medio: 'Cheque', ref: 'Cheque •••8904', bruto: 3500, detr: 0, ret: 280, neto: 3220, estado: 'Pagado', user: 'K. Ramos', aprob: 'L. Vargas' },
    { doc: 'C/P 2026-0610', fecha: '17/08/2026', benef: 'Planilla CAS · agosto 2026 (145 trabajadores)', ruc: '—', concepto: 'Remuneraciones CAS', medio: 'Abono masivo', ref: 'Lote 00213', bruto: 486200, detr: 0, ret: 64820, neto: 421380, estado: 'Pagado', user: 'K. Ramos', aprob: 'L. Vargas' },
    { doc: 'C/P 2026-0607', fecha: '14/08/2026', benef: 'Importaciones Tecnológicas del Perú SAC', ruc: '20531900871', concepto: 'Equipos de cómputo · Ciberseguridad', medio: 'Abono CCI', ref: 'CCI •••1102', bruto: 30800, detr: 0, ret: 0, neto: 30800, estado: 'Girado', user: 'K. Ramos', cert: '000415' }
  ],
  bancos: [
    { banco: 'Banco de la Nación', cta: '00-068-••4521', fte: '00 · Recursos Ordinarios', tipo: 'Cta. Cte.', libros: 612300.00, extracto: 612300.00 },
    { banco: 'Banco de la Nación', cta: '00-068-••7830', fte: '09 · RDR', tipo: 'Cta. Cte.', libros: 486920.50, extracto: 486265.50 },
    { banco: 'Banco de la Nación', cta: '00-068-••9102', fte: '18 · Canon y sobrecanon', tipo: 'Cta. Cte.', libros: 3842000.00, extracto: 3842000.00 },
    { banco: 'BCP', cta: '193-••••-8890', fte: '13 · Donaciones y transf.', tipo: 'Cta. Cte.', libros: 158760.00, extracto: 158760.00 },
    { banco: 'Interbank', cta: '200-••••-1120', fte: '09 · RDR · centros de producción', tipo: 'Ahorros', libros: 71420.00, extracto: 71420.00 }
  ],
  cheques: [
    { num: '•••8905', fecha: '18/08/2026', benef: 'Transportes León de Huánuco', monto: 190, estado: 'En cartera' },
    { num: '•••8904', fecha: '17/08/2026', benef: 'J. Ruiz · locador', monto: 3220, estado: 'Entregado' },
    { num: '•••8903', fecha: '15/08/2026', benef: 'Mg. P. Vela · comisión VIA-2026-0219', monto: 2570, estado: 'Entregado' },
    { num: '•••8902', fecha: '14/08/2026', benef: 'Ferretería Central', monto: 1890, estado: 'Entregado' },
    { num: '•••8901', fecha: '12/08/2026', benef: 'Comercial Ferretera Tingo María SRL', monto: 4320, estado: 'Cobrado' },
    { num: '•••8899', fecha: '05/08/2026', benef: 'Error de emisión', monto: 0, estado: 'Anulado' }
  ],
  // Sistema de detracciones (SPOT) · % por tipo de bien o servicio
  spot: [['Demás servicios gravados con el IGV', 12], ['Mantenimiento y reparación de bienes muebles', 12], ['Intermediación laboral y tercerización', 12], ['Arrendamiento de bienes', 10], ['Contratos de construcción', 4], ['Servicio de transporte de bienes', 4], ['No sujeto a detracción', 0]],
  // Flujo de caja proyectado · 12 semanas (miles de soles)
  flujo: { sem: ['S34', 'S35', 'S36', 'S37', 'S38', 'S39', 'S40', 'S41', 'S42', 'S43', 'S44', 'S45'], ing: [620, 180, 950, 210, 640, 190, 980, 220, 660, 200, 1010, 240], egr: [410, 380, 1420, 520, 460, 390, 1480, 560, 470, 410, 1510, 590] },
  // Conciliación bancaria · Cta. RDR ••7830
  conc: {
    extracto: [
      ['05/08', 'Depósito · recibos R-08835 a R-08840', 12450.00, 'DEP-0231'], ['08/08', 'Cargo · C/P 2026-0588', -8940.00, 'C/P 2026-0588'],
      ['12/08', 'Depósito · recibos R-08841 a R-08846', 9820.00, 'DEP-0236'], ['14/08', 'Comisión de mantenimiento de cuenta', -25.00, null],
      ['16/08', 'Depósito · recibos R-08847 a R-08851', 7120.00, 'DEP-0239'], ['17/08', 'Cheque cobrado •••8901', -4320.00, 'CH-8901']
    ],
    libros: [
      ['05/08', 'DEP-0231 · depósito RDR', 12450.00, 'DEP-0231'], ['08/08', 'C/P 2026-0588', -8940.00, 'C/P 2026-0588'],
      ['12/08', 'DEP-0236 · depósito RDR', 9820.00, 'DEP-0236'], ['16/08', 'DEP-0239 · depósito RDR', 7120.00, 'DEP-0239'],
      ['17/08', 'Cheque •••8901', -4320.00, 'CH-8901'], ['14/08', 'Cheque •••8902 · Ferretería Central', -1890.00, 'CH-8902'],
      ['18/08', 'DEP-0241 · depósito RDR (tarde)', 2520.00, 'DEP-0241']
    ],
    hecho: false
  },
  abono: [
    ['Distribuidora Agropecuaria del Huallaga SAC', '20489217701', '0018-0068-0000452199-11', 18960.00],
    ['Seguridad Integral Huallaga SAC', '20571123409', '0021-0193-0000887411-54', 57000.00],
    ['Comercial Ferretera Tingo María SRL', '20601188342', '0018-0068-0000913370-02', 4320.00],
    ['J. Ruiz · locador de servicios', '10458830211', '0003-0200-0003321187-45', 3220.00]
  ]
};

/* Ampliación de la muestra: comprobantes de pago de agosto (C/P 0590–0609) y sus cheques */
(function () {
  const T = SIGA.data.tesoreria, G = SIGA.gen, r = G.rng(4040);
  const BEN = [
    ['Seguridad Integral Huallaga SAC', '20571123409', 'Servicio de vigilancia y seguridad · julio', 'Demás servicios gravados con el IGV', 52000, 58000],
    ['Distribuidora Agropecuaria del Huallaga SAC', '20489217701', 'Alimento balanceado para la Granja Porcina', 'No sujeto a detracción', 6000, 19000],
    ['Comercial Ferretera Tingo María SRL', '20601188342', 'Materiales de construcción · mantenimiento de aulas', 'No sujeto a detracción', 1800, 9500],
    ['Transportes León de Huánuco EIRL', '20542213380', 'Transporte de bienes Lima–Tingo María', 'Servicio de transporte de bienes', 1200, 4800],
    ['Electro Oriente SA', '20103795631', 'Suministro de energía eléctrica · julio', 'No sujeto a detracción', 38000, 52000],
    ['EPS Seda Huánuco SA', '20146037201', 'Servicio de agua potable y alcantarillado · julio', 'No sujeto a detracción', 7200, 9800],
    ['Telefónica del Perú SAA', '20100017491', 'Internet dedicado 500 Mbps · julio', 'No sujeto a detracción', 8400, 8400],
    ['Imprenta Selva SAC', '20603321551', 'Impresión de prospectos de admisión 2026-II', 'Demás servicios gravados con el IGV', 3500, 12000],
    ['AgroVet Selva SAC', '20600932115', 'Medicamentos veterinarios para el plantel', 'No sujeto a detracción', 900, 5200],
    ['Consultora Ambiental Amazonía EIRL', '20600871124', 'Monitoreo ambiental de la planta de tratamiento', 'Demás servicios gravados con el IGV', 6000, 14000],
    ['Mantenimiento Industrial Selva SAC', '20602233419', 'Mantenimiento de tractor agrícola y motocultor', 'Mantenimiento y reparación de bienes muebles', 2400, 7800],
    ['Combustibles del Oriente SAC', '20603945211', 'Combustible para maquinaria y vehículos', 'No sujeto a detracción', 4200, 11800],
    ['A. Chávez · locador de servicios', '10467712093', 'Servicios profesionales de asesoría legal · RH E001-18', 'No sujeto a detracción', 3200, 3200],
    ['R. Pinedo · locador de servicios', '10722210981', 'Apoyo administrativo en Mesa de Partes · RH E001-07', 'No sujeto a detracción', 1400, 1400]
  ];
  const nums = [609, 608, 606, 605, 604, 603, 602, 601, 600, 599, 598, 597, 596, 595, 594, 593, 592, 591, 590];
  let ch = 8898;
  nums.forEach((n, i) => {
    const doc = 'C/P 2026-' + G.pad(n, 4), dia = n >= 608 ? 229 : 226 - Math.floor((606 - n) / 1.5);
    let row;
    if (n === 598) row = { doc, fecha: G.fecha(r, dia, dia), benef: 'Planilla de pensionistas D.L. 20530 · agosto 2026 (212 pensionistas)', ruc: '—', concepto: 'Pensiones del régimen 20530', medio: 'Abono masivo', ref: 'Lote 00209', bruto: 684300, detr: 0, ret: 0, neto: 684300 };
    else if (n === 591) row = { doc, fecha: G.fecha(r, dia, dia), benef: 'SUNAT · tributos retenidos de julio', ruc: '20131312955', concepto: 'PDT PLAME 0601 · renta 4.ª y 5.ª, ONP, EsSalud', medio: 'Carta orden', ref: 'NPS 1180044213', bruto: 182640, detr: 0, ret: 0, neto: 182640 };
    else {
      const b = BEN[i % BEN.length], rh = b[1].startsWith('10'), bruto = G.amt(r, b[4], b[5], 10);
      const pd = rh || bruto <= 700 ? 0 : (T.spot.find(s => s[0] === b[3]) || [0, 0])[1];
      const detr = Math.round(bruto * pd) / 100, ret = rh && bruto > 1500 ? Math.round(bruto * 8) / 100 : 0;
      const medio = rh || i % 5 === 3 ? 'Cheque' : 'Abono CCI';
      row = { doc, fecha: G.fecha(r, dia, dia), benef: b[0], ruc: b[1], concepto: b[2], medio, ref: medio === 'Cheque' ? 'Cheque •••' + (ch--) : 'CCI •••' + G.int(r, 1000, 9999), bruto, detr, ret, neto: Math.round((bruto - detr - ret) * 100) / 100, spot: pd ? b[3] : undefined };
    }
    row.estado = n === 608 ? 'Girado' : n === 596 ? 'Anulado' : 'Pagado';
    row.user = 'K. Ramos'; if (row.estado === 'Pagado') row.aprob = 'L. Vargas';
    if (row.estado === 'Anulado') { row.anulado = true; row.motivo = 'CCI del beneficiario observado por el banco · se reemite'; }
    T.cp.push(row);
    if (row.medio === 'Cheque') T.cheques.push({ num: row.ref.replace('Cheque ', ''), fecha: row.fecha, benef: row.benef, monto: row.neto, estado: row.estado === 'Pagado' ? 'Cobrado' : row.estado === 'Anulado' ? 'Anulado' : 'Entregado', cp: doc });
  });
  T.cp.sort((a, b) => b.doc.localeCompare(a.doc));
})();
