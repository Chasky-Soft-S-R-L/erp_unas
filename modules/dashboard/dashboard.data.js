SIGA.data.dashboard = {
  siaf: [
    { k: 'Asignado (PIM)', v: '118.4 M', p: '100%', st: 'done' },
    { k: 'Certificado', v: '116.9 M', p: '98.7%', st: 'done' },
    { k: 'Comprometido', v: '112.3 M', p: '94.9%', st: 'done' },
    { k: 'Devengado', v: '108.0 M', p: '91.2%', st: 'cur' },
    { k: 'Girado', v: '104.7 M', p: '88.4%', st: '' },
    { k: 'Pagado', v: '103.9 M', p: '87.8%', st: '' }
  ],
  genericas: [
    ['2.1 Personal y O.S.', 95, 'var(--primary)', 'S/ 52.1 M'],
    ['2.2 Bienes y servicios', 88, 'var(--secondary)', 'S/ 31.6 M'],
    ['2.3 Adquisición activos', 74, 'var(--info)', 'S/ 14.2 M'],
    ['2.5 Otros gastos', 82, 'var(--warning)', 'S/ 6.9 M'],
    ['2.6 Inversiones', 63, 'var(--primary-dark)', 'S/ 13.6 M']
  ],
  fuentes: [
    ['00 R. Ordinarios', 93, 'var(--primary)', 'S/ 71.4 M'],
    ['09 R. Direct. Recaud.', 79, 'var(--secondary)', 'S/ 28.8 M'],
    ['13 Donaciones y transf.', 71, 'var(--info)', 'S/ 7.8 M']
  ],
  movimientos: [
    { rcca: '000342', fecha: '18/12/2025', fte: '00', part: '2.2.1 1.1 1', dep: 'Escuela Prof. de Agronomía', imp: 12480, fase: 'Devengado', faseCls: 't-blue' },
    { rcca: '000341', fecha: '17/12/2025', fte: '09', part: '2.3.1 5.1 2', dep: 'Unidad Ejec. de Inversiones', imp: 84200, fase: 'Girado', faseCls: 't-green' },
    { rcca: '000339', fecha: '17/12/2025', fte: '00', part: '2.1.1 9.1 3', dep: 'Unidad de Recursos Humanos', imp: 5420, fase: 'Comprometido', faseCls: 't-amber' },
    { rcca: '000338', fecha: '16/12/2025', fte: '09', part: '2.2.2 3.1 1', dep: 'Centro de Producción · Lácteos', imp: 3150, fase: 'Girado', faseCls: 't-green' },
    { rcca: '000335', fecha: '15/12/2025', fte: '13', part: '2.6.2 2.2 2', dep: 'Unidad Ejec. de Inversiones', imp: 246900, fase: 'Devengado', faseCls: 't-blue' }
  ]
};
