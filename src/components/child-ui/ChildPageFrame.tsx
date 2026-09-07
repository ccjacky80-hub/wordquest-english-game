import Link from 'next/link';
import type { ReactNode } from 'react';

interface ChildPageFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function ChildPageFrame({
  eyebrow,
  title,
  description,
  children,
  backHref,
  backLabel,
}: ChildPageFrameProps) {
  return (
    <main className="child-shell">
      <div className="child-topbar">
        <Link className="brand-mark" href="/">
          WordQuest
        </Link>
        {backHref && backLabel ? (
          <Link className="text-link" href={backHref}>
            ← {backLabel}
          </Link>
        ) : null}
      </div>
      <section className="child-page" aria-labelledby="page-title">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="page-title" className="page-title">
          {title}
        </h1>
        <p className="page-intro">{description}</p>
        {children}
      </section>
    </main>
  );
}
