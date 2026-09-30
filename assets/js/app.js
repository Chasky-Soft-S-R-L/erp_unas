/* ============================================================
   SIGA-U · Núcleo del sistema
   Registra módulos, arma el menú, enruta y provee la librería
   de UI compartida (modales, tablas con acciones, gráficos...).
   Servicios transversales (informe técnico, cap. IV · 4.9):
     · bitácora inmutable de auditoría       → SIGA.log()
     · cola de integración SIAF-SP / SUNAT   → SIGA.siaf()
     · asiento contable automático           → SIGA.asiento()
     · segregación de funciones por rol      → SIGA.can() / SIGA.sod()
     · alertas y búsqueda global
   Cada módulo vive en /modules/<id>/ con su data.js y su .js
   ============================================================ */
window.SIGA = (function () {
  const data = {};
  const modules = {};
  const order = [];
  let cur = null;

  /* ---------- Contexto institucional ---------- */
  const users = [
    { id: 'cquinto', nombre: 'C. Quinto', ini: 'CQ', rol: 'anppto', rolTx: 'Analista de Presupuesto', area: 'Planificación y Presupuesto' },
    { id: 'mrios', nombre: 'M. Ríos', ini: 'MR', rol: 'jefppto', rolTx: 'Jefe de Planificación y Presupuesto', area: 'Planificación y Presupuesto' },
    { id: 'jparedes', nombre: 'J. Paredes', ini: 'JP', rol: 'anaba', rolTx: 'Analista de Abastecimiento', area: 'Abastecimiento' },
    { id: 'atorres', nombre: 'A. Torres', ini: 'AT', rol: 'jefaba', rolTx: 'Jefe de Abastecimiento', area: 'Abastecimiento' },
    { id: 'lvargas', nombre: 'L. Vargas', ini: 'LV', rol: 'tesorero', rolTx: 'Tesorero', area: 'Tesorería' },
    { id: 'rsoto', nombre: 'R. Soto', ini: 'RS', rol: 'contador', rolTx: 'Contador', area: 'Contabilidad' },
    { id: 'phuaman', nombre: 'P. Huamán', ini: 'PH', rol: 'respcp', rolTx: 'Resp. Centro de Producción', area: 'Centros de Producción' },
    { id: 'emendoza', nombre: 'E. Mendoza', ini: 'EM', rol: 'dga', rolTx: 'Director General de Administración', area: 'DGA' },
    { id: 'oci', nombre: 'Auditor OCI', ini: 'OC', rol: 'oci', rolTx: 'Órgano de Control Institucional', area: 'OCI', readOnly: true }
  ];
  const ctx = {
    inst: 'Universidad Nacional Agraria de la Selva', sigla: 'UNAS', sede: 'Tingo María · Huánuco',
    ejercicio: 2026, mes: 'Agosto', hoy: '18/08/2026', hoyISO: '2026-08-18', hoyCorta: '18/08',
    ip: '10.20.4.37', user: users[0], users
  };

  // Facultades por acción (matriz de roles · informe Tabla 42)
  const perms = {
    'cert.aprobar': ['jefppto'],
    'req.aprobar': ['jefaba', 'dga'],
    'req.aprobar.alto': ['dga'],
    'cp.pagar': ['tesorero', 'dga'],
    'asiento.manual': ['contador'],
    'cierre': ['contador'],
    'dep.confirmar': ['tesorero', 'dga'],
    'baja.aprobar': ['dga'],
    'lic.aprobar': ['dga', 'jefppto', 'jefaba', 'tesorero', 'contador']
  };
  const can = acc => (perms[acc] || []).includes(ctx.user.rol);
  // Segregación de funciones: quien registra no aprueba
  function sod(registradoPor, accion) {
    if (ctx.user.readOnly) { toast('El rol OCI tiene acceso de solo consulta', 'err'); return false; }
    if (!can(accion)) {
      modal('<i class="fa-solid fa-user-lock"></i> Acción no autorizada para su rol',
        `<div class="note warn"><i class="fa-solid fa-shield-halved"></i><div>El rol <b>${ctx.user.rolTx}</b> no tiene la facultad <code>${accion}</code>. Según la matriz de roles, esta acción corresponde a: <b>${(perms[accion] || []).map(r => (users.find(u => u.rol === r) || {}).rolTx).join(' · ')}</b>.</div></div>
         <p class="mini">Cambie de usuario desde la esquina superior derecha para continuar la demostración. El intento quedó registrado en la bitácora.</p>`,
        `<button class="btn ghost" data-close>Entendido</button>`, 'narrow');
      log('Seguridad', 'Intento no autorizado', accion, '—', 'Denegado');
      return false;
    }
    if (registradoPor && registradoPor === ctx.user.nombre) {
      modal('<i class="fa-solid fa-scale-balanced"></i> Segregación de funciones',
        `<div class="note warn"><i class="fa-solid fa-ban"></i><div><b>${ctx.user.nombre}</b> registró esta operación y por tanto <b>no puede aprobarla</b>. El sistema impide que un mismo usuario registre y apruebe (Ley N.º 28716 · control interno).</div></div>`,
        `<button class="btn ghost" data-close>Entendido</button>`, 'narrow');
      log('Seguridad', 'Bloqueo por segregación', accion, registradoPor, 'Denegado');
      return false;
    }
    return true;
  }

  /* ---------- Helpers de formato ---------- */
  const money = (n, s = 'S/ ') => (n < 0 ? '−' : '') + s + Math.abs(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const int = n => (Number(n) || 0).toLocaleString('es-PE');
  const mill = (n, d = 1) => 'S/ ' + ((Number(n) || 0) / 1e6).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' M';
  const pct = (a, b, d = 1) => b ? (a / b * 100).toFixed(d) + '%' : '—';
  const tag = (txt, cls = 't-gray') => `<span class="tag ${cls}">${txt}</span>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dmy = iso => (iso || '').split('-').reverse().join('/');
  const rid = () => Math.random().toString(36).slice(2, 8);
  // Reloj de la demostración: jornada del 18/08/2026 desde las 09:05, avanza en tiempo real
  const t0 = Date.now();
  const clock = () => { const s = Math.floor((Date.now() - t0) / 1000) + 9 * 3600 + 5 * 60; return [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':'); };
  const now = () => ctx.hoy + ' ' + clock();
  const pad = (n, l = 6) => String(n).padStart(l, '0');

  /* ---------- KPIs ---------- */
  function kpis(list) {
    return `<div class="grid cols-4" style="margin-bottom:14px">${list.map(k => `
      <div class="card kpi">${k.chip ? `<div class="chip ${k.chipType || 'up'}">${k.chip}</div>` : ''}
        <div class="lab">${k.lab}</div><div class="val" ${k.color ? `style="color:${k.color}"` : ''}>${k.val}</div>
        ${k.sub ? `<div class="sub">${k.sub}</div>` : ''}</div>`).join('')}</div>`;
  }

  /* ---------- Barras horizontales ---------- */
  function bars(list) {
    return `<div class="bars">${list.map(b => `<div class="brow"><span>${b[0]}</span><div class="track"><i style="width:${Math.min(100, Math.max(0, b[1]))}%;background:${b[2]}"></i></div><span class="amt num">${b[3]}</span></div>`).join('')}</div>`;
  }
  // Medidor con severidad: fill según umbrales (ok ≥ hi, warn ≥ lo, danger < lo) o color fijo
  function meter(p, color, h = 8) {
    const c = color || (p >= 75 ? 'var(--ok)' : p >= 40 ? 'var(--warning)' : 'var(--danger)');
    return `<div class="meter" style="height:${h}px"><i style="width:${Math.min(100, Math.max(0, p))}%;background:${c}"></i></div>`;
  }
  // Semáforo de saldo (saldo disponible sobre PIM)
  function sem(saldo, pim) {
    if (saldo < 0) return tag('<i class="fa-solid fa-circle-exclamation"></i> Sobregiro', 't-red');
    const p = pim ? saldo / pim * 100 : 0;
    if (p < 5) return tag('● Saldo &lt; 5%', 't-red');
    if (p < 20) return tag('● Saldo 5–20%', 't-amber');
    return tag('● Saldo &gt; 20%', 't-green');
  }

  /* ---------- Línea de tiempo (trazabilidad) ---------- */
  function timeline(steps) {
    return `<div class="tl">${steps.map(s => `
      <div class="tl-i ${s.st || ''}"><div class="tl-dot"><i class="fa-solid ${s.st === 'done' ? 'fa-check' : s.st === 'cur' ? 'fa-spinner' : s.st === 'bad' ? 'fa-xmark' : 'fa-circle'}"></i></div>
        <div class="tl-c"><b>${s.t}</b>${s.doc ? ` <span class="code">${s.doc}</span>` : ''}<span>${s.sub || ''}</span></div>
        <div class="tl-t">${s.when || ''}${s.dur ? `<em>${s.dur}</em>` : ''}</div></div>`).join('')}</div>`;
  }

  /* ---------- Tabla con acciones por fila ---------- */
  // cols:[{k,label,r,render(row)}], rows:[obj], actions:[{icon,title,cls,fn(row,idx),show(row)}], onRow(row,idx)
  function table(cols, rows, opts = {}) {
    const acts = opts.actions || [];
    const head = cols.map(c => `<th class="${c.r ? 'r' : ''}">${c.label}</th>`).join('') + (acts.length ? '<th></th>' : '');
    const body = rows.length ? rows.map((row, i) => {
      const tds = cols.map(c => {
        const v = c.render ? c.render(row) : esc(row[c.k]);
        return `<td class="${c.r ? 'r num' : ''} ${c.cls || ''}">${v}</td>`;
      }).join('');
      const a = acts.length ? `<td><div class="rowacts">${acts.map((ac, ai) => (ac.show && !ac.show(row)) ? '' : `<button class="iact ${ac.cls || ''}" data-a="${ai}" data-i="${i}" title="${ac.title || ''}"><i class="fa-solid ${ac.icon}"></i></button>`).join('')}</div></td>` : '';
      return `<tr class="${opts.onRow ? 'clickable' : ''} ${opts.rowCls ? opts.rowCls(row) : ''}" data-i="${i}">${tds}${a}</tr>`;
    }).join('') : `<tr><td colspan="${cols.length + (acts.length ? 1 : 0)}" class="empty-row">${opts.empty || 'Sin registros'}</td></tr>`;
    const id = 'tb' + rid();
    setTimeout(() => {
      const el = document.getElementById(id); if (!el) return;
      el.querySelectorAll('.iact').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        acts[+b.dataset.a].fn(rows[+b.dataset.i], +b.dataset.i);
      }));
      if (opts.onRow) el.querySelectorAll('tbody tr[data-i]').forEach(tr => tr.addEventListener('click', () => rows[+tr.dataset.i] && opts.onRow(rows[+tr.dataset.i], +tr.dataset.i)));
    }, 0);
    return `<div class="tbl-wrap"><table id="${id}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${opts.foot ? `<tfoot>${opts.foot}</tfoot>` : ''}</table></div>`;
  }

  /* ---------- Modal ---------- */
  function modal(title, bodyHtml, footHtml, cls = '') {
    closeModal();
    const back = document.createElement('div');
    back.className = 'modal-back'; back.id = 'siga-modal';
    back.innerHTML = `<div class="modal ${cls}">
      <div class="modal-h"><h3>${title}</h3><button class="x" data-close><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-b">${bodyHtml}</div>
      ${footHtml ? `<div class="modal-f">${footHtml}</div>` : ''}</div>`;
    document.body.appendChild(back);
    back.addEventListener('click', e => { if (e.target === back || e.target.closest('[data-close]')) closeModal(); });
    return back;
  }
  function closeModal() { const m = document.getElementById('siga-modal'); if (m) m.remove(); }

  const kv = pairs => `<dl class="dl">${pairs.map(p => `<dt>${p[0]}</dt><dd>${p[1]}</dd>`).join('')}</dl>`;
  // Modal de detalle a partir de pares clave/valor
  function detail(title, pairs, footHtml, extra = '') {
    return modal(title, kv(pairs) + extra, footHtml || `<button class="btn ghost" data-close>Cerrar</button>`);
  }

  function readOnlyGuard() {
    if (ctx.user.readOnly) { toast('El rol OCI tiene acceso de solo consulta · operación no permitida', 'err'); log('Seguridad', 'Intento de registro (solo consulta)', cur || '', '—', 'Denegado'); return true; }
    return false;
  }

  // Modal con formulario. fields:[{k,label,type,value,options,span,ro}]. onSubmit(values)
  function formModal(title, fields, onSubmit, submitLabel = 'Guardar') {
    const body = `<div class="fgrid">${fields.map(f => {
      const span = f.span === 1 ? '' : 'fspan2'; const cls = `fld ${span}`;
      let input;
      if (f.type === 'select') input = `<select data-k="${f.k}">${(f.options || []).map(o => `<option ${o === f.value ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
      else if (f.type === 'textarea') input = `<textarea data-k="${f.k}" rows="3">${esc(f.value || '')}</textarea>`;
      else input = `<input data-k="${f.k}" type="${f.type || 'text'}" value="${esc(f.value == null ? '' : f.value)}" ${f.ro ? 'readonly' : ''}>`;
      return `<div class="${cls}"><label>${f.label}</label>${input}</div>`;
    }).join('')}</div>`;
    const foot = `<button class="btn ghost" data-close>Cancelar</button><button class="btn" id="siga-form-save"><i class="fa-solid fa-check"></i> ${submitLabel}</button>`;
    const back = modal(title, body, foot);
    back.querySelector('#siga-form-save').addEventListener('click', () => {
      if (readOnlyGuard()) return;
      const vals = {};
      back.querySelectorAll('[data-k]').forEach(el => vals[el.dataset.k] = el.value);
      onSubmit(vals);
    });
    return back;
  }

  // Confirmación
  function confirm(msg, onYes, yesLabel = 'Confirmar', cls = 'danger') {
    const back = modal('Confirmar acción', `<p style="font-size:13px">${msg}</p>`,
      `<button class="btn ghost" data-close>Cancelar</button><button class="btn ${cls}" id="siga-conf"><i class="fa-solid fa-check"></i> ${yesLabel}</button>`, 'narrow');
    back.querySelector('#siga-conf').addEventListener('click', () => { closeModal(); onYes(); });
  }

  /* ---------- Número a letras (para comprobantes) ---------- */
  function _cent(n) {
    const u = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    const dec = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const cen = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    if (n === 100) return 'CIEN';
    let s = ''; const c = Math.floor(n / 100), r = n % 100;
    if (c) s += cen[c] + ' ';
    if (r <= 29) s += r ? u[r] : '';
    else { const d = Math.floor(r / 10), un = r % 10; s += dec[d] + (un ? ' Y ' + u[un] : ''); }
    return s.trim();
  }
  function enLetras(num) {
    num = Math.floor(num); if (num === 0) return 'CERO';
    let s = ''; const mil = Math.floor(num / 1000000), miles = Math.floor((num % 1000000) / 1000), r = num % 1000;
    if (mil) s += (mil === 1 ? 'UN MILLÓN' : _cent(mil) + ' MILLONES') + ' ';
    if (miles) s += (miles === 1 ? 'MIL' : _cent(miles) + ' MIL') + ' ';
    if (r) s += _cent(r);
    return s.trim();
  }
  function montoLetras(n, moneda = 'SOLES') {
    n = Math.max(0, Number(n) || 0);
    const e = Math.floor(n), c = Math.round((n - e) * 100);
    return `SON: ${enLetras(e)} CON ${String(c).padStart(2, '0')}/100 ${moneda}`;
  }

  /* ---------- Motor de formularios profesional ----------
     cfg: { title, icon, size, sections:[{title,hint,cols,fields}],
            items:{title,columns:[{k,label,type,w,r,options,calc}],rows,addLabel,seed},
            totals(rows,vals)->[{label,val,big,cls}], footNote(rows,vals)->str,
            status(rows,vals)->html (panel de validación en vivo),
            after(back) (enganches adicionales), submitLabel, onSubmit(vals,rows) }
     field: {k,label,type,value,options,span,required,ro,hint,ph} */
  function bigForm(cfg) {
    const fieldHtml = f => {
      const span = f.span === 1 ? '' : f.span === 3 ? 'fspan3' : 'fspan2';
      const req = f.required ? '<i class="req">*</i>' : '';
      let input;
      if (f.type === 'select') input = `<select data-k="${f.k}" ${f.ro ? 'disabled' : ''}>${(f.options || []).map(o => `<option ${o === f.value ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
      else if (f.type === 'textarea') input = `<textarea data-k="${f.k}" rows="2" ${f.ro ? 'readonly' : ''} placeholder="${f.ph || ''}">${esc(f.value || '')}</textarea>`;
      else input = `<input data-k="${f.k}" type="${f.type || 'text'}" value="${esc(f.value == null ? '' : f.value)}" ${f.ro ? 'readonly' : ''} placeholder="${f.ph || ''}" ${f.required ? 'data-req="1"' : ''} ${f.type === 'number' ? 'step="any"' : ''}>`;
      return `<div class="fld ${span}"><label>${f.label} ${req}</label>${input}${f.hint ? `<span class="fhint">${f.hint}</span>` : ''}</div>`;
    };
    const secHtml = (cfg.sections || []).map(sec => `<div class="fsec">
      ${sec.title ? `<div class="fsec-h"><span>${sec.title}</span>${sec.hint ? `<em>${sec.hint}</em>` : ''}</div>` : ''}
      <div class="fgrid" style="grid-template-columns:repeat(${sec.cols || 2},1fr)">${sec.fields.map(fieldHtml).join('')}</div></div>`).join('');
    let itemsHtml = '';
    if (cfg.items) itemsHtml = `<div class="fsec"><div class="fsec-h"><span>${cfg.items.title || 'Detalle'}</span>${cfg.items.hint ? `<em>${cfg.items.hint}</em>` : ''}</div>
      <div style="overflow-x:auto"><table class="mitbl"><thead><tr>${cfg.items.columns.map(c => `<th class="${c.r ? 'r' : ''}" ${c.w ? `style="width:${c.w}"` : ''}>${c.label}</th>`).join('')}<th style="width:26px"></th></tr></thead><tbody id="mf-rows"></tbody></table></div>
      <button class="addrow" id="mf-add"><i class="fa-solid fa-plus"></i> ${cfg.items.addLabel || 'Agregar fila'}</button></div>`;
    const statusHtml = cfg.status ? `<div id="mf-status"></div>` : '';
    const totHtml = cfg.totals ? `<div class="mf-tot" id="mf-tot"></div>` : '';
    const noteHtml = cfg.footNote ? `<div class="mf-note" id="mf-note"></div>` : '';
    const foot = `<button class="btn ghost" data-close>Cancelar</button><button class="btn" id="mf-save"><i class="fa-solid fa-check"></i> ${cfg.submitLabel || 'Guardar'}</button>`;
    const back = modal((cfg.icon ? `<i class="fa-solid ${cfg.icon}"></i> ` : '') + cfg.title, (cfg.intro || '') + secHtml + itemsHtml + statusHtml + totHtml + noteHtml, foot, cfg.size || 'wide');

    const rows = cfg.items ? (cfg.items.rows ? JSON.parse(JSON.stringify(cfg.items.rows)) : []) : [];
    const getVals = () => { const v = {}; back.querySelectorAll('.modal-b [data-k]').forEach(el => v[el.dataset.k] = el.value); return v; };
    const calcRow = (row, col) => col.calc ? col.calc(row) : (row[col.k] || 0);
    const colDef = k => (cfg.items ? cfg.items.columns.find(c => c.k === k) : null) || {};
    const renderRows = () => {
      const tb = back.querySelector('#mf-rows'); if (!tb) return; tb.innerHTML = '';
      rows.forEach((row, ri) => {
        const tds = cfg.items.columns.map(c => {
          if (c.calc) return `<td class="r num" data-calc="${c.k}" style="font-weight:600;padding:6px 7px">${money(calcRow(row, c), '')}</td>`;
          if (c.type === 'select') return `<td><select data-ri="${ri}" data-ck="${c.k}">${(c.options || []).map(o => `<option ${o === row[c.k] ? 'selected' : ''}>${o}</option>`).join('')}</select></td>`;
          return `<td class="${c.r ? 'r' : ''}"><input data-ri="${ri}" data-ck="${c.k}" type="text" value="${esc(row[c.k] == null ? '' : row[c.k])}"></td>`;
        }).join('');
        const tr = document.createElement('tr');
        tr.innerHTML = tds + `<td><button class="del" data-del="${ri}"><i class="fa-solid fa-xmark"></i></button></td>`;
        tb.appendChild(tr);
      });
    };
    const recompute = () => {
      const v = getVals();
      if (cfg.totals) {
        const t = cfg.totals(rows, v);
        const box = back.querySelector('#mf-tot');
        if (box) box.innerHTML = t.map(x => `<div class="tl-row ${x.big ? 'g' : ''} ${x.cls || ''}"><span>${x.label}</span><span class="num">${x.val}</span></div>`).join('');
      }
      if (cfg.footNote) { const n = back.querySelector('#mf-note'); if (n) n.textContent = cfg.footNote(rows, v); }
      if (cfg.status) { const s = back.querySelector('#mf-status'); if (s) s.innerHTML = cfg.status(rows, v); }
    };
    if (cfg.items) {
      renderRows();
      const tb = back.querySelector('#mf-rows');
      const onEdit = e => {
        const ri = +e.target.dataset.ri, ck = e.target.dataset.ck; if (isNaN(ri) || !ck) return;
        let v = e.target.value; const cd = colDef(ck);
        if (cd.type === 'num' || cd.type === 'money') v = parseFloat(String(v).replace(/,/g, '')) || 0;
        rows[ri][ck] = v;
        if (cd.onPick) { cd.onPick(rows[ri], v); renderRows(); }
        const tr = back.querySelector(`[data-ri="${ri}"][data-ck="${ck}"]`)?.closest('tr');
        if (tr) cfg.items.columns.forEach(c => { if (c.calc) { const cell = tr.querySelector(`[data-calc="${c.k}"]`); if (cell) cell.textContent = money(calcRow(rows[ri], c), ''); } });
        recompute();
      };
      tb.addEventListener('input', onEdit);
      tb.addEventListener('change', e => { if (e.target.tagName === 'SELECT') onEdit(e); });
      tb.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { rows.splice(+b.dataset.del, 1); renderRows(); recompute(); } });
      back.querySelector('#mf-add').addEventListener('click', () => { rows.push(Object.assign({}, cfg.items.seed || {})); renderRows(); recompute(); });
    }
    back.querySelector('.modal-b').addEventListener('input', e => { if (e.target.dataset.k) recompute(); });
    back.querySelector('.modal-b').addEventListener('change', e => { if (e.target.dataset.k) recompute(); });
    back.querySelector('#mf-save').addEventListener('click', () => {
      if (readOnlyGuard()) return;
      let bad = null;
      back.querySelectorAll('[data-req="1"]').forEach(el => { if (!el.value.trim()) { el.classList.add('err'); if (!bad) bad = el; } else el.classList.remove('err'); });
      if (bad) { toast('Complete los campos obligatorios (*)', 'err'); bad.focus(); return; }
      cfg.onSubmit(getVals(), rows, back);
    });
    if (cfg.after) cfg.after(back, { rows, getVals, recompute, renderRows });
    recompute();
    return back;
  }

  /* ---------- Toast ---------- */
  function toast(msg, type = 'ok') {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div'); t.className = 'toast ' + (type === 'err' ? 'err' : type === 'info' ? 'info' : '');
    const ic = type === 'err' ? 'fa-circle-exclamation' : type === 'info' ? 'fa-circle-info' : 'fa-circle-check';
    t.innerHTML = `<i class="fa-solid ${ic}"></i> <span>${msg}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = 0; t.style.transform = 'translateX(30px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ============================================================
     GRÁFICOS SVG · línea y columnas, con tooltip de hover.
     Paleta validada (CVD): #14967D teal · #0D6EFD azul · #D97706 ámbar
     ============================================================ */
  const PAL = ['#14967D', '#0D6EFD', '#D97706', '#64748B'];
  const charts = {};
  let tipEl = null;
  function tip() { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'ch-tip'; document.body.appendChild(tipEl); } return tipEl; }
  function showTip(e, title, rows) {
    const t = tip(); t.innerHTML = '';
    const h = document.createElement('div'); h.className = 'ch-tip-h'; h.textContent = title; t.appendChild(h);
    rows.forEach(r => {
      const d = document.createElement('div'); d.className = 'ch-tip-r';
      const k = document.createElement('i'); k.style.background = r.color; d.appendChild(k);
      const v = document.createElement('b'); v.textContent = r.val; d.appendChild(v);
      const n = document.createElement('span'); n.textContent = r.name; d.appendChild(n);
      t.appendChild(d);
    });
    t.style.display = 'block';
    const w = t.offsetWidth, hgt = t.offsetHeight;
    let x = e.clientX + 14, y = e.clientY - hgt - 10;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    if (y < 8) y = e.clientY + 16;
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  function hideTip() { if (tipEl) tipEl.style.display = 'none'; }
  // Escala "limpia": paso redondo (1 · 2 · 2.5 · 5 × 10ⁿ) y máximo ajustado a 3–5 divisiones
  function niceMax(v) {
    if (!(v > 0)) return { max: 1, div: 4 };
    const x = v / 4, p = Math.pow(10, Math.floor(Math.log10(x))), n = x / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    const div = Math.max(1, Math.ceil(v / step - 1e-9));
    return { max: step * div, div };
  }
  function chartBox(draw, legend) {
    const id = 'ch' + rid(); charts[id] = draw;
    setTimeout(() => drawChart(id), 0);
    const leg = legend && legend.length > 1 ? `<div class="ch-leg">${legend.map(s => `<span><i class="${s.type === 'line' ? 'ln' : ''}" style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>` : '';
    return `<div class="chart" id="${id}"></div>${leg}`;
  }
  function drawChart(id) {
    const el = document.getElementById(id);
    if (!el) { delete charts[id]; return; }
    charts[id](el, Math.max(260, el.clientWidth || 600));
  }
  let rsT = null;
  window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => Object.keys(charts).forEach(drawChart), 160); });

  function axes(W, H, m, max, div, fmt) {
    let g = '';
    for (let i = 0; i <= div; i++) {
      const v = max / div * i, y = m.t + (H - m.t - m.b) * (1 - i / div);
      g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" class="ch-grid"/>`;
      g += `<text x="${m.l - 8}" y="${y + 3.5}" text-anchor="end" class="ch-ax">${fmt(v)}</text>`;
    }
    return g;
  }
  // cfg: {labels, series:[{name,color,data}], fmt, h, area, yMax}
  function line(cfg) {
    const series = cfg.series.map((s, i) => Object.assign({ color: PAL[i] }, s));
    return chartBox((el, W) => {
      const H = cfg.h || 230, m = { l: 52, r: 18, t: 14, b: 26 }, n = cfg.labels.length;
      const vals = series.flatMap(s => s.data.filter(v => v != null));
      const nm = niceMax(cfg.yMax || Math.max(...vals)), max = nm.max;
      const fmt = cfg.fmt || (v => int(v));
      const step = n > 1 ? (W - m.l - m.r) / (n - 1) : 0;
      const x = i => m.l + i * step, y = v => m.t + (H - m.t - m.b) * (1 - v / max);
      let s = axes(W, H, m, max, nm.div, cfg.axFmt || fmt);
      const every = Math.ceil(n / Math.max(2, Math.floor((W - m.l - m.r) / 46)));
      cfg.labels.forEach((l, i) => { if (i % every === 0 || i === n - 1) s += `<text x="${x(i)}" y="${H - 7}" text-anchor="middle" class="ch-ax">${esc(l)}</text>`; });
      series.forEach((se, si) => {
        const pts = se.data.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
        if (!pts.length) return;
        const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
        if (cfg.area && si === 0) s += `<path d="${d}L${pts[pts.length - 1][0]},${y(0)}L${pts[0][0]},${y(0)}Z" fill="${se.color}" opacity=".10"/>`;
        s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${se.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
        const lp = pts[pts.length - 1];
        s += `<circle cx="${lp[0]}" cy="${lp[1]}" r="4" fill="${se.color}" stroke="#fff" stroke-width="2"/>`;
      });
      s += `<line class="ch-cross" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" style="display:none"/>`;
      s += `<rect class="ch-hit" x="${m.l - step / 2}" y="${m.t}" width="${W - m.l - m.r + step}" height="${H - m.t - m.b}" fill="transparent"/>`;
      el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.title || 'Gráfico de líneas')}">${s}</svg>`;
      const svg = el.querySelector('svg'), cross = svg.querySelector('.ch-cross'), hit = svg.querySelector('.ch-hit');
      hit.addEventListener('pointermove', e => {
        const r = svg.getBoundingClientRect(); const px = e.clientX - r.left;
        const i = Math.max(0, Math.min(n - 1, Math.round((px - m.l) / (step || 1))));
        cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.display = '';
        const rows = series.filter(se => se.data[i] != null).map(se => ({ name: se.name, color: se.color, val: fmt(se.data[i]) }));
        if (rows.length) showTip(e, cfg.labels[i], rows); else hideTip();
      });
      hit.addEventListener('pointerleave', () => { cross.style.display = 'none'; hideTip(); });
    }, series.map(s => ({ name: s.name, color: s.color, type: 'line' })));
  }
  // cfg: {labels, series:[{name,color,data}], fmt, h}
  function cols(cfg) {
    const series = cfg.series.map((s, i) => Object.assign({ color: PAL[i] }, s));
    return chartBox((el, W) => {
      const H = cfg.h || 230, m = { l: 52, r: 12, t: 14, b: 30 }, n = cfg.labels.length, k = series.length;
      const vals = series.flatMap(s => s.data);
      const nm = niceMax(cfg.yMax || Math.max(...vals)), max = nm.max;
      const fmt = cfg.fmt || (v => int(v));
      const band = (W - m.l - m.r) / n;
      const bw = Math.max(4, Math.min(24, (band * 0.72 - 2 * (k - 1)) / k));
      const gw = bw * k + 2 * (k - 1);
      const y = v => m.t + (H - m.t - m.b) * (1 - v / max), y0 = y(0);
      let s = axes(W, H, m, max, nm.div, cfg.axFmt || fmt), hits = '';
      cfg.labels.forEach((l, i) => {
        const cx = m.l + band * i + band / 2;
        const lab = String(l);
        s += `<text x="${cx}" y="${H - 10}" text-anchor="middle" class="ch-ax">${esc(lab.length > 14 && band < 90 ? lab.slice(0, 12) + '…' : lab)}</text>`;
        series.forEach((se, si) => {
          const v = se.data[i] || 0, bx = cx - gw / 2 + si * (bw + 2), by = y(v), h = y0 - by, r = Math.min(4, h, bw / 2);
          if (h > 0) s += `<path class="ch-bar" data-i="${i}" data-s="${si}" d="M${bx},${y0}V${by + r}Q${bx},${by} ${bx + r},${by}H${bx + bw - r}Q${bx + bw},${by} ${bx + bw},${by + r}V${y0}Z" fill="${se.color}"/>`;
          hits += `<rect class="ch-bhit" data-i="${i}" data-s="${si}" x="${bx - 1}" y="${m.t}" width="${bw + 2}" height="${y0 - m.t}" fill="transparent"/>`;
        });
      });
      el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.title || 'Gráfico de columnas')}">${s}${hits}</svg>`;
      el.querySelectorAll('.ch-bhit').forEach(h => {
        h.addEventListener('pointermove', e => {
          const i = +h.dataset.i, si = +h.dataset.s;
          el.querySelectorAll('.ch-bar').forEach(b => b.classList.toggle('dim', !(+b.dataset.i === i && +b.dataset.s === si)));
          showTip(e, cfg.labels[i], series.map(se => ({ name: se.name, color: se.color, val: fmt(se.data[i] || 0) })));
        });
        h.addEventListener('pointerleave', () => { el.querySelectorAll('.ch-bar').forEach(b => b.classList.remove('dim')); hideTip(); });
      });
    }, series.map(s => ({ name: s.name, color: s.color })));
  }

  /* ============================================================
     SERVICIOS TRANSVERSALES
     ============================================================ */
  // Bitácora inmutable: usuario, fecha-hora, IP, valor anterior y posterior
  function log(mod, acc, ref, antes = '—', despues = '—') {
    const a = data.seguridad && data.seguridad.bitacora; if (!a) return;
    a.unshift({ ts: now(), user: ctx.user.nombre, rol: ctx.user.rolTx, ip: ctx.ip, mod, acc, ref: String(ref || ''), antes: String(antes), despues: String(despues), hash: rid() + rid() });
    updateBell();
  }

  // Cola de integración con SIAF-SP / SIGA-MEF / SUNAT (bandeja de salida transaccional)
  function siaf(tipo, ref, monto, sistema = 'SIAF-SP') {
    const q = data.integracion; if (!q) return null;
    const idem = (sistema + '|' + tipo + '|' + ref).replace(/\s+/g, '').toUpperCase();
    const prev = q.msgs.find(m => m.idem === idem);
    if (prev) { q.duplicados++; return prev; }
    const msg = { id: ++q.seq, ts: now(), sistema, tipo, ref, monto: +monto || 0, idem, estado: 'En cola', intentos: 0, resp: 'Registrado en bandeja de salida' };
    q.msgs.unshift(msg); dispatch(msg);
    return msg;
  }
  function dispatch(msg) {
    const q = data.integracion;
    if (q.caido[msg.sistema]) { msg.estado = 'En cola'; msg.resp = msg.sistema + ' no responde · reintento automático programado'; if (cur === 'integracion') refresh(); return; }
    msg.intentos++; msg.estado = 'Enviando';
    setTimeout(() => {
      if (q.caido[msg.sistema]) { msg.estado = 'En cola'; msg.resp = 'Sin respuesta · se reintentará'; }
      else {
        msg.estado = 'Confirmado';
        msg.resp = msg.sistema === 'SUNAT' ? 'CDR 0 · La factura/boleta ha sido aceptada' : msg.sistema === 'Banco' ? 'Archivo de abono recibido · lote ' + pad(q.lote++, 5) : 'Expediente SIAF ' + ctx.ejercicio + '-' + pad(q.exp++, 7);
      }
      if (cur === 'integracion') refresh();
    }, 700 + Math.random() * 700);
  }
  function drain() {
    const q = data.integracion; let k = 0;
    q.msgs.filter(m => m.estado === 'En cola' && !q.caido[m.sistema]).reverse().forEach(m => { setTimeout(() => dispatch(m), 400 * (k++)); });
    return k;
  }

  // Asiento contable automático según la dinámica configurada
  function asiento(glosa, lineas, origen) {
    const c = data.contabilidad; if (!c) return null;
    const td = lineas.reduce((s, l) => s + (+l[1] || 0), 0), th = lineas.reduce((s, l) => s + (+l[2] || 0), 0);
    if (Math.abs(td - th) > 0.005) { console.warn('Asiento descuadrado', glosa, td, th); return null; }
    const num = 'A-' + (++c.seq);
    c.asientos.unshift({ num, fecha: ctx.hoyCorta, glosa, origen, auto: true, user: 'SIGA-U (automático)', lineas: lineas.map(l => ({ cta: l[0], debe: +l[1] || 0, haber: +l[2] || 0 })) });
    return num;
  }

  /* ---------- Alertas y notificaciones (4.9.5) ---------- */
  function alerts() {
    const out = [];
    order.forEach(id => { const m = modules[id]; if (m.alerts) { try { m.alerts().forEach(a => out.push(Object.assign({ mod: id }, a))); } catch (e) { console.error(e); } } });
    const w = { crit: 0, warn: 1, info: 2 };
    return out.sort((a, b) => w[a.lvl] - w[b.lvl]);
  }
  function updateBell() {
    const c = document.querySelector('#bell .cnt'); if (!c) return;
    const n = alerts().filter(a => a.lvl !== 'info').length;
    c.textContent = n; c.style.display = n ? '' : 'none';
  }
  function togglePanel(id, html) {
    const ex = document.getElementById(id);
    document.querySelectorAll('.drop').forEach(d => d.remove());
    if (ex) return null;
    const p = document.createElement('div'); p.className = 'drop'; p.id = id; p.innerHTML = html;
    document.querySelector('.topbar').appendChild(p);
    return p;
  }
  function openAlerts() {
    const list = alerts();
    const ic = { crit: 'fa-circle-exclamation', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const p = togglePanel('dp-alerts', `<div class="drop-h"><b>Alertas del sistema</b><span class="mini">${list.length} activas</span></div>
      <div class="drop-b">${list.map((a, i) => `<div class="al-i ${a.lvl}" data-i="${i}"><i class="fa-solid ${a.icon || ic[a.lvl]}"></i><div><b>${a.t}</b><span>${a.d || ''}</span></div><em>${modules[a.mod].title}</em></div>`).join('') || '<div class="mini" style="padding:16px">Sin alertas</div>'}</div>`);
    if (!p) return;
    p.querySelectorAll('.al-i').forEach(el => el.addEventListener('click', () => { const a = list[+el.dataset.i]; p.remove(); go(a.mod); if (a.fn) setTimeout(a.fn, 50); }));
  }
  function openUsers() {
    const p = togglePanel('dp-users', `<div class="drop-h"><b>Cambiar de usuario</b><span class="mini">demostración de roles</span></div>
      <div class="drop-b">${users.map(u => `<div class="us-i ${u.id === ctx.user.id ? 'on' : ''}" data-u="${u.id}"><div class="avatar sm">${u.ini}</div><div><b>${u.nombre}</b><span>${u.rolTx}</span></div>${u.readOnly ? tag('Solo consulta', 't-amber') : ''}</div>`).join('')}</div>
      <div class="drop-f mini"><i class="fa-solid fa-shield-halved"></i> Autenticación con 2.º factor para perfiles que aprueban y giran</div>`);
    if (!p) return;
    p.querySelectorAll('.us-i').forEach(el => el.addEventListener('click', () => {
      const u = users.find(x => x.id === el.dataset.u); p.remove();
      if (u.id === ctx.user.id) return;
      log('Seguridad', 'Cierre de sesión', ctx.user.nombre);
      ctx.user = u; paintUser();
      log('Seguridad', 'Inicio de sesión (2FA verificado)', u.nombre, '—', u.rolTx);
      toast(`Sesión iniciada · <b>${u.nombre}</b> · ${u.rolTx}`, 'info');
      refresh();
    }));
  }
  function paintUser() {
    const u = ctx.user, el = document.querySelector('.topbar .user'); if (!el) return;
    el.innerHTML = `<div class="avatar">${u.ini}</div><div class="meta"><b>${u.nombre}</b><br><span>${u.rolTx}</span></div><i class="fa-solid fa-chevron-down" style="font-size:10px;color:var(--muted)"></i>`;
  }
  // Búsqueda global: cada módulo puede exponer search(q) → [{t, d, fn}]
  function openSearch(q) {
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) { document.getElementById('dp-search')?.remove(); return; }
    const res = [];
    order.forEach(id => { const m = modules[id]; if (m.search) { try { m.search(q).slice(0, 6).forEach(r => res.push(Object.assign({ mod: id }, r))); } catch (e) { console.error(e); } } });
    document.querySelectorAll('.drop').forEach(d => d.remove());
    const p = document.createElement('div'); p.className = 'drop search'; p.id = 'dp-search';
    p.innerHTML = `<div class="drop-h"><b>Resultados</b><span class="mini">${res.length}</span></div><div class="drop-b">${res.map((r, i) => `<div class="al-i info" data-i="${i}"><i class="fa-solid ${modules[r.mod].icon}"></i><div><b>${r.t}</b><span>${r.d || ''}</span></div><em>${modules[r.mod].title}</em></div>`).join('') || '<div class="mini" style="padding:16px">Sin coincidencias. Pruebe con un N° de expediente, certificación, orden, comprobante o RUC.</div>'}</div>`;
    document.querySelector('.topbar').appendChild(p);
    p.querySelectorAll('.al-i').forEach(el => el.addEventListener('click', () => { const r = res[+el.dataset.i]; p.remove(); document.getElementById('gsearch').value = ''; go(r.mod); if (r.fn) setTimeout(r.fn, 60); }));
  }

  /* ---------- Sub-pestañas (dentro de un módulo) ---------- */
  function bindTabs(root) {
    root.querySelectorAll('.seg-tabs[data-group]').forEach(tabs => {
      tabs.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b || !b.dataset.tab) return;
        showTab(root, tabs.dataset.group, b.dataset.tab);
      });
    });
  }
  function showTab(root, g, t) {
    const tabs = root.querySelector(`.seg-tabs[data-group="${g}"]`); if (!tabs) return;
    tabs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.tab === t));
    root.querySelectorAll('.subpanel[data-group="' + g + '"]').forEach(p => p.classList.toggle('show', p.dataset.panel === t));
    Object.keys(charts).forEach(drawChart);
  }

  /* ---------- Registro / navegación ---------- */
  function registerModule(id, def) { modules[id] = def; if (!order.includes(id)) order.push(id); }

  function buildSidebar() {
    const nav = document.querySelector('.sidebar');
    const groups = [];
    order.forEach(id => {
      const m = modules[id]; const g = m.group || 'General';
      let grp = groups.find(x => x.name === g); if (!grp) { grp = { name: g, items: [] }; groups.push(grp); }
      grp.items.push({ id, ...m });
    });
    nav.innerHTML = groups.map(g => `<div class="nav-group-label">${g.name}</div>` +
      g.items.map(it => `<div class="nav-item" data-mod="${it.id}"><span class="ic"><i class="fa-solid ${it.icon}"></i></span><span class="tx">${it.title}</span>${it.badge ? `<span class="badge ${it.badgeHot ? 'hot' : ''} ${it.badgeNew ? 'new' : ''}">${it.badge}</span>` : ''}</div>`).join('')
    ).join('') + `<div class="side-foot"><b>${ctx.sigla}</b> · ${ctx.sede}<br>PostgreSQL · Laravel · Vue · Docker</div>`;
    nav.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => { go(n.dataset.mod); closeSidebar(); }));
  }

  function mount(tabsState) {
    const m = modules[cur];
    const root = document.getElementById('mod-root');
    m.render(root);
    bindTabs(root);
    if (tabsState) Object.entries(tabsState).forEach(([g, t]) => showTab(root, g, t));
    if (m.init) m.init(root);
    updateBell();
  }
  function go(id, tab) {
    const m = modules[id]; if (!m) return;
    cur = id; hideTip();
    document.querySelectorAll('.drop').forEach(d => d.remove());
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.mod === id));
    const main = document.querySelector('.main');
    main.innerHTML = `<div class="fade" id="mod-root"></div>`;
    mount(tab ? tab : null);
    document.querySelector('#crumb').innerHTML = `<b>${m.group || ''}</b> · ${m.title}`;
    if (main.scrollTo) main.scrollTo(0, 0); else main.scrollTop = 0;
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }
  // Re-renderiza el módulo actual conservando pestañas activas y scroll
  function refresh() {
    const root = document.getElementById('mod-root'); if (!root || !cur) return;
    const st = {};
    root.querySelectorAll('.seg-tabs[data-group]').forEach(t => { const b = t.querySelector('button.on'); if (b && b.dataset.tab) st[t.dataset.group] = b.dataset.tab; });
    const main = document.querySelector('.main'), sc = main.scrollTop;
    mount(st);
    main.scrollTop = sc;
  }

  /* ---------- Sidebar móvil ---------- */
  function openSidebar() { document.querySelector('.sidebar').classList.add('open'); document.querySelector('.scrim')?.classList.add('show'); }
  function closeSidebar() { document.querySelector('.sidebar').classList.remove('open'); document.querySelector('.scrim')?.classList.remove('show'); }

  function boot() {
    buildSidebar(); paintUser();
    document.querySelector('.menu-toggle')?.addEventListener('click', openSidebar);
    document.querySelector('.scrim')?.addEventListener('click', closeSidebar);
    document.getElementById('bell')?.addEventListener('click', e => { e.stopPropagation(); openAlerts(); });
    document.querySelector('.topbar .user')?.addEventListener('click', e => { e.stopPropagation(); openUsers(); });
    const gs = document.getElementById('gsearch');
    gs?.addEventListener('input', () => openSearch(gs.value));
    gs?.addEventListener('keydown', e => { if (e.key === 'Enter') { const f = document.querySelector('#dp-search .al-i'); if (f) f.click(); } });
    document.addEventListener('click', e => { if (!e.target.closest('.drop') && !e.target.closest('#gsearch')) document.querySelectorAll('.drop').forEach(d => d.remove()); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeSidebar(); document.querySelectorAll('.drop').forEach(d => d.remove()); } });
    window.addEventListener('hashchange', () => { const h = location.hash.replace('#', ''); if (modules[h] && h !== cur) go(h); });
    const start = (location.hash || '').replace('#', '');
    go(modules[start] ? start : order[0]);
  }

  return {
    data, modules, ctx, registerModule, go, refresh, boot, log, siaf, drain, asiento, alerts, can, sod, showTab,
    get cur() { return cur; },
    ui: {
      money, int, mill, pct, tag, esc, dmy, pad, rid, now, clock, kpis, bars, meter, sem, timeline, kv, table, modal, closeModal, detail, formModal, bigForm,
      enLetras, montoLetras, confirm, toast, bindTabs, chart: { line, cols, PAL }
    }
  };
})();
