// Генерирует каталог, карточки препаратов и политику из data/*.
// Запуск: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { typograph } from './typograph.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { categories, products } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const policy = fs.readFileSync(path.join(ROOT, 'data/policy.html'), 'utf8');
const catByKey = Object.fromEntries(categories.map(c => [c.key, c]));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};
const drugs = n => `${n} ${plural(n, 'препарат', 'препарата', 'препаратов')}`;
const mb = b => (b / 1048576).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' МБ';
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const ICON = {
  gels: '<path d="M8 3h8v4l-1 1v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8L8 7z"/><path d="M9 12h6"/>',
  solutions: '<path d="M9 3h6M10 3v4l-3 3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9l-3-3V3"/><path d="M7 14h10"/>',
  drops: '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  tinctures: '<path d="M12 21c-4-2-7-6-7-11 4 0 7 2 7 6 0-4 3-6 7-6 0 5-3 9-7 11z"/><path d="M12 16V8"/>',
  powders: '<path d="M4 8h16l-1.5 11a2 2 0 0 1-2 1.7h-9a2 2 0 0 1-2-1.7z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  syrups: '<path d="M10 2h4v4l2 2v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-2z"/><path d="M8 13h8"/>',
  suppositories: '<path d="M12 3c2.5 2 4 5 4 8v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8c0-3 1.5-6 4-8z"/>',
  tablets: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M12 7.5l-3.7 8.3" transform="rotate(-35 12 12)"/>',
};
const icon = (key, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[key]}</svg>`;

// ---------- общая шапка: меню на десктопе, бургер с контактами на мобильных ----------
const NAV = [['index.html#about', 'О нас'], ['catalog.html', 'Каталог', 'catalog'], ['index.html#production', 'Производство'], ['index.html#documents', 'Документы'], ['index.html#contact', 'Контакты'], ['index.html#pharmacovigilance', 'Фармаконадзор']];
function header(base, active = '', onIndex = false) {
  // на главной — чистые якоря, чтобы переход не перезагружал страницу
  const href = h => onIndex ? h.replace(/^index.html(?=#)/, '') : base + h;
  const links = indent => NAV.map(([h, t, k]) => `<a href="${href(h)}"${k === active ? ' aria-current="page"' : ''}>${t}</a>`).join('\n' + indent);
  return `<header class="topbar">
      <a class="brand" href="${base}index.html"><img src="${base}img/p1-64.webp" width="26" height="34" alt=""><span class="brand-long">ООО «Тульская фармацевтическая фабрика»</span><span class="brand-short">Тульская фармацевтическая фабрика</span></a>
      <nav class="nav" aria-label="Основное меню">
        ${links('        ')}
      </nav>
      <button class="burger" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Открыть меню"><span></span><span></span><span></span></button>
    </header>
    <div class="mnav" id="mnav" hidden>
      <div class="mnav-panel" role="dialog" aria-modal="true" aria-label="Меню">
        <div class="mnav-head">
          <span class="brand"><img src="${base}img/p1-64.webp" width="22" height="29" alt="">Тульская фармацевтическая фабрика</span>
          <button class="mnav-close" type="button" aria-label="Закрыть меню"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
        <nav class="mnav-links" aria-label="Мобильное меню">
          ${links('          ')}
        </nav>
        <div class="mnav-contacts">
          <a href="tel:+74872410473"><small>Телефон</small>+7 (4872) 41-04-73</a>
          <a href="mailto:info@farmfabrica.ru"><small>Эл. почта</small>info@farmfabrica.ru</a>
          <span><small>Адрес</small>300004, Тула, Торховский пр-д, 10</span>
          <a href="tel:88007778604"><small>Фармаконадзор, бесплатно</small>8-800-777-86-04</a>
        </div>
        <a class="btn mnav-cta" href="${href('index.html#contact')}">Оставить заявку</a>
      </div>
    </div>`;
}

// ---------- общий каркас ----------
function page({ base, title, description, active, body }) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="${base}img/p1-64.webp" type="image/webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap"></noscript>
<link rel="stylesheet" href="${base}css/style.css">
</head>
<body>
<main class="page">
  <div class="card site-head">
    ${header(base, active)}
  </div>
${body}
  <footer class="card site-foot">
    <div class="foot-grid">
      <div>
        <span class="brand"><img src="${base}img/p1-64.webp" width="22" height="29" alt="">Тульская фармацевтическая фабрика</span>
        <p>300004, Тула, Торховский пр-д, 10<br><a href="tel:+74872410473">+7 (4872) 41-04-73</a> · <a href="mailto:info@farmfabrica.ru">info@farmfabrica.ru</a></p>
      </div>
      <div>
        <b>Фармаконадзор</b>
        <p>Сообщить о нежелательной реакции: <a href="tel:88007778604">8-800-777-86-04</a> (бесплатно) или <a href="https://drugsafety.ru/report" target="_blank" rel="noopener">drugsafety.ru/report</a></p>
      </div>
    </div>
    <p class="foot-note">© ООО «Тульская фармацевтическая фабрика», 1972–2026 · ИНН 7105028574 · ОГРН 1027100687745 · <a href="${base}policy.html">Политика конфиденциальности</a></p>
  </footer>
</main>
<script src="${base}js/menu.js" defer></script>
</body>
</html>
`;
}

