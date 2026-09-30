/* Tablas maestras · un solo maestro por entidad (D-09) · totales del sistema actual (informe Tabla 3) */
SIGA.data.tablas = {
  catalogos: [
    { id: 'proved', nombre: 'Proveedores', tabla: 'proved', total: 56755, icon: 'fa-truck-field', grupo: 'Abastecimiento',
      cols: ['RUC', 'Razón social', 'Condición SUNAT'], valida: 'ruc',
      rows: [['20489217701', 'Distribuidora Agropecuaria del Huallaga SAC', 'Activo · habido'], ['20601188342', 'Comercial Ferretera Tingo María SRL', 'Activo · habido'], ['20457812093', 'Servicios Informáticos Selva EIRL', 'Activo · habido'], ['20531900871', 'Importaciones Tecnológicas del Perú SAC', 'Activo · habido'], ['20600455120', 'Ferretería Industrial Amazónica SAC', 'Activo · habido'], ['20487711234', 'Veterinaria El Ganadero EIRL', 'Activo · habido']] },
    { id: 'catabi', nombre: 'Catálogo de bienes y servicios (SIGA-MEF)', tabla: 'catabi', total: 18272, icon: 'fa-barcode', grupo: 'Abastecimiento',
      cols: ['Código SIGA', 'Descripción', 'Unidad'],
      rows: [['740805000082', 'Computadora personal portátil', 'UNIDAD'], ['740805000071', 'Papel bond A4 75 g', 'MILLAR'], ['231611008471', 'Tóner HP 26A para impresora láser', 'UNIDAD'], ['231100010045', 'Alimento balanceado porcino engorde · saco 40 kg', 'SACO'], ['170100031921', 'Servicio de operación de red de datos', 'SERVICIO'], ['231100070119', 'Combustible diésel B5 S-50', 'GALÓN']] },
    { id: 'cencos', nombre: 'Centros de costo', tabla: 'cencos', total: 254, icon: 'fa-sitemap', grupo: 'Presupuesto',
      cols: ['Código', 'Denominación', 'Responsable'],
      rows: [['104.07.08.04', 'Unidad Ejecutora de Inversiones', 'Jefe de la UEI'], ['104.07.08.01', 'Dirección General de Administración — Jefatura', 'Director General de Administración'], ['104.08.02.07', 'Comedor Universitario', 'Jefe del Comedor'], ['104.08.01', 'Vicerrectorado Académico — Jefatura', 'Vicerrector Académico'], ['104.07.13.03.02', 'Lab. de Sistemas de Producción Ganadera — Granja Zootecnia', 'Responsable de la Granja'], ['104.07.13.03.15', 'Proyecto Planta Procesadora de Alimentos', 'Coordinador del proyecto']] },
    { id: 'clagas', nombre: 'Clasificador de gasto (MEF)', tabla: 'clagas', total: 172, icon: 'fa-list-ol', grupo: 'Presupuesto',
      cols: ['Partida', 'Descripción', 'Genérica'],
      rows: [['2.3.1 1.1 1', 'Alimentos y bebidas para consumo humano', '2.3'], ['2.3.1 5.1 2', 'Repuestos y accesorios', '2.3'], ['2.3.2 1.2 2', 'Viáticos y asignaciones por comisión de servicio', '2.3'], ['2.3.2 7.11 99', 'Servicios diversos', '2.3'], ['2.6.3 2.3 1', 'Equipos computacionales y periféricos', '2.6'], ['2.6.2 2.2 3', 'Infraestructura educativa', '2.6']] },
    { id: 'claing', nombre: 'Clasificador de ingresos', tabla: 'claing', total: 64, icon: 'fa-hand-holding-dollar', grupo: 'Tesorería',
      cols: ['Clasificador', 'Descripción', 'Fuente'],
      rows: [['1.3.1 1.1', 'Venta de productos agropecuarios', '09 RDR'], ['1.3.1 3.1', 'Venta de productos agroindustriales', '09 RDR'], ['1.3.2 2.1', 'Derechos educativos · cursos de extensión', '09 RDR'], ['1.3.3 5.1', 'Alquiler de maquinaria y equipo', '09 RDR'], ['1.3.3 9.1', 'Servicios de laboratorio y análisis', '09 RDR']] },
    { id: 'placta', nombre: 'Plan contable gubernamental', tabla: 'placta', total: 4861, icon: 'fa-book', grupo: 'Contabilidad',
      cols: ['Cuenta', 'Denominación', 'Tipo'], src: () => Object.entries(SIGA.data.contabilidad.plan).map(([k, v]) => [k, v, { 1: 'Activo', 2: 'Pasivo', 3: 'Patrimonio', 4: 'Ingreso', 5: 'Gasto' }[k[0]]]) },
    { id: 'nemonico', nombre: 'Cadena funcional (nemónicos)', tabla: 'nemonico', total: 49, icon: 'fa-diagram-project', grupo: 'Presupuesto',
      cols: ['Nemónico', 'Descripción', 'Meta'],
      rows: [['AGRO01', 'Formación profesional · Agronomía', '0091'], ['ZOOT01', 'Formación profesional · Zootecnia', '0091'], ['GEST01', 'Gestión administrativa institucional', '0087'], ['INVE01', 'Mejoramiento de infraestructura educativa', '0102'], ['PROD01', 'Producción pecuaria · Granja Zootecnia', '0115']] },
    { id: 'docume', nombre: 'Tipos de documento', tabla: 'docume', total: 258, icon: 'fa-file-lines', grupo: 'Transversal',
      cols: ['Código', 'Descripción', 'Grupo'],
      rows: [['01', 'Factura', 'Comprobante'], ['03', 'Boleta de venta', 'Comprobante'], ['07', 'Nota de crédito', 'Comprobante'], ['09', 'Guía de remisión', 'Comprobante'], ['R1', 'Recibo por honorarios', 'Comprobante'], ['PEC', 'PECOSA', 'Almacén']] },
    { id: 'viatic', nombre: 'Escala de viáticos', tabla: 'escvia', total: 5, icon: 'fa-plane-departure', grupo: 'Abastecimiento',
      cols: ['Cargo', 'S/ por día', 'Tope movilidad'], src: () => SIGA.data.abastecimiento.escala.map(e => [e[0], e[1].toFixed(2), SIGA.data.abastecimiento.topeMovilidad.toFixed(2)]), editSrc: (r, v) => { const e = SIGA.data.abastecimiento.escala.find(x => x[0] === r[0]); if (e) e[1] = parseFloat(v.c1) || e[1]; } },
    { id: 'spot', nombre: 'Tasas de detracción (SPOT)', tabla: 'spot', total: 7, icon: 'fa-percent', grupo: 'Tesorería',
      cols: ['Bien o servicio', 'Tasa %', 'Aplicación'], src: () => SIGA.data.tesoreria.spot.map(s => [s[0], String(s[1]), 'Automática en el girado']), editSrc: (r, v) => { const e = SIGA.data.tesoreria.spot.find(x => x[0] === r[0]); if (e) e[1] = parseFloat(v.c1) || 0; } },
    { id: 'regime', nombre: 'Regímenes laborales', tabla: 'regime', total: 9, icon: 'fa-users', grupo: 'Planillas',
      cols: ['Código', 'Régimen', 'Trabajadores'], src: () => SIGA.data.planilla.regimenes.map(r => [r[0], r[1], String(r[2])]) },
    { id: 'unipro', nombre: 'Unidades productivas', tabla: 'unipro', total: 14, icon: 'fa-industry', grupo: 'Centros de producción',
      cols: ['Unidad', 'Línea de producción', 'Centro de costo'], src: () => SIGA.data.produccion.unidades.map(u => [u.nom, u.linea, u.cc]) }
  ]
};

