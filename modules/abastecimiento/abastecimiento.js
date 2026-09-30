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
      $('g-print').addEventListener('click', () => { SIGA.log('Abastecimiento', 'Exportación PDF', tp().docTp + ' ' + tp().num); window.print(); });
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
      document.getElementById('a-treq').innerHTML = U.table([
        { k: 'num', label: 'N°', render: r => `<span class="code">${r.num}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
        { k: 'cc', label: 'Centro de costo' }, { k: 'desc', label: 'Requerimiento', render: r => r.desc + (r.obs ? `<div class="mini" style="color:#b45309">Obs.: ${r.obs}</div>` : '') },
        { k: 'monto', label: 'Estimado', r: true, render: r => U.money(r.monto) },
        { k: 'saldo', label: 'Saldo', render: r => r.saldo ? U.tag('✓ verificado', 't-green') : U.tag('sin saldo', 't-red') },
        { k: 'nivel', label: 'Aprueba', render: r => `<span class="mini">${r.monto > 30000 ? 'DGA' : 'Jefe de Abastecimiento'}</span>` },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, { 'En evaluación': 't-amber', Aprobado: 't-green', Observado: 't-red', Atendido: 't-blue' }[r.estado]) }
      ], A.requerimientos, {
        rowCls: r => r.nuevo ? 'row-new' : '',
        actions: [
          { icon: 'fa-stamp', title: 'Aprobar', show: r => r.estado === 'En evaluación', fn: r => this.aprobarReq(r) },
          { icon: 'fa-comment-dots', title: 'Observar', cls: 'del', show: r => r.estado === 'En evaluación', fn: r => { if (!SIGA.sod(r.user, r.monto > 30000 ? 'req.aprobar.alto' : 'req.aprobar')) return; r.estado = 'Observado'; r.obs = 'Devuelto para completar especificaciones técnicas'; SIGA.log('Abastecimiento', 'Observación de requerimiento', r.num, 'En evaluación', 'Observado'); U.toast(r.num + ' observado · el área usuaria recibe la notificación', 'info'); SIGA.refresh(); } }
        ]
      });
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
          { k: 'num', label: 'N°', value: 'REQ 2026-' + (939 + A.requerimientos.filter(x => x.nuevo).length), ro: true, span: 1 },
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
      document.getElementById('a-tord').innerHTML = U.table([
        { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>${r.variante ? `<div class="mini">${r.variante}</div>` : ''}` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
        { k: 'prov', label: 'Proveedor' }, { k: 'ref', label: 'Referencia' },
        { k: 'cert', label: 'CCP', render: r => `<span class="code">${r.cert}</span>` },
        { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) },
        { k: 'entrega', label: 'Entrega', render: r => r.entrega + (r.atraso ? `<div class="mini" style="color:var(--danger)">${r.atraso} días de atraso</div>` : '') },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.cls) }
      ], A.ordenes, {
        onRow: o => this.verOrden(o), rowCls: r => r.nuevo ? 'row-new' : r.estado === 'Atrasada' ? 'row-bad' : '',
        actions: [
          { icon: 'fa-inbox', title: 'Registrar recepción (NEA)', show: r => r.doc.startsWith('O/C') && ['Emitida', 'Pendiente de entrega', 'Atrasada'].includes(r.estado), fn: o => { this.tipo = 'nea'; this.st.v.nea.oc = o.doc + ' · ' + o.ref; this.st.v.nea.prov = o.prov; if (o.items) this.st.items.nea = JSON.parse(JSON.stringify(o.items)); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'a', 'gen'); } },
          { icon: 'fa-eye', title: 'Ver', fn: o => this.verOrden(o) },
          { icon: 'fa-ban', title: 'Anular', cls: 'del', show: r => r.estado === 'Emitida', fn: o => SIGA.ui.confirm(`¿Anular <b>${o.doc}</b>? El compromiso se revierte y el saldo vuelve a la certificación.`, () => { const c = SIGA.ppto.cert(o.cert); if (c) c.comp = Math.max(0, (c.comp || 0) - o.imp); o.estado = 'Anulada'; o.cls = 't-red'; SIGA.siaf('Anulación de compromiso', o.doc, -o.imp); SIGA.log('Abastecimiento', 'Anulación (operación inversa)', o.doc, 'Emitida', 'Anulada'); SIGA.ui.toast(o.doc + ' anulada · saldo restituido a la CCP', 'err'); SIGA.refresh(); }, 'Anular') }
        ]
      });
    },
    verOrden(o) {
      const U = SIGA.ui, p = penal(o);
      U.detail('Detalle · ' + o.doc, [
        ['Documento', o.doc + (o.variante ? ' · ' + o.variante : '')], ['Fecha', o.fecha], ['Proveedor', o.prov], ['Referencia', o.ref],
        ['Certificación', 'CCP ' + o.cert], ['Partida', `<span class="code">${o.part}</span>`], ['Importe', U.money(o.imp)],
        ['Plazo · entrega', o.plazo + ' días · ' + o.entrega], ['Estado', U.tag(o.estado, o.cls)],
        ['Penalidad por atraso', o.atraso ? `<b class="saldo-neg">${U.money(p.total)}</b>${p.total >= p.tope - 0.01 ? ' · tope 10% alcanzado' : ''}` : '—']
      ], `<button class="btn ghost" data-close>Cerrar</button><button class="btn sec" onclick="SIGA.ui.toast('Imprimiendo ${o.doc}…')"><i class="fa-solid fa-print"></i> Imprimir</button>`);
    },

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
      document.getElementById('cch-t').innerHTML = U.table([{ k: 0, label: 'Fecha' }, { k: 1, label: 'Tipo' }, { k: 2, label: 'Serie-N°', render: r => `<span class="code">${r[2]}</span>` }, { k: 3, label: 'Proveedor' }, { k: 4, label: 'Concepto' }, { k: 5, label: 'Importe', r: true, render: r => U.money(r[5], '') }], K.comprobantes.slice().reverse());
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
      document.getElementById('enc-t').innerHTML = U.table([
        { k: 'num', label: 'N°', render: r => `<span class="code">${r.num}</span>` }, { k: 'resp', label: 'Responsable' }, { k: 'resol', label: 'Resolución' }, { k: 'act', label: 'Actividad' },
        { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto) }, { k: 'rendido', label: 'Rendido', r: true, render: r => U.money(r.rendido) },
        { k: 'vence', label: 'Vence', render: r => r.vence + (r.estado === 'Vencido' ? `<div class="mini" style="color:var(--danger)">hace ${r.dias} días</div>` : r.estado === 'Por rendir' ? `<div class="mini">en ${-r.dias} días</div>` : '') },
        { k: 'estado', label: 'Estado', render: r => U.tag(r.estado === 'Vencido' ? '<i class="fa-solid fa-lock"></i> Vencido · bloqueado' : r.estado, { Vencido: 't-red', 'Por rendir': 't-amber', Rendido: 't-green' }[r.estado]) }
      ], A.encargos, {
        rowCls: r => r.estado === 'Vencido' ? 'row-bad' : r.nuevo ? 'row-new' : '',
        actions: [{ icon: 'fa-file-circle-check', title: 'Registrar rendición', show: r => r.estado !== 'Rendido', fn: r => U.confirm(`¿Registrar la rendición total de <b>${r.num}</b> (${U.money(r.monto)})? El responsable queda habilitado para nuevos fondos.`, () => { const a = r.estado; r.rendido = r.monto; r.estado = 'Rendido'; SIGA.asiento('Rendición de encargo ' + r.num, [['5302', r.monto, 0], ['1101', 0, r.monto]], 'Tesorería'); SIGA.log('Tesorería', 'Rendición de encargo', r.num, a, 'Rendido'); U.toast(r.num + ' rendido · ' + r.resp + ' habilitado'); SIGA.refresh(); }, 'Registrar', '') }]
      });
    },

    /* ------------------ Viáticos ------------------ */
    paintVia() {
      const U = SIGA.ui;
      document.getElementById('a-p-via').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Comisiones de servicio <span class="grow">A-09 · A-10 · pasajes separados del viático</span></h3><div id="via-t"></div></div>
        <div class="card"><h3><span class="dot"></span>Escala vigente de viáticos <span class="grow">parametrizada · S/ por día</span></h3>${A.escala.map(e => `<div class="ef-row"><span>${e[0]}</span><b>S/ ${fmt(e[1])}</b></div>`).join('')}
          <div class="ef-row"><span>Movilidad local (tope diario)</span><b>S/ ${fmt(A.topeMovilidad)}</b></div>
          <div class="bigq mt">"Los viáticos se calculan aparte: tarifa diaria por días de comisión, según el cargo."<em>— Abastecimiento, levantamiento de campo</em></div></div></div>`;
      document.getElementById('via-t').innerHTML = U.table([
        { k: 'num', label: 'N°', render: r => `<span class="code">${r.num}</span>` }, { k: 'com', label: 'Comisionado', render: r => r.com + `<div class="mini">${r.cargo}</div>` }, { k: 'dest', label: 'Destino' },
        { k: 'dias', label: 'Días', r: true }, { k: 'viat', label: 'Viático', r: true, render: r => U.money(r.viat, '') }, { k: 'pasaje', label: 'Pasajes', r: true, render: r => U.money(r.pasaje, '') },
        { k: 'estado', label: 'Rendición', render: r => U.tag(r.estado, { 'Por rendir': 't-amber', 'Rendición vencida': 't-red', Rendido: 't-green' }[r.estado]) + `<div class="mini">vence ${r.vence}</div>` }
      ], A.comisiones, { rowCls: r => r.estado === 'Rendición vencida' ? 'row-bad' : r.nuevo ? 'row-new' : '' });
    },

    /* ------------------ Subvenciones ------------------ */
    paintSub() {
      const U = SIGA.ui, S = A.subvenciones;
      document.getElementById('a-p-sub').innerHTML = `<div class="split eq"><div class="card"><h3><span class="dot"></span>Prácticas preprofesionales <span class="grow">A-13 · S/ ${fmt(A.montoPracticas)} fijos por semestre</span></h3><div id="sub-p"></div></div>
        <div class="card"><h3><span class="dot"></span>Ayudantías de cátedra <span class="grow">A-14 · generadas desde la resolución decanal</span></h3><div id="sub-a"></div></div></div>`;
      document.getElementById('sub-p').innerHTML = U.table([{ k: 0, label: 'Facultad' }, { k: 1, label: 'Estudiantes', r: true }, { k: 't', label: 'Monto', r: true, render: r => U.money(r[1] * A.montoPracticas, '') }, { k: 2, label: 'Resolución', cls: 'mini' }, { k: 3, label: 'Periodo' }, { k: 4, label: 'Estado', render: r => U.tag(r[4], r[4] === 'Pagado' ? 't-green' : 't-amber') }], S.practicas);
      document.getElementById('sub-a').innerHTML = U.table([{ k: 1, label: 'Ayudante', render: r => r[1] + `<div class="mini">${r[0]} · ${r[2]}</div>` }, { k: 3, label: 'Curso' }, { k: 4, label: 'Facultad' }, { k: 5, label: 'Resolución', cls: 'mini' }, { k: 6, label: 'Estado', render: r => U.tag(r[6], 't-green') }], S.ayudantias);
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
      document.getElementById('con-t').innerHTML = U.table([
        { k: 'num', label: 'Contrato', render: r => `<span class="code">${r.num}</span>` }, { k: 'obj', label: 'Objeto', render: r => r.obj + `<div class="mini">${r.con}</div>` },
        { k: 'monto', label: 'Monto', r: true, render: r => U.money(r.monto) }, { k: 'inicio', label: 'Inicio · plazo', render: r => r.inicio + `<div class="mini">${r.plazo} días</div>` },
        { k: 'garantia', label: 'Garantía', render: r => `<span class="mini">${r.garantia}</span>` + (r.alerta ? `<div>${U.tag(r.alerta, 't-amber')}</div>` : '') },
        { k: 'adendas', label: 'Adendas', r: true }, { k: 'avance', label: 'Avance', render: r => `<div class="mcell">${U.meter(r.avance, 'var(--secondary)')}<span>${r.avance}%</span></div>` }
      ], A.contratos);
      const calc = () => {
        const m = num(document.getElementById('pn-m').value), p = Math.max(1, num(document.getElementById('pn-p').value)), a = num(document.getElementById('pn-a').value);
        const F = p <= 60 ? 0.40 : 0.25, d = 0.10 * m / (F * p), t = Math.min(d * a, 0.10 * m);
        document.getElementById('pn-f').value = F.toFixed(2);
        document.getElementById('pn-out').innerHTML = `<div class="grid cols-3" style="gap:8px"><div class="mini-card"><div class="lab">Diaria</div><div class="v">${U.money(d)}</div></div><div class="mini-card"><div class="lab">Aplicable</div><div class="v neg">${U.money(t)}</div></div><div class="mini-card"><div class="lab">Tope 10%</div><div class="v">${U.money(0.1 * m)}</div><div class="s">${t >= 0.1 * m - 0.01 ? 'alcanzado' : 'no alcanzado'}</div></div></div>`;
      };
      ['pn-m', 'pn-p', 'pn-a'].forEach(id => document.getElementById(id).addEventListener('input', calc)); calc();
    },

    /* ------------------ Proveedores ------------------ */
    paintProv() {
      const U = SIGA.ui;
      const cal = p => { const s = p.tiempo * 0.5 + p.calidad * 10 - p.pen * 5; return s >= 85 ? ['A', 't-green'] : s >= 70 ? ['B', 't-amber'] : ['C', 't-red']; };
      document.getElementById('a-p-prov').innerHTML = `<div class="card"><h3><span class="dot"></span>Evaluación de proveedores <span class="grow">A-19 · cumplimiento de plazos, calidad y penalidades · ${U.int(56755)} en el maestro</span></h3><div id="prov-t"></div>
        <div class="row-flex mt"><button class="btn sm sec" id="prov-portal"><i class="fa-solid fa-globe"></i> Vista del portal de proveedores</button><span class="mini">A-18 · el proveedor consulta el estado de sus órdenes y pagos sin llamar ni acudir a la oficina</span></div></div>`;
      document.getElementById('prov-t').innerHTML = U.table([
        { k: 'ruc', label: 'RUC', render: r => `<span class="code">${r.ruc}</span>` }, { k: 'rs', label: 'Razón social' }, { k: 'ord', label: 'Órdenes 2026', r: true },
        { k: 'tiempo', label: 'Entregas a tiempo', render: r => `<div class="mcell">${U.meter(r.tiempo)}<span>${r.tiempo}%</span></div>` },
        { k: 'calidad', label: 'Calidad', render: r => `<span class="stars">${'★'.repeat(Math.round(r.calidad))}${'☆'.repeat(5 - Math.round(r.calidad))}</span> <span class="mini">${r.calidad}</span>` },
        { k: 'pen', label: 'Penalidades', r: true }, { k: 'c', label: 'Calificación', render: r => U.tag(cal(r)[0], cal(r)[1]) }
      ], A.proveedores);
      document.getElementById('prov-portal').addEventListener('click', () => {
        const p = A.proveedores[0], os = A.ordenes.filter(o => o.prov === p.rs);
        U.modal('<i class="fa-solid fa-globe"></i> Portal de proveedores · vista del proveedor', `<div class="note info"><i class="fa-solid fa-user-tie"></i><div>Sesión de <b>${p.rs}</b> (RUC ${p.ruc}) · acceso con clave SOL</div></div>` +
          U.table([{ k: 'doc', label: 'Orden', render: r => `<span class="code">${r.doc}</span>` }, { k: 'ref', label: 'Objeto' }, { k: 'imp', label: 'Importe', r: true, render: r => U.money(r.imp) }, { k: 'estado', label: 'Estado de la orden', render: r => U.tag(r.estado, r.cls) }, { k: 'pago', label: 'Estado del pago', render: r => r.estado === 'Atendida' ? U.tag('Pagado · abono CCI', 't-green') : U.tag('Por devengar', 't-gray') }], os),
          `<button class="btn ghost" data-close>Cerrar</button>`, 'wide');
      });
    },
    paintPac() {
      const U = SIGA.ui;
      document.getElementById('a-tpac').innerHTML = U.table([
        { k: 0, label: 'N° Proc.', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Objeto', render: r => r[1] + `<div class="mini">${r[7]}</div>` },
        { k: 2, label: 'Procedimiento' }, { k: 3, label: 'Valor estimado', r: true, render: r => U.money(r[3]) }, { k: 4, label: 'Trim.' }, { k: 5, label: 'Etapa', render: r => U.tag(r[5], r[6]) }
      ], A.pac, { foot: `<tr><td colspan="3" class="r" style="font-weight:700">Total programado</td><td class="r num" style="font-weight:800">${U.money(A.pac.reduce((s, r) => s + r[3], 0))}</td><td colspan="2"></td></tr>` });
    }
  });
})();
