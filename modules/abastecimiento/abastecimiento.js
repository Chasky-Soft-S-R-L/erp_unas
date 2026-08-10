SIGA.registerModule('abastecimiento', {
  title: 'Abastecimiento', icon: 'fa-boxes-stacked', group: 'Ejecución del gasto',
  render(el) {
    const d = SIGA.data.abastecimiento, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Abastecimiento</h1><p>Logística · generación de documentos, kárdex, stock y Plan Anual de Contrataciones</p></div>
        <button class="btn" id="goto-gen"><i class="fa-solid fa-file-circle-plus"></i> Generar documento</button></div>
      ${U.kpis([
        { lab: 'Órdenes emitidas', val: '2,015', sub: 'O/C y O/S · 2025' },
        { lab: 'Valor adquisiciones', val: 'S/ 31.6 M', sub: 'bienes y servicios' },
        { lab: 'Órdenes pendientes', val: '18', sub: 'por atender', chip: '18', chipType: 'warn' },
        { lab: 'Ítems en catálogo', val: '18,272', sub: 'SIGA' }
      ])}
      <div class="seg-tabs" data-group="a"><button class="on" data-tab="gen">Generar documento</button><button data-tab="ord">Órdenes</button><button data-tab="kar">Kárdex</button><button data-tab="stk">Stock</button><button data-tab="pac">Plan de Contrataciones</button></div>
      <div class="subpanel show" data-group="a" data-panel="gen" id="p-gen"></div>
      <div class="subpanel" data-group="a" data-panel="ord"><div class="card"><h3><span class="dot"></span>Órdenes emitidas <span class="grow">clic para ver</span></h3><div id="tord"></div></div></div>
      <div class="subpanel" data-group="a" data-panel="kar"><div class="card"><h3><span class="dot"></span>Kárdex valorizado <span class="grow">Alimentos · método PEPS</span></h3><div id="tkar"></div></div></div>
      <div class="subpanel" data-group="a" data-panel="stk"><div class="card"><h3><span class="dot"></span>Control de stock de almacén</h3><div id="tstk"></div></div></div>
      <div class="subpanel" data-group="a" data-panel="pac"><div class="card"><h3><span class="dot"></span>Plan Anual de Contrataciones (PAC) 2025</h3><div id="tpac"></div></div></div>`;

    document.getElementById('goto-gen').addEventListener('click', () => el.querySelector('.seg-tabs button[data-tab="gen"]').click());

    /* ---- Tablas ---- */
    const verOrden = o => U.detail('Detalle · ' + o.doc, [
      ['Documento', o.doc], ['Fecha', o.fecha], ['Proveedor', o.prov], ['Referencia', o.ref],
      ['Partida', `<span class="code">${o.part}</span>`], ['Importe', U.money(o.imp)], ['Estado', U.tag(o.estado, o.cls)]
    ], `<button class="btn ghost" data-close>Cerrar</button><button class="btn sec" onclick="SIGA.ui.toast('Imprimiendo ${o.doc}…')"><i class="fa-solid fa-print"></i> Imprimir</button>`);

    document.getElementById('tord').innerHTML = U.table([
      { k: 'doc', label: 'Documento', render: r => `<span class="code">${r.doc}</span>` }, { k: 'fecha', label: 'Fecha', cls: 'num' },
      { k: 'prov', label: 'Proveedor' }, { k: 'ref', label: 'Referencia' },
      { k: 'part', label: 'Partida', render: r => `<span class="code">${r.part}</span>` },
      { k: 'imp', label: 'Importe', r: true, render: r => `<span class="num">${U.money(r.imp)}</span>` },
      { k: 'estado', label: 'Estado', render: r => U.tag(r.estado, r.cls) }
    ], d.ordenes, {
      onRow: verOrden,
      actions: [{ icon: 'fa-eye', title: 'Ver', fn: verOrden }, { icon: 'fa-ban', title: 'Anular', cls: 'del', fn: o => U.confirm(`¿Anular <b>${o.doc}</b>?`, () => U.toast(o.doc + ' anulada', 'err'), 'Anular') }]
    });

    document.getElementById('tkar').innerHTML = U.table([
      { k: 0, label: 'Fecha', cls: 'num' }, { k: 1, label: 'Documento', render: r => `<span class="code">${r[1]}</span>` },
      { k: 2, label: 'Movimiento', render: r => U.tag(r[2].split(' · ')[0], r[7]) + ' ' + r[2].split(' · ')[1] },
      { k: 3, label: 'Entrada', r: true, render: r => r[3] || '—' }, { k: 4, label: 'Salida', r: true, render: r => r[4] || '—' },
      { k: 5, label: 'Saldo', r: true, render: r => `<b>${r[5]}</b>` }, { k: 6, label: 'Valor S/', r: true, render: r => U.money(r[6], '') }
    ], d.kardex);

    document.getElementById('tstk').innerHTML = U.table([
      { k: 0, label: 'Código', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Bien' },
      { k: 2, label: 'Stock', r: true }, { k: 3, label: 'Mín', r: true }, { k: 4, label: 'Máx', r: true },
      { k: 5, label: 'Valor', r: true, render: r => U.money(r[5], '') }, { k: 6, label: 'Estado', render: r => U.tag(r[6], r[7]) }
    ], d.stock, {
      actions: [{ icon: 'fa-truck-ramp-box', title: 'Generar reposición', fn: r => U.toast('Requerimiento de reposición para "' + r[1] + '" generado ✓') }]
    });

    document.getElementById('tpac').innerHTML = U.table([
      { k: 0, label: 'N° Proc.', render: r => `<span class="code">${r[0]}</span>` }, { k: 1, label: 'Objeto' },
      { k: 2, label: 'Tipo' }, { k: 3, label: 'Valor estimado', r: true, render: r => U.money(r[3]) },
      { k: 4, label: 'Trim.' }, { k: 5, label: 'Estado', render: r => U.tag(r[5], r[6]) }
    ], d.pac);

    this.buildGen(document.getElementById('p-gen'));
  },

  /* ================= GENERADOR DE DOCUMENTOS ================= */
  buildGen(host) {
    const d = SIGA.data.abastecimiento, U = SIGA.ui;
    const st = { tipo: 'oc', igv: true, items: JSON.parse(JSON.stringify(d.itemsSemilla)) };
    const fmt = n => (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const esViat = () => st.tipo === 'via';
    const esVal = () => st.tipo === 'oc' || st.tipo === 'os';
    const items = () => st.items[st.tipo] || [];

    host.innerHTML = `
      <div class="doc-type-pills" id="dtp">${Object.entries(d.docTipos).map(([k, v]) => `
        <div class="dtp ${k === 'oc' ? 'on' : ''}" data-t="${k}"><div class="ico"><i class="fa-solid ${v.ico}"></i></div><div class="t"><b>${v.t}</b><span>${v.s}</span></div></div>`).join('')}</div>
      <div class="aba-wrap">
        <div class="card">
          <h3><span class="dot"></span>Datos del documento <span class="grow" id="f-title">Orden de Compra</span></h3>
          <div class="fgrid">
            <div class="fld"><label>Número</label><input id="f-num" value="0895" readonly></div>
            <div class="fld"><label>Fecha</label><input id="f-fecha" type="date" value="2025-12-19"></div>
            <div class="fld fspan2" id="wrap-prov"><label id="lbl-prov">Proveedor</label><input id="f-prov" list="al-provs" value="${d.proveedores[0]}"><datalist id="al-provs">${d.proveedores.map(p => `<option>${p}</option>`).join('')}</datalist></div>
            <div class="fld" id="wrap-ruc"><label>RUC</label><input id="f-ruc" value="20489217701"></div>
            <div class="fld"><label>Fuente Fto.</label><select id="f-fuente"><option>00 · Recursos Ordinarios</option><option selected>09 · R. Direct. Recaudados</option><option>13 · Donaciones</option></select></div>
            <div class="fld"><label>Meta</label><input id="f-meta" value="0087"></div>
            <div class="fld"><label>Partida</label><input id="f-partida" value="2.3.1 5.1 2"></div>
            <div class="fld fspan2"><label>Referencia / concepto</label><input id="f-ref" value="Adquisición de insumos de laboratorio"></div>
          </div>
          <div id="items-block">
            <div style="margin-top:16px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px">Detalle</div>
            <table class="itbl"><thead><tr><th style="width:22%">Código</th><th>Descripción</th><th style="width:64px">Und.</th><th class="r" style="width:56px">Cant.</th><th class="r" style="width:76px">P.Unit.</th><th class="r" style="width:80px">Total</th><th style="width:26px"></th></tr></thead><tbody id="items-body"></tbody></table>
            <button class="addrow" id="btn-add"><i class="fa-solid fa-plus"></i> Agregar ítem</button>
          </div>
          <div id="viat-block" style="display:none"><div class="fgrid" style="margin-top:14px">
            <div class="fld fspan2"><label>Comisionado</label><input id="v-com" value="Docente investigador · Esc. Agronomía"></div>
            <div class="fld"><label>DNI</label><input id="v-dni" value="45xxxxxx"></div>
            <div class="fld"><label>Cargo</label><input id="v-cargo" value="Docente Asociado"></div>
            <div class="fld fspan2"><label>Destino</label><input id="v-dest" value="Lima · sustentación de proyecto de investigación"></div>
            <div class="fld"><label>N° de días</label><input id="v-dias" type="number" value="3"></div>
            <div class="fld"><label>Escala diaria (S/)</label><input id="v-esc" type="number" value="320"></div>
            <div class="fld fspan2"><label>Motivo</label><input id="v-mot" value="Participación en congreso científico nacional"></div>
          </div></div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;gap:14px;flex-wrap:wrap">
            <label class="switch"><input type="checkbox" id="f-igv" checked><span class="tr"></span> Afecto a IGV (18%)</label>
            <div style="min-width:200px;flex:1;max-width:260px">
              <div class="tot-line"><span class="mini">Subtotal</span><span class="num" id="t-sub">0.00</span></div>
              <div class="tot-line" id="igv-line"><span class="mini">IGV (18%)</span><span class="num" id="t-igv">0.00</span></div>
              <div class="tot-line grand"><span>TOTAL S/</span><span class="num" id="t-tot">0.00</span></div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            <button class="btn" id="btn-save"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
            <button class="btn sec" id="btn-print"><i class="fa-solid fa-file-arrow-down"></i> Extraer / Exportar PDF</button>
            <button class="btn ghost" id="btn-clear"><i class="fa-solid fa-eraser"></i> Limpiar</button>
          </div>
        </div>
        <div><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;color:var(--muted);font-size:11px"><i class="fa-solid fa-eye"></i> Vista previa · se actualiza en tiempo real</div><div class="doc" id="doc-preview"></div></div>
      </div>`;

    const $ = id => host.querySelector('#' + id);
    const renderRows = () => {
      const tb = $('items-body'); tb.innerHTML = '';
      items().forEach((it, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><input value="${it[0]}" data-i="${i}" data-f="0"></td><td><input value="${it[1]}" data-i="${i}" data-f="1"></td><td><input value="${it[2]}" data-i="${i}" data-f="2"></td><td class="r"><input value="${it[3]}" data-i="${i}" data-f="3"></td><td class="r"><input value="${esVal() ? fmt(it[4]) : '—'}" data-i="${i}" data-f="4" ${esVal() ? '' : 'disabled'}></td><td class="r num" style="padding-right:8px;font-weight:600">${esVal() ? fmt(it[3] * it[4]) : '—'}</td><td><button class="del" data-del="${i}"><i class="fa-solid fa-xmark"></i></button></td>`;
        tb.appendChild(tr);
      });
    };
    const calc = () => {
      let sub = 0; items().forEach(it => sub += (parseFloat(it[3]) || 0) * (parseFloat(it[4]) || 0));
      if (esViat()) sub = (parseFloat($('v-dias').value) || 0) * (parseFloat($('v-esc').value) || 0);
      const igv = st.igv ? sub * 0.18 : 0;
      $('t-sub').textContent = fmt(sub); $('t-igv').textContent = fmt(igv); $('t-tot').textContent = fmt(sub + igv);
      $('igv-line').style.opacity = st.igv ? 1 : .4;
      return { sub, igv, tot: sub + igv };
    };
    const letras = n => { const e = Math.floor(n), c = Math.round((n - e) * 100); return `SON: ${e.toLocaleString('es-PE')} con ${String(c).padStart(2, '0')}/100 soles`; };
    const renderDoc = () => {
      const t = calc(), tp = d.docTipos[st.tipo]; let party, filas, th;
      if (esViat()) {
        party = `<div><div class="k">Comisionado</div><div class="v">${$('v-com').value}</div></div><div><div class="k">DNI</div><div class="v">${$('v-dni').value}</div></div><div><div class="k">Cargo</div><div class="v">${$('v-cargo').value}</div></div><div><div class="k">N° días</div><div class="v">${$('v-dias').value}</div></div><div style="grid-column:span 2"><div class="k">Destino</div><div class="v">${$('v-dest').value}</div></div><div style="grid-column:span 2"><div class="k">Motivo</div><div class="v">${$('v-mot').value}</div></div>`;
        th = '<th>Concepto</th><th class="r">Cantidad</th><th class="r">Escala</th><th class="r">Importe</th>';
        filas = `<tr><td>Viáticos por comisión de servicios</td><td class="r">${$('v-dias').value} día(s)</td><td class="r">${fmt(parseFloat($('v-esc').value) || 0)}</td><td class="r">${fmt(t.sub)}</td></tr>`;
      } else {
        const lp = st.tipo === 'nea' ? 'Proveedor / origen' : (st.tipo === 'pec' ? 'Solicitante' : 'Proveedor');
        party = `<div><div class="k">${lp}</div><div class="v">${$('f-prov').value}</div></div><div><div class="k">RUC / Doc.</div><div class="v">${$('f-ruc').value}</div></div><div><div class="k">Fecha</div><div class="v">${$('f-fecha').value.split('-').reverse().join('/')}</div></div><div><div class="k">Fuente</div><div class="v">${$('f-fuente').value}</div></div><div style="grid-column:span 2"><div class="k">Referencia</div><div class="v">${$('f-ref').value}</div></div>`;
        th = esVal() ? '<th>Cód.</th><th>Descripción</th><th>Und</th><th class="r">Cant</th><th class="r">P.Unit</th><th class="r">Total</th>' : '<th>Cód.</th><th>Descripción</th><th>Und</th><th class="r">Cant</th>';
        filas = items().map(it => esVal() ? `<tr><td>${it[0]}</td><td>${it[1]}</td><td>${it[2]}</td><td class="r">${it[3]}</td><td class="r">${fmt(it[4])}</td><td class="r">${fmt(it[3] * it[4])}</td></tr>` : `<tr><td>${it[0]}</td><td>${it[1]}</td><td>${it[2]}</td><td class="r">${it[3]}</td></tr>`).join('');
      }
      const totBox = (esVal() || esViat()) ? `<div class="doc-tot"><div class="box"><div class="tl"><span>Subtotal</span><span>${fmt(t.sub)}</span></div>${st.igv ? `<div class="tl"><span>IGV (18%)</span><span>${fmt(t.igv)}</span></div>` : ''}<div class="tl g"><span>TOTAL S/</span><span>${fmt(t.tot)}</span></div></div></div><div class="doc-letras">${letras(t.tot)}</div>` : '';
      $('doc-preview').innerHTML = `
        <div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional</b><span>Oficina de Abastecimiento · Unidad de Logística</span></div></div>
          <div class="doc-num"><div class="tp">${tp.docTp}</div><div class="nn">N° ${tp.num}</div><div class="yr">Ejercicio 2025</div></div></div>
        <div class="doc-party">${party}</div>
        <div class="doc-chain"><b>Cadena:</b> Func. 22 › Prog. 048 › Meta ${$('f-meta').value} › Partida ${$('f-partida').value}</div>
        <table class="doc-tbl"><thead><tr>${th}</tr></thead><tbody>${filas}</tbody></table>${totBox}
        <div class="doc-sign"><div><b>Solicitante</b>Área usuaria</div><div><b>Jefe de Abastecimiento</b>V°B° Logística</div><div><b>Autorizado</b>Dir. Gral. de Administración</div></div>`;
    };
    const renderAll = () => { renderRows(); renderDoc(); };

    $('items-body').addEventListener('input', e => {
      const i = +e.target.dataset.i, f = +e.target.dataset.f; if (isNaN(i)) return;
      let v = e.target.value; if (f === 3 || f === 4) v = parseFloat(String(v).replace(/,/g, '')) || 0;
      items()[i][f] = v;
      if (esVal()) e.target.closest('tr').querySelector('td.num').textContent = fmt((parseFloat(items()[i][3]) || 0) * (parseFloat(items()[i][4]) || 0));
      calc(); renderDoc();
    });
    $('items-body').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { items().splice(+b.dataset.del, 1); renderAll(); } });
    $('btn-add').addEventListener('click', () => { items().push(['', '', 'UNIDAD', 1, 0]); renderAll(); });
    $('f-igv').addEventListener('change', e => { st.igv = e.target.checked; renderDoc(); });
    ['f-prov', 'f-ruc', 'f-fecha', 'f-fuente', 'f-meta', 'f-partida', 'f-ref', 'v-com', 'v-dni', 'v-cargo', 'v-dest', 'v-dias', 'v-esc', 'v-mot'].forEach(id => { const e = $(id); if (e) e.addEventListener('input', renderDoc); });
    host.querySelector('#dtp').addEventListener('click', e => {
      const p = e.target.closest('.dtp'); if (!p) return;
      host.querySelectorAll('.dtp').forEach(x => x.classList.remove('on')); p.classList.add('on');
      st.tipo = p.dataset.t; const tp = d.docTipos[st.tipo];
      $('f-title').textContent = tp.t; $('f-num').value = tp.num;
      $('items-block').style.display = esViat() ? 'none' : 'block';
      $('viat-block').style.display = esViat() ? 'block' : 'none';
      $('wrap-prov').style.display = esViat() ? 'none' : 'block'; $('wrap-ruc').style.display = esViat() ? 'none' : 'block';
      if (!esViat()) $('lbl-prov').textContent = st.tipo === 'nea' ? 'Proveedor / origen' : (st.tipo === 'pec' ? 'Solicitante' : 'Proveedor');
      renderAll();
    });
    $('btn-save').addEventListener('click', () => U.toast(d.docTipos[st.tipo].t + ' N° ' + d.docTipos[st.tipo].num + ' guardado ✓'));
    $('btn-print').addEventListener('click', () => window.print());
    $('btn-clear').addEventListener('click', () => { if (!esViat()) { items().length = 0; renderAll(); } });
    renderAll();
  }
});

