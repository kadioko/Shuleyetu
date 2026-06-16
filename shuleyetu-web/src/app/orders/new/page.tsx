'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/Toast';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { FormField, ValidationRules } from '@/components/ui/FormField';

type Vendor = {
  id: string;
  name: string;
};

type InventoryItem = {
  id: string;
  name: string;
  price_tzs: number | string;
  stock_quantity: number | null;
  image_url: string | null;
};

export default function NewOrderPage() {
  const { addToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  useEffect(() => {
    const loadVendors = async () => {
      setLoadingVendors(true);
      setError(null);
      const { data, error } = await supabaseClient
        .from('vendors')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vendors', error);
        addToast({
          type: 'error',
          title: 'Failed to load vendors',
          message: 'Please try again later'
        });
      } else {
        setVendors(data ?? []);
        if (data && data.length > 0) {
          addToast({
            type: 'success',
            title: 'Vendors loaded',
            message: `Found ${data.length} vendors`
          });
        }
      }
      setLoadingVendors(false);
    };

    loadVendors();
  }, [addToast]);

  useEffect(() => {
    const loadItems = async () => {
      if (!selectedVendorId) {
        setItems([]);
        setQuantities({});
        return;
      }

      setLoadingItems(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('inventory')
        .select('id, name, price_tzs, stock_quantity, image_url')
        .eq('vendor_id', selectedVendorId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading inventory', error);
        addToast({
          type: 'error',
          title: 'Failed to load inventory',
          message: 'Please try selecting a different vendor'
        });
      } else {
        setItems(data ?? []);
        setQuantities({});
        if (data && data.length > 0) {
          addToast({
            type: 'success',
            title: 'Inventory loaded',
            message: `Found ${data.length} items`
          });
        }
      }

      setLoadingItems(false);
    };

    void loadItems();
  }, [selectedVendorId, addToast]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = quantities[item.id] ?? 0;
      if (quantity <= 0) return sum;

      const priceNumber =
        typeof item.price_tzs === 'string'
          ? Number.parseFloat(item.price_tzs)
          : item.price_tzs;
      if (Number.isNaN(priceNumber)) return sum;

      return sum + priceNumber * quantity;
    }, 0);
  }, [items, quantities]);

  // Step validation
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!selectedVendorId) {
        errors.vendor = 'Please select a vendor';
      }
    } else if (step === 2) {
      const selectedItems = items.filter((item) => (quantities[item.id] ?? 0) > 0);
      if (selectedItems.length === 0) {
        errors.items = 'Please select at least one item';
      }
    } else if (step === 3) {
      if (!customerName.trim()) {
        errors.customerName = 'Customer name is required';
      }
      if (!customerPhone.trim()) {
        errors.customerPhone = 'Customer phone is required';
      }
      if (!/^\+?\d{10,15}$/.test(customerPhone.trim())) {
        errors.customerPhone = 'Please enter a valid phone number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setFormErrors({});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCreatedOrderId(null);
    setCreatedToken(null);

    if (!selectedVendorId) {
      addToast({
        type: 'error',
        title: 'No vendor selected',
        message: 'Please select a vendor to continue'
      });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Missing customer information',
        message: 'Please provide both customer name and phone number'
      });
      return;
    }

    const selectedItems = items.filter((item) => (quantities[item.id] ?? 0) > 0);
    if (selectedItems.length === 0) {
      addToast({
        type: 'error',
        title: 'No items selected',
        message: 'Please choose at least one item to order'
      });
      return;
    }

    if (totalAmount <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid order total',
        message: 'Please select at least one item with quantity greater than zero'
      });
      return;
    }

    setSubmitting(true);

    try {
      const publicAccessToken = (() => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID();
        }

        // UUID v4 fallback
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.floor(Math.random() * 16);
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      })();

      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          vendor_id: selectedVendorId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          student_name: studentName.trim() || null,
          school_name: schoolName.trim() || null,
          total_amount_tzs: totalAmount,
          public_access_token: publicAccessToken,
        })
        .select('id')
        .single();

      if (orderError || !orderData) {
        console.error('Error creating order', orderError);
        const message =
          orderError?.message?.includes('public_access_token')
            ? 'Failed to create order. The database is missing public access tokens. Apply the latest Supabase migration and try again.'
            : 'Failed to create order.';
        addToast({
          type: 'error',
          title: 'Order creation failed',
          message: message
        });
        setSubmitting(false);
        return;
      }

      const orderId = orderData.id as string;

      const itemsPayload = selectedItems.map((item) => {
        const quantity = quantities[item.id] ?? 0;
        const priceNumber =
          typeof item.price_tzs === 'string'
            ? Number.parseFloat(item.price_tzs)
            : item.price_tzs;

        return {
          order_id: orderId,
          inventory_id: item.id,
          quantity,
          unit_price_tzs: priceNumber,
        };
      });

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(itemsPayload);

      if (itemsError) {
        console.error('Error creating order items', itemsError);
        addToast({
          type: 'warning',
          title: 'Order partially created',
          message: 'Order was created but adding items failed. Please contact support.'
        });
        setSubmitting(false);
        return;
      }

      addToast({
        type: 'success',
        title: 'Order created successfully!',
        message: `Order #${orderId.slice(0, 8)} has been created`
      });
      setCreatedOrderId(orderId);
      setCreatedToken(publicAccessToken);
      setQuantities({});
      setCustomerName('');
      setCustomerPhone('');
      setStudentName('');
      setSchoolName('');
    } catch (err) {
      console.error('Unexpected error when creating order', err);
      addToast({
        type: 'error',
        title: 'Unexpected error',
        message: 'Something went wrong while creating your order. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const progressSteps = [
    { id: 'vendor', title: 'Select Vendor', description: 'Choose a vendor', status: currentStep >= 1 ? (currentStep > 1 ? 'completed' as const : 'active' as const) : 'pending' as const },
    { id: 'items', title: 'Select Items', description: 'Add products', status: currentStep >= 2 ? (currentStep > 2 ? 'completed' as const : 'active' as const) : 'pending' as const },
    { id: 'details', title: 'Customer Info', description: 'Add details', status: currentStep >= 3 ? (currentStep > 3 ? 'completed' as const : 'active' as const) : 'pending' as const },
    { id: 'review', title: 'Review Order', description: 'Confirm & pay', status: currentStep >= 4 ? 'active' as const : 'pending' as const },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="space-y-6">
        <div>
          <Link
            href="/vendors"
            className="text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            ← View vendors
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create New Order</h1>
          <p className="text-sm text-slate-300">
            Follow the steps below to create your order for school supplies.
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="hidden lg:block">
          <ProgressSteps steps={progressSteps} />
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
      >
        {/* Step 1: Select Vendor */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex rounded-lg bg-sky-500/10 p-3 text-sky-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Select a Vendor</h2>
              <p className="text-sm text-slate-400">Choose which vendor you want to order from</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Vendor</label>
              <select
                value={selectedVendorId}
                onChange={(event) => setSelectedVendorId(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
              >
                <option value="">
                  {loadingVendors ? 'Loading vendors…' : 'Select a vendor'}
                </option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {formErrors.vendor && (
                <p className="text-xs text-red-400">{formErrors.vendor}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                disabled={!selectedVendorId}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
              >
                Next
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Items */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex rounded-lg bg-sky-500/10 p-3 text-sky-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Select Items</h2>
              <p className="text-sm text-slate-400">Choose the items you want to order</p>
            </div>

            {loadingItems ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Array.from({ length: 5 }).map((_, index) => (
                  <CardSkeleton key={index} height="80px" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No items available for this vendor</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.price_tzs} TZS</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = quantities[item.id] || 0;
                          if (current > 0) {
                            setQuantities(prev => ({ ...prev, [item.id]: current - 1 }));
                          }
                        }}
                        className="h-8 w-8 rounded border border-slate-600 bg-slate-900 text-slate-400 hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm text-slate-200">
                        {quantities[item.id] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = quantities[item.id] || 0;
                          const stock = typeof item.stock_quantity === 'number' ? item.stock_quantity : 0;
                          if (current < stock) {
                            setQuantities(prev => ({ ...prev, [item.id]: current + 1 }));
                          }
                        }}
                        className="h-8 w-8 rounded border border-slate-600 bg-slate-900 text-slate-400 hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formErrors.items && (
              <p className="text-xs text-red-400 text-center">{formErrors.items}</p>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
              >
                Next
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex rounded-lg bg-sky-500/10 p-3 text-sky-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Customer Information</h2>
              <p className="text-sm text-slate-400">Provide contact details for the order</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <FormField
                label="Customer Name"
                name="customerName"
                value={customerName}
                onChange={setCustomerName}
                placeholder="Parent / guardian name"
                validation={ValidationRules.name}
                required
              />

              <FormField
                label="Phone Number"
                name="customerPhone"
                value={customerPhone}
                onChange={setCustomerPhone}
                placeholder="e.g. 0712 123 456"
                validation={ValidationRules.tanzanianPhone}
                required
              />

              <FormField
                label="Student Name (Optional)"
                name="studentName"
                value={studentName}
                onChange={setStudentName}
                placeholder="Student name"
                validation={{ maxLength: 50 }}
              />

              <FormField
                label="School Name (Optional)"
                name="schoolName"
                value={schoolName}
                onChange={setSchoolName}
                placeholder="School name"
                validation={{ maxLength: 100 }}
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
              >
                Review Order
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex rounded-lg bg-sky-500/10 p-3 text-sky-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Review Your Order</h2>
              <p className="text-sm text-slate-400">Confirm the details and submit your order</p>
            </div>

            <div className="space-y-4">
              {/* Order Summary */}
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Vendor:</span>
                    <span className="text-slate-200">{vendors.find(v => v.id === selectedVendorId)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Customer:</span>
                    <span className="text-slate-200">{customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-200">{customerPhone}</span>
                  </div>
                  {studentName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Student:</span>
                      <span className="text-slate-200">{studentName}</span>
                    </div>
                  )}
                  {schoolName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">School:</span>
                      <span className="text-slate-200">{schoolName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary */}
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Items ({items.filter(item => (quantities[item.id] ?? 0) > 0).length})</h3>
                <div className="space-y-2">
                  {items.filter(item => (quantities[item.id] ?? 0) > 0).map(item => {
                    const quantity = quantities[item.id] || 0;
                    const price = typeof item.price_tzs === 'string' ? parseFloat(item.price_tzs) : item.price_tzs;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.name} x{quantity}</span>
                        <span className="text-slate-200">{(price * quantity).toLocaleString('en-TZ')} TZS</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-slate-200">Total:</span>
                    <span className="text-base font-bold text-sky-400">{totalAmount.toLocaleString('en-TZ')} TZS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Order...
                  </>
                ) : (
                  <>
                    Create Order
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {createdOrderId && createdToken && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex rounded-lg bg-emerald-500/10 p-3 text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Order Created Successfully!</h2>
              <p className="text-sm text-slate-400">Your order has been created and is ready for payment</p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Shareable Order Link</h3>
              <p className="text-xs text-slate-400 mb-3">
                Anyone with this link can view and pay for this order.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                  href={`/orders/${createdOrderId}?token=${encodeURIComponent(createdToken)}`}
                >
                  View Order Summary
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  href={`/orders/pay/${createdOrderId}?token=${encodeURIComponent(createdToken)}`}
                >
                  Pay with ClickPesa
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => window.location.href = '/orders/new'}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Create Another Order
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}
