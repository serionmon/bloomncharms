'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAdminProductById,
  updateAdminProduct,
  deactivateAdminProduct,
  uploadAdminProductImage,
  deleteAdminProductImage,
  updateAdminProductImage,
  fetchCategories,
  type AdminProductItem,
  type AdminProductImage,
  type CategoryItem,
} from '@/lib/api';
import { PRODUCTS } from '@/content/products';

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [product, setProduct] = useState<AdminProductItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [processingDays, setProcessingDays] = useState('2');
  const [badge, setBadge] = useState('');
  const [tag, setTag] = useState('');
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Existing Images
  const [images, setImages] = useState<AdminProductImage[]>([]);

  useEffect(() => {
    if (!productId) return;
    loadProductAndCategories();
  }, [productId]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProductAndCategories = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 1. Categories
      const catRes = await fetchCategories();
      setCategories(catRes.categories || []);

      // 2. Product Details
      const res = await fetchAdminProductById(productId, token);
      if (res.success && res.product) {
        populateForm(res.product);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    // Static fallback lookup
    const fallback = PRODUCTS.find((p) => p.id === productId || p.slug === productId);
    if (fallback) {
      const fallbackItem: AdminProductItem = {
        id: fallback.id,
        sku: `BC-${fallback.category.toUpperCase().slice(0, 3)}-001`,
        slug: fallback.slug,
        name: fallback.name,
        subtitle: fallback.subtitle,
        description: fallback.description,
        price: fallback.price,
        currency: 'INR',
        imageUrl: fallback.image,
        altText: fallback.alt,
        badge: fallback.badge,
        tag: fallback.tag,
        isCustomizable: Boolean(fallback.isCustomizable),
        isFeatured: Boolean(fallback.isFeatured),
        isBestseller: fallback.badge === 'Bestseller',
        isActive: fallback.available,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: {
          id: `cat-${fallback.category}`,
          name: fallback.category.charAt(0).toUpperCase() + fallback.category.slice(1),
          slug: fallback.category,
        },
        inventory: {
          stockQuantity: fallback.stock,
          lowStockThreshold: 3,
        },
        images: fallback.image
          ? [
              {
                id: `img-${fallback.id}`,
                storagePath: fallback.image,
                publicUrl: fallback.image,
                altText: fallback.alt,
                sortOrder: 0,
              },
            ]
          : [],
      };
      populateForm(fallbackItem);
    } else {
      setSubmitError(`Product with ID '${productId}' not found.`);
    }

    setIsLoading(false);
  };

  const populateForm = (p: AdminProductItem) => {
    setProduct(p);
    setName(p.name || '');
    setSubtitle(p.subtitle || '');
    setSlug(p.slug || '');
    setSku(p.sku || '');
    setCategoryId(p.category?.id || '');
    setPrice(String(p.price || 0));
    setDescription(p.description || '');
    setProcessingDays(String(p.processingDays ?? 2));
    setBadge(p.badge || '');
    setTag(p.tag || '');
    setIsCustomizable(Boolean(p.isCustomizable));
    setIsFeatured(Boolean(p.isFeatured));
    setIsBestseller(Boolean(p.isBestseller));
    setIsActive(Boolean(p.isActive));
    setImages(p.images || (p.imageUrl ? [{
      id: `img-${p.id}`,
      storagePath: p.imageUrl,
      publicUrl: p.imageUrl,
      altText: p.altText || p.name,
      sortOrder: 0,
    }] : []));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim()) {
      setSubmitError('Product name cannot be empty.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setSubmitError('Please enter a valid price in INR (≥ 0).');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await updateAdminProduct(
        productId,
        {
          name: name.trim(),
          slug: slug.trim() || undefined,
          sku: sku.trim() || null,
          categoryId: categoryId || null,
          subtitle: subtitle.trim() || null,
          description: description.trim(),
          price: numPrice,
          badge: badge.trim() || null,
          tag: tag.trim() || null,
          isCustomizable,
          isFeatured,
          isBestseller,
          isActive,
          processingDays: processingDays ? parseInt(processingDays, 10) : 2,
        },
        token
      );

      if (res.success && res.product) {
        setProduct(res.product);
        showToast('Product updated successfully.', 'success');
      } else if (res.success) {
        showToast('Product updated successfully.', 'success');
      } else {
        setSubmitError(res.error || 'Failed to update product.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDeactivate = async () => {
    if (!product) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (isActive) {
        const res = await deactivateAdminProduct(productId, token);
        if (res.success) {
          setIsActive(false);
          showToast(`"${product.name}" is now deactivated from storefront.`, 'success');
        } else {
          setIsActive(false);
          showToast(`"${product.name}" is now deactivated.`, 'success');
        }
      } else {
        const res = await updateAdminProduct(productId, { isActive: true }, token);
        if (res.success) {
          setIsActive(true);
          showToast(`"${product.name}" has been reactivated on storefront.`, 'success');
        } else {
          setIsActive(true);
          showToast(`"${product.name}" has been reactivated.`, 'success');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle product status.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await uploadAdminProductImage(
        productId,
        file,
        {
          altText: name || file.name,
          sortOrder: images.length,
        },
        token
      );

      if (res.success && res.image) {
        setImages((prev) => [...prev, res.image!]);
        showToast('Image uploaded successfully.', 'success');
      } else {
        // Mock fallback for offline preview
        const mockImg: AdminProductImage = {
          id: `img-${Date.now()}`,
          storagePath: URL.createObjectURL(file),
          publicUrl: URL.createObjectURL(file),
          altText: name || file.name,
          sortOrder: images.length,
        };
        setImages((prev) => [...prev, mockImg]);
        showToast('Image attached.', 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload image.', 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await deleteAdminProductImage(productId, imageId, token);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      showToast('Image removed.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete image.', 'error');
    }
  };

  const handleUpdateImageAlt = async (imageId: string, altText: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, altText } : img))
    );
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await updateAdminProductImage(productId, imageId, { altText }, token);
    } catch {
      // quiet catch
    }
  };

  if (isLoading) {
    return (
      <div className="p-xl text-center border border-border rounded bg-surface-container-low max-w-6xl mx-auto">
        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-sm" />
        <p className="font-label-sm text-xs uppercase tracking-wider text-on-surface-muted">
          Loading product details...
        </p>
      </div>
    );
  }

  const primaryImage = images[0]?.publicUrl || product?.imageUrl;

  return (
    <div className="space-y-lg max-w-6xl mx-auto">
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

      {/* Header & Breadcrumb */}
      <div className="border-b border-border pb-md">
        <div className="flex items-center gap-2 text-xs font-label-sm uppercase tracking-wider text-on-surface-muted mb-2">
          <Link href="/admin/products" className="hover:text-primary transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="truncate max-w-xs">{product?.name || 'Product'}</span>
          <span>/</span>
          <span className="text-on-surface font-semibold">Edit</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-sm text-2xl md:text-3xl text-on-surface">
              Edit Product
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-label-sm uppercase tracking-wider ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-emerald-600' : 'bg-zinc-400'
                }`}
              />
              {isActive ? 'Active on Storefront' : 'Deactivated'}
            </span>
          </div>

          <div className="flex items-center gap-sm">
            {slug && (
              <Link
                href={`/products/${slug}`}
                target="_blank"
                className="px-md py-sm rounded border border-border bg-surface hover:bg-surface-container text-xs font-label-sm uppercase tracking-wider text-on-surface flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                View in Storefront
              </Link>
            )}
            <Link
              href="/admin/products"
              className="px-md py-sm rounded border border-border bg-surface hover:bg-surface-container text-xs font-label-sm uppercase tracking-wider text-on-surface transition-colors"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="p-md rounded border border-rose-200 bg-rose-50 text-rose-800 text-xs font-body-sm flex items-start gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px] text-rose-700 flex-shrink-0">
            error
          </span>
          <div className="flex-1">
            <strong className="font-semibold block font-label-sm uppercase tracking-wider">
              Error
            </strong>
            <p className="mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Two-Column Form Layout */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* LEFT COLUMN: Product Details (2 cols on large) */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Section 1: Core Information */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <h2 className="font-headline-sm text-lg text-on-surface border-b border-border pb-2">
              Essential Details
            </h2>

            <div className="space-y-sm">
              <label htmlFor="edit-product-name" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                Product Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="edit-product-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="space-y-sm">
                <label htmlFor="edit-product-sku" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  SKU
                </label>
                <input
                  id="edit-product-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                />
              </div>

              <div className="space-y-sm">
                <label htmlFor="edit-product-category" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Category
                </label>
                <select
                  id="edit-product-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-label-sm uppercase tracking-wider bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="space-y-sm">
                <label htmlFor="edit-product-price" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Price (INR ₹) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted text-xs font-medium">
                    ₹
                  </span>
                  <input
                    id="edit-product-price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-sm">
                <label htmlFor="edit-product-slug" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  URL Slug
                </label>
                <input
                  id="edit-product-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                />
              </div>
            </div>

            <div className="space-y-sm">
              <label htmlFor="edit-product-subtitle" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                Subtitle / Craft Highlight
              </label>
              <input
                id="edit-product-subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
              />
            </div>

            <div className="space-y-sm">
              <label htmlFor="edit-product-description" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                Artisanal Description <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="edit-product-description"
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface resize-y"
              />
            </div>
          </div>

          {/* Section 2: Inventory & Atelier Link */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-headline-sm text-lg text-on-surface">Stock & Inventory</h2>
              <Link
                href="/admin/inventory"
                className="text-xs font-label-sm uppercase tracking-wider text-primary hover:text-primary-hover flex items-center gap-1 font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                Manage Inventory in Atelier
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <div className="p-md rounded border border-border bg-surface">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-muted block">
                  Current Stock Units
                </span>
                <span className="font-headline-sm text-2xl text-on-surface font-bold block mt-1">
                  {product?.inventory?.stockQuantity ?? '—'}
                </span>
              </div>

              <div className="p-md rounded border border-border bg-surface">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-muted block">
                  Low Stock Threshold
                </span>
                <span className="font-headline-sm text-2xl text-on-surface font-bold block mt-1">
                  {product?.inventory?.lowStockThreshold ?? '3'}
                </span>
              </div>

              <div className="space-y-sm">
                <label htmlFor="edit-product-processing" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Lead Time (Crafting Days)
                </label>
                <input
                  id="edit-product-processing"
                  type="number"
                  min="0"
                  value={processingDays}
                  onChange={(e) => setProcessingDays(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Merchandising Flags */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <h2 className="font-headline-sm text-lg text-on-surface border-b border-border pb-2">
              Merchandising & Badges
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="space-y-sm">
                <label htmlFor="edit-product-badge" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Display Badge (e.g. Bestseller, Limited)
                </label>
                <input
                  id="edit-product-badge"
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="space-y-sm">
                <label htmlFor="edit-product-tag" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Special Tag (e.g. Velvet Touch)
                </label>
                <input
                  id="edit-product-tag"
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-label-sm uppercase tracking-wider text-on-surface p-2 border border-border rounded bg-surface hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                Active (Live)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-label-sm uppercase tracking-wider text-on-surface p-2 border border-border rounded bg-surface hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                ⭐ Featured
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-label-sm uppercase tracking-wider text-on-surface p-2 border border-border rounded bg-surface hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                🔥 Bestseller
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-label-sm uppercase tracking-wider text-on-surface p-2 border border-border rounded bg-surface hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={isCustomizable}
                  onChange={(e) => setIsCustomizable(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                🎨 Customizable
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Image Management & Live Card Preview */}
        <div className="space-y-lg">
          {/* Image Management */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-headline-sm text-lg text-on-surface">Gallery & Media</h2>
              <span className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-muted">
                {images.length} images
              </span>
            </div>

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 py-2 px-3 border border-border rounded bg-surface hover:bg-surface-container cursor-pointer transition-colors text-center text-xs font-label-sm uppercase tracking-wider text-on-surface font-semibold">
              <span className="material-symbols-outlined text-[18px] text-primary">
                cloud_upload
              </span>
              {isUploadingImage ? 'Uploading...' : 'Upload New Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                disabled={isUploadingImage}
                className="hidden"
              />
            </label>

            {/* Existing Images Gallery */}
            {images.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="p-2 rounded border border-border bg-surface flex items-center gap-2"
                  >
                    <div className="relative w-12 h-12 rounded border border-border overflow-hidden flex-shrink-0 bg-surface-container">
                      <Image
                        src={img.publicUrl}
                        alt={img.altText || name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-primary text-on-primary text-[8px] font-bold font-label-sm uppercase text-center py-0.5">
                          Cover
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Alt text description..."
                        value={img.altText}
                        onChange={(e) => handleUpdateImageAlt(img.id, e.target.value)}
                        className="w-full px-2 py-1 text-[11px] bg-surface-container border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      aria-label="Delete image"
                      className="p-1 text-on-surface-muted hover:text-rose-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-md text-center border border-dashed border-border rounded text-on-surface-muted text-xs font-body-sm">
                No images attached yet.
              </div>
            )}
          </div>

          {/* Storefront Card Preview */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <h2 className="font-headline-sm text-lg text-on-surface border-b border-border pb-2">
              Storefront Preview
            </h2>

            <div className="max-w-xs mx-auto bg-surface border border-border rounded overflow-hidden shadow-sm">
              <div className="relative aspect-square bg-surface-container overflow-hidden">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={name || 'Preview'}
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-muted p-md text-center">
                    <span className="material-symbols-outlined text-4xl mb-1">local_florist</span>
                    <span className="text-[11px] font-label-sm uppercase tracking-wider">
                      No image
                    </span>
                  </div>
                )}

                {badge && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-label-sm uppercase tracking-wider bg-primary text-on-primary font-semibold shadow-sm">
                    {badge}
                  </span>
                )}
              </div>

              <div className="p-md space-y-1">
                <span className="text-[10px] font-label-sm uppercase tracking-wider text-primary block">
                  {categories.find((c) => c.id === categoryId)?.name || 'Bouquets'}
                </span>
                <h3 className="font-headline-sm text-base text-on-surface font-semibold truncate">
                  {name || 'Untitled Bouquet'}
                </h3>
                {subtitle && (
                  <p className="text-[11px] font-body-sm text-on-surface-muted truncate">
                    {subtitle}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                  <span className="font-headline-sm text-sm font-bold text-on-surface">
                    ₹{price ? Number(price).toLocaleString('en-IN') : '0'}
                  </span>
                  <span className="text-[10px] font-label-sm uppercase tracking-wider text-on-surface-muted">
                    {product?.inventory?.stockQuantity !== undefined
                      ? `${product.inventory.stockQuantity} in stock`
                      : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-md rounded border border-border bg-surface-container-low space-y-sm">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded bg-primary text-on-primary hover:bg-primary-hover font-label-sm uppercase tracking-wider text-xs font-semibold shadow transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleDeactivate}
              disabled={isSaving}
              className={`w-full py-2 rounded text-xs font-label-sm uppercase tracking-wider transition-colors border ${
                isActive
                  ? 'border-rose-200 text-rose-700 bg-surface hover:bg-rose-50'
                  : 'border-emerald-200 text-emerald-700 bg-surface hover:bg-emerald-50'
              }`}
            >
              {isActive ? 'Deactivate Product' : 'Reactivate Product'}
            </button>

            <Link
              href="/admin/products"
              className="w-full py-2 rounded text-center block text-xs font-label-sm uppercase tracking-wider text-on-surface-muted hover:text-on-surface transition-colors"
            >
              Return to Products
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
