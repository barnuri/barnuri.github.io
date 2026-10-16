import { GitHubIcon } from './GitHubIcon.tsx';
import { LinkedInIcon } from './LinkedInIcon.tsx';

export function ProfileIntro() {
  return (
    <>
      <header className="intro">
        <img className="avatar" src="assets/img/profile-384.jpg" width={384} height={384} alt="Portrait of Bar Nuri" />
        <div>
          <h1>Bar Nuri</h1>
          <p className="lede">
            Software developer at Check Point. I build open-source tools for coding agents and the workflows around them.
          </p>
        </div>
      </header>
      <ul className="links">
        <li>
          <a href="https://github.com/barnuri">
            <GitHubIcon />
            GitHub
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/barnuri/">
            <LinkedInIcon />
            LinkedIn
          </a>
        </li>
      </ul>
    </>
  );
}
