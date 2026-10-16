import { Document } from './Document.tsx';

interface NotFoundPageProps {
  readonly stylesheet: string;
}

export function NotFoundPage({ stylesheet }: NotFoundPageProps) {
  return (
    <Document title="Page not found - Bar Nuri" description="This page does not exist." stylesheet={stylesheet}>
      <main className="page not-found">
        <h1>This page does not exist</h1>
        <p className="lede">
          The blog moved to LinkedIn. Go to the <a href="/">home page</a>.
        </p>
      </main>
    </Document>
  );
}
