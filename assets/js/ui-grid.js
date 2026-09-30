/* ============================================================
   SIGA-U · Núcleo v2 de interfaz
   · U.grid(cfg)      grilla con búsqueda, filtro, orden, paginación,
                      selección múltiple, acciones masivas y exportación
   · U.rec(cfg)       acciones estándar por registro: ver, editar,
                      imprimir/PDF, enviar por correo, historial, anular
   · U.preview/printEl/download/csv/mail   salidas reales (archivos, impresión)
   · U.spark/gauge/heat/qr/barcode/countUp  piezas visuales del tablero
   ============================================================ */
(function () {
  const U = SIGA.ui;
  const strip = h => String(h == null ? '' : h).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
  const hashStr = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const prng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* ---------------- Archivos y salidas reales ---------------- */
  function download(name, content, mime = 'text/plain;charset=utf-8', silent) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    SIGA.log('Sistema', 'Descarga de archivo', name);
    if (!silent) U.toast('Archivo descargado · <b>' + U.esc(name) + '</b>');
  }
  function csv(name, head, rows) {
    const q = v => { const s = String(v == null ? '' : v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const body = [head, ...rows].map(r => r.map(q).join(';')).join('\r\n');
    download(String(name).replace(/[^\wÁÉÍÓÚáéíóúñÑ-]+/g, '_') + '_' + SIGA.ctx.hoyISO + '.csv', '﻿' + body, 'text/csv;charset=utf-8');
  }
  // Imprime solo el documento: se clona en un contenedor exclusivo (#print-root) que es lo único visible al imprimir
  function printEl(el) {
    if (!el) return;
    document.getElementById('print-root')?.remove();
    const root = document.createElement('div'); root.id = 'print-root'; root.appendChild(el.cloneNode(true));
    document.body.appendChild(root); document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); root.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    SIGA.log('Sistema', 'Impresión / PDF', ((el.querySelector('.nn') || {}).textContent || 'documento').trim());
    setTimeout(() => { try { window.print(); } catch (e) { /* entorno sin diálogo de impresión */ } setTimeout(done, 500); }, 60);
  }
  const DOC_CSS = `body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;margin:32px;font-size:12px}.doc-head{display:flex;justify-content:space-between;border-bottom:2px solid #0b2f2a;padding-bottom:12px;margin-bottom:12px}.seal{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:9px;background:#14967d;color:#fff;font-weight:800;margin-right:10px;vertical-align:middle}.inst b{font-size:14px}.inst span{display:block;color:#64748b;font-size:10px}.doc-num{text-align:right}.tp{font-weight:700;text-transform:uppercase;font-size:11px}.nn{font-size:20px;font-weight:800;color:#14967d}.doc-party{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin:10px 0}.k{color:#64748b;font-size:9.5px;text-transform:uppercase}.v{font-weight:600}table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#0b2f2a;color:#fff;font-size:10px;text-align:left;padding:6px}td{border-bottom:1px solid #e2e8f0;padding:6px;font-size:11px}.r{text-align:right}.doc-sign{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:40px}.doc-sign div{border-top:1px solid #0f172a;text-align:center;padding-top:6px;font-size:10px}.doc-qr{display:flex;gap:10px;align-items:center;margin-top:18px;color:#64748b;font-size:10px}.mini{color:#64748b;font-size:10px}.code{font-family:Consolas,monospace}.lbl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.lbl-card{border:1px dashed #94a3b8;border-radius:8px;padding:10px}.pg-break{page-break-after:always;height:18px}.doc{margin-bottom:24px}`;

  /* ---------------- Sellos gráficos: QR y código de barras ---------------- */
  function qr(text, size = 64) {
    const n = 21, r = prng(hashStr(text)), cell = size / n; let s = '';
    const finder = (x, y) => `<rect x="${x * cell}" y="${y * cell}" width="${7 * cell}" height="${7 * cell}" fill="#0f172a"/><rect x="${(x + 1) * cell}" y="${(y + 1) * cell}" width="${5 * cell}" height="${5 * cell}" fill="#fff"/><rect x="${(x + 2) * cell}" y="${(y + 2) * cell}" width="${3 * cell}" height="${3 * cell}" fill="#0f172a"/>`;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12); if (!inF && r() > 0.52) s += `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#0f172a"/>`; }
    return `<svg class="qr" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Código QR de verificación"><rect width="${size}" height="${size}" fill="#fff"/>${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}${s}</svg>`;
  }
  function barcode(text, w = 180, h = 42) {
    const r = prng(hashStr(text)); let x = 4, s = '';
    while (x < w - 6) { const bw = 1 + Math.floor(r() * 3); if (r() > 0.35) s += `<rect x="${x}" y="2" width="${bw}" height="${h - 14}" fill="#0f172a"/>`; x += bw + 1; }
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Código de barras ${U.esc(text)}"><rect width="${w}" height="${h}" fill="#fff"/>${s}<text x="${w / 2}" y="${h - 2}" text-anchor="middle" font-size="9" font-family="Consolas,monospace" fill="#0f172a">${U.esc(text)}</text></svg>`;
  }

  /* ---------------- Documento imprimible ---------------- */
  function doc({ office = 'Dirección General de Administración', tipo = 'Documento', num = '', fecha, pairs = [], body = '', firmas }) {
    const f = firmas || [['Elaboró', SIGA.ctx.user.nombre], ['Revisó', 'Jefe del área'], ['Aprobó', 'Dirección General de Administración']];
    return `<div class="doc" style="position:static">
      <div class="doc-head"><div class="inst"><div class="seal">U</div><div><b>Universidad Nacional Agraria de la Selva</b><span>${office} · RUC 20161749126 · Tingo María</span></div></div>
        <div class="doc-num"><div class="tp">${tipo}</div><div class="nn">${num}</div><div class="yr">${fecha || 'Ejercicio 2026'}</div></div></div>
      ${pairs.length ? `<div class="doc-party">${pairs.map(p => `<div ${p[2] ? 'style="grid-column:span 2"' : ''}><div class="k">${p[0]}</div><div class="v">${p[1] == null || p[1] === '' ? '—' : p[1]}</div></div>`).join('')}</div>` : ''}
      ${body}
      <div class="doc-sign">${f.map(x => `<div><b>${x[0]}</b>${x[1]}</div>`).join('')}</div>
      <div class="doc-qr">${qr(num + tipo, 58)}<span>Documento electrónico firmado digitalmente · código de verificación <b>${(hashStr(num + tipo) >>> 0).toString(16).toUpperCase()}</b> · emitido ${U.now()} por ${SIGA.ctx.user.nombre}</span></div></div>`;
  }
  function preview(title, html, opts = {}) {
    const b = U.modal('<i class="fa-solid fa-file-lines"></i> ' + title, `<div class="prev-wrap">${html}</div>`,
      `<button class="btn ghost" data-close>Cerrar</button>${opts.csv ? '<button class="btn ghost" data-pv="csv"><i class="fa-solid fa-file-csv"></i> Excel</button>' : ''}<button class="btn ghost" data-pv="mail"><i class="fa-solid fa-envelope"></i> Enviar</button><button class="btn ghost" data-pv="html"><i class="fa-solid fa-download"></i> Descargar</button><button class="btn" data-pv="print"><i class="fa-solid fa-print"></i> Imprimir / PDF</button>`, 'wide');
    b.querySelector('[data-pv="print"]').addEventListener('click', () => { const d = b.querySelectorAll('.prev-wrap .doc'); printEl(d.length === 1 ? d[0] : b.querySelector('.prev-wrap')); });
    b.querySelector('[data-pv="html"]').addEventListener('click', () => download((opts.file || title).replace(/[^\wÁÉÍÓÚáéíóúñÑ-]+/g, '_') + '.html', `<!doctype html><html lang="es"><meta charset="utf-8"><title>${U.esc(title)}</title><style>${DOC_CSS}</style><body>${b.querySelector('.prev-wrap').innerHTML}</body></html>`, 'text/html;charset=utf-8'));
    b.querySelector('[data-pv="mail"]').addEventListener('click', () => mail({ asunto: title, adj: (opts.file || title) + '.pdf' }));
    b.querySelector('[data-pv="csv"]')?.addEventListener('click', () => opts.csv());
    return b;
  }
  function mail({ to = '', asunto = '', adj = '', cuerpo }) {
    const b = U.modal('<i class="fa-solid fa-envelope"></i> Enviar por correo institucional', `<div class="fgrid">
        <div class="fld fspan2"><label>Para</label><input id="ml-to" value="${U.esc(to || 'destinatario@unas.edu.pe')}"></div>
        <div class="fld fspan2"><label>Asunto</label><input id="ml-as" value="${U.esc(asunto)}"></div>
        <div class="fld fspan2"><label>Mensaje</label><textarea id="ml-tx" rows="4">${U.esc(cuerpo || 'Se remite el documento adjunto generado en SIGA-U para su conocimiento y fines.\n\nAtentamente,\n' + SIGA.ctx.user.nombre + ' · ' + SIGA.ctx.user.rolTx)}</textarea></div>
        ${adj ? `<div class="fld fspan2"><label>Adjunto</label><div class="doc-attach" style="margin:0"><i class="fa-solid fa-file-pdf"></i><span>${U.esc(adj)}</span>${U.tag('firma digital', 't-green')}</div></div>` : ''}</div>`,
      `<button class="btn ghost" data-close>Cancelar</button><button class="btn" id="ml-go"><i class="fa-solid fa-paper-plane"></i> Enviar</button>`, 'narrow');
    b.querySelector('#ml-go').addEventListener('click', () => {
      const to2 = b.querySelector('#ml-to').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to2)) { U.toast('Ingrese un correo válido', 'err'); return; }
      SIGA.log('Sistema', 'Envío por correo', b.querySelector('#ml-as').value, '—', to2);
      U.closeModal(); U.toast('Correo enviado a <b>' + U.esc(to2) + '</b> con el documento adjunto');
    });
  }

  /* ---------------- Menú contextual ⋮ ---------------- */
  function menu(anchor, items) {
    document.querySelectorAll('.kmenu').forEach(m => m.remove());
    const m = document.createElement('div'); m.className = 'kmenu';
    m.innerHTML = items.map((it, i) => it.sep ? '<div class="ksep"></div>' : `<button data-k="${i}" class="${it.danger ? 'danger' : ''}"><i class="fa-solid ${it.icon}"></i><span>${it.label}</span></button>`).join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect(), mh = m.offsetHeight, mw = m.offsetWidth;
    m.style.top = (r.bottom + mh + 6 > window.innerHeight ? Math.max(8, r.top - mh - 4) : r.bottom + 4) + 'px';
    m.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, r.right - mw)) + 'px';
    m.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; m.remove(); items[+b.dataset.k].fn(); });
    setTimeout(() => { const off = e => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', off); } }; document.addEventListener('mousedown', off); }, 0);
  }
  document.addEventListener('scroll', () => document.querySelectorAll('.kmenu').forEach(m => m.remove()), true);

  /* ---------------- Acciones estándar por registro ----------------
     cfg: { mod, key(r), title(r), tipo, office, fields(r)->[[label,html,span2?]], body(r)->html,
            edit:[{k,label,type,options,span}], onEdit(r,vals,antes), estado:'estado', cls:'cls',
            anular:true|false, canAnular(r), anularLabel, onAnular(r,motivo), extra(r)->[{icon,label,fn,danger}],
            print(r)->{tipo,num,pairs,body,firmas,office}, mailTo(r) } */
  function rec(cfg) {
    const key = r => String(cfg.key ? cfg.key(r) : (r.doc || r.num || r.id || r.cod || r[0] || ''));
    const title = r => cfg.title ? cfg.title(r) : key(r);
    const eK = cfg.estado || 'estado';
    const anulado = r => !!r.anulado || /anulad|de baja|dado de baja/i.test(String(r[eK] || ''));
    const pairs = r => (cfg.fields ? cfg.fields(r) : Object.entries(r).filter(([k, v]) => typeof v !== 'object' && !['cls', 'nuevo', 'hist'].includes(k)).map(([k, v]) => [k, U.esc(v)]));
    const bit = r => { const k = key(r).toLowerCase(); if (k.length < 3) return []; return SIGA.data.seguridad.bitacora.filter(b => { const ref = String(b.ref || '').toLowerCase(); return ref.includes(k) || (ref.length > 5 && k.includes(ref)); }); };
    const canEdit = r => cfg.edit && cfg.edit.length && !anulado(r) && (!cfg.canEdit || cfg.canEdit(r));
    const canAnul = r => cfg.anular && !anulado(r) && (!cfg.canAnular || cfg.canAnular(r));
    const guard = () => { if (SIGA.ctx.user.readOnly) { U.toast('El rol OCI tiene acceso de solo consulta', 'err'); SIGA.log('Seguridad', 'Intento de modificación (solo consulta)', cfg.mod || ''); return true; } return false; };
    const ops = {
      ver(r) {
        if (cfg.view) return cfg.view(r);
        const h = bit(r).slice(0, 5);
        const b = U.modal(title(r), `${U.kv(pairs(r))}${cfg.body ? cfg.body(r) : ''}
          <div class="lbl-s mt" style="margin-bottom:8px"><i class="fa-solid fa-clock-rotate-left"></i> Últimos movimientos en la bitácora</div>
          ${h.length ? U.timeline(h.map(x => ({ t: x.acc, sub: x.user + ' · ' + x.antes + ' → ' + x.despues, when: x.ts.slice(0, 16), st: 'done' }))) : '<div class="mini">Sin cambios registrados después de su creación.</div>'}`,
          `<button class="btn ghost" data-close>Cerrar</button>
           ${(cfg.extra ? cfg.extra(r) : []).filter(x => !x.danger && !x.menuOnly).map((x, i) => `<button class="btn ghost" data-x="${i}"><i class="fa-solid ${x.icon}"></i> ${x.label}</button>`).join('')}
           <button class="btn ghost" data-o="hist"><i class="fa-solid fa-clock-rotate-left"></i> Historial</button>
           <button class="btn ghost" data-o="mail"><i class="fa-solid fa-envelope"></i> Enviar</button>
           ${canAnul(r) ? `<button class="btn danger" data-o="anul"><i class="fa-solid fa-ban"></i> ${cfg.anularLabel || 'Anular'}</button>` : ''}
           ${canEdit(r) ? '<button class="btn ghost" data-o="edit"><i class="fa-solid fa-pen"></i> Editar</button>' : ''}
           <button class="btn sec" data-o="print"><i class="fa-solid fa-print"></i> Imprimir / PDF</button>`, 'wide');
        const ex = (cfg.extra ? cfg.extra(r) : []).filter(x => !x.danger && !x.menuOnly);
        b.querySelectorAll('[data-x]').forEach(x => x.addEventListener('click', () => { U.closeModal(); ex[+x.dataset.x].fn(r); }));
        b.querySelector('[data-o="hist"]').addEventListener('click', () => ops.historial(r));
        b.querySelector('[data-o="mail"]').addEventListener('click', () => ops.correo(r));
        b.querySelector('[data-o="print"]').addEventListener('click', () => ops.imprimir(r));
        b.querySelector('[data-o="edit"]')?.addEventListener('click', () => ops.editar(r));
        b.querySelector('[data-o="anul"]')?.addEventListener('click', () => ops.anular(r));
      },
      editar(r) {
        if (guard()) return;
        if (!canEdit(r)) { U.toast('Este registro no admite edición en su estado actual', 'err'); return; }
        const fields = cfg.edit.map(f => Object.assign({ span: 1 }, f, { value: f.get ? f.get(r) : r[f.k] }));
        U.formModal('<i class="fa-solid fa-pen"></i> Editar · ' + title(r), fields, v => {
          const ch = [];
          cfg.edit.forEach(f => {
            const old = f.get ? f.get(r) : r[f.k];
            let nv = v[f.k]; if (f.type === 'number') nv = parseFloat(nv) || 0;
            if (String(old) !== String(nv)) { ch.push([f.label, old, nv]); if (f.set) f.set(r, nv); else r[f.k] = nv; }
          });
          if (!ch.length) { U.closeModal(); U.toast('Sin cambios', 'info'); return; }
          if (cfg.onEdit) cfg.onEdit(r, v, ch);
          SIGA.log(cfg.mod || 'Sistema', 'Edición de registro', key(r), ch.map(c => c[0] + ': ' + c[1]).join(' · '), ch.map(c => c[0] + ': ' + c[2]).join(' · '));
          U.closeModal(); SIGA.refresh(); U.toast(`${title(r)} actualizado · ${ch.length} campo(s) · cambio registrado en la bitácora`);
        }, 'Guardar cambios');
      },
      imprimir(r) {
        const p = cfg.print ? cfg.print(r) : {};
        preview(title(r), doc(Object.assign({ tipo: cfg.tipo || 'Registro', num: key(r), office: cfg.office, pairs: pairs(r).map(x => [x[0], x[1]]) }, p)), { file: key(r) });
      },
      correo(r) { mail({ to: cfg.mailTo ? cfg.mailTo(r) : '', asunto: (cfg.tipo || 'Documento') + ' ' + key(r) + ' · UNAS', adj: key(r).replace(/[^\w-]+/g, '_') + '.pdf' }); },
      historial(r) {
        const h = bit(r);
        const steps = [{ t: 'Registro del documento', sub: (r.user || r.resp || r.registro || 'SIGA-U') + (r.fecha ? ' · ' + r.fecha : ''), st: 'done' }].concat(h.slice().reverse().map(x => ({ t: x.acc, sub: `${x.user} (${x.rol}) · IP ${x.ip}<br><span class="code">${U.esc(x.antes)}</span> → <b>${U.esc(x.despues)}</b>`, when: x.ts, st: 'done' })));
        U.modal('<i class="fa-solid fa-clock-rotate-left"></i> Historial · ' + title(r), `<p class="mini mb">Bitácora inmutable: usuario, fecha y hora, IP, valor anterior y valor posterior de cada cambio.</p>${U.timeline(steps)}`, `<button class="btn ghost" data-close>Cerrar</button>`);
      },
      anular(r) {
        if (guard()) return;
        if (!canAnul(r)) { U.toast('Este registro no puede anularse en su estado actual', 'err'); return; }
        const b = U.modal('<i class="fa-solid fa-ban" style="color:var(--danger)"></i> ' + (cfg.anularLabel || 'Anular') + ' · ' + title(r),
          `<div class="note warn"><i class="fa-solid fa-triangle-exclamation"></i><div>No se elimina: se registra una <b>operación inversa</b> que conserva el histórico, con su motivo en la bitácora.</div></div>
           <div class="fld"><label>Motivo (obligatorio)</label><textarea id="an-m" rows="3" placeholder="Describa el sustento de la anulación"></textarea></div>
           <div class="fld mt"><label>Documento de sustento</label><input id="an-d" placeholder="Informe / resolución N.º"></div>`,
          `<button class="btn ghost" data-close>Cancelar</button><button class="btn danger" id="an-go"><i class="fa-solid fa-ban"></i> Confirmar</button>`, 'narrow');
        b.querySelector('#an-go').addEventListener('click', () => {
          const m = b.querySelector('#an-m').value.trim(), d = b.querySelector('#an-d').value.trim();
          if (m.length < 5) { b.querySelector('#an-m').classList.add('err'); U.toast('Indique el motivo de la anulación', 'err'); return; }
          const antes = r[eK];
          r[eK] = cfg.anuladoValor || 'Anulado'; if (cfg.cls !== false) r[cfg.cls || 'cls'] = 't-red'; r.anulado = true; r.motivo = m;
          if (cfg.onAnular) cfg.onAnular(r, m);
          SIGA.log(cfg.mod || 'Sistema', (cfg.anularLabel || 'Anulación') + ' (operación inversa)', key(r), antes || 'Vigente', r[eK] + ' · ' + m + (d ? ' · ' + d : ''));
          U.closeModal(); SIGA.refresh(); U.toast(`${title(r)} anulado · motivo registrado`, 'err');
        });
      },
      items(r) {
        const ex = cfg.extra ? cfg.extra(r) : [];
        return [{ icon: 'fa-eye', label: 'Ver detalle', fn: () => ops.ver(r) },
          ...(cfg.view ? [{ icon: 'fa-list-check', label: 'Ficha del registro', fn: () => { const v = cfg.view; delete cfg.view; try { ops.ver(r); } finally { cfg.view = v; } } }] : []),
          ...(canEdit(r) ? [{ icon: 'fa-pen', label: 'Editar', fn: () => ops.editar(r) }] : []),
          { icon: 'fa-print', label: 'Imprimir / PDF', fn: () => ops.imprimir(r) },
          { icon: 'fa-envelope', label: 'Enviar por correo', fn: () => ops.correo(r) },
          { icon: 'fa-clock-rotate-left', label: 'Historial de cambios', fn: () => ops.historial(r) },
          ...(ex.length ? [{ sep: true }, ...ex.map(x => ({ icon: x.icon, label: x.label, danger: x.danger, fn: () => x.fn(r) }))] : []),
          ...(canAnul(r) ? [{ sep: true }, { icon: 'fa-ban', label: cfg.anularLabel || 'Anular', danger: true, fn: () => ops.anular(r) }] : [])];
      }
    };
    return ops;
  }

  /* ---------------- Grilla completa ----------------
     cfg: { id (estado persistente), cols, rows (array|fn), record (cfg de rec), actions:[{icon,title,fn,show,cls}],
            filter:{label,get}, pageSize, export:'nombre', bulk:[{icon,label,fn(rows)}], tools:[{icon,label,fn}],
            onRow, rowCls, foot, empty, search:false, title } */
  const GS = {};
  function grid(cfg) {
    const id = cfg.id || 'g' + U.rid();
    const st = GS[id] || (GS[id] = { q: '', f: '', sort: null, dir: 1, page: 0, sel: new Set() });
    const host = 'gd' + U.rid(), size = cfg.pageSize || 10;
    const R = cfg.record ? rec(cfg.record) : null;
    const all = () => (typeof cfg.rows === 'function' ? cfg.rows() : cfg.rows) || [];
    const cellHtml = (c, r) => c.render ? c.render(r) : U.esc(r[c.k]);
    const text = (c, r) => strip(cellHtml(c, r));
    const view = () => {
      let rows = all();
      if (cfg.filter && st.f) rows = rows.filter(r => String(cfg.filter.get(r)) === st.f);
      if (st.q) { const q = st.q.toLowerCase(); rows = rows.filter(r => cfg.cols.map(c => text(c, r)).join(' ').toLowerCase().includes(q)); }
      if (st.sort != null && cfg.cols[st.sort]) {
        const c = cfg.cols[st.sort], val = r => c.sv ? c.sv(r) : (typeof r[c.k] === 'number' ? r[c.k] : text(c, r));
        rows = rows.slice().sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true })) * st.dir; });
      }
      return rows;
    };
    setTimeout(mount, 0);
    return `<div class="gd" id="${host}"></div>`;

    function mount() {
      const el = document.getElementById(host); if (!el) return;
      const fv = cfg.filter ? [...new Set(all().map(r => String(cfg.filter.get(r))))].sort((a, b) => a.localeCompare(b, 'es')) : [];
      if (st.f && !fv.includes(st.f)) st.f = '';
      el.innerHTML = `${cfg.search === false ? '' : `<div class="gbar">
          <div class="searchbar"><i class="fa-solid fa-magnifying-glass"></i><input data-gq placeholder="Buscar en ${cfg.title || 'la tabla'}…" value="${U.esc(st.q)}"></div>
          ${cfg.filter ? `<select class="gsel" data-gf><option value="">${cfg.filter.label}: todos</option>${fv.map(v => `<option value="${U.esc(v)}" ${v === st.f ? 'selected' : ''}>${U.esc(v)}</option>`).join('')}</select>` : ''}
          <span class="gcount mini"></span><span style="flex:1"></span>
          ${(cfg.tools || []).map((t, i) => `<button class="btn sm ${t.primary ? '' : 'ghost'}" data-gt="${i}"><i class="fa-solid ${t.icon}"></i> ${t.label}</button>`).join('')}
          <button class="btn sm ghost" data-gx title="Exportar a Excel (CSV)"><i class="fa-solid fa-file-excel"></i> Excel</button>
          <button class="btn sm ghost" data-gp title="Imprimir listado"><i class="fa-solid fa-print"></i> Imprimir</button></div>`}
        <div class="gbulk"></div><div class="gbody"></div><div class="gpager"></div>`;
      el.querySelector('[data-gq]')?.addEventListener('input', e => { st.q = e.target.value; st.page = 0; paint(); });
      el.querySelector('[data-gf]')?.addEventListener('change', e => { st.f = e.target.value; st.page = 0; paint(); });
      el.querySelectorAll('[data-gt]').forEach(b => b.addEventListener('click', () => cfg.tools[+b.dataset.gt].fn()));
      el.querySelector('[data-gx]')?.addEventListener('click', () => exportCsv());
      el.querySelector('[data-gp]')?.addEventListener('click', () => printList());
      paint();
    }
    function exportCsv() {
      const rows = view(), cols = cfg.cols.filter(c => !c.noexport);
      csv(cfg.export || cfg.title || 'listado', cols.map(c => strip(c.label)), rows.map(r => cols.map(c => c.csv ? c.csv(r) : text(c, r))));
    }
    function printList() {
      const rows = view(), cols = cfg.cols.filter(c => !c.noexport);
      preview(cfg.title || 'Listado', doc({ tipo: 'Reporte', num: (cfg.title || 'Listado'), office: cfg.office || (SIGA.modules[SIGA.cur] || {}).title || 'SIGA-U', pairs: [['Registros', rows.length], ['Filtro aplicado', (st.f || 'ninguno') + (st.q ? ' · búsqueda "' + U.esc(st.q) + '"' : '')]],
        body: `<table class="doc-tbl"><thead><tr>${cols.map(c => `<th class="${c.r ? 'r' : ''}">${strip(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c.r ? 'r' : ''}">${U.esc(text(c, r))}</td>`).join('')}</tr>`).join('')}</tbody></table>` }), { file: cfg.export || cfg.title, csv: exportCsv });
    }
    function paint() {
      const el = document.getElementById(host); if (!el) return;
      const rows = view(), pages = Math.max(1, Math.ceil(rows.length / size));
      if (st.page >= pages) st.page = pages - 1;
      const pr = rows.slice(st.page * size, st.page * size + size);
      const acts = cfg.actions || [], bulk = cfg.bulk || [], menu_ = !!R || !!cfg.menu;
      const head = (bulk.length ? `<th style="width:28px"><input type="checkbox" data-gall ${pr.length && pr.every(r => st.sel.has(r)) ? 'checked' : ''}></th>` : '') +
        cfg.cols.map((c, i) => `<th class="${c.r ? 'r' : ''} ${c.nosort ? '' : 'sortable'}" data-gs="${i}">${c.label}${st.sort === i ? `<i class="fa-solid fa-caret-${st.dir > 0 ? 'up' : 'down'}"></i>` : ''}</th>`).join('') + (acts.length || menu_ ? '<th></th>' : '');
      const body = pr.length ? pr.map((r, i) => `<tr class="${cfg.onRow || R ? 'clickable' : ''} ${cfg.rowCls ? cfg.rowCls(r) : ''} ${st.sel.has(r) ? 'selrow' : ''}" data-i="${i}">
          ${bulk.length ? `<td><input type="checkbox" data-gc="${i}" ${st.sel.has(r) ? 'checked' : ''}></td>` : ''}
          ${cfg.cols.map(c => `<td class="${c.r ? 'r num' : ''} ${c.cls || ''}">${cellHtml(c, r)}</td>`).join('')}
          ${acts.length || menu_ ? `<td><div class="rowacts">${acts.map((a, ai) => (a.show && !a.show(r)) ? '' : `<button class="iact ${a.cls || ''}" data-ga="${ai}" data-i="${i}" title="${a.title || ''}"><i class="fa-solid ${a.icon}"></i></button>`).join('')}${menu_ ? `<button class="iact kbtn" data-gm="${i}" title="Más acciones"><i class="fa-solid fa-ellipsis-vertical"></i></button>` : ''}</div></td>` : ''}</tr>`).join('')
        : `<tr><td colspan="${cfg.cols.length + (bulk.length ? 1 : 0) + (acts.length || menu_ ? 1 : 0)}" class="empty-row">${st.q || st.f ? 'Sin coincidencias para el filtro' : (cfg.empty || 'Sin registros')}</td></tr>`;
      el.querySelector('.gbody').innerHTML = `<div class="tbl-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${cfg.foot ? `<tfoot>${typeof cfg.foot === 'function' ? cfg.foot(rows) : cfg.foot}</tfoot>` : ''}</table></div>`;
      const cnt = el.querySelector('.gcount'); if (cnt) cnt.textContent = rows.length === all().length ? `${rows.length} registros` : `${rows.length} de ${all().length} registros`;
      // Paginación
      const pg = el.querySelector('.gpager');
      if (pages > 1) {
        const nums = []; for (let p = 0; p < pages; p++) if (p === 0 || p === pages - 1 || Math.abs(p - st.page) <= 1) nums.push(p); else if (nums[nums.length - 1] !== '…') nums.push('…');
        pg.innerHTML = `<span class="mini">Mostrando ${st.page * size + 1}–${Math.min(rows.length, st.page * size + size)} de ${rows.length}</span><span style="flex:1"></span>
          <button class="pgb" data-pg="${st.page - 1}" ${st.page === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>${nums.map(p => p === '…' ? '<span class="mini">…</span>' : `<button class="pgb ${p === st.page ? 'on' : ''}" data-pg="${p}">${p + 1}</button>`).join('')}<button class="pgb" data-pg="${st.page + 1}" ${st.page >= pages - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;
        pg.querySelectorAll('[data-pg]').forEach(b => b.addEventListener('click', () => { st.page = Math.max(0, Math.min(pages - 1, +b.dataset.pg)); paint(); }));
      } else pg.innerHTML = '';
      // Acciones masivas
      const bb = el.querySelector('.gbulk'), selRows = all().filter(r => st.sel.has(r));
      bb.style.display = bulk.length && selRows.length ? '' : 'none';
      if (bulk.length && selRows.length) {
        bb.innerHTML = `<b>${selRows.length}</b> seleccionado(s)${bulk.map((b, i) => `<button class="btn sm ${b.danger ? 'danger' : ''}" data-gb="${i}"><i class="fa-solid ${b.icon}"></i> ${b.label}</button>`).join('')}<button class="btn sm ghost" data-gbx><i class="fa-solid fa-xmark"></i> Quitar selección</button>`;
        bb.querySelectorAll('[data-gb]').forEach(b => b.addEventListener('click', () => { const rs = all().filter(r => st.sel.has(r)); st.sel.clear(); bulk[+b.dataset.gb].fn(rs); }));
        bb.querySelector('[data-gbx]').addEventListener('click', () => { st.sel.clear(); paint(); });
      }
      // Eventos
      const tb = el.querySelector('.gbody');
      tb.querySelectorAll('th[data-gs].sortable').forEach(th => th.addEventListener('click', () => { const i = +th.dataset.gs; if (st.sort === i) st.dir = -st.dir; else { st.sort = i; st.dir = 1; } paint(); }));
      tb.querySelector('[data-gall]')?.addEventListener('change', e => { pr.forEach(r => e.target.checked ? st.sel.add(r) : st.sel.delete(r)); paint(); });
      tb.querySelectorAll('[data-gc]').forEach(c => c.addEventListener('click', e => e.stopPropagation()));
      tb.querySelectorAll('[data-gc]').forEach(c => c.addEventListener('change', e => { const r = pr[+c.dataset.gc]; e.target.checked ? st.sel.add(r) : st.sel.delete(r); paint(); }));
      tb.querySelectorAll('[data-ga]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); acts[+b.dataset.ga].fn(pr[+b.dataset.i]); }));
      tb.querySelectorAll('[data-gm]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const r = pr[+b.dataset.gm]; const items = [...(R ? R.items(r) : []), ...((cfg.menu ? cfg.menu(r) : []).length ? [{ sep: true }, ...cfg.menu(r)] : [])]; menu(b, items); }));
      tb.querySelectorAll('tbody tr[data-i]').forEach(tr => tr.addEventListener('click', e => { if (e.target.closest('input,button,select,a')) return; const r = pr[+tr.dataset.i]; if (!r) return; if (cfg.onRow) cfg.onRow(r); else if (R) R.ver(r); }));
    }
  }

  /* ---------------- Piezas visuales ---------------- */
  function spark(data, color = '#14967D', h = 34) {
    const d0 = data.filter(v => v != null); if (d0.length < 2) return '';
    const w = 120, max = Math.max(...d0), min = Math.min(...d0), x = i => i * w / (d0.length - 1), y = v => h - 3 - (v - min) / ((max - min) || 1) * (h - 8);
    const p = d0.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1)).join('');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" height="${h}" aria-hidden="true"><path d="${p}L${w},${h}L0,${h}Z" fill="${color}" opacity=".10"/><path d="${p}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
  }
  function gauge(p, { label = '', sub = '', color = '#14967D', meta } = {}) {
    const cx = 90, cy = 88, r = 70, P = Math.max(0, Math.min(1, p)), pt = q => [cx - r * Math.cos(Math.PI * q), cy - r * Math.sin(Math.PI * q)];
    const [x, y] = pt(P), arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
    const m = meta != null ? pt(Math.max(0, Math.min(1, meta))) : null, mi = meta != null ? [cx - (r - 12) * Math.cos(Math.PI * meta), cy - (r - 12) * Math.sin(Math.PI * meta)] : null;
    return `<div class="gauge"><svg viewBox="0 0 180 100" role="img" aria-label="${U.esc(label)} ${(P * 100).toFixed(1)}%"><path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#e8edf3" stroke-width="14" stroke-linecap="round"/>
      ${P > 0.001 ? `<path d="${arc}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>` : ''}
      ${m ? `<line x1="${m[0].toFixed(1)}" y1="${m[1].toFixed(1)}" x2="${mi[0].toFixed(1)}" y2="${mi[1].toFixed(1)}" stroke="#0f172a" stroke-width="2.5"/>` : ''}
      <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="24" font-weight="800" fill="#0f172a">${(P * 100).toFixed(1)}%</text></svg>
      <b>${label}</b><span>${sub}</span></div>`;
  }
  function heat({ rows, cols, data, fmt = v => v, title = '' }) {
    const max = Math.max(...data.flat().filter(v => v != null), 1);
    return `<div class="tbl-wrap"><table class="heat" aria-label="${U.esc(title)}"><thead><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr><th>${r}</th>${cols.map((c, j) => { const v = data[i][j]; if (v == null) return '<td class="hx"></td>'; const a = 0.08 + 0.82 * v / max; return `<td style="background:rgba(20,150,125,${a.toFixed(2)});color:${a > 0.5 ? '#fff' : '#0f172a'}" title="${U.esc(r)} · ${U.esc(c)}: ${U.esc(fmt(v))}">${fmt(v)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="heat-leg mini"><span>menor</span><i></i><span>mayor</span></div>`;
  }
  // Contadores animados: <b data-cu="70.93" data-dec="1" data-pre="S/ " data-suf=" M">
  function countUp(root) {
    (root || document).querySelectorAll('[data-cu]').forEach(el => {
      const to = parseFloat(el.dataset.cu), dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now(), dur = 1100;
      const f = v => pre + v.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = f(to * e); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ---------------- Generador determinista de datos de demostración ---------------- */
  SIGA.gen = {
    rng: seed => prng(seed),
    pick: (r, a) => a[Math.floor(r() * a.length)],
    int: (r, a, b) => a + Math.floor(r() * (b - a + 1)),
    amt: (r, a, b, step = 10) => Math.round((a + r() * (b - a)) / step) * step,
    pad: (n, l = 6) => String(n).padStart(l, '0'),
    // fecha dd/mm/2026 entre dos días del año (1–365)
    fecha: (r, d1, d2) => { const d = new Date(2026, 0, 1); d.setDate(d.getDate() + SIGA.gen.int(r, d1, d2) - 1); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/2026'; },
    hora: r => String(SIGA.gen.int(r, 8, 17)).padStart(2, '0') + ':' + String(SIGA.gen.int(r, 0, 59)).padStart(2, '0')
  };

  SIGA.recs = SIGA.recs || {};   // configuraciones de registro reutilizables entre módulos (bandeja, reportes)
  Object.assign(U, { grid, rec, preview, printEl, download, csv, mail, doc, qr, barcode, menu, spark, gauge, heat, countUp, strip });
})();
