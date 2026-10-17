import { THEME_STORAGE_KEY } from '../consts/site.ts';

const SCRIPT = `(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const labelToggle = () => {
    const isLight = root.dataset.theme === 'light';
    toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    toggle.setAttribute('aria-pressed', String(isLight));
  };
  if (toggle) {
    labelToggle();
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('${THEME_STORAGE_KEY}', root.dataset.theme); } catch {}
      labelToggle();
    });
  }

  for (const list of document.querySelectorAll('[data-paged-list]')) {
    const step = Number(list.dataset.step) || 10;
    const items = [...list.querySelectorAll(':scope > [data-item]')];
    const button = document.querySelector('[data-more-for="' + list.id + '"]');
    const empty = document.querySelector('[data-empty-for="' + list.id + '"]');
    const chips = [...document.querySelectorAll('[data-filter-for="' + list.id + '"]')];
    let filter = 'all';
    let shown = step;
    const matching = () => items.filter((item) => filter === 'all' || item.dataset.side === filter);
    const render = () => {
      const visible = matching();
      for (const item of items) { item.hidden = true; }
      visible.slice(0, shown).forEach((item) => { item.hidden = false; });
      const left = Math.max(visible.length - shown, 0);
      if (button) {
        button.hidden = left === 0;
        button.textContent = 'Show ' + Math.min(step, left) + ' more (' + left + ' left)';
      }
      if (empty) { empty.hidden = visible.length > 0; }
      for (const chip of chips) { chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter)); }
    };
    for (const chip of chips) {
      chip.hidden = false;
      chip.addEventListener('click', () => { filter = chip.dataset.filter; shown = step; render(); });
    }
    if (button) {
      button.addEventListener('click', () => {
        const firstNew = matching()[shown];
        shown += step;
        render();
        firstNew?.querySelector('a')?.focus();
      });
    }
    render();
  }
})();`;

export function PageScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
