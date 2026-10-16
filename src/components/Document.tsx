import type { ReactNode } from 'react';

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Schibsted+Grotesk:wght@400;500;600&display=swap';

interface DocumentProps {
  readonly title: string;
  readonly description: string;
  readonly stylesheet: string;
  readonly children: ReactNode;
}

export function Document({ title, description, stylesheet, children }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
