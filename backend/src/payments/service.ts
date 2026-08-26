import crypto from 'crypto';
import Razorpay from 'razorpay';
import { config } from '../common/config.js';
import { getAdminSupabaseClient } from '../common/supabase.js';
import { offlineOrders } from '../orders/service.js';
import { CreateRazorpayOrderInput, VerifyPaymentInput } from './validation.js';

export interface RazorpayOrderResponseDTO {
  razorpayOrderId: string;
  keyId: string;
  amount: number; // in paise
  currency: string;
  localOrderNumber: string;
  payableAmountInr: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentVerificationResultDTO {
  verified: boolean;
  orderNumber: string;
  paymentStatus: 'paid' | 'partially_paid' | 'failed' | 'pending';
  amountPaid: number;
  razorpayPaymentId: string;
}

// In-memory idempotency cache for webhooks
const webhookEventsCache = new Set<string>();

export class RazorpayService {
  private static getRazorpayClient(): Razorpay | null {
    if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
      return new Razorpay({
        key_id: config.RAZORPAY_KEY_ID,
        key_secret: config.RAZORPAY_KEY_SECRET,
      });
    }
    return null;
  }

  /**
   * Authoritatively creates a Razorpay payment order for a Bloomncharms order.
   */
  public static async createPaymentOrder(
    input: CreateRazorpayOrderInput,
    userId?: string
  ): Promise<RazorpayOrderResponseDTO> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    let localOrder: any = null;

    if (hasSupabase) {
      const client = getAdminSupabaseClient();
      const { data: order, error } = await client
        .from('orders')
        .select('*')
        .eq('order_number', input.orderNumber)
        .maybeSingle();

      if (error || !order) {
        const err: any = new Error(`Order '${input.orderNumber}' not found.`);
        err.statusCode = 404;
        throw err;
      }
      localOrder = order;
    } else {
      localOrder = offlineOrders.get(input.orderNumber);
      if (!localOrder) {
        const err: any = new Error(`Order '${input.orderNumber}' not found.`);
        err.statusCode = 404;
        throw err;
      }
    }

    // 1. Authorization: If order is associated with a registered user, caller must match
    if (localOrder.user_id && (!userId || localOrder.user_id !== userId)) {
      const err: any = new Error('You do not have permission to access or pay for this order.');
      err.statusCode = 403;
      throw err;
    }

