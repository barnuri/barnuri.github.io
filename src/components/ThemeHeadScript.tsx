import { THEME_STORAGE_KEY } from '../consts/site.ts';

const SCRIPT = `(() => {
  try {
    const saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved;
    }
  } catch {}
})();`;

export function ThemeHeadScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
