import type { LanguageShare } from '../schemas/github/language-share.ts';
import { safeColor } from '../services/site/format.ts';

interface LanguageListProps {
  readonly languages: readonly LanguageShare[];
}

export function LanguageList({ languages }: LanguageListProps) {
  if (languages.length === 0) {
    return <p className="empty-state">No language data yet.</p>;
  }
  const largest = languages[0]?.share ?? 1;
  return (
    <ul className="lang-list">
      {languages.map((language) => (
        <li key={language.name} className="lang-row">
          <span>{language.name}</span>
          <span className="lang-track" aria-hidden="true">
            <span className="lang-fill" style={{ width: `${(language.share / largest) * 100}%`, background: safeColor(language.color) }} />
          </span>
          <span className="lang-share">{Math.round(language.share)}%</span>
        </li>
      ))}
    </ul>
  );
}
