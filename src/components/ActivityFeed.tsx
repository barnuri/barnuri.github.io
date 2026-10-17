import { FEED_PAGE_SIZE, GITHUB_LOGIN } from '../consts/site.ts';
import type { ActivityState } from '../consts/github.ts';
import type { ActivityItem } from '../schemas/github/activity-item.ts';
import { sideOf } from '../services/site/activity-view.ts';
import { formatNumber, formatShortDate } from '../services/site/format.ts';

const STATE_LABELS: Record<ActivityState, string> = { OPEN: 'Open', MERGED: 'Merged', CLOSED: 'Closed' };
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'own', label: 'My repos' },
  { key: 'ext', label: 'Contributions' },
] as const;

function Summary({ item }: { readonly item: ActivityItem }) {
  const repo = <a href={item.repo.url}>{item.repo.name}</a>;
  switch (item.kind) {
    case 'commits': {
      const count = item.count ?? 1;
      return (
        <>
          Pushed <a href={item.url}>{`${formatNumber(count)} ${count === 1 ? 'commit' : 'commits'}`}</a> to {repo}
        </>
      );
    }
    case 'repository':
      return <>Created {repo}</>;
    case 'pull_request':
      return <>Opened a pull request in {repo}</>;
    case 'issue':
      return <>Opened an issue in {repo}</>;
    case 'review':
      return <>Reviewed a pull request in {repo}</>;
  }
}

interface ActivityFeedProps {
  readonly id: string;
  readonly items: readonly ActivityItem[];
  readonly filterable?: boolean;
  readonly emptyText: string;
}

export function ActivityFeed({ id, items, filterable = false, emptyText }: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }
  return (
    <>
      {filterable && (
        <div className="chips" role="group" aria-label="Filter activity">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className="chip"
              data-filter-for={id}
              data-filter={filter.key}
              aria-pressed={filter.key === 'all'}
              hidden
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
      <ol id={id} className="feed" data-paged-list data-step={FEED_PAGE_SIZE} style={filterable ? { marginTop: 14 } : undefined}>
        {items.map((item, index) => {
          const side = sideOf(item, GITHUB_LOGIN);
          return (
            <li key={item.id} className="feed-item" data-item data-side={side} hidden={index >= FEED_PAGE_SIZE}>
              <time className="feed-date" dateTime={item.occurredAt}>
                {formatShortDate(item.occurredAt)}
              </time>
              <p className="feed-summary">
                <Summary item={item} />
                {item.title && (
                  <span className="feed-title">
                    <a href={item.url}>{item.title}</a>
                    {item.state && <span className="feed-state">{STATE_LABELS[item.state]}</span>}
                  </span>
                )}
              </p>
              <span className={`tag tag-${side}`}>{side === 'own' ? 'My repo' : 'Contribution'}</span>
            </li>
          );
        })}
      </ol>
      <p className="feed-empty" data-empty-for={id} hidden>
        {emptyText}
      </p>
      {items.length > FEED_PAGE_SIZE && (
        <button type="button" className="more-button" data-more-for={id} hidden>
          Show more
        </button>
      )}
    </>
  );
}
