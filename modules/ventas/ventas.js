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
  V.comprobantes.forEach(c => Object.assign(c, calc(c.items)));
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
        <div class="row-flex mt"><button class="btn sm" onclick="SIGA.log('Ventas','Generación de PLE','Registro de ventas 08/2026');SIGA.ui.toast('Archivo PLE del registro de ventas generado')"><i class="fa-solid fa-file-export"></i> Generar archivo PLE</button></div></div></div>
      <div class="subpanel" data-group="v" data-panel="ana" id="v-p-ana"></div>`;
      el.querySelector('#v-pos').addEventListener('click', () => SIGA.showTab(el, 'v', 'pos'));
      el.querySelector('#v-nf').addEventListener('click', () => this.nuevaVenta());
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
      document.getElementById('v-comp').innerHTML = U.table([
        { k: 'doc', label: 'Comprobante', render: r => `<span class="code">${r.doc}</span><div class="mini">${r.tipo === '01' ? 'Factura' : 'Boleta'}</div>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
        { k: 'cli', label: 'Cliente', render: r => r.cli + `<div class="mini">${r.docCli}</div>` }, { k: 'unidad', label: 'Unidad productiva', cls: 'mini' }, { k: 'op', label: 'Condición' },
        { k: 'total', label: 'Total', r: true, render: r => r.anulado ? `<s>${U.money(r.total)}</s>` : U.money(r.total) },
        { k: 'sunat', label: 'SUNAT', render: r => r.anulado ? U.tag('Anulado · NC', 't-gray') : U.tag(r.sunat, r.sunat === 'Aceptado' ? 't-green' : r.sunat === 'Enviando' ? 't-blue' : 't-amber') }
      ], V.comprobantes, {
        onRow: c => this.ver(c), rowCls: r => r.nuevo ? 'row-new' : '',
        actions: [
          { icon: 'fa-paper-plane', title: 'Enviar a SUNAT', show: r => r.sunat === 'Pendiente' || r.sunat === 'En cola', fn: c => this.enviar(c) },
          { icon: 'fa-truck', title: 'Emitir guía de remisión', show: r => r.tipo === '01' && !V.guias.some(g => g.ref === r.doc) && !r.anulado, fn: c => this.guia(c) },
          { icon: 'fa-ban', title: 'Anular con nota de crédito', cls: 'del', show: r => !r.anulado, fn: c => this.anular(c) }
        ]
      });
    },
    ver(c) {
      const U = SIGA.ui;
      const b = U.modal(`${c.tipo === '01' ? 'Factura' : 'Boleta de venta'} electrónica ${c.doc}`, `<div class="doc" style="position:static">
        <div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional Agraria de la Selva</b><span>RUC 20161749126 · ${c.unidad} · Carretera Central km 1.21, Tingo María</span></div></div><div class="doc-num"><div class="tp">${c.tipo === '01' ? 'Factura' : 'Boleta de venta'} electrónica</div><div class="nn">${c.doc}</div><div class="yr">${c.fecha}</div></div></div>
        <div class="doc-party"><div><div class="k">Adquirente</div><div class="v">${c.cli}</div></div><div><div class="k">Documento</div><div class="v">${c.docCli}</div></div><div><div class="k">Condición</div><div class="v">${c.op}${c.venc ? ' · vence ' + c.venc : ''}</div></div><div><div class="k">Moneda</div><div class="v">PEN · Soles</div></div></div>
        <table class="doc-tbl"><thead><tr><th>Código</th><th>Descripción</th><th>Und</th><th>Afect.</th><th class="r">Cant.</th><th class="r">V. unit.</th><th class="r">Importe</th></tr></thead><tbody>${c.items.map(([cod, q]) => { const p = prod(cod); return `<tr><td>${cod}</td><td>${p.desc}</td><td>${p.um}</td><td>${p.afect === 'Gravado' ? '10' : '20'}</td><td class="r">${q}</td><td class="r">${p.pu.toFixed(2)}</td><td class="r">${U.money(q * p.pu, '')}</td></tr>`; }).join('')}</tbody></table>
        <div class="doc-tot"><div class="box"><div class="tl-row"><span>Op. gravada</span><span>${U.money(c.grav, '')}</span></div><div class="tl-row"><span>Op. exonerada</span><span>${U.money(c.exon, '')}</span></div><div class="tl-row"><span>IGV 18%</span><span>${U.money(c.igv, '')}</span></div><div class="tl-row g"><span>TOTAL S/</span><span>${U.money(c.total, '')}</span></div></div></div>
        <div class="doc-letras">${U.montoLetras(c.total)}</div>
        <div class="row-flex" style="justify-content:space-between"><span class="mini"><i class="fa-solid fa-qrcode" style="font-size:28px;color:var(--ink)"></i> Representación impresa del CPE · hash ${U.rid()}${U.rid()}</span>${U.tag('SUNAT: ' + c.sunat, c.sunat === 'Aceptado' ? 't-green' : 't-amber')}</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button>${c.sunat === 'Pendiente' || c.sunat === 'En cola' ? '<button class="btn" id="cv-env"><i class="fa-solid fa-paper-plane"></i> Enviar a SUNAT</button>' : ''}<button class="btn sec" onclick="SIGA.ui.toast('XML, PDF y CDR descargados')"><i class="fa-solid fa-download"></i> XML / PDF / CDR</button>`, 'wide');
      b.querySelector('#cv-env')?.addEventListener('click', () => { U.closeModal(); this.enviar(c); });
    },
    enviar(c) { c.sunat = 'Enviando'; SIGA.siaf(c.tipo === '01' ? 'Factura electrónica' : 'Boleta electrónica', c.doc + ' (reenvío)', c.total, 'SUNAT'); SIGA.log('Ventas', 'Envío a SUNAT', c.doc, 'Pendiente', 'Enviado'); SIGA.refresh(); setTimeout(() => { c.sunat = SIGA.data.integracion.caido.SUNAT ? 'En cola' : 'Aceptado'; if (SIGA.cur === 'ventas') SIGA.refresh(); SIGA.ui.toast(c.doc + (c.sunat === 'Aceptado' ? ' aceptado por SUNAT · CDR recibido' : ' en cola: SUNAT no responde')); }, 1500); },
    guia(c) {
      const U = SIGA.ui, cl = V.clientes.find(x => x.doc === c.docCli);
      const g = { doc: 'T001-' + U.pad(423 + V.guias.filter(x => x.nuevo).length), fecha: SIGA.ctx.hoy, ref: c.doc, partida: c.unidad + ' · Carretera Central km 1.21', llegada: cl ? cl.dir : 'Tingo María', transp: 'Vehículo institucional · placa EGA-512', estado: 'Aceptada', nuevo: true };
      V.guias.unshift(g); SIGA.siaf('Guía de remisión', g.doc, 0, 'SUNAT'); SIGA.log('Ventas', 'Emisión de guía de remisión', g.doc, '—', c.doc);
      U.toast('Guía de remisión ' + g.doc + ' emitida para ' + c.doc); SIGA.refresh();
    },
    anular(c) {
      const U = SIGA.ui;
      U.confirm(`¿Anular <b>${c.doc}</b> (${U.money(c.total)})? Se emitirá una nota de crédito electrónica y se comunicará a SUNAT. No se elimina el comprobante.`, () => {
        const n = { doc: (c.tipo === '01' ? 'FC01-' : 'BC01-') + U.pad(15 + V.notas.length), fecha: SIGA.ctx.hoy, ref: c.doc, cli: c.cli, motivo: 'Anulación de la operación', total: c.total, sunat: 'Aceptado', nuevo: true };
        V.notas.unshift(n); c.anulado = true;
        SIGA.siaf('Nota de crédito electrónica', n.doc, -c.total, 'SUNAT');
        SIGA.asiento('Nota de crédito ' + n.doc + ' · anula ' + c.doc, [['4301', c.grav + c.exon, 0], ...(c.igv ? [['2101', c.igv, 0]] : []), [c.op === 'Crédito' ? '1202' : '1101', 0, c.total]], 'Ventas');
        SIGA.log('Ventas', 'Anulación con nota de crédito', c.doc, 'Aceptado', 'Anulado · ' + n.doc);
        U.toast('Nota de crédito ' + n.doc + ' emitida para ' + c.doc, 'err'); SIGA.refresh();
      }, 'Emitir nota de crédito');
    },

    /* ---------- Cuentas por cobrar ---------- */
    paintCxc() {
      const U = SIGA.ui, rows = V.comprobantes.filter(c => c.op === 'Crédito' && !c.anulado);
      document.getElementById('v-p-cxc').innerHTML = `<div class="card"><h3><span class="dot"></span>Cuentas por cobrar de los centros de producción <span class="grow">CV-08 · C-18 · cobros parciales y alertas de vencimiento</span></h3><div id="cxc-t"></div></div>`;
      document.getElementById('cxc-t').innerHTML = U.table([
        { k: 'doc', label: 'Comprobante', render: r => `<span class="code">${r.doc}</span>` }, { k: 'cli', label: 'Cliente' }, { k: 'fecha', label: 'Emisión' },
        { k: 'venc', label: 'Vencimiento', render: r => r.venc + (vencido(r) && saldo(r) > 0.004 ? `<div class="mini" style="color:var(--danger)">vencida</div>` : '') },
        { k: 'total', label: 'Total', r: true, render: r => U.money(r.total, '') }, { k: 'cobrado', label: 'Cobrado', r: true, render: r => U.money(r.cobrado || 0, '') },
        { k: 's', label: 'Saldo', r: true, render: r => `<b class="${saldo(r) > 0.004 ? 'saldo-neg' : 'saldo-pos'}">${U.money(saldo(r), '')}</b>` },
        { k: 'e', label: 'Estado', render: r => saldo(r) <= 0.004 ? U.tag('Cancelada', 't-green') : vencido(r) ? U.tag('Vencida', 't-red') : (r.cobrado ? U.tag('Pago parcial', 't-blue') : U.tag('Por cobrar', 't-amber')) }
      ], rows, { rowCls: r => vencido(r) && saldo(r) > 0.004 ? 'row-bad' : '', actions: [{ icon: 'fa-hand-holding-dollar', title: 'Registrar cobranza', show: r => saldo(r) > 0.004, fn: c => this.cobrar(c) }] });
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
      document.getElementById('v-cat').innerHTML = U.table([
        { k: 'cod', label: 'Código', render: r => `<span class="code">${r.cod}</span>` }, { k: 'desc', label: 'Producto / servicio', render: r => `<i class="fa-solid ${r.ico}" style="color:var(--primary-dark);width:18px"></i> ${r.desc}` }, { k: 'unidad', label: 'Unidad productiva', cls: 'mini' },
        { k: 'um', label: 'UM' }, { k: 'afect', label: 'IGV', render: r => U.tag(r.afect, r.afect === 'Gravado' ? 't-blue' : 't-teal') },
        ...V.listas.map((l, i) => ({ k: 'l' + i, label: l[0].split(' ')[0], r: true, render: r => U.money(r.pu * (1 - l[1] / 100), '') }))
      ], V.productos);
    },
    paintCli() {
      const U = SIGA.ui;
      document.getElementById('v-cli').innerHTML = U.table([{ k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'nom', label: 'Cliente', render: r => r.nom + `<div class="mini">${r.dir}</div>` }, { k: 'tipo', label: 'Lista de precios' }, { k: 'credito', label: 'Línea de crédito', r: true, render: r => r.credito ? U.money(r.credito) : '—' }, { k: 'valida', label: 'Validación', render: r => U.tag('✓ ' + r.valida, 't-green') }], V.clientes);
    },
    paintNC() { const U = SIGA.ui; document.getElementById('v-nc').innerHTML = U.table([{ k: 'doc', label: 'Nota', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'ref', label: 'Comprobante', render: r => `<span class="code">${r.ref}</span>` }, { k: 'cli', label: 'Cliente' }, { k: 'motivo', label: 'Motivo' }, { k: 'total', label: 'Importe', r: true, render: r => `<span class="saldo-neg">−${U.money(r.total, '')}</span>` }, { k: 'sunat', label: 'SUNAT', render: r => U.tag(r.sunat, 't-green') }], V.notas, { rowCls: r => r.nuevo ? 'row-new' : '' }); },
    paintGR() { const U = SIGA.ui; document.getElementById('v-gr').innerHTML = U.table([{ k: 'doc', label: 'Guía', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha' }, { k: 'ref', label: 'Comprobante', render: r => `<span class="code">${r.ref}</span>` }, { k: 'partida', label: 'Punto de partida', cls: 'mini' }, { k: 'llegada', label: 'Punto de llegada', cls: 'mini' }, { k: 'transp', label: 'Transporte', cls: 'mini' }, { k: 'estado', label: 'SUNAT', render: r => U.tag(r.estado, 't-green') }], V.guias, { rowCls: r => r.nuevo ? 'row-new' : '' }); },
    paintReg() {
      const U = SIGA.ui;
      document.getElementById('v-reg').innerHTML = U.table([
        { k: 'p', label: 'Periodo', render: () => '202608' }, { k: 'cuo', label: 'CUO', render: r => 'V' + r.doc.replace(/\D/g, '').slice(-5) }, { k: 'fecha', label: 'Fecha' },
        { k: 'tipo', label: 'Tipo', render: r => r.tipo }, { k: 'doc', label: 'Serie-número', render: r => `<span class="code">${r.doc}</span>` }, { k: 'docCli', label: 'Doc. cliente', cls: 'mini' },
        { k: 'grav', label: 'Base imponible', r: true, render: r => U.money(r.anulado ? 0 : r.grav, '') }, { k: 'exon', label: 'Exonerado', r: true, render: r => U.money(r.anulado ? 0 : r.exon, '') },
        { k: 'igv', label: 'IGV', r: true, render: r => U.money(r.anulado ? 0 : r.igv, '') }, { k: 'total', label: 'Total', r: true, render: r => U.money(r.anulado ? 0 : r.total, '') }
      ], V.comprobantes);
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
