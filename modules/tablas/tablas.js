SIGA.registerModule('tablas', {
  title: 'Tablas maestras', icon: 'fa-database', group: 'Configuración',
  sel: 'proved',
  render(el) {
    const d = SIGA.data.tablas, U = SIGA.ui;
    el.innerHTML = `
      <div class="page-head"><div><h1>Tablas maestras</h1><p>Catálogos base del sistema · proveedores, bienes SIGA, plan contable, clasificadores</p></div></div>
      <div class="grid cols-3" style="margin-bottom:16px" id="cat-cards"></div>
      <div class="card"><h3><span class="dot"></span><span id="cat-title"></span> <span class="grow" id="cat-count"></span></h3>
        <div class="toolbar"><div class="searchbar"><i class="fa-solid fa-magnifying-glass"></i><input id="cat-q" placeholder="Buscar en el catálogo…"></div>
          <button class="btn sm" id="cat-add"><i class="fa-solid fa-plus"></i> Nuevo registro</button></div>
        <div id="cat-table"></div></div>`;

    document.getElementById('cat-cards').innerHTML = d.catalogos.map(c => `
      <div class="card" data-cat="${c.id}" style="cursor:pointer;transition:.15s;border-color:${c.id === this.sel ? 'var(--primary)' : 'var(--line)'}">
        <div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:10px;background:var(--bg);display:grid;place-items:center;color:var(--primary-dark);font-size:17px"><i class="fa-solid ${c.icon}"></i></div>
        <div><div style="font-weight:700;font-size:13px">${c.nombre}</div><div class="mini"><span class="code">${c.tabla}</span> · ${U.int(c.total)} registros</div></div></div></div>`).join('');

    el.querySelectorAll('[data-cat]').forEach(card => card.addEventListener('click', () => { this.sel = card.dataset.cat; this.render(el); }));
    this.paint(el);
    document.getElementById('cat-q').addEventListener('input', e => this.paint(el, e.target.value));
    document.getElementById('cat-add').addEventListener('click', () => {
      const c = d.catalogos.find(x => x.id === this.sel);
      U.formModal('Nuevo registro · ' + c.nombre, c.cols.map((col, i) => ({ k: 'c' + i, label: col, span: 1 })), v => {
        c.rows.unshift(c.cols.map((_, i) => v['c' + i] || '')); c.total++;
        U.closeModal(); this.render(el); U.toast('Registro agregado a ' + c.nombre + ' ✓');
      }, 'Agregar');
    });
  },

  paint(el, q = '') {
    const U = SIGA.ui, c = SIGA.data.tablas.catalogos.find(x => x.id === this.sel);
    document.getElementById('cat-title').textContent = c.nombre;
    document.getElementById('cat-count').innerHTML = `<span class="code">${c.tabla}</span> · ${U.int(c.total)} registros`;
    const rows = q ? c.rows.filter(r => r.join(' ').toLowerCase().includes(q.toLowerCase())) : c.rows;
    document.getElementById('cat-table').innerHTML = U.table(
      c.cols.map((col, i) => ({ k: i, label: col, render: i === 0 ? (r => `<span class="code">${r[0]}</span>`) : null })),
      rows, {
      actions: [
        { icon: 'fa-pen', title: 'Editar', fn: (r, i) => {
          U.formModal('Editar registro', c.cols.map((col, ci) => ({ k: 'c' + ci, label: col, value: r[ci], span: 1 })), v => {
            c.cols.forEach((_, ci) => r[ci] = v['c' + ci]); U.closeModal(); this.paint(el, q); U.toast('Registro actualizado ✓');
          }, 'Guardar');
        } },
        { icon: 'fa-trash', title: 'Eliminar', cls: 'del', fn: r => U.confirm('¿Eliminar el registro <b>' + r[0] + '</b>?', () => { const idx = c.rows.indexOf(r); if (idx > -1) c.rows.splice(idx, 1); c.total--; this.paint(el, q); U.toast('Registro eliminado', 'err'); }, 'Eliminar') }
      ]
    });
  }
});
