/* ============================================================
   Seguridad y auditoría · informe 4.9.1, 4.9.2 y 5.7
   Bitácora inmutable · matriz de roles · segregación de funciones · políticas
   ============================================================ */
SIGA.registerModule('seguridad', {
  title: 'Seguridad y auditoría', icon: 'fa-shield-halved', group: 'Configuración y control', badge: 'OCI',
  fm: 'Todos', q: '',
  search(q) { return SIGA.data.seguridad.bitacora.filter(b => (b.ref + ' ' + b.acc + ' ' + b.user).toLowerCase().includes(q)).slice(0, 5).map(b => ({ t: b.acc + ' · ' + b.ref, d: b.user + ' · ' + b.ts, fn: () => { this.q = b.ref; SIGA.refresh(); } })); },
  render(el) {
    const U = SIGA.ui, S = SIGA.data.seguridad, B = S.bitacora;
    const mods = ['Todos', ...new Set(B.map(b => b.mod))];
    const hoy = B.filter(b => b.ts.startsWith(SIGA.ctx.hoy)), den = B.filter(b => /Denegado|rechazada|bloquead/i.test(b.despues + b.acc));
    el.innerHTML = `
      <div class="page-head"><div><h1>Seguridad y auditoría</h1><p>Toda operación queda registrada con usuario, fecha, IP, valor anterior y valor posterior · segregación de funciones automática · control de acceso por roles</p></div>
        <div class="row-flex"><button class="btn ghost" id="sg-user"><i class="fa-solid fa-user-gear"></i> Cambiar de usuario</button><button class="btn" id="sg-exp"><i class="fa-solid fa-file-export"></i> Exportar bitácora para el OCI</button></div></div>
      ${U.kpis([
        { lab: 'Operaciones con auditoría', val: '100%', sub: 'antes: 0% (D-23)', color: 'var(--ok)' },
        { lab: 'Registros de bitácora hoy', val: hoy.length, sub: 'se alimenta en vivo desde cada módulo' },
        { lab: 'Intentos bloqueados', val: den.length, sub: 'sin saldo, sin facultad o por segregación', color: den.length ? 'var(--danger)' : '' },
        { lab: 'Usuario en sesión', val: SIGA.ctx.user.ini, sub: SIGA.ctx.user.nombre + ' · ' + SIGA.ctx.user.rolTx }
      ])}
      <div class="seg-tabs" data-group="sg"><button class="on" data-tab="bit">Bitácora inmutable</button><button data-tab="rol">Matriz de roles</button><button data-tab="sod">Segregación de funciones</button><button data-tab="usu">Usuarios y sesiones</button><button data-tab="pol">Políticas</button><button data-tab="arq">Arquitectura</button></div>
      <div class="subpanel show" data-group="sg" data-panel="bit"><div class="card"><h3><span class="dot"></span>Bitácora de auditoría <span class="grow">no admite modificación ni borrado · cada registro con su huella</span></h3>
        <div class="toolbar"><div class="searchbar"><i class="fa-solid fa-magnifying-glass"></i><input id="sg-q" placeholder="Usuario, acción, documento…" value="${U.esc(this.q)}"></div><div class="chips" id="sg-chips">${mods.map(m => `<span class="chipf ${m === this.fm ? 'on' : ''}" data-m="${m}">${m}</span>`).join('')}</div></div>
        <div id="sg-t"></div></div></div>
      <div class="subpanel" data-group="sg" data-panel="rol"><div class="card"><h3><span class="dot"></span>Matriz de roles y facultades <span class="grow">ningún rol reúne la facultad de registrar y aprobar la misma operación</span></h3><div id="sg-r"></div></div></div>
      <div class="subpanel" data-group="sg" data-panel="sod" id="sg-p-sod"></div>
      <div class="subpanel" data-group="sg" data-panel="usu"><div class="card"><h3><span class="dot"></span>Usuarios, segundo factor y estado <span class="grow">permisos administrables por la universidad sin intervenir el código (D-24)</span></h3><div id="sg-u"></div></div></div>
      <div class="subpanel" data-group="sg" data-panel="pol"><div class="grid cols-4">${S.politicas.map(p => `<div class="card"><h3><i class="fa-solid ${p[0]}" style="color:var(--primary-dark)"></i> ${p[1]}</h3><p class="mini">${p[2]}</p></div>`).join('')}</div></div>
      <div class="subpanel" data-group="sg" data-panel="arq" id="sg-p-arq"></div>`;

    const paint = () => {
      const q = this.q.toLowerCase();
      const rows = B.filter(b => (this.fm === 'Todos' || b.mod === this.fm) && (!q || (b.user + ' ' + b.acc + ' ' + b.ref + ' ' + b.mod + ' ' + b.antes + ' ' + b.despues).toLowerCase().includes(q)));
      document.getElementById('sg-t').innerHTML = U.table([
        { k: 'ts', label: 'Fecha y hora', cls: 'mini' }, { k: 'user', label: 'Usuario', render: r => `<b>${r.user}</b><div class="mini">${r.rol}</div>` }, { k: 'ip', label: 'IP', render: r => `<span class="code">${r.ip}</span>` },
        { k: 'mod', label: 'Módulo' }, { k: 'acc', label: 'Acción', render: r => /Denegado|rechazada|bloquead|Intento/i.test(r.acc + r.despues) ? `<span class="saldo-neg">${r.acc}</span>` : r.acc }, { k: 'ref', label: 'Referencia', render: r => `<span class="code">${U.esc(r.ref)}</span>` },
        { k: 'cambio', label: 'Valor anterior → posterior', render: r => `<span class="mini">${U.esc(r.antes)}</span> <i class="fa-solid fa-arrow-right" style="font-size:9px;color:var(--muted)"></i> <span style="font-size:11.5px;font-weight:600">${U.esc(r.despues)}</span>` },
        { k: 'hash', label: 'Huella', render: r => `<span class="code" style="font-size:10px">${r.hash.slice(0, 8)}</span>` }
      ], rows.slice(0, 80), { empty: 'Sin registros para el filtro' });
    };
    paint();
    el.querySelector('#sg-q').addEventListener('input', e => { this.q = e.target.value; paint(); });
    el.querySelector('#sg-chips').addEventListener('click', e => { const c = e.target.closest('[data-m]'); if (!c) return; this.fm = c.dataset.m; el.querySelectorAll('#sg-chips .chipf').forEach(x => x.classList.toggle('on', x === c)); paint(); });
    el.querySelector('#sg-user').addEventListener('click', e => { e.stopPropagation(); document.querySelector('.topbar .user').click(); });
    el.querySelector('#sg-exp').addEventListener('click', () => { SIGA.log('Seguridad', 'Exportación de bitácora', B.length + ' registros', '—', 'Formato para el OCI'); U.toast('Bitácora exportada · ' + B.length + ' registros con su huella de integridad'); });

    document.getElementById('sg-r').innerHTML = U.table([{ k: 0, label: 'Rol', render: r => `<b>${r[0]}</b>` }, { k: 1, label: 'Registra', render: r => r[1] === '—' ? '<span class="mini">—</span>' : U.tag(r[1], 't-blue') }, { k: 2, label: 'Aprueba', render: r => r[2] === '—' ? '<span class="mini">—</span>' : U.tag(r[2], 't-teal') }, { k: 3, label: 'Consulta', cls: 'mini' }, { k: 4, label: 'Configura', cls: 'mini' }], S.roles);
    document.getElementById('sg-u').innerHTML = U.table([{ k: 1, label: 'Usuario', render: r => `<b>${r[1]}</b> <span class="code">${r[0]}</span>` }, { k: 2, label: 'Rol' }, { k: 3, label: '2FA', render: r => r[3] === 'Sí' ? U.tag('<i class="fa-solid fa-mobile-screen"></i> activo', 't-green') : U.tag('pendiente', 't-amber') }, { k: 4, label: 'Último acceso', cls: 'mini' }, { k: 5, label: 'Estado', render: r => U.tag(r[5], r[5] === 'Activo' ? 't-green' : r[5].startsWith('Solo') ? 't-blue' : 't-red') + (r[0] === SIGA.ctx.user.id ? ' ' + U.tag('en sesión', 't-teal') : '') }], S.usuarios,
      { actions: [{ icon: 'fa-unlock', title: 'Desbloquear cuenta', show: r => r[5].startsWith('Bloqueado'), fn: r => { r[5] = 'Activo'; SIGA.log('Seguridad', 'Desbloqueo de cuenta', r[0], 'Bloqueado', 'Activo'); U.toast('Cuenta ' + r[0] + ' desbloqueada · se exige cambio de contraseña'); SIGA.refresh(); } }] });

    // Simulador de segregación de funciones
    const ops = [['Certificación presupuestal', 'cert.aprobar', 'C. Quinto'], ['Requerimiento de S/ 48,600', 'req.aprobar.alto', 'J. Paredes'], ['Requerimiento de S/ 2,301', 'req.aprobar', 'P. Huamán'], ['Pago de comprobante', 'cp.pagar', 'K. Ramos'], ['Cierre contable', 'cierre', '—']];
    document.getElementById('sg-p-sod').innerHTML = `<div class="split"><div class="card"><h3><span class="dot"></span>¿Quién puede aprobar qué? <span class="grow">simulador con la sesión actual: <b>${SIGA.ctx.user.nombre}</b> · ${SIGA.ctx.user.rolTx}</span></h3>
      ${U.table([{ k: 0, label: 'Operación' }, { k: 2, label: 'Registrada por' }, { k: 'p', label: 'Facultad requerida', render: r => `<span class="code">${r[1]}</span>` }, { k: 'r', label: 'Resultado para usted', render: r => !SIGA.can(r[1]) ? U.tag('✗ Sin facultad', 't-red') : r[2] === SIGA.ctx.user.nombre ? U.tag('✗ Registró la operación', 't-red') : U.tag('✓ Puede aprobar', 't-green') }], ops)}
      <p class="mini mt">Cambie de usuario (esquina superior derecha) y vuelva a esta pestaña: el resultado se recalcula. Los intentos denegados quedan en la bitácora.</p></div>
      <div class="card"><h3><span class="dot"></span>Pruébelo en los módulos</h3><div class="checklist">${[['presupuesto', 'Aprobar la CCP 000419 como C. Quinto (analista) → sin facultad'], ['presupuesto', 'Aprobarla como M. Ríos (Jefe de P&P) → aprobada y enviada al SIAF'], ['presupuesto', 'Registrar una certificación como M. Ríos y aprobarla él mismo → bloqueado por segregación'], ['abastecimiento', 'Aprobar REQ 2026-0937 (S/ 48,600) como A. Torres → requiere DGA'], ['tesoreria', 'Confirmar un pago sin ser Tesorero → bloqueado'], ['contabilidad', 'Ejecutar el cierre sin ser Contador → bloqueado']].map(x => `<div class="ck ok" style="cursor:pointer" data-go="${x[0]}"><i class="fa-solid fa-arrow-right"></i><span>${x[1]}</span></div>`).join('')}</div></div></div>`;
    el.querySelectorAll('#sg-p-sod [data-go]').forEach(n => n.addEventListener('click', () => SIGA.go(n.dataset.go)));

    document.getElementById('sg-p-arq').innerHTML = `<div class="grid cols-4 mb">${[['fa-arrows-up-down-left-right', 'Escalable', 'Crece en usuarios, sedes y volumen sin rediseño · 250 usuarios concurrentes'], ['fa-mobile-screen-button', 'Web y móvil', 'Se accede desde cualquier oficina o campo, sin instalación'], ['fa-magnifying-glass-chart', 'Auditable', 'Toda operación queda registrada con usuario, fecha y valor previo'], ['fa-code-branch', 'Tecnología libre', 'Sin licencias por usuario · código propiedad de la universidad']].map(x => `<div class="card"><h3><i class="fa-solid ${x[0]}" style="color:var(--primary-dark)"></i> ${x[1]}</h3><p class="mini">${x[2]}</p></div>`).join('')}</div>
      <div class="split"><div class="card"><h3><span class="dot"></span>Construido para durar veinte años, no dos</h3>${U.timeline([{ t: 'Presentación · Vue', sub: 'navegador y dispositivos móviles', st: 'done' }, { t: 'Aplicación · Laravel (arquitectura limpia + DDD)', sub: 'instancias sin estado replicables · colas de trabajo', st: 'done' }, { t: 'Datos · PostgreSQL', sub: 'transacciones ACID · integridad referencial · réplicas de lectura', st: 'done' }, { t: 'Despliegue · Docker', sub: 'contenedores · respaldo horario · sitio alterno', st: 'done' }])}</div>
        <div class="card"><h3><span class="dot"></span>Frente al sistema actual</h3><div class="cmp" style="grid-template-columns:1fr"><div class="asis"><h5>admi26 · "el zorrito"</h5>Visual FoxPro 6 (1998) · 166 archivos DBF en una carpeta compartida · 430 programas y 811 formularios · 1 sola persona conoce el código · sin bitácora.</div><div class="tobe"><h5>SIGA-U</h5>Base de datos única con integridad garantizada · código versionado y documentado · bitácora inmutable · disponibilidad comprometida &gt; 99.5%.</div></div></div></div>`;
  }
});
