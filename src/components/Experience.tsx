import type { Position } from '../schemas/linkedin/position.ts';
import { excerpt, formatRange } from '../services/site/format.ts';

interface ExperienceProps {
  readonly positions: readonly Position[];
}

export function Experience({ positions }: ExperienceProps) {
  if (positions.length === 0) {
    return null;
  }
  return (
    <section className="repos" aria-labelledby="experience-heading">
      <h2 id="experience-heading">Experience</h2>
      <ol className="timeline">
        {positions.map((position) => (
          <li key={`${position.company}-${position.title}-${position.startedOn?.year ?? ''}`} className="timeline-item">
            <p className="timeline-dates">{formatRange(position.startedOn, position.finishedOn)}</p>
            <div>
              <h3 className="timeline-title">{position.title}</h3>
              <p className="timeline-place">{[position.company, position.location].filter(Boolean).join(', ')}</p>
              {position.description && (
                <p className="timeline-text" dir="auto">
                  {excerpt(position.description)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
