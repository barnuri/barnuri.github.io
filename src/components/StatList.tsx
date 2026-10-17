import { formatNumber } from '../services/site/format.ts';

export interface Stat {
  readonly label: string;
  readonly value: number;
}

interface StatListProps {
  readonly stats: readonly Stat[];
}

export function StatList({ stats }: StatListProps) {
  return (
    <dl className="stats">
      {stats.map((stat) => (
        <div key={stat.label} className="stat">
          <dt className="stat-label">{stat.label}</dt>
          <dd className="stat-value">{formatNumber(stat.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
