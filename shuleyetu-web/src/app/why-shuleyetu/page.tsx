'use client';

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function WhyShuleyetuPage() {
  const { locale, setLocale, t } = useLanguage();

  const beforeItems = [
    'Last-minute rush at stationery shops',
    'Wrong books or sizes purchased',
    'No price comparison between vendors',
    'Cash payments only, no receipts',
  ];

  const afterItems = [
    'Plan ahead with vendor catalogs',
    'Verified school lists and requirements',
    'Compare prices across multiple vendors',
    'Secure mobile money payments',
  ];

  const beforeItemsSw = [
    'Msongamano wa dakika za mwisho madukani',
    'Vitabu au saizi zisizo sahihi kununuliwa',
    'Hakuna ulinganisho wa bei kati ya wauzaji',
    'Malipo ya pesa taslimu tu, bila risiti',
  ];

  const afterItemsSw = [
    'Panga mapema na katalogi za wauzaji',
    'Orodha za shule zilizohakikiwa',
    'Linganisha bei kwa wauzaji wengi',
    'Malipo salama ya pesa za simu',
  ];

  const parentBenefits = [
    'Find all required items in one place',
    'Compare prices from multiple vendors',
    'Pay securely with mobile money',
    'Track orders from phone to delivery',
  ];

  const vendorBenefits = [
    'Simple inventory management',
    'Reach more parents online',
    'Mobile money payments integrated',
    'Works with existing staff skills',
  ];

  const schoolBenefits = [
    'Share standardized book lists',
    'Recommend trusted vendors',
    'Reduce wrong purchases',
    'Better preparation for students',
  ];

  const parentBenefitsSw = [
    'Pata vitu vyote vinavyohitajika mahali pamoja',
    'Linganisha bei kutoka wauzaji wengi',
    'Lipa salama kwa pesa za simu',
    'Fuatilia maagizo kutoka simu hadi upokeaji',
  ];

  const vendorBenefitsSw = [
    'Usimamizi rahisi wa bidhaa',
    'Fikia wazazi zaidi mtandaoni',
    'Malipo ya pesa za simu yameunganishwa',
    'Inafanya kazi na ujuzi uliopo wa wafanyakazi',
  ];

  const schoolBenefitsSw = [
    'Shiriki orodha za vitabu zilizosawazishwa',
    'Pendekeza wauzaji wa kuaminika',
    'Punguza ununuzi usio sahihi',
    'Maandalizi bora kwa wanafunzi',
  ];

  const isSw = locale === 'sw';
  const currentBeforeItems = isSw ? beforeItemsSw : beforeItems;
  const currentAfterItems = isSw ? afterItemsSw : afterItems;
  const currentParentBenefits = isSw ? parentBenefitsSw : parentBenefits;
  const currentVendorBenefits = isSw ? vendorBenefitsSw : vendorBenefits;
  const currentSchoolBenefits = isSw ? schoolBenefitsSw : schoolBenefits;

  const steps = isSw
    ? [
        { step: '1', title: t('whyStep1Title'), desc: t('whyStep1Desc') },
        { step: '2', title: t('whyStep2Title'), desc: t('whyStep2Desc') },
        { step: '3', title: t('whyStep3Title'), desc: t('whyStep3Desc') },
        { step: '4', title: t('whyStep4Title'), desc: t('whyStep4Desc') },
      ]
    : [
        { step: '1', title: t('whyStep1Title'), desc: t('whyStep1Desc') },
        { step: '2', title: t('whyStep2Title'), desc: t('whyStep2Desc') },
        { step: '3', title: t('whyStep3Title'), desc: t('whyStep3Desc') },
        { step: '4', title: t('whyStep4Title'), desc: t('whyStep4Desc') },
      ];

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-32">
          {/* Language Toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLocale(locale === 'en' ? 'sw' : 'en')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-sky-500/50 hover:text-sky-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {locale === 'en' ? t('switchToSwahili') : t('switchToEnglish')}
            </button>
          </div>

          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              {t('whyOurMission')}
            </div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-slate-50 md:text-6xl lg:text-7xl">
              {t('whyHeroTitle')}
              <span className="block mt-2 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">
                {t('whyHeroTitleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-slate-300 md:text-2xl leading-relaxed max-w-2xl">
              {t('whyHeroDesc')}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/orders/new"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-sky-500/30 transition-all duration-300 hover:scale-105 hover:shadow-sky-400/40"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t('whyTryItNow')}
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-600 bg-slate-900/50 px-8 py-4 text-base font-bold text-slate-100 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-sky-500 hover:bg-slate-800/80"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('whyBrowseVendors')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center group"><p className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent md:text-4xl transition-transform group-hover:scale-110">100+</p><p className="mt-1 text-sm text-slate-400 font-medium">{t('whyVerifiedVendors')}</p></div>
            <div className="text-center group"><p className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent md:text-4xl transition-transform group-hover:scale-110">5,000+</p><p className="mt-1 text-sm text-slate-400 font-medium">{t('whyProductsListed')}</p></div>
            <div className="text-center group"><p className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent md:text-4xl transition-transform group-hover:scale-110">26</p><p className="mt-1 text-sm text-slate-400 font-medium">{t('whyRegionsCovered')}</p></div>
            <div className="text-center group"><p className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent md:text-4xl transition-transform group-hover:scale-110">24/7</p><p className="mt-1 text-sm text-slate-400 font-medium">{t('whySupportAvailable')}</p></div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">{t('whyChallengeTitle')}</h2>
          <p className="mt-4 text-base text-slate-400 md:text-lg max-w-2xl mx-auto">{t('whyChallengeDesc')}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8">
            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-sm font-bold">✗</span>{t('whyBeforeTitle')}</h3>
            <div className="space-y-4">
              {currentBeforeItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-300"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 text-xs">✗</span>{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-8">
            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">✓</span>{t('whyAfterTitle')}</h3>
            <div className="space-y-4">
              {currentAfterItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-300"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs">✓</span>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800 bg-slate-900/20 mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24" style={{maxWidth:'100%'}}>
        <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">
            {t('whyBuiltForEveryone')}
          </h2>
          <p className="mt-4 text-base text-slate-400 md:text-lg max-w-2xl mx-auto">
            {t('whyBuiltForEveryoneDesc')}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 px-4 md:px-6">
          <div className="group rounded-xl border border-slate-800 bg-gradient-to-br from-sky-950/50 to-slate-900/50 p-6 transition-all hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5">
            <div className="mb-4 inline-flex rounded-lg bg-sky-500/10 p-3 text-sky-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">{t('whyForParents')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {currentParentBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="group rounded-xl border border-slate-800 bg-gradient-to-br from-emerald-950/50 to-slate-900/50 p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-3 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">{t('whyForVendors')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {currentVendorBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="group rounded-xl border border-slate-800 bg-gradient-to-br from-violet-950/50 to-slate-900/50 p-6 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5">
            <div className="mb-4 inline-flex rounded-lg bg-violet-500/10 p-3 text-violet-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-violet-400 transition-colors">{t('whyForSchools')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {currentSchoolBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">{t('whyHowItWorksTitle')}</h2>
            <p className="mt-4 text-base text-slate-400 md:text-lg">{t('whyHowItWorksDesc')}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="text-center group">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-2xl font-bold text-white shadow-xl shadow-sky-500/30 transition-all duration-300 group-hover:scale-110">{s.step}</div>
                <h3 className="text-lg font-bold text-slate-50 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-sky-950/50 to-slate-900/50 p-12 text-center md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">{t('whyCtaTitle')}</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-slate-300 leading-relaxed">
              {t('whyCtaDesc')}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/orders/new"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-sky-500/30 transition-all duration-300 hover:scale-105 hover:shadow-sky-400/40"
              >
                {t('whyCreateOrder')}
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-600 bg-slate-900/50 px-8 py-4 text-base font-bold text-slate-100 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-sky-500 hover:bg-slate-800/80"
              >
                {t('whyBrowseVendors2')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
