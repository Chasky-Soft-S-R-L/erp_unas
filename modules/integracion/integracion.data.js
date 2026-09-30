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

/* Bandeja histórica de agosto: cada operación registrada en los módulos dejó su mensaje confirmado */
(function () {
  const Q = SIGA.data.integracion, G = SIGA.gen, r = G.rng(1111), D = SIGA.data;
  const idem = (s, t, ref) => (s + '|' + t + '|' + ref).replace(/\s+/g, '').toUpperCase();
  const ev = [], k = f => f.slice(3, 5) + f.slice(0, 2);
  const push = (fecha, sistema, tipo, ref, monto) => { if (+fecha.slice(0, 2) > 17 && fecha.slice(3, 5) === '08') return; if (!Q.msgs.some(m => m.idem === idem(sistema, tipo, ref))) ev.push({ fecha: fecha.slice(0, 10), sistema, tipo, ref, monto }); };
  D.presupuesto.certificaciones.filter(c => !['Pendiente de aprobación', 'Anulada'].includes(c.fase) && c.fecha.slice(3, 5) === '08').forEach(c => push(c.fecha, 'SIAF-SP', 'Certificación', 'CCP ' + c.num, c.monto));
  D.abastecimiento.ordenes.filter(o => o.estado !== 'Anulada' && o.fecha.slice(3, 5) === '08').forEach(o => push(o.fecha, 'SIAF-SP', 'Compromiso anual', o.doc, o.imp));
  D.tesoreria.cp.filter(c => c.estado === 'Pagado').forEach(c => { push(c.fecha, 'SIAF-SP', 'Girado', c.doc, c.neto); push(c.fecha, 'SIAF-SP', 'Pagado', c.doc, c.neto); });
  D.ventas.comprobantes.filter(c => c.sunat === 'Aceptado').forEach(c => push(c.fecha, 'SUNAT', c.tipo === '01' ? 'Factura electrónica' : 'Boleta electrónica', c.doc, 0));
  ev.push({ fecha: '10/08/2026', sistema: 'Banco', tipo: 'Abono masivo', ref: 'Planilla 276 · Jul 2026', monto: 1142200 }, { fecha: '06/08/2026', sistema: 'Banco', tipo: 'Abono masivo', ref: 'Planilla docentes · Jul 2026', monto: 1551500 }, { fecha: '03/08/2026', sistema: 'SIGA-MEF', tipo: 'Descarga catálogo', ref: 'Catálogo de bienes y servicios 03/08', monto: 0 }, { fecha: '10/08/2026', sistema: 'SIGA-MEF', tipo: 'Descarga catálogo', ref: 'Catálogo de bienes y servicios 10/08', monto: 0 });
  ev.sort((a, b) => k(b.fecha) < k(a.fecha) ? -1 : k(b.fecha) > k(a.fecha) ? 1 : 0);
  let id = Math.min(...Q.msgs.map(m => m.id)) - 1, exp = 4597;
  ev.forEach(e => {
    const it = G.int(r, 0, 9) === 0 ? 2 : 1;
    Q.msgs.push({ id: id--, ts: e.fecha + ' ' + G.hora(r) + ':' + G.pad(G.int(r, 0, 59), 2), sistema: e.sistema, tipo: e.tipo, ref: e.ref, monto: e.monto, idem: idem(e.sistema, e.tipo, e.ref), estado: 'Confirmado', intentos: it,
      resp: (e.sistema === 'SUNAT' ? 'CDR 0 · El comprobante ha sido aceptado' : e.sistema === 'Banco' ? 'Archivo de abono recibido · lote ' + G.pad(213 - G.int(r, 1, 12), 5) : e.sistema === 'SIGA-MEF' ? '18,272 ítems · ' + G.int(r, 3, 20) + ' actualizados' : 'Expediente SIAF 2026-' + G.pad(exp--, 7)) + (it > 1 ? ' · 1 reintento por tiempo de espera' : '') });
  });
})();
