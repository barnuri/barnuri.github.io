import type { CSSProperties } from 'react';
import type { Contributions } from '../schemas/github/contributions.ts';
import { formatDate, formatMonth, formatNumber } from '../services/site/format.ts';

const CELL_SIZE = 11;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const MONTH_LABEL_HEIGHT = 16;
const MONTH_LABEL_BASELINE = MONTH_LABEL_HEIGHT - 6;
const DAYS_PER_WEEK = 7;

interface ContributionGraphProps {
  readonly contributions: Contributions;
}

export function ContributionGraph({ contributions }: ContributionGraphProps) {
  const width = contributions.weeks.length * CELL_STEP - CELL_GAP;
  const height = MONTH_LABEL_HEIGHT + DAYS_PER_WEEK * CELL_STEP - CELL_GAP;
  const monthStarts = contributions.weeks.flatMap((days, weekIndex) => {
    const firstDay = days[0];
    const previousFirstDay = contributions.weeks[weekIndex - 1]?.[0];
    if (!firstDay || !previousFirstDay || formatMonth(firstDay.date) === formatMonth(previousFirstDay.date)) {
      return [];
    }
    return [{ weekIndex, label: formatMonth(firstDay.date) }];
  });
  const label = `${formatNumber(contributions.total)} contributions on GitHub in the last year`;

  return (
    <svg className="graph" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <g className="months">
        {monthStarts.map(({ weekIndex, label: month }) => (
          <text key={weekIndex} x={weekIndex * CELL_STEP} y={MONTH_LABEL_BASELINE}>
            {month}
          </text>
        ))}
      </g>
      {contributions.weeks.map((days, weekIndex) => (
        <g
          key={days[0]?.date ?? weekIndex}
          className="week"
          transform={`translate(${weekIndex * CELL_STEP} 0)`}
          style={{ '--week': weekIndex } as CSSProperties}
        >
          {days.map((day) => (
            <rect
              key={day.date}
              className={`l${day.level}`}
              x={0}
              y={MONTH_LABEL_HEIGHT + new Date(day.date).getUTCDay() * CELL_STEP}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
            >
              <title>{`${formatNumber(day.count)} on ${formatDate(day.date)}`}</title>
            </rect>
          ))}
        </g>
      ))}
    </svg>
  );
}
