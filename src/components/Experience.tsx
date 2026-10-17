import { LINKEDIN_URL } from '../consts/site.ts';
import type { Position } from '../schemas/linkedin/position.ts';
import { type CompanyGroup, formatDuration, groupPositions, monthsBetween } from '../services/site/experience-groups.ts';
import { formatRange } from '../services/site/format.ts';
import { CompanyLogo } from './CompanyLogo.tsx';
import { SkillChips } from './SkillChips.tsx';

interface ExperienceProps {
  readonly positions: readonly Position[];
  readonly now?: Date;
}

const joinDetails = (...parts: readonly (string | null | undefined)[]): string => parts.filter(Boolean).join(' · ');

function RoleDetails({ role, now, companyLine }: { readonly role: Position; readonly now: Date; readonly companyLine: string | null }) {
  const dates = joinDetails(formatRange(role.startedOn, role.finishedOn), formatDuration(monthsBetween(role.startedOn, role.finishedOn, now)));
  return (
    <>
      <h3 className="exp-title">{role.title}</h3>
      {companyLine && <p className="exp-line">{companyLine}</p>}
      {dates && <p className="exp-meta">{dates}</p>}
      {role.location && <p className="exp-meta">{role.location}</p>}
      {role.description && (
        <p className="exp-text" dir="auto">
          {role.description}
        </p>
      )}
      <SkillChips skills={role.skills} />
    </>
  );
}

function CompanyEntry({ group, now }: { readonly group: CompanyGroup; readonly now: Date }) {
  const [onlyRole] = group.roles;
  if (group.roles.length === 1 && onlyRole) {
    return (
      <li className="exp-company">
        <CompanyLogo name={group.company} src={group.logo} />
        <div className="exp-body">
          <RoleDetails role={onlyRole} now={now} companyLine={joinDetails(group.company, group.employmentType)} />
        </div>
      </li>
    );
  }
  return (
    <li className="exp-company">
      <CompanyLogo name={group.company} src={group.logo} />
      <div className="exp-body">
        <h3 className="exp-company-name">{group.company}</h3>
        <p className="exp-meta">{joinDetails(group.employmentType, formatDuration(monthsBetween(group.startedOn, group.finishedOn, now)))}</p>
        <ol className="exp-roles">
          {group.roles.map((role) => (
            <li key={`${role.title}-${role.startedOn?.year ?? ''}-${role.startedOn?.month ?? ''}`} className="exp-role">
              <RoleDetails role={role} now={now} companyLine={null} />
            </li>
          ))}
        </ol>
      </div>
    </li>
  );
}

export function Experience({ positions, now = new Date() }: ExperienceProps) {
  if (positions.length === 0) {
    return (
      <p className="empty-state">
        Experience is not imported yet. <a href={LINKEDIN_URL}>See it on LinkedIn</a>.
      </p>
    );
  }
  return (
    <ol className="exp-list">
      {groupPositions(positions).map((group) => (
        <CompanyEntry key={`${group.company}-${group.startedOn?.year ?? ''}`} group={group} now={now} />
      ))}
    </ol>
  );
}
