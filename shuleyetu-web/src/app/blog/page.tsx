import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog & Resources | Shuleyetu',
  description: 'Tips, guides, and resources for Tanzanian parents, students, and vendors navigating school supply season. Back-to-school checklists, vendor guides, and more.',
  openGraph: {
    title: 'Blog & Resources | Shuleyetu',
    description: 'Tips and guides for Tanzanian parents and vendors navigating school supply season.',
    type: 'website',
  },
};

const posts = [
  {
    slug: 'back-to-school-checklist',
    title: 'The Ultimate Back-to-School Checklist for Tanzanian Parents',
    excerpt: 'Everything you need to prepare your child for the new school year — from textbooks to uniforms and stationery.',
    category: 'Tips & Guides',
    categoryColor: 'sky',
    date: 'January 15, 2026',
    readTime: '5 min read',
    featured: true,
  },
  {
    slug: 'how-to-compare-vendors',
    title: 'How to Compare School Supply Vendors and Get the Best Price',
    excerpt: 'A practical guide to evaluating vendors on Shuleyetu — what to look for, how to compare prices, and how to avoid common mistakes.',
    category: 'Guides',
    categoryColor: 'emerald',
    date: 'January 10, 2026',
    readTime: '4 min read',
    featured: false,
  },
  {
    slug: 'mobile-money-school-payments',
    title: 'Why Mobile Money is Changing How Tanzanian Parents Pay for School',
    excerpt: 'M-Pesa and Airtel Money have transformed everyday payments. Here\'s how they\'re making school supply purchases safer and easier.',
    category: 'Finance',
    categoryColor: 'violet',
    date: 'January 5, 2026',
    readTime: '3 min read',
    featured: false,
  },
  {
    slug: 'vendor-success-story',
    title: 'How One Dar es Salaam Stationery Shop Doubled Sales with Shuleyetu',
    excerpt: 'A case study on how a small vendor in Kinondoni used Shuleyetu to reach more parents and grow their business.',
    category: 'Success Stories',
    categoryColor: 'amber',
    date: 'December 28, 2025',
    readTime: '6 min read',
    featured: false,
  },
  {
    slug: 'school-uniform-guide',
    title: 'School Uniform Sizing Guide: Getting It Right the First Time',
    excerpt: 'Buying the wrong uniform size is one of the most common and costly mistakes. This guide helps you measure correctly.',
    category: 'Tips & Guides',
    categoryColor: 'sky',
    date: 'December 20, 2025',
    readTime: '4 min read',
    featured: false,
  },
  {
    slug: 'why-plan-ahead',
    title: 'Why Planning School Supplies Early Saves You Time and Money',
    excerpt: 'Last-minute shopping costs more and causes stress. Here\'s why starting early with Shuleyetu makes a real difference.',
    category: 'Tips & Guides',
    categoryColor: 'sky',
    date: 'December 12, 2025',
    readTime: '3 min read',
    featured: false,
  },
];

const categoryColors: Record<string, string> = {
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function BlogPage() {
  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 right-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Resources & Blog
            </div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-slate-50 md:text-6xl lg:text-7xl">
              Tips, guides &
              <span className="block mt-2 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">
                success stories
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Practical advice for parents, vendors, and schools navigating school supply season in Tanzania.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24 w-full">
        {/* Featured Post */}
        {featured && (
          <div className="mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-4">Featured Article</p>
            <Link
              href={`/blog/${featured.slug}`}
              className="group block rounded-3xl border border-slate-800 bg-gradient-to-br from-sky-950/40 to-slate-900/60 p-8 md:p-12 transition-all duration-300 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex-1 space-y-4">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${categoryColors[featured.categoryColor]}`}>
                    {featured.category}
                  </span>
                  <h2 className="font-display text-2xl font-bold text-slate-50 group-hover:text-sky-400 transition-colors md:text-3xl leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed text-base md:text-lg">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{featured.date}</span>
                    <span>·</span>
                    <span>{featured.readTime}</span>
                  </div>
                </div>
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 transition-transform group-hover:scale-110 md:h-20 md:w-20">
                  <svg className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* All Posts Grid */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">All Articles</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all duration-300 hover:border-sky-500/40 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1"
              >
                <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium mb-4 ${categoryColors[post.categoryColor]}`}>
                  {post.category}
                </span>
                <h2 className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors leading-snug text-base flex-1 mb-3">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4 mt-auto">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1 text-sky-400 font-medium group-hover:gap-2 transition-all">
                    Read
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-20 rounded-3xl border border-slate-800 bg-gradient-to-br from-sky-950/40 to-slate-900/60 p-10 text-center md:p-14">
          <h2 className="font-display text-2xl font-bold text-slate-50 md:text-3xl mb-3">Never miss an article</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Get the latest tips and guides delivered straight to your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-50 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <button className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-sky-500/30">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
