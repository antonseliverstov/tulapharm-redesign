// Мобильное меню: открытие по бургеру, закрытие крестиком, фоном, Esc и при переходе по ссылке.
(() => {
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('mnav');
  if (!burger || !menu) return;
  const closeBtn = menu.querySelector('.mnav-close');
  const desktop = window.matchMedia('(min-width: 1001px)');

  function open() {
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-open');
    closeBtn.focus();
  }
  function close(returnFocus = true) {
    if (menu.hidden) return;
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
    if (returnFocus) burger.focus();
  }

  burger.addEventListener('click', open);
  closeBtn.addEventListener('click', () => close());
  menu.addEventListener('click', e => {
    if (e.target === menu) close();
    else if (e.target.closest('a')) close(false);
  });
  document.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') close();
    // фокус не уходит из открытого меню
    if (e.key === 'Tab') {
      const f = [...menu.querySelectorAll('a, button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  desktop.addEventListener('change', e => { if (e.matches) close(false); });
})();
