SIGA.data.tablas = {
  catalogos: [
    { id: 'proved', nombre: 'Proveedores', tabla: 'proved', total: 56755, icon: 'fa-truck-field',
      cols: ['RUC', 'Razón social', 'Condición'],
      rows: [['20489217701', 'Distribuidora Agropecuaria del Huallaga SAC', 'Habido'], ['20601188342', 'Comercial Ferretera Tingo María SRL', 'Habido'], ['10457812093', 'Servicios Informáticos Selva EIRL', 'Habido'], ['20531900871', 'Importaciones Tecnológicas del Perú SAC', 'Habido']] },
    { id: 'catabi', nombre: 'Catálogo de bienes (SIGA)', tabla: 'catabi', total: 18272, icon: 'fa-barcode',
      cols: ['Código', 'Descripción', 'Unidad'],
      rows: [['740805000082', 'Computadora personal portátil', 'UNIDAD'], ['055300010036', 'Cabezal de corte motoguadaña', 'UNIDAD'], ['231611008471', 'Resorte de acero para vehículo', 'UNIDAD'], ['170100031921', 'Servicio de operación de red', 'SERVICIO']] },
    { id: 'placta', nombre: 'Plan contable', tabla: 'placta', total: 4861, icon: 'fa-book',
      cols: ['Cuenta', 'Denominación', 'Tipo'],
      rows: [['1101', 'Caja y Bancos', 'Activo'], ['2103', 'Cuentas por Pagar Comerciales', 'Pasivo'], ['5301', 'Bienes y Servicios', 'Gasto'], ['4301', 'Ingresos RDR', 'Ingreso']] },
    { id: 'clagas', nombre: 'Clasificador de gasto (MEF)', tabla: 'clagas', total: 172, icon: 'fa-list-ol',
      cols: ['Partida', 'Descripción', 'Genérica'],
      rows: [['2.1.1 1.1 2', 'Retribuciones y complementos', '2.1'], ['2.2.1 1.1 1', 'Alimentos y bebidas', '2.2'], ['2.3.1 5.1 2', 'Repuestos y accesorios', '2.3'], ['2.6.3 2.2 1', 'Equipos computacionales', '2.6']] },
    { id: 'docume', nombre: 'Tipos de documento', tabla: 'docume', total: 258, icon: 'fa-file-lines',
      cols: ['Código', 'Descripción', 'Grupo'],
      rows: [['01', 'Factura', 'Comprobante'], ['03', 'Boleta de venta', 'Comprobante'], ['07', 'Nota de crédito', 'Comprobante'], ['R1', 'Recibo por honorarios', 'Comprobante']] },
    { id: 'nemonico', nombre: 'Cadena funcional (nemónicos)', tabla: 'nemonico', total: 49, icon: 'fa-sitemap',
      cols: ['Nemónico', 'Descripción', 'Meta'],
      rows: [['AGRO01', 'Formación profesional Agronomía', '0087'], ['ZOOT01', 'Formación profesional Zootecnia', '0091'], ['INVE01', 'Investigación aplicada', '0102'], ['PROD01', 'Producción de bienes y servicios', '0115']] }
  ]
};
