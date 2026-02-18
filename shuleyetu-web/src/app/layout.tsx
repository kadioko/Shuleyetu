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
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <LanguageProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-50 border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-950/95 text-sm backdrop-blur-xl safe-area-top shadow-lg shadow-slate-950/50">
                <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 md:gap-6 md:px-6 md:py-5">
                  <Link href="/" className="group flex items-center gap-2 flex-shrink-0 min-h-[44px]">
                    <div className="text-xl font-bold tracking-tight text-transparent bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text group-hover:from-sky-300 group-hover:to-sky-500 transition-all">
                      Shuleyetu
                    </div>
                  </Link>

                  {/* Desktop navigation */}
                  <div className="hidden md:flex items-center gap-1 text-sm">
                    <Link
                      href="/"
                      className="text-slate-300 hover:text-sky-400 transition-colors min-h-[44px] flex items-center px-3 py-2 rounded-lg hover:bg-slate-900/50 font-medium"
                    >
                      Home
                    </Link>
                    <Link
                      href="/vendors"
                      className="text-slate-300 hover:text-sky-400 transition-colors min-h-[44px] flex items-center px-3 py-2 rounded-lg hover:bg-slate-900/50 font-medium"
                    >
                      Vendors
                    </Link>
                    <Link
                      href="/orders"
                      className="text-slate-300 hover:text-sky-400 transition-colors min-h-[44px] flex items-center px-3 py-2 rounded-lg hover:bg-slate-900/50 font-medium"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/dashboard"
                      className="text-slate-300 hover:text-sky-400 transition-colors min-h-[44px] flex items-center px-3 py-2 rounded-lg hover:bg-slate-900/50 font-medium"
                    >
                      Dashboard
                    </Link>
                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden md:flex items-center gap-2">
                      <div className="h-5 w-px bg-slate-800" />
                      <LanguageSwitcher />
                      <ThemeToggle />
                    </div>
                    <NavUser />
                    <MobileNav />
                  </div>
                </nav>
              </header>
            <main className="flex-1">{children}</main>
            <Footer />
            <ScrollToTop />
            </div>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
