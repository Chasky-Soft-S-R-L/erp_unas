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
