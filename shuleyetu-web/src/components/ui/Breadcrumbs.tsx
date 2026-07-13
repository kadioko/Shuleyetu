'use client';

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-400">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link href="/" className="hover:text-sky-400 transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="text-slate-600">/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-sky-400 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-300">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
