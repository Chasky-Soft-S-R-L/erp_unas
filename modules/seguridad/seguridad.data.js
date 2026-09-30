SIGA.data.seguridad = {
  // Bitácora inmutable · se alimenta en vivo con SIGA.log() desde todos los módulos
  bitacora: [
    { ts: '18/08/2026 08:41:12', user: 'M. Ríos', rol: 'Jefe de Planificación y Presupuesto', ip: '10.20.4.12', mod: 'Presupuesto', acc: 'Aprobación de certificación', ref: 'CCP 000418', antes: 'Pendiente de aprobación', despues: 'Certificado', hash: 'a91f3c02be7d' },
    { ts: '18/08/2026 08:37:55', user: 'C. Quinto', rol: 'Analista de Presupuesto', ip: '10.20.4.37', mod: 'Presupuesto', acc: 'Registro de certificación', ref: 'CCP 000418', antes: '—', despues: 'S/ 18,000.00 · 2.3.2 7.11 99', hash: '4c0e98d1a7f2' },
    { ts: '18/08/2026 08:22:04', user: 'L. Vargas', rol: 'Tesorero', ip: '10.20.6.8', mod: 'Tesorería', acc: 'Pago confirmado', ref: 'C/P 2026-0612', antes: 'Girado', despues: 'Pagado', hash: '77d1b0e45c19' },
    { ts: '18/08/2026 08:05:31', user: 'J. Paredes', rol: 'Analista de Abastecimiento', ip: '10.20.5.21', mod: 'Abastecimiento', acc: 'Emisión de orden de compra', ref: 'O/C 000512', antes: '—', despues: 'S/ 6,720.00', hash: 'e02ab77c3f90' },
    { ts: '17/08/2026 17:48:10', user: 'Auditor OCI', rol: 'Órgano de Control Institucional', ip: '10.20.9.3', mod: 'Seguridad', acc: 'Consulta de bitácora', ref: 'Filtro: sobregiros 2026', antes: '—', despues: '—', hash: '1b7ec04f8d23' },
    { ts: '17/08/2026 16:12:47', user: 'C. Quinto', rol: 'Analista de Presupuesto', ip: '10.20.4.37', mod: 'Presupuesto', acc: 'Certificación rechazada · saldo insuficiente', ref: 'Meta 0087 · 2.3.1 5.1 2', antes: 'Saldo S/ 800.00', despues: 'Solicitado S/ 1,000.00 · diferencia retenida', hash: '9f2c61a0d4be' },
    { ts: '17/08/2026 15:30:02', user: 'R. Soto', rol: 'Contador', ip: '10.20.7.4', mod: 'Contabilidad', acc: 'Cierre de periodo', ref: 'Julio 2026', antes: 'Abierto', despues: 'Cerrado', hash: '3aa09e7b12cd' },
    { ts: '17/08/2026 11:03:19', user: 'P. Huamán', rol: 'Resp. Centro de Producción', ip: '10.20.12.40', mod: 'Control pecuario', acc: 'Registro de evento', ref: 'Parto · Marrana M-014', antes: '—', despues: '12 nacidos · 11 vivos', hash: 'c5d8e4f0a613' },
    { ts: '17/08/2026 09:14:55', user: 'A. Torres', rol: 'Jefe de Abastecimiento', ip: '10.20.5.2', mod: 'Abastecimiento', acc: 'Aprobación de requerimiento', ref: 'REQ 2026-0934', antes: 'En evaluación', despues: 'Aprobado', hash: '08be5d31c9a7' },
    { ts: '16/08/2026 18:02:40', user: 'Sistema', rol: 'Proceso programado', ip: '127.0.0.1', mod: 'Integración', acc: 'Conciliación diaria SIGA-U ↔ SIAF', ref: '16/08/2026', antes: '—', despues: '0 diferencias', hash: 'f41a2b9ce076' }
  ],
  // Matriz de roles y facultades (informe · Tabla 42)
  roles: [
    ['Responsable de centro de costo', 'Requerimientos', '—', 'Su centro de costo', '—'],
    ['Analista de presupuesto', 'Certificaciones y notas', '—', 'Todo el presupuesto', '—'],
    ['Jefe de Planificación y Presupuesto', '—', 'Certificaciones y notas', 'Todo el presupuesto', 'Parámetros del módulo'],
    ['Analista de abastecimiento', 'Órdenes y contratos', '—', 'Abastecimiento y almacén', '—'],
    ['Jefe de Abastecimiento', '—', 'Órdenes y contratos', 'Abastecimiento y almacén', 'Parámetros del módulo'],
    ['Almacenero', 'Ingresos y salidas', '—', 'Almacén', '—'],
    ['Analista de tesorería', 'Devengados y giros', '—', 'Tesorería', '—'],
    ['Tesorero', '—', 'Giros y pagos', 'Tesorería', 'Cuentas bancarias'],
    ['Contador', 'Asientos de ajuste', 'Cierre contable', 'Todo el sistema', 'Dinámica contable'],
    ['Responsable de centro de producción', 'Producción y ventas', '—', 'Su unidad productiva', '—'],
    ['Director General de Administración', '—', 'Autorizaciones de alto monto', 'Todo el sistema', '—'],
    ['Alta Dirección', '—', '—', 'Tableros de gestión', '—'],
    ['Órgano de Control Institucional', '—', '—', 'Todo el sistema y la bitácora', '—'],
    ['Administrador del sistema', '—', '—', 'Configuración', 'Usuarios, roles y permisos']
  ],
  usuarios: [
    ['cquinto', 'C. Quinto', 'Analista de Presupuesto', 'Sí', '18/08/2026 08:30', 'Activo'],
    ['mrios', 'M. Ríos', 'Jefe de Planificación y Presupuesto', 'Sí', '18/08/2026 08:40', 'Activo'],
    ['jparedes', 'J. Paredes', 'Analista de Abastecimiento', 'Sí', '18/08/2026 07:58', 'Activo'],
    ['atorres', 'A. Torres', 'Jefe de Abastecimiento', 'Sí', '17/08/2026 09:10', 'Activo'],
    ['lvargas', 'L. Vargas', 'Tesorero', 'Sí', '18/08/2026 08:15', 'Activo'],
    ['rsoto', 'R. Soto', 'Contador', 'Sí', '17/08/2026 15:20', 'Activo'],
    ['phuaman', 'P. Huamán', 'Resp. Centro de Producción', 'Sí', '17/08/2026 11:00', 'Activo'],
    ['emendoza', 'E. Mendoza', 'Director General de Administración', 'Sí', '16/08/2026 12:44', 'Activo'],
    ['oci', 'Auditor OCI', 'Órgano de Control Institucional', 'Sí', '17/08/2026 17:45', 'Solo consulta'],
    ['jcastro', 'J. Castro', 'Almacenero', 'No', '12/08/2026 10:02', 'Bloqueado · 5 intentos fallidos']
  ],
  politicas: [
    ['fa-key', 'Contraseñas', 'Mínimo 10 caracteres, complejidad obligatoria, caducidad 90 días, sin reutilizar las últimas 5'],
    ['fa-mobile-screen', 'Segundo factor (2FA)', 'Obligatorio para perfiles con facultad de aprobación y giro'],
    ['fa-lock', 'Bloqueo por intentos', 'Cuenta bloqueada tras 5 intentos fallidos consecutivos'],
    ['fa-hourglass-half', 'Expiración de sesión', 'Cierre automático tras 15 minutos de inactividad'],
    ['fa-scale-balanced', 'Segregación de funciones', 'El sistema impide que un mismo usuario registre y apruebe la misma operación'],
    ['fa-trash-can-arrow-up', 'Sin eliminación física', 'Las anulaciones se registran como operaciones inversas y conservan el histórico'],
    ['fa-shield-halved', 'Cifrado', 'TLS 1.3 en tránsito · cifrado en reposo de la base de datos y los respaldos'],
    ['fa-clock-rotate-left', 'Respaldo', 'Copia incremental cada hora y completa diaria · réplica en sitio alterno · restauración probada mensualmente']
  ]
};
