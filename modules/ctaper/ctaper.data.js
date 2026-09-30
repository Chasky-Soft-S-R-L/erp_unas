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

/* Ampliación: obligaciones ya pagadas (enlazadas a sus C/P) y nuevas por atender · mandatos judiciales */
(function () {
  const C = SIGA.data.ctaper, T = SIGA.data.tesoreria, G = SIGA.gen, r = G.rng(5050);
  const hoy = new Date(2026, 7, 18), toD = s => { const [d, m, y] = s.split('/'); return new Date(+y, m - 1, +d); }, fmt = d => G.pad(d.getDate(), 2) + '/' + G.pad(d.getMonth() + 1, 2) + '/' + d.getFullYear();
  let dev = 560;
  T.cp.filter(c => c.estado === 'Pagado' && /^\d{11}$/.test(c.ruc) && c.ruc !== '20131312955' && !C.obligaciones.some(o => o.cp === c.doc)).forEach(c => {
    const pago = toD(c.fecha), em = new Date(pago); em.setDate(em.getDate() - G.int(r, 6, 14)); const ve = new Date(em); ve.setDate(ve.getDate() + 15);
    const rh = c.ruc.startsWith('10');
    C.obligaciones.push({ doc: rh ? 'E001-' + G.int(r, 7, 60) : 'F00' + G.int(r, 1, 3) + '-00' + G.int(r, 1000, 4999), tipo: rh ? 'RH' : 'Factura', prov: c.benef, ruc: c.ruc, dev: 'DEV 2026-0' + (dev--), imp: c.bruto, emision: fmt(em), venc: fmt(ve), dias: Math.round((ve - hoy) / 864e5), estado: 'Pagado', prioridad: 'Normal', cp: c.doc });
  });
  C.obligaciones.push(
    { doc: 'F001-002231', tipo: 'Factura', prov: 'Electro Oriente SA', ruc: '20103795631', dev: 'DEV 2026-0593', imp: 46380, emision: '15/08/2026', venc: '29/08/2026', dias: 11, estado: 'Por pagar', prioridad: 'Urgente', obs: 'Servicio básico · corte si no se paga' },
    { doc: 'F002-000418', tipo: 'Factura', prov: 'Transportes León de Huánuco EIRL', ruc: '20542213380', dev: 'DEV 2026-0594', imp: 2860, emision: '16/08/2026', venc: '31/08/2026', dias: 13, estado: 'Por pagar', prioridad: 'Normal' },
    { doc: 'F001-000511', tipo: 'Factura', prov: 'Mantenimiento Industrial Selva SAC', ruc: '20602233419', dev: 'DEV 2026-0595', imp: 5940, emision: '17/08/2026', venc: '01/09/2026', dias: 14, estado: 'Por pagar', prioridad: 'Normal' },
    { doc: 'E001-19', tipo: 'RH', prov: 'A. Chávez · locador de servicios', ruc: '10467712093', dev: 'DEV 2026-0596', imp: 3200, emision: '17/08/2026', venc: '01/09/2026', dias: 14, estado: 'Por pagar', prioridad: 'Normal' },
    { doc: 'F001-000977', tipo: 'Factura', prov: 'Laboratorios Químicos Andinos SAC', ruc: '20607788140', dev: 'DEV 2026-0487', imp: 8420, emision: '10/07/2026', venc: '25/07/2026', dias: -24, estado: 'Vencida', prioridad: 'Normal', obs: 'Pendiente de conformidad del laboratorio' }
  );
  C.judiciales.push(
    { exp: 'EXP-00412-2022', trab: '••087 · Docente principal', concepto: 'Pensión de alimentos', pct: 35, base: 7120, monto: 2492, benef: 'Beneficiaria ••• · cta. BN ••1184' },
    { exp: 'EXP-00233-2025', trab: '••412 · Chofer (D.L. 276)', concepto: 'Pensión de alimentos', pct: 20, base: 2150, monto: 430, benef: 'Beneficiario ••• · cta. BN ••5530' },
    { exp: 'EXP-01980-2024', trab: '••615 · Docente contratado', concepto: 'Pensión de alimentos', pct: 30, base: 3900, monto: 1170, benef: 'Beneficiaria ••• · cta. BN ••9021' },
    { exp: 'EXP-00061-2026', trab: '••198 · Secretaria (D.L. 276)', concepto: 'Embargo por deuda civil', pct: 25, base: 2480, monto: 620, benef: 'Juzgado de Paz Letrado de Tingo María · cta. judicial' },
    { exp: 'EXP-00778-2021', trab: '••342 · Docente asociado', concepto: 'Pensión de alimentos', pct: 45, base: 5210, monto: 2344.5, benef: 'Beneficiarios (2) ••• · cta. BN ••6613' }
  );
})();
