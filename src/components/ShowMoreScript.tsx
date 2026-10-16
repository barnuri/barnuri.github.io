const SCRIPT = `
for (const button of document.querySelectorAll('button.show-more[data-list]')) {
  const list = document.getElementById(button.dataset.list);
  const step = Number(button.dataset.step);
  const hiddenItems = () => list.querySelectorAll(':scope > [hidden]');
  const label = () => {
    const remaining = hiddenItems().length;
    button.textContent = 'Show ' + Math.min(step, remaining) + ' more (' + remaining + ' left)';
  };
  button.hidden = false;
  label();
  button.addEventListener('click', () => {
    const next = [...hiddenItems()].slice(0, step);
    next.forEach((item) => { item.hidden = false; });
    next[0]?.querySelector('a')?.focus();
    if (hiddenItems().length === 0) { button.hidden = true; } else { label(); }
  });
}`;

export function ShowMoreScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
