import { getAdminSupabaseClient, getAnonSupabaseClient } from '../common/supabase.js';
import { config } from '../common/config.js';
import {
  type CreateDiscountInput,
  type UpdateDiscountInput,
} from './validation.js';

export interface AdminDiscountDTO {
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
  updatedAt: string;
}

export interface DiscountValidationResult {
  valid: boolean;
  discountAmount: number;
  code?: string;
  message: string;
}

export class DiscountService {
  /**
   * Lists all discounts with usage counts.
   * Admin-only operation.
   */
  public static async listDiscounts(): Promise<AdminDiscountDTO[]> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (!hasSupabase) {
      return [];
    }

    const client = config.SUPABASE_SERVICE_ROLE_KEY
      ? getAdminSupabaseClient()
      : getAnonSupabaseClient();

    const { data: discounts, error } = await client
      .from('discounts')
      .select(`
        id,
        code,
        name,
        description,
        discount_type,
        value,
        minimum_order_amount,
        maximum_discount_amount,
        usage_limit,
        per_customer_limit,
        starts_at,
        expires_at,
        is_active,
        created_at,
        updated_at,
        discount_usage (count)
      `)
      .order('created_at', { ascending: false });

    if (error || !discounts) {
      throw new Error(`Failed to list discounts: ${error?.message || 'Database error'}`);
    }

    return (discounts as any[]).map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description || undefined,
      discountType: d.discount_type,
      value: Number(d.value),
      minimumOrderAmount: d.minimum_order_amount !== null ? Number(d.minimum_order_amount) : undefined,
      maximumDiscountAmount: d.maximum_discount_amount !== null ? Number(d.maximum_discount_amount) : undefined,
      usageLimit: d.usage_limit || undefined,
      perCustomerLimit: d.per_customer_limit || undefined,
      startsAt: d.starts_at,
      expiresAt: d.expires_at || undefined,
      isActive: d.is_active,
      timesUsed: d.discount_usage?.[0]?.count ?? 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Retrieves a single discount by ID.
   */
  public static async getDiscountById(id: string): Promise<AdminDiscountDTO | null> {
    const client = getAdminSupabaseClient();

    const { data: d, error } = await client
      .from('discounts')
      .select(`
        id,
        code,
        name,
        description,
        discount_type,
        value,
        minimum_order_amount,
        maximum_discount_amount,
        usage_limit,
        per_customer_limit,
        starts_at,
        expires_at,
        is_active,
        created_at,
        updated_at,
        discount_usage (count)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !d) {
      return null;
    }

    const item = d as any;
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description || undefined,
      discountType: item.discount_type,
      value: Number(item.value),
      minimumOrderAmount: item.minimum_order_amount !== null ? Number(item.minimum_order_amount) : undefined,
      maximumDiscountAmount: item.maximum_discount_amount !== null ? Number(item.maximum_discount_amount) : undefined,
      usageLimit: item.usage_limit || undefined,
      perCustomerLimit: item.per_customer_limit || undefined,
      startsAt: item.starts_at,
      expiresAt: item.expires_at || undefined,
      isActive: item.is_active,
      timesUsed: item.discount_usage?.[0]?.count ?? 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  /**
   * Creates a new discount campaign.
   */
  public static async createDiscount(input: CreateDiscountInput): Promise<AdminDiscountDTO> {
    const client = getAdminSupabaseClient();
    const normalizedCode = input.code.trim().toUpperCase();

    // Check code uniqueness
    const { data: existing } = await client
      .from('discounts')
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (existing) {
      const error: any = new Error(`Discount coupon with code '${normalizedCode}' already exists.`);
      error.statusCode = 409;
      throw error;
    }

    const { data: created, error } = await client
      .from('discounts')
      .insert({
        code: normalizedCode,
        name: input.name,
        description: input.description || null,
        discount_type: input.discountType,
        value: input.value,
        minimum_order_amount: input.minimumOrderAmount ?? null,
        maximum_discount_amount: input.maximumDiscountAmount ?? null,
        usage_limit: input.usageLimit ?? null,
        per_customer_limit: input.perCustomerLimit ?? null,
        starts_at: input.startsAt || new Date().toISOString(),
        expires_at: input.expiresAt ?? null,
        is_active: input.isActive ?? true,
      })
      .select('id')
      .single();

    if (error || !created) {
      throw new Error(`Failed to create discount: ${error?.message}`);
    }

    const fullRecord = await this.getDiscountById(created.id);
    if (!fullRecord) {
      throw new Error('Discount created but failed to retrieve record.');
    }

    return fullRecord;
  }

  /**
   * Updates an existing discount.
   */
  public static async updateDiscount(id: string, input: UpdateDiscountInput): Promise<AdminDiscountDTO> {
    const client = getAdminSupabaseClient();

    // Verify existence
    const { data: current, error: findError } = await client
      .from('discounts')
      .select('id, code')
      .eq('id', id)
      .maybeSingle();

    if (findError || !current) {
      const error: any = new Error(`Discount with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    const updatePayload: Record<string, unknown> = {};

    if (input.code !== undefined) {
      const normalizedCode = input.code.trim().toUpperCase();
      if (normalizedCode !== current.code) {
        const { data: duplicate } = await client
          .from('discounts')
          .select('id')
          .eq('code', normalizedCode)
          .neq('id', id)
          .maybeSingle();

        if (duplicate) {
          const error: any = new Error(`Discount coupon with code '${normalizedCode}' already exists.`);
          error.statusCode = 409;
          throw error;
        }
      }
      updatePayload.code = normalizedCode;
    }

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.discountType !== undefined) updatePayload.discount_type = input.discountType;
    if (input.value !== undefined) updatePayload.value = input.value;
    if (input.minimumOrderAmount !== undefined) updatePayload.minimum_order_amount = input.minimumOrderAmount;
    if (input.maximumDiscountAmount !== undefined) updatePayload.maximum_discount_amount = input.maximumDiscountAmount;
    if (input.usageLimit !== undefined) updatePayload.usage_limit = input.usageLimit;
    if (input.perCustomerLimit !== undefined) updatePayload.per_customer_limit = input.perCustomerLimit;
    if (input.startsAt !== undefined) updatePayload.starts_at = input.startsAt;
    if (input.expiresAt !== undefined) updatePayload.expires_at = input.expiresAt;
    if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await client
        .from('discounts')
        .update(updatePayload as any)
        .eq('id', id);

      if (updateError) {
        throw new Error(`Failed to update discount: ${updateError.message}`);
      }
    }

