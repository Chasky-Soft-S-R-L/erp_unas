/* Cuentas por pagar · C-17 · obligaciones por proveedor y vencimiento · retenciones judiciales (T-06 · R-07) */
SIGA.data.ctaper = {
  obligaciones: [
    { doc: 'F002-001180', tipo: 'Factura', prov: 'Importaciones Tecnológicas del Perú SAC', ruc: '20531900871', dev: 'DEV 2026-0561', imp: 30800, emision: '14/08/2026', venc: '21/08/2026', dias: 3, estado: 'Programado', prioridad: 'Urgente', cp: 'C/P 2026-0607' },
    { doc: 'F001-004512', tipo: 'Factura', prov: 'Distribuidora Agropecuaria del Huallaga SAC', ruc: '20489217701', dev: 'DEV 2026-0579', imp: 18960, emision: '11/08/2026', venc: '25/08/2026', dias: 7, estado: 'Por pagar', prioridad: 'Normal' },
    { doc: 'F001-000921', tipo: 'Factura', prov: 'Comercial Ferretera Tingo María SRL', ruc: '20601188342', dev: 'DEV 2026-0580', imp: 4320, emision: '13/08/2026', venc: '28/08/2026', dias: 10, estado: 'Por pagar', prioridad: 'Normal' },
    { doc: 'E001-46', tipo: 'RH', prov: 'J. Ruiz · locador de servicios', ruc: '10458830211', dev: 'DEV 2026-0590', imp: 3500, emision: '15/08/2026', venc: '30/08/2026', dias: 12, estado: 'Por pagar', prioridad: 'Normal' },
    { doc: 'F003-000781', tipo: 'Factura', prov: 'Seguridad Integral Huallaga SAC', ruc: '20571123409', dev: 'DEV 2026-0575', imp: 57000, emision: '01/08/2026', venc: '31/08/2026', dias: 13, estado: 'Por pagar', prioridad: 'Programada' },
    { doc: 'F001-000302', tipo: 'Factura', prov: 'Consorcio Constructor Tingo María', ruc: '20605541237', dev: 'DEV 2026-0572', imp: 246900, emision: '16/08/2026', venc: '15/09/2026', dias: 28, estado: 'Por pagar', prioridad: 'Programada' },
    { doc: 'F001-000934', tipo: 'Factura', prov: 'Consultora Ambiental Amazonía EIRL', ruc: '20600871124', dev: 'DEV 2026-0521', imp: 9600, emision: '26/07/2026', venc: '10/08/2026', dias: -8, estado: 'Vencida', prioridad: 'Urgente' },
    { doc: 'F001-000088', tipo: 'Factura', prov: 'Ferretería Industrial Amazónica SAC', ruc: '20600455120', dev: 'DEV 2026-0402', imp: 6200, emision: '31/05/2026', venc: '15/06/2026', dias: -64, estado: 'Vencida', prioridad: 'Normal', obs: 'Retenida por penalidad en trámite' },
    { doc: 'F001-000012', tipo: 'Factura', prov: 'Imprenta Selva SAC', ruc: '20603321551', dev: 'DEV 2026-0301', imp: 2300, emision: '25/04/2026', venc: '10/05/2026', dias: -100, estado: 'Vencida', prioridad: 'Normal', obs: 'Observada · falta conformidad' }
  ],
  // Mandatos judiciales descontados en planilla y depositados por Tesorería (tabla movjud)
  judiciales: [
    { exp: 'EXP-00321-2026', trab: '••301 · Docente principal', concepto: 'Pensión de alimentos', pct: 40, base: 6840, monto: 2736, benef: 'Beneficiaria ••• · cta. BN ••2210' },
    { exp: 'EXP-01142-2024', trab: '••231 · Técnico administrativo', concepto: 'Pensión de alimentos', pct: 30, base: 2800, monto: 840, benef: 'Beneficiaria ••• · cta. BN ••7781' },
    { exp: 'EXP-00987-2023', trab: '••108 · Docente asociado', concepto: 'Pensión de alimentos', pct: 25, base: 2480, monto: 620, benef: 'Beneficiario ••• · cta. BN ••0932' },
    { exp: 'EXP-00754-2025', trab: '••554 · Asistente de laboratorio (CAS)', concepto: 'Embargo por deuda civil', pct: 20, base: 2400, monto: 480, benef: 'Juzgado Civil de Leoncio Prado · cta. judicial' }
  ],
  totalesInst: { proveedores: 28, mandatos: 71, retencionMes: 42180 }
};
