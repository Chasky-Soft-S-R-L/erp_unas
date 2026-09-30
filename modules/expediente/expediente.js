/* Seguimiento de expediente · trazabilidad completa del gasto, del requerimiento al pago */
(function () {
  const D = SIGA.data.expediente;
  const hhmm = () => SIGA.ctx.hoyCorta + ' ' + SIGA.ui.clock().slice(0, 5);
  // "dd/mm HH:MM" → minutos del año 2026 (para medir el tiempo entre etapas)
  const mins = w => { const m = /(\d\d)\/(\d\d) (\d\d):(\d\d)/.exec(w || ''); return m ? (new Date(2026, +m[2] - 1, +m[1], +m[3], +m[4]) - new Date(2026, 0, 1)) / 60000 : null; };
  const dur = d => d < 60 ? Math.max(1, Math.round(d)) + ' min' : d < 1440 ? Math.floor(d / 60) + ' h ' + Math.round(d % 60) + ' min' : Math.floor(d / 1440) + ' d ' + Math.round(d % 1440 / 60) + ' h';
  // API usada por los demás módulos para registrar el avance del expediente
  SIGA.exp = {
    get: id => D.lista.find(e => e.id === id),
    nuevo({ id, asunto, cc, monto, cert, prov }) {
      if (SIGA.exp.get(id)) return;
      D.lista.unshift({ id, asunto, cc, monto, prov: prov || '—', nuevo: true, t0: Date.now(), pasos: { req: ['REQ ' + id.slice(-4), SIGA.ctx.user.nombre, hhmm(), ''] } });
    },
    stage(id, key, doc, sub) {
      const e = SIGA.exp.get(id); if (!e) return;
      const ks = D.etapas.map(s => s.k), i = ks.indexOf(key);
      // etapas intermedias no registradas se completan con el mismo acto (sin registros huérfanos)
      ks.slice(0, i).forEach(k => { if (!e.pasos[k]) e.pasos[k] = [doc, SIGA.ctx.user.nombre, hhmm(), '—']; });
      const prev = ks.slice(0, i).reverse().map(k => e.pasos[k]).find(p => p && mins(p[2]) != null);
      const w = hhmm(), d = prev ? mins(w) - mins(prev[2]) : null;
      e.pasos[key] = [doc, SIGA.ctx.user.nombre + (sub ? ' · ' + sub : ''), w, d != null && d >= 0 ? dur(d) : 'en línea'];
    }
  };
  const avance = e => D.etapas.filter(s => e.pasos[s.k]).length;

  SIGA.registerModule('expediente', {
    title: 'Seguimiento de expediente', icon: 'fa-route', group: 'Principal',
    search(q) {
      return D.lista.filter(e => (e.id + ' ' + e.asunto + ' ' + e.prov + ' ' + Object.values(e.pasos).map(p => p[0]).join(' ')).toLowerCase().includes(q))
        .map(e => ({ t: e.id + ' · ' + SIGA.ui.money(e.monto), d: e.asunto, fn: () => this.ver(e.id) }));
    },
    render(el) {
      const U = SIGA.ui, L = D.lista;
      const fin = L.filter(e => avance(e) === D.etapas.length).length;
      el.innerHTML = `
        <div class="page-head"><div><h1>Seguimiento de expediente</h1><p>Trazabilidad completa del gasto: del requerimiento del área usuaria al pago al proveedor, con el tiempo de cada etapa</p></div>
          <div class="searchbar" style="min-width:300px"><i class="fa-solid fa-magnifying-glass"></i><input id="ex-q" placeholder="N° de expediente, CCP, O/C, proveedor…"></div></div>
        ${U.kpis([
          { lab: 'Expedientes en trámite', val: L.length - fin, sub: fin + ' concluidos en el periodo' },
          { lab: 'Tiempo promedio SIGA-U', val: '2.4 días', sub: 'requerimiento → pago', color: 'var(--primary-dark)' },
          { lab: 'Mismo recorrido hoy', val: '≈ 21 días', sub: 'traslado físico entre 5 oficinas', color: 'var(--danger)' },
          { lab: 'Registros huérfanos', val: '0', sub: 'integridad referencial garantizada', chip: 'OK' }
        ])}
        <div class="card mb"><h3><span class="dot"></span>Intervención de las oficinas en el flujo del gasto <span class="grow">el dato se registra una vez, donde ocurre</span></h3>
          <div class="flow">${D.etapas.map((s, i) => `${i ? '<div class="fa"><i class="fa-solid fa-chevron-right"></i></div>' : ''}<div class="fs on"><div class="fi"><i class="fa-solid ${['fa-clipboard-list', 'fa-file-invoice-dollar', 'fa-file-signature', 'fa-box-open', 'fa-scale-balanced', 'fa-money-check-dollar', 'fa-building-columns'][i]}"></i></div><b>${s.t}</b><span>${s.of}</span></div>`).join('')}</div></div>
        <div class="card"><h3><span class="dot"></span>Expedientes <span class="grow">clic para ver el recorrido</span></h3><div id="ex-t"></div></div>`;
      const paint = q => {
        const rows = L.filter(e => !q || (e.id + ' ' + e.asunto + ' ' + e.prov + ' ' + Object.values(e.pasos).map(p => p[0]).join(' ')).toLowerCase().includes(q.toLowerCase()));
        document.getElementById('ex-t').innerHTML = U.table([
          { k: 'id', label: 'Expediente', render: r => `<span class="code">${r.id}</span>${r.nuevo ? ' ' + U.tag('nuevo', 't-teal') : ''}` },
          { k: 'asunto', label: 'Asunto', render: r => `${r.asunto}<div class="mini">${r.cc}</div>` },
          { k: 'monto', label: 'Importe', r: true, render: r => U.money(r.monto) },
          { k: 'et', label: 'Etapa actual', render: r => { const a = avance(r); return a === D.etapas.length ? U.tag('Pagado', 't-green') : U.tag(D.etapas[a].t, 't-blue'); } },
          { k: 'av', label: 'Recorrido', render: r => `<div class="row-flex" style="gap:3px">${D.etapas.map(s => `<span title="${s.t}" style="width:18px;height:6px;border-radius:4px;background:${r.pasos[s.k] ? 'var(--primary)' : 'var(--line)'}"></span>`).join('')}</div>` }
        ], rows, { onRow: e => this.ver(e.id), rowCls: r => r.nuevo ? 'row-new' : '' });
      };
      paint('');
      document.getElementById('ex-q').addEventListener('input', e => paint(e.target.value));
    },
    ver(id) {
      const U = SIGA.ui, e = SIGA.exp.get(id); if (!e) return;
      const a = avance(e);
      const steps = D.etapas.map((s, i) => {
        const p = e.pasos[s.k];
        return { t: s.t, doc: p ? p[0] : '', sub: p ? s.of + ' · ' + p[1] : s.of, when: p ? p[2] : '', dur: p && p[3] ? p[3] : '', st: p ? 'done' : i === a ? 'cur' : '' };
      });
      const docs = Object.values(e.pasos).map(p => p[0]).filter(x => x && x !== '—' && x.indexOf('Abono') < 0);
      U.modal('Expediente ' + e.id, `<div class="split"><div>${U.kv([['Asunto', e.asunto], ['Centro de costo', e.cc], ['Proveedor / beneficiario', e.prov], ['Importe', U.money(e.monto)], ['Etapas completadas', a + ' de ' + D.etapas.length]])}
          <div class="lbl-s mt" style="margin-bottom:8px">Recorrido y tiempo por etapa</div>${U.timeline(steps)}</div>
          <div><div class="cmp" style="grid-template-columns:1fr"><div class="tobe"><h5>Con SIGA-U</h5>Cada etapa se registra una vez y la siguiente oficina la recibe al instante, con alerta. Sin traslado físico.</div><div class="asis"><h5>Hoy</h5>El expediente viaja en papel entre cinco oficinas; cada una vuelve a digitar y a esperar.</div></div>
          <div class="lbl-s mt" style="margin-bottom:8px">Expediente digital · documentos</div>
          ${docs.map(x => `<div class="doc-attach"><i class="fa-solid fa-file-pdf"></i><span>${x}.pdf</span>${U.tag('<i class="fa-solid fa-signature"></i> firmado', 't-green')}</div>`).join('')}</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn sec" id="ex-pdf"><i class="fa-solid fa-file-zipper"></i> Descargar expediente</button>`, 'wide')
        .querySelector('#ex-pdf').addEventListener('click', () => { U.toast('Expediente ' + e.id + ' exportado con ' + docs.length + ' documentos firmados'); SIGA.log('Expediente', 'Descarga de expediente digital', e.id); });
    }
  });
})();
