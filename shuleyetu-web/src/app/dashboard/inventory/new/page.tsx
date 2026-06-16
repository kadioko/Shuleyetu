"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import { FormField, ValidationRules } from "@/components/ui/FormField";

type VendorMapping = {
  vendor_id: string;
  vendors?: {
    name: string | null;
  }[] | null;
};

export default function NewInventoryItemPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorMapping | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) {
        console.error('Error getting user', userError);
        setError('Failed to load user.');
        setLoading(false);
        return;
      }

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: mapping, error: mapError } = await supabaseClient
        .from('vendor_users')
        .select('vendor_id, vendors(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (mapError) {
        console.error('Error loading vendor mapping', mapError);
        setError('Failed to load vendor mapping.');
        setLoading(false);
        return;
      }

      if (!mapping) {
        setError(
          'No vendor is linked to this user. An admin must add a row in vendor_users for you.',
        );
        setLoading(false);
        return;
      }

      setVendor(mapping as unknown as VendorMapping);
      setLoading(false);
    };

    void load();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!vendor) return;

    setError(null);

    const priceNumber = Number(price);
    const stockNumber = Number(stock);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setError('Enter a valid price in TZS.');
      return;
    }

    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      setError('Enter a valid stock quantity (0 or more).');
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabaseClient.from('inventory').insert({
      vendor_id: vendor.vendor_id,
      name: name.trim(),
      description: description.trim() || null,
      category,
      price_tzs: priceNumber,
      stock_quantity: stockNumber,
      is_active: isActive,
      image_url: imageUrl.trim() || null,
    });

    if (insertError) {
      console.error('Error creating inventory item', insertError);
      setError('Failed to create item.');
      addToast({
        type: 'error',
        title: 'Item not saved',
        message: 'Something went wrong while creating the item.',
      });
      setSubmitting(false);
      return;
    }

    addToast({
      type: 'success',
      title: 'Item created',
      message: 'Your inventory item has been saved.',
    });

    router.push('/dashboard/inventory');
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-3 py-8 md:px-4 md:py-12">
        <header className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
          <div className="h-7 w-56 rounded bg-slate-800 animate-pulse" />
        </header>
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-8 rounded-md bg-slate-900/80 animate-pulse"
            />
          ))}
        </section>
      </main>
    );
  }

  if (error && !vendor) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-3 py-8 md:px-4 md:py-12">
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </p>
        <Link
          href="/dashboard/inventory"
          className="text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          ← Back to inventory
        </Link>
      </main>
    );
  }

  const vendorName = vendor?.vendors?.[0]?.name ?? 'your vendor';

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-3 py-8 md:px-4 md:py-12">
      <header className="space-y-2">
        <Link
          href="/dashboard/inventory"
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          ← Inventory
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Add inventory item
        </h1>
        <p className="text-sm text-slate-300">Create a new item for {vendorName}.</p>
      </header>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-100">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Name"
            name="name"
            value={name}
            onChange={setName}
            placeholder="e.g. Form One Mathematics Textbook"
            validation={ValidationRules.name}
            className="md:col-span-2"
          />

          <FormField
            label="Description (optional)"
            name="description"
            type="textarea"
            value={description}
            onChange={setDescription}
            placeholder="Brief description of the item"
            validation={{ maxLength: 500 }}
            className="md:col-span-2"
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-500"
            >
              <option value="textbook">Textbook</option>
              <option value="uniform">Uniform</option>
              <option value="stationery">Stationery</option>
              <option value="other">Other</option>
            </select>
          </div>

          <FormField
            label="Price (TZS)"
            name="price"
            type="number"
            value={price}
            onChange={setPrice}
            placeholder="0"
            validation={{ required: true, min: 0 }}
            helperText="Enter the price in Tanzanian Shillings"
          />

          <FormField
            label="Stock quantity"
            name="stock"
            type="number"
            value={stock}
            onChange={setStock}
            placeholder="0"
            validation={{ required: true, min: 0 }}
            helperText="Number of items available in stock"
          />

          <FormField
            label="Image URL (optional)"
            name="image_url"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https://..."
            helperText="Link to a product photo (you can paste a Cloudinary or Imgur URL)"
            className="md:col-span-2"
          />

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-3 w-3 rounded border-slate-600 bg-slate-950 text-sky-500"
            />
            <label
              htmlFor="is_active"
              className="text-xs font-medium text-slate-300"
            >
              Active item
            </label>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving…
                </>
              ) : (
                'Save item'
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
