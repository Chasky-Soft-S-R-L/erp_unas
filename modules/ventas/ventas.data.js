SIGA.data.ventas = {
  productos: [
    { cod: 'CER-CAR', desc: 'Carne de cerdo · beneficiado', um: 'KGM · Kilogramo', pu: 16, sunat: '22011501' },
    { cod: 'POL-BEN', desc: 'Pollo beneficiado', um: 'KGM · Kilogramo', pu: 11.5, sunat: '10101501' },
    { cod: 'CUY-BEN', desc: 'Cuy beneficiado (~900 g)', um: 'NIU · Unidad', pu: 25, sunat: '10101512' },
    { cod: 'LEC-FRE', desc: 'Leche fresca', um: 'LTR · Litro', pu: 3.5, sunat: '50131600' },
    { cod: 'HUE-UNI', desc: 'Huevo de gallina', um: 'NIU · Unidad', pu: 0.6, sunat: '10101505' },
    { cod: 'ARR-PIL', desc: 'Arroz pilado · saco 50 kg', um: 'NIU · Unidad', pu: 175, sunat: '50201706' },
    { cod: 'MAI-AMA', desc: 'Maiz amarillo duro · saco 50 kg', um: 'NIU · Unidad', pu: 92, sunat: '50201707' },
    { cod: 'PLA-SED', desc: 'Platano · racimo', um: 'NIU · Unidad', pu: 14, sunat: '50151900' }
  ],
  series: { '01': 'F001', '03': 'B001' },
  correlativo: { '01': 935, '03': 4822 },
  comprobantes: [
    { doc: 'B001-004821', tipo: '03', fecha: '19/12/2025', cli: 'Consumidor final', docCli: 'DNI 45###231', op: 'Contado', grav: 44.07, igv: 7.93, total: 52, sunat: 'Aceptado', cls: 't-green' },
    { doc: 'F001-000934', tipo: '01', fecha: '19/12/2025', cli: 'Cooperativa Cafetalera Naranjillo', docCli: 'RUC 20103154811', op: 'Credito', grav: 4200, igv: 756, total: 4956, sunat: 'Aceptado', cls: 't-green' },
    { doc: 'B001-004820', tipo: '03', fecha: '18/12/2025', cli: 'Consumidor final', docCli: 'DNI 71###108', op: 'Contado', grav: 28.81, igv: 5.19, total: 34, sunat: 'Aceptado', cls: 't-green' },
    { doc: 'F001-000933', tipo: '01', fecha: '18/12/2025', cli: 'Agroindustrias del Huallaga SAC', docCli: 'RUC 20531042911', op: 'Credito', grav: 2100, igv: 378, total: 2478, sunat: 'Pendiente', cls: 't-amber' }
  ]
};
