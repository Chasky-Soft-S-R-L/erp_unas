/* Tablas maestras · un solo maestro por entidad, con validación de dominio y sin duplicados */
SIGA.registerModule('tablas', {
  title: 'Tablas maestras', icon: 'fa-database', group: 'Configuración y control',
  sel: 'proved',
  rowsOf(c) { return c.src ? c.src() : c.rows; },
  search(q) {
    const out = [];
    SIGA.data.tablas.catalogos.forEach(c => this.rowsOf(c).filter(r => r.join(' ').toLowerCase().includes(q)).slice(0, 3).forEach(r => out.push({ t: r[1] + ' · ' + r[0], d: c.nombre, fn: () => { this.sel = c.id; SIGA.refresh(); } })));
    return out;
  },
  render(el) {
    const d = SIGA.data.tablas, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Tablas maestras</h1><p>Catálogos base del sistema · el dato se registra una vez y todos los módulos lo consultan (proveedores, catálogo SIGA, centros de costo, clasificadores, parámetros)</p></div></div>
      <div class="note teal"><i class="fa-solid fa-link"></i><div><b>Parámetros vivos.</b> La escala de viáticos, las tasas de detracción, los regímenes y las unidades productivas se leen directamente de sus módulos: si Contabilidad o Tesorería cambian una tasa aquí, el siguiente documento la aplica. La migración depura duplicados del maestro actual (variantes de escritura y RUC sin validar).</div></div>
      <div class="grid cols-4 mb" id="cat-cards"></div>
      <div class="card"><h3><span class="dot"></span><span id="cat-title"></span> <span class="grow" id="cat-count"></span></h3>
        <div id="cat-table"></div></div>`;
    document.getElementById('cat-cards').innerHTML = d.catalogos.map(c => `
      <div class="card" data-cat="${c.id}" style="cursor:pointer;transition:.15s;padding:12px;border-color:${c.id === this.sel ? 'var(--primary)' : 'var(--line)'};${c.id === this.sel ? 'box-shadow:0 2px 10px rgba(26,187,156,.15)' : ''}">
        <div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:10px;background:var(--bg);display:grid;place-items:center;color:var(--primary-dark);font-size:15px;flex-shrink:0"><i class="fa-solid ${c.icon}"></i></div>
        <div style="min-width:0"><div style="font-weight:700;font-size:12px">${c.nombre}</div><div class="mini"><span class="code">${c.tabla}</span> · ${U.int(c.total)} · ${c.grupo}</div></div></div></div>`).join('');
    el.querySelectorAll('[data-cat]').forEach(card => card.addEventListener('click', () => { this.sel = card.dataset.cat; SIGA.refresh(); }));
    this.paint(el);
  },
  sync() { const U = SIGA.ui; SIGA.siaf('Descarga de catálogo', 'Catálogo de bienes y servicios ' + SIGA.ctx.hoy, 0, 'SIGA-MEF'); SIGA.log('Tablas maestras', 'Sincronización con SIGA-MEF', 'catabi'); U.toast('Catálogo sincronizado con el SIGA-MEF · sin mantenimiento duplicado (RF-A-11)'); },
  nuevo() {
    const d = SIGA.data.tablas, U = SIGA.ui;
    {
      const c = d.catalogos.find(x => x.id === this.sel);
      if (c.src) { U.toast('Este parámetro se administra desde su módulo', 'info'); return; }
      U.formModal('Nuevo registro · ' + c.nombre, c.cols.map((col, i) => ({ k: 'c' + i, label: col, span: 1 })), v => {
        const row = c.cols.map((_, i) => (v['c' + i] || '').trim());
        if (c.valida === 'ruc') {
          if (!/^(10|15|17|20)\d{9}$/.test(row[0])) { U.toast('RUC inválido: debe tener 11 dígitos y empezar con 10, 15, 17 o 20', 'err'); return; }
          if (c.rows.some(r => r[0] === row[0])) { SIGA.log('Tablas maestras', 'Registro duplicado bloqueado', 'RUC ' + row[0], '—', 'Ya existe'); U.toast('Ese RUC ya existe en el maestro: no se permiten duplicados (D-09)', 'err'); return; }
          row[2] = row[2] || 'Activo · habido (validado con SUNAT)';
        }
        if (!row[0]) { U.toast('El código es obligatorio', 'err'); return; }
        c.rows.unshift(row); c.total++;
        SIGA.log('Tablas maestras', 'Alta en ' + c.nombre, row[0], '—', row[1]);
        U.closeModal(); SIGA.refresh(); U.toast('Registro agregado a ' + c.nombre);
      }, 'Agregar');
    }
  },
  paint(el) {
    const U = SIGA.ui, c = SIGA.data.tablas.catalogos.find(x => x.id === this.sel), all = this.rowsOf(c);
    document.getElementById('cat-title').textContent = c.nombre;
    document.getElementById('cat-count').innerHTML = `<span class="code">${c.tabla}</span> · ${U.int(c.total)} registros · se muestran ${all.length}`;
    const n = c.cols.length;
    const rec = { mod: 'Tablas maestras', tipo: 'Ficha de ' + c.nombre.toLowerCase(), key: r => String(r[0]), title: r => r[0] + ' · ' + r[1], estado: n, cls: false, anuladoValor: 'Inactivo',
      fields: r => c.cols.map((col, i) => [col, U.esc(r[i])]).concat([['Tabla', `<span class="code">${c.tabla}</span>`], ['Estado', U.tag(r[n] || 'Activo', r[n] === 'Inactivo' ? 't-gray' : 't-green')]]),
      body: r => { const k = String(r[0]); const uso = c.id === 'proved' ? SIGA.data.abastecimiento.ordenes.filter(o => (SIGA.data.abastecimiento.proveedores.find(p => p.ruc === k) || {}).rs === o.prov).length : c.id === 'catabi' ? SIGA.data.almacen.movs.filter(m => m.cod === k).length : c.id === 'cencos' ? SIGA.data.presupuesto.marco.filter(m => m.cc === k).length : null; return uso != null ? `<div class="note info mt"><i class="fa-solid fa-link"></i><div>Referenciado en <b>${uso}</b> registro(s) de los módulos: por eso no se elimina, solo se desactiva.</div></div>` : ''; },
      edit: !c.src || c.editSrc ? c.cols.map((col, i) => ({ k: 'c' + i, label: col, span: 1, get: r => r[i], set: (r, v) => { if (!c.editSrc) r[i] = v; } })).slice(1) : [],
      onEdit: (r, v) => { if (c.editSrc) c.editSrc(r, v); },
      anular: !c.src, anularLabel: 'Desactivar registro', canAnular: r => r[n] !== 'Inactivo',
      extra: r => r[n] === 'Inactivo' ? [{ icon: 'fa-toggle-on', label: 'Reactivar', fn: x => { x[n] = 'Activo'; x.anulado = false; SIGA.log('Tablas maestras', 'Reactivación', x[0], 'Inactivo', 'Activo'); U.closeModal(); this.paint(el); U.toast('Registro reactivado'); } }] : [] };
    document.getElementById('cat-table').innerHTML = U.grid({ id: 'tab-' + c.id, title: c.nombre.toLowerCase(), export: 'maestro_' + c.tabla, rows: all, record: rec, pageSize: 12,
      cols: c.cols.map((col, i) => ({ k: i, label: col, render: i === 0 ? (r => `<span class="code">${U.esc(r[0])}</span>`) : null })).concat([{ k: n, label: 'Estado', render: r => U.tag(r[n] || 'Activo', r[n] === 'Inactivo' ? 't-gray' : 't-green') }]),
      rowCls: r => r[n] === 'Inactivo' ? 'row-void' : '',
      tools: [...(c.src ? [] : [{ icon: 'fa-plus', label: 'Nuevo registro', primary: true, fn: () => this.nuevo() }]), ...(c.id === 'catabi' ? [{ icon: 'fa-cloud-arrow-down', label: 'Sincronizar con SIGA-MEF', fn: () => this.sync() }] : []), ...(c.id === 'proved' ? [{ icon: 'fa-magnifying-glass', label: 'Consulta RUC (SUNAT)', fn: () => U.formModal('<i class="fa-solid fa-magnifying-glass"></i> Consulta RUC en línea', [{ k: 'r', label: 'RUC' }], v => { const ok = /^(10|15|17|20)\d{9}$/.test(v.r.trim()); U.closeModal(); U.toast(ok ? 'RUC ' + v.r + ' · ACTIVO · HABIDO · consulta registrada' : 'RUC inválido', ok ? 'ok' : 'err'); SIGA.log('Tablas maestras', 'Consulta RUC', v.r, '—', ok ? 'Activo · habido' : 'Inválido'); }, 'Consultar') }] : [])] });
  }
});
