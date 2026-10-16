import type { Education as EducationEntry } from '../schemas/linkedin/education.ts';
import { excerpt, formatRange } from '../services/site/format.ts';

interface EducationProps {
  readonly entries: readonly EducationEntry[];
}

export function Education({ entries }: EducationProps) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <section className="repos" aria-labelledby="education-heading">
      <h2 id="education-heading">Education</h2>
      <ol className="timeline">
        {entries.map((entry) => (
          <li key={`${entry.school}-${entry.degree ?? ''}-${entry.startedOn?.year ?? ''}`} className="timeline-item">
            <p className="timeline-dates">{formatRange(entry.startedOn, entry.finishedOn)}</p>
            <div>
              <h3 className="timeline-title">{entry.school}</h3>
              {entry.degree && <p className="timeline-place">{entry.degree}</p>}
              {entry.notes && <p className="timeline-text">{excerpt(entry.notes)}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
