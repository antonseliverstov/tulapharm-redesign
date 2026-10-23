// Простой типограф: привязывает короткие предлоги, союзы и частицы к следующему слову
// неразрывным пробелом, а тире — к предыдущему. Трогает только текст, не теги и не <script>/<style>.
// Повторный запуск ничего не меняет.

const SHORT = [
  'в', 'во', 'без', 'до', 'из', 'к', 'ко', 'на', 'над', 'о', 'об', 'обо', 'от', 'по', 'под', 'при', 'про',
  'с', 'со', 'у', 'за', 'для', 'через', 'перед', 'между', 'и', 'а', 'но', 'да', 'или', 'либо', 'не', 'ни',
  'что', 'как', 'чем', 'это', 'то', 'все', 'его', 'её', 'ее', 'их', 'мы', 'вы', 'он', 'она', 'оно', 'они',
  'из-за', 'из-под', '№', '§',
];
const NBSP = '&nbsp;';
// длинные варианты первыми, чтобы «из-за» не разбилось на «из»; спецсимволов regex в списке нет
const word = [...SHORT].sort((x, y) => y.length - x.length).join('|');
// слово из списка, перед которым не буква/цифра, а после — обычный пробел и непробельный символ
const reShort = new RegExp(`(?<![\\p{L}\\p{N}\\-])(${word}) (?=[^\\s<])`, 'giu');

function fixText(t) {
  let prev;
  // два прохода: «и в Туле» — оба коротких слова подряд
  do { prev = t; t = t.replace(reShort, `$1${NBSP}`); } while (t !== prev);
  return t
    .replace(/ (—|–)(?=\s)/g, `${NBSP}$1`)         // тире не уходит в начало строки
    .replace(/(\d) (?=(?:г|кг|мг|мл|л|см|мм|м|шт|лет|года?|МБ|МЕ|%)(?![\p{L}]))/gu, `$1${NBSP}`); // число и единица
}

// предлог в конце текста, за которым идёт строчный тег: «форма на <a>…»
const reTail = new RegExp(`(?<![\\p{L}\\p{N}\\-])(${word}) $`, 'iu');
const INLINE = /^<(a|b|i|em|strong|span|sup|sub|small)\b/i;

export function typograph(html) {
  const parts = html.split(/(<[^>]+>)/);
  let skip = 0;
  return parts.map((p, i) => {
    if (p.startsWith('<')) {
      if (/^<(script|style)\b/i.test(p)) skip++;
      else if (/^<\/(script|style)>/i.test(p)) skip = Math.max(0, skip - 1);
      return p;
    }
    if (skip) return p;
    let t = fixText(p);
    if (INLINE.test(parts[i + 1] || '')) t = t.replace(reTail, `$1${NBSP}`);
    return t;
  }).join('');
}
