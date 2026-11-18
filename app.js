/* Oveja Negra Wines — hero fijo con fotos, cartelera en vivo, armador de reservas por WhatsApp. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = '5491160438536';
  const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── barra superior y menú ── */
  const top = $('[data-top]'), menu = $('#menu'), mb = $('[data-menu]');
  mb?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    mb.setAttribute('aria-expanded', open); mb.textContent = open ? 'Cerrar' : 'Menú';
    top.classList.add('solid');
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); mb.setAttribute('aria-expanded', false); mb.textContent = 'Menú'; }));

  /* ── hero: las fotos cambian con el scroll y traen su color de fondo ── */
  const hero = $('[data-hero]'), frames = $$('.hero-frames figure');
  let cur = 0;
  const onScroll = () => {
    const y = scrollY;
    top.classList.toggle('solid', y > hero.offsetHeight - innerHeight || menu.classList.contains('open'));
    const p = Math.min(.999, Math.max(0, y / (hero.offsetHeight - innerHeight)));
    const i = Math.floor(p * frames.length);
    if (i !== cur) {
      frames[cur].classList.remove('on'); frames[i].classList.add('on'); cur = i;
      hero.style.setProperty('--g', frames[i].dataset.g);
    }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ── cartelera: qué día es en Buenos Aires y si estamos abiertos ── */
  const ahora = () => {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = t => f.find(x => x.type === t).value;
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
    return { dow, h: +g('hour') % 24, m: +g('minute') };
  };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const estado = () => {
    const { dow, h, m } = ahora(), el = $('[data-estado]');
    const abreHoy = dow >= 2 && dow <= 6;
    const prox = d => { for (let k = 1; k < 8; k++) { const x = (d + k) % 7; if (x >= 2 && x <= 6) return x; } };
    let txt;
    if (abreHoy && h >= 16) {
      const falta = (24 - h) * 60 - m, hs = Math.floor(falta / 60), mi = falta % 60;
      txt = `Hoy es ${DIAS[dow]} y <b>estamos abiertos</b>: cerramos a las 00, ${hs ? `en ${hs} h${mi ? ` y ${mi} min` : ''}` : `en ${mi} min`}.`;
    } else if (abreHoy) {
      const f2 = 960 - (h * 60 + m), hh = Math.floor(f2 / 60), mm = f2 % 60;
      txt = `Hoy es ${DIAS[dow]}: abrimos a las 16 h, ${hh ? `en ${hh} h${mm ? ` y ${mm} min` : ''}` : `en ${mm} min`}.`;
    } else {
      txt = `Hoy ${DIAS[dow]} está cerrado. Volvemos el ${DIAS[prox(dow)]} a las 16 h.`;
    }
    el.innerHTML = txt;
    $$('.dia').forEach(d => {
      const es = +d.dataset.dow === dow;
      d.classList.toggle('hoy', es);
      if (es && !d.dataset.touched) d.open = true;
    });
  };
  $$('.dia').forEach(d => d.addEventListener('toggle', () => { d.dataset.touched = 1; }));
  estado(); setInterval(estado, 60000);

  /* ── reservas: arma el mensaje que piden en sus posteos (nombre + cantidad) ── */
  const f = $('[data-res]'), prev = $('[data-prev]'), send = $('[data-send]');
  const mensaje = () => {
    const d = new FormData(f), noche = d.get('noche'), n = Math.max(1, +d.get('personas') || 1);
    const nombre = (d.get('nombre') || '').trim(), fecha = (d.get('fecha') || '').trim();
    const que = noche === 'After office' ? 'ir a la barra' : noche === 'Evento privado' ? 'consultar por un evento privado (me pasan el tarifario?)' : `reservar para ${noche}`;
    let t = `Hola! Quiero ${que}.\nSomos ${n} ${n === 1 ? 'persona' : 'personas'}.`;
    t += `\nFecha: ${fecha || (noche === 'After office' ? 'esta semana' : 'la próxima que hagan')}.`;
    t += `\nA nombre de: ${nombre || '(tu nombre)'}.`;
    prev.textContent = t; send.href = wa(t.replace('(tu nombre)', '').replace(/A nombre de: \.$/, '').trim());
  };
  f.addEventListener('input', mensaje); f.addEventListener('change', mensaje);
  $$('[data-step]').forEach(b => b.addEventListener('click', () => {
    const i = f.personas; i.value = Math.min(60, Math.max(1, (+i.value || 1) + +b.dataset.step)); mensaje();
  }));
  const elegir = v => {
    const r = $$('input[name=noche]', f).find(x => x.value === v);
    if (r) { r.checked = true; mensaje(); }
  };
  $$('[data-pre]').forEach(el => el.addEventListener('click', e => {
    elegir(el.dataset.pre);
    if (el.tagName === 'BUTTON') $('#reservar').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  mensaje();

  /* ── índice: la descripción aparece en el lugar fijo ── */
  const desc = $('[data-desc]'), base = desc?.textContent;
  $$('[data-cols] li').forEach(li => {
    const show = () => { $$('[data-cols] li.on').forEach(x => x.classList.remove('on')); li.classList.add('on'); desc.textContent = li.dataset.d; };
    li.addEventListener('mouseenter', show); li.tabIndex = 0; li.addEventListener('focus', show);
  });
  $('[data-cols]')?.addEventListener('mouseleave', () => { $$('[data-cols] li.on').forEach(x => x.classList.remove('on')); desc.textContent = base; });

  /* ── entradas por sección (título, texto, foto, escalonado) ── */
  const groups = [
    ['.intro', '.statement, .intro-cta, .intro-photo, .intro-note'],
    ['.cartelera', '.estado, .dia'],
    ['.noches', '.sec-h, .band-cap'],
    ['.indice', '.sec-h, .col, .cols-d'],
    ['.barra', '.sec-h, .statement, .carta-g'],
    ['.reservar', '.sec-h, fieldset, .res-row, .res-prev, [data-send]'],
    ['.resenas', '.spread p, .spread-by, .mas-resenas figure, .resenas-total'],
    ['.faq', '.faq-h, .faq-list details'],
    ['.contacto', '.cont-lead, .mapa, .numero, .cont-pie'],
    ['.pie', '.pie-cols > div, .pie-name'],
  ];
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  groups.forEach(([sec, kids]) => $$(kids, $(sec)).forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--i', i % 8); io.observe(el); }));
  $$('.panel, .galeria figure, .res-photo').forEach((el, i) => { el.classList.add('wipe'); el.style.transitionDelay = `${(i % 4) * 90}ms`; io.observe(el); });

  /* ── compartir y año ── */
  $('[data-share]')?.addEventListener('click', async e => {
    const d = { title: 'Oveja Negra Wines', text: 'Vinoteca y wine bar en Donado 1935, Villa Urquiza', url: location.href };
    try { if (navigator.share) await navigator.share(d); else { await navigator.clipboard.writeText(location.href); e.target.textContent = 'Link copiado'; } } catch {}
  });
  const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
