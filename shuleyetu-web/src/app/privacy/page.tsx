import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Shuleyetu',
  description: 'Read the Shuleyetu Privacy Policy to understand how we collect, use, and protect your personal data on our school supply marketplace.',
  openGraph: {
    title: 'Privacy Policy | Shuleyetu',
    description: 'How Shuleyetu collects, uses, and protects your personal data.',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-sky-400 transition-colors">Home</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-200">Privacy Policy</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Legal
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-50 md:text-5xl lg:text-6xl">Privacy Policy</h1>
          <p className="mt-4 text-slate-400 text-lg">Last updated: January 21, 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <div className="space-y-10 text-slate-300">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">1. Introduction</h2>
            <p>
              Shuleyetu (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;) operates the Shuleyetu platform. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">2. Information Collection and Use</h2>
            <p className="mb-3">We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            <h3 className="mb-2 text-lg font-semibold text-slate-200">Types of Data Collected:</h3>
            <ul className="space-y-2 pl-6">
              <li>• Personal identification information (name, email, phone number)</li>
              <li>• Location data (region, district, ward, street address)</li>
              <li>• Order history and transaction data</li>
              <li>• Payment information (processed securely through ClickPesa)</li>
              <li>• Device information (IP address, browser type, operating system)</li>
              <li>• Usage data (pages visited, time spent, interactions)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">3. Use of Data</h2>
            <p className="mb-3">Shuleyetu uses the collected data for various purposes:</p>
            <ul className="space-y-2 pl-6">
              <li>• To provide and maintain our Service</li>
              <li>• To notify you about changes to our Service</li>
              <li>• To allow you to participate in interactive features of our Service</li>
              <li>• To provide customer support</li>
              <li>• To gather analysis or valuable information so that we can improve our Service</li>
              <li>• To monitor the usage of our Service</li>
              <li>• To detect, prevent and address technical issues</li>
              <li>• To send promotional communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">4. Security of Data</h2>
            <p>
              The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">5. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="space-y-2 pl-6">
              <li>• Access your personal data</li>
              <li>• Correct inaccurate personal data</li>
              <li>• Request deletion of your personal data</li>
              <li>• Opt-out of marketing communications</li>
              <li>• Data portability (receive your data in a structured format)</li>
              <li>• Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">6. Data Retention</h2>
            <p>
              We will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">7. Third-Party Services</h2>
            <p>
              Our Service may contain links to other sites that are not operated by us. This Privacy Policy does not apply to third-party websites and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">8. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-3 space-y-1 text-slate-400">
              <p>Email: privacy@shuleyetu.com</p>
              <p>Address: Dar es Salaam, Tanzania</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
