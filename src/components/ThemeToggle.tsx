export function ThemeToggle() {
  return (
    <button type="button" className="theme-toggle" data-theme-toggle aria-label="Switch to light mode" aria-pressed="false">
      <svg className="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.7 14.4A8.5 8.5 0 0 1 9.6 3.3a8.5 8.5 0 1 0 11.1 11.1Z" />
      </svg>
      <svg className="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <path d="M11 1h2v3h-2zM11 20h2v3h-2zM1 11h3v2H1zM20 11h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zM16.3 17.7l1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z" />
      </svg>
    </button>
  );
}
