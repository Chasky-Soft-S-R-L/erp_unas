/* Comercialización y facturación electrónica · procesos CV-01 a CV-12 */
SIGA.data.ventas = {
  // Catálogo (CV-01): valor unitario sin IGV · afectación según Ley del IGV (Apéndice I: productos primarios exonerados)
  productos: [
    { cod: 'CER-CAR', desc: 'Carne de cerdo · beneficiado', um: 'KGM', pu: 16, afect: 'Gravado', unidad: 'Granja porcina', ico: 'fa-bacon' },
    { cod: 'POL-BEN', desc: 'Pollo beneficiado', um: 'KGM', pu: 11.5, afect: 'Gravado', unidad: 'Unidad avícola', ico: 'fa-drumstick-bite' },
    { cod: 'CUY-BEN', desc: 'Cuy beneficiado (~900 g)', um: 'NIU', pu: 25, afect: 'Gravado', unidad: 'Galpón de cuyes', ico: 'fa-paw' },
    { cod: 'HUE-UNI', desc: 'Huevo de gallina', um: 'NIU', pu: 0.6, afect: 'Gravado', unidad: 'Unidad avícola', ico: 'fa-egg' },
    { cod: 'LEC-FRE', desc: 'Leche fresca', um: 'LTR', pu: 3.5, afect: 'Exonerado', unidad: 'Establo lechero', ico: 'fa-bottle-droplet' },
    { cod: 'YOG-FRU', desc: 'Yogur frutado 1 L', um: 'NIU', pu: 8.5, afect: 'Gravado', unidad: 'Planta de lácteos', ico: 'fa-wine-bottle' },
    { cod: 'QUE-FRE', desc: 'Queso fresco', um: 'KGM', pu: 18, afect: 'Gravado', unidad: 'Planta de lácteos', ico: 'fa-cheese' },
    { cod: 'MAN-BLA', desc: 'Manjar blanco 500 g', um: 'NIU', pu: 9, afect: 'Gravado', unidad: 'Planta de lácteos', ico: 'fa-jar' },
    { cod: 'CAF-TOS', desc: 'Café tostado y molido 500 g', um: 'NIU', pu: 28, afect: 'Gravado', unidad: 'Planta de café y cacao', ico: 'fa-mug-hot' },
    { cod: 'CHO-070', desc: 'Chocolate 70% · barra 100 g', um: 'NIU', pu: 7.5, afect: 'Gravado', unidad: 'Planta de café y cacao', ico: 'fa-cookie' },
    { cod: 'ARR-PIL', desc: 'Arroz pilado · saco 50 kg', um: 'NIU', pu: 175, afect: 'Gravado', unidad: 'Campos de arroz', ico: 'fa-bowl-rice' },
    { cod: 'MAI-AMA', desc: 'Maíz amarillo duro · saco 50 kg', um: 'NIU', pu: 92, afect: 'Exonerado', unidad: 'Campos de maíz', ico: 'fa-wheat-awn' },
    { cod: 'PLA-RAC', desc: 'Plátano · racimo', um: 'NIU', pu: 14, afect: 'Exonerado', unidad: 'Platanera', ico: 'fa-leaf' },
    { cod: 'PLN-FOR', desc: 'Plantón forestal', um: 'NIU', pu: 2.5, afect: 'Gravado', unidad: 'Vivero forestal', ico: 'fa-tree' },
    { cod: 'ANA-SUE', desc: 'Análisis de fertilidad de suelo', um: 'ZZ', pu: 120, afect: 'Gravado', unidad: 'Laboratorio de análisis de suelos', ico: 'fa-flask' },
    { cod: 'ALQ-TRA', desc: 'Alquiler de tractor (hora)', um: 'ZZ', pu: 140, afect: 'Gravado', unidad: 'Servicios de maquinaria agrícola', ico: 'fa-tractor' }
  ],
  // Listas de precios (CV-02): descuento sobre el precio público
  listas: [['Público', 0], ['Mayorista (volumen)', 8], ['Institucional / convenio', 12]],
  clientes: [
    { doc: 'RUC 20600123457', nom: 'Cooperativa Agraria del Alto Huallaga', tipo: 'Mayorista (volumen)', credito: 20000, dir: 'Jr. Monzón 412, Tingo María', correo: 'compras@coopaltohuallaga.pe', valida: 'SUNAT · activo y habido' },
    { doc: 'RUC 20531042911', nom: 'Agroindustrias del Huallaga SAC', tipo: 'Mayorista (volumen)', credito: 15000, dir: 'Av. Raymondi 880, Tingo María', correo: 'logistica@agrohuallaga.pe', valida: 'SUNAT · activo y habido' },
    { doc: 'RUC 20600888121', nom: 'Asociación de Productores de Castillo Grande', tipo: 'Institucional / convenio', credito: 5000, dir: 'Castillo Grande, Rupa Rupa', correo: 'apcg@correo.pe', valida: 'SUNAT · activo y habido' },
    { doc: 'RUC 20609981237', nom: 'Restaurante El Encanto de la Selva EIRL', tipo: 'Público', credito: 0, dir: 'Av. Alameda Perú 233, Tingo María', correo: 'encanto@correo.pe', valida: 'SUNAT · activo y habido' },
    { doc: 'DNI 45•••231', nom: 'Consumidor final', tipo: 'Público', credito: 0, dir: '—', correo: '—', valida: 'RENIEC' }
  ],
  series: { '01': 'F001', '03': 'B001' },
  correlativo: { '01': 212, '03': 4823 },
  // Comprobantes emitidos · los importes se calculan de los ítems
  comprobantes: [
    { doc: 'B001-004823', tipo: '03', fecha: '18/08/2026', cli: 'Consumidor final', docCli: 'DNI 45•••231', op: 'Contado', items: [['CER-CAR', 80]], sunat: 'Aceptado', unidad: 'Granja porcina' },
    { doc: 'F001-000212', tipo: '01', fecha: '18/08/2026', cli: 'Cooperativa Agraria del Alto Huallaga', docCli: 'RUC 20600123457', op: 'Crédito', venc: '17/09/2026', items: [['CAF-TOS', 150]], sunat: 'Aceptado', unidad: 'Planta de café y cacao', cobrado: 0 },
    { doc: 'F001-000211', tipo: '01', fecha: '18/08/2026', cli: 'Asociación de Productores de Castillo Grande', docCli: 'RUC 20600888121', op: 'Contado', items: [['ANA-SUE', 12]], sunat: 'Aceptado', unidad: 'Laboratorio de análisis de suelos' },
    { doc: 'B001-004819', tipo: '03', fecha: '17/08/2026', cli: 'Consumidor final', docCli: 'DNI 71•••108', op: 'Contado', items: [['LEC-FRE', 120], ['YOG-FRU', 48], ['MAN-BLA', 7]], sunat: 'Aceptado', unidad: 'Planta de lácteos' },
    { doc: 'B001-004815', tipo: '03', fecha: '16/08/2026', cli: 'Comité de reforestación de Supte', docCli: 'DNI 42•••077', op: 'Contado', items: [['PLN-FOR', 860]], sunat: 'Aceptado', unidad: 'Vivero forestal' },
    { doc: 'B001-004812', tipo: '03', fecha: '16/08/2026', cli: 'Productor agrario', docCli: 'DNI 40•••519', op: 'Contado', items: [['ALQ-TRA', 8]], sunat: 'Aceptado', unidad: 'Servicios de maquinaria agrícola' },
    { doc: 'F001-000210', tipo: '01', fecha: '15/08/2026', cli: 'Agroindustrias del Huallaga SAC', docCli: 'RUC 20531042911', op: 'Crédito', venc: '14/09/2026', items: [['ARR-PIL', 12], ['MAI-AMA', 10]], sunat: 'Pendiente', unidad: 'Campos de arroz', cobrado: 1200 },
    { doc: 'F001-000205', tipo: '01', fecha: '08/08/2026', cli: 'Restaurante El Encanto de la Selva EIRL', docCli: 'RUC 20609981237', op: 'Crédito', venc: '07/08/2026', items: [['CUY-BEN', 30], ['QUE-FRE', 12]], sunat: 'Aceptado', unidad: 'Galpón de cuyes', cobrado: 0 }
  ],
  notas: [{ doc: 'FC01-000014', fecha: '10/08/2026', ref: 'F001-000198', cli: 'Restaurante El Encanto de la Selva EIRL', motivo: 'Devolución parcial · producto fuera de especificación', total: 340, sunat: 'Aceptado' }],
  guias: [
    { doc: 'T001-000422', fecha: '18/08/2026', ref: 'F001-000212', partida: 'Planta de café · Carretera Central km 1.21', llegada: 'Jr. Monzón 412, Tingo María', transp: 'Vehículo institucional · placa EGA-512', estado: 'Aceptada' },
    { doc: 'T001-000421', fecha: '15/08/2026', ref: 'F001-000210', partida: 'Almacén de campo · Fundo Tulumayo', llegada: 'Av. Raymondi 880, Tingo María', transp: 'Transportes Rupa Rupa · placa C4K-718', estado: 'Aceptada' }
  ],
  mensual: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'], ventas: [212, 226, 241, 248, 236, 259, 268, 251] }
};
