/* Abastecimiento · procesos A-01 a A-20 · documentos de la Tabla 16 y Anexo G del informe */
SIGA.data.abastecimiento = {
  // Los diez documentos del generador (pitch lámina 18)
  docTipos: {
    oc: { t: 'Orden de Compra', s: 'Bienes · con certificación', ico: 'fa-cart-shopping', num: '000513', docTp: 'Orden de Compra', modo: 'val', of: 'Unidad de Abastecimiento' },
    os: { t: 'Orden de Servicio', s: 'Obras · SIGA · saldo de balance', ico: 'fa-screwdriver-wrench', num: '000304', docTp: 'Orden de Servicio', modo: 'val', of: 'Unidad de Abastecimiento' },
    pec: { t: 'PECOSA', s: 'Salida de almacén', ico: 'fa-dolly', num: '001843', docTp: 'PECOSA · Pedido Comprobante de Salida', modo: 'alm', of: 'Unidad de Almacén' },
    nea: { t: 'NEA', s: 'Entrada a almacén', ico: 'fa-inbox', num: '000319', docTp: 'Nota de Entrada a Almacén', modo: 'alm', of: 'Unidad de Almacén' },
    via: { t: 'Planilla de viáticos', s: 'Escala por cargo × días', ico: 'fa-plane-departure', num: '0232', docTp: 'Planilla de Viáticos', modo: 'via', of: 'Dirección General de Administración' },
    bol: { t: 'Bolsa de viaje', s: 'Pasajes, separado del viático', ico: 'fa-ticket', num: '0158', docTp: 'Bolsa de Viaje · Pasajes', modo: 'bol', of: 'Dirección General de Administración' },
    cch: { t: 'Caja chica', s: 'Rendición de comprobantes', ico: 'fa-wallet', num: '0019', docTp: 'Rendición de Caja Chica', modo: 'cch', of: 'Unidad de Tesorería' },
    enc: { t: 'Encargo interno', s: 'Con resolución y plazo', ico: 'fa-hand-holding-dollar', num: '037', docTp: 'Encargo Interno', modo: 'enc', of: 'Unidad de Tesorería' },
    ppp: { t: 'Prácticas preprofesionales', s: 'Subvención semestral', ico: 'fa-user-graduate', num: '0042', docTp: 'Planilla de Subvención · Prácticas Preprofesionales', modo: 'ben', of: 'Dirección General de Administración' },
    ayu: { t: 'Ayudantía de cátedra', s: 'Con resolución decanal', ico: 'fa-chalkboard-user', num: '0027', docTp: 'Planilla de Ayudantía de Cátedra', modo: 'ben', of: 'Dirección General de Administración' }
  },
  // Escala de viáticos por cargo (S/ por día) · parametrizada, antes se calculaba fuera del sistema
  escala: [['Rector / Vicerrector', 380], ['Decano / Director General', 340], ['Docente principal o asociado', 320], ['Docente auxiliar / Profesional administrativo', 280], ['Técnico / Personal de apoyo', 240]],
  topeMovilidad: 45, topeCajaChica: 500, montoPracticas: 1800, montoAyudantia: 1500,
  proveedores: [
    { ruc: '20489217701', rs: 'Distribuidora Agropecuaria del Huallaga SAC', ord: 24, tiempo: 96, calidad: 4.6, pen: 0 },
    { ruc: '20601188342', rs: 'Comercial Ferretera Tingo María SRL', ord: 18, tiempo: 89, calidad: 4.2, pen: 1 },
    { ruc: '20457812093', rs: 'Servicios Informáticos Selva EIRL', ord: 6, tiempo: 100, calidad: 4.8, pen: 0 },
    { ruc: '20531900871', rs: 'Importaciones Tecnológicas del Perú SAC', ord: 9, tiempo: 78, calidad: 4.0, pen: 2 },
    { ruc: '20600455120', rs: 'Ferretería Industrial Amazónica SAC', ord: 7, tiempo: 57, calidad: 3.1, pen: 3 },
    { ruc: '20487711234', rs: 'Veterinaria El Ganadero EIRL', ord: 11, tiempo: 91, calidad: 4.4, pen: 0 }
  ],
  requerimientos: [
    { num: 'REQ 2026-0938', fecha: '18/08/2026', cc: 'Granja Zootecnia', desc: 'Vacunas y antiparasitarios para el plantel porcino', monto: 2301, estado: 'En evaluación', user: 'P. Huamán', aprob: '', saldo: true },
    { num: 'REQ 2026-0937', fecha: '18/08/2026', cc: 'Unidad Ejecutora de Inversiones', desc: 'Servicio de supervisión de obra · pabellón de laboratorios', monto: 48600, estado: 'En evaluación', user: 'J. Paredes', aprob: '', saldo: true },
    { num: 'REQ 2026-0934', fecha: '17/08/2026', cc: 'DGA — Jefatura', desc: 'Servicio de operación y soporte de la red de datos', monto: 18000, estado: 'Aprobado', user: 'J. Paredes', aprob: 'A. Torres', saldo: true },
    { num: 'REQ 2026-0931', fecha: '16/08/2026', cc: 'Lab. Análisis de Suelos', desc: 'Reactivos para análisis de fertilidad de suelos', monto: 4380, estado: 'Observado', user: 'J. Paredes', aprob: 'A. Torres', obs: 'Especificaciones técnicas incompletas (concentración y presentación)', saldo: true },
    { num: 'REQ 2026-0928', fecha: '17/08/2026', cc: 'Granja Zootecnia', desc: 'Alimento balanceado porcino · etapa de engorde', monto: 12480, estado: 'Atendido', user: 'P. Huamán', aprob: 'A. Torres', saldo: true }
  ],
  ordenes: [
    { doc: 'O/C 000512', fecha: '18/08/2026', prov: 'Distribuidora Agropecuaria del Huallaga SAC', ref: 'Insumos de laboratorio', cert: '000410', part: '2.3.1 9.9 1', imp: 6720, plazo: 10, entrega: '28/08/2026', estado: 'Emitida', cls: 't-blue' },
    { doc: 'O/C 000511', fecha: '17/08/2026', prov: 'Distribuidora Agropecuaria del Huallaga SAC', ref: 'Alimento balanceado porcino', cert: '000417', part: '2.3.1 1.1 3', imp: 12480, plazo: 5, entrega: '22/08/2026', estado: 'Pendiente de entrega', cls: 't-amber' },
    { doc: 'O/C 000503', fecha: '12/08/2026', prov: 'Importaciones Tecnológicas del Perú SAC', ref: 'Equipos de cómputo · Ciberseguridad', cert: '000415', part: '2.6.3 2.3 1', imp: 30800, plazo: 5, entrega: '17/08/2026', estado: 'Atendida', cls: 't-green' },
    { doc: 'O/C 000498', fecha: '10/08/2026', prov: 'Comercial Ferretera Tingo María SRL', ref: 'Útiles de oficina · Vicerrectorado', cert: '000414', part: '2.3.1 5.1 1', imp: 5420, plazo: 3, entrega: '13/08/2026', estado: 'Atendida', cls: 't-green' },
    { doc: 'O/C 000489', fecha: '01/08/2026', prov: 'Ferretería Industrial Amazónica SAC', ref: 'Repuestos para tractor agrícola', cert: '000402', part: '2.3.1 6.1 1', imp: 8940, plazo: 7, entrega: '08/08/2026', estado: 'Atrasada', cls: 't-red', atraso: 10 },
    { doc: 'O/S 000301', fecha: '02/01/2026', prov: 'Seguridad Integral Huallaga SAC', ref: 'Vigilancia del campus (anual)', cert: '000012', part: '2.3.2 2.9 1', imp: 684000, plazo: 365, entrega: '31/12/2026', estado: 'Vigente', cls: 't-teal', variante: 'Otros' },
    { doc: 'O/S 000298', fecha: '02/01/2026', prov: 'Servicios Informáticos Selva EIRL', ref: 'Operación de red de datos (anual)', cert: '000009', part: '2.3.2 7.11 99', imp: 216000, plazo: 365, entrega: '31/12/2026', estado: 'Vigente', cls: 't-teal', variante: 'SIGA' }
  ],
  // Indagación de mercado y cuadro comparativo (A-04 · A-05)
  cotizacion: {
    req: 'REQ 2026-0938', objeto: 'Vacunas y antiparasitarios para el plantel porcino',
    items: [['Vacuna contra peste porcina clásica · frasco 50 dosis', 'FRASCO', 12], ['Ivermectina 1% · frasco 500 ml', 'FRASCO', 6], ['Vitamina AD3E · frasco 250 ml', 'FRASCO', 10]],
    provs: [
      { rs: 'Veterinaria El Ganadero EIRL', ruc: '20487711234', precios: [118.00, 86.50, 42.00], plazo: 3, cumple: true, obs: 'Cumple RTM' },
      { rs: 'Distribuidora Agropecuaria del Huallaga SAC', ruc: '20489217701', precios: [112.50, 92.00, 39.90], plazo: 5, cumple: true, obs: 'Cumple RTM' },
      { rs: 'AgroVet Selva SAC', ruc: '20609932187', precios: [104.00, 80.00, 38.00], plazo: 10, cumple: false, obs: 'No cumple · registro SENASA vencido' }
    ],
    adjudicado: ''
  },
  cajaChica: {
    fondo: 5000, resol: 'Resolución Directoral N.º 045-2026-DGA', niveles: ['Lic. R. Salazar · responsable titular (1.er nivel)', 'Bach. K. Ramos · suplente (2.º nivel)', 'Jefe de Tesorería · supervisión (3.er nivel)'],
    comprobantes: [
      ['03/08', 'Boleta', 'B001-2231', 'Librería Huallaga', 'Útiles para mesa de partes', 86.40],
      ['04/08', 'Factura', 'F002-0921', 'Ferretería Central', 'Candados para almacén', 145.00],
      ['05/08', 'Boleta', 'B003-7710', 'Transportes Rupa Rupa', 'Movilidad de documentos', 35.00],
      ['06/08', 'Factura', 'F001-3312', 'Grifo Tingo María', 'Combustible grupo electrógeno', 320.00],
      ['07/08', 'Recibo por honorarios', 'E001-45', 'J. Ruiz · gasfitero', 'Reparación de servicios higiénicos', 280.00],
      ['08/08', 'Boleta', 'B001-0098', 'Farmacia Universitaria', 'Reposición de botiquín', 118.60],
      ['11/08', 'Factura', 'F001-1177', 'Imprenta Selva', 'Formatos de control', 460.00],
      ['12/08', 'Boleta', 'B002-4410', 'Supermercado Tingo', 'Refrigerio sesión de Consejo', 395.00],
      ['13/08', 'Factura', 'F003-0081', 'Electro Huallaga', 'Focos LED para pasadizos (lote)', 1210.00],
      ['14/08', 'Boleta', 'B001-6612', 'Courier Selva Express', 'Envío de documentos a Lima', 58.00],
      ['15/08', 'Boleta', 'B001-9981', 'Cerrajería El Llavero', 'Duplicado de llaves', 42.00],
      ['15/08', 'Ticket', 'T-331', 'Playa de estacionamiento', 'Estacionamiento en diligencia', 12.00]
    ],
    reposiciones: [['R-2026-07', '31/07/2026', 4120.50, 'Aprobada'], ['R-2026-06', '30/06/2026', 3890.10, 'Aprobada']]
  },
  encargos: [
    { num: 'ENC-2026-031', resp: 'Ing. R. Salazar', resol: 'R.D. N.º 112-2026-DGA', act: 'Inspección de campo · Fundo Tulumayo', monto: 3500, entrega: '20/07/2026', vence: '04/08/2026', rendido: 0, estado: 'Vencido', dias: 14 },
    { num: 'ENC-2026-034', resp: 'Dr. M. Paucar', resol: 'R.D. N.º 118-2026-DGA', act: 'Organización de la feria agropecuaria universitaria', monto: 6800, entrega: '05/08/2026', vence: '20/08/2026', rendido: 4200, estado: 'Por rendir', dias: -2 },
    { num: 'ENC-2026-036', resp: 'Lic. S. Rojas', resol: 'R.D. N.º 121-2026-DGA', act: 'Proyección social en Aucayacu', monto: 2400, entrega: '12/08/2026', vence: '27/08/2026', rendido: 0, estado: 'Por rendir', dias: -9 },
    { num: 'ENC-2026-028', resp: 'Ing. L. Castañeda', resol: 'R.D. N.º 097-2026-DGA', act: 'Muestreo de suelos en parcelas experimentales', monto: 1900, entrega: '01/07/2026', vence: '16/07/2026', rendido: 1900, estado: 'Rendido', dias: 0 }
  ],
  comisiones: [
    { num: 'VIA-2026-0231', com: 'Dr. H. Flores', cargo: 'Docente principal o asociado', dest: 'Lima', dias: 3, viat: 960, pasaje: 1140, estado: 'Por rendir', vence: '28/08/2026' },
    { num: 'VIA-2026-0226', com: 'Ing. R. Salazar', cargo: 'Docente auxiliar / Profesional administrativo', dest: 'Huánuco', dias: 2, viat: 560, pasaje: 90, estado: 'Rendición vencida', vence: '10/08/2026' },
    { num: 'VIA-2026-0219', com: 'Mg. P. Vela', cargo: 'Decano / Director General', dest: 'Lima', dias: 4, viat: 1360, pasaje: 1210, estado: 'Rendido', vence: '02/08/2026' }
  ],
  subvenciones: {
    practicas: [
      ['Agronomía', 18, 'Res. Decanal N.º 214-2026-FA', '2026-I', 'Pagado'], ['Zootecnia', 12, 'Res. Decanal N.º 176-2026-FZ', '2026-I', 'Pagado'],
      ['Ingeniería en Industrias Alimentarias', 9, 'Res. Decanal N.º 098-2026-FIIA', '2026-I', 'Pagado'], ['Recursos Naturales Renovables', 11, 'Res. Decanal N.º 133-2026-FRNR', '2026-II', 'Por pagar']
    ],
    ayudantias: [
      ['0020140231', 'Bach. L. Tello', 'Bachiller', 'Nutrición animal', 'Zootecnia', 'Res. Decanal N.º 187-2026-FZ', 'Vigente'],
      ['0020190417', 'Est. D. Huamán', 'Estudiante X ciclo', 'Fisiología vegetal', 'Agronomía', 'Res. Decanal N.º 201-2026-FA', 'Vigente'],
      ['0020190502', 'Est. R. Aquino', 'Estudiante IX ciclo', 'Química general', 'Industrias Alimentarias', 'Res. Decanal N.º 091-2026-FIIA', 'Vigente']
    ]
  },
  contratos: [
    { num: 'CONT-014', obj: 'Obra · Mejoramiento del pabellón de laboratorios de Agronomía', con: 'Consorcio Constructor Tingo María', monto: 8640000, inicio: '01/04/2026', plazo: 240, garantia: 'Carta fianza S/ 864,000.00 · vence 30/12/2026', adendas: 1, avance: 22, estado: 'En ejecución' },
    { num: 'CONT-019', obj: 'Servicio de vigilancia del campus', con: 'Seguridad Integral Huallaga SAC', monto: 684000, inicio: '02/01/2026', plazo: 365, garantia: 'Carta fianza S/ 68,400.00 · vence 31/08/2026', adendas: 0, avance: 62, estado: 'En ejecución', alerta: 'Carta fianza vence en 13 días' },
    { num: 'CONT-021', obj: 'Suministro de víveres para el Comedor Universitario', con: 'Distribuidora Agropecuaria del Huallaga SAC', monto: 918000, inicio: '01/03/2026', plazo: 300, garantia: 'Retención del 10% (MYPE)', adendas: 0, avance: 55, estado: 'En ejecución' }
  ],
  pac: [
    ['PROC-2026-01', 'Adquisición de equipos de laboratorio', 'Licitación Pública', 480000, 'II', 'Adjudicado', 't-green', 'Vicerrectorado de Investigación'],
    ['PROC-2026-04', 'Servicio de mantenimiento de infraestructura', 'Concurso Público', 320000, 'III', 'Evaluación de ofertas', 't-blue', 'DGA — Jefatura'],
    ['PROC-2026-07', 'Suministro de insumos agropecuarios', 'Adjudicación Simplificada', 96000, 'III', 'Convocado', 't-amber', 'Granja Zootecnia'],
    ['PROC-2026-09', 'Supervisión de obra · pabellón de laboratorios', 'Concurso Público', 486000, 'III', 'Actos preparatorios', 't-gray', 'Unidad Ejecutora de Inversiones'],
    ['PROC-2026-11', 'Adquisición de tractor agrícola con implementos', 'Licitación Pública', 385000, 'IV', 'Programado', 't-gray', 'Servicios de maquinaria agrícola']
  ]
};

