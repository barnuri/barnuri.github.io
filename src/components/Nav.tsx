import { PAGES, type PageKey, SITE_NAME } from '../consts/site.ts';
import { ThemeToggle } from './ThemeToggle.tsx';

interface NavProps {
  readonly current: PageKey | null;
}

export function Nav({ current }: NavProps) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="wordmark" href={PAGES.home.href}>
          {SITE_NAME}
        </a>
        <nav className="nav-actions" aria-label="Main">
          {(Object.keys(PAGES) as PageKey[]).map((key) => (
            <a key={key} className="nav-link" href={PAGES[key].href} aria-current={key === current ? 'page' : undefined}>
              {PAGES[key].label}
            </a>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