function productCard(p, base, lazy = true) {
  const cat = catByKey[p.category];
  const media = p.image
    ? `<img src="${base}${p.image.src}" width="${p.image.w}" height="${p.image.h}"${lazy ? ' loading="lazy"' : ''} alt="">`
    : `<span class="ph-icon">${icon(p.category, 34)}</span>`;
  return `<a class="pcard" href="${base}products/${p.slug}.html" data-cat="${p.category}" data-q="${esc((p.name + ' ' + p.form).toLowerCase())}">
        <span class="pcard-media${p.image ? '' : ' empty'}">${media}</span>
        <span class="pcard-cat">${esc(cat.name)}</span>
        <span class="pcard-name">${esc(p.name)}</span>
        <span class="pcard-form">${esc(p.form)}</span>
      </a>`;
}

// ---------- каталог ----------
function catalogPage() {
  const body = `
  <section class="card cat-hero">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span>Каталог</span></nav>
    <div class="sec-head">
      <h1 class="h-section">Каталог <span class="sky">продукции</span></h1>
      <p>${drugs(products.length)} в восьми группах лекарственных форм. В карточке — состав, показания, способ применения и инструкция в PDF.</p>
    </div>
    <div class="filters">
      <label class="search"><span class="sr-only">Поиск по названию</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input id="q" type="search" placeholder="Название препарата или форма выпуска" autocomplete="off">
      </label>
      <div class="chips-filter" role="group" aria-label="Группа препаратов">
        <button type="button" class="fchip" data-cat="" aria-pressed="true">Все <span>${products.length}</span></button>
${categories.map(c => `        <button type="button" class="fchip" data-cat="${c.key}" aria-pressed="false">${esc(c.name)} <span>${c.count}</span></button>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="card" aria-label="Препараты">
    <p class="result" id="result" role="status" aria-live="polite">Показано: ${drugs(products.length)}</p>
    <div class="pgrid" id="pgrid">
      ${products.map(p => productCard(p, '')).join('\n      ')}
    </div>
    <div class="empty-state" id="empty" hidden>
      <b>Ничего не найдено</b>
      <p>Попробуйте другое название или выберите другую группу.</p>
      <button type="button" class="btn ghost" id="reset">Сбросить фильтры</button>
    </div>
  </section>

<script>
  // фильтр по группе и поиск; состояние хранится в адресе (?cat=…&q=…)
  const cards = [...document.querySelectorAll('#pgrid .pcard')];
  const chips = [...document.querySelectorAll('.fchip')];
  const q = document.getElementById('q'), result = document.getElementById('result'), empty = document.getElementById('empty');
  const plural = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'препарат' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'препарата' : 'препаратов'; };
  let cat = '';
  function apply() {
    const term = q.value.trim().toLowerCase();
    let n = 0;
    cards.forEach(c => { const ok = (!cat || c.dataset.cat === cat) && (!term || c.dataset.q.includes(term)); c.hidden = !ok; if (ok) n++; });
    chips.forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === cat));
    result.textContent = 'Показано: ' + n + ' ' + plural(n);
    empty.hidden = n > 0;
    const u = new URLSearchParams(); if (cat) u.set('cat', cat); if (term) u.set('q', term);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
  }
  chips.forEach(b => b.addEventListener('click', () => { cat = b.dataset.cat; apply(); }));
  q.addEventListener('input', apply);
  document.getElementById('reset').addEventListener('click', () => { cat = ''; q.value = ''; apply(); q.focus(); });
  const init = new URLSearchParams(location.search);
  if (chips.some(b => b.dataset.cat === init.get('cat'))) cat = init.get('cat');
  q.value = init.get('q') || '';
  apply();
