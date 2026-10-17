import { PAGES } from '../consts/site.ts';
import { PageLayout } from './PageLayout.tsx';

interface NotFoundPageProps {
  readonly builtAt: string;
  readonly stylesheet: string;
}

export function NotFoundPage({ builtAt, stylesheet }: NotFoundPageProps) {
  return (
    <PageLayout current={null} title="Page not found" builtAt={builtAt} stylesheet={stylesheet}>
      <h1 className="page-title">This page does not exist</h1>
      <p className="page-lede">
        The old blog moved to LinkedIn. Go to the <a href={PAGES.home.href}>home page</a> or the{' '}
        <a href={PAGES.posts.href}>Posts page</a>.
      </p>
    </PageLayout>
  );
}
