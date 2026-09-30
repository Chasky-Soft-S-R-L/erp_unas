/* Expediente digital · trazabilidad del gasto (informe 4.9.2, 4.9.3 y Tabla 70) */
SIGA.data.expediente = {
  etapas: [
    { k: 'req', t: 'Requerimiento', of: 'Centro de costo solicitante' },
    { k: 'cert', t: 'Certificación', of: 'Planificación y Presupuesto' },
    { k: 'comp', t: 'Compromiso · orden', of: 'Abastecimiento / DGA' },
    { k: 'conf', t: 'Recepción y conformidad', of: 'Almacén / área usuaria' },
    { k: 'dev', t: 'Devengado', of: 'Abastecimiento y Contabilidad' },
    { k: 'gir', t: 'Girado', of: 'Tesorería' },
    { k: 'pag', t: 'Pagado', of: 'Tesorería · banco' }
  ],
  lista: [
    { id: 'EXP-2026-0413', asunto: 'Útiles de escritorio y consumibles de impresión · Vicerrectorado', cc: 'Vicerrectorado Académico — Jefatura', monto: 9800, prov: 'por adjudicar',
      pasos: { req: ['REQ 2026-0898', 'Resp. CC Vicerrectorado', '11/08 08:15', ''], cert: ['CCP 000413', 'M. Ríos', '11/08 10:02', '1 h 47 min'] } },
    { id: 'EXP-2026-0414', asunto: 'Útiles de oficina para el Vicerrectorado Académico', cc: 'Vicerrectorado Académico — Jefatura', monto: 5420, prov: 'Comercial Ferretera Tingo María SRL',
      pasos: { req: ['REQ 2026-0901', 'Resp. CC Vicerrectorado', '10/08 09:05', ''], cert: ['CCP 000414', 'M. Ríos', '10/08 11:40', '2 h 35 min'], comp: ['O/C 000498', 'A. Torres', '10/08 16:10', '4 h 30 min'], conf: ['NEA 000301', 'J. Castro', '11/08 10:20', '18 h 10 min'], dev: ['DEV 2026-0544', 'R. Soto', '11/08 12:05', '1 h 45 min'], gir: ['C/P 2026-0598', 'L. Vargas', '11/08 15:30', '3 h 25 min'], pag: ['Abono CCI', 'Banco de la Nación', '12/08 09:10', '17 h 40 min'] } },
    { id: 'EXP-2026-0415', asunto: 'Equipamiento del laboratorio de Ingeniería en Ciberseguridad', cc: 'P.A. Ingeniería en Ciberseguridad', monto: 30800, prov: 'Importaciones Tecnológicas del Perú SAC',
      pasos: { req: ['REQ 2026-0907', 'Resp. CC Ciberseguridad', '12/08 08:30', ''], cert: ['CCP 000415', 'M. Ríos', '12/08 11:02', '2 h 32 min'], comp: ['O/C 000503', 'A. Torres', '12/08 17:45', '6 h 43 min'], conf: ['NEA 000307', 'J. Castro', '14/08 10:15', '1 d 16 h'], dev: ['DEV 2026-0561', 'R. Soto', '14/08 12:30', '2 h 15 min'], gir: ['C/P 2026-0607', 'L. Vargas', '14/08 16:20', '3 h 50 min'] } },
    { id: 'EXP-2026-0416', asunto: 'Valorización N.º 6 · Pabellón de laboratorios de Agronomía', cc: 'Unidad Ejecutora de Inversiones', monto: 246900, prov: 'Consorcio Constructor Tingo María',
      pasos: { req: ['Informe de valorización N.º 6', 'Supervisor de obra', '14/08 10:00', ''], cert: ['CCP 000416', 'M. Ríos', '14/08 15:10', '5 h 10 min'], comp: ['CONT-014', 'E. Mendoza', '15/08 09:30', '18 h 20 min'], conf: ['Conformidad de obra', 'Supervisor de obra', '16/08 08:40', '23 h 10 min'], dev: ['DEV 2026-0572', 'R. Soto', '16/08 11:15', '2 h 35 min'] } },
    { id: 'EXP-2026-0417', asunto: 'Alimento balanceado para la Granja Porcina', cc: 'Granja Zootecnia', monto: 12480, prov: 'Distribuidora Agropecuaria del Huallaga SAC',
      pasos: { req: ['REQ 2026-0928', 'P. Huamán', '17/08 08:10', ''], cert: ['CCP 000417', 'M. Ríos', '17/08 10:25', '2 h 15 min'], comp: ['O/C 000511', 'A. Torres', '17/08 15:40', '5 h 15 min'] } },
    { id: 'EXP-2026-0418', asunto: 'Servicio de operación y soporte de la red de datos institucional', cc: 'DGA — Jefatura', monto: 18000, prov: 'Servicios Informáticos Selva EIRL',
      pasos: { req: ['REQ 2026-0934', 'Resp. CC DGA', '18/08 07:55', ''], cert: ['CCP 000418', 'M. Ríos', '18/08 08:41', '46 min'] } },
    { id: 'EXP-2026-0419', asunto: 'Comisión de servicio a Lima · sustentación de proyecto ante CONCYTEC', cc: 'DGA — Jefatura', monto: 2100, prov: 'Comisionado: Docente asociado',
      pasos: { req: ['REQ 2026-0936', 'Resp. CC DGA', '18/08 08:20', ''] } }
  ]
};
