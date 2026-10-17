interface CompanyLogoProps {
  readonly name: string;
  readonly src: string | null;
}

export function CompanyLogo({ name, src }: CompanyLogoProps) {
  if (src) {
    return <img className="exp-logo" src={src} alt={`${name} logo`} width={48} height={48} loading="lazy" decoding="async" />;
  }
  const initials = name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <span className="exp-logo exp-logo-placeholder" aria-hidden="true">
      {initials}
    </span>
  );
}
