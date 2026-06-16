'use client';
// Metadata must be in a separate server component for client pages;
// this page uses client state so meta is handled via layout defaults.

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  const contactMethods = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Email Us',
      value: 'hello@shuleyetu.com',
      href: 'mailto:hello@shuleyetu.com',
      color: 'sky',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      label: 'Call Us',
      value: '+255 700 000 000',
      href: 'tel:+255700000000',
      color: 'emerald',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Visit Us',
      value: 'Dar es Salaam, Tanzania',
      href: '#',
      color: 'violet',
    },
  ];

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Get in Touch
            </div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-slate-50 md:text-6xl lg:text-7xl">
              We&apos;d love to
              <span className="block mt-2 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">
                hear from you
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed max-w-xl">
              Have a question, feedback, or want to partner with us? Our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                className={`group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-${method.color}-500/50 hover:shadow-xl hover:shadow-${method.color}-500/10`}
              >
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-${method.color}-500/10 text-${method.color}-400 transition-transform group-hover:scale-110`}>
                  {method.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{method.label}</p>
                  <p className="mt-1 font-semibold text-slate-100">{method.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Form */}
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-50 md:text-3xl mb-2">Send us a message</h2>
            <p className="text-slate-400 mb-8">We typically respond within 24 hours.</p>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-emerald-300 mb-2">Message sent!</h3>
                <p className="text-slate-400">Thanks for reaching out. We&apos;ll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-6 text-sm text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-50 placeholder-slate-500 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-50 placeholder-slate-500 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-50 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="vendor">Vendor Partnership</option>
                    <option value="school">School Partnership</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-50 placeholder-slate-500 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-sky-400/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick Links & Info */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-50 md:text-3xl mb-2">Quick answers</h2>
              <p className="text-slate-400 mb-6">Common topics we can help with.</p>
            </div>
            {[
              { title: 'Vendor Registration', desc: 'Want to list your shop on Shuleyetu? Contact us to get started.', href: '/auth/login', cta: 'Sign up as vendor' },
              { title: 'School Partnerships', desc: 'Schools can partner with us to streamline supply lists for parents.', href: '/why-shuleyetu', cta: 'Learn more' },
              { title: 'Order Support', desc: 'Having trouble with an order? Track it or reach out directly.', href: '/orders/track', cta: 'Track order' },
              { title: 'Technical Issues', desc: 'Experiencing a bug or technical problem? Let us know.', href: 'mailto:support@shuleyetu.com', cta: 'Email support' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all hover:border-sky-500/30">
                <h3 className="font-semibold text-slate-100 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-400 mb-3">{item.desc}</p>
                <Link href={item.href} className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1">
                  {item.cta}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