</script>
`;
  return page({ base: '', title: 'Каталог продукции — Тульская фармацевтическая фабрика', description: `Каталог Тульской фармацевтической фабрики: ${drugs(products.length)} — мази, гели, растворы, настойки, суппозитории, порошки и сиропы.`, active: 'catalog', body });
}

// ---------- карточка препарата ----------
function productPage(p) {
  const base = '../';
  const cat = catByKey[p.category];
  const related = products.filter(x => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  const first = p.sections.find(s => s.title === 'Показания к применению') || p.sections[0];
  const description = `${p.name}${p.form ? ' — ' + p.form : ''}. ${first ? strip(first.html).slice(0, 140) : 'Производитель — Тульская фармацевтическая фабрика.'}`;
  const media = p.image
    ? `<img src="${base}${p.image.src}" width="${p.image.w}" height="${p.image.h}" fetchpriority="high" alt="${esc(p.name)}, упаковка">`
    : `<span class="ph-icon">${icon(p.category, 64)}<span>Фото упаковки готовится</span></span>`;
  const sections = p.sections.length
    ? p.sections.map((s, i) => `      <details class="instr" open>
        <summary><span class="instr-num">${String(i + 1).padStart(2, '0')}</span><span class="instr-title">${esc(s.title)}</span></summary>
        <div class="instr-body">${s.html}</div>
      </details>`).join('\n')
    : `      <p class="instr-empty">Описание препарата приведено в инструкции по медицинскому применению${p.pdf ? ' — скачайте её в формате PDF выше' : ''}.</p>`;

  const body = `
  <section class="card product">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="${base}index.html">Главная</a><a href="${base}catalog.html">Каталог</a><a href="${base}catalog.html?cat=${p.category}">${esc(cat.name)}</a><span>${esc(p.name)}</span></nav>
    <div class="product-grid">
      <div class="product-media${p.image ? '' : ' empty'}">${media}</div>
      <div class="product-info">
        <a class="kind" href="${base}catalog.html?cat=${p.category}">${icon(p.category, 16)}${esc(cat.name)}</a>
        <h1 class="product-title">${esc(p.name)}</h1>
        ${p.form ? `<p class="product-form">${esc(p.form)}</p>` : ''}
        <dl class="specs">
          <div><dt>Группа</dt><dd>${esc(cat.name)}</dd></div>
          ${p.form ? `<div><dt>Форма выпуска</dt><dd>${esc(p.form)}</dd></div>` : ''}
          <div><dt>Производитель</dt><dd>ООО «Тульская фармацевтическая фабрика», Россия</dd></div>
        </dl>
        <div class="actions">
          ${p.pdf ? `<a class="btn" href="${p.pdf.url}" download>Скачать инструкцию <span>PDF, ${mb(p.pdf.size)}</span></a>` : ''}
          <a class="btn ghost" href="${base}catalog.html?cat=${p.category}">Все препараты группы</a>
        </div>
        <p class="disclaimer">Информация носит справочный характер. Перед применением прочитайте инструкцию и проконсультируйтесь со специалистом.</p>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="sec-head"><h2 class="h-section">Инструкция <span class="sky">по применению</span></h2></div>
    <div class="instr-list">
${sections}
    </div>
  </section>
${related.length ? `
  <section class="card">
    <div class="sec-head">
      <h2 class="h-section">Ещё в группе <span class="sky">«${esc(cat.name)}»</span></h2>
      <a class="more" href="${base}catalog.html?cat=${p.category}">Все ${drugs(cat.count)} →</a>
    </div>
    <div class="pgrid related">
      ${related.map(r => productCard(r, base)).join('\n      ')}
    </div>
  </section>
` : ''}`;
  return page({ base, title: `${p.name} — Тульская фармацевтическая фабрика`, description, active: 'catalog', body });
}

function policyPage() {
  const body = `
  <section class="card policy">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span>Политика конфиденциальности</span></nav>
    <h1 class="h-section">Политика <span class="sky">конфиденциальности</span></h1>
    <div class="policy-body">${policy}</div>
  </section>
`;
  return page({ base: '', title: 'Политика конфиденциальности — Тульская фармацевтическая фабрика', description: 'Политика конфиденциальности персональных данных ООО «Тульская фармацевтическая фабрика».', active: '', body });
}

// ---------- запись ----------
const outDir = path.join(ROOT, 'products');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir);
const write = (file, html) => fs.writeFileSync(file, typograph(html));
write(path.join(ROOT, 'catalog.html'), catalogPage());
write(path.join(ROOT, 'policy.html'), policyPage());
for (const p of products) write(path.join(outDir, p.slug + '.html'), productPage(p));

// главная свёрстана вручную: подставляем общую шапку между метками и прогоняем типограф
const indexFile = path.join(ROOT, 'index.html');
let index = fs.readFileSync(indexFile, 'utf8');
const start = '<!-- header:start -->', end = '<!-- header:end -->';
if (!index.includes(start) || !index.includes(end)) throw new Error('в index.html нет меток шапки');
index = index.slice(0, index.indexOf(start) + start.length) + '\n    ' + header('', '', true) + '\n    ' + index.slice(index.indexOf(end));
write(indexFile, index);
console.log(`catalog.html, policy.html, products/*.html: ${products.length}`);
