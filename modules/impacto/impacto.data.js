/* Cifras del informe técnico (Tablas 18–25, 53, 56, 62) y del pitch a autoridades */
SIGA.data.impacto = {
  riesgo: [['28', 'años de antigüedad del motor tecnológico', 'Visual FoxPro 6 · 1998'], ['11', 'años sin soporte del fabricante', 'fin en 2015'], ['166', 'archivos DBF sueltos', 'en vez de una base de datos'], ['1', 'sola persona conoce el código', '430 PRG · 811 formularios']],
  // Proceso, horas actuales, horas SIGA-U, % reducción (pitch lámina 29 · informe Tabla 25/56)
  tiempos: [
    ['Certificación presupuestal', 72, 4, 94, 'presupuesto'],
    ['Emisión de orden de compra', 120, 12, 90, 'abastecimiento'],
    ['Atención de PECOSA en almacén', 24, 1, 96, 'almacen'],
    ['Cierre contable mensual', 240, 24, 90, 'contabilidad'],
    ['Conciliación con el SIAF', 180, 7, 96, 'integracion'],
    ['Consulta de saldo por centro de costo', 15, 0, 100, 'presupuesto']
  ],
  deficiencias: [
    ['D-01', 'Plataforma de desarrollo descontinuada', 'Tecnológica', 'Crítica', 'seguridad', 'Plataforma web con tecnología libre y soporte vigente'],
    ['D-02', 'Arquitectura de escritorio sobre red local', 'Tecnológica', 'Crítica', 'dashboard', 'Acceso web y móvil, sin instalación'],
    ['D-03', 'Ausencia de motor de base de datos', 'Tecnológica', 'Crítica', 'presupuesto', 'PostgreSQL transaccional con integridad referencial'],
    ['D-04', 'Distribución manual por estación de trabajo', 'Tecnológica', 'Alta', 'dashboard', 'Despliegue central en contenedores'],
    ['D-05', 'Dependencia de componentes obsoletos', 'Tecnológica', 'Alta', 'seguridad', 'Stack mantenido: PostgreSQL · Laravel · Vue · Docker'],
    ['D-06', 'Ausencia de integridad referencial', 'Datos', 'Crítica', 'expediente', 'Claves foráneas: certificación → compromiso → devengado → girado'],
    ['D-07', 'Almacenamiento de valores calculados', 'Datos', 'Crítica', 'presupuesto', 'El saldo se calcula en cada consulta'],
    ['D-08', 'Ausencia de control transaccional', 'Datos', 'Crítica', 'presupuesto', 'Transacciones ACID en cada operación'],
    ['D-09', 'Duplicidad de información maestra', 'Datos', 'Alta', 'tablas', 'Maestros únicos con validación de RUC/DNI'],
    ['D-10', 'Índices susceptibles de corrupción', 'Datos', 'Alta', 'seguridad', 'Motor con recuperación ante fallas y respaldo horario'],
    ['D-11', 'Ausencia de validación de dominio', 'Datos', 'Media', 'presupuesto', 'Cadena funcional validada contra clasificador y meta'],
    ['D-12', 'Respaldo manual e irregular', 'Datos', 'Crítica', 'seguridad', 'Respaldo automático y restauración probada'],
    ['D-13', 'Sobregiro presupuestal no bloqueado', 'Cálculo', 'Crítica', 'presupuesto', 'Bloqueo transaccional: la diferencia se retiene'],
    ['D-14', 'Condición de carrera en el control de saldo', 'Cálculo', 'Crítica', 'presupuesto', 'Operaciones concurrentes serializadas (FOR UPDATE)'],
    ['D-15', 'Cálculo de viáticos no parametrizado', 'Cálculo', 'Media', 'abastecimiento', 'Escala por cargo × días aplicada automáticamente'],
    ['D-16', 'Integración contable como proceso posterior', 'Cálculo', 'Alta', 'contabilidad', 'Asiento automático en el mismo acto'],
    ['D-17', 'Ausencia de conciliación automática con el SIAF', 'Cálculo', 'Alta', 'integracion', 'Conciliación diaria automática'],
    ['D-18', 'Bloqueo de archivo ante acceso concurrente', 'Procesos', 'Crítica', 'dashboard', 'Concurrencia de 250 usuarios sin bloqueos'],
    ['D-19', 'Doble digitación hacia el SIAF', 'Procesos', 'Crítica', 'integracion', 'Interfaz automática con cola y reintentos'],
    ['D-20', 'Traslado físico de expedientes', 'Procesos', 'Alta', 'expediente', 'Expediente digital con firma electrónica'],
    ['D-21', 'Procesos de cierre prolongados', 'Procesos', 'Alta', 'contabilidad', 'Cierre asistido en un día'],
    ['D-22', 'Reportes de formato rígido', 'Procesos', 'Media', 'dashboard', 'Tableros interactivos y exportación'],
    ['D-23', 'Ausencia de bitácora de auditoría', 'Seguridad', 'Crítica', 'seguridad', 'Bitácora inmutable: usuario, fecha, IP, antes/después'],
    ['D-24', 'Permisos no configurables', 'Seguridad', 'Alta', 'seguridad', 'Roles y permisos administrables por la universidad'],
    ['D-25', 'Ausencia de segregación de funciones', 'Seguridad', 'Crítica', 'seguridad', 'Quien registra no aprueba (bloqueo automático)'],
    ['D-26', 'Información sin cifrado', 'Seguridad', 'Alta', 'seguridad', 'Cifrado en tránsito y en reposo'],
    ['D-27', 'Ausencia de módulo para centros de producción', 'Cobertura', 'Crítica', 'produccion', '14 unidades con costeo, control productivo y CPE'],
    ['D-28', 'Dependencia de un único desarrollador', 'Cobertura', 'Crítica', 'seguridad', 'Código versionado, documentado y de propiedad de la UNAS']
  ],
  // Cobertura funcional por área (Anexo C)
  cobertura: [['Presupuesto', 45], ['Abastecimiento', 40], ['Almacén', 35], ['Tesorería', 42], ['Contabilidad', 38], ['RR.HH.', 50], ['CP · general', 0], ['CP · agrícola', 0], ['CP · comercial', 0]],
  indicadores: [
    ['Operaciones con sobregiro presupuestal', 'Ocurrencia verificada', 'Cero', 'M2'],
    ['Operaciones digitadas dos veces', '100 %', '0 %', 'M2'],
    ['Tiempo del ciclo de certificación', '72 horas', '< 4 horas', 'M2'],
    ['Tiempo de emisión de orden de compra', '120 horas', '< 12 horas', 'M3'],
    ['Duración del cierre contable mensual', '10 días útiles', '< 1 día', 'M5'],
    ['Operaciones con registro de auditoría', '0 %', '100 %', 'M1'],
    ['Unidades productivas con costeo', '0 de 14', '14 de 14', 'M6'],
    ['Ventas con comprobante electrónico', '0 %', '100 %', 'M6'],
    ['Disponibilidad del sistema', 'No medida', '> 99.5 %', 'M6']
  ],
  beneficios: [
    ['Mejora de la recaudación de los centros de producción', 855000, '+25% por costeo, precios sustentados y facturación oportuna'],
    ['Mejora de la ejecución presupuestal', 709000, '+1 punto porcentual sobre el PIM'],
    ['Eliminación de la doble digitación', 192000, 'equivalente a 4 puestos a tiempo completo'],
    ['Reducción del tiempo de cierre contable', 86000, '8 días útiles mensuales de 3 profesionales'],
    ['Reducción de errores y regularizaciones', 64000, 'menos sobregiros y notas correctivas'],
    ['Reducción de pérdidas en almacén', 45000, 'control de existencias y vencimientos']
  ],
  plan: [['M1', 'Núcleo, maestros y seguridad'], ['M2', 'Planificación y Presupuesto'], ['M3', 'Abastecimiento'], ['M4', 'Almacén y Tesorería'], ['M5', 'Contabilidad y Planillas'], ['M6', 'Centros de Producción y puesta en marcha']]
};
