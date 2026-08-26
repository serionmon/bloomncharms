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

export interface CustomerProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderItem {
  id: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  customization?: Record<string, any>;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Record<string, any>;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  items: CustomerOrderItem[];
}

/**
 * Fetch authenticated customer profile.
 */
export async function fetchCustomerProfile(token: string): Promise<CustomerProfile | null> {
  const url = `${API_BASE_URL}/api/customers/me`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.profile || null;
    }
  } catch (error) {
    console.warn('[API Client] fetchCustomerProfile failed:', error);
  }

  return null;
}

/**
 * Update authenticated customer profile fields (firstName, lastName, phone).
 */
export async function updateCustomerProfile(
  token: string,
  data: { firstName?: string; lastName?: string; phone?: string | null }
): Promise<CustomerProfile | null> {
  const url = `${API_BASE_URL}/api/customers/me`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      return result.profile || null;
    }
  } catch (error) {
    console.warn('[API Client] updateCustomerProfile failed:', error);
  }

  return null;
}

/**
 * List saved addresses for the authenticated customer.
 */
export async function fetchCustomerAddresses(token: string): Promise<CustomerAddress[]> {
  const url = `${API_BASE_URL}/api/customers/me/addresses`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.addresses || [];
    }
  } catch (error) {
    console.warn('[API Client] fetchCustomerAddresses failed:', error);
  }

  return [];
}

/**
 * Create a new address for the authenticated customer.
 */
export async function createCustomerAddress(
  token: string,
  data: Omit<CustomerAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<CustomerAddress | null> {
  const url = `${API_BASE_URL}/api/customers/me/addresses`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      return result.address || null;
    }
  } catch (error) {
    console.warn('[API Client] createCustomerAddress failed:', error);
  }

  return null;
}

/**
 * Update an existing customer address.
 */
export async function updateCustomerAddress(
  token: string,
  addressId: string,
  data: Partial<Omit<CustomerAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<CustomerAddress | null> {
  const url = `${API_BASE_URL}/api/customers/me/addresses/${encodeURIComponent(addressId)}`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      return result.address || null;
    }
  } catch (error) {
    console.warn('[API Client] updateCustomerAddress failed:', error);
  }

  return null;
}

/**
 * Delete a customer address.
 */
export async function deleteCustomerAddress(token: string, addressId: string): Promise<boolean> {
  const url = `${API_BASE_URL}/api/customers/me/addresses/${encodeURIComponent(addressId)}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return res.ok;
  } catch (error) {
    console.warn('[API Client] deleteCustomerAddress failed:', error);
    return false;
  }
}

/**
 * Set an address as the default delivery address.
 */
export async function setDefaultCustomerAddress(
  token: string,
  addressId: string
): Promise<CustomerAddress | null> {
  const url = `${API_BASE_URL}/api/customers/me/addresses/${encodeURIComponent(addressId)}/default`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const result = await res.json();
      return result.address || null;
    }
  } catch (error) {
    console.warn('[API Client] setDefaultCustomerAddress failed:', error);
  }

  return null;
}

/**
 * List orders for the authenticated customer.
 */
export async function fetchCustomerOrders(token: string): Promise<CustomerOrder[]> {
  const url = `${API_BASE_URL}/api/customers/me/orders`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.orders || [];
    }
  } catch (error) {
    console.warn('[API Client] fetchCustomerOrders failed:', error);
  }

  return [];
}

export interface OrderPreviewPayload {
  items: Array<{
    productId: string;
    quantity: number;
    customization?: Record<string, any>;
  }>;
  couponCode?: string | null;
  paymentMethod: 'full_online' | 'hybrid' | 'cod' | 'unknown';
}

export interface OrderPreviewResult {
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    slug: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    customization?: Record<string, any>;
    image?: string;
  }>;
  itemCount: number;
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  paymentMethod: string;
  paymentMethodDiscount: number;
  totalDiscount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  payNowAmount: number;
  codAmount: number;
}

/**
 * Fetch authoritative order calculation and inventory availability from backend.
 */
export async function fetchOrderPreview(
  payload: OrderPreviewPayload,
  token?: string
): Promise<{ success: boolean; preview?: OrderPreviewResult; error?: string }> {
  const url = `${API_BASE_URL}/api/orders/preview`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.preview) {
      return { success: true, preview: data.preview };
    }
    return { success: false, error: data.message || 'Failed to calculate order preview.' };
  } catch (error: any) {
    console.warn('[API Client] fetchOrderPreview failed:', error);
    return { success: false, error: error.message || 'Network error occurred.' };
  }
}

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    quantity: number;
    customization?: Record<string, any>;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  couponCode?: string | null;
  paymentMethod: 'full_online' | 'hybrid' | 'cod' | 'unknown';
  notes?: string;
}

/**
 * Submit order to backend for creation, stock deduction, and discount recording.
 */
export async function createOrder(
  payload: CreateOrderPayload,
  token?: string
): Promise<{ success: boolean; order?: CustomerOrder; error?: string }> {
  const url = `${API_BASE_URL}/api/orders`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.order) {
      return { success: true, order: data.order };
    }
    return { success: false, error: data.message || 'Failed to create order.' };
  } catch (error: any) {
    console.warn('[API Client] createOrder failed:', error);
    return { success: false, error: error.message || 'Network error occurred.' };
  }
}

/**
 * Track order by public orderNumber.
 */
export async function trackOrder(orderNumber: string): Promise<any | null> {
  const url = `${API_BASE_URL}/api/orders/${encodeURIComponent(orderNumber.trim())}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return data.tracking || null;
    }
  } catch (error) {
    console.warn('[API Client] trackOrder failed:', error);
  }

  return null;
}