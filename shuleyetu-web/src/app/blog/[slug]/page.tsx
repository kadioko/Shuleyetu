import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor: string;
  date: string;
  readTime: string;
  content: string;
};

const posts: Post[] = [
  {
    slug: 'back-to-school-checklist',
    title: 'The Ultimate Back-to-School Checklist for Tanzanian Parents',
    excerpt: 'Everything you need to prepare your child for the new school year — from textbooks to uniforms and stationery.',
    category: 'Tips & Guides',
    categoryColor: 'sky',
    date: 'January 15, 2026',
    readTime: '5 min read',
    content: `
## Getting Ready for the New School Year

Every January, millions of Tanzanian parents face the same challenge: making sure their children have everything they need before the first day of school. With rising prices and crowded stationery shops, preparation is key.

## The Essential Checklist

### Textbooks & Exercise Books
- Confirm the exact book list from your child's school
- Check if last year's books can be reused
- Buy exercise books in bulk — it's cheaper
- Label everything with your child's name and class

### Uniforms
- Measure your child before buying — children grow fast
- Buy one size up for younger children to allow for growth
- Check the school's specific color and style requirements
- Don't forget PE kit, socks, and shoes

### Stationery
- Pencils, pens, rulers, erasers, and sharpeners
- Geometry set for secondary school students
- Calculator (check if school allows it)
- Folders and file dividers for organization

### Bags & Accessories
- A sturdy backpack with padded straps
- Water bottle (reusable)
- Lunchbox if your school doesn't provide meals

## Tips for Saving Money

**Buy early.** Prices spike in January as demand surges. Shopping in December can save you 10–20%.

**Compare vendors.** Different shops charge different prices for the same items. Use Shuleyetu to compare prices across multiple vendors in your area.

**Buy in groups.** Coordinate with other parents to buy in bulk and share the savings.

**Check for second-hand books.** Many schools have book exchanges or WhatsApp groups where parents sell used textbooks.

## Using Shuleyetu to Simplify Shopping

Shuleyetu lets you browse vendor catalogs, compare prices, and place orders online — all without leaving home. You can pay with mobile money and pick up your order when it's ready.

Start by finding vendors near your school, then build your order from their inventory. It takes minutes and saves hours of running around.
    `,
  },
  {
    slug: 'how-to-compare-vendors',
    title: 'How to Compare School Supply Vendors and Get the Best Price',
    excerpt: 'A practical guide to evaluating vendors on Shuleyetu — what to look for, how to compare prices, and how to avoid common mistakes.',
    category: 'Guides',
    categoryColor: 'emerald',
    date: 'January 10, 2026',
    readTime: '4 min read',
    content: `
## Why Comparing Vendors Matters

Not all school supply vendors charge the same prices. In Dar es Salaam, the same textbook can cost anywhere from 8,000 to 15,000 TZS depending on where you buy it. Knowing how to compare vendors can save your family thousands of shillings each term.

## What to Look For

### Price
The most obvious factor. But don't just look at individual item prices — consider the total cost of your full order. A vendor with slightly higher prices on books might be cheaper overall if they stock everything you need in one place.

### Stock Availability
A vendor with great prices is useless if they're out of stock. On Shuleyetu, you can see real-time stock quantities before placing an order.

### Location
Proximity matters. A vendor 5 minutes from your child's school is often more convenient than one across town, even if they're slightly more expensive.

### Reputation
Look for vendors with a track record of fulfilling orders accurately and on time. Ask other parents in your school's parent group for recommendations.

## Common Mistakes to Avoid

**Buying from the first vendor you find.** Take 10 minutes to compare at least 3 vendors before committing.

**Ignoring stock levels.** If a vendor shows low stock on an item, order quickly or find an alternative.

**Not checking the full item description.** Make sure you're buying the correct edition of a textbook, or the right color uniform.

**Waiting until the last minute.** Popular items sell out fast in January. Order early.

## Using Shuleyetu's Search and Filter

On Shuleyetu, you can filter vendors by region and search by product name. This makes it easy to find who stocks what you need and at what price. Browse multiple vendor pages, add items to your mental checklist, and place your order with the vendor that offers the best combination of price, availability, and location.
    `,
  },
  {
    slug: 'mobile-money-school-payments',
    title: 'Why Mobile Money is Changing How Tanzanian Parents Pay for School',
    excerpt: 'M-Pesa and Airtel Money have transformed everyday payments. Here\'s how they\'re making school supply purchases safer and easier.',
    category: 'Finance',
    categoryColor: 'violet',
    date: 'January 5, 2026',
    readTime: '3 min read',
    content: `
## The Mobile Money Revolution

Tanzania has one of the highest mobile money adoption rates in Africa. With over 30 million registered mobile money accounts, platforms like M-Pesa, Airtel Money, and Tigo Pesa have become the default way Tanzanians send, receive, and spend money.

For school shopping, this shift is transformative.

## The Old Way

Before mobile money, buying school supplies meant:
- Carrying large amounts of cash
- Risk of theft or loss
- No receipt or payment record
- Having to visit the shop in person to pay

## The New Way

With mobile money integrated into platforms like Shuleyetu:
- Pay from your phone in seconds
- Automatic payment confirmation
- Digital receipt sent instantly
- No need to carry cash

## How ClickPesa Works on Shuleyetu

Shuleyetu uses ClickPesa to process mobile money payments. When you place an order, you receive a payment link. You enter your phone number, confirm the payment on your mobile money app, and the transaction is complete.

The vendor receives confirmation automatically, and your order is processed. No cash, no queues, no risk.

## Safety and Security

Mobile money payments on Shuleyetu are:
- **Encrypted** — your payment details are never stored
- **Confirmed** — you receive an SMS confirmation from your mobile money provider
- **Traceable** — you have a record of every transaction

## Tips for Safe Mobile Money Payments

1. Always verify the payment amount before confirming
2. Never share your mobile money PIN with anyone
3. Check your SMS confirmation after every payment
4. Keep your mobile money app updated
    `,
  },
  {
    slug: 'vendor-success-story',
    title: 'How One Dar es Salaam Stationery Shop Doubled Sales with Shuleyetu',
    excerpt: 'A case study on how a small vendor in Kinondoni used Shuleyetu to reach more parents and grow their business.',
    category: 'Success Stories',
    categoryColor: 'amber',
    date: 'December 28, 2025',
    readTime: '6 min read',
    content: `
## Background

Amina runs a small stationery shop in Kinondoni, Dar es Salaam. She has been selling school supplies for over 10 years, relying on walk-in customers and word of mouth. Every January, she would see a surge in customers — but also long queues, stock shortages, and frustrated parents.

"I knew there were more parents who needed what I had," she says. "But they didn't know I existed."

## The Challenge

Amina's shop was well-stocked and competitively priced, but her reach was limited to the immediate neighborhood. Parents from schools 2–3 km away rarely made the trip unless they had no other option.

She also struggled with inventory management. Without a system, she would often run out of popular items during peak season and have excess stock of slower-moving products.

## Joining Shuleyetu

After hearing about Shuleyetu from a fellow vendor, Amina registered her shop and uploaded her full inventory. Within a week, she received her first online order from a parent in Sinza — a neighborhood she had never served before.

"I was surprised. Someone found me online and ordered without even coming to the shop first."

## The Results

Within the first school term after joining Shuleyetu:
- **Orders increased by 40%** compared to the same period the previous year
- **New customers from 5 different neighborhoods** placed orders
- **Inventory management improved** — she could see which items were selling fast and restock proactively

By the end of the year, Amina estimates her revenue had roughly doubled compared to before joining the platform.

## What Made the Difference

Amina credits three things:
1. **Visibility** — parents who would never have found her shop discovered her through Shuleyetu
2. **Online ordering** — parents could browse and order without visiting in person, reducing friction
3. **Mobile money payments** — faster, safer transactions meant less time handling cash

## Advice for Other Vendors

"Upload your full inventory, not just a few items. Parents want to do all their shopping in one place. If you only have 10 items listed, they'll go to a vendor with 50."

She also recommends keeping stock quantities accurate. "If you show something as in stock and it isn't, parents get frustrated. Keep it updated."

---

*Interested in joining Shuleyetu as a vendor? [Sign up here](/auth/login).*
    `,
  },
  {
    slug: 'school-uniform-guide',
    title: 'School Uniform Sizing Guide: Getting It Right the First Time',
    excerpt: 'Buying the wrong uniform size is one of the most common and costly mistakes. This guide helps you measure correctly.',
    category: 'Tips & Guides',
    categoryColor: 'sky',
    date: 'December 20, 2025',
    readTime: '4 min read',
    content: `
## Why Sizing Matters

Buying the wrong uniform size is one of the most common — and most avoidable — mistakes parents make during school shopping. A uniform that's too small needs to be replaced immediately. One that's too large looks untidy and can be impractical.

Getting it right the first time saves money and frustration.

## How to Measure Your Child

### Height
Stand your child against a wall without shoes. Mark the wall at the top of their head and measure from the floor to the mark. This is their height in centimeters.

### Chest
Measure around the fullest part of the chest, keeping the tape horizontal. Don't pull too tight.

### Waist
Measure around the natural waistline — the narrowest part of the torso, usually just above the belly button.

### Hips (for skirts/trousers)
Measure around the fullest part of the hips, keeping the tape horizontal.

## Size Chart Reference

| Age | Height (cm) | Chest (cm) | Waist (cm) |
|-----|-------------|------------|------------|
| 5–6 | 110–116 | 56–58 | 52–54 |
| 7–8 | 122–128 | 60–62 | 54–56 |
| 9–10 | 134–140 | 64–66 | 56–58 |
| 11–12 | 146–152 | 68–72 | 60–62 |
| 13–14 | 158–164 | 74–78 | 64–66 |

*Note: Sizes vary by manufacturer. Always check the vendor's specific size chart.*

## Tips for Buying Uniforms

**Buy one size up for younger children.** Children grow fast. A uniform that fits perfectly in January may be too small by June.

**Check the school's exact requirements.** Some schools specify exact colors, styles, or even brands. Confirm before buying.

**Buy at least two sets.** One to wear, one to wash. This is especially important for primary school children.

**Check the fabric.** Tanzania's climate is hot. Look for breathable cotton fabrics rather than synthetic materials.

## Where to Buy

On Shuleyetu, you can browse vendors who stock uniforms and filter by your school's region. Many vendors list size availability in their inventory, so you can confirm before ordering.
    `,
  },
  {
    slug: 'why-plan-ahead',
    title: 'Why Planning School Supplies Early Saves You Time and Money',
    excerpt: 'Last-minute shopping costs more and causes stress. Here\'s why starting early with Shuleyetu makes a real difference.',
    category: 'Tips & Guides',
    categoryColor: 'sky',
    date: 'December 12, 2025',
    readTime: '3 min read',
    content: `
## The January Rush

Every year, the same thing happens. Schools publish their supply lists in late December or early January. Parents scramble to buy everything before the first day of school. Stationery shops run out of stock. Prices spike. Parents waste hours driving from shop to shop.

It doesn't have to be this way.

## What Happens When You Wait

**Prices go up.** Basic supply and demand. When everyone needs the same items at the same time, vendors charge more. Prices for popular textbooks can increase by 20–30% in the first two weeks of January.

**Stock runs out.** Popular items — especially specific textbook editions — sell out fast. If you wait too long, you may not find what you need at any price.

**You waste time.** Visiting multiple shops, waiting in queues, driving across town — last-minute shopping is exhausting.

**You make mistakes.** When you're rushed, you're more likely to buy the wrong edition, the wrong size, or forget something important.

## The Benefits of Planning Early

**Lower prices.** Shopping in November or December, before the rush, means paying normal prices.

**Better selection.** Vendors have full stock. You can choose exactly what you need.

**Less stress.** You're not racing against a deadline.

**More time to compare.** When you're not in a hurry, you can take time to find the best prices across multiple vendors.

## How to Start Early

1. **Get the supply list early.** Ask your child's school for the list in November if possible.
2. **Check what you already have.** Go through last year's supplies and see what can be reused.
3. **Make a prioritized list.** Separate must-haves from nice-to-haves.
4. **Browse Shuleyetu vendors.** Find vendors who stock what you need and compare prices.
5. **Place your order.** Many vendors can hold items for pickup closer to the school start date.

## The Bottom Line

A little planning in December saves a lot of stress in January. Use Shuleyetu to browse, compare, and order early — and start the school year without the last-minute rush.
    `,
  },
];

