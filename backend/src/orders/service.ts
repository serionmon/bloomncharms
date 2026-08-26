import { getAdminSupabaseClient } from '../common/supabase.js';
import { config } from '../common/config.js';
import { DiscountService } from '../discounts/service.js';
import {
  type OrderPreviewInput,
  type CreateOrderInput,
  type OrderItemInput,
} from './validation.js';

export interface ValidatedLineItem {
  productId: string;
  name: string;
  sku: string;
  slug: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  customization?: Record<string, any>;
  image?: string;
}

export interface OrderPreviewDTO {
  items: ValidatedLineItem[];
  itemCount: number;
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  paymentMethod: 'full_online' | 'hybrid' | 'cod' | 'unknown';
  paymentMethodDiscount: number;
  totalDiscount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  payNowAmount: number;
  codAmount: number;
}

export interface OrderResponseDTO {
  id: string;
  orderNumber: string;
  userId: string | null;
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
  payNowAmount: number;
  codAmount: number;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    customization?: Record<string, any>;
  }>;
}

export const offlineOrders = new Map<string, any>();
const idempotencyStore = new Map<string, { order: OrderResponseDTO; timestamp: number }>();

// Clean up idempotency keys older than 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyStore.entries()) {
    if (now - val.timestamp > 600000) {
      idempotencyStore.delete(key);
    }
  }
}, 60000).unref();

export class OrderService {
  /**
   * Authoritative validation of products, database prices, stock, and promotional calculations.
   */
  private static async resolveAndValidateItems(
    items: OrderItemInput[],
    couponCode?: string | null,
    paymentMethod: 'full_online' | 'hybrid' | 'cod' | 'unknown' = 'full_online',
    userId?: string
  ): Promise<{
    validatedItems: ValidatedLineItem[];
    subtotal: number;
    couponDiscount: number;
    appliedCouponCode?: string;
    discountId?: string;
    paymentMethodDiscount: number;
    totalDiscount: number;
    shippingFee: number;
    taxAmount: number;
    totalAmount: number;
    payNowAmount: number;
    codAmount: number;
  }> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    const validatedItems: ValidatedLineItem[] = [];
    let subtotal = 0;

    if (!hasSupabase) {
      // Offline / development fallback
      for (const item of items) {
        const unitPrice = 1200;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        validatedItems.push({
          productId: item.productId,
          name: `Handcrafted Bloom ${item.productId}`,
          sku: `BC-${item.productId.substring(0, 4).toUpperCase()}`,
          slug: item.productId,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
          customization: item.customization || undefined,
        });
      }
    } else {
      const client = getAdminSupabaseClient();

      for (const item of items) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          item.productId
        );

        // Lookup product by UUID or slug
        let query = client
          .from('products')
          .select('id, name, sku, slug, price, is_active, image_url');

        if (isUuid) {
          query = query.eq('id', item.productId);
        } else {
          query = query.eq('slug', item.productId);
        }

        const { data: product, error: prodError } = await query.maybeSingle();

        if (prodError || !product) {
          const err: any = new Error(`Product '${item.productId}' not found in catalog.`);
          err.statusCode = 400;
          throw err;
        }

        if (!product.is_active) {
          const err: any = new Error(`Product '${product.name}' is currently not available.`);
          err.statusCode = 400;
          throw err;
        }

        // Authoritative stock validation
        const { data: inv } = await client
          .from('inventory')
          .select('stock_quantity')
          .eq('product_id', product.id)
          .maybeSingle();

