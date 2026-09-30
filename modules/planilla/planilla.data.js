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

/* Ampliación del legajo digital: trabajadores de todos los regímenes con su estructura remunerativa */
(function () {
  const P = SIGA.data.planilla, G = SIGA.gen, r = G.rng(7070);
  const r2 = v => Math.round(v * 100) / 100;
  const prev = (b, sis) => sis === 'ONP' ? [['ONP 13%', 'D', r2(b * 0.13)]] : sis.startsWith('AFP') ? [['AFP · aporte obligatorio 10%', 'D', r2(b * 0.10)], ['AFP · prima de seguro 1.37%', 'D', r2(b * 0.0137)]] : [];
  const quinta = b => b * 14 > 36050 ? [['Renta de 5.ª categoría', 'D', r2(Math.max(0, (b * 14 - 36050) * 0.08 / 12))]] : [];
  const T = {
    doc: (b) => [['Remuneración principal', 'I', b], ['Homologación docente', 'I', r2(b * 0.68)], ['Asignación por tiempo de servicios', 'I', 200]],
    adm: (b) => [['Remuneración básica', 'I', b], ['Remuneración reunificada', 'I', r2(b * 0.6)], ['Bonificación personal', 'I', 220], ['Incentivo único (CAFAE)', 'I', 450]],
    cas: (b) => [['Remuneración CAS', 'I', b]],
    con: (b) => [['Remuneración por contrato', 'I', b], ['Asignación por movilidad', 'I', 150]],
    obr: (b) => [['Remuneración básica', 'I', b], ['Bonificación por trabajo de campo', 'I', 600]],
    aut: (b) => [['Remuneración de autoridad', 'I', b], ['Asignación por función directiva', 'I', r2(b * 0.3)]]
  };
  const L = [
    ['doc', '01 · Docente nombrado', 'Docente principal a tiempo completo', 'Facultad de Industrias Alimentarias', 'Nombrado', 4215, 'AFP Prima', '12/03/2001'],
    ['doc', '01 · Docente nombrado', 'Docente asociado a tiempo completo', 'Facultad de Recursos Naturales Renovables', 'Nombrado', 2890, 'ONP', '01/04/2011'],
    ['doc', '01 · Docente nombrado', 'Docente auxiliar a tiempo completo', 'Facultad de Ingeniería en Informática y Sistemas', 'Nombrado', 2120, 'AFP Integra', '01/03/2018'],
    ['doc', '01 · Docente nombrado', 'Docente principal a dedicación exclusiva', 'Facultad de Zootecnia', 'Nombrado', 4380, 'AFP Habitat', '15/08/1998'],
    ['adm', '02 · D.L. 276', 'Especialista en presupuesto', 'Oficina de Planificación y Presupuesto', 'Nombrado', 1980, 'ONP', '02/05/2009'],
    ['adm', '02 · D.L. 276', 'Técnico en contabilidad', 'Oficina de Contabilidad', 'Nombrado', 1620, 'AFP Integra', '01/10/2012'],
    ['adm', '02 · D.L. 276', 'Secretaria ejecutiva', 'Dirección General de Administración', 'Nombrado', 1540, 'ONP', '14/02/2005'],
    ['adm', '02 · D.L. 276', 'Chofer', 'Unidad de Servicios Generales', 'Nombrado', 1420, 'ONP', '03/07/2007'],
    ['cas', '06 · CAS', 'Analista de sistemas', 'Oficina de Tecnologías de la Información', 'Activo', 3600, 'AFP Prima', '02/01/2024'],
    ['cas', '06 · CAS', 'Asistente administrativo', 'Oficina de Abastecimiento', 'Activo', 2400, 'AFP Habitat', '02/01/2025'],
    ['cas', '06 · CAS', 'Técnico pecuario', 'Granja Zootecnia', 'Activo', 2600, 'ONP', '01/03/2024'],
    ['cas', '06 · CAS', 'Operario de planta', 'Planta Piloto de Lácteos', 'Activo', 1850, 'AFP Integra', '01/06/2025'],
    ['con', '03 · Personal contratado', 'Docente contratado · tipo A', 'Facultad de Agronomía', 'Contratado', 3100, 'AFP Prima', '16/03/2026'],
    ['con', '03 · Personal contratado', 'Docente contratado · tipo B', 'Facultad de Ciencias Económicas', 'Contratado', 2250, 'ONP', '16/03/2026'],
    ['obr', '05 · Obrero permanente', 'Obrero de mantenimiento', 'Unidad de Servicios Generales', 'Nombrado', 1780, 'ONP', '20/09/2003'],
    ['aut', '04 · Autoridad universitaria', 'Director General de Administración', 'Dirección General de Administración', 'Designado', 9800, 'AFP Integra', '02/01/2025']
  ];
  const used = new Set(P.trabajadores.map(t => t.cod));
  L.forEach(x => {
    let cod; do { cod = '••' + G.int(r, 120, 989); } while (used.has(cod)); used.add(cod);
    const [tp, reg, cargo, dep, cond, b, sis, ing] = x, c = T[tp](b), rem = c.reduce((s, k) => s + k[2], 0);
    const banco = G.pick(r, ['Banco de la Nación', 'Banco de la Nación', 'BCP', 'Interbank']) + ' ••' + G.int(r, 1000, 9999);
    P.trabajadores.push({ cod, nom: (tp === 'doc' ? 'Docente' : tp === 'cas' ? 'Contratado' : tp === 'aut' ? 'Autoridad' : tp === 'obr' ? 'Obrero' : 'Administrativo') + ' ••••', dni: G.pick(r, ['4', '7', '2']) + '•••••' + G.pad(G.int(r, 0, 99), 2), reg, cargo, dep, cond, ing, sis, cuspp: sis.startsWith('AFP') ? G.int(r, 5, 6) + '•••••' + G.pick(r, ['RIV', 'QAM', 'HAB', 'PRF']) + G.int(r, 1, 9) : '—', banco, correo: cargo[0].toLowerCase() + '•••@unas.edu.pe',
      c: [...c, ...prev(rem, sis), ...quinta(rem), ...(G.int(r, 0, 3) === 0 ? [['Préstamo cooperativa', 'D', G.amt(r, 100, 400, 10)]] : []), ['EsSalud 9%', 'A', r2(rem * 0.09)]],
      hist: [[ing, 'Ingreso · ' + cond.toLowerCase()], ...(G.int(r, 0, 1) ? [['0' + G.int(r, 1, 7) + '/0' + G.int(r, 1, 7) + '/2026', G.pick(r, ['Actualización de cuenta bancaria', 'Cambio de sistema de pensiones', 'Rotación de dependencia', 'Actualización de grado académico'])]] : [])] });
  });
  const W = c => { const t = P.trabajadores.find(x => x.cargo === c); return t.cod + ' · ' + t.cargo; }, RG = c => P.trabajadores.find(x => x.cargo === c).reg;
  [['Especialista en presupuesto', '07/09/2026 – 21/09/2026', 15, 'Programada'], ['Analista de sistemas', '28/09/2026 – 12/10/2026', 15, 'Programada'], ['Técnico en contabilidad', '13/07/2026 – 27/07/2026', 15, 'Gozada'],
   ['Secretaria ejecutiva', '03/08/2026 – 17/08/2026', 15, 'Gozada'], ['Chofer', '05/10/2026 – 03/11/2026', 30, 'Programada'], ['Técnico pecuario', '16/11/2026 – 30/11/2026', 15, 'Programada']].forEach(v => P.vacaciones.push([W(v[0]), RG(v[0]), v[1], v[2], v[3]]));
  [['Analista de sistemas', 'Licencia con goce · capacitación oficializada', '24/08/2026 – 28/08/2026', 'Solicitada'], ['Técnico pecuario', 'Licencia por paternidad', '20/08/2026 – 08/09/2026', 'Solicitada'],
   ['Secretaria ejecutiva', 'Licencia por fallecimiento de familiar', '05/08/2026 – 09/08/2026', 'Aprobada'], ['Técnico en contabilidad', 'Permiso por onomástico', '21/08/2026', 'Aprobada'], ['Chofer', 'Licencia por salud (CITT)', '15/08/2026 – 22/08/2026', 'En curso']].forEach(v => P.licencias.push([W(v[0]), v[1], v[2], v[3]]));
  P.asistencia.push(['Oficina de Contabilidad', 18, 3, 0, 14.2], ['Dirección General de Administración', 26, 4, 1, 58.9], ['Oficina de Tecnologías de la Información', 15, 1, 0, 3.8], ['Planta Piloto de Lácteos', 21, 7, 2, 132.4], ['Biblioteca Central', 12, 2, 0, 8.1], ['Unidad de Servicios Generales', 48, 12, 3, 214.7]);
})();
