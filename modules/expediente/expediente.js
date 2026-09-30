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

  // Expedientes de las certificaciones de la muestra: el recorrido se reconstruye de los propios registros
  (function () {
    const P = SIGA.data.presupuesto, A = SIGA.data.abastecimiento, G = SIGA.gen, r = G.rng(1313), FZ = ['Pendiente de aprobación', 'Certificado', 'Comprometido', 'Devengado', 'Girado', 'Pagado'];
    const at = (f, addMin) => { const [d, m] = f.split('/').map(Number), x = new Date(2026, m - 1, d, 8, 0); x.setMinutes(x.getMinutes() + addMin); return G.pad(x.getDate(), 2) + '/' + G.pad(x.getMonth() + 1, 2) + ' ' + G.pad(x.getHours(), 2) + ':' + G.pad(x.getMinutes(), 2); };
    P.certificaciones.filter(c => c.exp && !SIGA.exp.get(c.exp)).forEach(c => {
      const m = P.marco.find(x => x.id === c.marco), o = A.ordenes.find(x => x.cert === c.num && x.estado !== 'Anulada'), fi = FZ.indexOf(c.fase);
      let t = -G.int(r, 60, 300); const pasos = {}, step = (k, doc, who, gap) => { const w0 = at(c.fecha, t); t += gap; const w = at(c.fecha, t); pasos[k] = [doc, who, w, k === 'req' ? '' : dur(mins(w) - mins(w0))]; };
      step('req', 'REQ 2026-0' + (840 + (+c.num % 100)), 'Resp. CC ' + m.ccn.split(' — ')[0], 0);
      if (c.fase !== 'Anulada' || true) step('cert', 'CCP ' + c.num, c.aprob || 'M. Ríos', G.int(r, 40, 220));
      if (fi >= 2) step('comp', o ? o.doc : (m.clasif.startsWith('2.3.2') ? 'O/S 000' : 'O/C 000') + (400 + (+c.num % 90)), 'A. Torres', G.int(r, 180, 600));
      if (fi >= 3) { step('conf', o && o.doc.startsWith('O/S') ? 'Conformidad de servicio' : 'NEA 000' + (280 + (+c.num % 30)), o && o.doc.startsWith('O/S') ? 'Área usuaria' : 'J. Castro', G.int(r, 900, 2400)); step('dev', 'DEV 2026-0' + (500 + (+c.num % 90)), 'R. Soto', G.int(r, 60, 240)); }
      if (fi >= 4) step('gir', 'C/P 2026-0' + (560 + (+c.num % 40)), 'L. Vargas', G.int(r, 120, 360));
      if (fi >= 5) step('pag', 'Abono CCI', 'Banco de la Nación', G.int(r, 60, 1200));
      D.lista.push({ id: c.exp, asunto: c.just || m.desc, cc: m.ccn, monto: c.monto, prov: o ? o.prov : 'por adjudicar', pasos, anulado: c.fase === 'Anulada', motivo: c.motivo });
    });
    D.lista.sort((a, b) => b.id.localeCompare(a.id));
  })();
  const etapaDe = e => e.anulado ? 'Anulado' : avance(e) === D.etapas.length ? 'Pagado' : D.etapas[avance(e)].t;
  const expRec = SIGA.recs.expediente = {
    mod: 'Expediente', tipo: 'Carátula de expediente digital', office: 'Dirección General de Administración · trámite documentario', key: e => e.id, title: e => 'Expediente ' + e.id, cls: false,
    view: e => SIGA.modules.expediente.ver(e.id),
    fields: e => [['Expediente', e.id], ['Asunto', e.asunto, 1], ['Centro de costo', e.cc], ['Proveedor / beneficiario', e.prov], ['Importe', SIGA.ui.money(e.monto)], ['Etapa actual', etapaDe(e)], ['Etapas completadas', avance(e) + ' de ' + D.etapas.length]],
    extra: e => [{ icon: 'fa-file-zipper', label: 'Descargar expediente digital', fn: x => SIGA.modules.expediente.descargar(x) }],
    print: e => ({ tipo: 'Carátula de expediente', num: e.id, body: `<table class="doc-tbl"><thead><tr><th>Etapa</th><th>Documento</th><th>Responsable</th><th>Fecha</th><th>Tiempo</th></tr></thead><tbody>${D.etapas.map(s => { const p = e.pasos[s.k]; return `<tr><td>${s.t}</td><td>${p ? p[0] : '—'}</td><td>${p ? p[1] : '—'}</td><td>${p ? p[2] : '—'}</td><td>${p ? p[3] || '' : ''}</td></tr>`; }).join('')}</tbody></table>` })
  };

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
          </div>
        ${U.kpis([
          { lab: 'Expedientes en trámite', val: L.length - fin, sub: fin + ' concluidos en el periodo' },
          { lab: 'Tiempo promedio SIGA-U', val: '2.4 días', sub: 'requerimiento → pago', color: 'var(--primary-dark)' },
          { lab: 'Mismo recorrido hoy', val: '≈ 21 días', sub: 'traslado físico entre 5 oficinas', color: 'var(--danger)' },
          { lab: 'Registros huérfanos', val: '0', sub: 'integridad referencial garantizada', chip: 'OK' }
        ])}
        <div class="card mb"><h3><span class="dot"></span>Intervención de las oficinas en el flujo del gasto <span class="grow">el dato se registra una vez, donde ocurre</span></h3>
          <div class="flow">${D.etapas.map((s, i) => `${i ? '<div class="fa"><i class="fa-solid fa-chevron-right"></i></div>' : ''}<div class="fs on"><div class="fi"><i class="fa-solid ${['fa-clipboard-list', 'fa-file-invoice-dollar', 'fa-file-signature', 'fa-box-open', 'fa-scale-balanced', 'fa-money-check-dollar', 'fa-building-columns'][i]}"></i></div><b>${s.t}</b><span>${s.of}</span></div>`).join('')}</div></div>
        <div class="card"><h3><span class="dot"></span>Expedientes <span class="grow">clic para ver el recorrido</span></h3><div id="ex-t"></div></div>`;
      document.getElementById('ex-t').innerHTML = U.grid({ id: 'exp-lista', title: 'expedientes', export: 'expedientes_2026', rows: L, record: expRec, pageSize: 12,
        filter: { label: 'Etapa', get: etapaDe },
        cols: [
          { k: 'id', label: 'Expediente', render: r => `<span class="code">${r.id}</span>${r.nuevo ? ' ' + U.tag('nuevo', 't-teal') : ''}` },
          { k: 'asunto', label: 'Asunto', render: r => `${U.esc(r.asunto)}<div class="mini">${r.cc}</div>`, csv: r => r.asunto },
          { k: 'docs', label: 'Documentos', nosort: true, render: r => `<span class="mini">${Object.values(r.pasos).map(p => p[0]).filter(x => /^(CCP|O\/|C\/P|NEA|DEV)/.test(x)).join(' · ')}</span>` },
          { k: 'monto', label: 'Importe', r: true, render: r => U.money(r.monto) },
          { k: 'et', label: 'Etapa actual', sv: r => r.anulado ? -1 : avance(r), render: r => { const e = etapaDe(r); return U.tag(e, e === 'Pagado' ? 't-green' : e === 'Anulado' ? 't-red' : 't-blue'); } },
          { k: 'av', label: 'Recorrido', sv: avance, render: r => `<div class="row-flex" style="gap:3px">${D.etapas.map(s => `<span title="${s.t}" style="width:18px;height:6px;border-radius:4px;background:${r.pasos[s.k] ? (r.anulado ? '#94a3b8' : 'var(--primary)') : 'var(--line)'}"></span>`).join('')}</div>` }
        ], rowCls: r => (r.nuevo ? 'row-new' : '') + (r.anulado ? ' row-void' : ''),
        actions: [{ icon: 'fa-route', title: 'Ver recorrido', fn: e => this.ver(e.id) }],
        bulk: [{ icon: 'fa-print', label: 'Imprimir carátulas', fn: rs => U.preview('Carátulas de expediente · ' + rs.length, rs.map(e => U.doc(Object.assign({ office: expRec.office, pairs: expRec.fields(e) }, expRec.print(e)))).join('<div class="pg-break"></div>'), { file: 'caratulas_expedientes' }) }] });
      if (this.q) setTimeout(() => { const i = document.querySelector('#ex-t [data-gq]'); if (i) { i.value = this.q; i.dispatchEvent(new Event('input')); } this.q = ''; }, 30);
    },
    descargar(e) {
      const U = SIGA.ui, docs = Object.values(e.pasos).map(p => p[0]).filter(x => x && x !== '—' && x.indexOf('Abono') < 0);
      SIGA.log('Expediente', 'Descarga de expediente digital', e.id);
      U.preview('Expediente digital ' + e.id, U.doc(Object.assign({ office: expRec.office, pairs: expRec.fields(e) }, expRec.print(e), { body: expRec.print(e).body + `<p class="mini">Documentos firmados digitalmente incluidos (${docs.length}): ${docs.join(' · ')}</p>` })), { file: 'expediente_' + e.id });
    },
    ver(id) {
      const U = SIGA.ui, e = SIGA.exp.get(id); if (!e) return;
      const a = avance(e);
      const steps = D.etapas.map((s, i) => {
        const p = e.pasos[s.k];
        return { t: s.t, doc: p ? p[0] : '', sub: p ? s.of + ' · ' + p[1] : s.of, when: p ? p[2] : '', dur: p && p[3] ? p[3] : '', st: p ? 'done' : i === a ? 'cur' : '' };
      });
      const docs = Object.values(e.pasos).map(p => p[0]).filter(x => x && x !== '—' && x.indexOf('Abono') < 0);
      U.modal('Expediente ' + e.id, `<div class="split"><div>${e.anulado ? `<div class="note warn"><i class="fa-solid fa-ban"></i><div>Expediente anulado · ${U.esc(e.motivo || 'certificación anulada')}</div></div>` : ''}${U.kv([['Asunto', e.asunto], ['Centro de costo', e.cc], ['Proveedor / beneficiario', e.prov], ['Importe', U.money(e.monto)], ['Etapas completadas', a + ' de ' + D.etapas.length]])}
          <div class="lbl-s mt" style="margin-bottom:8px">Recorrido y tiempo por etapa</div>${U.timeline(steps)}</div>
          <div><div class="cmp" style="grid-template-columns:1fr"><div class="tobe"><h5>Con SIGA-U</h5>Cada etapa se registra una vez y la siguiente oficina la recibe al instante, con alerta. Sin traslado físico.</div><div class="asis"><h5>Hoy</h5>El expediente viaja en papel entre cinco oficinas; cada una vuelve a digitar y a esperar.</div></div>
          <div class="lbl-s mt" style="margin-bottom:8px">Expediente digital · documentos</div>
          ${docs.map(x => `<div class="doc-attach"><i class="fa-solid fa-file-pdf"></i><span>${x}.pdf</span>${U.tag('<i class="fa-solid fa-signature"></i> firmado', 't-green')}</div>`).join('')}</div></div>`,
        `<button class="btn ghost" data-close>Cerrar</button><button class="btn sec" id="ex-pdf"><i class="fa-solid fa-file-zipper"></i> Descargar expediente</button>`, 'wide')
        .querySelector('#ex-pdf').addEventListener('click', () => this.descargar(e));
    }
  });
})();
