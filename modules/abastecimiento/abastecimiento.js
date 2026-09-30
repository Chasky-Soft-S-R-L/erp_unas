/* ============================================================
   Abastecimiento · procesos A-01 a A-20
   "Un requerimiento se registra una vez y llega solo hasta el pago"
   Generador único de los diez documentos (pitch lámina 18)
   ============================================================ */
(function () {
  const A = SIGA.data.abastecimiento;
  const fmt = n => (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = v => parseFloat(String(v == null ? '' : v).replace(/,/g, '')) || 0;
  const escalaDe = cargo => (A.escala.find(e => e[0] === cargo) || [0, 0])[1];
  const addDays = (iso, d) => { const x = new Date(iso + 'T12:00:00'); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
  const diasEntre = (a, b) => (a && b) ? Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5) + 1 : 0;
  // Responsables con rendiciones vencidas (RF-A-10)
  const vencidos = () => [...A.encargos.filter(e => e.estado === 'Vencido').map(e => e.resp), ...A.comisiones.filter(c => c.estado === 'Rendición vencida').map(c => c.com)];
  const pendientes = () => A.encargos.filter(e => e.estado === 'Por rendir').map(e => e.resp);
  const penal = o => { if (!o.atraso) return { diaria: 0, total: 0, tope: 0.1 * o.imp, F: o.plazo <= 60 ? 0.40 : 0.25 }; const F = o.plazo <= 60 ? 0.40 : 0.25, diaria = 0.10 * o.imp / (F * o.plazo); return { F, diaria, total: Math.min(diaria * o.atraso, 0.10 * o.imp), tope: 0.10 * o.imp }; };
  const cchUsado = () => A.cajaChica.comprobantes.reduce((s, c) => s + c[5], 0);
  const cchSaldo = () => A.cajaChica.fondo - cchUsado();
  const certsDisp = () => SIGA.data.presupuesto.certificaciones.filter(c => ['Certificado', 'Comprometido'].includes(c.fase) && SIGA.ppto.certSaldo(c) > 0.004);
  const certLabel = c => `CCP ${c.num} · saldo S/ ${fmt(SIGA.ppto.certSaldo(c))} · ${SIGA.ppto.marco(c.marco).desc}`;
  const certOf = v => SIGA.ppto.cert(String(v || '').replace('CCP ', '').split(' · ')[0]);
  const deps = ['Facultad de Agronomía', 'Facultad de Zootecnia', 'Vicerrectorado Académico', 'Laboratorio de Análisis de Suelos', 'Granja Porcina', 'Planta de Lácteos', 'Comedor Universitario', 'Unidad Ejecutora de Inversiones'];
  const facs = ['Agronomía', 'Zootecnia', 'Ingeniería en Industrias Alimentarias', 'Recursos Naturales Renovables', 'Ciencias Económicas y Administrativas', 'Ingeniería Informática y de Sistemas'];

  /* ---------- Definición de campos y columnas por documento ---------- */
  const FIELDS = {
    oc: [{ k: 'cert', l: 'Certificación presupuestal (saldo en línea)', sel: () => certsDisp().map(certLabel), span: 2 }, { k: 'prov', l: 'Proveedor', list: 1, span: 2 }, { k: 'ruc', l: 'RUC' }, { k: 'plazo', l: 'Plazo de entrega (días)', type: 'number' }, { k: 'lugar', l: 'Lugar de entrega', span: 2 }, { k: 'ref', l: 'Justificación / concepto (obligatoria)', span: 2 }],
    os: [{ k: 'variante', l: 'Variante', sel: () => ['Obras', 'Saldo de balance', 'SIGA', 'Otros'] }, { k: 'plazo', l: 'Plazo de ejecución (días)', type: 'number' }, { k: 'cert', l: 'Certificación presupuestal (saldo en línea)', sel: () => certsDisp().map(certLabel), span: 2 }, { k: 'prov', l: 'Proveedor / contratista', list: 1, span: 2 }, { k: 'ruc', l: 'RUC' }, { k: 'conf', l: 'Área que otorga conformidad' }, { k: 'ref', l: 'Justificación / concepto (obligatoria)', span: 2 }],
    pec: [{ k: 'dep', l: 'Dependencia solicitante', sel: () => deps, span: 2 }, { k: 'solic', l: 'Solicitado por' }, { k: 'autor', l: 'Autorizado por' }, { k: 'almacen', l: 'Almacén', sel: () => ['Almacén central', 'Almacén Granja Zootecnia', 'Almacén Planta de Lácteos'] }, { k: 'meta', l: 'Meta' }, { k: 'ref', l: 'Destino / uso', span: 2 }],
    nea: [{ k: 'oc', l: 'Orden de compra que origina el ingreso (L-01)', sel: () => A.ordenes.filter(o => o.doc.startsWith('O/C') && !['Atendida', 'Anulada'].includes(o.estado)).map(o => o.doc + ' · ' + o.ref), span: 2 }, { k: 'prov', l: 'Proveedor', list: 1, span: 2 }, { k: 'guia', l: 'Guía de remisión' }, { k: 'almacen', l: 'Almacén', sel: () => ['Almacén central', 'Almacén Granja Zootecnia', 'Almacén Planta de Lácteos'] }, { k: 'ref', l: 'Verificación de cantidad y calidad', span: 2 }],
    via: [{ k: 'com', l: 'Comisionado', list: 2, span: 2 }, { k: 'dni', l: 'DNI' }, { k: 'cargo', l: 'Cargo (define la escala)', sel: () => A.escala.map(e => e[0]) }, { k: 'dest', l: 'Destino' }, { k: 'resol', l: 'Resolución de autorización' }, { k: 'salida', l: 'Fecha de salida', type: 'date' }, { k: 'retorno', l: 'Fecha de retorno', type: 'date' }, { k: 'mov', l: 'Movilidad local S/ por día (tope ' + A.topeMovilidad + ')', type: 'number' }, { k: 'motivo', l: 'Motivo de la comisión', span: 2 }],
    bol: [{ k: 'comision', l: 'Comisión de servicio', sel: () => A.comisiones.map(c => c.num + ' · ' + c.com + ' · ' + c.dest), span: 2 }, { k: 'ref', l: 'Observación', span: 2 }],
    cch: [{ k: 'resp', l: 'Responsable del fondo', ro: 1, span: 2 }, { k: 'periodo', l: 'Periodo' }, { k: 'resol', l: 'Resolución del fondo', ro: 1 }],
    enc: [{ k: 'resp', l: 'Responsable del encargo', list: 3, span: 2 }, { k: 'resol', l: 'Resolución que lo autoriza' }, { k: 'plazo', l: 'Plazo de rendición (días)', type: 'number' }, { k: 'act', l: 'Actividad urgente que lo justifica', span: 2 }],
    ppp: [{ k: 'fac', l: 'Facultad', sel: () => facs }, { k: 'periodo', l: 'Periodo académico', sel: () => ['2026-I', '2026-II'] }, { k: 'resol', l: 'Resolución de aprobación', span: 2 }],
    ayu: [{ k: 'fac', l: 'Facultad', sel: () => facs }, { k: 'periodo', l: 'Periodo académico', sel: () => ['2026-I', '2026-II'] }, { k: 'resol', l: 'Resolución decanal de designación (obligatoria)', span: 2 }]
  };
  const C_VAL = [{ k: 'cod', l: 'Código SIGA', w: '19%' }, { k: 'desc', l: 'Descripción' }, { k: 'um', l: 'Und.', w: '72px' }, { k: 'cant', l: 'Cant.', n: 1, w: '58px' }, { k: 'pu', l: 'P. Unit.', n: 1, w: '80px' }];
  const COLS = {
    oc: C_VAL, os: C_VAL, pec: C_VAL, nea: C_VAL, via: null,
    bol: [{ k: 'tramo', l: 'Tramo (origen – destino)' }, { k: 'medio', l: 'Medio', sel: ['Terrestre', 'Aéreo', 'Fluvial'], w: '92px' }, { k: 'emp', l: 'Empresa' }, { k: 'fec', l: 'Fecha', w: '80px' }, { k: 'imp', l: 'Importe', n: 1, w: '84px' }],
    cch: [{ k: 'tipo', l: 'Tipo', sel: ['Boleta', 'Factura', 'Recibo por honorarios', 'Ticket'], w: '104px' }, { k: 'serie', l: 'Serie-N°', w: '86px' }, { k: 'prov', l: 'Proveedor' }, { k: 'conc', l: 'Concepto' }, { k: 'imp', l: 'Importe', n: 1, w: '78px' }],
    enc: [{ k: 'conc', l: 'Concepto de gasto previsto' }, { k: 'clas', l: 'Clasificador', w: '104px' }, { k: 'imp', l: 'Importe', n: 1, w: '90px' }],
    ppp: [{ k: 'cod', l: 'Código', w: '92px' }, { k: 'nom', l: 'Estudiante' }, { k: 'det', l: 'Sede de práctica' }, { k: 'imp', l: 'Monto', n: 1, w: '84px' }],
    ayu: [{ k: 'cod', l: 'Código', w: '92px' }, { k: 'nom', l: 'Ayudante' }, { k: 'cond', l: 'Condición', sel: ['Estudiante IX ciclo', 'Estudiante X ciclo', 'Bachiller'], w: '124px' }, { k: 'det', l: 'Curso' }, { k: 'imp', l: 'Monto', n: 1, w: '84px' }]
  };
  const FIRMAS = {
    oc: [['Área usuaria', 'Solicitante'], ['Jefe de Abastecimiento', 'V°B° Logística'], ['Director General de Administración', 'Autorizado']],
    pec: [['Solicitante', 'Dependencia'], ['Almacenero', 'Despachó'], ['Recibí conforme', 'Área usuaria']],
    nea: [['Almacenero', 'Recepción'], ['Jefe de Abastecimiento', 'Conformidad'], ['Proveedor', 'Entregó']],
    via: [['Comisionado', 'Recibí conforme'], ['Jefe inmediato', 'Autoriza comisión'], ['Director General de Administración', 'Aprobado']],
    cch: [['Responsable del fondo', '1.er nivel'], ['Jefe de Tesorería', 'Revisó'], ['Director General de Administración', 'Aprobó reposición']],
    enc: [['Responsable del encargo', 'Recibí conforme'], ['Jefe de Tesorería', 'Entregó'], ['Director General de Administración', 'Autorizado']],
    ppp: [['Decano', 'Facultad'], ['Director de Escuela', 'Conformidad'], ['Director General de Administración', 'Autorizado']],
    ayu: [['Decano', 'Resolución decanal'], ['Jefe de Departamento Académico', 'Conformidad'], ['Director General de Administración', 'Autorizado']]
  };
  FIRMAS.os = FIRMAS.oc; FIRMAS.bol = FIRMAS.via;

  const defaults = () => {
    const c413 = certsDisp().find(c => c.num === '000413'), c418 = certsDisp().find(c => c.num === '000418');
    return {
      v: {
        oc: { fecha: SIGA.ctx.hoyISO, cert: c413 ? certLabel(c413) : '', prov: 'Comercial Ferretera Tingo María SRL', ruc: '20601188342', plazo: 5, lugar: 'Almacén central · Carretera Central km 1.21', ref: 'Útiles de escritorio y consumibles de impresión para el Vicerrectorado Académico' },
        os: { fecha: SIGA.ctx.hoyISO, variante: 'SIGA', plazo: 30, cert: c418 ? certLabel(c418) : '', prov: 'Servicios Informáticos Selva EIRL', ruc: '20457812093', conf: 'Oficina de Tecnologías de Información', ref: 'Servicio de operación y soporte de la red de datos institucional' },
        pec: { fecha: SIGA.ctx.hoyISO, dep: 'Facultad de Agronomía', solic: 'Secretaría de Facultad', autor: 'Decano de Agronomía', almacen: 'Almacén central', meta: '0091', ref: 'Material de oficina para el semestre 2026-II' },
        nea: { fecha: SIGA.ctx.hoyISO, oc: 'O/C 000511 · Alimento balanceado porcino', prov: 'Distribuidora Agropecuaria del Huallaga SAC', guia: 'T001-004512', almacen: 'Almacén Granja Zootecnia', ref: 'Cantidad y lote conformes · registro sanitario vigente' },
        via: { fecha: SIGA.ctx.hoyISO, com: 'Dr. J. Arévalo', dni: '4••••••7', cargo: 'Docente principal o asociado', dest: 'Lima', resol: 'R.D. N.º 131-2026-DGA', salida: '2026-08-24', retorno: '2026-08-26', mov: 30, motivo: 'Participación como ponente en congreso nacional de ciencias agrarias' },
        bol: { fecha: SIGA.ctx.hoyISO, comision: A.comisiones[0].num + ' · ' + A.comisiones[0].com + ' · ' + A.comisiones[0].dest, ref: 'Pasajes separados del viático, con boleto sustentatorio' },
        cch: { fecha: SIGA.ctx.hoyISO, resp: A.cajaChica.niveles[0], periodo: 'Agosto 2026', resol: A.cajaChica.resol },
        enc: { fecha: SIGA.ctx.hoyISO, resp: 'Ing. L. Castañeda', resol: 'R.D. N.º 133-2026-DGA', plazo: 15, act: 'Evaluación de daños por lluvias en parcelas experimentales del Fundo Tulumayo' },
        ppp: { fecha: SIGA.ctx.hoyISO, fac: 'Agronomía', periodo: '2026-II', resol: 'Res. Decanal N.º 233-2026-FA' },
        ayu: { fecha: SIGA.ctx.hoyISO, fac: 'Zootecnia', periodo: '2026-II', resol: 'Res. Decanal N.º 187-2026-FZ' }
      },
      items: {
        oc: [{ cod: '740805000071', desc: 'Papel bond A4 75 g', um: 'MILLAR', cant: 150, pu: 22.03 }, { cod: '231611008471', desc: 'Tóner HP 26A para impresora láser', um: 'UNIDAD', cant: 8, pu: 320 }, { cod: '740805000410', desc: 'Archivador de cartón con palanca', um: 'UNIDAD', cant: 40, pu: 3.73 }],
        os: [{ cod: '170100031921', desc: 'Servicio de operación de red de datos · agosto–setiembre', um: 'SERVICIO', cant: 1, pu: 15254.24 }],
        pec: [{ cod: '740805000071', desc: 'Papel bond A4 75 g', um: 'MILLAR', cant: 40, pu: 22.03 }, { cod: '740805000233', desc: 'Lapicero de tinta seca color azul', um: 'CAJA', cant: 6, pu: 18.50 }],
        nea: [{ cod: '231100010045', desc: 'Alimento balanceado porcino engorde · saco 40 kg', um: 'SACO', cant: 120, pu: 104 }],
        bol: [{ tramo: 'Tingo María – Lima', medio: 'Terrestre', emp: 'Transportes León de Huánuco', fec: '24/08', imp: 95 }, { tramo: 'Lima – Tingo María', medio: 'Terrestre', emp: 'Transportes León de Huánuco', fec: '26/08', imp: 95 }],
        cch: [{ tipo: 'Boleta', serie: 'B001-2290', prov: 'Librería Huallaga', conc: 'Útiles para mesa de partes', imp: 64.50 }, { tipo: 'Factura', serie: 'F001-3340', prov: 'Grifo Tingo María', conc: 'Combustible para grupo electrógeno', imp: 280 }],
        enc: [{ conc: 'Movilidad y combustible', clas: '2.3.1 3.1 1', imp: 450 }, { conc: 'Alimentación del personal de campo', clas: '2.3.2 1.2 99', imp: 380 }, { conc: 'Materiales de muestreo', clas: '2.3.1 9.9 1', imp: 270 }],
        ppp: [{ cod: '0020200311', nom: 'Est. A. Cárdenas', det: 'Estación Experimental Tulumayo', imp: A.montoPracticas }, { cod: '0020200144', nom: 'Est. J. Soria', det: 'Cooperativa agraria de Aucayacu', imp: A.montoPracticas }, { cod: '0020200457', nom: 'Est. M. Pinedo', det: 'Laboratorio de Análisis de Suelos', imp: A.montoPracticas }],
        ayu: [{ cod: '0020140231', nom: 'Bach. L. Tello', cond: 'Bachiller', det: 'Nutrición animal', imp: A.montoAyudantia }, { cod: '0020190655', nom: 'Est. K. Gonzales', cond: 'Estudiante X ciclo', det: 'Fisiología animal', imp: A.montoAyudantia }]
      },
      igv: { oc: true, os: true }
    };
  };

  /* ---------- Acciones por registro ---------- */
  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const AB = () => SIGA.modules.abastecimiento;
  const provDe = rs => A.proveedores.find(p => p.rs === rs) || {};
  const itemsOrden = o => o.items && o.items.length ? o.items : [{ cod: '—', desc: o.ref, um: o.doc.startsWith('O/S') ? 'SERVICIO' : 'LOTE', cant: 1, pu: Math.round(o.imp / 1.18 * 100) / 100 }];
  const ordRec = SIGA.recs.orden = {
    mod: 'Abastecimiento', office: 'Oficina de Abastecimiento', key: o => o.doc, title: o => o.doc + ' · ' + o.prov, anuladoValor: 'Anulada',
    tipo: 'Orden de compra / servicio',
    fields: o => { const U = SIGA.ui, p = penal(o); return [['Documento', `<span class="code">${o.doc}</span>` + (o.variante ? ' · ' + o.variante : '')], ['Fecha', o.fecha], ['Proveedor', U.esc(o.prov), 1], ['RUC', provDe(o.prov).ruc || '—'], ['Certificación', 'CCP ' + o.cert], ['Referencia', U.esc(o.ref), 1], ['Partida', `<span class="code">${o.part}</span>`], ['Importe', `<b>${U.money(o.imp)}</b>`], ['Plazo · entrega', o.plazo + ' días · ' + o.entrega], ['Estado', U.tag(o.estado, o.cls)], ['Penalidad por atraso', o.atraso ? `<b class="saldo-neg">${U.money(p.total)}</b>${p.total >= p.tope - 0.01 ? ' · tope 10% alcanzado' : ''}` : '—'], ...(o.motivo ? [['Motivo de anulación', U.esc(o.motivo), 1]] : [])]; },
    body: o => { const U = SIGA.ui, it = itemsOrden(o), st = ['Emitida', 'Pendiente de entrega', 'Atrasada', 'Atendida'].indexOf(o.estado);
      return `<div class="lbl-s mt mb">Detalle de la orden</div>` + U.table([{ k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'desc', label: 'Descripción' }, { k: 'um', label: 'Und' }, { k: 'cant', label: 'Cant.', r: true }, { k: 'pu', label: 'P. unit.', r: true, render: r => fmt(r.pu) }, { k: 't', label: 'Total', r: true, render: r => fmt(num(r.cant) * num(r.pu)) }], it) +
        `<div class="lbl-s mt mb">Control de fases (SIGA → SIAF)</div>` + U.timeline([{ t: 'Certificación', sub: 'CCP ' + o.cert, st: 'done' }, { t: 'Compromiso', sub: o.doc + ' · ' + o.fecha, st: o.estado === 'Anulada' ? 'bad' : 'done' }, { t: o.doc.startsWith('O/C') ? 'Recepción (NEA)' : 'Conformidad del servicio', sub: o.estado === 'Atendida' ? 'conforme' : 'entrega hasta ' + o.entrega, st: o.estado === 'Atendida' ? 'done' : o.estado === 'Anulada' ? '' : 'cur' }, { t: 'Devengado', sub: o.estado === 'Atendida' ? 'Contabilidad' : '', st: o.estado === 'Atendida' ? 'done' : '' }]); },
    edit: [{ k: 'ref', label: 'Referencia / justificación' }, { k: 'plazo', label: 'Plazo (días)', type: 'number', span: 1 }, { k: 'entrega', label: 'Fecha de entrega', span: 1 }],
    canEdit: o => o.estado === 'Emitida',
    anular: true, anularLabel: 'Anular orden', canAnular: o => ['Emitida', 'Pendiente de entrega'].includes(o.estado),
    onAnular: o => { const c = SIGA.ppto.cert(o.cert); if (c) c.comp = Math.max(0, (c.comp || 0) - o.imp); SIGA.siaf('Anulación de compromiso', o.doc, -o.imp); },
    extra: o => [
      ...(o.doc.startsWith('O/C') && ['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(o.estado) ? [{ icon: 'fa-inbox', label: 'Registrar recepción (NEA)', fn: x => AB().recibir(x) }] : []),
      ...(o.doc.startsWith('O/S') && ['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(o.estado) ? [{ icon: 'fa-clipboard-check', label: 'Dar conformidad del servicio', fn: x => AB().conformidad(x) }] : []),
      ...(['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(o.estado) ? [{ icon: 'fa-calendar-plus', label: 'Ampliación de plazo', menuOnly: true, fn: x => AB().ampliar(x) }] : []),
      ...(o.atraso ? [{ icon: 'fa-scale-unbalanced', label: 'Ver penalidad', fn: () => { SIGA.ui.closeModal(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'con'); } }] : [])
    ],
    print: o => { const U = SIGA.ui, it = itemsOrden(o), sub = it.reduce((s, r) => s + num(r.cant) * num(r.pu), 0), igv = Math.max(0, o.imp - sub), oc = o.doc.startsWith('O/C');
      return { tipo: oc ? 'Orden de compra · guía de internamiento' : 'Orden de servicio', num: o.doc.replace(/^O\/[CS] /, ''), fecha: o.fecha,
        pairs: [['Proveedor', U.esc(o.prov), 1], ['RUC', provDe(o.prov).ruc || '—'], ['Plazo', o.plazo + ' días · hasta ' + o.entrega], ['Certificación', 'CCP ' + o.cert + ' · ' + o.part], ['Concepto', U.esc(o.ref), 1]],
        body: dtbl([['Código'], ['Descripción'], ['U.M.'], ['Cant.', 1], ['P. unit.', 1], ['Total', 1]], it.map(r => [r.cod, U.esc(r.desc), r.um, r.cant, fmt(r.pu), fmt(num(r.cant) * num(r.pu))])) + dtbl([['Resumen'], ['S/', 1]], [['Subtotal', fmt(sub)], ['IGV 18%', fmt(igv)], ['<b>Total</b>', '<b>' + fmt(o.imp) + '</b>']]) + `<p class="mini">${U.montoLetras(o.imp)}</p>`,
        firmas: FIRMAS.oc.map(f => [f[0], f[1]]) }; },
    mailTo: o => 'ventas@' + o.prov.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '.com.pe'
  };
  const REQCLS = { 'En evaluación': 't-amber', Aprobado: 't-green', Observado: 't-red', Atendido: 't-blue', Anulado: 't-gray' };
  const reqRec = SIGA.recs.req = {
    mod: 'Abastecimiento', tipo: 'Requerimiento del área usuaria', office: 'Oficina de Abastecimiento', key: r => r.num, title: r => r.num + ' · ' + r.cc, cls: false,
    fields: r => { const U = SIGA.ui; return [['N°', `<span class="code">${r.num}</span>`], ['Fecha', r.fecha], ['Centro de costo', r.cc], ['Monto estimado', U.money(r.monto)], ['Requerimiento', U.esc(r.desc), 1], ['Nivel de aprobación', r.monto > 30000 ? 'Dirección General de Administración' : 'Jefe de Abastecimiento'], ['Estado', U.tag(r.estado, REQCLS[r.estado])], ['Registró / Aprobó', r.user + ' / ' + (r.aprob || '—')], ...(r.obs ? [['Observación', U.esc(r.obs), 1]] : [])]; },
    body: r => SIGA.ui.timeline([{ t: 'Registro y verificación de saldo', sub: r.user + ' · ' + r.fecha, st: 'done' }, { t: 'Aprobación electrónica', sub: r.aprob ? r.aprob : r.estado === 'Observado' ? 'observado' : 'pendiente', st: ['Aprobado', 'Atendido'].includes(r.estado) ? 'done' : r.estado === 'Observado' ? 'bad' : 'cur' }, { t: 'Indagación de mercado / cuadro comparativo', st: r.estado === 'Atendido' ? 'done' : r.estado === 'Aprobado' ? 'cur' : '' }, { t: 'Orden de compra o servicio', st: r.estado === 'Atendido' ? 'done' : '' }]),
    edit: [{ k: 'desc', label: 'Descripción' }, { k: 'monto', label: 'Monto estimado S/', type: 'number', span: 1 }, { k: 'cc', label: 'Centro de costo', span: 1 }],
    canEdit: r => ['En evaluación', 'Observado'].includes(r.estado),
    onEdit: r => { if (r.estado === 'Observado') { r.estado = 'En evaluación'; r.obs = ''; } },
    anular: true, anularLabel: 'Anular requerimiento', canAnular: r => ['En evaluación', 'Observado'].includes(r.estado),
    extra: r => [
      ...(r.estado === 'En evaluación' ? [{ icon: 'fa-stamp', label: 'Aprobar', fn: x => AB().aprobarReq(x) }, { icon: 'fa-comment-dots', label: 'Observar', fn: x => AB().observarReq(x) }] : []),
      ...(r.estado === 'Aprobado' ? [{ icon: 'fa-file-circle-plus', label: 'Generar orden desde el requerimiento', fn: x => AB().aOrden(x) }] : [])
    ],
    print: r => ({ pairs: [['Centro de costo', r.cc], ['Fecha', r.fecha], ['Monto estimado', SIGA.ui.money(r.monto)], ['Estado', r.estado], ['Descripción', SIGA.ui.esc(r.desc), 1]], body: `<p class="mini">Especificaciones técnicas y términos de referencia adjuntos en el expediente electrónico.</p>`, firmas: [['Área usuaria', r.user], ['Aprobó', r.aprob || '—'], ['Recibió', 'Oficina de Abastecimiento']] })
  };

  SIGA.registerModule('abastecimiento', {
    title: 'Abastecimiento', icon: 'fa-boxes-stacked', group: 'Ejecución del gasto',
    tipo: 'oc', st: null,
    alerts() {
      const out = [];
      A.encargos.filter(e => e.estado === 'Vencido').forEach(e => out.push({ lvl: 'crit', icon: 'fa-hand-holding-dollar', t: `Encargo ${e.num} con rendición vencida (${e.dias} días)`, d: `${e.resp} · ${SIGA.ui.money(e.monto)} · bloqueado para nuevos fondos`, fn: () => SIGA.showTab(document.getElementById('mod-root'), 'a', 'enc') }));
      A.comisiones.filter(c => c.estado === 'Rendición vencida').forEach(c => out.push({ lvl: 'crit', icon: 'fa-plane-departure', t: `Rendición de viáticos vencida · ${c.num}`, d: c.com + ' · vencía ' + c.vence, fn: () => SIGA.showTab(document.getElementById('mod-root'), 'a', 'via') }));
      A.ordenes.filter(o => o.estado === 'Atrasada').forEach(o => out.push({ lvl: 'warn', icon: 'fa-truck-clock', t: `${o.doc} con ${o.atraso} días de atraso`, d: `${o.prov} · penalidad ${SIGA.ui.money(penal(o).total)}`, fn: () => SIGA.showTab(document.getElementById('mod-root'), 'a', 'con') }));
      A.contratos.filter(c => c.alerta).forEach(c => out.push({ lvl: 'warn', icon: 'fa-file-contract', t: c.alerta + ' · ' + c.num, d: c.con }));
      if (cchUsado() / A.cajaChica.fondo >= 0.6) out.push({ lvl: 'warn', icon: 'fa-wallet', t: `Caja chica al ${(cchUsado() / A.cajaChica.fondo * 100).toFixed(0)}% · solicitar reposición`, d: 'Saldo ' + SIGA.ui.money(cchSaldo()), fn: () => SIGA.showTab(document.getElementById('mod-root'), 'a', 'cch') });
      const r = A.requerimientos.filter(x => x.estado === 'En evaluación').length;
      if (r) out.push({ lvl: 'info', icon: 'fa-clipboard-check', t: `${r} requerimiento(s) en evaluación`, d: 'Flujo de aprobación electrónica' });
      return out;
    },
    search(q) {
      return [...A.ordenes.filter(o => (o.doc + ' ' + o.prov + ' ' + o.ref).toLowerCase().includes(q)).map(o => ({ t: o.doc + ' · ' + SIGA.ui.money(o.imp), d: o.prov + ' · ' + o.estado, fn: () => this.verOrden(o) })),
        ...A.requerimientos.filter(r => (r.num + ' ' + r.desc).toLowerCase().includes(q)).map(r => ({ t: r.num, d: r.desc + ' · ' + r.estado })),
        ...A.proveedores.filter(p => (p.ruc + ' ' + p.rs).toLowerCase().includes(q)).map(p => ({ t: p.rs, d: 'RUC ' + p.ruc }))];
    },

    render(el) {
      const U = SIGA.ui;
      if (!this.st) this.st = defaults();
      const venc = A.encargos.filter(e => e.estado === 'Vencido').length + A.comisiones.filter(c => c.estado === 'Rendición vencida').length;
      const nuevas = A.ordenes.filter(o => o.nuevo).length;
      el.innerHTML = `
      <div class="page-head"><div><h1>Abastecimiento</h1><p>Del requerimiento a la conformidad · diez documentos en un solo generador · órdenes con certificación verificada antes de grabar</p></div>
        <div class="row-flex"><button class="btn ghost" id="a-req"><i class="fa-solid fa-clipboard-list"></i> Nuevo requerimiento</button><button class="btn" id="a-gen"><i class="fa-solid fa-file-circle-plus"></i> Generar documento</button></div></div>
      ${U.kpis([
        { lab: 'Órdenes emitidas 2026', val: U.int(1126 + nuevas), sub: 'O/C y O/S · numeración correlativa' },
        { lab: 'Requerimientos en evaluación', val: A.requerimientos.filter(r => r.estado === 'En evaluación').length, sub: 'aprobación electrónica', chip: 'flujo', chipType: 'info' },
        { lab: 'Rendiciones vencidas', val: venc, sub: 'responsables bloqueados', color: venc ? 'var(--danger)' : '', chip: venc ? 'bloqueo' : '', chipType: 'warn' },
        { lab: 'Caja chica · saldo', val: U.money(cchSaldo()), sub: 'de ' + U.money(A.cajaChica.fondo) + ' asignados' }
      ])}
      <div class="seg-tabs" data-group="a">
        <button class="on" data-tab="gen">Generar documento</button><button data-tab="req">Requerimientos</button><button data-tab="ord">Órdenes</button><button data-tab="cot">Cuadro comparativo</button>
        <button data-tab="cch">Caja chica</button><button data-tab="enc">Encargos</button><button data-tab="via">Viáticos y pasajes</button><button data-tab="sub">Subvenciones</button>
        <button data-tab="con">Contratos y penalidades</button><button data-tab="prov">Proveedores</button><button data-tab="pac">PAC 2026</button></div>
      <div class="subpanel show" data-group="a" data-panel="gen" id="a-p-gen"></div>
      <div class="subpanel" data-group="a" data-panel="req"><div class="card"><h3><span class="dot"></span>Requerimientos de las áreas usuarias <span class="grow">A-02 · A-03 · aprobación configurable por monto (&gt; S/ 30,000 → DGA)</span></h3><div id="a-treq"></div></div></div>
      <div class="subpanel" data-group="a" data-panel="ord"><div class="card"><h3><span class="dot"></span>Órdenes de compra y de servicio <span class="grow">clic para ver · plazo, entrega y penalidad</span></h3><div id="a-tord"></div></div></div>
      <div class="subpanel" data-group="a" data-panel="cot" id="a-p-cot"></div>
      <div class="subpanel" data-group="a" data-panel="cch" id="a-p-cch"></div>
      <div class="subpanel" data-group="a" data-panel="enc" id="a-p-enc"></div>
      <div class="subpanel" data-group="a" data-panel="via" id="a-p-via"></div>
      <div class="subpanel" data-group="a" data-panel="sub" id="a-p-sub"></div>
      <div class="subpanel" data-group="a" data-panel="con" id="a-p-con"></div>
      <div class="subpanel" data-group="a" data-panel="prov" id="a-p-prov"></div>
      <div class="subpanel" data-group="a" data-panel="pac"><div class="card"><h3><span class="dot"></span>Plan Anual de Contrataciones 2026 <span class="grow">A-01 · vinculado al cuadro de necesidades</span></h3><div id="a-tpac"></div></div></div>`;

      el.querySelector('#a-gen').addEventListener('click', () => SIGA.showTab(el, 'a', 'gen'));
      el.querySelector('#a-req').addEventListener('click', () => this.nuevoReq());
      this.paintReq(); this.paintOrd(); this.paintCot(); this.paintCch(); this.paintEnc(); this.paintVia(); this.paintSub(); this.paintCon(); this.paintProv(); this.paintPac();
      this.buildGen(document.getElementById('a-p-gen'));
    },

    /* =================== GENERADOR DE DOCUMENTOS =================== */
    buildGen(host) {
      const U = SIGA.ui, st = this.st, T = A.docTipos, self = this;
      const tp = () => T[this.tipo], modo = () => tp().modo, V = () => st.v[this.tipo], rows = () => st.items[this.tipo] || [];
      host.innerHTML = `
        <div class="doc-type-pills" id="dtp">${Object.entries(T).map(([k, v]) => `<div class="dtp ${k === this.tipo ? 'on' : ''}" data-t="${k}"><div class="ico"><i class="fa-solid ${v.ico}"></i></div><div class="t"><b>${v.t}</b><span>${v.s}</span></div></div>`).join('')}</div>
        <div class="aba-wrap">
          <div class="card"><h3><span class="dot"></span>Datos del documento <span class="grow" id="g-title"></span></h3>
            <div class="fgrid" id="g-fields"></div>
            <div id="g-items"></div>
            <div id="g-status" class="mt"></div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px;gap:14px;flex-wrap:wrap">
              <label class="switch" id="g-igvw"><input type="checkbox" id="g-igv"><span class="tr"></span> Afecto a IGV (18%)</label>
              <div style="min-width:220px;flex:1;max-width:300px" id="g-tot"></div></div>
            <div class="row-flex mt"><button class="btn" id="g-save"><i class="fa-solid fa-floppy-disk"></i> Validar y guardar</button><button class="btn sec" id="g-print"><i class="fa-solid fa-file-arrow-down"></i> Exportar PDF</button><button class="btn ghost" id="g-clear"><i class="fa-solid fa-eraser"></i> Limpiar ítems</button></div></div>
          <div><div class="mini" style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fa-solid fa-eye"></i> Vista previa · se actualiza en tiempo real · queda en el expediente digital</div><div class="doc" id="doc-preview"></div></div>
        </div>`;
      const $ = id => host.querySelector('#' + id);
      const datalists = `<datalist id="dl-provs">${A.proveedores.map(p => `<option value="${p.rs}">`).join('')}</datalist>
        <datalist id="dl-com">${[...new Set([...A.comisiones.map(c => c.com), 'Dr. J. Arévalo'])].map(x => `<option value="${x}">`).join('')}</datalist>
        <datalist id="dl-enc">${[...new Set([...A.encargos.map(e => e.resp), 'Ing. L. Castañeda'])].map(x => `<option value="${x}">`).join('')}</datalist>`;

      const tot = () => {
        const m = modo(), v = V();
        if (m === 'via') { const d = Math.max(0, diasEntre(v.salida, v.retorno)), esc = escalaDe(v.cargo), mov = Math.min(num(v.mov), A.topeMovilidad); return { dias: d, esc, mov, viat: d * esc, movT: d * mov, sub: d * esc + d * mov, igv: 0, tot: d * esc + d * mov }; }
        const sub = rows().reduce((s, r) => s + (m === 'val' || m === 'alm' ? num(r.cant) * num(r.pu) : num(r.imp)), 0);
        const igv = m === 'val' && st.igv[this.tipo] ? sub * 0.18 : 0;
        return { sub, igv, tot: sub + igv };
      };
      // Validaciones bloqueantes por tipo de documento
      const check = () => {
        const t = tot(), v = V(), k = this.tipo;
        if (k === 'oc' || k === 'os') {
          const c = certOf(v.cert);
          if (!c) return { lvl: 'bad', h: 'Seleccione la certificación presupuestal que respalda la orden.' };
          const s = SIGA.ppto.certSaldo(c);
          if (!String(v.ref || '').trim()) return { lvl: 'bad', h: 'La justificación es obligatoria (RF-A-02).' };
          if (t.tot > s + 0.004) return { lvl: 'bad', h: `La orden (${U.money(t.tot)}) <b>excede el saldo de la CCP ${c.num}</b> (${U.money(s)}). No se puede grabar: se evita el compromiso sin crédito.`, c, s };
          return { lvl: 'ok', h: `Certificación <b>CCP ${c.num}</b> verificada · saldo ${U.money(s)} · esta orden ${U.money(t.tot)} · saldo resultante <b>${U.money(s - t.tot)}</b>`, c, s };
        }
        if (k === 'pec') {
          const falt = rows().filter(r => SIGA.alm && num(r.cant) > SIGA.alm.stockDe(r.cod));
          if (falt.length) return { lvl: 'bad', h: 'Stock insuficiente: ' + falt.map(r => `${r.desc} (pide ${r.cant}, hay ${SIGA.alm.stockDe(r.cod)})`).join(' · ') };
          return { lvl: 'ok', h: 'Stock verificado en línea · el kárdex se actualiza en el mismo acto y el consumo se imputa al centro de costo (L-04).' };
        }
        if (k === 'nea') return v.oc ? { lvl: 'ok', h: `Ingreso vinculado a <b>${v.oc.split(' · ')[0]}</b> · la recepción registra la conformidad previa al devengado (A-17).` } : { lvl: 'bad', h: 'Seleccione la orden de compra que origina el ingreso.' };
        if (k === 'via') {
          if (vencidos().some(n => n.toLowerCase() === String(v.com).trim().toLowerCase())) return { lvl: 'bad', h: `<b>${v.com}</b> mantiene una rendición vencida. El sistema impide emitir una nueva comisión (RF-A-10).` };
          if (t.dias <= 0) return { lvl: 'bad', h: 'La fecha de retorno debe ser posterior o igual a la de salida.' };
          return { lvl: num(v.mov) > A.topeMovilidad ? 'warn' : 'ok', h: `Escala aplicada automáticamente: <b>${v.cargo}</b> → S/ ${fmt(t.esc)} por día × ${t.dias} día(s)${num(v.mov) > A.topeMovilidad ? ` · movilidad ajustada al tope de S/ ${A.topeMovilidad}` : ''}. Rendición: 8 días desde el retorno.` };
        }
        if (k === 'cch') {
          const s = cchSaldo(), alto = rows().filter(r => num(r.imp) > A.topeCajaChica);
          if (alto.length) return { lvl: 'bad', h: `Comprobante(s) por encima del tope de S/ ${fmt(A.topeCajaChica)}: ${alto.map(r => r.serie).join(', ')}. Deben tramitarse por orden de compra o servicio.` };
          if (t.tot > s + 0.004) return { lvl: 'bad', h: `La rendición (${U.money(t.tot)}) <b>excede el saldo del fondo</b> (${U.money(s)}). Solicite la reposición antes de rendir.` };
          return { lvl: 'ok', h: `Saldo del fondo en tiempo real: ${U.money(s)} → tras esta rendición <b>${U.money(s - t.tot)}</b>` };
        }
        if (k === 'enc') {
          if (vencidos().some(n => n.toLowerCase() === String(v.resp).trim().toLowerCase())) return { lvl: 'bad', h: `<b>${v.resp}</b> tiene rendiciones vencidas: no puede recibir un nuevo encargo (G.2 · RF-A-10).` };
          if (pendientes().some(n => n.toLowerCase() === String(v.resp).trim().toLowerCase())) return { lvl: 'warn', h: `${v.resp} tiene un encargo por rendir dentro de plazo. Se permite con advertencia.` };
          return { lvl: 'ok', h: `Responsable sin rendiciones pendientes · plazo de rendición: ${num(v.plazo)} días · alerta automática al vencer.` };
        }
        if (k === 'ayu') return String(v.resol || '').trim().length > 8 ? { lvl: 'ok', h: 'Designaciones generadas desde la resolución decanal vigente (RF-A-09).' } : { lvl: 'bad', h: 'Sin resolución decanal no puede generarse el pago de ayudantía.' };
        if (k === 'ppp') { const dif = rows().filter(r => num(r.imp) !== A.montoPracticas); return dif.length ? { lvl: 'warn', h: `El monto de la subvención es fijo por semestre (S/ ${fmt(A.montoPracticas)}). Revise ${dif.length} fila(s).` } : { lvl: 'ok', h: `Subvención fija de S/ ${fmt(A.montoPracticas)} por semestre completo, vinculada al periodo ${V().periodo}.` }; }
        return { lvl: 'ok', h: 'Pasajes registrados por separado del viático, con sustento del boleto (RF-A-07).' };
      };

      const paintFields = () => {
        const v = V();
        $('g-title').textContent = tp().t;
        const base = [{ k: 'num', l: 'Número', ro: 1 }, { k: 'fecha', l: 'Fecha', type: 'date' }];
        $('g-fields').innerHTML = [...base, ...FIELDS[this.tipo]].map(f => {
          const val = f.k === 'num' ? tp().num : (v[f.k] == null ? '' : v[f.k]);
          let inp;
          const same = o => o === val || (f.k === 'cert' && String(o).split(' · ')[0] === String(val).split(' · ')[0]);
          if (f.sel) inp = `<select data-f="${f.k}">${f.sel().map(o => `<option ${same(o) ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
          else inp = `<input data-f="${f.k}" type="${f.type || 'text'}" value="${U.esc(val)}" ${f.ro ? 'readonly' : ''} ${f.list === 1 ? 'list="dl-provs"' : f.list === 2 ? 'list="dl-com"' : f.list === 3 ? 'list="dl-enc"' : ''}>`;
          return `<div class="fld ${f.span === 2 ? 'fspan2' : ''}"><label>${f.l}</label>${inp}</div>`;
        }).join('') + datalists;
        // Sincroniza el valor del select por si la opción por defecto no existe
        $('g-fields').querySelectorAll('select[data-f]').forEach(s => { v[s.dataset.f] = s.value; });
        $('g-igvw').style.display = modo() === 'val' ? '' : 'none';
        $('g-igv').checked = !!st.igv[this.tipo];
      };
      const paintItems = () => {
        const cols = COLS[this.tipo];
        if (!cols) {
          const t = tot();
          $('g-items').innerHTML = `<div class="grid cols-3 mt" style="gap:10px"><div class="mini-card"><div class="lab">Viático diario</div><div class="v">S/ ${fmt(t.esc)}</div><div class="s">según cargo</div></div><div class="mini-card"><div class="lab">Días de comisión</div><div class="v">${t.dias}</div><div class="s">salida → retorno</div></div><div class="mini-card"><div class="lab">Movilidad local</div><div class="v">S/ ${fmt(t.mov)}</div><div class="s">por día · tope ${A.topeMovilidad}</div></div></div>`;
          return;
        }
        const w = modo() === 'val' || modo() === 'alm';
        $('g-items').innerHTML = `<div class="lbl-s" style="margin-top:16px">${this.tipo === 'cch' ? 'Comprobantes rendidos' : this.tipo === 'bol' ? 'Tramos del viaje' : this.tipo === 'enc' ? 'Gastos previstos' : this.tipo === 'ppp' || this.tipo === 'ayu' ? 'Beneficiarios' : 'Detalle (catálogo SIGA)'}</div>
          <div style="overflow-x:auto"><table class="itbl"><thead><tr>${cols.map(c => `<th class="${c.n ? 'r' : ''}" ${c.w ? `style="width:${c.w}"` : ''}>${c.l}</th>`).join('')}<th class="r" style="width:84px">Total</th><th style="width:26px"></th></tr></thead>
          <tbody>${rows().map((r, i) => `<tr>${cols.map(c => c.sel ? `<td><select data-i="${i}" data-c="${c.k}">${c.sel.map(o => `<option ${o === r[c.k] ? 'selected' : ''}>${o}</option>`).join('')}</select></td>` : `<td class="${c.n ? 'r' : ''}"><input data-i="${i}" data-c="${c.k}" value="${U.esc(c.n ? (c.k === 'cant' ? r[c.k] : fmt(r[c.k])) : (r[c.k] == null ? '' : r[c.k]))}"></td>`).join('')}<td class="r num" data-tot="${i}" style="padding-right:8px;font-weight:600">${fmt(w ? num(r.cant) * num(r.pu) : num(r.imp))}</td><td><button class="del" data-del="${i}"><i class="fa-solid fa-xmark"></i></button></td></tr>`).join('')}</tbody></table></div>
          <button class="addrow" id="g-add"><i class="fa-solid fa-plus"></i> Agregar fila</button>`;
        $('g-add').addEventListener('click', () => {
          const seed = { val: { cod: '', desc: '', um: 'UNIDAD', cant: 1, pu: 0 }, alm: { cod: '', desc: '', um: 'UNIDAD', cant: 1, pu: 0 } }[modo()] || (this.tipo === 'ppp' ? { cod: '', nom: '', det: '', imp: A.montoPracticas } : this.tipo === 'ayu' ? { cod: '', nom: '', cond: 'Bachiller', det: '', imp: A.montoAyudantia } : this.tipo === 'cch' ? { tipo: 'Boleta', serie: '', prov: '', conc: '', imp: 0 } : this.tipo === 'bol' ? { tramo: '', medio: 'Terrestre', emp: '', fec: '', imp: 0 } : { conc: '', clas: '', imp: 0 });
          rows().push(seed); paintItems(); update();
        });
      };
      const update = () => {
        const t = tot(), c = check(), m = modo();
        if (!COLS[this.tipo]) paintItems();
        let lines = '';
        if (m === 'via') lines = `<div class="tot-line"><span class="mini">Viático ${t.dias} d × S/ ${fmt(t.esc)}</span><span class="num">${fmt(t.viat)}</span></div><div class="tot-line"><span class="mini">Movilidad local</span><span class="num">${fmt(t.movT)}</span></div>`;
        else if (m === 'val') lines = `<div class="tot-line"><span class="mini">Subtotal</span><span class="num">${fmt(t.sub)}</span></div><div class="tot-line" style="opacity:${st.igv[this.tipo] ? 1 : .4}"><span class="mini">IGV (18%)</span><span class="num">${fmt(t.igv)}</span></div>`;
        else if (this.tipo === 'cch') lines = `<div class="tot-line"><span class="mini">Saldo del fondo</span><span class="num">${fmt(cchSaldo())}</span></div>`;
        $('g-tot').innerHTML = lines + `<div class="tot-line grand"><span>TOTAL S/</span><span class="num">${fmt(t.tot)}</span></div>`;
        const ic = { ok: 'fa-circle-check', warn: 'fa-triangle-exclamation', bad: 'fa-lock' }[c.lvl];
        $('g-status').innerHTML = `<div class="note ${c.lvl === 'ok' ? 'teal' : c.lvl === 'warn' ? 'amber' : 'warn'}" style="margin:0"><i class="fa-solid ${ic}"></i><div>${c.h}</div></div>`;
        renderDoc(t);
      };
      const renderDoc = t => {
        const v = V(), k = this.tipo, m = modo(), cols = COLS[k];
        const fl = FIELDS[k].filter(f => !['cert', 'oc', 'comision'].includes(f.k) && v[f.k] !== '' && v[f.k] != null);
        const party = fl.map(f => `<div ${f.span === 2 ? 'style="grid-column:span 2"' : ''}><div class="k">${f.l.replace(/\s*\(.*\)/, '')}</div><div class="v">${f.type === 'date' ? U.dmy(v[f.k]) : U.esc(v[f.k])}</div></div>`).join('');
        let chain = '';
        if (k === 'oc' || k === 'os') { const c = certOf(v.cert); if (c) { const mm = SIGA.ppto.marco(c.marco); chain = `<b>Cadena:</b> Func. 22 › Div. 048 › Meta ${mm.meta} › Partida ${mm.clasif} · Fte ${mm.fte} · <b>CCP ${c.num}</b>`; } }
        else if (k === 'nea' && v.oc) chain = `<b>Origen:</b> ${v.oc} · conformidad de recepción`;
        else if (k === 'bol' && v.comision) chain = `<b>Comisión:</b> ${v.comision}`;
        else if (k === 'pec') chain = `<b>Cadena:</b> Meta ${v.meta} › afectación automática al centro de costo solicitante`;
        let th, body;
        if (!cols) { th = '<th>Concepto</th><th class="r">Días</th><th class="r">Tarifa</th><th class="r">Importe</th>'; body = `<tr><td>Viático por comisión de servicio (${U.esc(v.cargo)})</td><td class="r">${t.dias}</td><td class="r">${fmt(t.esc)}</td><td class="r">${fmt(t.viat)}</td></tr><tr><td>Movilidad local (declaración jurada)</td><td class="r">${t.dias}</td><td class="r">${fmt(t.mov)}</td><td class="r">${fmt(t.movT)}</td></tr>`; }
        else { const w = m === 'val' || m === 'alm'; th = cols.map(c => `<th class="${c.n ? 'r' : ''}">${c.l}</th>`).join('') + '<th class="r">Total</th>'; body = rows().map(r => `<tr>${cols.map(c => `<td class="${c.n ? 'r' : ''}">${c.n ? (c.k === 'cant' ? r[c.k] : fmt(r[c.k])) : U.esc(r[c.k])}</td>`).join('')}<td class="r">${fmt(w ? num(r.cant) * num(r.pu) : num(r.imp))}</td></tr>`).join(''); }
        const totBox = `<div class="doc-tot"><div class="box">${m === 'val' ? `<div class="tl-row"><span>Subtotal</span><span>${fmt(t.sub)}</span></div>${st.igv[k] ? `<div class="tl-row"><span>IGV (18%)</span><span>${fmt(t.igv)}</span></div>` : ''}` : ''}<div class="tl-row g"><span>TOTAL S/</span><span>${fmt(t.tot)}</span></div></div></div><div class="doc-letras">${U.montoLetras(t.tot)}</div>`;
        $('doc-preview').innerHTML = `
          <div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional Agraria de la Selva</b><span>${tp().of} · Tingo María</span></div></div>
            <div class="doc-num"><div class="tp">${tp().docTp}</div><div class="nn">N° ${tp().num}</div><div class="yr">Ejercicio 2026 · ${U.dmy(v.fecha)}</div></div></div>
          <div class="doc-party">${party}</div>${chain ? `<div class="doc-chain">${chain}</div>` : ''}
          <table class="doc-tbl"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>${totBox}
          <div class="doc-sign">${(FIRMAS[k] || FIRMAS.oc).map(f => `<div><b>${f[0]}</b>${f[1]}</div>`).join('')}</div>
          <div class="mini" style="margin-top:14px;text-align:center"><i class="fa-solid fa-qrcode"></i> Documento electrónico con firma digital · verificable en el expediente</div>`;
      };
      const paintAll = () => { paintFields(); paintItems(); update(); };

      host.addEventListener('input', e => {
        const f = e.target.dataset.f, i = e.target.dataset.i, c = e.target.dataset.c;
        if (f) { V()[f] = e.target.value; if (f === 'oc') { const o = A.ordenes.find(x => x.doc === e.target.value.split(' · ')[0]); if (o) { V().prov = o.prov; paintFields(); } } update(); return; }
        if (i != null && c) {
          const col = COLS[this.tipo].find(x => x.k === c); rows()[+i][c] = col && col.n ? num(e.target.value) : e.target.value;
          const w = modo() === 'val' || modo() === 'alm', r = rows()[+i], cell = host.querySelector(`[data-tot="${i}"]`);
          if (cell) cell.textContent = fmt(w ? num(r.cant) * num(r.pu) : num(r.imp));
          update();
        }
      });
      host.addEventListener('change', e => { if (e.target.tagName === 'SELECT' && (e.target.dataset.f || e.target.dataset.c)) { if (e.target.dataset.c) rows()[+e.target.dataset.i][e.target.dataset.c] = e.target.value; else V()[e.target.dataset.f] = e.target.value; update(); } });
      host.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { rows().splice(+b.dataset.del, 1); paintItems(); update(); } });
      $('g-igv').addEventListener('change', e => { st.igv[this.tipo] = e.target.checked; update(); });
      $('dtp').addEventListener('click', e => { const p = e.target.closest('.dtp'); if (!p) return; host.querySelectorAll('.dtp').forEach(x => x.classList.toggle('on', x === p)); this.tipo = p.dataset.t; paintAll(); });
      $('g-print').addEventListener('click', () => { SIGA.log('Abastecimiento', 'Exportación PDF', tp().docTp + ' ' + tp().num); U.printEl(document.getElementById('doc-preview')); });
      $('g-clear').addEventListener('click', () => { if (st.items[this.tipo]) { st.items[this.tipo].length = 0; paintItems(); update(); } });
      $('g-save').addEventListener('click', () => {
        if (SIGA.ctx.user.readOnly) { U.toast('El rol OCI tiene acceso de solo consulta', 'err'); return; }
        const c = check(), t = tot();
        if (c.lvl === 'bad') {
          SIGA.log('Abastecimiento', 'Documento bloqueado por validación', tp().docTp + ' ' + tp().num, '—', c.h.replace(/<[^>]+>/g, ''));
          U.modal('<i class="fa-solid fa-lock" style="color:var(--danger)"></i> No se puede grabar', `<div class="note warn" style="margin:0"><i class="fa-solid fa-ban"></i><div>${c.h}</div></div><p class="mini mt">El intento quedó registrado en la bitácora. Corrija el documento y vuelva a intentarlo.</p>`, `<button class="btn ghost" data-close>Entendido</button>`, 'narrow');
          return;
        }
        if ((modo() !== 'via') && !rows().length) { U.toast('Agregue al menos una fila', 'err'); return; }
        self.guardar(this.tipo, V(), rows(), t, c);
      });
      paintAll();
    },

    guardar(k, v, rows, t, c) {
      const U = SIGA.ui, T = A.docTipos[k], n = T.num, fecha = U.dmy(v.fecha);
      let msg = '';
      if (k === 'oc' || k === 'os') {
        const doc = (k === 'oc' ? 'O/C ' : 'O/S ') + n, cert = c.c, m = SIGA.ppto.marco(cert.marco);
        cert.comp = (cert.comp || 0) + t.tot;
        if (cert.fase === 'Certificado') cert.fase = 'Comprometido';
        SIGA.ppto.bump('Comprometido', t.tot, m);
        A.ordenes.unshift({ doc, fecha, prov: v.prov, ref: v.ref, cert: cert.num, part: m.clasif, imp: t.tot, plazo: num(v.plazo), entrega: U.dmy(addDays(v.fecha, num(v.plazo))), estado: 'Emitida', cls: 't-blue', nuevo: true, variante: v.variante, items: JSON.parse(JSON.stringify(rows)) });
        SIGA.siaf('Compromiso anual', doc, t.tot);
        SIGA.exp?.stage(cert.exp, 'comp', doc);
        SIGA.log('Abastecimiento', 'Emisión de ' + T.t.toLowerCase(), doc, 'Saldo CCP ' + U.money(c.s), 'Saldo CCP ' + U.money(c.s - t.tot));
        msg = `${doc} emitida por ${U.money(t.tot)} · compromiso enviado al SIAF · CCP ${cert.num} afectada`;
      } else if (k === 'pec') {
        SIGA.alm?.salida(rows, v.dep, 'PECOSA ' + n, v.autor);
        SIGA.asiento('Consumo de existencias · PECOSA ' + n + ' · ' + v.dep, [['5301', t.tot, 0], ['1301', 0, t.tot]], 'Almacén');
        SIGA.log('Almacén', 'Salida por PECOSA', 'PECOSA ' + n, '—', v.dep + ' · ' + U.money(t.tot));
        msg = `PECOSA ${n} registrada · kárdex actualizado y consumo imputado a ${v.dep}`;
      } else if (k === 'nea') {
        const oc = A.ordenes.find(o => o.doc === String(v.oc).split(' · ')[0]);
        SIGA.alm?.ingreso(rows, 'NEA ' + n, oc ? oc.doc : '', v.prov);
        if (oc) { oc.estado = 'Atendida'; oc.cls = 't-green'; const cert = SIGA.ppto.cert(oc.cert); if (cert) SIGA.exp?.stage(cert.exp, 'conf', 'NEA ' + n, 'conformidad de recepción'); }
        SIGA.log('Almacén', 'Ingreso por NEA', 'NEA ' + n, oc ? oc.doc + ' pendiente' : '—', 'Atendida · ' + U.money(t.tot));
        msg = `NEA ${n} registrada · ${oc ? oc.doc + ' atendida · ' : ''}conformidad lista para el devengado`;
      } else if (k === 'via') {
        A.comisiones.unshift({ num: 'VIA-2026-' + n, com: v.com, cargo: v.cargo, dest: v.dest, dias: t.dias, viat: t.tot, pasaje: 0, estado: 'Por rendir', vence: U.dmy(addDays(v.retorno, 8)), nuevo: true });
        SIGA.siaf('Compromiso · viáticos', 'VIA-2026-' + n, t.tot);
        SIGA.log('Abastecimiento', 'Planilla de viáticos', 'VIA-2026-' + n, '—', v.com + ' · ' + t.dias + ' d × ' + U.money(t.esc));
        msg = `Planilla de viáticos VIA-2026-${n} · ${v.com} · ${U.money(t.tot)} calculado con la escala vigente`;
      } else if (k === 'bol') {
        const com = A.comisiones.find(x => x.num === String(v.comision).split(' · ')[0]); if (com) com.pasaje += t.tot;
        SIGA.log('Abastecimiento', 'Bolsa de viaje (pasajes)', 'BV-' + n, '—', (com ? com.num : '') + ' · ' + U.money(t.tot));
        msg = `Bolsa de viaje ${n} · pasajes ${U.money(t.tot)} asociados a ${com ? com.num : 'la comisión'}`;
      } else if (k === 'cch') {
        rows.forEach(r => A.cajaChica.comprobantes.push([SIGA.ctx.hoyCorta, r.tipo, r.serie, r.prov, r.conc, num(r.imp)]));
        SIGA.asiento('Rendición de caja chica N° ' + n, [['5302', t.tot, 0], ['1101', 0, t.tot]], 'Caja chica');
        SIGA.log('Tesorería', 'Rendición de caja chica', 'RCC-' + n, 'Saldo ' + U.money(cchSaldo() + t.tot), 'Saldo ' + U.money(cchSaldo()));
        msg = `Rendición ${n} registrada · saldo del fondo ${U.money(cchSaldo())}`;
      } else if (k === 'enc') {
        A.encargos.unshift({ num: 'ENC-2026-' + n, resp: v.resp, resol: v.resol, act: v.act, monto: t.tot, entrega: fecha, vence: U.dmy(addDays(v.fecha, num(v.plazo))), rendido: 0, estado: 'Por rendir', dias: -num(v.plazo), nuevo: true });
        SIGA.siaf('Encargo interno', 'ENC-2026-' + n, t.tot);
        SIGA.log('Tesorería', 'Otorgamiento de encargo', 'ENC-2026-' + n, '—', v.resp + ' · ' + U.money(t.tot));
        msg = `Encargo ENC-2026-${n} otorgado a ${v.resp} · rendición hasta ${U.dmy(addDays(v.fecha, num(v.plazo)))}`;
      } else if (k === 'ppp') {
        A.subvenciones.practicas.unshift([v.fac, rows.length, v.resol, v.periodo, 'Por pagar']);
        SIGA.log('Abastecimiento', 'Planilla de prácticas preprofesionales', 'PPP-' + n, '—', v.fac + ' · ' + rows.length + ' estudiantes');
        msg = `Subvención de prácticas ${n} · ${rows.length} estudiantes de ${v.fac} · ${U.money(t.tot)}`;
      } else if (k === 'ayu') {
        rows.forEach(r => A.subvenciones.ayudantias.unshift([r.cod, r.nom, r.cond, r.det, v.fac, v.resol, 'Vigente']));
        SIGA.log('Abastecimiento', 'Planilla de ayudantía de cátedra', 'AYU-' + n, '—', v.resol);
        msg = `Ayudantía ${n} · ${rows.length} designaciones desde ${v.resol}`;
      }
      T.num = U.pad(+n + 1, n.length);
      SIGA.refresh();
      U.toast(msg);
    },

    /* ------------------ Requerimientos ------------------ */
    paintReq() {
      const U = SIGA.ui;
      document.getElementById('a-treq').innerHTML = U.grid({
        id: 'aba-req', title: 'requerimientos', export: 'requerimientos', rows: A.requerimientos, record: reqRec, pageSize: 12,
        filter: { label: 'Estado', get: r => r.estado },
        cols: [
        { k: 'num', label: 'N°', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha.split('/').reverse().join('') },
        { k: 'cc', label: 'Centro de costo' }, { k: 'desc', label: 'Requerimiento', render: r => U.esc(r.desc) + (r.obs ? `<div class="mini" style="color:#b45309">Obs.: ${U.esc(r.obs)}</div>` : ''), csv: r => r.desc },
        { k: 'monto', label: 'Estimado', r: true, render: r => U.money(r.monto) },
        { k: 'saldo', label: 'Saldo', nosort: true, render: r => r.saldo ? U.tag('✓ verificado', 't-green') : U.tag('sin saldo', 't-red') },
        { k: 'nivel', label: 'Aprueba', sv: r => r.monto > 30000 ? 1 : 0, render: r => `<span class="mini">${r.monto > 30000 ? 'DGA' : 'Jefe de Abastecimiento'}</span>` },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, REQCLS[r.estado]) }
      ],
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [
          { icon: 'fa-stamp', title: 'Aprobar', show: r => r.estado === 'En evaluación', fn: r => this.aprobarReq(r) },
          { icon: 'fa-comment-dots', title: 'Observar', cls: 'del', show: r => r.estado === 'En evaluación', fn: r => this.observarReq(r) },
          { icon: 'fa-file-circle-plus', title: 'Generar orden', show: r => r.estado === 'Aprobado', fn: r => this.aOrden(r) }
        ],
        tools: [{ icon: 'fa-plus', label: 'Nuevo requerimiento', primary: true, fn: () => this.nuevoReq() }],
        bulk: [{ icon: 'fa-stamp', label: 'Aprobar seleccionados', fn: rs => { const x = rs.filter(r => r.estado === 'En evaluación'); if (!x.length) { U.toast('No hay requerimientos en evaluación en la selección', 'info'); return; } const alto = x.some(r => r.monto > 30000); if (!SIGA.sod(null, alto ? 'req.aprobar.alto' : 'req.aprobar')) return; const ok = x.filter(r => r.user !== SIGA.ctx.user.nombre); ok.forEach(r => { r.estado = 'Aprobado'; r.aprob = SIGA.ctx.user.nombre; SIGA.log('Abastecimiento', 'Aprobación de requerimiento', r.num, 'En evaluación', 'Aprobado'); }); U.toast(ok.length + ' requerimientos aprobados' + (x.length > ok.length ? ' · ' + (x.length - ok.length) + ' excluidos (registrados por usted)' : '')); SIGA.refresh(); } }],
        foot: rs => `<tr><td colspan="5" class="r"><b>Total estimado</b></td><td class="r num"><b>${U.money(rs.filter(r => r.estado !== 'Anulado').reduce((s, r) => s + r.monto, 0))}</b></td><td colspan="4"></td></tr>`
      });
    },
    observarReq(r) {
      const U = SIGA.ui;
      if (!SIGA.sod(r.user, r.monto > 30000 ? 'req.aprobar.alto' : 'req.aprobar')) return;
      U.formModal('<i class="fa-solid fa-comment-dots"></i> Observar ' + r.num, [{ k: 'obs', label: 'Observación para el área usuaria', type: 'textarea', value: 'Completar especificaciones técnicas (marca referencial, presentación y plazo de entrega)' }], v => {
        if (!v.obs.trim()) { U.toast('Indique la observación', 'err'); return; }
        r.estado = 'Observado'; r.obs = v.obs.trim(); SIGA.log('Abastecimiento', 'Observación de requerimiento', r.num, 'En evaluación', 'Observado · ' + r.obs);
        U.closeModal(); U.toast(r.num + ' observado · el área usuaria recibe la notificación', 'info'); SIGA.refresh();
      }, 'Observar');
    },
    aOrden(r) {
      const U = SIGA.ui; U.closeModal();
      this.tipo = /servicio|supervisión|mantenimiento|operación/i.test(r.desc) ? 'os' : 'oc';
      Object.assign(this.st.v[this.tipo], { ref: r.desc + ' · ' + r.num });
      this.st.items[this.tipo] = [{ cod: '—', desc: r.desc, um: this.tipo === 'os' ? 'SERVICIO' : 'UNIDAD', cant: 1, pu: Math.round(r.monto / 1.18 * 100) / 100 }];
      r.estado = 'Atendido'; SIGA.log('Abastecimiento', 'Requerimiento atendido con orden', r.num, 'Aprobado', 'Atendido · orden en preparación');
      SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen'); U.toast('Orden precargada con ' + r.num + ' · verifique la certificación y grabe');
    },
    recibir(o) {
      SIGA.ui.closeModal(); this.tipo = 'nea'; this.st.v.nea.oc = o.doc + ' · ' + o.ref; this.st.v.nea.prov = o.prov; if (o.items) this.st.items.nea = JSON.parse(JSON.stringify(o.items)); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen');
    },
    conformidad(o) {
      const U = SIGA.ui;
      U.confirm(`¿Otorgar la <b>conformidad del servicio</b> de ${o.doc} (${U.money(o.imp)})? Habilita el devengado en Contabilidad.`, () => {
        const a = o.estado; o.estado = 'Atendida'; o.cls = 't-green';
        const c = SIGA.ppto.cert(o.cert); if (c) SIGA.exp?.stage(c.exp, 'conf', 'Conformidad ' + o.doc, 'servicio conforme');
        SIGA.log('Abastecimiento', 'Conformidad de servicio', o.doc, a, 'Atendida'); U.toast('Conformidad de ' + o.doc + ' registrada · lista para el devengado'); SIGA.refresh();
      }, 'Dar conformidad', '');
    },
    ampliar(o) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-calendar-plus"></i> Ampliación de plazo · ' + o.doc, [{ k: 'd', label: 'Días adicionales', type: 'number', value: 5, span: 1 }, { k: 'c', label: 'Causal', type: 'select', options: ['Atraso no imputable al contratista', 'Caso fortuito o fuerza mayor', 'Modificación del requerimiento'], span: 1 }, { k: 'r', label: 'Resolución', value: 'R.D. N.º ' + (140 + A.ordenes.length) + '-2026-DGA' }], v => {
        const d = parseInt(v.d, 10) || 0; if (d <= 0) { U.toast('Indique los días', 'err'); return; }
        const [dd, mm, yy] = o.entrega.split('/'); const x = new Date(+yy, mm - 1, +dd); x.setDate(x.getDate() + d);
        const antes = o.entrega; o.plazo += d; o.entrega = U.pad(x.getDate(), 2) + '/' + U.pad(x.getMonth() + 1, 2) + '/' + x.getFullYear(); if (o.atraso) { o.atraso = Math.max(0, o.atraso - d); if (!o.atraso) { o.estado = 'Pendiente de entrega'; o.cls = 't-amber'; } }
        SIGA.log('Abastecimiento', 'Ampliación de plazo', o.doc, 'Entrega ' + antes, 'Entrega ' + o.entrega + ' · ' + v.c + ' · ' + v.r);
        U.closeModal(); U.toast(o.doc + ' · nuevo plazo de entrega ' + o.entrega); SIGA.refresh();
      }, 'Aprobar ampliación');
    },
    aprobarReq(r) {
      const U = SIGA.ui;
      if (!SIGA.sod(r.user, r.monto > 30000 ? 'req.aprobar.alto' : 'req.aprobar')) return;
      r.estado = 'Aprobado'; r.aprob = SIGA.ctx.user.nombre;
      SIGA.log('Abastecimiento', 'Aprobación de requerimiento', r.num, 'En evaluación', 'Aprobado');
      U.toast(`${r.num} aprobado por ${SIGA.ctx.user.nombre} · pasa a indagación de mercado`); SIGA.refresh();
    },
    nuevoReq() {
      const U = SIGA.ui, api = SIGA.ppto, D = SIGA.data.presupuesto;
      const opts = D.marco.map(m => api.label(m) + ' — saldo ' + U.money(api.saldo(m)));
      const findM = v => api.marco(String(v || '').split(' · ')[0]);
      const tot = rows => rows.reduce((s, r) => s + num(r.cant) * num(r.pu), 0);
      U.bigForm({
        title: 'Nuevo requerimiento del área usuaria', icon: 'fa-clipboard-list',
        sections: [{ title: 'Datos del requerimiento', cols: 3, fields: [
          { k: 'num', label: 'N°', value: 'REQ 2026-' + SIGA.ui.pad(939 + A.requerimientos.filter(x => x.nuevo).length, 4), ro: true, span: 1 },
          { k: 'fecha', label: 'Fecha', type: 'date', value: SIGA.ctx.hoyISO, span: 1 },
          { k: 'tipo', label: 'Tipo', type: 'select', options: ['Bien', 'Servicio', 'Obra'], span: 1 },
          { k: 'esp', label: 'Específica que lo financia (verificación automática de saldo)', type: 'select', options: opts, value: opts.find(o => o.startsWith('M03')), span: 3 },
          { k: 'desc', label: 'Descripción', required: true, value: '', span: 3 },
          { k: 'et', label: 'Especificaciones técnicas / términos de referencia', type: 'textarea', value: '', span: 3 }
        ] }],
        items: { title: 'Ítems', addLabel: 'Agregar ítem', seed: { desc: '', um: 'UNIDAD', cant: 1, pu: 0 }, rows: [{ desc: 'Tóner HP 26A para impresora láser', um: 'UNIDAD', cant: 4, pu: 375 }],
          columns: [{ k: 'desc', label: 'Descripción', w: '50%' }, { k: 'um', label: 'Und.', w: '14%' }, { k: 'cant', label: 'Cant.', type: 'num', r: true, w: '10%' }, { k: 'pu', label: 'P. ref.', type: 'money', r: true, w: '12%' }, { k: 't', label: 'Total', calc: r => num(r.cant) * num(r.pu), r: true, w: '14%' }] },
        status: (rows, v) => { const m = findM(v.esp); if (!m) return ''; const s = api.saldo(m), t = tot(rows); return `<div class="note ${t > s ? 'warn' : 'teal'}"><i class="fa-solid ${t > s ? 'fa-lock' : 'fa-circle-check'}"></i><div>${t > s ? `Saldo insuficiente en ${m.id}: disponible ${U.money(s)} frente a ${U.money(t)}. El requerimiento no puede enviarse.` : `Saldo verificado en ${m.id} · disponible ${U.money(s)} · aprobará <b>${t > 30000 ? 'la DGA' : 'el Jefe de Abastecimiento'}</b>`}</div></div>`; },
        totals: rows => [{ label: 'Monto estimado S/', val: U.money(tot(rows), ''), big: true }],
        submitLabel: 'Enviar a aprobación',
        onSubmit: (v, rows) => {
          const m = findM(v.esp), t = tot(rows);
          if (t > api.saldo(m)) { U.toast('Saldo insuficiente: no se puede enviar', 'err'); return; }
          A.requerimientos.unshift({ num: v.num, fecha: U.dmy(v.fecha), cc: m.ccn, desc: v.desc, monto: t, estado: 'En evaluación', user: SIGA.ctx.user.nombre, aprob: '', saldo: true, nuevo: true });
          SIGA.log('Abastecimiento', 'Registro de requerimiento', v.num, '—', U.money(t));
          U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'req');
          U.toast(`${v.num} enviado · notificado a ${t > 30000 ? 'la DGA' : 'Jefatura de Abastecimiento'}`);
        }
      });
    },

    /* ------------------ Órdenes ------------------ */
    paintOrd() {
      const U = SIGA.ui;
      document.getElementById('a-tord').innerHTML = U.grid({
        id: 'aba-ord', title: 'órdenes', export: 'ordenes_compra_servicio', rows: A.ordenes, record: ordRec, pageSize: 12,
        filter: { label: 'Estado', get: r => r.estado },
        cols: [
        { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>${r.variante ? `<div class="mini">${r.variante}</div>` : ''}` }, { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha.split('/').reverse().join('') },
        { k: 'prov', label: 'Proveedor' }, { k: 'ref', label: 'Referencia' },
        { k: 'cert', label: 'CCP', render: r => `<span class="code">${r.cert}</span>` },
        { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) },
        { k: 'entrega', label: 'Entrega', sv: r => r.entrega.split('/').reverse().join(''), render: r => r.entrega + (r.atraso ? `<div class="mini" style="color:var(--danger)">${r.atraso} días de atraso</div>` : '') },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.cls) }
      ],
        rowCls: r => r.nuevo ? 'row-new' : r.estado === 'Atrasada' ? 'row-bad' : r.anulado || r.estado === 'Anulada' ? 'row-void' : '',
        actions: [
          { icon: 'fa-inbox', title: 'Registrar recepción (NEA)', show: r => r.doc.startsWith('O/C') && ['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(r.estado), fn: o => this.recibir(o) },
          { icon: 'fa-clipboard-check', title: 'Conformidad del servicio', show: r => r.doc.startsWith('O/S') && ['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(r.estado), fn: o => this.conformidad(o) },
          { icon: 'fa-print', title: 'Imprimir orden', fn: o => U.rec(ordRec).imprimir(o) }
        ],
        tools: [{ icon: 'fa-file-circle-plus', label: 'Nueva orden', primary: true, fn: () => { this.tipo = 'oc'; SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen'); } }],
        bulk: [
          { icon: 'fa-print', label: 'Imprimir órdenes', fn: rs => U.preview('Órdenes · ' + rs.length, rs.map(o => U.doc(Object.assign({ office: ordRec.office }, ordRec.print(o)))).join('<div class="pg-break"></div>'), { file: 'ordenes_lote' }) },
          { icon: 'fa-envelope', label: 'Notificar a proveedores', fn: rs => U.mail({ to: 'proveedores@unas.edu.pe', asunto: 'Notificación de ' + rs.length + ' orden(es) · UNAS', adj: 'ordenes_notificadas.pdf', cuerpo: 'Se notifican las órdenes: ' + rs.map(o => o.doc).join(', ') + '.\nEl plazo de entrega se computa desde el día siguiente de la notificación.' }) }
        ],
        foot: rs => `<tr><td colspan="6" class="r"><b>Total vigente (${rs.filter(o => o.estado !== 'Anulada').length})</b></td><td class="r num"><b>${U.money(rs.filter(o => o.estado !== 'Anulada').reduce((s, o) => s + o.imp, 0))}</b></td><td colspan="3"></td></tr>`
      });
    },
    verOrden(o) { SIGA.ui.rec(ordRec).ver(o); },

    /* ------------------ Cuadro comparativo ------------------ */
    paintCot() {
      const U = SIGA.ui, C = A.cotizacion;
      const tots = C.provs.map(p => p.precios.reduce((s, x, i) => s + x * C.items[i][2], 0));
      const validos = C.provs.map((p, i) => ({ p, t: tots[i], i })).filter(x => x.p.cumple).sort((a, b) => a.t - b.t);
      const win = validos[0];
      document.getElementById('a-p-cot').innerHTML = `<div class="card"><h3><span class="dot"></span>Cuadro comparativo · ${C.req} <span class="grow">A-04 · A-05 · generado automáticamente de las cotizaciones</span></h3>
        <p class="mini mb">${C.objeto}. Se descarta automáticamente a quien no cumple los requerimientos técnicos mínimos (RTM) y se propone el menor precio válido.</p>
        <div class="tbl-wrap"><table><thead><tr><th>Ítem</th><th>Und</th><th class="r">Cant.</th>${C.provs.map(p => `<th class="r">${p.rs}<div class="mini" style="text-transform:none;font-weight:500">${p.cumple ? '✓ ' + p.obs : '✗ ' + p.obs}</div></th>`).join('')}</tr></thead>
        <tbody>${C.items.map((it, i) => { const min = Math.min(...C.provs.filter(p => p.cumple).map(p => p.precios[i])); return `<tr><td>${it[0]}</td><td>${it[1]}</td><td class="r num">${it[2]}</td>${C.provs.map(p => `<td class="r num" style="${!p.cumple ? 'color:#94a3b8;text-decoration:line-through' : p.precios[i] === min ? 'font-weight:800;color:var(--primary-dark)' : ''}">${fmt(p.precios[i])}</td>`).join('')}</tr>`; }).join('')}</tbody>
        <tfoot><tr><td colspan="3" style="font-weight:700">TOTAL · plazo de entrega</td>${C.provs.map((p, i) => `<td class="r num" style="font-weight:800;${win && win.i === i ? 'color:var(--primary-dark)' : !p.cumple ? 'color:#94a3b8' : ''}">${fmt(tots[i])}<div class="mini">${p.plazo} días</div></td>`).join('')}</tr></tfoot></table></div>
        <div class="row-flex mt" style="justify-content:space-between"><div class="note teal" style="margin:0;flex:1"><i class="fa-solid fa-trophy"></i><div>Propuesta: <b>${win.p.rs}</b> · ${U.money(win.t)} · valor estimado del requerimiento ${U.money(win.t)}. ${C.adjudicado ? `<b>Adjudicado a ${C.adjudicado}.</b>` : ''}</div></div>
          ${C.adjudicado ? '' : `<button class="btn" id="cot-adj"><i class="fa-solid fa-gavel"></i> Adjudicar y preparar O/C</button>`}</div></div>`;
      document.getElementById('cot-adj')?.addEventListener('click', () => {
        C.adjudicado = win.p.rs; const r = A.requerimientos.find(x => x.num === C.req); if (r) { r.monto = win.t; }
        SIGA.log('Abastecimiento', 'Adjudicación por cuadro comparativo', C.req, '—', win.p.rs + ' · ' + U.money(win.t));
        this.tipo = 'oc'; Object.assign(this.st.v.oc, { prov: win.p.rs, ruc: win.p.ruc, plazo: win.p.plazo, ref: C.objeto });
        this.st.items.oc = C.items.map((it, i) => ({ cod: '—', desc: it[0], um: it[1], cant: it[2], pu: Math.round(win.p.precios[i] / 1.18 * 100) / 100 }));
        U.toast(`Adjudicado a ${win.p.rs} · O/C precargada en el generador`); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen');
      });
    },

    /* ------------------ Caja chica ------------------ */
    paintCch() {
      const U = SIGA.ui, K = A.cajaChica, us = cchUsado(), p = us / K.fondo * 100;
      document.getElementById('a-p-cch').innerHTML = `<div class="split">
        <div class="card"><h3><span class="dot"></span>Comprobantes rendidos · agosto 2026 <span class="grow">A-12 · G.1 · tope por comprobante S/ ${fmt(A.topeCajaChica)}</span></h3><div id="cch-t"></div></div>
        <div><div class="saldo-box mb"><div class="lab">Saldo del fondo en tiempo real</div><div class="big">${U.money(K.fondo - us)}</div>
          <div class="row"><span>Fondo asignado</span><span>${U.money(K.fondo)}</span></div><div class="row"><span>Rendido</span><span>${U.money(us)}</span></div><div class="row"><span>Uso del fondo</span><span class="g">${p.toFixed(0)}%</span></div></div>
          <div class="card mb"><h3><span class="dot"></span>Orden de responsabilidad</h3>${K.niveles.map((n, i) => `<div class="ef-row"><span>${n}</span>${U.tag((i + 1) + '.º', 't-teal')}</div>`).join('')}<p class="mini mt">${K.resol}</p></div>
          <div class="card"><h3><span class="dot"></span>Reposiciones</h3>${K.reposiciones.map(r => `<div class="ef-row"><span>${r[0]} · ${r[1]}</span><b>${U.money(r[2])}</b></div>`).join('')}
            <button class="btn sm mt" id="cch-rep" ${p < 40 ? 'disabled' : ''}><i class="fa-solid fa-rotate"></i> Solicitar reposición</button></div></div></div>`;
      const ccRec = { mod: 'Tesorería', tipo: 'Comprobante de caja chica', key: r => r[2], title: r => r[1] + ' ' + r[2] + ' · ' + r[3], cls: false,
        fields: r => [['Fecha', r[0]], ['Tipo', r[1]], ['Serie-N°', `<span class="code">${r[2]}</span>`], ['Proveedor', r[3]], ['Concepto', r[4], 1], ['Importe', U.money(r[5] || r.imp0 || 0)], ['Estado', U.tag(r.estado || 'Rendido', r.anulado ? 't-gray' : 't-green')]],
        edit: [{ k: 'c', label: 'Concepto', get: r => r[4], set: (r, v) => r[4] = v }],
        anular: true, anularLabel: 'Anular comprobante', onAnular: r => { r.imp0 = r[5]; r[5] = 0; } };
      document.getElementById('cch-t').innerHTML = U.grid({ id: 'aba-cch', title: 'comprobantes de caja chica', export: 'caja_chica_agosto', rows: () => K.comprobantes.slice().reverse(), record: ccRec, pageSize: 10,
        cols: [{ k: 0, label: 'Fecha' }, { k: 1, label: 'Tipo' }, { k: 2, label: 'Serie-N°', render: r => `<span class="code">${r[2]}</span>` }, { k: 3, label: 'Proveedor' }, { k: 4, label: 'Concepto' }, { k: 5, label: 'Importe', r: true, render: r => r.anulado ? '<span class="mini">anulado</span>' : U.money(r[5], '') }],
        rowCls: r => r.anulado ? 'row-void' : '',
        tools: [{ icon: 'fa-plus', label: 'Rendir comprobantes', primary: true, fn: () => { this.tipo = 'cch'; SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen'); } }],
        foot: rs => `<tr><td colspan="5" class="r"><b>Total rendido</b></td><td class="r num"><b>${U.money(rs.reduce((s, r) => s + r[5], 0), '')}</b></td><td></td></tr>` });
      document.getElementById('cch-rep').addEventListener('click', () => U.confirm(`¿Solicitar la reposición de ${U.money(us)} con los ${K.comprobantes.length} comprobantes rendidos?`, () => {
        const id = 'R-2026-08'; K.reposiciones.unshift([id, SIGA.ctx.hoy, us, 'Aprobada']); K.comprobantes.length = 0;
        SIGA.log('Tesorería', 'Reposición de caja chica', id, 'Saldo ' + U.money(K.fondo - us), 'Saldo ' + U.money(K.fondo));
        U.toast('Reposición aprobada · fondo restituido a ' + U.money(K.fondo)); SIGA.refresh();
      }, 'Solicitar', ''));
    },

    /* ------------------ Encargos ------------------ */
    paintEnc() {
      const U = SIGA.ui;
      document.getElementById('a-p-enc').innerHTML = `<div class="card"><h3><span class="dot"></span>Encargos internos <span class="grow">A-11 · G.2 · resolución, plazo de rendición y alerta automática</span></h3><div id="enc-t"></div>
        <div class="note amber mt" style="margin-bottom:0"><i class="fa-solid fa-ban"></i><div>Un responsable con rendición vencida <b>no puede recibir nuevos encargos ni comisiones</b>: pruebe en el generador con <b>Ing. R. Salazar</b>.</div></div></div>`;
      const ECL = { Vencido: 't-red', 'Por rendir': 't-amber', Rendido: 't-green', Anulado: 't-gray' };
      const encRec = { mod: 'Tesorería', tipo: 'Encargo interno', office: 'Oficina de Tesorería', key: r => r.num, title: r => r.num + ' · ' + r.resp, cls: false,
        fields: r => [['N°', `<span class="code">${r.num}</span>`], ['Responsable', r.resp], ['Resolución', r.resol], ['Actividad', U.esc(r.act), 1], ['Monto otorgado', U.money(r.monto)], ['Rendido', U.money(r.rendido)], ['Saldo por rendir', `<b>${U.money(r.monto - r.rendido)}</b>`], ['Entrega · vence', r.entrega + ' · ' + r.vence], ['Estado', U.tag(r.estado, ECL[r.estado])]],
        body: r => `<div class="mt">${U.meter(r.rendido / r.monto * 100, 'var(--primary)', 10)}<div class="mini">Rendición ${Math.round(r.rendido / r.monto * 100)}%</div></div>`,
        extra: r => [
          ...(r.estado !== 'Rendido' && r.estado !== 'Anulado' ? [{ icon: 'fa-file-circle-check', label: 'Registrar rendición', fn: x => this.rendir(x) }] : []),
          ...(r.estado === 'Rendido' ? [{ icon: 'fa-certificate', label: 'Constancia de no adeudo', fn: x => U.preview('Constancia de no adeudo · ' + x.resp, U.doc({ tipo: 'Constancia de no adeudo', num: 'CNA-' + x.num.slice(-3), office: 'Oficina de Tesorería', pairs: [['Responsable', x.resp], ['Encargo', x.num], ['Monto', U.money(x.monto)], ['Rendido', U.money(x.rendido)]], body: '<p>Se deja constancia de que el responsable no mantiene saldos pendientes de rendición con la Universidad y se encuentra habilitado para recibir nuevos fondos.</p>' }), { file: 'no_adeudo_' + x.num }) }] : []),
          ...(r.estado === 'Vencido' ? [{ icon: 'fa-bell', label: 'Requerir rendición (notificación)', fn: x => U.mail({ to: 'responsable@unas.edu.pe', asunto: 'Requerimiento de rendición · ' + x.num, adj: 'requerimiento_rendicion_' + x.num + '.pdf', cuerpo: 'Se le requiere rendir cuenta del encargo ' + x.num + ' por ' + U.money(x.monto - x.rendido) + ', vencido el ' + x.vence + '. Mientras no rinda, no podrá recibir nuevos encargos ni comisiones.' }) }] : [])
        ],
        anular: true, anularLabel: 'Anular encargo (devolución)', canAnular: r => r.estado === 'Por rendir' && r.rendido === 0,
        print: r => ({ tipo: 'Recibo de encargo interno', num: r.num, pairs: [['Responsable', r.resp], ['Resolución', r.resol], ['Actividad', U.esc(r.act), 1], ['Monto', U.money(r.monto)], ['Plazo de rendición', r.vence]], body: `<p class="mini">${U.montoLetras(r.monto)}</p>`, firmas: FIRMAS.enc.map(f => [f[0], f[1]]) }) };
      document.getElementById('enc-t').innerHTML = U.grid({ id: 'aba-enc', title: 'encargos', export: 'encargos_internos', rows: A.encargos, record: encRec, filter: { label: 'Estado', get: r => r.estado },
        cols: [
        { k: 'num', label: 'N°', render: r => `<span class="code">${r.num}</span>` }, { k: 'resp', label: 'Responsable' }, { k: 'resol', label: 'Resolución' }, { k: 'act', label: 'Actividad' },
        { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto) }, { k: 'rendido', label: 'Rendido', r: true, render: r => U.money(r.rendido) },
        { k: 'vence', label: 'Vence', sv: r => r.vence.split('/').reverse().join(''), render: r => r.vence + (r.estado === 'Vencido' ? `<div class="mini" style="color:var(--danger)">hace ${r.dias} días</div>` : r.estado === 'Por rendir' ? `<div class="mini">en ${-r.dias} días</div>` : '') },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado === 'Vencido' ? '<i class="fa-solid fa-lock"></i> Vencido · bloqueado' : r.estado, ECL[r.estado]) }
      ],
        rowCls: r => r.estado === 'Vencido' ? 'row-bad' : r.nuevo ? 'row-new' : r.anulado ? 'row-void' : '',
        actions: [{ icon: 'fa-file-circle-check', title: 'Registrar rendición', show: r => r.estado !== 'Rendido' && r.estado !== 'Anulado', fn: r => this.rendir(r) }],
        tools: [{ icon: 'fa-plus', label: 'Nuevo encargo', primary: true, fn: () => { this.tipo = 'enc'; SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen'); } }] });
    },
    rendir(r) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-file-circle-check"></i> Rendición de cuentas · ' + r.num, [
        { k: 'imp', label: 'Importe sustentado con comprobantes S/', type: 'number', value: r.monto - r.rendido, span: 1 }, { k: 'dev', label: 'Devolución en efectivo S/', type: 'number', value: 0, span: 1 },
        { k: 'n', label: 'N.º de comprobantes adjuntos', type: 'number', value: 6, span: 1 }, { k: 'inf', label: 'Informe de actividades', value: 'Informe N.º 0' + (40 + A.encargos.indexOf(r)) + '-2026', span: 1 }
      ], v => {
        const imp = parseFloat(v.imp) || 0, dv = parseFloat(v.dev) || 0, falta = r.monto - r.rendido;
        if (imp < 0 || dv < 0 || imp + dv <= 0 || imp + dv > falta + 0.005) { U.toast('La suma sustentada + devolución debe estar entre 0 y ' + U.money(falta), 'err'); return; }
        const a = r.estado; r.rendido += imp + dv; if (r.rendido >= r.monto - 0.005) r.estado = 'Rendido';
        SIGA.asiento('Rendición de encargo ' + r.num, [['5302', imp, 0], ...(dv ? [['1101', dv, 0]] : []), ['1202', 0, imp + dv]], 'Tesorería');
        SIGA.log('Tesorería', 'Rendición de encargo', r.num, a + ' · ' + U.money(r.rendido - imp - dv), r.estado + ' · ' + U.money(r.rendido));
        U.closeModal(); U.toast(r.num + (r.estado === 'Rendido' ? ' rendido · ' + r.resp + ' habilitado' : ' · rendición parcial registrada')); SIGA.refresh();
      }, 'Registrar rendición');
    },

    /* ------------------ Viáticos ------------------ */
    paintVia() {
      const U = SIGA.ui;
      document.getElementById('a-p-via').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Comisiones de servicio <span class="grow">A-09 · A-10 · pasajes separados del viático</span></h3><div id="via-t"></div></div>
        <div class="card"><h3><span class="dot"></span>Escala vigente de viáticos <span class="grow">parametrizada · S/ por día</span></h3>${A.escala.map(e => `<div class="ef-row"><span>${e[0]}</span><b>S/ ${fmt(e[1])}</b></div>`).join('')}
          <div class="ef-row"><span>Movilidad local (tope diario)</span><b>S/ ${fmt(A.topeMovilidad)}</b></div>
          <div class="bigq mt">"Los viáticos se calculan aparte: tarifa diaria por días de comisión, según el cargo."<em>— Abastecimiento, levantamiento de campo</em></div></div></div>`;
      const VCL = { 'Por rendir': 't-amber', 'Rendición vencida': 't-red', Rendido: 't-green', Anulado: 't-gray' };
      const viaRec = { mod: 'Abastecimiento', tipo: 'Planilla de viáticos', office: 'Oficina de Abastecimiento', key: r => r.num, title: r => r.num + ' · ' + r.com, cls: false,
        fields: r => [['N°', `<span class="code">${r.num}</span>`], ['Comisionado', r.com], ['Cargo', r.cargo, 1], ['Destino', r.dest], ['Días', r.dias], ['Viático', U.money(r.viat)], ['Pasajes', U.money(r.pasaje)], ['Total', `<b>${U.money(r.viat + r.pasaje)}</b>`], ['Rendición', U.tag(r.estado, VCL[r.estado]) + ' · vence ' + r.vence]],
        extra: r => [
          ...(r.estado === 'Por rendir' || r.estado === 'Rendición vencida' ? [{ icon: 'fa-file-circle-check', label: 'Registrar rendición e informe de comisión', fn: x => { const a = x.estado; x.estado = 'Rendido'; SIGA.asiento('Rendición de viáticos ' + x.num, [['5302', x.viat, 0], ['1202', 0, x.viat]], 'Tesorería'); SIGA.log('Abastecimiento', 'Rendición de viáticos', x.num, a, 'Rendido'); U.closeModal(); U.toast(x.num + ' rendido · ' + x.com + ' habilitado para nuevas comisiones'); SIGA.refresh(); } }] : []),
          { icon: 'fa-ticket', label: 'Bolsa de viaje (pasajes)', menuOnly: true, fn: x => { this.tipo = 'bol'; this.st.v.bol.comision = x.num + ' · ' + x.com + ' · ' + x.dest; U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen'); } }
        ],
        anular: true, anularLabel: 'Anular comisión', canAnular: r => r.estado === 'Por rendir',
        onAnular: r => SIGA.siaf('Anulación · viáticos', r.num, -r.viat),
        print: r => ({ tipo: 'Planilla de viáticos', num: r.num, pairs: [['Comisionado', r.com], ['Cargo', r.cargo], ['Destino', r.dest], ['Días', r.dias]], body: dtbl([['Concepto'], ['Importe', 1]], [['Viáticos (' + r.dias + ' días × ' + U.money(escalaDe(r.cargo), '') + ')', U.money(r.viat, '')], ['Pasajes', U.money(r.pasaje, '')], ['<b>Total</b>', '<b>' + U.money(r.viat + r.pasaje, '') + '</b>']]), firmas: FIRMAS.via.map(f => [f[0], f[1]]) }) };
      document.getElementById('via-t').innerHTML = U.grid({ id: 'aba-via', title: 'comisiones', export: 'comisiones_servicio', rows: A.comisiones, record: viaRec, filter: { label: 'Rendición', get: r => r.estado },
        cols: [
        { k: 'num', label: 'N°', render: r => `<span class="code">${r.num}</span>` }, { k: 'com', label: 'Comisionado', render: r => r.com + `<div class="mini">${r.cargo}</div>` }, { k: 'dest', label: 'Destino' },
        { k: 'dias', label: 'Días', r: true }, { k: 'viat', label: 'Viático', r: true, render: r => U.money(r.viat, '') }, { k: 'pasaje', label: 'Pasajes', r: true, render: r => U.money(r.pasaje, '') },
        { k: 'estado', label: 'Rendición', render: r => U.tag(r.estado, VCL[r.estado]) + `<div class="mini">vence ${r.vence}</div>` }
      ], rowCls: r => r.estado === 'Rendición vencida' ? 'row-bad' : r.nuevo ? 'row-new' : r.anulado ? 'row-void' : '',
        tools: [{ icon: 'fa-plus', label: 'Nueva comisión', primary: true, fn: () => { this.tipo = 'via'; SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen'); } }],
        foot: rs => `<tr><td colspan="4" class="r"><b>Total</b></td><td class="r num"><b>${U.money(rs.filter(r => !r.anulado).reduce((s, r) => s + r.viat, 0), '')}</b></td><td class="r num"><b>${U.money(rs.filter(r => !r.anulado).reduce((s, r) => s + r.pasaje, 0), '')}</b></td><td colspan="2"></td></tr>` });
    },

    /* ------------------ Subvenciones ------------------ */
    paintSub() {
      const U = SIGA.ui, S = A.subvenciones;
      document.getElementById('a-p-sub').innerHTML = `<div class="split eq"><div class="card"><h3><span class="dot"></span>Prácticas preprofesionales <span class="grow">A-13 · S/ ${fmt(A.montoPracticas)} fijos por semestre</span></h3><div id="sub-p"></div></div>
        <div class="card"><h3><span class="dot"></span>Ayudantías de cátedra <span class="grow">A-14 · generadas desde la resolución decanal</span></h3><div id="sub-a"></div></div></div>`;
      const ppRec = { mod: 'Abastecimiento', tipo: 'Planilla de subvención de prácticas', key: r => r[2], title: r => 'Prácticas · ' + r[0] + ' · ' + r[3], estado: 4, cls: false,
        fields: r => [['Facultad', r[0]], ['Estudiantes', r[1]], ['Monto', U.money(r[1] * A.montoPracticas)], ['Resolución', r[2]], ['Periodo', r[3]], ['Estado', U.tag(r[4], r[4] === 'Pagado' ? 't-green' : 't-amber')]],
        extra: r => r[4] === 'Por pagar' ? [{ icon: 'fa-money-bill-transfer', label: 'Pagar subvención (abono en cuenta)', fn: x => { x[4] = 'Pagado'; SIGA.siaf('Girado · subvenciones', 'PPP ' + x[0], x[1] * A.montoPracticas); SIGA.log('Abastecimiento', 'Pago de subvención de prácticas', x[2], 'Por pagar', 'Pagado · ' + U.money(x[1] * A.montoPracticas)); U.closeModal(); U.toast('Subvención pagada a ' + x[1] + ' estudiantes de ' + x[0]); SIGA.refresh(); } }] : [],
        anular: true, anularLabel: 'Anular planilla', canAnular: r => r[4] === 'Por pagar',
        print: r => ({ tipo: 'Planilla de subvención', num: 'PPP-' + r[3], body: `<p>${r[1]} estudiantes × ${U.money(A.montoPracticas)} = <b>${U.money(r[1] * A.montoPracticas)}</b></p>`, firmas: FIRMAS.ppp.map(f => [f[0], f[1]]) }) };
      const ayRec = { mod: 'Abastecimiento', tipo: 'Designación de ayudantía de cátedra', key: r => r[0], title: r => r[1] + ' · ' + r[3], estado: 6, cls: false, anuladoValor: 'Sin efecto',
        fields: r => [['Código', r[0]], ['Ayudante', r[1]], ['Condición', r[2]], ['Curso', r[3]], ['Facultad', r[4]], ['Resolución', r[5]], ['Estado', U.tag(r[6], r[6] === 'Vigente' ? 't-green' : 't-gray')], ['Monto mensual', U.money(A.montoAyudantia)]],
        edit: [{ k: 'c', label: 'Curso', get: r => r[3], set: (r, v) => r[3] = v }],
        anular: true, anularLabel: 'Dejar sin efecto', canAnular: r => r[6] === 'Vigente' };
      document.getElementById('sub-p').innerHTML = U.grid({ id: 'aba-ppp', title: 'prácticas', rows: S.practicas, record: ppRec, search: false, cols: [{ k: 0, label: 'Facultad' }, { k: 1, label: 'Estudiantes', r: true }, { k: 't', label: 'Monto', r: true, sv: r => r[1], render: r => U.money(r[1] * A.montoPracticas, '') }, { k: 2, label: 'Resolución', cls: 'mini' }, { k: 3, label: 'Periodo' }, { k: 4, label: 'Estado', render: r => U.tag(r[4], r[4] === 'Pagado' ? 't-green' : r[4] === 'Anulado' ? 't-gray' : 't-amber') }],
        actions: [{ icon: 'fa-money-bill-transfer', title: 'Pagar', show: r => r[4] === 'Por pagar', fn: r => U.rec(ppRec).items(r).find(i => i.label.startsWith('Pagar')).fn() }] });
      document.getElementById('sub-a').innerHTML = U.grid({ id: 'aba-ayu', title: 'ayudantías', rows: S.ayudantias, record: ayRec, search: false, cols: [{ k: 1, label: 'Ayudante', render: r => r[1] + `<div class="mini">${r[0]} · ${r[2]}</div>` }, { k: 3, label: 'Curso' }, { k: 4, label: 'Facultad' }, { k: 5, label: 'Resolución', cls: 'mini' }, { k: 6, label: 'Estado', render: r => U.tag(r[6], r[6] === 'Vigente' ? 't-green' : 't-gray') }] });
    },

    /* ------------------ Contratos y penalidades ------------------ */
    paintCon() {
      const U = SIGA.ui, at = A.ordenes.find(o => o.estado === 'Atrasada');
      document.getElementById('a-p-con').innerHTML = `<div class="card mb"><h3><span class="dot"></span>Contratos vigentes <span class="grow">A-15 · adendas, garantías y plazos</span></h3><div id="con-t"></div></div>
        <div class="split eq"><div class="card"><h3><span class="dot"></span>Calculadora de penalidad por mora <span class="grow">A-16 · Reglamento de la Ley N.º 30225</span></h3>
          <div class="fgrid"><div class="fld"><label>Monto vigente S/</label><input id="pn-m" type="number" value="${at ? at.imp : 8940}"></div><div class="fld"><label>Plazo vigente (días)</label><input id="pn-p" type="number" value="${at ? at.plazo : 7}"></div>
          <div class="fld"><label>Días de atraso</label><input id="pn-a" type="number" value="${at ? at.atraso : 10}"></div><div class="fld"><label>Factor F</label><input id="pn-f" readonly></div></div>
          <div id="pn-out" class="mt"></div>
          <p class="mini mt">Penalidad diaria = 0.10 × monto ÷ (F × plazo) · F = 0.40 si el plazo ≤ 60 días, 0.25 si es mayor · tope: 10% del monto.</p></div>
          <div class="card"><h3><span class="dot"></span>Órdenes con atraso</h3>${A.ordenes.filter(o => o.atraso).map(o => { const p = penal(o); return `<div class="mini-card mb"><div class="row-flex" style="justify-content:space-between"><b>${o.doc}</b>${U.tag(o.atraso + ' días', 't-red')}</div><div class="s">${o.prov} · ${o.ref}</div><div class="ef-row"><span>Penalidad diaria</span><b>${U.money(p.diaria)}</b></div><div class="ef-row"><span>Penalidad aplicable</span><b class="neg">${U.money(p.total)}</b></div>${p.total >= p.tope - 0.01 ? `<div class="note warn" style="margin:8px 0 0"><i class="fa-solid fa-triangle-exclamation"></i><div>Tope del 10% alcanzado · causal de resolución del contrato.</div></div>` : ''}</div>`; }).join('') || '<div class="mini">Sin atrasos</div>'}</div></div>`;
      const conRec = { mod: 'Abastecimiento', tipo: 'Contrato', office: 'Oficina de Abastecimiento · Contrataciones', key: r => r.num, title: r => r.num + ' · ' + r.obj, cls: false,
        fields: r => [['Contrato', `<span class="code">${r.num}</span>`], ['Contratista', r.con], ['Objeto', U.esc(r.obj), 1], ['Monto vigente', U.money(r.monto)], ['Inicio · plazo', r.inicio + ' · ' + r.plazo + ' días'], ['Garantía', r.garantia, 1], ['Adendas', r.adendas], ['Avance', r.avance + '%'], ['Estado', r.estado || 'En ejecución'], ...(r.alerta ? [['Alerta', U.tag(r.alerta, 't-amber')]] : [])],
        body: r => `<div class="mt">${U.meter(r.avance, 'var(--secondary)', 10)}<div class="mini">Avance físico ${r.avance}%</div></div>`,
        edit: [{ k: 'avance', label: 'Avance físico %', type: 'number', span: 1 }, { k: 'garantia', label: 'Garantía (renovación)' }],
        onEdit: r => { if (/vence/.test(r.garantia) && r.alerta && /garant/i.test(r.alerta)) delete r.alerta; },
        extra: r => [{ icon: 'fa-file-signature', label: 'Registrar adenda', fn: x => this.adenda(x) }],
        anular: true, anularLabel: 'Resolver contrato', anuladoValor: 'Resuelto', canAnular: r => (r.estado || 'En ejecución') === 'En ejecución',
        print: r => ({ tipo: 'Resumen de contrato', num: r.num, pairs: [['Contratista', r.con, 1], ['Objeto', U.esc(r.obj), 1], ['Monto', U.money(r.monto)], ['Plazo', r.plazo + ' días desde ' + r.inicio], ['Garantía', r.garantia, 1], ['Adendas', r.adendas], ['Avance', r.avance + '%']] }) };
      document.getElementById('con-t').innerHTML = U.grid({ id: 'aba-con', title: 'contratos', export: 'contratos_vigentes', rows: A.contratos, record: conRec,
        cols: [
        { k: 'num', label: 'Contrato', render: r => `<span class="code">${r.num}</span>` }, { k: 'obj', label: 'Objeto', render: r => r.obj + `<div class="mini">${r.con}</div>` },
        { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto) }, { k: 'inicio', label: 'Inicio · plazo', render: r => r.inicio + `<div class="mini">${r.plazo} días</div>` },
        { k: 'garantia', label: 'Garantía', render: r => `<span class="mini">${r.garantia}</span>` + (r.alerta ? `<div>${U.tag(r.alerta, 't-amber')}</div>` : '') },
        { k: 'adendas', label: 'Adendas', r: true }, { k: 'avance', label: 'Avance', render: r => `<div class="mcell">${U.meter(r.avance, 'var(--secondary)')}<span>${r.avance}%</span></div>` }
      ], rowCls: r => r.anulado ? 'row-void' : '' });
      const calc = () => {
        const m = num(document.getElementById('pn-m').value), p = Math.max(1, num(document.getElementById('pn-p').value)), a = num(document.getElementById('pn-a').value);
        const F = p <= 60 ? 0.40 : 0.25, d = 0.10 * m / (F * p), t = Math.min(d * a, 0.10 * m);
        document.getElementById('pn-f').value = F.toFixed(2);
        document.getElementById('pn-out').innerHTML = `<div class="grid cols-3" style="gap:8px"><div class="mini-card"><div class="lab">Diaria</div><div class="v">${U.money(d)}</div></div><div class="mini-card"><div class="lab">Aplicable</div><div class="v neg">${U.money(t)}</div></div><div class="mini-card"><div class="lab">Tope 10%</div><div class="v">${U.money(0.1 * m)}</div><div class="s">${t >= 0.1 * m - 0.01 ? 'alcanzado' : 'no alcanzado'}</div></div></div>`;
      };
      ['pn-m', 'pn-p', 'pn-a'].forEach(id => document.getElementById(id).addEventListener('input', calc)); calc();
    },

    adenda(c) {
      const U = SIGA.ui;
      U.formModal('<i class="fa-solid fa-file-signature"></i> Adenda al contrato ' + c.num, [
        { k: 'tipo', label: 'Tipo de modificación', type: 'select', options: ['Prestación adicional', 'Reducción de prestaciones', 'Ampliación de plazo'], span: 1 }, { k: 'm', label: 'Monto S/ (adicional o reducción)', type: 'number', value: 0, span: 1 },
        { k: 'd', label: 'Días adicionales', type: 'number', value: 0, span: 1 }, { k: 'r', label: 'Resolución', value: 'R.D. N.º ' + (150 + c.adendas) + '-2026-DGA', span: 1 }
      ], v => {
        const m = parseFloat(v.m) || 0, d = parseInt(v.d, 10) || 0, base = c.monto0 || c.monto;
        if (!m && !d) { U.toast('Indique monto o días', 'err'); return; }
        if (v.tipo === 'Prestación adicional' && m > base * 0.25) { U.toast('La prestación adicional excede el 25% del monto original (' + U.money(base * 0.25) + ')', 'err'); return; }
        c.monto0 = base; const antes = c.monto; c.monto += v.tipo === 'Reducción de prestaciones' ? -Math.abs(m) : v.tipo === 'Prestación adicional' ? m : 0; c.plazo += d; c.adendas++;
        SIGA.log('Abastecimiento', 'Adenda de contrato', c.num, U.money(antes), U.money(c.monto) + ' · +' + d + ' días · ' + v.r);
        U.closeModal(); U.toast('Adenda N.º ' + c.adendas + ' al ' + c.num + ' registrada'); SIGA.refresh();
      }, 'Registrar adenda');
    },

    /* ------------------ Proveedores ------------------ */
    paintProv() {
      const U = SIGA.ui;
      const cal = p => { const s = p.tiempo * 0.5 + p.calidad * 10 - p.pen * 5; return s >= 85 ? ['A', 't-green'] : s >= 70 ? ['B', 't-amber'] : ['C', 't-red']; };
      document.getElementById('a-p-prov').innerHTML = `<div class="card"><h3><span class="dot"></span>Evaluación de proveedores <span class="grow">A-19 · cumplimiento de plazos, calidad y penalidades · ${U.int(56755)} en el maestro</span></h3><div id="prov-t"></div>
        <div class="row-flex mt"><button class="btn sm sec" id="prov-portal"><i class="fa-solid fa-globe"></i> Vista del portal de proveedores</button><span class="mini">A-18 · el proveedor consulta el estado de sus órdenes y pagos sin llamar ni acudir a la oficina</span></div></div>`;
      const portal = p => { const os = A.ordenes.filter(o => o.prov === p.rs);
        U.modal('<i class="fa-solid fa-globe"></i> Portal de proveedores · vista del proveedor', `<div class="note info"><i class="fa-solid fa-user-tie"></i><div>Sesión de <b>${p.rs}</b> (RUC ${p.ruc}) · acceso con clave SOL</div></div>` +
          U.table([{ k: 'doc', label: 'Orden', render: r => `<span class="code">${r.doc}</span>` }, { k: 'ref', label: 'Objeto' }, { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) }, { k: 'estado', label: 'Estado de la orden', render: r => U.tag(r.estado, r.cls) }, { k: 'pago', label: 'Estado del pago', render: r => { const c = SIGA.data.tesoreria.cp.find(x => x.benef === p.rs && x.estado === 'Pagado'); return r.estado === 'Atendida' ? U.tag(c ? 'Pagado · ' + c.doc : 'Por pagar', c ? 't-green' : 't-amber') : U.tag('Por devengar', 't-gray'); } }], os, { empty: 'Sin órdenes en la muestra' }),
          `<button class="btn ghost" data-close>Cerrar</button>`, 'wide'); };
      const provRec = SIGA.recs.proveedor = { mod: 'Abastecimiento', tipo: 'Ficha de proveedor', office: 'Oficina de Abastecimiento', key: r => r.ruc, title: r => r.rs, cls: false, anuladoValor: 'Suspendido',
        fields: r => [['RUC', `<span class="code">${r.ruc}</span>`], ['Razón social', r.rs, 1], ['Órdenes 2026', r.ord], ['Entregas a tiempo', r.tiempo + '%'], ['Calidad', r.calidad + ' / 5'], ['Penalidades', r.pen], ['Calificación', U.tag(cal(r)[0], cal(r)[1])], ['RNP', 'Vigente · bienes y servicios'], ['Estado', U.tag(r.estado || 'Habilitado', r.estado === 'Suspendido' ? 't-red' : 't-green')]],
        body: r => { const os = A.ordenes.filter(o => o.prov === r.rs); return `<div class="lbl-s mt mb">Órdenes del proveedor (${os.length})</div>` + U.table([{ k: 'doc', label: 'Orden', render: o => `<span class="code">${o.doc}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'imp', label: 'Importe', r: true, render: o => U.money(o.imp) }, { k: 'estado', label: 'Estado', render: o => U.tag(o.estado, o.cls) }], os.slice(0, 8), { empty: 'Sin órdenes' }); },
        edit: [{ k: 'tiempo', label: 'Entregas a tiempo %', type: 'number', span: 1 }, { k: 'calidad', label: 'Calidad (1–5)', type: 'number', span: 1 }, { k: 'pen', label: 'Penalidades', type: 'number', span: 1 }],
        extra: r => [{ icon: 'fa-globe', label: 'Vista del portal del proveedor', fn: portal }, { icon: 'fa-file-contract', label: 'Constancia de prestación', menuOnly: true, fn: x => U.rec(provRec).imprimir(x) }],
        anular: true, anularLabel: 'Suspender proveedor', canAnular: r => r.estado !== 'Suspendido',
        print: r => ({ tipo: 'Constancia de prestación', num: r.ruc, body: `<p>Se deja constancia de que <b>${r.rs}</b> atendió ${r.ord} órdenes durante el ejercicio 2026 con ${r.tiempo}% de entregas a tiempo y calificación ${cal(r)[0]}.</p>` }) };
      document.getElementById('prov-t').innerHTML = U.grid({ id: 'aba-prov', title: 'proveedores', export: 'proveedores_evaluacion', rows: A.proveedores, record: provRec,
        filter: { label: 'Calificación', get: r => cal(r)[0] },
        cols: [
        { k: 'ruc', label: 'RUC', render: r => `<span class="code">${r.ruc}</span>` }, { k: 'rs', label: 'Razón social', render: r => r.rs + (r.estado === 'Suspendido' ? ' ' + U.tag('suspendido', 't-red') : '') }, { k: 'ord', label: 'Órdenes 2026', r: true },
        { k: 'tiempo', label: 'Entregas a tiempo', render: r => `<div class="mcell">${U.meter(r.tiempo)}<span>${r.tiempo}%</span></div>` },
        { k: 'calidad', label: 'Calidad', render: r => `<span class="stars">${'★'.repeat(Math.round(r.calidad))}${'☆'.repeat(5 - Math.round(r.calidad))}</span> <span class="mini">${r.calidad}</span>` },
        { k: 'pen', label: 'Penalidades', r: true }, { k: 'c', label: 'Calificación', sv: r => cal(r)[0], render: r => U.tag(cal(r)[0], cal(r)[1]) }
      ], actions: [{ icon: 'fa-globe', title: 'Portal del proveedor', fn: portal }] });
      document.getElementById('prov-portal').addEventListener('click', () => portal(A.proveedores[0]));
    },
    paintPac() {
      const U = SIGA.ui;
      const ETAPAS = ['Programado', 'Actos preparatorios', 'Convocado', 'Registro de participantes', 'Consultas y observaciones', 'Integración de bases', 'Presentación de ofertas', 'Evaluación de ofertas', 'Buena pro', 'Adjudicado', 'Contrato suscrito'];
      const ECL = e => e === 'Adjudicado' || e === 'Contrato suscrito' ? 't-green' : e === 'Excluido' ? 't-gray' : e === 'Programado' || e === 'Actos preparatorios' ? 't-gray' : e === 'Convocado' ? 't-amber' : 't-blue';
      const comite = r => [['Presidente', 'Ing. ' + ['A. Torres', 'M. Tello', 'R. Salazar'][r[0].charCodeAt(r[0].length - 1) % 3] + ' · Abastecimiento'], ['Miembro técnico', 'Representante de ' + r[7]], ['Miembro', 'Especialista en contrataciones (OEC)']];
      const pacRec = { mod: 'Abastecimiento', tipo: 'Procedimiento de selección', office: 'Órgano Encargado de las Contrataciones', key: r => r[0], title: r => r[0] + ' · ' + r[1], estado: 5, cls: 6, anuladoValor: 'Excluido',
        fields: r => [['N.º de procedimiento', `<span class="code">${r[0]}</span>`], ['Tipo', r[2]], ['Objeto', U.esc(r[1]), 1], ['Área usuaria', r[7]], ['Valor estimado', U.money(r[3])], ['Trimestre de convocatoria', r[4]], ['Etapa', U.tag(r[5], ECL(r[5]))], ['Publicación', 'SEACE v3 · ' + (ETAPAS.indexOf(r[5]) >= 2 ? 'convocado' : 'por convocar')]],
        body: r => { const i = ETAPAS.indexOf(r[5]); return `<div class="split eq mt"><div><div class="lbl-s mb">Comité de selección</div>${U.kv(comite(r))}</div><div><div class="lbl-s mb">Cronograma del procedimiento</div>${U.timeline(ETAPAS.slice(1).map((e, k) => ({ t: e, st: r[5] === 'Excluido' ? '' : k + 1 < i ? 'done' : k + 1 === i ? (e === 'Contrato suscrito' ? 'done' : 'cur') : '', when: k + 1 <= i ? 'etapa ' + (k + 1) : '' })))}</div></div>`; },
        edit: [{ k: 'v', label: 'Valor estimado S/', type: 'number', span: 1, get: r => r[3], set: (r, v) => r[3] = v }, { k: 't', label: 'Trimestre', type: 'select', options: ['I', 'II', 'III', 'IV'], span: 1, get: r => r[4], set: (r, v) => r[4] = v }],
        canEdit: r => ETAPAS.indexOf(r[5]) <= 2,
        extra: r => { const i = ETAPAS.indexOf(r[5]); return i >= 0 && i < ETAPAS.length - 1 ? [{ icon: 'fa-forward-step', label: 'Pasar a: ' + ETAPAS[i + 1], fn: x => { const a = x[5]; x[5] = ETAPAS[i + 1]; x[6] = ECL(x[5]); SIGA.log('Abastecimiento', 'Avance de procedimiento de selección', x[0], a, x[5]); if (x[5] === 'Buena pro') U.toast('Buena pro otorgada · se publica en el SEACE'); U.closeModal(); U.toast(x[0] + ' → ' + x[5]); SIGA.refresh(); } }] : []; },
        anular: true, anularLabel: 'Excluir del PAC', canAnular: r => ETAPAS.indexOf(r[5]) <= 2 && ETAPAS.indexOf(r[5]) >= 0,
        print: r => ({ tipo: 'Ficha del procedimiento de selección', num: r[0], body: dtbl([['Etapa'], ['Estado']], ETAPAS.map((e, k) => [e, k < ETAPAS.indexOf(r[5]) ? 'Cumplida' : k === ETAPAS.indexOf(r[5]) ? 'En curso' : 'Pendiente'])) + dtbl([['Comité de selección'], ['Integrante']], comite(r)) }) };
      document.getElementById('a-tpac').innerHTML = U.grid({ id: 'aba-pac', title: 'PAC 2026', export: 'PAC_2026', rows: A.pac, record: pacRec,
        filter: { label: 'Procedimiento', get: r => r[2] },
        cols: [
        { k: 0, label: 'N° Proc.', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Objeto', render: r => r[1] + `<div class="mini">${r[7]}</div>` },
        { k: 2, label: 'Procedimiento' }, { k: 3, label: 'Valor estimado', r: true, render: r => U.money(r[3]) }, { k: 4, label: 'Trim.' },
        { k: 'av', label: 'Avance', sv: r => ETAPAS.indexOf(r[5]), render: r => { const i = Math.max(0, ETAPAS.indexOf(r[5])); return `<div class="mcell">${U.meter(i / (ETAPAS.length - 1) * 100, 'var(--secondary)')}<span>${i}/${ETAPAS.length - 1}</span></div>`; } },
        { k: 5, label: 'Etapa', render: r => U.tag(r[5], r[6]) }
      ], rowCls: r => r[5] === 'Excluido' ? 'row-void' : r.nuevo ? 'row-new' : '',
        tools: [{ icon: 'fa-plus', label: 'Incluir procedimiento', primary: true, fn: () => U.formModal('<i class="fa-solid fa-plus"></i> Inclusión en el PAC 2026', [{ k: 'o', label: 'Objeto de la contratación' }, { k: 't', label: 'Tipo de procedimiento', type: 'select', options: ['Adjudicación Simplificada', 'Licitación Pública', 'Concurso Público', 'Subasta Inversa Electrónica', 'Comparación de Precios'], span: 1 }, { k: 'v', label: 'Valor estimado S/', type: 'number', value: 50000, span: 1 }, { k: 'q', label: 'Trimestre', type: 'select', options: ['III', 'IV'], span: 1 }, { k: 'a', label: 'Área usuaria', type: 'select', options: SIGA.data.presupuesto.dependencias, span: 1 }], v => { if (!v.o.trim()) { U.toast('Indique el objeto', 'err'); return; } const n = 'PROC-2026-' + U.pad(Math.max(...A.pac.map(x => +x[0].slice(-2))) + 1, 2); const row = [n, v.o.trim(), v.t, parseFloat(v.v) || 0, v.q, 'Programado', 't-gray', v.a]; row.nuevo = true; A.pac.push(row); SIGA.log('Abastecimiento', 'Inclusión en el PAC', n, '—', v.t + ' · ' + U.money(row[3])); U.closeModal(); U.toast(n + ' incluido en el PAC · requiere aprobación del Titular'); SIGA.refresh(); }, 'Incluir') }],
        foot: rs => `<tr><td colspan="4" class="r" style="font-weight:700">Total programado</td><td class="r num" style="font-weight:800">${U.money(rs.filter(r => r[5] !== 'Excluido').reduce((s, r) => s + r[3], 0))}</td><td colspan="4"></td></tr>` });
    }
  });
})();
