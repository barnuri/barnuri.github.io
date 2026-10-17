import { LINKEDIN_URL } from '../consts/site.ts';
import type { Position } from '../schemas/linkedin/position.ts';
import { formatRange } from '../services/site/format.ts';

interface ExperienceProps {
  readonly positions: readonly Position[];
}

export function Experience({ positions }: ExperienceProps) {
  if (positions.length === 0) {
    return (
      <p className="empty-state">
        Experience is not imported yet. <a href={LINKEDIN_URL}>See it on LinkedIn</a>.
      </p>
    );
  }
  return (
    <ol className="timeline">
      {positions.map((position) => (
        <li key={`${position.company}-${position.title}-${position.startedOn?.year ?? ''}-${position.startedOn?.month ?? ''}`} className="timeline-item">
          <p className="timeline-dates">{formatRange(position.startedOn, position.finishedOn)}</p>
          <div>
            <h3 className="timeline-title">{position.title}</h3>
            <p className="timeline-place">{[position.company, position.location].filter(Boolean).join(', ')}</p>
            {position.description && (
              <p className="timeline-text" dir="auto">
                {position.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
