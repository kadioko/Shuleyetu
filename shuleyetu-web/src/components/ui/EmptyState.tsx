'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  const getActionClasses = (variant: 'primary' | 'secondary' = 'primary') => {
    const baseClasses = 'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors';
    
    if (variant === 'primary') {
      return `${baseClasses} bg-sky-500 text-slate-950 hover:bg-sky-400`;
    }
    
    return `${baseClasses} border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white`;
  };

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-12 text-center ${className}`}>
      {icon && (
        <div className="mb-4 rounded-full bg-slate-800 p-4 text-slate-400">
          {icon}
        </div>
      )}
      
      <h3 className="mb-2 text-lg font-semibold text-slate-200">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-slate-400">{description}</p>
      
      <div className="flex flex-col gap-3 sm:flex-row">
        {action && (
          <Link href={action.href} className={getActionClasses(action.variant)}>
            {action.label}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
        
        {secondaryAction && (
          <Link href={secondaryAction.href} className="text-sm font-medium text-sky-400 hover:text-sky-300">
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

// Pre-configured empty states
export function EmptyOrders() {
  return (
    <EmptyState
      title="No orders yet"
      description="You haven't received any orders yet. Share your vendor page to start receiving orders from customers."
      icon={
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      }
      action={{
        label: 'View Vendor Page',
        href: '/vendors',
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Add Inventory Items',
        href: '/dashboard/inventory/new'
      }}
    />
  );
}

export function EmptyInventory() {
  return (
    <EmptyState
      title="No inventory items"
      description="Start by adding products to your inventory. Customers can only order items that you have in stock."
      icon={
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      }
      action={{
        label: 'Add First Item',
        href: '/dashboard/inventory/new',
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'View Documentation',
        href: '/docs'
      }}
    />
  );
}

export function EmptyVendors() {
  return (
    <EmptyState
      title="No vendors found"
      description="There are no vendors available at the moment. Check back later or contact support if you're a vendor who wants to join."
      icon={
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
      action={{
        label: 'Create Order',
        href: '/orders/new',
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Contact Support',
        href: 'mailto:support@shuleyetu.com'
      }}
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search terms or filters to find what you're looking for."
      icon={
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      action={{
        label: 'Clear Filters',
        href: '#',
        variant: 'secondary'
      }}
    />
  );
}

export function EmptyDashboard() {
  return (
    <EmptyState
      title="Welcome to your dashboard"
      description="Get started by adding inventory items to your store. Once you have products, you'll see analytics and recent orders here."
      icon={
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      }
      action={{
        label: 'Add Inventory Items',
        href: '/dashboard/inventory/new',
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'View Vendor Profile',
        href: '/vendors'
      }}
    />
  );
}

export function EmptyOrdersList() {
  return (
    <EmptyState
      title="No orders yet"
      description="Your order list is empty. Create your first order to get started with school supplies."
      icon={
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
      action={{
        label: 'Create First Order',
        href: '/orders/new',
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Browse Vendors',
        href: '/vendors'
      }}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      title="All caught up!"
      description="You have no new notifications. We'll notify you when there are updates to your orders or account."
      icon={
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      }
      action={{
        label: 'View Orders',
        href: '/dashboard/orders',
        variant: 'secondary'
      }}
    />
  );
}
