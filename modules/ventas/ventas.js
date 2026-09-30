/* ============================================================
   Ventas y facturación electrónica · CPE conforme al estándar SUNAT (UBL 2.1)
   Circuito: venta → recibo → depósito → ampliación de la fuente 09
   ============================================================ */
(function () {
  const V = SIGA.data.ventas, IGV = 0.18;
  const prod = cod => V.productos.find(p => p.cod === cod);
  const calc = (items, desc = 0) => {
    let grav = 0, exon = 0;
    items.forEach(([cod, cant]) => { const p = prod(cod); if (!p) return; const imp = cant * p.pu * (1 - desc / 100); if (p.afect === 'Gravado') grav += imp; else exon += imp; });
    grav = Math.round(grav * 100) / 100; exon = Math.round(exon * 100) / 100;
    const igv = Math.round(grav * IGV * 100) / 100;
    return { grav, exon, igv, total: Math.round((grav + exon + igv) * 100) / 100 };
  };
  V.comprobantes.forEach(c => { Object.assign(c, calc(c.items)); if (c._cobro != null) { c.cobrado = Math.round(c.total * c._cobro * 100) / 100; delete c._cobro; } });
  const saldo = c => c.total - (c.cobrado || 0);
  const vencido = c => { const [d, m, y] = (c.venc || '').split('/').map(Number); return c.venc && new Date(y, m - 1, d) < new Date(2026, 7, 18); };

  // API: emisión de CPE usada por el punto de venta y el formulario completo
  SIGA.ventas = {
    calc,
    emitir({ tipo, cli, docCli, op, items, desc = 0, medio = 'Efectivo', venc }) {
      const U = SIGA.ui, t = calc(items, desc);
      V.correlativo[tipo]++;
      const doc = V.series[tipo] + '-' + U.pad(V.correlativo[tipo]);
      const unidad = (prod(items[0][0]) || {}).unidad || 'Centro de producción';
      const c = Object.assign({ doc, tipo, fecha: SIGA.ctx.hoy, cli, docCli, op, items, sunat: 'Enviando', unidad, venc, cobrado: 0, nuevo: true }, t);
      V.comprobantes.unshift(c);
      const msg = SIGA.siaf(tipo === '01' ? 'Factura electrónica' : 'Boleta electrónica', doc, t.total, 'SUNAT');
      setTimeout(() => { c.sunat = msg && msg.estado === 'Confirmado' ? 'Aceptado' : (SIGA.data.integracion.caido.SUNAT ? 'En cola' : 'Aceptado'); if (SIGA.cur === 'ventas') SIGA.refresh(); }, 1600);
      const ing = t.grav + t.exon;
      if (op === 'Contado') {
        SIGA.caja?.recibo({ concepto: 'Venta · ' + (prod(items[0][0]) || {}).desc, unidad, pagador: cli, medio, total: t.total, comprob: doc });
        SIGA.asiento('Venta al contado ' + doc, [['1101', t.total, 0], [unidad.startsWith('Lab') || unidad.startsWith('Servicios') ? '4302' : '4301', 0, ing], ...(t.igv ? [['2101', 0, t.igv]] : [])], 'Ventas');
      } else SIGA.asiento('Venta al crédito ' + doc, [['1202', t.total, 0], ['4301', 0, ing], ...(t.igv ? [['2101', 0, t.igv]] : [])], 'Ventas');
      SIGA.log('Ventas', 'Emisión de comprobante electrónico', doc, '—', cli + ' · ' + U.money(t.total));
      return c;
    }
  };

  const dtbl = (head, rows) => `<table class="doc-tbl"><thead><tr>${head.map(h => `<th class="${h[1] ? 'r' : ''}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i][1] ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const VM = () => SIGA.modules.ventas;
  const xml = c => { const U = SIGA.ui, tp = c.tipo === '01' ? 'Invoice' : 'Invoice';
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID><cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${c.doc}</cbc:ID><cbc:IssueDate>2026-${c.fecha.slice(3, 5)}-${c.fecha.slice(0, 2)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">${c.tipo}</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyIdentification><cbc:ID schemeID="6">20161749126</cbc:ID></cac:PartyIdentification><cac:PartyLegalEntity><cbc:RegistrationName>UNIVERSIDAD NACIONAL AGRARIA DE LA SELVA</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party><cac:PartyIdentification><cbc:ID schemeID="${c.docCli.startsWith('RUC') ? 6 : 1}">${c.docCli.split(' ')[1]}</cbc:ID></cac:PartyIdentification><cac:PartyLegalEntity><cbc:RegistrationName>${U.esc(c.cli)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty>
  <cac:PaymentTerms><cbc:ID>FormaPago</cbc:ID><cbc:PaymentMeansID>${c.op}</cbc:PaymentMeansID></cac:PaymentTerms>
  <cac:TaxTotal><cbc:TaxAmount currencyID="PEN">${c.igv.toFixed(2)}</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="PEN">${(c.grav + c.exon).toFixed(2)}</cbc:LineExtensionAmount><cbc:PayableAmount currencyID="PEN">${c.total.toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>
${c.items.map(([cod, q], i) => { const p = prod(cod); return `  <cac:InvoiceLine><cbc:ID>${i + 1}</cbc:ID><cbc:InvoicedQuantity unitCode="${p.um}">${q}</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="PEN">${(q * p.pu).toFixed(2)}</cbc:LineExtensionAmount><cac:Item><cbc:Description>${U.esc(p.desc)}</cbc:Description><cac:SellersItemIdentification><cbc:ID>${cod}</cbc:ID></cac:SellersItemIdentification></cac:Item><cac:Price><cbc:PriceAmount currencyID="PEN">${p.pu.toFixed(2)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`; }).join('\n')}
</Invoice>`; };
  const cpeRec = SIGA.recs.cpe = {
    mod: 'Ventas', office: 'Centros de Producción · facturación electrónica', key: c => c.doc, title: c => (c.tipo === '01' ? 'Factura ' : 'Boleta ') + c.doc + ' · ' + c.cli, estado: 'sunat', cls: false, anuladoValor: 'Anulado',
    tipo: 'Comprobante de pago electrónico', view: c => VM().ver(c),
    fields: c => { const U = SIGA.ui; return [['Comprobante', c.doc], ['Fecha', c.fecha], ['Cliente', U.esc(c.cli), 1], ['Documento', c.docCli], ['Condición', c.op + (c.venc ? ' · vence ' + c.venc : '')], ['Unidad productiva', c.unidad], ['Op. gravada', U.money(c.grav)], ['Op. exonerada', U.money(c.exon)], ['IGV', U.money(c.igv)], ['Total', `<b>${U.money(c.total)}</b>`], ['SUNAT', c.sunat]]; },
    anular: true, anularLabel: 'Anular con nota de crédito', canAnular: c => !c.anulado,
    onAnular: (c, m) => VM().notaCredito(c, m),
    extra: c => [
      ...(c.sunat === 'Pendiente' || c.sunat === 'En cola' ? [{ icon: 'fa-paper-plane', label: 'Enviar a SUNAT', fn: x => VM().enviar(x) }] : []),
      ...(c.op === 'Crédito' && !c.anulado && saldo(c) > 0.004 ? [{ icon: 'fa-hand-holding-dollar', label: 'Registrar cobranza', fn: x => VM().cobrar(x) }] : []),
      ...(c.tipo === '01' && !c.anulado && !V.guias.some(g => g.ref === c.doc) ? [{ icon: 'fa-truck', label: 'Emitir guía de remisión', fn: x => VM().guia(x) }] : []),
      { icon: 'fa-file-code', label: 'Descargar XML (UBL 2.1)', menuOnly: true, fn: x => SIGA.ui.download('20161749126-' + x.tipo + '-' + x.doc + '.xml', xml(x), 'application/xml') },
      { icon: 'fa-file-zipper', label: 'Descargar CDR de SUNAT', menuOnly: true, fn: x => SIGA.ui.download('R-20161749126-' + x.tipo + '-' + x.doc + '.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<ApplicationResponse><cbc:ResponseCode>0</cbc:ResponseCode><cbc:Description>La ${x.tipo === '01' ? 'Factura' : 'Boleta'} numero ${x.doc}, ha sido aceptada</cbc:Description><cbc:ReferenceID>${x.doc}</cbc:ReferenceID></ApplicationResponse>`, 'application/xml') }
    ],
    print: c => { const U = SIGA.ui; return { tipo: (c.tipo === '01' ? 'Factura' : 'Boleta de venta') + ' electrónica', num: c.doc, fecha: c.fecha, office: c.unidad + ' · Carretera Central km 1.21',
      pairs: [['Adquirente', U.esc(c.cli), 1], ['Documento', c.docCli], ['Condición', c.op + (c.venc ? ' · vence ' + c.venc : '')], ['Moneda', 'PEN · Soles'], ['SUNAT', c.sunat]],
      body: dtbl([['Código'], ['Descripción'], ['Und'], ['Afect.'], ['Cant.', 1], ['V. unit.', 1], ['Importe', 1]], c.items.map(([cod, q]) => { const p = prod(cod); return [cod, p.desc, p.um, p.afect === 'Gravado' ? '10' : '20', q, p.pu.toFixed(2), U.money(q * p.pu, '')]; })) + dtbl([['Resumen'], ['S/', 1]], [['Op. gravada', U.money(c.grav, '')], ['Op. exonerada', U.money(c.exon, '')], ['IGV 18%', U.money(c.igv, '')], ['<b>Total</b>', '<b>' + U.money(c.total, '') + '</b>']]) + `<p class="mini">${U.montoLetras(c.total)} · Representación impresa del comprobante electrónico · consulte en sunat.gob.pe</p>`,
      firmas: [['Emisor', 'UNAS · RUC 20161749126'], ['Cajero', SIGA.ctx.user.nombre], ['Cliente', U.esc(c.cli)]] }; },
    mailTo: c => (V.clientes.find(x => x.doc === c.docCli) || {}).correo || ''
  };

  SIGA.registerModule('ventas', {
    title: 'Ventas y facturación', icon: 'fa-receipt', group: 'Centros de Producción · RDR', badge: 'CPE',
    cart: [['CAF-TOS', 2], ['YOG-FRU', 3]], cliI: 4, lista: 'Público', medio: 'Efectivo', fu: 'Todas',
    alerts() {
      const out = [], p = V.comprobantes.filter(c => c.sunat === 'Pendiente' || c.sunat === 'En cola');
      if (p.length) out.push({ lvl: 'warn', icon: 'fa-paper-plane', t: `${p.length} comprobante(s) por enviar a SUNAT`, d: p.map(c => c.doc).join(' · '), fn: () => SIGA.showTab(document.getElementById('mod-root'), 'v', 'comp') });
      const v = V.comprobantes.filter(c => c.op === 'Crédito' && saldo(c) > 0.004 && vencido(c));
      if (v.length) out.push({ lvl: 'warn', icon: 'fa-hand-holding-dollar', t: `${v.length} cuenta(s) por cobrar vencida(s)`, d: SIGA.ui.money(v.reduce((s, c) => s + saldo(c), 0)), fn: () => SIGA.showTab(document.getElementById('mod-root'), 'v', 'cxc') });
      return out;
    },
    search(q) { return V.comprobantes.filter(c => (c.doc + ' ' + c.cli + ' ' + c.docCli).toLowerCase().includes(q)).map(c => ({ t: c.doc + ' · ' + SIGA.ui.money(c.total), d: c.cli + ' · SUNAT ' + c.sunat, fn: () => this.ver(c) })); },
    render(el) {
      const U = SIGA.ui, hoy = V.comprobantes.filter(c => c.fecha === SIGA.ctx.hoy && !c.anulado);
      const acc = V.comprobantes.filter(c => c.sunat === 'Aceptado').length / V.comprobantes.length * 100;
      el.innerHTML = `
      <div class="page-head"><div><h1>Ventas y facturación electrónica</h1><p>Punto de venta de los centros de producción · boletas y facturas con IGV conforme a SUNAT (UBL 2.1) · cobranza y cuentas por cobrar</p></div>
        <div class="row-flex"><button class="btn ghost" id="v-nf"><i class="fa-solid fa-file-invoice"></i> Factura (formulario completo)</button><button class="btn" id="v-pos"><i class="fa-solid fa-cash-register"></i> Punto de venta</button></div></div>
      ${U.kpis([
        { lab: 'Ventas del día', val: U.money(hoy.reduce((s, c) => s + c.total, 0)), sub: hoy.length + ' comprobantes hoy' },
        { lab: 'IGV del día', val: U.money(hoy.reduce((s, c) => s + c.igv, 0)), sub: '18% sobre operaciones gravadas' },
        { lab: 'Por cobrar', val: U.money(V.comprobantes.filter(c => c.op === 'Crédito' && !c.anulado).reduce((s, c) => s + saldo(c), 0)), sub: 'ventas al crédito' },
        { lab: 'Aceptados por SUNAT', val: acc.toFixed(0) + '%', sub: 'antes: 0% facturación electrónica', chip: 'CPE', chipType: 'up' }
      ])}
      <div class="seg-tabs" data-group="v"><button class="on" data-tab="pos"><i class="fa-solid fa-cash-register"></i> Punto de venta</button><button data-tab="comp">Comprobantes</button><button data-tab="cxc">Cuentas por cobrar</button><button data-tab="cat">Catálogo y precios</button><button data-tab="cli">Clientes</button><button data-tab="nc">Notas de crédito</button><button data-tab="gr">Guías de remisión</button><button data-tab="reg">Registro de ventas</button><button data-tab="ana">Análisis comercial</button></div>
      <div class="subpanel show" data-group="v" data-panel="pos" id="v-p-pos"></div>
      <div class="subpanel" data-group="v" data-panel="comp"><div class="card"><h3><span class="dot"></span>Comprobantes electrónicos emitidos <span class="grow">agosto 2026 · clic para ver</span></h3><div id="v-comp"></div></div></div>
      <div class="subpanel" data-group="v" data-panel="cxc" id="v-p-cxc"></div>
      <div class="subpanel" data-group="v" data-panel="cat"><div class="card"><h3><span class="dot"></span>Catálogo de productos y servicios · listas de precios <span class="grow">CV-01 · CV-02 · valor unitario sin IGV</span></h3><div id="v-cat"></div></div></div>
      <div class="subpanel" data-group="v" data-panel="cli"><div class="card"><h3><span class="dot"></span>Padrón de clientes <span class="grow">CV-03 · documento validado con SUNAT/RENIEC</span></h3><div id="v-cli"></div></div></div>
      <div class="subpanel" data-group="v" data-panel="nc"><div class="card"><h3><span class="dot"></span>Notas de crédito y débito <span class="grow">CV-06 · comunicadas a SUNAT</span></h3><div id="v-nc"></div></div></div>
      <div class="subpanel" data-group="v" data-panel="gr"><div class="card"><h3><span class="dot"></span>Guías de remisión electrónicas <span class="grow">CV-07 · traslado de bienes vendidos</span></h3><div id="v-gr"></div></div></div>
      <div class="subpanel" data-group="v" data-panel="reg"><div class="card"><h3><span class="dot"></span>Registro de ventas e ingresos · agosto 2026 <span class="grow">CV-11 · formato 14.1 del PLE</span></h3><div id="v-reg"></div>
        <div class="row-flex mt"><button class="btn sm" id="v-ple"><i class="fa-solid fa-file-export"></i> Generar archivo PLE 14.1</button></div></div></div>
      <div class="subpanel" data-group="v" data-panel="ana" id="v-p-ana"></div>`;
      el.querySelector('#v-pos').addEventListener('click', () => SIGA.showTab(el, 'v', 'pos'));
      el.querySelector('#v-nf').addEventListener('click', () => this.nuevaVenta());
      el.querySelector('#v-ple').addEventListener('click', () => { SIGA.log('Ventas', 'Generación de PLE', 'Registro de ventas 08/2026'); U.download('LE20161749126202608001401001111.txt', V.comprobantes.slice().reverse().map((c, i) => ['20260800', 'V' + String(i + 1).padStart(5, '0'), 'M1', '2026-' + c.fecha.slice(3, 5) + '-' + c.fecha.slice(0, 2), c.venc ? '2026-' + c.venc.slice(3, 5) + '-' + c.venc.slice(0, 2) : '', c.tipo, c.doc.split('-')[0], c.doc.split('-')[1], '', c.docCli.startsWith('RUC') ? '6' : '1', c.docCli.split(' ')[1], c.cli, '', (c.anulado ? 0 : c.grav).toFixed(2), '0.00', (c.anulado ? 0 : c.igv).toFixed(2), '0.00', (c.anulado ? 0 : c.exon).toFixed(2), '0.00', '0.00', '0.00', '0.00', '0.00', (c.anulado ? 0 : c.total).toFixed(2), 'PEN', '1.000', '', '', '', '', '', '', '', c.anulado ? '2' : '1'].join('|')).join('\r\n') + '\r\n'); });
      this.paintPOS(); this.paintComp(); this.paintCxc(); this.paintCat(); this.paintCli(); this.paintNC(); this.paintGR(); this.paintReg(); this.paintAna();
    },

    /* ---------- Punto de venta ---------- */
    paintPOS() {
      const U = SIGA.ui, host = document.getElementById('v-p-pos');
      const uns = ['Todas', ...new Set(V.productos.map(p => p.unidad))];
      const cli = V.clientes[this.cliI], ruc = cli.doc.startsWith('RUC'), desc = (V.listas.find(l => l[0] === this.lista) || [0, 0])[1];
      const t = calc(this.cart, desc);
      host.innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>Productos y servicios <span class="grow">toque para agregar</span></h3>
          <div class="chips mb" id="pos-u">${uns.map(u => `<span class="chipf ${u === this.fu ? 'on' : ''}" data-u="${u}">${u}</span>`).join('')}</div>
          <div class="grid cols-4" style="gap:8px">${V.productos.filter(p => this.fu === 'Todas' || p.unidad === this.fu).map(p => `<button class="mini-card" data-p="${p.cod}" style="text-align:left;cursor:pointer"><i class="fa-solid ${p.ico}" style="color:var(--primary-dark);font-size:16px"></i><div style="font-weight:700;font-size:11.5px;margin-top:6px;line-height:1.25">${p.desc}</div><div class="s">${p.um} · ${p.afect === 'Exonerado' ? 'exonerado' : '+ IGV'}</div><div class="v" style="font-size:14px">S/ ${p.pu.toFixed(2)}</div></button>`).join('')}</div></div>
        <div class="card"><h3><span class="dot"></span>Venta en curso <span class="grow">${ruc ? 'Factura' : 'Boleta'} electrónica ${V.series[ruc ? '01' : '03']}-${U.pad(V.correlativo[ruc ? '01' : '03'] + 1)}</span></h3>
          <div class="fgrid" style="grid-template-columns:1fr 1fr"><div class="fld fspan2"><label>Cliente</label><select id="pos-cli">${V.clientes.map((c, i) => `<option value="${i}" ${i === this.cliI ? 'selected' : ''}>${c.nom} · ${c.doc}</option>`).join('')}</select></div>
            <div class="fld"><label>Lista de precios</label><select id="pos-lis">${V.listas.map(l => `<option ${l[0] === this.lista ? 'selected' : ''}>${l[0]}</option>`).join('')}</select></div>
            <div class="fld"><label>Medio de pago</label><select id="pos-med">${['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito (factura)'].map(m => `<option ${m === this.medio ? 'selected' : ''}>${m}</option>`).join('')}</select></div></div>
          <div class="mt">${this.cart.length ? this.cart.map(([cod, q], i) => { const p = prod(cod); return `<div class="ef-row" style="align-items:center"><span style="flex:1">${p.desc}<div class="mini">S/ ${(p.pu * (1 - desc / 100)).toFixed(2)} × ${p.um}</div></span><span class="row-flex" style="gap:4px"><button class="iact" data-m="${i}"><i class="fa-solid fa-minus"></i></button><b style="min-width:26px;text-align:center">${q}</b><button class="iact" data-a="${i}"><i class="fa-solid fa-plus"></i></button></span><b style="min-width:80px;text-align:right">${U.money(q * p.pu * (1 - desc / 100), '')}</b></div>`; }).join('') : '<div class="empty"><div class="ic"><i class="fa-solid fa-cart-shopping"></i></div>Agregue productos</div>'}</div>
          <div class="mf-tot" style="width:100%"><div class="tl-row"><span>Op. gravada</span><span>${U.money(t.grav, '')}</span></div><div class="tl-row"><span>Op. exonerada</span><span>${U.money(t.exon, '')}</span></div><div class="tl-row"><span>IGV 18%</span><span>${U.money(t.igv, '')}</span></div><div class="tl-row g"><span>TOTAL S/</span><span>${U.money(t.total, '')}</span></div></div>
          <div class="mf-note">${U.montoLetras(t.total)}</div>
          ${this.medio === 'Crédito (factura)' && !ruc ? '<div class="note warn mt" style="margin:8px 0 0"><i class="fa-solid fa-ban"></i><div>La venta al crédito requiere un cliente con RUC y línea de crédito.</div></div>' : ''}
          <div class="row-flex mt"><button class="btn" id="pos-go" ${!this.cart.length ? 'disabled' : ''}><i class="fa-solid fa-paper-plane"></i> Cobrar y emitir a SUNAT</button><button class="btn ghost" id="pos-clr"><i class="fa-solid fa-trash"></i> Vaciar</button></div></div></div>`;
      host.querySelector('#pos-u').addEventListener('click', e => { const c = e.target.closest('[data-u]'); if (c) { this.fu = c.dataset.u; this.paintPOS(); } });
      host.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { const i = this.cart.findIndex(x => x[0] === b.dataset.p); if (i > -1) this.cart[i][1]++; else this.cart.push([b.dataset.p, 1]); this.paintPOS(); }));
      host.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { this.cart[+b.dataset.a][1]++; this.paintPOS(); }));
      host.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.m; this.cart[i][1]--; if (this.cart[i][1] <= 0) this.cart.splice(i, 1); this.paintPOS(); }));
      host.querySelector('#pos-cli').addEventListener('change', e => { this.cliI = +e.target.value; const c = V.clientes[this.cliI]; this.lista = c.tipo; this.paintPOS(); });
      host.querySelector('#pos-lis').addEventListener('change', e => { this.lista = e.target.value; this.paintPOS(); });
      host.querySelector('#pos-med').addEventListener('change', e => { this.medio = e.target.value; this.paintPOS(); });
      host.querySelector('#pos-clr').addEventListener('click', () => { this.cart = []; this.paintPOS(); });
      host.querySelector('#pos-go').addEventListener('click', () => {
        if (SIGA.ctx.user.readOnly) { U.toast('El rol OCI tiene acceso de solo consulta', 'err'); return; }
        const cred = this.medio === 'Crédito (factura)';
        if (cred && (!ruc || !cli.credito)) { U.toast('Venta al crédito no permitida para este cliente', 'err'); return; }
        const c = SIGA.ventas.emitir({ tipo: ruc ? '01' : '03', cli: cli.nom, docCli: cli.doc, op: cred ? 'Crédito' : 'Contado', items: this.cart.map(x => [x[0], x[1]]), desc, medio: cred ? 'Crédito' : this.medio, venc: cred ? '17/09/2026' : undefined });
        this.cart = [];
        U.toast(`${c.doc} emitido · ${U.money(c.total)} · enviado a SUNAT${cred ? ' · cuenta por cobrar registrada' : ' · recibo de ingreso RDR generado'}`);
        SIGA.refresh();
      });
    },

    /* ---------- Comprobantes ---------- */
    paintComp() {
      const U = SIGA.ui;
      document.getElementById('v-comp').innerHTML = U.grid({ id: 'ven-comp', title: 'comprobantes', export: 'comprobantes_electronicos', rows: V.comprobantes, record: cpeRec, pageSize: 12,
        filter: { label: 'Unidad', get: r => r.unidad },
        cols: [
        { k: 'doc', label: 'Comprobante', render: r => `<span class="code">${r.doc}</span><div class="mini">${r.tipo === '01' ? 'Factura' : 'Boleta'}</div>` }, { k: 'fecha', label: 'Fecha', cls: 'num', sv: r => r.fecha.slice(3, 5) + r.fecha.slice(0, 2) + r.doc },
        { k: 'cli', label: 'Cliente', render: r => U.esc(r.cli) + `<div class="mini">${r.docCli}</div>`, csv: r => r.cli }, { k: 'unidad', label: 'Unidad productiva', cls: 'mini' }, { k: 'op', label: 'Condición' },
        { k: 'total', label: 'Total', r: true, render: r => r.anulado ? `<s>${U.money(r.total)}</s>` : U.money(r.total) },
        { k: 'sunat', label: 'SUNAT', render: r => r.anulado ? U.tag('Anulado · NC', 't-gray') : U.tag(r.sunat, r.sunat === 'Aceptado' ? 't-green' : r.sunat === 'Enviando' ? 't-blue' : 't-amber') }
      ],
        rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [
          { icon: 'fa-paper-plane', title: 'Enviar a SUNAT', show: r => r.sunat === 'Pendiente' || r.sunat === 'En cola', fn: c => this.enviar(c) },
          { icon: 'fa-truck', title: 'Emitir guía de remisión', show: r => r.tipo === '01' && !V.guias.some(g => g.ref === r.doc) && !r.anulado, fn: c => this.guia(c) },
          { icon: 'fa-print', title: 'Representación impresa', fn: c => U.rec(cpeRec).imprimir(c) }
        ],
        tools: [{ icon: 'fa-plus', label: 'Nueva factura', primary: true, fn: () => this.nuevaVenta() }],
        bulk: [
          { icon: 'fa-paper-plane', label: 'Enviar pendientes a SUNAT', fn: rs => { const p = rs.filter(c => c.sunat === 'Pendiente' || c.sunat === 'En cola'); if (!p.length) { U.toast('No hay comprobantes pendientes en la selección', 'info'); return; } p.forEach(c => this.enviar(c)); } },
          { icon: 'fa-file-code', label: 'Descargar XML', fn: rs => rs.forEach(c => U.download('20161749126-' + c.tipo + '-' + c.doc + '.xml', xml(c), 'application/xml', true)) || U.toast(rs.length + ' XML descargados') },
          { icon: 'fa-print', label: 'Imprimir', fn: rs => U.preview('Comprobantes · ' + rs.length, rs.map(c => U.doc(cpeRec.print(c))).join('<div class="pg-break"></div>'), { file: 'comprobantes_lote' }) }
        ],
        foot: rs => { const v = rs.filter(c => !c.anulado); return `<tr><td colspan="6" class="r"><b>Total vendido (${v.length})</b></td><td class="r num"><b>${U.money(v.reduce((s, c) => s + c.total, 0))}</b></td><td colspan="2"></td></tr>`; } });
    },
    ver(c) {
      const U = SIGA.ui;
      const b = U.modal(`${c.tipo === '01' ? 'Factura' : 'Boleta de venta'} electrónica ${c.doc}`, `<div class="doc" style="position:static">
        <div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional Agraria de la Selva</b><span>RUC 20161749126 · ${c.unidad} · Carretera Central km 1.21, Tingo María</span></div></div><div class="doc-num"><div class="tp">${c.tipo === '01' ? 'Factura' : 'Boleta de venta'} electrónica</div><div class="nn">${c.doc}</div><div class="yr">${c.fecha}</div></div></div>
        <div class="doc-party"><div><div class="k">Adquirente</div><div class="v">${c.cli}</div></div><div><div class="k">Documento</div><div class="v">${c.docCli}</div></div><div><div class="k">Condición</div><div class="v">${c.op}${c.venc ? ' · vence ' + c.venc : ''}</div></div><div><div class="k">Moneda</div><div class="v">PEN · Soles</div></div></div>
        <table class="doc-tbl"><thead><tr><th>Código</th><th>Descripción</th><th>Und</th><th>Afect.</th><th class="r">Cant.</th><th class="r">V. unit.</th><th class="r">Importe</th></tr></thead><tbody>${c.items.map(([cod, q]) => { const p = prod(cod); return `<tr><td>${cod}</td><td>${p.desc}</td><td>${p.um}</td><td>${p.afect === 'Gravado' ? '10' : '20'}</td><td class="r">${q}</td><td class="r">${p.pu.toFixed(2)}</td><td class="r">${U.money(q * p.pu, '')}</td></tr>`; }).join('')}</tbody></table>
        <div class="doc-tot"><div class="box"><div class="tl-row"><span>Op. gravada</span><span>${U.money(c.grav, '')}</span></div><div class="tl-row"><span>Op. exonerada</span><span>${U.money(c.exon, '')}</span></div><div class="tl-row"><span>IGV 18%</span><span>${U.money(c.igv, '')}</span></div><div class="tl-row g"><span>TOTAL S/</span><span>${U.money(c.total, '')}</span></div></div></div>
        <div class="doc-letras">${U.montoLetras(c.total)}</div>
        <div class="row-flex" style="justify-content:space-between"><span class="mini row-flex">${U.qr('20161749126|' + c.tipo + '|' + c.doc + '|' + c.igv + '|' + c.total, 56)} Representación impresa del CPE · resumen ${c.doc.replace('-', '')}${c.total.toFixed(0)}</span>${U.tag('SUNAT: ' + c.sunat, c.sunat === 'Aceptado' ? 't-green' : 't-amber')}</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button>${c.sunat === 'Pendiente' || c.sunat === 'En cola' ? '<button class="btn" id="cv-env"><i class="fa-solid fa-paper-plane"></i> Enviar a SUNAT</button>' : ''}<button class="btn ghost" id="cv-xml"><i class="fa-solid fa-file-code"></i> XML</button><button class="btn ghost" id="cv-mail"><i class="fa-solid fa-envelope"></i> Enviar al cliente</button>${!c.anulado ? '<button class="btn danger" id="cv-nc"><i class="fa-solid fa-ban"></i> Nota de crédito</button>' : ''}<button class="btn sec" id="cv-pdf"><i class="fa-solid fa-print"></i> Imprimir / PDF</button>`, 'wide');
      b.querySelector('#cv-env')?.addEventListener('click', () => { U.closeModal(); this.enviar(c); });
      b.querySelector('#cv-xml').addEventListener('click', () => U.download('20161749126-' + c.tipo + '-' + c.doc + '.xml', xml(c), 'application/xml'));
      b.querySelector('#cv-mail').addEventListener('click', () => U.rec(cpeRec).correo(c));
      b.querySelector('#cv-pdf').addEventListener('click', () => U.rec(cpeRec).imprimir(c));
      b.querySelector('#cv-nc')?.addEventListener('click', () => U.rec(cpeRec).anular(c));
    },
    enviar(c) { c.sunat = 'Enviando'; SIGA.siaf(c.tipo === '01' ? 'Factura electrónica' : 'Boleta electrónica', c.doc + ' (reenvío)', c.total, 'SUNAT'); SIGA.log('Ventas', 'Envío a SUNAT', c.doc, 'Pendiente', 'Enviado'); SIGA.refresh(); setTimeout(() => { c.sunat = SIGA.data.integracion.caido.SUNAT ? 'En cola' : 'Aceptado'; if (SIGA.cur === 'ventas') SIGA.refresh(); SIGA.ui.toast(c.doc + (c.sunat === 'Aceptado' ? ' aceptado por SUNAT · CDR recibido' : ' en cola: SUNAT no responde')); }, 1500); },
    guia(c) {
      const U = SIGA.ui, cl = V.clientes.find(x => x.doc === c.docCli);
      const g = { doc: 'T001-' + U.pad(423 + V.guias.filter(x => x.nuevo).length), fecha: SIGA.ctx.hoy, ref: c.doc, partida: c.unidad + ' · Carretera Central km 1.21', llegada: cl ? cl.dir : 'Tingo María', transp: 'Vehículo institucional · placa EGA-512', estado: 'Aceptada', nuevo: true };
      V.guias.unshift(g); SIGA.siaf('Guía de remisión', g.doc, 0, 'SUNAT'); SIGA.log('Ventas', 'Emisión de guía de remisión', g.doc, '—', c.doc);
      U.toast('Guía de remisión ' + g.doc + ' emitida para ' + c.doc); SIGA.refresh();
    },
    anular(c) { SIGA.ui.rec(cpeRec).anular(c); },
    notaCredito(c, motivo) {
      const U = SIGA.ui;
      const n = { doc: (c.tipo === '01' ? 'FC01-' : 'BC01-') + U.pad(15 + V.notas.filter(x => x.nuevo).length), fecha: SIGA.ctx.hoy, ref: c.doc, cli: c.cli, motivo: motivo || 'Anulación de la operación', total: c.total, sunat: 'Aceptado', nuevo: true };
      V.notas.unshift(n); c.anulado = true;
      SIGA.siaf('Nota de crédito electrónica', n.doc, -c.total, 'SUNAT');
      SIGA.asiento('Nota de crédito ' + n.doc + ' · anula ' + c.doc, [['4301', c.grav + c.exon, 0], ...(c.igv ? [['2101', c.igv, 0]] : []), [c.op === 'Crédito' ? '1202' : '1101', 0, c.total]], 'Ventas');
      U.toast('Nota de crédito ' + n.doc + ' emitida y comunicada a SUNAT', 'err');
    },

    /* ---------- Cuentas por cobrar ---------- */
    paintCxc() {
      const U = SIGA.ui, rows = V.comprobantes.filter(c => c.op === 'Crédito' && !c.anulado);
      document.getElementById('v-p-cxc').innerHTML = `<div class="card"><h3><span class="dot"></span>Cuentas por cobrar de los centros de producción <span class="grow">CV-08 · C-18 · cobros parciales y alertas de vencimiento</span></h3><div id="cxc-t"></div></div>`;
      document.getElementById('cxc-t').innerHTML = U.grid({ id: 'ven-cxc', title: 'cuentas por cobrar', export: 'cuentas_por_cobrar', rows, record: cpeRec,
        filter: { label: 'Cliente', get: r => r.cli },
        cols: [
        { k: 'doc', label: 'Comprobante', render: r => `<span class="code">${r.doc}</span>` }, { k: 'cli', label: 'Cliente' }, { k: 'fecha', label: 'Emisión', sv: r => r.fecha.slice(3, 5) + r.fecha.slice(0, 2) },
        { k: 'venc', label: 'Vencimiento', sv: r => r.venc.slice(3, 5) + r.venc.slice(0, 2), render: r => r.venc + (vencido(r) && saldo(r) > 0.004 ? `<div class="mini" style="color:var(--danger)">vencida</div>` : '') },
        { k: 'total', label: 'Total', r: true, render: r => U.money(r.total, '') }, { k: 'cobrado', label: 'Cobrado', r: true, render: r => U.money(r.cobrado || 0, '') },
        { k: 's', label: 'Saldo', r: true, sv: saldo, render: r => `<b class="${saldo(r) > 0.004 ? 'saldo-neg' : 'saldo-pos'}">${U.money(saldo(r), '')}</b>` },
        { k: 'e', label: 'Estado', sv: r => saldo(r) <= 0.004 ? 0 : vencido(r) ? 2 : 1, render: r => saldo(r) <= 0.004 ? U.tag('Cancelada', 't-green') : vencido(r) ? U.tag('Vencida', 't-red') : (r.cobrado ? U.tag('Pago parcial', 't-blue') : U.tag('Por cobrar', 't-amber')) }
      ], rowCls: r => vencido(r) && saldo(r) > 0.004 ? 'row-bad' : '',
        actions: [{ icon: 'fa-hand-holding-dollar', title: 'Registrar cobranza', show: r => saldo(r) > 0.004, fn: c => this.cobrar(c) }],
        bulk: [{ icon: 'fa-envelope', label: 'Carta de cobranza', fn: rs => { const x = rs.filter(c => saldo(c) > 0.004); U.mail({ to: (V.clientes.find(c => c.nom === (x[0] || {}).cli) || {}).correo || 'cliente@correo.pe', asunto: 'Recordatorio de pago · UNAS', adj: 'estado_de_cuenta.pdf', cuerpo: 'Estimado cliente:\nA la fecha mantiene pendiente de pago: ' + x.map(c => c.doc + ' (' + U.money(saldo(c)) + ')').join(', ') + '.\nAgradeceremos regularizar a la cuenta RDR del Banco de la Nación.' }); } }],
        foot: rs => `<tr><td colspan="5" class="r"><b>Totales</b></td><td class="r num"><b>${U.money(rs.reduce((s, c) => s + c.total, 0), '')}</b></td><td class="r num"><b>${U.money(rs.reduce((s, c) => s + (c.cobrado || 0), 0), '')}</b></td><td class="r num"><b>${U.money(rs.reduce((s, c) => s + saldo(c), 0), '')}</b></td><td colspan="2"></td></tr>` });
    },
    cobrar(c) {
      const U = SIGA.ui;
      U.formModal('Registrar cobranza · ' + c.doc, [{ k: 'monto', label: 'Monto cobrado S/ (saldo ' + U.money(saldo(c), '') + ')', type: 'number', value: saldo(c).toFixed(2), span: 1 }, { k: 'medio', label: 'Medio', type: 'select', options: ['Transferencia', 'Depósito en cuenta', 'Efectivo'], span: 1 }], v => {
        const m = Math.min(parseFloat(v.monto) || 0, saldo(c)); if (m <= 0) { U.toast('Ingrese un monto válido', 'err'); return; }
        c.cobrado = (c.cobrado || 0) + m;
        SIGA.caja?.recibo({ concepto: 'Cobranza de ' + c.doc, unidad: c.unidad, pagador: c.cli, medio: v.medio, total: m, comprob: c.doc });
        SIGA.asiento('Cobranza ' + c.doc + ' · ' + c.cli, [['1101', m, 0], ['1202', 0, m]], 'Caja');
        SIGA.log('Ventas', 'Cobranza de cuenta por cobrar', c.doc, 'Saldo ' + U.money(saldo(c) + m), 'Saldo ' + U.money(saldo(c)));
        U.closeModal(); SIGA.refresh(); U.toast(`Cobranza de ${U.money(m)} registrada · recibo RDR emitido`);
      }, 'Registrar cobranza');
    },

    paintCat() {
      const U = SIGA.ui;
      const pRec = { mod: 'Ventas', tipo: 'Ficha de producto', key: r => r.cod, title: r => r.desc, cls: false, anuladoValor: 'Inactivo',
        fields: r => [['Código', r.cod], ['Descripción', r.desc, 1], ['Unidad productiva', r.unidad], ['Unidad de medida', r.um], ['Afectación IGV', r.afect], ['Valor unitario', U.money(r.pu)], ['Precio con IGV', U.money(r.pu * (r.afect === 'Gravado' ? 1.18 : 1))], ['Estado', r.estado || 'Activo']],
        body: r => { const q = V.comprobantes.filter(c => !c.anulado).reduce((s, c) => s + c.items.filter(i => i[0] === r.cod).reduce((a, i) => a + i[1], 0), 0); return `<div class="note teal mt"><i class="fa-solid fa-chart-line"></i><div>Vendido en agosto: <b>${U.int(q)} ${r.um}</b> · ${U.money(q * r.pu)} sin IGV</div></div>`; },
        edit: [{ k: 'desc', label: 'Descripción' }, { k: 'pu', label: 'Valor unitario sin IGV S/', type: 'number', span: 1 }, { k: 'afect', label: 'Afectación', type: 'select', options: ['Gravado', 'Exonerado'], span: 1 }],
        extra: r => [{ icon: 'fa-cart-plus', label: 'Agregar al punto de venta', fn: x => { const it = this.cart.find(c => c[0] === x.cod); if (it) it[1]++; else this.cart.push([x.cod, 1]); U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'v', 'pos'); U.toast(x.desc + ' agregado al carrito'); } }],
        anular: true, anularLabel: 'Desactivar producto', canAnular: r => (r.estado || 'Activo') === 'Activo' };
      document.getElementById('v-cat').innerHTML = U.grid({ id: 'ven-cat', title: 'catálogo', export: 'catalogo_precios', rows: V.productos, record: pRec, pageSize: 16, filter: { label: 'Unidad', get: r => r.unidad }, cols: [
        { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'desc', label: 'Producto / servicio', render: r => `<i class="fa-solid ${r.ico}" style="color:var(--primary-dark);width:18px"></i> ${r.desc}` + (r.estado === 'Inactivo' ? ' ' + U.tag('inactivo', 't-gray') : ''), csv: r => r.desc }, { k: 'unidad', label: 'Unidad productiva', cls: 'mini' },
        { k: 'um', label: 'UM' }, { k: 'afect', label: 'IGV', render: r => U.tag(r.afect, r.afect === 'Gravado' ? 't-blue' : 't-teal') },
        ...V.listas.map((l, i) => ({ k: 'l' + i, label: l[0].split(' ')[0], r: true, sv: r => r.pu, render: r => U.money(r.pu * (1 - l[1] / 100), '') }))
      ], rowCls: r => r.estado === 'Inactivo' ? 'row-void' : '',
        tools: [{ icon: 'fa-plus', label: 'Nuevo producto', primary: true, fn: () => U.formModal('<i class="fa-solid fa-plus"></i> Nuevo producto o servicio', [{ k: 'cod', label: 'Código', value: 'NEW-' + U.rid().toUpperCase().slice(0, 3), span: 1 }, { k: 'um', label: 'Unidad de medida', type: 'select', options: ['NIU', 'KGM', 'LTR', 'ZZ'], span: 1 }, { k: 'desc', label: 'Descripción' }, { k: 'unidad', label: 'Unidad productiva', type: 'select', options: [...new Set(V.productos.map(p => p.unidad))], span: 1 }, { k: 'afect', label: 'Afectación IGV', type: 'select', options: ['Gravado', 'Exonerado'], span: 1 }, { k: 'pu', label: 'Valor unitario sin IGV S/', type: 'number', value: 10, span: 1 }], v => { if (!v.desc.trim() || V.productos.some(p => p.cod === v.cod)) { U.toast('Descripción obligatoria y código único', 'err'); return; } V.productos.push({ cod: v.cod, desc: v.desc.trim(), um: v.um, pu: parseFloat(v.pu) || 0, afect: v.afect, unidad: v.unidad, ico: 'fa-box' }); SIGA.log('Ventas', 'Alta de producto', v.cod, '—', v.desc); U.closeModal(); SIGA.refresh(); U.toast('Producto ' + v.cod + ' incorporado al catálogo'); }, 'Registrar') }] });
    },
    paintCli() {
      const U = SIGA.ui;
      const cRec = { mod: 'Ventas', tipo: 'Estado de cuenta del cliente', key: r => r.doc, title: r => r.nom, cls: false, anuladoValor: 'Bloqueado',
        fields: r => [['Documento', r.doc], ['Cliente', r.nom, 1], ['Dirección', r.dir, 1], ['Correo', r.correo], ['Lista de precios', r.tipo], ['Línea de crédito', r.credito ? U.money(r.credito) : '—'], ['Deuda vigente', U.money(V.comprobantes.filter(c => c.docCli === r.doc && !c.anulado).reduce((s, c) => s + (c.op === 'Crédito' ? saldo(c) : 0), 0))], ['Validación', r.valida]],
        body: r => { const cs = V.comprobantes.filter(c => c.docCli === r.doc); return `<div class="lbl-s mt mb">Comprobantes del cliente (${cs.length})</div>` + U.table([{ k: 'doc', label: 'Comprobante', render: c => `<span class="code">${c.doc}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'op', label: 'Condición' }, { k: 'total', label: 'Total', r: true, render: c => U.money(c.total) }, { k: 's', label: 'Saldo', r: true, render: c => c.op === 'Crédito' ? U.money(saldo(c)) : '—' }], cs, { empty: 'Sin compras registradas', onRow: c => this.ver(c) }); },
        edit: [{ k: 'dir', label: 'Dirección' }, { k: 'correo', label: 'Correo', span: 1 }, { k: 'tipo', label: 'Lista de precios', type: 'select', options: V.listas.map(l => l[0]), span: 1 }, { k: 'credito', label: 'Línea de crédito S/', type: 'number', span: 1 }],
        extra: r => [{ icon: 'fa-cash-register', label: 'Vender a este cliente', fn: x => { this.cliI = V.clientes.indexOf(x); this.lista = x.tipo; U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'v', 'pos'); } }],
        print: r => ({ tipo: 'Estado de cuenta', num: r.doc, body: dtbl([['Comprobante'], ['Fecha'], ['Condición'], ['Total', 1], ['Saldo', 1]], V.comprobantes.filter(c => c.docCli === r.doc).map(c => [c.doc, c.fecha, c.op, U.money(c.total, ''), c.op === 'Crédito' ? U.money(saldo(c), '') : '—'])) }),
        mailTo: r => r.correo !== '—' ? r.correo : '',
        anular: true, anularLabel: 'Bloquear crédito', canAnular: r => r.credito > 0 && r.estado !== 'Bloqueado', onAnular: r => { r.credito0 = r.credito; r.credito = 0; } };
      document.getElementById('v-cli').innerHTML = U.grid({ id: 'ven-cli', title: 'clientes', export: 'padron_clientes', rows: V.clientes, record: cRec, filter: { label: 'Lista', get: r => r.tipo },
        cols: [{ k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'nom', label: 'Cliente', render: r => r.nom + `<div class="mini">${r.dir}</div>` }, { k: 'tipo', label: 'Lista de precios' }, { k: 'credito', label: 'Línea de crédito', r: true, render: r => r.credito ? U.money(r.credito) : (r.estado === 'Bloqueado' ? U.tag('bloqueado', 't-red') : '—') }, { k: 'valida', label: 'Validación', render: r => U.tag('✓ ' + r.valida, 't-green') }],
        tools: [{ icon: 'fa-user-plus', label: 'Nuevo cliente', primary: true, fn: () => U.formModal('<i class="fa-solid fa-user-plus"></i> Nuevo cliente', [{ k: 't', label: 'Tipo de documento', type: 'select', options: ['RUC', 'DNI'], span: 1 }, { k: 'n', label: 'Número', span: 1 }, { k: 'nom', label: 'Nombre o razón social' }, { k: 'dir', label: 'Dirección' }, { k: 'c', label: 'Correo', span: 1 }, { k: 'l', label: 'Lista de precios', type: 'select', options: V.listas.map(l => l[0]), span: 1 }], v => { const ok = v.t === 'RUC' ? /^(10|20)\d{9}$/.test(v.n.trim()) : /^\d{8}$/.test(v.n.trim()); if (!ok || !v.nom.trim()) { U.toast(v.t === 'RUC' ? 'RUC inválido (11 dígitos, inicia en 10 o 20)' : 'DNI inválido (8 dígitos)', 'err'); return; } V.clientes.push({ doc: v.t + ' ' + v.n.trim(), nom: v.nom.trim(), tipo: v.l, credito: 0, dir: v.dir || '—', correo: v.c || '—', valida: v.t === 'RUC' ? 'SUNAT · activo y habido' : 'RENIEC' }); SIGA.log('Ventas', 'Alta de cliente', v.t + ' ' + v.n, '—', v.nom); U.closeModal(); SIGA.refresh(); U.toast('Cliente validado con ' + (v.t === 'RUC' ? 'SUNAT' : 'RENIEC') + ' y registrado'); }, 'Validar y registrar') }] });
    },
    paintNC() {
      const U = SIGA.ui;
      const nRec = { mod: 'Ventas', tipo: 'Nota de crédito electrónica', key: r => r.doc, title: r => 'Nota de crédito ' + r.doc, cls: false, fields: r => [['Nota', r.doc], ['Fecha', r.fecha], ['Comprobante de referencia', r.ref], ['Cliente', r.cli], ['Motivo', U.esc(r.motivo), 1], ['Importe', U.money(r.total)], ['SUNAT', r.sunat]], extra: r => [{ icon: 'fa-receipt', label: 'Ver comprobante de referencia', fn: x => { const c = V.comprobantes.find(k => k.doc === x.ref); if (c) this.ver(c); else U.toast('El comprobante ' + x.ref + ' corresponde a un periodo anterior', 'info'); } }] };
      document.getElementById('v-nc').innerHTML = U.grid({ id: 'ven-nc', title: 'notas de crédito', export: 'notas_credito', rows: V.notas, record: nRec, search: false, cols: [{ k: 'doc', label: 'Nota', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'ref', label: 'Comprobante', render: r => `<span class="code">${r.ref}</span>` }, { k: 'cli', label: 'Cliente' }, { k: 'motivo', label: 'Motivo' }, { k: 'total', label: 'Importe', r: true, render: r => `<span class="saldo-neg">−${U.money(r.total, '')}</span>` }, { k: 'sunat', label: 'SUNAT', render: r => U.tag(r.sunat, 't-green') }], rowCls: r => r.nuevo ? 'row-new' : '' });
    },
    paintGR() {
      const U = SIGA.ui;
      const gRec = { mod: 'Ventas', tipo: 'Guía de remisión electrónica', key: r => r.doc, title: r => 'Guía ' + r.doc, cls: false, anuladoValor: 'De baja',
        fields: r => [['Guía', r.doc], ['Fecha de traslado', r.fecha], ['Comprobante', r.ref], ['Punto de partida', r.partida, 1], ['Punto de llegada', r.llegada, 1], ['Transporte', r.transp, 1], ['Motivo', '01 · Venta'], ['SUNAT', r.estado]],
        edit: [{ k: 'transp', label: 'Transporte / placa' }, { k: 'llegada', label: 'Punto de llegada' }], canEdit: r => r.estado !== 'De baja',
        anular: true, anularLabel: 'Dar de baja la guía', canAnular: r => r.estado === 'Aceptada',
        print: r => ({ tipo: 'Guía de remisión remitente', num: r.doc, body: (() => { const c = V.comprobantes.find(k => k.doc === r.ref); return c ? dtbl([['Código'], ['Descripción'], ['Und'], ['Cantidad', 1]], c.items.map(([cod, q]) => { const p = prod(cod); return [cod, p.desc, p.um, q]; })) : ''; })() }) };
      document.getElementById('v-gr').innerHTML = U.grid({ id: 'ven-gr', title: 'guías', export: 'guias_remision', rows: V.guias, record: gRec, search: false, cols: [{ k: 'doc', label: 'Guía', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'ref', label: 'Comprobante', render: r => `<span class="code">${r.ref}</span>` }, { k: 'partida', label: 'Punto de partida', cls: 'mini' }, { k: 'llegada', label: 'Punto de llegada', cls: 'mini' }, { k: 'transp', label: 'Transporte', cls: 'mini' }, { k: 'estado', label: 'SUNAT', render: r => U.tag(r.estado, r.estado === 'De baja' ? 't-gray' : 't-green') }], rowCls: r => r.nuevo ? 'row-new' : r.anulado ? 'row-void' : '' });
    },
    paintReg() {
      const U = SIGA.ui;
      document.getElementById('v-reg').innerHTML = U.grid({ id: 'ven-reg', title: 'registro de ventas', export: 'registro_ventas_14_1_agosto', rows: V.comprobantes, pageSize: 15, onRow: c => this.ver(c), cols: [
        { k: 'p', label: 'Periodo', render: () => '202608' }, { k: 'cuo', label: 'CUO', render: r => 'V' + r.doc.replace(/\D/g, '').slice(-5) }, { k: 'fecha', label: 'Fecha', sv: r => r.fecha.slice(3, 5) + r.fecha.slice(0, 2) },
        { k: 'tipo', label: 'Tipo', render: r => r.tipo }, { k: 'doc', label: 'Serie-número', render: r => `<span class="code">${r.doc}</span>` }, { k: 'docCli', label: 'Doc. cliente', cls: 'mini' },
        { k: 'grav', label: 'Base imponible', r: true, render: r => U.money(r.anulado ? 0 : r.grav, '') }, { k: 'exon', label: 'Exonerado', r: true, render: r => U.money(r.anulado ? 0 : r.exon, '') },
        { k: 'igv', label: 'IGV', r: true, render: r => U.money(r.anulado ? 0 : r.igv, '') }, { k: 'total', label: 'Total', r: true, render: r => U.money(r.anulado ? 0 : r.total, '') }
      ], foot: rs => { const v = rs.filter(c => !c.anulado), S = k => U.money(v.reduce((s, c) => s + c[k], 0), ''); return `<tr><td colspan="6" class="r"><b>Totales del periodo</b></td><td class="r num"><b>${S('grav')}</b></td><td class="r num"><b>${S('exon')}</b></td><td class="r num"><b>${S('igv')}</b></td><td class="r num"><b>${S('total')}</b></td></tr>`; } });
    },
    paintAna() {
      const U = SIGA.ui, un = {}, pr = {};
      V.comprobantes.filter(c => !c.anulado).forEach(c => { un[c.unidad] = (un[c.unidad] || 0) + c.total; c.items.forEach(([cod, q]) => { const p = prod(cod); pr[p.desc] = (pr[p.desc] || 0) + q * p.pu; }); });
      const ue = Object.entries(un).sort((a, b) => b[1] - a[1]), pe = Object.entries(pr).sort((a, b) => b[1] - a[1]).slice(0, 6);
      document.getElementById('v-p-ana').innerHTML = `<div class="split mb"><div class="card"><h3><span class="dot"></span>Ventas mensuales 2026 <span class="grow">miles de soles · CV-12</span></h3>${U.chart.line({ labels: V.mensual.labels, series: [{ name: 'Ventas', data: V.mensual.ventas }], fmt: v => 'S/ ' + v + ' mil', area: true, h: 220 })}</div>
        <div class="card"><h3><span class="dot"></span>Productos más vendidos · agosto</h3>${U.bars(pe.map((p, i) => [p[0], p[1] / pe[0][1] * 100, U.chart.PAL[0], U.money(p[1])]))}</div></div>
        <div class="card"><h3><span class="dot"></span>Ventas por unidad productiva · comprobantes de agosto</h3>${U.chart.cols({ labels: ue.map(u => u[0].replace('Laboratorio de análisis de suelos', 'Lab. suelos').replace('Servicios de maquinaria agrícola', 'Maquinaria').replace('Planta de café y cacao', 'Café y cacao')), series: [{ name: 'Ventas', data: ue.map(u => u[1]) }], fmt: v => U.money(v), axFmt: v => U.int(v), h: 220 })}</div>`;
    },

    /* ---------- Formulario completo (estándar SUNAT) ---------- */
    nuevaVenta() {
      const U = SIGA.ui, P = V.productos, seed = { cod: P[8].desc, cant: 1 };
      const items = rows => rows.map(r => [(P.find(p => p.desc === r.cod) || P[0]).cod, parseFloat(r.cant) || 0]).filter(x => x[1] > 0);
      U.bigForm({
        title: 'Nuevo comprobante electrónico · formulario completo', icon: 'fa-file-invoice-dollar',
        sections: [
          { title: 'Datos del comprobante', cols: 3, fields: [
            { k: 'tipo', label: 'Tipo de comprobante', type: 'select', options: ['01 · Factura', '03 · Boleta de venta'], span: 1, required: true },
            { k: 'serie', label: 'Serie', value: 'F001', span: 1, ro: true, hint: 'automática según tipo' },
            { k: 'fecha', label: 'Fecha de emisión', type: 'date', value: SIGA.ctx.hoyISO, span: 1 },
            { k: 'moneda', label: 'Moneda', type: 'select', options: ['PEN · Soles', 'USD · Dólares'], span: 1 },
            { k: 'op', label: 'Forma de pago', type: 'select', options: ['Contado', 'Crédito'], span: 1 },
            { k: 'lista', label: 'Lista de precios', type: 'select', options: V.listas.map(l => l[0]), span: 1 }
          ] },
          { title: 'Adquirente', cols: 3, fields: [
            { k: 'cli', label: 'Cliente del padrón', type: 'select', options: V.clientes.map(c => c.nom + ' · ' + c.doc), span: 3 },
            { k: 'correo', label: 'Correo para el envío del CPE', type: 'email', value: V.clientes[0].correo, span: 3 }
          ] }
        ],
        items: { title: 'Detalle', addLabel: 'Agregar ítem', seed, rows: [{ cod: P[8].desc, cant: 150 }],
          columns: [{ k: 'cod', label: 'Producto / servicio', type: 'select', options: P.map(p => p.desc), w: '52%' }, { k: 'cant', label: 'Cant.', type: 'num', r: true, w: '14%' }, { k: 'vu', label: 'V. unit.', calc: r => (P.find(p => p.desc === r.cod) || P[0]).pu, r: true, w: '16%' }, { k: 'imp', label: 'Importe', calc: r => (P.find(p => p.desc === r.cod) || P[0]).pu * (parseFloat(r.cant) || 0), r: true, w: '18%' }] },
        totals: (rows, v) => { const t = calc(items(rows), (V.listas.find(l => l[0] === v.lista) || [0, 0])[1]); return [{ label: 'Op. gravada', val: U.money(t.grav, '') }, { label: 'Op. exonerada', val: U.money(t.exon, '') }, { label: 'IGV (18%)', val: U.money(t.igv, '') }, { label: 'IMPORTE TOTAL S/', val: U.money(t.total, ''), big: true }]; },
        footNote: (rows, v) => U.montoLetras(calc(items(rows), (V.listas.find(l => l[0] === v.lista) || [0, 0])[1]).total),
        after: back => { const t = back.querySelector('[data-k="tipo"]'), s = back.querySelector('[data-k="serie"]'); t.addEventListener('change', () => { s.value = t.value.startsWith('01') ? 'F001' : 'B001'; }); },
        submitLabel: 'Emitir y enviar a SUNAT',
        onSubmit: (v, rows) => {
          const its = items(rows); if (!its.length) { U.toast('Agregue al menos un ítem', 'err'); return; }
          const cl = V.clientes.find(c => v.cli.endsWith(c.doc)) || V.clientes[4], tipo = v.tipo.slice(0, 2);
          if (tipo === '01' && !cl.doc.startsWith('RUC')) { U.toast('La factura requiere un adquirente con RUC', 'err'); return; }
          const c = SIGA.ventas.emitir({ tipo, cli: cl.nom, docCli: cl.doc, op: v.op, items: its, desc: (V.listas.find(l => l[0] === v.lista) || [0, 0])[1], medio: 'Transferencia', venc: v.op === 'Crédito' ? '17/09/2026' : undefined });
          U.closeModal(); SIGA.refresh(); SIGA.showTab(document.getElementById('mod-root'), 'v', 'comp'); U.toast(`${c.doc} emitido · ${U.money(c.total)} · enviado a SUNAT`);
        }
      });
    }
  });
})();
