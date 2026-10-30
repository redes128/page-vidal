(function () {
  const D = window.DATOS, $ = s => document.querySelector(s);
  const fmt = n => n.toLocaleString('es-BO');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const OTRAS = '114, 117, 121–124, 127–129';

  // Pestañas
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('main > section').forEach(s => s.hidden = s.id !== b.dataset.t);
    try { localStorage.setItem('tecno-tab', b.dataset.t); } catch (e) {}
  });
  try { const t = localStorage.getItem('tecno-tab'); if (t) document.querySelector(`nav [data-t="${t}"]`)?.click(); } catch (e) {}

  // Resumen
  const T = D.totales, univ = D.mesas.filter(m => m.tipo !== 'Docente');
  $('#kpis').innerHTML = [
    [T.docentes, 'docentes habilitados'],
    [T.estudiantes, 'estudiantes habilitados'],
    [D.mesas.length, `mesas (2 de docentes, ${univ.length} de estudiantes)`],
    [T.sis, 'estudiantes de Sistemas y afines'],
    [T.qui, 'estudiantes de Química Industrial'],
    [T.estudiantes - T.sis - T.qui, 'estudiantes de otras carreras'],
  ].map(([n, t]) => `<div class="kpi"><b>${fmt(n)}</b><span>${t}</span></div>`).join('');

  $('#delegados').innerHTML = `<p>Con un delegado por mesa se necesitan <b>${D.mesas.length} personas</b>: <b>2 docentes</b> (mesa 18 en Tecnología y mesa 21 en Monteagudo) y <b>${univ.length} estudiantes</b> (${univ.length - 1} en la Facultad de Tecnología y 1 en Monteagudo, mesa 154).</p>
  <p class="nota">Las mesas más grandes (114, 118, 119, 120, 125: unas 360–390 personas) conviene cubrirlas con 2 delegados para turnarse.</p>`;

  // Mesas
  const max = Math.max(...D.mesas.map(m => Math.max(...m.anforas.map(a => a.n))));
  $('#tMesas').innerHTML = '<thead><tr><th>Mesa</th><th>Recinto</th><th>Quiénes votan</th><th>Ánforas (votantes)</th><th>Apellidos (aprox.)</th></tr></thead><tbody>' +
    D.mesas.map(m => {
      const dec = m.anforas.find(a => /Tecnolog/i.test(a.conv));
      return `<tr><td class="mesa-n">${m.mesa}</td><td>${esc(m.recinto)}<br><span class="nota">${m.tipo}</span></td>
      <td>${esc(m.carrera)}${dec ? `<div class="barra" title="${dec.n}"><i style="width:${dec.n / max * 100}%"></i></div><span class="nota">${dec.n} votan decano</span>` : ''}</td>
      <td>${m.anforas.map(a => `<div><span class="nota">${esc(a.conv)}:</span> <b>${a.n}</b></div>`).join('')}</td>
      <td>${m.rango ? esc(m.rango) : '<span class="nota">—</span>'}</td></tr>`;
    }).join('') + '</tbody>';

  // Estudiantes
  const cars = [...new Set(D.estudiantes.map(e => e.c))];
  $('#fCar').innerHTML = '<option value="">Todas las carreras</option>' + cars.map(c => `<option>${esc(c)}</option>`).join('');
  $('#fMesa').innerHTML = '<option value="">Todas las mesas</option>' + univ.map(m => `<option value="${m.mesa}">Mesa ${m.mesa}</option>`).join('') + '<option value="x">Mesa sin confirmar</option>';
  let letra = '';
  const letras = [...new Set(D.estudiantes.map(e => norm(e.n)[0].toUpperCase()))].sort();
  $('#letras').innerHTML = ['Todas', ...letras].map(l => `<button data-l="${l === 'Todas' ? '' : l}" class="${l === 'Todas' ? 'on' : ''}">${l}</button>`).join('');
  $('#letras').onclick = e => {
    if (!e.target.dataset || e.target.dataset.l === undefined) return;
    letra = e.target.dataset.l;
    $('#letras').querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.target));
    pintaEst();
  };
  D.estudiantes.forEach(e => e.k = norm(e.n));
  function pintaEst() {
    const q = norm($('#q').value.trim()), c = $('#fCar').value, m = $('#fMesa').value, o = $('#fOtro').value;
    const r = D.estudiantes.filter(e => (!q || e.k.includes(q)) && (!c || e.c === c) && (!letra || e.k[0].toUpperCase() === letra)
      && (!m || (m === 'x' ? !e.m : e.m == m)) && (!o || e.o.length));
    $('#cuenta').textContent = `${fmt(r.length)} estudiantes`;
    $('#tEst').innerHTML = '<thead><tr><th>#</th><th>Nombre</th><th>Carrera</th><th>Mesa</th></tr></thead><tbody>' +
      r.slice(0, 400).map((e, i) => `<tr><td class="nota">${i + 1}</td><td>${esc(e.n)}${e.o.map(f => ` <span class="chip wr">también ${esc(f)}</span>`).join('')}</td>
      <td>${esc(e.c)}</td><td>${e.m ? `<b>${e.m}</b>` : `<span class="nota">${OTRAS}</span>`}</td></tr>`).join('') + '</tbody>';
  }
  ['#q', '#fCar', '#fMesa', '#fOtro'].forEach(s => $(s).addEventListener('input', pintaEst));
  pintaEst();

  // Docentes
  D.docentes.forEach(d => d.k = norm(d.n));
  function pintaDoc() {
    const q = norm($('#qd').value.trim()), m = $('#fdMesa').value, v = $('#fdVota').value;
    const r = D.docentes.filter(d => (!q || d.k.includes(q)) && (!m || d.m == m) && (!v || d.v.includes(v)));
    $('#cuentaD').textContent = `${r.length} docentes`;
    $('#tDoc').innerHTML = '<thead><tr><th>#</th><th>Docente</th><th>Mesa</th><th>Vota por</th><th>Carreras donde dicta (materias)</th></tr></thead><tbody>' +
      r.map((d, i) => `<tr><td class="nota">${i + 1}</td><td>${esc(d.n)}${d.o.map(f => ` <span class="chip wr">también ${esc(f)}</span>`).join('')}</td>
      <td><b>${d.m}</b>${d.m === 21 ? '<br><span class="nota">Monteagudo (prob.)</span>' : ''}</td>
      <td>${d.v.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</td>
      <td class="nota">${d.car.length ? d.car.map(esc).join('<br>') : '—'}</td></tr>`).join('') + '</tbody>';
  }
  ['#qd', '#fdMesa', '#fdVota'].forEach(s => $(s).addEventListener('input', pintaDoc));
  pintaDoc();

  // Observaciones
  const eo = D.estudiantes.filter(e => e.o.length), dn = D.docentes.filter(d => d.o.length);
  const cuenta = a => Object.entries(a.flatMap(x => x.o).reduce((m, f) => (m[f] = (m[f] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
  $('#obsBox').innerHTML = `<ul class="obs">
    <li><b>${eo.length} estudiantes</b> figuran también en el padrón de decano de otra facultad (estudian dos carreras): ${cuenta(eo).map(([f, n]) => `${esc(f)} ${n}`).join(', ')}. Filtro “En 2 facultades” en <i>Buscar estudiante</i>.</li>
    <li><b>${dn.length} docentes</b> figuran también en el padrón de decano de otra facultad: ${cuenta(dn).map(([f, n]) => `${esc(f)} ${n}`).join(', ')}.</li>
    <li>En las mesas de Sistemas votan <b>31 personas más</b> por Director que por Decano, y en las de Química <b>64 más</b>. Esos estudiantes votan por Decano en otra mesa, probablemente porque estudian otra carrera de la facultad.</li>
    <li>Los 4.508 estudiantes también están en el padrón de Rector-Vicerrector; no hay nadie que vote solo por Decano.</li>
    <li>Monteagudo: 6 docentes y 31 estudiantes votan Decano de Ciencias y Tecnología allá (mesas 21 y 154).</li>
  </ul>
  <p class="nota">Fuente: Padrón Oficial Claustro 2026 (Decano CyT, Director Sistemas, Director Química Industrial, Rector-Vicerrector), PDF “Recintos, mesas y número de votantes” y Plan de Estudios USFX.</p>`;
})();
