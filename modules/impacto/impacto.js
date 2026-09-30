/* Impacto SIGA-U · antes vs después para las autoridades (informe cap. III, VI · pitch) */
SIGA.registerModule('impacto', {
  title: 'Impacto SIGA-U', icon: 'fa-chart-line', group: 'Principal', badge: 'NUEVO', badgeNew: true,
  fd: 'Todas',
  render(el) {
    const U = SIGA.ui, d = SIGA.data.impacto;
    const inv = 1776500, ben = d.beneficios.reduce((s, b) => s + b[1], 0);
    el.innerHTML = `
      <div class="hero"><div class="eyebrow">Diagnóstico técnico · 28 deficiencias · 15 críticas</div>
        <h2>El problema no es el presupuesto. Es la máquina que lo administra.</h2>
        <p>S/ 34.7 millones separan lo que la universidad tiene aprobado de lo que ha llegado a ejecutar. SIGA-U devuelve a cada área el tiempo que hoy pierde compensando una herramienta de 1998.</p>
        <div class="stats"><div><b>−90%</b><span>tiempo de ciclo de trámites</span></div><div><b>100%</b><span>operaciones validadas contra el saldo</span></div><div><b>−67%</b><span>registros duplicados entre sistemas</span></div><div><b>4 → 6 áreas</b><span>+ 14 unidades productivas</span></div></div></div>
      <div class="grid cols-4 mb">${d.riesgo.map(r => `<div class="card kpi"><div class="lab">${r[1]}</div><div class="val" style="color:var(--danger)">${r[0]}</div><div class="sub">${r[2]}</div></div>`).join('')}</div>
      <div class="seg-tabs" data-group="im"><button class="on" data-tab="t">Tiempos por proceso</button><button data-tab="d">28 deficiencias → solución</button><button data-tab="c">Cobertura funcional</button><button data-tab="r">Referentes · SIGA-MEF · SIAF · ERP</button><button data-tab="k">Indicadores de éxito</button><button data-tab="b">Costo-beneficio</button><button data-tab="p">Plan de implementación</button></div>
      <div class="subpanel show" data-group="im" data-panel="t">
        <div class="split"><div class="card"><h3><span class="dot"></span>Cada trámite tarda días donde debería tardar horas <span class="grow">horas de proceso · medición en campo 2026</span></h3><div id="im-t"></div>
          <p class="mini mt">Los tiempos no se suman: se multiplican. Un requerimiento atraviesa cinco oficinas y en cada una vuelve a esperar.</p></div>
          <div><div class="saldo-box mb"><div class="lab">Reducción promedio del tiempo de ciclo</div><div class="big">−90%</div>
            <div class="row"><span>Certificación</span><span class="g">72 h → 4 h</span></div><div class="row"><span>Orden de compra</span><span class="g">120 h → 12 h</span></div><div class="row"><span>Cierre contable</span><span class="g">10 días → 1 día</span></div><div class="row"><span>Saldo por centro de costo</span><span class="g">15 h → en línea</span></div></div>
            <div class="card"><h3><span class="dot"></span>Pruébelo en la demo</h3><div class="checklist">${[['presupuesto', 'Certificar con bloqueo de sobregiro'], ['abastecimiento', 'Generar 10 documentos en un solo generador'], ['almacen', 'Entregado · pendiente · por pedir'], ['contabilidad', 'Asientos automáticos y cierre en un día'], ['integracion', 'Caída del SIAF sin perder operaciones']].map(x => `<div class="ck ok" style="cursor:pointer" data-go="${x[0]}"><i class="fa-solid fa-arrow-right"></i><span>${x[1]}</span><em>${SIGA.modules[x[0]].title}</em></div>`).join('')}</div></div></div></div></div>
      <div class="subpanel" data-group="im" data-panel="d"><div class="card"><h3><span class="dot"></span>Cada deficiencia tiene su solución trazada <span class="grow">clic para ir a la pantalla que la resuelve</span></h3>
        <div class="toolbar"><div class="chips" id="im-chips">${['Todas', 'Crítica', 'Alta', 'Media'].map(f => `<span class="chipf ${f === this.fd ? 'on' : ''}" data-f="${f}">${f}${f === 'Crítica' ? ' · 15' : f === 'Alta' ? ' · 10' : f === 'Media' ? ' · 3' : ' · 28'}</span>`).join('')}</div></div>
        <div class="def-grid" id="im-defs"></div></div></div>
      <div class="subpanel" data-group="im" data-panel="c"><div class="split"><div class="card"><h3><span class="dot"></span>Cobertura funcional por área · hoy vs SIGA-U <span class="grow">% de procesos soportados · 126 procesos</span></h3>
        ${U.chart.cols({ labels: d.cobertura.map(c => c[0]), series: [{ name: 'Sistema actual', data: d.cobertura.map(c => c[1]), color: '#94A3B8' }, { name: 'SIGA-U', data: d.cobertura.map(() => 100) }], fmt: v => v + '%', yMax: 100, h: 250 })}</div>
        <div class="card"><h3><span class="dot"></span>Cobertura promedio</h3><div class="cmp"><div class="asis"><h5>Hoy</h5><div class="big-n neg">31%</div>4 áreas parcialmente · 14 unidades productivas sin ningún sistema</div><div class="tobe"><h5>SIGA-U</h5><div class="big-n pos">100%</div>6 áreas + RR.HH. + 14 unidades productivas</div></div>
          <p class="mini mt">Planificación 14 procesos · Abastecimiento 20 · Almacén 12 · Tesorería 15 · Contabilidad 18 · Centros de producción 33 · RR.HH. 14.</p></div></div></div>
      <div class="subpanel" data-group="im" data-panel="r"><div class="card"><h3><span class="dot"></span>Cada proceso de SIGA-U contrastado con los sistemas de referencia <span class="grow">SIGA-MEF (módulos de Logística y Patrimonio) · SIAF-SP (fases del gasto) · ERP de mercado · clic para abrir el proceso</span></h3><div id="im-r"></div>
        <p class="mini mt">Fuentes: manuales del SIGA-MEF (Logística: tablas, programación, pedidos, procesos de selección, adquisiciones, almacenes; Patrimonio: altas, bajas, inventario, depreciación y conciliación), manuales del SIAF-SP (certificación → compromiso → devengado → girado → pagado; el girado exige las fases previas aprobadas) y funcionalidades estándar de un ERP (conciliación de tres vías orden–recepción–factura, reglas mínimo–máximo, órdenes de producción con lista de materiales, punto de venta y conciliación bancaria).</p></div></div>
      <div class="subpanel" data-group="im" data-panel="k"><div class="card"><h3><span class="dot"></span>Indicadores de éxito y metas comprometidas</h3><div id="im-k"></div></div></div>
      <div class="subpanel" data-group="im" data-panel="b"><div class="grid cols-4 mb">${[['Inversión total estimada', U.mill(inv, 2), 'referencial 2026 · sin IGV'], ['Beneficio anual estimado', U.mill(ben, 2), 'estimación conservadora'], ['Periodo de recuperación', '14 meses', 'inversión / beneficio mensual'], ['Costo recurrente anual', 'S/ 0.37 M', 'nube, CPE y soporte evolutivo']].map(x => `<div class="card kpi"><div class="lab">${x[0]}</div><div class="val">${x[1]}</div><div class="sub">${x[2]}</div></div>`).join('')}</div>
        <div class="split"><div class="card"><h3><span class="dot"></span>Beneficios cuantificables por año</h3>${U.bars(d.beneficios.map((b, i) => [b[0].replace('Mejora de la ', '').replace('Reducción de ', '').replace('Eliminación de la ', ''), b[1] / d.beneficios[0][1] * 100, U.chart.PAL[i < 2 ? 0 : 1], 'S/ ' + U.int(b[1])]))}
          <p class="mini mt">${d.beneficios.map(b => `<b>${b[0]}:</b> ${b[2]}`).join(' · ')}</p></div>
          <div class="card"><h3><span class="dot"></span>Lo que no se expresa en porcentaje</h3><div class="checklist">${['Se elimina el riesgo de parálisis administrativa', 'Se responde al órgano de control con trazabilidad', 'Se decide con información del día, no del mes pasado', 'Cada área recupera el tiempo que hoy compensa a mano', 'Evidencia para licenciamiento y acreditación', 'Código propiedad de la universidad · sin licencias por usuario'].map(x => `<div class="ck ok"><i class="fa-solid fa-circle-check"></i><span>${x}</span></div>`).join('')}</div></div></div></div>
      <div class="subpanel" data-group="im" data-panel="p"><div class="card"><h3><span class="dot"></span>Seis meses, seis entregas, sin apagar nada <span class="grow">el sistema actual sigue operando en paralelo</span></h3>
        <div class="road">${d.plan.map(p => `<div><b>${p[0]}</b>${p[1]}</div>`).join('')}</div>
        <div class="grid cols-2 mt"><div class="note teal" style="margin:0"><i class="fa-solid fa-flag-checkered"></i><div><b>Primer alivio: mes 2.</b> El control presupuestal entra en producción y el riesgo de sobregiro queda cerrado.</div></div>
          <div class="note info" style="margin:0"><i class="fa-solid fa-warehouse"></i><div><b>Almacén: mes 4.</b> Kárdex valorizado y los tres estados de movimiento operando con datos reales.</div></div></div>
        <h3 class="mt"><span class="dot"></span>La decisión</h3>
        <div class="grid cols-3">${[['1', 'Aprobar el informe técnico', 'Reconocer formalmente el diagnóstico de las 28 deficiencias.'], ['2', 'Autorizar el mes 1', 'Núcleo, maestros y seguridad. Un mes para confirmar el camino.'], ['3', 'Designar contrapartes por área', 'Una persona por oficina que valide su módulo antes de construirlo.']].map(x => `<div class="mini-card"><div class="v" style="color:var(--primary-dark)">${x[0]}</div><b>${x[1]}</b><div class="s">${x[2]}</div></div>`).join('')}</div></div></div>`;

    document.getElementById('im-t').innerHTML = U.table([
      { k: 0, label: 'Proceso' }, { k: 1, label: 'Hoy', r: true, render: r => `<span class="saldo-neg">${r[1]} h</span>` },
      { k: 2, label: 'SIGA-U', r: true, render: r => `<b class="saldo-pos">${r[2] ? r[2] + ' h' : 'en línea'}</b>` },
      { k: 3, label: 'Reducción', render: r => `<div class="mcell">${U.meter(r[3], 'var(--primary)')}<span>−${r[3]}%</span></div>` }
    ], d.tiempos, { onRow: r => SIGA.go(r[4]) });
    const paintDefs = () => {
      document.getElementById('im-defs').innerHTML = d.deficiencias.filter(x => this.fd === 'Todas' || x[3] === this.fd).map(x => `<div class="def ${x[3]}" data-go="${x[4]}"><span class="code">${x[0]}</span> ${U.tag(x[3], x[3] === 'Crítica' ? 't-red' : x[3] === 'Alta' ? 't-amber' : 't-gray')} <span class="mini">${x[2]}</span><b style="margin-top:4px">${x[1]}</b><span class="mini">${x[5]}</span><div class="m"><span><i class="fa-solid ${SIGA.modules[x[4]].icon}"></i> ${SIGA.modules[x[4]].title}</span><i class="fa-solid fa-arrow-right"></i></div></div>`).join('');
      el.querySelectorAll('#im-defs .def').forEach(n => n.addEventListener('click', () => SIGA.go(n.dataset.go)));
    };
    paintDefs();
    el.querySelector('#im-chips').addEventListener('click', e => { const c = e.target.closest('[data-f]'); if (!c) return; this.fd = c.dataset.f; el.querySelectorAll('#im-chips .chipf').forEach(x => x.classList.toggle('on', x === c)); paintDefs(); });
    const REF = [
      ['Programación y cuadro de necesidades', 'Logística · Programación (cuadro de necesidades, PAC)', 'Programación de compromisos anual', 'Planificación presupuestal', 'Vinculado al marco con saldo calculado en línea', 'presupuesto'],
      ['Certificación de crédito', 'Gestión presupuestal · certificación desde el pedido', 'Fase de certificación', 'Control presupuestal', 'Validación transaccional que bloquea el sobregiro', 'presupuesto'],
      ['Requerimientos del área usuaria', 'Pedidos de compra y de servicio', '—', 'Solicitudes de compra', 'Aprobación electrónica por nivel de monto y segregación', 'abastecimiento'],
      ['Procedimientos de selección', 'Procesos de selección (comités, cronograma, contratos)', 'SEACE', 'Licitaciones / RFQ', 'Comité, cronograma por etapa y avance visible del PAC', 'abastecimiento'],
      ['Órdenes de compra y servicio', 'Adquisiciones · O/C, O/S y control de fases', 'Compromiso anual y mensual', 'Órdenes de compra', 'Compromiso transmitido por interfaz, sin re-digitar', 'abastecimiento'],
      ['Recepción y conformidad', 'Almacenes · NEA y PECOSA', 'Devengado', 'Conciliación de tres vías (orden–recepción–factura)', 'El devengado exige conformidad registrada; penalidad calculada', 'almacen'],
      ['Existencias y reposición', 'Almacenes · kárdex y stock', '—', 'Reglas mínimo–máximo que disparan la compra', 'Reposición consolidada con un clic desde el bajo stock', 'almacen'],
      ['Control patrimonial', 'Patrimonio · altas, bajas, inventario, depreciación, conciliación', '—', 'Gestión de activos', 'Etiqueta QR, asignación en uso y conciliación contable en línea', 'patrimonio'],
      ['Girado y pagado', 'Integración SIGA → SIAF', 'Girado (requiere fases previas aprobadas) y pagado', 'Pagos a proveedores', 'Detracción y retención automáticas, pago en lote por rol', 'tesoreria'],
      ['Conciliación bancaria', '—', 'Conciliación de cuentas', 'Sincronización y conciliación bancaria', 'Emparejamiento automático; solo se revisan diferencias', 'tesoreria'],
      ['Registro contable y EEFF', '—', 'Notas contables y estados financieros', 'Contabilidad general', 'Asiento automático por dinámica y extorno como operación inversa', 'contabilidad'],
      ['Planillas', 'AIRHSP · MCPP', 'Devengado de planilla', 'Nómina', 'Nueve regímenes, PLAME/AFPnet y boleta electrónica', 'planilla'],
      ['Ventas de centros de producción', '—', 'Recaudación RDR', 'Punto de venta', 'Comprobante UBL 2.1 con SUNAT y ampliación automática de la fuente 09', 'ventas'],
      ['Costos de producción', '—', '—', 'Órdenes de producción con lista de materiales', 'Costo unitario real con merma, mano de obra y depreciación', 'produccion'],
      ['Integración con entes rectores', 'Interfaz SIGA–SIAF', 'Transmisión de fases', 'Conectores', 'Cola con reintento, idempotencia e interruptor de circuito', 'integracion'],
      ['Auditoría', '—', '—', 'Registro de cambios', 'Bitácora inmutable con cadena de huellas y exportación para el OCI', 'seguridad']
    ];
    document.getElementById('im-r').innerHTML = U.grid({ id: 'imp-ref', title: 'referentes', export: 'mapa_procesos_referentes', rows: REF, onRow: r => SIGA.go(r[5]),
      cols: [{ k: 0, label: 'Proceso SIGA-U', render: r => `<b>${r[0]}</b><div class="mini">${SIGA.modules[r[5]].title}</div>` }, { k: 1, label: 'SIGA-MEF', cls: 'mini' }, { k: 2, label: 'SIAF-SP', cls: 'mini' }, { k: 3, label: 'ERP de referencia', cls: 'mini' }, { k: 4, label: 'Lo que agrega SIGA-U', render: r => `<span class="saldo-pos" style="font-size:11.5px">${r[4]}</span>` }], pageSize: 16 });
    document.getElementById('im-k').innerHTML = U.table([
      { k: 0, label: 'Indicador' }, { k: 1, label: 'Situación actual', render: r => `<span class="saldo-neg">${r[1]}</span>` },
      { k: 2, label: 'Meta con SIGA-U', render: r => `<b class="saldo-pos">${r[2]}</b>` }, { k: 3, label: 'Verificación', render: r => U.tag('Mes ' + r[3].slice(1), 't-blue') }
    ], d.indicadores);
    el.querySelectorAll('[data-go].ck').forEach(n => n.addEventListener('click', () => SIGA.go(n.dataset.go)));
  }
});
