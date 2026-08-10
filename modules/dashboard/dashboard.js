SIGA.registerModule('dashboard', {
  title: 'Tablero de control', icon: 'fa-gauge-high', group: 'Principal',
  render(el) {
    const d = SIGA.data.dashboard, U = SIGA.ui;
    const bars = list => `<div class="bars">${list.map(b => `<div class="brow"><span>${b[0]}</span><div class="track"><i style="width:${b[1]}%;background:${b[2]}"></i></div><span class="amt num">${b[3]}</span></div>`).join('')}</div>`;
    el.innerHTML = `
      <div class="hero">
        <div class="eyebrow">Sistema Integrado de Gestión Administrativa Universitaria</div>
        <h2>SIGA&#8209;U · Plataforma de gestión institucional</h2>
        <p>Ejecución presupuestal SIAF, abastecimiento, tesorería, contabilidad, planillas y el Centro de Producción agropecuario, integrados en una sola plataforma web.</p>
        <div class="stats">
          <div><b class="num">12</b><span>Módulos</span></div>
          <div><b class="num">166</b><span>Tablas</span></div>
          <div><b class="num">1,197</b><span>Trabajadores</span></div>
          <div><b class="num">S/ 118.4 M</b><span>Presupuesto 2025</span></div>
          <div><b class="num">S/ 3.42 M</b><span>Recursos propios</span></div>
        </div>
      </div>
      <div class="page-head"><div><h1>Tablero de control</h1><p>Ejecución presupuestal consolidada · todas las fuentes</p></div>
        <div style="display:flex;gap:8px"><button class="btn ghost" id="exp"><i class="fa-solid fa-download"></i> Exportar</button><button class="btn" id="newc"><i class="fa-solid fa-plus"></i> Nueva certificación</button></div></div>
      ${U.kpis([
        { lab: 'PIM 2025', val: 'S/ 118.4 M', sub: 'Presup. Inst. Modificado' },
        { lab: 'Certificado', val: 'S/ 116.9 M', sub: '98.7% del PIM', chip: '98.7%' },
        { lab: 'Devengado', val: 'S/ 108.0 M', sub: 'gasto ejecutado', chip: '91.2%' },
        { lab: 'Recaudado producción', val: 'S/ 3.42 M', sub: 'RDR · fuente 09', color: 'var(--primary-dark)', chip: 'RDR', chipType: 'info' }
      ])}
      <div class="card" style="margin-bottom:14px"><h3><span class="dot"></span>Cadena de ejecución del gasto — SIAF</h3>
        <div class="siaf">${d.siaf.map(s => `<div class="step ${s.st}"><div class="k">${s.k}</div><div class="v num">${s.v}</div><div class="p">${s.p}</div></div>`).join('')}</div></div>
      <div class="split" style="margin-bottom:14px">
        <div class="card"><h3><span class="dot"></span>Ejecución por genérica de gasto</h3>${bars(d.genericas)}
          <h3 style="margin-top:20px"><span class="dot"></span>Por fuente de financiamiento</h3>${bars(d.fuentes)}</div>
        <div><div class="saldo-box" style="margin-bottom:14px"><div class="lab">Avance de ejecución anual</div><div class="big num">91.2%</div>
          <div class="row"><span>Meta al mes</span><span class="g">91.7%</span></div>
          <div class="row"><span>Certificaciones activas</span><span>1,342</span></div>
          <div class="row"><span>Órdenes emitidas</span><span>2,015</span></div>
          <div class="row"><span>Comprobantes de pago</span><span>1,078</span></div></div>
          <div class="card"><h3><span class="dot"></span>Semáforo de partidas</h3>
            <div style="display:flex;flex-direction:column;gap:9px">
              <div style="display:flex;justify-content:space-between"><span class="mini">Con saldo &gt; 20%</span>${U.tag('184', 't-green')}</div>
              <div style="display:flex;justify-content:space-between"><span class="mini">Saldo 5%–20%</span>${U.tag('61', 't-amber')}</div>
              <div style="display:flex;justify-content:space-between"><span class="mini">Saldo &lt; 5%</span>${U.tag('23', 't-red')}</div>
              <div style="display:flex;justify-content:space-between"><span class="mini">Sobregiro</span>${U.tag('2', 't-gray')}</div></div></div></div>
      </div>
      <div class="card"><h3><span class="dot"></span>Últimos movimientos presupuestales <span class="grow">clic para ver detalle</span></h3><div id="mov"></div></div>`;

    document.getElementById('mov').innerHTML = U.table(
      [{ k: 'rcca', label: 'RCCA', render: r => `<span class="code">${r.rcca}</span>` },
      { k: 'fecha', label: 'Fecha', cls: 'num' }, { k: 'fte', label: 'Fuente' },
      { k: 'part', label: 'Partida', render: r => `<span class="code">${r.part}</span>` },
      { k: 'dep', label: 'Meta / Dependencia' },
      { k: 'imp', label: 'Importe', r: true, render: r => `<span class="num">${U.money(r.imp)}</span>` },
      { k: 'fase', label: 'Fase', render: r => U.tag(r.fase, r.faseCls) }],
      d.movimientos, {
      onRow: r => U.detail('Movimiento ' + r.rcca, [
        ['RCCA', r.rcca], ['Fecha', r.fecha], ['Fuente de financiamiento', r.fte],
        ['Partida', r.part], ['Meta / Dependencia', r.dep], ['Importe', U.money(r.imp)],
        ['Fase SIAF', U.tag(r.fase, r.faseCls)]
      ], `<button class="btn ghost" data-close>Cerrar</button><button class="btn" onclick="SIGA.go('presupuesto')"><i class="fa-solid fa-arrow-right"></i> Ir a Presupuesto</button>`)
    });

    document.getElementById('exp').addEventListener('click', () => U.toast('Exportando consolidado a Excel…'));
    document.getElementById('newc').addEventListener('click', () => SIGA.go('presupuesto'));
  }
});
