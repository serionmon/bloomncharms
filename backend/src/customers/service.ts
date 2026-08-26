import { getAdminSupabaseClient, getAnonSupabaseClient } from '../common/supabase.js';
import { config } from '../common/config.js';
import {
  type UpdateProfileInput,
  type CreateAddressInput,
  type UpdateAddressInput,
} from './validation.js';

export interface CustomerProfileDTO {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AddressDTO {
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

export interface CustomerOrderDTO {
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
  items: Array<{
    id: string;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    customization?: Record<string, any>;
  }>;
}

export class CustomerService {
  /**
   * Retrieves the profile for the authenticated user.
   */
  public static async getProfile(userId: string): Promise<CustomerProfileDTO> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (!hasSupabase) {
      return {
        id: userId,
        firstName: 'Customer',
        lastName: 'Demo',
        email: 'customer@bloomncharms.com',
        phone: '9876543210',
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const client = getAdminSupabaseClient();
    const { data: profile, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, email, phone, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) {
      const err: any = new Error(`Profile for user '${userId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role as 'customer' | 'admin',
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  /**
   * Updates allowed profile fields (first_name, last_name, phone) for authenticated user.
   */
  public static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<CustomerProfileDTO> {
    const client = getAdminSupabaseClient();

    const updatePayload: Record<string, unknown> = {};
    if (input.firstName !== undefined) updatePayload.first_name = input.firstName;
    if (input.lastName !== undefined) updatePayload.last_name = input.lastName;
    if (input.phone !== undefined) updatePayload.phone = input.phone;

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await client
        .from('profiles')
        .update(updatePayload as any)
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }
    }

    return await this.getProfile(userId);
  }

  /**
   * Lists all saved addresses for the authenticated user.
   */
  public static async listAddresses(userId: string): Promise<AddressDTO[]> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (!hasSupabase) {
      return [];
    }

    const client = getAdminSupabaseClient();
    const { data: addresses, error } = await client
      .from('addresses')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        phone,
        email,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        is_default,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !addresses) {
      throw new Error(`Failed to list addresses: ${error?.message || 'Database error'}`);
    }

    return (addresses as any[]).map((a) => ({
      id: a.id,
      userId: a.user_id,
      firstName: a.first_name,
      lastName: a.last_name,
      phone: a.phone,
      email: a.email,
      addressLine1: a.address_line_1,
      addressLine2: a.address_line_2 || undefined,
      city: a.city,
      state: a.state,
      postalCode: a.postal_code,
      country: a.country,
      isDefault: a.is_default,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  }

  /**
   * Retrieves a single address scoped strictly to the authenticated user.
   */
  public static async getAddressById(userId: string, addressId: string): Promise<AddressDTO> {
    const client = getAdminSupabaseClient();
    const { data: a, error } = await client
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !a) {
      const err: any = new Error(`Address '${addressId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const item = a as any;
    return {
      id: item.id,
      userId: item.user_id,
      firstName: item.first_name,
      lastName: item.last_name,
      phone: item.phone,
      email: item.email,
      addressLine1: item.address_line_1,
      addressLine2: item.address_line_2 || undefined,
      city: item.city,
      state: item.state,
      postalCode: item.postal_code,
      country: item.country,
      isDefault: item.is_default,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  /**
   * Creates a new address for the authenticated user.
   */
  public static async createAddress(
    userId: string,
    input: CreateAddressInput
  ): Promise<AddressDTO> {
    const client = getAdminSupabaseClient();

    // Check existing address count for this user
    const { count } = await client
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const shouldBeDefault = input.isDefault || (count ?? 0) === 0;

    // If new address is default, unset all existing defaults for this user
    if (shouldBeDefault && (count ?? 0) > 0) {
      await client
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data: created, error } = await client
      .from('addresses')
      .insert({
        user_id: userId,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
        email: input.email,
        address_line_1: input.addressLine1,
        address_line_2: input.addressLine2 || null,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country || 'IN',
        is_default: shouldBeDefault,
      })
      .select('id')
      .single();

    if (error || !created) {
      throw new Error(`Failed to create address: ${error?.message}`);
    }

    return await this.getAddressById(userId, created.id);
  }

  /**
   * Updates an existing address scoped strictly to the authenticated user.
   */
  public static async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ): Promise<AddressDTO> {
    const client = getAdminSupabaseClient();

    // Verify existence & ownership
    await this.getAddressById(userId, addressId);

    if (input.isDefault === true) {
      await client
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const updatePayload: Record<string, unknown> = {};
    if (input.firstName !== undefined) updatePayload.first_name = input.firstName;
    if (input.lastName !== undefined) updatePayload.last_name = input.lastName;
    if (input.phone !== undefined) updatePayload.phone = input.phone;
    if (input.email !== undefined) updatePayload.email = input.email;
    if (input.addressLine1 !== undefined) updatePayload.address_line_1 = input.addressLine1;
    if (input.addressLine2 !== undefined) updatePayload.address_line_2 = input.addressLine2;
    if (input.city !== undefined) updatePayload.city = input.city;
    if (input.state !== undefined) updatePayload.state = input.state;
    if (input.postalCode !== undefined) updatePayload.postal_code = input.postalCode;
    if (input.country !== undefined) updatePayload.country = input.country;
    if (input.isDefault !== undefined) updatePayload.is_default = input.isDefault;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await client
        .from('addresses')
        .update(updatePayload as any)
        .eq('id', addressId)
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update address: ${updateError.message}`);
      }
    }

    return await this.getAddressById(userId, addressId);
  }

  /**
   * Deletes an address and promotes another address to default if needed.
   */
  public static async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    const client = getAdminSupabaseClient();

    // Verify existence & ownership
    const current = await this.getAddressById(userId, addressId);

    const { error } = await client
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }

    // If deleted address was default, promote another address if one exists
    if (current.isDefault) {
      const { data: remaining } = await client
        .from('addresses')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await client
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remaining[0].id)
          .eq('user_id', userId);
      }
    }

    return true;
  }

  /**
   * Sets an address as default for the authenticated user.
   */
  public static async setDefaultAddress(userId: string, addressId: string): Promise<AddressDTO> {
    return await this.updateAddress(userId, addressId, { isDefault: true });
  }

  /**
   * Lists orders belonging strictly to the authenticated user.
   */
  public static async listOrders(userId: string): Promise<CustomerOrderDTO[]> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (!hasSupabase) {
      return [];
    }

    const client = getAdminSupabaseClient();
    const { data: orders, error } = await client
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        order_status,
        payment_status,
        payment_method,
        subtotal,
        discount_amount,
        shipping_fee,
        tax_amount,
        total_amount,
        created_at,
        order_items (
          id,
          product_name_snapshot,
          product_sku_snapshot,
          unit_price,
          quantity,
          line_total,
          customization
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !orders) {
      throw new Error(`Failed to list customer orders: ${error?.message || 'Database error'}`);
    }

    return (orders as any[]).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone,
      shippingAddress: o.shipping_address,
      orderStatus: o.order_status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discount_amount),
      shippingFee: Number(o.shipping_fee),
      taxAmount: Number(o.tax_amount),
      totalAmount: Number(o.total_amount),
      createdAt: o.created_at,
      items: (o.order_items || []).map((item: any) => ({
        id: item.id,
        productName: item.product_name_snapshot,
        productSku: item.product_sku_snapshot,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        lineTotal: Number(item.line_total),
        customization: item.customization || undefined,
      })),
    }));
  }

  /**
   * Retrieves a single order scoped strictly to the authenticated user.
   */
  public static async getOrderById(userId: string, orderId: string): Promise<CustomerOrderDTO> {
    const client = getAdminSupabaseClient();
    const { data: o, error } = await client
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        order_status,
        payment_status,
        payment_method,
        subtotal,
        discount_amount,
        shipping_fee,
        tax_amount,
        total_amount,
        created_at,
        order_items (
          id,
          product_name_snapshot,
          product_sku_snapshot,
          unit_price,
          quantity,
          line_total,
          customization
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !o) {
      const err: any = new Error(`Order '${orderId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const order = o as any;
    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discount_amount),
      shippingFee: Number(order.shipping_fee),
      taxAmount: Number(order.tax_amount),
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        productName: item.product_name_snapshot,
        productSku: item.product_sku_snapshot,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        lineTotal: Number(item.line_total),
        customization: item.customization || undefined,
      })),
    };
  }
}
