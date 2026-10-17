import type { ReactNode } from 'react';
import { type PageKey, SITE_DESCRIPTION, SITE_NAME } from '../consts/site.ts';
import { formatDate } from '../services/site/format.ts';
import { Document } from './Document.tsx';
import { Nav } from './Nav.tsx';

interface PageLayoutProps {
  readonly current: PageKey | null;
  readonly title?: string;
  readonly builtAt: string;
  readonly stylesheet: string;
  readonly children: ReactNode;
}

export function PageLayout({ current, title, builtAt, stylesheet, children }: PageLayoutProps) {
  return (
    <Document title={title ? `${title} - ${SITE_NAME}` : SITE_NAME} description={SITE_DESCRIPTION} stylesheet={stylesheet}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Nav current={current} />
      <main id="content" className="page">
        {children}
      </main>
      <footer className="footer">
        <p>Built from GitHub and LinkedIn data on {formatDate(builtAt)}.</p>
      </footer>
    </Document>
  );
}
