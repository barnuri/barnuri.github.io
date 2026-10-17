const VISIBLE_SKILLS = 8;

interface SkillChipsProps {
  readonly skills: readonly string[];
}

export function SkillChips({ skills }: SkillChipsProps) {
  if (skills.length === 0) {
    return null;
  }
  const visible = skills.slice(0, VISIBLE_SKILLS);
  const hidden = skills.slice(VISIBLE_SKILLS);
  return (
    <div className="skills">
      <ul className="skill-list" aria-label="Skills">
        {visible.map((skill) => (
          <li key={skill} className="skill">
            {skill}
          </li>
        ))}
      </ul>
      {hidden.length > 0 && (
        <details className="skill-more">
          <summary>Show all {skills.length} skills</summary>
          <ul className="skill-list">
            {hidden.map((skill) => (
              <li key={skill} className="skill">
                {skill}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
