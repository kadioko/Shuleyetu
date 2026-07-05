import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Poppins } from "next/font/google";
import Link from "next/link";
import { NavUser } from "@/components/NavUser";
import { ToastProvider } from "@/components/ui/Toast";
import { LanguageProvider } from "@/components/LanguageProvider";
import { MobileNav } from "@/components/ui/MobileNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { CartProvider } from "@/lib/cartContext";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { CartButton } from "@/components/ui/CartButton";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shuleyetu | Tanzania's School Supply Marketplace",
    template: "%s | Shuleyetu",
  },
  description:
    "Shuleyetu connects Tanzanian families with trusted local vendors for textbooks, uniforms, and stationery. Compare prices, place orders, and pay with mobile money.",
  keywords: ["school supplies Tanzania", "textbooks Tanzania", "school uniforms", "stationery Tanzania", "Shuleyetu", "school marketplace"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-72x72.svg", sizes: "72x72", type: "image/svg+xml" },
      { url: "/icons/icon-96x96.svg", sizes: "96x96", type: "image/svg+xml" },
      { url: "/icons/icon-128x128.svg", sizes: "128x128", type: "image/svg+xml" },
      { url: "/icons/icon-144x144.svg", sizes: "144x144", type: "image/svg+xml" },
      { url: "/icons/icon-152x152.svg", sizes: "152x152", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-384x384.svg", sizes: "384x384", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/icons/icon-192x192.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shuleyetu",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "Shuleyetu | Tanzania's School Supply Marketplace",
    description: "Connect with trusted local vendors for textbooks, uniforms, and stationery across Tanzania.",
    type: "website",
    locale: "en_TZ",
    siteName: "Shuleyetu",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shuleyetu | Tanzania's School Supply Marketplace",
    description: "Connect with trusted local vendors for textbooks, uniforms, and stationery across Tanzania.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-sky-500/20 selection:text-sky-100">
        <CartProvider>
        <LanguageProvider>
          <ToastProvider>
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(2,6,23,0.98)_100%)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_45%)]" />
              <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 text-sm backdrop-blur-2xl safe-area-top shadow-[0_10px_40px_rgba(2,6,23,0.35)]">
                <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:gap-6 md:px-6 md:py-5">
                  <Link href="/" className="group flex min-h-[44px] flex-shrink-0 items-center gap-3 rounded-2xl border border-transparent px-1 transition-all hover:border-white/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-transparent text-sm font-black text-sky-300 shadow-lg shadow-sky-500/10">
                      S
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold tracking-tight text-transparent bg-gradient-to-r from-sky-300 via-sky-400 to-sky-600 bg-clip-text transition-all group-hover:from-sky-200 group-hover:to-sky-400">
                        Shuleyetu
                      </span>
                      <span className="hidden text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400 sm:block">
                        School supply network
                      </span>
                    </div>
                  </Link>

                  <div className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:flex">
                    <Link
                      href="/"
                      className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-slate-300 transition-all hover:bg-white/5 hover:text-sky-300 font-medium"
                    >
                      Home
                    </Link>
                    <Link
                      href="/vendors"
                      className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-slate-300 transition-all hover:bg-white/5 hover:text-sky-300 font-medium"
                    >
                      Vendors
                    </Link>
                    <Link
                      href="/orders"
                      className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-slate-300 transition-all hover:bg-white/5 hover:text-sky-300 font-medium"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-slate-300 transition-all hover:bg-white/5 hover:text-sky-300 font-medium"
                    >
                      Vendor Dashboard
                    </Link>
                    <Link
                      href="/schools/portal"
                      className="flex min-h-[44px] items-center rounded-xl bg-amber-500/10 px-4 py-2 font-semibold text-amber-200 ring-1 ring-amber-400/20 transition-all hover:bg-amber-500/15 hover:text-amber-100"
                    >
                      School Portal
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <LanguageSwitcher />
                      <ThemeToggle />
                    </div>
                    <CartButton />
                    <NavUser />
                    <MobileNav />
                  </div>
                </nav>
              </header>
              <main className="relative flex-1">{children}</main>
              <Footer />
              <CartDrawer />
              <ScrollToTop />
            </div>
          </ToastProvider>
        </LanguageProvider>
        </CartProvider>
      <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
