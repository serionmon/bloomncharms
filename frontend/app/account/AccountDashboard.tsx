'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { type User } from '@supabase/supabase-js';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  fetchCustomerProfile,
  updateCustomerProfile,
  fetchCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  fetchCustomerOrders,
  type CustomerProfile,
  type CustomerAddress,
  type CustomerOrder,
} from '@/lib/api';

interface InitialProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  role: string;
  created_at: string;
}

interface AccountDashboardProps {
  user: User;
  profile: InitialProfile | null;
}

type TabType = 'profile' | 'addresses' | 'orders';

export default function AccountDashboard({ user, profile: initialProfile }: AccountDashboardProps) {
  const { session, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile State
  const [profile, setProfile] = useState<CustomerProfile>({
    id: user.id,
    firstName: initialProfile?.first_name || '',
    lastName: initialProfile?.last_name || '',
    email: initialProfile?.email || user.email || '',
    phone: initialProfile?.phone || '',
    role: (initialProfile?.role as any) || 'customer',
    createdAt: initialProfile?.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const token = session?.access_token || '';

  useEffect(() => {
    if (token) {
      loadProfileData();
      loadAddressesData();
      loadOrdersData();
    }
  }, [token]);

  const loadProfileData = async () => {
    if (!token) return;
    const data = await fetchCustomerProfile(token);
    if (data) {
      setProfile(data);
    }
  };

  const loadAddressesData = async () => {
    if (!token) return;
    setIsLoadingAddresses(true);
    const data = await fetchCustomerAddresses(token);
    setAddresses(data);
    setIsLoadingAddresses(false);
  };

  const loadOrdersData = async () => {
    if (!token) return;
    setIsLoadingOrders(true);
    const data = await fetchCustomerOrders(token);
    setOrders(data);
    setIsLoadingOrders(false);
  };

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setToastMessage({ text: 'Session expired. Please sign in again.', type: 'error' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateCustomerProfile(token, {
        firstName: profile.firstName?.trim() || undefined,
        lastName: profile.lastName?.trim() || undefined,
        phone: profile.phone?.trim() || null,
      });

      if (updated) {
        setProfile(updated);
        setToastMessage({ text: 'Profile updated successfully.', type: 'success' });
      } else {
        setToastMessage({ text: 'Failed to update profile.', type: 'error' });
      }
    } catch {
      setToastMessage({ text: 'Error updating profile.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open Address Modal for New or Edit
  const handleOpenAddressModal = (addr?: CustomerAddress) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setAddressFormData({
        firstName: addr.firstName,
        lastName: addr.lastName,
        phone: addr.phone,
        email: addr.email,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || '',
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country || 'IN',
        isDefault: addr.isDefault,
      });
    } else {
      setEditingAddressId(null);
      setAddressFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'IN',
        isDefault: addresses.length === 0,
      });
    }
    setIsAddressModalOpen(true);
  };

  // Save Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate 6-digit Indian PIN
    if (!/^\d{6}$/.test(addressFormData.postalCode.trim())) {
      setToastMessage({ text: 'PIN code must be exactly 6 digits.', type: 'error' });
      return;
    }

    setIsSavingAddress(true);

    try {
      if (editingAddressId) {
        const updated = await updateCustomerAddress(token, editingAddressId, addressFormData);
        if (updated) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddressId ? updated : a.isDefault && updated.isDefault ? { ...a, isDefault: false } : a))
          );
          setToastMessage({ text: 'Address updated successfully.', type: 'success' });
          setIsAddressModalOpen(false);
        } else {
          setToastMessage({ text: 'Failed to update address.', type: 'error' });
        }
      } else {
        const created = await createCustomerAddress(token, addressFormData);
        if (created) {
          setAddresses((prev) => (created.isDefault ? [created, ...prev.map((a) => ({ ...a, isDefault: false }))] : [...prev, created]));
          setToastMessage({ text: 'Address saved successfully.', type: 'success' });
          setIsAddressModalOpen(false);
        } else {
          setToastMessage({ text: 'Failed to save address.', type: 'error' });
        }
      }
    } catch {
      setToastMessage({ text: 'Error saving address.', type: 'error' });
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const ok = await deleteCustomerAddress(token, addressId);
      if (ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
        setToastMessage({ text: 'Address deleted.', type: 'success' });
      } else {
        setToastMessage({ text: 'Failed to delete address.', type: 'error' });
      }
    } catch {
      setToastMessage({ text: 'Error deleting address.', type: 'error' });
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!token) return;
    try {
      const updated = await setDefaultCustomerAddress(token, addressId);
      if (updated) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === addressId,
          }))
        );
        setToastMessage({ text: 'Default delivery address updated.', type: 'success' });
      }
    } catch {
      setToastMessage({ text: 'Failed to update default address.', type: 'error' });
    }
  };

  const displayName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile.firstName || user.email || 'Customer';

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <div className="min-h-screen bg-background px-lg py-section-mobile lg:px-xxl lg:py-section-desktop text-on-surface">
      <div className="mx-auto max-w-6xl flex flex-col gap-lg">
        {/* Header Greeting */}
        <div className="border-b border-border pb-md flex flex-col sm:flex-row sm:items-baseline justify-between gap-sm">
          <div>
            <span className="font-label-sm text-xs uppercase tracking-widest text-primary block mb-1">
              Bloomncharms Atelier
            </span>
            <h1 className="font-headline-lg text-3xl uppercase tracking-wider text-on-surface">
              Welcome back, {profile.firstName || 'there'}
            </h1>
            <p className="font-body-md text-xs text-on-surface-muted mt-1">
              Manage your personal details, delivery addresses, and private order history.
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="self-start sm:self-auto px-4 py-2 border border-border rounded text-xs font-label-sm uppercase tracking-wider text-on-surface-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Toast Notification */}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border">
          {[
            { id: 'profile', label: 'My Profile', icon: 'person' },
            { id: 'addresses', label: `Saved Addresses (${addresses.length})`, icon: 'location_on' },
            { id: 'orders', label: `Orders (${orders.length})`, icon: 'receipt_long' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 px-4 text-xs font-label-sm uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-muted hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
            {/* Left: Edit Form */}
            <form
              onSubmit={handleSaveProfile}
              className="lg:col-span-8 border border-border rounded bg-surface p-lg lg:p-xl flex flex-col gap-md shadow-sm"
            >
              <h2 className="font-headline-sm text-lg uppercase tracking-wide text-on-surface border-b border-border pb-sm">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName || ''}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    placeholder="First Name"
                    className="w-full px-3 py-2 text-xs bg-surface-container-low border border-border rounded focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName || ''}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 text-xs bg-surface-container-low border border-border rounded focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Email Address (Authenticated)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email || user.email || ''}
                    className="w-full px-3 py-2 text-xs bg-surface-container border border-border/50 rounded text-on-surface-muted cursor-not-allowed"
                  />
                  <span className="text-[10px] text-on-surface-muted mt-0.5 block">
                    Account email is managed securely via authentication.
                  </span>
                </div>

                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-xs bg-surface-container-low border border-border rounded focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-sm border-t border-border mt-sm">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded text-xs font-label-sm uppercase tracking-wider hover:bg-primary-container disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Right: Account Summary */}
            <div className="lg:col-span-4 border border-border rounded bg-surface p-lg flex flex-col gap-md">
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-primary font-bold">
                Account Status
              </span>
              <div className="flex flex-col gap-sm text-xs font-body-md">
                <div>
                  <span className="text-on-surface-muted block text-[10px] uppercase font-label-sm">Primary Name</span>
                  <strong className="text-on-surface">{displayName}</strong>
                </div>
                <div>
                  <span className="text-on-surface-muted block text-[10px] uppercase font-label-sm">Account Type</span>
                  <span className="uppercase font-label-sm font-semibold text-secondary">{profile.role}</span>
                </div>
                {memberSince && (
                  <div>
                    <span className="text-on-surface-muted block text-[10px] uppercase font-label-sm">Member Since</span>
                    <span className="text-on-surface">{memberSince}</span>
                  </div>
                )}
              </div>

              <div className="pt-md border-t border-border">
                <Link
                  href="/shop"
                  className="font-label-sm text-xs uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                >
                  <span>Explore Atelier Shop</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <p className="font-body-md text-xs text-on-surface-muted">
                Save and manage multiple shipping addresses for rapid checkout.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddressModal()}
                className="px-4 py-2 bg-primary text-on-primary rounded text-xs font-label-sm uppercase tracking-wider hover:bg-primary-container transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Address
              </button>
            </div>

            {isLoadingAddresses ? (
              <div className="p-12 text-center text-xs text-on-surface-muted">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="border border-dashed border-border rounded p-12 text-center flex flex-col items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-muted text-[36px]">home_pin</span>
                <h3 className="font-headline-sm text-base uppercase text-on-surface">No Saved Addresses</h3>
                <p className="font-body-md text-xs text-on-surface-muted max-w-sm">
                  You haven&apos;t added any delivery addresses yet. Add an address to speed up your checkout.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal()}
                  className="mt-sm px-4 py-2 border border-primary text-primary rounded text-xs font-label-sm uppercase tracking-wider hover:bg-primary/10 transition-colors"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`border rounded p-md flex flex-col justify-between gap-md relative bg-surface ${
                      addr.isDefault ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col gap-xs text-xs font-body-md">
                      <div className="flex justify-between items-start gap-2">
                        <strong className="font-semibold text-on-surface text-sm">
                          {addr.firstName} {addr.lastName}
                        </strong>
                        {addr.isDefault && (
                          <span className="font-label-sm text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-on-primary font-bold shrink-0">
                            Default
                          </span>
                        )}
                      </div>

                      <span className="text-on-surface-muted">{addr.phone}</span>
                      <span className="text-on-surface-muted">{addr.email}</span>

                      <div className="pt-2 text-on-surface leading-relaxed">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        <br />
                        {addr.city}, {addr.state} — {addr.postalCode}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-sm text-xs font-label-sm uppercase tracking-wider">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-secondary hover:underline cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenAddressModal(addr)}
                          className="text-on-surface hover:text-primary underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-red-600 hover:text-red-800 underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-md">
            <p className="font-body-md text-xs text-on-surface-muted">
              Authoritative record of your bespoke purchases and current fulfillment status.
            </p>

            {isLoadingOrders ? (
              <div className="p-12 text-center text-xs text-on-surface-muted">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="border border-dashed border-border rounded p-12 text-center flex flex-col items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-muted text-[36px]">receipt_long</span>
                <h3 className="font-headline-sm text-base uppercase text-on-surface">No Orders Found</h3>
                <p className="font-body-md text-xs text-on-surface-muted max-w-sm">
                  You haven&apos;t placed any orders yet. Discover our handmade bouquets and floral charms.
                </p>
                <Link
                  href="/shop"
                  className="mt-sm px-5 py-2.5 bg-primary text-on-primary rounded text-xs font-label-sm uppercase tracking-wider hover:bg-primary-container transition-colors"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-md">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="border border-border rounded bg-surface overflow-hidden shadow-sm transition-all"
                    >
                      {/* Order Header */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-md bg-surface-container-low cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-sm hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-xs uppercase text-primary block">
                              {order.orderNumber}
                            </span>
                            <span className="font-body-md text-[11px] text-on-surface-muted">
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-label-sm uppercase font-semibold ${
                              order.orderStatus === 'delivered'
                                ? 'bg-secondary/10 text-secondary border border-secondary/20'
                                : order.orderStatus === 'shipped'
                                ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                                : 'bg-surface-container text-on-surface border border-border'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                          <span className="font-headline-sm text-sm font-bold text-on-surface">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Order Expanded Details */}
                      {isExpanded && (
                        <div className="p-md lg:p-lg border-t border-border flex flex-col gap-md">
                          {/* Line Items */}
                          <div className="divide-y divide-border/60">
                            {order.items.map((item) => (
                              <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                                <div>
                                  <strong className="font-semibold text-on-surface block">{item.productName}</strong>
                                  <span className="font-label-sm text-[10px] text-on-surface-muted uppercase block">
                                    Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <span className="font-headline-sm text-sm text-on-surface font-medium">
                                  ₹{item.lineTotal.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Order Financials Breakdown */}
                          <div className="border-t border-border pt-sm flex flex-col gap-1 text-xs font-body-md">
                            <div className="flex justify-between text-on-surface-muted">
                              <span>Subtotal</span>
                              <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-secondary">
                                <span>Discount</span>
                                <span>−₹{order.discountAmount.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {order.shippingFee > 0 && (
                              <div className="flex justify-between text-on-surface-muted">
                                <span>Shipping Fee</span>
                                <span>₹{order.shippingFee.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-headline-sm text-sm text-on-surface pt-1 border-t border-border font-bold">
                              <span>Total Paid</span>
                              <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full rounded border border-border p-6 shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-headline-sm text-base uppercase tracking-wider text-on-surface font-semibold">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-on-surface-muted hover:text-on-surface text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="flex flex-col gap-3 font-body-md text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.firstName}
                    onChange={(e) => setAddressFormData({ ...addressFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.lastName}
                    onChange={(e) => setAddressFormData({ ...addressFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressFormData.phone}
                    onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={addressFormData.email}
                    onChange={(e) => setAddressFormData({ ...addressFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                  Street Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={addressFormData.addressLine1}
                  onChange={(e) => setAddressFormData({ ...addressFormData, addressLine1: e.target.value })}
                  placeholder="House / Flat / Building / Street"
                  className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                  Apartment / Suite / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressFormData.addressLine2}
                  onChange={(e) => setAddressFormData({ ...addressFormData, addressLine2: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.state}
                    onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm uppercase text-[10px] text-on-surface-muted mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressFormData.postalCode}
                    onChange={(e) => setAddressFormData({ ...addressFormData, postalCode: e.target.value })}
                    placeholder="6 digits"
                    className="w-full px-3 py-2 bg-surface-container-low border border-border rounded font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultAddr"
                  checked={addressFormData.isDefault}
                  onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isDefaultAddr" className="font-label-sm uppercase text-xs cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border border-border rounded font-label-sm uppercase tracking-wider text-on-surface-muted hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 bg-primary text-on-primary rounded font-label-sm uppercase tracking-wider hover:bg-primary-container disabled:opacity-50"
                >
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
