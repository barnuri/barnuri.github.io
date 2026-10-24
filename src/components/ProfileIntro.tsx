import { GITHUB_URL, LINKEDIN_URL, SITE_NAME } from '../consts/site.ts';
import { GitHubIcon } from './GitHubIcon.tsx';
import { LinkedInIcon } from './LinkedInIcon.tsx';

interface ProfileIntroProps {
  readonly lede: string;
}

export function ProfileIntro({ lede }: ProfileIntroProps) {
  return (
    <div className="profile">
      <img className="avatar" src="/assets/img/profile.png" width={384} height={384} alt={`Portrait of ${SITE_NAME}`} data-zoom="profile" />
      <div>
        <h1 className="profile-name">{SITE_NAME}</h1>
        <p className="profile-lede">{lede}</p>
        <div className="profile-links">
          <a className="pill-link" href={GITHUB_URL}>
            <GitHubIcon />
            GitHub
          </a>
          <a className="pill-link" href={LINKEDIN_URL}>
            <LinkedInIcon />
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
