'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  createAdminProduct,
  uploadAdminProductImage,
  fetchCategories,
  type CategoryItem,
} from '@/lib/api';

interface StagedImage {
  file: File;
  previewUrl: string;
  altText: string;
  sortOrder: number;
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('3');
  const [processingDays, setProcessingDays] = useState('2');
  const [badge, setBadge] = useState('');
  const [tag, setTag] = useState('');
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Staged Images
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);

  useEffect(() => {
    async function loadCats() {
      setIsLoadingCategories(true);
      const res = await fetchCategories();
      const cats = res.categories || [];
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
      setIsLoadingCategories(false);
    }
    loadCats();
  }, []);

  // Auto-generate slug and suggested SKU from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isManualSlug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
    if (!sku) {
      const short = val.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
      setSku(`BC-${short || 'PRD'}-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);

    const staged: StagedImage[] = newFiles.map((file, idx) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      altText: name || file.name.replace(/\.[^/.]+$/, ''),
      sortOrder: stagedImages.length + idx,
    }));

    setStagedImages((prev) => [...prev, ...staged]);
    e.target.value = '';
  };

  const removeStagedImage = (index: number) => {
    setStagedImages((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateStagedAlt = (index: number, alt: string) => {
    setStagedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, altText: alt } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Basic Validation
    if (!name.trim()) {
      setSubmitError('Product name is required.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setSubmitError('Please enter a valid price in INR (≥ 0).');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 1. Create Product
      setUploadProgressText('Creating product record...');
      const createRes = await createAdminProduct(
        {
          name: name.trim(),
          slug: slug.trim() || undefined,
          sku: sku.trim() || undefined,
          categoryId: categoryId || null,
          subtitle: subtitle.trim() || undefined,
          description: description.trim(),
          price: numPrice,
          currency: 'INR',
          badge: badge.trim() || null,
          tag: tag.trim() || null,
          isCustomizable,
          isFeatured,
          isBestseller,
          isActive,
          processingDays: processingDays ? parseInt(processingDays, 10) : 2,
          stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : 3,
        },
        token
      );

      if (!createRes.success || !createRes.product) {
        setSubmitError(createRes.error || 'Failed to create product.');
        setIsSubmitting(false);
        setUploadProgressText(null);
        return;
      }

      const createdProduct = createRes.product;

      // 2. Upload Staged Images (if any)
      if (stagedImages.length > 0) {
        setUploadProgressText(`Uploading 0 / ${stagedImages.length} image(s)...`);

        for (let i = 0; i < stagedImages.length; i++) {
          const img = stagedImages[i];
          setUploadProgressText(`Uploading image ${i + 1} of ${stagedImages.length}...`);
          try {
            await uploadAdminProductImage(
              createdProduct.id,
              img.file,
              {
                altText: img.altText || name,
                sortOrder: i,
              },
              token
            );
          } catch (uploadErr) {
            console.warn('[Admin] Image upload warning:', uploadErr);
          }
        }
      }

      setUploadProgressText('Product created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/admin/products');
      }, 500);
    } catch (err: any) {
      setSubmitError(err?.message || 'An unexpected error occurred while saving product.');
      setIsSubmitting(false);
      setUploadProgressText(null);
    }
  };

  const primaryPreview = stagedImages[0]?.previewUrl;

  return (
    <div className="space-y-lg max-w-6xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="border-b border-border pb-md">
        <div className="flex items-center gap-2 text-xs font-label-sm uppercase tracking-wider text-on-surface-muted mb-2">
          <Link href="/admin/products" className="hover:text-primary transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">New Product</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          <div>
            <h1 className="font-headline-sm text-2xl md:text-3xl text-on-surface">Add New Product</h1>
            <p className="text-on-surface-muted font-body-sm text-xs mt-1">
              Create an artisanal arrangement, keepsake, or custom gift set.
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <Link
              href="/admin/products"
              className="px-md py-sm rounded border border-border bg-surface hover:bg-surface-container text-xs font-label-sm uppercase tracking-wider text-on-surface transition-colors"
            >
              Cancel
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
              Unable to Save Product
            </strong>
            <p className="mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Two-Column Form Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* LEFT COLUMN: Product Details (2 cols on large) */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Section 1: Core Information */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <h2 className="font-headline-sm text-lg text-on-surface border-b border-border pb-2">
              Essential Details
            </h2>

            <div className="space-y-sm">
              <label htmlFor="product-name" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                Product Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                required
                placeholder="e.g. Velvet Rose Symphony"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="space-y-sm">
                <label htmlFor="product-sku" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  SKU (Stock Keeping Unit) <span className="text-rose-600">*</span>
                </label>
                <input
                  id="product-sku"
                  type="text"
                  required
                  placeholder="e.g. BC-BOU-101"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                />
              </div>

              <div className="space-y-sm">
                <label htmlFor="product-category" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Category <span className="text-rose-600">*</span>
                </label>
                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isLoadingCategories}
                  className="w-full px-3 py-2 text-xs font-label-sm uppercase tracking-wider bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                >
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
                <label htmlFor="product-price" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Price (INR ₹) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted text-xs font-medium">
                    ₹
                  </span>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="1299"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-sm">
                <label htmlFor="product-slug" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  URL Slug
                </label>
                <input
                  id="product-slug"
                  type="text"
                  placeholder="velvet-rose-symphony"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsManualSlug(true);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                />
              </div>
            </div>

            <div className="space-y-sm">
              <label htmlFor="product-subtitle" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                Subtitle / Craft Highlight
              </label>
              <input
                id="product-subtitle"
                type="text"
                placeholder="e.g. Sculpted chenille stems with velvet wrap"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
              />
            </div>

            <div className="space-y-sm">
              <label htmlFor="product-description" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                Artisanal Description <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="product-description"
                rows={4}
                required
                placeholder="Describe the flowers, materials, floral meaning, and dimensions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface resize-y"
              />
            </div>
          </div>

          {/* Section 2: Inventory & Fulfillment */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <h2 className="font-headline-sm text-lg text-on-surface border-b border-border pb-2">
              Stock & Fulfillment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <div className="space-y-sm">
                <label htmlFor="product-stock" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Initial Stock Units <span className="text-rose-600">*</span>
                </label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="space-y-sm">
                <label htmlFor="product-low-stock" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Low Stock Threshold
                </label>
                <input
                  id="product-low-stock"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="space-y-sm">
                <label htmlFor="product-processing" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Crafting Days (Lead Time)
                </label>
                <input
                  id="product-processing"
                  type="number"
                  min="0"
                  value={processingDays}
                  onChange={(e) => setProcessingDays(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Badges & Merchandising Attributes */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <h2 className="font-headline-sm text-lg text-on-surface border-b border-border pb-2">
              Merchandising & Visibility
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="space-y-sm">
                <label htmlFor="product-badge" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Display Badge (e.g. Bestseller, Limited)
                </label>
                <input
                  id="product-badge"
                  type="text"
                  placeholder="e.g. Bestseller"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="space-y-sm">
                <label htmlFor="product-tag" className="block text-xs font-label-sm uppercase tracking-wider text-on-surface">
                  Special Tag (e.g. Velvet Touch)
                </label>
                <input
                  id="product-tag"
                  type="text"
                  placeholder="e.g. Velvet Touch"
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
          {/* Image Upload Dropzone */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-headline-sm text-lg text-on-surface">Product Images</h2>
              <span className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-muted">
                {stagedImages.length} attached
              </span>
            </div>

            {/* Dropzone button */}
            <label className="flex flex-col items-center justify-center p-md border-2 border-dashed border-border rounded bg-surface hover:bg-surface-container cursor-pointer transition-colors text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-primary">
                cloud_upload
              </span>
              <div>
                <span className="text-xs font-label-sm uppercase tracking-wider text-on-surface font-semibold block">
                  Click to Upload Images
                </span>
                <span className="text-[10px] text-on-surface-muted block mt-0.5">
                  PNG, JPG, or WEBP (Max 10MB each)
                </span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFiles}
                className="hidden"
              />
            </label>

            {/* Staged Image List */}
            {stagedImages.length > 0 && (
              <div className="space-y-sm">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-muted block">
                  Staged Gallery (First image is Cover)
                </span>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {stagedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded border border-border bg-surface flex items-center gap-2"
                    >
                      <div className="relative w-12 h-12 rounded border border-border overflow-hidden flex-shrink-0 bg-surface-container">
                        <Image
                          src={img.previewUrl}
                          alt={img.altText}
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
                          onChange={(e) => updateStagedAlt(idx, e.target.value)}
                          className="w-full px-2 py-1 text-[11px] bg-surface-container border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                        />
                        <span className="text-[9px] text-on-surface-muted font-mono block truncate mt-0.5">
                          {img.file.name} ({(img.file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStagedImage(idx)}
                        aria-label={`Remove image ${img.file.name}`}
                        className="p-1 text-on-surface-muted hover:text-rose-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Storefront Card Preview */}
          <div className="p-lg rounded border border-border bg-surface-container-low space-y-md">
            <h2 className="font-headline-sm text-lg text-on-surface border-b border-border pb-2">
              Storefront Preview
            </h2>

            <div className="max-w-xs mx-auto bg-surface border border-border rounded overflow-hidden shadow-sm">
              <div className="relative aspect-square bg-surface-container overflow-hidden">
                {primaryPreview ? (
                  <Image
                    src={primaryPreview}
                    alt={name || 'Preview'}
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-muted p-md text-center">
                    <span className="material-symbols-outlined text-4xl mb-1">local_florist</span>
                    <span className="text-[11px] font-label-sm uppercase tracking-wider">
                      No cover image
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
                    {stockQuantity ? `${stockQuantity} in stock` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-md rounded border border-border bg-surface-container-low space-y-sm">
            {uploadProgressText && (
              <p className="text-xs font-label-sm uppercase tracking-wider text-primary animate-pulse text-center">
                {uploadProgressText}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded bg-primary text-on-primary hover:bg-primary-hover font-label-sm uppercase tracking-wider text-xs font-semibold shadow transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Product...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Publish Product to Catalog
                </>
              )}
            </button>

            <Link
              href="/admin/products"
              className="w-full py-2 rounded text-center block text-xs font-label-sm uppercase tracking-wider text-on-surface-muted hover:text-on-surface transition-colors"
            >
              Discard & Return
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
