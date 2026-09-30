/* Recursos Humanos y Planillas · procesos R-01 a R-14 · 1,197 trabajadores en 9 regímenes (informe Tabla 17) */
SIGA.data.planilla = {
  // [código, denominación, trabajadores, ingresos, descuentos, aportes empleador, clasificador de afectación]
  regimenes: [
    ['02', 'D.L. N.º 276 · administrativos nombrados', 362, 1340600, 198400, 120654, '2.1.1 1.1 3'],
    ['01', 'Docentes nombrados', 295, 1820400, 268900, 163836, '2.1.1 1.2 1'],
    ['03', 'Personal contratado', 217, 742300, 98100, 66807, '2.1.1 3.1 1'],
    ['06', 'Contratación administrativa de servicios (CAS)', 145, 486200, 64820, 43758, '2.1.1 5.1 1'],
    ['10', 'Pensionistas (D.L. N.º 20530)', 115, 248600, 32400, 0, '2.2.1 1.1 1'],
    ['07', 'Practicantes', 41, 38950, 0, 0, '2.1.1 9.9 1'],
    ['05', 'Obreros permanentes', 9, 22500, 3150, 2025, '2.1.1 1.1 3'],
    ['04', 'Autoridades universitarias', 7, 98000, 17640, 8820, '2.1.1 1.2 1'],
    ['08', 'Reposición por mandato judicial', 6, 19800, 2770, 1782, '2.1.1 1.1 3']
  ],
  // Legajo digital · conceptos: [concepto, tipo I=ingreso D=descuento A=aporte empleador, monto]
  trabajadores: [
    { cod: '••301', nom: 'Docente ••••', dni: '4•••••12', reg: '01 · Docente nombrado', cargo: 'Docente principal a tiempo completo', dep: 'Facultad de Agronomía', cond: 'Nombrado', ing: '01/04/2004', sis: 'AFP Integra', cuspp: '5•••••RIV3', banco: 'Banco de la Nación ••2231', correo: 'd•••@unas.edu.pe',
      c: [['Remuneración principal', 'I', 4215], ['Homologación docente', 'I', 2835], ['Asignación por tiempo de servicios', 'I', 300], ['Bonificación especial', 'I', 300], ['AFP · aporte obligatorio 10%', 'D', 765], ['AFP · prima de seguro 1.37%', 'D', 104.81], ['Renta de 5.ª categoría', 'D', 678.83], ['Retención judicial EXP-00321-2026 (40%)', 'D', 2736], ['EsSalud 9%', 'A', 688.5]],
      hist: [['01/03/2026', 'Actualización de cuenta bancaria'], ['15/01/2026', 'Registro de mandato judicial EXP-00321-2026'], ['01/04/2024', 'Promoción a docente principal']] },
    { cod: '••118', nom: 'Administrativo ••••', dni: '4•••••87', reg: '02 · D.L. 276', cargo: 'Especialista administrativo II', dep: 'Unidad de Abastecimiento', cond: 'Nombrado', ing: '15/08/2010', sis: 'ONP', cuspp: '—', banco: 'Banco de la Nación ••0918', correo: 'a•••@unas.edu.pe',
      c: [['Remuneración básica', 'I', 1850], ['Remuneración reunificada', 'I', 1120], ['Bonificación personal', 'I', 250], ['Incentivo único (CAFAE)', 'I', 500], ['ONP 13%', 'D', 418.6], ['Cuota sindical', 'D', 20], ['Préstamo cooperativa', 'D', 150], ['EsSalud 9%', 'A', 289.8]],
      hist: [['02/02/2026', 'Rotación a Unidad de Abastecimiento'], ['15/08/2010', 'Ingreso por concurso']] },
    { cod: '••554', nom: 'Contratado ••••', dni: '7•••••45', reg: '06 · CAS', cargo: 'Asistente de laboratorio', dep: 'Laboratorio de Análisis de Suelos', cond: 'Activo', ing: '02/01/2023', sis: 'AFP Prima', cuspp: '6•••••QAM1', banco: 'BCP ••4410', correo: 'c•••@unas.edu.pe',
      c: [['Remuneración CAS', 'I', 2800], ['AFP · aporte obligatorio 10%', 'D', 280], ['AFP · prima de seguro 1.37%', 'D', 38.36], ['AFP · comisión sobre flujo 1.60%', 'D', 44.8], ['Retención judicial EXP-00754-2025 (20%)', 'D', 480], ['EsSalud 9%', 'A', 252]],
      hist: [['02/01/2026', 'Renovación de contrato CAS 2026'], ['02/01/2023', 'Ingreso por concurso CAS']] },
    { cod: '••231', nom: 'Administrativo ••••', dni: '4•••••30', reg: '02 · D.L. 276', cargo: 'Técnico administrativo I', dep: 'Unidad de Tesorería', cond: 'Nombrado', ing: '01/06/2008', sis: 'ONP', cuspp: '—', banco: 'Banco de la Nación ••7740', correo: 't•••@unas.edu.pe',
      c: [['Remuneración básica', 'I', 1450], ['Remuneración reunificada', 'I', 950], ['Bonificación personal', 'I', 200], ['Incentivo único (CAFAE)', 'I', 400], ['ONP 13%', 'D', 338], ['Retención judicial EXP-01142-2024 (30%)', 'D', 840], ['EsSalud 9%', 'A', 234]],
      hist: [['10/04/2024', 'Registro de mandato judicial EXP-01142-2024']] },
    { cod: '••108', nom: 'Docente ••••', dni: '4•••••66', reg: '01 · Docente nombrado', cargo: 'Docente asociado a tiempo completo', dep: 'Facultad de Zootecnia', cond: 'Nombrado', ing: '01/03/2012', sis: 'AFP Habitat', cuspp: '5•••••HAB8', banco: 'Banco de la Nación ••5512', correo: 'z•••@unas.edu.pe',
      c: [['Remuneración principal', 'I', 2890], ['Homologación docente', 'I', 1960], ['Asignación por tiempo de servicios', 'I', 200], ['AFP · aporte obligatorio 10%', 'D', 505], ['AFP · prima de seguro 1.37%', 'D', 69.19], ['Renta de 5.ª categoría', 'D', 180.4], ['Retención judicial EXP-00987-2023 (25%)', 'D', 620], ['EsSalud 9%', 'A', 454.5]],
      hist: [['01/03/2023', 'Registro de mandato judicial EXP-00987-2023']] },
    { cod: '••072', nom: 'Pensionista ••••', dni: '2•••••04', reg: '10 · Pensionista', cargo: 'Cesante · D.L. N.º 20530', dep: '—', cond: 'Pensionista', ing: '01/01/1985', sis: 'D.L. 20530', cuspp: '—', banco: 'Banco de la Nación ••0101', correo: '—',
      c: [['Pensión nivelable', 'I', 1950], ['Bonificación por escolaridad (prorrata)', 'I', 150], ['EsSalud pensionista 4%', 'D', 84], ['Cuota mutual', 'D', 25], ['EsSalud 9%', 'A', 0]], hist: [['01/01/2015', 'Cese por límite de edad']] },
    { cod: '••612', nom: 'Practicante ••••', dni: '7•••••19', reg: '07 · Practicante', cargo: 'Practicante profesional', dep: 'Oficina de Planificación y Presupuesto', cond: 'Activo', ing: '01/03/2026', sis: '—', cuspp: '—', banco: 'Banco de la Nación ••3309', correo: 'p•••@unas.edu.pe',
      c: [['Subvención económica mensual', 'I', 950]], hist: [['01/03/2026', 'Convenio de prácticas profesionales N.º 014-2026']] },
    { cod: '••419', nom: 'Obrero ••••', dni: '4•••••52', reg: '05 · Obrero permanente', cargo: 'Obrero de campo', dep: 'Campos de arroz', cond: 'Nombrado', ing: '15/05/2006', sis: 'ONP', cuspp: '—', banco: 'Banco de la Nación ••8870', correo: '—',
      c: [['Remuneración básica', 'I', 1850], ['Bonificación por trabajo de campo', 'I', 650], ['ONP 13%', 'D', 325], ['EsSalud 9%', 'A', 225]], hist: [['15/05/2006', 'Ingreso']] }
  ],
  asistencia: [
    ['Facultad de Agronomía', 118, 14, 2, 184.6], ['Facultad de Zootecnia', 96, 9, 1, 96.2], ['Unidad de Abastecimiento', 22, 6, 0, 42.3], ['Unidad de Tesorería', 14, 2, 0, 12.1], ['Centros de producción', 64, 21, 4, 388.5], ['Oficina de Planificación y Presupuesto', 11, 1, 0, 6.4]
  ],
  vacaciones: [
    ['••118 · Especialista administrativo II', '02 · D.L. 276', '01/09/2026 – 30/09/2026', 30, 'Programada'], ['••554 · Asistente de laboratorio', '06 · CAS', '19/08/2026 – 02/09/2026', 15, 'En curso'],
    ['••231 · Técnico administrativo I', '02 · D.L. 276', '01/08/2026 – 15/08/2026', 15, 'Gozada'], ['••301 · Docente principal', '01 · Docente', '01/02/2027 – 02/03/2027', 30, 'Programada (receso)']
  ],
  licencias: [['••108 · Docente asociado', 'Licencia con goce · capacitación', '10/08/2026 – 24/08/2026', 'Aprobada'], ['••419 · Obrero de campo', 'Licencia por salud (CITT)', '12/08/2026 – 18/08/2026', 'En curso'], ['••231 · Técnico administrativo I', 'Licencia sin goce · asuntos personales', '02/09/2026 – 04/09/2026', 'Solicitada']],
  // Marco de personal (genérica 2.1 · fuera del cuadro de necesidades)
  marcoPersonal: { pim: 58420000, ejecutado: 34180000 },
  generada: false
};
