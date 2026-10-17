import { LINKEDIN_URL } from '../consts/site.ts';
import type { Education as EducationEntry } from '../schemas/linkedin/education.ts';
import { formatRange } from '../services/site/format.ts';

interface EducationProps {
  readonly entries: readonly EducationEntry[];
}

export function Education({ entries }: EducationProps) {
  if (entries.length === 0) {
    return (
      <p className="empty-state">
        Education is not imported yet. <a href={LINKEDIN_URL}>See it on LinkedIn</a>.
      </p>
    );
  }
  return (
    <ol className="timeline">
      {entries.map((entry, index) => (
        <li key={`${entry.school}-${entry.degree ?? ''}-${entry.startedOn?.year ?? index}`} className="timeline-item">
          <p className="timeline-dates">{formatRange(entry.startedOn, entry.finishedOn)}</p>
          <div>
            <h3 className="timeline-title">{entry.school}</h3>
            {entry.degree && <p className="timeline-place">{entry.degree}</p>}
            {entry.notes && (
              <p className="timeline-text" dir="auto">
                {entry.notes}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
