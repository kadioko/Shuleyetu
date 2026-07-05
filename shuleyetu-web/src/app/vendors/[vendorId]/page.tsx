import Link from "next/link";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { supabaseServerClient as supabaseClient } from "@/lib/supabaseServer";

export const dynamic = 'force-dynamic';

type Vendor = {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  district: string | null;
  ward: string | null;
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  price_tzs: number;
  stock_quantity: number;
  image_url: string | null;
};

interface PageProps {
  params: {
    vendorId: string;
  };
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'textbook':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'uniform':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case 'stationery':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'textbook':
      return 'bg-blue-500/10 text-blue-400';
    case 'uniform':
      return 'bg-purple-500/10 text-purple-400';
    case 'stationery':
      return 'bg-amber-500/10 text-amber-400';
    default:
      return 'bg-slate-500/10 text-slate-400';
  }
};

export default async function VendorDetailPage({ params }: PageProps) {
  const vendorId = params.vendorId;

  // Fetch vendor and inventory
  const [
    { data: vendor, error: vendorError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabaseClient
      .from("vendors")
      .select("id, name, description, region, district, ward")
      .eq("id", vendorId)
      .maybeSingle(),
    supabaseClient
      .from("inventory")
      .select("id, name, category, price_tzs, stock_quantity, image_url")
      .eq("vendor_id", vendorId)
      .order("name", { ascending: true }),
  ]);

  // Fetch reviews separately to handle case where table doesn't exist yet
  let reviews: any[] = [];
  let reviewsError: any = null;
  try {
    const { data: reviewData, error: reviewErr } = await supabaseClient
      .from("vendor_reviews")
      .select("id, rating, title, comment, reviewer_name, created_at")
      .eq("vendor_id", vendorId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(10);
    if (reviewData) reviews = reviewData;
    if (reviewErr) reviewsError = reviewErr;
  } catch (e) {
    reviewsError = e;
  }

  if (vendorError) {
    console.error("Error loading vendor", vendorError);
  }

  if (itemsError) {
    console.error("Error loading inventory", itemsError);
  }

  if (reviewsError) {
    console.error("Error loading reviews", reviewsError);
  }

  if (!vendor) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 px-3 py-8 md:px-4 md:py-12">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/30 bg-red-950/20 p-8 text-center">
          <div className="rounded-full bg-red-500/10 p-3 text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-200">Vendor not found</p>
            <p className="mt-1 text-sm text-red-300/70">This vendor may have been removed or the link is incorrect.</p>
          </div>
          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to vendors
          </Link>
        </div>
      </main>
    );
  }

  const inventory: InventoryItem[] = items ?? [];
  const reviewList = reviews ?? [];
  const avgRating = reviewList.length > 0
    ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
    : 0;
  const reviewCount = reviewList.length;
  const itemCount = inventory.length;
  const categories = [...new Set(inventory.map(item => item.category))];

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/vendors" className="hover:text-sky-400 transition-colors">Vendors</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-200">{vendor.name}</span>
          </nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/30 to-emerald-500/20 text-3xl font-extrabold text-sky-400 shadow-xl shadow-sky-500/10">
                {vendor.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">{vendor.name}</h1>
                {vendor.description && (
                  <p className="mt-2 max-w-xl text-base text-slate-300 leading-relaxed">{vendor.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{[vendor.region, vendor.district, vendor.ward].filter(Boolean).join(', ') || 'Tanzania'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <span>{itemCount} products</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    <span>{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>
                  </div>
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <StarRating rating={Math.round(avgRating)} size="sm" />
                      <span className="text-amber-400 font-medium">{avgRating.toFixed(1)}</span>
                      <span>({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/orders/new?vendor=${vendorId}`}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:scale-105 hover:shadow-sky-400/40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Order from this vendor
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-bold text-slate-300 transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/80 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                All vendors
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl w-full px-4 py-10 md:px-6 flex flex-col gap-8">

        {/* Inventory Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Products</h2>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColor(cat)}`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {inventory.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-12 text-center">
              <div className="rounded-full bg-slate-800 p-4 text-slate-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-300">No products available</p>
                <p className="mt-1 text-sm text-slate-400">
                  This vendor hasn&apos;t added any products yet.
                </p>
              </div>
              <Link
                href="/vendors"
                className="rounded-lg bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
              >
                Browse other vendors
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inventory.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-300 hover:border-sky-500/40 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-0.5"
                >
                  {item.image_url ? (
                    <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-800">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-lg p-2 ${getCategoryColor(item.category)}`}>
                      {getCategoryIcon(item.category)}
                    </div>
                    {item.stock_quantity > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex-1">
                    <h3 className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                      {item.category}
                    </p>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-slate-800 pt-3">
                    <div>
                      <p className="text-lg font-bold text-sky-400">
                        {item.price_tzs.toLocaleString("en-TZ")}
                        <span className="ml-1 text-xs font-normal text-slate-400">TZS</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.stock_quantity} {item.stock_quantity === 1 ? 'unit' : 'units'} available
                      </p>
                    </div>
                    <AddToCartButton
                      itemId={item.id}
                      vendorId={vendor.id}
                      vendorName={vendor.name}
                      name={item.name}
                      price_tzs={item.price_tzs}
                      image_url={item.image_url}
                      stock_quantity={item.stock_quantity}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} size="sm" />
                <span className="text-sm text-slate-400">{avgRating.toFixed(1)} · {reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>
          {reviewCount === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-12 text-center">
              <div className="rounded-full bg-slate-800 p-4 text-slate-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-300">No reviews yet</p>
                <p className="mt-1 text-sm text-slate-400">Be the first to review this vendor after placing an order.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviewList.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        {inventory.length > 0 && (
          <section className="flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-gradient-to-r from-sky-950/30 to-slate-900/30 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-200">Ready to order?</h3>
              <p className="mt-1 text-sm text-slate-400">
                Create an order with {vendor.name} and get your school supplies delivered.
              </p>
            </div>
            <Link
              href={`/orders/new?vendor=${vendorId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Start Order
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}