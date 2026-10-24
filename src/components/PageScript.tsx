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

  const zoomables = [...document.querySelectorAll('img[data-zoom]')];
  if (zoomables.length > 0) {
    const box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML = '<img class="lightbox-image" alt="">'
      + '<button type="button" class="lightbox-close" aria-label="Close image">&times;</button>'
      + '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous image">&lsaquo;</button>'
      + '<button type="button" class="lightbox-nav lightbox-next" aria-label="Next image">&rsaquo;</button>'
      + '<p class="lightbox-count" aria-live="polite"></p>';
    document.body.append(box);
    const image = box.querySelector('.lightbox-image');
    const prev = box.querySelector('.lightbox-prev');
    const next = box.querySelector('.lightbox-next');
    const count = box.querySelector('.lightbox-count');
    let group = [];
    let index = 0;
    let opener = null;
    const show = () => {
      const source = group[index];
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      const many = group.length > 1;
      prev.hidden = !many;
      next.hidden = !many;
      count.hidden = !many;
      count.textContent = (index + 1) + ' / ' + group.length;
    };
    const step = (delta) => { index = (index + delta + group.length) % group.length; show(); };
    const open = (source) => {
      group = zoomables.filter((item) => item.dataset.zoom === source.dataset.zoom);
      index = group.indexOf(source);
      opener = source;
      show();
      box.showModal();
      document.body.classList.add('lightbox-open');
    };
    for (const source of zoomables) {
      source.tabIndex = 0;
      source.setAttribute('role', 'button');
      source.setAttribute('aria-label', 'View full size: ' + source.alt);
      source.addEventListener('click', () => open(source));
      source.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(source); }
      });
    }
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    box.querySelector('.lightbox-close').addEventListener('click', () => box.close());
    box.addEventListener('click', (event) => { if (event.target === box) { box.close(); } });
    box.addEventListener('keydown', (event) => {
      if (group.length < 2) { return; }
      if (event.key === 'ArrowLeft') { step(-1); }
      if (event.key === 'ArrowRight') { step(1); }
    });
    box.addEventListener('close', () => {
      document.body.classList.remove('lightbox-open');
      image.removeAttribute('src');
      opener?.focus();
    });
  }
})();`;

export function PageScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