/* ---- Registros históricos del periodo (generados de forma determinista) ---- */
(function () {
  const A = SIGA.data.abastecimiento, G = SIGA.gen, r = G.rng(3030);
  A.proveedores.push(
    { ruc: '20571123409', rs: 'Seguridad Integral Huallaga SAC', ord: 2, tiempo: 100, calidad: 4.5, pen: 0 },
    { ruc: '20605541237', rs: 'Consorcio Constructor Tingo María', ord: 1, tiempo: 83, calidad: 4.1, pen: 0 },
    { ruc: '20603321551', rs: 'Imprenta Selva SAC', ord: 8, tiempo: 75, calidad: 3.9, pen: 1 },
    { ruc: '20600871124', rs: 'Consultora Ambiental Amazonía EIRL', ord: 3, tiempo: 67, calidad: 3.8, pen: 1 },
    { ruc: '20609932187', rs: 'AgroVet Selva SAC', ord: 4, tiempo: 88, calidad: 4.0, pen: 0 },
    { ruc: '20612240093', rs: 'Librería y Papelería Huallaga EIRL', ord: 14, tiempo: 93, calidad: 4.3, pen: 0 },
    { ruc: '20601877341', rs: 'Combustibles del Oriente SAC', ord: 12, tiempo: 98, calidad: 4.6, pen: 0 },
    { ruc: '20487005512', rs: 'Laboratorios Químicos Andinos SAC', ord: 5, tiempo: 80, calidad: 4.2, pen: 1 }
  );
  const bienes = [['Útiles de escritorio · Facultad de Agronomía', 'Librería y Papelería Huallaga EIRL', '2.3.1 5.1 1'], ['Combustible diésel B5 para maquinaria', 'Combustibles del Oriente SAC', '2.3.1 3.1 1'], ['Reactivos de laboratorio de suelos', 'Laboratorios Químicos Andinos SAC', '2.3.1 8.2 1'], ['Alimento balanceado porcino inicio', 'Distribuidora Agropecuaria del Huallaga SAC', '2.3.1 1.1 3'], ['Repuestos para camioneta institucional', 'Comercial Ferretera Tingo María SRL', '2.3.1 6.1 1'], ['Vacunas y productos veterinarios', 'Veterinaria El Ganadero EIRL', '2.3.1 8.2 1'], ['Víveres para el Comedor Universitario', 'Distribuidora Agropecuaria del Huallaga SAC', '2.3.1 1.1 1'], ['Tóner y consumibles de impresión', 'Importaciones Tecnológicas del Perú SAC', '2.3.1 5.1 2']];
  const servicios = [['Mantenimiento de grupo electrógeno', 'Comercial Ferretera Tingo María SRL', '2.3.2 4.1 1', 'Otros'], ['Impresión de formatos institucionales', 'Imprenta Selva SAC', '2.3.2 2.4 4', 'Otros'], ['Estudio de impacto ambiental · planta de alimentos', 'Consultora Ambiental Amazonía EIRL', '2.3.2 7.2 1', 'SIGA'], ['Soporte del sistema de biblioteca', 'Servicios Informáticos Selva EIRL', '2.3.2 7.11 99', 'SIGA']];
  const est = [['Atendida', 't-green'], ['Atendida', 't-green'], ['Atendida', 't-green'], ['Pendiente de entrega', 't-amber'], ['Atendida', 't-green'], ['Emitida', 't-blue'], ['Atendida', 't-green'], ['Anulada', 't-red']];
  const certs = SIGA.data.presupuesto.certificaciones.filter(c => /Pagado|Girado|Devengado|Comprometido/.test(c.fase)).map(c => c.num);
  for (let i = 0; i < 18; i++) {
    const os = i % 4 === 3, b = os ? G.pick(r, servicios) : G.pick(r, bienes), e = G.pick(r, est), dia = 211 + Math.floor(i / 2);
    const plazo = os ? G.pick(r, [15, 30, 45]) : G.pick(r, [3, 5, 7, 10]), f = G.fecha(r, dia, dia);
    const [dd, mm] = f.split('/').map(Number), fe = new Date(2026, mm - 1, dd + plazo);
    A.ordenes.push({ doc: (os ? 'O/S ' + G.pad(297 - i) : 'O/C ' + G.pad(497 - i)), fecha: f, prov: b[1], ref: b[0], cert: G.pick(r, certs), part: b[2], imp: G.amt(r, 900, os ? 16000 : 9500, 10), plazo, entrega: String(fe.getDate()).padStart(2, '0') + '/' + String(fe.getMonth() + 1).padStart(2, '0') + '/2026', estado: e[0], cls: e[1], variante: os ? b[3] : undefined, anulado: e[0] === 'Anulada' || undefined, motivo: e[0] === 'Anulada' ? 'Proveedor no aceptó la orden' : undefined });
  }
  const ccs = ['Facultad de Agronomía', 'Facultad de Zootecnia', 'Comedor Universitario', 'Lab. Análisis de Suelos', 'Vicerrectorado Académico', 'Granja Zootecnia', 'Planta de Lácteos', 'DGA — Jefatura'];
  const descs = ['Materiales de laboratorio para prácticas', 'Mantenimiento de equipos de cómputo', 'Insumos para la planta de lácteos', 'Uniformes para personal de campo', 'Mobiliario para aulas', 'Servicio de fumigación de ambientes', 'Semillas certificadas para campaña', 'Combustible para maquinaria agrícola', 'Artículos de limpieza', 'Equipos de protección personal'];
  for (let i = 0; i < 12; i++) {
    const e = G.pick(r, ['Atendido', 'Atendido', 'Aprobado', 'Atendido', 'Observado', 'Aprobado']);
    A.requerimientos.push({ num: 'REQ 2026-' + G.pad(926 - i * 3, 4), fecha: G.fecha(r, 214 + Math.floor((11 - i) / 2), 214 + Math.floor((11 - i) / 2)), cc: G.pick(r, ccs), desc: G.pick(r, descs), monto: G.amt(r, 800, 26000, 10), estado: e, user: G.pick(r, ['J. Paredes', 'P. Huamán']), aprob: 'A. Torres', saldo: true, obs: e === 'Observado' ? 'Adjuntar términos de referencia firmados' : undefined });
  }
  A.encargos.push(
    { num: 'ENC-2026-026', resp: 'Dr. H. Flores', resol: 'R.D. N.º 090-2026-DGA', act: 'Visita técnica a productores de cacao', monto: 2200, entrega: '20/06/2026', vence: '05/07/2026', rendido: 2200, estado: 'Rendido', dias: 0 },
    { num: 'ENC-2026-024', resp: 'Mg. P. Vela', resol: 'R.D. N.º 084-2026-DGA', act: 'Evento de aniversario de la Facultad', monto: 4800, entrega: '02/06/2026', vence: '17/06/2026', rendido: 4800, estado: 'Rendido', dias: 0 },
    { num: 'ENC-2026-021', resp: 'Lic. S. Rojas', resol: 'R.D. N.º 071-2026-DGA', act: 'Campaña de salud estudiantil', monto: 1500, entrega: '15/05/2026', vence: '30/05/2026', rendido: 1500, estado: 'Rendido', dias: 0 }
  );
  A.comisiones.push(
    { num: 'VIA-2026-0214', com: 'Dr. J. Arévalo', cargo: 'Docente principal o asociado', dest: 'Huánuco', dias: 2, viat: 640, pasaje: 70, estado: 'Rendido', vence: '28/07/2026' },
    { num: 'VIA-2026-0209', com: 'E. Mendoza', cargo: 'Decano / Director General', dest: 'Lima', dias: 3, viat: 1020, pasaje: 1180, estado: 'Rendido', vence: '20/07/2026' },
    { num: 'VIA-2026-0202', com: 'Ing. L. Castañeda', cargo: 'Docente auxiliar / Profesional administrativo', dest: 'Pucallpa', dias: 4, viat: 1120, pasaje: 160, estado: 'Rendido', vence: '12/07/2026' },
    { num: 'VIA-2026-0198', com: 'Rector', cargo: 'Rector / Vicerrector', dest: 'Lima', dias: 2, viat: 760, pasaje: 1240, estado: 'Rendido', vence: '05/07/2026' }
  );
  A.contratos.push(
    { num: 'CONT-022', obj: 'Servicio de limpieza de ambientes', con: 'Servicios Generales Rupa Rupa SAC', monto: 312000, inicio: '01/02/2026', plazo: 330, garantia: 'Carta fianza S/ 31,200.00 · vence 31/01/2027', adendas: 0, avance: 58, estado: 'En ejecución' },
    { num: 'CONT-018', obj: 'Suministro de combustible', con: 'Combustibles del Oriente SAC', monto: 186000, inicio: '15/01/2026', plazo: 350, garantia: 'Retención del 10% (MYPE)', adendas: 1, avance: 64, estado: 'En ejecución' },
    { num: 'CONT-011', obj: 'Adquisición de equipos de laboratorio', con: 'Laboratorios Químicos Andinos SAC', monto: 468500, inicio: '10/05/2026', plazo: 60, garantia: 'Carta fianza S/ 46,850.00 · liberada', adendas: 0, avance: 100, estado: 'Culminado' }
  );
  A.pac.push(
    ['PROC-2026-02', 'Servicio de limpieza de ambientes', 'Concurso Público', 312000, 'I', 'Contrato suscrito', 't-green', 'DGA — Jefatura'],
    ['PROC-2026-03', 'Suministro de combustible', 'Adjudicación Simplificada', 186000, 'I', 'Contrato suscrito', 't-green', 'Servicios de maquinaria agrícola'],
    ['PROC-2026-05', 'Adquisición de mobiliario para aulas', 'Adjudicación Simplificada', 142000, 'III', 'Integración de bases', 't-blue', 'Vicerrectorado Académico'],
    ['PROC-2026-06', 'Servicio de seguridad y vigilancia 2027', 'Concurso Público', 720000, 'IV', 'Actos preparatorios', 't-gray', 'DGA — Jefatura'],
    ['PROC-2026-08', 'Adquisición de reactivos de laboratorio', 'Subasta Inversa Electrónica', 88000, 'III', 'Convocado', 't-amber', 'Lab. Análisis de Suelos']
  );
})();
