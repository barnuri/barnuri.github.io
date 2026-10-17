import type { ReactNode } from 'react';

interface TileProps {
  readonly id: string;
  readonly title: string;
  readonly span: 2 | 3 | 4 | 6;
  readonly note?: ReactNode;
  readonly titleClass?: string;
  readonly children: ReactNode;
}

export function Tile({ id, title, span, note, titleClass, children }: TileProps) {
  return (
    <section className={`tile span-${span}`} aria-labelledby={`${id}-heading`}>
      <div className="tile-head">
        <h2 id={`${id}-heading`} className={titleClass ? `tile-title ${titleClass}` : 'tile-title'}>
          {title}
        </h2>
        {note && <span className="tile-note">{note}</span>}
      </div>
      {children}
    </section>
  );
}
