import type { ReactNode } from 'react';
import { DEFAULT_THEME } from '../consts/site.ts';
import { PageScript } from './PageScript.tsx';
import { ThemeHeadScript } from './ThemeHeadScript.tsx';

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Schibsted+Grotesk:wght@400;500;600&display=swap';
const NO_SCRIPT_STYLE = '[data-item][hidden] { display: grid !important; } .chip, .more-button { display: none; }';

interface DocumentProps {
  readonly title: string;
  readonly description: string;
  readonly stylesheet: string;
  readonly children: ReactNode;
}

export function Document({ title, description, stylesheet, children }: DocumentProps) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="color-scheme" content="dark light" />
        <ThemeHeadScript />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        <noscript>
          <style>{NO_SCRIPT_STYLE}</style>
        </noscript>
      </head>
      <body>
        {children}
        <PageScript />
      </body>
    </html>
  );
}
