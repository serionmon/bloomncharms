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

function parseResponseError(status: number, data: any, defaultMsg: string): string {
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource or product was not found.';
  if (status >= 500) return 'Checkout service is temporarily unavailable. Please try again.';
  if (data && typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }
  return defaultMsg;
}

function parseNetworkError(error: any): string {
  console.warn('[API Client Network Exception]:', error);
  return 'Unable to reach the checkout service. Please check your connection or try again.';
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

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && data.preview) {
      return { success: true, preview: data.preview };
    }
    return {
      success: false,
      error: parseResponseError(res.status, data, 'Failed to calculate order preview.'),
    };
  } catch (error: any) {
    return { success: false, error: parseNetworkError(error) };
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

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && data.order) {
      return { success: true, order: data.order };
    }
    return {
      success: false,
      error: parseResponseError(res.status, data, 'Failed to create order.'),
    };
  } catch (error: any) {
    return { success: false, error: parseNetworkError(error) };
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

export interface RazorpayOrderInfo {
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
  localOrderNumber: string;
  payableAmountInr: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

/**
 * Initiates Razorpay payment order on the backend.
 */
export async function createRazorpayOrder(
  orderNumber: string,
  token?: string
): Promise<{ success: boolean; razorpayOrder?: RazorpayOrderInfo; error?: string }> {
  const url = `${API_BASE_URL}/api/payments/razorpay/order`;

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
      body: JSON.stringify({ orderNumber }),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && data.razorpayOrder) {
      return { success: true, razorpayOrder: data.razorpayOrder };
    }
    return {
      success: false,
      error: parseResponseError(res.status, data, 'Failed to initiate secure payment.'),
    };
  } catch (error: any) {
    return { success: false, error: parseNetworkError(error) };
  }
}

/**
 * Verifies Razorpay payment signature with backend.
 */
export async function verifyRazorpayPayment(
  payload: {
    orderNumber: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
  token?: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  const url = `${API_BASE_URL}/api/payments/razorpay/verify`;

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

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && data.result) {
      return { success: true, result: data.result };
    }
    return {
      success: false,
      error: parseResponseError(res.status, data, 'Payment signature verification failed.'),
    };
  } catch (error: any) {
    return { success: false, error: parseNetworkError(error) };
  }
}

// =========================================================================
// Category & Admin Product Management API Helpers
// =========================================================================

export interface AdminProductImage {
  id: string;
  storagePath: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
}

export interface AdminProductItem {
  id: string;
  sku?: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  altText: string;
  badge?: string;
  tag?: string;
  isCustomizable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  processingDays?: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  inventory?: {
    stockQuantity: number;
    lowStockThreshold: number;
  };
  images?: AdminProductImage[];
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  sku?: string;
  categoryId?: string | null;
  subtitle?: string;
  description?: string;
  price: number;
  currency?: string;
  imageUrl?: string | null;
  altText?: string;
  badge?: string | null;
  tag?: string | null;
  isCustomizable?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  processingDays?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  sku?: string | null;
  categoryId?: string | null;
  subtitle?: string | null;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string | null;
  altText?: string;
  badge?: string | null;
  tag?: string | null;
  isCustomizable?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  processingDays?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

/**
 * Fetch list of all products for admin console.
 */
export async function fetchAdminProducts(
  token?: string
): Promise<{ success: boolean; products: AdminProductItem[]; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products`;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
    const data = await res.json();
    if (res.ok && Array.isArray(data.products)) {
      return { success: true, products: data.products };
    }
    return { success: false, products: [], error: data.message || 'Failed to list admin products.' };
  } catch (error: any) {
    console.warn('[API Client] fetchAdminProducts failed:', error);
    return { success: false, products: [], error: error.message || 'Network error.' };
  }
}

/**
 * Fetch single product details by ID for admin console.
 */
export async function fetchAdminProductById(
  id: string,
  token?: string
): Promise<{ success: boolean; product?: AdminProductItem; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}`;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
    const data = await res.json();
    if (res.ok && data.product) {
      return { success: true, product: data.product };
    }
    return { success: false, error: data.message || 'Product not found.' };
  } catch (error: any) {
    console.warn('[API Client] fetchAdminProductById failed:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

/**
 * Create a new product.
 */
export async function createAdminProduct(
  payload: CreateProductPayload,
  token?: string
): Promise<{ success: boolean; product?: AdminProductItem; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.product) {
      return { success: true, product: data.product };
    }
    return { success: false, error: data.message || 'Failed to create product.' };
  } catch (error: any) {
    console.warn('[API Client] createAdminProduct failed:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

/**
 * Update an existing product.
 */
export async function updateAdminProduct(
  id: string,
  payload: UpdateProductPayload,
  token?: string
): Promise<{ success: boolean; product?: AdminProductItem; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.product) {
      return { success: true, product: data.product };
    }
    return { success: false, error: data.message || 'Failed to update product.' };
  } catch (error: any) {
    console.warn('[API Client] updateAdminProduct failed:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

/**
 * Deactivate a product (soft delete).
 */
export async function deactivateAdminProduct(
  id: string,
  token?: string
): Promise<{ success: boolean; product?: AdminProductItem; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}/deactivate`;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers,
    });
    const data = await res.json();
    if (res.ok && data.product) {
      return { success: true, product: data.product };
    }
    return { success: false, error: data.message || 'Failed to deactivate product.' };
  } catch (error: any) {
    console.warn('[API Client] deactivateAdminProduct failed:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

/**
 * Upload an image for a product.
 */
export async function uploadAdminProductImage(
  productId: string,
  file: File,
  metadata: { altText?: string; sortOrder?: number } = {},
  token?: string
): Promise<{ success: boolean; image?: AdminProductImage; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}/images`;
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.altText) formData.append('altText', metadata.altText);
    if (metadata.sortOrder !== undefined) formData.append('sortOrder', String(metadata.sortOrder));

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (res.ok && data.image) {
      return { success: true, image: data.image };
    }
    return { success: false, error: data.message || 'Failed to upload image.' };
  } catch (error: any) {
    console.warn('[API Client] uploadAdminProductImage failed:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

/**
 * Update metadata (altText, sortOrder) of an existing product image.
 */
export async function updateAdminProductImage(
  productId: string,
  imageId: string,
  metadata: { altText?: string; sortOrder?: number },
  token?: string
): Promise<{ success: boolean; image?: AdminProductImage; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(metadata),
    });
    const data = await res.json();
    if (res.ok && data.image) {
      return { success: true, image: data.image };
    }
    return { success: false, error: data.message || 'Failed to update image metadata.' };
  } catch (error: any) {
    console.warn('[API Client] updateAdminProductImage failed:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

/**
 * Delete a product image.
 */
export async function deleteAdminProductImage(
  productId: string,
  imageId: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  const url = `${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.message || 'Failed to delete image.' };
  } catch (error: any) {
    console.warn('[API Client] deleteAdminProductImage failed:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

/**
 * Fetch shipment tracking details for an order.
 */
export async function fetchShipmentTracking(
  orderIdentifier: string,
  token?: string
): Promise<{
  orderNumber: string;
  shippingStatus: string;
  courierName?: string;
  awbCode?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  destinationCity?: string;
  destinationState?: string;
  checkpoints: Array<{
    timestamp: string;
    location: string;
    status: string;
    activity: string;
  }>;
} | null> {
  const url = `${API_BASE_URL}/api/shipping/track/${encodeURIComponent(orderIdentifier)}`;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { method: 'GET', headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn('[API Client] fetchShipmentTracking failed:', error);
  }
  return null;
}