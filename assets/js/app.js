/* ============================================================
   SIGA-U · Núcleo del sistema
   Registra módulos, arma el menú, enruta y provee la librería
   de UI compartida (modales, tablas con acciones, toasts...).
   Cada módulo vive en /modules/<id>/ con su data.js y su .js
   ============================================================ */
window.SIGA = (function () {
  const data = {};
  const modules = {};
  const order = [];

  /* ---------- Helpers de formato ---------- */
  const money = (n, s = 'S/ ') => s + (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const int = n => (Number(n) || 0).toLocaleString('es-PE');
  const tag = (txt, cls = 't-gray') => `<span class="tag ${cls}">${txt}</span>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- KPIs ---------- */
  function kpis(list) {
    return `<div class="grid cols-4" style="margin-bottom:14px">${list.map(k => `
      <div class="card kpi">${k.chip ? `<div class="chip ${k.chipType || 'up'}">${k.chip}</div>` : ''}
        <div class="lab">${k.lab}</div><div class="val num" ${k.color ? `style="color:${k.color}"` : ''}>${k.val}</div>
        ${k.sub ? `<div class="sub">${k.sub}</div>` : ''}</div>`).join('')}</div>`;
  }

  /* ---------- Tabla con acciones por fila ---------- */
  // cols:[{k,label,r,render(row)}], rows:[obj], actions:[{icon,title,cls,fn(row,idx)}], onRow(row,idx)
  function table(cols, rows, opts = {}) {
    const acts = opts.actions || [];
    const head = cols.map(c => `<th class="${c.r ? 'r' : ''}">${c.label}</th>`).join('') + (acts.length ? '<th></th>' : '');
    const body = rows.map((row, i) => {
      const tds = cols.map(c => {
        const v = c.render ? c.render(row) : esc(row[c.k]);
        return `<td class="${c.r ? 'r' : ''} ${c.cls || ''}">${v}</td>`;
      }).join('');
      const a = acts.length ? `<td><div class="rowacts">${acts.map((ac, ai) => `<button class="iact ${ac.cls || ''}" data-a="${ai}" data-i="${i}" title="${ac.title || ''}"><i class="fa-solid ${ac.icon}"></i></button>`).join('')}</div></td>` : '';
      return `<tr class="${opts.onRow ? 'clickable' : ''}" data-i="${i}">${tds}${a}</tr>`;
    }).join('');
    const id = 'tb' + Math.random().toString(36).slice(2, 8);
    setTimeout(() => {
      const el = document.getElementById(id); if (!el) return;
      el.querySelectorAll('.iact').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        acts[+b.dataset.a].fn(rows[+b.dataset.i], +b.dataset.i);
      }));
      if (opts.onRow) el.querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('click', () => opts.onRow(rows[+tr.dataset.i], +tr.dataset.i)));
    }, 0);
    return `<table id="${id}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${opts.foot ? `<tfoot>${opts.foot}</tfoot>` : ''}</table>`;
  }

  /* ---------- Modal ---------- */
  let modalOpen = false;
  function modal(title, bodyHtml, footHtml, cls = '') {
    closeModal();
    const back = document.createElement('div');
    back.className = 'modal-back'; back.id = 'siga-modal';
    back.innerHTML = `<div class="modal ${cls}">
      <div class="modal-h"><h3>${title}</h3><button class="x" data-close><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-b">${bodyHtml}</div>
      ${footHtml ? `<div class="modal-f">${footHtml}</div>` : ''}</div>`;
    document.body.appendChild(back);
    modalOpen = true;
    back.addEventListener('click', e => { if (e.target === back || e.target.closest('[data-close]')) closeModal(); });
    return back;
  }
  function closeModal() { const m = document.getElementById('siga-modal'); if (m) m.remove(); modalOpen = false; }

  // Modal de detalle a partir de pares clave/valor
  function detail(title, pairs, footHtml) {
    const body = `<dl class="dl">${pairs.map(p => `<dt>${p[0]}</dt><dd>${p[1]}</dd>`).join('')}</dl>`;
    return modal(title, body, footHtml || `<button class="btn ghost" data-close>Cerrar</button>`);
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
      const vals = {};
      back.querySelectorAll('[data-k]').forEach(el => vals[el.dataset.k] = el.value);
      onSubmit(vals); 
    });
    return back;
  }

  // Confirmación
  function confirm(msg, onYes, yesLabel = 'Confirmar') {
    const back = modal('Confirmar acción', `<p style="font-size:13px">${msg}</p>`,
      `<button class="btn ghost" data-close>Cancelar</button><button class="btn danger" id="siga-conf"><i class="fa-solid fa-check"></i> ${yesLabel}</button>`, 'narrow');
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
    let s = ''; const mill = Math.floor(num / 1000000), miles = Math.floor((num % 1000000) / 1000), r = num % 1000;
    if (mill) s += (mill === 1 ? 'UN MILLÓN' : _cent(mill) + ' MILLONES') + ' ';
    if (miles) s += (miles === 1 ? 'MIL' : _cent(miles) + ' MIL') + ' ';
    if (r) s += _cent(r);
    return s.trim();
  }
  function montoLetras(n, moneda = 'SOLES') {
    const e = Math.floor(n), c = Math.round((n - e) * 100);
    return `SON: ${enLetras(e)} CON ${String(c).padStart(2, '0')}/100 ${moneda}`;
  }

  /* ---------- Motor de formularios profesional ----------
     cfg: { title, icon, size, sections:[{title,hint,cols,fields}],
            items:{title,columns:[{k,label,type,w,r,options,calc}],rows,addLabel,seed},
            totals(rows,vals)->[{label,val,big,cls}], footNote(rows,vals)->str,
            submitLabel, onSubmit(vals,rows) }
     field: {k,label,type,value,options,span,required,ro,hint,ph} */
  function bigForm(cfg) {
    const fieldHtml = f => {
      const span = f.span === 1 ? '' : 'fspan2';
      const req = f.required ? '<i class="req">*</i>' : '';
      let input;
      if (f.type === 'select') input = `<select data-k="${f.k}" ${f.ro ? 'disabled' : ''}>${(f.options || []).map(o => `<option ${o === f.value ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
      else if (f.type === 'textarea') input = `<textarea data-k="${f.k}" rows="2" ${f.ro ? 'readonly' : ''} placeholder="${f.ph || ''}">${esc(f.value || '')}</textarea>`;
      else input = `<input data-k="${f.k}" type="${f.type || 'text'}" value="${esc(f.value == null ? '' : f.value)}" ${f.ro ? 'readonly' : ''} placeholder="${f.ph || ''}" ${f.required ? 'data-req="1"' : ''}>`;
      return `<div class="fld ${span}"><label>${f.label} ${req}</label>${input}${f.hint ? `<span class="fhint">${f.hint}</span>` : ''}</div>`;
    };
    const secHtml = (cfg.sections || []).map(sec => `<div class="fsec">
      ${sec.title ? `<div class="fsec-h"><span>${sec.title}</span>${sec.hint ? `<em>${sec.hint}</em>` : ''}</div>` : ''}
      <div class="fgrid" style="grid-template-columns:repeat(${sec.cols || 2},1fr)">${sec.fields.map(fieldHtml).join('')}</div></div>`).join('');
    let itemsHtml = '';
    if (cfg.items) itemsHtml = `<div class="fsec"><div class="fsec-h"><span>${cfg.items.title || 'Detalle'}</span></div>
      <div style="overflow-x:auto"><table class="mitbl"><thead><tr>${cfg.items.columns.map(c => `<th class="${c.r ? 'r' : ''}" ${c.w ? `style="width:${c.w}"` : ''}>${c.label}</th>`).join('')}<th style="width:26px"></th></tr></thead><tbody id="mf-rows"></tbody></table></div>
      <button class="addrow" id="mf-add"><i class="fa-solid fa-plus"></i> ${cfg.items.addLabel || 'Agregar fila'}</button></div>`;
    const totHtml = cfg.totals ? `<div class="mf-tot" id="mf-tot"></div>` : '';
    const noteHtml = cfg.footNote ? `<div class="mf-note" id="mf-note"></div>` : '';
    const foot = `<button class="btn ghost" data-close>Cancelar</button><button class="btn" id="mf-save"><i class="fa-solid fa-check"></i> ${cfg.submitLabel || 'Guardar'}</button>`;
    const back = modal((cfg.icon ? `<i class="fa-solid ${cfg.icon}"></i> ` : '') + cfg.title, secHtml + itemsHtml + totHtml + noteHtml, foot, cfg.size || 'wide');

    const rows = cfg.items ? (cfg.items.rows ? JSON.parse(JSON.stringify(cfg.items.rows)) : []) : [];
    const getVals = () => { const v = {}; back.querySelectorAll('.modal-b [data-k]').forEach(el => v[el.dataset.k] = el.value); return v; };
    const calcRow = (row, col) => col.calc ? col.calc(row) : (row[col.k] || 0);
    const renderRows = () => {
      const tb = back.querySelector('#mf-rows'); if (!tb) return; tb.innerHTML = '';
      rows.forEach((row, ri) => {
        const tds = cfg.items.columns.map(c => {
          if (c.calc) return `<td class="r num" data-calc="${c.k}" style="font-weight:600;padding:6px 7px">${money(calcRow(row, c), '')}</td>`;
          if (c.type === 'select') return `<td><select data-ri="${ri}" data-ck="${c.k}">${(c.options || []).map(o => `<option ${o === row[c.k] ? 'selected' : ''}>${o}</option>`).join('')}</select></td>`;
          return `<td class="${c.r ? 'r' : ''}"><input data-ri="${ri}" data-ck="${c.k}" type="${c.type === 'num' || c.type === 'money' ? 'text' : 'text'}" value="${esc(row[c.k] == null ? '' : row[c.k])}"></td>`;
        }).join('');
        const tr = document.createElement('tr');
        tr.innerHTML = tds + `<td><button class="del" data-del="${ri}"><i class="fa-solid fa-xmark"></i></button></td>`;
        tb.appendChild(tr);
      });
    };
    const recompute = () => {
      if (!cfg.totals) return;
      const t = cfg.totals(rows, getVals());
      const box = back.querySelector('#mf-tot');
      if (box) box.innerHTML = t.map(x => `<div class="tl ${x.big ? 'g' : ''} ${x.cls || ''}"><span>${x.label}</span><span class="num">${x.val}</span></div>`).join('');
      if (cfg.footNote) { const n = back.querySelector('#mf-note'); if (n) n.textContent = cfg.footNote(rows, getVals()); }
    };
    if (cfg.items) {
      renderRows(); recompute();
      const tb = back.querySelector('#mf-rows');
      tb.addEventListener('input', e => {
        const ri = +e.target.dataset.ri, ck = e.target.dataset.ck; if (isNaN(ri)) return;
        let v = e.target.value; if (['cant', 'precio', 'valor', 'pu', 'desc'].includes(ck)) v = parseFloat(String(v).replace(/,/g, '')) || 0;
        rows[ri][ck] = v;
        const tr = e.target.closest('tr');
        cfg.items.columns.forEach(c => { if (c.calc) { const cell = tr.querySelector(`[data-calc="${c.k}"]`); if (cell) cell.textContent = money(calcRow(rows[ri], c), ''); } });
        recompute();
      });
      tb.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { rows.splice(+b.dataset.del, 1); renderRows(); recompute(); } });
      back.querySelector('#mf-add').addEventListener('click', () => { rows.push(Object.assign({}, cfg.items.seed || {})); renderRows(); recompute(); });
    }
    back.querySelector('.modal-b').addEventListener('input', e => { if (e.target.dataset.k) recompute(); });
    back.querySelector('.modal-b').addEventListener('change', e => { if (e.target.dataset.k) recompute(); });
    back.querySelector('#mf-save').addEventListener('click', () => {
      let bad = null;
      back.querySelectorAll('[data-req="1"]').forEach(el => { if (!el.value.trim()) { el.classList.add('err'); if (!bad) bad = el; } else el.classList.remove('err'); });
      if (bad) { toast('Complete los campos obligatorios (*)', 'err'); bad.focus(); return; }
      cfg.onSubmit(getVals(), rows);
    });
    return back;
  }

  /* ---------- Toast ---------- */
  function toast(msg, type = 'ok') {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div'); t.className = 'toast ' + (type === 'err' ? 'err' : '');
    const ic = type === 'err' ? 'fa-circle-exclamation' : 'fa-circle-check';
    t.innerHTML = `<i class="fa-solid ${ic}"></i> ${msg}`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = 0; t.style.transform = 'translateX(30px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2600);
  }

  /* ---------- Sub-pestañas (dentro de un módulo) ---------- */
  function bindTabs(root) {
    root.querySelectorAll('.seg-tabs[data-group]').forEach(tabs => {
      tabs.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b || !b.dataset.tab) return;
        const g = tabs.dataset.group, t = b.dataset.tab;
        tabs.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on');
        root.querySelectorAll('.subpanel[data-group="' + g + '"]').forEach(p => p.classList.toggle('show', p.dataset.panel === t));
      });
    });
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
      g.items.map(it => `<div class="nav-item" data-mod="${it.id}"><span class="ic"><i class="fa-solid ${it.icon}"></i></span><span class="tx">${it.title}</span>${it.badge ? `<span class="badge ${it.badgeHot ? 'hot' : ''}">${it.badge}</span>` : ''}</div>`).join('')
    ).join('');
    nav.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => { go(n.dataset.mod); closeSidebar(); }));
  }

  function go(id) {
    const m = modules[id]; if (!m) return;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.mod === id));
    const main = document.querySelector('.main');
    main.innerHTML = `<div class="fade" id="mod-root"></div>`;
    const root = document.getElementById('mod-root');
    m.render(root);
    bindTabs(root);
    if (m.init) m.init(root);
    document.querySelector('#crumb').innerHTML = `<b>${m.group || ''}</b> · ${m.title}`;
    if (main.scrollTo) main.scrollTo(0, 0); else main.scrollTop = 0;
    location.hash = id;
  }

  /* ---------- Sidebar móvil ---------- */
  function openSidebar() { document.querySelector('.sidebar').classList.add('open'); document.querySelector('.scrim')?.classList.add('show'); }
  function closeSidebar() { document.querySelector('.sidebar').classList.remove('open'); document.querySelector('.scrim')?.classList.remove('show'); }

  function boot() {
    buildSidebar();
    document.querySelector('.menu-toggle')?.addEventListener('click', openSidebar);
    document.querySelector('.scrim')?.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeSidebar(); } });
    const start = (location.hash || '').replace('#', '');
    go(modules[start] ? start : order[0]);
  }

  return { data, modules, registerModule, go, boot,
    ui: { money, int, tag, esc, kpis, table, modal, closeModal, detail, formModal, bigForm, enLetras, montoLetras, confirm, toast, bindTabs } };
})();
