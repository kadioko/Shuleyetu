'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/Toast';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { FormField, ValidationRules } from '@/components/ui/FormField';

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface VendorData {
  name: string;
  description: string;
  region: string;
  district: string;
  ward: string;
  streetAddress: string;
  phoneNumber: string;
  email: string;
}

export default function VendorOnboardingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VendorData>({
    name: '',
    description: '',
    region: '',
    district: '',
    ward: '',
    streetAddress: '',
    phoneNumber: '',
    email: '',
  });

  const stepTitles = ['Welcome', 'Business Info', 'Location', 'Contact', 'Review'];
  const steps = stepTitles.map((title, index) => ({
    id: `step-${index + 1}`,
    title,
    status: (
      index + 1 < currentStep ? 'completed' : index + 1 === currentStep ? 'active' : 'pending'
    ) as 'completed' | 'active' | 'pending',
  }));

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        addToast({
          type: 'error',
          title: 'Authentication required',
          message: 'Please log in to continue',
        });
        router.push('/auth/vendor-login?next=/vendor/onboarding');
        return;
      }

      // Create vendor
      const { data: vendor, error: vendorError } = await supabaseClient
        .from('vendors')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            region: formData.region,
            district: formData.district,
            ward: formData.ward,
            street_address: formData.streetAddress,
            phone_number: formData.phoneNumber,
            email: formData.email || null,
          },
        ])
        .select()
        .single();

      if (vendorError) throw vendorError;

      // Link user to vendor
      const { error: linkError } = await supabaseClient
        .from('vendor_users')
        .insert([
          {
            user_id: user.id,
            vendor_id: vendor.id,
          },
        ]);

      if (linkError) throw linkError;

      addToast({
        type: 'success',
        title: 'Welcome to Shuleyetu!',
        message: 'Your vendor account has been created successfully',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      addToast({
        type: 'error',
        title: 'Onboarding failed',
        message: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-3 py-8 md:px-4 md:py-12">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Shuleyetu</h1>
        <p className="mt-2 text-slate-400">Set up your vendor account in just a few steps</p>
      </header>

      {/* Progress Steps */}
      <ProgressSteps steps={steps} />

      {/* Form Content */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex rounded-lg bg-sky-500/10 p-4 text-sky-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Let&apos;s get started</h2>
              <p className="mt-2 text-slate-400">
                Shuleyetu connects school supply vendors with parents and schools across Tanzania. We&apos;ll help you reach more customers and grow your business.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Reach more customers</p>
                  <p className="text-sm text-slate-400">Connect with parents and schools in your region</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Manage inventory easily</p>
                  <p className="text-sm text-slate-400">Track stock and get low-stock alerts</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Secure payments</p>
                  <p className="text-sm text-slate-400">Get paid safely via M-Pesa</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">Business Information</h2>
            <FormField
              label="Business Name"
              name="name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="Your shop name"
              validation={ValidationRules.name}
              required
            />
            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Tell customers about your business"
              validation={{ maxLength: 500 }}
              helperText="Max 500 characters"
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">Location</h2>
            <FormField
              label="Region"
              name="region"
              value={formData.region}
              onChange={(value) => setFormData({ ...formData, region: value })}
              placeholder="e.g. Dar es Salaam"
              validation={ValidationRules.name}
              required
            />
            <FormField
              label="District"
              name="district"
              value={formData.district}
              onChange={(value) => setFormData({ ...formData, district: value })}
              placeholder="e.g. Ilala"
              validation={ValidationRules.name}
              required
            />
            <FormField
              label="Ward"
              name="ward"
              value={formData.ward}
              onChange={(value) => setFormData({ ...formData, ward: value })}
              placeholder="e.g. Kariakoo"
              validation={ValidationRules.name}
              required
            />
            <FormField
              label="Street Address"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={(value) => setFormData({ ...formData, streetAddress: value })}
              placeholder="Your shop address"
              validation={ValidationRules.name}
              required
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">Contact Information</h2>
            <FormField
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
              placeholder="0712 345 678"
              validation={ValidationRules.tanzanianPhone}
              required
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              placeholder="your@email.com"
              validation={ValidationRules.email}
              required
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-100">Review Your Information</h2>

            <div className="space-y-4 rounded-lg bg-slate-800/50 p-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Business Name</p>
                <p className="mt-1 text-slate-200">{formData.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Description</p>
                <p className="mt-1 text-slate-200">{formData.description}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Location</p>
                <p className="mt-1 text-slate-200">
                  {formData.streetAddress}, {formData.ward}, {formData.district}, {formData.region}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Contact</p>
                <p className="mt-1 text-slate-200">{formData.phoneNumber}</p>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}
      </section>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {currentStep < 5 ? (
          <button
            onClick={handleNext}
            className="flex-1 rounded-lg bg-sky-500 px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-sky-500 px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        )}
      </div>

      {/* Help Link */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/auth/vendor-login?next=/vendor/onboarding" className="font-medium text-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