/* Los maestros se alimentan de los registros de cada módulo (un solo dato, sin duplicados) */
(function () {
  const T = SIGA.data.tablas.catalogos, by = id => T.find(c => c.id === id), A = SIGA.data.abastecimiento, P = SIGA.data.presupuesto, L = SIGA.data.almacen;
  const add = (id, rows) => { const c = by(id); rows.forEach(r => { if (!c.rows.some(x => x[0] === r[0])) c.rows.push(r); }); };
  add('proved', A.proveedores.map(p => [p.ruc, p.rs, 'Activo · habido']).concat(SIGA.data.tesoreria.cp.filter(c => /^20\d{9}$/.test(c.ruc)).map(c => [c.ruc, c.benef, 'Activo · habido'])));
  add('catabi', L.items.map(i => [i.cod, i.desc, i.um]).concat(P.catalogo.map(c => [c[0], c[1], c[2]])));
  add('cencos', P.centros.map(c => [c[0], c[1], 'Jefe de ' + c[1].split(' — ')[0]]));
  add('clagas', P.marco.map(m => [m.clasif, m.desc, m.clasif.slice(0, 3)]).concat([['2.1.1 1.1 3', 'Personal administrativo nombrado (régimen público)', '2.1'], ['2.1.1 5.1 1', 'Contrato administrativo de servicios', '2.1'], ['2.2.1 1.1 1', 'Régimen de pensiones D.L. 20530', '2.2'], ['2.6.3 2.3 1', 'Equipos computacionales y periféricos', '2.6'], ['2.6.2 2.1 1', 'Edificios e instalaciones', '2.6']]));
  add('claing', [['1.3.3 9.1', 'Servicios de laboratorio y análisis', '09 RDR'], ['1.3.1 1.1', 'Venta de productos agropecuarios', '09 RDR'], ['1.3.2 1.1', 'Derechos de admisión', '09 RDR'], ['1.3.2 3.1', 'Constancias y certificados', '09 RDR'], ['1.5.5 1.1', 'Ingresos diversos', '09 RDR']]);
  add('nemonico', [['LACT01', 'Producción de leche y derivados', '0115'], ['CAFE01', 'Procesamiento de café y cacao', '0116'], ['SUEL01', 'Investigación en suelos amazónicos', '0120'], ['TIC01', 'Transformación digital', '0087']]);
  add('docume', [['NEA', 'Nota de entrada a almacén', 'Almacén'], ['OC', 'Orden de compra', 'Abastecimiento'], ['OS', 'Orden de servicio', 'Abastecimiento'], ['CCP', 'Certificación de crédito presupuestario', 'Presupuesto'], ['CP', 'Comprobante de pago', 'Tesorería'], ['REQ', 'Requerimiento del área usuaria', 'Abastecimiento'], ['VIA', 'Planilla de viáticos', 'Abastecimiento'], ['NM', 'Nota modificatoria', 'Presupuesto'], ['BAJ', 'Resolución de baja', 'Patrimonio']]);
})();
