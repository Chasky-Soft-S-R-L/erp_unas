/* Caja de recursos propios · T-13 · T-15 · CV-09 · CV-10 */
SIGA.data.caja = {
  acumulado: 2234610.00,
  seq: 8857, dep: 241,
  fondoSencillo: 200,
  ingresos: [
    { num: 'R-08857', fecha: '18/08/2026', concepto: 'Venta · carne de cerdo beneficiado', clasif: '1.3.1 1.1', unidad: 'Granja porcina', pagador: 'Consumidor final', medio: 'Efectivo', comprob: 'B001-004823', depositado: false },
    { num: 'R-08856', fecha: '18/08/2026', concepto: 'Servicio · análisis de fertilidad de suelos (12)', clasif: '1.3.3 9.1', unidad: 'Laboratorio de análisis de suelos', pagador: 'Asociación de Productores de Castillo Grande', medio: 'Transferencia', comprob: 'F001-000211', depositado: true },
    { num: 'R-08855', fecha: '17/08/2026', concepto: 'Venta · leche, yogur y manjar', clasif: '1.3.1 3.1', unidad: 'Planta de lácteos', pagador: 'Consumidor final', medio: 'Efectivo', comprob: 'B001-004819', depositado: false },
    { num: 'R-08854', fecha: '17/08/2026', concepto: 'Derechos · curso de extensión en manejo de cacao (42 participantes)', clasif: '1.3.2 2.1', unidad: 'Capacitación y extensión', pagador: 'Participantes del curso', medio: 'Transferencia', total: 6300, depositado: true },
    { num: 'R-08853', fecha: '16/08/2026', concepto: 'Venta · plantones forestales', clasif: '1.3.1 1.1', unidad: 'Vivero forestal', pagador: 'Comité de reforestación de Supte', medio: 'Efectivo', comprob: 'B001-004815', depositado: false },
    { num: 'R-08852', fecha: '16/08/2026', concepto: 'Servicio · alquiler de tractor (8 h)', clasif: '1.3.3 5.1', unidad: 'Servicios de maquinaria agrícola', pagador: 'Productor agrario', medio: 'Efectivo', comprob: 'B001-004812', depositado: false },
    { num: 'R-08851', fecha: '16/08/2026', concepto: 'Cobranza · F001-000210 (a cuenta)', clasif: '1.3.1 1.1', unidad: 'Campos de arroz', pagador: 'Agroindustrias del Huallaga SAC', medio: 'Transferencia', total: 1200, depositado: true }
  ],
  depositos: [
    { num: 'DEP-0241', fecha: '18/08/2026', monto: 2520.00, cta: 'B. Nación ••7830 (RDR)', estado: 'Confirmado', nota: 'NM automática · ampliación fuente 09' },
    { num: 'DEP-0239', fecha: '16/08/2026', monto: 7120.00, cta: 'B. Nación ••7830 (RDR)', estado: 'Confirmado', nota: 'NM automática · ampliación fuente 09' },
    { num: 'DEP-0236', fecha: '12/08/2026', monto: 9820.00, cta: 'B. Nación ••7830 (RDR)', estado: 'Confirmado', nota: 'NM automática · ampliación fuente 09' }
  ],
  denom: [[200, 'Billete'], [100, 'Billete'], [50, 'Billete'], [20, 'Billete'], [10, 'Billete'], [5, 'Moneda'], [2, 'Moneda'], [1, 'Moneda'], [0.5, 'Moneda'], [0.2, 'Moneda'], [0.1, 'Moneda']]
};

/* Ampliación: recibos de las ventas y cobranzas del 01 al 15 de agosto y sus depósitos confirmados */
(function () {
  const K = SIGA.data.caja, V = SIGA.data.ventas, G = SIGA.gen, r = G.rng(9090);
  const cl = u => /Laboratorio|maquinaria/i.test(u) ? '1.3.3 9.1' : /Planta/i.test(u) ? '1.3.1 3.1' : '1.3.1 1.1';
  const desc = cod => (V.productos.find(p => p.cod === cod) || {}).desc || 'productos';
  let n = 8850;
  V.comprobantes.filter(c => +c.fecha.slice(0, 2) <= 15 && c.fecha.slice(3, 5) === '08' && !K.ingresos.some(x => x.comprob === c.doc)).forEach(c => {
    if (c.op === 'Contado') K.ingresos.push({ num: 'R-0' + (n--), fecha: c.fecha, concepto: 'Venta · ' + desc(c.items[0][0]).split(' · ')[0].toLowerCase() + (c.items.length > 1 ? ' y otros' : ''), clasif: cl(c.unidad), unidad: c.unidad, pagador: c.cli, medio: c.tipo === '01' ? 'Transferencia' : G.pick(r, ['Efectivo', 'Efectivo', 'Tarjeta']), comprob: c.doc, depositado: true });
    else if (c.cobrado === null) K.ingresos.push({ num: 'R-0' + (n--), fecha: c.fecha, concepto: 'Cobranza · ' + c.doc, clasif: cl(c.unidad), unidad: c.unidad, pagador: c.cli, medio: 'Transferencia', comprob: c.doc, cobranza: true, depositado: true });
  });
  K.depositos.push(
    { num: 'DEP-0234', fecha: '09/08/2026', monto: 8640.00, cta: 'B. Nación ••7830 (RDR)', estado: 'Confirmado', nota: 'NM-0024 · ampliación fuente 09' },
    { num: 'DEP-0233', fecha: '07/08/2026', monto: 6915.50, cta: 'B. Nación ••7830 (RDR)', estado: 'Confirmado', nota: 'NM-0024 · ampliación fuente 09' },
    { num: 'DEP-0231', fecha: '05/08/2026', monto: 12450.00, cta: 'B. Nación ••7830 (RDR)', estado: 'Confirmado', nota: 'NM-0024 · ampliación fuente 09' },
    { num: 'DEP-0229', fecha: '03/08/2026', monto: 4210.80, cta: 'B. Nación ••7830 (RDR)', estado: 'Confirmado', nota: 'NM-0024 · ampliación fuente 09' },
    { num: 'DEP-0228', fecha: '01/08/2026', monto: 9876.40, cta: 'Interbank ••1120 (RDR · centros de producción)', estado: 'Confirmado', nota: 'NM-0024 · ampliación fuente 09' }
  );
})();