    const updated = await this.getDiscountById(id);
    if (!updated) {
      throw new Error('Discount updated but failed to retrieve record.');
    }

    return updated;
  }

  /**
   * Deactivates a discount (soft-delete).
   */
  public static async deactivateDiscount(id: string): Promise<AdminDiscountDTO> {
    return await this.updateDiscount(id, { isActive: false });
  }

  /**
   * Authoritative server-side discount validation.
   */
  public static async validateDiscountCode(
    code: string,
    subtotal: number,
    userId?: string
  ): Promise<DiscountValidationResult> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (!hasSupabase) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Discount validation service currently unavailable.',
      };
    }

    const normalizedCode = code.trim().toUpperCase();
    const client = getAdminSupabaseClient();
    const now = new Date().toISOString();

    const { data: discount, error } = await client
      .from('discounts')
      .select(`
        id,
        code,
        discount_type,
        value,
        minimum_order_amount,
        maximum_discount_amount,
        usage_limit,
        per_customer_limit,
        is_active,
        starts_at,
        expires_at
      `)
      .eq('code', normalizedCode)
      .maybeSingle();

    if (error || !discount) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Invalid discount code.',
      };
    }

    // Check active status
    if (!discount.is_active) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'This discount code is currently inactive.',
      };
    }

    // Check start date
    if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'This discount code is not yet active.',
      };
    }

    // Check expiration date
    if (discount.expires_at && new Date(discount.expires_at) <= new Date()) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'This discount code has expired.',
      };
    }

    // Check minimum order amount
    if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order subtotal of ₹${discount.minimum_order_amount} required to apply this coupon.`,
      };
    }

    // Check global usage limit
    if (discount.usage_limit) {
      const { count } = await client
        .from('discount_usage')
        .select('*', { count: 'exact', head: true })
        .eq('discount_id', discount.id);

      if ((count ?? 0) >= discount.usage_limit) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'This discount code has reached its maximum usage limit.',
        };
      }
    }

    // Check per-customer usage limit
    if (discount.per_customer_limit && userId) {
      const { count: userCount } = await client
        .from('discount_usage')
        .select('*', { count: 'exact', head: true })
        .eq('discount_id', discount.id)
        .eq('user_id', userId);

      if ((userCount ?? 0) >= discount.per_customer_limit) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'You have already used this coupon the maximum allowed times.',
        };
      }
    }

    // Calculate discount amount authoritative server-side
    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = Math.round(((subtotal * Number(discount.value)) / 100) * 100) / 100;
      if (
        discount.maximum_discount_amount &&
        discountAmount > Number(discount.maximum_discount_amount)
      ) {
        discountAmount = Number(discount.maximum_discount_amount);
      }
    } else if (discount.discount_type === 'fixed_amount') {
      discountAmount = Math.min(Number(discount.value), subtotal);
    }

    return {
      valid: true,
      discountAmount,
      code: normalizedCode,
      message: 'Discount coupon applied successfully.',
    };
  }
}