const categoryColors: Record<string, string> = {
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
    },
  };
}

function renderContent(content: string) {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { key++; continue; }

    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={key++} className="mt-10 mb-4 text-2xl font-bold text-slate-50">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={key++} className="mt-6 mb-3 text-lg font-semibold text-slate-100">{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith('- ')) {
      elements.push(<li key={key++} className="ml-5 list-disc text-slate-300 leading-relaxed">{trimmed.slice(2)}</li>);
    } else if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ') || trimmed.startsWith('5. ')) {
      elements.push(<li key={key++} className="ml-5 list-decimal text-slate-300 leading-relaxed">{trimmed.replace(/^\d+\.\s/, '')}</li>);
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      elements.push(<p key={key++} className="mt-4 font-bold text-slate-100">{trimmed.slice(2, -2)}</p>);
    } else if (trimmed.startsWith('---')) {
      elements.push(<hr key={key++} className="my-8 border-slate-800" />);
    } else if (trimmed.startsWith('*Note:')) {
      elements.push(<p key={key++} className="mt-2 text-sm italic text-slate-500">{trimmed.slice(1, -1)}</p>);
    } else if (trimmed.startsWith('| ')) {
      // Skip table rows — render as a note
      elements.push(<p key={key++} className="text-sm text-slate-400 font-mono">{trimmed}</p>);
    } else {
      // Inline bold: **text**
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>
          : part
      );
      elements.push(<p key={key++} className="mt-4 text-slate-300 leading-relaxed">{rendered}</p>);
    }
  }

  return elements;
}