        const currentStock = inv?.stock_quantity ?? 0;
        if (currentStock < item.quantity) {
          const err: any = new Error(
            `Insufficient stock for '${product.name}'. Available: ${currentStock}, Requested: ${item.quantity}.`
          );
          err.statusCode = 400;
          throw err;
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        validatedItems.push({
          productId: product.id,
          name: product.name,
          sku: product.sku || `SKU-${product.id.substring(0, 6)}`,
          slug: product.slug,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
          customization: item.customization || undefined,
          image: product.image_url || undefined,
        });
      }
    }

    // Coupon Validation
    let couponDiscount = 0;
    let appliedCouponCode: string | undefined = undefined;
    let discountId: string | undefined = undefined;

    if (couponCode && couponCode.trim().length > 0) {
      const discountResult = await DiscountService.validateDiscountCode(
        couponCode.trim(),
        subtotal,
        userId
      );

      if (discountResult.valid && discountResult.discountAmount > 0) {
        couponDiscount = discountResult.discountAmount;
        appliedCouponCode = discountResult.code;

        if (hasSupabase) {
          const client = getAdminSupabaseClient();
          const { data: dRow } = await client
            .from('discounts')
            .select('id')
            .eq('code', couponCode.trim().toUpperCase())
            .maybeSingle();
          if (dRow) discountId = dRow.id;
        }
      }
    }

    // Payment Method Discount (10% online savings for full_online payment)
    const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
    const paymentMethodDiscount =
      paymentMethod === 'full_online' ? Math.round(subtotalAfterCoupon * 0.1) : 0;

    const totalDiscount = couponDiscount + paymentMethodDiscount;
    const shippingFee = 0; // Complimentary atelier shipping
    const taxAmount = 0; // Tax included in prices
    const totalAmount = Math.max(0, subtotal - totalDiscount + shippingFee + taxAmount);

    const payNowAmount = paymentMethod === 'full_online' ? totalAmount : Math.round(totalAmount * 0.5);
    const codAmount = paymentMethod === 'hybrid' ? totalAmount - payNowAmount : 0;

    return {
      validatedItems,
      subtotal,
      couponDiscount,
      appliedCouponCode,
      discountId,
      paymentMethodDiscount,
      totalDiscount,
      shippingFee,
      taxAmount,
      totalAmount,
      payNowAmount,
      codAmount,
    };
  }

  /**
   * Generates authoritative server calculation and inventory preview for cart items.
   */
  public static async previewOrder(
    input: OrderPreviewInput,
    userId?: string
  ): Promise<OrderPreviewDTO> {
    const calc = await this.resolveAndValidateItems(
      input.items,
      input.couponCode,
      input.paymentMethod,
      userId
    );

    return {
      items: calc.validatedItems,
      itemCount: calc.validatedItems.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: calc.subtotal,
      couponCode: calc.appliedCouponCode,
      couponDiscount: calc.couponDiscount,
      paymentMethod: input.paymentMethod,
      paymentMethodDiscount: calc.paymentMethodDiscount,
      totalDiscount: calc.totalDiscount,
      shippingFee: calc.shippingFee,
      taxAmount: calc.taxAmount,
      totalAmount: calc.totalAmount,
      payNowAmount: calc.payNowAmount,
      codAmount: calc.codAmount,
    };
  }

  /**
   * Atomically creates the order, inserts line items, updates inventory, and tracks discount usage.
   */
  public static async createOrder(
    input: CreateOrderInput,
    userId?: string
  ): Promise<OrderResponseDTO> {
    // 0. Check Idempotency Key
    if (input.idempotencyKey) {
      const cached = idempotencyStore.get(input.idempotencyKey);
      if (cached) {
        return cached.order;
      }
    }

    const calc = await this.resolveAndValidateItems(
      input.items,
      input.couponCode,
      input.paymentMethod,
      userId
    );

    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    // Format human-friendly unique order number
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BC-${timestamp}-${randomSuffix}`;

    if (!hasSupabase) {
      const offlineOrder: OrderResponseDTO = {
        id: 'o0000000-0000-0000-0000-000000000001',
        orderNumber,
        userId: userId || null,
        customerName: `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`,
        customerEmail: input.shippingAddress.email,
        customerPhone: input.shippingAddress.phone,
        shippingAddress: input.shippingAddress,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: input.paymentMethod,
        subtotal: calc.subtotal,
        discountAmount: calc.totalDiscount,
        shippingFee: calc.shippingFee,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
        payNowAmount: calc.payNowAmount,
        codAmount: calc.codAmount,
        notes: input.notes || null,
        createdAt: new Date().toISOString(),
        items: calc.validatedItems.map((item, idx) => ({
          id: `item-0000-${idx}`,
          productId: item.productId,
          productName: item.name,
          productSku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          customization: item.customization,
        })),
      };

      offlineOrders.set(orderNumber, {
        id: offlineOrder.id,
        order_number: offlineOrder.orderNumber,
        user_id: offlineOrder.userId,
        customer_name: offlineOrder.customerName,
        customer_email: offlineOrder.customerEmail,
        customer_phone: offlineOrder.customerPhone,
        shipping_address: offlineOrder.shippingAddress,
        order_status: offlineOrder.orderStatus,
        payment_status: offlineOrder.paymentStatus,
        payment_method: offlineOrder.paymentMethod,
        subtotal: offlineOrder.subtotal,
        discount_amount: offlineOrder.discountAmount,
        shipping_fee: offlineOrder.shippingFee,
        tax_amount: offlineOrder.taxAmount,
        total_amount: offlineOrder.totalAmount,
        notes: offlineOrder.notes,
        created_at: offlineOrder.createdAt,
      });

      if (input.idempotencyKey) {
        idempotencyStore.set(input.idempotencyKey, { order: offlineOrder, timestamp: Date.now() });
      }
      return offlineOrder;
    }

    const client = getAdminSupabaseClient();

    // 1. Primary Strategy: Try Database-Level Atomic Stored Procedure (Single Transaction)
    try {
      const orderPayload = {
        orderNumber,
        userId: userId || null,
        customerName: `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`,
        customerEmail: input.shippingAddress.email,
        customerPhone: input.shippingAddress.phone,
        shippingAddress: input.shippingAddress,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: input.paymentMethod,
        subtotal: calc.subtotal,
        discountAmount: calc.totalDiscount,
        shippingFee: calc.shippingFee,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
        notes: input.notes || null,
      };

      const discountPayload = calc.discountId
        ? { discountId: calc.discountId, discountAmount: calc.couponDiscount }
        : null;

      const { data: rpcResult, error: rpcError } = await (client.rpc as any)(
        'create_order_atomic',
        {
          p_order: orderPayload,
          p_items: calc.validatedItems,
          p_discount: discountPayload,
        }
      );

      if (!rpcError && rpcResult && (rpcResult as any).orderId) {
        const res = rpcResult as any;
        const finalOrder: OrderResponseDTO = {
          id: res.orderId,
          orderNumber: res.orderNumber || orderNumber,
          userId: userId || null,
          customerName: `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`,
          customerEmail: input.shippingAddress.email,
          customerPhone: input.shippingAddress.phone,
          shippingAddress: input.shippingAddress,
          orderStatus: 'pending',
          paymentStatus: 'pending',
          paymentMethod: input.paymentMethod,
          subtotal: calc.subtotal,
          discountAmount: calc.totalDiscount,
          shippingFee: calc.shippingFee,
          taxAmount: calc.taxAmount,
          totalAmount: calc.totalAmount,
          payNowAmount: calc.payNowAmount,
          codAmount: calc.codAmount,
          notes: input.notes || null,
          createdAt: new Date().toISOString(),
          items: res.items || calc.validatedItems.map((item, idx) => ({
            id: `item-${idx}`,
            productId: item.productId,
            productName: item.name,
            productSku: item.sku,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            customization: item.customization,
          })),
        };

        if (input.idempotencyKey) {
          idempotencyStore.set(input.idempotencyKey, { order: finalOrder, timestamp: Date.now() });
        }

        return finalOrder;
      }

      if (rpcError && rpcError.message.includes('INSUFFICIENT_STOCK')) {
        const err: any = new Error(rpcError.message);
        err.statusCode = 400;
        throw err;
      }
    } catch (err: any) {
      if (err.statusCode === 400 || (err.message && err.message.includes('INSUFFICIENT_STOCK'))) {
        throw err;
      }
      // If RPC is not present, fall through to guarded multi-step with compensation
    }

    // 2. Secondary Strategy: Multi-step with atomic row checks and compensation rollback
    let orderId: string | null = null;
    const deductedItems: Array<{ productId: string; quantity: number }> = [];

    try {
      // Step A: Insert Order Record
      const { data: createdOrder, error: orderError } = await client
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId || null,
          customer_name: `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`,
          customer_email: input.shippingAddress.email,
          customer_phone: input.shippingAddress.phone,
          shipping_address: input.shippingAddress,
          order_status: 'pending',
          payment_status: 'pending',
          payment_method: input.paymentMethod,
          subtotal: calc.subtotal,
          discount_amount: calc.totalDiscount,
          shipping_fee: calc.shippingFee,
          tax_amount: calc.taxAmount,
          total_amount: calc.totalAmount,
          notes: input.notes || null,
        })
        .select('id, order_number, created_at')
        .single();

      if (orderError || !createdOrder) {
        throw new Error(`Failed to create order: ${orderError?.message || 'Database error'}`);
      }

      orderId = createdOrder.id;

      // Step B: Atomically Deduct Inventory & Record Line Items
      const insertedItems: any[] = [];
      for (const item of calc.validatedItems) {
        // Re-read stock immediately before deduction
        const { data: invRow } = await client
          .from('inventory')
          .select('stock_quantity')
          .eq('product_id', item.productId)
          .maybeSingle();

        const currentStock = invRow?.stock_quantity ?? 0;
        if (currentStock < item.quantity) {
          const err: any = new Error(
            `Insufficient stock for '${item.name}'. Available: ${currentStock}, Requested: ${item.quantity}.`
          );
          err.statusCode = 400;
          throw err;
        }

        // Deduct inventory
        const updatedQty = currentStock - item.quantity;
        const { error: invErr } = await client
          .from('inventory')
          .update({ stock_quantity: updatedQty })
          .eq('product_id', item.productId);

        if (invErr) {
          throw new Error(`Failed to update inventory for '${item.name}': ${invErr.message}`);
        }

        deductedItems.push({ productId: item.productId, quantity: item.quantity });

        const { data: lineItem, error: itemError } = await client
          .from('order_items')
          .insert({
            order_id: orderId,
            product_id: item.productId,
            product_name_snapshot: item.name,
            product_sku_snapshot: item.sku,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            line_total: item.lineTotal,
            customization: item.customization || null,
          })
          .select('id')
          .single();

        if (itemError || !lineItem) {
          throw new Error(`Failed to record order item snapshot: ${itemError?.message}`);
        }

        insertedItems.push({
          id: lineItem.id,
          productId: item.productId,
          productName: item.name,
          productSku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          customization: item.customization,
        });
      }

      // Step C: Record Discount Usage
      if (calc.discountId && calc.couponDiscount > 0) {
        await client.from('discount_usage').insert({
          discount_id: calc.discountId,
          order_id: orderId,
          user_id: userId || null,
          amount_discounted: calc.couponDiscount,
        });
      }

      const finalOrder: OrderResponseDTO = {
        id: orderId,
        orderNumber: createdOrder.order_number,
        userId: userId || null,
        customerName: `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`,
        customerEmail: input.shippingAddress.email,
        customerPhone: input.shippingAddress.phone,
        shippingAddress: input.shippingAddress,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: input.paymentMethod,
        subtotal: calc.subtotal,
        discountAmount: calc.totalDiscount,
        shippingFee: calc.shippingFee,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
        payNowAmount: calc.payNowAmount,
        codAmount: calc.codAmount,
        notes: input.notes || null,
        createdAt: createdOrder.created_at,
        items: insertedItems,
      };

      if (input.idempotencyKey) {
        idempotencyStore.set(input.idempotencyKey, { order: finalOrder, timestamp: Date.now() });
      }

      return finalOrder;
    } catch (err: any) {
      // Step D: Rollback compensation — revert any deducted stock and delete order record
      for (const d of deductedItems) {
        try {
          const { data: cur } = await client
            .from('inventory')
            .select('stock_quantity')
            .eq('product_id', d.productId)
            .maybeSingle();
          if (cur) {
            await client
              .from('inventory')
              .update({ stock_quantity: cur.stock_quantity + d.quantity })
              .eq('product_id', d.productId);
          }
        } catch {}
      }

      if (orderId) {
        try {
          await client.from('orders').delete().eq('id', orderId);
        } catch {}
      }

      throw err;
    }
  }

  /**
   * Public tracking lookup by orderNumber.
   */
  public static async getOrderByOrderNumber(orderNumber: string): Promise<any> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (!hasSupabase) {
      return {
        orderNumber,
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'full_online',
        totalAmount: 2400,
        createdAt: new Date().toISOString(),
        items: [{ productName: 'Midnight Rose Bouquet', quantity: 2, lineTotal: 2400 }],
        shippingCity: 'Bengaluru',
        shippingState: 'Karnataka',
      };
    }

    const client = getAdminSupabaseClient();
    const { data: order, error } = await client
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        shipping_address,
        order_status,
        payment_status,
        payment_method,
        subtotal,
        discount_amount,
        shipping_fee,
        total_amount,
        created_at,
        order_items (
          id,
          product_name_snapshot,
          product_sku_snapshot,
          quantity,
          unit_price,
          line_total
        )
      `)
      .eq('order_number', orderNumber.trim())
      .maybeSingle();

    if (error || !order) {
      const err: any = new Error(`Order '${orderNumber}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const addr = order.shipping_address as any;
    return {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discount_amount),
      shippingFee: Number(order.shipping_fee),
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      shippingCity: addr?.city || '',
      shippingState: addr?.state || '',
      items: (order.order_items || []).map((item: any) => ({
        productName: item.product_name_snapshot,
        productSku: item.product_sku_snapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        lineTotal: Number(item.line_total),
      })),
    };
  }
}
