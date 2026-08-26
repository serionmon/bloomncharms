'use client';

import React, { useState, useEffect } from 'react';

interface DiscountCampaign {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  startsAt: string;
  expiresAt?: string;
  isActive: boolean;
  timesUsed: number;
  createdAt: string;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    value: '',
    minimumOrderAmount: '',
    maximumDiscountAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    setIsLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${API_URL}/api/admin/discounts`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.discounts)) {
          setDiscounts(data.discounts);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Default static demonstration discounts
    const fallbackDiscounts: DiscountCampaign[] = [
      {
        id: 'disc-1',
        code: 'WELCOME10',
        name: 'First Order Welcome Coupon',
        description: '10% off on your introductory artisanal order',
        discountType: 'percentage',
        value: 10,
        minimumOrderAmount: 499,
        maximumDiscountAmount: 200,
        startsAt: new Date().toISOString(),
        isActive: true,
        timesUsed: 14,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'disc-2',
        code: 'ATELIER250',
        name: 'Festive Fixed Discount',
        description: 'Flat ₹250 off on luxury bouquets above ₹1,500',
        discountType: 'fixed_amount',
        value: 250,
        minimumOrderAmount: 1500,
        startsAt: new Date().toISOString(),
        isActive: true,
        timesUsed: 6,
        createdAt: new Date().toISOString(),
      },
    ];

    setDiscounts(fallbackDiscounts);
    setIsLoading(false);
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.value) {
      setToastMessage({ text: 'Please fill in required fields (Code, Name, Value).', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      discountType: formData.discountType,
      value: parseFloat(formData.value),
      minimumOrderAmount: formData.minimumOrderAmount ? parseFloat(formData.minimumOrderAmount) : undefined,
      maximumDiscountAmount: formData.maximumDiscountAmount ? parseFloat(formData.maximumDiscountAmount) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      isActive: formData.isActive,
    };

    try {
      const res = await fetch(`${API_URL}/api/admin/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setDiscounts((prev) => [data.discount, ...prev]);
        setToastMessage({ text: `Coupon ${payload.code} created successfully.`, type: 'success' });
        setIsCreateModalOpen(false);
        resetForm();
        setIsSubmitting(false);
        return;
      }
    } catch {
      // optimistic fallback
    }

    const newDisc: DiscountCampaign = {
      id: `disc-${Date.now()}`,
      code: payload.code,
      name: payload.name,
      description: payload.description,
      discountType: payload.discountType,
      value: payload.value,
      minimumOrderAmount: payload.minimumOrderAmount,
      maximumDiscountAmount: payload.maximumDiscountAmount,
      usageLimit: payload.usageLimit,
      startsAt: new Date().toISOString(),
      expiresAt: payload.expiresAt,
      isActive: payload.isActive,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
    };

    setDiscounts((prev) => [newDisc, ...prev]);
    setToastMessage({ text: `Coupon ${payload.code} created (local state).`, type: 'success' });
    setIsCreateModalOpen(false);
    resetForm();
    setIsSubmitting(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${API_URL}/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        setDiscounts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, isActive: !currentActive } : d))
        );
        setToastMessage({
          text: `Coupon status changed to ${!currentActive ? 'Active' : 'Inactive'}.`,
          type: 'success',
        });
        return;
      }
    } catch {
      // optimistic
    }

    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: !currentActive } : d))
    );
    setToastMessage({
      text: `Coupon status changed to ${!currentActive ? 'Active' : 'Inactive'} (local).`,
      type: 'success',
    });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      value: '',
      minimumOrderAmount: '',
      maximumDiscountAmount: '',
      usageLimit: '',
      expiresAt: '',
      isActive: true,
    });
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-border pb-md">
        <div>
          <h1 className="font-headline-lg text-2xl uppercase tracking-wider text-on-surface">
            DISCOUNT CAMPAIGNS
          </h1>
          <p className="font-body-md text-xs text-on-surface-muted mt-1">
            Create and manage promotional coupons, minimum order constraints, and maximum caps.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded text-xs font-label-sm uppercase tracking-wider hover:bg-primary-container flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create Coupon
        </button>
      </div>

      {toastMessage && (
        <div
          className={`p-3 rounded text-xs font-label-sm uppercase tracking-wider flex justify-between items-center ${
            toastMessage.type === 'success'
              ? 'bg-secondary/10 text-secondary border border-secondary/20'
              : 'bg-red-500/10 text-red-700 border border-red-500/20'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Discounts Table */}
      <div className="border border-border rounded bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-low border-b border-border font-label-sm uppercase tracking-wider text-on-surface-muted">
            <tr>
              <th className="py-3 px-4">Coupon Code</th>
              <th className="py-3 px-4">Campaign Name</th>
              <th className="py-3 px-4">Type & Value</th>
              <th className="py-3 px-4">Min Order</th>
              <th className="py-3 px-4">Max Cap</th>
              <th className="py-3 px-4">Used</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-body-md">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-on-surface-muted">
                  Loading discount campaigns...
                </td>
              </tr>
            ) : discounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-on-surface-muted">
                  No discount campaigns found. Click &apos;Create Coupon&apos; to begin.
                </td>
              </tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-primary text-xs uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {d.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-on-surface">
                    {d.name}
                    {d.description && (
                      <span className="text-[10px] text-on-surface-muted block font-normal truncate max-w-xs">
                        {d.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">
                    {d.discountType === 'percentage' ? `${d.value}% Off` : `₹${d.value} Flat`}
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-muted font-mono">
                    {d.minimumOrderAmount ? `₹${d.minimumOrderAmount}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-muted font-mono">
                    {d.maximumDiscountAmount ? `₹${d.maximumDiscountAmount}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {d.timesUsed} {d.usageLimit ? `/ ${d.usageLimit}` : ''}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-label-sm uppercase tracking-wider font-semibold ${
                        d.isActive
                          ? 'bg-secondary/10 text-secondary border border-secondary/20'
                          : 'bg-surface-container text-on-surface-muted border border-border'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(d.id, d.isActive)}
                      className={`px-3 py-1 border rounded text-[11px] font-label-sm uppercase tracking-wider transition-colors cursor-pointer ${
                        d.isActive
                          ? 'border-border text-on-surface hover:border-red-500 hover:text-red-700'
                          : 'border-secondary/40 text-secondary hover:bg-secondary/10'
                      }`}
                    >
                      {d.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full rounded border border-border p-6 shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-headline-sm text-base uppercase tracking-wider text-on-surface font-semibold">
                Create New Coupon Campaign
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-muted hover:text-on-surface text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="flex flex-col gap-3 font-body-md text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER20"
                    className="w-full px-3 py-2 bg-surface border border-border rounded font-mono uppercase font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Summer Special"
                    className="w-full px-3 py-2 bg-surface border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional customer-facing description"
                  className="w-full px-3 py-2 bg-surface border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed_amount' })
                    }
                    className="w-full px-3 py-2 bg-surface border border-border rounded focus:border-primary focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? 'e.g. 20 for 20%' : 'e.g. 250 for ₹250'}
                    className="w-full px-3 py-2 bg-surface border border-border rounded font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 bg-surface border border-border rounded font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maximumDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: e.target.value })}
                    placeholder="e.g. 300"
                    className="w-full px-3 py-2 bg-surface border border-border rounded font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Usage Limit (Total)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 bg-surface border border-border rounded font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Expires At
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isActiveToggle" className="font-label-sm uppercase text-xs cursor-pointer">
                  Activate coupon immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border rounded font-label-sm uppercase tracking-wider text-on-surface-muted hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-on-primary rounded font-label-sm uppercase tracking-wider hover:bg-primary-container disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