export default function BlogPostPage({ params }: PageProps) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const otherPosts = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-sky-400 transition-colors">Home</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <Link href="/blog" className="hover:text-sky-400 transition-colors">Blog</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-200 truncate max-w-[200px]">{post.title}</span>
          </nav>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium mb-6 ${categoryColors[post.categoryColor]}`}>
            {post.category}
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed max-w-2xl">{post.excerpt}</p>
          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <div className="mx-auto max-w-4xl w-full px-4 py-12 md:px-6 md:py-16">
        <article className="prose-slate max-w-none">
          {renderContent(post.content)}
        </article>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/40 to-slate-900/60 p-8 text-center">
          <h3 className="font-display text-xl font-bold text-slate-50 md:text-2xl">Ready to simplify school shopping?</h3>
          <p className="mt-2 text-slate-400">Browse vendors, compare prices, and order with mobile money.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/vendors" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
              Browse Vendors
            </Link>
            <Link href="/orders/new" className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:border-slate-600 hover:text-white">
              Create Order
            </Link>
          </div>
        </div>

        {/* More Articles */}
        {otherPosts.length > 0 && (
          <div className="mt-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">More Articles</p>
            <div className="grid gap-4 md:grid-cols-3">
              {otherPosts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition-all hover:border-sky-500/40 hover:bg-slate-900/60 hover:-translate-y-0.5">
                  <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium mb-3 ${categoryColors[p.categoryColor]}`}>
                    {p.category}
                  </span>
                  <h4 className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors leading-snug text-sm flex-1 mb-2">{p.title}</h4>
                  <p className="text-xs text-slate-500">{p.date} · {p.readTime}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to all articles
          </Link>
        </div>
      </div>
    </main>
  );
}
