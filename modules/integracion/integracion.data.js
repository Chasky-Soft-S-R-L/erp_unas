SIGA.data.integracion = {
  seq: 1048, exp: 4631, lote: 214, duplicados: 37,
  caido: { 'SIAF-SP': false, 'SUNAT': false, 'SIGA-MEF': false, 'Banco': false },
  // Bandeja de salida transaccional (se alimenta en vivo con SIGA.siaf())
  msgs: [
    { id: 1048, ts: '18/08/2026 08:41:13', sistema: 'SIAF-SP', tipo: 'Certificación', ref: 'CCP 000418', monto: 18000, idem: 'SIAF-SP|CERTIFICACIÓN|CCP000418', estado: 'Confirmado', intentos: 1, resp: 'Expediente SIAF 2026-0004630' },
    { id: 1047, ts: '18/08/2026 08:22:05', sistema: 'SIAF-SP', tipo: 'Pagado', ref: 'C/P 2026-0612', monto: 12480, idem: 'SIAF-SP|PAGADO|C/P2026-0612', estado: 'Confirmado', intentos: 1, resp: 'Expediente SIAF 2026-0004612' },
    { id: 1046, ts: '18/08/2026 08:05:32', sistema: 'SIAF-SP', tipo: 'Compromiso', ref: 'O/C 000512', monto: 6720, idem: 'SIAF-SP|COMPROMISO|O/C000512', estado: 'Confirmado', intentos: 2, resp: 'Expediente SIAF 2026-0004611 · 1 reintento por tiempo de espera' },
    { id: 1045, ts: '18/08/2026 07:51:48', sistema: 'SUNAT', tipo: 'Factura electrónica', ref: 'F001-000212', monto: 4956, idem: 'SUNAT|FACTURA|F001-000212', estado: 'Confirmado', intentos: 1, resp: 'CDR 0 · La factura ha sido aceptada' },
    { id: 1044, ts: '17/08/2026 18:30:00', sistema: 'SIGA-MEF', tipo: 'Descarga catálogo', ref: 'Catálogo de bienes y servicios', monto: 0, idem: 'SIGA-MEF|CATALOGO|20260817', estado: 'Confirmado', intentos: 1, resp: '18,272 ítems · 14 actualizados' },
    { id: 1043, ts: '17/08/2026 17:02:11', sistema: 'Banco', tipo: 'Abono masivo', ref: 'Planilla CAS · Ago 2026', monto: 421380, idem: 'BANCO|ABONO|CAS-2026-08', estado: 'Confirmado', intentos: 1, resp: 'Archivo de abono recibido · lote 00213' },
    { id: 1042, ts: '17/08/2026 16:40:27', sistema: 'SIAF-SP', tipo: 'Devengado', ref: 'O/S 000298', monto: 18000, idem: 'SIAF-SP|DEVENGADO|O/S000298', estado: 'Confirmado', intentos: 3, resp: 'Expediente SIAF 2026-0004598 · SIAF sin respuesta 11 min · enviado al restablecerse' }
  ],
  // Conciliación diaria automática (fases del gasto · al cierre del 17/08/2026)
  conciliacion: [
    ['Certificación', 1342, 41820355.10, 1342, 41820355.10],
    ['Compromiso anual', 1126, 27640112.35, 1126, 27640112.35],
    ['Devengado', 987, 14152229.48, 987, 14152229.48],
    ['Girado', 954, 13721840.02, 954, 13721840.02],
    ['Pagado', 941, 13508917.66, 941, 13508917.66]
  ],
  patrones: [
    ['Adaptador', 'Aislar el protocolo concreto de intercambio del resto del sistema', 'Permite cambiar el mecanismo de integración sin modificar los módulos de dominio'],
    ['Cola de mensajes', 'Desacoplar el envío de la operación que lo origina', 'Evita que la indisponibilidad del sistema externo bloquee la operación interna'],
    ['Reintento con espera creciente', 'Reintentar automáticamente los envíos fallidos con intervalos progresivos', 'Supera las indisponibilidades transitorias sin intervención humana'],
    ['Clave de idempotencia', 'Garantizar que un mismo envío repetido no genere operaciones duplicadas', 'Evita el doble registro ante reintentos'],
    ['Bandeja de salida transaccional', 'Registrar el mensaje dentro de la misma transacción de la operación', 'Garantiza que no se pierda ningún envío ante una falla'],
    ['Conciliación periódica', 'Contrastar el estado de ambos sistemas y reportar diferencias', 'Detecta oportunamente cualquier divergencia'],
    ['Interruptor de circuito', 'Suspender temporalmente los envíos ante fallas sostenidas', 'Evita la saturación ante una indisponibilidad prolongada']
  ]
};
