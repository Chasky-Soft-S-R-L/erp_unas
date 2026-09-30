/* Datos 2026 · fuente: informe técnico SIGA-U (Tabla 3, Tabla 4, Figura 18) y pitch a autoridades */
SIGA.data.presupuesto = {
  pia: 57918430.00,
  // PIM y ejecución por fuente de financiamiento (suma = S/ 70,927,492.75 · devengado S/ 14,152,229.48)
  fuentes: [
    { cod: '00', nom: 'Recursos Ordinarios', pim: 24180000.00, cert: 17420000, dev: 8120000.00 },
    { cod: '09', nom: 'Recursos Directamente Recaudados', pim: 7360000.00, cert: 5210000, dev: 3412229.48 },
    { cod: '13', nom: 'Donaciones y Transferencias', pim: 3117492.75, cert: 1690355.10, dev: 580000.00 },
    { cod: '18', nom: 'Canon, sobrecanon y regalías', pim: 36270000.00, cert: 17500000, dev: 2040000.00 }
  ],
  genericas: [
    { cod: '2.3', nom: 'Bienes y servicios', pim: 12840000.00, dev: 7460000.00 },
    { cod: '2.4', nom: 'Donaciones y transferencias', pim: 1257492.75, dev: 322229.48 },
    { cod: '2.5', nom: 'Otros gastos', pim: 1620000.00, dev: 940000.00 },
    { cod: '2.6', nom: 'Adquisición de activos no financieros', pim: 55210000.00, dev: 5430000.00 }
  ],
  fases: { cert: 41820355.10, comp: 27640112.35, dev: 14152229.48, gir: 13721840.02, pag: 13508917.66 },
  cuadro: { items: 7209, centros: 254, programado: 48913007.82, ejecutado: 14152229.48 },

  // Marco por específica: llave fuente + meta + clasificador (control de disponibilidad)
  // certTotal = total certificado a la fecha (incluye las certificaciones listadas abajo)
  marco: [
    { id: 'M01', fte: '00', meta: '0087', cc: '104.07.08.01', ccn: 'DGA — Jefatura', clasif: '2.3.1 5.1 2', desc: 'Repuestos y accesorios', pim: 48000, certTotal: 47200 },
    { id: 'M02', fte: '00', meta: '0087', cc: '104.07.08.01', ccn: 'DGA — Jefatura', clasif: '2.3.2 7.11 99', desc: 'Servicios diversos', pim: 420000, certTotal: 318400 },
    { id: 'M11', fte: '00', meta: '0087', cc: '104.07.08.01', ccn: 'DGA — Jefatura', clasif: '2.3.2 1.2 2', desc: 'Viáticos y asignaciones por comisión de servicio', pim: 64000, certTotal: 58960 },
    { id: 'M03', fte: '00', meta: '0091', cc: '104.08.01', ccn: 'Vicerrectorado Académico — Jefatura', clasif: '2.3.1 5.1 1', desc: 'Papelería en general, útiles y materiales de oficina', pim: 96000, certTotal: 71300 },
    { id: 'M07', fte: '00', meta: '0087', cc: '104.08.02.07', ccn: 'Comedor Universitario', clasif: '2.3.1 1.1 1', desc: 'Alimentos y bebidas para consumo humano', pim: 1120000, certTotal: 1098400 },
    { id: 'M04', fte: '09', meta: '0115', cc: '104.07.13.03.02', ccn: 'Lab. Sist. Prod. Ganadera — Granja Zootecnia', clasif: '2.3.1 1.1 3', desc: 'Alimentos de animales', pim: 186000, certTotal: 172900 },
    { id: 'M12', fte: '09', meta: '0115', cc: '104.07.13.03.02', ccn: 'Lab. Sist. Prod. Ganadera — Granja Zootecnia', clasif: '2.3.1 8.2 1', desc: 'Material e insumos de uso veterinario', pim: 38000, certTotal: 38600, heredado: true },
    { id: 'M05', fte: '09', meta: '0118', cc: '104.07.13.03.15', ccn: 'Proyecto Planta Procesadora de Alimentos', clasif: '2.3.1 9.9 1', desc: 'Insumos agroindustriales', pim: 64000, certTotal: 3600 },
    { id: 'M10', fte: '09', meta: '0121', cc: '104.09.02.03', ccn: 'Centro Preuniversitario', clasif: '2.3.2 7.2 99', desc: 'Servicios de docencia y capacitación', pim: 210000, certTotal: 168400 },
    { id: 'M09', fte: '00', meta: '0095', cc: '104.07.21.07', ccn: 'P.A. Ingeniería en Ciberseguridad', clasif: '2.6.3 2.3 1', desc: 'Equipos computacionales y periféricos', pim: 92000, certTotal: 30800 },
    { id: 'M08', fte: '13', meta: '0102', cc: '104.07.08.04', ccn: 'Unidad Ejecutora de Inversiones', clasif: '2.6.3 2.3 1', desc: 'Equipos computacionales y periféricos', pim: 1240000, certTotal: 612000 },
    { id: 'M06', fte: '18', meta: '0102', cc: '104.07.08.04', ccn: 'Unidad Ejecutora de Inversiones', clasif: '2.6.2 2.2 3', desc: 'Infraestructura educativa · ejecución de obra', pim: 38500000, certTotal: 21640000 },
    { id: 'M13', fte: '00', meta: '0087', cc: '104.07.08.01', ccn: 'DGA — Jefatura', clasif: '2.3.2 2.4 4', desc: 'Servicio de impresiones, encuadernación y empastado', pim: 3000, certTotal: 7600, heredado: true }
  ],

  certificaciones: [
    { num: '000419', fecha: '18/08/2026', marco: 'M11', monto: 2100, fase: 'Pendiente de aprobación', user: 'C. Quinto', aprob: '', siaf: '', exp: 'EXP-2026-0419', just: 'Comisión de servicio a Lima · sustentación de proyecto ante CONCYTEC',
      items: [['—', 'Viáticos 3 días × S/ 320 (Docente asociado)', 'DÍA', 3, 320], ['—', 'Pasaje terrestre Tingo María – Lima (ida y vuelta)', 'SERVICIO', 1, 1140]] },
    { num: '000418', fecha: '18/08/2026', marco: 'M02', monto: 18000, fase: 'Certificado', user: 'C. Quinto', aprob: 'M. Ríos', siaf: '2026-0004630', exp: 'EXP-2026-0418', just: 'Servicio de operación y soporte de la red de datos institucional',
      items: [['170100031921', 'Servicio de operación de red de datos', 'SERVICIO', 1, 18000]] },
    { num: '000417', fecha: '17/08/2026', marco: 'M04', monto: 12480, fase: 'Comprometido', user: 'C. Quinto', aprob: 'M. Ríos', siaf: '2026-0004618', exp: 'EXP-2026-0417', just: 'Alimento balanceado para la Granja Porcina · etapa de engorde',
      items: [['231100010045', 'Alimento balanceado porcino engorde · saco 40 kg', 'SACO', 120, 104]] },
    { num: '000416', fecha: '16/08/2026', marco: 'M06', monto: 246900, fase: 'Devengado', user: 'C. Quinto', aprob: 'M. Ríos', siaf: '2026-0004601', exp: 'EXP-2026-0416', just: 'Valorización N.º 6 · Mejoramiento del pabellón de laboratorios de Agronomía',
      items: [['—', 'Valorización N.º 6 de obra', 'GLB', 1, 246900]] },
    { num: '000415', fecha: '14/08/2026', marco: 'M09', monto: 30800, fase: 'Girado', user: 'C. Quinto', aprob: 'M. Ríos', siaf: '2026-0004577', exp: 'EXP-2026-0415', just: 'Equipamiento del laboratorio de Ingeniería en Ciberseguridad',
      items: [['740805000082', 'Computadora personal portátil', 'UNIDAD', 8, 3850]] },
    { num: '000413', fecha: '11/08/2026', marco: 'M03', monto: 9800, fase: 'Certificado', user: 'C. Quinto', aprob: 'M. Ríos', siaf: '2026-0004541', exp: 'EXP-2026-0413', just: 'Útiles de escritorio y consumibles de impresión · Vicerrectorado Académico',
      items: [['740805000071', 'Papel bond A4 75 g', 'MILLAR', 150, 26], ['231611008471', 'Tóner HP 26A para impresora láser', 'UNIDAD', 12, 375], ['740805000410', 'Archivador de cartón con palanca', 'UNIDAD', 140, 10.00]] },
    { num: '000414', fecha: '12/08/2026', marco: 'M03', monto: 5420, fase: 'Pagado', user: 'C. Quinto', aprob: 'M. Ríos', siaf: '2026-0004550', exp: 'EXP-2026-0414', just: 'Útiles de oficina para el Vicerrectorado Académico',
      items: [['740805000071', 'Papel bond A4 75 g', 'MILLAR', 120, 26], ['231611008471', 'Tóner HP 26A', 'UNIDAD', 6, 375], ['740805000410', 'Archivador de cartón con palanca', 'UNIDAD', 5, 10]] }
  ],

  notas: [
    { n: 'NM-0033', fecha: '05/08/2026', tipo: 'Habilitación', tipoCls: 't-amber', concepto: 'Habilitación entre metas · Comedor Universitario', fte: '00', hab: 240000, anu: 240000, estado: 'Aprobada' },
    { n: 'NM-0031', fecha: '15/07/2026', tipo: 'Crédito suplem.', tipoCls: 't-blue', concepto: 'Incorporación de saldo de balance · Canon y sobrecanon', fte: '18', hab: 9850000, anu: 0, estado: 'Aprobada' },
    { n: 'NM-0027', fecha: '10/06/2026', tipo: 'Crédito suplem.', tipoCls: 't-blue', concepto: 'Transferencia de partidas MEF · equipamiento', fte: '13', hab: 1420000, anu: 0, estado: 'Aprobada' },
    { n: 'NM-0024', fecha: '20/05/2026', tipo: 'Crédito suplem.', tipoCls: 't-blue', concepto: 'Mayores ingresos RDR · centros de producción', fte: '09', hab: 1139062.75, anu: 0, estado: 'Aprobada' },
    { n: 'NM-0019', fecha: '28/03/2026', tipo: 'Crédito suplem.', tipoCls: 't-blue', concepto: 'Crédito suplementario · mantenimiento de infraestructura', fte: '00', hab: 600000, anu: 0, estado: 'Aprobada' }
  ],

  // Cuadro de necesidades 2026 · diez centros de costo con mayor importe modificado (Tabla 4, datos reales)
  centros: [
    ['104.07.08.04', 'Unidad Ejecutora de Inversiones', 53281265.58, 3173143.30, 412],
    ['104.07.08.01', 'Dirección General de Administración — Jefatura', 3536663.42, 1943537.19, 91],
    ['104.08.02.07', 'Comedor Universitario', 1574992.21, 1376530.99, 146],
    ['104.08.01', 'Vicerrectorado Académico — Jefatura', 1408626.89, 899210.44, 118],
    ['104.07.13.03.02', 'Laboratorio de Sistemas de Producción Ganadera — Granja Zootecnia', 454443.50, 78394.50, 204],
    ['104.09.02.03', 'Centro Preuniversitario', 332297.42, 213786.93, 57],
    ['104.07.13.03.15', 'Proyecto Planta Procesadora de Alimentos', 206730.30, 3600.00, 63],
    ['104.07.21.07', 'Programa Académico de Ingeniería en Ciberseguridad', 150570.60, 28385.60, 38],
    ['104.07.25.06', 'Programa Académico de Ingeniería Civil', 140367.67, 26587.85, 41],
    ['104.07.19.09', 'Programa Académico de Turismo y Hotelería', 98699.00, 31010.00, 29]
  ],
  // Detalle del centro 104.07.08.01 (91 ítems) · evidencia de sobreejecución (Figura 18)
  cuadroDGA: [
    ['740805000071', 'Papel bond A4 75 g', 'MILLAR', 180, 164, 26.00],
    ['231611008471', 'Tóner HP 26A para impresora láser', 'UNIDAD', 24, 19, 375.00],
    ['740805000410', 'Archivador de cartón con palanca tamaño oficio', 'UNIDAD', 20, 22, 4.40],
    ['740805000233', 'Lapicero de tinta seca color azul', 'UNIDAD', 70, 84, 0.62],
    ['740805000518', 'Corrector líquido tipo lapicero', 'UNIDAD', 12, 14, 3.00],
    ['960200050012', 'Servicio de impresión, encuadernación y empastado', 'SERVICIO', 1, 1, 3000.00, 7600.00],
    ['170100031921', 'Servicio de operación de red de datos', 'SERVICIO', 12, 7, 18000.00],
    ['231100070119', 'Combustible diésel B5 S-50', 'GALÓN', 1800, 1026, 17.40],
    ['180300020044', 'Servicio de mantenimiento de vehículos', 'SERVICIO', 6, 3, 2400.00],
    ['740805000082', 'Computadora personal portátil', 'UNIDAD', 4, 4, 3850.00]
  ],
  // Ejecución mensual 2026 en millones (programado acumulado vs devengado acumulado)
  mensual: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'],
    prog: [2.1, 5.5, 10.3, 15.5, 21.1, 27.1, 33.4, 39.9, 46.8, 54.2, 62.1, 70.93],
    dev: [0.62, 1.80, 3.44, 5.27, 7.32, 9.53, 11.79, 14.15, null, null, null, null]
  },
  compromisos: [
    { doc: 'O/S 000298', desc: 'Servicio de operación de red de datos', prov: 'Servicios Informáticos Selva EIRL', anual: 216000, meses: [18000, 18000, 18000, 18000, 18000, 18000, 18000, 18000, 18000, 18000, 18000, 18000], ejec: 8 },
    { doc: 'O/S 000301', desc: 'Servicio de vigilancia del campus', prov: 'Seguridad Integral Huallaga SAC', anual: 684000, meses: [57000, 57000, 57000, 57000, 57000, 57000, 57000, 57000, 57000, 57000, 57000, 57000], ejec: 7 },
    { doc: 'O/C 000477', desc: 'Víveres para el Comedor Universitario', prov: 'Distribuidora Agropecuaria del Huallaga SAC', anual: 918000, meses: [0, 0, 102000, 102000, 102000, 102000, 102000, 102000, 102000, 102000, 102000, 0], ejec: 6 },
    { doc: 'CONT-014', desc: 'Obra · Pabellón de laboratorios de Agronomía', prov: 'Consorcio Constructor Tingo María', anual: 8640000, meses: [0, 0, 0, 480000, 720000, 960000, 1080000, 1200000, 1200000, 1200000, 1000000, 800000], ejec: 5 }
  ],
  multianual: [
    ['104.07.08.04', 'Unidad Ejecutora de Inversiones', 53281265.58, 41200000, 36800000, 30500000],
    ['104.07.08.01', 'DGA — Jefatura', 3536663.42, 3680000, 3790000, 3900000],
    ['104.08.02.07', 'Comedor Universitario', 1574992.21, 1650000, 1720000, 1790000],
    ['104.08.01', 'Vicerrectorado Académico — Jefatura', 1408626.89, 1450000, 1500000, 1540000],
    ['104.07.13.03.02', 'Granja Zootecnia', 454443.50, 520000, 560000, 610000],
    ['104.07.13.03.15', 'Planta Procesadora de Alimentos', 206730.30, 380000, 420000, 450000]
  ],
  poi: [
    ['AOI00087-01', 'Gestión administrativa institucional', '0087', 'Informe', 12, 7, 58, 55],
    ['AOI00091-02', 'Formación profesional de pregrado', '0091', 'Estudiante', 6120, 6120, 100, 64],
    ['AOI00102-01', 'Mejoramiento de infraestructura educativa', '0102', '% avance físico', 100, 22, 22, 6],
    ['AOI00115-03', 'Producción pecuaria · Granja Zootecnia', '0115', 'Kg de carne', 42000, 27480, 65, 17],
    ['AOI00118-01', 'Puesta en marcha Planta Procesadora de Alimentos', '0118', '% implementación', 100, 18, 18, 2]
  ],
  dependencias: ['DGA — Jefatura', 'Vicerrectorado Académico — Jefatura', 'Comedor Universitario', 'Granja Zootecnia', 'Planta Procesadora de Alimentos', 'Centro Preuniversitario', 'P.A. Ingeniería en Ciberseguridad', 'Unidad Ejecutora de Inversiones'],
  catalogo: [
    ['740805000082', 'Computadora personal portátil', 'UNIDAD', 3850],
    ['740805000071', 'Papel bond A4 75 g', 'MILLAR', 26],
    ['231611008471', 'Tóner HP 26A para impresora láser', 'UNIDAD', 375],
    ['055300010036', 'Cabezal de corte para motoguadaña', 'UNIDAD', 45],
    ['231100010045', 'Alimento balanceado porcino engorde · saco 40 kg', 'SACO', 104],
    ['170100031921', 'Servicio de operación de red de datos', 'SERVICIO', 18000],
    ['180300020044', 'Servicio de mantenimiento de vehículos', 'SERVICIO', 2400],
    ['231100070119', 'Combustible diésel B5 S-50', 'GALÓN', 17.4]
  ]
};
