import { Product, PRODUCTS, getProductBySlug as getStaticProductBySlug } from '@/content/products';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ProductFilters {
  category?: string;
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest';
  featured?: boolean;
  customizable?: boolean;
  search?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

export interface FetchProductsResponse {
  products: Product[];
  total: number;
  fromFallback?: boolean;
}

export interface FetchProductResponse {
  product: Product | null;
  fromFallback?: boolean;
}

export interface FetchCategoriesResponse {
  categories: CategoryItem[];
  fromFallback?: boolean;
}

/**
 * Fetch product list from the Fastify Backend API with resilient fallback.
 */
export async function fetchProducts(filters: ProductFilters = {}): Promise<FetchProductsResponse> {
  const queryParams = new URLSearchParams();

  if (filters.category && filters.category !== 'all') {
    queryParams.set('category', filters.category);
  }
  if (filters.sort) {
    queryParams.set('sort', filters.sort);
  }
  if (filters.featured) {
    queryParams.set('featured', 'true');
  }
  if (filters.customizable) {
    queryParams.set('customizable', 'true');
  }
  if (filters.search) {
    queryParams.set('search', filters.search);
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/products${queryString ? `?${queryString}` : ''}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Short cache lifetime / dynamic fetch
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        return {
          products: data.products,
          total: data.total ?? data.products.length,
          fromFallback: false,
        };
      }
    }
  } catch (error) {
    console.warn('[API Client] Backend fetchProducts failed, using local catalog fallback:', error);
  }

  // Resilient fallback to static catalog
  let filtered = [...PRODUCTS];
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((p) => p.category === filters.category);
  }
  if (filters.featured) {
    filtered = filtered.filter((p) => p.isFeatured);
  }
  if (filters.customizable) {
    filtered = filtered.filter((p) => p.isCustomizable);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (filters.sort) {
    filtered.sort((a, b) => {
      if (filters.sort === 'price-asc') return a.price - b.price;
      if (filters.sort === 'price-desc') return b.price - a.price;
      if (filters.sort === 'featured') return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      return 0;
    });
  }

  return {
    products: filtered,
    total: filtered.length,
    fromFallback: true,
  };
}

/**
 * Fetch a single product by slug from the Fastify Backend API.
 */
export async function fetchProductBySlug(slug: string): Promise<FetchProductResponse> {
  const url = `${API_BASE_URL}/api/products/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.product) {
        return {
          product: data.product,
          fromFallback: false,
        };
      }
    } else if (res.status === 404) {
      return {
        product: null,
        fromFallback: false,
      };
    }
  } catch (error) {
    console.warn(`[API Client] Backend fetchProductBySlug('${slug}') failed, using local catalog fallback:`, error);
  }

  const staticProduct = getStaticProductBySlug(slug) || null;
  return {
    product: staticProduct,
    fromFallback: true,
  };
}

/**
 * Fetch categories from the Fastify Backend API.
 */
export async function fetchCategories(): Promise<FetchCategoriesResponse> {
  const url = `${API_BASE_URL}/api/categories`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.categories)) {
        return {
          categories: data.categories,
          fromFallback: false,
        };
      }
    }
  } catch (error) {
    console.warn('[API Client] Backend fetchCategories failed, using fallback:', error);
  }

  const defaultCategories: CategoryItem[] = [
    { id: 'bouquets', name: 'Bouquets', slug: 'bouquets', productCount: PRODUCTS.filter((p) => p.category === 'bouquets').length },
    { id: 'flowers', name: 'Flowers', slug: 'flowers', productCount: PRODUCTS.filter((p) => p.category === 'flowers').length },
    { id: 'keyrings', name: 'Keyrings', slug: 'keyrings', productCount: PRODUCTS.filter((p) => p.category === 'keyrings').length },
    { id: 'charms', name: 'Charms', slug: 'charms', productCount: PRODUCTS.filter((p) => p.category === 'charms').length },
    { id: 'gift-sets', name: 'Gift Sets', slug: 'gift-sets', productCount: PRODUCTS.filter((p) => p.category === 'gift-sets').length },
  ];

  return {
    categories: defaultCategories,
    fromFallback: true,
  };
}

export interface ValidateDiscountResponse {
  valid: boolean;
  discountAmount: number;
  code?: string;
  message: string;
}

/**
 * Validate a discount coupon against current order subtotal.
 */
export async function validateDiscount(
  code: string,
  subtotal: number
): Promise<ValidateDiscountResponse> {
  const url = `${API_BASE_URL}/api/discounts/validate`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ code, subtotal }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    console.warn('[API Client] Discount validation error:', error);
  }

  return {
    valid: false,
    discountAmount: 0,
    message: 'Unable to validate coupon at this time.',
  };
}

export interface PublicStockResponse {
  productId: string;
  inStock: boolean;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  label: string;
}

/**
 * Check stock status for a product.
 */
export async function checkProductStock(productId: string): Promise<PublicStockResponse | null> {
  const url = `${API_BASE_URL}/api/inventory/${encodeURIComponent(productId)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 15 },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn(`[API Client] Check stock error for ${productId}:`, error);
  }

  return null;
}