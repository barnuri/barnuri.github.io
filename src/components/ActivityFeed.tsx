import { ACTIVITY_VISIBLE_COUNT } from '../consts/github.ts';
import type { Activity } from '../schemas/github/activity.ts';
import type { ActivityItem, ActivityState } from '../schemas/github/activity-item.ts';
import { formatDate, formatNumber } from '../services/site/format.ts';
import { ShowMoreScript } from './ShowMoreScript.tsx';

const LIST_ID = 'activity-list';

const STATE_LABELS: Record<ActivityState, string> = { OPEN: 'Open', MERGED: 'Merged', CLOSED: 'Closed' };

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
  readonly activity: Activity;
}

export function ActivityFeed({ activity }: ActivityFeedProps) {
  if (activity.items.length === 0) {
    return null;
  }
  const hiddenCount = activity.items.length - ACTIVITY_VISIBLE_COUNT;
  return (
    <section className="repos" aria-labelledby="activity-feed-heading">
      <h2 id="activity-feed-heading">Recent activity</h2>
      <ol className="activity-list" id={LIST_ID}>
        {activity.items.map((item, index) => (
          <li key={item.id} className="activity-item" hidden={index >= ACTIVITY_VISIBLE_COUNT}>
            <time dateTime={item.occurredAt}>{formatDate(item.occurredAt)}</time>
            <div>
              <p className="activity-summary">
                <Summary item={item} />
              </p>
              {item.title && (
                <p className="activity-title">
                  <a href={item.url}>{item.title}</a>
                  {item.state && <span className="activity-state">{STATE_LABELS[item.state]}</span>}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {hiddenCount > 0 && (
        <>
          <button type="button" className="show-more" data-list={LIST_ID} data-step={ACTIVITY_VISIBLE_COUNT} hidden>
            Show more
          </button>
          <noscript>
            <style>{'.activity-item[hidden] { display: grid; }'}</style>
          </noscript>
          <ShowMoreScript />
        </>
      )}
      {activity.privateContributions > 0 && (
        <p className="activity-private">
          Plus {formatNumber(activity.privateContributions)} contributions in private repositories in the last year.
        </p>
      )}
    </section>
  );
}
