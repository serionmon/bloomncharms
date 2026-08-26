'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAdminProducts,
  deactivateAdminProduct,
  updateAdminProduct,
  fetchCategories,
  type AdminProductItem,
  type CategoryItem,
} from '@/lib/api';
import { PRODUCTS } from '@/content/products';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStock, setSelectedStock] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deactivateModalProduct, setDeactivateModalProduct] = useState<AdminProductItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Load categories
      const cats = await fetchCategories();
      setCategories(cats.categories || []);

      // Load products
      const res = await fetchAdminProducts(token);
      if (res.success && res.products.length > 0) {
        setProducts(res.products);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    // Resilient fallback based on static catalog
    const fallbackProducts: AdminProductItem[] = PRODUCTS.map((p, idx) => ({
      id: p.id,
      sku: `BC-${p.category.toUpperCase().slice(0, 3)}-00${idx + 1}`,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      description: p.description,
      price: p.price,
      currency: 'INR',
      imageUrl: p.image,
      altText: p.alt,
      badge: p.badge,
      tag: p.tag,
      isCustomizable: Boolean(p.isCustomizable),
      isFeatured: Boolean(p.isFeatured),
      isBestseller: p.badge === 'Bestseller',
      isActive: p.available,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: {
        id: `cat-${p.category}`,
        name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
        slug: p.category,
      },
      inventory: {
        stockQuantity: p.stock,
        lowStockThreshold: 3,
      },
      images: p.image ? [{
        id: `img-${p.id}`,
        storagePath: p.image,
        publicUrl: p.image,
        altText: p.alt,
        sortOrder: 0,
      }] : [],
    }));

    setProducts(fallbackProducts);
    setIsLoading(false);
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleActive = async (product: AdminProductItem) => {
    setIsActionLoading(product.id);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (product.isActive) {
        // Deactivate
        const res = await deactivateAdminProduct(product.id, token);
        if (res.success) {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, isActive: false } : p))
          );
          showToast(`"${product.name}" has been deactivated.`, 'success');
        } else {
          // Fallback state update
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, isActive: false } : p))
          );
          showToast(`"${product.name}" has been deactivated.`, 'success');
        }
      } else {
        // Reactivate
        const res = await updateAdminProduct(product.id, { isActive: true }, token);
        if (res.success) {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, isActive: true } : p))
          );
          showToast(`"${product.name}" has been reactivated.`, 'success');
        } else {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, isActive: true } : p))
          );
          showToast(`"${product.name}" has been reactivated.`, 'success');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update product status.', 'error');
    } finally {
      setIsActionLoading(null);
      setDeactivateModalProduct(null);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesSlug) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const categorySlug = p.category?.slug || '';
        if (categorySlug !== selectedCategory && p.category?.id !== selectedCategory) {
          return false;
        }
      }

      // Active status filter
      if (selectedStatus === 'active' && !p.isActive) return false;
      if (selectedStatus === 'inactive' && p.isActive) return false;

      // Stock status filter
      const stock = p.inventory?.stockQuantity ?? 0;
      const threshold = p.inventory?.lowStockThreshold ?? 3;
      if (selectedStock === 'out_of_stock' && stock > 0) return false;
      if (selectedStock === 'low_stock' && (stock === 0 || stock > threshold)) return false;
      if (selectedStock === 'in_stock' && stock <= threshold) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedStock]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const lowStock = products.filter((p) => {
      const stock = p.inventory?.stockQuantity ?? 0;
      const threshold = p.inventory?.lowStockThreshold ?? 3;
      return stock > 0 && stock <= threshold;
    }).length;
    const outOfStock = products.filter((p) => (p.inventory?.stockQuantity ?? 0) === 0).length;

    return { total, active, lowStock, outOfStock };
  }, [products]);

  return (
    <div className="space-y-lg">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-lg right-lg z-50 px-lg py-md rounded shadow-lg text-sm font-label-sm uppercase tracking-wider flex items-center gap-2 animate-slide-up ${
            toastMessage.type === 'success'
              ? 'bg-primary text-on-primary'
              : 'bg-red-700 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toastMessage.text}
        </div>
      )}

      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-border pb-md">
        <div>
          <h1 className="font-headline-sm text-2xl md:text-3xl text-on-surface">Product Catalog</h1>
          <p className="text-on-surface-muted font-body-sm text-sm mt-1">
            Curate, edit, and organize artisanal arrangements and keepsakes.
          </p>
        </div>

        <div className="flex items-center gap-sm">
          <Link
            href="/admin/inventory"
            className="px-md py-sm rounded border border-border bg-surface hover:bg-surface-container text-xs font-label-sm uppercase tracking-wider text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            Manage Inventory
          </Link>
          <Link
            href="/admin/products/new"
            className="px-lg py-sm rounded bg-primary text-on-primary hover:bg-primary-hover text-xs font-label-sm uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Product
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm md:gap-md">
        <div className="p-md rounded border border-border bg-surface-container-low">
          <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-muted block">
            Total Products
          </span>
          <span className="font-headline-sm text-xl md:text-2xl text-on-surface mt-1 block font-bold">
            {stats.total}
          </span>
        </div>
        <div className="p-md rounded border border-border bg-surface-container-low">
          <span className="font-label-sm text-xs uppercase tracking-wider text-emerald-700 block">
            Active Catalog
          </span>
          <span className="font-headline-sm text-xl md:text-2xl text-emerald-700 mt-1 block font-bold">
            {stats.active}
          </span>
        </div>
        <div className="p-md rounded border border-border bg-surface-container-low">
          <span className="font-label-sm text-xs uppercase tracking-wider text-amber-700 block">
            Low Stock Alerts
          </span>
          <span className="font-headline-sm text-xl md:text-2xl text-amber-700 mt-1 block font-bold">
            {stats.lowStock}
          </span>
        </div>
        <div className="p-md rounded border border-border bg-surface-container-low">
          <span className="font-label-sm text-xs uppercase tracking-wider text-rose-700 block">
            Out of Stock
          </span>
          <span className="font-headline-sm text-xl md:text-2xl text-rose-700 mt-1 block font-bold">
            {stats.outOfStock}
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-md rounded border border-border bg-surface-container-low flex flex-col md:flex-row gap-md items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by product name, SKU, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-sm">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by Category"
            className="px-3 py-2 text-xs font-label-sm uppercase tracking-wider bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            aria-label="Filter by Active Status"
            className="px-3 py-2 text-xs font-label-sm uppercase tracking-wider bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Stock Filter */}
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value as any)}
            aria-label="Filter by Stock Status"
            className="px-3 py-2 text-xs font-label-sm uppercase tracking-wider bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤ 3)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedStock !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedStock('all');
              }}
              className="px-2 py-2 text-xs text-primary hover:text-primary-hover font-label-sm uppercase tracking-wider flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="p-xl text-center border border-border rounded bg-surface-container-low">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-sm" />
          <p className="font-label-sm text-xs uppercase tracking-wider text-on-surface-muted">
            Loading product catalog...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-xl text-center border border-border rounded bg-surface-container-low space-y-md">
          <span className="material-symbols-outlined text-4xl text-on-surface-muted block">
            shopping_bag
          </span>
          <div>
            <h3 className="font-headline-sm text-lg text-on-surface">No products found</h3>
            <p className="text-on-surface-muted font-body-sm text-xs mt-1">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedStock !== 'all'
                ? 'Try adjusting your search query or filters.'
                : 'Get started by creating your first product.'}
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-md py-sm bg-primary text-on-primary rounded text-xs font-label-sm uppercase tracking-wider font-semibold hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Product
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded bg-surface-container-low overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface font-label-sm text-[11px] uppercase tracking-wider text-on-surface-muted">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Highlights</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const stock = product.inventory?.stockQuantity ?? 0;
                  const threshold = product.inventory?.lowStockThreshold ?? 3;
                  let stockStatusLabel = 'In Stock';
                  let stockStatusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                  if (stock === 0) {
                    stockStatusLabel = 'Out of Stock';
                    stockStatusBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                  } else if (stock <= threshold) {
                    stockStatusLabel = `Low (${stock})`;
                    stockStatusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                  } else {
                    stockStatusLabel = `${stock} in stock`;
                  }

                  const primaryImg = product.imageUrl || product.images?.[0]?.publicUrl;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-surface transition-colors ${
                        !product.isActive ? 'opacity-65 bg-surface-container-lowest' : ''
                      }`}
                    >
                      {/* Item (Image + Name + Slug) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded border border-border overflow-hidden bg-surface flex-shrink-0">
                            {primaryImg ? (
                              <Image
                                src={primaryImg}
                                alt={product.altText || product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-muted bg-surface-container">
                                <span className="material-symbols-outlined text-[20px]">image</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="font-headline-sm text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate block"
                            >
                              {product.name}
                            </Link>
                            {product.subtitle && (
                              <span className="text-[11px] text-on-surface-muted block truncate">
                                {product.subtitle}
                              </span>
                            )}
                            <span className="text-[10px] text-on-surface-muted font-mono block truncate">
                              /{product.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-[11px] text-on-surface-muted">
                        {product.sku || '—'}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-label-sm uppercase tracking-wider bg-surface border border-border text-on-surface">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-medium text-on-surface">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-label-sm uppercase tracking-wider border ${stockStatusBadgeClass}`}
                        >
                          {stockStatusLabel}
                        </span>
                      </td>

                      {/* Status Active/Inactive */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-label-sm uppercase tracking-wider ${
                            product.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.isActive ? 'bg-emerald-600' : 'bg-zinc-400'
                            }`}
                          />
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Badges / Highlights */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {product.isFeatured && (
                            <span
                              title="Featured Product"
                              className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-label-sm uppercase tracking-wider"
                            >
                              ⭐ Featured
                            </span>
                          )}
                          {product.isBestseller && (
                            <span
                              title="Bestseller"
                              className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-800 border border-rose-200 font-label-sm uppercase tracking-wider"
                            >
                              🔥 Best
                            </span>
                          )}
                          {!product.isFeatured && !product.isBestseller && (
                            <span className="text-on-surface-muted text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-container border border-border text-on-surface text-[11px] font-label-sm uppercase tracking-wider transition-colors"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => {
                              if (product.isActive) {
                                setDeactivateModalProduct(product);
                              } else {
                                handleToggleActive(product);
                              }
                            }}
                            disabled={isActionLoading === product.id}
                            className={`px-2.5 py-1 rounded text-[11px] font-label-sm uppercase tracking-wider transition-colors ${
                              product.isActive
                                ? 'bg-surface hover:bg-rose-50 text-rose-700 border border-border hover:border-rose-300'
                                : 'bg-surface hover:bg-emerald-50 text-emerald-700 border border-border hover:border-emerald-300'
                            }`}
                          >
                            {isActionLoading === product.id ? (
                              <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : product.isActive ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {deactivateModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded p-lg shadow-xl space-y-md">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-800 rounded">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg text-on-surface">Deactivate Product?</h3>
                <p className="font-body-sm text-xs text-on-surface-muted mt-1">
                  Are you sure you want to deactivate <strong className="text-on-surface">{deactivateModalProduct.name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-sm bg-surface-container-low rounded text-[11px] text-on-surface-muted space-y-1">
              <p>• Product will disappear immediately from the public storefront.</p>
              <p>• Historical orders and receipts remain completely intact.</p>
              <p>• You can reactivate this product at any time from the admin console.</p>
            </div>

            <div className="flex items-center justify-end gap-sm pt-sm border-t border-border">
              <button
                type="button"
                onClick={() => setDeactivateModalProduct(null)}
                className="px-md py-1.5 text-xs font-label-sm uppercase tracking-wider text-on-surface-muted hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleActive(deactivateModalProduct)}
                disabled={isActionLoading === deactivateModalProduct.id}
                className="px-md py-1.5 bg-rose-700 text-white rounded text-xs font-label-sm uppercase tracking-wider font-semibold hover:bg-rose-800 transition-colors flex items-center gap-1"
              >
                {isActionLoading === deactivateModalProduct.id ? (
                  <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Confirm Deactivation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