    // 2. State validation: Check if already paid
    if (localOrder.payment_status === 'paid') {
      const err: any = new Error('This order has already been fully paid.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Payment method validation
    if (localOrder.payment_method === 'cod') {
      const err: any = new Error('Cash on delivery orders do not require online payment.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Derive Authoritative Payable Amount
    const totalAmount = Number(localOrder.total_amount);
    let payableAmountInr = totalAmount;

    if (localOrder.payment_method === 'hybrid') {
      // 50% pay now online, remaining 50% on delivery
      payableAmountInr = Math.round(totalAmount / 2);
    } else {
      // full_online: 100% of discounted order total
      payableAmountInr = totalAmount;
    }

    if (payableAmountInr <= 0) {
      const err: any = new Error('Invalid payable amount for this order.');
      err.statusCode = 400;
      throw err;
    }

    const amountInPaise = Math.round(payableAmountInr * 100);
    const rzp = this.getRazorpayClient();
    let rzpOrderId = '';

    if (rzp) {
      try {
        const orderResponse = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: localOrder.order_number,
          notes: {
            orderNumber: localOrder.order_number,
            paymentMethod: localOrder.payment_method,
          },
        });
        rzpOrderId = orderResponse.id;
      } catch (rzpErr: any) {
        console.error('[Razorpay] Order creation failed:', rzpErr?.message || rzpErr);
        const err: any = new Error(`Razorpay order creation failed: ${rzpErr?.message || 'Gateway error'}`);
        err.statusCode = 502;
        throw err;
      }
    } else {
      // Fallback deterministic order ID for test environments
      rzpOrderId = `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 5. Persist Razorpay Order ID in database
    if (hasSupabase) {
      const client = getAdminSupabaseClient();
      await client
        .from('orders')
        .update({ razorpay_order_id: rzpOrderId })
        .eq('id', localOrder.id);

      // Record transaction attempt audit row
      await client.from('payment_transactions').insert({
        order_id: localOrder.id,
        razorpay_order_id: rzpOrderId,
        amount: payableAmountInr,
        currency: 'INR',
        status: 'pending',
      });
    } else {
      localOrder.razorpay_order_id = rzpOrderId;
      offlineOrders.set(localOrder.order_number, localOrder);
    }

    return {
      razorpayOrderId: rzpOrderId,
      keyId: config.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: amountInPaise,
      currency: 'INR',
      localOrderNumber: localOrder.order_number,
      payableAmountInr,
      customerName: localOrder.customer_name,
      customerEmail: localOrder.customer_email,
      customerPhone: localOrder.customer_phone,
    };
  }

  /**
   * Verifies Razorpay payment signature and transitions order payment status.
   */
  public static async verifyPaymentSignature(
    input: VerifyPaymentInput,
    userId?: string
  ): Promise<PaymentVerificationResultDTO> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    let localOrder: any = null;

    if (hasSupabase) {
      const client = getAdminSupabaseClient();
      const { data: order, error } = await client
        .from('orders')
        .select('*')
        .eq('order_number', input.orderNumber)
        .maybeSingle();

      if (error || !order) {
        const err: any = new Error(`Order '${input.orderNumber}' not found.`);
        err.statusCode = 404;
        throw err;
      }
      localOrder = order;
    } else {
      localOrder = offlineOrders.get(input.orderNumber);
      if (!localOrder) {
        const err: any = new Error(`Order '${input.orderNumber}' not found.`);
        err.statusCode = 404;
        throw err;
      }
    }

    // 1. Authorization: If order belongs to a registered customer, caller must match
    if (localOrder.user_id && (!userId || localOrder.user_id !== userId)) {
      const err: any = new Error('You do not have permission to verify payment for this order.');
      err.statusCode = 403;
      throw err;
    }

    // 2. Retrieve authoritative server-stored Razorpay Order ID (NEVER trust client order ID)
    const serverRzpOrderId = localOrder.razorpay_order_id;
    if (!serverRzpOrderId) {
      const err: any = new Error('No Razorpay payment was initiated for this order.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Compute and Verify HMAC-SHA256 Signature with timing-safe comparison
    const keySecret =
      config.RAZORPAY_KEY_SECRET || (config.NODE_ENV !== 'production' ? 'test_key_secret' : '');
    if (!keySecret) {
      const err: any = new Error('Razorpay key secret is not configured.');
      err.statusCode = 500;
      throw err;
    }

    const payload = `${serverRzpOrderId}|${input.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(input.razorpay_signature, 'utf-8');

    const isMatch =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (!isMatch) {
      // Record failure audit
      if (hasSupabase) {
        const client = getAdminSupabaseClient();
        await client
          .from('payment_transactions')
          .update({
            status: 'failed',
            error_code: 'SIGNATURE_MISMATCH',
            error_description: 'Browser signature did not match server-calculated HMAC-SHA256.',
          })
          .eq('razorpay_order_id', serverRzpOrderId);
      }
      const err: any = new Error('Invalid payment signature verification failed.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Calculate authoritative paid amount and next payment status
    const totalAmount = Number(localOrder.total_amount);
    let payableAmountInr = totalAmount;
    let nextPaymentStatus: 'paid' | 'partially_paid' = 'paid';

    if (localOrder.payment_method === 'hybrid') {
      payableAmountInr = Math.round(totalAmount / 2);
      nextPaymentStatus = 'partially_paid'; // 50% online paid, 50% due on delivery
    } else {
      payableAmountInr = totalAmount;
      nextPaymentStatus = 'paid';
    }

    // 5. Update local database order status & audit transaction
    if (hasSupabase) {
      const client = getAdminSupabaseClient();
      await client
        .from('orders')
        .update({
          payment_status: nextPaymentStatus,
          razorpay_payment_id: input.razorpay_payment_id,
          razorpay_signature: input.razorpay_signature,
          amount_paid: payableAmountInr,
          order_status: 'confirmed',
        })
        .eq('id', localOrder.id);

      await client
        .from('payment_transactions')
        .update({
          status: nextPaymentStatus,
          razorpay_payment_id: input.razorpay_payment_id,
        })
        .eq('razorpay_order_id', serverRzpOrderId);
    } else {
      localOrder.payment_status = nextPaymentStatus;
      localOrder.razorpay_payment_id = input.razorpay_payment_id;
      localOrder.razorpay_signature = input.razorpay_signature;
      localOrder.amount_paid = payableAmountInr;
      offlineOrders.set(localOrder.order_number, localOrder);
    }

    return {
      verified: true,
      orderNumber: localOrder.order_number,
      paymentStatus: nextPaymentStatus,
      amountPaid: payableAmountInr,
      razorpayPaymentId: input.razorpay_payment_id,
    };
  }

  /**
   * Handles official Razorpay Webhook with raw body signature verification and event idempotency.
   */
  public static async handleWebhook(
    rawBody: Buffer,
    signatureHeader: string
  ): Promise<{ received: boolean; duplicate?: boolean; event?: string }> {
    const webhookSecret =
      config.RAZORPAY_WEBHOOK_SECRET || (config.NODE_ENV !== 'production' ? 'test_webhook_secret' : '');
    if (!webhookSecret) {
      const err: any = new Error('Razorpay webhook secret is not configured.');
      err.statusCode = 500;
      throw err;
    }

    // 1. Raw Body Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signatureHeader || '', 'utf-8');

    const isMatch =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (!isMatch) {
      const err: any = new Error('Invalid webhook signature.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Parse Event Payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      const err: any = new Error('Invalid JSON payload in webhook.');
      err.statusCode = 400;
      throw err;
    }

    const eventId = payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    // 3. Webhook Idempotency Check
    if (webhookEventsCache.has(eventId)) {
      return { received: true, duplicate: true, event: eventType };
    }
    webhookEventsCache.add(eventId);

    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    if (hasSupabase) {
      const client = getAdminSupabaseClient();

      const { data: existingEvent } = await client
        .from('payment_events')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingEvent) {
        return { received: true, duplicate: true, event: eventType };
      }
    }

    // 4. Process Event Types
    const paymentEntity = payload.payload?.payment?.entity;
    const rzpOrderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
    const rzpPaymentId = paymentEntity?.id;

    if (hasSupabase && rzpOrderId) {
      const client = getAdminSupabaseClient();
      const { data: order } = await client
        .from('orders')
        .select('id, payment_method, total_amount, payment_status')
        .eq('razorpay_order_id', rzpOrderId)
        .maybeSingle();

      if (order) {
        if (eventType === 'payment.captured' || eventType === 'order.paid') {
          const totalAmount = Number(order.total_amount);
          const payableAmountInr =
            order.payment_method === 'hybrid' ? Math.round(totalAmount / 2) : totalAmount;
          const newStatus = order.payment_method === 'hybrid' ? 'partially_paid' : 'paid';

          await client
            .from('orders')
            .update({
              payment_status: newStatus,
              razorpay_payment_id: rzpPaymentId || null,
              amount_paid: payableAmountInr,
              order_status: 'confirmed',
            })
            .eq('id', order.id);

          await client
            .from('payment_transactions')
            .update({
              status: newStatus,
              razorpay_payment_id: rzpPaymentId || null,
            })
            .eq('razorpay_order_id', rzpOrderId);
        } else if (eventType === 'payment.failed') {
          await client
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', order.id);

          await client
            .from('payment_transactions')
            .update({
              status: 'failed',
              error_code: paymentEntity?.error_code || 'PAYMENT_FAILED',
              error_description: paymentEntity?.error_description || 'Payment failed on gateway.',
            })
            .eq('razorpay_order_id', rzpOrderId);
        }

        // Record in payment_events
        await client.from('payment_events').insert({
          event_id: eventId,
          event_type: eventType,
          order_id: order.id,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId || null,
          payload,
        });
      }
    }

    return { received: true, event: eventType };
  }
}
