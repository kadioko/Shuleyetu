import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Shuleyetu',
  description: 'Read the Shuleyetu Terms of Service governing your use of our Tanzanian school supply marketplace platform.',
  openGraph: {
    title: 'Terms of Service | Shuleyetu',
    description: 'Terms and conditions governing use of the Shuleyetu platform.',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-sky-400 transition-colors">Home</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-200">Terms of Service</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Legal
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-50 md:text-5xl lg:text-6xl">Terms of Service</h1>
          <p className="mt-4 text-slate-400 text-lg">Last updated: January 21, 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <div className="space-y-10 text-slate-300">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">1. Agreement to Terms</h2>
            <p>
              By accessing and using the Shuleyetu platform (the &quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">2. Use License</h2>
            <p className="mb-3">Permission is granted to temporarily download one copy of the materials (information or software) on Shuleyetu for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="space-y-2 pl-6">
              <li>• Modifying or copying the materials</li>
              <li>• Using the materials for any commercial purpose or for any public display</li>
              <li>• Attempting to decompile or reverse engineer any software contained on Shuleyetu</li>
              <li>• Removing any copyright or other proprietary notations from the materials</li>
              <li>• Transferring the materials to another person or &ldquo;mirroring&rdquo; the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">3. Disclaimer</h2>
            <p>
              The materials on Shuleyetu are provided on an &ldquo;as is&rdquo; basis. Shuleyetu makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">4. Limitations</h2>
            <p>
              In no event shall Shuleyetu or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Shuleyetu, even if Shuleyetu or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Shuleyetu could include technical, typographical, or photographic errors. Shuleyetu does not warrant that any of the materials on its website are accurate, complete, or current. Shuleyetu may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">6. Materials on Website</h2>
            <p>
              Shuleyetu has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Shuleyetu of the site. Use of any such linked website is at the user&apos;s own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">7. Modifications</h2>
            <p>
              Shuleyetu may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of Tanzania, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">9. User Accounts</h2>
            <p className="mb-3">When you create an account on Shuleyetu, you are responsible for:</p>
            <ul className="space-y-2 pl-6">
              <li>• Maintaining the confidentiality of your account information and password</li>
              <li>• Accepting responsibility for all activities that occur under your account</li>
              <li>• Notifying us immediately of any unauthorized use of your account</li>
              <li>• Ensuring all information provided is accurate and complete</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">10. Prohibited Activities</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-2 pl-6">
              <li>• Violate any applicable laws or regulations</li>
              <li>• Infringe on any intellectual property rights</li>
              <li>• Harass, abuse, or threaten other users</li>
              <li>• Attempt to gain unauthorized access to the Service</li>
              <li>• Transmit viruses or malicious code</li>
              <li>• Engage in any form of fraud or deception</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">11. Payment Terms</h2>
            <p>
              All transactions on Shuleyetu are processed through ClickPesa. By making a purchase, you agree to ClickPesa&apos;s terms and conditions. Shuleyetu is not responsible for payment processing errors or disputes.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">12. Limitation of Liability</h2>
            <p>
              In no case shall Shuleyetu, its directors, officers, or agents be liable to you for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-3 space-y-1 text-slate-400">
              <p>Email: legal@shuleyetu.com</p>
              <p>Address: Dar es Salaam, Tanzania</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
