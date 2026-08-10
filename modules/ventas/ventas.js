SIGA.registerModule('ventas', {
  title: 'Ventas y facturación', icon: 'fa-receipt', group: 'Producción agropecuaria · RDR',
  render(el) {
    const d = SIGA.data.ventas, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Ventas y facturación electrónica</h1><p>Boletas y facturas con IGV · comprobantes SUNAT (estándar UBL 2.1)</p></div>
        <div style="display:flex;gap:8px"><button class="btn" id="nv"><i class="fa-solid fa-plus"></i> Nueva venta</button></div></div>
      ${U.kpis([
        { lab: 'Ventas del día', val: 'S/ 9,842', sub: 'gravadas' },
        { lab: 'IGV del día', val: 'S/ 1,771.56', sub: '18%' },
        { lab: 'Comprobantes', val: '44', sub: 'boletas + facturas' },
        { lab: 'Aceptados SUNAT', val: '98%', sub: 'tasa de aceptación', chip: 'OK' }
      ])}
      <div class="card"><h3><span class="dot"></span>Comprobantes emitidos <span class="grow">Diciembre 2025 · clic para ver</span></h3><div id="tcomp"></div></div>`;

    const ver = c => {
      U.detail('Comprobante ' + c.doc, [
        ['Tipo', c.tipo === '01' ? '01 · Factura electrónica' : '03 · Boleta de venta electrónica'],
        ['Serie-Número', c.doc], ['Fecha de emisión', c.fecha], ['Cliente', c.cli], ['Documento', c.docCli],
        ['Condición', c.op], ['Op. gravada', U.money(c.grav)], ['IGV (18%)', U.money(c.igv)],
        ['Importe total', U.money(c.total)], ['Estado SUNAT', U.tag(c.sunat, c.cls)]
      ], `<button class="btn ghost" data-close>Cerrar</button>${c.sunat === 'Pendiente' ? '<button class="btn" id="env"><i class="fa-solid fa-paper-plane"></i> Enviar a SUNAT</button>' : ''}<button class="btn sec" onclick="SIGA.ui.toast('Descargando XML/PDF de ${c.doc}…')"><i class="fa-solid fa-download"></i> XML / PDF</button>`);
      document.getElementById('env')?.addEventListener('click', () => { c.sunat = 'Aceptado'; c.cls = 't-green'; U.closeModal(); this.render(el); U.toast(c.doc + ' aceptado por SUNAT ✓'); });
    };

    document.getElementById('tcomp').innerHTML = U.table([
      { k: 'doc', label: 'Comprobante', render: r => `<span class="code">${r.doc}</span>` },
      { k: 'fecha', label: 'Fecha', cls: 'num' }, { k: 'cli', label: 'Cliente' },
      { k: 'docCli', label: 'Documento', cls: 'mini' },
      { k: 'total', label: 'Total', r: true, render: r => `<span class="num">${U.money(r.total)}</span>` },
      { k: 'sunat', label: 'SUNAT', render: r => U.tag(r.sunat, r.cls) }
    ], d.comprobantes, {
      onRow: ver,
      actions: [{ icon: 'fa-eye', title: 'Ver', fn: ver }, { icon: 'fa-ban', title: 'Anular (nota de crédito)', cls: 'del', fn: c => U.confirm(`¿Anular <b>${c.doc}</b>? Se emitirá una nota de crédito y se comunicará a SUNAT.`, () => U.toast('Nota de crédito emitida para ' + c.doc, 'err'), 'Anular') }]
    });

    document.getElementById('nv').addEventListener('click', () => this.nuevaVenta(el));
  },

  /* ===== MODAL DE FACTURACIÓN · ESTÁNDAR SUNAT COMPLETO ===== */
  nuevaVenta(el) {
    const d = SIGA.data.ventas, U = SIGA.ui;
    const IGV = 0.18;
    const seed = { cod: d.productos[0].desc, um: d.productos[0].um, cant: 1, precio: d.productos[0].pu, afect: 'Gravado' };
    const totals = (rows, v) => {
      let grav = 0, exon = 0, inaf = 0, desc = 0;
      rows.forEach(r => {
        const imp = (parseFloat(r.cant) || 0) * (parseFloat(r.precio) || 0) - (parseFloat(r.desc) || 0);
        if (r.afect === 'Exonerado') exon += imp; else if (r.afect === 'Inafecto') inaf += imp; else grav += imp;
        desc += (parseFloat(r.desc) || 0);
      });
      const igv = grav * IGV;
      const total = grav + exon + inaf + igv;
      window.__ventaTot = { grav, exon, inaf, igv, total };
      const t = [
        { label: 'Op. gravada', val: U.money(grav, '') },
        { label: 'Op. exonerada', val: U.money(exon, '') },
        { label: 'Op. inafecta', val: U.money(inaf, '') },
        { label: 'IGV (18%)', val: U.money(igv, '') },
        { label: 'IMPORTE TOTAL S/', val: U.money(total, ''), big: true }
      ];
      return t;
    };
    U.bigForm({
      title: 'Nueva venta · Comprobante electrónico', icon: 'fa-file-invoice-dollar', size: 'wide',
      sections: [
        {
          title: 'Datos del comprobante', cols: 3, fields: [
            { k: 'tipo', label: 'Tipo de comprobante', type: 'select', options: ['01 · Factura', '03 · Boleta de venta'], span: 1, required: true },
            { k: 'serie', label: 'Serie', value: 'F001', span: 1, ro: true, hint: 'auto según tipo' },
            { k: 'fecha', label: 'Fecha de emisión', type: 'date', value: '2025-12-19', span: 1, required: true },
            { k: 'moneda', label: 'Moneda', type: 'select', options: ['PEN · Soles', 'USD · Dólares'], span: 1 },
            { k: 'op', label: 'Forma de pago', type: 'select', options: ['Contado', 'Crédito'], span: 1 },
            { k: 'venc', label: 'F. vencimiento', type: 'date', value: '2025-12-19', span: 1 }
          ]
        },
        {
          title: 'Datos del cliente (adquirente)', cols: 3, fields: [
            { k: 'tipoDoc', label: 'Tipo doc.', type: 'select', options: ['6 · RUC', '1 · DNI', '0 · Sin documento'], span: 1, required: true },
            { k: 'numDoc', label: 'N° documento', value: '', span: 1, required: true, ph: '20xxxxxxxxx' },
            { k: 'cli', label: 'Razón social / Nombre', value: '', required: true },
            { k: 'dir', label: 'Dirección fiscal', value: '', span: 3, ph: 'Av. / Jr. …' },
            { k: 'correo', label: 'Correo (envío del CPE)', type: 'email', value: '', ph: 'cliente@correo.com' }
          ]
        }
      ],
      items: {
        title: 'Detalle de la venta', addLabel: 'Agregar ítem', seed,
        rows: [Object.assign({}, seed)],
        columns: [
          { k: 'cod', label: 'Descripción', type: 'text', w: '30%' },
          { k: 'um', label: 'U. medida', type: 'select', options: ['NIU · Unidad', 'KGM · Kilogramo', 'LTR · Litro', 'ZZ · Servicio'], w: '15%' },
          { k: 'afect', label: 'Afectación IGV', type: 'select', options: ['Gravado', 'Exonerado', 'Inafecto'], w: '15%' },
          { k: 'cant', label: 'Cant.', type: 'num', r: true, w: '9%' },
          { k: 'precio', label: 'V. unit.', type: 'money', r: true, w: '12%' },
          { k: 'desc', label: 'Dscto.', type: 'money', r: true, w: '10%' },
          { k: 'imp', label: 'Importe', calc: r => (parseFloat(r.cant) || 0) * (parseFloat(r.precio) || 0) - (parseFloat(r.desc) || 0), r: true, w: '12%' }
        ]
      },
      totals,
      footNote: () => U.montoLetras((window.__ventaTot || {}).total || 0),
      submitLabel: 'Emitir y enviar a SUNAT',
      onSubmit: (v, rows) => {
        if (!rows.length) { U.toast('Agregue al menos un ítem', 'err'); return; }
        const tipo = v.tipo.slice(0, 2);
        const t = window.__ventaTot;
        d.correlativo[tipo]++;
        const serie = d.series[tipo];
        const doc = serie + '-' + String(d.correlativo[tipo]).padStart(6, '0');
        d.comprobantes.unshift({ doc, tipo, fecha: (v.fecha || '').split('-').reverse().join('/'), cli: v.cli || 'Consumidor final', docCli: (v.tipoDoc.split(' · ')[1] || '') + ' ' + (v.numDoc || ''), op: v.op, grav: t.grav, igv: t.igv, total: t.total, sunat: 'Aceptado', cls: 't-green' });
        U.closeModal(); this.render(el); U.toast(doc + ' emitido · ' + U.money(t.total) + ' · aceptado por SUNAT ✓');
      }
    });
    // serie automática según tipo
    const back = document.getElementById('siga-modal');
    const tsel = back.querySelector('[data-k="tipo"]'), ssel = back.querySelector('[data-k="serie"]');
    tsel.addEventListener('change', () => { ssel.value = tsel.value.startsWith('01') ? 'F001' : 'B001'; });
  }
});