/* estilos propios del generador (una sola vez) */
(function () {
  if (document.getElementById('aba-css')) return;
  const s = document.createElement('style'); s.id = 'aba-css';
  s.textContent = `
  .doc-type-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
  .dtp{display:flex;align-items:center;gap:9px;padding:11px 15px;border:1.5px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;transition:.15s;min-width:150px}
  .dtp:hover{border-color:var(--primary-light)}
  .dtp.on{border-color:var(--primary);background:linear-gradient(180deg,rgba(26,187,156,.08),transparent);box-shadow:0 2px 10px rgba(26,187,156,.15)}
  .dtp .ico{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;font-size:16px;background:var(--bg);color:var(--primary-dark)}
  .dtp.on .ico{background:var(--primary);color:#fff}
  .dtp .t b{font-size:12.5px;display:block}.dtp .t span{font-size:10.5px;color:var(--muted)}
  .aba-wrap{display:grid;grid-template-columns:1.05fr 1fr;gap:16px;align-items:start}
  .itbl{width:100%;border-collapse:collapse;margin-top:6px}
  .itbl th{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);font-weight:700;padding:6px;text-align:left;border-bottom:1px solid var(--line)}
  .itbl td{padding:4px;border-bottom:1px solid var(--line)}
  .itbl input{width:100%;border:1px solid transparent;border-radius:6px;padding:6px 7px;font-size:12px;font-family:inherit;background:var(--bg)}
  .itbl input:focus{outline:none;border-color:var(--primary);background:#fff}
  .itbl .r input{text-align:right}
  .itbl .del{color:var(--danger);cursor:pointer;font-size:14px;padding:4px 6px;border-radius:6px}.itbl .del:hover{background:rgba(239,68,68,.1)}
  .addrow{margin-top:10px;display:inline-flex;align-items:center;gap:7px;color:var(--primary-dark);font-weight:600;font-size:12px;cursor:pointer;padding:7px 12px;border:1.5px dashed var(--primary-light);border-radius:9px;background:rgba(26,187,156,.04)}
  .addrow:hover{background:rgba(26,187,156,.1)}
  .tot-line{display:flex;justify-content:space-between;padding:5px 0;font-size:12.5px}
  .tot-line.grand{font-size:16px;font-weight:800;color:var(--primary-dark);border-top:2px solid var(--line);margin-top:6px;padding-top:10px}
  .doc{background:#fff;border:1px solid var(--line);border-radius:12px;padding:26px;font-size:11.5px;box-shadow:0 6px 24px rgba(15,23,42,.06);position:sticky;top:0}
  .doc-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--sidebar);padding-bottom:14px;margin-bottom:14px;gap:14px}
  .doc-head .inst{display:flex;gap:11px;align-items:center}
  .doc-head .seal{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:grid;place-items:center;color:#fff;font-weight:800;font-size:20px;flex-shrink:0}
  .doc-head .inst b{font-size:13px;display:block;line-height:1.2}.doc-head .inst span{font-size:10px;color:var(--muted)}
  .doc-num{text-align:right;flex-shrink:0}.doc-num .tp{font-size:11px;font-weight:700;color:var(--sidebar);text-transform:uppercase;letter-spacing:.5px}
  .doc-num .nn{font-size:19px;font-weight:800;color:var(--primary-dark)}.doc-num .yr{font-size:10px;color:var(--muted)}
  .doc-party{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin-bottom:12px;font-size:11px}
  .doc-party .k{color:var(--muted);font-size:9.5px;text-transform:uppercase;letter-spacing:.4px}.doc-party .v{font-weight:600}
  .doc-chain{background:var(--bg);border-radius:8px;padding:8px 10px;font-size:10px;color:var(--muted);margin-bottom:12px}.doc-chain b{color:var(--secondary-dark)}
  table.doc-tbl{width:100%;border-collapse:collapse;margin-bottom:10px}
  table.doc-tbl th{background:var(--sidebar);color:#fff;font-size:9.5px;text-transform:uppercase;padding:6px 7px;text-align:left;font-weight:600}
  table.doc-tbl th.r{text-align:right}
  table.doc-tbl td{padding:6px 7px;border-bottom:1px solid var(--line);font-size:10.5px}table.doc-tbl td.r{text-align:right}
  .doc-tot{display:flex;justify-content:flex-end;margin-bottom:6px}.doc-tot .box{width:230px}
  .doc-tot .tl{display:flex;justify-content:space-between;padding:3px 0;font-size:11px}
  .doc-tot .tl.g{font-weight:800;color:var(--primary-dark);border-top:1.5px solid var(--line);margin-top:4px;padding-top:6px;font-size:13px}
  .doc-letras{font-size:10px;color:var(--muted);font-style:italic;margin-bottom:16px;padding:7px 10px;background:var(--bg);border-radius:7px}
  .doc-sign{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}
  .doc-sign div{text-align:center;border-top:1px solid var(--ink);padding-top:6px;font-size:9.5px;color:var(--muted)}.doc-sign div b{display:block;color:var(--ink);font-size:10px}
  @media print{body *{visibility:hidden!important}#doc-preview,#doc-preview *{visibility:visible!important}#doc-preview{position:absolute;left:0;top:0;width:100%;border:none;box-shadow:none;padding:0}}
  @media(max-width:980px){.aba-wrap{grid-template-columns:1fr}.doc{position:static}}
  @media(max-width:560px){.doc-party{grid-template-columns:1fr}.doc-sign{grid-template-columns:1fr;gap:22px}}`;
  document.head.appendChild(s);
})();
