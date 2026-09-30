/* Contabilidad gubernamental · procesos C-01 a C-18 */
SIGA.data.contabilidad = {
  seq: 4823,
  plan: {
    '1101': 'Efectivo y equivalentes de efectivo', '1202': 'Cuentas por cobrar', '1301': 'Bienes y suministros de funcionamiento', '1302': 'Productos terminados · centros de producción',
    '1503': 'Edificios, maquinaria y equipo', '1508': 'Depreciación acumulada', '2101': 'Impuestos, contribuciones y retenciones por pagar', '2102': 'Remuneraciones y beneficios sociales por pagar',
    '2103': 'Cuentas por pagar a proveedores', '3101': 'Hacienda nacional', '4301': 'Venta de bienes', '4302': 'Venta de servicios', '4501': 'Traspasos y remesas recibidas',
    '5101': 'Gastos de personal y obligaciones sociales', '5301': 'Compra de bienes', '5302': 'Contratación de servicios', '5801': 'Depreciación del ejercicio'
  },
  // Sumas acumuladas a julio 2026 [debe, haber]; la 3101 se calcula para cuadrar el balance
  base: {
    '1101': [58420300, 53248900], '1202': [1340200, 980400], '1301': [3810500, 3322700], '1302': [612400, 548900], '1503': [186420000, 0], '1508': [0, 42860000],
    '2101': [1204300, 1398500], '2102': [31820000, 32410000], '2103': [12640000, 13024300], '4301': [0, 1860400], '4302': [0, 642800], '4501': [0, 56880000],
    '5101': [32410000, 0], '5301': [6240500, 0], '5302': [5982300, 0], '5801': [2480000, 0]
  },
  asientos: [
    { num: 'A-4823', fecha: '18/08', glosa: 'Pago C/P 2026-0612 · víveres Comedor Universitario', origen: 'Tesorería', auto: true, user: 'SIGA-U (automático)', lineas: [{ cta: '2103', debe: 12480, haber: 0 }, { cta: '1101', debe: 0, haber: 12480 }] },
    { num: 'A-4822', fecha: '18/08', glosa: 'Venta F001-000212 · Cooperativa Agraria del Alto Huallaga', origen: 'Ventas', auto: true, user: 'SIGA-U (automático)', lineas: [{ cta: '1202', debe: 4956, haber: 0 }, { cta: '4301', debe: 0, haber: 4200 }, { cta: '2101', debe: 0, haber: 756 }] },
    { num: 'A-4821', fecha: '17/08', glosa: 'Devengado O/C 000503 · equipos de cómputo Ciberseguridad', origen: 'Presupuesto', auto: true, user: 'SIGA-U (automático)', lineas: [{ cta: '1503', debe: 30800, haber: 0 }, { cta: '2103', debe: 0, haber: 30800 }] },
    { num: 'A-4820', fecha: '17/08', glosa: 'Planilla CAS agosto 2026 · devengado', origen: 'Planillas', auto: true, user: 'SIGA-U (automático)', lineas: [{ cta: '5101', debe: 486200, haber: 0 }, { cta: '2102', debe: 0, haber: 421380 }, { cta: '2101', debe: 0, haber: 64820 }] },
    { num: 'A-4819', fecha: '16/08', glosa: 'Ajuste por redondeo en conciliación de julio', origen: 'Manual', auto: false, user: 'R. Soto', lineas: [{ cta: '5302', debe: 120, haber: 0 }, { cta: '1101', debe: 0, haber: 120 }] }
  ],
  // Dinámica contable parametrizada (C-02): tipo de operación → cuentas
  dinamica: [
    ['Devengado de bienes', 'Presupuesto / Abastecimiento', '5301', '2103'], ['Devengado de servicios', 'Presupuesto / Abastecimiento', '5302', '2103'],
    ['Devengado de activos', 'Presupuesto / Abastecimiento', '1503', '2103'], ['Girado y pagado', 'Tesorería', '2103', '1101 · 2101'],
    ['Salida de almacén (PECOSA)', 'Almacén', '5301', '1301'], ['Venta al crédito', 'Ventas', '1202', '4301 · 2101'],
    ['Venta al contado', 'Ventas / Caja', '1101', '4301 · 2101'], ['Cobranza de crédito', 'Caja', '1101', '1202'],
    ['Planilla mensual', 'Planillas', '5101', '2102 · 2101'], ['Ingreso de producto terminado', 'Centro de producción', '1302', '1301'],
    ['Rendición de caja chica / encargo', 'Tesorería', '5302', '1101'], ['Depreciación mensual', 'Contabilidad', '5801', '1508']
  ],
  activos: [
    ['740899500012', 'Tractor agrícola 90 HP con implementos', '15/03/2019', 238000, 10, 'Servicios de maquinaria agrícola'],
    ['112275000045', 'Camioneta 4×4 doble cabina', '10/06/2021', 168500, 20, 'DGA · movilidad institucional'],
    ['602200000871', 'Servidor de base de datos', '20/11/2023', 64900, 25, 'Oficina de Tecnologías de Información'],
    ['536400000017', 'Ordeñadora mecánica de 4 puestos', '05/02/2022', 42300, 10, 'Establo lechero'],
    ['952200000033', 'Tostadora de café de 15 kg', '18/09/2020', 96400, 10, 'Planta de café y cacao'],
    ['740805000082', 'Computadoras portátiles (8) · Ciberseguridad', '14/08/2026', 30800, 25, 'P.A. Ingeniería en Ciberseguridad'],
    ['401000000102', 'Pabellón de Zootecnia (edificación)', '01/01/2005', 3200000, 3, 'Facultad de Zootecnia']
  ],
  depAgosto: false,
  conciliacion: [
    ['2.3 Bienes y servicios', 1184220.40, 1184220.40, '5301 + 5302'], ['2.4 Donaciones y transferencias', 42000.00, 42000.00, '5501'],
    ['2.5 Otros gastos', 96300.00, 96300.00, '5601'], ['2.6 Activos no financieros', 1106400.00, 1106400.00, '1503 (capitalizado)']
  ],
  cierres: [['Julio 2026', '17/08/2026', '1 día', 'R. Soto'], ['Junio 2026', '09/07/2026', '9 días (sistema actual)', 'R. Soto'], ['Mayo 2026', '11/06/2026', '10 días (sistema actual)', 'R. Soto']]
};
